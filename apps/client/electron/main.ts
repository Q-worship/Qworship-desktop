import { app, BrowserWindow, shell, ipcMain, session, systemPreferences } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// ── Whisper / HFB Services ──────────────────────────────────────
import { WhisperService } from './services/whisperService';
import { WhisperModelManager } from './services/whisperModelManager';

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
process.env.APP_ROOT = path.join(__dirname, '..');

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - SystemJS only
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron');
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist');

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST;

let win: BrowserWindow | null;
let deepLinkUrl: string | null = null;

// ── Whisper Instances ────────────────────────────────────────────
const whisperService = new WhisperService();
const modelManager = new WhisperModelManager();
const DEFAULT_MODEL = 'ggml-small.en.bin';

// Force single instance application
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  // Handle protocol on Windows/Linux during second instance
  app.on('second-instance', (event, commandLine, workingDirectory) => {
    // Someone tried to run a second instance, we should focus our window.
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    
    // Command line usually contains the deep link uri as the last argument
    const uri = commandLine.find(arg => arg.startsWith('qworship://'));
    if (uri) {
      handleProtocolUri(uri);
    }
  });

  // Handle setting up custom protocol for Windows
  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('qworship', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('qworship');
  }

  app.whenReady().then(async () => {
    // Grant microphone permission automatically so webkitSpeechRecognition doesn't hang
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
      callback(allowed.includes(permission));
    });
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
      return allowed.includes(permission);
    });

    if (process.platform === 'darwin') {
      // Required on macOS: Natively request OS-level microphone permission to prevent getUserMedia from hanging
      systemPreferences.askForMediaAccess('microphone').then((granted) => {
        console.log("OS-level microphone permission granted:", granted);
      }).catch(err => console.error("OS-level microphone permission error:", err));
    }

    createWindow();

    // ── Initialize Whisper Model (non-blocking) ──────────────
    initializeWhisper().catch((err) => {
      console.error('[Main] Whisper initialization failed:', err);
    });
  });

  // Handle protocol on macOS
  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (app.isReady()) {
      handleProtocolUri(url);
    } else {
      deepLinkUrl = url;
    }
  });
}

// ── Whisper Initialization ─────────────────────────────────────
async function initializeWhisper() {
  try {
    // Download model if not present (sends progress to renderer)
    const modelPath = await modelManager.ensureModelExists(DEFAULT_MODEL, (progress) => {
      if (win && win.webContents) {
        win.webContents.send('hfb:model-download-progress', progress.percent, progress.downloadedMB, progress.totalMB);
      }
    });

    // Load the model into memory
    await whisperService.initialize(modelPath);

    // Forward whisper events to renderer
    whisperService.on('transcript-partial', (text: string) => {
      if (win && win.webContents) {
        win.webContents.send('hfb:transcript-partial', text);
      }
    });

    whisperService.on('transcript-final', (text: string) => {
      if (win && win.webContents) {
        win.webContents.send('hfb:transcript-final', text);
      }
    });

    whisperService.on('status-change', (status: string, message?: string) => {
      if (win && win.webContents) {
        win.webContents.send('hfb:status-change', status, message);
      }
    });

    console.log('[Main] Whisper initialized successfully');
  } catch (err) {
    console.error('[Main] Failed to initialize Whisper:', err);
  }
}

// ── Whisper IPC Handlers ───────────────────────────────────────
let _audioChunkCount = 0;
ipcMain.on('hfb:audio-chunk', (_event, rawData: any) => {
  // Electron IPC serializes ArrayBuffers into Node.js Buffer / Uint8Array objects.
  // We must use the .buffer property.
  const pcm16 = new Int16Array(
    rawData.buffer || rawData, 
    rawData.byteOffset || 0, 
    (rawData.byteLength || rawData.length) / 2
  );

  if (_audioChunkCount++ % 100 === 0) {
    let maxAmplitude = 0;
    for(let i=0; i < pcm16.length; i++) {
        const val = Math.abs(pcm16[i]);
        if(val > maxAmplitude) maxAmplitude = val;
    }
    console.log(`[Main] Audio chunk #${_audioChunkCount}. Peak amplitude: ${maxAmplitude}/32768`);
  }
  
  whisperService.feedAudioChunk(pcm16);
});

ipcMain.on('hfb:start-listening', () => {
  whisperService.startListening();
});

ipcMain.on('hfb:stop-listening', () => {
  whisperService.stopListening();
});

ipcMain.handle('hfb:get-status', () => {
  return whisperService.getStatus();
});

// ── Deep Link Handlers ─────────────────────────────────────────
function handleProtocolUri(url: string) {
  console.log('Received deep link:', url);
  deepLinkUrl = url; // ALWAYS save it so the renderer can fetch it safely anytime
  if (win && win.webContents) {
    win.webContents.send('deep-link-payload', url);
  }
}

ipcMain.on('request-deep-link', () => {
  if (deepLinkUrl && win && win.webContents) {
    win.webContents.send('deep-link-payload', deepLinkUrl);
    deepLinkUrl = null; // Consume it
  }
});

ipcMain.on('open-external-url', (_event, url) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

function createWindow() {
  // Grant microphone (and camera) permissions automatically so webkitSpeechRecognition
  // does not hang waiting for a system dialog that Electron never shows in dev mode.
  const { session } = require('electron');
  session.defaultSession.setPermissionRequestHandler((_webContents, permission, callback) => {
    const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
    callback(allowed.includes(permission));
  });
  session.defaultSession.setPermissionCheckHandler((_webContents, permission) => {
    const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
    return allowed.includes(permission);
  });

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false, // Don't show immediately to prevent white flash
    titleBarStyle: 'hiddenInset',
    icon: path.join(process.env.VITE_PUBLIC, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true, // Necessary if they use <webview> for pricing
    },
  });

  // Wait until the renderer has painted its first frame before showing the window
  win.on('ready-to-show', () => {
    win?.show();
  });

  // ── Crash Detection ──────────────────────────────────────────
  // Detect when the renderer process crashes or becomes unresponsive
  win.webContents.on('render-process-gone', (_event, details) => {
    console.error('⚠️ [RENDERER CRASHED]', details.reason, 'exitCode:', details.exitCode);
  });
  win.on('unresponsive', () => {
    console.error('⚠️ [RENDERER UNRESPONSIVE] The renderer process is not responding');
  });
  win.on('responsive', () => {
    console.log('✅ [RENDERER RESPONSIVE] The renderer process recovered');
  });
  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    // Forward all renderer console messages to main process terminal to diagnose the silent data death
    const prefix = level >= 2 ? '🔴 [RENDERER ERROR]' : '🔵 [RENDERER LOG]';
    console.log(`${prefix} ${message} (${sourceId}:${line})`);
  });

  // Handle window.open() calls from the renderer
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow internal localhost URLs (e.g. live presentation window) and file:// URLs in production to open as a new Electron window
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1') || url.startsWith('file://')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          fullscreen: false, // Changed from true so it appears as a distinct window
          width: 1024,
          height: 768,
          frame: true, // Allow user to drag it to an external display
          title: "Qworship Live Presentation",
          webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }
    // Send external URLs to the system browser
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'));
  }
  
  win.webContents.on('did-finish-load', () => {
    if (deepLinkUrl) {
      handleProtocolUri(deepLinkUrl);
      deepLinkUrl = null; // clear after sending
    }
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Shut down whisper before quitting
    whisperService.shutdown().finally(() => {
      app.quit();
    });
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
