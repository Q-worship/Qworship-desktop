import { useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  role: string;
  accountType: string;
  isActive: boolean;
  emailVerified: boolean;
}

export function useAuth() {
  const { data, isLoading, error } = useQuery<{success: boolean; user: User}>({
    queryKey: ['/api/auth/user'],
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const user = data?.user;

  return {
    user,
    isLoading,
    isAuthenticated: !!user && !error,
    error,
  };
}