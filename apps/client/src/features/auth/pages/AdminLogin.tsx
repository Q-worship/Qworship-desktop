import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Shield, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { apiRequest } from "@/lib/queryClient";
import qWorshipLogo from '@assets/Group 1_1753843572404.png';
import worshipServiceImage from '@assets/pexels-kinavizu-10538542_1753911438581.jpg';

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/admin/login', data);
      return await response.json();
    },
    onSuccess: (response) => {
      if (response.success) {
        toast({
          title: "Welcome Back!",
          description: `Successfully logged in`,
        });
        sessionStorage.setItem('qworship_admin', JSON.stringify(response.admin));
        if (response.admin.adminType === 'superadministrator') {
          setLocation('/superadmin');
        } else {
          setLocation('/admin-dashboard');
        }
      }
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: "Invalid email or password",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-3xl"></div>
      <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-6xl">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="text-white/70 hover:text-white hover:bg-white/10 p-2 h-auto">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Q-worship
              </Button>
            </Link>
          </div>

          <Card className="w-full bg-white/10 backdrop-blur-xl border-white/20 shadow-2xl overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
              {/* Left Side - Login Form */}
              <div className="p-8 lg:p-12 flex flex-col justify-center">
                <div className="space-y-8">
                  {/* Logo and Header */}
                  <div className="text-center space-y-6">
                    <div className="w-20 h-20 mx-auto mb-2 flex items-center justify-center bg-white/10 rounded-2xl">
                      <img 
                        src={qWorshipLogo} 
                        alt="Q-worship logo" 
                        className="w-12 h-12"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-center space-x-2 mb-4">
                        <Shield className="w-6 h-6 text-purple-400" />
                        <CardTitle className="text-2xl font-bold text-white [font-family:'Lufga-Medium',Helvetica]">
                          Admin Portal
                        </CardTitle>
                      </div>
                      <CardDescription className="text-white/70 [font-family:'Lufga-Regular',Helvetica] text-base">
                        Access Q-worship administrative features
                      </CardDescription>
                    </div>
                  </div>

                  {/* Login Form */}
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-white/90 [font-family:'Lufga-Medium',Helvetica]">
                          Admin Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="admin@qworship.com"
                          value={formData.email}
                          onChange={(e) => handleInputChange('email', e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:bg-white/15 [font-family:'Lufga-Regular',Helvetica] h-12"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password" className="text-white/90 [font-family:'Lufga-Medium',Helvetica]">
                          Password
                        </Label>
                        <div className="relative">
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Enter your admin password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-purple-400 focus:bg-white/15 [font-family:'Lufga-Regular',Helvetica] h-12 pr-12"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white/90 transition-colors"
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={loginMutation.isPending}
                      className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold [font-family:'Lufga-Medium',Helvetica] h-12 text-base shadow-lg transition-all duration-300 hover:shadow-xl"
                    >
                      {loginMutation.isPending ? (
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          <span>Signing In...</span>
                        </div>
                      ) : (
                        'Access Admin Portal'
                      )}
                    </Button>
                  </form>

                  <Separator className="bg-white/20" />

                  <div className="text-center space-y-3">
                    <p className="text-white/60 text-sm [font-family:'Lufga-Regular',Helvetica]">
                      Need admin access? Contact your system administrator
                    </p>
                    <div className="text-white/40 text-xs [font-family:'Lufga-Regular',Helvetica]">
                      Q-worship Admin Portal - Secure Access
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - Image */}
              <div className="hidden lg:block relative">
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                <img 
                  src={worshipServiceImage} 
                  alt="Worship Service" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent"></div>
              </div>
            </div>
          </Card>

          
        </div>
      </div>
    </div>
  );
}