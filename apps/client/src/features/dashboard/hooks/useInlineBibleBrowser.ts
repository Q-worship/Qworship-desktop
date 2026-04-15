import { useState, useRef, useCallback, useEffect } from 'react';
import { BIBLE_BOOKS_LCC, BIBLE_VERSIONS_LCC } from '../data/bibleBooks';
import { db } from '../../../lib/db';
import { useBibleRAMCache } from './useBibleRAMCache';
import { searchOffline, type BibleVersion } from '../../../lib/offlineBibleEngine';

export interface BibleVerse { number: number; text: string }
export interface BiblePassage {
  book: string; chapter: number;
  verses: BibleVerse[]; version: string; reference: string;
}

interface UseInlineBibleBrowserProps {
  onProjectVerse: (reference: string, text: string, version: string, passageData?: any) => void;
}

export function useInlineBibleBrowser({ onProjectVerse }: UseInlineBibleBrowserProps) {
  const [isBibleMode, setIsBibleMode] = useState(false);
  const [bibleBookIndex, setBibleBookIndex] = useState(0);
  const [bibleChapterNum, setBibleChapterNum] = useState(1);
  const [bibleVerseIndex, setBibleVerseIndex] = useState(0);
  const [selBibleVersion, setSelBibleVersion] = useState<typeof BIBLE_VERSIONS_LCC[number]>('KJV');
  const [biblePassage, setBiblePassage] = useState<BiblePassage | null>(null);
  const [bibleIsLoading, setBibleIsLoading] = useState(false);
  const [bibleSearch, setBibleSearch] = useState('');
  const [bibleSearchError, setBibleSearchError] = useState<string | null>(null);

  // Scroll refs for 3 columns
  const bibleBookListRef = useRef<HTMLDivElement>(null);
  const bibleChapterListRef = useRef<HTMLDivElement>(null);
  const bibleVerseListRef = useRef<HTMLDivElement>(null);

  // Fetch a chapter's verses from the API
  const fetchBibleChapter = useCallback(async (
    bookName: string, chapter: number, version: string
  ): Promise<BiblePassage | null> => {
    setBibleIsLoading(true);
    setBibleSearchError(null);
    try {
      const bookData = BIBLE_BOOKS_LCC.find(b => b.name === bookName);
      const verseEnd = bookData?.verses[chapter - 1] ?? 150;
      const vKey = version.toLowerCase() as any;

      // Ensure the requested version is in RAM before checking the cache
      await useBibleRAMCache.getState().ensureVersionLoaded(vKey);

      // 0. Try RAM Cache Fetching (0.00ms latency)
      const memStartTime = performance.now();
      const ramVerses = useBibleRAMCache.getState().getChapter(vKey, bookName, chapter);
      const memEndTime = performance.now();

      if (ramVerses && ramVerses.length > 0) {
        const p: BiblePassage = {
          book: bookName, chapter, verses: ramVerses as BibleVerse[],
          version: version.toUpperCase(),
          reference: `${bookName} ${chapter}`,
        };
        setBiblePassage(p);
        setBibleIsLoading(false);
        console.log(`🚀 [RAM CACHE] Fetched ${bookName} ${chapter} (${vKey}) in ${(memEndTime - memStartTime).toFixed(2)}ms`);
        return p;
      }

      // 1. Try fetching directly from bundled static assets
      const startTime = performance.now();
      try {
        const response = await fetch(`/data/bibles/${vKey}.json`);
        if (response.ok) {
           const versionVerses = await response.json();
           const chapterVerses = versionVerses.filter((v: any) => v.book === bookName && v.chapter === chapter);
           
           if (chapterVerses.length > 0) {
              chapterVerses.sort((a: any, b: any) => a.verse - b.verse);
              const mappedVerses: BibleVerse[] = chapterVerses.map((v: any) => ({
                 number: v.verse,
                 text: v.text || '',
              }));

              const p: BiblePassage = {
                 book: bookName, chapter, verses: mappedVerses,
                 version: version.toUpperCase(),
                 reference: `${bookName} ${chapter}`,
              };
              setBiblePassage(p);
              setBibleIsLoading(false);
              console.log(`🚀 [Static JSON] Fetched ${bookName} ${chapter} (${vKey}) locally from disk in ${(performance.now() - startTime).toFixed(2)}ms`);
              return p;
           }
        }
      } catch (err) {
         console.warn(`[Static JSON] Fetch failed or missing. Falling back to Cloud...`);
      }

      // 2. Fallback to Cloud API
      const resp = await fetch('/api/bible/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          book: bookName, chapter,
          verseStart: 1, verseEnd,
          version: vKey,
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.result) {
          const verses: BibleVerse[] = (data.result.verses || []).map((v: any) => ({
            number: v.verse,
            text: v[vKey] || v.kjv || '',
          }));
          const p: BiblePassage = {
            book: bookName, chapter, verses,
            version: version.toUpperCase(),
            reference: `${bookName} ${chapter}`,
          };
          setBiblePassage(p);
          return p;
        } else {
          setBibleSearchError(data?.message || 'Chapter not found.');
        }
      } else {
        setBibleSearchError('Error loading chapter.');
      }
    } catch {
      setBibleSearchError('Error loading chapter.');
    } finally {
      setBibleIsLoading(false);
    }
    return null;
  }, []);


  // Project a verse from the current passage
  const projectVerse = useCallback((p: BiblePassage, idx: number) => {
    if (!p?.verses?.length) return;
    const verse = p.verses[idx];
    const ref = `${p.book} ${p.chapter}:${verse.number}`;
    const text = `${verse.number} ${verse.text}`;
    onProjectVerse(ref, text, p.version, p);
    setBibleVerseIndex(idx);
  }, [onProjectVerse]);

  const handleBookSelect = useCallback(async (idx: number) => {
    setBibleBookIndex(idx);
    setBibleChapterNum(1);
    setBibleVerseIndex(0);
    setBiblePassage(null);
    const p = await fetchBibleChapter(BIBLE_BOOKS_LCC[idx].name, 1, selBibleVersion);
    if (p && p.verses.length > 0) projectVerse(p, 0);
    // Scroll chapter column to top
    if (bibleChapterListRef.current) bibleChapterListRef.current.scrollTop = 0;
    if (bibleVerseListRef.current) bibleVerseListRef.current.scrollTop = 0;
  }, [selBibleVersion, fetchBibleChapter, projectVerse]);

  const handleChapterSelect = useCallback(async (ch: number) => {
    setBibleChapterNum(ch);
    setBibleVerseIndex(0);
    setBiblePassage(null);
    const p = await fetchBibleChapter(BIBLE_BOOKS_LCC[bibleBookIndex].name, ch, selBibleVersion);
    if (p && p.verses.length > 0) projectVerse(p, 0);
    if (bibleVerseListRef.current) bibleVerseListRef.current.scrollTop = 0;
  }, [bibleBookIndex, selBibleVersion, fetchBibleChapter, projectVerse]);

  const handleVersionChange = useCallback(async (v: typeof BIBLE_VERSIONS_LCC[number]) => {
    setSelBibleVersion(v);
    setBiblePassage(null);
    const p = await fetchBibleChapter(
      BIBLE_BOOKS_LCC[bibleBookIndex].name, bibleChapterNum, v
    );
    if (p && p.verses.length > 0) {
      projectVerse(p, bibleVerseIndex < p.verses.length ? bibleVerseIndex : 0);
    }
  }, [bibleBookIndex, bibleChapterNum, bibleVerseIndex, fetchBibleChapter, projectVerse]);

  const handleVerseClick = useCallback((idx: number) => {
    setBibleVerseIndex(idx);
    if (biblePassage) projectVerse(biblePassage, idx);
  }, [biblePassage, projectVerse]);

  const handleBibleSearch = useCallback(async () => {
    if (!bibleSearch.trim()) { setBibleSearchError('Please enter a reference.'); return; }
    setBibleIsLoading(true);
    setBibleSearchError(null);
    try {
      const version = selBibleVersion.toLowerCase() as BibleVersion;

      // Ensure the requested version is loaded into RAM before searching
      await useBibleRAMCache.getState().ensureVersionLoaded(version);

      // 1. Try offline IndexedDB first
      const offlineResult = await searchOffline(bibleSearch.trim(), version);

      if (offlineResult && offlineResult.verses.length > 0) {
        const bookName = offlineResult.book;
        const chapterNum = offlineResult.chapter;
        const targetVerseNumber = offlineResult.verses[0].number;

        // Load the full chapter so adjacent verses are browsable
        const fullChapterPassage = await fetchBibleChapter(bookName, chapterNum, selBibleVersion);
        if (fullChapterPassage && fullChapterPassage.verses.length > 0) {
          setBiblePassage(fullChapterPassage);
          const bIdx = BIBLE_BOOKS_LCC.findIndex(b => b.name.toLowerCase() === bookName.toLowerCase());
          if (bIdx !== -1) setBibleBookIndex(bIdx);
          setBibleChapterNum(chapterNum);
          const targetIdx = fullChapterPassage.verses.findIndex((v: any) => v.number === targetVerseNumber);
          const finalIdx = targetIdx !== -1 ? targetIdx : 0;
          setBibleVerseIndex(finalIdx);
          projectVerse(fullChapterPassage, finalIdx);
          setTimeout(() => {
            if (bibleVerseListRef.current && bibleVerseListRef.current.children[finalIdx]) {
              (bibleVerseListRef.current.children[finalIdx] as HTMLElement).scrollIntoView({ block: 'center' });
            }
          }, 100);
        } else {
          setBibleSearchError('Could not load chapter context.');
        }
        return;
      }

      // 2. Fallback to cloud API (when Bible not yet synced to IndexedDB)
      const resp = await fetch(`/api/bible/search?reference=${encodeURIComponent(bibleSearch.trim())}&version=${selBibleVersion.toLowerCase()}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && data?.passage && data.passage.verses && data.passage.verses.length > 0) {
          const targetVerseNumber = Number(data.passage.verses[0].number);
          const bookName = (data.passage.book || '').trim();
          const chapterNum = Number(data.passage.chapter);
          const fullChapterPassage = await fetchBibleChapter(bookName, chapterNum, selBibleVersion);
          if (fullChapterPassage && fullChapterPassage.verses.length > 0) {
            setBiblePassage(fullChapterPassage);
            const bIdx = BIBLE_BOOKS_LCC.findIndex(b => b.name.toLowerCase() === bookName.toLowerCase());
            if (bIdx !== -1) setBibleBookIndex(bIdx);
            setBibleChapterNum(chapterNum);
            const targetIdx = fullChapterPassage.verses.findIndex((v: any) => v.number === targetVerseNumber);
            const finalIdx = targetIdx !== -1 ? targetIdx : 0;
            setBibleVerseIndex(finalIdx);
            projectVerse(fullChapterPassage, finalIdx);
            setTimeout(() => {
              if (bibleVerseListRef.current && bibleVerseListRef.current.children[finalIdx]) {
                (bibleVerseListRef.current.children[finalIdx] as HTMLElement).scrollIntoView({ block: 'center' });
              }
            }, 100);
          } else {
            setBibleSearchError('Could not load chapter context.');
          }
        } else {
          setBibleSearchError('Scripture not found.');
        }
      } else {
        setBibleSearchError('Error searching Bible.');
      }
    } catch {
      setBibleSearchError('Error searching Bible.');
    } finally {
      setBibleIsLoading(false);
    }
  }, [bibleSearch, selBibleVersion, projectVerse, fetchBibleChapter]);

  // Auto-load Genesis 1 when bible mode first opens
  const openBibleMode = useCallback(async () => {
    setIsBibleMode(true);
    if (!biblePassage) {
      const p = await fetchBibleChapter('Genesis', 1, selBibleVersion);
      if (p && p.verses.length > 0) projectVerse(p, 0);
    }
  }, [biblePassage, selBibleVersion, fetchBibleChapter, projectVerse]);

  return {
    BIBLE_BOOKS: BIBLE_BOOKS_LCC,
    BIBLE_VERSIONS: BIBLE_VERSIONS_LCC,
    isBibleMode, setIsBibleMode,
    bibleBookIndex, bibleChapterNum, bibleVerseIndex,
    selBibleVersion, biblePassage, bibleIsLoading,
    bibleSearch, setBibleSearch, bibleSearchError,
    bibleBookListRef, bibleChapterListRef, bibleVerseListRef,
    handleBookSelect, handleChapterSelect, handleVersionChange,
    handleVerseClick, handleBibleSearch,
    openBibleMode,
  };
}
