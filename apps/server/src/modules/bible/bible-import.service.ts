import fs from "fs";
import { BibleVerse } from "./bible.model.js";

export class BibleImportService {
  /**
   * Universal importer that replaces over 15 redundant scripts
   * (fastBibleImport, fullBibleImport, quickBibleImport, robustBibleImport, etc.)
   */
  static async importBibleJSON(filePath: string, versionKey: string) {
    if (!["kjv", "nkjv", "amp", "msg", "esv", "niv"].includes(versionKey)) {
      throw new Error(`Unsupported version: ${versionKey}`);
    }

    console.log(
      `Starting optimized import for ${versionKey.toUpperCase()} from ${filePath}`,
    );
    const rawData = fs.readFileSync(filePath, "utf-8");
    const bibleData = JSON.parse(rawData);

    const operations: any[] = [];

    // Book 1-39 is Old Testament, 40-66 is New Testament
    let bookIndex = 0;

    for (const book of bibleData.books) {
      bookIndex++;
      const testament = bookIndex <= 39 ? "old" : "new";

      for (const chapter of book.chapters) {
        // Extract chapter number from format "GEN.1" -> 1
        const chapterParts = chapter.chapter_usfm.split(".");
        const chapterNum = parseInt(chapterParts[chapterParts.length - 1], 10);

        for (const item of chapter.items) {
          if (
            item.type === "verse" &&
            item.verse_numbers &&
            item.verse_numbers.length > 0
          ) {
            const verseNum = item.verse_numbers[0];
            const text = item.lines.join(" ");

            // Upsert operation to merge different translations into the same document organically
            operations.push({
              updateOne: {
                filter: {
                  bookName: book.name,
                  chapter: chapterNum,
                  verse: verseNum,
                },
                update: {
                  $set: {
                    bookName: book.name,
                    testament,
                    chapter: chapterNum,
                    verse: verseNum,
                    [versionKey]: text,
                  },
                },
                upsert: true,
              },
            });
          }
        }
      }
    }

    // Execute in batches of 5000 to optimize memory and speed
    const batchSize = 5000;
    for (let i = 0; i < operations.length; i += batchSize) {
      const batch = operations.slice(i, i + batchSize);
      await BibleVerse.bulkWrite(batch, { ordered: false });
      console.log(
        `Imported ${i + batch.length} / ${operations.length} verses for ${versionKey}`,
      );
    }

    console.log(
      `Successfully completed import for ${versionKey.toUpperCase()}`,
    );
  }
}
