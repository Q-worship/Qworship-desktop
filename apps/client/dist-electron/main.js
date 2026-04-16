"use strict";
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
const electron = require("electron");
const path = require("node:path");
const node_url = require("node:url");
const fs = require("node:fs");
const os = require("node:os");
const module$1 = require("module");
const Database = require("better-sqlite3");
var _documentCurrentScript = typeof document !== "undefined" ? document.currentScript : null;
const _require = typeof require !== "undefined" ? require : module$1.createRequire(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href);
const koffi = _require("koffi");
let voskDir = "";
if (electron.app.isPackaged) {
  if (process.resourcesPath) {
    voskDir = path.join(process.resourcesPath, "app.asar.unpacked", "node_modules", "vosk");
  }
} else {
  voskDir = path.dirname(_require.resolve("vosk/package.json"));
}
let soname;
if (os.platform() === "win32") {
  let dllDirectory = path.resolve(path.join(voskDir, "lib", "win-x86_64"));
  if (process.env.Path) {
    process.env.Path = process.env.Path + path.delimiter + dllDirectory;
  } else {
    process.env.Path = dllDirectory;
  }
  soname = path.join(dllDirectory, "libvosk.dll");
} else if (os.platform() === "darwin") {
  soname = path.join(voskDir, "lib", "osx-universal", "libvosk.dylib");
} else {
  soname = path.join(voskDir, "lib", "linux-x86_64", "libvosk.so");
}
const libvosk = koffi.load(soname);
const vosk_model_ptr = koffi.pointer("vosk_model", koffi.opaque());
koffi.pointer("vosk_spk_model", koffi.opaque());
const vosk_recognizer_ptr = koffi.pointer("vosk_recognizer", koffi.opaque());
const vosk_set_log_level = libvosk.func("vosk_set_log_level", "void", ["int"]);
const vosk_model_new = libvosk.func("vosk_model_new", vosk_model_ptr, ["str"]);
const vosk_model_free = libvosk.func("vosk_model_free", "void", [vosk_model_ptr]);
const vosk_recognizer_new = libvosk.func("vosk_recognizer_new", vosk_recognizer_ptr, [vosk_model_ptr, "float"]);
const vosk_recognizer_new_grm = libvosk.func("vosk_recognizer_new_grm", vosk_recognizer_ptr, [vosk_model_ptr, "float", "str"]);
const vosk_recognizer_free = libvosk.func("vosk_recognizer_free", "void", [vosk_recognizer_ptr]);
const vosk_recognizer_accept_waveform = libvosk.func("vosk_recognizer_accept_waveform", "bool", [vosk_recognizer_ptr, "uint8_t*", "int"]);
const vosk_recognizer_result = libvosk.func("vosk_recognizer_result", "str", [vosk_recognizer_ptr]);
const vosk_recognizer_final_result = libvosk.func("vosk_recognizer_final_result", "str", [vosk_recognizer_ptr]);
const vosk_recognizer_partial_result = libvosk.func("vosk_recognizer_partial_result", "str", [vosk_recognizer_ptr]);
function setLogLevel(level) {
  vosk_set_log_level(level);
}
class Model {
  constructor(modelPath) {
    this.handle = vosk_model_new(modelPath);
  }
  free() {
    if (this.handle) {
      vosk_model_free(this.handle);
      this.handle = null;
    }
  }
}
class Recognizer {
  constructor(param) {
    if (param.grammar) {
      this.handle = vosk_recognizer_new_grm(param.model.handle, param.sampleRate, JSON.stringify(param.grammar));
    } else {
      this.handle = vosk_recognizer_new(param.model.handle, param.sampleRate);
    }
  }
  free() {
    if (this.handle) {
      vosk_recognizer_free(this.handle);
      this.handle = null;
    }
  }
  acceptWaveform(buffer) {
    return vosk_recognizer_accept_waveform(this.handle, buffer, buffer.length);
  }
  result() {
    return JSON.parse(vosk_recognizer_result(this.handle));
  }
  partialResult() {
    return JSON.parse(vosk_recognizer_partial_result(this.handle));
  }
  finalResult() {
    return JSON.parse(vosk_recognizer_final_result(this.handle));
  }
}
class VoskService {
  constructor() {
    this.model = null;
    this.recognizer = null;
    this.isListening = false;
  }
  initialize() {
    setLogLevel(-1);
    try {
      const modelPath = electron.app.isPackaged ? path.join(process.resourcesPath, "vosk-model") : path.join(electron.app.getAppPath(), "assets/vosk-model");
      if (!fs.existsSync(modelPath)) {
        throw new Error(`[VoskService] Model not found at ${modelPath}`);
      }
      console.log(`[VoskService] Loading model from ${modelPath}`);
      this.model = new Model(modelPath);
      console.log("[VoskService] Model loaded successfully");
    } catch (err) {
      console.error("[VoskService] Failed to load Vosk model:", err);
    }
  }
  startListening(window) {
    if (!this.model) {
      window.webContents.send("stt:status", "error", "Model not initialized");
      return;
    }
    if (this.isListening) return;
    const VOSK_GRAMMAR = [
      // Bible Books
      "genesis",
      "exodus",
      "leviticus",
      "numbers",
      "deuteronomy",
      "joshua",
      "judges",
      "ruth",
      "samuel",
      "kings",
      "chronicles",
      "ezra",
      "nehemiah",
      "esther",
      "job",
      "psalms",
      "proverbs",
      "ecclesiastes",
      "song of solomon",
      "song of songs",
      "isaiah",
      "jeremiah",
      "lamentations",
      "ezekiel",
      "daniel",
      "hosea",
      "joel",
      "amos",
      "obadiah",
      "jonah",
      "micah",
      "nahum",
      "habakkuk",
      "zephaniah",
      "haggai",
      "zechariah",
      "malachi",
      "matthew",
      "mark",
      "luke",
      "john",
      "acts",
      "romans",
      "corinthians",
      "galatians",
      "ephesians",
      "philippians",
      "colossians",
      "thessalonians",
      "timothy",
      "titus",
      "philemon",
      "hebrews",
      "james",
      "peter",
      "jude",
      "revelation",
      // Words that replace numbers in books
      "first",
      "second",
      "third",
      // Numbers (Spelled out)
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
      "twenty",
      "thirty",
      "forty",
      "fifty",
      "sixty",
      "seventy",
      "eighty",
      "ninety",
      "hundred",
      "thousand",
      // Control Commands & Glue
      "go to",
      "verse",
      "chapter",
      "search",
      "hands free",
      "open",
      "sleep",
      "wake up",
      "stop listening",
      "pause",
      "be quiet",
      "shut up",
      "mute",
      "resume",
      "unmute",
      "listen",
      "start listening",
      "bible",
      "next",
      "previous",
      "last",
      "jump",
      "forward",
      "back",
      "backward",
      "and",
      "through",
      "to",
      "of",
      "the",
      "i",
      "m",
      "am",
      // English Translation Versions
      "kjv",
      "nkjv",
      "amp",
      "msg",
      "esv",
      "niv",
      "king james",
      "version",
      "amplified",
      "message",
      "english standard",
      "new international",
      // Out-of-vocabulary fallback to prevent crashes on sneezing
      "[unk]"
    ];
    this.recognizer = new Recognizer({
      model: this.model,
      sampleRate: 16e3,
      grammar: VOSK_GRAMMAR
    });
    this.isListening = true;
    window.webContents.send("stt:status", "ready", "Vosk listening");
    console.log("[VoskService] Started listening");
  }
  stopListening(window) {
    if (!this.isListening) return;
    this.isListening = false;
    if (this.recognizer) {
      const finalRes = this.recognizer.finalResult();
      if (finalRes && finalRes.text) {
        window.webContents.send("stt:transcript:final", finalRes.text);
      }
      this.recognizer.free();
      this.recognizer = null;
    }
    window.webContents.send("stt:status", "idle");
    console.log("[VoskService] Stopped listening");
  }
  feedAudioChunk(window, arrayBuffer) {
    if (!this.isListening || !this.recognizer) return;
    try {
      const pcm16Buffer = Buffer.from(arrayBuffer);
      const isFinal = this.recognizer.acceptWaveform(pcm16Buffer);
      if (isFinal) {
        const result = this.recognizer.result();
        if (result && result.text) {
          window.webContents.send("stt:transcript:final", result.text);
        }
      } else {
        const partial = this.recognizer.partialResult();
        if (partial && partial.partial) {
          window.webContents.send("stt:transcript:partial", partial.partial);
        }
      }
    } catch (err) {
      console.error("[VoskService] Error processing audio chunk:", err);
    }
  }
  destroy() {
    if (this.recognizer) {
      this.recognizer.free();
      this.recognizer = null;
    }
    if (this.model) {
      this.model.free();
      this.model = null;
    }
  }
}
class BibleSQLiteService {
  constructor() {
    this.db = null;
    this.isLoaded = false;
  }
  async initialize(publicPath) {
    try {
      const dbPath = path.join(publicPath, "data", "bibles", "bible.db");
      if (!fs.existsSync(dbPath)) {
        console.warn(`[BibleSQLite] SQLite database not found at ${dbPath}. Falling back to RAM cache.`);
        return false;
      }
      this.db = new Database(dbPath, { readonly: true });
      this.isLoaded = true;
      console.log(`[BibleSQLite] Initialized successfully from ${dbPath}`);
      return true;
    } catch (err) {
      console.error("[BibleSQLite] Initialization failed:", err);
      return false;
    }
  }
  getChapter(version, book, chapter) {
    if (!this.isLoaded || !this.db) return null;
    try {
      const stmt = this.db.prepare(`
        SELECT number, text 
        FROM verses 
        WHERE version = ? AND book = ? AND chapter = ?
        ORDER BY number ASC
      `);
      return stmt.all(version.toLowerCase(), book, chapter);
    } catch (err) {
      console.error(`[BibleSQLite] Failed to query chapter ${version} ${book} ${chapter}:`, err);
      return null;
    }
  }
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isLoaded = false;
    }
  }
}
const __dirname$1 = path.dirname(node_url.fileURLToPath(typeof document === "undefined" ? require("url").pathToFileURL(__filename).href : _documentCurrentScript && _documentCurrentScript.tagName.toUpperCase() === "SCRIPT" && _documentCurrentScript.src || new URL("main.js", document.baseURI).href));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
let liveWindow = null;
let deepLinkUrl = null;
const sttService = new VoskService();
const bibleService = new BibleSQLiteService();
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
      electron.app.setAsDefaultProtocolClient("qworship", process.execPath, [
        path.resolve(process.argv[1])
      ]);
    }
  } else {
    electron.app.setAsDefaultProtocolClient("qworship");
  }
  electron.app.whenReady().then(async () => {
    electron.session.defaultSession.setPermissionRequestHandler(
      (_wc, permission, callback) => {
        const allowed = [
          "microphone",
          "camera",
          "media",
          "audioCapture",
          "videoCapture"
        ];
        callback(allowed.includes(permission));
      }
    );
    electron.session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = [
        "microphone",
        "camera",
        "media",
        "audioCapture",
        "videoCapture"
      ];
      return allowed.includes(permission);
    });
    if (process.platform === "darwin") {
      electron.systemPreferences.askForMediaAccess("microphone").then((granted) => {
        console.log("OS-level microphone permission granted:", granted);
      }).catch(
        (err) => console.error("OS-level microphone permission error:", err)
      );
    }
    createWindow();
    bibleService.initialize(process.env.VITE_PUBLIC).catch((err) => {
      console.error("[Main] Bible SQLite initialization failed:", err);
    });
    initializeVosk().catch((err) => {
      console.error("[Main] Vosk initialization failed:", err);
    });
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
async function initializeVosk() {
  try {
    sttService.initialize();
    console.log("[Main] Vosk STT initialized successfully");
  } catch (err) {
    console.error("[Main] Failed to initialize Vosk:", err);
  }
}
let _audioChunkCount = 0;
electron.ipcMain.on("hfb:audio-chunk", (event, rawData) => {
  const arrayBuffer = rawData.buffer || rawData;
  if (_audioChunkCount++ % 100 === 0) {
    console.log(`[Main] Audio chunk #${_audioChunkCount} dispatched to Vosk`);
  }
  if (win) {
    sttService.feedAudioChunk(win, arrayBuffer);
  }
});
electron.ipcMain.on("hfb:start-listening", () => {
  if (win) sttService.startListening(win);
});
electron.ipcMain.on("hfb:stop-listening", () => {
  if (win) sttService.stopListening(win);
});
electron.ipcMain.handle("hfb:get-status", () => {
  return "active";
});
electron.ipcMain.handle("hfb:get-bible-chapter", (_event, version, book, chapter) => {
  return bibleService.getChapter(version, book, chapter);
});
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
electron.ipcMain.on("live:message", (event, payload) => {
  if (win && event.sender === win.webContents) {
    if (liveWindow && !liveWindow.isDestroyed()) {
      liveWindow.webContents.send("live:message", payload);
    }
  } else if (liveWindow && event.sender === liveWindow.webContents) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("live:message", payload);
    }
  }
});
function createWindow() {
  const { session: session2 } = require("electron");
  session2.defaultSession.setPermissionRequestHandler(
    (_webContents, permission, callback) => {
      const allowed = [
        "microphone",
        "camera",
        "media",
        "audioCapture",
        "videoCapture"
      ];
      callback(allowed.includes(permission));
    }
  );
  session2.defaultSession.setPermissionCheckHandler(
    (_webContents, permission) => {
      const allowed = [
        "microphone",
        "camera",
        "media",
        "audioCapture",
        "videoCapture"
      ];
      return allowed.includes(permission);
    }
  );
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
    console.error(
      "⚠️ [RENDERER CRASHED]",
      details.reason,
      "exitCode:",
      details.exitCode
    );
  });
  win.on("unresponsive", () => {
    console.error(
      "⚠️ [RENDERER UNRESPONSIVE] The renderer process is not responding"
    );
  });
  win.on("responsive", () => {
    console.log("✅ [RENDERER RESPONSIVE] The renderer process recovered");
  });
  win.webContents.on("did-create-window", (childWindow, details) => {
    liveWindow = childWindow;
    childWindow.on("closed", () => {
      liveWindow = null;
      if (win && !win.isDestroyed()) {
        win.webContents.send("live:window-closed");
      }
    });
  });
  win.webContents.on(
    "console-message",
    (_event, level, message, line, sourceId) => {
      const prefix = level >= 2 ? "🔴 [RENDERER ERROR]" : "🔵 [RENDERER LOG]";
      console.log(`${prefix} ${message} (${sourceId}:${line})`);
    }
  );
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://localhost") || url.startsWith("http://127.0.0.1") || url.startsWith("file://")) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          fullscreen: false,
          // Changed from true so it appears as a distinct window
          width: 1024,
          height: 768,
          frame: true,
          // Allow user to drag it to an external display
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
  if (process.platform !== "darwin") {
    whisperService.shutdown().finally(() => {
      electron.app.quit();
    });
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
