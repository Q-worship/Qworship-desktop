import { create } from "zustand";
import type { LowerThirdBindingData as MainPresentationBindingData } from "@/features/lowerThird/types";

export interface MainPresentationSettings {
  backgroundType: "solid" | "gradient" | "media";
  backgroundValue: string;
  backgroundMediaType?: "image" | "video";
  backgroundMediaId?: string;
  backgroundMediaSource?: "user" | "cloud";
  fontColor: string;
  fontFamily: string;
  fontWeight: string;
  fontSizeMin: number;
  fontSizeMax: number;
  textAlign: "left" | "center" | "right";
  justifyContent: "flex-start" | "center" | "flex-end";
}

export const DEFAULT_SETTINGS: MainPresentationSettings = {
  backgroundType: "solid",
  backgroundValue: "#0f0f0f",
  backgroundMediaType: undefined,
  backgroundMediaId: undefined,
  backgroundMediaSource: undefined,
  fontColor: "#ffffff",
  fontFamily: "Inter, sans-serif",
  fontWeight: "700",
  fontSizeMin: 40,
  fontSizeMax: 140,
  textAlign: "center",
  justifyContent: "center",
};

const STORAGE_KEY = "qworship-main-presentation";
const CHANNEL_NAME = "qworship-main-presentation-sync";

interface MainPresentationState {
  enabled: boolean;
  userId: string | null;
  settings: MainPresentationSettings;
  activeData: MainPresentationBindingData | null;
  isVisible: boolean;
  renderPageEnabled: boolean;

  setUserId: (id: string | null) => void;
  setEnabled: (enabled: boolean) => void;
  setSettings: (settings: Partial<MainPresentationSettings>) => void;
  setActiveData: (data: MainPresentationBindingData | null) => void;
  setIsVisible: (visible: boolean) => void;
  setRenderPageEnabled: (enabled: boolean) => void;

  projectScripture: (verse: string, reference: string, version: string, forUserId?: string | null) => void;
  projectLyric: (lyrics: string, sectionTitle: string, songTitle: string, forUserId?: string | null) => void;
  projectAnnouncement: (text: string, category: string, subtitle: string, forUserId?: string | null) => void;
  clearActiveData: (forUserId?: string | null) => void;

  broadcastState: () => void;
  getRenderUrl: () => string;
}

function loadPersistedState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function persistState(state: Partial<MainPresentationState>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: state.enabled,
        userId: state.userId,
        settings: state.settings,
        renderPageEnabled: state.renderPageEnabled,
      }),
    );
  } catch {}
}

let broadcastChannel: BroadcastChannel | null = null;
try {
  broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
} catch {}

let _resolvedUserId: string | null = loadPersistedState().userId ?? null;

export function setMPUserIdImmediate(id: string | null | undefined): void {
  if (id == null) return;
  _resolvedUserId = id;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

let ltBaseUrl: string | null = null;
async function getLtBaseUrl(): Promise<string> {
  if (ltBaseUrl) return ltBaseUrl;
  try {
    const res = await fetch("/api/lower-third/config", { credentials: "include", headers: getAuthHeaders() });
    if (res.ok) {
      const data = await res.json();
      ltBaseUrl = data.ltBaseUrl || "http://localhost:3400";
    }
  } catch {}
  return ltBaseUrl || "http://localhost:3400";
}

const persisted = loadPersistedState();

export const useMainPresentationStore = create<MainPresentationState>((set, get) => {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "MAIN_PRESENTATION_UPDATE") {
        set({
          activeData: payload.activeData,
          isVisible: payload.isVisible,
          settings: payload.settings,
          enabled: payload.enabled,
        });
      }
    };
  }

  function pushToServer(
    overrides?: Partial<{
      enabled: boolean;
      isVisible: boolean;
      settings: MainPresentationSettings;
      activeData: MainPresentationBindingData | null;
    }>,
    directUserId?: string | null,
  ) {
    const state = get();
    const userId = directUserId ?? state.userId ?? _resolvedUserId;
    if (!userId) return;

    const body: Record<string, unknown> = {
      userId: String(userId),
      feature: "mainPresentation",
      settings: overrides?.settings ?? state.settings,
      isVisible: overrides?.isVisible ?? state.isVisible,
      enabled: overrides?.enabled ?? state.enabled,
    };
    if (overrides && "activeData" in overrides) {
      body.bindingData = overrides.activeData;
    } else {
      body.bindingData = state.activeData;
    }

    fetch("/api/lower-third/push", {
      method: "POST",
      credentials: "include",
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }).catch(() => {});
  }

  return {
    enabled: persisted.enabled ?? true,
    userId: persisted.userId ?? null,
    settings: persisted.settings || DEFAULT_SETTINGS,
    activeData: null,
    isVisible: false,
    renderPageEnabled: persisted.renderPageEnabled ?? true,

    setUserId: (id) => {
      _resolvedUserId = id;
      set({ userId: id });
      persistState({ ...get(), userId: id });
    },

    setEnabled: (enabled) => {
      set({ enabled });
      persistState({ ...get(), enabled });
      pushToServer({ enabled });
      get().broadcastState();
    },

    setSettings: (partialSettings) => {
      const updated = { ...get().settings, ...partialSettings };
      set({ settings: updated });
      persistState({ ...get(), settings: updated });
      pushToServer({ settings: updated });
      get().broadcastState();
    },

    setActiveData: (data) => {
      set({ activeData: data, isVisible: !!data });
      get().broadcastState();
      pushToServer({ activeData: data, isVisible: !!data });
    },

    setIsVisible: (visible) => {
      set({ isVisible: visible });
      get().broadcastState();
      pushToServer({ isVisible: visible });
    },

    setRenderPageEnabled: (enabled) => {
      set({ renderPageEnabled: enabled });
      persistState({ ...get(), renderPageEnabled: enabled });
    },

    projectScripture: (verse, reference, version, forUserId) => {
      const activeData: MainPresentationBindingData = { verse, reference, version, type: "scripture" };
      set({ activeData, isVisible: true });
      get().broadcastState();
      pushToServer({ activeData, isVisible: true }, forUserId);
    },

    projectLyric: (lyrics, sectionTitle, songTitle, forUserId) => {
      const activeData: MainPresentationBindingData = { verse: lyrics, reference: sectionTitle || songTitle || "", version: songTitle || "", type: "lyrics" };
      set({ activeData, isVisible: true });
      get().broadcastState();
      pushToServer({ activeData, isVisible: true }, forUserId);
    },

    projectAnnouncement: (text, category, subtitle, forUserId) => {
      const activeData: MainPresentationBindingData = { verse: text, reference: category, version: subtitle, type: "announcement" };
      set({ activeData, isVisible: true });
      get().broadcastState();
      pushToServer({ activeData, isVisible: true }, forUserId);
    },

    clearActiveData: (forUserId?) => {
      set({ activeData: null, isVisible: false });
      get().broadcastState();
      pushToServer({ activeData: null, isVisible: false }, forUserId);
    },

    broadcastState: () => {
      const { activeData, isVisible, settings, enabled } = get();
      try {
        broadcastChannel?.postMessage({
          type: "MAIN_PRESENTATION_UPDATE",
          payload: { activeData, isVisible, settings, enabled },
        });
      } catch {}
    },

    getRenderUrl: () => {
      const { userId } = get();
      const base = ltBaseUrl || "http://localhost:3400";
      getLtBaseUrl().then((url) => { ltBaseUrl = url; });
      return userId ? `${base}/p/${userId}` : `${base}/p/me`;
    },
  };
});
