import { create } from 'zustand';
import { db } from '../../../lib/db';
import { useBibleRAMCache } from './useBibleRAMCache';


export interface HFBChapterVerse {
  number: number;
  text: string;
}

export interface HFBTranscriptLine {
  id: number;
  text: string;
  ts: string; // timestamp
}

export interface HFBDetectedVerse {
  id: number;
  reference: string;
  verseText: string;
  version: string;
  isActive: boolean;
  verseNum: number;
  book: string;
  chapter: number;
}

export interface HFBProjectedVerse {
  reference: string;
  text: string;
  version: string;
}

interface HFBStore {
  // Version config
  hfbVersion: string;
  setHfbVersion: (version: string) => void;

  // Chapter viewer state
  hfbBookName: string;
  hfbChapter: number;
  hfbChapterVerses: HFBChapterVerse[];
  hfbChapterLoading: boolean;
  hfbActiveVerseNum: number | null;

  setHfbChapterView: (book: string, chapter: number, verses: HFBChapterVerse[]) => void;
  setHfbChapterLoading: (loading: boolean) => void;
  setHfbActiveVerseNum: (num: number | null) => void;

  // Transcript state
  hfbTranscriptLines: HFBTranscriptLine[];
  addHfbTranscriptLine: (line: HFBTranscriptLine) => void;
  clearHfbTranscript: () => void;

  // Detected verses
  hfbDetectedVerses: HFBDetectedVerse[];
  setHfbDetectedVerses: (verses: HFBDetectedVerse[] | ((prev: HFBDetectedVerse[]) => HFBDetectedVerse[])) => void;
  addHfbDetectedVerse: (verse: HFBDetectedVerse) => void;

  // Audience projection state memory
  hfbCurrentProjected: HFBProjectedVerse | null;
  setHfbCurrentProjected: (projected: HFBProjectedVerse | null) => void;
  
  // Async actions
  fetchHFBChapter: (book: string, chapter: number, version: string, highlightVerse?: number) => Promise<void>;
  
  // Quick flush
  clearAllState: () => void;
}

export const useHFBStore = create<HFBStore>((set) => ({
  hfbVersion: 'KJV',
  setHfbVersion: (version) => set({ hfbVersion: version }),

  hfbBookName: '',
  hfbChapter: 0,
  hfbChapterVerses: [],
  hfbChapterLoading: false,
  hfbActiveVerseNum: null,

  setHfbChapterView: (book, chapter, verses) => set({ hfbBookName: book, hfbChapter: chapter, hfbChapterVerses: verses, hfbChapterLoading: false }),
  setHfbChapterLoading: (loading) => set({ hfbChapterLoading: loading }),
  setHfbActiveVerseNum: (num) => set({ hfbActiveVerseNum: num }),

  hfbTranscriptLines: [],
  addHfbTranscriptLine: (line) => set((state) => ({ hfbTranscriptLines: [...state.hfbTranscriptLines, line] })),
  clearHfbTranscript: () => set({ hfbTranscriptLines: [] }),

  hfbDetectedVerses: [],
  setHfbDetectedVerses: (verses) => set((state) => ({
    hfbDetectedVerses: typeof verses === 'function' ? verses(state.hfbDetectedVerses) : verses
  })),
  addHfbDetectedVerse: (verse) => set((state) => ({ hfbDetectedVerses: [...state.hfbDetectedVerses, verse] })),

  hfbCurrentProjected: null,
  setHfbCurrentProjected: (projected) => set({ hfbCurrentProjected: projected }),

  fetchHFBChapter: async (book, chapter, version, highlightVerse) => {
    set({ hfbBookName: book, hfbChapter: chapter, hfbChapterLoading: true, hfbChapterVerses: [] });
    try {
      const vKey = version.toLowerCase();

      // 0. Try RAM Cache (0.00ms latency)
      const memStartTime = performance.now();
      const ramVerses = useBibleRAMCache.getState().getChapter(vKey, book, chapter);
      const memEndTime = performance.now();
      
      if (ramVerses && ramVerses.length > 0) {
        set({ hfbChapterVerses: ramVerses as any[], hfbChapterLoading: false });
        if (highlightVerse !== undefined) {
           set({ hfbActiveVerseNum: highlightVerse });
        }
        console.log(`🚀 [RAM CACHE HFB] Fetched ${book} ${chapter} (${vKey}) in ${(memEndTime - memStartTime).toFixed(2)}ms`);
        return;
      }

      // 1. Try to fetch from Local IndexedDB
      const startTime = performance.now();
      const localVerses = await db.verses
        .where({ version: vKey, book: book, chapter })
        .toArray();
      const endTime = performance.now();

      if (localVerses && localVerses.length > 0) {
        // Sort verses to ensure correct order
        localVerses.sort((a: any, b: any) => a.verse - b.verse);
        
        const mappedVerses = localVerses.map((v: any) => ({
          number: v.verse,
          text: v.text || '',
        }));

        set({ hfbChapterVerses: mappedVerses, hfbChapterLoading: false });
        if (highlightVerse !== undefined) {
           set({ hfbActiveVerseNum: highlightVerse });
        }
        console.log(`🚀 [IndexedDB HFB] Fetched ${book} ${chapter} (${vKey}) locally in ${(endTime - startTime).toFixed(2)}ms`);
        return; // Success, skip cloud fallback
      }

      console.warn(`[Local DB] Verses not found for ${book} ${chapter} (${vKey}). Falling back to Cloud API...`);
      
      // 2. Fallback to Cloud MongoDB API if local sync failed or isn't complete
      const resp = await fetch("/api/bible/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ book, chapter, verseStart: 1, verseEnd: 150, version: vKey }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.result) {
          const verses = (data.result.verses as any[]).map(v => ({
            number: v.verse,
            text: v[vKey] || v.kjv || "",
          }));
          set({ hfbChapterVerses: verses, hfbChapterLoading: false });
          if (highlightVerse !== undefined) {
             set({ hfbActiveVerseNum: highlightVerse });
          }
        } else {
          set({ hfbChapterLoading: false });
        }
      } else {
        set({ hfbChapterLoading: false });
      }
    } catch (e) {
      console.error("[HFB Store] Fetch Error:", e);
      set({ hfbChapterLoading: false });
    }
  },

  clearAllState: () => set({
    hfbBookName: '',
    hfbChapter: 0,
    hfbChapterVerses: [],
    hfbActiveVerseNum: null,
    hfbTranscriptLines: [],
    hfbDetectedVerses: [],
    hfbCurrentProjected: null,
  })
}));
