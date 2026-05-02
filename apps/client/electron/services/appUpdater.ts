import { app, shell } from "electron";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import {
  NsisUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo,
} from "electron-updater";

export type DesktopUpdateStatus =
  | "disabled"
  | "idle"
  | "checking"
  | "available"
  | "downloading"
  | "downloaded"
  | "not-available"
  | "error";

export type DesktopUpdateState = {
  status: DesktopUpdateStatus;
  message?: string;
  version?: string;
  releaseDate?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  percent?: number;
  feedUrl?: string;
};

type UpdateListener = (state: DesktopUpdateState) => void;

type InstallerAssetDescriptor = {
  fileName: string;
  url: string;
};

const DEFAULT_WINDOWS_UPDATE_FEED_URL =
  "https://pub-3fc3537dae154068a167de3a3c875c3e.r2.dev/live-console-updates/win/staged";

function getConfiguredFeedUrl() {
  return (
    process.env.QWORSHIP_UPDATE_FEED_URL?.trim() ||
    process.env.VITE_QWORSHIP_UPDATE_FEED_URL?.trim() ||
    DEFAULT_WINDOWS_UPDATE_FEED_URL
  );
}

function toStateFromInfo(
  status: DesktopUpdateStatus,
  info: Partial<UpdateInfo> = {},
  overrides: Partial<DesktopUpdateState> = {},
): DesktopUpdateState {
  return {
    status,
    version: typeof info.version === "string" ? info.version : undefined,
    releaseDate:
      typeof info.releaseDate === "string" ? info.releaseDate : undefined,
    feedUrl: getConfiguredFeedUrl(),
    ...overrides,
  };
}

