"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("node:path");
const node_url = require("node:url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let liveWin = null;
let deepLinkUrl = null;
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", (event, commandLine, workingDirectory) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const uri = commandLine.find((arg) => arg.startsWith("qworship://"));
    if (uri) {
      handleProtocolUri(uri);
    }
  });
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      electron.app.setAsDefaultProtocolClient("qworship", process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    electron.app.setAsDefaultProtocolClient("qworship");
  }
  electron.app.whenReady().then(() => {
    electron.session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
      callback(allowed.includes(permission));
    });
    electron.session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
      return allowed.includes(permission);
    });
    if (process.platform === "darwin") {
      electron.systemPreferences.askForMediaAccess("microphone").then((granted) => {
        console.log("OS-level microphone permission granted:", granted);
      }).catch((err) => console.error("OS-level microphone permission error:", err));
    }
    createWindow();
  });
  electron.app.on("open-url", (event, url) => {
    event.preventDefault();
    if (electron.app.isReady()) {
      handleProtocolUri(url);
    } else {
      deepLinkUrl = url;
    }
  });
}
function handleProtocolUri(url) {
  console.log("Received deep link:", url);
  deepLinkUrl = url;
  if (win && win.webContents) {
    win.webContents.send("deep-link-payload", url);
  }
}
electron.ipcMain.on("request-deep-link", () => {
  if (deepLinkUrl && win && win.webContents) {
    win.webContents.send("deep-link-payload", deepLinkUrl);
    deepLinkUrl = null;
  }
});
electron.ipcMain.on("open-external-url", (_event, url) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    electron.shell.openExternal(url);
  }
});
electron.ipcMain.on("project-slide", (_event, data) => {
  liveWin == null ? void 0 : liveWin.webContents.send("project-slide", data);
});
electron.ipcMain.on("project-bible-verse", (_event, data) => {
  liveWin == null ? void 0 : liveWin.webContents.send("project-bible-verse", data);
});
electron.ipcMain.on("clear-projection", (_event, data) => {
  liveWin == null ? void 0 : liveWin.webContents.send("clear-projection", data);
});
electron.ipcMain.on("close-live", () => {
  if (liveWin && !liveWin.isDestroyed()) {
    liveWin.webContents.send("close-live");
    liveWin.close();
  }
});
electron.ipcMain.on("live-slide-changed", (_event, data) => {
  win == null ? void 0 : win.webContents.send("live-slide-changed", data);
});
electron.ipcMain.on("live-ready", () => {
  win == null ? void 0 : win.webContents.send("live-ready");
});
function createWindow() {
  const { session: session2 } = require("electron");
  session2.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
    callback(allowed.includes(permission));
  });
  session2.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ["microphone", "camera", "media", "audioCapture", "videoCapture"];
    return allowed.includes(permission);
  });
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    // Don't show immediately to prevent white flash
    titleBarStyle: "hiddenInset",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
      // Necessary if they use <webview> for pricing
    }
  });
  win.on("ready-to-show", () => {
    win == null ? void 0 : win.show();
  });
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error("⚠️ [RENDERER CRASHED]", details.reason, "exitCode:", details.exitCode);
  });
  win.on("unresponsive", () => {
    console.error("⚠️ [RENDERER UNRESPONSIVE] The renderer process is not responding");
  });
  win.on("responsive", () => {
    console.log("✅ [RENDERER RESPONSIVE] The renderer process recovered");
  });
  win.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    if (level >= 2) {
      console.error(`🔴 [RENDERER ERROR] ${message} (${sourceId}:${line})`);
    }
  });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1") || url.startsWith("file://")) {
      const { screen } = require("electron");
      const displays = screen.getAllDisplays();
      const externalDisplay = displays.find((display) => {
        return display.bounds.x !== 0 || display.bounds.y !== 0;
      });
      let windowOptions = {
        title: "Qworship Live Presentation",
        webPreferences: {
          preload: path.join(__dirname$1, "preload.cjs"),
          nodeIntegration: false,
          contextIsolation: true
        }
      };
      if (externalDisplay) {
        windowOptions = {
          ...windowOptions,
          x: externalDisplay.bounds.x,
          y: externalDisplay.bounds.y,
          width: externalDisplay.bounds.width,
          height: externalDisplay.bounds.height,
          fullscreen: true,
          frame: false,
          alwaysOnTop: false
        };
      } else {
        windowOptions = {
          ...windowOptions,
          width: 1024,
          height: 768,
          fullscreen: false,
          frame: true,
          resizable: true,
          maximizable: true
        };
      }
      return {
        action: "allow",
        overrideBrowserWindowOptions: windowOptions
      };
    }
    if (url.startsWith("http:") || url.startsWith("https:")) {
      electron.shell.openExternal(url);
    }
    return { action: "deny" };
  });
  win.webContents.on("did-create-window", (childWin) => {
    liveWin = childWin;
    childWin.on("closed", () => {
      liveWin = null;
      win == null ? void 0 : win.webContents.send("live-window-closed");
    });
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
  win.webContents.on("did-finish-load", () => {
    if (deepLinkUrl) {
      handleProtocolUri(deepLinkUrl);
      deepLinkUrl = null;
    }
  });
}
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
    win = null;
  }
});
electron.app.on("activate", () => {
  if (electron.BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
exports.MAIN_DIST = MAIN_DIST;
exports.RENDERER_DIST = RENDERER_DIST;
exports.VITE_DEV_SERVER_URL = VITE_DEV_SERVER_URL;
