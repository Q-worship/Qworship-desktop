import { useState, useCallback, useEffect } from "react";
import { db } from "../lib/db";
import { apiRequest } from "../lib/queryClient";
import { useSongRAMCache } from "../features/dashboard/hooks/useSongRAMCache";

export const useSongSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSongsFromServer = useCallback(async () => {
    try {
      setIsSyncing(true);
      setError(null);

      const response = await apiRequest("GET", "/api/songs");
      const data = await response.json();
      
      const songs = Array.isArray(data) ? data : (data?.songs ?? []);
      
      if (songs.length > 0) {
        await db.transaction('rw', db.songs, async () => {
           // We wipe and completely refresh to ensure deleted songs disappear safely
           await db.songs.clear();
           
           // Ensure all inserted songs map an artificial 'songId' property strictly
           const mappedSongs = songs.map((s: any) => ({
              ...s,
               songId: s.id || s._id
           }));

           await db.songs.bulkAdd(mappedSongs);
        });
        
        console.log(`[Offline Songs] Synced successfully: ${songs.length} songs.`);
        
        // After syncing perfectly, trigger the RAM cache to reload the newest list into memory
        await useSongRAMCache.getState().loadFromDisk();
      }
    } catch (err: any) {
      console.error("[Offline Songs] Failed to sync:", err);
      setError(err?.message || "Failed to sync offline songs");
      
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
