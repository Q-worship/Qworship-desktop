import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  screen,
  session,
  systemPreferences,
} from "electron";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

// ── Speech / HFB Services ───────────────────────────────────────
import { SpeechEngineManager } from "./services/speechEngineManager";
import { BibleSQLiteService } from "./services/bibleSqliteService";
import { DesktopAppUpdater } from "./services/appUpdater";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - SystemJS only
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let liveWindow: BrowserWindow | null = null;
let ndiLowerThirdWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;
let ndiCaptureInterval: NodeJS.Timeout | null = null;
let ndiCaptureInFlight = false;
let ndiLowerThirdTargetUrl: string | null = null;
const desktopUpdater = new DesktopAppUpdater();

function isWindowUsable(target: BrowserWindow | null | undefined): target is BrowserWindow {
  return Boolean(target && !target.isDestroyed() && !target.webContents.isDestroyed());
}

function sendToMainWindow(channel: string, ...args: unknown[]) {
  if (!isWindowUsable(win)) return;
  win.webContents.send(channel, ...args);
}

function sendUpdateStateToRenderer(state: unknown) {
  sendToMainWindow("app:update-state", state);
}

type NDISettings = {
  resolution: "1920x1080" | "1280x720" | "3840x2160";
  frameRate: "24" | "30" | "60";
  bandwidth: "highest" | "balanced" | "lowest";
  colorFormat: "uyvy422" | "rgba" | "bgra";
  audioEnabled: boolean;
  alphaEnabled: boolean;
  audienceEnabled: boolean;
  lowerThirdEnabled: boolean;
  audienceStreamName: string;
  lowerThirdStreamName: string;
};

type LiveOutputOptions = {
  route: string;
  targetDisplayId: string | null;
  connectionMethod: "wired" | "ndi" | "both";
  fullscreen: boolean;
  ndiSettings?: NDISettings;
  lowerThirdRenderUrl?: string | null;
};

type NDINativeModule = {
  createSender?: (streamName: string, clockVideo?: boolean, clockAudio?: boolean) => unknown;
  destroySender?: (sender: unknown) => void;
  sendVideoFrame?: (
    sender: unknown,
    buffer: Buffer,
    width: number,
    height: number,
    frameRateN: number,
    frameRateD: number,
    alphaEnabled?: boolean,
  ) => void;
  version?: () => string;
  shutdownNDI?: () => void;
};

type NDISenderState = {
  audience: unknown | null;
  lowerThird: unknown | null;
  active: boolean;
  options: LiveOutputOptions | null;
};

const ndiBridge: NDINativeModule | null = (() => {
  try {
    const bridge = require("qworship-ndi") as NDINativeModule;
    console.log("[NDI] Native bridge loaded successfully");
    return bridge;
  } catch (error) {
    console.warn("[NDI] Native bridge unavailable", error);
    return null;
  }
})();

const ndiSenderState: NDISenderState = {
  audience: null,
  lowerThird: null,
  active: false,
  options: null,
};

const DEFAULT_NDI_SETTINGS: NDISettings = {
  resolution: "1920x1080",
  frameRate: "24",
  bandwidth: "highest",
  colorFormat: "uyvy422",
  audioEnabled: true,
  alphaEnabled: true,
  audienceEnabled: true,
  lowerThirdEnabled: true,
  audienceStreamName: "Audience",
  lowerThirdStreamName: "Lower Third",
};

function getMergedNDISettings(settings?: Partial<NDISettings>): NDISettings {
  return {
    ...DEFAULT_NDI_SETTINGS,
    ...(settings ?? {}),
  };
}

function getNDIFrameSpec(settings?: Partial<NDISettings>) {
  const merged = getMergedNDISettings(settings);
  const [widthText, heightText] = merged.resolution.split("x");
  const width = Number(widthText) || 1920;
  const height = Number(heightText) || 1080;
  const frameRateN = Number(merged.frameRate) || 24;
  return {
    width,
    height,
    frameRateN,
    frameRateD: 1,
    alphaEnabled: merged.alphaEnabled,
  };
}

function shouldUseNDI(connectionMethod: LiveOutputOptions["connectionMethod"]) {
  return connectionMethod === "ndi" || connectionMethod === "both";
}

function shouldUseWired(connectionMethod: LiveOutputOptions["connectionMethod"]) {
  return connectionMethod === "wired" || connectionMethod === "both";
}

