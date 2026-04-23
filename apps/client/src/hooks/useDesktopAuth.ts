import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '../features/auth/auth.store';
import { useToast } from './use-toast';

declare global {
  interface Window {
    api?: {
      onDeepLinkPayload: (callback: (url: string) => void) => () => void;
      requestInitialDeepLink: () => void;
      openWebAuth: (url: string) => void;
      ndi?: {
        startStream: (sources: Array<{ url: string; ndiName: string }>) => Promise<{ ok: boolean }>;
        stopStream: () => Promise<{ ok: boolean }>;
        getGrandioseError: () => Promise<{ message: string; details: string; solution: string } | null>;
        onStatsUpdate: (callback: (stats: unknown) => void) => () => void;
        onError: (callback: (err: unknown) => void) => () => void;
      };
      renderer?: {
        updateState: (type: 'lowerThird' | 'mainPresentation', state: unknown) => void;
      };
    };
    qworshipRendererApi?: {
      onStateUpdate: (callback: (state: unknown) => void) => () => void;
    };
  }
}

export function useDesktopAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    // We define this inside useEffect to ensure it captures the latest setLocation/toast
    const handleIncomingUrl = (url: string) => {
      console.log('useDesktopAuth caught deep link:', url);
      setIsAuthenticating(true);
      
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === 'auth' || urlObj.pathname.includes('auth')) {
          const token = urlObj.searchParams.get('token');
          const userStr = urlObj.searchParams.get('user');

          if (token && userStr) {
            const user = JSON.parse(decodeURIComponent(userStr));
            console.log('Decoded Desktop Auth User Payload:', user);
            
            // Hydrate the session
            localStorage.setItem('token', token);
            sessionStorage.setItem('qworship_user_id', user.id?.toString() || "");
            
            useAuthStore.getState().setAuth(user);
            
            toast({
              title: "Authentication Successful",
              description: "Welcome back! Synchronizing preferences...",
            });

            // Route the user to the next step
            setTimeout(() => {
              // Because of the Full Web Onboarding approach, the user has already set up Org & Plan
              if (!user.organizationId && !user.organizationName && !user.organization) {
                 // Extreme fallback
                 setLocation('/organization-setup');
              } else {
                 // Push straight into the action
                 setLocation('/project-selection');
              }
              setIsAuthenticating(false);
            }, 1500);
          } else {
            console.warn("Deep link missing token or user search params", { token, userStr });
            setIsAuthenticating(false);
          }
        }
      } catch (e) {
        console.error('Failed to parse deep link URL', e);
        toast({
          title: "Authentication Error",
          description: "Failed to parse secure login data.",
          variant: "destructive"
        });
        setIsAuthenticating(false);
      }
    };

    if (window.api && window.api.onDeepLinkPayload) {
      console.log('Subscribing to IPC deep links...');
      const unsubscribe = window.api.onDeepLinkPayload((url: string) => {
        handleIncomingUrl(url);
      });

      // Request any initial deep link hanging in the electron main thread
      window.api.requestInitialDeepLink();

      return () => {
        unsubscribe();
      };
    } else {
      console.warn("window.api or window.api.onDeepLinkPayload is not available in preload!");
    }
  }, [setLocation, toast]);

  return { isAuthenticating };
}

