import fs from 'node:fs';
import path from 'node:path';
import { app } from 'electron';

// Dynamically require better-sqlite3 from the unpacked directory in production
// This prevents Electron from extracting the .node file to a /tmp directory,
// which gets blocked by macOS Hardened Runtime/Gatekeeper.
const getSqliteModule = () => {
  if (app.isPackaged) {
    const fs = require('fs');
    const possiblePaths = [
      path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3'),
      path.join(process.resourcesPath, 'app.asar.unpacked', 'apps', 'client', 'node_modules', 'better-sqlite3')
    ];
    const unpackedPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
    return require(unpackedPath);
  }
  return require('better-sqlite3');
};

export class BibleSQLiteService {
  private db: any | null = null;
  public isLoaded = false;

  constructor() {}

  async initialize(publicPath: string) {
    const desktopLog = path.join(require('os').homedir(), 'Desktop', 'qworship_sqlite_debug.log');
    const log = (msg: string) => {
      try { require('fs').appendFileSync(desktopLog, new Date().toISOString() + ': ' + msg + '\n'); } catch (e) {}
      console.log(msg);
    };

    try {
      if (this.isLoaded) return true;

      log(`[BibleSQLite] Initializing database from ${publicPath}...`);
      let dbPath = path.join(publicPath, 'data', 'bibles', 'bible.db');
      
      // better-sqlite3 uses native C++ bindings which cannot read inside Electron's virtual .asar archive.
      // We must explicitly point it to the unpacked version of the file on the real filesystem.
      if (dbPath.includes('app.asar') && !dbPath.includes('app.asar.unpacked')) {
        dbPath = dbPath.replace('app.asar', 'app.asar.unpacked');
      }
      
      log(`[BibleSQLite] Resolved dbPath: ${dbPath}`);

      if (!fs.existsSync(dbPath)) {
        log(`[BibleSQLite] SQLite database not found at ${dbPath}. Falling back to RAM cache.`);
        return false;
      }

      log(`[BibleSQLite] SQLite File exists at ${dbPath}. Instantiating Database via mapped native library...`);
      const DatabaseModule = getSqliteModule();
      this.db = new DatabaseModule(dbPath, { readonly: true });
      this.isLoaded = true;
      log("[BibleSQLite] Successfully established connection to local database.");
      return true;
    } catch (error: any) {
      log(`[BibleSQLite] Failed to load offline database: ${error.message}\n${error.stack}`);
      return false;
    }
  }

  getChapter(version: string, book: string, chapter: number) {
    const desktopLog = path.join(require('os').homedir(), 'Desktop', 'qworship_sqlite_debug.log');
    const log = (msg: string) => { try { require('fs').appendFileSync(desktopLog, new Date().toISOString() + ': ' + msg + '\n'); } catch (e) {} console.log(msg); };

    if (!this.isLoaded || !this.db) {
      log(`[BibleSQLite] getChapter failed: not loaded (isLoaded: ${this.isLoaded}, db: ${!!this.db})`);
      return null;
    }

    try {
      log(`[BibleSQLite] Querying: version=${version}, book=${book}, chapter=${chapter}`);
      const stmt = this.db.prepare(`
        SELECT number, text 
        FROM verses 
        WHERE version = ? AND book = ? AND chapter = ?
        ORDER BY number ASC
      `);
      
      const results = stmt.all(version.toLowerCase(), book, chapter);
      log(`[BibleSQLite] Query returned ${results.length} verses.`);
      return results;
    } catch (error: any) {
      log(`[BibleSQLite] Failed to query chapter ${version} ${book} ${chapter}: ${error.message}`);
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
