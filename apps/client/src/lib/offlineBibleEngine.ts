/**
 * Offline Bible Engine — Fully Self-Contained Browser/Electron Module
 *
 * No Node.js dependencies. No server calls. Works 100% offline.
 * Reads Bible data from IndexedDB (populated by useBibleSync).
 */

import Fuse from "fuse.js";
import { db } from "./db";

export type BibleVersion =
  | "kjv"
  | "nkjv"
  | "niv"
  | "esv"
  | "amp"
  | "msg"
  | "gn";

export interface BibleReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version: BibleVersion;
}

export interface OfflineVerseResult {
  number: number;
  text: string;
}

export interface OfflineBibleResult {
  book: string;
  chapter: number;
  verses: OfflineVerseResult[];
  version: BibleVersion;
  formattedReference: string;
}

export type CommandType =
  | "lookup"
  | "version_change"
  | "verse_change"
  | "chapter_change"
  | "jump_to_verse"
  | "last_verse"
  | "jump_relative"
  | "sleep"
  | "wake";

export interface ParsedVoiceCommand {
  originalText: string;
  parsedReference: BibleReference | null;
  commandType: CommandType;
  confidence: number;
  navigationDirection?: "next" | "previous";
  requestedVersion?: BibleVersion;
  targetVerse?: number;
  offset?: number;
}

