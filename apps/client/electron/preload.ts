import { contextBridge, ipcRenderer } from 'electron';

// ─── Main window API ──────────────────────────────────────────────────────────
// Exposed to the React app for controlling deep links, auth, and the new
// NDI streaming / local renderer pipeline.

contextBridge.exposeInMainWorld('api', {
  // ── Deep link (existing) ────────────────────────────────────────────────────
  onDeepLinkPayload: (callback: (data: unknown) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, data: unknown) => callback(data);
    ipcRenderer.on('deep-link-payload', subscription);
    return () => ipcRenderer.removeListener('deep-link-payload', subscription);
  },
  requestInitialDeepLink: () => {
    ipcRenderer.send('request-deep-link');
  },
  openWebAuth: (url: string) => {
    ipcRenderer.send('open-external-url', url);
  },

  // ── NDI streaming control ───────────────────────────────────────────────────
  ndi: {
    /** Start NDI streams for both renderers using the provided source configs. */
    startStream: (sources: Array<{ url: string; ndiName: string }>) =>
      ipcRenderer.invoke('ndi-start-stream', sources),
    /** Stop all NDI streams and destroy hidden windows. */
    stopStream: () => ipcRenderer.invoke('ndi-stop-stream'),
    /** Returns the current NDI error object if grandiose failed to load, or null. */
    getGrandioseError: () => ipcRenderer.invoke('ndi-get-grandiose-error'),
    /** Subscribe to live stats updates (fps, bitrate, cpu, ram). */
    onStatsUpdate: (callback: (stats: unknown) => void) => {
      const sub = (_event: Electron.IpcRendererEvent, stats: unknown) => callback(stats);
      ipcRenderer.on('ndi-stats-update', sub);
      return () => ipcRenderer.removeListener('ndi-stats-update', sub);
    },
    /** Subscribe to NDI error events (e.g., grandiose load failure). */
    onError: (callback: (err: unknown) => void) => {
      const sub = (_event: Electron.IpcRendererEvent, err: unknown) => callback(err);
      ipcRenderer.on('ndi-error', sub);
      return () => ipcRenderer.removeListener('ndi-error', sub);
    },
  },

  // ── Local renderer state push ───────────────────────────────────────────────
  renderer: {
    /**
     * Push a state update to one of the hidden offscreen renderer windows.
     * @param type  'lowerThird' | 'mainPresentation'
     * @param state The full state object matching the renderer's render() input.
     */
    updateState: (type: 'lowerThird' | 'mainPresentation', state: unknown) => {
      ipcRenderer.send('update-renderer-state', type, state);
    },
  },
});

// ─── Hidden renderer window API ───────────────────────────────────────────────
// Exposed only to the offscreen BrowserWindows that load lower-third.html
// and main-presentation.html. The React app does NOT use this API.

contextBridge.exposeInMainWorld('qworshipRendererApi', {
  /**
   * Listen for state updates pushed from the main process.
   * Returns an unsubscribe function.
   */
  onStateUpdate: (callback: (state: unknown) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, state: unknown) => callback(state);
    ipcRenderer.on('state-update', sub);
    return () => ipcRenderer.removeListener('state-update', sub);
  },
});
