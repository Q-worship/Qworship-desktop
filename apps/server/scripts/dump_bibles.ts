import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Mongoose schema definition
const BibleVerseSchema = new mongoose.Schema({
  bookName: { type: String, required: true },
  testament: { type: String, enum: ['old', 'new'], required: true },
  chapter: { type: Number, required: true },
  verse: { type: Number, required: true },
  kjv: String,
  nkjv: String,
  amp: String,
  msg: String,
  esv: String,
  niv: String,
});
const BibleVerse = mongoose.model('BibleVerse', BibleVerseSchema);

const MONGODB_URI = "mongodb+srv://kayyadams360_db_user:V4e9BhRfLKHL12h4@qworship.bki11v4.mongodb.net/";

async function dumpBibles() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    const versions = ['kjv', 'nkjv', 'amp', 'msg', 'esv', 'niv'];
    const outputDir = path.join(process.cwd(), '../client/public/data/bibles');
    
    // Ensure directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    for (const version of versions) {
      console.log(`Extracting ${version}...`);
      
      // Fetch only the relevant version column to save RAM/Time
      const verses = await BibleVerse.find({}, {
         bookName: 1, 
         chapter: 1, 
         verse: 1, 
         [version]: 1, 
         _id: 0 
      }).lean();

      const payload = verses.map((v: any) => ({
        book: v.bookName,
        chapter: v.chapter,
        verse: v.verse,
        text: v[version] || '',
      }));

      const outputFile = path.join(outputDir, `${version}.json`);
      fs.writeFileSync(outputFile, JSON.stringify(payload));
      console.log(`Saved ${payload.length} verses to ${outputFile} (${(fs.statSync(outputFile).size / 1024 / 1024).toFixed(2)} MB)`);
    }

    console.log("All extractions completed successfully.");
    process.exit(0);
  } catch (err) {
    console.error("Extraction failed:", err);
    process.exit(1);
  }
}

dumpBibles();
