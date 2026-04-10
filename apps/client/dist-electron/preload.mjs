import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld(
  "api",
  {
    onDeepLinkPayload: (callback) => {
      const subscription = (_event, data) => callback(data);
      ipcRenderer.on("deep-link-payload", subscription);
      return () => ipcRenderer.removeListener("deep-link-payload", subscription);
    },
    // Allows the React app to request the deep link if it booted before main sent it
    requestInitialDeepLink: () => {
      ipcRenderer.send("request-deep-link");
    },
    openWebAuth: (url) => {
      ipcRenderer.send("open-external-url", url);
    }
  }
);
