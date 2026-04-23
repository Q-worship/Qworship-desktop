import { app, BrowserWindow, shell, ipcMain, session, systemPreferences } from 'electron';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { NdiManager } from './ndi-manager.js';

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

// ─── Window references ────────────────────────────────────────────────────────

let win: BrowserWindow | null;
let lowerThirdWindow: BrowserWindow | null = null;
let mainPresentationWindow: BrowserWindow | null = null;
let deepLinkUrl: string | null = null;

// ─── NDI ─────────────────────────────────────────────────────────────────────

let ndiManager: NdiManager | null = null;
let statsInterval: ReturnType<typeof setInterval> | null = null;

// ─── CPU stats ────────────────────────────────────────────────────────────────

let _lastCpu = os.cpus().map((c) => ({ ...c.times }));

function getCpuPercent(): number {
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
  return total > 0 ? Math.round(((total - idle) / total) * 100) : 0;
}

// ─── Hidden window factory ────────────────────────────────────────────────────

function createHiddenRendererWindow(rendererType: 'lowerThird' | 'mainPresentation'): BrowserWindow {
  const win = new BrowserWindow({
    width: 1920,
    height: 1080,
    // enableLargerThanScreen is deprecated in modern Electron — bounds handles this
    show: false,
    transparent: true,
    backgroundColor: '#00000000',
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false, // allow local file:// assets from public dir
      preload: path.join(__dirname, 'preload.cjs'),
    },
  });

  // Load the static HTML from the Vite public folder (copied to dist in prod)
  const htmlFile = rendererType === 'lowerThird' ? 'lower-third.html' : 'main-presentation.html';

  if (VITE_DEV_SERVER_URL) {
    // Dev: Vite serves public files at the root
    win.loadURL(`${VITE_DEV_SERVER_URL}renderer/${htmlFile}`);
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'renderer', htmlFile));
  }

  win.webContents.on('did-finish-load', () => {
    console.log(`[RendererWindow:${rendererType}] page loaded`);
  });

  win.webContents.on('did-fail-load', (_e, code, desc) => {
    console.error(`[RendererWindow:${rendererType}] load failed:`, code, desc);
  });

  return win;
}

// ─── NDI stream control ───────────────────────────────────────────────────────

interface NdiSource {
  url: string;
  ndiName: string;
}

function startNdiStreams(sources: NdiSource[]) {
  console.log('[NDI] startNdiStreams', sources);

  stopNdiStreams();

  ndiManager = new NdiManager();

  const grandioseError = NdiManager.getGrandioseError();
  if (grandioseError) {
    console.error('[NDI] Grandiose error:', grandioseError);
    win?.webContents.send('ndi-error', grandioseError);
    return;
  }

  // Create hidden windows if not already created
  if (!lowerThirdWindow || lowerThirdWindow.isDestroyed()) {
    lowerThirdWindow = createHiddenRendererWindow('lowerThird');
  }
  if (!mainPresentationWindow || mainPresentationWindow.isDestroyed()) {
    mainPresentationWindow = createHiddenRendererWindow('mainPresentation');
  }

  const windows = [lowerThirdWindow, mainPresentationWindow];

  sources.forEach((src, i) => {
    if (!src.ndiName) {
      console.warn(`[NDI] Source ${i} missing ndiName, skipping`);
      return;
    }

    const rendererWin = windows[i];
    if (!rendererWin || rendererWin.isDestroyed()) return;

    const sender = ndiManager!.createSender(i, src.ndiName, 1920, 1080);
    let frameLogged = false;

    rendererWin.webContents.once('did-finish-load', () => {
      setTimeout(() => {
        rendererWin.webContents.setFrameRate(60);

        rendererWin.webContents.on('paint', (_event, _dirty, image) => {
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
          } catch (err: unknown) {
            console.error(`[NDI] Frame error for source ${i}:`, (err as Error).message);
          }
        });

        console.log(`[NDI] Paint listener registered for source ${i}`);
      }, 500);
    });
  });

  // Live stats ticker — sends fps, bitrate, cpu, ram every second
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
      }),
    );

    win.webContents.send('ndi-stats-update', {
      cpu: getCpuPercent(),
      ram: Math.round(mem.rss / 1024 / 1024),
      sources: [
        { fps: fps[0], bitrateMbps: bitrate[0], active: !!(lowerThirdWindow && !lowerThirdWindow.isDestroyed()) },
        { fps: fps[1], bitrateMbps: bitrate[1], active: !!(mainPresentationWindow && !mainPresentationWindow.isDestroyed()) },
      ],
      previews,
    });
  }, 1000);
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

