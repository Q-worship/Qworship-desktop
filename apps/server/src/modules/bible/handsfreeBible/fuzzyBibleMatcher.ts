import Fuse from "fuse.js";
import type { BibleBook, FuzzyMatchResult } from "./types.js";
import { getBibleBooks, normalizeBookName } from "./aliasNormalizer.js";

import { wordsToNumbers } from "words-to-numbers";

let fuseInstance: Fuse<{ searchKey: string; book: BibleBook }> | null = null;
let isInitialized = false;

export function initializeFuzzyMatcher(): void {
  if (isInitialized) return;

  const books = getBibleBooks();

  const searchItems: { searchKey: string; book: BibleBook }[] = [];

  for (const book of books) {
    searchItems.push({ searchKey: book.name, book });

    for (const alias of book.aliases) {
      searchItems.push({ searchKey: alias, book });
    }
  }

  fuseInstance = new Fuse(searchItems, {
    keys: ["searchKey"],
    threshold: 0.35, // Tightened from 0.5 — lower = stricter (0=exact, 1=anything).
    // 0.35 still forgives phonetic variations (e.g. "Efesians"→"Ephesians")
    // without matching common English words as book names.
    includeScore: true,
    ignoreLocation: true,
    minMatchCharLength: 2,
  });

  isInitialized = true;
  console.log(
    `✅ Fuzzy matcher initialized with ${searchItems.length} search terms`,
  );
}

export function fuzzyMatchBook(input: string): FuzzyMatchResult | null {
  const exactMatch = normalizeBookName(input);
  if (exactMatch) {
    return { book: exactMatch, score: 1.0 };
  }

  if (!fuseInstance) {
    initializeFuzzyMatcher();
  }

  const normalized = input.toLowerCase().trim();
  const results = fuseInstance?.search(normalized);

  if (results && results.length > 0) {
    const best = results[0];
    const score = 1 - (best.score || 0);

    if (score > 0.5) {
      return { book: best.item.book, score };
    }
  }

  return null;
}

export function extractBookFromCommand(command: string): {
  book: BibleBook | null;
  remainingText: string;
} {
  let normalized = command.toLowerCase().trim();

  // Strip filler words to improve matching
  const fillerWords = [
    /open to\s+/g,
    /turn to\s+/g,
    /read\s+/g,
    /go to\s+/g,
    /the book of\s+/g,
    /book of\s+/g,
    /chapter\s+\d+/g, // We will re-extract this later, but for book matching it gets in the way
  ];

  let cleanedForBookSearch = normalized;
  for (const filler of fillerWords) {
    cleanedForBookSearch = cleanedForBookSearch.replace(filler, "");
  }
  cleanedForBookSearch = cleanedForBookSearch.trim();

  const numberedBookPatterns = [
    /^(first|1st|one|1)\s+(samuel|kings|chronicles|corinthians|thessalonians|timothy|peter|john)/i,
    /^(second|2nd|two|2)\s+(samuel|kings|chronicles|corinthians|thessalonians|timothy|peter|john)/i,
    /^(third|3rd|three|3)\s+(john)/i,
  ];

  for (const pattern of numberedBookPatterns) {
    const match = normalized.match(pattern);
    if (match) {
      const fullMatch = match[0];
      const ordinal = match[1].toLowerCase();
      const bookName = match[2].toLowerCase();

      let number = "1";
      if (["second", "2nd", "two", "2"].includes(ordinal)) number = "2";
      if (["third", "3rd", "three", "3"].includes(ordinal)) number = "3";

      const searchName = `${number} ${bookName}`;
      const book = normalizeBookName(searchName);

      if (book) {
        const remaining = normalized.slice(fullMatch.length).trim();
        return { book, remainingText: remaining };
      }
    }
  }

  const books = getBibleBooks();
  const sortedBooks = [...books].sort((a, b) => b.name.length - a.name.length);

  for (const book of sortedBooks) {
    const bookLower = book.name.toLowerCase();
    if (cleanedForBookSearch.startsWith(bookLower)) {
      // Find where the book name ends in the *original* normalized string
      // Note: this is a slight approximation if fillers were scattered, but usually fillers prefix the book.
      const matchIndex = normalized.indexOf(bookLower);
      const endOfBookIdx = matchIndex + bookLower.length;
      const remaining = normalized.slice(endOfBookIdx).trim();
      return { book, remainingText: remaining };
    }

    for (const alias of book.aliases) {
      const aliasLower = alias.toLowerCase();
      if (
        cleanedForBookSearch.startsWith(aliasLower + " ") ||
        cleanedForBookSearch === aliasLower
      ) {
        const matchIndex = normalized.indexOf(aliasLower);
        const endOfAliasIdx = matchIndex + aliasLower.length;
        const remaining = normalized.slice(endOfAliasIdx).trim();
        return { book, remainingText: remaining };
      }
    }
  }

  const words = cleanedForBookSearch.split(/\s+/);
  for (let i = Math.min(3, words.length); i >= 1; i--) {
    const potentialBook = words.slice(0, i).join(" ");
    const fuzzyResult = fuzzyMatchBook(potentialBook);

    if (fuzzyResult && fuzzyResult.score > 0.7) {
      // Re-find the remaining string from the original `normalized`
      const matchedString = fuzzyResult.book.name.toLowerCase(); // approximation
      return { book: fuzzyResult.book, remainingText: normalized }; // Returning full normalized as fallback; parser will extract numbers.
    }
  }

  return { book: null, remainingText: command };
}

