import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from "@/hooks/use-auth";
import { QworshipHome } from "@/features/web/pages/QworshipHome";

/**
 * Dashboard wrapper that enforces project selection flow
 * Redirects users to project selection if no project is currently selected
 */
export function DashboardWrapper() {
  const [, setLocation] = useLocation();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    // Don't redirect if still loading
    if (isLoading) return;

    // If user is not authenticated, they shouldn't be here anyway
    if (!user) {
      setLocation('/login');
      return;
    }

    // Check if user has a current presentation selected
    const currentPresentationId = sessionStorage.getItem('qworship_current_presentation_id');
    
    // If no project is selected, redirect to project selection
    if (!currentPresentationId) {
      setLocation('/project-selection');
      return;
    }
  }, [user, isLoading, setLocation]);

  // Show loading while checking authentication and project selection
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0f0920] via-[#1a0f2e] to-[#2d1b4e] flex items-center justify-center">
        <div className="text-white text-xl">Loading your workspace...</div>
      </div>
    );
  }

  // If user is authenticated and has a project selected, show the dashboard
  return <QworshipHome />;
}