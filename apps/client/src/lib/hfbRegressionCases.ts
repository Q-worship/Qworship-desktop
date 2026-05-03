export type HfbRegressionExpected =
  | {
      type: "lookup";
      book: string;
      chapter: number;
      verseStart: number;
      verseEnd?: number;
      version?: string;
    }
  | {
      type: "version_change";
      version: string;
    }
  | {
      type: "navigation";
      commandType: "verse_change" | "chapter_change" | "jump_to_verse";
      direction?: "next" | "previous";
      targetVerse?: number;
    }
  | {
      type: "unclear";
    };

export interface HfbRegressionCase {
  input: string;
  expected: HfbRegressionExpected;
  note?: string;
}

const ALL_BOOK_LOOKUP_CASES: HfbRegressionCase[] = [
  ["Genesis", 1, 1],
  ["Exodus", 1, 1],
  ["Leviticus", 1, 1],
  ["Numbers", 1, 1],
  ["Deuteronomy", 1, 1],
  ["Joshua", 1, 1],
  ["Judges", 1, 1],
  ["Ruth", 1, 1],
  ["1 Samuel", 1, 1],
  ["2 Samuel", 1, 1],
  ["1 Kings", 1, 1],
  ["2 Kings", 1, 1],
  ["1 Chronicles", 1, 1],
  ["2 Chronicles", 1, 1],
  ["Ezra", 1, 1],
  ["Nehemiah", 1, 1],
  ["Esther", 1, 1],
  ["Job", 1, 1],
  ["Psalms", 1, 1],
  ["Proverbs", 1, 1],
  ["Ecclesiastes", 1, 1],
  ["Song of Solomon", 1, 1],
  ["Isaiah", 1, 1],
  ["Jeremiah", 1, 1],
  ["Lamentations", 1, 1],
  ["Ezekiel", 1, 1],
  ["Daniel", 1, 1],
  ["Hosea", 1, 1],
  ["Joel", 1, 1],
  ["Amos", 1, 1],
  ["Obadiah", 1, 1],
  ["Jonah", 1, 1],
  ["Micah", 1, 1],
  ["Nahum", 1, 1],
  ["Habakkuk", 1, 1],
  ["Zephaniah", 1, 1],
  ["Haggai", 1, 1],
  ["Zechariah", 1, 1],
  ["Malachi", 1, 1],
  ["Matthew", 1, 1],
  ["Mark", 1, 1],
  ["Luke", 1, 1],
  ["John", 1, 1],
  ["Acts", 1, 1],
  ["Romans", 1, 1],
  ["1 Corinthians", 1, 1],
  ["2 Corinthians", 1, 1],
  ["Galatians", 1, 1],
  ["Ephesians", 1, 1],
  ["Philippians", 1, 1],
  ["Colossians", 1, 1],
  ["1 Thessalonians", 1, 1],
  ["2 Thessalonians", 1, 1],
  ["1 Timothy", 1, 1],
  ["2 Timothy", 1, 1],
  ["Titus", 1, 1],
  ["Philemon", 1, 1],
  ["Hebrews", 1, 1],
  ["James", 1, 1],
  ["1 Peter", 1, 1],
  ["2 Peter", 1, 1],
  ["1 John", 1, 1],
  ["2 John", 1, 1],
  ["3 John", 1, 1],
  ["Jude", 1, 1],
  ["Revelation", 1, 1],
].map(([book, chapter, verseStart]) => ({
  input: `show me ${book} chapter ${chapter} verse ${verseStart}`,
  expected: {
    type: "lookup",
    book,
    chapter,
    verseStart,
  },
  note: `Canonical ${book} lookup should resolve correctly in the expanded 66-book benchmark.`,
}));

