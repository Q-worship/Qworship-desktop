import { db } from './db';
import type { BibleVersion } from './offlineBibleEngine';
import { useBibleRAMCache } from '@/features/dashboard/hooks/useBibleRAMCache';
import {
  getBibleVerseCountForChapter,
  normalizeBibleVersionCode,
  normalizeBibleVersionKey,
  type BibleVersionCode,
  type BibleVersionKey,
} from '@/features/dashboard/data/bibleBooks';

export interface SharedBibleVerse {
  number: number;
  text: string;
}

export interface SharedBiblePassage {
  book: string;
  chapter: number;
  verses: SharedBibleVerse[];
  version: BibleVersionCode;
  versionKey: BibleVersionKey;
  reference: string;
  source: 'sqlite' | 'ram' | 'indexeddb' | 'cloud';
}

export interface SharedBibleVerseRangeEntry {
  verse: number;
  [versionKey: string]: string | number;
}

export interface FetchBibleChapterOptions {
  book: string;
  chapter: number;
  version: string;
  verseEnd?: number;
}

const canUseNativeBibleApi = () => Boolean((window as any).api?.bible);

const mapVerseRows = (rows: any[]): SharedBibleVerse[] =>
  rows
    .map((row) => ({
      number: Number(row.number ?? row.verse ?? 0),
      text: String(row.text ?? ''),
    }))
    .filter((row) => row.number > 0)
    .sort((a, b) => a.number - b.number);

const toPassage = (
  source: SharedBiblePassage['source'],
  book: string,
  chapter: number,
  version: string,
  verses: SharedBibleVerse[],
): SharedBiblePassage => {
  const versionCode = normalizeBibleVersionCode(version);
  const versionKey = normalizeBibleVersionKey(version);

  return {
    book,
    chapter,
    verses,
    version: versionCode,
    versionKey,
    reference: `${book} ${chapter}`,
    source,
  };
};

function hasCompleteChapter(
  book: string,
  chapter: number,
  verses: SharedBibleVerse[],
) {
  const expectedVerseCount = getBibleVerseCountForChapter(book, chapter);
  if (!expectedVerseCount) {
    return verses.length > 0;
  }

  return verses.length >= expectedVerseCount;
}

async function fetchFromSqlite(
  book: string,
  chapter: number,
  versionKey: BibleVersionKey,
): Promise<SharedBibleVerse[] | null> {
  if (!canUseNativeBibleApi()) {
    return null;
  }

  try {
    const nativeRows = await (window as any).api.bible.getChapter(
      versionKey,
      book,
      chapter,
    );
    const verses = mapVerseRows(nativeRows ?? []);
    return verses.length > 0 ? verses : null;
  } catch (error) {
    console.warn('[SharedBibleEngine] SQLite chapter lookup failed', {
      book,
      chapter,
      versionKey,
      error,
    });
    return null;
  }
}

async function fetchFromRam(
  book: string,
  chapter: number,
  versionKey: BibleVersionKey,
): Promise<SharedBibleVerse[] | null> {
  try {
    await useBibleRAMCache.getState().ensureVersionLoaded(versionKey);
  } catch (error) {
    console.warn('[SharedBibleEngine] RAM warm-up failed', {
      book,
      chapter,
      versionKey,
      error,
    });
  }

  const verses = useBibleRAMCache.getState().getChapter(versionKey, book, chapter);
  const mapped = mapVerseRows(verses ?? []);
  return mapped.length > 0 ? mapped : null;
}

async function fetchFromIndexedDb(
  book: string,
  chapter: number,
  versionKey: BibleVersionKey,
): Promise<SharedBibleVerse[] | null> {
  const rows = await db.verses
    .where('[version+book+chapter]')
    .equals([versionKey, book, chapter])
    .sortBy('verse');

  const verses = mapVerseRows(rows);
  return verses.length > 0 ? verses : null;
}

async function fetchFromCloud(
  book: string,
  chapter: number,
  versionKey: BibleVersionKey,
  verseEnd?: number,
): Promise<SharedBibleVerse[] | null> {
  const response = await fetch('/api/bible/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      book,
      chapter,
      verseStart: 1,
      verseEnd: verseEnd ?? getBibleVerseCountForChapter(book, chapter),
      version: versionKey,
    }),
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  if (!data?.success || !data?.result?.verses) {
    return null;
  }

  const verses = mapVerseRows(
    (data.result.verses as any[]).map((row) => ({
      verse: row.verse,
      text: row[versionKey] || row.kjv || '',
    })),
  );

  return verses.length > 0 ? verses : null;
}

export async function fetchBibleChapterWithFallback({
  book,
  chapter,
  version,
  verseEnd,
}: FetchBibleChapterOptions): Promise<SharedBiblePassage | null> {
  const versionKey = normalizeBibleVersionKey(version);

  const ramVerses = await fetchFromRam(book, chapter, versionKey);
  if (ramVerses && hasCompleteChapter(book, chapter, ramVerses)) {
    return toPassage('ram', book, chapter, version, ramVerses);
  }

  const sqliteVerses = await fetchFromSqlite(book, chapter, versionKey);
  if (sqliteVerses && hasCompleteChapter(book, chapter, sqliteVerses)) {
    return toPassage('sqlite', book, chapter, version, sqliteVerses);
  }

  const indexedDbVerses = await fetchFromIndexedDb(book, chapter, versionKey);
  if (indexedDbVerses && hasCompleteChapter(book, chapter, indexedDbVerses)) {
    return toPassage('indexeddb', book, chapter, version, indexedDbVerses);
  }

  const cloudVerses = await fetchFromCloud(book, chapter, versionKey, verseEnd);
  if (cloudVerses) {
    return toPassage('cloud', book, chapter, version, cloudVerses);
  }

  return null;
}

export async function fetchMultiVersionVerseRange({
  book,
  chapter,
  verseStart,
  verseEnd,
  versions,
}: {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  versions: string[];
}): Promise<SharedBibleVerseRangeEntry[]> {
  const normalizedVersionKeys = versions.map((version) =>
    normalizeBibleVersionKey(version),
  ) as BibleVersion[];

  const versionResults = await Promise.all(
    normalizedVersionKeys.map(async (versionKey) => {
      const passage = await fetchBibleChapterWithFallback({
        book,
        chapter,
        version: versionKey,
      });
      return {
        versionKey,
        verses:
          passage?.verses.filter(
            (verse) =>
              verse.number >= verseStart &&
              (verseEnd ? verse.number <= verseEnd : verse.number === verseStart),
          ) ?? [],
      };
    }),
  );

  const verseNumbers = Array.from(
    new Set(
      versionResults.flatMap((result) => result.verses.map((verse) => verse.number)),
    ),
  ).sort((a, b) => a - b);

  return verseNumbers.map((verseNumber) => {
    const entry: SharedBibleVerseRangeEntry = { verse: verseNumber };

    for (const result of versionResults) {
      const matchingVerse = result.verses.find((verse) => verse.number === verseNumber);
      entry[result.versionKey] = matchingVerse?.text ?? '';
    }

    return entry;
  });
}