// ============================================================
// Book name table — alias → canonical name
// ============================================================
const BOOK_ALIASES: Record<string, string> = {
  genesis: "Genesis",
  gen: "Genesis",
  ge: "Genesis",
  exodus: "Exodus",
  exo: "Exodus",
  ex: "Exodus",
  leviticus: "Leviticus",
  lev: "Leviticus",
  numbers: "Numbers",
  num: "Numbers",
  deuteronomy: "Deuteronomy",
  deut: "Deuteronomy",
  deu: "Deuteronomy",
  joshua: "Joshua",
  josh: "Joshua",
  jos: "Joshua",
  judges: "Judges",
  judg: "Judges",
  jdg: "Judges",
  ruth: "Ruth",
  rut: "Ruth",
  "1 samuel": "1 Samuel",
  "1samuel": "1 Samuel",
  "1sam": "1 Samuel",
  "1sa": "1 Samuel",
  "first samuel": "1 Samuel",
  "2 samuel": "2 Samuel",
  "2samuel": "2 Samuel",
  "2sam": "2 Samuel",
  "2sa": "2 Samuel",
  "second samuel": "2 Samuel",
  "1 kings": "1 Kings",
  "1kings": "1 Kings",
  "1ki": "1 Kings",
  "first kings": "1 Kings",
  "2 kings": "2 Kings",
  "2kings": "2 Kings",
  "2ki": "2 Kings",
  "second kings": "2 Kings",
  "1 chronicles": "1 Chronicles",
  "1chronicles": "1 Chronicles",
  "1ch": "1 Chronicles",
  "first chronicles": "1 Chronicles",
  "2 chronicles": "2 Chronicles",
  "2chronicles": "2 Chronicles",
  "2ch": "2 Chronicles",
  "second chronicles": "2 Chronicles",
  ezra: "Ezra",
  nehemiah: "Nehemiah",
  neh: "Nehemiah",
  esther: "Esther",
  est: "Esther",
  job: "Job",
  psalms: "Psalms",
  psalm: "Psalms",
  psa: "Psalms",
  ps: "Psalms",
  proverbs: "Proverbs",
  prov: "Proverbs",
  pro: "Proverbs",
  ecclesiastes: "Ecclesiastes",
  ecc: "Ecclesiastes",
  "song of solomon": "Song of Solomon",
  "song of songs": "Song of Solomon",
  sos: "Song of Solomon",
  isaiah: "Isaiah",
  isa: "Isaiah",
  jeremiah: "Jeremiah",
  jer: "Jeremiah",
  lamentations: "Lamentations",
  lam: "Lamentations",
  ezekiel: "Ezekiel",
  ezek: "Ezekiel",
  eze: "Ezekiel",
  daniel: "Daniel",
  dan: "Daniel",
  hosea: "Hosea",
  hos: "Hosea",
  joel: "Joel",
  amos: "Amos",
  obadiah: "Obadiah",
  obad: "Obadiah",
  jonah: "Jonah",
  jon: "Jonah",
  micah: "Micah",
  mic: "Micah",
  nahum: "Nahum",
  nah: "Nahum",
  habakkuk: "Habakkuk",
  hab: "Habakkuk",
  zephaniah: "Zephaniah",
  zeph: "Zephaniah",
  haggai: "Haggai",
  hag: "Haggai",
  zechariah: "Zechariah",
  zech: "Zechariah",
  malachi: "Malachi",
  mal: "Malachi",
  matthew: "Matthew",
  matt: "Matthew",
  mat: "Matthew",
  mark: "Mark",
  mrk: "Mark",
  luke: "Luke",
  luk: "Luke",
  john: "John",
  joh: "John",
  acts: "Acts",
  act: "Acts",
  romans: "Romans",
  rom: "Romans",
  "1 corinthians": "1 Corinthians",
  "1corinthians": "1 Corinthians",
  "1cor": "1 Corinthians",
  "1co": "1 Corinthians",
  "first corinthians": "1 Corinthians",
  "2 corinthians": "2 Corinthians",
  "2corinthians": "2 Corinthians",
  "2cor": "2 Corinthians",
  "2co": "2 Corinthians",
  "second corinthians": "2 Corinthians",
  galatians: "Galatians",
  gal: "Galatians",
  ephesians: "Ephesians",
  eph: "Ephesians",
  philippians: "Philippians",
  phil: "Philippians",
  colossians: "Colossians",
  col: "Colossians",
  "1 thessalonians": "1 Thessalonians",
  "1thess": "1 Thessalonians",
  "1th": "1 Thessalonians",
  "2 thessalonians": "2 Thessalonians",
  "2thess": "2 Thessalonians",
  "2th": "2 Thessalonians",
  "1 timothy": "1 Timothy",
  "1tim": "1 Timothy",
  "1ti": "1 Timothy",
  "2 timothy": "2 Timothy",
  "2tim": "2 Timothy",
  "2ti": "2 Timothy",
  titus: "Titus",
  tit: "Titus",
  philemon: "Philemon",
  phlm: "Philemon",
  hebrews: "Hebrews",
  heb: "Hebrews",
  james: "James",
  jas: "James",
  "1 peter": "1 Peter",
  "1pet": "1 Peter",
  "1pe": "1 Peter",
  "2 peter": "2 Peter",
  "2pet": "2 Peter",
  "2pe": "2 Peter",
  "1 john": "1 John",
  "1joh": "1 John",
  "1jn": "1 John",
  "2 john": "2 John",
  "2joh": "2 John",
  "2jn": "2 John",
  "3 john": "3 John",
  "3joh": "3 John",
  "3jn": "3 John",
  jude: "Jude",
  revelation: "Revelation",
  rev: "Revelation",

  // ── STT phonetic aliases (common Whisper misheard variants) ──
  look: "Luke",
  luck: "Luke",
  luc: "Luke",
  loose: "Luke",
  genius: "Genesis",
  genesys: "Genesis",
  genasis: "Genesis",
  jennesis: "Genesis",
  exedus: "Exodus",
  exidus: "Exodus",
  levidicus: "Leviticus",
  laviticus: "Leviticus",
  deuteronamy: "Deuteronomy",
  deuteranomy: "Deuteronomy",
  deuteronami: "Deuteronomy",
  duderonomy: "Deuteronomy",
  josua: "Joshua",
  proverb: "Proverbs",
  proverbes: "Proverbs",
  sam: "Psalms",
  sams: "Psalms",
  songs: "Psalms",
  salm: "Psalms",
  salms: "Psalms",
  saw: "Psalms",
  sawm: "Psalms",
  sawms: "Psalms",
  isaya: "Isaiah",
  mathew: "Matthew",
  mathews: "Matthew",
  mattew: "Matthew",
  marc: "Mark",
  jone: "John",
  joan: "John",
  ax: "Acts",
  roman: "Romans",
  romanss: "Romans",
  philippian: "Philippians",
  filipino: "Philippians",
  filemon: "Philemon",
  hebrew: "Hebrews",
  jame: "James",
  revelations: "Revelation",
  revelacion: "Revelation",
};