function destroyNDISender(kind: "audience" | "lowerThird") {
  try {
    const sender = ndiSenderState[kind];
    if (sender && ndiBridge?.destroySender) {
      ndiBridge.destroySender(sender);
    }
  } catch (error) {
    console.warn(`[NDI] Failed to destroy ${kind} sender`, error);
  } finally {
    ndiSenderState[kind] = null;
  }
}

function stopNDICaptureLoop() {
  if (ndiCaptureInterval) {
    clearInterval(ndiCaptureInterval);
    ndiCaptureInterval = null;
  }
}

async function ensureLowerThirdWindow(targetUrl: string) {
  if (!ndiLowerThirdWindow || ndiLowerThirdWindow.isDestroyed()) {
    ndiLowerThirdWindow = new BrowserWindow({
      width: 1920,
      height: 1080,
      show: false,
      frame: false,
      transparent: true,
      backgroundColor: "#00000000",
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    ndiLowerThirdWindow.on("closed", () => {
      ndiLowerThirdWindow = null;
    });
  }

  if (ndiLowerThirdTargetUrl !== targetUrl) {
    ndiLowerThirdTargetUrl = targetUrl;
    await ndiLowerThirdWindow.loadURL(targetUrl);
  }

  return ndiLowerThirdWindow;
}

async function captureWindowToNDI(kind: "audience" | "lowerThird", window: BrowserWindow, settings?: Partial<NDISettings>) {
  const sender = ndiSenderState[kind];
  if (!sender || !ndiBridge?.sendVideoFrame || window.isDestroyed()) return;

  const spec = getNDIFrameSpec(settings);
  const image = await window.webContents.capturePage();
  const resized = image.resize({ width: spec.width, height: spec.height, quality: "best" });
  const bitmap = resized.toBitmap();
  ndiBridge.sendVideoFrame(sender, bitmap, spec.width, spec.height, spec.frameRateN, spec.frameRateD, kind === "lowerThird" ? spec.alphaEnabled : false);
}

function startNDICaptureLoop(settings?: Partial<NDISettings>) {
  stopNDICaptureLoop();

  const spec = getNDIFrameSpec(settings);
  const intervalMs = Math.max(16, Math.round((spec.frameRateD / spec.frameRateN) * 1000));

  ndiCaptureInterval = setInterval(async () => {
    if (ndiCaptureInFlight) return;
    ndiCaptureInFlight = true;

    try {
      if (ndiSenderState.audience && liveWindow && !liveWindow.isDestroyed()) {
        await captureWindowToNDI("audience", liveWindow, settings);
      }
      if (ndiSenderState.lowerThird && ndiLowerThirdWindow && !ndiLowerThirdWindow.isDestroyed()) {
        await captureWindowToNDI("lowerThird", ndiLowerThirdWindow, settings);
      }
    } catch (error) {
      console.warn("[NDI] Capture loop iteration failed", error);
    } finally {
      ndiCaptureInFlight = false;
    }
  }, intervalMs);
}

async function startNDIOutput(options: LiveOutputOptions) {
  if (!ndiBridge?.createSender || !ndiBridge?.sendVideoFrame) {
    throw new Error("Native NDI bridge is unavailable.");
  }

  const settings = getMergedNDISettings(options.ndiSettings);
  ndiSenderState.options = options;

  destroyNDISender("audience");
  destroyNDISender("lowerThird");

  if (settings.audienceEnabled) {
    ndiSenderState.audience = ndiBridge.createSender(settings.audienceStreamName || "Audience", true, Boolean(settings.audioEnabled));
  }

  if (settings.lowerThirdEnabled) {
    const lowerThirdTargetUrl = getDesktopLowerThirdRendererUrl(
      options.lowerThirdRenderUrl,
    );
    await ensureLowerThirdWindow(lowerThirdTargetUrl);
    ndiSenderState.lowerThird = ndiBridge.createSender(settings.lowerThirdStreamName || "Lower Third", true, false);
  }

  ndiSenderState.active = Boolean(ndiSenderState.audience || ndiSenderState.lowerThird);
  if (ndiSenderState.active) {
    startNDICaptureLoop(settings);
  }
}

function stopNDIOutput() {
  stopNDICaptureLoop();
  destroyNDISender("audience");
  destroyNDISender("lowerThird");
  ndiSenderState.active = false;
  ndiSenderState.options = null;

  if (ndiLowerThirdWindow && !ndiLowerThirdWindow.isDestroyed()) {
    ndiLowerThirdWindow.close();
    ndiLowerThirdWindow = null;
  }
}

function getRendererUrl(
  route: string,
  query?: Record<string, string | null | undefined>,
) {
  const [routePath, routeQuery = ""] = route.split("?");
  const normalizedRoute = routePath.startsWith("/") ? routePath : `/${routePath}`;
  const searchParams = new URLSearchParams(routeQuery);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value) {
        searchParams.set(key, value);
      }
    });
  }

  const search = searchParams.toString();

  if (VITE_DEV_SERVER_URL) {
    return `${VITE_DEV_SERVER_URL}${search ? `?${search}` : ""}#${normalizedRoute}`;
  }

  const rendererUrl = new URL(`file://${path.join(RENDERER_DIST, "index.html")}`);
  rendererUrl.search = search ? `?${search}` : "";
  rendererUrl.hash = normalizedRoute;
  return rendererUrl.toString();
}

