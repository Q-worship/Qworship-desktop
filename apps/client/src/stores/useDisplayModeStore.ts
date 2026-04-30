import { create } from "zustand";

// Display modes for live presentation content
export type DisplayMode = 'none' | 'slides' | 'hfb-bible' | 'song' | 'on-screen-bible';
export type ConnectionMethod = 'wired' | 'ndi' | 'both';
export type NDIResolution = '1920x1080' | '1280x720' | '3840x2160';
export type NDIFrameRate = '24' | '30' | '60';
export type NDIBandwidth = 'highest' | 'balanced' | 'lowest';
export type NDIColorFormat = 'uyvy422' | 'rgba' | 'bgra';

export interface NDISettings {
  resolution: NDIResolution;
  frameRate: NDIFrameRate;
  bandwidth: NDIBandwidth;
  colorFormat: NDIColorFormat;
  audioEnabled: boolean;
  alphaEnabled: boolean;
  audienceEnabled: boolean;
  lowerThirdEnabled: boolean;
  audienceStreamName: string;
  lowerThirdStreamName: string;
}

export interface OutputDisplayInfo {
  id: string;
  label: string;
  isPrimary: boolean;
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface PersistedDisplaySettings {
  connectionMethod: ConnectionMethod;
  targetDisplayId: string | null;
  fullscreenOnLive: boolean;
  ndiSettings: NDISettings;
}

export interface DisplayModeState {
  activeMode: DisplayMode;
  isLiveEnabled: boolean;
  connectionMethod: ConnectionMethod;
  targetDisplayId: string | null;
  availableDisplays: OutputDisplayInfo[];
  fullscreenOnLive: boolean;
  ndiSettings: NDISettings;

  setMode: (mode: DisplayMode) => void;
  clearMode: () => void;
  setLiveEnabled: (enabled: boolean) => void;
  setConnectionMethod: (method: ConnectionMethod) => void;
  setTargetDisplayId: (displayId: string | null) => void;
  setAvailableDisplays: (displays: OutputDisplayInfo[]) => void;
  setFullscreenOnLive: (enabled: boolean) => void;
  setNdiSettings: (settings: Partial<NDISettings>) => void;
  applyLiveSettings: (settings: Partial<PersistedDisplaySettings>) => void;
}

const CHANNEL_NAME = 'display-mode-sync';
const STORAGE_KEY = 'qworship-display-settings';
let broadcastChannel: BroadcastChannel | null = null;

const getDefaultNdiSettings = (): NDISettings => ({
  resolution: '1920x1080',
  frameRate: '24',
  bandwidth: 'highest',
  colorFormat: 'uyvy422',
  audioEnabled: true,
  alphaEnabled: true,
  audienceEnabled: true,
  lowerThirdEnabled: true,
  audienceStreamName: 'Qworship Audience',
  lowerThirdStreamName: 'Qworship Lower Third',
});

const mergeNdiSettings = (settings?: Partial<NDISettings>): NDISettings => ({
  ...getDefaultNdiSettings(),
  ...(settings ?? {}),
});

const getDefaultPersistedSettings = (): PersistedDisplaySettings => ({
  connectionMethod: 'wired',
  targetDisplayId: null,
  fullscreenOnLive: true,
  ndiSettings: getDefaultNdiSettings(),
});

const loadPersistedSettings = (): PersistedDisplaySettings => {
  if (typeof window === 'undefined') return getDefaultPersistedSettings();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultPersistedSettings();

    const parsed = JSON.parse(raw) as Partial<PersistedDisplaySettings> & {
      ndiSettings?: Partial<NDISettings>;
    };

    return {
      ...getDefaultPersistedSettings(),
      ...parsed,
      ndiSettings: mergeNdiSettings(parsed.ndiSettings),
    };
  } catch (error) {
    console.warn('[DisplayModeStore] Failed to load display settings', error);
    return getDefaultPersistedSettings();
  }
};

const persistSettings = (state: Pick<DisplayModeState, 'connectionMethod' | 'targetDisplayId' | 'fullscreenOnLive' | 'ndiSettings'>) => {
  if (typeof window === 'undefined') return;
  const payload: PersistedDisplaySettings = {
    connectionMethod: state.connectionMethod,
    targetDisplayId: state.targetDisplayId,
    fullscreenOnLive: state.fullscreenOnLive,
    ndiSettings: mergeNdiSettings(state.ndiSettings),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

const broadcastModeChange = (mode: DisplayMode) => {
  broadcastChannel?.postMessage({
    type: 'MODE_CHANGE',
    data: { mode },
  });
};

const broadcastSettingsChange = (store: Pick<DisplayModeState, 'isLiveEnabled' | 'connectionMethod' | 'targetDisplayId' | 'fullscreenOnLive' | 'ndiSettings'>) => {
  broadcastChannel?.postMessage({
    type: 'SETTINGS_CHANGE',
    data: {
      isLiveEnabled: store.isLiveEnabled,
      connectionMethod: store.connectionMethod,
      targetDisplayId: store.targetDisplayId,
      fullscreenOnLive: store.fullscreenOnLive,
      ndiSettings: mergeNdiSettings(store.ndiSettings),
    },
  });
};

const initBroadcastChannel = (store: any) => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);

    broadcastChannel.onmessage = (event) => {
      const { type, data } = event.data;

      switch (type) {
        case 'MODE_CHANGE':
          store.setState({ activeMode: data.mode }, false);
          break;
        case 'SETTINGS_CHANGE':
          store.setState({
            isLiveEnabled: data.isLiveEnabled,
            connectionMethod: data.connectionMethod,
            targetDisplayId: data.targetDisplayId,
            fullscreenOnLive: data.fullscreenOnLive,
            ndiSettings: mergeNdiSettings(data.ndiSettings),
          }, false);
          persistSettings({
            connectionMethod: data.connectionMethod,
            targetDisplayId: data.targetDisplayId,
            fullscreenOnLive: data.fullscreenOnLive,
            ndiSettings: mergeNdiSettings(data.ndiSettings),
          });
          break;
        case 'REQUEST_SYNC': {
          const currentState = store.getState();
          broadcastChannel?.postMessage({
            type: 'SYNC_RESPONSE',
            data: {
              mode: currentState.activeMode,
              isLiveEnabled: currentState.isLiveEnabled,
              connectionMethod: currentState.connectionMethod,
              targetDisplayId: currentState.targetDisplayId,
              fullscreenOnLive: currentState.fullscreenOnLive,
              ndiSettings: mergeNdiSettings(currentState.ndiSettings),
            },
          });
          break;
        }
        case 'SYNC_RESPONSE':
          store.setState({
            activeMode: data.mode,
            isLiveEnabled: data.isLiveEnabled,
            connectionMethod: data.connectionMethod,
            targetDisplayId: data.targetDisplayId,
            fullscreenOnLive: data.fullscreenOnLive,
            ndiSettings: mergeNdiSettings(data.ndiSettings),
          }, false);
          persistSettings({
            connectionMethod: data.connectionMethod,
            targetDisplayId: data.targetDisplayId,
            fullscreenOnLive: data.fullscreenOnLive,
            ndiSettings: mergeNdiSettings(data.ndiSettings),
          });
          break;
      }
    };
  }
};

