import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

export class BibleSQLiteService {
  private db: Database.Database | null = null;
  private isLoaded = false;

  constructor() {}

  async initialize(publicPath: string): Promise<boolean> {
    try {
      const dbPath = path.join(publicPath, 'data', 'bibles', 'bible.db');
      
      if (!fs.existsSync(dbPath)) {
        console.warn(`[BibleSQLite] SQLite database not found at ${dbPath}. Falling back to RAM cache.`);
        return false;
      }
      
      // Open in read-only mode for maximum performance and safety
      this.db = new Database(dbPath, { readonly: true });
      this.isLoaded = true;
      console.log(`[BibleSQLite] Initialized successfully from ${dbPath}`);
      return true;
    } catch (err) {
      console.error('[BibleSQLite] Initialization failed:', err);
      return false;
    }
  }

  getChapter(version: string, book: string, chapter: number) {
    if (!this.isLoaded || !this.db) return null;
    
    try {
      const stmt = this.db.prepare(`
        SELECT number, text 
        FROM verses 
        WHERE version = ? AND book = ? AND chapter = ?
        ORDER BY number ASC
      `);
      
      return stmt.all(version.toLowerCase(), book, chapter);
    } catch (err) {
      console.error(`[BibleSQLite] Failed to query chapter ${version} ${book} ${chapter}:`, err);
      return null;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isLoaded = false;
    }
  }
}
