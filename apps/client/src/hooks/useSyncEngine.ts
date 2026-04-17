import { useEffect } from "react";
import { db } from "@/lib/db";
import { useAuthStore } from "@/features/auth/auth.store";
import { apiRequest } from "@/lib/queryClient";

export function useSyncEngine() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    const processActionQueue = async () => {
      const actions = await db.actionQueue.orderBy("timestamp").toArray();
      if (actions.length === 0) return;

      console.log(`[SyncEngine] Processing ${actions.length} queued offline actions...`);
      for (const action of actions) {
        try {
          if (action.action === "DELETE_PRESENTATION") {
            await apiRequest("DELETE", `/api/presentations/${action.payload.id}`);
          } else if (action.action === "UPDATE_PRESENTATION") {
            await apiRequest("PUT", `/api/presentations/${action.payload.id}`, action.payload.data);
          }
          // Processed successfully, clear from queue
          await db.actionQueue.delete(action.id!);
        } catch (e) {
          console.error(`[SyncEngine] Failed to process queued action`, action, e);
        }
      }
    };

    const handleOnline = async () => {
      console.log("[SyncEngine] Network restored. Initiating background sync...");
      await processActionQueue();
      // other potential offline sync hooks e.g., announcements can exist here.
    };

    // Initial check on boot
    if (navigator.onLine) {
      handleOnline();
    }

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [isAuthenticated]);
}
