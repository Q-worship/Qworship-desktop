import { useState, useCallback, useEffect } from "react";
import { db } from "../lib/db";
import { apiClient } from "../lib/api";

export const useBibleSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkAndHydrateTargetVersion = useCallback(
    async (version: string) => {
      try {
        const state = await db.syncState.get(version);

        if (state && state.status === "synced") {
          return; // Already synced
        }

        setIsSyncing(true);
        setError(null);

        // Record downloading state
        await db.syncState.put({
          version,
          status: "downloading",
          syncedAt: Date.now(),
        });

        // Fetch from API
        const response = await apiClient.get(`/bible/export/${version}`);

        if (response.data?.success && response.data?.verses) {
          const verses = response.data.verses;

          await db.transaction('rw', db.verses, db.syncState, async () => {
             // Clear existing verses for this version just in case of corruption
             await db.verses.where('version').equals(version).delete();
             
             // Bulk add all verses
             await db.verses.bulkAdd(verses);
             
             // Mark as synced
             await db.syncState.put({
                version,
                status: "synced",
                syncedAt: Date.now(),
                totalVerses: verses.length
             });
          });
          
          console.log(`[Offline Bible] Synced ${version} successfully: ${verses.length} verses.`);
        } else {
          throw new Error("Invalid payload from backend");
        }
      } catch (err: any) {
        console.error(`[Offline Bible] Failed to sync ${version}:`, err);
        setError(err?.message || "Failed to sync offline bible");
        await db.syncState.put({
          version,
          status: "error",
          syncedAt: Date.now(),
        });
      } finally {
        setIsSyncing(false);
      }
    },
    []
  );

  const hydrateDefaultVersions = useCallback(async () => {
    // We sequentially download to avoid choking network/memory on initially massive payload
    await checkAndHydrateTargetVersion("kjv");
    await checkAndHydrateTargetVersion("nkjv");
  }, [checkAndHydrateTargetVersion]);

  // Hook will auto-hydrate default versions if not found
  useEffect(() => {
    hydrateDefaultVersions();
  }, [hydrateDefaultVersions]);

  return {
    isSyncing,
    error,
    checkAndHydrateTargetVersion,
    hydrateDefaultVersions
  };
};