const ALL_CANONICAL_BOOKS = [...new Set(Object.values(BOOK_ALIASES))];

// Lazy Fuse.js instance for fuzzy book matching
let _fuse: Fuse<string> | null = null;
function getFuse(): Fuse<string> {
  if (!_fuse) {
    // Wider threshold to catch STT misheard variants that slip past the alias table
    _fuse = new Fuse(ALL_CANONICAL_BOOKS, {
      threshold: 0.5,
      includeScore: true,
      minMatchCharLength: 2,
    });
  }
  return _fuse;
}

function resolveBook(raw: string): string | null {
  const lower = raw.toLowerCase().trim();
  if (BOOK_ALIASES[lower]) return BOOK_ALIASES[lower];
  // Fuzzy match against canonical names
  const results = getFuse().search(raw);
  if (results.length > 0 && (results[0].score ?? 1) < 0.6)
    return results[0].item;
  return null;
}

// ============================================================
// Version aliases
// ============================================================
const VERSION_MAP: Record<string, BibleVersion> = {
  kjv: "kjv",
  "king james": "kjv",
  "king james version": "kjv",
  nkjv: "nkjv",
  "new king james": "nkjv",
  "new king james version": "nkjv",
  niv: "niv",
  "new international": "niv",
  "new international version": "niv",
  esv: "esv",
  "english standard": "esv",
  "english standard version": "esv",
  amp: "amp",
  amplified: "amp",
  "amplified bible": "amp",
  msg: "msg",
  message: "msg",
  "the message": "msg",
  gn: "gn",
  gnt: "gn",
  "good news": "gn",
  "good news bible": "gn",
};

function resolveVersion(raw: string): BibleVersion | null {
  return VERSION_MAP[raw.toLowerCase().trim()] || null;
}

// ============================================================
// Navigation/version regex (no external libs needed)
// ============================================================
const NAV_NEXT =
  /^(next|next verse|go next|forward|continue|advance|following verse|one more|read on|next one|next please)$/i;
const NAV_PREV =
  /^(previous|prev|go back|back|prior|last one|back one|previous please)$/i;
const NAV_NEXT_CH =
  /^(next chapter|chapter forward|advance.*chapter|following chapter)$/i;
const NAV_PREV_CH =
  /^(previous chapter|prev chapter|chapter back|last chapter|prior chapter)$/i;
const VERSION_SWITCH =
  /(?:show me|switch to|use|change to|in the|read in|give me)?\s*(kjv|nkjv|niv|esv|amp|msg|gn|gnt|amplified|king james|new king james|english standard|new international|good news|the message|message)\s*(version|translation|bible)?$/i;

