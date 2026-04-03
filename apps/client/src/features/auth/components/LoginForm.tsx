import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuthStore } from '../auth.store';
import { useAsync } from "@/hooks/useAsync";
import { apiClient } from "@/lib/api";

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const setAuth = useAuthStore(state => state.setAuth);

  const loginApi = async () => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  };

  const { execute: attemptLogin, isLoading, error } = useAsync(loginApi, false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = await attemptLogin() as any;
      setAuth(user);
    } catch (err: any) {
      // Error is handled by useAsync, but we can log it here if needed
      console.error(err.response?.data?.message || err.message);
    }
  };

  return (
    <Card className="w-[400px]">
      <CardHeader>
        <CardTitle>Welcome back to QWorship</CardTitle>
        <CardDescription>Enter your credentials to manage your services.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="flex flex-col gap-4">
          <Input 
            type="email" 
            placeholder="Email Address" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
          />
          {error && <p className="text-red-500 text-sm">
            {(error as any).response?.data?.message || error.message}
          </p>}
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
