import React from "react";
import { Switch, Route, Redirect, useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useBibleSync } from "@/hooks/useBibleSync";
import { useSongSync } from "@/hooks/useSongSync";
import { useBibleRAMCache } from "@/features/dashboard/hooks/useBibleRAMCache";
import { useSongRAMCache } from "@/features/dashboard/hooks/useSongRAMCache";
import { SyncLoadingOverlay } from "@/features/dashboard/components/SyncLoadingOverlay";

import { Home } from "@/features/web/pages/Home";
import About from "@/features/web/pages/About";
import { Pricing } from "@/features/web/pages/Pricing";
import Contact from "@/features/web/pages/Contact";
import EndUserLicense from "@/features/web/pages/EndUserLicense";
import Features from "@/features/web/pages/Features";
import PrivacyPolicy from "@/features/web/pages/PrivacyPolicy";
import RefundPolicy from "@/features/web/pages/RefundPolicy";
import { DocsPage } from "@/features/web/pages/DocsPage";
import SignInPage from "@/features/auth/pages/SignInPage";
import AdminSignInPage from "@/features/auth/pages/AdminSignInPage";
import { LivePresentationV2 } from "@/features/dashboard/live/LivePresentationV2";
import OrganizationSetup from "@/features/onboarding/pages/OrganizationSetup";
import PlanSelection from "@/features/onboarding/pages/PlanSelection";
import { ProjectSelection } from "@/features/onboarding/pages/ProjectSelection";
import { QworshipHomeV2Wrapper } from "@/features/dashboard/DashboardLayoutV2";

import { AppLayout } from "./Layout";
import { useAuthStore } from "@/features/auth/auth.store";
import { BibleWorkspace } from "@/features/bible-reader/components/BibleWorkspace";
import AssetsPage from "@/features/dashboard/pages/AssetsPage";
import HelpSupportPage from "@/features/dashboard/pages/HelpSupportPage";
import GuidesPage from "@/features/web/pages/GuidesPage";
import { LowerThirdEditorPage, LowerThirdSettingsPage } from "@/features/lowerThird";
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

  // Instantly dump the IndexedDB offline safehouse into the 0.00ms Memory dictionary
  // ONLY after the initial synchronization completes to prevent thread locking
  React.useEffect(() => {
    if (isAuthenticated && !isSyncing) {
      useBibleRAMCache.getState().loadFromDisk();
      useSongRAMCache.getState().loadFromDisk();
    }
  }, [isAuthenticated, isSyncing]);

  if (!isAuthenticated) return <Redirect to="/login" />;
  
  if (isSyncing) {
    return <SyncLoadingOverlay />;
  }
  
  return <>{children}</>;
};

const AdminGuard = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  
  if (!isAuthenticated) return <Redirect to="/admin/login" />;
  if (user?.role !== 'admin' && user?.role !== 'superadmin') return <Redirect to="/dashboard" />;
  
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
  return <MainPresentationSettingsPage onClose={() => navigate("/dashboard")} />;
}

export const AppRouter = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/about" component={About} />
          <Route path="/pricing" component={Pricing} />
          <Route path="/features" component={Features} />
          <Route path="/contact" component={Contact} />
          <Route path="/docs" component={DocsPage} />
          <Route path="/privacy-policy" component={PrivacyPolicy} />
          <Route path="/refund-policy" component={RefundPolicy} />
          <Route path="/eula" component={EndUserLicense} />
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
                  <Route path="/organization-setup" component={OrganizationSetup} />
                  <Route path="/plan-selection" component={PlanSelection} />
                  <Route path="/project-selection" component={ProjectSelection} />
                  <Route path="/dashboard" component={QworshipHomeV2Wrapper} />
                  <Route path="/bible" component={BibleWorkspace} />
                  <Route path="/songs" component={SongsMock} />
                  <Route path="/presentations" component={PresentationsMock} />
                  <Route path="/dashboard-assets" component={AssetsPage} />
                  <Route path="/dashboard-help" component={HelpSupportPage} />
                  <Route path="/guides" component={GuidesPage} />
                  <Route path="/lower-third-settings" component={LowerThirdSettingsRoute} />
                  <Route path="/lower-third-editor/:templateId" component={LowerThirdEditorPage} />
                  <Route path="/main-presentation-settings" component={MainPresentationSettingsRoute} />

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
  );
};
