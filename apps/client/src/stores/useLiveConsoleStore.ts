import { create } from "zustand";

import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import { useMainPresentationStore } from "@/stores/useMainPresentationStore";

export type LiveConsolePrimaryMode = "hfb" | "on-screen-bible" | "songs";
export type LiveConsoleHfbState = "empty" | "engaged";
export type LiveConsoleBibleState = "empty" | "engaged";
export type LiveConsoleSongState = "empty" | "engaged" | "pace";
export type LiveConsoleProjectionKind = "none" | "scripture" | "lyrics";

export type LiveConsoleBibleReference = {
  book: string;
  chapter: number;
  verse: number | null;
  version: string;
};

export type LiveConsoleSongSelection = {
  songId: string | null;
  title: string;
  artist?: string;
  sectionIndex: number;
  sectionTitle: string;
  lyrics: string[];
};

export type LiveConsoleProjectionPayload = {
  kind: LiveConsoleProjectionKind;
  title: string;
  reference: string;
  body: string;
  version: string;
  paceLines?: string[];
  paceLineIdx?: number;
  paceLineProgress?: number;
};

export type LiveConsoleModuleContext = {
  fromPath: string;
  returnPath: string;
  moduleKey: string | null;
};

export type LiveConsoleDetectionItem = {
  title: string;
  body: string;
};

type LiveConsoleState = {
  primaryMode: LiveConsolePrimaryMode;
  hfbState: LiveConsoleHfbState;
  bibleState: LiveConsoleBibleState;
  songState: LiveConsoleSongState;
  bibleQuery: string;
  bibleReference: LiveConsoleBibleReference;
  songSelection: LiveConsoleSongSelection;
  paceBpm: number;
  pacePlaying: boolean;
  paceProgress: number;
  lastProjection: LiveConsoleProjectionPayload;
  moduleContext: LiveConsoleModuleContext;
  recentDetections: LiveConsoleDetectionItem[];

  setPrimaryMode: (mode: LiveConsolePrimaryMode) => void;
  setHfbState: (state: LiveConsoleHfbState) => void;
  setBibleState: (state: LiveConsoleBibleState) => void;
  setSongState: (state: LiveConsoleSongState) => void;
  setBibleQuery: (query: string) => void;
  setBibleReference: (reference: Partial<LiveConsoleBibleReference>) => void;
  setSongSelection: (selection: Partial<LiveConsoleSongSelection>) => void;
  setPaceBpm: (bpm: number) => void;
  setPacePlaying: (playing: boolean) => void;
  setPaceProgress: (progress: number) => void;
  rememberModuleEntry: (moduleKey: string, fromPath?: string, returnPath?: string) => void;
  clearModuleEntry: () => void;
  projectScripture: (params: {
    verseText: string;
    reference: string;
    version?: string;
    detectionTitle?: string;
    userId?: string | number | null;
  }) => void;
  projectLyrics: (params: {
    lyrics: string[];
    sectionTitle: string;
    songTitle: string;
    detectionTitle?: string;
    userId?: string | number | null;
    pace?: {
      lines: string[];
      lineIdx: number;
      lineProgress: number;
    };
  }) => void;
  clearProjection: (userId?: string | number | null) => void;
};

const initialBibleReference: LiveConsoleBibleReference = {
  book: "Genesis",
  chapter: 1,
  verse: null,
  version: "KJV",
};

const initialSongSelection: LiveConsoleSongSelection = {
  songId: null,
  title: "",
  artist: "",
  sectionIndex: 0,
  sectionTitle: "",
  lyrics: [],
};

const initialProjection: LiveConsoleProjectionPayload = {
  kind: "none",
  title: "",
  reference: "",
  body: "",
  version: "",
};

const initialModuleContext: LiveConsoleModuleContext = {
  fromPath: "/live-console",
  returnPath: "/live-console",
  moduleKey: null,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function uniqueRecentDetections(nextItem: LiveConsoleDetectionItem, current: LiveConsoleDetectionItem[]) {
  if (!nextItem.title.trim()) return current;
  return [nextItem, ...current.filter((item) => item.title !== nextItem.title)].slice(0, 8);
}

export const useLiveConsoleStore = create<LiveConsoleState>((set, get) => ({
  primaryMode: "hfb",
  hfbState: "empty",
  bibleState: "empty",
  songState: "empty",
  bibleQuery: "",
  bibleReference: initialBibleReference,
  songSelection: initialSongSelection,
  paceBpm: 80,
  pacePlaying: false,
  paceProgress: 0.44,
  lastProjection: initialProjection,
  moduleContext: initialModuleContext,
  recentDetections: [],

  setPrimaryMode: (primaryMode) => set({ primaryMode }),
  setHfbState: (hfbState) => set({ hfbState }),
  setBibleState: (bibleState) => set({ bibleState }),
  setSongState: (songState) => set({ songState }),
  setBibleQuery: (bibleQuery) => set({ bibleQuery }),

  setBibleReference: (reference) =>
    set((state) => ({
      bibleReference: {
        ...state.bibleReference,
        ...reference,
      },
    })),

  setSongSelection: (selection) =>
    set((state) => ({
      songSelection: {
        ...state.songSelection,
        ...selection,
      },
    })),

  setPaceBpm: (paceBpm) => set({ paceBpm: clamp(paceBpm, 40, 220) }),
  setPacePlaying: (pacePlaying) => set({ pacePlaying }),
  setPaceProgress: (paceProgress) => set({ paceProgress: clamp(paceProgress, 0, 1) }),

  rememberModuleEntry: (moduleKey, fromPath = "/live-console", returnPath = "/live-console") =>
    set({
      moduleContext: {
        moduleKey,
        fromPath,
        returnPath,
      },
    }),

  clearModuleEntry: () => set({ moduleContext: initialModuleContext }),

  projectScripture: ({ verseText, reference, version = "KJV", detectionTitle, userId }) => {
    useLowerThirdStore.getState().projectScripture(verseText, reference, version, userId ?? null);
    useMainPresentationStore.getState().projectScripture(verseText, reference, version, userId ? String(userId) : null);

    set((state) => ({
      lastProjection: {
        kind: "scripture",
        title: reference,
        reference,
        body: verseText,
        version,
      },
      recentDetections: uniqueRecentDetections({
        title: detectionTitle ?? reference,
        body: verseText,
      }, state.recentDetections),
    }));
  },

  projectLyrics: ({ lyrics, sectionTitle, songTitle, detectionTitle, userId, pace }) => {
    const joinedLyrics = lyrics.join("\n");
    useLowerThirdStore.getState().projectLyric(joinedLyrics, sectionTitle, songTitle, userId ?? null, pace);
    useMainPresentationStore.getState().projectLyric(joinedLyrics, sectionTitle, songTitle, userId ? String(userId) : null, pace);

    set((state) => ({
      lastProjection: {
        kind: "lyrics",
        title: songTitle,
        reference: sectionTitle,
        body: joinedLyrics,
        version: songTitle,
        paceLines: pace?.lines,
        paceLineIdx: pace?.lineIdx,
        paceLineProgress: pace?.lineProgress,
      },
      recentDetections: uniqueRecentDetections({
        title: detectionTitle ?? songTitle,
        body: joinedLyrics,
      }, state.recentDetections),
    }));
  },

  clearProjection: (userId) => {
    useLowerThirdStore.getState().clearActiveData(userId ?? null);
    useMainPresentationStore.getState().clearActiveData(userId ? String(userId) : null);
    set({ lastProjection: initialProjection });
  },
}));
