import { useEffect } from "react";
import { db } from "@/lib/db";
import { useAuthStore } from "@/features/auth/auth.store";
import { apiRequest } from "@/lib/queryClient";

declare global {
  interface Window {
    api?: any;
  }
}

export function useMediaAssetSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !navigator.onLine) return;

    const pullAndSyncAssets = async () => {
      try {
        console.log("[MediaSync] Fetching latest remote media definitions...");
        
        // 1. Fetch JSON endpoints
        const cloudMediaRes = await apiRequest("GET", "/api/cloud-media");
        let cloudMedia = await cloudMediaRes.json();
        if (!Array.isArray(cloudMedia)) cloudMedia = [];
        
        const userMediaRes = await apiRequest("GET", "/api/user-media-assets");
        let userMediaObj = await userMediaRes.json();
        let userMedia = userMediaObj?.assets || [];

        // 2. Transpose missing into IndexedDB
        for (const item of cloudMedia) {
           const existing = await db.mediaAssets.get(String(item.id));
           if (!existing) {
              await db.mediaAssets.add({
                 id: String(item.id),
                 type: item.type || "IMAGE",
                 source: "cloud",
                 name: (item as any).title || "Untitled",
                 originalUrl: `/api/cloud-media/${item.id}/file`,
                 syncPending: 0,
                 downloadStatus: "pending",
                 metadata: item
              });
           }
        }

        for (const item of userMedia) {
           const existing = await db.mediaAssets.get(String(item.id));
           if (!existing) {
              await db.mediaAssets.add({
                 id: String(item.id),
                 type: item.type || "IMAGE",
                 source: "user",
                 name: (item as any).title || "Untitled",
                 originalUrl: `/api/user-media-assets/${item.id}/file`,
                 syncPending: 0,
                 downloadStatus: "pending",
                 metadata: item,
                 createdAt: item.createdAt
              });
           }
        }

        // 3. Kick off IPC Downloads for pending records
        if (typeof window !== "undefined" && window.api && window.api.media) {
           const pendingDownloads = await db.mediaAssets.where("downloadStatus").equals("pending").toArray();
           if (pendingDownloads.length > 0) {
              console.log(`[MediaSync] Executing ${pendingDownloads.length} background downloads...`);
           }
           
           for (const pending of pendingDownloads) {
              // mark downloading
              await db.mediaAssets.update(pending.id, { downloadStatus: "downloading" });
              
              try {
                  const filename = `${pending.source}_${pending.id}_file`;
                  const absoluteUrl = window.location.origin + pending.originalUrl;
                  const localUrl = await window.api.media.download(absoluteUrl, filename);
                  
                  await db.mediaAssets.update(pending.id, {
                     downloadStatus: "completed",
                     fileUrl: localUrl,
                     thumbnailUrl: localUrl // fallback
                  });
              } catch (err) {
                 console.error(`[MediaSync] Failed to download media ${pending.id}`, err);
                 await db.mediaAssets.update(pending.id, { downloadStatus: "error" });
              }
           }
        }

      } catch (err) {
        console.error("[MediaSync] Failed to sync media catalog", err);
      }
    };

    pullAndSyncAssets();

  }, [isAuthenticated]);
}
