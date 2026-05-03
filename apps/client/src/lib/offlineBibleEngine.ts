/**
 * Offline Bible Engine â€” Fully Self-Contained Browser/Electron Module
 *
 * No Node.js dependencies. No server calls. Works 100% offline.
 * Reads Bible data from IndexedDB (populated by useBibleSync).
 */

import FuseImport from "../../node_modules/fuse.js/dist/fuse.mjs";
import { getLiveConsoleBibleBooks } from "../features/dashboard/data/bibleBooks.ts";
import { useBibleRAMCache } from "../features/dashboard/hooks/useBibleRAMCache";

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

const BIBLE_BOOK_METADATA = new Map(
  getLiveConsoleBibleBooks().map((book) => [
    book.name,
    {
      chapters: book.chapters,
      verses: book.verses,
    },
  ]),
);

function isValidBibleReference(ref: Pick<BibleReference, "book" | "chapter" | "verseStart" | "verseEnd">) {
  const meta = BIBLE_BOOK_METADATA.get(ref.book);
  if (!meta) return true;
  if (!Number.isFinite(ref.chapter) || ref.chapter < 1 || ref.chapter > meta.chapters) return false;

  const maxVerse = meta.verses[ref.chapter - 1] ?? Number.POSITIVE_INFINITY;
  if (!Number.isFinite(ref.verseStart) || ref.verseStart < 1 || ref.verseStart > maxVerse) return false;
  if (ref.verseEnd != null && (!Number.isFinite(ref.verseEnd) || ref.verseEnd < ref.verseStart || ref.verseEnd > maxVerse)) {
    return false;
  }

  return true;
}

function getBibleBookMetadata(book: string) {
  return BIBLE_BOOK_METADATA.get(book) ?? null;
}

function isSingleChapterBook(book: string): boolean {
  return (getBibleBookMetadata(book)?.chapters ?? 0) === 1;
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
  /**
   * CGE: true when the transcript contained an explicit "chapter" cue word.
   * Used by the Confidence Gating Engine to apply structural penalties.
   */
  hasChapterCue?: boolean;
  /**
   * CGE: true when the transcript contained an explicit "verse" cue word.
   * Used by the Confidence Gating Engine to apply structural penalties.
   */
  hasVerseCue?: boolean;
}

