import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './app/App'
import { ErrorBoundary } from './components/ErrorBoundary'
import './index.css'

import { buildUrl } from '@/lib/queryClient'

// ── Global Error Handlers ────────────────────────────────────────
// Catch ANY uncaught error that might cause the white screen
window.onerror = (message, source, lineno, colno, error) => {
  console.error('[GLOBAL ERROR]', message, `at ${source}:${lineno}:${colno}`, error);
};

window.onunhandledrejection = (event) => {
  console.error('[UNHANDLED REJECTION]', event.reason);
};


// Global fetch patch to correctly route all frontend /api requests to the backend API_URL
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  if (typeof input === 'string' && input.startsWith('/api/')) {
    input = buildUrl(input);
  }
  return originalFetch(input, init);
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  </React.StrictMode>,
)

