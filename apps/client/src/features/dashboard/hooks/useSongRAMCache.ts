import { create } from 'zustand';
import { db } from '../../../lib/db';

interface SongDictionary {
  [songId: string]: any;
}

interface SongRAMCacheStore {
  isBooted: boolean;
  isBooting: boolean;
  dictionary: SongDictionary;
  songList: any[];

  loadFromDisk: () => Promise<void>;
  search: (query: string) => any[];
  invalidate: (song: any) => Promise<void>;
}

export const useSongRAMCache = create<SongRAMCacheStore>((set, get) => ({
  isBooted: false,
  isBooting: false,
  dictionary: {},
  songList: [],

  loadFromDisk: async () => {
    if (get().isBooted || get().isBooting) return;
    
    set({ isBooting: true });
    try {
      console.log("⚡ [RAM Cache] Booting Songs 0ms Dictionary...");
      const startTime = performance.now();
      
      const allSongs = await db.songs.toArray();
      
      const dict: SongDictionary = {};
      for (const s of allSongs) {
        dict[s.songId || s._id || s.id] = s;
      }

      const endTime = performance.now();
      console.log(`⚡ [RAM Cache] Successfully mapped ${allSongs.length} songs into active memory in ${(endTime - startTime).toFixed(2)}ms`);
      
      set({ dictionary: dict, songList: allSongs, isBooted: true, isBooting: false });
    } catch (e) {
      console.error("[RAM Cache] Failed to bootstrap songs off disk:", e);
      set({ isBooting: false });
    }
  },

  search: (query: string) => {
    const list = get().songList;
    if (!query || !query.trim()) return [];
    
    const term = query.toLowerCase().trim();
    // Fast O(N) array scan
    return list.filter(song => 
      (song.title && song.title.toLowerCase().includes(term)) ||
      (song.lyrics && song.lyrics.toLowerCase().includes(term)) ||
      (song.tags && Array.isArray(song.tags) && song.tags.some((t: string) => t.toLowerCase().includes(term)))
    ).slice(0, 50); // cap results to 50 for max speed
  },

  // Called when a song is saved online so the cache stays perfectly synched
  invalidate: async (song: any) => {
    const sId = song.songId || song._id || song.id;
    if (!sId) return;

    // 1. Update IndexedDB permanently
    const existing = await db.songs.where('songId').equals(sId).first();
    if (existing && existing.id) {
       await db.songs.update(existing.id, song);
    } else {
       await db.songs.put({ ...song, songId: sId });
    }

    // 2. Update RAM Array Cache
    const dict = { ...get().dictionary, [sId]: song };
    const list = Object.values(dict);
    set({ dictionary: dict, songList: list });
  }
}));