// ============================================================
// Book name table â€” alias â†’ canonical name
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
  liviticus: "Leviticus",
  levidicus: "Leviticus",
  leviticuss: "Leviticus",
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
  pslams: "Psalms",
  pslamss: "Psalms",
  sams: "Psalms",
  psa: "Psalms",
  ps: "Psalms",
  proverbs: "Proverbs",
  prov: "Proverbs",
  pro: "Proverbs",
  ecclesiastes: "Ecclesiastes",
  ecc: "Ecclesiastes",
  "song of solomon": "Song of Solomon",
  "song of songs": "Song of Solomon",
  "songs of songs": "Song of Solomon",
  "song songs": "Song of Solomon",
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
  obadia: "Obadiah",
  jonah: "Jonah",
  jon: "Jonah",
  micah: "Micah",
  mic: "Micah",
  nahum: "Nahum",
  nah: "Nahum",
  habakkuk: "Habakkuk",
  hab: "Habakkuk",
  habbakkuk: "Habakkuk",
  habbakuk: "Habakkuk",
  zephaniah: "Zephaniah",
  zeph: "Zephaniah",
  haggai: "Haggai",
  hag: "Haggai",
  zechariah: "Zechariah",
  zech: "Zechariah",
  zachariah: "Zechariah",
  malachi: "Malachi",
  malachia: "Malachi",
  mal: "Malachi",
  matthew: "Matthew",
  mathew: "Matthew",
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
  roman: "Romans",
  romens: "Romans",
  rom: "Romans",
  "1 corinthians": "1 Corinthians",
  "1corinthians": "1 Corinthians",
  "1 corinthian": "1 Corinthians",
  "1corinthian": "1 Corinthians",
  "1cor": "1 Corinthians",
  "1co": "1 Corinthians",
  "first corinthians": "1 Corinthians",
  "first corinthian": "1 Corinthians",
  "first corintians": "1 Corinthians",
  "first corintian": "1 Corinthians",
  "first corenthians": "1 Corinthians",
  "first corenthian": "1 Corinthians",
  "first corinthens": "1 Corinthians",
  "first core inthians": "1 Corinthians",
  "first coreinthians": "1 Corinthians",
  "passcore in": "1 Corinthians",
  "passcor in": "1 Corinthians",
  "past core in": "1 Corinthians",
  "2 corinthians": "2 Corinthians",
  "2corinthians": "2 Corinthians",
  "2 corinthian": "2 Corinthians",
  "2corinthian": "2 Corinthians",
  "2cor": "2 Corinthians",
  "2co": "2 Corinthians",
  "second corinthians": "2 Corinthians",
  "second corinthian": "2 Corinthians",
  "second corintians": "2 Corinthians",
  "second corintian": "2 Corinthians",
  galatians: "Galatians",
  gal: "Galatians",
  ephesians: "Ephesians",
  eph: "Ephesians",
  philippians: "Philippians",
  philippian: "Philippians",
  philipians: "Philippians",
  philiipians: "Philippians",
  phillipians: "Philippians",
  phillippians: "Philippians",
  filipians: "Philippians",
  filippians: "Philippians",
  filipianss: "Philippians",
  phil: "Philippians",
  colossians: "Colossians",
  colosians: "Colossians",
  collossians: "Colossians",
  col: "Colossians",
  "1 thessalonians": "1 Thessalonians",
  "1 thessalonian": "1 Thessalonians",
  "1thess": "1 Thessalonians",
  "1th": "1 Thessalonians",
  "first thessalonians": "1 Thessalonians",
  "first thessalonian": "1 Thessalonians",
  "1 tessalonians": "1 Thessalonians",
  "2 thessalonians": "2 Thessalonians",
  "2 thessalonian": "2 Thessalonians",
  "2thess": "2 Thessalonians",
  "2th": "2 Thessalonians",
  "second thessalonians": "2 Thessalonians",
  "second thessalonian": "2 Thessalonians",
  "2 tessalonians": "2 Thessalonians",
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
  // James — Whisper phonetic aliases (Category D)
  jame: "James",
  jaymes: "James",
  jaimes: "James",
  jams: "James",
  jame: "James",
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

  // ─── STT phonetic aliases (common Whisper misheard variants) ───
  // Category C: Whole-book failures — Galatians, Philippians, Colossians,
  //              1/2 Thessalonians, Philemon
  // Galatians — Whisper commonly hears: galations, galashans, galashions, galatians (correct), galations
  galations: "Galatians",
  galashans: "Galatians",
  galashions: "Galatians",
  galations: "Galatians",
  galashens: "Galatians",
  galashins: "Galatians",
  galacians: "Galatians",
  galaceans: "Galatians",
  galacians: "Galatians",
  galatian: "Galatians",
  // Philippians — Whisper may hear: philippine, philippines, filipinos, philippine chapter
  philippine: "Philippians",
  philippines: "Philippians",
  filipinos: "Philippians",
  filipinos: "Philippians",
  filipinas: "Philippians",
  philipines: "Philippians",
  phillipines: "Philippians",
  phillippines: "Philippians",
  // Colossians — Whisper may hear: colossions, colosions, colossions, colosians (already covered), colossions
  colossions: "Colossians",
  colosions: "Colossians",
  colosseons: "Colossians",
  colosseons: "Colossians",
  colosseans: "Colossians",
  colossean: "Colossians",
  colossian: "Colossians",
  // 1 Thessalonians — Whisper may hear: thessalonions, thessolonians, thessalonica, thessalonions
  "1 thessalonions": "1 Thessalonians",
  "1 thessolonians": "1 Thessalonians",
  "1 thessolonian": "1 Thessalonians",
  "1 thessalonions": "1 Thessalonians",
  "1 thessalonica": "1 Thessalonians",
  "first thessalonions": "1 Thessalonians",
  "first thessolonians": "1 Thessalonians",
  "first thessalonica": "1 Thessalonians",
  "1 thessalonions": "1 Thessalonians",
  "1 thess": "1 Thessalonians",
  // 2 Thessalonians
  "2 thessalonions": "2 Thessalonians",
  "2 thessolonians": "2 Thessalonians",
  "2 thessolonian": "2 Thessalonians",
  "2 thessalonica": "2 Thessalonians",
  "second thessalonions": "2 Thessalonians",
  "second thessolonians": "2 Thessalonians",
  "second thessalonica": "2 Thessalonians",
  "2 thess": "2 Thessalonians",
  // Philemon — Whisper may hear: phillemon, philamen, fileman, philemon (correct)
  phillemon: "Philemon",
  philamen: "Philemon",
  fileman: "Philemon",
  philamon: "Philemon",
  philamon: "Philemon",
  phylemon: "Philemon",
  phylamon: "Philemon",
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
  laviticus: "Leviticus",
  deuteronamy: "Deuteronomy",
  deuteranomy: "Deuteronomy",
  deuteronami: "Deuteronomy",
  deuteronomyy: "Deuteronomy",
  duderonomy: "Deuteronomy",
  josua: "Joshua",
  proverb: "Proverbs",
  proverbes: "Proverbs",
  sam: "Psalms",
  songs: "Psalms",
  salm: "Psalms",
  salms: "Psalms",
  saw: "Psalms",
  sawm: "Psalms",
  sawms: "Psalms",
  isaya: "Isaiah",
  mathews: "Matthew",
  mattew: "Matthew",
  marc: "Mark",
  jone: "John",
  joan: "John",
  ax: "Acts",
  romanss: "Romans",
  filipino: "Philippians",
  filippian: "Philippians",
  filipenses: "Philippians",
  filemon: "Philemon",
  phileman: "Philemon",
  philimon: "Philemon",
  hebrew: "Hebrews",
  jame: "James",
  revelations: "Revelation",
  revelacion: "Revelation",

  // ─── QC10 Phonetic Alias Mappings ───────────────────────────────────────────
  // Short aliases for acoustically difficult OT/NT books.
  // These are added to the Vosk grammar so the engine can produce them,
  // and mapped here so the parser resolves them to canonical book names.
  // All alias-matched commands are routed to the Confidence Queue (0.80).
  //
  // Zechariah
  zach: "Zechariah",
  zack: "Zechariah",
  zacka: "Zechariah",
  // Malachi
  mal: "Malachi",
  mali: "Malachi",
  // Nahum
  nah: "Nahum",
  // Habakkuk
  hab: "Habakkuk",
  habba: "Habakkuk",
  // Ecclesiastes
  eccl: "Ecclesiastes",
  eccles: "Ecclesiastes",
  // Obadiah
  obad: "Obadiah",
  // Zephaniah
  zeph: "Zephaniah",
  // Philippians short alias (ambiguous with Philemon — CGE routes to queue)
  phil: "Philippians",
  // ─── End QC10 Phonetic Alias Mappings ───────────────────────────────────────
};

const ALL_CANONICAL_BOOKS = [...new Set(Object.values(BOOK_ALIASES))];
const BOOK_ALIAS_KEYS = Object.keys(BOOK_ALIASES);
const BOOK_ALIASES_BY_CANONICAL = new Map<string, string[]>();
for (const [alias, canonical] of Object.entries(BOOK_ALIASES)) {
  const aliases = BOOK_ALIASES_BY_CANONICAL.get(canonical) ?? [];
  aliases.push(alias);
  BOOK_ALIASES_BY_CANONICAL.set(canonical, aliases);
}
for (const aliases of BOOK_ALIASES_BY_CANONICAL.values()) {
  aliases.sort((left, right) => compactBookKey(right).length - compactBookKey(left).length);
}
const COMMON_COMMAND_FILLERS = new Set([
  "show",
  "me",
  "please",
  "read",
  "give",
  "bring",
  "open",
  "take",
  "from",
  "for",
  "with",
  "into",
  "the",
  "a",
  "an",
  "book",
  "bible",
  "in",
  "to",
  "of",
  "on",
  "go",
]);
const ENGLISH_BIBLE_VOCAB = new Set([
  ...BOOK_ALIAS_KEYS.flatMap((alias) => alias.split(/\s+/)),
  ...ALL_CANONICAL_BOOKS.flatMap((book) => book.toLowerCase().split(/\s+/)),
  "kjv",
  "nkjv",
  "niv",
  "esv",
  "amp",
  "msg",
  "gn",
  "gnt",
  "king",
  "james",
  "new",
  "international",
  "english",
  "standard",
  "amplified",
  "message",
  "good",
  "news",
  "translation",
  "version",
  "chapter",
  "verse",
  "verses",
  "next",
  "previous",
  "prev",
  "prior",
  "back",
  "forward",
  "continue",
  "advance",
  "through",
  "and",
  "or",
  "then",
  "wake",
  "sleep",
  "amen",
  "thank",
  "you",
]);

