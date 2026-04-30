import React from "react";
import { Switch, Route, Redirect, useLocation, Router } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBibleSync } from "@/hooks/useBibleSync";
import { useSongSync } from "@/hooks/useSongSync";
import { useBibleRAMCache } from "@/features/dashboard/hooks/useBibleRAMCache";
import { useSongRAMCache } from "@/features/dashboard/hooks/useSongRAMCache";
import { SyncLoadingOverlay } from "@/features/dashboard/components/SyncLoadingOverlay";
import { DesktopStartupLoader } from "@/components/DesktopStartupLoader";
import { DesktopUpdateCard } from "@/components/DesktopUpdateCard";
import { useDesktopUpdateState } from "@/hooks/useDesktopUpdateState";

import { SplashScreen } from "@/features/onboarding/pages/SplashScreen";
import SignInPage from "@/features/auth/pages/SignInPage";
import AdminSignInPage from "@/features/auth/pages/AdminSignInPage";
import { LivePresentationV2 } from "@/features/dashboard/live/LivePresentationV2";
import OrganizationSetup from "@/features/onboarding/pages/OrganizationSetup";
import { PricingWebView } from "@/features/onboarding/pages/PricingWebView";
import { ProjectSelection } from "@/features/onboarding/pages/ProjectSelection";
import { QworshipHomeV2Wrapper } from "@/features/dashboard/DashboardLayoutV2";

