import React from 'react';
import { Database, Loader2, ServerCog, Wifi, CheckCircle2 } from "lucide-react";

interface SyncLoadingOverlayProps {
  isSyncing?: boolean;
  isSuccess?: boolean;
}

export const SyncLoadingOverlay = ({ isSyncing = true, isSuccess = false }: SyncLoadingOverlayProps) => {
  return (
    <div className="fixed bottom-6 right-6 z-[9999] pointer-events-none w-full max-w-[340px] animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="relative p-5 rounded-2xl bg-card/95 backdrop-blur-xl border border-border shadow-2xl overflow-hidden pointer-events-auto">
        {/* Top Glow Progress Line */}
        {!isSuccess && (
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-primary/10 via-primary to-primary/10 animate-pulse" />
        )}
        {isSuccess && (
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-emerald-500/10 via-emerald-500 to-emerald-500/10" />
        )}
        
        <div className="relative z-10 flex flex-col">
          <div className="flex items-center gap-4">
             <div className="relative w-12 h-12 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
               {isSuccess ? (
                 <CheckCircle2 className="w-6 h-6 text-emerald-500" />
               ) : (
                 <>
                   <Database className="w-5 h-5 text-primary animate-pulse" />
                   <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card flex items-center justify-center shadow-sm border border-border">
                     <Loader2 className="w-3 h-3 text-primary animate-spin" />
                   </div>
                 </>
               )}
             </div>
             <div className="flex-1">
               <h3 className="text-sm font-semibold text-foreground">
                 {isSuccess ? "Offline Data Ready" : "Synchronizing Library"}
               </h3>
               <p className="text-xs text-muted-foreground leading-snug mt-1">
                 {isSuccess 
                   ? "All resources are now available for zero-latency offline use." 
                   : "Downloading datasets for zero-latency performance."}
               </p>
             </div>
          </div>

          {!isSuccess && (
            <div className="mt-4 w-full flex items-center justify-between text-[10px] font-semibold text-muted-foreground bg-black/5 dark:bg-black/20 px-4 py-2.5 rounded-lg border border-border/50">
              <div className="flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-primary/70" />
                <span>Downloading</span>
              </div>
              <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent animate-pulse mx-3" />
              <div className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary">Saving</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
