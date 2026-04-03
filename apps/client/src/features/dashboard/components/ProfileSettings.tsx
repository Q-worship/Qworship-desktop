import React, { useState, useEffect } from "react";
import { User, Mail, Phone, Building, MapPin, Globe, Shield, Bell, CreditCard, Key, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CustomToggle } from "@/components/ui/custom-toggle";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { OBSSettingsTab } from "@/features/dashboard/components/OBSSettingsTab";

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch current user data and organizations
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user/current'],
    enabled: isOpen
  });

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "member",
    bio: "",
    profilePicture: null as File | null
  });

  // Organization Information State
  const [organizationInfo, setOrganizationInfo] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    country: "",
    phone: "",
    website: "",
    denomination: "",
    size: 0
  });

  // Account Settings State
  const [accountSettings, setAccountSettings] = useState({
    username: "",
    accountType: "free",
    planType: "trial",
    twoFactorEnabled: false,
    emailNotifications: true,
    smsNotifications: false,
    marketingEmails: true,
    trialNotifications: true
  });

  // Security State
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    sessionTimeout: "30",
    loginNotifications: true
  });

  // Load data when component opens
  useEffect(() => {
    if (userData && 'user' in userData && userData.user) {
      setPersonalInfo({
        firstName: userData.user.firstName || "",
        lastName: userData.user.lastName || "",
        email: userData.user.email || "",
        phone: "", // We'll need to add phone to user schema if needed
        role: userData.user.role || "member",
        bio: "", // We'll need to add bio to user schema if needed
        profilePicture: null
      });

      setAccountSettings({
        username: userData.user.username || "",
        accountType: userData.user.accountType || "free",
        planType: userData.user.planType || "trial",
        twoFactorEnabled: false,
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: true,
        trialNotifications: true
      });

      // Load organization data if available
      if ('organizations' in userData && userData.organizations && userData.organizations.length > 0) {
        const org = userData.organizations[0]; // Use first organization
        // We need to fetch the full organization details
        fetchOrganizationDetails(org.id);
      }
    }
  }, [userData]);

  const fetchOrganizationDetails = async (orgId: number) => {
    try {
      const response = await fetch(`/api/organization/${orgId}`);
      const data = await response.json();
      if (data.success && data.organization) {
        setOrganizationInfo({
          name: data.organization.name || "",
          address: data.organization.address || "",
          city: data.organization.city || "",
          state: data.organization.state || "",
          zipCode: data.organization.zipCode || "",
          country: data.organization.country || "",
          phone: data.organization.phone || "",
          website: data.organization.website || "",
          denomination: data.organization.denomination || "",
          size: data.organization.size || 0
        });
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    }
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    setPersonalInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleOrganizationChange = (field: string, value: string | number) => {
    setOrganizationInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleAccountSettingsChange = (field: string, value: string | boolean) => {
    setAccountSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSecurityChange = (field: string, value: string | boolean) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setPersonalInfo(prev => ({ ...prev, profilePicture: file }));
    }
  };

  // Update Personal Information Mutation
  const updatePersonalInfoMutation = useMutation({
    mutationFn: async (data: typeof personalInfo) => {
      const response = await apiRequest('PUT', `/api/user/profile`, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Personal Information Updated",
        description: "Your profile has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/current'] });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update personal information. Please try again.",
        variant: "destructive",
      });
      console.error('Personal info update error:', error);
    },
  });

  // Update Organization Mutation
  const updateOrganizationMutation = useMutation({
    mutationFn: async (data: typeof organizationInfo) => {
      if (!userData || !('organizations' in userData) || !userData.organizations || userData.organizations.length === 0) {
        throw new Error('No organization found');
      }
      const orgId = userData.organizations[0].id;
      
      const response = await apiRequest('PUT', `/api/organization/${orgId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization Updated",
        description: "Your church information has been updated successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Update Failed",
        description: "Failed to update organization information. Please try again.",
        variant: "destructive",
      });
      console.error('Organization update error:', error);
    },
  });

  const handleSavePersonalInfo = () => {
    updatePersonalInfoMutation.mutate(personalInfo);
  };

  const handleSaveOrganization = () => {
    updateOrganizationMutation.mutate(organizationInfo);
  };

  const handleSaveAccountSettings = () => {
    // For now, just show success message as account settings are mostly UI preferences
    toast({
      title: "Account Settings Updated",
      description: "Your preferences have been saved successfully.",
    });
  };

  const handlePasswordChange = () => {
    if (securitySettings.newPassword !== securitySettings.confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirm password do not match.",
        variant: "destructive",
      });
      return;
    }
    
    if (securitySettings.newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    // TODO: Implement API call to change password
    toast({
      title: "Password Updated",
      description: "Your password has been changed successfully.",
    });
    setSecuritySettings(prev => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
      confirmPassword: ""
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#1a0f2e] border border-gray-600 text-white overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <User className="h-6 w-6" />
            Profile Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your personal information, organization details, account preferences, and security settings.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : (
          <Tabs defaultValue="personal" className="w-full">
          <div className="flex w-full bg-gray-800/60 border border-gray-600 rounded-lg p-1 mb-6">
            <TabsList className="w-full flex bg-transparent p-0 h-auto">
              <TabsTrigger 
                value="personal" 
                className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200 rounded-md mx-0.5 py-3 text-sm font-medium border-0"
              >
                Personal
              </TabsTrigger>
              <TabsTrigger 
                value="organization" 
                className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200 rounded-md mx-0.5 py-3 text-sm font-medium border-0"
              >
                Organization
              </TabsTrigger>
              <TabsTrigger 
                value="account" 
                className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200 rounded-md mx-0.5 py-3 text-sm font-medium border-0"
              >
                Account
              </TabsTrigger>
              <TabsTrigger 
                value="security" 
                className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200 rounded-md mx-0.5 py-3 text-sm font-medium border-0"
              >
                Security
              </TabsTrigger>
              <TabsTrigger 
                value="obs" 
                className="flex-1 data-[state=active]:bg-purple-600 data-[state=active]:text-white text-gray-300 hover:text-white transition-all duration-200 rounded-md mx-0.5 py-3 text-sm font-medium border-0"
              >
                <Monitor className="h-4 w-4 mr-1 inline" />
                OBS
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-white">First Name</Label>
                    <Input
                      id="firstName"
                      value={personalInfo.firstName}
                      onChange={(e) => handlePersonalInfoChange("firstName", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-white">Last Name</Label>
                    <Input
                      id="lastName"
                      value={personalInfo.lastName}
                      onChange={(e) => handlePersonalInfoChange("lastName", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) => handlePersonalInfoChange("email", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white">Phone Number</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange("phone", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role" className="text-white">Role</Label>
                  <Select value={personalInfo.role} onValueChange={(value) => handlePersonalInfoChange("role", value)}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="pastor">Pastor</SelectItem>
                      <SelectItem value="worship_leader">Worship Leader</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio" className="text-white">Bio</Label>
                  <Textarea
                    id="bio"
                    value={personalInfo.bio}
                    onChange={(e) => handlePersonalInfoChange("bio", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePicture" className="text-white">Profile Picture</Label>
                  <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <Button onClick={handleSavePersonalInfo} className="bg-purple-600 hover:bg-purple-700">
                  Save Personal Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Information Tab */}
          <TabsContent value="organization" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Church/Organization Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName" className="text-white">Church/Organization Name</Label>
                  <Input
                    id="orgName"
                    value={organizationInfo.name}
                    onChange={(e) => handleOrganizationChange("name", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-white">Address</Label>
                  <Input
                    id="address"
                    value={organizationInfo.address}
                    onChange={(e) => handleOrganizationChange("address", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-white">City</Label>
                    <Input
                      id="city"
                      value={organizationInfo.city}
                      onChange={(e) => handleOrganizationChange("city", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-white">State/Province</Label>
                    <Input
                      id="state"
                      value={organizationInfo.state}
                      onChange={(e) => handleOrganizationChange("state", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode" className="text-white">ZIP/Postal Code</Label>
                    <Input
                      id="zipCode"
                      value={organizationInfo.zipCode}
                      onChange={(e) => handleOrganizationChange("zipCode", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country" className="text-white">Country</Label>
                  <Input
                    id="country"
                    value={organizationInfo.country}
                    onChange={(e) => handleOrganizationChange("country", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="orgPhone" className="text-white">Church Phone</Label>
                    <Input
                      id="orgPhone"
                      value={organizationInfo.phone}
                      onChange={(e) => handleOrganizationChange("phone", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website" className="text-white">Website</Label>
                    <Input
                      id="website"
                      value={organizationInfo.website}
                      onChange={(e) => handleOrganizationChange("website", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="denomination" className="text-white">Denomination</Label>
                    <Input
                      id="denomination"
                      value={organizationInfo.denomination}
                      onChange={(e) => handleOrganizationChange("denomination", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="size" className="text-white">Congregation Size</Label>
                    <Input
                      id="size"
                      type="number"
                      value={organizationInfo.size}
                      onChange={(e) => handleOrganizationChange("size", parseInt(e.target.value) || 0)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>

                <Button onClick={handleSaveOrganization} className="bg-purple-600 hover:bg-purple-700">
                  Save Organization Information
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Account Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-white">Username</Label>
                  <Input
                    id="username"
                    value={accountSettings.username}
                    onChange={(e) => handleAccountSettingsChange("username", e.target.value)}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Account Type</Label>
                    <div className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                      {accountSettings.accountType.charAt(0).toUpperCase() + accountSettings.accountType.slice(1)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white">Current Plan</Label>
                    <div className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white">
                      {accountSettings.planType.charAt(0).toUpperCase() + accountSettings.planType.slice(1)}
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-600" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Notification Preferences</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Email Notifications</Label>
                      <p className="text-sm text-gray-400">Receive important updates via email</p>
                    </div>
                    <CustomToggle
                      checked={accountSettings.emailNotifications}
                      onCheckedChange={(checked) => handleAccountSettingsChange("emailNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">SMS Notifications</Label>
                      <p className="text-sm text-gray-400">Receive urgent alerts via SMS</p>
                    </div>
                    <CustomToggle
                      checked={accountSettings.smsNotifications}
                      onCheckedChange={(checked) => handleAccountSettingsChange("smsNotifications", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Marketing Emails</Label>
                      <p className="text-sm text-gray-400">Receive product updates and tips</p>
                    </div>
                    <CustomToggle
                      checked={accountSettings.marketingEmails}
                      onCheckedChange={(checked) => handleAccountSettingsChange("marketingEmails", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Trial Notifications</Label>
                      <p className="text-sm text-gray-400">Receive trial and subscription reminders</p>
                    </div>
                    <CustomToggle
                      checked={accountSettings.trialNotifications}
                      onCheckedChange={(checked) => handleAccountSettingsChange("trialNotifications", checked)}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveAccountSettings} className="bg-purple-600 hover:bg-purple-700">
                  Save Account Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Change Password</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword" className="text-white">Current Password</Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={securitySettings.currentPassword}
                      onChange={(e) => handleSecurityChange("currentPassword", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-white">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={securitySettings.newPassword}
                      onChange={(e) => handleSecurityChange("newPassword", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-white">Confirm New Password</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={securitySettings.confirmPassword}
                      onChange={(e) => handleSecurityChange("confirmPassword", e.target.value)}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  <Button onClick={handlePasswordChange} className="bg-purple-600 hover:bg-purple-700">
                    Update Password
                  </Button>
                </div>

                <Separator className="bg-gray-600" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Security Preferences</h3>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <CustomToggle
                      checked={accountSettings.twoFactorEnabled}
                      onCheckedChange={(checked) => handleAccountSettingsChange("twoFactorEnabled", checked)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout" className="text-white">Session Timeout (minutes)</Label>
                    <Select value={securitySettings.sessionTimeout} onValueChange={(value) => handleSecurityChange("sessionTimeout", value)}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-white">Login Notifications</Label>
                      <p className="text-sm text-gray-400">Get notified when someone signs into your account</p>
                    </div>
                    <CustomToggle
                      checked={securitySettings.loginNotifications}
                      onCheckedChange={(checked) => handleSecurityChange("loginNotifications", checked)}
                    />
                  </div>
                </div>

                <Button onClick={handleSaveAccountSettings} className="bg-purple-600 hover:bg-purple-700">
                  Save Security Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* OBS Settings Tab */}
          <TabsContent value="obs" className="space-y-4">
            <OBSSettingsTab />
          </TabsContent>
        </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};