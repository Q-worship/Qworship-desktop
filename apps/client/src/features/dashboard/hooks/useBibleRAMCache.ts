import { create } from 'zustand';

export interface MemoryVerse {
  number: number;
  text: string;
}

type BibleDictionary = Record<string, Record<string, Record<number, MemoryVerse[]>>>;

type BootProgressSnapshot = {
  progress: number;
  detail: string;
};

const PRELOAD_VERSIONS = ['kjv', 'nkjv', 'niv', 'esv', 'amp', 'msg'] as const;
const VERSION_LABELS: Record<string, string> = {
  kjv: 'King James Version',
  nkjv: 'New King James Version',
  niv: 'New International Version',
  esv: 'English Standard Version',
  amp: 'Amplified Bible',
  msg: 'The Message',
  gn: 'Good News Bible',
};

interface RAMCacheStore {
  isBooted: boolean;
  isBooting: boolean;
  bootProgress: number;
  bootDetail: string;
  loadedVersions: Set<string>;
  loadingVersions: Set<string>;
  dictionary: BibleDictionary;
  ensureVersionLoaded: (version: string) => Promise<void>;
  loadFromDisk: (onProgress?: (snapshot: BootProgressSnapshot) => void) => Promise<void>;
  getChapter: (version: string, book: string, chapter: number) => MemoryVerse[] | null;
}

function buildDictionaryFromVerses(versionVerses: any[]): Record<string, Record<number, MemoryVerse[]>> {
  const chapters: Record<string, Record<number, MemoryVerse[]>> = {};

  for (const verse of versionVerses) {
    const book = String(verse.book ?? '');
    const chapter = Number(verse.chapter ?? 0);
    const number = Number(verse.verse ?? verse.number ?? 0);
    const text = String(verse.text ?? '');

    if (!book || chapter <= 0 || number <= 0) {
      continue;
    }

    if (!chapters[book]) chapters[book] = {};
    if (!chapters[book][chapter]) chapters[book][chapter] = [];
    chapters[book][chapter].push({ number, text });
  }

  for (const book of Object.keys(chapters)) {
    for (const chapter of Object.keys(chapters[book])) {
      chapters[book][Number(chapter)].sort((left, right) => left.number - right.number);
    }
  }

  return chapters;
}

async function fetchVersionJson(version: string) {
  const response = await fetch(`/data/bibles/${version}.json`, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Static Bible asset missing for version ${version}: ${response.status}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error(`Static Bible asset for version ${version} is empty or invalid.`);
  }

  return payload;
}

export const useBibleRAMCache = create<RAMCacheStore>((set, get) => ({
  isBooted: false,
  isBooting: false,
  bootProgress: 0,
  bootDetail: 'Downloading datasets for zero-latency performance.',
  loadedVersions: new Set(),
  loadingVersions: new Set(),
  dictionary: {},

  ensureVersionLoaded: async (version: string) => {
    const normalizedVersion = version.toLowerCase();
    const state = get();

    if (state.loadedVersions.has(normalizedVersion)) {
      return;
    }

    if (state.loadingVersions.has(normalizedVersion)) {
      for (let attempt = 0; attempt < 200; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        if (get().loadedVersions.has(normalizedVersion)) {
          return;
        }
      }
      throw new Error(`Timed out waiting for ${normalizedVersion.toUpperCase()} to finish loading into RAM.`);
    }

    set((current) => ({
      loadingVersions: new Set([...current.loadingVersions, normalizedVersion]),
    }));

    const startTime = performance.now();

    try {
      const versionVerses = await fetchVersionJson(normalizedVersion);
      const builtDictionary = buildDictionaryFromVerses(versionVerses);

      set((current) => ({
        dictionary: {
          ...current.dictionary,
          [normalizedVersion]: builtDictionary,
        },
        loadedVersions: new Set([...current.loadedVersions, normalizedVersion]),
        loadingVersions: new Set(
          [...current.loadingVersions].filter((entry) => entry !== normalizedVersion),
        ),
      }));

      const elapsed = (performance.now() - startTime).toFixed(2);
      console.log(
        `[RAM Cache] ${normalizedVersion.toUpperCase()} loaded (${versionVerses.length} verses) in ${elapsed}ms`,
      );
    } catch (error) {
      console.error(`[RAM Cache] Failed to load ${normalizedVersion}:`, error);
      set((current) => ({
        loadingVersions: new Set(
          [...current.loadingVersions].filter((entry) => entry !== normalizedVersion),
        ),
      }));
      throw error;
    }
  },

  loadFromDisk: async (onProgress) => {
    const state = get();

    if (state.isBooted) {
      const snapshot = {
        progress: 100,
        detail: 'All resources are now available for zero-latency offline use.',
      };
      onProgress?.(snapshot);
      set({
        bootProgress: snapshot.progress,
        bootDetail: snapshot.detail,
      });
      return;
    }

    if (state.isBooting) {
      for (let attempt = 0; attempt < 400; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        const nextState = get();
        onProgress?.({
          progress: nextState.bootProgress,
          detail: nextState.bootDetail,
        });
        if (nextState.isBooted) {
          return;
        }
      }
      throw new Error('Timed out waiting for Bible RAM preload to finish.');
    }

    set({
      isBooting: true,
      isBooted: false,
      bootProgress: 8,
      bootDetail: 'Downloading datasets for zero-latency performance.',
    });
    onProgress?.({ progress: 8, detail: 'Downloading datasets for zero-latency performance.' });

    try {
      for (let index = 0; index < PRELOAD_VERSIONS.length; index += 1) {
        const version = PRELOAD_VERSIONS[index];
        const progress = 14 + Math.round((index / PRELOAD_VERSIONS.length) * 74);
        const detail = 'Downloading datasets for zero-latency performance.';

        set({
          bootProgress: progress,
          bootDetail: detail,
        });
        onProgress?.({ progress, detail });

        await get().ensureVersionLoaded(version);
      }

      const completion = {
        isBooted: true,
        isBooting: false,
        bootProgress: 100,
        bootDetail: 'All resources are now available for zero-latency offline use.',
      };
      set(completion);
      onProgress?.({ progress: completion.bootProgress, detail: completion.bootDetail });
    } catch (error) {
      set({
        isBooted: false,
        isBooting: false,
        bootProgress: 100,
        bootDetail: 'Offline preload encountered an issue. Continuing with the best available local data.',
      });
      throw error;
    }
  },

  getChapter: (version: string, book: string, chapter: number) => {
    const dict = get().dictionary;
    return dict[version.toLowerCase()]?.[book]?.[chapter] || null;
  },
}));
