import { app, BrowserWindow, shell, ipcMain, session } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

  app.whenReady().then(() => {
    // Grant microphone permission automatically so webkitSpeechRecognition doesn't hang
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
      callback(allowed.includes(permission));
    });
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
      return allowed.includes(permission);
    });
    createWindow();
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

  // Handle window.open() calls from the renderer
  win.webContents.setWindowOpenHandler(({ url }) => {
    // Allow internal localhost URLs (e.g. live presentation window) to open as a new Electron window
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          fullscreen: true,
          frame: false,
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
    app.quit();
    win = null;
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
