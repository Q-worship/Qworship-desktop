// All 66 Bible books with chapter counts and per-chapter verse counts.
// Used by the inline Bible browser in the Live Console.

export const BIBLE_BOOKS_LCC: { name: string; chapters: number; verses: number[] }[] = [
  { name: 'Genesis', chapters: 50, verses: [31,25,24,26,32,22,24,22,29,32,32,20,18,24,21,16,27,33,38,18,34,24,20,67,34,35,46,22,35,43,55,32,20,31,29,43,36,30,23,23,57,38,34,34,28,34,31,22,33,26] },
  { name: 'Exodus', chapters: 40, verses: [22,25,22,31,23,30,25,32,35,29,10,51,22,31,27,36,16,27,25,26,36,31,33,18,40,37,21,43,46,38,18,35,23,35,35,38,29,31,43,38] },
  { name: 'Leviticus', chapters: 27, verses: [17,16,17,35,19,30,38,36,24,20,47,8,59,57,33,34,16,30,24,16,15,18,21,17,10,32,36] },
  { name: 'Numbers', chapters: 36, verses: [54,34,51,49,31,27,89,26,23,36,35,16,33,45,41,50,13,32,22,29,35,41,30,25,18,65,23,31,40,16,54,42,56,29,34,13] },
  { name: 'Deuteronomy', chapters: 34, verses: [46,37,29,49,33,25,26,20,29,22,32,32,18,29,23,22,20,22,21,20,23,30,25,22,19,19,26,68,29,20,30,52,29,12] },
  { name: 'Joshua', chapters: 24, verses: [18,24,17,24,15,27,26,35,27,43,23,24,33,15,63,10,18,28,51,9,45,34,16,33] },
  { name: 'Judges', chapters: 21, verses: [36,23,31,24,31,40,25,35,57,18,40,15,25,20,20,31,13,31,30,48,25] },
  { name: 'Ruth', chapters: 4, verses: [22,23,18,22] },
  { name: '1 Samuel', chapters: 31, verses: [28,36,21,22,12,21,17,22,27,27,15,25,23,52,35,23,58,30,24,42,15,23,29,22,44,25,12,25,11,31,13] },
  { name: '2 Samuel', chapters: 24, verses: [27,32,39,12,25,23,29,18,13,19,27,31,39,33,37,23,29,33,43,26,22,51,39,25] },
  { name: '1 Kings', chapters: 22, verses: [53,46,28,34,18,38,51,66,28,29,43,33,34,31,34,34,24,46,21,43,29,53] },
  { name: '2 Kings', chapters: 25, verses: [18,25,27,44,27,33,20,29,37,36,21,21,25,29,38,20,41,37,37,21,26,20,37,20,30] },
  { name: '1 Chronicles', chapters: 29, verses: [54,55,24,43,26,81,40,40,44,14,47,40,14,17,29,43,27,17,19,8,30,19,32,31,31,32,34,21,30] },
  { name: '2 Chronicles', chapters: 36, verses: [17,18,17,22,14,42,22,18,31,19,23,16,22,15,19,14,19,34,11,37,20,12,21,27,28,23,9,27,36,27,21,33,25,33,27,23] },
  { name: 'Ezra', chapters: 10, verses: [11,70,13,24,17,22,28,36,15,44] },
  { name: 'Nehemiah', chapters: 13, verses: [11,20,32,23,19,19,73,18,38,39,36,47,31] },
  { name: 'Esther', chapters: 10, verses: [22,28,23,31,29,41,4,22,28,18] },
  { name: 'Job', chapters: 42, verses: [22,13,26,21,27,30,21,22,35,22,20,25,28,22,35,22,16,21,29,29,34,30,17,25,6,14,23,28,25,31,40,22,33,37,16,33,24,41,30,24,34,17] },
  { name: 'Psalms', chapters: 150, verses: [6,12,8,8,12,10,17,9,20,18,7,8,6,7,5,11,15,50,14,9,13,31,6,10,22,12,14,9,11,12,24,11,22,22,28,12,40,22,13,17,13,11,5,26,17,11,9,14,20,23,19,9,6,7,23,13,11,11,17,12,8,12,11,10,13,20,7,35,36,5,24,20,28,23,10,12,20,72,13,19,16,8,18,12,13,17,7,18,52,17,16,15,5,23,11,13,12,9,9,5,8,28,22,35,45,48,43,13,31,7,10,10,9,8,18,19,2,29,176,7,8,9,4,8,5,6,5,6,8,8,3,18,3,3,21,26,9,8,24,13,10,7,12,15,21,10,20,14,9,6] },
  { name: 'Proverbs', chapters: 31, verses: [33,22,35,27,23,35,27,36,18,32,31,28,25,35,33,33,28,24,29,30,31,29,35,34,28,28,27,28,27,33,31] },
  { name: 'Ecclesiastes', chapters: 12, verses: [18,26,22,16,20,12,29,17,18,20,10,14] },
  { name: 'Song of Solomon', chapters: 8, verses: [17,17,11,16,16,13,13,14] },
  { name: 'Isaiah', chapters: 66, verses: [31,22,26,6,30,13,25,22,21,34,16,6,22,32,9,14,14,7,25,6,17,25,18,23,12,21,13,29,24,33,9,20,24,21,29,2,26,16,2,25,29,17,45,3,9,53,15,6,2,29,12,23,8,22,49,10,14,3,53,21,14,3,53,15,27,36] },
  { name: 'Jeremiah', chapters: 52, verses: [19,37,25,31,31,30,34,22,26,25,23,17,27,22,21,21,27,23,15,18,14,30,40,10,38,24,22,17,32,24,40,44,26,22,19,32,21,28,18,16,18,22,13,30,5,28,7,47,39,46,64,34] },
  { name: 'Lamentations', chapters: 5, verses: [22,22,66,22,22] },
  { name: 'Ezekiel', chapters: 48, verses: [28,10,27,17,17,14,27,18,11,22,25,28,23,23,8,63,24,32,14,49,32,31,49,27,17,21,36,26,21,26,18,32,33,31,15,38,28,23,29,49,26,20,27,31,25,24,23,35] },
  { name: 'Daniel', chapters: 12, verses: [21,49,30,37,31,28,28,27,27,21,45,13] },
  { name: 'Hosea', chapters: 14, verses: [11,23,5,19,15,11,16,14,17,15,12,14,16,9] },
  { name: 'Joel', chapters: 3, verses: [20,32,21] },
  { name: 'Amos', chapters: 9, verses: [15,16,15,13,27,14,17,14,15] },
  { name: 'Obadiah', chapters: 1, verses: [21] },
  { name: 'Jonah', chapters: 4, verses: [17,10,10,11] },
  { name: 'Micah', chapters: 7, verses: [16,13,12,13,15,16,20] },
  { name: 'Nahum', chapters: 3, verses: [15,13,19] },
  { name: 'Habakkuk', chapters: 3, verses: [17,20,19] },
  { name: 'Zephaniah', chapters: 3, verses: [18,15,20] },
  { name: 'Haggai', chapters: 2, verses: [15,23] },
  { name: 'Zechariah', chapters: 14, verses: [21,13,10,14,11,15,14,23,17,12,17,14,9,21] },
  { name: 'Malachi', chapters: 4, verses: [14,17,18,6] },
  { name: 'Matthew', chapters: 28, verses: [25,23,17,25,48,34,29,34,38,42,30,50,58,36,39,28,27,35,30,34,46,46,39,51,46,75,66,20] },
  { name: 'Mark', chapters: 16, verses: [45,28,35,41,43,56,37,38,50,52,33,44,37,72,47,20] },
  { name: 'Luke', chapters: 24, verses: [80,52,38,44,39,49,50,56,62,42,54,59,35,35,32,31,37,43,48,47,38,71,56,53] },
  { name: 'John', chapters: 21, verses: [51,25,36,54,47,71,53,59,41,42,57,50,38,31,27,33,26,40,42,31,25] },
  { name: 'Acts', chapters: 28, verses: [26,47,26,37,42,15,60,40,43,48,30,25,52,28,41,40,34,28,41,38,40,30,35,27,27,32,44,31] },
  { name: 'Romans', chapters: 16, verses: [32,29,31,25,21,23,25,39,33,21,36,21,14,23,33,27] },
  { name: '1 Corinthians', chapters: 16, verses: [31,16,23,21,13,20,40,34,29,22,25,20,29,37,54,26] },
  { name: '2 Corinthians', chapters: 13, verses: [24,17,18,18,21,18,16,24,15,18,33,21,14] },
  { name: 'Galatians', chapters: 6, verses: [24,21,29,31,26,18] },
  { name: 'Ephesians', chapters: 6, verses: [23,22,21,28,20,12] },
  { name: 'Philippians', chapters: 4, verses: [30,30,21,23] },
  { name: 'Colossians', chapters: 4, verses: [29,23,25,18] },
  { name: '1 Thessalonians', chapters: 5, verses: [10,20,13,18,28] },
  { name: '2 Thessalonians', chapters: 3, verses: [12,17,18] },
  { name: '1 Timothy', chapters: 6, verses: [20,15,16,16,25,21] },
  { name: '2 Timothy', chapters: 4, verses: [18,26,17,22] },
  { name: 'Titus', chapters: 3, verses: [16,15,15] },
  { name: 'Philemon', chapters: 1, verses: [25] },
  { name: 'Hebrews', chapters: 13, verses: [14,18,19,16,14,20,28,13,28,39,40,29,25] },
  { name: 'James', chapters: 5, verses: [27,26,18,17,20] },
  { name: '1 Peter', chapters: 5, verses: [25,25,22,19,14] },
  { name: '2 Peter', chapters: 3, verses: [21,22,18] },
  { name: '1 John', chapters: 5, verses: [10,29,24,21,21] },
  { name: '2 John', chapters: 1, verses: [13] },
  { name: '3 John', chapters: 1, verses: [14] },
  { name: 'Jude', chapters: 1, verses: [25] },
  { name: 'Revelation', chapters: 22, verses: [20,29,22,11,14,17,17,13,21,11,19,17,18,20,8,21,18,24,21,15,27,21] },
];

