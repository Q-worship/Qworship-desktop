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
  LowerThirdEditorPage,
  LowerThirdSettingsPage,
} from "@/features/lowerThird";
import { MainPresentationSettingsPage } from "@/features/mainPresentation";
import SuperAdminSidebar from "@/features/super-admin/components/SuperAdminSidebar";

const DashboardMock = () => (
  <div className="flex flex-col gap-4">
    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
    <p className="text-muted-foreground">
      Select a module from the sidebar to begin.
    </p>
  </div>
);

const SongsMock = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold">Song Library</h1>
  </div>
);
const PresentationsMock = () => (
  <div className="p-6">
    <h1 className="text-3xl font-bold">Presentations</h1>
  </div>
);

const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Hydrate the IndexedDB background caches once authenticated
  const { isSyncing: isBibleSyncing } = useBibleSync();
  const { isSyncing: isSongSyncing } = useSongSync();

  const isSyncing = isBibleSyncing || isSongSyncing;
  const [showSync, setShowSync] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);

  React.useEffect(() => {
    // Only start tracking sync state once authentication is verified
    if (!isAuthenticated) return;

    if (isSyncing) {
      setShowSync(true);
      setIsSuccess(false);
    } else if (showSync && !isSyncing) {
      // Finished syncing
      setIsSuccess(true);
      const timer = setTimeout(() => {
        setShowSync(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
    // Note: We intentionally only want this to run after hydration is started,
    // we don't want it to flash true on initial mount if it's already cached.
    // If both hooks initialize as false, showSync will remain false.
  }, [isSyncing, isAuthenticated]);

  // Instantly dump the IndexedDB offline safehouse into the 0.00ms Memory dictionary
  // ONLY after the initial synchronization completes to prevent thread locking
  React.useEffect(() => {
    if (isAuthenticated && !isSyncing) {
      useBibleRAMCache.getState().loadFromDisk();
      useSongRAMCache.getState().loadFromDisk();
    }
  }, [isAuthenticated, isSyncing]);

  if (!isAuthenticated) return <Redirect to="/login" />;

  return (
    <>
      {children}
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
function LowerThirdSettingsRoute() {
  const [, navigate] = useLocation();
  return <LowerThirdSettingsPage onClose={() => navigate("/dashboard")} />;
}
function MainPresentationSettingsRoute() {
  const [, navigate] = useLocation();
  return (
    <MainPresentationSettingsPage onClose={() => navigate("/dashboard")} />
  );
}

import { useDesktopAuth } from "@/hooks/useDesktopAuth";
import { Loader2 } from "lucide-react";

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
                    <Route path="/bible" component={BibleWorkspace} />
                    <Route path="/songs" component={SongsMock} />
                    <Route
                      path="/presentations"
                      component={PresentationsMock}
                    />
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
