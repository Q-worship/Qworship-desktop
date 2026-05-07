import mongoose from "mongoose";
import { BibleVerse, SpeechSession, BibleSearchCache } from "./bible.model.js";
import {
  extractBookFromCommand,
  parseChapterVerse,
  fuzzyMatchBook,
  normalizeBookName,
  initializeHandsfreeBibleModule,
  type BibleVersion,
} from "./handsfreeBible/index.js";
import memoizee from "memoizee";

initializeHandsfreeBibleModule();

// ============================================================================
// LRU CACHE FOR PARSED REFERENCES (Avoid re-parsing repeated voice commands)
// ============================================================================
interface CachedParseResult {
  reference: BibleReference | null;
  commandType: VoiceCommand["commandType"];
  confidence: number;
  navigationDirection?: "next" | "previous";
}

// Memoized verse lookup cache (max 100 entries, 5 min TTL)
const verseCache = new Map<string, BibleSearchResult>();
const VERSE_CACHE_MAX = 100;
const VERSE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getVerseCacheKey(ref: BibleReference): string {
  return `${ref.book}|${ref.chapter}|${ref.verseStart}|${ref.verseEnd || ref.verseStart}`;
}

// ============================================================================
// PRE-COMPILED REGEX PATTERNS (Compile once at module load for speed)
// ============================================================================
const REGEX_PATTERNS = {
  // Navigation commands (fastest check - no book lookup needed)
  // Supports 30+ conversational variations for hands-free navigation
  next: /^(next|next verse|go next|forward|continue|move forward|keep going|go on|advance|following verse|the next one|one more|read on|next one|show next|give me the next|next please)$/i,
  previous:
    /^(previous|prev|previous verse|go back|back|before|go backward|back up|the one before|prior|preceding|last one|show previous|give me the last|back one|previous please)$/i,
  nextChapter:
    /^(next chapter|chapter forward|go to (the )?next chapter|advance (a )?chapter|move to (the )?next chapter|following chapter|chapter ahead)$/i,
  prevChapter:
    /^(previous chapter|prev chapter|chapter back|go to (the )?previous chapter|back a chapter|last chapter|prior chapter|preceding chapter)$/i,

  // Intra-chapter navigation: "go to verse 5", "last verse", "2 verses back"
  firstVerse:
    /^(?:jump\s+to|go\s+to|show\s+(?:me\s+)?|display|open\s+to|turn\s+to|read)?\s*(?:the\s+)?(?:first|1st|beginning)\s+verse$/i,
  jumpToVerse:
    /^(?:jump\s+to|go\s+to|show\s+(?:me\s+)?|display|open\s+to|turn\s+to|read)?\s*(?:the\s+)?(?:verse\s+)?(\d+)$/i,
  lastVerse:
    /^(?:jump\s+to|go\s+to|show\s+(?:me\s+)?|display|open\s+to|turn\s+to|read)?\s*(?:the\s+)?(?:last|final|end)\s+verse$/i,
  jumpRelative:
    /^(?:go|jump|move|skip)?\s*(\d+)\s+verses?\s+(forward|back|backward|backwards|ahead)$/i,

  // Version switching patterns: "show me NKJV", "switch to NIV", "use the ESV"
  // Captures the version name in group 1 - supports full conversational names
  versionSwitch:
    /^(?:show\s+(?:me\s+)?(?:the\s+)?|switch\s+to\s+(?:the\s+)?|use\s+(?:the\s+)?|change\s+(?:to\s+)?(?:the\s+)?|in\s+(?:the\s+)?|read\s+(?:it\s+)?in\s+(?:the\s+)?|display\s+(?:in\s+)?(?:the\s+)?|give\s+(?:me\s+)?(?:the\s+)?|let\s+me\s+(?:see|hear)\s+(?:the\s+)?|i\s+want\s+(?:the\s+)?|can\s+(?:you\s+)?(?:show|read)\s+(?:me\s+)?(?:the\s+)?)(kjv|nkjv|niv|esv|amp|msg|gn|gnt|amplified|amplified\s+bible|king\s+james|king\s+james\s+version|new\s+king\s+james|new\s+king\s+james\s+version|message|the\s+message|good\s+news|good\s+news\s+bible|good\s+news\s+translation|english\s+standard|english\s+standard\s+version|new\s+international|new\s+international\s+version)(?:\s+(?:version|translation|bible))?$/i,

  // Simple version-only pattern (after conversational stripping): "nkjv", "amplified version", "msg"
  // This catches cases where "show me the NKJV" becomes just "nkjv" after stripping
  versionOnly:
    /^(?:the\s+)?(kjv|nkjv|niv|esv|amp|msg|gn|gnt|amplified|amplified\s+bible|king\s+james|king\s+james\s+version|new\s+king\s+james|new\s+king\s+james\s+version|message|the\s+message|good\s+news|good\s+news\s+bible|good\s+news\s+translation|english\s+standard|english\s+standard\s+version|new\s+international|new\s+international\s+version)(?:\s+(?:version|translation|bible))?$/i,

  // Standard reference patterns: "John 3:16", "Genesis 1:1-3", "John 3.16"
  colonFormat:
    /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)[:.](\d+)(?:\s*[-–—]\s*(\d+))?$/i,

  // Numbered books with colon: "1 John 3:16", "2 Samuel 7:12"
  numberedColonFormat:
    /^(\d)\s*([a-z]+)\s+(\d+)[:.](\d+)(?:\s*[-–—]\s*(\d+))?$/i,

  // Space-separated: "John 3 16", "Genesis 1 1"
  spaceFormat:
    /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)\s+(\d+)(?:\s+(?:to|through|-)\s+(\d+))?$/i,

  // Numbered books space: "1 john 3 16"
  numberedSpaceFormat:
    /^(\d)\s*([a-z]+)\s+(\d+)\s+(\d+)(?:\s+(?:to|through|-)\s+(\d+))?$/i,

  // Chapter verse format: "John chapter 3 verse 16"
  chapterVerseFormat:
    /^([a-z]+(?:\s+[a-z]+)?)\s+chapter\s+(\d+)\s+verse\s+(\d+)(?:\s+(?:to|through)\s+(\d+))?$/i,

  // Chapter only: "Matthew 24" -> verse 1
  chapterOnlyFormat: /^([a-z]+(?:\s+[a-z]+)?)\s+(\d+)$/i,

  // Numbered chapter only: "1 john 3"
  numberedChapterOnlyFormat: /^(\d)\s*([a-z]+)\s+(\d+)$/i,
};

export interface BibleReference {
  book: string;
  chapter: number;
  verseStart: number;
  verseEnd?: number;
  version?: BibleVersion;
}

export interface BibleSearchResult {
  book: string;
  chapter: number;
  verses: Array<{
    verse: number;
    kjv: string | null;
    nkjv: string | null;
    amp: string | null;
    msg: string | null;
    esv: string | null;
    niv: string | null;
  }>;
  version: string;
  formattedReference: string;
  /** QC38: Set when the requested verse was out of range and was clamped to the last valid verse */
  clampedFrom?: number;
  /** QC38: Human-readable note explaining the clamp */
  clampNote?: string;
  /**
   * QC52: Full chapter verses — all verses in the detected book+chapter.
   * Populated by searchBible so the client can display the entire chapter
   * in the middle section and allow click-to-project navigation.
   */
  chapterVerses?: Array<{ number: number; text: string }>;
}

export interface VoiceCommand {
  originalText: string;
  parsedReference: BibleReference | null;
  commandType:
    | "lookup"
    | "version_change"
    | "verse_change"
    | "chapter_change"
    | "jump_to_verse"
    | "last_verse"
    | "jump_relative"
    | "sleep"
    | "wake";
  confidence: number;
  navigationDirection?: "next" | "previous";
  requestedVersion?: BibleVersion;
  targetVerse?: number;
  offset?: number;
}

export class BibleService {
  // Book name mappings for flexible recognition
  private static readonly BOOK_ALIASES = {
    genesis: "Genesis",
    gen: "Genesis",
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
    giorgis: "Judges",
    ruth: "Ruth",
    rut: "Ruth",
    "first samuel": "1 Samuel",
    "1 samuel": "1 Samuel",
    "1samuel": "1 Samuel",
    "1sam": "1 Samuel",
    "1sa": "1 Samuel",
    "1 sam": "1 Samuel",
    "second samuel": "2 Samuel",
    "2 samuel": "2 Samuel",
    "2samuel": "2 Samuel",
    "2sam": "2 Samuel",
    "2sa": "2 Samuel",
    "2 sam": "2 Samuel",
    "first kings": "1 Kings",
    "1 kings": "1 Kings",
    "1kings": "1 Kings",
    "1ki": "1 Kings",
    "1 kgs": "1 Kings",
    "second kings": "2 Kings",
    "2 kings": "2 Kings",
    "2kings": "2 Kings",
    "2ki": "2 Kings",
    "2 kgs": "2 Kings",
    "first chronicles": "1 Chronicles",
    "1 chronicles": "1 Chronicles",
    "1chronicles": "1 Chronicles",
    "1ch": "1 Chronicles",
    "1 chron": "1 Chronicles",
    "second chronicles": "2 Chronicles",
    "2 chronicles": "2 Chronicles",
    "2chronicles": "2 Chronicles",
    "2ch": "2 Chronicles",
    "2 chron": "2 Chronicles",
    ezra: "Ezra",
    ezr: "Ezra",
    nehemiah: "Nehemiah",
    neh: "Nehemiah",
    esther: "Esther",
    est: "Esther",
    esth: "Esther",
    job: "Job",
    psalms: "Psalms",
    psalm: "Psalms",
    psa: "Psalms",
    ps: "Psalms",
    proverbs: "Proverbs",
    prov: "Proverbs",
    pro: "Proverbs",
    ecclesiastes: "Ecclesiastes",
    eccl: "Ecclesiastes",
    ecc: "Ecclesiastes",
    "song of solomon": "Song of Solomon",
    song: "Song of Solomon",
    son: "Song of Solomon",
    isaiah: "Isaiah",
    isa: "Isaiah",
    jeremiah: "Jeremiah",
    jer: "Jeremiah",
    lamentations: "Lamentations",
    lam: "Lamentations",
    ezekiel: "Ezekiel",
    eze: "Ezekiel",
    ezek: "Ezekiel",
    daniel: "Daniel",
    dan: "Daniel",
    hosea: "Hosea",
    hos: "Hosea",
    joel: "Joel",
    joe: "Joel",
    amos: "Amos",
    amo: "Amos",
    obadiah: "Obadiah",
    oba: "Obadiah",
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
    zep: "Zephaniah",
    zeph: "Zephaniah",
    haggai: "Haggai",
    hag: "Haggai",
    zechariah: "Zechariah",
    zec: "Zechariah",
    zech: "Zechariah",
    malachi: "Malachi",
    mal: "Malachi",
    matthew: "Matthew",
    matt: "Matthew",
    mat: "Matthew",
    mark: "Mark",
    mar: "Mark",
    luke: "Luke",
    luk: "Luke",
    john: "John",
    joh: "John",
    acts: "Acts",
    act: "Acts",
    romans: "Romans",
    rom: "Romans",
    "first corinthians": "1 Corinthians",
    "1 corinthians": "1 Corinthians",
    "1corinthians": "1 Corinthians",
    "1co": "1 Corinthians",
    "1 cor": "1 Corinthians",
    "second corinthians": "2 Corinthians",
    "2 corinthians": "2 Corinthians",
    "2corinthians": "2 Corinthians",
    "2co": "2 Corinthians",
    "2 cor": "2 Corinthians",
    galatians: "Galatians",
    gal: "Galatians",
    ephesians: "Ephesians",
    eph: "Ephesians",
    philippians: "Philippians",
    phil: "Philippians",
    phi: "Philippians",
    colossians: "Colossians",
    col: "Colossians",
    colosians: "Colossians",
    collossians: "Colossians",
    colossions: "Colossians",
    colosions: "Colossians",
    colosseons: "Colossians",
    colosseans: "Colossians",
    colossean: "Colossians",
    colossian: "Colossians",
    kolossians: "Colossians",
    koloshians: "Colossians",
    "first thessalonians": "1 Thessalonians",
    "1 thessalonians": "1 Thessalonians",
    "1thessalonians": "1 Thessalonians",
    "1th": "1 Thessalonians",
    "1 thess": "1 Thessalonians",
    "second thessalonians": "2 Thessalonians",
    "2 thessalonians": "2 Thessalonians",
    "2thessalonians": "2 Thessalonians",
    "2th": "2 Thessalonians",
    "2 thess": "2 Thessalonians",
    "first timothy": "1 Timothy",
    "1 timothy": "1 Timothy",
    "1timothy": "1 Timothy",
    "1ti": "1 Timothy",
    "1 tim": "1 Timothy",
    "second timothy": "2 Timothy",
    "2 timothy": "2 Timothy",
    "2timothy": "2 Timothy",
    "2ti": "2 Timothy",
    "2 tim": "2 Timothy",
    titus: "Titus",
    tit: "Titus",
    philemon: "Philemon",
    phm: "Philemon",
    philem: "Philemon",
    hebrews: "Hebrews",
    heb: "Hebrews",
    james: "James",
    jam: "James",
    "first peter": "1 Peter",
    "1 peter": "1 Peter",
    "1peter": "1 Peter",
    "1pe": "1 Peter",
    "1 pet": "1 Peter",
    "second peter": "2 Peter",
    "2 peter": "2 Peter",
    "2peter": "2 Peter",
    "2pe": "2 Peter",
    "2 pet": "2 Peter",
    "first john": "1 John",
    "1 john": "1 John",
    "1john": "1 John",
    "1jo": "1 John",
    "second john": "2 John",
    "2 john": "2 John",
    "2john": "2 John",
    "2jo": "2 John",
    "third john": "3 John",
    "3 john": "3 John",
    "3john": "3 John",
    "3jo": "3 John",
    jude: "Jude",
    jud: "Jude",
    revelation: "Revelation",
    rev: "Revelation",
  };

