import React from "react";

export type DesktopUpdateState = {
  status: string;
  message?: string;
  version?: string;
  releaseDate?: string;
  downloadedBytes?: number;
  totalBytes?: number;
  percent?: number;
  feedUrl?: string;
};

const FALLBACK_STATE: DesktopUpdateState = {
  status: "idle",
  message: "Checking for updates in the background.",
};

function normalizeUpdateState(payload: unknown): DesktopUpdateState {
  if (!payload || typeof payload !== "object") {
    return FALLBACK_STATE;
  }

  const state = payload as Partial<DesktopUpdateState>;
  return {
    status: typeof state.status === "string" ? state.status : FALLBACK_STATE.status,
    message: typeof state.message === "string" ? state.message : undefined,
    version: typeof state.version === "string" ? state.version : undefined,
    releaseDate:
      typeof state.releaseDate === "string" ? state.releaseDate : undefined,
    downloadedBytes:
      typeof state.downloadedBytes === "number"
        ? state.downloadedBytes
        : undefined,
    totalBytes:
      typeof state.totalBytes === "number" ? state.totalBytes : undefined,
    percent: typeof state.percent === "number" ? state.percent : undefined,
    feedUrl: typeof state.feedUrl === "string" ? state.feedUrl : undefined,
  };
}

export function useDesktopUpdateState() {
  const [state, setState] = React.useState<DesktopUpdateState>(FALLBACK_STATE);
  const [isActionPending, setIsActionPending] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    const updates = window.api?.updates;

    if (!updates) {
      setState({
        status: "disabled",
        message: "Updates are only available inside the packaged desktop build.",
      });
      return;
    }

    void updates
      .getState?.()
      .then((payload) => {
        if (!active) return;
        setState(normalizeUpdateState(payload));
      })
      .catch((error) => {
        if (!active) return;
        setState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to read the current updater state.",
        });
      });

    const unsubscribe = updates.onStateChange?.((payload) => {
      if (!active) return;
      setState(normalizeUpdateState(payload));
    });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const installAndRestart = React.useCallback(async () => {
    const updates = window.api?.updates;
    if (!updates?.quitAndInstall) {
      const failure = {
        success: false,
        message: "Install & Restart is unavailable in the current runtime.",
      };
      setState((current) => ({
        ...current,
        status: "error",
        message: failure.message,
      }));
      return failure;
    }

    setIsActionPending(true);
    try {
      const result = await updates.quitAndInstall();
      if (result && typeof result === "object" && "success" in result) {
        const typed = result as { success: boolean; message?: string };
        if (!typed.success && typed.message) {
          setState((current) => ({
            ...current,
            status: "error",
            message: typed.message,
          }));
        }
        return typed;
      }

      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Unable to start the desktop update installer.";
      setState((current) => ({
        ...current,
        status: "error",
        message,
      }));
      return { success: false, message };
    } finally {
      setIsActionPending(false);
    }
  }, []);

  const checkForUpdates = React.useCallback(async () => {
    const updates = window.api?.updates;
    if (!updates?.checkForUpdates) {
      return;
    }

    try {
      const payload = await updates.checkForUpdates(true);
      setState((current) => normalizeUpdateState(payload ?? current));
    } catch (error) {
      setState((current) => ({
        ...current,
        status: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to manually check for updates.",
      }));
    }
  }, []);

  const shouldShowCard =
    state.status === "available" ||
    state.status === "downloading" ||
    state.status === "downloaded" ||
    state.status === "error";

  return {
    state,
    isActionPending,
    shouldShowCard,
    installAndRestart,
    checkForUpdates,
  };
}
