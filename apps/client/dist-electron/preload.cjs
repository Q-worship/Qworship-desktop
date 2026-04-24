"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  // ── Deep link (existing) ────────────────────────────────────────────────────
  onDeepLinkPayload: (callback) => {
    const subscription = (_event, data) => callback(data);
    electron.ipcRenderer.on("deep-link-payload", subscription);
    return () => electron.ipcRenderer.removeListener("deep-link-payload", subscription);
  },
  requestInitialDeepLink: () => {
    electron.ipcRenderer.send("request-deep-link");
  },
  openWebAuth: (url) => {
    electron.ipcRenderer.send("open-external-url", url);
  },
  // ── Whisper / Hands-Free Bible IPC ──────────────────────────
  whisper: {
    /** Send a PCM16 audio chunk to the main process WhisperService */
    sendAudioChunk: (pcm16Buffer) => {
      electron.ipcRenderer.send("hfb:audio-chunk", pcm16Buffer);
    },
    /** Tell the main process to start listening for audio */
    startListening: () => {
      electron.ipcRenderer.send("hfb:start-listening");
    },
    /** Tell the main process to stop listening */
    stopListening: () => {
      electron.ipcRenderer.send("hfb:stop-listening");
    },
    /** Get the current whisper engine status */
    getStatus: () => {
      return electron.ipcRenderer.invoke("hfb:get-status");
    },
    /** Listen for partial transcript events from the main process */
    onTranscriptPartial: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on("hfb:transcript-partial", handler);
      return () => electron.ipcRenderer.removeListener("hfb:transcript-partial", handler);
    },
    /** Listen for final transcript events from the main process */
    onTranscriptFinal: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on("hfb:transcript-final", handler);
      return () => electron.ipcRenderer.removeListener("hfb:transcript-final", handler);
    },
    /** Listen for whisper engine status changes */
    onStatusChange: (callback) => {
      const handler = (_event, status, message) => callback(status, message);
      electron.ipcRenderer.on("hfb:status-change", handler);
      return () => electron.ipcRenderer.removeListener("hfb:status-change", handler);
    },
    /** Listen for model download progress */
    onModelDownloadProgress: (callback) => {
      const handler = (_event, percent, downloadedMB, totalMB) => callback(percent, downloadedMB, totalMB);
      electron.ipcRenderer.on("hfb:model-download-progress", handler);
      return () => electron.ipcRenderer.removeListener("hfb:model-download-progress", handler);
    }
  },
  // ── NDI streaming control ───────────────────────────────────────────────────
  ndi: {
    /** Start NDI streams for both renderers using the provided source configs. */
    startStream: (sources) => electron.ipcRenderer.invoke("ndi-start-stream", sources),
    /** Stop all NDI streams and destroy hidden windows. */
    stopStream: () => electron.ipcRenderer.invoke("ndi-stop-stream"),
    /** Returns the current NDI error object if grandiose failed to load, or null. */
    getGrandioseError: () => electron.ipcRenderer.invoke("ndi-get-grandiose-error"),
    /** Subscribe to live stats updates (fps, bitrate, cpu, ram). */
    onStatsUpdate: (callback) => {
      const sub = (_event, stats) => callback(stats);
      electron.ipcRenderer.on("ndi-stats-update", sub);
      return () => electron.ipcRenderer.removeListener("ndi-stats-update", sub);
    },
    /** Subscribe to NDI error events (e.g., grandiose load failure). */
    onError: (callback) => {
      const sub = (_event, err) => callback(err);
      electron.ipcRenderer.on("ndi-error", sub);
      return () => electron.ipcRenderer.removeListener("ndi-error", sub);
    }
  },
  // ── Local renderer state push ───────────────────────────────────────────────
  renderer: {
    /**
     * Push a state update to one of the hidden offscreen renderer windows.
     * @param type  'lowerThird' | 'mainPresentation'
     * @param state The full state object matching the renderer's render() input.
     */
    updateState: (type, state) => {
      electron.ipcRenderer.send("update-renderer-state", type, state);
    }
  }
});
electron.contextBridge.exposeInMainWorld("qworshipRendererApi", {
  /**
   * Listen for state updates pushed from the main process.
   * Returns an unsubscribe function.
   */
  onStateUpdate: (callback) => {
    const sub = (_event, state) => callback(state);
    electron.ipcRenderer.on("state-update", sub);
    return () => electron.ipcRenderer.removeListener("state-update", sub);
  }
});
