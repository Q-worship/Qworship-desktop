import { create } from 'zustand';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NdiSourceStats {
  fps: number;
  bitrateMbps: number;
  active: boolean;
}

export interface NdiStats {
  cpu: number;
  ram: number;
  sources: NdiSourceStats[];
  previews: (string | null)[];
}

export interface GrandioseError {
  message: string;
  details: string;
  solution: string;
}

interface NdiSettingsState {
  // ── Persisted defaults ──────────────────────────────────────────────────────
  lowerThirdName: string;
  mainPresentationName: string;
  autoStartOnLive: boolean;

  // ── Runtime state (NOT persisted) ───────────────────────────────────────────
  isStreaming: boolean;
  stats: NdiStats | null;
  grandioseError: GrandioseError | null;
  statusMessage: string;

  // ── Actions ─────────────────────────────────────────────────────────────────
  setLowerThirdName: (name: string) => void;
  setMainPresentationName: (name: string) => void;
  setAutoStartOnLive: (val: boolean) => void;
  setStreaming: (val: boolean) => void;
  setStats: (stats: NdiStats | null) => void;
  setGrandioseError: (err: GrandioseError | null) => void;
  setStatusMessage: (msg: string) => void;

  /** Build the IPC source array from the persisted names. */
  getSources: () => { url: string; ndiName: string }[];

  /** Start NDI streaming using the persisted stream names. */
  startStreaming: () => Promise<void>;

  /** Stop NDI streaming. */
  stopStreaming: () => Promise<void>;
}

// ─── LocalStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'qworship-ndi-settings';

interface PersistedShape {
  lowerThirdName: string;
  mainPresentationName: string;
  autoStartOnLive: boolean;
}

function loadPersistedDefaults(): PersistedShape {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored) as PersistedShape;
  } catch { /* noop */ }
  return {
    lowerThirdName: 'QWORSHIP_LOWER_THIRD',
    mainPresentationName: 'QWORSHIP_MAIN_PRESENTATION',
    autoStartOnLive: true,
  };
}

function persistDefaults(partial: Partial<PersistedShape>) {
  try {
    const current = loadPersistedDefaults();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, ...partial }));
  } catch { /* noop */ }
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useNdiSettingsStore = create<NdiSettingsState>((set, get) => {
  const defaults = loadPersistedDefaults();

  return {
    // Persisted
    lowerThirdName: defaults.lowerThirdName,
    mainPresentationName: defaults.mainPresentationName,
    autoStartOnLive: defaults.autoStartOnLive,

    // Runtime
    isStreaming: false,
    stats: null,
    grandioseError: null,
    statusMessage: '',

    // ── Setters ───────────────────────────────────────────────────────────────
    setLowerThirdName: (name) => {
      set({ lowerThirdName: name });
      persistDefaults({ lowerThirdName: name });
    },
    setMainPresentationName: (name) => {
      set({ mainPresentationName: name });
      persistDefaults({ mainPresentationName: name });
    },
    setAutoStartOnLive: (val) => {
      set({ autoStartOnLive: val });
      persistDefaults({ autoStartOnLive: val });
    },
    setStreaming: (val) => set({ isStreaming: val }),
    setStats: (stats) => set({ stats }),
    setGrandioseError: (err) => set({ grandioseError: err }),
    setStatusMessage: (msg) => set({ statusMessage: msg }),

    // ── Derived ───────────────────────────────────────────────────────────────
    getSources: () => {
      const { lowerThirdName, mainPresentationName } = get();
      return [
        { url: '', ndiName: lowerThirdName },
        { url: '', ndiName: mainPresentationName },
      ];
    },

    // ── NDI control ───────────────────────────────────────────────────────────
    startStreaming: async () => {
      const api = window.api?.ndi;
      if (!api) return;

      const { getSources, setStreaming, setStatusMessage } = get();
      setStatusMessage('Starting NDI streams…');

      try {
        await api.startStream(getSources());
        setStreaming(true);
        setStatusMessage('NDI streams active');
      } catch (e) {
        setStatusMessage(`Failed to start: ${(e as Error).message}`);
      }
    },

    stopStreaming: async () => {
      const api = window.api?.ndi;
      if (!api) return;

      await api.stopStream();
      set({ isStreaming: false, stats: null, statusMessage: 'NDI streams stopped' });
    },
  };
});