const NUMBERED_BOOK_CASES: HfbRegressionCase[] = [
  {
    input: "show me First Samuel chapter 3 verse 10",
    expected: { type: "lookup", book: "1 Samuel", chapter: 3, verseStart: 10 },
  },
  {
    input: "show me Second Samuel chapter 22 verse 2",
    expected: { type: "lookup", book: "2 Samuel", chapter: 22, verseStart: 2 },
  },
  {
    input: "show me First Kings chapter 8 verse 23",
    expected: { type: "lookup", book: "1 Kings", chapter: 8, verseStart: 23 },
  },
  {
    input: "show me Second Kings chapter 6 verse 17",
    expected: { type: "lookup", book: "2 Kings", chapter: 6, verseStart: 17 },
  },
  {
    input: "show me First Chronicles chapter 16 verse 11",
    expected: { type: "lookup", book: "1 Chronicles", chapter: 16, verseStart: 11 },
  },
  {
    input: "show me Second Chronicles chapter 7 verse 14",
    expected: { type: "lookup", book: "2 Chronicles", chapter: 7, verseStart: 14 },
  },
  {
    input: "show me First Corinthians chapter 13 verse 4",
    expected: { type: "lookup", book: "1 Corinthians", chapter: 13, verseStart: 4 },
  },
  {
    input: "show me Second Corinthians chapter 5 verse 7",
    expected: { type: "lookup", book: "2 Corinthians", chapter: 5, verseStart: 7 },
  },
  {
    input: "show me First Thessalonians chapter 5 verse 16",
    expected: { type: "lookup", book: "1 Thessalonians", chapter: 5, verseStart: 16 },
  },
  {
    input: "show me Second Thessalonians chapter 3 verse 3",
    expected: { type: "lookup", book: "2 Thessalonians", chapter: 3, verseStart: 3 },
  },
  {
    input: "show me First Timothy chapter 1 verse 7",
    expected: { type: "lookup", book: "1 Timothy", chapter: 1, verseStart: 7 },
  },
  {
    input: "show me Second Timothy chapter 1 verse 7",
    expected: { type: "lookup", book: "2 Timothy", chapter: 1, verseStart: 7 },
  },
  {
    input: "show me First Peter chapter 5 verse 7",
    expected: { type: "lookup", book: "1 Peter", chapter: 5, verseStart: 7 },
  },
  {
    input: "show me Second Peter chapter 3 verse 9",
    expected: { type: "lookup", book: "2 Peter", chapter: 3, verseStart: 9 },
  },
  {
    input: "show me First John chapter 4 verse 8",
    expected: { type: "lookup", book: "1 John", chapter: 4, verseStart: 8 },
  },
  {
    input: "show me Second John chapter 1 verse 6",
    expected: { type: "lookup", book: "2 John", chapter: 1, verseStart: 6 },
  },
  {
    input: "show me Third John chapter 1 verse 2",
    expected: { type: "lookup", book: "3 John", chapter: 1, verseStart: 2 },
  },
];

const LIVE_FAILURE_RECOVERY_CASES: HfbRegressionCase[] = [
  {
    input: "show me Romans chapter 2 verse 4",
    expected: { type: "lookup", book: "Romans", chapter: 2, verseStart: 4 },
  },
  {
    input: "show me Second Samuel chapter 1 verse 3",
    expected: { type: "lookup", book: "2 Samuel", chapter: 1, verseStart: 3 },
  },
  {
    input: "show me Leviticus chapter 2 verse 3",
    expected: { type: "lookup", book: "Leviticus", chapter: 2, verseStart: 3 },
  },
  {
    input: "show me Ruth chapter 2 verse 3",
    expected: { type: "lookup", book: "Ruth", chapter: 2, verseStart: 3 },
  },
  {
    input: "show me Song of Songs chapter 2 verse 1",
    expected: { type: "lookup", book: "Song of Solomon", chapter: 2, verseStart: 1 },
  },
  {
    input: "show me Obadia chapter 1 verse 1",
    expected: { type: "lookup", book: "Obadiah", chapter: 1, verseStart: 1 },
  },
  {
    input: "show me Habbakkuk chapter 2 verse 3",
    expected: { type: "lookup", book: "Habakkuk", chapter: 2, verseStart: 3 },
  },
  {
    input: "show me Zachariah chapter 3 verse 1",
    expected: { type: "lookup", book: "Zechariah", chapter: 3, verseStart: 1 },
  },
  {
    input: "show me Malachia chapter 1 verse 2",
    expected: { type: "lookup", book: "Malachi", chapter: 1, verseStart: 2 },
  },
  {
    input: "show me Philippians chapter 1 verse 1",
    expected: { type: "lookup", book: "Philippians", chapter: 1, verseStart: 1 },
  },
  {
    input: "show me Colossians chapter 2 verse 3",
    expected: { type: "lookup", book: "Colossians", chapter: 2, verseStart: 3 },
  },
  {
    input: "show me Third John chapter 1 verse 1",
    expected: { type: "lookup", book: "3 John", chapter: 1, verseStart: 1 },
  },
  {
    input: "show me Romans chapter 8 verse to",
    expected: { type: "lookup", book: "Romans", chapter: 8, verseStart: 2 },
    note: "Live offline transcripts sometimes emit the homophone 'to' instead of digit 2 for the verse slot.",
  },
  {
    input: "show me Numbers chapter 3 verse to",
    expected: { type: "lookup", book: "Numbers", chapter: 3, verseStart: 2 },
  },
  {
    input: "show me Leviticus chapter to verse to",
    expected: { type: "lookup", book: "Leviticus", chapter: 2, verseStart: 2 },
  },
  {
    input: "show me Deuteronomy chapter to verse to",
    expected: { type: "lookup", book: "Deuteronomy", chapter: 2, verseStart: 2 },
  },
  {
    input: "show me Psalms 23 verse to",
    expected: { type: "lookup", book: "Psalms", chapter: 23, verseStart: 2 },
  },
  {
    input: "show me Jude chapter 2 verse 1",
    expected: { type: "unclear" },
    note: "Invalid references in one-chapter books must be rejected instead of being auto-shifted to 1:1.",
  },
];

