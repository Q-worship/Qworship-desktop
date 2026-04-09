import React from 'react'
import ReactDOM from 'react-dom/client'
import { AppRouter } from './app/App'
import './index.css'

import { buildUrl } from '@/lib/queryClient'

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
    <AppRouter />
  </React.StrictMode>,
)