import { AppLayout } from "./Layout";
import { useAuthStore } from "@/features/auth/auth.store";
import { BibleWorkspace } from "@/features/bible-reader/components/BibleWorkspace";
import AssetsPage from "@/features/dashboard/pages/AssetsPage";
import HelpSupportPage from "@/features/dashboard/pages/HelpSupportPage";
import {
  LiveConsoleAssetsShell,
  LiveConsoleBibleEngagedShell,
  LiveConsoleBibleShell,
  LiveConsoleHandsFreeBibleEngagedShell,
  LiveConsoleHandsFreeBibleShell,
  LiveConsoleSongsEngagedShell,
  LiveConsoleSongsPaceShell,
  LiveConsoleSongsShell,
} from "./LiveConsoleModuleShells";
import {
  LowerThirdEditorPage,
  LowerThirdSettingsPage,
} from "@/features/lowerThird";
import LowerThirdRenderPage from "@/features/dashboard/lower-third/LowerThirdRenderPage";
import { MainPresentationSettingsPage } from "@/features/mainPresentation";
import { ProfileSettings } from "@/features/dashboard/components/ProfileSettings";
import { DisplaySettingsModal } from "@/features/dashboard/components/modals/DisplaySettingsModal";
import { SongbookModal } from "@/features/dashboard/components/SongbookModal";
import { SongEditorModal } from "@/features/dashboard/components/SongEditorModal";
import { useSongs } from "@/features/songs/api/useSongs";
import SuperAdminSidebar from "@/features/super-admin/components/SuperAdminSidebar";
import { useLiveConsoleStore } from "@/stores/useLiveConsoleStore";
import { useDesktopAuth } from "@/hooks/useDesktopAuth";
import { Loader2 } from "lucide-react";

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Hydrate the IndexedDB background caches once authenticated
  const { isSyncing: isBibleSyncing } = useBibleSync();
  const { isSyncing: isSongSyncing } = useSongSync();

  const isSyncing = isBibleSyncing || isSongSyncing;
  const [showSync, setShowSync] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [showStartupLoader, setShowStartupLoader] = React.useState(false);
  const [startupProgress, setStartupProgress] = React.useState(8);
  const [startupHeadline, setStartupHeadline] = React.useState("Synchronizing Library");
  const [startupDetail, setStartupDetail] = React.useState("Downloading datasets for zero-latency performance.");
  const startupStartedAtRef = React.useRef<number | null>(null);
  const {
    state: desktopUpdateState,
    isActionPending: isUpdateActionPending,
    shouldShowCard: shouldShowUpdateCard,
    installAndRestart,
  } = useDesktopUpdateState();

  React.useEffect(() => {
    if (!isAuthenticated || startupStartedAtRef.current !== null) return;

    let cancelled = false;
    startupStartedAtRef.current = Date.now();
    setShowStartupLoader(true);
    setStartupProgress(8);
    setStartupHeadline("Synchronizing Library");
    setStartupDetail("Downloading datasets for zero-latency performance.");

    const runStartupPreload = async () => {
      try {
        await useBibleRAMCache.getState().loadFromDisk((snapshot) => {
          if (cancelled) return;
          setStartupProgress(snapshot.progress);
          setStartupDetail(snapshot.detail);
        });

        if (cancelled) return;

        setStartupProgress(92);
        setStartupHeadline("Synchronizing Library");
        setStartupDetail("Downloading datasets for zero-latency performance.");
        await useSongRAMCache.getState().loadFromDisk(true);

        if (cancelled) return;

        setStartupProgress(100);
        setStartupHeadline("Offline Data Ready");
        setStartupDetail("All resources are now available for zero-latency offline use.");

        window.setTimeout(() => {
          if (!cancelled) {
            setShowStartupLoader(false);
          }
        }, 450);
      } catch (error) {
        console.error("[StartupLoader] Offline preload failed.", error);
        if (!cancelled) {
          setStartupProgress(100);
          setStartupHeadline("Synchronizing Library");
          setStartupDetail("Offline preload encountered an issue. Continuing with the best available local data.");
          window.setTimeout(() => {
            if (!cancelled) {
              setShowStartupLoader(false);
            }
          }, 900);
        }
      }
    };

    void runStartupPreload();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  React.useEffect(() => {
    // Only start tracking the legacy sync toast once the branded launch loader has finished.
    if (!isAuthenticated || showStartupLoader) return;

    if (isSyncing) {
      setShowSync(true);
      setIsSuccess(false);
    } else if (showSync && !isSyncing) {
      setIsSuccess(true);
      const timer = setTimeout(() => {
        setShowSync(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing, isAuthenticated, showStartupLoader, showSync]);

  // Keep the RAM dictionary warm even after the startup loader has completed.
  React.useEffect(() => {
    if (isAuthenticated && !showStartupLoader && !isSyncing) {
      void useBibleRAMCache.getState().loadFromDisk();
    }
  }, [isAuthenticated, showStartupLoader, isSyncing]);

  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <>
      {children}
      <DesktopStartupLoader
        visible={showStartupLoader}
        isSongSyncing={isSongSyncing}
        isBibleSyncing={isBibleSyncing}
        progressOverride={startupProgress}
        headlineOverride={startupHeadline}
        detailOverride={startupDetail}
      />
      <DesktopUpdateCard
        state={desktopUpdateState}
        visible={shouldShowUpdateCard}
        isActionPending={isUpdateActionPending}
        onInstallAndRestart={() => {
          void installAndRestart();
        }}
      />
      {showSync && !showStartupLoader && (
        <SyncLoadingOverlay isSyncing={!isSuccess} isSuccess={isSuccess} />
      )}
    </>
  );
};

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  if (user?.role !== "admin" && user?.role !== "superadmin")
    return <Redirect to="/dashboard" />;

  return <>{children}</>;
};

// Thin wrapper so we can call useLocation() inside a component (hooks can't
// be called in the outer AppRouter render directly via inline arrow fns).
function useLiveConsoleReturnPath() {
  return useLiveConsoleStore((state) => state.moduleContext.returnPath || "/live-console");
}

function LowerThirdSettingsRoute() {
  const [, navigate] = useLocation();
  const returnPath = useLiveConsoleReturnPath();
  const clearModuleEntry = useLiveConsoleStore((state) => state.clearModuleEntry);
  return <LowerThirdSettingsPage onClose={() => {
    clearModuleEntry();
    navigate(returnPath);
  }} />;
}
function MainPresentationSettingsRoute() {
  const [, navigate] = useLocation();
  const returnPath = useLiveConsoleReturnPath();
  const clearModuleEntry = useLiveConsoleStore((state) => state.clearModuleEntry);
  return (
    <MainPresentationSettingsPage onClose={() => {
      clearModuleEntry();
      navigate(returnPath);
    }} />
  );
}

function SettingsRoute() {
  const [, navigate] = useLocation();
  const returnPath = useLiveConsoleReturnPath();
  const clearModuleEntry = useLiveConsoleStore((state) => state.clearModuleEntry);
  const panel = new URLSearchParams(window.location.search).get("panel");
  const backdrop = React.useMemo(() => renderLiveConsoleBackdrop(returnPath), [returnPath]);

  const handleClose = () => {
    clearModuleEntry();
    navigate(returnPath);
  };

  if (panel === "display") {
    return (
      <div className="relative min-h-screen overflow-hidden bg-[#05030d]">
        <div aria-hidden className="pointer-events-none select-none blur-[10px] saturate-75 scale-[1.01] origin-center">
          {backdrop}
        </div>
        <div className="absolute inset-0 bg-[#05030d]/45" />
        <DisplaySettingsModal isOpen={true} onClose={handleClose} />
      </div>
    );
  }

  return <ProfileSettings isOpen={true} onClose={handleClose} />;
}

function renderLiveConsoleBackdrop(returnPath: string) {
  switch (returnPath) {
    case "/songs":
      return <LiveConsoleSongsShell />;
    case "/songs-engaged":
      return <LiveConsoleSongsEngagedShell />;
    case "/songs-pace":
      return <LiveConsoleSongsPaceShell />;
    case "/bible":
      return <LiveConsoleBibleShell />;
    case "/bible-engaged":
      return <LiveConsoleBibleEngagedShell />;
    case "/hfb":
      return <LiveConsoleHandsFreeBibleEngagedShell />;
    case "/live-console":
    default:
      return <LiveConsoleHandsFreeBibleShell />;
  }
}

function SongbookRoute() {
  const [, navigate] = useLocation();
  const returnPath = useLiveConsoleReturnPath();
  const clearModuleEntry = useLiveConsoleStore((state) => state.clearModuleEntry);
  const { data } = useSongs();
  const backdrop = React.useMemo(() => renderLiveConsoleBackdrop(returnPath), [returnPath]);
  const [activeSongbookView, setActiveSongbookView] = React.useState<"songbook" | "editor" | null>("songbook");
  const [editorSongData, setEditorSongData] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (activeSongbookView !== null) return;
    clearModuleEntry();
    navigate(returnPath);
  }, [activeSongbookView, clearModuleEntry, navigate, returnPath]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05030d]">
      <div aria-hidden className="pointer-events-none select-none blur-[10px] saturate-75 scale-[1.01] origin-center">
        {backdrop}
      </div>
      <div className="absolute inset-0 bg-[#05030d]/45" />
      <SongbookModal
        isOpen={activeSongbookView === "songbook"}
        onClose={() => setActiveSongbookView(null)}
        onOpenSongEditor={(songData?: any) => {
          setEditorSongData(songData || null);
          setActiveSongbookView("editor");
        }}
        savedSongs={data?.songs ?? []}
      />
      <SongEditorModal
        isOpen={activeSongbookView === "editor"}
        onClose={() => {
          setEditorSongData(null);
          setActiveSongbookView("songbook");
        }}
        initialData={editorSongData}
        onSave={() => {
          setEditorSongData(null);
          setActiveSongbookView("songbook");
        }}
      />
    </div>
  );
}