const MISPRONUNCIATION_CASES: HfbRegressionCase[] = [
  {
    input: "show me Mathew chapter 7 verse 7",
    expected: { type: "lookup", book: "Matthew", chapter: 7, verseStart: 7 },
  },
  {
    input: "show me look chapter 15 verse 11",
    expected: { type: "lookup", book: "Luke", chapter: 15, verseStart: 11 },
  },
  {
    input: "show me romen chapter 8 verse 1",
    expected: { type: "lookup", book: "Romans", chapter: 8, verseStart: 1 },
  },
  {
    input: "show me filipino chapter 4 verse 13",
    expected: { type: "lookup", book: "Philippians", chapter: 4, verseStart: 13 },
  },
  {
    input: "show me exedus chapter 14 verse 14",
    expected: { type: "lookup", book: "Exodus", chapter: 14, verseStart: 14 },
  },
  {
    input: "show me deuteronamy chapter 6 verse 4",
    expected: { type: "lookup", book: "Deuteronomy", chapter: 6, verseStart: 4 },
  },
  {
    input: "show me revelations chapter 3 verse 20",
    expected: { type: "lookup", book: "Revelation", chapter: 3, verseStart: 20 },
  },
  {
    input: "show me jennesis chapter 1 verse 1",
    expected: { type: "lookup", book: "Genesis", chapter: 1, verseStart: 1 },
  },
  {
    input: "show me salms chapter 23 verse 1",
    expected: { type: "lookup", book: "Psalms", chapter: 23, verseStart: 1 },
  },
];

const VERSION_SWITCH_CASES: HfbRegressionCase[] = [
  { input: "show me the KJV", expected: { type: "version_change", version: "kjv" } },
  { input: "show me the NKJV", expected: { type: "version_change", version: "nkjv" } },
  { input: "show me the NIV", expected: { type: "version_change", version: "niv" } },
  { input: "show me the ESV", expected: { type: "version_change", version: "esv" } },
  { input: "show me the amplified bible", expected: { type: "version_change", version: "amp" } },
  { input: "show me the message", expected: { type: "version_change", version: "msg" } },
  { input: "show me the good news bible", expected: { type: "version_change", version: "gn" } },
  { input: "switch to king james version", expected: { type: "version_change", version: "kjv" } },
  { input: "change to english standard version", expected: { type: "version_change", version: "esv" } },
  { input: "use new international version", expected: { type: "version_change", version: "niv" } },
];

const NAVIGATION_CASES: HfbRegressionCase[] = [
  {
    input: "next verse",
    expected: { type: "navigation", commandType: "verse_change", direction: "next" },
  },
  {
    input: "previous verse",
    expected: { type: "navigation", commandType: "verse_change", direction: "previous" },
  },
  {
    input: "go back",
    expected: { type: "navigation", commandType: "verse_change", direction: "previous" },
  },
  {
    input: "continue",
    expected: { type: "navigation", commandType: "verse_change", direction: "next" },
  },
  {
    input: "next chapter",
    expected: { type: "navigation", commandType: "chapter_change", direction: "next" },
  },
  {
    input: "previous chapter",
    expected: { type: "navigation", commandType: "chapter_change", direction: "previous" },
  },
  {
    input: "jump to verse 12",
    expected: { type: "navigation", commandType: "jump_to_verse", targetVerse: 12 },
  },
  {
    input: "show verse 9",
    expected: { type: "navigation", commandType: "jump_to_verse", targetVerse: 9 },
  },
];