export type BibleVersionAvailability = 'ready' | 'pending';

export interface BibleVersionRegistryEntry {
  id: 'KJV' | 'NKJV' | 'NIV' | 'ESV' | 'AMP' | 'MSG' | 'GN';
  key: 'kjv' | 'nkjv' | 'niv' | 'esv' | 'amp' | 'msg' | 'gn';
  label: string;
  availability: BibleVersionAvailability;
  selectable: boolean;
  notes?: string;
}

export const BIBLE_VERSION_REGISTRY = [
  {
    id: 'KJV',
    key: 'kjv',
    label: 'King James Version',
    availability: 'ready',
    selectable: true,
  },
  {
    id: 'NKJV',
    key: 'nkjv',
    label: 'New King James Version',
    availability: 'ready',
    selectable: true,
  },
  {
    id: 'NIV',
    key: 'niv',
    label: 'New International Version',
    availability: 'ready',
    selectable: true,
  },
  {
    id: 'ESV',
    key: 'esv',
    label: 'English Standard Version',
    availability: 'ready',
    selectable: true,
  },
  {
    id: 'AMP',
    key: 'amp',
    label: 'Amplified Bible',
    availability: 'ready',
    selectable: true,
  },
  {
    id: 'MSG',
    key: 'msg',
    label: 'The Message',
    availability: 'ready',
    selectable: true,
  },
  {
    id: 'GN',
    key: 'gn',
    label: 'Good News Bible',
    availability: 'pending',
    selectable: false,
    notes: 'Pending licensed source delivery',
  },
] as const satisfies readonly BibleVersionRegistryEntry[];

export type BibleVersionCode = (typeof BIBLE_VERSION_REGISTRY)[number]['id'];
export type BibleVersionKey = (typeof BIBLE_VERSION_REGISTRY)[number]['key'];

export const BIBLE_VERSIONS_LCC = BIBLE_VERSION_REGISTRY.filter(
  (entry) => entry.selectable,
).map((entry) => entry.id) as BibleVersionCode[];

export const BIBLE_VERSION_KEYS_LCC = BIBLE_VERSION_REGISTRY.map(
  (entry) => entry.key,
) as BibleVersionKey[];

export const DEFAULT_BIBLE_VERSION_LCC: BibleVersionCode = 'KJV';

export const getBibleVersionRegistryEntry = (
  version: string,
): BibleVersionRegistryEntry | undefined => {
  const normalized = version.trim().toLowerCase();
  return BIBLE_VERSION_REGISTRY.find(
    (entry) => entry.id.toLowerCase() === normalized || entry.key === normalized,
  );
};

export const normalizeBibleVersionCode = (
  version: string,
): BibleVersionCode => getBibleVersionRegistryEntry(version)?.id ?? DEFAULT_BIBLE_VERSION_LCC;

export const normalizeBibleVersionKey = (
  version: string,
): BibleVersionKey => getBibleVersionRegistryEntry(version)?.key ?? DEFAULT_BIBLE_VERSION_LCC.toLowerCase() as BibleVersionKey;

export const isSelectableBibleVersion = (version: string) =>
  Boolean(getBibleVersionRegistryEntry(version)?.selectable);

export const getSelectableBibleVersionKeys = () =>
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.selectable).map((entry) => entry.key) as BibleVersionKey[];

export const getAllKnownBibleVersionKeys = () =>
  BIBLE_VERSION_REGISTRY.map((entry) => entry.key) as BibleVersionKey[];

export const getSelectableBibleVersions = () =>
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.selectable).map((entry) => entry.id) as BibleVersionCode[];

export const getPendingBibleVersions = () =>
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.availability === 'pending');

export const getBibleVersionLabel = (version: string) =>
  getBibleVersionRegistryEntry(version)?.label ?? normalizeBibleVersionCode(version);

export const isPendingBibleVersion = (version: string) =>
  getBibleVersionRegistryEntry(version)?.availability === 'pending';

export const ALL_BIBLE_VERSIONS_LCC = BIBLE_VERSION_REGISTRY.map(
  (entry) => entry.id,
) as BibleVersionCode[];

export const ALL_BIBLE_VERSION_KEYS_LCC = BIBLE_VERSION_REGISTRY.map(
  (entry) => entry.key,
) as BibleVersionKey[];

export const SELECTABLE_BIBLE_VERSIONS_LCC = getSelectableBibleVersions();
export const SELECTABLE_BIBLE_VERSION_KEYS_LCC = getSelectableBibleVersionKeys();

export const PENDING_BIBLE_VERSIONS_LCC = getPendingBibleVersions();

export const BIBLE_VERSION_OPTIONS_LCC = BIBLE_VERSION_REGISTRY.map((entry) => ({
  value: entry.id,
  key: entry.key,
  label: entry.label,
  selectable: entry.selectable,
  availability: entry.availability,
  notes: entry.notes,
}));

