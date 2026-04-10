import React from 'react';
import { useAuthStore } from '@/features/auth/auth.store';
import { Redirect } from 'wouter';

export const PricingWebView = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  if (!isAuthenticated) return <Redirect to="/login" />;

  // We append the auth token so the remote iframe can automatically log the user in to complete purchase
  const token = localStorage.getItem('token') || '';
  const pricingUrl = `https://app.qworship.com/pricing?desktop_auth=${token}`;

  return (
    <div className="w-full h-screen bg-background flex flex-col">
      {/* 
        We use the Electron <webview> tag (needs to be enabled in webPreferences) 
        to perfectly sandbox and render the external Stripe/Pricing page.
      */}
      {/* @ts-ignore */}
      <webview 
        src={pricingUrl}
        className="w-full flex-1"
        // Allow scripts so stripe functions
        allowpopups="true" 
      />
    </div>
  );
};