const DesktopAuthHandler = () => {
  const { isAuthenticating } = useDesktopAuth();

  if (!isAuthenticating) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-md animate-in fade-in duration-300">
      <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
      <h2 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
        Authenticating...
      </h2>
      <p className="text-muted-foreground text-sm mt-2">
        Connecting your Qworship account
      </p>
    </div>
  );
};

export const AppRouter = () => {
  return (
    <Router hook={useHashLocation}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />

          {/* Global Desktop Authentication Loader overlay and Deep Link Handler */}
          <DesktopAuthHandler />

          <Switch>
            <Route path="/" component={SplashScreen} />
            <Route path="/pricing" component={PricingWebView} />
            <Route path="/login" component={SignInPage} />
            <Route path="/signup" component={SignInPage} />
            <Route path="/admin/login" component={AdminSignInPage} />

            {/* Standalone authenticated routes like Super Admin */}
            <Route path="/super-admin">
              <AdminGuard>
                <SuperAdminSidebar />
              </AdminGuard>
            </Route>

            {/* Live Presentation (Audience View) */}
            <Route path="/live">
              <AuthGuard>
                <LivePresentationV2 />
              </AuthGuard>
            </Route>

            <Route path="/lower-third-render" component={LowerThirdRenderPage} />

            <Route>
              <AuthGuard>
                <AppLayout>
                  <Switch>
                    <Route
                      path="/organization-setup"
                      component={OrganizationSetup}
                    />
                    <Route
                      path="/project-selection"
                      component={ProjectSelection}
                    />
                    <Route
                      path="/dashboard"
                      component={QworshipHomeV2Wrapper}
                    />
                    <Route path="/live-console" component={LiveConsoleHandsFreeBibleShell} />
                    <Route path="/bible" component={LiveConsoleBibleShell} />
                    <Route path="/bible-engaged" component={LiveConsoleBibleEngagedShell} />
                    <Route path="/hfb" component={LiveConsoleHandsFreeBibleEngagedShell} />
                    <Route path="/bible/workspace" component={BibleWorkspace} />
                    <Route path="/songs" component={LiveConsoleSongsShell} />
                    <Route path="/songs-engaged" component={LiveConsoleSongsEngagedShell} />
                    <Route path="/songs-pace" component={LiveConsoleSongsPaceShell} />
                    <Route path="/presentations">
                      <Redirect to="/live-console" />
                    </Route>
                    <Route path="/settings" component={SettingsRoute} />
                    <Route path="/songbook" component={SongbookRoute} />
                    <Route path="/assets" component={LiveConsoleAssetsShell} />
                    <Route path="/dashboard-assets" component={AssetsPage} />
                    <Route path="/dashboard-help" component={HelpSupportPage} />
                    <Route
                      path="/lower-third-settings"
                      component={LowerThirdSettingsRoute}
                    />
                    <Route
                      path="/lower-third-editor/:templateId"
                      component={LowerThirdEditorPage}
                    />
                    <Route
                      path="/main-presentation-settings"
                      component={MainPresentationSettingsRoute}
                    />

                    <Route>
                      <div className="text-center py-20 text-muted-foreground flex items-center justify-center font-bold text-2xl h-full">
                        404 - Page not found in workspace
                      </div>
                    </Route>
                  </Switch>
                </AppLayout>
              </AuthGuard>
            </Route>
          </Switch>
        </TooltipProvider>
      </QueryClientProvider>
    </Router>
  );
};