function sanitizeFileName(fileName: string) {
  return fileName.replace(/[<>:"/\\|?*]+/g, "-");
}

function stripQueryString(value: string) {
  return value.split("?")[0]?.split("#")[0] ?? value;
}

export class DesktopAppUpdater {
  private listener: UpdateListener | null = null;

  private updater: NsisUpdater | null = null;

  private initialized = false;

  private availableUpdate: UpdateInfo | null = null;

  private downloadedInstallerPath: string | null = null;

  private installPromise: Promise<{ success: boolean; message?: string }> | null =
    null;

  private state: DesktopUpdateState = {
    status: "idle",
    message: "Updater not initialized yet.",
    feedUrl: getConfiguredFeedUrl(),
  };

  initialize(listener: UpdateListener) {
    this.listener = listener;

    if (this.initialized) {
      this.emit(this.state);
      return this.state;
    }

    this.initialized = true;

    const allowDevUpdates = process.env.QWORSHIP_ENABLE_DEV_UPDATES === "true";
    if (!app.isPackaged && !allowDevUpdates) {
      this.state = {
        status: "disabled",
        message: "Automatic updates are only enabled in packaged builds.",
        feedUrl: getConfiguredFeedUrl(),
      };
      this.emit(this.state);
      return this.state;
    }

    this.updater = new NsisUpdater({
      provider: "generic",
      url: getConfiguredFeedUrl(),
      useMultipleRangeRequest: false,
    });

    this.updater.autoDownload = false;
    this.updater.autoInstallOnAppQuit = false;
    this.updater.forceDevUpdateConfig = allowDevUpdates;

    this.bindUpdaterEvents(this.updater);

    this.state = {
      status: "idle",
      message: "Updater ready.",
      feedUrl: getConfiguredFeedUrl(),
    };
    this.emit(this.state);
    return this.state;
  }

  scheduleStartupCheck(delayMs = 15_000) {
    if (!this.updater) return;

    setTimeout(() => {
      void this.checkForUpdates(false);
    }, delayMs);
  }

  getState() {
    return this.state;
  }

  async checkForUpdates(manual = true) {
    if (!this.updater) {
      const disabledState: DesktopUpdateState = {
        status: "disabled",
        message: "Updater is not available in the current runtime.",
        feedUrl: getConfiguredFeedUrl(),
      };
      this.state = disabledState;
      this.emit(disabledState);
      return disabledState;
    }

    if (manual) {
      this.state = {
        ...this.state,
        status: "checking",
        message: "Checking for updates...",
      };
      this.emit(this.state);
    }

    try {
      await this.updater.checkForUpdates();
      return this.state;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown update check failure.";
      this.state = {
        status: "error",
        message,
        feedUrl: getConfiguredFeedUrl(),
      };
      this.emit(this.state);
      return this.state;
    }
  }

  async quitAndInstall() {
    if (!this.updater) {
      return { success: false, message: "Updater is not initialized." };
    }

    if (!this.availableUpdate && this.state.status !== "downloaded") {
      return {
        success: false,
        message: "No available update is ready to install yet.",
      };
    }

    if (!this.installPromise) {
      this.installPromise = this.prepareAndLaunchInstaller().finally(() => {
        this.installPromise = null;
      });
    }

    return this.installPromise;
  }

  private async prepareAndLaunchInstaller() {
    try {
      if (!this.availableUpdate) {
        return {
          success: false,
          message: "No update metadata is available for installation.",
        };
      }

      if (!this.downloadedInstallerPath) {
        const versionLabel = this.availableUpdate.version ?? "the latest version";
        this.state = toStateFromInfo("downloading", this.availableUpdate, {
          message: `Preparing version ${versionLabel} for installation...`,
          percent: 0,
          downloadedBytes: 0,
        });
        this.emit(this.state);

        this.downloadedInstallerPath = await this.downloadInstaller(
          this.availableUpdate,
        );
      }

      const versionLabel = this.availableUpdate.version ?? "the latest version";
      this.state = toStateFromInfo("downloaded", this.availableUpdate, {
        message: `Version ${versionLabel} is ready. The app will briefly close to install.`,
        percent: 100,
      });
      this.emit(this.state);

      const openResult = await shell.openPath(this.downloadedInstallerPath);
      if (openResult) {
        this.state = toStateFromInfo("error", this.availableUpdate, {
          message: `Unable to launch the downloaded installer. ${openResult}`,
        });
        this.emit(this.state);
        return { success: false, message: openResult };
      }

      app.quit();
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to prepare the update installer.";
      this.state = toStateFromInfo("error", this.availableUpdate ?? {}, {
        message,
      });
      this.emit(this.state);
      return { success: false, message };
    }
  }

  private bindUpdaterEvents(updater: NsisUpdater) {
    updater.on("checking-for-update", () => {
      this.state = {
        status: "checking",
        message: "Checking for updates...",
        feedUrl: getConfiguredFeedUrl(),
      };
      this.emit(this.state);
    });

    updater.on("update-available", (info: UpdateInfo) => {
      this.availableUpdate = info;
      this.downloadedInstallerPath = null;
      this.state = toStateFromInfo("available", info, {
        message: `Version ${info.version} is now available. Click to install. The app will close briefly.`,
      });
      this.emit(this.state);
    });

    updater.on("update-not-available", (info: UpdateInfo) => {
      this.availableUpdate = null;
      this.downloadedInstallerPath = null;
      this.state = toStateFromInfo("not-available", info, {
        message: "You already have the latest available version.",
      });
      this.emit(this.state);
    });

    updater.on("download-progress", (progress: ProgressInfo) => {
      this.state = {
        ...this.state,
        status: "downloading",
        message: `Downloading update: ${Math.round(progress.percent)}%.`,
        downloadedBytes: progress.transferred,
        totalBytes: progress.total,
        percent: progress.percent,
        feedUrl: getConfiguredFeedUrl(),
      };
      this.emit(this.state);
    });

    updater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
      this.availableUpdate = info;
      this.state = toStateFromInfo("downloaded", info, {
        message: `Update ${info.version} has downloaded and is ready to install.`,
        percent: 100,
      });
      this.emit(this.state);
    });

    updater.on("error", (error: Error) => {
      this.state = {
        status: "error",
        message: error.message,
        version: this.availableUpdate?.version,
        feedUrl: getConfiguredFeedUrl(),
      };
      this.emit(this.state);
    });
  }

  private async downloadInstaller(info: UpdateInfo) {
    const asset = this.resolveInstallerAsset(info);
    const cacheDir = path.join(app.getPath("userData"), "desktop-update-cache");
    await mkdir(cacheDir, { recursive: true });

    const filePath = path.join(cacheDir, sanitizeFileName(asset.fileName));
    const response = await fetch(asset.url);

    if (!response.ok || !response.body) {
      throw new Error(
        `Unable to download the update installer (${response.status} ${response.statusText}).`,
      );
    }

    const totalBytesHeader = response.headers.get("content-length");
    const totalBytes = totalBytesHeader ? Number(totalBytesHeader) : undefined;
    let downloadedBytes = 0;

    const readable = Readable.fromWeb(response.body as never);
    readable.on("data", (chunk: Buffer | string) => {
      downloadedBytes += Buffer.byteLength(chunk);
      const percent = totalBytes
        ? Math.min(100, (downloadedBytes / totalBytes) * 100)
        : undefined;

      this.state = toStateFromInfo("downloading", info, {
        message: percent
          ? `Preparing version ${info.version} for installation: ${Math.round(percent)}%.`
          : `Preparing version ${info.version} for installation...`,
        downloadedBytes,
        totalBytes,
        percent,
      });
      this.emit(this.state);
    });

    await pipeline(readable, createWriteStream(filePath));
    return filePath;
  }

  private resolveInstallerAsset(info: UpdateInfo): InstallerAssetDescriptor {
    const installerPath = this.resolveInstallerAssetPath(info);
    const fileName = sanitizeFileName(
      stripQueryString(installerPath.split(/[\\/]/).pop() || `Qworship Live Console Setup ${info.version}.exe`),
    );

    if (/^https?:\/\//i.test(installerPath)) {
      return {
        fileName,
        url: installerPath,
      };
    }

    const normalizedFeedUrl = `${getConfiguredFeedUrl().replace(/\/+$/, "")}/`;
    return {
      fileName,
      url: new URL(installerPath.replace(/^\.\//, ""), normalizedFeedUrl).toString(),
    };
  }

  private resolveInstallerAssetPath(info: UpdateInfo) {
    const typedInfo = info as UpdateInfo & {
      path?: string;
      files?: Array<{
        url?: string;
        path?: string;
        name?: string;
      }>;
    };

    const fileEntry = typedInfo.files?.find((file) => {
      const candidate = file?.url ?? file?.path ?? file?.name;
      return typeof candidate === "string" && stripQueryString(candidate).toLowerCase().endsWith(".exe");
    });

    const candidate =
      fileEntry?.url ??
      fileEntry?.path ??
      fileEntry?.name ??
      typedInfo.path ??
      `Qworship Live Console Setup ${typedInfo.version ?? app.getVersion()}.exe`;

    return candidate;
  }

  private emit(state: DesktopUpdateState) {
    this.listener?.(state);
  }
}
