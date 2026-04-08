import Dexie, { type EntityTable } from "dexie";

export interface BibleVerse {
  id?: number;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

export interface SyncState {
  version: string;
  syncedAt: number;
  status: "downloading" | "synced" | "error";
  totalVerses?: number;
}

const db = new Dexie("QworshipLocalDB") as Dexie & {
  verses: EntityTable<BibleVerse, "id">;
  syncState: EntityTable<SyncState, "version">;
  songs: EntityTable<any, "id">;
};

// Schema declaration:
// [version+book+chapter] index allows for blazing fast full-chapter fetching
// [version+book+chapter+verse] index allows immediate single verse lookup
// Force index rebuild by bumping version to 3 (browsers with v1/v2 will automatically upgrade)
db.version(3).stores({
  verses:
    "++id, version, book, chapter, [version+book], [version+book+chapter], [version+book+chapter+verse]",
  syncState: "version",
  songs: "++id, songId, title, [title+lyrics]",
});

export { db };
