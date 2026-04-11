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
