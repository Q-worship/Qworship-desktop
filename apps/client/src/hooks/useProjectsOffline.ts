import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db, OfflinePresentation } from "../lib/db";
import { apiRequest } from "../lib/queryClient";

export const useProjectsOffline = (user: any) => {
  const queryClient = useQueryClient();
  const [offlinePresentations, setOfflinePresentations] = useState<OfflinePresentation[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // 1. Load Local Database instantly on mount
  const loadLocalDb = useCallback(async () => {
    try {
      const all = await db.presentations.orderBy('updatedAt').reverse().toArray();
      setOfflinePresentations(all);
    } catch(e) {
      console.error("[Offline Projects] Error loading from Dexie:", e);
    }
  }, []);

  useEffect(() => {
    if (user) loadLocalDb();
  }, [user, loadLocalDb]);

  // 2. Fetch from Cloud and Hydrate IndexedDB
  const { isLoading: presentationsLoading } = useQuery({
    queryKey: ["/api/presentations"],
    enabled: !!user && !isOffline,
  });

  // Since React Query caches and handles the network, we can subscribe to its data via a manual fetch/hydrate
  useEffect(() => {
    if (!user || isOffline) return;
    
    apiRequest("GET", "/api/presentations").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        if (data.presentations) {
           const remoteProjects = data.presentations.map((p: any) => ({
             ...p, syncPending: 0
           }));
           
           // Ensure we don't wipe out offline-created pending projects
           const pendingLocal = await db.presentations.where('syncPending').equals(1).toArray();
           
           // Push pending local projects to the server as a single bulk request
           if (pendingLocal.length > 0) {
               console.log(`[Offline Projects] Bulk-syncing ${pendingLocal.length} cached offline projects to cloud...`);
               try {
                   const bulkRes = await apiRequest("POST", "/api/presentations/bulk", { presentations: pendingLocal });
                   if (bulkRes.ok) {
                       const bulkData = await bulkRes.json();
                       if (bulkData.created && bulkData.created.length > 0) {
                           // Single atomic Dexie transaction: delete all temp IDs, insert real ones
                           await db.transaction('rw', db.presentations, async () => {
                               for (const entry of bulkData.created) {
                                   await db.presentations.delete(entry.localId);
                                   await db.presentations.put({ ...entry.presentation, syncPending: 0 });
                               }
                           });
                           console.log(`[Offline Projects] Successfully synced ${bulkData.created.length} projects to cloud.`);
                       }
                   }
               } catch (e) {
                   console.warn("[Offline Projects] Bulk sync failed, will retry on next reconnect.", e);
               }
           }
           
           await db.transaction('rw', db.presentations, async () => {
              const existing = await db.presentations.toArray();
              const existingMap = new Map(existing.map(p => [p.id, p]));
              // Collect IDs of projects still awaiting cloud sync — these take priority
              const pendingIds = new Set(existing.filter(p => p.syncPending === 1).map(p => p.id));

              // Upsert remotes, but never overwrite a project that hasn't synced yet
              for (const rp of remoteProjects) {
                  if (pendingIds.has(rp.id)) {
                      console.log(`[Offline Projects] Skipping hydration for pending project: ${rp.name}`);
                      continue;
                  }
                  const localEquivalent = existingMap.get(rp.id);
                  if (localEquivalent && localEquivalent.serviceData) {
                     rp.serviceData = localEquivalent.serviceData;
                  }
                  await db.presentations.put(rp);
              }
            });
           
           loadLocalDb();
        }
      }
    }).catch(e => console.error("[Offline Projects] Cloud sync failed", e));
  }, [user, isOffline, loadLocalDb]);


  // 3. Create Mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (presentationData: any) => {
      const createLocally = async () => {
         const newId = `local_${Date.now()}`;
         const newP: OfflinePresentation = {
           id: newId,
           name: presentationData.name,
           presentationDate: presentationData.presentationDate,
           description: presentationData.description,
           createdAt: new Date().toISOString(),
           updatedAt: new Date().toISOString(),
           slideCount: 0,
           status: 'active',
           syncPending: 1
         };
         try {
           await db.presentations.put(newP);
           await loadLocalDb();
         } catch (e) {
           console.error("Dexie failed to save presentation:", e);
           throw new Error("Local database error. Please reload the app.");
         }
         return { presentation: newP };
      };

      if (isOffline) {
         return await createLocally();
      }
      
      try {
        const response = await apiRequest("POST", "/api/presentations", presentationData);
        const data = await response.json();
        await db.presentations.put({ ...data.presentation, syncPending: 0 });
        await loadLocalDb();
        return data;
      } catch (err: any) {
        // Fallback safely to offline indexedDB creation if backend fetch is unreachable
        if (err.message === "Failed to fetch" || err.name === "TypeError" || String(err).includes("Network")) {
           console.warn("[Offline Projects] Cloud unreachable, generating project locally.", err);
           return await createLocally();
        }
        throw err;
      }
    }
  });

  // 4. Load Presentation Mutation
  const loadPresentationMutation = useMutation({
    mutationFn: async (presentationId: string | number) => {
      if (typeof presentationId === 'string' && presentationId.startsWith('local_')) {
          const lp = await db.presentations.get(presentationId);
          return { presentation: lp };
      }

      const loadLocally = async () => {
         // Attempt exact match
         let lp = await db.presentations.get(presentationId);
         
         // If undefined, Dexter's strict typing might be failing because 'id' is a string but stored as number
         if (!lp && !isNaN(Number(presentationId))) {
             lp = await db.presentations.get(Number(presentationId));
         }
         
         // Or vice-versa
         if (!lp && typeof presentationId === 'number') {
             lp = await db.presentations.get(String(presentationId));
         }

         if (lp) return { presentation: lp };
         throw new Error("You are offline and this project has not been fully cached.");
      };

      if (isOffline) {
         return await loadLocally();
      }

      try {
        const response = await apiRequest("GET", `/api/presentations/${presentationId}`);
        if (!response.ok) throw new Error("Failed to load presentation from Cloud");
        
        const data = await response.json();
        // Update IndexedDB with the fully populated serviceData to support future offline load
        await db.presentations.update(presentationId, { serviceData: JSON.stringify(data.presentation) });
        return data;
      } catch (err: any) {
        if (err.message === "Failed to fetch" || err.name === "TypeError" || String(err).includes("Network")) {
           console.warn("[Offline Projects] Cloud unreachable, loading project from local cache.", err);
           return await loadLocally();
        }
        throw err;
      }
    }
  });

  return {
    presentations: offlinePresentations,
    isLoading: presentationsLoading && offlinePresentations.length === 0,
    isOffline,
    createPresentationMutation,
    loadPresentationMutation
  };
};
