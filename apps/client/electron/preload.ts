import { contextBridge, ipcRenderer } from "electron";

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("api", {
  onDeepLinkPayload: (callback: (data: any) => void) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on("deep-link-payload", subscription);
    return () => ipcRenderer.removeListener("deep-link-payload", subscription);
  },
  // Allows the React app to request the deep link if it booted before main sent it
  requestInitialDeepLink: () => {
    ipcRenderer.send("request-deep-link");
  },
  openWebAuth: (url: string) => {
    ipcRenderer.send("open-external-url", url);
  },

  // ── Whisper / Hands-Free Bible IPC ──────────────────────────
  whisper: {
    /** Send a PCM16 audio chunk to the main process WhisperService */
    sendAudioChunk: (pcm16Buffer: ArrayBuffer) => {
      ipcRenderer.send("hfb:audio-chunk", pcm16Buffer);
    },

    /** Tell the main process to start listening for audio */
    startListening: () => {
      ipcRenderer.send("hfb:start-listening");
    },

    /** Tell the main process to stop listening */
    stopListening: () => {
      ipcRenderer.send("hfb:stop-listening");
    },

    /** Get the current whisper engine status */
    getStatus: () => {
      return ipcRenderer.invoke("hfb:get-status");
    },

    /** Listen for partial transcript events from the main process */
    onTranscriptPartial: (callback: (text: string) => void) => {
      const handler = (_event: any, text: string) => callback(text);
      ipcRenderer.on("hfb:transcript-partial", handler);
      return () =>
        ipcRenderer.removeListener("hfb:transcript-partial", handler);
    },

    /** Listen for final transcript events from the main process */
    onTranscriptFinal: (callback: (text: string) => void) => {
      const handler = (_event: any, text: string) => callback(text);
      ipcRenderer.on("hfb:transcript-final", handler);
      return () => ipcRenderer.removeListener("hfb:transcript-final", handler);
    },

    /** Listen for whisper engine status changes */
    onStatusChange: (callback: (status: string, message?: string) => void) => {
      const handler = (_event: any, status: string, message?: string) =>
        callback(status, message);
      ipcRenderer.on("hfb:status-change", handler);
      return () => ipcRenderer.removeListener("hfb:status-change", handler);
    },

    /** Listen for model download progress */
    onModelDownloadProgress: (
      callback: (
        percent: number,
        downloadedMB: number,
        totalMB: number,
      ) => void,
    ) => {
      const handler = (
        _event: any,
        percent: number,
        downloadedMB: number,
        totalMB: number,
      ) => callback(percent, downloadedMB, totalMB);
      ipcRenderer.on("hfb:model-download-progress", handler);
      return () =>
        ipcRenderer.removeListener("hfb:model-download-progress", handler);
    },
  },
  
  // ── Live Presentation IPC ─────────────────────────────────
  live: {
    sendSync: (payload: any) => {
      ipcRenderer.send("live:message", payload);
    },
    onMessage: (callback: (payload: any) => void) => {
      const handler = (_event: any, payload: any) => callback(payload);
      ipcRenderer.on("live:message", handler);
      return () => ipcRenderer.removeListener("live:message", handler);
    },
    onWindowClosed: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on("live:window-closed", handler);
      return () => ipcRenderer.removeListener("live:window-closed", handler);
    }
  },
  
  // ── Bible SQLite IPC ──────────────────────────────────────
  bible: {
    getChapter: (version: string, book: string, chapter: number) => {
      return ipcRenderer.invoke("hfb:get-bible-chapter", version, book, chapter);
    }
  }
});
