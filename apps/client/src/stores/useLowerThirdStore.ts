import { create } from "zustand";
import type { LowerThirdTemplate, LowerThirdBindingData } from "@/features/lowerThird/types";
import { DEFAULT_TEMPLATES } from "@/features/lowerThird/defaultTemplates";

const STORAGE_KEY = "qworship-lower-third";
const CUSTOM_TEMPLATES_KEY = "qworship-lower-third-custom-templates"; // write-through cache only
const THUMBNAIL_OVERRIDES_KEY = "qworship-lower-third-thumbnails";
const CHANNEL_NAME = "qworship-lower-third-sync";
const MAX_CUSTOM_TEMPLATES = 10;

interface LowerThirdState {
  enabled: boolean;
  userId: string | number | null;
  selectedTemplateId: string;
  scriptureTemplateId: string;
  lyricTemplateId: string;
  announcementTemplateId: string;
  customTemplates: LowerThirdTemplate[];
  thumbnailOverrides: Record<string, string>;
  activeData: LowerThirdBindingData | null;
  isVisible: boolean;
  renderPageEnabled: boolean;

  setUserId: (id: string | number | null) => void;
  setEnabled: (enabled: boolean) => void;
  setSelectedTemplateId: (id: string) => void;
  setScriptureTemplateId: (id: string) => void;
  setLyricTemplateId: (id: string) => void;
  setAnnouncementTemplateId: (id: string) => void;
  addCustomTemplate: (template: LowerThirdTemplate) => Promise<void>;
  updateCustomTemplate: (template: LowerThirdTemplate) => Promise<void>;
  deleteCustomTemplate: (id: string) => Promise<void>;
  duplicateTemplate: (id: string) => Promise<void>;
  setThumbnailOverride: (templateId: string, url: string) => void;
  setActiveData: (data: LowerThirdBindingData | null) => void;
  setIsVisible: (visible: boolean) => void;
  setRenderPageEnabled: (enabled: boolean) => void;
  projectScripture: (
    verse: string,
    reference: string,
    version: string,
    forUserId?: string | number | null,
  ) => void;
  projectLyric: (
    lyrics: string,
    sectionTitle: string,
    songTitle: string,
    forUserId?: string | number | null,
  ) => void;
  projectAnnouncement: (
    text: string,
    category: string,
    subtitle: string,
    forUserId?: string | number | null,
  ) => void;
  clearActiveData: (forUserId?: string | number | null) => void;
  getSelectedTemplate: () => LowerThirdTemplate | undefined;
  getScriptureTemplate: () => LowerThirdTemplate | undefined;
  getLyricTemplate: () => LowerThirdTemplate | undefined;
  getAnnouncementTemplate: () => LowerThirdTemplate | undefined;
  getAllTemplates: () => LowerThirdTemplate[];
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

function loadCustomTemplates(): LowerThirdTemplate[] {
  try {
    const stored = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return [];
}

function loadThumbnailOverrides(): Record<string, string> {
  try {
    const stored = localStorage.getItem(THUMBNAIL_OVERRIDES_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return {};
}

function persistThumbnailOverrides(overrides: Record<string, string>) {
  try {
    localStorage.setItem(THUMBNAIL_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {}
}

function persistState(state: Partial<LowerThirdState>) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        enabled: state.enabled,
        userId: state.userId,
        selectedTemplateId: state.selectedTemplateId,
        scriptureTemplateId: state.scriptureTemplateId,
        lyricTemplateId: state.lyricTemplateId,
        announcementTemplateId: state.announcementTemplateId,
        renderPageEnabled: state.renderPageEnabled,
      }),
    );
  } catch {}
}

function persistCustomTemplates(templates: LowerThirdTemplate[]) {
  try {
    localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(templates));
  } catch {}
}

function getStoredOrgName(): string {
  try {
    const stored = localStorage.getItem("qworship_user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.organizationName || "";
    }
  } catch {}
  return "";
}