  private static readonly VERSION_ALIASES: Record<string, BibleVersion> = {
    // King James Version
    "king james": "kjv",
    "king james version": "kjv",
    "the king james": "kjv",
    "the king james version": "kjv",
    kjv: "kjv",
    // New King James Version
    "new king james": "nkjv",
    "new king james version": "nkjv",
    "the new king james": "nkjv",
    "the new king james version": "nkjv",
    nkjv: "nkjv",
    // Amplified Bible
    amplified: "amp",
    "amplified bible": "amp",
    "the amplified": "amp",
    "the amplified bible": "amp",
    amp: "amp",
    // The Message
    message: "msg",
    "the message": "msg",
    "the message bible": "msg",
    msg: "msg",
    // English Standard Version
    "english standard": "esv",
    "english standard version": "esv",
    "the english standard": "esv",
    "the english standard version": "esv",
    esv: "esv",
    // New International Version
    "new international": "niv",
    "new international version": "niv",
    "the new international": "niv",
    "the new international version": "niv",
    niv: "niv",
    // Good News Translation
    "good news": "gn",
    "good news bible": "gn",
    "good news translation": "gn",
    "the good news": "gn",
    "the good news bible": "gn",
    gn: "gn",
    gnt: "gn",
  };

  private static readonly SLEEP_COMMANDS = [
    "ok",
    "okay",
    "thank you",
    "thanks",
    "great",
    "good",
    "fine",
    "that's fine",
    "that's good",
    "that's great",
    "amen",
  ];

  // Maximum chapter counts for all 66 Bible books (for speech recognition validation)
  private static readonly BOOK_MAX_CHAPTERS: Record<string, number> = {
    Genesis: 50,
    Exodus: 40,
    Leviticus: 27,
    Numbers: 36,
    Deuteronomy: 34,
    Joshua: 24,
    Judges: 21,
    Ruth: 4,
    "1 Samuel": 31,
    "2 Samuel": 24,
    "1 Kings": 22,
    "2 Kings": 25,
    "1 Chronicles": 29,
    "2 Chronicles": 36,
    Ezra: 10,
    Nehemiah: 13,
    Esther: 10,
    Job: 42,
    Psalms: 150,
    Proverbs: 31,
    Ecclesiastes: 12,
    "Song of Solomon": 8,
    Isaiah: 66,
    Jeremiah: 52,
    Lamentations: 5,
    Ezekiel: 48,
    Daniel: 12,
    Hosea: 14,
    Joel: 3,
    Amos: 9,
    Obadiah: 1,
    Jonah: 4,
    Micah: 7,
    Nahum: 3,
    Habakkuk: 3,
    Zephaniah: 3,
    Haggai: 2,
    Zechariah: 14,
    Malachi: 4,
    Matthew: 28,
    Mark: 16,
    Luke: 24,
    John: 21,
    Acts: 28,
    Romans: 16,
    "1 Corinthians": 16,
    "2 Corinthians": 13,
    Galatians: 6,
    Ephesians: 6,
    Philippians: 4,
    Colossians: 4,
    "1 Thessalonians": 5,
    "2 Thessalonians": 3,
    "1 Timothy": 6,
    "2 Timothy": 4,
    Titus: 3,
    Philemon: 1,
    Hebrews: 13,
    James: 5,
    "1 Peter": 5,
    "2 Peter": 3,
    "1 John": 5,
    "2 John": 1,
    "3 John": 1,
    Jude: 1,
    Revelation: 22,
  };

  /**
   * Validates and normalizes a parsed reference to handle speech recognition errors.
   * When a chapter number exceeds the book's maximum, attempts to split digits
   * intelligently (e.g., "Isaiah 4021" -> chapter 40, verse 21).
   */
  private static validateAndNormalizeReference(
    ref: BibleReference,
  ): BibleReference | null {
    const maxChapters = this.BOOK_MAX_CHAPTERS[ref.book];
    if (!maxChapters) {
      console.log(`Unknown book for validation: ${ref.book}`);
      return ref; // Unknown book, return as-is
    }

    // If chapter is within valid range, return as-is
    if (ref.chapter <= maxChapters) {
      console.log(
        `Chapter ${ref.chapter} is valid for ${ref.book} (max: ${maxChapters})`,
      );
      return ref;
    }

    // Chapter exceeds max - try to split the digits
    console.log(
      `Chapter ${ref.chapter} exceeds max ${maxChapters} for ${ref.book} - attempting to split`,
    );
    const chapterStr = ref.chapter.toString();

    // Determine max chapter digits for this book (Psalms has 3-digit chapters up to 150)
    const maxChapterDigits = maxChapters >= 100 ? 3 : maxChapters >= 10 ? 2 : 1;

    // Try different split positions (prefer longer valid chapters first)
    // e.g., for Psalms 119105 -> try (119, 105) first
    // e.g., for Isaiah 4021 -> try (40, 21) first
    for (let splitPos = maxChapterDigits; splitPos >= 1; splitPos--) {
      if (chapterStr.length > splitPos) {
        const newChapter = parseInt(chapterStr.slice(0, splitPos));
        const newVerse = parseInt(chapterStr.slice(splitPos));

        // Validate the split result
        if (
          newChapter >= 1 &&
          newChapter <= maxChapters &&
          newVerse >= 1 &&
          newVerse <= 176
        ) {
          console.log(
            `Split successful: ${ref.book} ${ref.chapter}:${ref.verseStart} -> ${ref.book} ${newChapter}:${newVerse}`,
          );
          return {
            ...ref,
            chapter: newChapter,
            verseStart: newVerse,
            verseEnd: undefined, // Clear any verse end since we've reinterpreted
          };
        }
      }
    }

    // Could not fix the reference
    console.log(
      `Could not normalize invalid reference: ${ref.book} ${ref.chapter}:${ref.verseStart}`,
    );
    return null;
  }

  /**
   * Step 1: Speech-to-text (handled by browser Web Speech API)
   * Step 2: Parse natural language command into structured Bible reference
   */
  static parseVoiceCommand(text: string, sessionContext?: any): VoiceCommand {
    const lowerText = text.toLowerCase().trim();

    // Check for sleep commands
    // Disabled intentionally to prevent turning off the microphone mid-sentence
    /*
    if (this.SLEEP_COMMANDS.some((cmd) => lowerText.includes(cmd))) {
      return {
        originalText: text,
        parsedReference: null,
        commandType: "sleep",
        confidence: 0.9,
      };
    }
    */

    // Parse full Bible reference FIRST - this should take priority over navigation commands
    console.log(`Attempting to parse Bible reference from: "${lowerText}"`);
    const reference = this.parseBibleReference(lowerText);
    if (reference) {
      console.log(`Successfully parsed reference:`, reference);
      return {
        originalText: text,
        parsedReference: reference,
        commandType: "lookup",
        confidence: 0.95,
      };
    }
    console.log(`No Bible reference found in: "${lowerText}"`);

    // Check for version change commands - only after main parsing fails
    const versionMatch = this.parseVersionChange(lowerText);
    if (versionMatch) {
      return {
        originalText: text,
        parsedReference: {
          book: sessionContext?.currentBook || "",
          chapter: sessionContext?.currentChapter || 1,
          verseStart: sessionContext?.currentVerse || 1,
          version: versionMatch as
            | "kjv"
            | "nkjv"
            | "amp"
            | "msg"
            | "esv"
            | "niv",
        },
        commandType: "version_change",
        confidence: 0.85,
      };
    }

    // Check for verse navigation commands - only after main parsing fails
    const verseNavigation = this.parseVerseNavigation(
      lowerText,
      sessionContext,
    );
    if (verseNavigation) {
      return {
        originalText: text,
        parsedReference: verseNavigation,
        commandType: "verse_change",
        confidence: 0.8,
      };
    }

    // Check for chapter navigation commands - only after main parsing fails
    const chapterNavigation = this.parseChapterNavigation(
      lowerText,
      sessionContext,
    );
    if (chapterNavigation) {
      return {
        originalText: text,
        parsedReference: chapterNavigation,
        commandType: "chapter_change",
        confidence: 0.8,
      };
    }

    // Lenient fallback: only attempt if text contains a book name that is at least
    // 4 characters long. Short aliases (ps, ex, gal, etc.) are too ambiguous —
    // they match common substrings and produce false positives on ordinary speech.
    console.log(`No Bible reference parsed, checking if contains a significant book name...`);
    const matchedAlias = Object.keys(this.BOOK_ALIASES).find((alias) => {
      if (alias.length < 4) return false; // Ignore short aliases to prevent false positives
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return new RegExp(`\\b${escapedAlias}\\b`, "i").test(lowerText);
    });
    console.log(`Significant book alias found: ${matchedAlias ?? "none"}`);

    if (matchedAlias) {
      console.log(`Attempting lenient parse due to book alias "${matchedAlias}"...`);

      const lenientReference = this.parseBibleReferenceLenient(lowerText);
      if (lenientReference) {
        console.log(`✅ Lenient parsing succeeded:`, lenientReference);
        return {
          originalText: text,
          parsedReference: lenientReference,
          commandType: "lookup",
          confidence: 0.8,
        };
      }
    }

    return {
      originalText: text,
      parsedReference: null,
      commandType: "lookup",
      confidence: 0.1,
    };
  }

