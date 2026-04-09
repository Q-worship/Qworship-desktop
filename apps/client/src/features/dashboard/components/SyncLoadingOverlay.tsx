import React from 'react';
import { Database, Loader2, ServerCog, Wifi } from "lucide-react";

export const SyncLoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-background/80 backdrop-blur-xl flex flex-col items-center justify-center">
      <div className="relative w-full max-w-md mx-auto p-8 rounded-3xl bg-card/80 backdrop-blur-3xl border border-border shadow-2xl overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[200%] h-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center text-center">
          <div className="relative mb-8 mt-4">
            <div className="relative w-24 h-24 rounded-full bg-primary/5 flex items-center justify-center border border-primary/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
              <Database className="w-10 h-10 text-primary animate-pulse" />
            </div>
            
            {/* Smooth spinning gradient ring */}
            <div className="absolute inset-[-4px] rounded-full border border-transparent border-t-primary/80 animate-spin" style={{ animationDuration: '2s' }} />
            <div className="absolute inset-[-8px] rounded-full border border-transparent border-t-primary/30 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
            
            <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center shadow-lg">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            </div>
          </div>

          <h2 className="text-2xl font-bold tracking-tight mb-3 text-foreground">
            Synchronizing Offline Data
          </h2>
          
          <p className="text-muted-foreground mb-8 text-sm leading-relaxed px-4">
            Initializing your local database with Bibles and Songs for uncompromising zero-latency performance. 
            <br />
            <span className="font-semibold text-primary/80 mt-2 block">This only happens once.</span>
          </p>

          <div className="w-full flex items-center justify-between text-xs font-semibold text-muted-foreground bg-black/5 dark:bg-black/20 w-fit mx-auto px-8 py-4 rounded-2xl border border-border shadow-inner">
            <div className="flex flex-col items-center gap-2 relative">
              <ServerCog className="w-5 h-5 text-primary/50" />
              <span>Fetching</span>
            </div>
            
            <div className="w-12 h-[2px] bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10 animate-pulse mx-4" />
            
            <div className="flex flex-col items-center gap-2 relative">
              <Wifi className="w-5 h-5 text-primary/70" />
              <span>Downloading</span>
            </div>
            
            <div className="w-12 h-[2px] bg-gradient-to-r from-primary/10 via-primary/80 to-primary/10 animate-pulse mx-4" />
            
            <div className="flex flex-col items-center gap-2 relative">
              <Database className="w-5 h-5 text-primary drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
              <span className="text-primary">Saving</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