// Reference patterns (handle both typed and voice)
const PATTERNS = [
  // "1 John 3:16-18"  or  "2 samuel 7:12"
  /^(\d)\s*([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.:](\d+)(?:\s*[-–]\s*(\d+))?$/i,
  // "John 3:16-18"
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.:](\d+)(?:\s*[-–]\s*(\d+))?$/i,
  // "John chapter 3 verse 16"
  /^([a-z]+(?:\s+[a-z]+)?)\s+chapter\s+(\d+)\s+verse\s+(\d+)(?:\s+(?:to|through)\s+(\d+))?$/i,
  // "1 John chapter 3 verse 16" (numbered + voice)
  /^(\d)\s*([a-z]+(?:\s+[a-z]+)?)\s+chapter\s+(\d+)\s+verse\s+(\d+)(?:\s+(?:to|through)\s+(\d+))?$/i,
  // "1 John 3 16"  (space format numbered)
  /^(\d)\s*([a-z]+)\s+(\d+)\s+(\d+)$/i,
  // "John 3 16"  (space format)
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)\s+(\d+)$/i,
  // "John verse 5" (chapter-less, defaults to chapter 1)
  /^([a-z]+(?:\s+[a-z]+)?)\s+verse\s+(\d+)$/i,
  // "John 3" (chapter only)
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)$/i,
  // "1 John 3" (numbered chapter only)
  /^(\d)\s*([a-z]+)\s+(\d+)$/i,
];

/**
 * Convert simple word numbers to digits ("three" → 3, "sixteen" → 16).
 * Handles common cases without requiring words-to-numbers npm package.
 */
const WORD_NUMS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100,
  first: 1,
  second: 2,
  third: 3,
  fourth: 4,
  fifth: 5,
};

function convertWordNumbers(text: string): string {
  // Match single words only — greedy two-word matching swallows "five is" as one token
  return text.replace(/\b([a-z]+)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (WORD_NUMS[lower] !== undefined) return String(WORD_NUMS[lower]);
    return match;
  });
}

// ============================================================
// Main parser
// ============================================================

/**
 * Pre-process raw Whisper transcripts to fix common STT artifacts
 * before feeding into the regex-based parser.
 */
