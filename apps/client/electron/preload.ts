import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'api', {
    onDeepLinkPayload: (callback: (data: any) => void) => {
      const subscription = (_event: any, data: any) => callback(data);
      ipcRenderer.on('deep-link-payload', subscription);
      return () => ipcRenderer.removeListener('deep-link-payload', subscription);
    },
    // Allows the React app to request the deep link if it booted before main sent it
    requestInitialDeepLink: () => {
      ipcRenderer.send('request-deep-link');
    },
    openWebAuth: (url: string) => {
      ipcRenderer.send('open-external-url', url);
    }
  }
);

// Live Presentation IPC Bridge
// Dashboard → Main → Live Window (send projection commands)
// Live Window → Main → Dashboard (receive slide change events)
contextBridge.exposeInMainWorld(
  'electronLive', {
    // Outbound: dashboard sends these to the live window via main
    projectSlide: (data: any) => ipcRenderer.send('project-slide', data),
    projectBibleVerse: (data: any) => ipcRenderer.send('project-bible-verse', data),
    clearProjection: (data?: any) => ipcRenderer.send('clear-projection', data),
    closeLive: () => ipcRenderer.send('close-live'),
    notifyReady: () => ipcRenderer.send('live-ready'),
    notifySlideChanged: (data: any) => ipcRenderer.send('live-slide-changed', data),

    // Inbound: subscribe to events sent from main to this window
    onProjectSlide: (callback: (data: any) => void) => {
      const fn = (_: any, data: any) => callback(data);
      ipcRenderer.on('project-slide', fn);
      return () => ipcRenderer.removeListener('project-slide', fn);
    },
    onProjectBibleVerse: (callback: (data: any) => void) => {
      const fn = (_: any, data: any) => callback(data);
      ipcRenderer.on('project-bible-verse', fn);
      return () => ipcRenderer.removeListener('project-bible-verse', fn);
    },
    onClearProjection: (callback: (data: any) => void) => {
      const fn = (_: any, data: any) => callback(data);
      ipcRenderer.on('clear-projection', fn);
      return () => ipcRenderer.removeListener('clear-projection', fn);
    },
    onCloseLive: (callback: () => void) => {
      const fn = () => callback();
      ipcRenderer.on('close-live', fn);
      return () => ipcRenderer.removeListener('close-live', fn);
    },
    onLiveReady: (callback: () => void) => {
      const fn = () => callback();
      ipcRenderer.on('live-ready', fn);
      return () => ipcRenderer.removeListener('live-ready', fn);
    },
    onLiveSlideChanged: (callback: (data: any) => void) => {
      const fn = (_: any, data: any) => callback(data);
      ipcRenderer.on('live-slide-changed', fn);
      return () => ipcRenderer.removeListener('live-slide-changed', fn);
    },
    onLiveWindowClosed: (callback: () => void) => {
      const fn = () => callback();
      ipcRenderer.on('live-window-closed', fn);
      return () => ipcRenderer.removeListener('live-window-closed', fn);
    },
  }
);