export const BIBLE_VERSION_SELECTABLE_OPTIONS_LCC = BIBLE_VERSION_OPTIONS_LCC.filter(
  (entry) => entry.selectable,
);

export const BIBLE_VERSION_PENDING_OPTIONS_LCC = BIBLE_VERSION_OPTIONS_LCC.filter(
  (entry) => entry.availability === 'pending',
);

export const DEFAULT_BIBLE_VERSION_KEY_LCC = normalizeBibleVersionKey(
  DEFAULT_BIBLE_VERSION_LCC,
);

export const DEFAULT_SELECTABLE_BIBLE_VERSION_LCC =
  SELECTABLE_BIBLE_VERSIONS_LCC[0] ?? DEFAULT_BIBLE_VERSION_LCC;

export const DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC =
  SELECTABLE_BIBLE_VERSION_KEYS_LCC[0] ?? DEFAULT_BIBLE_VERSION_KEY_LCC;

export const AVAILABLE_BIBLE_VERSIONS_LCC = SELECTABLE_BIBLE_VERSIONS_LCC;
export const AVAILABLE_BIBLE_VERSION_KEYS_LCC = SELECTABLE_BIBLE_VERSION_KEYS_LCC;

export const ALL_KNOWN_BIBLE_VERSIONS_LCC = ALL_BIBLE_VERSIONS_LCC;
export const ALL_KNOWN_BIBLE_VERSION_KEYS_LCC = ALL_BIBLE_VERSION_KEYS_LCC;

export const findBibleBookByName = (bookName: string) =>
  BIBLE_BOOKS_LCC.find((book) => book.name === bookName);

export const getBibleVerseCountForChapter = (bookName: string, chapter: number) =>
  findBibleBookByName(bookName)?.verses[chapter - 1] ?? 150;

export const getDefaultBibleBook = () => BIBLE_BOOKS_LCC[0];

export const getDefaultBibleReference = () => ({
  book: getDefaultBibleBook().name,
  chapter: 1,
  version: DEFAULT_SELECTABLE_BIBLE_VERSION_LCC,
});

export const getVersionKeyFromCode = (version: BibleVersionCode): BibleVersionKey =>
  normalizeBibleVersionKey(version);

export const getVersionCodeFromKey = (version: BibleVersionKey): BibleVersionCode =>
  normalizeBibleVersionCode(version);

export const isBibleVersionReady = (version: string) =>
  getBibleVersionRegistryEntry(version)?.availability === 'ready';

export const BIBLE_READY_VERSION_KEYS_LCC = BIBLE_VERSION_REGISTRY.filter(
  (entry) => entry.availability === 'ready',
).map((entry) => entry.key) as BibleVersionKey[];

export const BIBLE_READY_VERSIONS_LCC = BIBLE_VERSION_REGISTRY.filter(
  (entry) => entry.availability === 'ready',
).map((entry) => entry.id) as BibleVersionCode[];

export const BIBLE_PENDING_VERSION_KEYS_LCC = BIBLE_VERSION_REGISTRY.filter(
  (entry) => entry.availability === 'pending',
).map((entry) => entry.key) as BibleVersionKey[];

export const BIBLE_PENDING_VERSIONS_LCC = BIBLE_VERSION_REGISTRY.filter(
  (entry) => entry.availability === 'pending',
).map((entry) => entry.id) as BibleVersionCode[];

export const hasBibleVersionSource = (version: string) =>
  getBibleVersionRegistryEntry(version)?.availability === 'ready';

export const getKnownBibleVersions = () => ALL_BIBLE_VERSIONS_LCC;
export const getKnownBibleVersionKeys = () => ALL_BIBLE_VERSION_KEYS_LCC;

export const getSelectableBibleVersionOptions = () =>
  BIBLE_VERSION_SELECTABLE_OPTIONS_LCC;

export const getPendingBibleVersionOptions = () =>
  BIBLE_VERSION_PENDING_OPTIONS_LCC;

export const getReadyBibleVersionOptions = () =>
  BIBLE_VERSION_OPTIONS_LCC.filter((entry) => entry.availability === 'ready');

export const getBibleVersionAvailability = (version: string): BibleVersionAvailability =>
  getBibleVersionRegistryEntry(version)?.availability ?? 'pending';

export const isKnownBibleVersion = (version: string) =>
  Boolean(getBibleVersionRegistryEntry(version));

export const getSelectableBibleVersionOrDefault = (version?: string) => {
  if (version && isSelectableBibleVersion(version)) {
    return normalizeBibleVersionCode(version);
  }
  return DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;
};

export const getSelectableBibleVersionKeyOrDefault = (version?: string) => {
  if (version && isSelectableBibleVersion(version)) {
    return normalizeBibleVersionKey(version);
  }
  return DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;
};

export const getAllVersionLabels = () =>
  Object.fromEntries(
    BIBLE_VERSION_REGISTRY.map((entry) => [entry.id, entry.label]),
  ) as Record<BibleVersionCode, string>;

export const getAllVersionKeyLabels = () =>
  Object.fromEntries(
    BIBLE_VERSION_REGISTRY.map((entry) => [entry.key, entry.label]),
  ) as Record<BibleVersionKey, string>;

export const BIBLE_VERSION_LABELS = getAllVersionLabels();
export const BIBLE_VERSION_KEY_LABELS = getAllVersionKeyLabels();

export const BIBLE_VERSION_PENDING_NOTES = Object.fromEntries(
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.notes).map((entry) => [entry.id, entry.notes!]),
) as Partial<Record<BibleVersionCode, string>>;

export const BIBLE_VERSION_PENDING_KEY_NOTES = Object.fromEntries(
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.notes).map((entry) => [entry.key, entry.notes!]),
) as Partial<Record<BibleVersionKey, string>>;

export const getBibleVersionPendingNote = (version: string) =>
  getBibleVersionRegistryEntry(version)?.notes;

export const getBibleVersionOptionByValue = (version: string) =>
  BIBLE_VERSION_OPTIONS_LCC.find(
    (entry) => entry.value.toLowerCase() === version.trim().toLowerCase() || entry.key === version.trim().toLowerCase(),
  );

export const getSelectableBibleVersionOptionByValue = (version: string) =>
  BIBLE_VERSION_SELECTABLE_OPTIONS_LCC.find(
    (entry) => entry.value.toLowerCase() === version.trim().toLowerCase() || entry.key === version.trim().toLowerCase(),
  );

export const getDefaultBibleVersionOption = () =>
  getSelectableBibleVersionOptionByValue(DEFAULT_SELECTABLE_BIBLE_VERSION_LCC) ?? BIBLE_VERSION_SELECTABLE_OPTIONS_LCC[0];

export const BIBLE_VERSION_DEFAULT_OPTION_LCC = getDefaultBibleVersionOption();

export const getKnownBibleVersionEntries = () => BIBLE_VERSION_REGISTRY;

export const getSelectableBibleVersionEntries = () =>
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.selectable);

export const getPendingBibleVersionEntries = () =>
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.availability === 'pending');

export const getReadyBibleVersionEntries = () =>
  BIBLE_VERSION_REGISTRY.filter((entry) => entry.availability === 'ready');

