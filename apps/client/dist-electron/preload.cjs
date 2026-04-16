"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("api", {
  onDeepLinkPayload: (callback) => {
    const subscription = (_event, data) => callback(data);
    electron.ipcRenderer.on("deep-link-payload", subscription);
    return () => electron.ipcRenderer.removeListener("deep-link-payload", subscription);
  },
  // Allows the React app to request the deep link if it booted before main sent it
  requestInitialDeepLink: () => {
    electron.ipcRenderer.send("request-deep-link");
  },
  openWebAuth: (url) => {
    electron.ipcRenderer.send("open-external-url", url);
  },
  // ── STT / Hands-Free Bible IPC ──────────────────────────
  stt: {
    /** Send a PCM16 audio array buffer to the main process VoskService */
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
    /** Get the current STT engine status */
    getStatus: () => {
      return electron.ipcRenderer.invoke("hfb:get-status");
    },
    /** Listen for partial transcript events from the main process */
    onTranscriptPartial: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on("stt:transcript:partial", handler);
      return () => electron.ipcRenderer.removeListener("stt:transcript:partial", handler);
    },
    /** Listen for final transcript events from the main process */
    onTranscriptFinal: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on("stt:transcript:final", handler);
      return () => electron.ipcRenderer.removeListener("stt:transcript:final", handler);
    },
    onStatusChange: (callback) => {
      const handler = (_event, status, message) => callback(status, message);
      electron.ipcRenderer.on("stt:status", handler);
      return () => electron.ipcRenderer.removeListener("stt:status", handler);
    },
    /** Listen for command transcript events from the highly accurate stream */
    onCommandFinal: (callback) => {
      const handler = (_event, text) => callback(text);
      electron.ipcRenderer.on("stt:command:final", handler);
      return () => electron.ipcRenderer.removeListener("stt:command:final", handler);
    }
  },
  // ── Live Presentation IPC ─────────────────────────────────
  live: {
    sendSync: (payload) => {
      electron.ipcRenderer.send("live:message", payload);
    },
    onMessage: (callback) => {
      const handler = (_event, payload) => callback(payload);
      electron.ipcRenderer.on("live:message", handler);
      return () => electron.ipcRenderer.removeListener("live:message", handler);
    },
    onWindowClosed: (callback) => {
      const handler = () => callback();
      electron.ipcRenderer.on("live:window-closed", handler);
      return () => electron.ipcRenderer.removeListener("live:window-closed", handler);
    }
  },
  // ── Bible SQLite IPC ──────────────────────────────────────
  bible: {
    getChapter: (version, book, chapter) => {
      return electron.ipcRenderer.invoke("hfb:get-bible-chapter", version, book, chapter);
    }
  }
});