function normalizeBookKey(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\bfirst\b/g, "1")
    .replace(/\bsecond\b/g, "2")
    .replace(/\bthird\b/g, "3")
    .replace(/\s+/g, " ")
    .trim();
}

function compactBookKey(raw: string): string {
  return normalizeBookKey(raw).replace(/\s+/g, "");
}

function levenshteinDistance(left: string, right: string): number {
  if (left === right) return 0;
  if (!left.length) return right.length;
  if (!right.length) return left.length;

  const rows = Array.from({ length: left.length + 1 }, (_, index) => index);
  for (let column = 1; column <= right.length; column += 1) {
    let previousDiagonal = rows[0];
    rows[0] = column;
    for (let row = 1; row <= left.length; row += 1) {
      const previousRow = rows[row];
      const substitutionCost = left[row - 1] === right[column - 1] ? 0 : 1;
      rows[row] = Math.min(
        rows[row] + 1,
        rows[row - 1] + 1,
        previousDiagonal + substitutionCost,
      );
      previousDiagonal = previousRow;
    }
  }

  return rows[left.length];
}

function similarityScore(left: string, right: string): number {
  const normalizedLeft = compactBookKey(left);
  const normalizedRight = compactBookKey(right);
  if (!normalizedLeft || !normalizedRight) return 0;
  if (normalizedLeft === normalizedRight) return 1;

  const distance = levenshteinDistance(normalizedLeft, normalizedRight);
  return 1 - distance / Math.max(normalizedLeft.length, normalizedRight.length);
}

const FuseCtor = (FuseImport as unknown as { default?: new (...args: any[]) => FuseImport<string> })?.default as
  | (new (...args: any[]) => FuseImport<string>)
  | undefined;

// Lazy Fuse.js instance for fuzzy book matching
let _fuse: FuseImport<string> | null | undefined = undefined;
function getFuse(): FuseImport<string> | null {
  if (_fuse !== undefined) return _fuse;

  if (!FuseCtor) {
    _fuse = null;
    return _fuse;
  }

  try {
    _fuse = new FuseCtor([...new Set([...BOOK_ALIAS_KEYS, ...ALL_CANONICAL_BOOKS])], {
      threshold: 0.38,
      includeScore: true,
      minMatchCharLength: 2,
    });
  } catch {
    _fuse = null;
  }

  return _fuse;
}

function resolveBookCandidate(raw: string): { book: string; score: number } | null {
  const normalized = normalizeBookKey(raw);
  if (!normalized) return null;

  if (BOOK_ALIASES[normalized]) {
    return { book: BOOK_ALIASES[normalized], score: 1 };
  }

  const compact = compactBookKey(normalized);
  let best: { book: string; score: number } | null = null;

  for (const alias of BOOK_ALIAS_KEYS) {
    const aliasCompact = compactBookKey(alias);
    const book = BOOK_ALIASES[alias];
    let score = similarityScore(compact, aliasCompact);

    if (compact === aliasCompact) score = 1;
    else if (compact.startsWith(aliasCompact) || aliasCompact.startsWith(compact)) score += 0.08;

    const hasSameOrdinalPrefix = /^[123]/.test(compact) === /^[123]/.test(aliasCompact)
      && (!/^[123]/.test(compact) || compact[0] === aliasCompact[0]);
    if (hasSameOrdinalPrefix) score += 0.05;

    if (!best || score > best.score) {
      best = { book, score };
    }
  }

  const fuse = getFuse();
  const fuseResults = fuse ? fuse.search(normalized) : [];
  if (fuseResults.length > 0) {
    const fuseTop = fuseResults[0];
    const alias = normalizeBookKey(fuseTop.item);
    const book = BOOK_ALIASES[alias] ?? fuseTop.item;
    const score = 1 - (fuseTop.score ?? 1);
    if (!best || score > best.score) {
      best = { book, score };
    }
  }

  return best && best.score >= 0.58 ? best : null;
}

function resolveBook(raw: string): string | null {
  return resolveBookCandidate(raw)?.book ?? null;
}

function extractLikelyBookCandidate(text: string): { book: string; score: number } | null {
  const cleaned = normalizeBookKey(text);
  if (!cleaned) return null;

  const tokens = cleaned
    .split(/\s+/)
    .filter((token) => token && !COMMON_COMMAND_FILLERS.has(token));

  let best: { book: string; score: number } | null = null;
  for (let size = Math.min(4, tokens.length); size >= 1; size -= 1) {
    for (let start = 0; start <= tokens.length - size; start += 1) {
      const window = tokens.slice(start, start + size).join(" ");
      const candidate = resolveBookCandidate(window);
      if (candidate && (!best || candidate.score > best.score)) {
        best = candidate;
      }
    }
  }

  return best && best.score >= 0.72 ? best : null;
}

function stripCommandPreamble(text: string): string {
  return text
    .replace(
      /^(?:please\s+)?(?:show|read|open|bring|give|take|project|display)\s+(?:me\s+)?(?:to\s+)?(?:the\s+)?/i,
      "",
    )
    .replace(/^(?:go\s+to|take\s+me\s+to|bring\s+me\s+to)\s+(?:the\s+)?/i, "")
    .replace(/\s+(?:please|for me)$/i, "")
    .trim();
}

function extractExplicitBookCandidate(text: string): { book: string; score: number } | null {
  const cleaned = normalizeBookKey(stripCommandPreamble(text));
  if (!cleaned) return null;

  const beforeStructureCue = cleaned
    .split(/\bchapter\b|\bverse\b|\bverses\b/)[0]
    .replace(/\b\d+\b.*$/, "")
    .trim();

  const tokens = beforeStructureCue
    .split(/\s+/)
    .filter((token) => token && !COMMON_COMMAND_FILLERS.has(token));

  for (let size = Math.min(4, tokens.length); size >= 1; size -= 1) {
    const candidateText = tokens.slice(tokens.length - size).join(" ");
    const candidate = resolveBookCandidate(candidateText);
    if (candidate && candidate.score >= 0.74) {
      return candidate;
    }
  }

  return null;
}