export const BIBLE_SELECTABLE_VERSION_COUNT_LCC = SELECTABLE_BIBLE_VERSIONS_LCC.length;
export const BIBLE_KNOWN_VERSION_COUNT_LCC = ALL_BIBLE_VERSIONS_LCC.length;
export const BIBLE_PENDING_VERSION_COUNT_LCC = PENDING_BIBLE_VERSIONS_LCC.length;
export const BIBLE_READY_VERSION_COUNT_LCC = BIBLE_READY_VERSIONS_LCC.length;

export const getBibleVersionStatusSummary = () => ({
  known: BIBLE_KNOWN_VERSION_COUNT_LCC,
  ready: BIBLE_READY_VERSION_COUNT_LCC,
  pending: BIBLE_PENDING_VERSION_COUNT_LCC,
  selectable: BIBLE_SELECTABLE_VERSION_COUNT_LCC,
});

export const BIBLE_VERSION_STATUS_SUMMARY = getBibleVersionStatusSummary();

export type SelectableBibleVersionCode = (typeof SELECTABLE_BIBLE_VERSIONS_LCC)[number];
export type SelectableBibleVersionKey = (typeof SELECTABLE_BIBLE_VERSION_KEYS_LCC)[number];

export const ensureSelectableBibleVersion = (
  version?: string,
): SelectableBibleVersionCode =>
  getSelectableBibleVersionOrDefault(version) as SelectableBibleVersionCode;

export const ensureSelectableBibleVersionKey = (
  version?: string,
): SelectableBibleVersionKey =>
  getSelectableBibleVersionKeyOrDefault(version) as SelectableBibleVersionKey;

export const DEFAULT_INLINE_BIBLE_VERSION_LCC = DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;
export const DEFAULT_INLINE_BIBLE_VERSION_KEY_LCC = DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;

export const INLINE_BIBLE_VERSION_OPTIONS_LCC = BIBLE_VERSION_SELECTABLE_OPTIONS_LCC;
export const INLINE_ALL_BIBLE_VERSION_OPTIONS_LCC = BIBLE_VERSION_OPTIONS_LCC;

export const BIBLE_TRANSLATION_REGISTRY = BIBLE_VERSION_REGISTRY;

export const getBibleTranslationRegistry = () => BIBLE_TRANSLATION_REGISTRY;

export const getSelectableBibleTranslationRegistry = () =>
  BIBLE_TRANSLATION_REGISTRY.filter((entry) => entry.selectable);

export const getPendingBibleTranslationRegistry = () =>
  BIBLE_TRANSLATION_REGISTRY.filter((entry) => entry.availability === 'pending');

export const getReadyBibleTranslationRegistry = () =>
  BIBLE_TRANSLATION_REGISTRY.filter((entry) => entry.availability === 'ready');

export const getBibleTranslationById = (version: string) =>
  getBibleVersionRegistryEntry(version);

export const getBibleTranslationByKey = (version: string) =>
  getBibleVersionRegistryEntry(version);

export const getBibleTranslationSummary = () => BIBLE_VERSION_STATUS_SUMMARY;

export const getInlineBibleVersionOptions = () => INLINE_BIBLE_VERSION_OPTIONS_LCC;

export const getAllInlineBibleVersionOptions = () => INLINE_ALL_BIBLE_VERSION_OPTIONS_LCC;

export const getDefaultInlineBibleVersion = () => DEFAULT_INLINE_BIBLE_VERSION_LCC;

export const getDefaultInlineBibleVersionKey = () => DEFAULT_INLINE_BIBLE_VERSION_KEY_LCC;

export const getBibleModeStartupReference = () => getDefaultBibleReference();

export const getBibleRegistryNotes = () =>
  BIBLE_VERSION_PENDING_NOTES;

export const getBibleVersionRegistryNotes = () =>
  BIBLE_VERSION_PENDING_KEY_NOTES;

export const BIBLE_TRANSLATION_REGISTRY_NOTES = BIBLE_VERSION_PENDING_NOTES;

export const BIBLE_TRANSLATION_REGISTRY_KEY_NOTES = BIBLE_VERSION_PENDING_KEY_NOTES;

export const getBibleTranslationAvailability = (version: string) =>
  getBibleVersionAvailability(version);

export const getBibleTranslationLabel = (version: string) =>
  getBibleVersionLabel(version);

export const canSelectBibleTranslation = (version: string) =>
  isSelectableBibleVersion(version);

export const hasReadyBibleTranslation = (version: string) =>
  hasBibleVersionSource(version);

export const getBibleTranslationCounts = () => BIBLE_VERSION_STATUS_SUMMARY;

export const getInlineSelectableBibleVersions = () => SELECTABLE_BIBLE_VERSIONS_LCC;

export const getInlineSelectableBibleVersionKeys = () => SELECTABLE_BIBLE_VERSION_KEYS_LCC;

export const getInlineKnownBibleVersions = () => ALL_BIBLE_VERSIONS_LCC;

export const getInlineKnownBibleVersionKeys = () => ALL_BIBLE_VERSION_KEYS_LCC;

export const getInlinePendingBibleVersions = () => PENDING_BIBLE_VERSIONS_LCC;

export const getInlinePendingBibleVersionKeys = () => BIBLE_PENDING_VERSION_KEYS_LCC;

export const getInlineReadyBibleVersions = () => BIBLE_READY_VERSIONS_LCC;

export const getInlineReadyBibleVersionKeys = () => BIBLE_READY_VERSION_KEYS_LCC;

export const BIBLE_TRANSLATION_MODE_DEFAULTS = {
  selectableVersion: DEFAULT_SELECTABLE_BIBLE_VERSION_LCC,
  selectableVersionKey: DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC,
};

export const BIBLE_TRANSLATION_MODE_COUNTS = BIBLE_VERSION_STATUS_SUMMARY;

export const BIBLE_TRANSLATION_MODE_OPTIONS = INLINE_ALL_BIBLE_VERSION_OPTIONS_LCC;

export const BIBLE_TRANSLATION_MODE_SELECTABLE_OPTIONS = INLINE_BIBLE_VERSION_OPTIONS_LCC;

export const BIBLE_TRANSLATION_MODE_PENDING_OPTIONS = BIBLE_VERSION_PENDING_OPTIONS_LCC;

export const BIBLE_TRANSLATION_MODE_READY_OPTIONS = getReadyBibleVersionOptions();

export const BIBLE_TRANSLATION_DEFAULT_BOOK = getDefaultBibleBook();
export const BIBLE_TRANSLATION_DEFAULT_REFERENCE = getDefaultBibleReference();

export const BIBLE_TRANSLATION_DEFAULTS = {
  book: BIBLE_TRANSLATION_DEFAULT_BOOK,
  reference: BIBLE_TRANSLATION_DEFAULT_REFERENCE,
  version: DEFAULT_SELECTABLE_BIBLE_VERSION_LCC,
  versionKey: DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC,
};

export const getBibleTranslationDefaults = () => BIBLE_TRANSLATION_DEFAULTS;

export const getBibleTranslationRegistryCounts = () => BIBLE_VERSION_STATUS_SUMMARY;

export const getBibleTranslationRegistryPendingNotes = () =>
  BIBLE_VERSION_PENDING_NOTES;

export const getBibleTranslationRegistryPendingKeyNotes = () =>
  BIBLE_VERSION_PENDING_KEY_NOTES;

