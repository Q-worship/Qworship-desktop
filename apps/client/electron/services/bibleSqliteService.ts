import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

type BetterSqlite3Database = {
  prepare: (sql: string) => {
    all: (...params: unknown[]) => unknown[];
  };
  close: () => void;
};

type BetterSqlite3Constructor = new (
  filename: string,
  options?: { readonly?: boolean; fileMustExist?: boolean },
) => BetterSqlite3Database;

function uniquePaths(paths: string[]) {
  return Array.from(new Set(paths));
}

function isPackagedAsarPath(candidate: string) {
  const normalized = candidate.replace(/\\/g, '/').toLowerCase();
  return normalized.includes('.asar/') && !normalized.includes('.asar.unpacked/');
}

function getCandidateDbPaths(publicPath?: string) {
  const resourcesPath = process.resourcesPath || '';
  const execDir = path.dirname(process.execPath || '');
  const cwd = process.cwd() || '';
  const publicRoot = publicPath || cwd;

  const candidates = uniquePaths([
    path.join(resourcesPath, 'data', 'bibles', 'bible.db'),
    path.join(resourcesPath, 'dist', 'data', 'bibles', 'bible.db'),
    path.join(resourcesPath, 'app.asar.unpacked', 'dist', 'data', 'bibles', 'bible.db'),
    path.join(resourcesPath, 'app.asar.unpacked', 'public', 'data', 'bibles', 'bible.db'),
    path.join(execDir, 'resources', 'data', 'bibles', 'bible.db'),
    path.join(execDir, 'resources', 'dist', 'data', 'bibles', 'bible.db'),
    path.join(execDir, 'resources', 'app.asar.unpacked', 'dist', 'data', 'bibles', 'bible.db'),
    path.join(publicRoot, 'data', 'bibles', 'bible.db'),
    path.join(publicRoot, 'public', 'data', 'bibles', 'bible.db'),
    path.join(publicRoot, 'dist', 'data', 'bibles', 'bible.db'),
    path.join(cwd, 'public', 'data', 'bibles', 'bible.db'),
    path.join(cwd, 'dist', 'data', 'bibles', 'bible.db'),
  ]).filter(Boolean);

  return candidates.filter((candidate) => !isPackagedAsarPath(candidate));
}

function loadBetterSqlite3(): BetterSqlite3Constructor {
  return require('better-sqlite3') as BetterSqlite3Constructor;
}

export class BibleSQLiteService {
  private db: BetterSqlite3Database | null = null;
  private isLoaded = false;
  private resolvedDbPath: string | null = null;

  constructor() {}

  async initialize(publicPath: string): Promise<boolean> {
    try {
      const Database = loadBetterSqlite3();
      const candidatePaths = getCandidateDbPaths(publicPath);
      const dbPath = candidatePaths.find((candidate) => fs.existsSync(candidate));

      console.log('[BibleSQLite] Candidate database paths:', candidatePaths);

      if (!dbPath) {
        console.warn('[BibleSQLite] SQLite database not found. Checked paths:', candidatePaths);
        return false;
      }

      this.db = new Database(dbPath, { readonly: true, fileMustExist: true });
      this.resolvedDbPath = dbPath;
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
          AND COALESCE(TRIM(text), '') <> ''
        ORDER BY number ASC
      `);

      return stmt.all(version.toLowerCase(), book, chapter);
    } catch (err) {
      console.error(`[BibleSQLite] Failed to query chapter ${version} ${book} ${chapter} from ${this.resolvedDbPath ?? 'unknown path'}:`, err);
      return null;
    }
  }

  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.isLoaded = false;
      this.resolvedDbPath = null;
    }
  }
}