export const useDisplayModeStore = create<DisplayModeState>((set, get) => {
  const persisted = loadPersistedSettings();
  initBroadcastChannel({ setState: set, getState: get });

  return {
    activeMode: 'none',
    isLiveEnabled: false,
    connectionMethod: persisted.connectionMethod,
    targetDisplayId: persisted.targetDisplayId,
    availableDisplays: [],
    fullscreenOnLive: persisted.fullscreenOnLive,
    ndiSettings: persisted.ndiSettings,

    setMode: (mode: DisplayMode) => {
      set({ activeMode: mode });
      broadcastModeChange(mode);
    },

    clearMode: () => {
      set({ activeMode: 'none' });
      broadcastModeChange('none');
    },

    setLiveEnabled: (enabled: boolean) => {
      set({ isLiveEnabled: enabled });
      const state = get();
      broadcastSettingsChange({
        isLiveEnabled: enabled,
        connectionMethod: state.connectionMethod,
        targetDisplayId: state.targetDisplayId,
        fullscreenOnLive: state.fullscreenOnLive,
        ndiSettings: state.ndiSettings,
      });
    },

    setConnectionMethod: (method: ConnectionMethod) => {
      set({ connectionMethod: method });
      const state = { ...get(), connectionMethod: method };
      persistSettings(state);
      broadcastSettingsChange(state);
    },

    setTargetDisplayId: (displayId: string | null) => {
      set({ targetDisplayId: displayId });
      const state = { ...get(), targetDisplayId: displayId };
      persistSettings(state);
      broadcastSettingsChange(state);
    },

    setAvailableDisplays: (displays: OutputDisplayInfo[]) => {
      const nextTargetId =
        get().targetDisplayId && displays.some((display) => display.id === get().targetDisplayId)
          ? get().targetDisplayId
          : displays.find((display) => !display.isPrimary)?.id ?? displays[0]?.id ?? null;

      set({ availableDisplays: displays, targetDisplayId: nextTargetId });
      const state = { ...get(), availableDisplays: displays, targetDisplayId: nextTargetId };
      persistSettings(state);
      broadcastSettingsChange(state);
    },

    setFullscreenOnLive: (enabled: boolean) => {
      set({ fullscreenOnLive: enabled });
      const state = { ...get(), fullscreenOnLive: enabled };
      persistSettings(state);
      broadcastSettingsChange(state);
    },

    setNdiSettings: (settings: Partial<NDISettings>) => {
      const mergedSettings = mergeNdiSettings({ ...get().ndiSettings, ...settings });
      set({ ndiSettings: mergedSettings });
      const state = { ...get(), ndiSettings: mergedSettings };
      persistSettings(state);
      broadcastSettingsChange(state);
    },

    applyLiveSettings: (settings: Partial<PersistedDisplaySettings>) => {
      set((state) => ({
        connectionMethod: settings.connectionMethod ?? state.connectionMethod,
        targetDisplayId: settings.targetDisplayId ?? state.targetDisplayId,
        fullscreenOnLive: settings.fullscreenOnLive ?? state.fullscreenOnLive,
        ndiSettings: settings.ndiSettings
          ? mergeNdiSettings({ ...state.ndiSettings, ...settings.ndiSettings })
          : state.ndiSettings,
      }));
      const state = get();
      persistSettings(state);
      broadcastSettingsChange(state);
    },
  };
});

export const requestDisplayModeSync = () => {
  broadcastChannel?.postMessage({ type: 'REQUEST_SYNC' });
};

export const DISPLAY_MODE_LABELS: Record<DisplayMode, string> = {
  none: 'None',
  slides: 'Slides',
  'hfb-bible': 'HFB Bible',
  song: 'Song',
  'on-screen-bible': 'On-Screen Bible',
};

export const DISPLAY_MODE_ICONS: Record<DisplayMode, string> = {
  none: 'Monitor',
  slides: 'Presentation',
  'hfb-bible': 'Mic',
  song: 'Music',
  'on-screen-bible': 'BookOpen',
};
