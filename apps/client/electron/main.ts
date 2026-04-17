import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  session,
  systemPreferences,
  protocol,
  net,
} from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs";
import https from "node:https";

// ── Whisper / HFB Services ──────────────────────────────────────
import { VoskService } from "./services/voskService";
import { BibleSQLiteService } from "./services/bibleSqliteService";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.js
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - SystemJS only
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;
let liveWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// ── Whisper Instances ────────────────────────────────────────────
const sttService = new VoskService();
const bibleService = new BibleSQLiteService();

// Force protocol privileges so file:// allows secure constraints like getUserMedia APIs in packaging before app fires 'ready'
protocol.registerSchemesAsPrivileged([
  { scheme: 'file', privileges: { secure: true, bypassCSP: true, corsEnabled: true, supportFetchAPI: true } },
  { scheme: 'qworship-media', privileges: { standard: true, secure: true, bypassCSP: true, supportFetchAPI: true, corsEnabled: true } }
]);

// Force single instance application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle protocol on Windows/Linux during second instance
  app.on("second-instance", (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }

    // Command line usually contains the deep link uri as the last argument
    const uri = commandLine.find((arg) => arg.startsWith("qworship://"));
    if (uri) {
      handleProtocolUri(uri);
    }
  });

  // Handle setting up custom protocol for Windows
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient("qworship", process.execPath, [
        path.resolve(process.argv[1]),
      ]);
    }
  } else {
    app.setAsDefaultProtocolClient("qworship");
  }

  app.whenReady().then(async () => {
    // Grant microphone permission automatically so webkitSpeechRecognition doesn't hang
    session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(true));
    session.defaultSession.setPermissionCheckHandler(() => true);
    session.defaultSession.setDevicePermissionHandler(() => true);

    if (process.platform === "darwin") {
      // Required on macOS: Natively request OS-level microphone permission to prevent getUserMedia from hanging
      systemPreferences
        .askForMediaAccess("microphone")
        .then((granted) => {
          console.log("OS-level microphone permission granted:", granted);
        })
        .catch((err) =>
          console.error("OS-level microphone permission error:", err),
        );
    }

    createWindow();

    // Register local file protocol for media
    protocol.handle("qworship-media", (request) => {
      const filename = request.url.replace("qworship-media://", "");
      const mediaPath = path.join(app.getPath("userData"), "media", decodeURIComponent(filename));
      return net.fetch(`file://${mediaPath}`);
    });

    // Initialize Bible SQLite (non-blocking)
    bibleService.initialize(process.env.VITE_PUBLIC as string).catch(err => {
      console.error("[Main] Bible SQLite initialization failed:", err);
    });

    // ── Initialize Vosk STT (non-blocking) ──────────────
    initializeVosk().catch((err) => {
      console.error("[Main] Vosk initialization failed:", err);
    });
  });

  // Handle protocol on macOS
  app.on("open-url", (event, url) => {
    event.preventDefault();
    if (app.isReady()) {
      handleProtocolUri(url);
    } else {
      deepLinkUrl = url;
    }
  });
}

// ── Vosk Initialization ─────────────────────────────────────
async function initializeVosk() {
  try {
    sttService.initialize();
    
    // We send a success message to renderer directly since our Vosk implementation
    // pushes statuses directly to the webContents within the service
    // However, for initialization we just log it:
    console.log("[Main] Vosk STT initialized successfully");
  } catch (err) {
    console.error("[Main] Failed to initialize Vosk:", err);
  }
}

// ── Vosk IPC Handlers ───────────────────────────────────────
let _audioChunkCount = 0;
ipcMain.on("hfb:audio-chunk", (event, rawData: any) => {
  const arrayBuffer = rawData.buffer || rawData;
  if (_audioChunkCount++ % 100 === 0) {
    console.log(`[Main] Audio chunk #${_audioChunkCount} dispatched to Vosk`);
  }
  if (win) {
    sttService.feedAudioChunk(win, arrayBuffer);
  }
});

ipcMain.on("hfb:start-listening", () => {
  if (win) sttService.startListening(win);
});

ipcMain.on("hfb:stop-listening", () => {
  if (win) sttService.stopListening(win);
});

ipcMain.handle("hfb:get-status", () => {
  // VoskService internally keeps status, but for simplified IPC
  // we just return a static string because the events handle UI updates
  return "active";
});

ipcMain.handle("hfb:get-bible-chapter", (_event, version: string, book: string, chapter: number) => {
  return bibleService.getChapter(version, book, chapter);
});

ipcMain.handle("hfb:get-bible-status", () => {
  return bibleService.isLoaded;
});


