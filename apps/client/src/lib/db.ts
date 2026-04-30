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

export interface OfflinePresentation {
  id: number | string; // Numeric for db. UUID string for un-synced.
  name: string;
  description: string;
  presentationDate: string;
  createdAt?: string;
  updatedAt?: string;
  slideCount?: number;
  status?: string;
  serviceData?: string | null;
  syncPending: number; // 0 or 1 for Dexie indexing boolean equivalent
}

export interface LocalBackgroundMedia {
  id: string;
  title: string;
  fileName: string;
  fileType: "IMAGE" | "VIDEO";
  mimeType: string;
  fileSize: number;
  createdAt: string;
  updatedAt: string;
  blob: Blob;
}

const db = new Dexie("QworshipLocalDB") as Dexie & {
  verses: EntityTable<BibleVerse, "id">;
  syncState: EntityTable<SyncState, "version">;
  songs: EntityTable<any, "id">;
  presentations: EntityTable<OfflinePresentation, "id">;
  localBackgroundMedia: EntityTable<LocalBackgroundMedia, "id">;
};

// Schema declaration:
// [version+book+chapter] index allows for blazing fast full-chapter fetching
// [version+book+chapter+verse] index allows immediate single verse lookup
// Force index rebuild by bumping version to 5 to add local background media persistence.
db.version(5).stores({
  verses:
    "++id, version, book, chapter, [version+book], [version+book+chapter], [version+book+chapter+verse]",
  syncState: "version",
  songs: "++id, songId, title, [title+lyrics]",
  presentations: "id, syncPending, updatedAt",
  localBackgroundMedia: "id, fileType, updatedAt, createdAt",
});

export { db };
