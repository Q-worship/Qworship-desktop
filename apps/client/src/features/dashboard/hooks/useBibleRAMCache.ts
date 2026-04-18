import { create } from 'zustand';

export interface MemoryVerse {
  number: number;
  text: string;
}

type ChapterKey = number;
type BookDictionary = Record<ChapterKey, MemoryVerse[]>;
type VersionDictionary = Record<string, BookDictionary>;
type BibleDictionary = Record<string, VersionDictionary>;

const normalizeVersion = (version: string) => (version || '').trim().toLowerCase();
const normalizeBook = (book: string) =>
  (book || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const buildBookCandidates = (book: string) => {
  const normalized = normalizeBook(book);
  const compact = normalized.replace(/\s+/g, '');

  return Array.from(
    new Set([
      normalized,
      compact,
      normalized.replace(/^(first|1st)\s+/, '1 '),
      normalized.replace(/^(second|2nd)\s+/, '2 '),
      normalized.replace(/^(third|3rd)\s+/, '3 '),
      normalized.replace(/^1\s*/, '1 '),
      normalized.replace(/^2\s*/, '2 '),
      normalized.replace(/^3\s*/, '3 '),
    ].filter(Boolean)),
  );
};

interface RAMCacheStore {
  loadedVersions: Set<string>;
  loadingVersions: Set<string>;
  dictionary: BibleDictionary;
  ensureVersionLoaded: (version: string) => Promise<void>;
  loadFromDisk: () => Promise<void>;
  getChapter: (version: string, book: string, chapter: number) => MemoryVerse[] | null;
  hasVersionInMemory: (version: string) => boolean;
  resetVersion: (version: string) => void;
}

export const useBibleRAMCache = create<RAMCacheStore>((set, get) => ({
  loadedVersions: new Set(),
  loadingVersions: new Set(),
  dictionary: {},

  hasVersionInMemory: (version: string) => {
    const v = normalizeVersion(version);
    return Boolean(get().dictionary[v] && Object.keys(get().dictionary[v]).length > 0);
  },

  ensureVersionLoaded: async (version: string) => {
    const v = normalizeVersion(version);
    if (!v) return;

    const current = get();
    if (current.loadedVersions.has(v) && current.hasVersionInMemory(v)) return;

    if (current.loadingVersions.has(v)) {
      for (let i = 0; i < 100; i++) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (get().loadedVersions.has(v) && get().hasVersionInMemory(v)) return;
      }
      if (get().loadedVersions.has(v) && !get().hasVersionInMemory(v)) {
        get().resetVersion(v);
      }
    }

    set((state) => ({
      loadingVersions: new Set([...state.loadingVersions, v]),
    }));

    const startTime = performance.now();
    console.log(`⚡ [RAM Cache] Hydrating ${v.toUpperCase()} into memory...`);

    try {
      const response = await fetch(`/data/bibles/${v}.json`, { cache: 'force-cache' });
      if (!response.ok) {
        throw new Error(`Static asset missing for version ${v}: ${response.status}`);
      }

      const versionVerses: any[] = await response.json();
      const versionDictionary: VersionDictionary = {};

      for (const verse of versionVerses) {
        const bookKey = normalizeBook(verse.book);
        const chapterKey = Number(verse.chapter);
        const verseNumber = Number(verse.verse ?? verse.number);

        if (!bookKey || !chapterKey || !verseNumber) continue;

        if (!versionDictionary[bookKey]) versionDictionary[bookKey] = {};
        if (!versionDictionary[bookKey][chapterKey]) versionDictionary[bookKey][chapterKey] = [];

        versionDictionary[bookKey][chapterKey].push({
          number: verseNumber,
          text: verse.text || '',
        });
      }

      for (const bookKey of Object.keys(versionDictionary)) {
        for (const chapterKey of Object.keys(versionDictionary[bookKey])) {
          versionDictionary[bookKey][Number(chapterKey)].sort((a, b) => a.number - b.number);
        }
      }

      const elapsed = (performance.now() - startTime).toFixed(2);
      console.log(
        `⚡ [RAM Cache] ${v.toUpperCase()} loaded into memory (${versionVerses.length} verses) in ${elapsed}ms`,
      );

      set((state) => ({
        dictionary: {
          ...state.dictionary,
          [v]: versionDictionary,
        },
        loadedVersions: new Set([...state.loadedVersions, v]),
        loadingVersions: new Set([...state.loadingVersions].filter((item) => item !== v)),
      }));
    } catch (error) {
      console.error(`[RAM Cache] Failed to load ${v}:`, error);
      set((state) => ({
        dictionary: Object.fromEntries(
          Object.entries(state.dictionary).filter(([key]) => key !== v),
        ),
        loadedVersions: new Set([...state.loadedVersions].filter((item) => item !== v)),
        loadingVersions: new Set([...state.loadingVersions].filter((item) => item !== v)),
      }));
    }
  },

  loadFromDisk: async () => {
    await get().ensureVersionLoaded('kjv');
  },

  getChapter: (version: string, book: string, chapter: number) => {
    const v = normalizeVersion(version);
    const chapterNumber = Number(chapter);
    const versionDictionary = get().dictionary[v];
    if (!versionDictionary || !chapterNumber) return null;

    for (const candidate of buildBookCandidates(book)) {
      const verses = versionDictionary[candidate]?.[chapterNumber];
      if (verses?.length) return verses;
    }

    return null;
  },

  resetVersion: (version: string) => {
    const v = normalizeVersion(version);
    set((state) => ({
      dictionary: Object.fromEntries(
        Object.entries(state.dictionary).filter(([key]) => key !== v),
      ),
      loadedVersions: new Set([...state.loadedVersions].filter((item) => item !== v)),
      loadingVersions: new Set([...state.loadingVersions].filter((item) => item !== v)),
    }));
  },
}));