const NUMERIC_AMBIGUITY_CASES: HfbRegressionCase[] = [
  {
    input: "show me Luke chapter twenty three verse sixteen",
    expected: { type: "lookup", book: "Luke", chapter: 23, verseStart: 16 },
    note: "Compound spoken chapter and verse numbers should collapse into the correct two-slot reference.",
  },
  {
    input: "show me Luke chapter twenty three sixteen",
    expected: { type: "lookup", book: "Luke", chapter: 23, verseStart: 16 },
    note: "Chapter-cued compact references must treat the second numeric slot as the verse even when the word verse is omitted.",
  },
  {
    input: "show me Luke twenty three sixteen",
    expected: { type: "lookup", book: "Luke", chapter: 23, verseStart: 16 },
    note: "Compact spoken references with compound numbers should resolve without collapsing into a single malformed number.",
  },
  {
    input: "show me Psalm twenty three verse one",
    expected: { type: "lookup", book: "Psalms", chapter: 23, verseStart: 1 },
    note: "Numbers that appear before the verse cue must remain chapter numbers after the book name is resolved.",
  },
  {
    input: "show me Psalm one hundred nineteen verse one hundred five",
    expected: { type: "lookup", book: "Psalms", chapter: 119, verseStart: 105 },
    note: "Large compound spoken numbers should resolve correctly in explicit chapter and verse positions.",
  },
  {
    input: "show me Psalm one hundred nineteen one hundred five",
    expected: { type: "lookup", book: "Psalms", chapter: 119, verseStart: 105 },
    note: "Compact spoken references should still parse when both chapter and verse use multi-token number phrases.",
  },
  {
    input: "show me First John one one",
    expected: { type: "lookup", book: "1 John", chapter: 1, verseStart: 1 },
    note: "Repeated numbers must remain book ordinal, chapter, and verse in the correct order.",
  },
  {
    input: "show me 1st John 1 1",
    expected: { type: "lookup", book: "1 John", chapter: 1, verseStart: 1 },
    note: "Ordinal suffixes should normalize into numbered-book prefixes instead of becoming chapter numbers.",
  },
  {
    input: "show me Second Kings chapter one verse two",
    expected: { type: "lookup", book: "2 Kings", chapter: 1, verseStart: 2 },
    note: "Numbered books with word-based chapter and verse values should keep the book ordinal separate from the reference slots.",
  },
  {
    input: "show me 2nd Kings 1 2",
    expected: { type: "lookup", book: "2 Kings", chapter: 1, verseStart: 2 },
    note: "Ordinal suffix shorthand for numbered books should work in compact digit references.",
  },
  {
    input: "show me First Corinthians thirteen four",
    expected: { type: "lookup", book: "1 Corinthians", chapter: 13, verseStart: 4 },
    note: "Numbered New Testament books should support compact spoken references with chapter and verse supplied as words.",
  },
];

const COMPACT_AND_RANGE_CASES: HfbRegressionCase[] = [
  {
    input: "show me John 3 16",
    expected: { type: "lookup", book: "John", chapter: 3, verseStart: 16 },
  },
  {
    input: "show me 1 John 4 8",
    expected: { type: "lookup", book: "1 John", chapter: 4, verseStart: 8 },
  },
  {
    input: "show me John chapter 3 verse 16 through 18",
    expected: { type: "lookup", book: "John", chapter: 3, verseStart: 16, verseEnd: 18 },
  },
  {
    input: "show me psalm 23 verse 1",
    expected: { type: "lookup", book: "Psalms", chapter: 23, verseStart: 1 },
  },
  {
    input: "bring me Romans chapter 8 verse 28",
    expected: { type: "lookup", book: "Romans", chapter: 8, verseStart: 28 },
  },
  {
    input: "open Exodus chapter 14 verse 14",
    expected: { type: "lookup", book: "Exodus", chapter: 14, verseStart: 14 },
  },
];

const REJECTION_CASES: HfbRegressionCase[] = [
  {
    input: "play amazing grace",
    expected: { type: "unclear" },
    note: "Song workflow language must not project a Bible verse.",
  },
  {
    input: "how are you today",
    expected: { type: "unclear" },
    note: "General conversation must be rejected.",
  },
  {
    input: "bonjour mon ami",
    expected: { type: "unclear" },
    note: "Non-English transcript should fail the Bible-transcript gate.",
  },
  {
    input: "project the welcome slide",
    expected: { type: "unclear" },
    note: "Presentation control text must not become scripture.",
  },
  {
    input: "microphone check one two",
    expected: { type: "unclear" },
    note: "Audio check chatter must not resolve into a verse.",
  },
];

