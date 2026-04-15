import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const biblesDir = path.join(process.cwd(), 'public', 'data', 'bibles');
const dbPath = path.join(biblesDir, 'bible.db');

async function buildDb() {
  if (fs.existsSync(dbPath)) {
    console.log(`[SQLite Build] Found existing bible.db at ${dbPath}, deleting...`);
    fs.unlinkSync(dbPath);
  }

  const db = new Database(dbPath);
  
  // Performance pragmas for bulk insert
  db.pragma('journal_mode = OFF');
  db.pragma('synchronous = 0');
  db.pragma('cache_size = 1000000');
  db.pragma('locking_mode = EXCLUSIVE');

  console.log('[SQLite Build] Creating verses table...');
  db.exec(`
    CREATE TABLE verses (
      version TEXT,
      book TEXT,
      chapter INTEGER,
      number INTEGER,
      text TEXT
    );
  `);

  const insert = db.prepare('INSERT INTO verses (version, book, chapter, number, text) VALUES (?, ?, ?, ?, ?)');
  const versions = ['kjv', 'nkjv', 'niv', 'esv', 'amp', 'msg', 'gn'];
  
  db.transaction(() => {
    for (const v of versions) {
      const jsonPath = path.join(biblesDir, `${v}.json`);
      if (fs.existsSync(jsonPath)) {
        console.log(`[SQLite Build] Parsing ${v}.json...`);
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
        
        console.log(`[SQLite Build] Inserting ${data.length} verses for ${v.toUpperCase()}...`);
        for (const verse of data) {
          // Adjust to actual JSON fields if needed, handling both {number} and {verse} keys
          const num = verse.verse || verse.number;
          insert.run(v, verse.book, verse.chapter, num, verse.text);
        }
      } else {
        console.warn(`[SQLite Build] Warning: ${v}.json not found at ${jsonPath}`);
      }
    }
  })();

  console.log('[SQLite Build] Creating indexes for fast lookup (this might take a second)...');
  db.exec(`
    CREATE INDEX idx_verses_lookup ON verses(version, book, chapter);
  `);

  db.close();
  console.log(`[SQLite Build] Success! Database built at ${dbPath}`);
}

buildDb().catch(console.error);
