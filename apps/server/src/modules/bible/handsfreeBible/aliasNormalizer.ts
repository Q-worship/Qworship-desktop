import type { BibleBook } from "./types.js";

const BIBLE_BOOKS: BibleBook[] = [
  {
    id: 1,
    name: "Genesis",
    aliases: ["genesis", "gen", "ge"],
    testament: "old",
  },
  {
    id: 2,
    name: "Exodus",
    aliases: ["exodus", "exo", "ex", "exod"],
    testament: "old",
  },
  {
    id: 3,
    name: "Leviticus",
    // QC45: Removed 'live focus' — not a genuine phonetic alias
    aliases: ["leviticus", "lev", "le", "lv", "levitius"],
    testament: "old",
  },
  {
    id: 4,
    name: "Numbers",
    aliases: ["numbers", "num", "nu", "nm", "nombas"],
    testament: "old",
  },
  {
    id: 5,
    name: "Deuteronomy",
    aliases: [
      "deuteronomy",
      "deut",
      "deu",
      "de",
      "dt",
      "diuteronomi",
      "dotronomi",
      "duet",
    ],
    testament: "old",
  },
  {
    id: 6,
    name: "Joshua",
    aliases: ["joshua", "josh", "jos", "jsh", "joshwa", "joshua's", "yeshua"],
    testament: "old",
  },
  {
    id: 7,
    name: "Judges",
    aliases: [
      "judges",
      "judg",
      "jdg",
      "jg",
      "jdgs",
      "jojes",
      "jarges",
      "georges",
      "george's",
      "giorgis",
    ],
    testament: "old",
  },
  {
    id: 8,
    name: "Ruth",
    aliases: ["ruth", "rut", "ru", "rth", "root"],
    testament: "old",
  },
  {
    id: 9,
    name: "1 Samuel",
    aliases: [
      "1 samuel",
      "1samuel",
      "first samuel",
      "1sam",
      "1sa",
      "1 sam",
      "i samuel",
      "i sam",
    ],
    testament: "old",
  },
  {
    id: 10,
    name: "2 Samuel",
    aliases: [
      "2 samuel",
      "2samuel",
      "second samuel",
      "2sam",
      "2sa",
      "2 sam",
      "ii samuel",
      "ii sam",
    ],
    testament: "old",
  },
  {
    id: 11,
    name: "1 Kings",
    aliases: [
      "1 kings",
      "1kings",
      "first kings",
      "1ki",
      "1kgs",
      "1 ki",
      "i kings",
      "i ki",
    ],
    testament: "old",
  },
  {
    id: 12,
    name: "2 Kings",
    aliases: [
      "2 kings",
      "2kings",
      "second kings",
      "2ki",
      "2kgs",
      "2 ki",
      "ii kings",
      "ii ki",
    ],
    testament: "old",
  },
  {
    id: 13,
    name: "1 Chronicles",
    aliases: [
      "1 chronicles",
      "1chronicles",
      "first chronicles",
      "1ch",
      "1chr",
      "1 ch",
      "i chronicles",
      "i ch",
    ],
    testament: "old",
  },
  {
    id: 14,
    name: "2 Chronicles",
    aliases: [
      "2 chronicles",
      "2chronicles",
      "second chronicles",
      "2ch",
      "2chr",
      "2 ch",
      "ii chronicles",
      "ii ch",
    ],
    testament: "old",
  },
  { id: 15, name: "Ezra", aliases: ["ezra", "ezr", "ez"], testament: "old" },
  {
    id: 16,
    name: "Nehemiah",
    aliases: ["nehemiah", "neh", "ne"],
    testament: "old",
  },
  {
    id: 17,
    name: "Esther",
    aliases: ["esther", "est", "es", "esth"],
    testament: "old",
  },
  { id: 18, name: "Job", aliases: ["job", "jb", "jobe"], testament: "old" },
  {
    id: 19,
    name: "Psalms",
    aliases: [
      // QC45: Removed 'sam' — too broad, collides with Samuel abbreviation
      "psalms",
      "psalm",
      "psa",
      "ps",
      "pss",
      "psm",
      "salms",
      "samms",
      "zams",
      "psalms",
      "salm",
      "zarms",
      "psam",
    ],
    testament: "old",
  },
  {
    id: 20,
    name: "Proverbs",
    aliases: [
      "proverbs",
      "prov",
      "pro",
      "pr",
      "prv",
      "proba",
      "prova",
      "probabs",
    ],
    testament: "old",
  },
  {
    id: 21,
    name: "Ecclesiastes",
    aliases: [
      "ecclesiastes",
      "eccl",
      "ecc",
      "ec",
      "qoh",
      "ekliziastis",
      "eclesiastes",
      "eklesiastes",
    ],
    testament: "old",
  },
  {
    id: 22,
    name: "Song of Songs",
    aliases: [
      // QC45: Removed bare 'song' — too broad, matches common English word
      "song of songs",
      "song of solomon",
      "songs",
      "sos",
      "ss",
      "cant",
      "canticles",
      "songs of solomon",
      "the song of solomon",
      "song of solomons",
    ],
    testament: "old",
  },
  {
    id: 23,
    name: "Isaiah",
    aliases: [
      "isaiah",
      "isa",
      "is",
      "izaya",
      "isaya",
      "azeia",
      "isaia",
      "osaa",
    ],
    testament: "old",
  },
  {
    id: 24,
    name: "Jeremiah",
    aliases: [
      "jeremiah", "jer", "je", "jr",
      "jeremaya", "jeromia", "jeremia",
      "jeremaiah", "jerimiah", "jerimia",
      "jeramiah", "jeramia", "jeremyah",
      "jeremie", "jeremy",
    ],
    testament: "old",
  },
  {
    id: 25,
    name: "Lamentations",
    aliases: ["lamentations", "lam", "la", "lamenteshons", "laments"],
    testament: "old",
  },
  {
    id: 26,
    name: "Ezekiel",
    aliases: ["ezekiel", "ezek", "eze", "ezk", "ezikiel", "ezikiel"],
    testament: "old",
  },
  {
    id: 27,
    name: "Daniel",
    aliases: ["daniel", "dan", "da", "dn"],
    testament: "old",
  },
  {
    id: 28,
    name: "Hosea",
    aliases: ["hosea", "hos", "ho", "hozia"],
    testament: "old",
  },
  { id: 29, name: "Joel", aliases: ["joel", "jl", "joe"], testament: "old" },
  { id: 30, name: "Amos", aliases: ["amos", "amo", "am", "amos book", "the book of amos", "aimos", "aymos"], testament: "old" },
  {
    id: 31,
    name: "Obadiah",
    aliases: ["obadiah", "obad", "ob", "oba", "obadiya"],
    testament: "old",
  },
  {
    id: 32,
    name: "Jonah",
    // QC45: Removed 'jon' — too broad, also collides with John alias
    aliases: ["jonah", "jnh", "jona"],
    testament: "old",
  },
  {
    id: 33,
    name: "Micah",
    aliases: ["micah", "mic", "mi", "maika"],
    testament: "old",
  },
  { id: 34, name: "Nahum", aliases: ["nahum", "nah", "na"], testament: "old" },
  {
    id: 35,
    name: "Habakkuk",
    aliases: ["habakkuk", "hab", "hb", "habakuk"],
    testament: "old",
  },
  {
    id: 36,
    name: "Zephaniah",
    aliases: ["zephaniah", "zeph", "zep", "zp", "zefania"],
    testament: "old",
  },
  {
    id: 37,
    name: "Haggai",
    aliases: ["haggai", "hag", "hg", "hagai"],
    testament: "old",
  },
  {
    id: 38,
    name: "Zechariah",
    aliases: ["zechariah", "zech", "zec", "zc", "zekaria"],
    testament: "old",
  },
  {
    id: 39,
    name: "Malachi",
    aliases: ["malachi", "mal", "ml", "malakai"],
    testament: "old",
  },
  {
    id: 40,
    name: "Matthew",
    aliases: ["matthew", "matt", "mat", "mt", "matew", "matiu", "mathyu"],
    testament: "new",
  },
  {
    id: 41,
    name: "Mark",
    aliases: ["mark", "mrk", "mk", "mr", "mak", "mack"],
    testament: "new",
  },
  {
    id: 42,
    name: "Luke",
    // QC45: Removed 'look' — too broad, matches common English word
    aliases: ["luke", "luk", "lk", "lu"],
    testament: "new",
  },
  {
    id: 43,
    name: "John",
    aliases: ["john", "joh", "jhn", "jn", "jon"],
    testament: "new",
  },
  {
    id: 44,
    name: "Acts",
    aliases: [
      "acts",
      "act",
      "ac",
      "ax",
      "aks",
      "acts of the apostles",
      "the acts of the apostles",
      "acts of apostles",
    ],
    testament: "new",
  },
  {
    id: 45,
    name: "Romans",
    aliases: [
      // QC45: Removed 'romance' — common English word, causes false positives
      "romans", "rom", "ro", "rm",
      "romanz", "roman", "romens", "romanss",
      "romanes", "romins",
    ],
    testament: "new",
  },
  {
    id: 46,
    name: "1 Corinthians",
    aliases: [
      "1 corinthians",
      "1corinthians",
      "first corinthians",
      "1cor",
      "1co",
      "1 cor",
      "i corinthians",
      "i cor",
      "1 korintians",
      "first korintians",
    ],
    testament: "new",
  },
  {
    id: 47,
    name: "2 Corinthians",
    aliases: [
      "2 corinthians",
      "2corinthians",
      "second corinthians",
      "2cor",
      "2co",
      "2 cor",
      "ii corinthians",
      "ii cor",
      "2 korintians",
      "second korintians",
    ],
    testament: "new",
  },
  {
    id: 48,
    name: "Galatians",
    aliases: [
      "galatians", "gal", "ga",
      "galeshians", "galashians",
      "galations", "galashans", "galashions",
      "galashens", "galashins", "galacians",
      "galaceans", "galatian", "galations",
      "galaytians", "galaytions", "galeeshans",
    ],
    testament: "new",
  },
  {
    id: 49,
    name: "Ephesians",
    aliases: [
      "ephesians",
      "eph",
      "ephes",
      "efesians",
      "efishans",
      "epesians",
      "ifishans",
      "fusions",
      "infusions",
    ],
    testament: "new",
  },
  {
    id: 50,
    name: "Philippians",
    aliases: [
      "philippians",
      "phil",
      "php",
      "pp",
      "filipians",
      "phillippians",
      "philippines",
    ],
    testament: "new",
  },
  {
    id: 51,
    name: "Colossians",
    aliases: [
      "colossians", "col", "co",
      "colosians", "collossians", "colossions", "colosions",
      "colosseons", "colosseans", "colossean", "colossian",
      "kolossians", "koloshians",
    ],
    testament: "new",
  },
  {
    id: 52,
    name: "1 Thessalonians",
    aliases: [
      "1 thessalonians",
      "1thessalonians",
      "first thessalonians",
      "1thess",
      "1th",
      "1 thess",
      "i thessalonians",
      "i thess",
      "1 tesalonians",
      "first tesalonians",
    ],
    testament: "new",
  },
  {
    id: 53,
    name: "2 Thessalonians",
    aliases: [
      "2 thessalonians",
      "2thessalonians",
      "second thessalonians",
      "2thess",
      "2th",
      "2 thess",
      "ii thessalonians",
      "ii thess",
      "2 tesalonians",
      "second tesalonians",
    ],
    testament: "new",
  },
  {
    id: 54,
    name: "1 Timothy",
    aliases: [
      "1 timothy",
      "1timothy",
      "first timothy",
      "1tim",
      "1ti",
      "1 tim",
      "i timothy",
      "i tim",
      "first timoti",
      "1 timoti",
    ],
    testament: "new",
  },
  {
    id: 55,
    name: "2 Timothy",
    aliases: [
      "2 timothy",
      "2timothy",
      "second timothy",
      "2tim",
      "2ti",
      "2 tim",
      "ii timothy",
      "ii tim",
      "second timoti",
      "2 timoti",
    ],
    testament: "new",
  },
  {
    id: 56,
    name: "Titus",
    aliases: ["titus", "tit", "ti", "taitos"],
    testament: "new",
  },
  {
    id: 57,
    name: "Philemon",
    aliases: [
      "philemon",
      "philem",
      "phm",
      "pm",
      "falimon",
      "filemon",
      "philomen",
      "philamon",
    ],
    testament: "new",
  },
  {
    id: 58,
    name: "Hebrews",
    aliases: ["hebrews", "heb", "he", "hibruz", "hibrus"],
    testament: "new",
  },
  {
    id: 59,
    name: "James",
    aliases: ["james", "jas", "jm", "jam", "jems", "jemz"],
    testament: "new",
  },
  {
    id: 60,
    name: "1 Peter",
    aliases: [
      "1 peter",
      "1peter",
      "first peter",
      "1pet",
      "1pe",
      "1 pet",
      "i peter",
      "i pet",
      "1 pita",
      "first pita",
    ],
    testament: "new",
  },
  {
    id: 61,
    name: "2 Peter",
    aliases: [
      "2 peter",
      "2peter",
      "second peter",
      "2pet",
      "2pe",
      "2 pet",
      "ii peter",
      "ii pet",
      "2 pita",
      "second pita",
    ],
    testament: "new",
  },
  {
    id: 62,
    name: "1 John",
    aliases: [
      "1 john", "1john", "first john",
      "1jn", "1jo", "1 jn",
      "i john", "i jn",
      "1 jon", "first jon",
      "1st john", "one john",
      "first jon", "1 joh",
    ],
    testament: "new",
  },
  {
    id: 63,
    name: "2 John",
    aliases: [
      "2 john", "2john", "second john",
      "2jn", "2jo", "2 jn",
      "ii john", "ii jn",
      "2 jon", "second jon",
      "2nd john", "two john",
      "second jon", "2 joh",
    ],
    testament: "new",
  },
  {
    id: 64,
    name: "3 John",
    aliases: [
      "3 john", "3john", "third john",
      "3jn", "3jo", "3 jn",
      "iii john", "iii jn",
      "3 jon", "third jon",
      "3rd john", "three john",
      "third jon", "3 joh",
    ],
    testament: "new",
  },
  { id: 65, name: "Jude", aliases: ["jude", "jud", "jd"], testament: "new" },
  {
    id: 66,
    name: "Revelation",
    aliases: [
      "revelation",
      "rev",
      "re",
      "the revelation",
      "apocalypse",
      "revelations",
      "book of revelation",
      "book of revelations",
    ],
    testament: "new",
  },
];

let aliasLookupMap: Map<string, BibleBook> | null = null;
let isInitialized = false;

export function initializeAliasNormalizer(): void {
  if (isInitialized) return;

  aliasLookupMap = new Map();

  for (const book of BIBLE_BOOKS) {
    aliasLookupMap.set(book.name.toLowerCase(), book);

    for (const alias of book.aliases) {
      aliasLookupMap.set(alias.toLowerCase(), book);
    }
  }

  isInitialized = true;
  console.log(
    `✅ Alias normalizer initialized with ${aliasLookupMap.size} aliases for ${BIBLE_BOOKS.length} books`,
  );
}

export function normalizeBookName(input: string): BibleBook | null {
  if (!aliasLookupMap) {
    initializeAliasNormalizer();
  }

  const normalized = input.toLowerCase().trim();
  return aliasLookupMap?.get(normalized) || null;
}

export function getBibleBooks(): BibleBook[] {
  return BIBLE_BOOKS;
}

export function getBookById(id: number): BibleBook | undefined {
  return BIBLE_BOOKS.find((book) => book.id === id);
}

export function getBookByName(name: string): BibleBook | undefined {
  return BIBLE_BOOKS.find(
    (book) => book.name.toLowerCase() === name.toLowerCase(),
  );
}