// ─── Server API helpers ────────────────────────────────────────────────────────

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function apiSaveTemplate(template: LowerThirdTemplate): Promise<void> {
  const res = await fetch("/api/lower-third/templates", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify({ template }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to save template");
  }
}

async function apiUpdateTemplate(template: LowerThirdTemplate): Promise<void> {
  const res = await fetch(`/api/lower-third/templates/${template.id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify({ template }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Failed to update template");
  }
}

async function apiDeleteTemplate(templateId: string): Promise<void> {
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  await fetch(`/api/lower-third/templates/${templateId}`, {
    method: "DELETE",
    credentials: "include",
    headers,
  });
}

async function apiFetchTemplates(): Promise<LowerThirdTemplate[]> {
  const headers = getAuthHeaders();
  delete headers["Content-Type"];
  const res = await fetch("/api/lower-third/templates", {
    credentials: "include",
    headers,
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.templates ?? [];
}



let broadcastChannel: BroadcastChannel | null = null;
try {
  broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
} catch {}

// Module-level userId cache — updated by setUserId and also directly by
// QworshipHome before the React Query resolves. Allows pushToServer to work
// even if the useEffect lifecycle hasn't fired yet.
let _resolvedUserId: string | number | null = loadPersistedState().userId ?? null;

/** Call this from QworshipHome during render (safe — only sets a module variable, no React state). */
export function setUserIdImmediate(id: string | number | null | undefined): void {
  if (id == null) return;
  _resolvedUserId = id; // used as fallback in pushToServer — no Zustand set() here
}

// ─── LT service base URL (fetched once from /api/lower-third/config) ──────────
let ltBaseUrl: string | null = null;
async function getLtBaseUrl(): Promise<string> {
  if (ltBaseUrl) return ltBaseUrl;
  try {
    const res = await fetch("/api/lower-third/config", {
      credentials: "include",
    });
    if (res.ok) {
      const data = await res.json();
      ltBaseUrl = data.ltBaseUrl || "http://localhost:3400";
    }
  } catch {}
  return ltBaseUrl || "http://localhost:3400";
}

const persisted = loadPersistedState();

export const useLowerThirdStore = create<LowerThirdState>((set, get) => {
  if (broadcastChannel) {
    broadcastChannel.onmessage = (event) => {
      const { type, payload } = event.data;
      if (type === "LOWER_THIRD_UPDATE") {
        set({
          activeData: payload.activeData,
          isVisible: payload.isVisible,
          selectedTemplateId: payload.selectedTemplateId,
          enabled: payload.enabled,
        });
      }
    };
  }

  function pushToServer(
    overrides?: Partial<{
      enabled: boolean;
      isVisible: boolean;
      templateId: string;
      activeData: LowerThirdBindingData | null;
    }>,
    directUserId?: string | number | null,
  ) {
    const state = get();
    const userId = directUserId ?? state.userId ?? _resolvedUserId;
    console.log(
      "[LT] pushToServer called — userId:",
      userId,
      "enabled:",
      state.enabled,
      "overrides:",
      overrides,
    );
    if (!userId) {
      console.warn("[LT] pushToServer: userId is null, aborting push");
      return; // No user ID — can't route to the microservice room
    }

    const resolvedTemplateId =
      overrides?.templateId ?? state.selectedTemplateId;
    const resolvedTemplate =
      state.getAllTemplates().find((t) => t.id === resolvedTemplateId) ?? null;

    const bindingData =
      overrides && "activeData" in overrides ? overrides.activeData : undefined; // undefined = don't overwrite; null = explicit clear

    const body: Record<string, unknown> = {
      userId: String(userId),
      template: resolvedTemplate,
      isVisible: overrides?.isVisible ?? state.isVisible,
      enabled: overrides?.enabled ?? state.enabled,
    };
    if (bindingData !== undefined) {
      body.bindingData = bindingData;
    }

    console.log(
      "[LT] pushToServer: fetching /api/lower-third/push with body:",
      body,
    );
    fetch("/api/lower-third/push", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => {
        if (!r.ok)
          console.error(
            "[LT] pushToServer: proxy returned",
            r.status,
            r.statusText,
          );
        else console.log("[LT] pushToServer: success", r.status);
      })
      .catch((err) => console.error("[LT] pushToServer: fetch error", err));
  }

  return {
    enabled: persisted.enabled ?? true,
    userId: persisted.userId ?? null,
    selectedTemplateId: persisted.selectedTemplateId ?? "purple-gradient",
    scriptureTemplateId: persisted.scriptureTemplateId ?? "glass-scripture",
    lyricTemplateId: persisted.lyricTemplateId ?? "bold-accent-lyrics",
    announcementTemplateId: persisted.announcementTemplateId ?? "announcement-solid",
    customTemplates: loadCustomTemplates(),
    thumbnailOverrides: loadThumbnailOverrides(),
    activeData: null,
    isVisible: false,
    renderPageEnabled: persisted.renderPageEnabled ?? true,

    setUserId: (id) => {
      _resolvedUserId = id; // keep module-level cache in sync
      set({ userId: id });
      persistState({ ...get(), userId: id });
      // Fetch custom templates from server when user logs in
      if (id) {
        apiFetchTemplates().then((templates) => {
          set({ customTemplates: templates });
          persistCustomTemplates(templates);
        }).catch(() => {});
      }
    },

    setEnabled: (enabled) => {
      set({ enabled });
      persistState({ ...get(), enabled });
      pushToServer({ enabled });
    },

    setSelectedTemplateId: (id) => {
      set({ selectedTemplateId: id });
      persistState({ ...get(), selectedTemplateId: id });
    },

    setScriptureTemplateId: (id) => {
      set({ scriptureTemplateId: id, selectedTemplateId: id });
      persistState({
        ...get(),
        scriptureTemplateId: id,
        selectedTemplateId: id,
      });
    },

    setLyricTemplateId: (id) => {
      set({ lyricTemplateId: id });
      persistState({ ...get(), lyricTemplateId: id });
    },

    setAnnouncementTemplateId: (id) => {
      set({ announcementTemplateId: id });
      persistState({ ...get(), announcementTemplateId: id });
    },

    addCustomTemplate: async (template) => {
      const current = get().customTemplates;
      if (current.length >= MAX_CUSTOM_TEMPLATES) {
        throw new Error(`Maximum of ${MAX_CUSTOM_TEMPLATES} custom templates reached. Delete one to add another.`);
      }
      // Optimistic update
      const updated = [...current, template];
      set({ customTemplates: updated });
      persistCustomTemplates(updated);
      // Persist to server (rollback on failure)
      await apiSaveTemplate(template).catch((err) => {
        set({ customTemplates: current });
        persistCustomTemplates(current);
        throw err;
      });
    },

    updateCustomTemplate: async (template) => {
      const current = get().customTemplates;
      const updated = current.map((t) =>
        t.id === template.id ? template : t,
      );
      set({ customTemplates: updated });
      persistCustomTemplates(updated);
      // Persist to server (best-effort; local already updated)
      await apiUpdateTemplate(template).catch((err) => {
        console.error("[LT Store] updateCustomTemplate server error:", err.message);
      });
    },

    setThumbnailOverride: (templateId, url) => {
      const updated = { ...get().thumbnailOverrides, [templateId]: url };
      set({ thumbnailOverrides: updated });
      persistThumbnailOverrides(updated);
    },

    deleteCustomTemplate: async (id) => {
      const current = get().customTemplates;
      const updated = current.filter((t) => t.id !== id);
      set({ customTemplates: updated });
      persistCustomTemplates(updated);
      await apiDeleteTemplate(id).catch((err) => {
        console.error("[LT Store] deleteCustomTemplate server error:", err.message);
      });
      const fallback = "purple-gradient";
      if (get().selectedTemplateId === id) {
        set({ selectedTemplateId: fallback });
        persistState({ ...get(), selectedTemplateId: fallback });
      }
      if (get().scriptureTemplateId === id) {
        set({ scriptureTemplateId: fallback });
        persistState({ ...get(), scriptureTemplateId: fallback });
      }
      if (get().lyricTemplateId === id) {
        const lyricFallback = "bold-accent-lyrics";
        set({ lyricTemplateId: lyricFallback });
        persistState({ ...get(), lyricTemplateId: lyricFallback });
      }
      if (get().announcementTemplateId === id) {
        const annFallback = "announcement-solid";
        set({ announcementTemplateId: annFallback });
        persistState({ ...get(), announcementTemplateId: annFallback });
      }
    },

    duplicateTemplate: async (id) => {
      const all = get().getAllTemplates();
      const source = all.find((t) => t.id === id);
      if (!source) return;
      const current = get().customTemplates;
      if (current.length >= MAX_CUSTOM_TEMPLATES) {
        throw new Error(`Maximum of ${MAX_CUSTOM_TEMPLATES} custom templates reached. Delete one to add another.`);
      }
      const newTemplate: LowerThirdTemplate = {
        ...JSON.parse(JSON.stringify(source)),
        id: `custom-${Date.now()}`,
        name: `${source.name} (Copy)`,
        isDefault: false,
        isCustom: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "user",
      };
      await get().addCustomTemplate(newTemplate);
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
      const { scriptureTemplateId, enabled } = get();
      const activeData: LowerThirdBindingData = {
        verse,
        reference,
        version,
        churchName: getStoredOrgName(),
        type: "scripture",
      };
      set({
        activeData,
        isVisible: true,
        selectedTemplateId: scriptureTemplateId,
      });
      get().broadcastState();
      pushToServer(
        {
          activeData,
          isVisible: true,
          templateId: scriptureTemplateId,
          enabled,
        },
        forUserId,
      );
    },

    projectLyric: (lyrics, sectionTitle, songTitle, forUserId) => {
      const { lyricTemplateId, enabled } = get();
      const activeData: LowerThirdBindingData = {
        verse: lyrics,
        reference: sectionTitle || songTitle || "",
        version: songTitle || "",
        churchName: getStoredOrgName(),
        songTitle: songTitle || "",
        type: "lyrics",
      };
      set({ activeData, isVisible: true, selectedTemplateId: lyricTemplateId });
      get().broadcastState();
      pushToServer(
        {
          activeData,
          isVisible: true,
          templateId: lyricTemplateId,
          enabled,
        },
        forUserId,
      );
    },

    projectAnnouncement: (text, category, subtitle, forUserId) => {
      const { announcementTemplateId, enabled } = get();
      const activeData: LowerThirdBindingData = {
        verse: text,
        reference: category,
        version: subtitle,
        churchName: getStoredOrgName(),
        type: "announcement",
      };
      set({ activeData, isVisible: true, selectedTemplateId: announcementTemplateId });
      get().broadcastState();
      pushToServer(
        {
          activeData,
          isVisible: true,
          templateId: announcementTemplateId,
          enabled,
        },
        forUserId,
      );
    },

    clearActiveData: (forUserId?) => {
      set({ activeData: null, isVisible: false });
      get().broadcastState();
      pushToServer({ activeData: null, isVisible: false }, forUserId);
    },

    getSelectedTemplate: () => {
      const { selectedTemplateId } = get();
      return get()
        .getAllTemplates()
        .find((t) => t.id === selectedTemplateId);
    },

    getScriptureTemplate: () => {
      const { scriptureTemplateId } = get();
      return get()
        .getAllTemplates()
        .find((t) => t.id === scriptureTemplateId);
    },

    getLyricTemplate: () => {
      const { lyricTemplateId } = get();
      return get()
        .getAllTemplates()
        .find((t) => t.id === lyricTemplateId);
    },

    getAnnouncementTemplate: () => {
      const { announcementTemplateId } = get();
      return get()
        .getAllTemplates()
        .find((t) => t.id === announcementTemplateId);
    },

    getAllTemplates: () => {
      const { thumbnailOverrides, customTemplates } = get();
      const defaults = DEFAULT_TEMPLATES.map((t) =>
        thumbnailOverrides[t.id] ? { ...t, thumbnail: thumbnailOverrides[t.id] } : t
      );
      return [...defaults, ...customTemplates];
    },

    broadcastState: () => {
      const { activeData, isVisible, selectedTemplateId, enabled } = get();
      const payload = { activeData, isVisible, selectedTemplateId, enabled };
      try {
        broadcastChannel?.postMessage({ type: "LOWER_THIRD_UPDATE", payload });
      } catch {}
    },

    getRenderUrl: () => {
      const { userId } = get();
      // Return microservice renderer URL. ltBaseUrl is fetched lazily from
      // /api/lower-third/config so it reflects the configured LT_BASE_URL.
      const base = ltBaseUrl || "http://localhost:3400";
      // Kick off a background fetch so ltBaseUrl is populated for next call.
      getLtBaseUrl().then((url) => {
        ltBaseUrl = url;
      });
      return userId ? `${base}/r/${userId}` : `${base}/r/me`;
    },
  };
});
