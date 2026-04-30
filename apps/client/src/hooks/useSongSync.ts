import { useState, useCallback, useEffect } from "react";
import { db } from "../lib/db";
import { useSongRAMCache } from "../features/dashboard/hooks/useSongRAMCache";

export const useSongSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncSongsFromServer = useCallback(async (_force = false) => {
    try {
      setIsSyncing(true);
      setError(null);

      await db.syncState.put({
        version: "songs",
        status: "downloading",
        syncedAt: Date.now(),
      });

      const cache = useSongRAMCache.getState();
      await cache.loadFromDisk(true);

      await db.syncState.put({
        version: "songs",
        status: "synced",
        syncedAt: Date.now(),
        totalVerses: await db.songs.count(),
      });
    } catch (err: any) {
      console.error("[Offline Songs] Failed to bootstrap local song library:", err);
      setError(err?.message || "Failed to load local song library");

      await db.syncState.put({
        version: "songs",
        status: "error",
        syncedAt: Date.now(),
      });
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
    syncSongsFromServer,
  };
};
