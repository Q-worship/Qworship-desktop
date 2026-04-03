import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "@/features/auth/auth.store";
import { AuthSignInForm } from "@/features/auth/components/AuthSignInForm";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function AdminSignInPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const signInMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/auth/signin", {
        username: data.username,
        password: data.password,
      });
      return await response.json();
    },
    onSuccess: (response) => {
      // Check if user has admin privileges
      const userRole = response.user.role;
      if (userRole !== 'admin' && userRole !== 'superadmin') {
        toast({
          title: "Access Denied",
          description: "This portal is restricted to Administrators only.",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Admin Authenticated",
        description: "Welcome to the Q-worship Super Admin Portal.",
      });
      
      // Store user ID and JWT token for session
      sessionStorage.setItem("qworship_user_id", response.user.id.toString());
      localStorage.setItem("token", response.token);

      // Update global Zustand store
      useAuthStore.getState().setAuth(response.user);

      // Force navigate strictly to super-admin dashboard
      setLocation('/super-admin');
    },
    onError: (error: any) => {
      toast({
        title: "Sign-in Failed",
        description: "Invalid credentials. Please check your username and password.",
        variant: "destructive"
      });
      console.error("Sign-in error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both username and password to continue.",
        variant: "destructive"
      });
      return;
    }
    signInMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-[#1d0d46] border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-white mb-2">Super Admin Portal</h1>
            <p className="text-white/60 text-sm">Sign in to manage global Q-worship resources</p>
          </div>
          
          <AuthSignInForm
            formData={formData}
            isPending={signInMutation.isPending}
            onInputChange={handleInputChange}
            onSubmit={handleSubmit}
            // Passing undefined explicitly to hide the "Switch to Sign Up" button if supported by the component
            onSwitchToSignUp={undefined as any}
          />
        </div>
      </div>
    </div>
  );
}
