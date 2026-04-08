import { extractBookFromCommand, parseChapterVerse } from "./handsfreeBible/fuzzyBibleMatcher.js";
import { initializeAliasNormalizer } from "./handsfreeBible/aliasNormalizer.js";

initializeAliasNormalizer();

let normalizedText = 'john 3:16: "for god so loved the world, that he gave his only begotten son, that whosoever believeth in him should not perish, but have everlasting life."';
const { book, remainingText } = extractBookFromCommand(normalizedText);
console.log("Book:", book ? book.name : null);
console.log("Remaining text:", remainingText);
if (book) {
  const chapterVerse = parseChapterVerse(remainingText);
  console.log("ChapterVerse:", chapterVerse);
}