// ─── Force single instance ────────────────────────────────────────────────────

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, commandLine) => {
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
    const uri = commandLine.find(arg => arg.startsWith('qworship://'));
    if (uri) handleProtocolUri(uri);
  });

  if (process.defaultApp) {
    if (process.argv.length >= 2) {
      app.setAsDefaultProtocolClient('qworship', process.execPath, [path.resolve(process.argv[1])]);
    }
  } else {
    app.setAsDefaultProtocolClient('qworship');
  }

  app.whenReady().then(() => {
    session.defaultSession.setPermissionRequestHandler((_wc, permission, callback) => {
      const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
      callback(allowed.includes(permission));
    });
    session.defaultSession.setPermissionCheckHandler((_wc, permission) => {
      const allowed = ['microphone', 'camera', 'media', 'audioCapture', 'videoCapture'];
      return allowed.includes(permission);
    });

    if (process.platform === 'darwin') {
      systemPreferences.askForMediaAccess('microphone').then((granted) => {
        console.log('OS-level microphone permission granted:', granted);
      }).catch(err => console.error('OS-level microphone permission error:', err));
    }

    createWindow();
  });

  app.on('open-url', (event, url) => {
    event.preventDefault();
    if (app.isReady()) {
      handleProtocolUri(url);
    } else {
      deepLinkUrl = url;
    }
  });
}

// ─── Protocol handler ─────────────────────────────────────────────────────────

function handleProtocolUri(url: string) {
  console.log('Received deep link:', url);
  deepLinkUrl = url;
  if (win && win.webContents) {
    win.webContents.send('deep-link-payload', url);
  }
}

// ─── IPC handlers ─────────────────────────────────────────────────────────────

ipcMain.on('request-deep-link', () => {
  if (deepLinkUrl && win && win.webContents) {
    win.webContents.send('deep-link-payload', deepLinkUrl);
    deepLinkUrl = null;
  }
});

ipcMain.on('open-external-url', (_event, url: string) => {
  if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
    shell.openExternal(url);
  }
});

// ── NDI IPC ────────────────────────────────────────────────────────────────────

ipcMain.handle('ndi-start-stream', (_event, sources: NdiSource[]) => {
  startNdiStreams(sources);
  return { ok: true };
});

ipcMain.handle('ndi-stop-stream', () => {
  stopNdiStreams();
  return { ok: true };
});

ipcMain.handle('ndi-get-grandiose-error', () => {
  return NdiManager.getGrandioseError();
});

// ── Renderer state push ────────────────────────────────────────────────────────
// The React app calls window.api.renderer.updateState('lowerThird' | 'mainPresentation', state)
// which translates to this IPC message. We forward the state to the correct hidden window.

ipcMain.on('update-renderer-state', (_event, type: 'lowerThird' | 'mainPresentation', state: unknown) => {
  const target = type === 'lowerThird' ? lowerThirdWindow : mainPresentationWindow;
  if (target && !target.isDestroyed()) {
    target.webContents.send('state-update', state);
  }
});

// ─── Main window ──────────────────────────────────────────────────────────────

function createWindow() {
  win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    show: false,
    titleBarStyle: 'hiddenInset',
    icon: path.join(process.env.VITE_PUBLIC!, 'favicon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
    },
  });

  win.on('ready-to-show', () => {
    win?.show();
  });

  // ── Crash Detection ──────────────────────────────────────────
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
    if (level >= 2) {
      console.error(`🔴 [RENDERER ERROR] ${message} (${sourceId}:${line})`);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1') || url.startsWith('file://')) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          fullscreen: false,
          width: 1024,
          height: 768,
          frame: true,
          title: 'Qworship Live Presentation',
          webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
          },
        },
      };
    }
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
      deepLinkUrl = null;
    }
  });
}

app.on('window-all-closed', () => {
  stopNdiStreams();
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