export function parseChapterVerse(
  text: string,
): { chapter: number; verseStart: number; verseEnd?: number } | null {
  let normalizedText = text.toLowerCase().trim();

  // Strip trailing quotes or prose that comes after the verse numbers
  // This prevents "3:16: for god so loved..." from confusing the number extractors
  const proseIndex = normalizedText.search(/[:.,]?[-\s]*["'‘“]/);
  if (proseIndex > -1) {
    normalizedText = normalizedText.substring(0, proseIndex).trim();
  } else {
    // Also try to strip if there's a clear boundary like "3:16 says..."
    normalizedText = normalizedText.replace(/\b(?:says|reads|which is|and it goes)\b.*$/i, "").trim();
  }

  const patterns = [
    // chapter X verse Y to Z (e.g., "chapter 3 and verse 16")
    /^chapter\s+(\d+)(?:[,:\s]+(?:and\s+)?(?:verse\s+)?)(\d+)(?:\s*(?:to|through|-|and)\s*(\d+))?/i,
    // X : Y - Z (e.g., "3:16-17")
    /(?:^|\s)(\d+)\s*:\s*(\d+)(?:\s*(?:to|through|-|and)\s*(\d+))?/,
    // X Y to Z (e.g., "3 16" or "3 16 to 17") - Look for pairs of numbers
    /(?:^|\s)(\d+)[,\s]+(?:and\s+)?(?:verse\s+)?(\d+)(?:\s*(?:to|through|-|and)\s*(\d+))?/,
    // verse Y of chapter X
    /(?:verse\s+)?(\d+)\s+(?:of\s+)?chapter\s+(\d+)(?:\s*(?:to|through|-|and)\s*(\d+))?/i,
    // chapter X
    /(?:^|\s)chapter\s+(\d+)/i,
    // just X (assume chapter X, verse 1)
    /^(\d+)$/,
  ];

  const matchPatterns = (inputStr: string) => {
    for (let i = 0; i < patterns.length; i++) {
      const match = inputStr.match(patterns[i]);
      if (match) {
        if (i === 3) {
          return {
            chapter: parseInt(match[2], 10),
            verseStart: parseInt(match[1], 10),
            verseEnd: match[3] ? parseInt(match[3], 10) : undefined,
          };
        } else if (match[2]) {
          return {
            chapter: parseInt(match[1], 10),
            verseStart: parseInt(match[2], 10),
            verseEnd: match[3] ? parseInt(match[3], 10) : undefined,
          };
        } else {
          return {
            chapter: parseInt(match[1], 10),
            verseStart: 1,
          };
        }
      }
    }
    return null;
  };

  // Attempt 1: Raw numbers match (this prevents wordsToNumbers from destroying "3:16")
  const rawMatch = matchPatterns(normalizedText);
  if (rawMatch && rawMatch.chapter > 0 && rawMatch.verseStart > 0) {
    return rawMatch;
  }

  // Attempt 2: Use words-to-numbers to robustly handle spoken numbers (e.g., "one hundred and nineteen")
  // Only executed if the raw matching failed to find numbers
  
  // OPTIMIZATION: Chop the string down to a maximum of 8 words. 
  // wordsToNumbers with { fuzzy: true } is exponentially complex and hangs the Node thread for 1.1s on long strings.
  const choppedText = normalizedText.split(/\s+/).slice(0, 8).join(" ");
  
  const converted = wordsToNumbers(choppedText, { fuzzy: true });
  let numericText = typeof converted === "string" ? converted : String(converted);

  // Clean up edge cases that still persist
  numericText = numericText
    .replace(/\b(one|1st)\b/g, "1")
    .replace(/\b(two|2nd)\b/g, "2")
    .replace(/\b(three|3rd)\b/g, "3")
    .replace(/\b(first)\b/g, "1")
    .replace(/\b(second)\b/g, "2")
    .replace(/\b(third)\b/g, "3");

  const fallbackMatch = matchPatterns(numericText);
  if (fallbackMatch && fallbackMatch.chapter > 0 && fallbackMatch.verseStart > 0) {
    return fallbackMatch;
  }

  return null;
}
