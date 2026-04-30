import {
  useState,
  useRef,
  useCallback,
  type RefObject,
} from "react";
import {
  BIBLE_BOOKS_LCC,
  BIBLE_VERSIONS_LCC,
  DEFAULT_INLINE_BIBLE_VERSION_LCC,
  getBibleVerseCountForChapter,
  type SelectableBibleVersionCode,
} from "../data/bibleBooks";
import {
  searchOffline,
  type BibleVersion,
} from "../../../lib/offlineBibleEngine";
import { fetchBibleChapterWithFallback } from "../../../lib/sharedBibleEngine";

export interface BibleVerse {
  number: number;
  text: string;
}

export interface BiblePassage {
  book: string;
  chapter: number;
  verses: BibleVerse[];
  version: string;
  reference: string;
}

interface UseInlineBibleBrowserProps {
  onProjectVerse: (
    reference: string,
    text: string,
    version: string,
    passageData?: any,
  ) => void;
}

const SELECTABLE_BIBLE_VERSIONS =
  BIBLE_VERSIONS_LCC as SelectableBibleVersionCode[];
const DEFAULT_BIBLE_VERSION =
  DEFAULT_INLINE_BIBLE_VERSION_LCC as SelectableBibleVersionCode;

const resolveSelectableVersion = (
  version?: string,
): SelectableBibleVersionCode => {
  if (
    version &&
    SELECTABLE_BIBLE_VERSIONS.includes(version as SelectableBibleVersionCode)
  ) {
    return version as SelectableBibleVersionCode;
  }

  return DEFAULT_BIBLE_VERSION;
};

const scrollVerseIntoView = (
  verseListRef: RefObject<HTMLDivElement>,
  verseIndex: number,
) => {
  setTimeout(() => {
    if (verseListRef.current && verseListRef.current.children[verseIndex]) {
      (verseListRef.current.children[verseIndex] as HTMLElement).scrollIntoView({
        block: "center",
      });
    }
  }, 100);
};