/**
 * Category C — CGE confidence-gating cases.
 *
 * These are transcripts that are structurally complete (book + chapter + verse)
 * but were produced from live sessions where the wrong verse was projected.
 * The CGE must assign a confidence score that routes them to the Confidence
 * Queue (0.65–0.87) rather than auto-projecting them.
 *
 * NOTE: These cases are intentionally NOT added to HFB_REGRESSION_CASES because
 * they are not parseVoiceCommand() correctness tests — they are CGE routing
 * tests. They are kept here for documentation and future CGE unit test coverage.
 */
export const CGE_ROUTING_CASES: HfbRegressionCase[] = [
  {
    input: "ecclesiastes chapter 2 verse 1",
    expected: { type: "lookup", book: "Ecclesiastes", chapter: 2, verseStart: 1 },
    note: "Category C: Vosk sometimes emits 'ecclesiastes chapter 2 verse 1' but projects 1:1 due to premature utterance boundary. CGE must gate this.",
  },
  {
    input: "ecclesiastes chapter 1 verse 8",
    expected: { type: "lookup", book: "Ecclesiastes", chapter: 1, verseStart: 8 },
    note: "Category C: Vosk sometimes emits 'exodus chapter 1 verse 8' for this. CGE must gate borderline book scores.",
  },
  {
    input: "malachi chapter 2 verse 1",
    expected: { type: "lookup", book: "Malachi", chapter: 2, verseStart: 1 },
    note: "Category C: Vosk emits 'mark chapter 2 verse 1' for this. CGE must gate when book confidence is borderline.",
  },
  {
    input: "malachi chapter 1 verse 25",
    expected: { type: "lookup", book: "Malachi", chapter: 1, verseStart: 25 },
    note: "Category C: Vosk emits 'mark chapter 1 verse 25' for this. CGE must gate when book confidence is borderline.",
  },
  {
    input: "nahum chapter 3 verse 2",
    expected: { type: "lookup", book: "Nahum", chapter: 3, verseStart: 2 },
    note: "Category C: Vosk emits 'luke chapter 3 verse 2' for this. CGE must gate when book confidence is borderline.",
  },
  {
    input: "nahum chapter 1 verse 4",
    expected: { type: "lookup", book: "Nahum", chapter: 1, verseStart: 4 },
    note: "Category C: Vosk emits 'luke chapter 1 verse 4' for this. CGE must gate when book confidence is borderline.",
  },
  // QC9 — Collision group cases (queue_multi routing)
  {
    input: "zechariah chapter 3 verse 3",
    expected: { type: "lookup", book: "Zechariah", chapter: 3, verseStart: 3 },
    note: "QC9 collision group: Vosk emits 'jeremiah chapter 3 verse 3'. CGE must route to queue_multi with Zechariah, Jeremiah, Zephaniah candidates.",
  },
  {
    input: "zechariah chapter 2 verse 5",
    expected: { type: "lookup", book: "Zechariah", chapter: 2, verseStart: 5 },
    note: "QC9 collision group: Zechariah 2:5 — Zephaniah has only 3 chapters so Zephaniah candidate is valid; Jeremiah has 52 chapters so Jeremiah candidate is valid.",
  },
  {
    input: "malachi chapter 3 verse 10",
    expected: { type: "lookup", book: "Malachi", chapter: 3, verseStart: 10 },
    note: "QC9 collision group: Vosk emits 'mark chapter 3 verse 10' or 'micah chapter 3 verse 10'. CGE must route to queue_multi with Malachi, Mark, Micah candidates.",
  },
  {
    input: "philippians chapter 2 verse 4",
    expected: { type: "lookup", book: "Philippians", chapter: 2, verseStart: 4 },
    note: "QC9 collision group: Vosk emits 'philippians chapter 1 verse 1' or 'philemon chapter 2 verse 4'. Philemon has only 1 chapter so Philemon candidate is filtered out for chapter >= 2.",
  },
];

export const HFB_REGRESSION_CASES: HfbRegressionCase[] = [
  ...ALL_BOOK_LOOKUP_CASES,
  ...NUMBERED_BOOK_CASES,
  ...LIVE_FAILURE_RECOVERY_CASES,
  ...MISPRONUNCIATION_CASES,
  ...NUMERIC_AMBIGUITY_CASES,
  ...VERSION_SWITCH_CASES,
  ...NAVIGATION_CASES,
  ...COMPACT_AND_RANGE_CASES,
  ...REJECTION_CASES,
];
