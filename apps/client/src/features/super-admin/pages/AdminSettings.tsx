import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { 
  Settings, 
  CreditCard, 
  Shield, 
  Mail, 
  Database, 
  Key, 
  Save, 
  Eye, 
  EyeOff,
  CheckCircle,
  AlertTriangle 
} from 'lucide-react';

interface AdminConfig {
  stripe: {
    publicKey: string;
    secretKey: string;
    configured: boolean;
  };
  paypal: {
    clientId: string;
    clientSecret: string;
    configured: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: string;
    smtpUser: string;
    smtpPassword: string;
    configured: boolean;
  };
  general: {
    siteName: string;
    supportEmail: string;
    trialDays: number;
  };
}

export default function AdminSettings() {
  const { toast } = useToast();
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showPayPalSecret, setShowPayPalSecret] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);

  const { data: config, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/config'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/config');
      return response.json() as Promise<AdminConfig>;
    },
  });

  const configMutation = useMutation({
    mutationFn: async (configData: Partial<AdminConfig>) => {
      return await apiRequest('POST', '/api/admin/config', configData);
    },
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Configuration has been saved successfully.",
      });
      refetch();
    },
    onError: (error) => {
      console.error('Config update error:', error);
      toast({
        title: "Update Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleStripeConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const publicKey = formData.get('publicKey') as string;
    const secretKey = formData.get('secretKey') as string;

    if (!publicKey || !secretKey) {
      toast({
        title: "Missing Keys",
        description: "Both Stripe keys are required.",
        variant: "destructive",
      });
      return;
    }

    if (!publicKey.startsWith('pk_') || !secretKey.startsWith('sk_')) {
      toast({
        title: "Invalid Keys",
        description: "Please check your Stripe API keys format.",
        variant: "destructive",
      });
      return;
    }

    configMutation.mutate({
      stripe: {
        publicKey,
        secretKey,
        configured: true,
      },
    });
  };

  const handlePayPalConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const clientId = formData.get('clientId') as string;
    const clientSecret = formData.get('clientSecret') as string;

    if (!clientId || !clientSecret) {
      toast({
        title: "Missing Keys",
        description: "Both PayPal Client ID and Secret are required.",
        variant: "destructive",
      });
      return;
    }

    configMutation.mutate({
      paypal: {
        clientId,
        clientSecret,
        configured: true,
      },
    });
  };

  const handleEmailConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const smtpHost = formData.get('smtpHost') as string;
    const smtpPort = formData.get('smtpPort') as string;
    const smtpUser = formData.get('smtpUser') as string;
    const smtpPassword = formData.get('smtpPassword') as string;

    configMutation.mutate({
      email: {
        smtpHost,
        smtpPort,
        smtpUser,
        smtpPassword,
        configured: !!(smtpHost && smtpPort && smtpUser && smtpPassword),
      },
    });
  };

  const handleGeneralConfigSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const siteName = formData.get('siteName') as string;
    const supportEmail = formData.get('supportEmail') as string;
    const trialDays = parseInt(formData.get('trialDays') as string);

    configMutation.mutate({
      general: {
        siteName,
        supportEmail,
        trialDays,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white [font-family:'Lufga-Bold',Helvetica]">
              Admin Settings
            </h2>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700/50" />
            <div className="h-32 bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700/50" />
            <div className="h-32 bg-gray-800/50 backdrop-blur rounded-lg border border-gray-700/50" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white [font-family:'Lufga-Bold',Helvetica]">
              Admin Settings
            </h2>
          </div>
          <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
            Q-worship Configuration
          </Badge>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 gap-1 lg:gap-0 bg-gray-800/50 backdrop-blur border border-gray-700/50 p-1 h-auto">
            <TabsTrigger 
              value="payments" 
              className="flex items-center justify-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-3 text-xs lg:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-300 hover:text-white transition-colors rounded-md whitespace-nowrap"
            >
              <CreditCard className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Payments</span>
              <span className="sm:hidden">Pay</span>
            </TabsTrigger>
            <TabsTrigger 
              value="email" 
              className="flex items-center justify-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-3 text-xs lg:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-300 hover:text-white transition-colors rounded-md whitespace-nowrap"
            >
              <Mail className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger 
              value="general" 
              className="flex items-center justify-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-3 text-xs lg:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-300 hover:text-white transition-colors rounded-md whitespace-nowrap"
            >
              <Database className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger 
              value="security" 
              className="flex items-center justify-center space-x-1 lg:space-x-2 px-2 lg:px-4 py-3 text-xs lg:text-sm data-[state=active]:bg-cyan-500/20 data-[state=active]:text-cyan-400 text-gray-300 hover:text-white transition-colors rounded-md whitespace-nowrap"
            >
              <Shield className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="hidden sm:inline">Security</span>
              <span className="sm:hidden">Sec</span>
            </TabsTrigger>
          </TabsList>

          {/* Payment Settings */}
          <TabsContent value="payments" className="space-y-6">
            {/* Stripe Configuration */}
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-green-900/20 to-emerald-900/20 border-b border-gray-700/50 mt-[0px] mb-[0px]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <CreditCard className="w-5 h-5 text-green-400" />
                      <span>Stripe Payment Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Configure Stripe API keys to enable payment processing for Q-worship subscriptions
                    </CardDescription>
                  </div>
                  {config?.stripe?.configured ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="bg-gray-900/30">
                <form onSubmit={handleStripeConfigSave} className="space-y-6">
                  <Alert className="border-cyan-500/30 bg-cyan-500/10 mt-[21px] mb-[21px]">
                    <Key className="h-4 w-4 text-cyan-400" />
                    <AlertDescription className="text-gray-300">
                      Get your Stripe API keys from{' '}
                      <a 
                        href="https://dashboard.stripe.com/apikeys" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:underline"
                      >
                        your Stripe dashboard
                      </a>
                      . The secret key will be encrypted and secured.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="publicKey" className="text-gray-200">Publishable Key (pk_...)</Label>
                      <Input
                        id="publicKey"
                        name="publicKey"
                        type="text"
                        placeholder="pk_test_..."
                        defaultValue={config?.stripe?.publicKey || ''}
                        className="mt-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Safe to use in client-side code. Used for Stripe Elements.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="secretKey" className="text-gray-200">Secret Key (sk_...)</Label>
                      <div className="relative">
                        <Input
                          id="secretKey"
                          name="secretKey"
                          type={showStripeSecret ? "text" : "password"}
                          placeholder="sk_test_..."
                          defaultValue={config?.stripe?.secretKey || ''}
                          className="mt-1 pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1 h-7 w-7 p-0 text-gray-400 hover:text-white"
                          onClick={() => setShowStripeSecret(!showStripeSecret)}
                        >
                          {showStripeSecret ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Keep this secure. Used for server-side payment processing.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={configMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {configMutation.isPending ? 'Saving...' : 'Save Stripe Configuration'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* PayPal Configuration */}
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-b border-gray-700/50 mt-[0px] mb-[0px]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold text-xs">PP</span>
                      </div>
                      <span>PayPal Payment Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Configure PayPal API credentials to enable PayPal payments for Q-worship subscriptions
                    </CardDescription>
                  </div>
                  {config?.paypal?.configured ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="bg-gray-900/30">
                <form onSubmit={handlePayPalConfigSave} className="space-y-6">
                  <Alert className="border-blue-500/30 bg-blue-500/10 mt-[21px] mb-[21px]">
                    <Key className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-gray-300">
                      Get your PayPal API credentials from{' '}
                      <a 
                        href="https://developer.paypal.com/developer/applications/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        PayPal Developer Dashboard
                      </a>
                      . Create a new application to get your Client ID and Secret.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="paypalClientId" className="text-gray-200">Client ID</Label>
                      <Input
                        id="paypalClientId"
                        name="clientId"
                        type="text"
                        placeholder="AXxxxxxxxxxxxxxxxxxxx"
                        defaultValue={config?.paypal?.clientId || ''}
                        className="mt-1 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        Public identifier for your PayPal application.
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="paypalClientSecret" className="text-gray-200">Client Secret</Label>
                      <div className="relative">
                        <Input
                          id="paypalClientSecret"
                          name="clientSecret"
                          type={showPayPalSecret ? "text" : "password"}
                          placeholder="EXxxxxxxxxxxxxxxxxxxx"
                          defaultValue={config?.paypal?.clientSecret || ''}
                          className="mt-1 pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-1 h-7 w-7 p-0 text-gray-400 hover:text-white"
                          onClick={() => setShowPayPalSecret(!showPayPalSecret)}
                        >
                          {showPayPalSecret ? (
                            <EyeOff className="h-3 w-3" />
                          ) : (
                            <Eye className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Keep this secure. Used for server-side PayPal API calls.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={configMutation.isPending}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {configMutation.isPending ? 'Saving...' : 'Save PayPal Configuration'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email">
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-purple-900/20 to-pink-900/20 border-b border-gray-700/50 mt-[0px] mb-[0px]">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2 text-white">
                      <Mail className="w-5 h-5 text-purple-400" />
                      <span>Email Configuration</span>
                    </CardTitle>
                    <CardDescription className="text-gray-300">
                      Configure SMTP settings for sending welcome emails, trial notifications, and system alerts
                    </CardDescription>
                  </div>
                  {config?.email?.configured ? (
                    <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Configured
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Not Configured
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="bg-gray-900/30">
                <form onSubmit={handleEmailConfigSave} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpHost" className="text-gray-200">SMTP Host</Label>
                      <Input
                        id="smtpHost"
                        name="smtpHost"
                        placeholder="smtp.gmail.com"
                        defaultValue={config?.email?.smtpHost || ''}
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort" className="text-gray-200">SMTP Port</Label>
                      <Input
                        id="smtpPort"
                        name="smtpPort"
                        placeholder="587"
                        defaultValue={config?.email?.smtpPort || ''}
                        className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="smtpUser" className="text-gray-200">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      name="smtpUser"
                      placeholder="your-email@domain.com"
                      defaultValue={config?.email?.smtpUser || ''}
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="smtpPassword" className="text-gray-200">SMTP Password</Label>
                    <div className="relative">
                      <Input
                        id="smtpPassword"
                        name="smtpPassword"
                        type={showEmailPassword ? "text" : "password"}
                        placeholder="App password or SMTP password"
                        defaultValue={config?.email?.smtpPassword || ''}
                        className="pr-10 bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-9 w-9 p-0 text-gray-400 hover:text-white"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                      >
                        {showEmailPassword ? (
                          <EyeOff className="h-3 w-3" />
                        ) : (
                          <Eye className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={configMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {configMutation.isPending ? 'Saving...' : 'Save Email Configuration'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-orange-900/20 to-yellow-900/20 border-b border-gray-700/50 mt-[0px] mb-[0px]">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Database className="w-5 h-5 text-orange-400" />
                  <span>General Settings</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Configure general application settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-gray-900/30">
                <form onSubmit={handleGeneralConfigSave} className="space-y-4">
                  <div>
                    <Label htmlFor="siteName" className="text-gray-200">Site Name</Label>
                    <Input
                      id="siteName"
                      name="siteName"
                      placeholder="Q-worship"
                      defaultValue={config?.general?.siteName || ''}
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="supportEmail" className="text-gray-200">Support Email</Label>
                    <Input
                      id="supportEmail"
                      name="supportEmail"
                      type="email"
                      placeholder="support@qworship.com"
                      defaultValue={config?.general?.supportEmail || ''}
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="trialDays" className="text-gray-200">Trial Period (Days)</Label>
                    <Input
                      id="trialDays"
                      name="trialDays"
                      type="number"
                      placeholder="30"
                      defaultValue={config?.general?.trialDays || 30}
                      className="bg-gray-800/50 border-gray-600 text-white placeholder-gray-400"
                    />
                  </div>

                  <Button 
                    type="submit" 
                    disabled={configMutation.isPending}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {configMutation.isPending ? 'Saving...' : 'Save General Settings'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-gray-800/50 backdrop-blur border-gray-700/50 shadow-2xl">
              <CardHeader className="bg-gradient-to-r from-red-900/20 to-pink-900/20 border-b border-gray-700/50 mt-[0px] mb-[0px]">
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Shield className="w-5 h-5 text-red-400" />
                  <span>Security Settings</span>
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Security configuration and access controls
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-gray-900/30">
                <Alert className="border-red-500/30 bg-red-500/10 mt-[16px] mb-[16px]">
                  <Shield className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-gray-300">
                    SuperAdmin access is currently protected with admin key: <code className="bg-gray-800 px-2 py-1 rounded text-cyan-400">qworship-superadmin-2025</code>
                    <br />
                    All sensitive data is encrypted and stored securely.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}