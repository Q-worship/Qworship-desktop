"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld(
  "api",
  {
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
    }
  }
);
electron.contextBridge.exposeInMainWorld(
  "electronLive",
  {
    // Outbound: dashboard sends these to the live window via main
    projectSlide: (data) => electron.ipcRenderer.send("project-slide", data),
    projectBibleVerse: (data) => electron.ipcRenderer.send("project-bible-verse", data),
    clearProjection: (data) => electron.ipcRenderer.send("clear-projection", data),
    closeLive: () => electron.ipcRenderer.send("close-live"),
    notifyReady: () => electron.ipcRenderer.send("live-ready"),
    notifySlideChanged: (data) => electron.ipcRenderer.send("live-slide-changed", data),
    // Inbound: subscribe to events sent from main to this window
    onProjectSlide: (callback) => {
      const fn = (_, data) => callback(data);
      electron.ipcRenderer.on("project-slide", fn);
      return () => electron.ipcRenderer.removeListener("project-slide", fn);
    },
    onProjectBibleVerse: (callback) => {
      const fn = (_, data) => callback(data);
      electron.ipcRenderer.on("project-bible-verse", fn);
      return () => electron.ipcRenderer.removeListener("project-bible-verse", fn);
    },
    onClearProjection: (callback) => {
      const fn = (_, data) => callback(data);
      electron.ipcRenderer.on("clear-projection", fn);
      return () => electron.ipcRenderer.removeListener("clear-projection", fn);
    },
    onCloseLive: (callback) => {
      const fn = () => callback();
      electron.ipcRenderer.on("close-live", fn);
      return () => electron.ipcRenderer.removeListener("close-live", fn);
    },
    onLiveReady: (callback) => {
      const fn = () => callback();
      electron.ipcRenderer.on("live-ready", fn);
      return () => electron.ipcRenderer.removeListener("live-ready", fn);
    },
    onLiveSlideChanged: (callback) => {
      const fn = (_, data) => callback(data);
      electron.ipcRenderer.on("live-slide-changed", fn);
      return () => electron.ipcRenderer.removeListener("live-slide-changed", fn);
    },
    onLiveWindowClosed: (callback) => {
      const fn = () => callback();
      electron.ipcRenderer.on("live-window-closed", fn);
      return () => electron.ipcRenderer.removeListener("live-window-closed", fn);
    }
  }
);
