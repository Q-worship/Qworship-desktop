import React, { useState } from "react";
import { CreditCard, Calendar, AlertTriangle, CheckCircle, Crown, Zap, Shield, X } from "lucide-react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SubscriptionManagementProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentHistory {
  id: string;
  date: string;
  amount: number;
  status: 'completed' | 'pending' | 'failed';
  method: string;
  invoice: string;
}

interface SubscriptionData {
  planType: string;
  accountType: string;
  trialStartDate?: string;
  trialEndDate?: string;
  nextBillingDate?: string;
  amount?: number;
  status: 'active' | 'trial' | 'expired' | 'cancelled';
}

export const SubscriptionManagement: React.FC<SubscriptionManagementProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');
  const [isYearly, setIsYearly] = useState(false);

  // Fetch current user subscription data
  const { data: userData, isLoading } = useQuery({
    queryKey: ['/api/user/current'],
    enabled: isOpen
  });

  // Fetch payment history
  const { data: paymentHistory } = useQuery({
    queryKey: ['/api/payments/history'],
    enabled: isOpen
  });

  // Cancel subscription mutation
  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/cancel');
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Subscription Cancelled",
        description: "Your subscription has been cancelled. You'll retain access until the end of your billing period.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/current'] });
      setShowCancelDialog(false);
    },
    onError: () => {
      toast({
        title: "Cancellation Failed",
        description: "Unable to cancel subscription. Please contact support.",
        variant: "destructive",
      });
    },
  });

  // Handle upgrade plan selection - redirect to payment page
  const handleUpgradePlan = (planId: string) => {
    if (!planId) {
      toast({
        title: "Please Select a Plan",
        description: "Choose a plan to continue with the upgrade.",
        variant: "destructive",
      });
      return;
    }

    // Map our plan IDs to the existing payment system
    const planMapping: { [key: string]: string } = {
      'essential': 'trial',
      'professional': 'gold', 
      'enterprise': 'premium'
    };

    const mappedPlan = planMapping[planId] || planId;
    const billingPeriod = isYearly ? 'yearly' : 'monthly';
    
    // Get current user ID for payment processing
    const userId = userData?.user?.id || '1';
    
    // Close the upgrade dialog
    setShowUpgradeDialog(false);
    onClose();
    
    // Redirect to payment page with selected plan details
    setLocation(`/checkout?plan=${mappedPlan}&billing=${billingPeriod}&userId=${userId}&upgrade=true`);
  };

  const getSubscriptionData = (): SubscriptionData => {
    if (!userData?.success || !userData?.user) {
      return { planType: 'trial', accountType: 'free', status: 'trial' };
    }

    const user = userData.user;
    const now = new Date();
    const trialEnd = user.trialEndDate ? new Date(user.trialEndDate) : null;
    
    let status: SubscriptionData['status'] = 'active';
    
    // For testing: If user has a trial but we want to show cancel functionality,
    // we can temporarily simulate a paid subscription
    const hasTestPaidPlan = user.planType === 'premium' || user.planType === 'professional' || user.planType === 'enterprise';
    
    if (user.planType === 'trial' && !hasTestPaidPlan) {
      status = trialEnd && now > trialEnd ? 'expired' : 'trial';
    } else if (hasTestPaidPlan) {
      status = 'active'; // Paid subscription is active
    }

    return {
      planType: user.planType || 'trial',
      accountType: user.accountType || 'free',
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      nextBillingDate: hasTestPaidPlan ? '2025-02-15' : undefined,
      amount: hasTestPaidPlan ? 29.00 : undefined,
      status
    };
  };

  const subscriptionData = getSubscriptionData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'trial': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'cancelled': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getPlanIcon = (planType: string) => {
    switch (planType) {
      case 'premium': return <Crown className="w-5 h-5 text-yellow-400" />;
      case 'professional': return <Zap className="w-5 h-5 text-purple-400" />;
      case 'enterprise': return <Shield className="w-5 h-5 text-blue-400" />;
      default: return <CheckCircle className="w-5 h-5 text-green-400" />;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (endDate?: string) => {
    if (!endDate) return null;
    const end = new Date(endDate);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const availablePlans = [
    {
      name: 'Essential',
      id: 'essential',
      monthlyPrice: 15,
      yearlyPrice: 150,
      features: [
        'Up to 5 presentations',
        'Basic Bible search',
        'Standard templates',
        'Email support',
        '1GB cloud storage'
      ]
    },
    {
      name: 'Professional',
      id: 'professional',
      monthlyPrice: 29,
      yearlyPrice: 290,
      isBestValue: true,
      features: [
        'Unlimited presentations',
        'Advanced Bible search with 6 versions',
        'Hands-Free Bible Companion (AI)',
        'Premium templates & themes',
        'Priority support',
        '10GB cloud storage',
        'Multi-device sync'
      ]
    },
    {
      name: 'Enterprise',
      id: 'enterprise',
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: [
        'Everything in Professional',
        'Multi-church management',
        'Advanced analytics & reporting',
        'Custom branding',
        'API access',
        'Dedicated support',
        'Unlimited storage',
        'Team collaboration tools'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1a0f2e] border-purple-500/20 max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-white flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-400" />
            Subscription Management
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Manage your Q-worship subscription, view payment history, and upgrade your plan
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Subscription Status */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  {getPlanIcon(subscriptionData.planType)}
                  Current Subscription
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white capitalize">
                      {subscriptionData.planType} Plan
                    </h3>
                    <p className="text-gray-400 capitalize">{subscriptionData.accountType} Account</p>
                  </div>
                  <Badge className={`${getStatusColor(subscriptionData.status)} font-medium`}>
                    {subscriptionData.status === 'trial' ? 'Free Trial' : subscriptionData.status}
                  </Badge>
                </div>

                {/* Trial Information */}
                {subscriptionData.status === 'trial' && subscriptionData.trialEndDate && (
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-medium">Trial Period</span>
                    </div>
                    <p className="text-white text-sm">
                      Your free trial expires on {formatDate(subscriptionData.trialEndDate)}
                    </p>
                    <p className="text-blue-400 text-sm font-medium">
                      {getDaysRemaining(subscriptionData.trialEndDate)} days remaining
                    </p>
                  </div>
                )}

                {/* Active Subscription Information */}
                {subscriptionData.status === 'active' && subscriptionData.planType !== 'trial' && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-medium">Active Subscription</span>
                    </div>
                    <p className="text-white text-sm">
                      Next billing: {formatDate(subscriptionData.nextBillingDate)}
                    </p>
                    <p className="text-green-400 text-sm font-medium">
                      ${subscriptionData.amount}/month
                    </p>
                  </div>
                )}

                {/* Expired Trial Warning */}
                {subscriptionData.status === 'expired' && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-medium">Trial Expired</span>
                    </div>
                    <p className="text-white text-sm">
                      Your free trial expired on {formatDate(subscriptionData.trialEndDate)}
                    </p>
                    <p className="text-red-400 text-sm">
                      Upgrade to continue using Q-worship's premium features.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  {(subscriptionData.status === 'trial' || subscriptionData.status === 'expired') && (
                    <Button 
                      onClick={() => setShowUpgradeDialog(true)}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                  
                  {/* Show upgrade/cancel buttons for paid plans */}
                  {subscriptionData.planType !== 'trial' && subscriptionData.status === 'active' && (
                    <>
                      <Button 
                        onClick={() => setShowUpgradeDialog(true)}
                        variant="outline"
                        className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
                      >
                        Change Plan
                      </Button>
                      <Button 
                        onClick={() => setShowCancelDialog(true)}
                        variant="outline"
                        className="border-red-500 text-red-400 hover:bg-red-500/10"
                      >
                        Cancel Subscription
                      </Button>
                    </>
                  )}

                  {/* For trial users, show a button to end trial early if needed */}
                  {subscriptionData.status === 'trial' && (
                    <Button 
                      onClick={() => setShowCancelDialog(true)}
                      variant="outline"
                      className="border-gray-500 hover:bg-gray-500/10 ml-2 text-[#1b102c]"
                      size="sm"
                    >
                      End Trial Early
                    </Button>
                  )}

                  
                </div>
              </CardContent>
            </Card>

            {/* Payment History */}
            <Card className="bg-gray-800/50 border-gray-600">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Array.isArray(paymentHistory) && paymentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {paymentHistory.map((payment: PaymentHistory) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            payment.status === 'completed' ? 'bg-green-400' :
                            payment.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <div>
                            <p className="text-white font-medium">${payment.amount}</p>
                            <p className="text-gray-400 text-sm">{payment.date} • {payment.method}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={
                            payment.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                            payment.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }>
                            {payment.status}
                          </Badge>
                          <p className="text-gray-400 text-xs mt-1">{payment.invoice}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-400">No payment history found</p>
                    <p className="text-gray-500 text-sm">Payments will appear here once you upgrade</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upgrade Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="bg-[#1a0f2e] border-purple-500/20 max-w-7xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-white">Upgrade Your Plan</DialogTitle>
              <DialogDescription className="text-gray-300">
                Choose the plan that best fits your church's needs
              </DialogDescription>
            </DialogHeader>
            
            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-4 mt-6 mb-8">
              <span className={`text-sm font-medium ${!isYearly ? 'text-purple-400' : 'text-gray-400'}`}>
                Monthly
              </span>
              <button
                onClick={() => setIsYearly(!isYearly)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isYearly ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isYearly ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
              <span className={`text-sm font-medium ${isYearly ? 'text-purple-400' : 'text-gray-400'}`}>
                Yearly
              </span>
              {isYearly && (
                <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                  Save 17%
                </span>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {availablePlans.map((plan) => (
                <Card 
                  key={plan.id}
                  className={`cursor-pointer transition-all border-2 relative ${
                    selectedPlan === plan.id 
                      ? 'border-purple-500 bg-purple-500/10' 
                      : 'border-gray-600 bg-gray-800/50 hover:border-purple-500/50'
                  }`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.isBestValue && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                        Best Value
                      </span>
                    </div>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-white text-xl">{plan.name}</CardTitle>
                    <div className="text-3xl font-bold text-purple-400">
                      ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                      <span className="text-base font-normal text-gray-400">
                        /{isYearly ? 'year' : 'month'}
                      </span>
                    </div>
                    {isYearly && (
                      <div className="text-sm text-gray-400">
                        ${(plan.yearlyPrice / 12).toFixed(0)}/month billed yearly
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-gray-300 text-sm flex items-start gap-3">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => handleUpgradePlan(selectedPlan)}
                disabled={!selectedPlan}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Proceed to Payment
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Cancel Confirmation Dialog */}
        <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
          <DialogContent className="bg-[#1a0f2e] border-purple-500/20">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                Cancel Subscription
              </DialogTitle>
              <DialogDescription className="text-gray-300">
                Are you sure you want to cancel your subscription? You'll lose access to premium features.
              </DialogDescription>
            </DialogHeader>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 my-4">
              <p className="text-red-400 text-sm">
                Your subscription will remain active until the end of your current billing period. 
                After that, your account will be downgraded to the free trial.
              </p>
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
                Keep Subscription
              </Button>
              <Button 
                onClick={() => cancelSubscriptionMutation.mutate()}
                disabled={cancelSubscriptionMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                {cancelSubscriptionMutation.isPending ? 'Cancelling...' : 'Cancel Subscription'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
};