export const BIBLE_TRANSLATION_SELECTABLE_COUNT_LCC = BIBLE_SELECTABLE_VERSION_COUNT_LCC;
export const BIBLE_TRANSLATION_KNOWN_COUNT_LCC = BIBLE_KNOWN_VERSION_COUNT_LCC;
export const BIBLE_TRANSLATION_PENDING_COUNT_LCC = BIBLE_PENDING_VERSION_COUNT_LCC;
export const BIBLE_TRANSLATION_READY_COUNT_LCC = BIBLE_READY_VERSION_COUNT_LCC;

export const BIBLE_TRANSLATION_VERSION_LABELS = BIBLE_VERSION_LABELS;
export const BIBLE_TRANSLATION_VERSION_KEY_LABELS = BIBLE_VERSION_KEY_LABELS;

export const BIBLE_TRANSLATION_DEFAULT_OPTION_LCC = BIBLE_VERSION_DEFAULT_OPTION_LCC;

export const BIBLE_TRANSLATION_SELECTABLE_REGISTRY = getSelectableBibleTranslationRegistry();
export const BIBLE_TRANSLATION_READY_REGISTRY = getReadyBibleTranslationRegistry();
export const BIBLE_TRANSLATION_PENDING_REGISTRY = getPendingBibleTranslationRegistry();

export const BIBLE_TRANSLATION_STATUS_SUMMARY = BIBLE_VERSION_STATUS_SUMMARY;

export const BIBLE_TRANSLATION_HELPERS = {
  getBibleVersionRegistryEntry,
  normalizeBibleVersionCode,
  normalizeBibleVersionKey,
  isSelectableBibleVersion,
  getSelectableBibleVersions,
  getSelectableBibleVersionKeys,
  getPendingBibleVersions,
  getBibleVersionLabel,
  isPendingBibleVersion,
  getBibleVerseCountForChapter,
  getDefaultBibleReference,
  getSelectableBibleVersionOrDefault,
  getSelectableBibleVersionKeyOrDefault,
};

export const BIBLE_TRANSLATION_REGISTRY_HELPERS = BIBLE_TRANSLATION_HELPERS;

export const BIBLE_TRANSLATION_ENGINE_DEFAULT_VERSION = DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;
export const BIBLE_TRANSLATION_ENGINE_DEFAULT_VERSION_KEY = DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;

export const BIBLE_TRANSLATION_ENGINE_DEFAULT_REFERENCE = getDefaultBibleReference();

export const BIBLE_TRANSLATION_ENGINE_BOOKS = BIBLE_BOOKS_LCC;

export const BIBLE_TRANSLATION_ENGINE_BOOK_COUNT = BIBLE_BOOKS_LCC.length;

export const BIBLE_TRANSLATION_ENGINE_VERSION_COUNT = BIBLE_KNOWN_VERSION_COUNT_LCC;

export const BIBLE_TRANSLATION_ENGINE_SELECTABLE_VERSION_COUNT = BIBLE_SELECTABLE_VERSION_COUNT_LCC;

export const BIBLE_TRANSLATION_ENGINE_PENDING_VERSION_COUNT = BIBLE_PENDING_VERSION_COUNT_LCC;

export const BIBLE_TRANSLATION_ENGINE_READY_VERSION_COUNT = BIBLE_READY_VERSION_COUNT_LCC;

export const BIBLE_TRANSLATION_ENGINE_DEFAULTS = {
  version: BIBLE_TRANSLATION_ENGINE_DEFAULT_VERSION,
  versionKey: BIBLE_TRANSLATION_ENGINE_DEFAULT_VERSION_KEY,
  reference: BIBLE_TRANSLATION_ENGINE_DEFAULT_REFERENCE,
};

export const BIBLE_TRANSLATION_ENGINE_SUMMARY = BIBLE_TRANSLATION_STATUS_SUMMARY;

export const BIBLE_TRANSLATION_ENGINE_REGISTRY = BIBLE_TRANSLATION_REGISTRY;

export const BIBLE_TRANSLATION_ENGINE_SELECTABLE_REGISTRY = BIBLE_TRANSLATION_SELECTABLE_REGISTRY;

export const BIBLE_TRANSLATION_ENGINE_PENDING_REGISTRY = BIBLE_TRANSLATION_PENDING_REGISTRY;

export const BIBLE_TRANSLATION_ENGINE_READY_REGISTRY = BIBLE_TRANSLATION_READY_REGISTRY;

export const BIBLE_TRANSLATION_ENGINE_OPTIONS = BIBLE_TRANSLATION_MODE_OPTIONS;

export const BIBLE_TRANSLATION_ENGINE_SELECTABLE_OPTIONS = BIBLE_TRANSLATION_MODE_SELECTABLE_OPTIONS;

export const BIBLE_TRANSLATION_ENGINE_PENDING_OPTIONS = BIBLE_TRANSLATION_MODE_PENDING_OPTIONS;

export const BIBLE_TRANSLATION_ENGINE_READY_OPTIONS = BIBLE_TRANSLATION_MODE_READY_OPTIONS;

export const BIBLE_TRANSLATION_ENGINE_NOTES = BIBLE_TRANSLATION_REGISTRY_NOTES;

export const BIBLE_TRANSLATION_ENGINE_KEY_NOTES = BIBLE_TRANSLATION_REGISTRY_KEY_NOTES;

export const BIBLE_TRANSLATION_ENGINE_LABELS = BIBLE_TRANSLATION_VERSION_LABELS;

export const BIBLE_TRANSLATION_ENGINE_KEY_LABELS = BIBLE_TRANSLATION_VERSION_KEY_LABELS;

export const BIBLE_TRANSLATION_ENGINE_HELPERS = BIBLE_TRANSLATION_HELPERS;

export const BIBLE_TRANSLATION_ENGINE_DEFAULT_OPTION = BIBLE_TRANSLATION_DEFAULT_OPTION_LCC;

export const BIBLE_TRANSLATION_ENGINE_STARTUP_REFERENCE = getBibleModeStartupReference();

export const BIBLE_TRANSLATION_ENGINE_STARTUP_BOOK = getDefaultBibleBook();

export const BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION = DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;

export const BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION_KEY = DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;

export const BIBLE_TRANSLATION_ENGINE_STARTUP = {
  book: BIBLE_TRANSLATION_ENGINE_STARTUP_BOOK,
  version: BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION,
  versionKey: BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION_KEY,
  reference: BIBLE_TRANSLATION_ENGINE_STARTUP_REFERENCE,
};

export const BIBLE_TRANSLATION_ENGINE_CANON = {
  books: BIBLE_BOOKS_LCC,
  versions: BIBLE_TRANSLATION_REGISTRY,
};

export const BIBLE_TRANSLATION_ENGINE_METADATA = {
  counts: BIBLE_TRANSLATION_ENGINE_SUMMARY,
  labels: BIBLE_TRANSLATION_ENGINE_LABELS,
  keyLabels: BIBLE_TRANSLATION_ENGINE_KEY_LABELS,
  notes: BIBLE_TRANSLATION_ENGINE_NOTES,
  keyNotes: BIBLE_TRANSLATION_ENGINE_KEY_NOTES,
};

export const BIBLE_TRANSLATION_ENGINE = {
  registry: BIBLE_TRANSLATION_REGISTRY,
  helpers: BIBLE_TRANSLATION_ENGINE_HELPERS,
  defaults: BIBLE_TRANSLATION_ENGINE_DEFAULTS,
  startup: BIBLE_TRANSLATION_ENGINE_STARTUP,
  canon: BIBLE_TRANSLATION_ENGINE_CANON,
  metadata: BIBLE_TRANSLATION_ENGINE_METADATA,
};

