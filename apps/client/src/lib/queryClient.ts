import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  // Normalize double /api if VITE_API_URL ends in /api
  if (path.startsWith('/api') && API_BASE.endsWith('/api')) {
    return API_BASE.slice(0, -4) + path;
  }
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  // If API_BASE doesn't end in /api but path doesn't start with /api, we should perhaps just concat
  return API_BASE.replace(/\/$/, '') + normalizedPath;
}

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