function extractLowerThirdUid(targetUrl?: string | null) {
  if (!targetUrl) return null;

  try {
    const parsed = new URL(targetUrl);
    const uidFromQuery = parsed.searchParams.get("uid");
    if (uidFromQuery) return uidFromQuery;

    const pathMatch = parsed.pathname.match(/\/r\/([^/?#]+)/i);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  } catch {
    const queryMatch = targetUrl.match(/[?&]uid=([^&#]+)/i);
    if (queryMatch?.[1]) return decodeURIComponent(queryMatch[1]);

    const pathMatch = targetUrl.match(/\/r\/([^/?#]+)/i);
    return pathMatch?.[1] ? decodeURIComponent(pathMatch[1]) : null;
  }
}

function getDesktopLowerThirdRendererUrl(targetUrl?: string | null) {
  const uid = extractLowerThirdUid(targetUrl);
  return getRendererUrl("/lower-third-render", uid ? { uid } : undefined);
}

function getOutputDisplays() {
  return screen.getAllDisplays().map((display, index) => ({
    id: String(display.id),
    label: `${display.label || `Display ${index + 1}`}${display.bounds.x === 0 && display.bounds.y === 0 ? " (Primary)" : ""}`,
    isPrimary: display.bounds.x === 0 && display.bounds.y === 0,
    bounds: display.bounds,
  }));
}

function resolveTargetDisplay(targetDisplayId: string | null) {
  const displays = screen.getAllDisplays();
  if (!displays.length) return null;

  if (targetDisplayId) {
    const explicit = displays.find((display) => String(display.id) === targetDisplayId);
    if (explicit) return explicit;
  }

  const external = displays.find((display) => !(display.bounds.x === 0 && display.bounds.y === 0));
  return external ?? screen.getPrimaryDisplay();
}

function applyLiveWindowPlacement(window: BrowserWindow, options: LiveOutputOptions) {
  const targetDisplay = resolveTargetDisplay(options.targetDisplayId);
  if (!targetDisplay) return;

  const useExternalDisplay = options.connectionMethod === "wired" || options.connectionMethod === "both";
  const bounds = useExternalDisplay ? targetDisplay.bounds : screen.getPrimaryDisplay().bounds;

  window.setBounds(bounds);
  window.setPosition(bounds.x, bounds.y);

  if (options.fullscreen && useExternalDisplay) {
    window.setFullScreen(false);
    window.setFullScreen(true);
  } else {
    window.setFullScreen(false);
    window.maximize();
  }
}

async function openLiveOutput(options: LiveOutputOptions) {
  if (!liveWindow || liveWindow.isDestroyed()) {
    liveWindow = new BrowserWindow({
      x: 0,
      y: 0,
      width: 1280,
      height: 720,
      show: false,
      frame: false,
      title: "Qworship Live Presentation",
      backgroundColor: "#000000",
      autoHideMenuBar: true,
      fullscreenable: true,
      skipTaskbar: true,
      webPreferences: {
        preload: path.join(__dirname, "preload.cjs"),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    liveWindow.setMenuBarVisibility(false);
    liveWindow.removeMenu();

    liveWindow.on("closed", () => {
      liveWindow = null;
      stopNDIOutput();
      sendToMainWindow("live:window-closed");
    });
  }

  const targetUrl = getRendererUrl(options.route);
  await liveWindow.loadURL(targetUrl);

  if (shouldUseWired(options.connectionMethod)) {
    applyLiveWindowPlacement(liveWindow, options);
    liveWindow.show();
    liveWindow.focus();
  } else {
    liveWindow.hide();
  }

  if (shouldUseNDI(options.connectionMethod)) {
    await startNDIOutput(options);
  } else {
    stopNDIOutput();
  }

  return { success: true };
}

// ── Speech Engine Instances ─────────────────────────────────────
let speechAuthToken: string | null = null;

const speechEngine = new SpeechEngineManager({
  getAuthToken: () => speechAuthToken,
  sendModelDownloadProgress: (percent, downloadedMB, totalMB) => {
    sendToMainWindow(
      "hfb:model-download-progress",
      percent,
      downloadedMB,
      totalMB,
    );
    sendToMainWindow("speech:model-download-progress", {
      percent,
      downloadedMB,
      totalMB,
      provider: speechEngine.getDescriptor(),
    });
  },
});
const bibleService = new BibleSQLiteService();
let bibleInitializationPromise: Promise<void> | null = null;

function ensureBibleServiceInitialized() {
  if (!bibleInitializationPromise) {
    bibleInitializationPromise = bibleService.initialize(process.env.VITE_PUBLIC as string).catch((err) => {
      console.error("[Main] Bible SQLite initialization failed:", err);
      throw err;
    });
  }

  return bibleInitializationPromise;
}

// Force single instance application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle protocol on Windows/Linux during second instance
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (isWindowUsable(win)) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }

    // Command line usually contains the deep link uri as the last argument
    const uri = commandLine.find((arg) => arg.startsWith("qworship://"));
    if (uri) {
      handleProtocolUri(uri);
    }
  });

  // Handle setting up custom protocol for Windows
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("qworship", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("qworship");
  }

  app.whenReady().then(async () => {
    // Grant microphone permission automatically so webkitSpeechRecognition doesn't hang
    session.defaultSession.setPermissionRequestHandler(
      (_wc, permission, callback) => {
        const allowed = [
          "microphone",
          "camera",
          "media",
          "audioCapture",
          "videoCapture",
        ];
        callback(allowed.includes(permission));
      },
    );
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = [
        "microphone",
        "camera",
        "media",
        "audioCapture",
        "videoCapture",
      ];
      return allowed.includes(permission);
    });

    if (process.platform === "darwin") {
      // Required on macOS: Natively request OS-level microphone permission to prevent getUserMedia from hanging
      systemPreferences
        .askForMediaAccess("microphone")
        .then((granted) => {
          console.log("OS-level microphone permission granted:", granted);
        })
        .catch((err) =>
          console.error("OS-level microphone permission error:", err),
        );
    }
    await ensureBibleServiceInitialized();
    createWindow();
    desktopUpdater.initialize(sendUpdateStateToRenderer);
    desktopUpdater.scheduleStartupCheck();
    // ── Initialize Speech Engine (non-blocking) ─────────────────
    initializeSpeechEngine().catch((err) => {
      console.error("[Main] Speech engine initialization failed:", err);
    });
 });

  // Handle protocol on macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (app.isReady()) {
      handleProtocolUri(url);
    } else {
      deepLinkUrl = url;
    }
  });
}

// ── Speech Engine Initialization ───────────────────────────────
let speechEventsBound = false;
let speechEngineInitializationPromise: Promise<void> | null = null;

function forwardSpeechErrorToRenderer(message: string) {
  const payload = {
    status: "error" as const,
    message,
    provider: speechEngine.getDescriptor(),
  };
  sendToMainWindow("hfb:status-change", payload.status, payload.message);
  sendToMainWindow("speech:status-change", payload);
}

async function initializeSpeechEngine() {
  if (!speechEventsBound) {
    speechEventsBound = true;

    speechEngine.on("transcript-partial", (payload) => {
      sendToMainWindow("hfb:transcript-partial", payload.text);
      sendToMainWindow("speech:transcript-partial", payload);
    });

    speechEngine.on("transcript-final", (payload) => {
      sendToMainWindow("hfb:transcript-final", payload.text);
      sendToMainWindow("speech:transcript-final", payload);
    });

    speechEngine.on("status-change", (payload) => {
      sendToMainWindow(
        "hfb:status-change",
        payload.status,
        payload.message,
      );
      sendToMainWindow("speech:status-change", payload);
    });
  }

  if (!speechEngineInitializationPromise) {
    speechEngineInitializationPromise = speechEngine.initialize()
      .then(() => {
        console.log("[Main] Speech engine initialized successfully");
      })
      .catch((err) => {
        speechEngineInitializationPromise = null;
        console.error("[Main] Failed to initialize speech engine:", err);
        throw err;
      });
  }

  return speechEngineInitializationPromise;
}

// ── Whisper IPC Handlers ───────────────────────────────────────
let _audioChunkCount = 0;
ipcMain.on("hfb:audio-chunk", (_event, rawData: any) => {
  // Electron IPC serializes ArrayBuffers into Node.js Buffer / Uint8Array objects.
  // We must use the .buffer property.
  const pcm16 = new Int16Array(
    rawData.buffer || rawData,
    rawData.byteOffset || 0,
    (rawData.byteLength || rawData.length) / 2,
  );

  if (_audioChunkCount++ % 100 === 0) {
    let maxAmplitude = 0;
    for (let i = 0; i < pcm16.length; i++) {
      const val = Math.abs(pcm16[i]);
      if (val > maxAmplitude) maxAmplitude = val;
    }
    console.log(
      `[Main] Audio chunk #${_audioChunkCount}. Peak amplitude: ${maxAmplitude}/32768`,
    );
  }

  speechEngine.feedAudioChunk(pcm16);
});

ipcMain.on("hfb:start-listening", async () => {
  try {
    await initializeSpeechEngine();
    speechEngine.startListening();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start Hands-free Bible listening.";
    console.error("[Main] hfb:start-listening failed:", error);
    forwardSpeechErrorToRenderer(message);
  }
});

ipcMain.on("hfb:stop-listening", () => {
  speechEngine.stopListening();
});

ipcMain.handle("hfb:get-status", () => {
  return speechEngine.getStatus();
});

ipcMain.handle("hfb:get-bible-chapter", async (_event, version: string, book: string, chapter: number) => {
  await ensureBibleServiceInitialized();
  return bibleService.getChapter(version, book, chapter);
});

ipcMain.on("speech:audio-chunk", (_event, rawData: any) => {
  const pcm16 = new Int16Array(
    rawData.buffer || rawData,
    rawData.byteOffset || 0,
    (rawData.byteLength || rawData.length) / 2,
  );
  speechEngine.feedAudioChunk(pcm16);
});

ipcMain.on("speech:start-listening", async () => {
  try {
    await initializeSpeechEngine();
    speechEngine.startListening();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to start speech listening.";
    console.error("[Main] speech:start-listening failed:", error);
    forwardSpeechErrorToRenderer(message);
  }
});

ipcMain.on("speech:stop-listening", () => {
  speechEngine.stopListening();
});

ipcMain.handle("speech:get-status", () => {
  return speechEngine.getStatus();
});
ipcMain.handle("app-updater:get-state", () => {
  return desktopUpdater.getState();
});
ipcMain.handle("app-updater:check", async (_event, options?: { manual?: boolean }) => {
  return desktopUpdater.checkForUpdates(options?.manual ?? true);
});
ipcMain.handle("app-updater:quit-and-install", async () => {
  return desktopUpdater.quitAndInstall();
});

ipcMain.handle("speech:set-auth-token", async (_event, token: string | null) => {
  speechAuthToken = typeof token === "string" && token.trim() ? token.trim() : null;

  if (!speechAuthToken && speechEngine.getDescriptor().id === "online-whisper") {
    await speechEngine.shutdown();
  }

  return { success: true };
});

ipcMain.handle("speech:get-providers", () => {
  return speechEngine.getAvailableProviders();
});

ipcMain.handle("speech:set-provider", async (_event, providerId: string) => {
  return speechEngine.setProvider(providerId as any);
});

// ── Deep Link Handlers ─────────────────────────────────────────
function handleProtocolUri(url: string) {
  console.log("Received deep link:", url);
  deepLinkUrl = url; // ALWAYS save it so the renderer can fetch it safely anytime
  sendToMainWindow("deep-link-payload", url);
}

ipcMain.on("request-deep-link", () => {
  if (deepLinkUrl && isWindowUsable(win)) {
    sendToMainWindow("deep-link-payload", deepLinkUrl);
    deepLinkUrl = null; // Consume it
  }
});

ipcMain.on("open-external-url", (_event, url) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    shell.openExternal(url);
  }
});

ipcMain.on("live:message", (event, payload) => {
  // If the message comes from the main window, send it to the live window
  // and the hidden lower-third NDI window.
  if (isWindowUsable(win) && event.sender === win.webContents) {
    if (isWindowUsable(liveWindow)) {
      liveWindow.webContents.send("live:message", payload);
    }
    if (isWindowUsable(ndiLowerThirdWindow)) {
      ndiLowerThirdWindow.webContents.send("live:message", payload);
    }
  }
  // If from the live window, send to main window
  else if (isWindowUsable(liveWindow) && event.sender === liveWindow.webContents) {
    sendToMainWindow("live:message", payload);
  }
  // If from the hidden lower-third window, send to main window
  else if (isWindowUsable(ndiLowerThirdWindow) && event.sender === ndiLowerThirdWindow.webContents) {
    sendToMainWindow("live:message", payload);
  }
});

ipcMain.handle("display:get-outputs", () => {
  return getOutputDisplays();
});

ipcMain.handle("live:open-output", async (_event, options: LiveOutputOptions) => {
  return openLiveOutput(options);
});

ipcMain.handle("live:close-output", async () => {
  stopNDIOutput();

  if (liveWindow && !liveWindow.isDestroyed()) {
    liveWindow.close();
    liveWindow = null;
  }

  sendToMainWindow("live:window-closed");

  return { success: true };
});

function createWindow() {
  // Grant microphone (and camera) permissions automatically so webkitSpeechRecognition
  // does not hang waiting for a system dialog that Electron never shows in dev mode.
  const { session } = require("electron");
  session.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = [
        "microphone",
        "camera",
        "media",
        "audioCapture",
        "videoCapture",
      ];
      callback(allowed.includes(permission));
    },
  );
  session.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      const allowed = [
        "microphone",
        "camera",
        "media",
        "audioCapture",
        "videoCapture",
      ];
      return allowed.includes(permission);
    },
  );

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show immediately to prevent white flash
    title: "Qworship Live Console",
    titleBarStyle: "hiddenInset",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Necessary if they use <webview> for pricing
    },
  });

  // Wait until the renderer has painted its first frame before showing the window
  win.on("ready-to-show", () => {
    win?.show();
  });

  // ── Crash Detection ──────────────────────────────────────────
  // Detect when the renderer process crashes or becomes unresponsive
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error(
      "⚠️ [RENDERER CRASHED]",
      details.reason,
      "exitCode:",
      details.exitCode,
    );
  });
  win.on("unresponsive", () => {
    console.error(
      "⚠️ [RENDERER UNRESPONSIVE] The renderer process is not responding",
    );
  });
  win.on("responsive", () => {
    console.log("✅ [RENDERER RESPONSIVE] The renderer process recovered");
  });
  
  win.webContents.on('did-create-window', (childWindow, details) => {
    // We assume any created window from main is the live presentation window
    liveWindow = childWindow;
    childWindow.on('closed', () => {
      liveWindow = null;
      if (win && !win.isDestroyed()) {
        win.webContents.send('live:window-closed');
      }
    });
  });

  win.webContents.on(
    "console-message",
    (_event, level, message, line, sourceId) => {
      // Forward all renderer console messages to main process terminal to diagnose the silent data death
      const prefix = level >= 2 ? "🔴 [RENDERER ERROR]" : "🔵 [RENDERER LOG]";
      console.log(`${prefix} ${message} (${sourceId}:${line})`);
    },
  );

  // Handle window.open() calls from the renderer
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  const liveConsoleHashRoute = "#/live-console";

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(`${VITE_DEV_SERVER_URL}${liveConsoleHashRoute}`);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"), {
      hash: "/live-console",
    });
  }

  win.webContents.on("did-finish-load", () => {
    if (deepLinkUrl) {
      handleProtocolUri(deepLinkUrl);
      deepLinkUrl = null; // clear after sending
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Shut down speech engine before quitting
    speechEngine.shutdown().finally(() => {
      app.quit();
    });
    win = null;
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