export { BIBLE_TRANSLATION_ENGINE as LIVE_CONSOLE_BIBLE_TRANSLATION_ENGINE };

export const BIBLE_VERSION_REGISTRY_BY_ID = Object.fromEntries(
  BIBLE_VERSION_REGISTRY.map((entry) => [entry.id, entry]),
) as Record<BibleVersionCode, BibleVersionRegistryEntry>;

export const BIBLE_VERSION_REGISTRY_BY_KEY = Object.fromEntries(
  BIBLE_VERSION_REGISTRY.map((entry) => [entry.key, entry]),
) as Record<BibleVersionKey, BibleVersionRegistryEntry>;

export const getBibleVersionRegistryById = () => BIBLE_VERSION_REGISTRY_BY_ID;
export const getBibleVersionRegistryByKey = () => BIBLE_VERSION_REGISTRY_BY_KEY;

export const getBibleVersionRegistryMaps = () => ({
  byId: BIBLE_VERSION_REGISTRY_BY_ID,
  byKey: BIBLE_VERSION_REGISTRY_BY_KEY,
});

export const BIBLE_VERSION_REGISTRY_MAPS = getBibleVersionRegistryMaps();

export const BIBLE_VERSION_REGISTRY_DEFAULT_ID = DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;
export const BIBLE_VERSION_REGISTRY_DEFAULT_KEY = DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;

export const BIBLE_VERSION_REGISTRY_COUNTS = BIBLE_VERSION_STATUS_SUMMARY;

export const BIBLE_VERSION_REGISTRY_METADATA = {
  labels: BIBLE_VERSION_LABELS,
  keyLabels: BIBLE_VERSION_KEY_LABELS,
  notes: BIBLE_VERSION_PENDING_NOTES,
  keyNotes: BIBLE_VERSION_PENDING_KEY_NOTES,
  counts: BIBLE_VERSION_REGISTRY_COUNTS,
};

export const BIBLE_VERSION_REGISTRY_HELPERS = BIBLE_TRANSLATION_HELPERS;

export const BIBLE_VERSION_REGISTRY_DEFAULTS = {
  id: BIBLE_VERSION_REGISTRY_DEFAULT_ID,
  key: BIBLE_VERSION_REGISTRY_DEFAULT_KEY,
};

export const BIBLE_VERSION_REGISTRY_ENGINE = {
  registry: BIBLE_VERSION_REGISTRY,
  helpers: BIBLE_VERSION_REGISTRY_HELPERS,
  metadata: BIBLE_VERSION_REGISTRY_METADATA,
  defaults: BIBLE_VERSION_REGISTRY_DEFAULTS,
};

export const LIVE_CONSOLE_BIBLE_VERSION_REGISTRY = BIBLE_VERSION_REGISTRY_ENGINE;

export const BIBLE_CANON_METADATA = {
  books: BIBLE_BOOKS_LCC,
  versions: BIBLE_VERSION_REGISTRY,
};

export const getBibleCanonMetadata = () => BIBLE_CANON_METADATA;

export const BIBLE_CANON_BOOK_COUNT = BIBLE_BOOKS_LCC.length;
export const BIBLE_CANON_VERSION_COUNT = BIBLE_KNOWN_VERSION_COUNT_LCC;

export const getBibleCanonCounts = () => ({
  books: BIBLE_CANON_BOOK_COUNT,
  versions: BIBLE_CANON_VERSION_COUNT,
});

export const BIBLE_CANON_COUNTS = getBibleCanonCounts();

export const getBibleRegistryStartupSummary = () => ({
  defaultVersion: DEFAULT_SELECTABLE_BIBLE_VERSION_LCC,
  defaultVersionKey: DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC,
  defaultBook: getDefaultBibleBook().name,
});

export const BIBLE_REGISTRY_STARTUP_SUMMARY = getBibleRegistryStartupSummary();

export const LIVE_CONSOLE_BIBLE_REGISTRY = {
  canon: BIBLE_CANON_METADATA,
  registry: BIBLE_VERSION_REGISTRY,
  startup: BIBLE_REGISTRY_STARTUP_SUMMARY,
  counts: BIBLE_CANON_COUNTS,
};

export const getLiveConsoleBibleRegistry = () => LIVE_CONSOLE_BIBLE_REGISTRY;

export const getLiveConsoleBibleBooks = () => BIBLE_BOOKS_LCC;

export const getLiveConsoleBibleVersions = () => BIBLE_VERSIONS_LCC;

export const getLiveConsoleBibleVersionKeys = () => AVAILABLE_BIBLE_VERSION_KEYS_LCC;

export const getLiveConsoleKnownBibleVersions = () => ALL_KNOWN_BIBLE_VERSIONS_LCC;

export const getLiveConsoleKnownBibleVersionKeys = () => ALL_KNOWN_BIBLE_VERSION_KEYS_LCC;

export const getLiveConsolePendingBibleVersions = () => PENDING_BIBLE_VERSIONS_LCC;

export const getLiveConsolePendingBibleVersionKeys = () => BIBLE_PENDING_VERSION_KEYS_LCC;

export const getLiveConsoleReadyBibleVersions = () => BIBLE_READY_VERSIONS_LCC;

export const getLiveConsoleReadyBibleVersionKeys = () => BIBLE_READY_VERSION_KEYS_LCC;

export const getLiveConsoleBibleRegistryMetadata = () => BIBLE_VERSION_REGISTRY_METADATA;

export const getLiveConsoleBibleRegistryHelpers = () => BIBLE_TRANSLATION_HELPERS;

export const getLiveConsoleBibleDefaultVersion = () => DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;

export const getLiveConsoleBibleDefaultVersionKey = () => DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;

export const getLiveConsoleBibleDefaultReference = () => getDefaultBibleReference();

export const getLiveConsoleBibleDefaultBook = () => getDefaultBibleBook();

export const getLiveConsoleBibleDefaultBookName = () => getDefaultBibleBook().name;

export const getLiveConsoleBibleDefaultChapter = () => 1;

export const getLiveConsoleBibleDefaultReferenceLabel = () =>
  `${getDefaultBibleBook().name} 1`;

export const getLiveConsoleBibleTranslationStatusSummary = () =>
  BIBLE_VERSION_STATUS_SUMMARY;

export const getLiveConsoleBibleTranslationPendingNotes = () =>
  BIBLE_VERSION_PENDING_NOTES;

export const getLiveConsoleBibleTranslationLabels = () =>
  BIBLE_VERSION_LABELS;

export const getLiveConsoleBibleTranslationKeyLabels = () =>
  BIBLE_VERSION_KEY_LABELS;

export const getLiveConsoleBibleTranslationDefaultOption = () =>
  BIBLE_VERSION_DEFAULT_OPTION_LCC;

export const getLiveConsoleBibleTranslationRegistry = () =>
  BIBLE_TRANSLATION_REGISTRY;

export const getLiveConsoleBibleTranslationSelectableRegistry = () =>
  BIBLE_TRANSLATION_SELECTABLE_REGISTRY;

export const getLiveConsoleBibleTranslationPendingRegistry = () =>
  BIBLE_TRANSLATION_PENDING_REGISTRY;

export const getLiveConsoleBibleTranslationReadyRegistry = () =>
  BIBLE_TRANSLATION_READY_REGISTRY;

export const getLiveConsoleBibleTranslationRegistryById = () =>
  BIBLE_VERSION_REGISTRY_BY_ID;

