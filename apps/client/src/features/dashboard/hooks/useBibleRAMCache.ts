import { create } from 'zustand';

export interface MemoryVerse {
  number: number;
  text: string;
}

// Global Memory Architecture for absolute 0.00ms latency.
// A nested dictionary tree: cache[version][book][chapter] -> MemoryVerse[]
type BibleDictionary = Record<string, Record<string, Record<number, MemoryVerse[]>>>;

interface RAMCacheStore {
  isBooted: boolean;
  isBooting: boolean;
  // A raw JS Object is used for O(1) hash map instant retrieval
  dictionary: BibleDictionary;
  
  loadFromDisk: () => Promise<void>;
  getChapter: (version: string, book: string, chapter: number) => MemoryVerse[] | null;
}

export const useBibleRAMCache = create<RAMCacheStore>((set, get) => ({
  isBooted: false,
  isBooting: false,
  dictionary: {},

  loadFromDisk: async () => {
    // Prevent double-booting
    if (get().isBooted || get().isBooting) return;
    
    set({ isBooting: true });
    try {
      console.log("⚡ [RAM Cache] Booting 0ms Dictionary from static assets...");
      const startTime = performance.now();
      
      const versionsToLoad = ['kjv', 'nkjv', 'amp', 'msg', 'esv', 'niv'];
      const dict: BibleDictionary = {};
      let totalVerses = 0;

      // Map through all local bundles parallelly 
      await Promise.all(
        versionsToLoad.map(async (version) => {
          try {
            const response = await fetch(`/data/bibles/${version}.json`);
            if (response.ok) {
              const versionVerses = await response.json();
              totalVerses += versionVerses.length;
              
              for (const v of versionVerses) {
                const bKey = v.book;
                const cKey = v.chapter;

                if (!dict[version]) dict[version] = {};
                if (!dict[version][bKey]) dict[version][bKey] = {};
                if (!dict[version][bKey][cKey]) dict[version][bKey][cKey] = [];

                dict[version][bKey][cKey].push({
                  number: v.verse,
                  text: v.text,
                });
              }
            } else {
               console.warn(`[RAM Cache] Missing static asset for ${version}.`);
            }
          } catch (e) {
            console.error(`[RAM Cache] Failed to load static asset for ${version}`, e);
          }
        })
      );

      // Sort chapters once so O(1) retrieval retains order natively
      for (const vKey of Object.keys(dict)) {
        for (const bKey of Object.keys(dict[vKey])) {
          for (const cKey of Object.keys(dict[vKey][bKey])) {
            dict[vKey][bKey][cKey as any].sort((a, b) => a.number - b.number);
          }
        }
      }

      const endTime = performance.now();
      console.log(`⚡ [RAM Cache] Successfully mapped ${totalVerses} verses into active memory in ${(endTime - startTime).toFixed(2)}ms`);
      
      set({ dictionary: dict, isBooted: true, isBooting: false });
    } catch (e) {
      console.error("[RAM Cache] Failed to bootstrap dictionary off disk:", e);
      set({ isBooting: false });
    }
  },

  getChapter: (version: string, book: string, chapter: number) => {
    const dict = get().dictionary;
    return dict[version]?.[book]?.[chapter] || null;
  }
}));
