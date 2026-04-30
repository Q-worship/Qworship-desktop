import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useAuthStore } from '../features/auth/auth.store';
import { useToast } from './use-toast';

export function useDesktopAuth() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  useEffect(() => {
    const syncExistingToken = () => {
      const token = localStorage.getItem('token');
      void window.api?.speech?.setAuthToken?.(token ?? null);
    };

    syncExistingToken();

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
            void window.api?.speech?.setAuthToken?.(token);
            
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
                 // Standalone desktop target boots directly into Live Console
                 setLocation('/live-console');
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