export const getLiveConsoleBibleTranslationRegistryByKey = () =>
  BIBLE_VERSION_REGISTRY_BY_KEY;

export const getLiveConsoleBibleTranslationOptionByValue = (version: string) =>
  getBibleVersionOptionByValue(version);

export const getLiveConsoleSelectableBibleTranslationOptionByValue = (version: string) =>
  getSelectableBibleVersionOptionByValue(version);

export const getLiveConsoleBibleTranslationAvailability = (version: string) =>
  getBibleVersionAvailability(version);

export const getLiveConsoleBibleTranslationLabel = (version: string) =>
  getBibleVersionLabel(version);

export const getLiveConsoleBibleTranslationPendingNote = (version: string) =>
  getBibleVersionPendingNote(version);

export const getLiveConsoleBibleTranslationIsSelectable = (version: string) =>
  isSelectableBibleVersion(version);

export const getLiveConsoleBibleTranslationIsReady = (version: string) =>
  hasBibleVersionSource(version);

export const getLiveConsoleBibleTranslationIsPending = (version: string) =>
  isPendingBibleVersion(version);

export const getLiveConsoleBibleTranslationVersionCode = (version: string) =>
  normalizeBibleVersionCode(version);

export const getLiveConsoleBibleTranslationVersionKey = (version: string) =>
  normalizeBibleVersionKey(version);

export const getLiveConsoleBibleChapterVerseCount = (bookName: string, chapter: number) =>
  getBibleVerseCountForChapter(bookName, chapter);

export const getLiveConsoleBibleStartupReference = () =>
  getBibleModeStartupReference();

export const getLiveConsoleBibleCanonicalBooks = () =>
  BIBLE_BOOKS_LCC;

export const getLiveConsoleBibleCanonicalVersionRegistry = () =>
  BIBLE_VERSION_REGISTRY;

export const getLiveConsoleBibleCanonicalMetadata = () =>
  BIBLE_CANON_METADATA;

export const getLiveConsoleBibleCanonicalCounts = () =>
  BIBLE_CANON_COUNTS;

export const getLiveConsoleBibleRegistryCounts = () =>
  BIBLE_VERSION_REGISTRY_COUNTS;

export const getLiveConsoleBibleRegistryDefaults = () =>
  BIBLE_VERSION_REGISTRY_DEFAULTS;

export const getLiveConsoleBibleRegistryEngine = () =>
  BIBLE_VERSION_REGISTRY_ENGINE;

export const getLiveConsoleBibleTranslationEngine = () =>
  BIBLE_TRANSLATION_ENGINE;

export const getLiveConsoleBibleTranslationEngineDefaults = () =>
  BIBLE_TRANSLATION_ENGINE_DEFAULTS;

export const getLiveConsoleBibleTranslationEngineSummary = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineMetadata = () =>
  BIBLE_TRANSLATION_ENGINE_METADATA;

export const getLiveConsoleBibleTranslationEngineHelpers = () =>
  BIBLE_TRANSLATION_ENGINE_HELPERS;

export const getLiveConsoleBibleTranslationEngineStartup = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP;

export const getLiveConsoleBibleTranslationEngineOptions = () =>
  BIBLE_TRANSLATION_ENGINE_OPTIONS;

export const getLiveConsoleBibleTranslationEngineSelectableOptions = () =>
  BIBLE_TRANSLATION_ENGINE_SELECTABLE_OPTIONS;

export const getLiveConsoleBibleTranslationEnginePendingOptions = () =>
  BIBLE_TRANSLATION_ENGINE_PENDING_OPTIONS;

export const getLiveConsoleBibleTranslationEngineReadyOptions = () =>
  BIBLE_TRANSLATION_ENGINE_READY_OPTIONS;

export const getLiveConsoleBibleTranslationEngineNotes = () =>
  BIBLE_TRANSLATION_ENGINE_NOTES;

export const getLiveConsoleBibleTranslationEngineKeyNotes = () =>
  BIBLE_TRANSLATION_ENGINE_KEY_NOTES;

export const getLiveConsoleBibleTranslationEngineLabels = () =>
  BIBLE_TRANSLATION_ENGINE_LABELS;

export const getLiveConsoleBibleTranslationEngineKeyLabels = () =>
  BIBLE_TRANSLATION_ENGINE_KEY_LABELS;

export const getLiveConsoleBibleTranslationEngineDefaultOption = () =>
  BIBLE_TRANSLATION_ENGINE_DEFAULT_OPTION;

export const getLiveConsoleBibleTranslationEngineStartupReference = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_REFERENCE;

export const getLiveConsoleBibleTranslationEngineStartupBook = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_BOOK;

export const getLiveConsoleBibleTranslationEngineStartupVersion = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION;

export const getLiveConsoleBibleTranslationEngineStartupVersionKey = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION_KEY;

export const getLiveConsoleBibleTranslationEngineCanon = () =>
  BIBLE_TRANSLATION_ENGINE_CANON;

export const getLiveConsoleBibleTranslationEngineRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_REGISTRY;

export const getLiveConsoleBibleTranslationEngineSelectableRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_SELECTABLE_REGISTRY;

export const getLiveConsoleBibleTranslationEnginePendingRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_PENDING_REGISTRY;

export const getLiveConsoleBibleTranslationEngineReadyRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_READY_REGISTRY;

export const getLiveConsoleBibleTranslationEngineBookCount = () =>
  BIBLE_TRANSLATION_ENGINE_BOOK_COUNT;

export const getLiveConsoleBibleTranslationEngineVersionCount = () =>
  BIBLE_TRANSLATION_ENGINE_VERSION_COUNT;

export const getLiveConsoleBibleTranslationEngineSelectableVersionCount = () =>
  BIBLE_TRANSLATION_ENGINE_SELECTABLE_VERSION_COUNT;

export const getLiveConsoleBibleTranslationEnginePendingVersionCount = () =>
  BIBLE_TRANSLATION_ENGINE_PENDING_VERSION_COUNT;

export const getLiveConsoleBibleTranslationEngineReadyVersionCount = () =>
  BIBLE_TRANSLATION_ENGINE_READY_VERSION_COUNT;

export const getLiveConsoleBibleTranslationEngineCounts = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineDefaultsSummary = () =>
  BIBLE_TRANSLATION_ENGINE_DEFAULTS;

export const getLiveConsoleBibleTranslationEngineStatusSummary = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineStatusNotes = () =>
  BIBLE_TRANSLATION_ENGINE_NOTES;

export const getLiveConsoleBibleTranslationEngineStatusKeyNotes = () =>
  BIBLE_TRANSLATION_ENGINE_KEY_NOTES;

export const getLiveConsoleBibleTranslationEngineCanonicalBooks = () =>
  BIBLE_TRANSLATION_ENGINE_BOOKS;

export const getLiveConsoleBibleTranslationEngineCanonicalRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_REGISTRY;

export const getLiveConsoleBibleTranslationEngineCanonicalMetadata = () =>
  BIBLE_TRANSLATION_ENGINE_METADATA;

export const getLiveConsoleBibleTranslationEngineCanonicalSummary = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineDefaultSelection = () =>
  BIBLE_TRANSLATION_ENGINE_DEFAULT_OPTION;

export const getLiveConsoleBibleTranslationEngineSelectableSelection = () =>
  INLINE_BIBLE_VERSION_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEngineKnownSelection = () =>
  INLINE_ALL_BIBLE_VERSION_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEnginePendingSelection = () =>
  BIBLE_TRANSLATION_ENGINE_PENDING_OPTIONS;