function isLikelyEnglishBibleTranscript(text: string): boolean {
  const normalized = normalizeBookKey(text);
  if (!normalized) return true;
  if (/[^\x00-\x7F]/.test(text)) return false;

  const tokens = normalized.split(/\s+/).filter(Boolean);
  const alphaTokens = tokens.filter((token) => /[a-z]/.test(token));
  if (!alphaTokens.length) return true;

  const knownCount = alphaTokens.filter(
    (token) => ENGLISH_BIBLE_VOCAB.has(token) || BOOK_ALIASES[token] || token.length <= 2,
  ).length;

  return knownCount / alphaTokens.length >= 0.45;
}

// ============================================================
// Version aliases
// ============================================================
const VERSION_MAP: Record<string, BibleVersion> = {
  kjv: "kjv",
  "king james": "kjv",
  "king james version": "kjv",
  "king james bible": "kjv",
  // Vosk mishearings of "KJV"
  "k j v": "kjv",
  nkjv: "nkjv",
  "new king james": "nkjv",
  "new king james version": "nkjv",
  "new king james bible": "nkjv",
  // Vosk mishearings of "NKJV" — it often drops the N or hears "in cave"
  "in king james": "nkjv",
  "and king james": "nkjv",
  niv: "niv",
  "new international": "niv",
  "new international version": "niv",
  "new international bible": "niv",
  // Vosk mishearings of "NIV"
  "n i v": "niv",
  esv: "esv",
  "english standard": "esv",
  "english standard version": "esv",
  "english standard bible": "esv",
  // Vosk mishearings of "ESV"
  "e s v": "esv",
  amp: "amp",
  amplified: "amp",
  "amplified bible": "amp",
  "amplified version": "amp",
  // Vosk mishearings of "AMP" — it often hears "amp" correctly
  "the amplified": "amp",
  msg: "msg",
  message: "msg",
  "the message": "msg",
  "message bible": "msg",
  "message version": "msg",
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
  /(?:\bnext verse\b|\bfollowing verse\b|\bgo next\b|\bnext one\b|\bone more\b|\bread on\b|^(?:next|forward|continue|advance|next please)$)/i;
const NAV_PREV =
  /(?:\bprevious verse\b|\bprev verse\b|\bprior verse\b|\bgo to the previous verse\b|\bgo to previous verse\b|\bback one\b|^(?:previous|prev|go back|back|prior|last one|previous please)$)/i;
const NAV_NEXT_CH =
  /^(next chapter|chapter forward|advance.*chapter|following chapter)$/i;
const NAV_PREV_CH =
  /^(previous chapter|prev chapter|chapter back|last chapter|prior chapter)$/i;
const VERSION_SWITCH =
  /(?:(?:show me|switch to|use|change to|read in|give me|put it in)\s+)?(?:the\s+)?(kjv|nkjv|niv|esv|amp|msg|gn|gnt|amplified|king james|king james version|new king james|new king james version|english standard|english standard version|new international|new international version|good news|good news bible|the message|message)\s*(version|translation|bible)?(?:\s+\w+){0,3}$/i;
const JUMP_TO_VERSE =
  /^(?:(?:take|bring|move|jump|go|proceed|show|open|let(?:'|â€™)s go|lets go)\s+(?:me|us)?\s*(?:to\s+)?)?(?:the\s+)?(?:verse\s+)?(\d+)$/i;
const EXPLICIT_JUMP_TO_VERSE =
  /^(?:(?:take|bring|move|jump|go|proceed|show|open)(?:\s+me|\s+us)?\s+(?:to\s+)?)?(?:the\s+)?verse\s+(\d+)$/i;

// Reference patterns (handle both typed and voice)
const PATTERNS = [
  // "1 John 3:16-18"  or  "2 samuel 7:12"
  /^(\d)\s*([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.:](\d+)(?:\s*[-â€“]\s*(\d+))?$/i,
  // "John 3:16-18"
  /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.:](\d+)(?:\s*[-â€“]\s*(\d+))?$/i,
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
 * Convert simple word numbers to digits ("three" â†’ 3, "sixteen" â†’ 16).
 * Handles common cases without requiring words-to-numbers npm package.
 */
const WORD_NUMS: Record<string, number> = {
  zero: 0,
  oh: 0,
  o: 0,
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
const NUMBER_CONNECTOR_WORDS = new Set(["and"]);

function convertWordNumbers(text: string): string {
  // Step 0: context-aware phonetic number recovery.
  //
  // Vosk frequently mishears number words as other English words, especially
  // when those words appear in a numeric position (after "chapter" or "verse").
  // We apply replacements ONLY in that context so that actual Bible book names
  // (e.g. "Ezra chapter 3") are never corrupted.
  //
  // The table maps each Vosk mishearing to its correct digit. "Eight" is the
  // most problematic — Vosk transcribes it as "ezra", "english", "ate", "a",
  // "hey", "h" etc. depending on the audio quality and accent.
  //
  // Format: [mishearing, digit] — applied after "chapter" or "verse" keyword.
  const PHONETIC_NUMBER_RECOVERY: [RegExp, string][] = [
    // "eight" mishearings (Vosk/Whisper both affected)
    [/\b(chapter|verse)(\s+the)?\s+ezra\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} 8`],
    [/\b(chapter|verse)(\s+the)?\s+english\b/gi, (_m, kw, th) => `${kw}${th ?? ""} 8`],
    [/\b(chapter|verse)(\s+the)?\s+ate\b/gi,    (_m, kw, th) => `${kw}${th ?? ""} 8`],
    [/\b(chapter|verse)(\s+the)?\s+hey\b/gi,    (_m, kw, th) => `${kw}${th ?? ""} 8`],
    // Also handle when the mishearing appears in chapter position before "verse"
    [/\bezra\s+verse\b/gi,    "8 verse"],
    [/\benglish\s+verse\b/gi, "8 verse"],
    [/\bate\s+verse\b/gi,     "8 verse"],
    // Category B: Whisper-specific single-digit mishearings in verse/chapter position
    // "four" — Whisper sometimes hears "for" (preposition) or "fore" in numeric context
    [/\b(chapter|verse)(\s+the)?\s+for\b(?!\s+(?:me|you|us|him|her|them|it|the|a|an))/gi,
      (_m, kw, th) => `${kw}${th ?? ""} 4`],
    [/\b(chapter|verse)(\s+the)?\s+fore\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} 4`],
    // "six" — Whisper sometimes hears "sex" or "sicks" in numeric context
    [/\b(chapter|verse)(\s+the)?\s+sex\b/gi,    (_m, kw, th) => `${kw}${th ?? ""} 6`],
    [/\b(chapter|verse)(\s+the)?\s+sicks\b/gi,  (_m, kw, th) => `${kw}${th ?? ""} 6`],
    [/\b(chapter|verse)(\s+the)?\s+sics\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} 6`],
    // "three" — Whisper sometimes hears "free" or "tree" in numeric context
    [/\b(chapter|verse)(\s+the)?\s+free\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} 3`],
    [/\b(chapter|verse)(\s+the)?\s+tree\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} 3`],
    // "seven" — Whisper sometimes hears "heaven" in numeric context
    [/\b(chapter|verse)(\s+the)?\s+heaven\b/gi, (_m, kw, th) => `${kw}${th ?? ""} 7`],
    // Category B: Tens+units collapse — Whisper drops the tens word, leaving only the units digit.
    // e.g. "thirty seven" → Whisper transcribes as "thirty" then drops it, leaving "seven" → 7
    // We fix this by detecting when a tens word appears AFTER chapter/verse and is followed by
    // a units word, ensuring they are kept together for compound number parsing.
    // This is handled by the existing compoundRe in Step 2, but we add explicit recovery for
    // cases where Whisper drops the tens word entirely and only emits the units.
    // The real fix is to ensure the TENS_WORDS list in Step 2 also covers Whisper mishearings
    // of tens words ("thirdy", "thirtee", "terty", etc.).
    [/\b(chapter|verse)(\s+the)?\s+thirdy\b/gi,  (_m, kw, th) => `${kw}${th ?? ""} thirty`],
    [/\b(chapter|verse)(\s+the)?\s+thirtee\b/gi, (_m, kw, th) => `${kw}${th ?? ""} thirty`],
    [/\b(chapter|verse)(\s+the)?\s+terty\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} thirty`],
    [/\b(chapter|verse)(\s+the)?\s+forty\b/gi,   (_m, kw, th) => `${kw}${th ?? ""} forty`],
    // NIV/version word appearing mid-reference (Category D prep): strip it from numeric slots
    // e.g. "hebrews chapter niv one" → "hebrews chapter one"
    [/\b(chapter|verse)(\s+the)?\s+(?:niv|kjv|nkjv|esv|amp|msg)\s+(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred)\b/gi,
      (_m, kw, th, num) => `${kw}${th ?? ""} ${num}`],
  ];
  let result = text;
  for (const [pattern, replacement] of PHONETIC_NUMBER_RECOVERY) {
    result = result.replace(pattern, replacement as any);
  }

  // Step 1: normalise ordinal suffixes so they become plain number words.
  result = result
    .replace(/\b1st\b/gi, "first")
    .replace(/\b2nd\b/gi, "second")
    .replace(/\b3rd\b/gi, "third");

  // Step 2: collapse compound spoken numbers BEFORE single-word replacement so
  // that phrases like "twenty one" → "21", "thirty five" → "35", etc. are
  // handled correctly.  We match the pattern:
  //   (twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety) (one|two|...|nine)
  // with an optional "and" connector ("twenty and one" is rare but valid speech).
  //
  // NOTE: Vosk commonly mishears "two" as "to" (the preposition), so we include
  // "to" in the ONES_WORDS list and map it to 2 in the replacement.
  const TENS_WORDS = "twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety";
  const ONES_WORDS = "one|two|to|three|four|five|six|seven|eight|nine";
  const ONES_MAP: Record<string, number> = { one: 1, two: 2, to: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9 };
  const compoundRe = new RegExp(
    `\\b(${TENS_WORDS})(?:\\s+and)?\\s+(${ONES_WORDS})\\b`,
    "gi",
  );
  result = result.replace(compoundRe, (_match, tens, ones) => {
    const t = WORD_NUMS[tens.toLowerCase()] ?? 0;
    const o = ONES_MAP[ones.toLowerCase()] ?? WORD_NUMS[ones.toLowerCase()] ?? 0;
    return String(t + o);
  });

  // Step 3: replace remaining single number words with digits.
  result = result.replace(/\b([a-z]+)\b/gi, (match) => {
    const lower = match.toLowerCase();
    if (WORD_NUMS[lower] !== undefined) return String(WORD_NUMS[lower]);
    return match;
  });

  return result;
}

function isNumericToken(token: string): boolean {
  return /^\d+$/.test(token) || WORD_NUMS[token] !== undefined || NUMBER_CONNECTOR_WORDS.has(token);
}

function parseNumberPhraseTokens(tokens: string[], options?: { allowDigitSequence?: boolean }): number | null {
  const filtered = tokens
    .map((token) => token.toLowerCase())
    .filter((token) => token && !NUMBER_CONNECTOR_WORDS.has(token));
  if (!filtered.length) return null;

  const values = filtered.map((token) => {
    if (/^\d+$/.test(token)) return parseInt(token, 10);
    if (WORD_NUMS[token] !== undefined) return WORD_NUMS[token];
    return NaN;
  });
  if (values.some((value) => Number.isNaN(value))) return null;

  const allowDigitSequence = options?.allowDigitSequence ?? false;
  if (allowDigitSequence && values.length > 1 && values.every((value) => value >= 0 && value <= 9)) {
    return parseInt(values.join(""), 10);
  }

  let current = 0;
  for (const value of values) {
    if (value === 100) {
      current = current === 0 ? 100 : current * 100;
      continue;
    }

    if (current === 0) {
      current = value;
      continue;
    }

    if (current % 100 === 0) {
      current += value;
      continue;
    }

    if (current >= 20 && current < 100 && current % 10 === 0 && value < 10) {
      current += value;
      continue;
    }

    return null;
  }

  return current;
}

function tokenizeNumericFragment(fragment: string): string[] {
  return normalizeBookKey(fragment)
    .split(/\s+/)
    .filter((token) => token && isNumericToken(token));
}

function parseNumericSlots(
  fragment: string,
  exactCount: number,
  options?: { allowDigitSequence?: boolean },
): number[] | null {
  const tokens = tokenizeNumericFragment(fragment);
  if (!tokens.length) return null;

  const results: number[][] = [];
  const visit = (start: number, parts: number[]) => {
    if (parts.length > exactCount) return;
    if (start === tokens.length) {
      if (parts.length === exactCount) results.push([...parts]);
      return;
    }

    for (let end = start + 1; end <= tokens.length; end += 1) {
      const parsed = parseNumberPhraseTokens(tokens.slice(start, end), options);
      if (parsed == null) continue;
      parts.push(parsed);
      visit(end, parts);
      parts.pop();
    }
  };

  visit(0, []);
  return results[0] ?? null;
}

function stripResolvedBookPrefix(text: string, canonicalBook: string): string {
  const normalized = normalizeBookKey(text);
  const aliases = BOOK_ALIASES_BY_CANONICAL.get(canonicalBook) ?? [normalizeBookKey(canonicalBook)];
  for (const alias of aliases) {
    if (normalized === alias) return "";
    if (normalized.startsWith(`${alias} `)) {
      return normalized.slice(alias.length).trim();
    }
  }

  return normalized;
}

function splitRangeFragment(fragment: string): { startFragment: string; endFragment?: string } {
  const normalized = fragment.trim();
  const rangeMatch = normalized.match(/^(.*?)(?:\s*(?:to|through|-)\s*)(.+)$/i);
  if (!rangeMatch) {
    return { startFragment: normalized };
  }

  return {
    startFragment: rangeMatch[1].trim(),
    endFragment: rangeMatch[2].trim(),
  };
}

function normalizeCueNumericSlotFragment(fragment: string): string {
  const normalized = fragment.trim().toLowerCase();

  // Handle single-word homophones of "two".
  if (/^(?:to|too)$/.test(normalized)) return "two";

  // Generic recovery: if the fragment contains a mix of non-numeric words and
  // digits/number-words, strip the non-numeric prefix words.
  //
  // This handles Vosk mishearing any number word as an arbitrary English word
  // (e.g. "eight" → "english", "ezra", "ate", "hey", etc.). The digit that
  // follows is still correctly transcribed, so we just discard the garbage word
  // and keep the digit.
  //
  // Example: "english 6" → "6", "ezra 6" → "6", "ate 6" → "6"
  // Safe: "twenty six" stays as-is (both tokens are number words).
  // Safe: "6" stays as-is (already a digit).
  const tokens = normalized.split(/\s+/).filter(Boolean);
  if (tokens.length >= 2) {
    // Check if the fragment has at least one digit/number-word token.
    const hasNumericToken = tokens.some((t) => /^\d+$/.test(t) || WORD_NUMS[t] !== undefined);
    if (hasNumericToken) {
      // Strip leading tokens that are neither digits nor known number words.
      const cleaned = tokens.filter((t) => /^\d+$/.test(t) || WORD_NUMS[t] !== undefined || NUMBER_CONNECTOR_WORDS.has(t));
      if (cleaned.length > 0 && cleaned.length < tokens.length) {
        return cleaned.join(" ");
      }
    }
  }

  return fragment;
}

function parseStructuredLookupByCue(
  coreText: string,
  original: string,
  defaultVersion: BibleVersion,
): ParsedVoiceCommand | null {
  const normalizedCore = normalizeTranscript(coreText);
  const hasChapterCue = /\bchapter\b/i.test(normalizedCore);
  const hasVerseCue = /\bverses?\b/i.test(normalizedCore);
  if (!hasChapterCue && !hasVerseCue) return null;

  const explicitBook = extractExplicitBookCandidate(normalizedCore);
  const bookPrefix = normalizedCore.split(/\bchapter\b|\bverses?\b/i)[0]?.trim() ?? "";
  const bookCandidate = explicitBook ?? resolveBookCandidate(bookPrefix);
  if (!bookCandidate || bookCandidate.score < 0.64) {
    return {
      originalText: original,
      parsedReference: null,
      commandType: "lookup",
      confidence: 0,
      hasChapterCue,
      hasVerseCue,
    };
  }

  const bookTail = stripResolvedBookPrefix(bookPrefix, bookCandidate.book);
  const chapterFragment = hasChapterCue
    ? (hasVerseCue
        ? normalizedCore.split(/\bchapter\b/i)[1]?.split(/\bverses?\b/i)[0]?.trim() ?? ""
        : normalizedCore.split(/\bchapter\b/i)[1]?.trim() ?? "")
    : "";
  const verseFragment = hasVerseCue ? normalizedCore.split(/\bverses?\b/i)[1]?.trim() ?? "" : "";
  const normalizedChapterFragment = normalizeCueNumericSlotFragment(chapterFragment);
  const normalizedVerseFragment = normalizeCueNumericSlotFragment(verseFragment);

  let chapter: number | undefined;
  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  if (hasChapterCue) {
    const compactChapterVerse = !hasVerseCue
      ? parseNumericSlots(normalizedChapterFragment, 2, { allowDigitSequence: true })
      : null;
    if (compactChapterVerse) {
      [chapter, verseStart] = compactChapterVerse;
    } else {
      chapter =
        parseNumberPhraseTokens(tokenizeNumericFragment(normalizedChapterFragment), { allowDigitSequence: true })
        ?? parseNumericSlots(normalizedChapterFragment, 1, { allowDigitSequence: true })?.[0];
    }
  }

  if (hasVerseCue) {
    const { startFragment, endFragment } = splitRangeFragment(normalizedVerseFragment);
    verseStart =
      parseNumberPhraseTokens(tokenizeNumericFragment(startFragment), { allowDigitSequence: true })
      ?? parseNumericSlots(startFragment, 1, { allowDigitSequence: true })?.[0];
    verseEnd = endFragment
      ? (
          parseNumberPhraseTokens(tokenizeNumericFragment(endFragment), { allowDigitSequence: true })
          ?? parseNumericSlots(endFragment, 1, { allowDigitSequence: true })?.[0]
        )
      : undefined;

    if (chapter == null) {
      chapter =
        parseNumberPhraseTokens(tokenizeNumericFragment(bookTail), { allowDigitSequence: false })
        ?? parseNumericSlots(bookTail, 1, { allowDigitSequence: false })?.[0];
    }

    if (chapter == null && isSingleChapterBook(bookCandidate.book)) {
      chapter = 1;
    }
  }

  if (chapter == null) {
    chapter = 1;
  }

  if (verseStart == null) {
    verseStart = 1;
  }

  const parsedReference = {
    book: bookCandidate.book,
    chapter,
    verseStart,
    verseEnd,
    version: defaultVersion,
  };

  if (!isValidBibleReference(parsedReference)) {
    return {
      originalText: original,
      parsedReference: null,
      commandType: "lookup",
      confidence: 0,
      hasChapterCue,
      hasVerseCue,
    };
  }

  return {
    originalText: original,
    commandType: "lookup",
    confidence: Math.max(0.88, Math.min(0.98, bookCandidate.score + 0.08)),
    parsedReference,
    hasChapterCue,
    hasVerseCue,
  };
}

function parseCompactLookupBySlots(
  coreText: string,
  original: string,
  defaultVersion: BibleVersion,
): ParsedVoiceCommand | null {
  const normalizedCore = normalizeTranscript(coreText);
  if (/\bchapter\b|\bverses?\b/i.test(normalizedCore)) return null;

  const explicitBook = extractExplicitBookCandidate(normalizedCore);
  const bookCandidate = explicitBook ?? extractLikelyBookCandidate(normalizedCore);
  if (!bookCandidate || bookCandidate.score < 0.82) return null;

  const trailingReference = stripResolvedBookPrefix(normalizedCore, bookCandidate.book);
  if (!trailingReference) return null;

  const compactTriple = parseNumericSlots(trailingReference, 3, { allowDigitSequence: false });
  const compactDouble = parseNumericSlots(trailingReference, 2, { allowDigitSequence: false });
  const compactSingle = parseNumericSlots(trailingReference, 1, { allowDigitSequence: false });

  let chapter: number | undefined;
  let verseStart: number | undefined;
  let verseEnd: number | undefined;

  if (compactDouble) {
    [chapter, verseStart] = compactDouble;
  } else if (compactTriple) {
    [chapter, verseStart, verseEnd] = compactTriple;
  } else if (compactSingle) {
    if (isSingleChapterBook(bookCandidate.book)) {
      chapter = 1;
      [verseStart] = compactSingle;
    } else {
      [chapter] = compactSingle;
      verseStart = 1;
    }
  }

  if (chapter == null || verseStart == null) return null;

  const parsedReference = {
    book: bookCandidate.book,
    chapter,
    verseStart,
    verseEnd,
    version: defaultVersion,
  };

  if (!isValidBibleReference(parsedReference)) return null;

  return {
    originalText: original,
    commandType: "lookup",
    confidence: Math.max(0.9, Math.min(0.98, bookCandidate.score + 0.04)),
    parsedReference,
  };
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

  // Category D fix 1: Version word inserted mid-reference by Whisper
  // e.g. "hebrews chapter niv one" → "hebrews chapter one"
  // e.g. "hebrews chapter niv 9" → "hebrews chapter 9"
  t = t.replace(
    /\b(chapter|verse)\s+(?:niv|kjv|nkjv|esv|amp|msg)\s+/gi,
    "$1 ",
  );

  // Category D fix 2: James/John disambiguation
  // Whisper sometimes transcribes "James" as "John" when followed by chapter/verse cues.
  // We cannot blindly rename John→James, but we can add a context rule:
  // if the transcript is exactly "john chapter N verse M" with no ordinal prefix (1/2/3/first/second/third),
  // we leave it as John (correct). The James→John confusion is handled by adding more
  // phonetic aliases for James in BOOK_ALIASES instead (see below).

  // Category D fix 3: Numbered John books — ensure "1 john", "2 john", "3 john"
  // are not collapsed to plain "john" by stripping the ordinal.
  // Whisper sometimes transcribes "1 John" as "one john" or "first john" correctly,
  // but may also emit "john" alone when the "1" is swallowed.
  // We normalise "one john" → "first john" and "two john" → "second john" here.
  t = t.replace(/\bone\s+john\b/gi, "first john");
  t = t.replace(/\btwo\s+john\b/gi, "second john");
  t = t.replace(/\bthree\s+john\b/gi, "third john");

  // "chapter 5 is 5"  → "chapter 5 verse 5"
  // "chapter 5 and 6" → "chapter 5 verse 6"
  // "chapter 5 or 6"  → "chapter 5 verse 6"
  // "chapter 5 was 5" → "chapter 5 verse 5"
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
  const coreText = stripCommandPreamble(normalized) || normalized;
  const lower = normalized.toLowerCase();
  const coreLower = coreText.toLowerCase();

  // Standalone version-switch commands should be handled before the generic
  // transcript-language rejection gate so short phrases such as "show me the amplified bible"
  // are not discarded too early.
  //
  // Strategy: try multiple matching approaches in order of specificity.
  // 1. Exact match of the full coreLower against VERSION_MAP.
  // 2. VERSION_SWITCH regex (allows optional trailing noise words).
  // 3. Broad keyword scan: look for any version keyword anywhere in the
  //    transcript (handles Vosk noise like "show me the amplified eighty").
  //    Only fire this if the phrase contains a version-switch intent word
  //    ("show", "switch", "use", "change", "give", "read") or is short
  //    (≤ 6 words) and contains no book/chapter/verse cues.

  const earlyDirectVersion = resolveVersion(coreLower);
  if (earlyDirectVersion) {
    return {
      originalText: original,
      parsedReference: null,
      commandType: "version_change",
      requestedVersion: earlyDirectVersion,
      confidence: 1,
    };
  }

  const earlyVersionMatch = coreLower.match(VERSION_SWITCH);
  if (earlyVersionMatch) {
    const ver = resolveVersion(earlyVersionMatch[1]);
    if (ver) {
      return {
        originalText: original,
        parsedReference: null,
        commandType: "version_change",
        requestedVersion: ver,
        confidence: 1,
      };
    }
  }

  // Broad version keyword scan: handles Vosk noise artifacts after the version
  // name (e.g. "show me the amplified eighty" → amp, "the message bible please" → msg).
  // Only fires when the phrase has a version-switch intent word OR is short (≤ 6 words)
  // AND has no book/chapter/verse cues (to avoid false positives on scripture references).
  {
    const hasVersionIntent = /\b(show|switch|use|change|give|read|put)\b/i.test(coreLower);
    const wordCount = coreLower.split(/\s+/).filter(Boolean).length;
    const hasScriptureCue = /\b(chapter|verse|psalm|psalms)\b/i.test(coreLower);
    if ((hasVersionIntent || wordCount <= 6) && !hasScriptureCue) {
      // Try all multi-word version phrases longest-first to avoid partial matches.
      const versionPhrases = Object.keys(VERSION_MAP).sort((a, b) => b.length - a.length);
      for (const phrase of versionPhrases) {
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (new RegExp(`\\b${escaped}\\b`, "i").test(coreLower)) {
          const ver = VERSION_MAP[phrase];
          return {
            originalText: original,
            parsedReference: null,
            commandType: "version_change",
            requestedVersion: ver,
            confidence: 0.95,
          };
        }
      }
    }
  }

  // Navigation commands are checked BEFORE the English-transcript gate because
  // they are short phrases (e.g. "verse 21", "next verse") that would otherwise
  // fail the vocabulary-density check and be silently dropped.
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

  // Jump to verse number within the current chapter.
  const jumpMatch = lower.match(EXPLICIT_JUMP_TO_VERSE) || lower.match(JUMP_TO_VERSE);
  if (jumpMatch)
    return {
      originalText: original,
      parsedReference: null,
      commandType: "jump_to_verse",
      targetVerse: parseInt(jumpMatch[1]),
      confidence: 1,
    };

  if (!isLikelyEnglishBibleTranscript(normalized)) {
    return {
      originalText: original,
      parsedReference: null,
      commandType: "lookup",
      confidence: 0,
    };
  }

  // Detect cues here so fallback paths can propagate them to the CGE
  const _hasChapterCue = /\bchapter\b/i.test(normalizeTranscript(coreText));
  const _hasVerseCue = /\bverses?\b/i.test(normalizeTranscript(coreText));

  const structuredLookup = parseStructuredLookupByCue(coreText, original, defaultVersion);
  if (structuredLookup) {
    return structuredLookup;
  }

  const compactLookup = parseCompactLookupBySlots(coreText, original, defaultVersion);
  if (compactLookup) {
    // compact lookup has no cue words by definition
    return { ...compactLookup, hasChapterCue: false, hasVerseCue: false };
  }

  // Try pattern matching
  for (const pattern of PATTERNS) {
    const m = coreText.match(pattern);
    if (!m) continue;

    let bookRaw: string,
      chapter: number,
      verseStart: number,
      verseEnd: number | undefined;

    const isNumberedPattern = pattern === PATTERNS[0] || pattern === PATTERNS[3] || pattern === PATTERNS[4] || pattern === PATTERNS[8];

    if (isNumberedPattern) {
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

    const bookCandidate = resolveBookCandidate(bookRaw);
    if (!bookCandidate || bookCandidate.score < 0.84) continue;

    const parsedReference = {
      book: bookCandidate.book,
      chapter,
      verseStart,
      verseEnd,
      version: defaultVersion,
    };

    if (!isValidBibleReference(parsedReference)) {
      continue;
    }

    return {
      originalText: original,
      commandType: "lookup",
      confidence: 0.95,
      parsedReference,
      hasChapterCue: _hasChapterCue,
      hasVerseCue: _hasVerseCue,
    };
  }

  // Last resort: Bible-specific candidate scanning across the whole utterance.
  // This is more resilient to STT drift than relying on one literal alias hit.
  const fallbackNumericTokens = tokenizeNumericFragment(coreText);
  if (fallbackNumericTokens.length >= 1) {
    const explicitBook = extractExplicitBookCandidate(coreText);
    const matchedBook = explicitBook ?? extractLikelyBookCandidate(coreLower);
    const hasExplicitStructureCue = /\bchapter\b|\bverse\b|\bverses\b/.test(coreLower);

    if (matchedBook) {
      if (hasExplicitStructureCue && matchedBook.score < 0.82) {
        return {
          originalText: original,
          parsedReference: null,
          commandType: "lookup",
          confidence: 0,
        };
      }

      const trailingReference = stripResolvedBookPrefix(coreText, matchedBook.book);
      const numericPair = parseNumericSlots(trailingReference, 2, { allowDigitSequence: false });
      const numericSingle =
        parseNumberPhraseTokens(tokenizeNumericFragment(trailingReference), { allowDigitSequence: false }) != null
          ? [parseNumberPhraseTokens(tokenizeNumericFragment(trailingReference), { allowDigitSequence: false }) as number]
          : parseNumericSlots(trailingReference, 1, { allowDigitSequence: false });
      const chapter = numericPair?.[0] ?? numericSingle?.[0];
      const verseStart = numericPair?.[1] ?? (isSingleChapterBook(matchedBook.book) ? numericSingle?.[0] : 1);
      const parsedReference = {
        book: matchedBook.book,
        chapter: chapter ?? 1,
        verseStart: verseStart ?? 1,
        version: defaultVersion,
      };

      if (isValidBibleReference(parsedReference)) {
        return {
          originalText: original,
          commandType: "lookup",
          confidence: Math.max(0.84, Math.min(0.98, matchedBook.score)),
          parsedReference,
          hasChapterCue: _hasChapterCue,
          hasVerseCue: _hasVerseCue,
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
// IndexedDB lookup â€” zero network
// ============================================================
export async function lookupOffline(
  ref: BibleReference,
): Promise<OfflineBibleResult | null> {
  try {
    let verses: any[] = [];

    try {
      await useBibleRAMCache.getState().ensureVersionLoaded(ref.version);
      const ramVerses = useBibleRAMCache.getState().getChapter(ref.version, ref.book, ref.chapter);
      if (ramVerses && ramVerses.length > 0) {
        verses = ramVerses.map((verse) => ({
          verse: verse.number,
          text: verse.text,
          book: ref.book,
        }));
      }
    } catch (error) {
      console.warn("[OfflineBible] RAM lookup warm-up failed, falling back.", error);
    }
    
    // Fallback: Native SQLite Engine
    if (verses.length === 0 && (window as any).api?.bible) {
      try {
        const sqliteVerses = await (window as any).api.bible.getChapter(
          ref.version,
          ref.book,
          ref.chapter,
        );
        if (sqliteVerses && sqliteVerses.length > 0) {
          verses = sqliteVerses.map((v: any) => ({
            verse: v.number,
            text: v.text,
            book: ref.book,
          }));
        }
      } catch (e) {
        console.warn("[OfflineBible] SQLite query failed, falling back.", e);
      }
    }

    // Fallback: IndexedDB / Dexie
    if (verses.length === 0) {
      const { db } = await import("./db");
      verses = await db.verses
        .where("[version+book+chapter]")
        .equals([ref.version, ref.book, ref.chapter])
        .sortBy("verse");
    }

    if (!verses.length) return null;

    const filtered = verses.filter(
      (v) =>
        v.verse >= ref.verseStart &&
        (ref.verseEnd ? v.verse <= ref.verseEnd : true),
    );
    if (!filtered.length) return null;

    const bookDisplay = filtered[0].book || ref.book;
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

