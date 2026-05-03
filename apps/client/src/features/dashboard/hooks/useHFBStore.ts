import { create } from 'zustand';
import { fetchBibleChapterWithFallback } from '../../../lib/sharedBibleEngine';
import type { CGEQueueCandidate } from '../../../hooks/useLocalWhisper';

// Re-export so UI components can import from one place
export type { CGEQueueCandidate };

export interface HFBChapterVerse {
  number: number;
  text: string;
}

export interface HFBTranscriptLine {
  id: number;
  text: string;
  ts: string;
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
  hfbVersion: string;
  setHfbVersion: (version: string) => void;
  hfbBookName: string;
  hfbChapter: number;
  hfbChapterVerses: HFBChapterVerse[];
  hfbChapterLoading: boolean;
  hfbActiveVerseNum: number | null;
  setHfbChapterView: (
    book: string,
    chapter: number,
    verses: HFBChapterVerse[],
  ) => void;
  setHfbChapterLoading: (loading: boolean) => void;
  setHfbActiveVerseNum: (num: number | null) => void;
  hfbTranscriptLines: HFBTranscriptLine[];
  addHfbTranscriptLine: (line: HFBTranscriptLine) => void;
  clearHfbTranscript: () => void;
  hfbDetectedVerses: HFBDetectedVerse[];
  setHfbDetectedVerses: (
    verses:
      | HFBDetectedVerse[]
      | ((prev: HFBDetectedVerse[]) => HFBDetectedVerse[]),
  ) => void;
  addHfbDetectedVerse: (verse: HFBDetectedVerse) => void;
  hfbCurrentProjected: HFBProjectedVerse | null;
  setHfbCurrentProjected: (projected: HFBProjectedVerse | null) => void;

  // ── Confidence Queue ────────────────────────────────────────────────────────
  /** Candidates routed to the Confidence Queue by the CGE, awaiting pastor review. */
  hfbPendingCandidates: CGEQueueCandidate[];
  addHfbPendingCandidate: (candidate: CGEQueueCandidate) => void;
  removeHfbPendingCandidate: (id: number) => void;
  clearHfbPendingCandidates: () => void;

  fetchHFBChapter: (
    book: string,
    chapter: number,
    version: string,
    highlightVerse?: number,
  ) => Promise<void>;
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

  setHfbChapterView: (book, chapter, verses) =>
    set({
      hfbBookName: book,
      hfbChapter: chapter,
      hfbChapterVerses: verses,
      hfbChapterLoading: false,
    }),
  setHfbChapterLoading: (loading) => set({ hfbChapterLoading: loading }),
  setHfbActiveVerseNum: (num) => set({ hfbActiveVerseNum: num }),

  hfbTranscriptLines: [],
  addHfbTranscriptLine: (line) =>
    set((state) => ({ hfbTranscriptLines: [...state.hfbTranscriptLines, line] })),
  clearHfbTranscript: () => set({ hfbTranscriptLines: [] }),

  hfbDetectedVerses: [],
  setHfbDetectedVerses: (verses) =>
    set((state) => ({
      hfbDetectedVerses:
        typeof verses === 'function' ? verses(state.hfbDetectedVerses) : verses,
    })),
  addHfbDetectedVerse: (verse) =>
    set((state) => ({ hfbDetectedVerses: [...state.hfbDetectedVerses, verse] })),

  hfbCurrentProjected: null,
  setHfbCurrentProjected: (projected) => set({ hfbCurrentProjected: projected }),

  // ── Confidence Queue ────────────────────────────────────────────────────────
  hfbPendingCandidates: [],
  addHfbPendingCandidate: (candidate) =>
    set((state) => ({
      hfbPendingCandidates: [...state.hfbPendingCandidates, candidate],
    })),
  removeHfbPendingCandidate: (id) =>
    set((state) => ({
      hfbPendingCandidates: state.hfbPendingCandidates.filter((c) => c.id !== id),
    })),
  clearHfbPendingCandidates: () => set({ hfbPendingCandidates: [] }),

  fetchHFBChapter: async (book, chapter, version, highlightVerse) => {
    set({
      hfbBookName: book,
      hfbChapter: chapter,
      hfbChapterLoading: true,
      hfbChapterVerses: [],
    });

    try {
      const passage = await fetchBibleChapterWithFallback({
        book,
        chapter,
        version,
      });

      if (!passage) {
        console.warn('[HFB Store] Chapter not found in shared engine', {
          book,
          chapter,
          version,
        });
        set({ hfbChapterLoading: false });
        return;
      }

      set({
        hfbChapterVerses: passage.verses,
        hfbChapterLoading: false,
        hfbActiveVerseNum: highlightVerse ?? null,
      });

      console.log(
        `🚀 [HFB Shared Engine] Fetched ${book} ${chapter} (${passage.versionKey}) via ${passage.source}`,
      );
    } catch (error) {
      console.error('[HFB Store] Shared chapter fetch failed', error);
      set({ hfbChapterLoading: false });
    }
  },

  clearAllState: () =>
    set({
      hfbBookName: '',
      hfbChapter: 0,
      hfbChapterVerses: [],
      hfbActiveVerseNum: null,
      hfbTranscriptLines: [],
      hfbDetectedVerses: [],
      hfbCurrentProjected: null,
      hfbPendingCandidates: [],
    }),
}));