export const getLiveConsoleBibleTranslationEngineReadySelection = () =>
  BIBLE_TRANSLATION_ENGINE_READY_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentDefaults = () =>
  BIBLE_TRANSLATION_DEFAULTS;

export const getLiveConsoleBibleTranslationEngineCurrentMetadata = () =>
  BIBLE_TRANSLATION_ENGINE_METADATA;

export const getLiveConsoleBibleTranslationEngineCurrentHelpers = () =>
  BIBLE_TRANSLATION_ENGINE_HELPERS;

export const getLiveConsoleBibleTranslationEngineCurrentSummary = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_REGISTRY;

export const getLiveConsoleBibleTranslationEngineCurrentOptions = () =>
  BIBLE_TRANSLATION_ENGINE_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentSelectableOptions = () =>
  BIBLE_TRANSLATION_ENGINE_SELECTABLE_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentPendingOptions = () =>
  BIBLE_TRANSLATION_ENGINE_PENDING_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentReadyOptions = () =>
  BIBLE_TRANSLATION_ENGINE_READY_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentLabels = () =>
  BIBLE_TRANSLATION_ENGINE_LABELS;

export const getLiveConsoleBibleTranslationEngineCurrentKeyLabels = () =>
  BIBLE_TRANSLATION_ENGINE_KEY_LABELS;

export const getLiveConsoleBibleTranslationEngineCurrentNotes = () =>
  BIBLE_TRANSLATION_ENGINE_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentKeyNotes = () =>
  BIBLE_TRANSLATION_ENGINE_KEY_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentCounts = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentDefaultsSummary = () =>
  BIBLE_TRANSLATION_ENGINE_DEFAULTS;

export const getLiveConsoleBibleTranslationEngineCurrentStatusSummary = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentStatusNotes = () =>
  BIBLE_TRANSLATION_ENGINE_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentStatusKeyNotes = () =>
  BIBLE_TRANSLATION_ENGINE_KEY_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentCanonicalBooks = () =>
  BIBLE_TRANSLATION_ENGINE_BOOKS;

export const getLiveConsoleBibleTranslationEngineCurrentCanonicalRegistry = () =>
  BIBLE_TRANSLATION_ENGINE_REGISTRY;

export const getLiveConsoleBibleTranslationEngineCurrentCanonicalMetadata = () =>
  BIBLE_TRANSLATION_ENGINE_METADATA;

export const getLiveConsoleBibleTranslationEngineCurrentCanonicalSummary = () =>
  BIBLE_TRANSLATION_ENGINE_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentDefaultSelection = () =>
  BIBLE_TRANSLATION_ENGINE_DEFAULT_OPTION;

export const getLiveConsoleBibleTranslationEngineCurrentSelectableSelection = () =>
  INLINE_BIBLE_VERSION_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentKnownSelection = () =>
  INLINE_ALL_BIBLE_VERSION_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentPendingSelection = () =>
  BIBLE_TRANSLATION_ENGINE_PENDING_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentReadySelection = () =>
  BIBLE_TRANSLATION_ENGINE_READY_OPTIONS;

export const getLiveConsoleBibleTranslationEngineCurrentStartupReference = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_REFERENCE;

export const getLiveConsoleBibleTranslationEngineCurrentStartupBook = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_BOOK;

export const getLiveConsoleBibleTranslationEngineCurrentStartupVersion = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION;

export const getLiveConsoleBibleTranslationEngineCurrentStartupVersionKey = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP_VERSION_KEY;

export const getLiveConsoleBibleTranslationEngineCurrentStartup = () =>
  BIBLE_TRANSLATION_ENGINE_STARTUP;

export const getLiveConsoleBibleTranslationEngineCurrentCanon = () =>
  BIBLE_TRANSLATION_ENGINE_CANON;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryById = () =>
  BIBLE_VERSION_REGISTRY_BY_ID;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryByKey = () =>
  BIBLE_VERSION_REGISTRY_BY_KEY;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryMaps = () =>
  BIBLE_VERSION_REGISTRY_MAPS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaults = () =>
  BIBLE_VERSION_REGISTRY_DEFAULTS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryMetadata = () =>
  BIBLE_VERSION_REGISTRY_METADATA;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryCounts = () =>
  BIBLE_VERSION_REGISTRY_COUNTS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryEngine = () =>
  BIBLE_VERSION_REGISTRY_ENGINE;

export const getLiveConsoleBibleTranslationEngineCurrentRegistrySummary = () =>
  BIBLE_VERSION_STATUS_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryNotesMap = () =>
  BIBLE_VERSION_PENDING_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryKeyNotesMap = () =>
  BIBLE_VERSION_PENDING_KEY_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryHelpers = () =>
  BIBLE_TRANSLATION_HELPERS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryStartupSummary = () =>
  BIBLE_REGISTRY_STARTUP_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryCanonCounts = () =>
  BIBLE_CANON_COUNTS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryCanonMetadata = () =>
  BIBLE_CANON_METADATA;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryCanon = () =>
  LIVE_CONSOLE_BIBLE_REGISTRY;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultSelection = () =>
  BIBLE_VERSION_DEFAULT_OPTION_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistrySelectableOptions = () =>
  BIBLE_VERSION_SELECTABLE_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryOptions = () =>
  BIBLE_VERSION_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryPendingOptions = () =>
  BIBLE_VERSION_PENDING_OPTIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryReadyOptions = () =>
  getReadyBibleVersionOptions();

export const getLiveConsoleBibleTranslationEngineCurrentRegistrySelectableVersions = () =>
  SELECTABLE_BIBLE_VERSIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistrySelectableVersionKeys = () =>
  SELECTABLE_BIBLE_VERSION_KEYS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryKnownVersions = () =>
  ALL_BIBLE_VERSIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryKnownVersionKeys = () =>
  ALL_BIBLE_VERSION_KEYS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryPendingVersions = () =>
  PENDING_BIBLE_VERSIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryPendingVersionKeys = () =>
  BIBLE_PENDING_VERSION_KEYS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryReadyVersions = () =>
  BIBLE_READY_VERSIONS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryReadyVersionKeys = () =>
  BIBLE_READY_VERSION_KEYS_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultVersion = () =>
  DEFAULT_SELECTABLE_BIBLE_VERSION_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultVersionKey = () =>
  DEFAULT_SELECTABLE_BIBLE_VERSION_KEY_LCC;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultReference = () =>
  getDefaultBibleReference();

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultBook = () =>
  getDefaultBibleBook();

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultBookName = () =>
  getDefaultBibleBook().name;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultChapter = () =>
  1;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultReferenceLabel = () =>
  `${getDefaultBibleBook().name} 1`;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryStatusSummary = () =>
  BIBLE_VERSION_STATUS_SUMMARY;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryStatusNotes = () =>
  BIBLE_VERSION_PENDING_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryStatusKeyNotes = () =>
  BIBLE_VERSION_PENDING_KEY_NOTES;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryLabels = () =>
  BIBLE_VERSION_LABELS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryKeyLabels = () =>
  BIBLE_VERSION_KEY_LABELS;

export const getLiveConsoleBibleTranslationEngineCurrentRegistryDefaultOption = () =>
  BIBLE_VERSION_DEFAULT_OPTION_LCC;