export function useInlineBibleBrowser({
  onProjectVerse,
}: UseInlineBibleBrowserProps) {
  const [isBibleMode, setIsBibleMode] = useState(false);
  const [bibleBookIndex, setBibleBookIndex] = useState(0);
  const [bibleChapterNum, setBibleChapterNum] = useState(1);
  const [bibleVerseIndex, setBibleVerseIndex] = useState(0);
  const [selBibleVersion, setSelBibleVersion] =
    useState<SelectableBibleVersionCode>(DEFAULT_BIBLE_VERSION);
  const [biblePassage, setBiblePassage] = useState<BiblePassage | null>(null);
  const [bibleIsLoading, setBibleIsLoading] = useState(false);
  const [bibleSearch, setBibleSearch] = useState("");
  const [bibleSearchError, setBibleSearchError] = useState<string | null>(null);

  const bibleBookListRef = useRef<HTMLDivElement>(null);
  const bibleChapterListRef = useRef<HTMLDivElement>(null);
  const bibleVerseListRef = useRef<HTMLDivElement>(null);

  const fetchBibleChapter = useCallback(
    async (
      bookName: string,
      chapter: number,
      version: string,
    ): Promise<BiblePassage | null> => {
      setBibleIsLoading(true);
      setBibleSearchError(null);

      try {
        const lookup = await fetchBibleChapterWithFallback({
          book: bookName,
          chapter,
          version,
          verseEnd: getBibleVerseCountForChapter(bookName, chapter),
        });

        if (!lookup) {
          setBibleSearchError("Chapter not found.");
          return null;
        }

        const passage: BiblePassage = {
          book: lookup.book,
          chapter: lookup.chapter,
          verses: lookup.verses,
          version: lookup.version,
          reference: lookup.reference,
        };

        setBiblePassage(passage);
        console.log(
          `🚀 [Bible Engine] Fetched ${bookName} ${chapter} (${lookup.versionKey}) via ${lookup.source}`,
        );
        return passage;
      } catch (error) {
        console.error("[useInlineBibleBrowser] Chapter fetch failed", error);
        setBibleSearchError("Error loading chapter.");
        return null;
      } finally {
        setBibleIsLoading(false);
      }
    },
    [],
  );

  const projectVerse = useCallback(
    (passage: BiblePassage, verseIndex: number) => {
      if (!passage?.verses?.length) return;
      const verse = passage.verses[verseIndex];
      const reference = `${passage.book} ${passage.chapter}:${verse.number}`;
      const text = `${verse.number} ${verse.text}`;
      onProjectVerse(reference, text, passage.version, passage);
      setBibleVerseIndex(verseIndex);
    },
    [onProjectVerse],
  );

  const syncSearchSelection = useCallback(
    (passage: BiblePassage, targetVerseNumber: number) => {
      setBiblePassage(passage);
      const matchedBookIndex = BIBLE_BOOKS_LCC.findIndex(
        (book) => book.name.toLowerCase() === passage.book.toLowerCase(),
      );
      if (matchedBookIndex !== -1) {
        setBibleBookIndex(matchedBookIndex);
      }
      setBibleChapterNum(passage.chapter);
      const matchedVerseIndex = passage.verses.findIndex(
        (verse) => verse.number === targetVerseNumber,
      );
      const finalVerseIndex = matchedVerseIndex !== -1 ? matchedVerseIndex : 0;
      setBibleVerseIndex(finalVerseIndex);
      projectVerse(passage, finalVerseIndex);
      scrollVerseIntoView(bibleVerseListRef, finalVerseIndex);
    },
    [projectVerse],
  );

  const handleBookSelect = useCallback(
    async (index: number) => {
      setBibleBookIndex(index);
      setBibleChapterNum(1);
      setBibleVerseIndex(0);
      setBiblePassage(null);
      const passage = await fetchBibleChapter(
        BIBLE_BOOKS_LCC[index].name,
        1,
        selBibleVersion,
      );
      if (passage && passage.verses.length > 0) {
        projectVerse(passage, 0);
      }
      if (bibleChapterListRef.current) {
        bibleChapterListRef.current.scrollTop = 0;
      }
      if (bibleVerseListRef.current) {
        bibleVerseListRef.current.scrollTop = 0;
      }
    },
    [fetchBibleChapter, projectVerse, selBibleVersion],
  );

  const handleChapterSelect = useCallback(
    async (chapter: number) => {
      setBibleChapterNum(chapter);
      setBibleVerseIndex(0);
      setBiblePassage(null);
      const passage = await fetchBibleChapter(
        BIBLE_BOOKS_LCC[bibleBookIndex].name,
        chapter,
        selBibleVersion,
      );
      if (passage && passage.verses.length > 0) {
        projectVerse(passage, 0);
      }
      if (bibleVerseListRef.current) {
        bibleVerseListRef.current.scrollTop = 0;
      }
    },
    [bibleBookIndex, fetchBibleChapter, projectVerse, selBibleVersion],
  );

  const handleVersionChange = useCallback(
    async (version: SelectableBibleVersionCode) => {
      const resolvedVersion = resolveSelectableVersion(version);
      setSelBibleVersion(resolvedVersion);
      setBiblePassage(null);
      const passage = await fetchBibleChapter(
        BIBLE_BOOKS_LCC[bibleBookIndex].name,
        bibleChapterNum,
        resolvedVersion,
      );
      if (passage && passage.verses.length > 0) {
        const nextVerseIndex =
          bibleVerseIndex < passage.verses.length ? bibleVerseIndex : 0;
        projectVerse(passage, nextVerseIndex);
      }
    },
    [bibleBookIndex, bibleChapterNum, bibleVerseIndex, fetchBibleChapter, projectVerse],
  );

  const handleVerseClick = useCallback(
    (index: number) => {
      setBibleVerseIndex(index);
      if (biblePassage) {
        projectVerse(biblePassage, index);
      }
    },
    [biblePassage, projectVerse],
  );

  const handleBibleSearch = useCallback(async () => {
    const reference = bibleSearch.trim();
    if (!reference) {
      setBibleSearchError("Please enter a reference.");
      return;
    }

    setBibleIsLoading(true);
    setBibleSearchError(null);

    try {
      const lookupVersion = selBibleVersion.toLowerCase() as BibleVersion;
      const offlineResult = await searchOffline(reference, lookupVersion);

      if (offlineResult && offlineResult.verses.length > 0) {
        const passage = await fetchBibleChapter(
          offlineResult.book,
          offlineResult.chapter,
          selBibleVersion,
        );
        if (passage && passage.verses.length > 0) {
          syncSearchSelection(passage, offlineResult.verses[0].number);
        } else {
          setBibleSearchError("Could not load chapter context.");
        }
        return;
      }

      const response = await fetch(
        `/api/bible/search?reference=${encodeURIComponent(reference)}&version=${selBibleVersion.toLowerCase()}`,
      );

      if (!response.ok) {
        setBibleSearchError("Error searching Bible.");
        return;
      }

      const data = await response.json();
      if (
        !data?.success ||
        !data?.passage ||
        !data.passage.verses ||
        data.passage.verses.length === 0
      ) {
        setBibleSearchError("Scripture not found.");
        return;
      }

      const passage = await fetchBibleChapter(
        String(data.passage.book || "").trim(),
        Number(data.passage.chapter),
        selBibleVersion,
      );

      if (passage && passage.verses.length > 0) {
        syncSearchSelection(passage, Number(data.passage.verses[0].number));
      } else {
        setBibleSearchError("Could not load chapter context.");
      }
    } catch (error) {
      console.error("[useInlineBibleBrowser] Bible search failed", error);
      setBibleSearchError("Error searching Bible.");
    } finally {
      setBibleIsLoading(false);
    }
  }, [bibleSearch, fetchBibleChapter, projectVerse, selBibleVersion, syncSearchSelection]);

  const openBibleMode = useCallback(async () => {
    setIsBibleMode(true);
    if (!biblePassage) {
      const passage = await fetchBibleChapter(
        "Genesis",
        1,
        resolveSelectableVersion(selBibleVersion),
      );
      if (passage && passage.verses.length > 0) {
        projectVerse(passage, 0);
      }
    }
  }, [biblePassage, fetchBibleChapter, projectVerse, selBibleVersion]);

  return {
    BIBLE_BOOKS: BIBLE_BOOKS_LCC,
    BIBLE_VERSIONS: BIBLE_VERSIONS_LCC,
    isBibleMode,
    setIsBibleMode,
    bibleBookIndex,
    bibleChapterNum,
    bibleVerseIndex,
    selBibleVersion,
    biblePassage,
    bibleIsLoading,
    bibleSearch,
    setBibleSearch,
    bibleSearchError,
    bibleBookListRef,
    bibleChapterListRef,
    bibleVerseListRef,
    handleBookSelect,
    handleChapterSelect,
    handleVersionChange,
    handleVerseClick,
    handleBibleSearch,
    openBibleMode,
  };
}
