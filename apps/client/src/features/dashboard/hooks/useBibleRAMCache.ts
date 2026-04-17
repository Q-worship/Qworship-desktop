import { create } from 'zustand';

export interface MemoryVerse {
  number: number;
  text: string;
}

// Global Memory Architecture for absolute 0.00ms latency.
// A nested dictionary tree: cache[version][book][chapter] -> MemoryVerse[]
type BibleDictionary = Record<string, Record<string, Record<number, MemoryVerse[]>>>;

interface RAMCacheStore {
  /** Tracks which versions have been fully loaded into memory */
  loadedVersions: Set<string>;
  /** Tracks versions currently being loaded (prevents duplicate fetches) */
  loadingVersions: Set<string>;
  // A raw JS Object is used for O(1) hash map instant retrieval
  dictionary: BibleDictionary;

  /**
   * Lazy-loads a single Bible version into RAM on demand.
   * - First call for a version: fetches the JSON, parses it, warm up the dict.
   * - Subsequent calls for the SAME version: returns immediately (no-op).
   * - Replaces the old loadFromDisk() which loaded ALL 6 versions on boot.
   */
  ensureVersionLoaded: (version: string) => Promise<void>;

  /**
   * Boot-time convenience: pre-warm just the default version (KJV).
   * Replaces the old loadFromDisk() call in App.tsx.
   * This keeps startup memory at ~4.5MB instead of 28MB.
   */
  loadFromDisk: () => Promise<void>;

  getChapter: (version: string, book: string, chapter: number) => MemoryVerse[] | null;
}

export const useBibleRAMCache = create<RAMCacheStore>((set, get) => ({
  loadedVersions: new Set(),
  loadingVersions: new Set(),
  dictionary: {},

  ensureVersionLoaded: async (version: string) => {
    const v = version.toLowerCase();
    const state = get();

    // Already loaded — instant return
    if (state.loadedVersions.has(v)) return;

    // Check if Native SQLite is available. If it is, loading to RAM JS is redundant!
    if ((window as any).api?.bible) {
      const isSqliteLoaded = await (window as any).api.bible.getStatus();
      if (isSqliteLoaded) {
        set((s) => ({ loadedVersions: new Set([...s.loadedVersions, v]) }));
        return;
      }
    }

    // Already being loaded by a concurrent call — wait briefly and return
    if (state.loadingVersions.has(v)) {
      // Simple poll: wait up to 5s for concurrent load to finish
      for (let i = 0; i < 50; i++) {
        await new Promise(r => setTimeout(r, 100));
        if (get().loadedVersions.has(v)) return;
      }
      return;
    }

    // Mark as loading
    set(state => ({ loadingVersions: new Set([...state.loadingVersions, v]) }));

    const startTime = performance.now();
    console.log(`⚡ [RAM Cache] Loading ${v.toUpperCase()} on demand...`);

    try {
      const response = await fetch(`/data/bibles/${v}.json`);
      if (!response.ok) {
        console.warn(`[RAM Cache] Static asset missing for version: ${v}`);
        return;
      }

      const versionVerses: any[] = await response.json();
      const dict = { ...get().dictionary };

      if (!dict[v]) dict[v] = {};

      for (const verse of versionVerses) {
        const bKey = verse.book;
        const cKey = verse.chapter;

        if (!dict[v][bKey]) dict[v][bKey] = {};
        if (!dict[v][bKey][cKey]) dict[v][bKey][cKey] = [];

        dict[v][bKey][cKey].push({ number: verse.verse, text: verse.text });
      }

      // Sort verses within each chapter once (insertion order is not guaranteed)
      for (const bKey of Object.keys(dict[v])) {
        for (const cKey of Object.keys(dict[v][bKey])) {
          dict[v][bKey][cKey as any].sort((a, b) => a.number - b.number);
        }
      }

      const elapsed = (performance.now() - startTime).toFixed(2);
      console.log(`⚡ [RAM Cache] ${v.toUpperCase()} loaded (${versionVerses.length} verses) in ${elapsed}ms`);

      set(state => ({
        dictionary: dict,
        loadedVersions: new Set([...state.loadedVersions, v]),
        loadingVersions: new Set([...state.loadingVersions].filter(x => x !== v)),
      }));
    } catch (e) {
      console.error(`[RAM Cache] Failed to load ${v}:`, e);
      set(state => ({
        loadingVersions: new Set([...state.loadingVersions].filter(x => x !== v)),
      }));
    }
  },

  // Boot-time convenience: pre-warm KJV only (keeps startup at ~4.5MB not 28MB)
  loadFromDisk: async () => {
    await get().ensureVersionLoaded('kjv');
  },

  getChapter: (version: string, book: string, chapter: number) => {
    const dict = get().dictionary;
    return dict[version.toLowerCase()]?.[book]?.[chapter] || null;
  }
}));
