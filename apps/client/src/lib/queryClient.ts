import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  // Clean up API_BASE to strip trailing slash
  const cleanApiBase = API_BASE.replace(/\/$/, '');
  
  // Clean up path to ensure it starts with a slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // If cleanApiBase ends with '/api' and cleanPath starts with '/api',
  // we must avoid '/api/api/something'.
  if (cleanApiBase.endsWith('/api') && cleanPath.startsWith('/api')) {
     return cleanApiBase.slice(0, -4) + cleanPath;
  }
  
  return cleanApiBase + cleanPath;
}

export const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url === "Worship background image" || url === "Inspirational worship video" || url === "Background Image" || url === "Ready for content") return undefined;
  
  // Strip hardcoded UI API origins that might have leaked into Database from previous buggy app clients
  let cleanUrl = url;
  if (cleanUrl.startsWith('https://app.qworship.com/api/')) {
    cleanUrl = cleanUrl.replace('https://app.qworship.com/api/', '/api/');
  } else if (cleanUrl.startsWith('https://api.qworship.com/api/')) {
    cleanUrl = cleanUrl.replace('https://api.qworship.com/api/', '/api/');
  } else if (cleanUrl.startsWith('http://localhost:5000/api/')) {
    cleanUrl = cleanUrl.replace('http://localhost:5000/api/', '/api/');
  }
  
  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) return cleanUrl;
  if (cleanUrl.startsWith('data:') || cleanUrl.startsWith('blob:')) return cleanUrl;
  if (cleanUrl.startsWith('/api/') || cleanUrl.startsWith('/uploads/')) return buildUrl(cleanUrl);
  return undefined;
};

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = buildUrl(url);
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

// Admin API request function that includes the admin key for SuperAdmin authentication
export async function adminApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const fullUrl = buildUrl(url);
  const adminKey = 'qworship-superadmin-2025';
  
  // Add admin key as query parameter
  const separator = fullUrl.includes('?') ? '&' : '?';
  const urlWithKey = `${fullUrl}${separator}adminKey=${adminKey}`;
  
  const headers: Record<string, string> = {};
  
  // For FormData (file uploads), don't set Content-Type - let the browser set it
  if (data && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  const res = await fetch(urlWithKey, {
    method,
    headers,
    body: data instanceof FormData ? data : (data ? JSON.stringify(data) : undefined),
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const fullUrl = buildUrl(queryKey[0] as string);
    const res = await fetch(fullUrl, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Admin query function that includes the admin key for SuperAdmin authentication
export const getAdminQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const adminKey = 'qworship-superadmin-2025';
    const originalUrl = queryKey[0] as string;
    const fullUrl = buildUrl(originalUrl);
    
    const separator = fullUrl.includes('?') ? '&' : '?';
    const urlWithKey = `${fullUrl}${separator}adminKey=${adminKey}`;
    
    const headers: Record<string, string> = {};
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const res = await fetch(urlWithKey, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
