import { create } from 'zustand';

// Display modes for live presentation
export type DisplayMode = 'none' | 'slides' | 'hfb-bible' | 'song' | 'on-screen-bible';

export interface DisplayModeState {
  // Current active display mode
  activeMode: DisplayMode;
  
  // Actions
  setMode: (mode: DisplayMode) => void;
  clearMode: () => void;
}

// BroadcastChannel for cross-window sync
const CHANNEL_NAME = 'display-mode-sync';
let broadcastChannel: BroadcastChannel | null = null;

// Initialize BroadcastChannel
const initBroadcastChannel = (store: any) => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    
    broadcastChannel.onmessage = (event) => {
      const { type, data } = event.data;
      
      switch (type) {
        case 'MODE_CHANGE':
          // Update local state without broadcasting again
          store.setState({ activeMode: data.mode }, false);
          break;
        case 'REQUEST_SYNC':
          // Another window is requesting current state
          broadcastChannel?.postMessage({
            type: 'SYNC_RESPONSE',
            data: { mode: store.getState().activeMode }
          });
          break;
        case 'SYNC_RESPONSE':
          // Received sync response from another window
          store.setState({ activeMode: data.mode }, false);
          break;
      }
    };
  }
};

export const useDisplayModeStore = create<DisplayModeState>((set, get) => {
  // Initialize broadcast channel synchronously to ensure we don't miss any broadcasts
  // when a new window opens (removing setTimeout to fix race condition)
  initBroadcastChannel({ setState: set, getState: get });
  
  return {
    activeMode: 'none',
    
    setMode: (mode: DisplayMode) => {
      set({ activeMode: mode });
      
      // Broadcast to other windows
      broadcastChannel?.postMessage({
        type: 'MODE_CHANGE',
        data: { mode }
      });
    },
    
    clearMode: () => {
      set({ activeMode: 'none' });
      
      // Broadcast to other windows
      broadcastChannel?.postMessage({
        type: 'MODE_CHANGE',
        data: { mode: 'none' }
      });
    }
  };
});

// Request sync from other windows (call on mount)
export const requestDisplayModeSync = () => {
  broadcastChannel?.postMessage({ type: 'REQUEST_SYNC' });
};

// Display mode labels for UI
export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  'none': 'None',
  'slides': 'Slides',
  'hfb-bible': 'HFB Bible',
  'song': 'Song',
  'on-screen-bible': 'On-Screen Bible'
};

// Display mode icons (using Lucide icon names)
export const DISPLAY_MODE_ICONS: Record<DisplayMode, string> = {
  'none': 'Monitor',
  'slides': 'Presentation',
  'hfb-bible': 'Mic',
  'song': 'Music',
  'on-screen-bible': 'BookOpen'
};
