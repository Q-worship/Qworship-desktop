"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  onDeepLinkPayload: (callback) => {
    const subscription = (_event, data) => callback(data);
    electron.ipcRenderer.on("deep-link-payload", subscription);
    return () =>
      electron.ipcRenderer.removeListener("deep-link-payload", subscription);
  },
  // Allows the React app to request the deep link if it booted before main sent it
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
      return () =>
        electron.ipcRenderer.removeListener("hfb:transcript-partial", handler);
    },
    /** Listen for final transcript events from the main process */
    onTranscriptFinal: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on("hfb:transcript-final", handler);
      return () =>
        electron.ipcRenderer.removeListener("hfb:transcript-final", handler);
    },
    /** Listen for whisper engine status changes */
    onStatusChange: (callback) => {
      const handler = (_event, status, message) => callback(status, message);
      electron.ipcRenderer.on("hfb:status-change", handler);
      return () =>
        electron.ipcRenderer.removeListener("hfb:status-change", handler);
    },
    /** Listen for model download progress */
    onModelDownloadProgress: (callback) => {
      const handler = (_event, percent, downloadedMB, totalMB) =>
        callback(percent, downloadedMB, totalMB);
      electron.ipcRenderer.on("hfb:model-download-progress", handler);
      return () =>
        electron.ipcRenderer.removeListener(
          "hfb:model-download-progress",
          handler,
        );
    },
  },
});
