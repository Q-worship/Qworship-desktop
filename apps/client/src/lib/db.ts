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

export interface MediaAsset {
  id: number | string;
  type: string;
  source: 'cloud' | 'user';
  name: string;
  fileUrl?: string;       // local qworship-media:// path if downloaded
  thumbnailUrl?: string;  // local qworship-media:// path if downloaded
  originalUrl?: string;   // cloud url for downloading
  syncPending: number;
  downloadStatus: 'pending' | 'downloading' | 'completed' | 'error';
  createdAt?: string;
  metadata?: any;
}

export interface OfflineAnnouncement {
  id: number | string;
  title: string;
  content: string;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  type?: string;
  syncPending: number;
  updatedAt?: string;
}

export interface ActionQueueItem {
  id?: number;
  action: string;
  payload: any;
  timestamp: number;
}

const db = new Dexie("QworshipLocalDB") as Dexie & {
  verses: EntityTable<BibleVerse, "id">;
  syncState: EntityTable<SyncState, "version">;
  songs: EntityTable<any, "id">;
  presentations: EntityTable<OfflinePresentation, "id">;
  mediaAssets: EntityTable<MediaAsset, "id">;
  announcements: EntityTable<OfflineAnnouncement, "id">;
  userProfile: EntityTable<any, "id">;
  actionQueue: EntityTable<ActionQueueItem, "id">;
};

// Schema declaration:
// [version+book+chapter] index allows for blazing fast full-chapter fetching
// [version+book+chapter+verse] index allows immediate single verse lookup
// Force index rebuild by bumping version to 5 (browsers with v1/v2/v3/v4 will automatically upgrade)
db.version(5).stores({
  verses:
    "++id, version, book, chapter, [version+book], [version+book+chapter], [version+book+chapter+verse]",
  syncState: "version",
  songs: "++id, songId, title, [title+lyrics]",
  presentations: "id, syncPending, updatedAt",
  // New tables for full offline support
  mediaAssets: "id, type, source, syncPending, createdAt, downloadStatus",
  announcements: "id, syncPending, updatedAt",
  userProfile: "id", // Store user preferences and auth state
  actionQueue: "++id, action, timestamp" // For offline mutations (e.g., delete song)
});

export { db };
