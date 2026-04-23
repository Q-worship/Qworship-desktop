"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("node:path");
const os = require("node:os");
const node_url = require("node:url");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
let grandiose = null;
let grandioseError = null;
try {
  grandiose = require("@stagetimerio/grandiose");
  console.log("[NdiManager] grandiose module loaded successfully");
} catch (e) {
  const err = e;
  console.error(
    "[NdiManager] CRITICAL: grandiose native module could not be loaded.\nMake sure the NDI Runtime is installed.\nDownload from: https://www.ndi.tv/tools/\nError:",
    err.message
  );
  grandioseError = {
    message: "NDI Runtime not found",
    details: err.message,
    solution: "Download and install NDI Tools from https://www.ndi.tv/tools/"
  };
}
class NdiSender {
  constructor(index, name, width, height) {
    __publicField(this, "_index");
    __publicField(this, "_name");
    __publicField(this, "_width");
    __publicField(this, "_height");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __publicField(this, "_sender", null);
    __publicField(this, "_frameCount", 0);
    __publicField(this, "_lastFpsCheck", Date.now());
    __publicField(this, "_fps", 0);
    __publicField(this, "_bytesSent", 0);
    __publicField(this, "_lastBitCheck", Date.now());
    __publicField(this, "_bitrateMbps", 0);
    this._index = index;
    this._name = name;
    this._width = width;
    this._height = height;
    this._init();
  }
  async _init() {
    if (!grandiose) return;
    try {
      const senderObj = await grandiose.send({
        name: this._name,
        clockVideo: true,
        clockAudio: false
      });
      this._sender = senderObj;
      console.log(`[NdiSender ${this._index}] NDI sender "${this._name}" initialised`);
    } catch (e) {
      console.error(`[NdiSender ${this._index}] Failed to create NDI sender:`, e.message);
    }
  }
  sendFrame(bgraBuffer, width, height) {
    if (!this._sender) return;
    this._frameCount++;
    this._bytesSent += bgraBuffer.byteLength;
    const now = Date.now();
    if (now - this._lastFpsCheck >= 1e3) {
      this._fps = this._frameCount;
      this._frameCount = 0;
      this._lastFpsCheck = now;
    }
    if (now - this._lastBitCheck >= 1e3) {
      this._bitrateMbps = parseFloat((this._bytesSent * 8 / 1e6).toFixed(1));
      this._bytesSent = 0;
      this._lastBitCheck = now;
    }
    try {
      this._sender.video({
        xres: width,
        yres: height,
        frameRateN: 6e4,
        frameRateD: 1001,
        pictureAspectRatio: width / height,
        frameFormatType: grandiose.FORMAT_TYPE_PROGRESSIVE,
        fourCC: 1095911234,
        // BGRA
        lineStrideBytes: width * 4,
        data: bgraBuffer
      }).catch(() => {
      });
    } catch (e) {
      console.error(`[NdiSender ${this._index}] sendFrame sync error:`, e.message);
    }
  }
  get fps() {
    return this._fps;
  }
  get bitrateMbps() {
    return this._bitrateMbps;
  }
  destroy() {
    if (this._sender) {
      try {
        this._sender.destroy();
      } catch (_) {
      }
      this._sender = null;
    }
  }
}
class NdiManager {
  constructor() {
    __publicField(this, "_senders", [null, null]);
  }
  static getGrandioseError() {
    return grandioseError;
  }
  createSender(index, name, width, height) {
    if (this._senders[index]) this._senders[index].destroy();
    const s = new NdiSender(index, name, width, height);
    this._senders[index] = s;
    return s;
  }
  getFpsStats() {
    return this._senders.map((s) => s ? s.fps : 0);
  }
  getBitrateStats() {
    return this._senders.map((s) => s ? s.bitrateMbps : 0);
  }
  destroy() {
    this._senders.forEach((s) => s && s.destroy());
    this._senders = [null, null];
  }
}
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let lowerThirdWindow = null;
let mainPresentationWindow = null;
let deepLinkUrl = null;
let ndiManager = null;
let statsInterval = null;
let _lastCpu = os.cpus().map((c) => ({ ...c.times }));
function getCpuPercent() {
  const cpus = os.cpus();
  let total = 0;
  let idle = 0;
  cpus.forEach((cpu, i) => {
    const prev = _lastCpu[i];
    const curr = cpu.times;
    const dUser = curr.user - prev.user;
    const dNice = curr.nice - prev.nice;
    const dSys = curr.sys - prev.sys;
    const dIrq = curr.irq - prev.irq;
    const dIdle = curr.idle - prev.idle;
    const tTotal = dUser + dNice + dSys + dIrq + dIdle;
    total += tTotal;
    idle += dIdle;
  });
  _lastCpu = cpus.map((c) => ({ ...c.times }));
  return total > 0 ? Math.round((total - idle) / total * 100) : 0;
}
function createHiddenRendererWindow(rendererType) {
  const win2 = new electron.BrowserWindow({
    width: 1920,
    height: 1080,
    // enableLargerThanScreen is deprecated in modern Electron — bounds handles this
    show: false,
    transparent: true,
    backgroundColor: "#00000000",
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
      // allow local file:// assets from public dir
      preload: path.join(__dirname$1, "preload.cjs")
    }
  });
  const htmlFile = rendererType === "lowerThird" ? "lower-third.html" : "main-presentation.html";
  if (VITE_DEV_SERVER_URL) {
    win2.loadURL(`${VITE_DEV_SERVER_URL}renderer/${htmlFile}`);
  } else {
    win2.loadFile(path.join(RENDERER_DIST, "renderer", htmlFile));
  }
  win2.webContents.on("did-finish-load", () => {
    console.log(`[RendererWindow:${rendererType}] page loaded`);
  });
  win2.webContents.on("did-fail-load", (_e, code, desc) => {
    console.error(`[RendererWindow:${rendererType}] load failed:`, code, desc);
  });
  return win2;
}
function startNdiStreams(sources) {
  console.log("[NDI] startNdiStreams", sources);
  stopNdiStreams();
  ndiManager = new NdiManager();
  const grandioseError2 = NdiManager.getGrandioseError();
  if (grandioseError2) {
    console.error("[NDI] Grandiose error:", grandioseError2);
    win == null ? void 0 : win.webContents.send("ndi-error", grandioseError2);
    return;
  }
  if (!lowerThirdWindow || lowerThirdWindow.isDestroyed()) {
    lowerThirdWindow = createHiddenRendererWindow("lowerThird");
  }
  if (!mainPresentationWindow || mainPresentationWindow.isDestroyed()) {
    mainPresentationWindow = createHiddenRendererWindow("mainPresentation");
  }
  const windows = [lowerThirdWindow, mainPresentationWindow];
  sources.forEach((src, i) => {
    if (!src.ndiName) {
      console.warn(`[NDI] Source ${i} missing ndiName, skipping`);
      return;
    }
    const rendererWin = windows[i];
    if (!rendererWin || rendererWin.isDestroyed()) return;
    const sender = ndiManager.createSender(i, src.ndiName, 1920, 1080);
    let frameLogged = false;
    rendererWin.webContents.once("did-finish-load", () => {
      setTimeout(() => {
        rendererWin.webContents.setFrameRate(60);
        rendererWin.webContents.on("paint", (_event, _dirty, image) => {
          if (!frameLogged) {
            console.log(`[NDI] First frame for source ${i} (${src.ndiName})`);
            frameLogged = true;
          }
          try {
            if (!image) return;
            const frameData = image.getBitmap();
            if (!frameData) return;
            const size = image.getSize();
            sender.sendFrame(frameData, size.width, size.height);
          } catch (err) {
            console.error(`[NDI] Frame error for source ${i}:`, err.message);
          }
        });
        console.log(`[NDI] Paint listener registered for source ${i}`);
      }, 500);
    });
  });
  statsInterval = setInterval(async () => {
    if (!win || win.isDestroyed()) return;
    const mem = process.memoryUsage();
    const fps = ndiManager ? ndiManager.getFpsStats() : [0, 0];
    const bitrate = ndiManager ? ndiManager.getBitrateStats() : [0, 0];
    const previews = await Promise.all(
      windows.map(async (w) => {
        if (!w || w.isDestroyed()) return null;
        try {
          const img = await w.webContents.capturePage();
          return img ? img.resize({ width: 480 }).toDataURL() : null;
        } catch {
          return null;
        }
      })
    );
    win.webContents.send("ndi-stats-update", {
      cpu: getCpuPercent(),
      ram: Math.round(mem.rss / 1024 / 1024),
      sources: [
        { fps: fps[0], bitrateMbps: bitrate[0], active: !!(lowerThirdWindow && !lowerThirdWindow.isDestroyed()) },
        { fps: fps[1], bitrateMbps: bitrate[1], active: !!(mainPresentationWindow && !mainPresentationWindow.isDestroyed()) }
      ],
      previews
    });
  }, 1e3);
}
function stopNdiStreams() {
  if (statsInterval) {
    clearInterval(statsInterval);
    statsInterval = null;
  }
  if (lowerThirdWindow && !lowerThirdWindow.isDestroyed()) {
    lowerThirdWindow.destroy();
    lowerThirdWindow = null;
  }
  if (mainPresentationWindow && !mainPresentationWindow.isDestroyed()) {
    mainPresentationWindow.destroy();
    mainPresentationWindow = null;
  }
  if (ndiManager) {
    ndiManager.destroy();
    ndiManager = null;
  }
}
const gotTheLock = electron.app.requestSingleInstanceLock();
if (!gotTheLock) {
  electron.app.quit();
} else {
  electron.app.on("second-instance", (_event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const uri = commandLine.find((arg) => arg.startsWith("qworship://"));
    if (uri) handleProtocolUri(uri);
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
electron.ipcMain.handle("ndi-start-stream", (_event, sources) => {
  startNdiStreams(sources);
  return { ok: true };
});
electron.ipcMain.handle("ndi-stop-stream", () => {
  stopNdiStreams();
  return { ok: true };
});
electron.ipcMain.handle("ndi-get-grandiose-error", () => {
  return NdiManager.getGrandioseError();
});
electron.ipcMain.on("update-renderer-state", (_event, type, state) => {
  const target = type === "lowerThird" ? lowerThirdWindow : mainPresentationWindow;
  if (target && !target.isDestroyed()) {
    target.webContents.send("state-update", state);
  }
});
function createWindow() {
  win = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: "hiddenInset",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
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
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          fullscreen: false,
          width: 1024,
          height: 768,
          frame: true,
          title: "Qworship Live Presentation",
          webPreferences: {
            preload: path.join(__dirname$1, "preload.cjs"),
            nodeIntegration: false,
            contextIsolation: true
          }
        }
      };
    }
    if (url.startsWith("http:") || url.startsWith("https:")) {
      electron.shell.openExternal(url);
    }
    return { action: "deny" };
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
  stopNdiStreams();
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
