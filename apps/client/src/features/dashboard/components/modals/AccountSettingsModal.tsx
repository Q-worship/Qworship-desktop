import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Lock, CreditCard, Building, Shield, LogOut, Receipt, Calendar, CheckCircle, Clock, XCircle, Smartphone, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentHistoryItem {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  invoice: string;
  description: string;
}

export function AccountSettingsModal({ isOpen, onClose }: AccountSettingsModalProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [email, setEmail] = useState(user?.email || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isEditingOrganization, setIsEditingOrganization] = useState(false);
  const [organizationName, setOrganizationName] = useState(user?.organizationName || "");
  const [isBillingHistoryOpen, setIsBillingHistoryOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  
  const secretKey = "QWRS-HFBK-7M4X-PLNT";

  const { data: paymentHistory, isLoading: isLoadingPayments } = useQuery<PaymentHistoryItem[]>({
    queryKey: ['/api/payments/history'],
    enabled: isBillingHistoryOpen
  });

  const handleViewPlans = () => {
    onClose();
    setLocation('/pricing');
  };

  const handleCopySecret = () => {
    navigator.clipboard.writeText(secretKey);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
    toast({
      title: "Copied!",
      description: "Secret key copied to clipboard.",
      className: "bg-[#8356f3] text-white",
    });
  };

  const handleVerify2FA = () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    
    setIs2FAEnabled(true);
    setIs2FAModalOpen(false);
    setVerificationCode("");
    toast({
      title: "2FA Enabled",
      description: "Two-factor authentication has been enabled for your account.",
      className: "bg-[#8356f3] text-white",
    });
  };

  const handleDisable2FA = () => {
    setIs2FAEnabled(false);
    toast({
      title: "2FA Disabled",
      description: "Two-factor authentication has been disabled.",
      className: "bg-[#8356f3] text-white",
    });
  };

  const handleSaveProfile = () => {
    toast({
      title: "Profile Updated",
      description: "Your profile information has been saved successfully.",
      className: "bg-[#8356f3] text-white",
    });
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match.",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Password Changed",
      description: "Your password has been updated successfully.",
      className: "bg-[#8356f3] text-white",
    });
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setLocation('/login');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveOrganization = async () => {
    try {
      await apiRequest('PATCH', '/api/user/profile', { organizationName });
      toast({
        title: "Organization Updated",
        description: "Your organization name has been saved successfully.",
        className: "bg-[#8356f3] text-white",
      });
      setIsEditingOrganization(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update organization. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-5xl w-[92vw] h-[85vh] max-h-[800px] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
        data-testid="modal-account-settings"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
          <DialogTitle className="text-xl font-bold text-[#C77DFF]">
            Account Settings
          </DialogTitle>
          <DialogDescription className="text-gray-400">
            Manage your account information, security settings, and subscription
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-8 max-w-3xl">
            {/* Profile Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <User className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Profile Information</h3>
                  <p className="text-sm text-gray-400">Update your personal details</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                    <Label className="text-white font-medium mb-2 block">First Name</Label>
                    <Input
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="bg-[#0f0920] border-gray-600 text-white"
                      placeholder="Enter first name"
                      data-testid="input-first-name"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                    <Label className="text-white font-medium mb-2 block">Last Name</Label>
                    <Input
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="bg-[#0f0920] border-gray-600 text-white"
                      placeholder="Enter last name"
                      data-testid="input-last-name"
                    />
                  </div>
                </div>
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <Label className="text-white font-medium">Email Address</Label>
                  </div>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-[#0f0920] border-gray-600 text-white"
                    placeholder="Enter email address"
                    data-testid="input-email"
                  />
                </div>
                <Button
                  onClick={handleSaveProfile}
                  className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
                  data-testid="button-save-profile"
                >
                  Save Profile
                </Button>
              </div>
            </div>

            {/* Password & Security */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Password & Security</h3>
                  <p className="text-sm text-gray-400">Manage your password and security settings</p>
                </div>
              </div>
              <div className="ml-13 pl-10 space-y-4">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <Label className="text-white font-medium mb-2 block">Current Password</Label>
                  <Input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-[#0f0920] border-gray-600 text-white"
                    placeholder="Enter current password"
                    data-testid="input-current-password"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                    <Label className="text-white font-medium mb-2 block">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="bg-[#0f0920] border-gray-600 text-white"
                      placeholder="Enter new password"
                      data-testid="input-new-password"
                    />
                  </div>
                  <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                    <Label className="text-white font-medium mb-2 block">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="bg-[#0f0920] border-gray-600 text-white"
                      placeholder="Confirm new password"
                      data-testid="input-confirm-password"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
                  data-testid="button-change-password"
                >
                  Change Password
                </Button>
              </div>
            </div>

            {/* Organization */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Organization</h3>
                  <p className="text-sm text-gray-400">Your church or organization details</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  {isEditingOrganization ? (
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-medium mb-2 block">Organization Name</Label>
                        <Input
                          value={organizationName}
                          onChange={(e) => setOrganizationName(e.target.value)}
                          className="bg-[#0f0920] border-gray-600 text-white"
                          placeholder="Enter organization name"
                          data-testid="input-organization-name"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button
                          onClick={handleSaveOrganization}
                          className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
                          data-testid="button-save-organization"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setIsEditingOrganization(false);
                            setOrganizationName(user?.organizationName || "");
                          }}
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          data-testid="button-cancel-organization"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{organizationName || user?.organizationName || "No Organization"}</p>
                        <p className="text-sm text-gray-400">Member since account creation</p>
                      </div>
                      <Button
                        onClick={() => setIsEditingOrganization(true)}
                        className="bg-[#2d1f4e] border border-purple-600/30 text-purple-300 hover:bg-[#3a2963] hover:text-purple-200"
                        data-testid="button-manage-organization"
                      >
                        Manage
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Subscription */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Subscription</h3>
                  <p className="text-sm text-gray-400">Manage your subscription and billing</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-white font-medium">Current Plan</p>
                      <p className="text-purple-400 font-semibold text-lg">{user?.accountType || "Free Trial"}</p>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-sm">
                      Active
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleViewPlans}
                      className="bg-[#2d1f4e] border border-purple-600/30 text-purple-300 hover:bg-[#3a2963] hover:text-purple-200"
                      data-testid="button-view-plans"
                    >
                      View Plans
                    </Button>
                    <Button
                      onClick={() => setIsBillingHistoryOpen(true)}
                      className="bg-[#2d1f4e] border border-purple-600/30 text-purple-300 hover:bg-[#3a2963] hover:text-purple-200"
                      data-testid="button-billing-history"
                    >
                      Billing History
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
                  <p className="text-sm text-gray-400">Add an extra layer of security</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <div className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-400">
                        {is2FAEnabled ? "Currently enabled" : "Currently disabled"}
                      </p>
                    </div>
                    {is2FAEnabled ? (
                      <Button
                        onClick={handleDisable2FA}
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600/20"
                        data-testid="button-disable-2fa"
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        onClick={() => setIs2FAModalOpen(true)}
                        className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
                        data-testid="button-enable-2fa"
                      >
                        Enable
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Logout */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-600/20 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Sign Out</h3>
                  <p className="text-sm text-gray-400">Sign out of your account</p>
                </div>
              </div>
              <div className="ml-13 pl-10">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600/20"
                  data-testid="button-logout"
                >
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0">
          <Button
            onClick={onClose}
            className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
            data-testid="button-close-account-settings"
          >
            Close
          </Button>
        </div>
      </DialogContent>

      {/* Billing History Modal */}
      <Dialog open={isBillingHistoryOpen} onOpenChange={(open) => !open && setIsBillingHistoryOpen(false)}>
        <DialogContent 
          className="max-w-3xl w-[85vw] h-[70vh] max-h-[600px] bg-[#0f0920] border-gray-700 p-0 flex flex-col"
          data-testid="modal-billing-history"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#C77DFF]">
                  Billing History
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  View your payment history and invoices
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            {isLoadingPayments ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-gray-400">Loading payment history...</div>
              </div>
            ) : paymentHistory && paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment) => (
                  <div 
                    key={payment.id}
                    className="p-4 rounded-lg bg-[#1a0f2e] border border-gray-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-purple-600/10 flex items-center justify-center">
                        {payment.status === 'completed' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : payment.status === 'pending' ? (
                          <Clock className="w-5 h-5 text-yellow-400" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-400" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{payment.description || 'Subscription Payment'}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(payment.date).toLocaleDateString('en-GB', { 
                            day: 'numeric', 
                            month: 'short', 
                            year: 'numeric' 
                          })}</span>
                          <span>•</span>
                          <span>{payment.method}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">£{payment.amount.toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        payment.status === 'completed' 
                          ? 'bg-green-500/20 text-green-400' 
                          : payment.status === 'pending'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-full bg-purple-600/10 flex items-center justify-center mb-4">
                  <Receipt className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">No Billing History</h3>
                <p className="text-gray-400 max-w-sm">
                  You don't have any payment history yet. Your billing records will appear here once you subscribe to a plan.
                </p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-gray-700/50 flex-shrink-0 flex justify-end">
            <Button
              onClick={() => setIsBillingHistoryOpen(false)}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white"
              data-testid="button-close-billing-history"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Modal */}
      <Dialog open={is2FAModalOpen} onOpenChange={(open) => !open && setIs2FAModalOpen(false)}>
        <DialogContent 
          className="max-w-lg w-[90vw] bg-[#0f0920] border-gray-700 p-0"
          data-testid="modal-2fa-setup"
        >
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-gray-700/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-[#C77DFF]">
                  Enable Two-Factor Authentication
                </DialogTitle>
                <DialogDescription className="text-gray-400">
                  Secure your account with an authenticator app
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Step 1: Download App */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  1
                </div>
                <h4 className="text-white font-medium">Download an authenticator app</h4>
              </div>
              <p className="text-sm text-gray-400 ml-8">
                Download Google Authenticator, Microsoft Authenticator, or any TOTP-compatible app on your mobile device.
              </p>
            </div>

            {/* Step 2: Add Account */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  2
                </div>
                <h4 className="text-white font-medium">Add your Q-worship account</h4>
              </div>
              <div className="ml-8 space-y-3">
                <p className="text-sm text-gray-400">
                  Open your authenticator app and add a new account using this secret key:
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-[#1a0f2e] border border-gray-700 font-mono text-purple-300 text-center tracking-wider">
                    {secretKey}
                  </div>
                  <Button
                    onClick={handleCopySecret}
                    variant="outline"
                    size="icon"
                    className="border-gray-600 text-gray-400 hover:text-white hover:bg-purple-600/20"
                    data-testid="button-copy-secret"
                  >
                    {copiedSecret ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>

            {/* Step 3: Verify */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-medium">
                  3
                </div>
                <h4 className="text-white font-medium">Verify your setup</h4>
              </div>
              <div className="ml-8 space-y-3">
                <p className="text-sm text-gray-400">
                  Enter the 6-digit code from your authenticator app:
                </p>
                <Input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="bg-[#1a0f2e] border-gray-700 text-white text-center tracking-[0.5em] font-mono text-lg"
                  maxLength={6}
                  data-testid="input-2fa-code"
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-700/50 flex justify-end gap-3">
            <Button
              onClick={() => {
                setIs2FAModalOpen(false);
                setVerificationCode("");
              }}
              variant="outline"
              className="border-gray-600 text-gray-400 hover:text-white"
              data-testid="button-cancel-2fa"
            >
              Cancel
            </Button>
            <Button
              onClick={handleVerify2FA}
              disabled={verificationCode.length !== 6}
              className="bg-[#6366f1] hover:bg-[#5558e3] text-white disabled:opacity-50"
              data-testid="button-verify-2fa"
            >
              Verify & Enable
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
