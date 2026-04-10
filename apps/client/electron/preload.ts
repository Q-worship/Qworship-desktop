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