  private static parseVersionChange(text: string): string | null {
    const patterns = [
      /show me (the )?(.+?) version/i,
      /change to (the )?(.+?) version/i,
      /switch to (the )?(.+?) version/i,
      /(.+?) version/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const versionText = match[2] || match[1];
        const version =
          this.VERSION_ALIASES[
            versionText.toLowerCase() as keyof typeof this.VERSION_ALIASES
          ];
        if (version) return version;
      }
    }
    return null;
  }

  private static parseVerseNavigation(
    text: string,
    context?: any,
  ): BibleReference | null {
    const patterns = [
      /next verse/i,
      /show (me )?verse (\d+)/i,
      /go to verse (\d+)/i,
      /verse (\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        if (pattern.source.includes("next")) {
          return {
            book: context?.currentBook || "",
            chapter: context?.currentChapter || 1,
            verseStart: (context?.currentVerse || 1) + 1,
            version: context?.currentVersion || "kjv",
          };
        } else {
          const verse = parseInt(match[2] || match[1]);
          return {
            book: context?.currentBook || "",
            chapter: context?.currentChapter || 1,
            verseStart: verse,
            version: context?.currentVersion || "kjv",
          };
        }
      }
    }
    return null;
  }

  private static parseChapterNavigation(
    text: string,
    context?: any,
  ): BibleReference | null {
    const patterns = [
      /chapter (\d+) verse (\d+)(?: to (\d+))?/i,
      /chapter (\d+) verses (\d+) and (\d+)/i,
      /chapter (\d+) verse (\d+)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const chapter = parseInt(match[1]);
        const verseStart = parseInt(match[2]);
        const verseEnd = match[3] ? parseInt(match[3]) : undefined;

        return {
          book: context?.currentBook || "",
          chapter,
          verseStart,
          verseEnd,
          version: context?.currentVersion || "kjv",
        };
      }
    }
    return null;
  }

  private static parseBibleReference(text: string): BibleReference | null {
    // Clean the text first
    const cleanText = text.trim().toLowerCase();
    console.log(`Parsing reference from: "${cleanText}"`);

    // First convert written numbers to digits for better matching
    let normalizedText = cleanText
      .replace(/\bone\b/g, "1")
      .replace(/\btwo\b/g, "2")
      .replace(/\bthree\b/g, "3")
      .replace(/\bfour\b/g, "4")
      .replace(/\bfive\b/g, "5")
      .replace(/\bsix\b/g, "6")
      .replace(/\bseven\b/g, "7")
      .replace(/\beight\b/g, "8")
      .replace(/\bnine\b/g, "9")
      .replace(/\bten\b/g, "10")
      .replace(/\beleven\b/g, "11")
      .replace(/\btwelve\b/g, "12")
      .replace(/\bthirteen\b/g, "13")
      .replace(/\bfourteen\b/g, "14")
      .replace(/\bfifteen\b/g, "15")
      .replace(/\bsixteen\b/g, "16")
      .replace(/\bseventeen\b/g, "17")
      .replace(/\beighteen\b/g, "18")
      .replace(/\bnineteen\b/g, "19")
      .replace(/\btwenty\b/g, "20")
      .replace(/\bthirty\b/g, "30")
      .replace(/\bforty\b/g, "40")
      .replace(/\bfifty\b/g, "50")
      .replace(/\bsixty\b/g, "60");

    // Handle compound spoken numbers (e.g., twenty three -> 23)
    normalizedText = normalizedText
      .replace(/20\s+1/g, "21")
      .replace(/20\s+2/g, "22")
      .replace(/20\s+3/g, "23")
      .replace(/20\s+4/g, "24")
      .replace(/20\s+5/g, "25")
      .replace(/20\s+6/g, "26")
      .replace(/20\s+7/g, "27")
      .replace(/20\s+8/g, "28")
      .replace(/20\s+9/g, "29")
      .replace(/30\s+1/g, "31")
      .replace(/30\s+2/g, "32")
      .replace(/30\s+3/g, "33")
      .replace(/30\s+4/g, "34")
      .replace(/30\s+5/g, "35")
      .replace(/30\s+6/g, "36")
      .replace(/30\s+7/g, "37")
      .replace(/30\s+8/g, "38")
      .replace(/30\s+9/g, "39")
      .replace(/40\s+1/g, "41")
      .replace(/40\s+2/g, "42")
      .replace(/40\s+3/g, "43")
      .replace(/40\s+4/g, "44")
      .replace(/40\s+5/g, "45")
      .replace(/40\s+6/g, "46")
      .replace(/40\s+7/g, "47")
      .replace(/40\s+8/g, "48")
      .replace(/40\s+9/g, "49")
      .replace(/50\s+1/g, "51")
      .replace(/50\s+2/g, "52")
      .replace(/50\s+3/g, "53")
      .replace(/50\s+4/g, "54")
      .replace(/50\s+5/g, "55")
      .replace(/50\s+6/g, "56")
      .replace(/50\s+7/g, "57")
      .replace(/50\s+8/g, "58")
      .replace(/50\s+9/g, "59")
      .replace(/60\s+1/g, "61")
      .replace(/60\s+2/g, "62")
      .replace(/60\s+3/g, "63")
      .replace(/60\s+4/g, "64")
      .replace(/60\s+5/g, "65")
      .replace(/60\s+6/g, "66");

    console.log(`After number normalization: "${normalizedText}"`);

    // QC43 Fix 3: Book name group now also handles numbered books (1 Kings, 2 Samuel etc.)
    // by using (?:\d\s+)?[a-z]+ so that the ordinal digit is included in the book capture.
    const BOOK_PATTERN = '(?:\\d\\s+)?[a-z]+(?:\\s+[a-z]+)*';
    const patterns = [
      // Conversational numbered-book format: "from the book of 1 kings chapter 2 verse 2"
      new RegExp(`(?:in\\s+|show me\\s+|find\\s+|read\\s+|go to\\s+|from\\s+)?(?:book of\\s+|the\\s+)?(${BOOK_PATTERN})\\s+chapter\\s+(\\d+),?\\s+verse\\s+(\\d+)`, 'i'),
      // "show me 1 kings chapter 2 verse 2" - verbose numbered-book voice commands
      new RegExp(`(?:show me |find |read |go to )?(?:book of |the )?(${BOOK_PATTERN})\\s+chapter\\s+(\\d+)[,\\s]+verse\\s+(\\d+)`, 'i'),
      // "1 kings 2:2" (numbered colon format)
      new RegExp(`(?:show me |find |read |go to )?(?:book of |the )?(${BOOK_PATTERN})\\s+(\\d+):(\\d+)(?:[-\u2013\u2014](\\d+))?`, 'i'),
      // "1 kings 2 2 to 5" (numbered space format with optional range)
      new RegExp(`(?:show me |find |read |go to )?(?:book of |the )?(${BOOK_PATTERN})\\s+(?:chapter\\s+)?(\\d+)\\s+(?:verse\\s+)?(\\d+)(?:\\s+(?:to|through|and)\\s+(\\d+))?`, 'i'),
      // Simple "1 kings 2 2" (numbered space format)
      new RegExp(`(?:show me |find |read |go to )?(?:book of |the )?(${BOOK_PATTERN})\\s+(\\d+)\\s+(\\d+)`, 'i'),
    ];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = normalizedText.match(pattern);
      console.log(`Pattern ${i + 1} match:`, match);

      if (match) {
        const bookText = match[1].trim();
        const chapter = parseInt(match[2]);
        const verseStart = parseInt(match[3]);
        const verseEnd = match[4] ? parseInt(match[4]) : undefined;

        console.log(
          `Extracted - Book: "${bookText}", Chapter: ${chapter}, Verse: ${verseStart}${verseEnd ? `-${verseEnd}` : ""}`,
        );

        // Look for book in aliases
        const book =
          this.BOOK_ALIASES[bookText as keyof typeof this.BOOK_ALIASES];
        if (book) {
          console.log(`Found exact book match: ${bookText} -> ${book}`);
          const rawRef = {
            book,
            chapter,
            verseStart,
            verseEnd,
            version: "kjv" as const,
          };
          // Validate and normalize to handle speech recognition errors (e.g., "Isaiah 4021" -> 40:21)
          const validatedRef = this.validateAndNormalizeReference(rawRef);
          if (validatedRef) return validatedRef;
          console.log(
            `Reference validation failed for: ${book} ${chapter}:${verseStart}`,
          );
        }

        // Try partial matches for common books (require minimum 3 chars to avoid false positives like "m" → Numbers)
        if (bookText.length < 3) {
          console.log(
            `Skipping partial match for too-short book text: "${bookText}"`,
          );
          continue;
        }
        for (const [alias, bookName] of Object.entries(this.BOOK_ALIASES)) {
          if (alias.length < 3 || bookText.length < 3) continue;
          // SAFE: only match if the alias is a PREFIX of bookText or bookText is a PREFIX of alias.
          // The previous bidirectional includes() check caused "colossions".includes("jon") → John.
          if (bookText.startsWith(alias) || alias.startsWith(bookText)) {
            console.log(
              `Found partial book match: ${bookText} -> ${bookName} (via ${alias})`,
            );
            const rawRef = {
              book: bookName,
              chapter,
              verseStart,
              verseEnd,
              version: "kjv" as const,
            };
            // Validate and normalize to handle speech recognition errors
            const validatedRef = this.validateAndNormalizeReference(rawRef);
            if (validatedRef) return validatedRef;
            console.log(
              `Reference validation failed for: ${bookName} ${chapter}:${verseStart}`,
            );
          }
        }
        console.log(`No book found for: "${bookText}"`);
      }
    }
    console.log(`No patterns matched for: "${cleanText}"`);
    return null;
  }

  // More lenient parsing for voice recognition issues
  private static parseBibleReferenceLenient(
    text: string,
  ): BibleReference | null {
    let cleanText = text.trim().toLowerCase();
    cleanText = this.applyPhoneticCorrections(cleanText);
    console.log(`Lenient parsing for: "${cleanText}"`);

    // Simple direct mapping for common spoken Bible verses
    const directMappings: { [key: string]: BibleReference } = {
      "john three sixteen": {
        book: "John",
        chapter: 3,
        verseStart: 16,
        version: "kjv",
      },
      "john 3 16": { book: "John", chapter: 3, verseStart: 16, version: "kjv" },
      "john 316": { book: "John", chapter: 3, verseStart: 16, version: "kjv" },
      "john, 316": { book: "John", chapter: 3, verseStart: 16, version: "kjv" },
      "john, 316.": {
        book: "John",
        chapter: 3,
        verseStart: 16,
        version: "kjv",
      },
      "show me john chapter 3, verse 16.": {
        book: "John",
        chapter: 3,
        verseStart: 16,
        version: "kjv",
      },
      "show me john chapter 3 verse 16": {
        book: "John",
        chapter: 3,
        verseStart: 16,
        version: "kjv",
      },
      "show me james chapter 4, verse 2.": {
        book: "James",
        chapter: 4,
        verseStart: 2,
        version: "kjv",
      },
      "show me james chapter 4 verse 2": {
        book: "James",
        chapter: 4,
        verseStart: 2,
        version: "kjv",
      },
      "genesis one one": {
        book: "Genesis",
        chapter: 1,
        verseStart: 1,
        version: "kjv",
      },
      "psalm twenty three one": {
        book: "Psalms",
        chapter: 23,
        verseStart: 1,
        version: "kjv",
      },
    };

    // Check direct mappings first
    console.log(
      `✅ LENIENT PARSING - Checking direct mappings for: "${cleanText}"`,
    );
    if (directMappings[cleanText]) {
      console.log(`✅ Direct mapping found for: "${cleanText}"`);
      return directMappings[cleanText];
    } else {
      console.log(`❌ No direct mapping found, trying pattern matching...`);
    }

    // Handle spoken numbers - Use specific replacements in order to avoid partial matches
    let normalizedText = cleanText;

    // Replace longer number words first to avoid partial replacements
    normalizedText = normalizedText
      .replace(/\bsixteen\b/g, "16")
      .replace(/\bfifteen\b/g, "15")
      .replace(/\bfourteen\b/g, "14")
      .replace(/\bthirteen\b/g, "13")
      .replace(/\btwelve\b/g, "12")
      .replace(/\beleven\b/g, "11")
      .replace(/\bten\b/g, "10")
      .replace(/\bnine\b/g, "9")
      .replace(/\beight\b/g, "8")
      .replace(/\bseven\b/g, "7")
      .replace(/\bsix\b/g, "6")
      .replace(/\bfive\b/g, "5")
      .replace(/\bfour\b/g, "4")
      .replace(/\bthree\b/g, "3")
      .replace(/\btwo\b/g, "2")
      .replace(/\bone\b/g, "1");

    console.log(`After number normalization: "${normalizedText}"`);

    // More flexible patterns for voice input including punctuation
    // QC43 Fix 3: Use BOOK_PAT to also capture numbered books like "1 kings", "2 samuel"
    const BOOK_PAT = '(?:\\d\\s+)?[a-z]+(?:\\s+[a-z]+)*';
    const patterns = [
      // "1 kings 2:2" or "john 3:16" format (numbered + unnumbered books)
      new RegExp(`\\b(${BOOK_PAT})\\s+(\\d+):(\\d+)(?:-(\\d+))?`, 'i'),
      // "1 kings 2 2" or "john 3 16" (two separate numbers)
      new RegExp(`\\b(${BOOK_PAT})\\s+(\\d+)\\s+(\\d+)`, 'i'),
      // "1 kings chapter 2 verse 2" or "john chapter 3 verse 16"
      new RegExp(`\\b(${BOOK_PAT})\\s+(?:chapter\\s+)?(\\d+)\\s+(?:verse\\s+)?(\\d+)`, 'i'),
      // "john, 316" or "john 316" (compressed 3-digit format from voice recognition)
      /\b([a-z]+(?:\s+[a-z]+)*)[,\s]*(\d)(\d{2})[.,]*$/i,
      // Handle "john, 316." format specifically
      /\b([a-z]+)[,\s]+(\d)(\d{2})[.,]*$/i,
      // Even more lenient - any book name followed by two numbers
      /\b(john|matthew|mark|luke|look|genesis|exodus|psalms?|proverbs?)\s*[,\s]*(\d+)\s+(\d+)/i,
    ];

    // Check chapter-only patterns FIRST (before verse patterns)
    const chapterOnlyPatterns = [
      // "matthew 24" - book followed by single number (chapter only)
      /\b(john|matthew|mark|luke|look|genesis|exodus|psalms?|proverbs?|acts|romans|james|hebrews)\s+(\d+)$/i,
      // More general - any book name followed by chapter number at end
      /\b([a-z]+(?:\s+[a-z]+)*)\s+(\d+)$/i,
    ];

    for (const pattern of chapterOnlyPatterns) {
      const match = normalizedText.match(pattern);
      if (match) {
        const bookText = match[1].trim().toLowerCase();
        const chapter = parseInt(match[2]);

        // Map "look" to "luke"
        const correctedBook = bookText === "look" ? "luke" : bookText;
        const book =
          this.BOOK_ALIASES[correctedBook as keyof typeof this.BOOK_ALIASES];
        if (book) {
          console.log(
            `✅ Chapter-only match: ${correctedBook} ${chapter} (verse 1 default)`,
          );
          const rawRef = {
            book,
            chapter,
            verseStart: 1,
            version: "kjv" as const,
          };
          // Validate and normalize to handle speech recognition errors
          const validatedRef = this.validateAndNormalizeReference(rawRef);
          if (validatedRef) return validatedRef;
        }
      }
    }

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      const match = normalizedText.match(pattern);
      console.log(`Lenient pattern ${i + 1} match:`, match);

      if (match) {
        const bookText = match[1].trim();
        const chapter = parseInt(match[2]);
        const verseStart = parseInt(match[3]);

        console.log(
          `Lenient extracted - Book: "${bookText}", Chapter: ${chapter}, Verse: ${verseStart}`,
        );

        // Look for book in aliases
        const book =
          this.BOOK_ALIASES[bookText as keyof typeof this.BOOK_ALIASES];
        if (book) {
          console.log(`Lenient found exact book match: ${bookText} -> ${book}`);
          const rawRef = { book, chapter, verseStart, version: "kjv" as const };
          // Validate and normalize to handle speech recognition errors
          const validatedRef = this.validateAndNormalizeReference(rawRef);
          if (validatedRef) return validatedRef;
          console.log(
            `Lenient reference validation failed for: ${book} ${chapter}:${verseStart}`,
          );
        }

        // Try partial matches (prefix-only — bidirectional includes() caused wrong-book substitutions)
        for (const [alias, bookName] of Object.entries(this.BOOK_ALIASES)) {
          if (alias.length < 3 || bookText.length < 3) continue;
          if (bookText.startsWith(alias) || alias.startsWith(bookText)) {
            console.log(
              `Lenient found partial book match: ${bookText} -> ${bookName} (via ${alias})`,
            );
            const rawRef = {
              book: bookName,
              chapter,
              verseStart,
              version: "kjv" as const,
            };
            // Validate and normalize to handle speech recognition errors
            const validatedRef = this.validateAndNormalizeReference(rawRef);
            if (validatedRef) return validatedRef;
            console.log(
              `Lenient reference validation failed for: ${bookName} ${chapter}:${verseStart}`,
            );
          }
        }
        console.log(`Lenient: No book found for: "${bookText}"`);
      }
    }

    console.log(`Lenient parsing failed for: "${cleanText}"`);
    return null;
  }

  private static containsBibleBook(text: string): boolean {
    const lowerText = text.toLowerCase();
    return Object.keys(this.BOOK_ALIASES).some((alias) => {
      // Create a regex to match the alias as a distinct word or phrase
      // This prevents "shumi" from matching "hum" (nahum), "kitaba" from matching "it" (titus), etc.
      // Espace any regex-special characters in the alias
      const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`\\b${escapedAlias}\\b`, "i");
      return regex.test(lowerText);
    });
  }

  /**
   * Strip conversational prefixes/suffixes from natural language input
   * Handles patterns like "Read me John 3:16", "Go to the book of Romans", etc.
   */
  private static stripConversationalPhrasing(text: string): string {
    let result = text.toLowerCase().trim();

    // Remove trailing punctuation
    result = result.replace(/[.,!?]+$/, "");

    // Conversational prefixes to strip (order matters - longer first)
    const prefixes = [
      // Navigation-specific conversational patterns (must come first to leave "next verse" etc intact)
      /^(can|could|would|will) you (please )?(go to|show me|give me|read) (the )?/i,
      /^(please )?(go to|move to|skip to|jump to|take me to) (the )?/i,
      /^i('d| would) like (you )?to (go to|move to) (the )?/i,
      /^let('s| us) (go to|move to|read) (the )?/i,
      // Polite requests with helpers
      /^i('d| would) like (you )?to (show|read|find|get|display|open)\s+(me\s+)?/i,
      /^i need (you )?to (show|read|find|get|display|open)\s+(me\s+)?/i,
      /^i want (you )?to (show|read|find|get|display|open)\s+(me\s+)?/i,
      /^would you (mind )?(show|read|find|get|display)ing\s+(me\s+)?/i,
      /^would you (please )?(show|read|find|get|display)\s+(me\s+)?/i,
      /^will you (please )?(show|read|find|get|display)\s+(me\s+)?/i,
      // Questions
      /^what does\s+/i,
      /^what is\s+/i,
      /^what('s| is) (in\s+)?/i,
      /^where (is|can i find)\s+/i,
      /^how does\s+/i,
      /^can you (show|read|find|get|display|pull up|bring up)\s+(me\s+)?/i,
      /^could you (show|read|find|get|display|pull up|bring up)\s+(me\s+)?/i,
      /^please (show|read|find|get|display|pull up|bring up)\s+(me\s+)?/i,
      // Worship/service context phrases
      /^let('?s| us) (go to|read|look at|turn to|see)\s+(the\s+)?(book of\s+)?/i,
      /^we('?re| are) (going to|looking at|reading from)\s+(the\s+)?(book of\s+)?/i,
      /^today('s| we) (verse|reading|scripture) (is|from)\s+(the\s+)?(book of\s+)?/i,
      /^our (verse|reading|scripture|text) (is|comes) from\s+(the\s+)?(book of\s+)?/i,
      /^from (the\s+)?(book of\s+)?/i,
      // Navigation phrases
      /^take me to\s+(the\s+)?(book of\s+)?/i,
      /^go to\s+(the\s+)?(book of\s+)?/i,
      /^jump to\s+(the\s+)?(book of\s+)?/i,
      /^navigate to\s+(the\s+)?(book of\s+)?/i,
      /^bring up\s+(the\s+)?(book of\s+)?/i,
      /^pull up\s+(the\s+)?(book of\s+)?/i,
      /^open\s+(up\s+)?(the\s+)?(book of\s+)?/i,
      /^turn to\s+(the\s+)?(book of\s+)?/i,
      /^flip to\s+(the\s+)?(book of\s+)?/i,
      /^switch to\s+(the\s+)?(book of\s+)?/i,
      /^move to\s+(the\s+)?(book of\s+)?/i,
      /^head to\s+(the\s+)?(book of\s+)?/i,
      // Read/show phrases
      /^read\s+(out\s+)?(me\s+)?(the\s+)?(book of\s+)?/i,
      /^show\s+(me\s+)?(the\s+)?(book of\s+)?/i,
      /^display\s+(me\s+)?(the\s+)?(book of\s+)?/i,
      /^find\s+(me\s+)?(the\s+)?(book of\s+)?/i,
      /^get\s+(me\s+)?(the\s+)?(book of\s+)?/i,
      /^search\s+(for\s+)?(the\s+)?(book of\s+)?/i,
      /^look up\s+(the\s+)?(book of\s+)?/i,
      /^look at\s+(the\s+)?(book of\s+)?/i,
      /^give me\s+(the\s+)?(book of\s+)?/i,
      /^put up\s+(the\s+)?(book of\s+)?/i,
      /^project\s+(the\s+)?(book of\s+)?/i,
      // Casual/informal phrases
      /^hey,?\s+(show|read|find|get|display|open)\s+(me\s+)?/i,
      /^ok(ay)?,?\s+(show|read|find|get|display|open)\s+(me\s+)?/i,
      /^alright,?\s+(show|read|find|get|display|open)\s+(me\s+)?/i,
      // Simple prefixes
      /^the book of\s+/i,
      /^book of\s+/i,
      /^(the\s+)?passage\s+(from\s+)?/i,
      /^(the\s+)?scripture\s+(from\s+)?/i,
      /^(the\s+)?verse\s+(from\s+)?/i,
      /^(the\s+)?text\s+(from\s+)?/i,
      // Pastoral/preaching phrases — e.g. "the words of Psalm 21"
      /^(?:with\s+)?the\s+words\s+of\s+(?:the\s+)?(?:book of\s+)?/i,
      /^(?:with\s+)?(?:the\s+)?words\s+from\s+(?:the\s+)?(?:book of\s+)?/i,
      /^(?:start(?:ing)?\s+(?:off\s+)?)?today\s+with\s+(?:the\s+)?(?:words\s+of\s+)?(?:book of\s+)?/i,
      /^we\s+are\s+going\s+to\s+start\s+(?:off\s+)?today\s+with\s+(?:the\s+)?(?:words\s+of\s+)?(?:book of\s+)?/i,
    ];

    for (const prefix of prefixes) {
      result = result.replace(prefix, "");
    }

    // Conversational suffixes to strip
    const suffixes = [
      /\s+please$/i,
      /\s+for me$/i,
      /\s+say$/i,
      /\s+says$/i,
      /\s+if you (could|would|can|will)$/i,
      /\s+when you (get|have) a (chance|moment)$/i,
      /\s+right now$/i,
      /\s+real quick$/i,
      /\s+quickly$/i,
      /\s+now$/i,
      /\s+thanks$/i,
      /\s+thank you$/i,
      /\s+on (the\s+)?screen$/i,
      /\s+on (the\s+)?display$/i,
      /\s+for (the\s+)?(congregation|church|service|everyone)$/i,
      // Trailing conversational content after a Bible reference
      /\s+where\s+(?:god|jesus|the lord|paul|he|she|it|david|moses)\s+.+$/i,
      /\s+which\s+(?:says|talks|speaks|reads|mentions).+$/i,
      /\s+(?:that|which)\s+(?:talks|speaks|says|reads)\s+about.+$/i,
      /\s+(?:about|regarding|concerning)\s+(?:god|jesus|the lord|faith|love|hope|grace|salvation).+$/i,
    ];

    for (const suffix of suffixes) {
      result = result.replace(suffix, "");
    }

    return result.trim();
  }

  /**
   * Normalize spoken version names to standard abbreviations
   * Handles "amplified" → "amp", "king james" → "kjv", etc.
   */
  private static normalizeVersionName(
    versionText: string,
  ): BibleVersion | null {
    const normalized = versionText.toLowerCase().trim().replace(/\s+/g, " ");

    const versionMap: Record<string, BibleVersion> = {
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
      "good news translation": "gn",
    };

    return versionMap[normalized] || null;
  }

  /**
   * Normalize spoken chapter/verse patterns to standard format
   * Handles "chapter 3 verse 16" → "3:16", "chapter three verse sixteen" → "3:16"
   */
  private static normalizeSpokenChapterVerse(text: string): string {
    let result = text;

    // First normalize spoken numbers
    result = this.normalizeSpokenNumbers(result);

    // Fix Whisper digit-splitting: "verse 1 4" → "verse 14", "verse 2 3" → "verse 23"
    // Whisper sometimes splits a two-digit number into two separate tokens
    result = result.replace(
      /\b(verse[s]?\s+)(\d)\s+(\d)\b/gi,
      (_, v, d1, d2) => `${v}${d1}${d2}`,
    );
    result = result.replace(
      /\b(chapter\s+)(\d)\s+(\d)\b/gi,
      (_, c, d1, d2) => `${c}${d1}${d2}`,
    );

    // Handle "chapter X verse Y" or "chapter X verses Y through Z"
    result = result.replace(
      /chapter\s+(\d+)\s+verse[s]?\s+(\d+)(?:\s+(?:through|to|thru|-)\s+(\d+))?/gi,
      (_, ch, v1, v2) => (v2 ? `${ch}:${v1}-${v2}` : `${ch}:${v1}`),
    );

    // Handle "chapter X" followed by a bare number (Whisper drops "verse" keyword)
    // e.g. "romans chapter 7 14" → "romans 7:14"
    result = result.replace(
      /chapter\s+(\d+)\s+(\d+)(?!\s*[-:])/gi,
      (_, ch, v) => `${ch}:${v}`,
    );

    // Handle "chapter X" alone (no verse specified, default to verse 1)
    result = result.replace(/chapter\s+(\d+)(?!\s*[:\d])/gi, "$1:1");

    // Handle "verse X" without chapter (keep as is for context-aware parsing)
    // Remove any stray space before the colon
    result = result.replace(/verse\s+(\d+)/gi, ":$1");
    result = result.replace(/\s+:/g, ":");

    return result.trim();
  }

  private static readonly PHONETIC_CORRECTIONS: Record<string, string> = {
    "my future": "matthew",
    "my few": "matthew",
    "math you": "matthew",
    "math to": "matthew",
    "mat you": "matthew",
    madhu: "matthew",
    mathy: "matthew",
    "mad you": "matthew",
    "my the": "matthew",
    "myth you": "matthew",
    look: "luke",
    luk: "luke",
    luck: "luke",
    "look at": "luke",
    luque: "luke",
    jaan: "john",
    joan: "john",
    jon: "john",
    "john's": "john",
    jen: "genesis",
    "jen says": "genesis",
    "jen assists": "genesis",
    "jen is this": "genesis",
    generous: "genesis",
    generic: "genesis",
    "jenny sis": "genesis",
    "x is": "exodus",
    "exit us": "exodus",
    "exit is": "exodus",
    exitus: "exodus",
    levitical: "leviticus",
    "let it because": "leviticus",
    "due to ron amy": "deuteronomy",
    "due to run amy": "deuteronomy",
    "do to ron amy": "deuteronomy",
    "do toronto me": "deuteronomy",
    joshy: "joshua",
    "josh you a": "joshua",
    "judge is": "judges",
    psalm: "psalms",
    sam: "psalms",
    salm: "psalms",
    some: "psalms",
    sum: "psalms",
    som: "psalms",
    solm: "psalms",
    "saw ms": "psalms",
    "saw m": "psalms",
    salms: "psalms",
    sams: "psalms",
    sums: "psalms",
    somes: "psalms",
    soms: "psalms",
    solms: "psalms",
    song: "psalms",
    songs: "psalms",
    saum: "psalms",
    saums: "psalms",
    salum: "psalms",
    solemn: "psalms",
    province: "proverbs",
    proverb: "proverbs",
    "close eye": "colossians",
    collision: "colossians",
    collisions: "colossians",
    colossions: "colossians",
    colosions: "colossians",
    colosseons: "colossians",
    colosseans: "colossians",
    colossean: "colossians",
    colossian: "colossians",
    colosians: "colossians",
    collossians: "colossians",
    kolossians: "colossians",
    koloshians: "colossians",
    philippine: "philippians",
    "philippine is": "philippians",
    "fill up pins": "philippians",
    "fill a pins": "philippians",
    efficient: "ephesians",
    effusions: "ephesians",
    "a fishing": "ephesians",
    "the salon again": "thessalonians",
    "the saloni and": "thessalonians",
    galatian: "galatians",
    glaciation: "galatians",
    glacier: "galatians",
    roman: "romans",
    "roman's": "romans",
    "able diah": "obadiah",
    "oh by dyer": "obadiah",
    "oh bad i a": "obadiah",
    "oh by die": "obadiah",
    "oh body a": "obadiah",
    "over dire": "obadiah",
    "my car": "micah",
    mica: "micah",
    mike: "micah",
    "mike a": "micah",
    "name um": "nahum",
    "nay hum": "nahum",
    "now him": "nahum",
    "no home": "nahum",
    "now home": "nahum",
    "no hum": "nahum",
    "now hum": "nahum",
    "nah hum": "nahum",
    "na hum": "nahum",
    nahem: "nahum",
    nehem: "nahum",
    nahomes: "nahum",
    "no homes": "nahum",
    "now homes": "nahum",
    "now i'm": "nahum",
    "now im": "nahum",
    "now am": "nahum",
    "half a cook": "habakkuk",
    "have a cook": "habakkuk",
    "have a coke": "habakkuk",
    "have a cup": "habakkuk",
    "how back cook": "habakkuk",
    "hub a cook": "habakkuk",
    "havoc cook": "habakkuk",
    "ha backhoe": "habakkuk",
    "zephyr nine": "zephaniah",
    "zeph and i": "zephaniah",
    "zeph a nigh": "zephaniah",
    zephania: "zephaniah",
    "step a nye": "zephaniah",
    "hay guy": "haggai",
    "hug i": "haggai",
    "high guy": "haggai",
    "hag eye": "haggai",
    "hug eye": "haggai",
    "ha guy": "haggai",
    "zack arrived": "zechariah",
    "zack are i a": "zechariah",
    "zack a rye a": "zechariah",
    "secondary a": "zechariah",
    "zach a rye": "zechariah",
    "mall a chi": "malachi",
    maliki: "malachi",
    "mall a key": "malachi",
    "mala kai": "malachi",
    "mala chi": "malachi",
    "eyes a": "isaiah",
    "i say a": "isaiah",
    "i say ya": "isaiah",
    "easy kill": "ezekiel",
    "easy keel": "ezekiel",
    "is equal": "ezekiel",
    "jerry my": "jeremiah",
    "jerry maya": "jeremiah",
    "lemon station": "lamentations",
    lamentation: "lamentations",
    daniel: "daniel",
    "dan yell": "daniel",
    "he brews": "hebrews",
    hebrew: "hebrews",
    hebrews: "hebrews",
    james: "james",
    tightest: "titus",
    "tight us": "titus",
    "file a man": "philemon",
    "full eamon": "philemon",
    revelation: "revelation",
    revelations: "revelation",
    "first corinthian": "1 corinthians",
    "first corinthians": "1 corinthians",
    "second corinthian": "2 corinthians",
    "second corinthians": "2 corinthians",
    "first tim": "1 timothy",
    "first timothy": "1 timothy",
    "second tim": "2 timothy",
    "second timothy": "2 timothy",
    "first peter": "1 peter",
    "second peter": "2 peter",
    "first john": "1 john",
    "second john": "2 john",
    "third john": "3 john",
    "first samuel": "1 samuel",
    "second samuel": "2 samuel",
    samoa: "samuel",
    samura: "samuel",
    samira: "samuel",
    samual: "samuel",
    samuels: "samuel",
    "first king": "1 kings",
    "first kings": "1 kings",
    "second king": "2 kings",
    "second kings": "2 kings",
    "first chronicles": "1 chronicles",
    "second chronicles": "2 chronicles",
    "first thessalonians": "1 thessalonians",
    "second thessalonians": "2 thessalonians",
    ecclesiastic: "ecclesiastes",
    ecclesiastical: "ecclesiastes",
    eclectic: "ecclesiastes",
    "song of songs": "song of solomon",
    "acts of the apostles": "acts",
    act: "acts",
  };

  private static readonly CONTEXT_ONLY_PHONETICS = new Set([
    // Navigation/common words — only apply phonetic correction when chapter/verse context exists
    "look",
    "luck",
    "mike",
    "roman",        // extremely common English adjective ("Roman army")
    "romans",       // common proper noun ("the Romans")
    "province",     // common English word → Proverbs
    "act",          // common English word → Acts
    "collision",    // Colossians
    "collisions",   // Colossians
    "efficient",    // Ephesians
    "glacier",      // Galatians
    "tightest",     // Titus
    "generous",     // Genesis — very common English word
    "generic",      // Genesis — very common English word
    "mica",         // Micah — also a common name/mineral
    "no home",
    "now home",
    "no homes",
    "now homes",
    "have a cup",
    "over dire",
    "secondary a",
    "ha guy",
    // Very short/common words that happen to sound like Psalms
    "sam",          // Psalms — also a common name
    "some",         // Psalms — extremely common English word
    "sum",          // Psalms — common English word
    "som",          // Psalms
    "song",         // Psalms — also legitimately "Song of Solomon"
    "songs",        // Psalms — common English word
    "solemn",       // Psalms — common English adjective
  ]);

  private static readonly KEYWORD_CORRECTIONS: Array<[RegExp, string]> = [
    // ── Whisper number mishearings ─────────────────────────────────────────────────
    // Whisper often transcribes spoken digits as words with slight variations
    [/\bheaven\b/gi, "seven"],          // "chapter heaven" → "chapter seven"
    [/\bfor\s+teen\b/gi, "fourteen"],   // "for teen" → "fourteen"
    [/\bfor\s+team\b/gi, "fourteen"],
    [/\bfour\s+teen\b/gi, "fourteen"],
    [/\ba\s+level\b/gi, "eleven"],      // "a level" → "eleven"
    [/\belevan\b/gi, "eleven"],
    [/\beleven\s+th\b/gi, "eleventh"],
    [/\btwelve\s+th\b/gi, "twelfth"],
    [/\bthirty\s+th\b/gi, "thirtieth"],
    [/\btwenty\s+th\b/gi, "twentieth"],
    [/\bforty\s+th\b/gi, "fortieth"],
    [/\bfifty\s+th\b/gi, "fiftieth"],
    [/\bsixty\s+th\b/gi, "sixtieth"],
    [/\bseventy\s+th\b/gi, "seventieth"],
    [/\beighty\s+th\b/gi, "eightieth"],
    [/\bninety\s+th\b/gi, "ninetieth"],
    // Whisper digit-word splits
    [/\bfif\s+teen\b/gi, "fifteen"],
    [/\bsix\s+teen\b/gi, "sixteen"],
    [/\bsev\s+en\s+teen\b/gi, "seventeen"],
    [/\beigh\s+teen\b/gi, "eighteen"],
    [/\bnine\s+teen\b/gi, "nineteen"],
    [/\bthir\s+teen\b/gi, "thirteen"],
    // ── "was [number]" → "verse [number]" (gated on biblical context) ────────
    [/\bwas\s+to\b/gi, "verse 2"],
    [/\bwas\s+too\b/gi, "verse 2"],
    [/\bwas\s+two\b/gi, "verse 2"],
    [/\bwas\s+one\b/gi, "verse 1"],
    [/\bwas\s+won\b/gi, "verse 1"],
    [/\bwas\s+three\b/gi, "verse 3"],
    [/\bwas\s+tree\b/gi, "verse 3"],
    [/\bwas\s+four\b/gi, "verse 4"],
    [/\bwas\s+for\b/gi, "verse 4"],
    [/\bwas\s+five\b/gi, "verse 5"],
    [/\bwas\s+six\b/gi, "verse 6"],
    [/\bwas\s+seven\b/gi, "verse 7"],
    [/\bwas\s+eight\b/gi, "verse 8"],
    [/\bwas\s+nine\b/gi, "verse 9"],
    [/\bwas\s+ten\b/gi, "verse 10"],
    [/\bwas\s+(\d+)\b/gi, "verse $1"],
    [/\bfirst of the\b/gi, "first samuel"],
    [/\bfirst of\b(?=\s+\d)/gi, "first samuel"],
    [/\bso much after\b/gi, "samuel"],
    [/\bso much of the\b/gi, "samuel"],
    [/\bso much of\b/gi, "samuel"],
    [/\bso much\b(?=\s+\d)/gi, "samuel"],
    [/\bsandwich at the\b/gi, "samuel"],
    [/\bsandwich at\b/gi, "samuel"],
    [/\bsandwich\b(?=\s+(?:chapter|\d))/gi, "samuel"],
    [/\bsomewhat\b/gi, "samuel"],
    [/\bsam\s+watch\b/gi, "samuel"],
    [/\bsam\s+much\b/gi, "samuel"],
    [/\bsam\s+wall\b/gi, "samuel"],
    [/\bsam\s+well\b/gi, "samuel"],
    [/\bsam\s+you\b/gi, "samuel"],
    [/\bsam\s+your\b/gi, "samuel"],
    [/\bsam\s+uel\b/gi, "samuel"],
    [/\bsam\s+wool\b/gi, "samuel"],
    [/\bsam\s+woo\b/gi, "samuel"],
    [/\bsam\b(?=\s+(?:chapter|\d))/gi, "samuel"],
    [/\bsecond of the\b/gi, "second samuel"],
    [/\bsecond of\b(?=\s+\d)/gi, "second samuel"],
    [/\bshumi\b/gi, "show me"],
    [/\bsiomi\b/gi, "show me"],
  ];

  private static applyPhoneticCorrections(text: string): string {
    let result = text.toLowerCase();

    // Gate "was [number] → verse [number]" keyword corrections.
    // These patterns are only useful when the sentence already contains a bible
    // book name or the word "chapter", otherwise they fire on ordinary English
    // sentences like "He was two years old" and produce false verse cues.
    const hasBookOrChapterContext = /\b(chapter|genesis|exodus|leviticus|numbers|deuteronomy|joshua|judges|ruth|samuel|kings|chronicles|ezra|nehemiah|esther|job|psalms|psalm|proverbs|ecclesiastes|isaiah|jeremiah|lamentations|ezekiel|daniel|hosea|joel|amos|obadiah|jonah|micah|nahum|habakkuk|zephaniah|haggai|zechariah|malachi|matthew|mark|luke|john|acts|romans|corinthians|galatians|ephesians|philippians|colossians|thessalonians|timothy|titus|philemon|hebrews|james|peter|jude|revelation)\b/i.test(result);

    for (const [pattern, replacement] of this.KEYWORD_CORRECTIONS) {
      // Skip "was → verse" patterns unless there's clear biblical context.
      // pattern.source for /\bwas\s+to\b/ is the string "\bwas\s+to\b"
      const isWasPattern = /\\bwas\\s/.test(pattern.source);
      if (isWasPattern && !hasBookOrChapterContext) {
        continue;
      }
      if (pattern.test(result)) {
        console.log(
          `🔊 Keyword correction: "${result.match(pattern)?.[0]}" → "${replacement}"`,
        );
        pattern.lastIndex = 0;
        result = result.replace(pattern, replacement);
      }
    }


    // Number-word → digit conversion is handled by normalizeSpokenNumbers(),
    // which is called from normalizeSpokenChapterVerse() AFTER phonetic corrections.
    // Do NOT duplicate number replacement here — it caused ordinal conflicts.

    const hasChapterVerseContext =
      /\b(chapter|verse|\d+\s*:\s*\d+|\d+\s+\d+)\b/i.test(result);
    const sortedKeys = Object.keys(this.PHONETIC_CORRECTIONS).sort(
      (a, b) => b.length - a.length,
    );

    for (const misheard of sortedKeys) {
      if (
        this.CONTEXT_ONLY_PHONETICS.has(misheard) &&
        !hasChapterVerseContext
      ) {
        continue;
      }
      const regex = new RegExp(
        `\\b${misheard.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
        "gi",
      );
      if (regex.test(result)) {
        const corrected = this.PHONETIC_CORRECTIONS[misheard];
        console.log(`🔊 Phonetic correction: "${misheard}" → "${corrected}"`);
        result = result.replace(regex, corrected);
      }
    }

    return result;
  }

  /**
   * STAGED PIPELINE: Optimized voice command parsing with layered approach
   * Stage 0: Navigation & version commands (fastest)
   * Stage 0.5: Phonetic corrections for ASR errors
   * Stage 1: Pre-compiled regex (fast - no function calls)
   * Stage 2: Alias hash lookup (O(1) - very fast)
   * Stage 3: Fuzzy matching (slowest - only when stages 1 & 2 fail)
   *
   * Uses memoization cache to avoid re-parsing repeated commands
   */
  static parseVoiceCommandOptimized(text: string): VoiceCommand {
    const startTime = performance.now();

    // ========== PREPROCESSING: Strip conversational phrasing FIRST ==========
    // This ensures "can you show me the next verse please" becomes "next verse"
    let cleanText = this.stripConversationalPhrasing(text);
    const lowerClean = cleanText.toLowerCase().trim();

    // ========== STAGE 0: Navigation commands (fastest - no book lookup needed) ==========
    if (REGEX_PATTERNS.next.test(lowerClean)) {
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'next' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "verse_change",
        confidence: 0.95,
        navigationDirection: "next",
      };
    }

    if (REGEX_PATTERNS.previous.test(lowerClean)) {
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'previous' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "verse_change",
        confidence: 0.95,
        navigationDirection: "previous",
      };
    }

    if (REGEX_PATTERNS.nextChapter.test(lowerClean)) {
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'next chapter' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "chapter_change",
        confidence: 0.95,
        navigationDirection: "next",
      };
    }

    if (REGEX_PATTERNS.prevChapter.test(lowerClean)) {
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'prev chapter' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "chapter_change",
        confidence: 0.95,
        navigationDirection: "previous",
      };
    }

    const jumpToVerseMatch = lowerClean.match(REGEX_PATTERNS.jumpToVerse);
    if (jumpToVerseMatch) {
      const targetVerse = parseInt(jumpToVerseMatch[1], 10);
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'jump to verse ${targetVerse}' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "jump_to_verse",
        confidence: 0.95,
        targetVerse,
      };
    }

    if (REGEX_PATTERNS.firstVerse.test(lowerClean)) {
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'first verse' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "jump_to_verse",
        confidence: 0.95,
        targetVerse: 1,
      };
    }

    if (REGEX_PATTERNS.lastVerse.test(lowerClean)) {
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'last verse' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "last_verse",
        confidence: 0.95,
      };
    }

    const jumpRelativeMatch = lowerClean.match(REGEX_PATTERNS.jumpRelative);
    if (jumpRelativeMatch) {
      const amount = parseInt(jumpRelativeMatch[1], 10);
      const directionStr = jumpRelativeMatch[2];
      const isForward = directionStr === "forward" || directionStr === "ahead";
      const offset = isForward ? amount : -amount;
      const duration = performance.now() - startTime;
      console.log(
        `⚡ Stage 0: Navigation 'jump relative ${offset}' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
      );
      return {
        originalText: text,
        parsedReference: null,
        commandType: "jump_relative",
        confidence: 0.95,
        offset,
      };
    }

    // ========== STAGE 0b: Version switching commands ==========
    // Try full pattern first: "show me NKJV", "switch to NIV"
    let versionMatch = lowerClean.match(REGEX_PATTERNS.versionSwitch);
    if (!versionMatch) {
      // Try simpler pattern after stripping: "nkjv", "amplified version", "msg"
      versionMatch = lowerClean.match(REGEX_PATTERNS.versionOnly);
    }
    if (versionMatch) {
      const requestedVersion = this.normalizeVersionName(versionMatch[1]);
      if (requestedVersion) {
        const duration = performance.now() - startTime;
        console.log(
          `⚡ Stage 0: Version switch to '${requestedVersion}' in ${duration.toFixed(2)}ms (cleaned: "${lowerClean}")`,
        );
        return {
          originalText: text,
          parsedReference: null,
          commandType: "version_change",
          confidence: 0.95,
          requestedVersion,
        };
      }
    }

    // ========== QC40 Phase 3: Sliding-window scanner ==========
    const slidingResult = this.scanForBibleReference(text);
    if (slidingResult) {
      const dur = performance.now() - startTime;
      console.log("Stage 0.1: Sliding-window in " + dur.toFixed(2) + "ms");
      return { originalText: text, parsedReference: slidingResult, commandType: "lookup", confidence: 0.93 };
    }

    // ========== STAGE 0.5: Phonetic corrections for ASR misrecognitions ==========
    // Must run BEFORE spoken number normalization so "first of the" → "first samuel" works
    // (normalizeSpokenNumbers converts "first" → "1" which would break phonetic matching)
    const phoneticCorrected = this.applyPhoneticCorrections(cleanText);
    if (phoneticCorrected !== cleanText.toLowerCase()) {
      console.log(
        `🔊 Phonetic pipeline: "${cleanText}" → "${phoneticCorrected}"`,
      );
      cleanText = phoneticCorrected;
    }

    // ========== FURTHER PREPROCESSING: Normalize spoken numbers and chapter/verse patterns ==========
    let normalizedText = this.normalizeSpokenChapterVerse(cleanText);

    // ========== STAGE 1: Pre-compiled regex patterns (fast) ==========
    const regexResult = this.tryRegexParsing(normalizedText);
    if (regexResult) {
      const duration = performance.now() - startTime;
      console.log(`⚡ Stage 1: Regex match in ${duration.toFixed(2)}ms`);
      return {
        originalText: text,
        parsedReference: regexResult,
        commandType: "lookup",
        confidence: 0.95,
      };
    }

    // ========== STAGE 2: Alias lookup (O(1) hash table) ==========
    const { book, remainingText } = extractBookFromCommand(normalizedText);
    if (book) {
      const chapterVerse = parseChapterVerse(remainingText);
      if (chapterVerse) {
        const duration = performance.now() - startTime;
        console.log(`⚡ Stage 2: Alias lookup in ${duration.toFixed(2)}ms`);
        return {
          originalText: text,
          parsedReference: {
            book: book.name,
            chapter: chapterVerse.chapter,
            verseStart: chapterVerse.verseStart,
            verseEnd: chapterVerse.verseEnd,
            version: "kjv",
          },
          commandType: "lookup",
          confidence: 0.92,
        };
      }
    }

    // ========== STAGE 3: Fuzzy matching (slowest - last resort) ==========
    const words = normalizedText.split(/\s+/);
    for (let i = Math.min(3, words.length); i >= 1; i--) {
      const potentialBook = words.slice(0, i).join(" ");
      const fuzzyResult = fuzzyMatchBook(potentialBook);

      // Threshold raised from 0.6 → 0.75: require a strong phonetic match before
      // treating an unrecognized word as a Bible book name.
      if (fuzzyResult && fuzzyResult.score > 0.75) {
        const remaining = words.slice(i).join(" ");
        const chapterVerse = parseChapterVerse(remaining);

        if (chapterVerse) {
          const duration = performance.now() - startTime;
          console.log(
            `⚡ Stage 3: Fuzzy match in ${duration.toFixed(2)}ms (score: ${fuzzyResult.score.toFixed(2)})`,
          );
          return {
            originalText: text,
            parsedReference: {
              book: fuzzyResult.book.name,
              chapter: chapterVerse.chapter,
              verseStart: chapterVerse.verseStart,
              verseEnd: chapterVerse.verseEnd,
              version: "kjv",
            },
            commandType: "lookup",
            confidence: fuzzyResult.score * 0.85,
          };
        }
      }
    }

    // ========== FALLBACK: Original parser ==========
    // QC51: Only invoke the legacy parser if the transcript has at least 4 words.
    // Short fragments like "that", "where", "you know" cannot contain a valid
    // Bible reference and the legacy parser produces garbage on them.
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (wordCount < 4) {
      console.log(`[AudioSocket] Legacy fallback skipped — too short (${wordCount} words): "${text.trim().slice(0, 60)}"`);
      return { originalText: text, parsedReference: null, commandType: 'lookup', confidence: 0 };
    }
    const duration = performance.now() - startTime;
    console.log(
      `⚠️ Falling back to legacy parser after ${duration.toFixed(2)}ms`,
    );
    return this.parseVoiceCommand(text);
  }

  /**
   * QC40 Phase 3: Sliding-window scanner for conversational Bible references.
   *
   * Scans the ENTIRE input text (not just the last 25 words) using a sliding
   * window of 1-3 words to find a Bible book name, preceded by an optional
   * conversational anchor phrase (e.g. "as written in", "turn to", "in").
   * Falls back to a raw sliding-window scan without any anchor.
   *
   * @param text - Raw (already lower-cased + phonetic-corrected) transcript text
   * @returns BibleReference if a valid book+chapter+verse is found, else null
   */
  private static scanForBibleReference(text: string): BibleReference | null {
    const ANCHORS: RegExp[] = [
      /\b(?:show me|find|read|go to|open|turn to|flip to)\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\b(?:book of|the book of)\s+/gi,
      /\bas written in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bas it says in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bas stated in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bas found in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bas recorded in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bthe scripture in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bthe passage in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bscripture says\s+(?:in\s+)?(?:the\s+)?(?:book of\s+)?/gi,
      /\bthe bible says\s+(?:in\s+)?(?:the\s+)?(?:book of\s+)?/gi,
      /\bthe word says\s+(?:in\s+)?(?:the\s+)?(?:book of\s+)?/gi,
      /\bit is written in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bit says in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bwe read in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bwe find in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\blook at\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\blet us look at\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bturn your bibles to\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bturn with me to\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bour text (?:is|comes) from\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bfound in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bwritten in\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\baccording to\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bfrom the book of\s+/gi,
      /\bin the book of\s+/gi,
      /\bin\s+(?:the\s+)?(?:book of\s+)?/gi,
      // Pastoral/preaching phrases — e.g. "the words of Psalm 21", "with the words of John 3"
      /\b(?:with\s+)?the\s+words\s+of\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\b(?:with\s+)?(?:the\s+)?words\s+from\s+(?:the\s+)?(?:book of\s+)?/gi,
      /\bstart(?:ing)?\s+(?:off\s+)?(?:today\s+)?with\s+(?:the\s+)?(?:words\s+of\s+)?(?:book of\s+)?/gi,
      /\bthe\s+(?:scripture|passage|text|verse)\s+(?:is\s+)?(?:from\s+)?(?:found\s+in\s+)?(?:the\s+)?(?:book of\s+)?/gi,
      /\btoday(?:'s|\s+we\s+are\s+looking\s+at)?\s+(?:the\s+)?(?:words\s+of\s+)?(?:book of\s+)?/gi,
      /\b(?:let(?:'s|\s+us)\s+)?(?:look\s+at|read|open)\s+(?:the\s+)?(?:words\s+of\s+)?(?:book of\s+)?/gi,
    ];
    const lowerText = text.toLowerCase().trim();
    let normalizedText = this.normalizeSpokenChapterVerse(this.applyPhoneticCorrections(lowerText));
    // Pass 1: anchor-based scan
    for (const anchor of ANCHORS) {
      anchor.lastIndex = 0;
      const m = anchor.exec(normalizedText);
      if (m) {
        const after = normalizedText.slice(m.index + m[0].length).trim();
        if (!after) continue;
        const { book, remainingText } = extractBookFromCommand(after);
        if (book) {
          const cv = parseChapterVerse(remainingText);
          if (cv && cv.chapter > 0 && cv.verseStart > 0) {
            console.log(`[SlidingWindow] Anchor: ${m[0].trim()} -> ${book.name} ${cv.chapter}:${cv.verseStart}`);
            return { book: book.name, chapter: cv.chapter, verseStart: cv.verseStart, verseEnd: cv.verseEnd, version: 'kjv' };
          }
        }
      }
    }
    // QC51: Pass 2 (raw sliding-window with no anchor) has been REMOVED.
    // It matched Bible book names as substrings of ordinary words and combined
    // them with any nearby number in the sentence, causing false scripture
    // projections from normal speech (e.g. "Proverbs" in a sentence, "Amos" in
    // "the Amos high", "Esther" from "let's see the NIV").
    // Only anchor-based matches (Pass 1 above) are trusted.
    return null;
  }

  /**
   * Stage 1: Try parsing with pre-compiled regex patterns
   * Returns BibleReference if successful, null otherwise
   */
  private static tryRegexParsing(text: string): BibleReference | null {
    const normalizedText = text.trim();

    // Pattern 1: Standard colon format "john 3:16" or "genesis 1:1-3"
    let match = normalizedText.match(REGEX_PATTERNS.colonFormat);
    if (match) {
      const bookName =
        this.BOOK_ALIASES[
          match[1].toLowerCase() as keyof typeof this.BOOK_ALIASES
        ];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[2]),
          verseStart: parseInt(match[3]),
          verseEnd: match[4] ? parseInt(match[4]) : undefined,
          version: "kjv",
        };
      }
    }

    // Pattern 2: Numbered books colon "1 john 3:16"
    match = normalizedText.match(REGEX_PATTERNS.numberedColonFormat);
    if (match) {
      const bookKey = `${match[1]} ${match[2].toLowerCase()}`;
      const bookName =
        this.BOOK_ALIASES[bookKey as keyof typeof this.BOOK_ALIASES];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[3]),
          verseStart: parseInt(match[4]),
          verseEnd: match[5] ? parseInt(match[5]) : undefined,
          version: "kjv",
        };
      }
    }

    // Pattern 3: Space format "john 3 16"
    match = normalizedText.match(REGEX_PATTERNS.spaceFormat);
    if (match) {
      const bookName =
        this.BOOK_ALIASES[
          match[1].toLowerCase() as keyof typeof this.BOOK_ALIASES
        ];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[2]),
          verseStart: parseInt(match[3]),
          verseEnd: match[4] ? parseInt(match[4]) : undefined,
          version: "kjv",
        };
      }
    }

    // Pattern 4: Numbered books space "1 john 3 16"
    match = normalizedText.match(REGEX_PATTERNS.numberedSpaceFormat);
    if (match) {
      const bookKey = `${match[1]} ${match[2].toLowerCase()}`;
      const bookName =
        this.BOOK_ALIASES[bookKey as keyof typeof this.BOOK_ALIASES];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[3]),
          verseStart: parseInt(match[4]),
          verseEnd: match[5] ? parseInt(match[5]) : undefined,
          version: "kjv",
        };
      }
    }

    // Pattern 5: Chapter verse format "john chapter 3 verse 16"
    match = normalizedText.match(REGEX_PATTERNS.chapterVerseFormat);
    if (match) {
      const bookName =
        this.BOOK_ALIASES[
          match[1].toLowerCase() as keyof typeof this.BOOK_ALIASES
        ];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[2]),
          verseStart: parseInt(match[3]),
          verseEnd: match[4] ? parseInt(match[4]) : undefined,
          version: "kjv",
        };
      }
    }

    // Pattern 6: Chapter only "matthew 24" -> verse 1
    match = normalizedText.match(REGEX_PATTERNS.chapterOnlyFormat);
    if (match) {
      const bookName =
        this.BOOK_ALIASES[
          match[1].toLowerCase() as keyof typeof this.BOOK_ALIASES
        ];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[2]),
          verseStart: 1,
          version: "kjv",
        };
      }
    }

    // Pattern 7: Numbered chapter only "1 john 3"
    match = normalizedText.match(REGEX_PATTERNS.numberedChapterOnlyFormat);
    if (match) {
      const bookKey = `${match[1]} ${match[2].toLowerCase()}`;
      const bookName =
        this.BOOK_ALIASES[bookKey as keyof typeof this.BOOK_ALIASES];
      if (bookName) {
        return {
          book: bookName,
          chapter: parseInt(match[3]),
          verseStart: 1,
          version: "kjv",
        };
      }
    }

    return null;
  }

  private static normalizeSpokenNumbers(text: string): string {
    // ── Ones ──────────────────────────────────────────────────────────────────
    const ones: Record<string, number> = {
      zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7,
      eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13,
      fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18,
      nineteen: 19,
      // Ordinals (Whisper often outputs "chapter seventh" instead of "chapter seven")
      first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7,
      eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12,
      thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16,
      seventeenth: 17, eighteenth: 18, nineteenth: 19,
    };
    const tens: Record<string, number> = {
      twenty: 20, thirty: 30, forty: 40, fifty: 50,
      sixty: 60, seventy: 70, eighty: 80, ninety: 90,
      // Ordinal tens
      twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50,
      sixtieth: 60, seventieth: 70, eightieth: 80, ninetieth: 90,
    };

    // ── Step 1: Collapse compound spoken numbers (e.g. "twenty seven" → "27",
    //           "one hundred and nineteen" → "119", "a hundred" → "100") ──────
    let result = text.toLowerCase();

    // "a hundred [and] X" / "one hundred [and] X"
    result = result.replace(
      /\b(?:a|one)\s+hundred\s+(?:and\s+)?(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)(?:[\s-](one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen))?\b/gi,
      (_, t, o) => String(100 + (tens[t.toLowerCase()] ?? 0) + (o ? (ones[o.toLowerCase()] ?? 0) : 0)),
    );
    result = result.replace(
      /\b(?:a|one)\s+hundred\s+(?:and\s+)?(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi,
      (_, o) => String(100 + (ones[o.toLowerCase()] ?? 0)),
    );
    result = result.replace(/\b(?:a|one)\s+hundred\b/gi, "100");

    // "twenty[-]one" … "ninety[-]nine"
    result = result.replace(
      /\b(twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-](one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen)\b/gi,
      (_, t, o) => String((tens[t.toLowerCase()] ?? 0) + (ones[o.toLowerCase()] ?? 0)),
    );

    // ── Step 2: Replace remaining single number-words ──────────────────────────
    const allSingle: Record<string, string> = {};
    for (const [k, v] of Object.entries(ones)) allSingle[k] = String(v);
    for (const [k, v] of Object.entries(tens)) allSingle[k] = String(v);
    allSingle["hundred"] = "100";

    const sortedWords = Object.keys(allSingle).sort((a, b) => b.length - a.length);
    for (const word of sortedWords) {
      result = result.replace(
        new RegExp(`\\b${word}\\b`, "gi"),
        allSingle[word],
      );
    }
    return result;
  }

  /**
   * Step 3: Search Bible database for reference
   * Returns raw verse data with all version columns for frontend flexibility
   * Uses LRU cache to avoid repeated database queries
   */
  static async searchBible(
    reference: BibleReference,
  ): Promise<BibleSearchResult | null> {
    const startTime = performance.now();

    // Check LRU cache first
    const cacheKey = getVerseCacheKey(reference);
    const cached = verseCache.get(cacheKey);
    if (cached) {
      const duration = performance.now() - startTime;
      console.log(`📦 Cache HIT for ${cacheKey} in ${duration.toFixed(2)}ms`);
      return cached;
    }

    try {
      // Normalize book name using fuzzy module - returns BibleBook object, need .name
      const bookResult = normalizeBookName(reference.book);
      const normalizedBookName = bookResult?.name || reference.book;
      console.log(
        `Searching for: ${normalizedBookName} ${reference.chapter}:${reference.verseStart}`,
      );

      const version = reference.version || "kjv";
      const verseEnd = reference.verseEnd || reference.verseStart;

      // Use Mongoose for verse query
      // Using regex for case-insensitive bookName match if needed, but the DB has exact names.
      // We will perform a case-insensitive match.
      const verseResults = await BibleVerse.find({
        bookName: new RegExp(`^${normalizedBookName}$`, 'i'),
        chapter: reference.chapter,
        verse: { $gte: reference.verseStart, $lte: verseEnd },
      }).sort({ verse: 1 }).lean();

      if (verseResults.length === 0) {
        // QC38: Verse not found — check if the chapter exists, then try to clamp to last valid verse
        console.warn(
          `[searchBible] No results for ${normalizedBookName} ${reference.chapter}:${reference.verseStart}-${verseEnd}. Checking chapter max verse...`,
        );
        const maxVerse = await BibleService.getChapterMaxVerse(normalizedBookName, reference.chapter);
        if (maxVerse === null) {
          // Chapter itself does not exist in the DB
          console.error(
            `[searchBible] Chapter not found: ${normalizedBookName} ${reference.chapter}`,
          );
          return null;
        }
        if (reference.verseStart > maxVerse) {
          // Out-of-range verse — clamp to last valid verse and retry
          console.warn(
            `[searchBible] Verse ${reference.verseStart} out of range for ${normalizedBookName} ${reference.chapter} (max: ${maxVerse}). Clamping to ${maxVerse}.`,
          );
          const clampedVerseResults = await BibleVerse.find({
            bookName: new RegExp(`^${normalizedBookName}$`, 'i'),
            chapter: reference.chapter,
            verse: { $gte: maxVerse, $lte: maxVerse },
          }).sort({ verse: 1 }).lean();
          if (clampedVerseResults.length === 0) {
            console.error(`[searchBible] Clamp retry also returned no results for ${normalizedBookName} ${reference.chapter}:${maxVerse}`);
            return null;
          }
          const exactClampedBookName = clampedVerseResults[0].bookName || normalizedBookName;
          const clampedFormatted = `${exactClampedBookName} ${reference.chapter}:${maxVerse}`;
          const clampedFormattedVerses = clampedVerseResults.map((v) => ({
            verse: v.verse,
            kjv: v.kjv || null,
            nkjv: v.nkjv || null,
            amp: v.amp || null,
            msg: v.msg || null,
            esv: v.esv || null,
            niv: v.niv || null,
          }));
          const clampedResult: BibleSearchResult = {
            book: exactClampedBookName,
            chapter: reference.chapter,
            verses: clampedFormattedVerses,
            version: (reference.version || 'kjv').toUpperCase(),
            formattedReference: clampedFormatted,
            clampedFrom: reference.verseStart,
            clampNote: `${exactClampedBookName} ${reference.chapter} only has ${maxVerse} verse${maxVerse === 1 ? '' : 's'} — showing verse ${maxVerse}`,
          };
          // Cache the clamped result under the original key
          if (verseCache.size >= VERSE_CACHE_MAX) {
            const firstKey = verseCache.keys().next().value;
            if (firstKey) verseCache.delete(firstKey);
          }
          verseCache.set(cacheKey, clampedResult);
          console.log(`[searchBible] Clamped result cached for ${cacheKey}`);
          return clampedResult;
        }
        // Verse in range but still no results — genuine DB miss
        console.error(
          `[searchBible] Genuine DB miss: ${normalizedBookName} ${reference.chapter}:${reference.verseStart}-${verseEnd}`,
        );
        return null;
      }

      const searchTime = performance.now() - startTime;
      console.log(
        `Found ${verseResults.length} verses in ${searchTime.toFixed(2)}ms`,
      );

      // We need to map the verses to ensure they conform to the expected shape (no _id, exact properties)
      const formattedVerses = verseResults.map((v) => ({
        verse: v.verse,
        kjv: v.kjv || null,
        nkjv: v.nkjv || null,
        amp: v.amp || null,
        msg: v.msg || null,
        esv: v.esv || null,
        niv: v.niv || null,
      }));

      // Normalize the book name based on the actual DB result
      const exactBookName = verseResults[0].bookName || normalizedBookName;

      const formattedReference =
        verseEnd > reference.verseStart
          ? `${exactBookName} ${reference.chapter}:${reference.verseStart}-${verseEnd}`
          : `${exactBookName} ${reference.chapter}:${reference.verseStart}`;

      // QC52: Fetch all verses of the matched chapter so the client can
      // populate the middle section with the full chapter for navigation.
      let chapterVerses: Array<{ number: number; text: string }> | undefined;
      try {
        const versionKey = version.toLowerCase() as keyof typeof verseResults[0];
        const allChapterVerses = await BibleVerse.find({
          bookName: new RegExp(`^${exactBookName}$`, 'i'),
          chapter: reference.chapter,
        }).sort({ verse: 1 }).lean();
        chapterVerses = allChapterVerses
          .map((v) => ({
            number: v.verse,
            text: (v as any)[versionKey] || v.kjv || "",
          }))
          .filter((v) => v.number > 0 && v.text.trim().length > 0);
      } catch (chapterErr) {
        console.warn(`[searchBible] Could not fetch chapterVerses for ${exactBookName} ${reference.chapter}:`, chapterErr);
      }

      const result: BibleSearchResult = {
        book: exactBookName,
        chapter: reference.chapter,
        verses: formattedVerses,
        version: version.toUpperCase(),
        formattedReference,
        chapterVerses,
      };

      // Store in LRU cache (evict oldest if at capacity)
      if (verseCache.size >= VERSE_CACHE_MAX) {
        const firstKey = verseCache.keys().next().value;
        if (firstKey) verseCache.delete(firstKey);
      }
      verseCache.set(cacheKey, result);
      console.log(
        `📦 Cache STORE for ${cacheKey} (size: ${verseCache.size})`,
      );

      return result;
    } catch (error) {
      console.error("Bible search error:", error);
      return null;
    }
  }

  /**
   * Specifically queries the DB for the highest verse number in a given book and chapter.
   */
  static async getChapterMaxVerse(
    bookName: string,
    chapter: number,
  ): Promise<number | null> {
    try {
      const bookResult = normalizeBookName(bookName);
      const normalizedBookName = bookResult?.name || bookName;

      const highestVerse = await BibleVerse.findOne({
        bookName: new RegExp(`^${normalizedBookName}$`, 'i'),
        chapter: chapter,
      })
        .sort({ verse: -1 })
        .lean();

      return highestVerse ? highestVerse.verse : null;
    } catch (error) {
      console.error("Error fetching max verse:", error);
      return null;
    }
  }

  /**
   * Session management for context retention
   */
  static async createSpeechSession(userId: number, sessionId: string) {
    await SpeechSession.create({
      userId,
      sessionId,
      currentVersion: "kjv",
    });
  }

  static async updateSpeechSession(
    sessionId: string,
    updates: Partial<{
      currentBook: string;
      currentChapter: number;
      currentVerse: number;
      currentVersion: "kjv" | "nkjv" | "amp" | "msg" | "esv" | "niv";
      lastCommand: string;
      contextData: string;
    }>,
  ) {
    await SpeechSession.updateOne(
      { sessionId },
      { $set: updates }
    );
  }

  static async getSpeechSession(sessionId: string) {
    return await SpeechSession.findOne({ sessionId }).lean();
  }

  static async deactivateSpeechSession(sessionId: string) {
    await SpeechSession.updateOne(
      { sessionId },
      { $set: { isActive: false } }
    );
  }

  /**
   * Performance optimization: Cache frequently accessed verses
   */
  static async cacheSearchResult(
    reference: BibleReference,
    result: BibleSearchResult,
  ) {
    const queryHash = `${reference.book}-${reference.chapter}-${reference.verseStart}-${reference.verseEnd || reference.verseStart}-${reference.version}`;

    try {
      await BibleSearchCache.updateOne(
        { queryHash },
        {
          $setOnInsert: {
            bookName: reference.book,
            chapter: reference.chapter,
            verseStart: reference.verseStart,
            verseEnd: reference.verseEnd,
            version: reference.version || "kjv",
            result: JSON.stringify(result),
          }
        },
        { upsert: true }
      );
    } catch (error) {
      console.error("Cache error:", error);
    }
  }
}
