import { useState, useCallback, useEffect } from "react";
import { db } from "../lib/db";
import { apiClient } from "../lib/api";

export const useBibleSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasNativeBibleApi = Boolean((window as any).api?.bible);
  const [canUseNativeBibleApi, setCanUseNativeBibleApi] = useState<boolean | null>(
    hasNativeBibleApi ? null : false,
  );

  useEffect(() => {
    let cancelled = false;

    const probeNativeBibleApi = async () => {
      if (!hasNativeBibleApi) {
        setCanUseNativeBibleApi(false);
        return;
      }

      try {
        const sample = await (window as any).api.bible.getChapter("kjv", "John", 3);
        const isUsable = Array.isArray(sample) && sample.length > 0;

        if (!cancelled) {
          setCanUseNativeBibleApi(isUsable);
        }

        if (!isUsable) {
          console.warn("[Offline Bible] Native Bible API is present but returned no usable sample data; enabling IndexedDB fallback hydration.");
        }
      } catch (err) {
        console.warn("[Offline Bible] Native Bible API probe failed; enabling IndexedDB fallback hydration.", err);
        if (!cancelled) {
          setCanUseNativeBibleApi(false);
        }
      }
    };

    void probeNativeBibleApi();

    return () => {
      cancelled = true;
    };
  }, [hasNativeBibleApi]);

  const checkAndHydrateTargetVersion = useCallback(
    async (version: string, updateSyncState: boolean = true) => {
      try {
        const state = await db.syncState.get(version);

        if (state && state.status === "synced") {
          const verseCount = await db.verses.where("version").equals(version).count();
          
          // Verify we didn't just save a corrupted sync state or lose our IndexedDB
          // Ensure verses actually exist, and if we know the expected total, match it.
          // Fallback to > 0 check for legacy databases that don't have totalVerses
          if (verseCount > 0 && (!state.totalVerses || verseCount === state.totalVerses)) {
            return; // Already perfectly synced and data exists
          }
        }

        if (updateSyncState) setIsSyncing(true);
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
        if (updateSyncState) setIsSyncing(false);
      }
    },
    []
  );

  const hydrateDefaultVersions = useCallback(async () => {
    if (canUseNativeBibleApi !== false) {
      return;
    }

    setIsSyncing(true);
    try {
      // We sequentially download to avoid choking network/memory on initially massive payload
      await checkAndHydrateTargetVersion("kjv", false);
      await checkAndHydrateTargetVersion("nkjv", false);
      await checkAndHydrateTargetVersion("amp", false);
      await checkAndHydrateTargetVersion("msg", false);
      await checkAndHydrateTargetVersion("esv", false);
      await checkAndHydrateTargetVersion("niv", false);
      await checkAndHydrateTargetVersion("gn", false);
    } finally {
      setIsSyncing(false);
    }
  }, [canUseNativeBibleApi, checkAndHydrateTargetVersion]);

  // Hook will auto-hydrate default versions if not found
  useEffect(() => {
    if (canUseNativeBibleApi !== false) {
      return;
    }

    hydrateDefaultVersions();
  }, [canUseNativeBibleApi, hydrateDefaultVersions]);

  return {
    isSyncing,
    error,
    checkAndHydrateTargetVersion,
    hydrateDefaultVersions
  };
};