// ── Media Downloader ───────────────────────────────────────────
ipcMain.handle("download-media", async (_event, url: string, filename: string) => {
  const mediaDir = path.join(app.getPath("userData"), "media");
  if (!fs.existsSync(mediaDir)) {
    fs.mkdirSync(mediaDir, { recursive: true });
  }

  const destPath = path.join(mediaDir, filename);

  // Skip if already downloaded
  if (fs.existsSync(destPath)) {
    return "qworship-media://" + encodeURIComponent(filename);
  }

  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve("qworship-media://" + encodeURIComponent(filename));
        });
      } else {
        file.close();
        fs.unlink(destPath, () => {});
        reject(new Error(`Server returned ${response.statusCode}`));
      }
    }).on("error", (err) => {
      file.close();
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
});

// ── Deep Link Handlers ─────────────────────────────────────────
function handleProtocolUri(url: string) {
  console.log("Received deep link:", url);
  deepLinkUrl = url; // ALWAYS save it so the renderer can fetch it safely anytime
  if (win && win.webContents) {
    win.webContents.send("deep-link-payload", url);
  }
}

ipcMain.on("request-deep-link", () => {
  if (deepLinkUrl && win && win.webContents) {
    win.webContents.send("deep-link-payload", deepLinkUrl);
    deepLinkUrl = null; // Consume it
  }
});

ipcMain.on("open-external-url", (_event, url) => {
  if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
    shell.openExternal(url);
  }
});

ipcMain.on("live:message", (event, payload) => {
  // If the message comes from the main window, send it to the live window
  if (win && event.sender === win.webContents) {
    if (payload?.type === "CLOSE_LIVE" && liveWindow && !liveWindow.isDestroyed()) {
      liveWindow.close();
      return;
    }

    if (liveWindow && !liveWindow.isDestroyed()) {
      liveWindow.webContents.send("live:message", payload);
    }
  } 
  // If from the live window, send to main window
  else if (liveWindow && event.sender === liveWindow.webContents) {
    if (win && !win.isDestroyed()) {
      win.webContents.send("live:message", payload);
    }
  }
});

function createWindow() {
  // Grant microphone (and camera) permissions automatically so webkitSpeechRecognition
  // does not hang waiting for a system dialog that Electron never shows in dev mode.
  const { session } = require("electron");
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(true));
  session.defaultSession.setPermissionCheckHandler(() => true);
  session.defaultSession.setDevicePermissionHandler(() => true);

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show immediately to prevent white flash
    titleBarStyle: "hiddenInset",
    icon: path.join(process.env.VITE_PUBLIC, "favicon.ico"),
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Necessary if they use <webview> for pricing
    },
  });

  // Wait until the renderer has painted its first frame before showing the window
  win.on("ready-to-show", () => {
    win?.show();
  });

  // ── Crash Detection ──────────────────────────────────────────
  // Detect when the renderer process crashes or becomes unresponsive
  win.webContents.on("render-process-gone", (_event, details) => {
    console.error(
      "⚠️ [RENDERER CRASHED]",
      details.reason,
      "exitCode:",
      details.exitCode,
    );
  });
  win.on("unresponsive", () => {
    console.error(
      "⚠️ [RENDERER UNRESPONSIVE] The renderer process is not responding",
    );
  });
  win.on("responsive", () => {
    console.log("✅ [RENDERER RESPONSIVE] The renderer process recovered");
  });
  
  win.webContents.on('did-create-window', (childWindow, details) => {
    // We assume any created window from main is the live presentation window
    liveWindow = childWindow;
    childWindow.on('closed', () => {
      liveWindow = null;
      if (win && !win.isDestroyed()) {
        win.webContents.send('live:window-closed');
      }
    });
  });

  win.webContents.on(
    "console-message",
    (_event, level, message, line, sourceId) => {
      // Forward all renderer console messages to main process terminal to diagnose the silent data death
      const prefix = level >= 2 ? "🔴 [RENDERER ERROR]" : "🔵 [RENDERER LOG]";
      console.log(`${prefix} ${message} (${sourceId}:${line})`);
    },
  );

  // Handle window.open() calls from the renderer
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow internal localhost URLs (e.g. live presentation window) and file:// URLs in production to open as a new Electron window
    if (
      url.startsWith("http://localhost") ||
      url.startsWith("http://127.0.0.1") ||
      url.startsWith("file://")
    ) {
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          fullscreen: false, // Changed from true so it appears as a distinct window
          width: 1024,
          height: 768,
          frame: true, // Allow user to drag it to an external display
          title: "Qworship Live Presentation",
          webPreferences: {
            preload: path.join(__dirname, "preload.cjs"),
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }
    // Send external URLs to the system browser
    if (url.startsWith("http:") || url.startsWith("https:")) {
      shell.openExternal(url);
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
      deepLinkUrl = null; // clear after sending
    }
  });
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    // Shut down STT before quitting
    sttService.destroy();
    app.quit();
    win = null;
  }
});

app.on("will-quit", () => {
  sttService.destroy();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