function normalizeTranscript(raw: string): string {
  let t = raw;
  // Strip punctuation (commas, periods, etc.)
  t = t.replace(/[.,!?;:]+/g, " ");
  // Strip Whisper hallucination filler words that never appear in Bible references
  // IMPORTANT: Do NOT include words that are book aliases (saw, sam, jon, etc.)
  // or navigation keywords (go, back, next, etc.)
  t = t.replace(
    /\b(true|false|was|were|are|been|being|um|uh|just|really|actually|basically|okay|ok|yeah|very|much|also|too)\b/gi,
    "",
  );
  // "chapter 5 is 5"  →  "chapter 5 verse 5"
  // "chapter 5 and 6" →  "chapter 5 verse 6"
  // "chapter 5 or 6"  →  "chapter 5 verse 6"
  // "chapter 5 was 5"  → "chapter 5 verse 5"
  t = t.replace(/(\d+)\s+(?:is|and|or|was|versus)\s+(\d+)/gi, "$1 verse $2");
  // Collapse multiple spaces
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

export function parseVoiceCommand(
  text: string,
  defaultVersion: BibleVersion = "kjv",
): ParsedVoiceCommand {
  const original = text.trim();
  const normalized = normalizeTranscript(convertWordNumbers(original)).trim();
  const lower = normalized.toLowerCase();

  // Navigation
  if (NAV_NEXT.test(lower))
    return {
      originalText: original,
      parsedReference: null,
      commandType: "verse_change",
      navigationDirection: "next",
      confidence: 1,
    };
  if (NAV_PREV.test(lower))
    return {
      originalText: original,
      parsedReference: null,
      commandType: "verse_change",
      navigationDirection: "previous",
      confidence: 1,
    };
  if (NAV_NEXT_CH.test(lower))
    return {
      originalText: original,
      parsedReference: null,
      commandType: "chapter_change",
      navigationDirection: "next",
      confidence: 1,
    };
  if (NAV_PREV_CH.test(lower))
    return {
      originalText: original,
      parsedReference: null,
      commandType: "chapter_change",
      navigationDirection: "previous",
      confidence: 1,
    };

  // Jump to verse number: "verse 5"
  const jumpMatch = lower.match(/^(?:go to |jump to |verse )?verse (\d+)$/i);
  if (jumpMatch)
    return {
      originalText: original,
      parsedReference: null,
      commandType: "jump_to_verse",
      targetVerse: parseInt(jumpMatch[1]),
      confidence: 1,
    };

  // Version switch
  const versionMatch = lower.match(VERSION_SWITCH);
  if (versionMatch) {
    const ver = resolveVersion(versionMatch[1]);
    if (ver)
      return {
        originalText: original,
        parsedReference: null,
        commandType: "version_change",
        requestedVersion: ver,
        confidence: 1,
      };
  }

  // Try pattern matching
  for (const pattern of PATTERNS) {
    const m = normalized.match(pattern);
    if (!m) continue;

    let bookRaw: string,
      chapter: number,
      verseStart: number,
      verseEnd: number | undefined;

    if (/^\^\\d/.test(pattern.source)) {
      // Numbered book patterns
      bookRaw = `${m[1]} ${m[2]}`;
      chapter = parseInt(m[3]);
      verseStart = m[4] ? parseInt(m[4]) : 1;
      verseEnd = m[5] ? parseInt(m[5]) : undefined;
    } else {
      bookRaw = m[1];
      chapter = parseInt(m[2]);
      verseStart = m[3] ? parseInt(m[3]) : 1;
      verseEnd = m[4] ? parseInt(m[4]) : undefined;
    }

    const book = resolveBook(bookRaw);
    if (!book) continue;

    return {
      originalText: original,
      commandType: "lookup",
      confidence: 0.95,
      parsedReference: {
        book,
        chapter,
        verseStart,
        verseEnd,
        version: defaultVersion,
      },
    };
  }

  // Last resort: extract a book name from anywhere in the text and guess chapter/verse
  const strip = (s: string) =>
    s
      .toLowerCase()
      .replace(/\b(chapter|verse|go to|read|open|turn to|book of|the)\b/g, "")
      .replace(/\s+/g, " ")
      .trim();
  const stripped = strip(normalized);
  const numMatches = [...stripped.matchAll(/\d+/g)];
  if (numMatches.length >= 1) {
    const wordPart = stripped.replace(/\d+/g, "").trim();
    if (wordPart.length >= 2) {
      const book = resolveBook(wordPart);
      if (book) {
        const chapter = numMatches[0] ? parseInt(numMatches[0][0]) : 1;
        const verseStart = numMatches[1] ? parseInt(numMatches[1][0]) : 1;
        return {
          originalText: original,
          commandType: "lookup",
          confidence: 0.7,
          parsedReference: {
            book,
            chapter,
            verseStart,
            version: defaultVersion,
          },
        };
      }
    }
  }

  return {
    originalText: original,
    parsedReference: null,
    commandType: "lookup",
    confidence: 0,
  };
}

// ============================================================
// IndexedDB lookup — zero network
// ============================================================
export async function lookupOffline(
  ref: BibleReference,
): Promise<OfflineBibleResult | null> {
  try {
    let verses = await db.verses
      .where("[version+book+chapter]")
      .equals([ref.version, ref.book, ref.chapter])
      .sortBy("verse");

    if (!verses.length) return null;

    const filtered = verses.filter(
      (v) =>
        v.verse >= ref.verseStart &&
        (ref.verseEnd ? v.verse <= ref.verseEnd : true),
    );
    if (!filtered.length) return null;

    const bookDisplay = filtered[0].book;
    const refStr = ref.verseEnd
      ? `${bookDisplay} ${ref.chapter}:${ref.verseStart}-${ref.verseEnd}`
      : ref.verseStart > 1
        ? `${bookDisplay} ${ref.chapter}:${ref.verseStart}`
        : `${bookDisplay} ${ref.chapter}`;

    return {
      book: bookDisplay,
      chapter: ref.chapter,
      verses: filtered.map((v) => ({ number: v.verse, text: v.text })),
      version: ref.version,
      formattedReference: refStr,
    };
  } catch (err) {
    console.error("[OfflineBible] Lookup error:", err);
    return null;
  }
}

/**
 * Parse + lookup in one call.
 */
export async function searchOffline(
  reference: string,
  version: BibleVersion = "kjv",
): Promise<OfflineBibleResult | null> {
  const cmd = parseVoiceCommand(reference, version);
  if (!cmd.parsedReference) return null;
  return lookupOffline({ ...cmd.parsedReference, version });
}

// ============================================================
// Early Detection — Lightweight partial transcript parser
// ============================================================

export interface EarlyDetection {
  /** Recognized Bible book name (canonical), or null */
  book: string | null;
  /** Chapter number, or null if not yet spoken */
  chapter: number | null;
  /** Verse number, or null if not yet spoken */
  verse: number | null;
  /** Confidence score (0-1) */
  confidence: number;
}

/**
 * Lightweight early detector for partial transcripts.
 *
 * Unlike `parseVoiceCommand()` which requires a complete utterance, this
 * function detects Bible references incrementally:
 *   - "Show me John"     → { book: "John", chapter: null, verse: null }
 *   - "Show me John 3"   → { book: "John", chapter: 3,    verse: null }
 *   - "Show me John 3 16"→ { book: "John", chapter: 3,    verse: 16   }
 *
 * Runs in <1ms — safe to call on every partial without debounce.
 */
export function detectBookAndChapter(text: string): EarlyDetection | null {
  if (!text || text.trim().length < 2) return null;

  // Normalize: strip conversational filler, convert word numbers, clean punctuation
  let cleaned = text
    .replace(/[.,!?;:]+/g, " ")
    .replace(
      /\b(show me|go to|turn to|read|open|find|can you|please|the book of|book of|the)\b/gi,
      "",
    )
    .replace(/\s+/g, " ")
    .trim();

  // Convert spoken numbers to digits
  cleaned = convertWordNumbers(cleaned);
  const lower = cleaned.toLowerCase();

  // Try to find a book name — scan from longest candidate to shortest
  const words = lower.split(/\s+/);
  let matchedBook: string | null = null;
  let remainingWords: string[] = [];

  // Try numbered book first: "1 john", "2 samuel" etc.
  if (words.length >= 2 && /^\d$/.test(words[0])) {
    const candidate = `${words[0]} ${words[1]}`;
    const resolved = resolveBook(candidate);
    if (resolved) {
      matchedBook = resolved;
      remainingWords = words.slice(2);
    }
  }

  // Try multi-word then single-word book names
  if (!matchedBook) {
    for (let len = Math.min(3, words.length); len >= 1; len--) {
      const candidate = words.slice(0, len).join(" ");
      const resolved = resolveBook(candidate);
      if (resolved) {
        matchedBook = resolved;
        remainingWords = words.slice(len);
        break;
      }
    }
  }

  if (!matchedBook) return null;

  // Extract numbers from remaining words
  const numbers = remainingWords
    .filter((w) => /^\d+$/.test(w))
    .map(Number);

  const chapter = numbers.length >= 1 ? numbers[0] : null;
  const verse = numbers.length >= 2 ? numbers[1] : null;

  // Confidence increases with specificity
  const confidence = verse ? 0.95 : chapter ? 0.8 : 0.6;

  return {
    book: matchedBook,
    chapter,
    verse,
    confidence,
  };
}

/**
 * Pre-fetch a chapter from IndexedDB into memory.
 * Returns the chapter data or null if not found.
 * This is designed to be called speculatively on partial matches.
 */
export async function prefetchChapter(
  book: string,
  chapter: number,
  version: BibleVersion = "kjv",
): Promise<OfflineBibleResult | null> {
  try {
    const verses = await db.verses
      .where("[version+book+chapter]")
      .equals([version, book, chapter])
      .sortBy("verse");

    if (!verses.length) return null;

    return {
      book,
      chapter,
      verses: verses.map((v) => ({ number: v.verse, text: v.text })),
      version,
      formattedReference: `${book} ${chapter}`,
    };
  } catch (err) {
    console.error("[OfflineBible] Prefetch error:", err);
    return null;
  }
}

