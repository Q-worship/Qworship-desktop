import { useState, useCallback, useEffect } from "react";
import { db } from "../lib/db";
import { apiRequest } from "../lib/queryClient";
import { useSongRAMCache } from "../features/dashboard/hooks/useSongRAMCache";

export const useSongSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSongsFromServer = useCallback(async (force = false) => {
    try {
      // Check if songs are already synchronized securely
      if (!force) {
        const state = await db.syncState.get("songs");
        if (state && state.status === "synced") {
          return; // Already synced, avoid redundant network overhead
        }
      }

      setIsSyncing(true);
      setError(null);

      // Record downloading status so other processes know
      await db.syncState.put({
        version: "songs",
        status: "downloading",
        syncedAt: Date.now(),
      });

      const response = await apiRequest("GET", "/api/songs");
      const data = await response.json();
      
      const songs = Array.isArray(data) ? data : (data?.songs ?? []);
      
      if (songs.length > 0) {
        await db.transaction('rw', db.songs, db.syncState, async () => {
           // We wipe and completely refresh to ensure deleted songs disappear safely
           await db.songs.clear();
           
           // Ensure all inserted songs map an artificial 'songId' property strictly
           const mappedSongs = songs.map((s: any) => ({
              ...s,
               songId: s.id || s._id
           }));

           await db.songs.bulkAdd(mappedSongs);

           // Mark as officially synced!
           await db.syncState.put({
             version: "songs",
             status: "synced",
             syncedAt: Date.now(),
             totalVerses: mappedSongs.length // mapping to count logic
           });
        });
        
        console.log(`[Offline Songs] Synced successfully: ${songs.length} songs.`);
        
        // After syncing refresh the RAM cache to reload the newest list into memory
        await useSongRAMCache.getState().loadFromDisk();
      } else {
        // If data is weirdly empty, we can just mark it synced to avoid endless retries
        await db.syncState.put({
          version: "songs",
          status: "synced",
          syncedAt: Date.now(),
          totalVerses: 0
        });
      }
    } catch (err: any) {
      console.error("[Offline Songs] Failed to sync:", err);
      setError(err?.message || "Failed to sync offline songs");

      await db.syncState.put({
        version: "songs",
        status: "error",
        syncedAt: Date.now(),
      });
      
      // If we failed to fetch from online API, we simply boot the RAM Cache from whatever existing data is on disk!
      await useSongRAMCache.getState().loadFromDisk();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncSongsFromServer();
  }, [syncSongsFromServer]);

  return {
    isSyncing,
    error,
    syncSongsFromServer
  };
};
