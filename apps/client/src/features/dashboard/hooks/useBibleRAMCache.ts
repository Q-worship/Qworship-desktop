import { create } from 'zustand';
import { db } from '../../../lib/db';

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
      console.log("⚡ [RAM Cache] Booting 0ms Dictionary...");
      const startTime = performance.now();
      
      // Pull all offline verses natively
      const allVerses = await db.verses.toArray();
      
      const dict: BibleDictionary = {};

      for (const v of allVerses) {
        const vKey = v.version;
        const bKey = v.book;
        const cKey = v.chapter;

        if (!dict[vKey]) dict[vKey] = {};
        if (!dict[vKey][bKey]) dict[vKey][bKey] = {};
        if (!dict[vKey][bKey][cKey]) dict[vKey][bKey][cKey] = [];

        dict[vKey][bKey][cKey].push({
          number: v.verse,
          text: v.text,
        });
      }

      // Sort chapters once so O(1) retrieval retains order natively
      for (const vKey of Object.keys(dict)) {
        for (const bKey of Object.keys(dict[vKey])) {
          for (const cKey of Object.keys(dict[vKey][bKey])) {
            dict[vKey][bKey][cKey as any].sort((a, b) => a.number - b.number);
          }
        }
      }

      const endTime = performance.now();
      console.log(`⚡ [RAM Cache] Successfully mapped ${allVerses.length} verses into active memory in ${(endTime - startTime).toFixed(2)}ms`);
      
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
