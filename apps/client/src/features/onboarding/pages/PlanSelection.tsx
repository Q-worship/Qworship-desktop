import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Calendar, Clock, AlertTriangle } from 'lucide-react';
import qWorshipLogo from "@assets/Group 1_1753843572404.png";
import qWorshipBrandLogo from "@assets/Group 1_1753867403180.png";

export default function PlanSelection() {
  const [selectedPlan, setSelectedPlan] = useState<'trial' | 'gold' | 'premium' | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('annual');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showTrialWelcomeModal, setShowTrialWelcomeModal] = useState(false);

  const getPlans = () => {
    const basePlans = {
      trial: {
        name: 'Q-worship 30 days free trial',
        subtitle: 'Ideal for small churches with 2-5 days a week',
        monthlyPrice: '£15.99',
        yearlyPrice: '£129.99',
        originalMonthlyPrice: null,
        originalYearlyPrice: null,
        features: [
          'Q-worship speech to text hands free Bible',
          '4 Bible versions included',
          'Virtual live streaming screens',
          'Digital signage',
          'Sermon recorder',
          'Permission-based streaming'
        ],
        color: 'from-purple-600 to-purple-700',
        popular: false
      },
      gold: {
        name: 'Q-worship Gold Package',
        subtitle: 'Ideal for churches with more than 10 members',
        monthlyPrice: '£29.99',
        yearlyPrice: '£224.99',
        originalMonthlyPrice: '£34.99',
        originalYearlyPrice: '£314.88',
        features: [
          'Q-worship speech to text hands free Bible',
          '8 Bible versions included',
          'Virtual live streaming screens',
          'Digital signage',
          'Sermon recorder',
          'Free support and training',
          'Add 4 Church Branches'
        ],
        color: 'from-indigo-600 to-purple-700',
        popular: true
      },
      premium: {
        name: 'Q-worship Premium',
        subtitle: 'Ideal for churches with more than 200 members & branches at scale',
        monthlyPrice: '£39.99',
        yearlyPrice: '£299.99',
        originalMonthlyPrice: '£49.99',
        originalYearlyPrice: '£479.88',
        features: [
          'Q-worship speech to text hands free Bible',
          '8 Bible versions included',
          'Virtual live streaming screens',
          'Digital signage',
          'Sermon recorder',
          'Free support and training',
          'Add 4 Church Branches'
        ],
        color: 'from-purple-600 to-pink-600',
        popular: false
      }
    };

    // Transform plans based on billing period
    return Object.entries(basePlans).reduce((acc, [key, plan]) => {
      const isMonthly = billingPeriod === 'monthly';
      acc[key as keyof typeof basePlans] = {
        ...plan,
        price: isMonthly ? plan.monthlyPrice : plan.yearlyPrice,
        originalPrice: isMonthly ? plan.originalMonthlyPrice : plan.originalYearlyPrice,
        period: isMonthly ? 'monthly' : 'yearly',
        savings: !isMonthly && plan.originalYearlyPrice ? 
          `Save £${(parseFloat(plan.originalYearlyPrice.replace('£', '')) - parseFloat(plan.yearlyPrice.replace('£', ''))).toFixed(2)} yearly` : 
          null
      };
      return acc;
    }, {} as any);
  };

  const plans = getPlans();

  const handlePlanSelection = (planType: 'trial' | 'gold' | 'premium') => {
    setSelectedPlan(planType);
  };

  const planSelectionMutation = useMutation({
    mutationFn: async (planData: { planType: string; billingPeriod: string }) => {
      return await apiRequest('POST', '/api/plans/select', {
        ...planData,
        userId: sessionStorage.getItem('qworship_user_id') || '' // Get actual user ID from sessionStorage
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Plan selected successfully!",
        description: `Welcome to ${plans[selectedPlan!].name}`,
      });
      
      // Navigate to project selection (mandatory for all users)
      setTimeout(() => {
        setLocation('/project-selection');
      }, 1500);
    },
    onError: (error) => {
      console.error('Plan selection error:', error);
      toast({
        title: "Error selecting plan",
        description: "Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const handleProceedToCheckout = () => {
    if (!selectedPlan) {
      toast({
        title: "Please select a plan",
        description: "Choose a plan to continue with your Q-worship setup.",
        variant: "destructive",
      });
      return;
    }

    // If it's a trial plan, show welcome modal first
    if (selectedPlan === 'trial') {
      setShowTrialWelcomeModal(true);
      return;
    }

    // For paid plans, redirect to Stripe checkout  
    // Convert 'annual' to 'yearly' to match backend expectations
    const backendBillingPeriod = billingPeriod === 'annual' ? 'yearly' : 'monthly';
    const checkoutUrl = `/checkout?plan=${selectedPlan}&billing=${backendBillingPeriod}&userId=1`;
    setLocation(checkoutUrl);
  };

  const handleStartFreeTrial = async () => {
    setShowTrialWelcomeModal(true);
  };

  const handleTrialWelcomeConfirm = async () => {
    try {
      // Use the plan selection endpoint instead of trial start
      // This will handle both plan selection and trial activation
      const response = await apiRequest('POST', '/api/plans/select', {
        planType: 'trial',
        userId: sessionStorage.getItem('qworship_user_id') || '', // Get actual user ID from sessionStorage
        billingPeriod: 'monthly'
      });
      
      setShowTrialWelcomeModal(false);
      
      // Navigate to project selection (mandatory for all users)
      setLocation('/project-selection');
    } catch (error) {
      console.error('Trial start error:', error);
      setShowTrialWelcomeModal(false);
      toast({
        title: "Error",
        description: "Failed to start trial. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <img src={qWorshipLogo} alt="Q-worship" className="h-8 w-8" />
              <span className="text-xl font-bold text-white [font-family:'Lufga-Medium',Helvetica]">Q-worship</span>
            </div>
          </Link>
          {/* Empty space to maintain header balance */}
          <div></div>
        </div>
      </header>
      {/* Main Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-6">
        {/* Logo and Title */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-6">
            <img src={qWorshipLogo} alt="Q-worship" className="w-16 h-16" />
          </div>
          <h1 className="font-bold mb-2 [font-family:'Lufga-Medium',Helvetica] text-[#D8B4FE] text-[24px]">
            Select a plan and start making the best<br />of Q-worship
          </h1>
        </div>

        {/* Billing Toggle Switch */}
        <div className="flex items-center gap-4 mb-8">
          <span className={`text-sm [font-family:'Lufga-Medium',Helvetica] transition-colors ${
            billingPeriod === 'monthly' ? 'text-white' : 'text-gray-400'
          }`}>
            Monthly
          </span>
          
          <button
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'annual' : 'monthly')}
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-black"
          >
            <div
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                billingPeriod === 'annual' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          
          <span className={`text-sm [font-family:'Lufga-Medium',Helvetica] transition-colors ${
            billingPeriod === 'annual' ? 'text-white' : 'text-gray-400'
          }`}>
            Annual
          </span>
          
          {billingPeriod === 'annual' && (
            <span className="text-xs text-green-400 [font-family:'Lufga-Regular',Helvetica] ml-2">
              Save up to 20%
            </span>
          )}
        </div>

        {/* Most Popular Label */}
        <div className="text-center mb-6">
          <span className="text-gray-300 text-sm [font-family:'Lufga-Regular',Helvetica]">Most Popular</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full mb-8">
          {/* Free Trial Card */}
          <div 
            className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border border-gray-600 ${
              selectedPlan === 'trial' ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-105'
            }`}
            onClick={() => handlePlanSelection('trial')}
          >
            {/* Purple Header */}
            <div className="bg-purple-600 px-6 py-4 text-center">
              <h3 className="text-white text-lg font-bold [font-family:'Lufga-Medium',Helvetica]">
                {plans.trial.name}
              </h3>
              <p className="text-white/90 text-sm [font-family:'Lufga-Regular',Helvetica]">
                {plans.trial.subtitle}
              </p>
            </div>
            
            {/* Black Content */}
            <div className="bg-black px-6 py-6">
              <div className="text-center mb-4">
                <div className="text-white text-3xl font-bold [font-family:'Lufga-Bold',Helvetica]">
                  {plans.trial.price}<span className="text-lg">/{plans.trial.period}</span>
                </div>
                <div className="text-cyan-400 text-sm font-medium [font-family:'Lufga-Medium',Helvetica] mt-1">
                  Explore free for 30 days
                </div>
              </div>

              <ul className="space-y-2 text-white text-sm [font-family:'Lufga-Regular',Helvetica]">
                {plans.trial.features.map((feature: string, index: number) => (
                  <li key={index}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Gold Package Card */}
          <div 
            className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 relative border border-purple-600 ${
              selectedPlan === 'gold' ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-105'
            }`}
            onClick={() => handlePlanSelection('gold')}
          >
            {/* Most Popular Badge */}
            <div className="bg-cyan-400 text-black text-center py-1 text-xs font-bold [font-family:'Lufga-Bold',Helvetica]">
              Most Popular
            </div>
            
            {/* Dark Blue Header */}
            <div className="bg-gradient-to-r from-indigo-900 to-purple-900 px-6 py-4 text-center">
              <h3 className="text-white text-lg font-bold [font-family:'Lufga-Medium',Helvetica]">
                {plans.gold.name}
              </h3>
              <p className="text-white/90 text-sm [font-family:'Lufga-Regular',Helvetica]">
                {plans.gold.subtitle}
              </p>
            </div>
            
            {/* Black Content */}
            <div className="bg-black px-6 py-6">
              <div className="text-center mb-4">
                <div className="text-white text-3xl font-bold [font-family:'Lufga-Bold',Helvetica]">
                  {plans.gold.price}<span className="text-lg">/{plans.gold.period}</span>
                </div>
                {plans.gold.savings && (
                  <div className="text-cyan-400 text-sm font-medium [font-family:'Lufga-Medium',Helvetica] mt-1">
                    {plans.gold.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-2 text-white text-sm [font-family:'Lufga-Regular',Helvetica]">
                {plans.gold.features.map((feature: string, index: number) => (
                  <li key={index}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Premium Card */}
          <div 
            className={`rounded-lg overflow-hidden cursor-pointer transition-all duration-200 border border-gray-600 ${
              selectedPlan === 'premium' ? 'ring-2 ring-cyan-400 scale-105' : 'hover:scale-105'
            }`}
            onClick={() => handlePlanSelection('premium')}
          >
            {/* Purple Header */}
            <div className="bg-purple-600 px-6 py-4 text-center">
              <h3 className="text-white text-lg font-bold [font-family:'Lufga-Medium',Helvetica]">
                {plans.premium.name}
              </h3>
              <p className="text-white/90 text-sm [font-family:'Lufga-Regular',Helvetica]">
                {plans.premium.subtitle}
              </p>
            </div>
            
            {/* Black Content */}
            <div className="bg-black px-6 py-6">
              <div className="text-center mb-4">
                <div className="text-white text-3xl font-bold [font-family:'Lufga-Bold',Helvetica]">
                  {plans.premium.price}<span className="text-lg">/{plans.premium.period}</span>
                </div>
                {plans.premium.savings && (
                  <div className="text-cyan-400 text-sm font-medium [font-family:'Lufga-Medium',Helvetica] mt-1">
                    {plans.premium.savings}
                  </div>
                )}
              </div>

              <ul className="space-y-2 text-white text-sm [font-family:'Lufga-Regular',Helvetica]">
                {plans.premium.features.map((feature: string, index: number) => (
                  <li key={index}>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-4 w-full max-w-md">
          <Button
            onClick={handleProceedToCheckout}
            disabled={!selectedPlan}
            className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-black font-bold py-3 rounded-lg [font-family:'Lufga-Bold',Helvetica] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to checkout
          </Button>
          
          <Button
            onClick={handleStartFreeTrial}
            className="w-full border-2 border-gray-600 bg-transparent text-white hover:bg-white hover:text-black font-bold py-3 rounded-lg [font-family:'Lufga-Bold',Helvetica] transition-colors"
          >
            Start free trial
          </Button>
        </div>
      </div>
      {/* Footer */}
      <footer className="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-12 mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Logo and Contact */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <img src={qWorshipLogo} alt="Q-worship" className="h-8 w-8" />
                <span className="text-xl font-bold text-white [font-family:'Lufga-Medium',Helvetica]">Q-worship</span>
              </div>
              
              <div className="text-white/80 text-sm [font-family:'Lufga-Regular',Helvetica]">
                <p className="font-bold mb-2">Address:</p>
                <p>Devine Digital Technologies Office 4,</p>
                <p>Dalton House</p>
                <p>60 Windsor Avenue, London, SW19 2RR,</p>
                <p>United Kingdom</p>
              </div>
              
              <div className="text-white/80 text-sm [font-family:'Lufga-Regular',Helvetica]">
                <p className="font-bold mb-2">Contact:</p>
                <p>info@q-worship.com</p>
              </div>
              
              {/* Social Media Icons */}
              <div className="flex space-x-3">
                <div className="w-6 h-6 bg-white/20 rounded"></div>
                <div className="w-6 h-6 bg-white/20 rounded"></div>
                <div className="w-6 h-6 bg-white/20 rounded"></div>
                <div className="w-6 h-6 bg-white/20 rounded"></div>
                <div className="w-6 h-6 bg-white/20 rounded"></div>
              </div>
            </div>

            {/* About Us */}
            <div className="space-y-4">
              <h3 className="text-white font-bold [font-family:'Lufga-Medium',Helvetica]">About us</h3>
              <div className="space-y-2 text-white/80 text-sm [font-family:'Lufga-Regular',Helvetica]">
                <Link href="/book-demo" className="block hover:text-white">Book a demo</Link>
                <Link href="/blog" className="block hover:text-white">Blog</Link>
                <Link href="/pricing" className="block hover:text-white">Pricing</Link>
                <Link href="/contact" className="block hover:text-white">Contact</Link>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h3 className="text-white font-bold [font-family:'Lufga-Medium',Helvetica]">Features</h3>
              <div className="space-y-2 text-white/80 text-sm [font-family:'Lufga-Regular',Helvetica]">
                <Link href="/signin" className="block hover:text-white">Sign In</Link>
                <Link href="/signup" className="block hover:text-white">Sign Up</Link>
              </div>
            </div>

            {/* Style Guide */}
            <div className="space-y-4">
              <h3 className="text-white font-bold [font-family:'Lufga-Medium',Helvetica]">Style Guide</h3>
              <div className="space-y-2 text-white/80 text-sm [font-family:'Lufga-Regular',Helvetica]">
                <span className="block">Changelog</span>
                <span className="block">Licenses</span>
                <span className="block">More Templates</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-white/60 text-sm [font-family:'Lufga-Regular',Helvetica]">
            <p>© 316. All rights reserved</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy-policy" className="hover:text-white">Privacy Policy</Link>
              <Link href="/terms-of-service" className="hover:text-white">Terms of Service</Link>
              <Link href="/cookies-settings" className="hover:text-white">Cookies Settings</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Trial Welcome Modal - Horizontal Layout */}
      <Dialog open={showTrialWelcomeModal} onOpenChange={setShowTrialWelcomeModal}>
        <DialogContent className="max-w-5xl mx-auto bg-gradient-to-br from-[#4A4570] via-[#6B5B95] to-[#7B6BAE] border-purple-400/30 p-0 overflow-hidden">
          <div className="relative">
            {/* Header with Q-worship Logo */}
            <div className="bg-gradient-to-r from-green-500/20 to-purple-600/20 px-10 py-6 text-center border-b border-purple-400/20">
              <div className="flex items-center justify-center space-x-6">
                <img 
                  src={qWorshipBrandLogo} 
                  alt="Q-worship logo" 
                  className="w-16 h-16"
                />
                <div className="text-left">
                  <DialogHeader>
                    <DialogTitle className="text-white text-2xl font-bold [font-family:'Lufga-Medium',Helvetica]">
                      Welcome to Your Q-worship 30-Day Trial!
                    </DialogTitle>
                    <DialogDescription className="text-green-200 text-base [font-family:'Lufga-Regular',Helvetica]">
                      Your free trial journey begins now
                    </DialogDescription>
                  </DialogHeader>
                </div>
              </div>
            </div>

            {/* Content - Horizontal Grid */}
            <div className="px-10 py-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Trial Overview */}
                  <div className="bg-purple-600/10 rounded-lg p-6 border border-purple-400/20">
                    <div className="flex items-center space-x-3 mb-4">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <h3 className="text-white font-semibold text-base [font-family:'Lufga-Medium',Helvetica]">
                        What's Included in Your Trial
                      </h3>
                    </div>
                    <ul className="text-gray-200 text-sm space-y-2 [font-family:'Lufga-Regular',Helvetica]">
                      <li>• Q-worship speech-to-text hands-free Bible</li>
                      <li>• 4 Bible versions included</li>
                      <li>• Virtual live streaming screens</li>
                      <li>• Digital signage & sermon recorder</li>
                      <li>• Permission-based streaming</li>
                    </ul>
                  </div>

                  {/* Trial Duration */}
                  <div className="bg-blue-600/10 rounded-lg p-6 border border-blue-400/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <Calendar className="w-5 h-5 text-blue-400" />
                      <h3 className="text-white font-semibold text-base [font-family:'Lufga-Medium',Helvetica]">
                        Trial Duration
                      </h3>
                    </div>
                    <p className="text-gray-200 text-sm [font-family:'Lufga-Regular',Helvetica]">
                      Your trial starts today and runs for <strong className="text-white">30 full days</strong>. 
                      You'll receive email reminders as your trial approaches its end.
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* What Happens Next */}
                  <div className="bg-orange-600/10 rounded-lg p-6 border border-orange-400/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="w-5 h-5 text-orange-400" />
                      <h3 className="text-white font-semibold text-base [font-family:'Lufga-Medium',Helvetica]">
                        What Happens After 30 Days?
                      </h3>
                    </div>
                    <p className="text-gray-200 text-sm [font-family:'Lufga-Regular',Helvetica]">
                      Near the end of your trial, you'll be prompted to choose a paid plan to continue using Q-worship. 
                      If no plan is selected, your account will be safely locked with all data preserved for 90 days.
                    </p>
                  </div>

                  {/* Important Note */}
                  <div className="bg-red-600/10 rounded-lg p-6 border border-red-400/20">
                    <div className="flex items-center space-x-3 mb-3">
                      <AlertTriangle className="w-5 h-5 text-red-400" />
                      <h3 className="text-white font-semibold text-base [font-family:'Lufga-Medium',Helvetica]">
                        Important
                      </h3>
                    </div>
                    <p className="text-gray-200 text-sm [font-family:'Lufga-Regular',Helvetica]">
                      No payment information is required during your trial. You can explore all features 
                      risk-free and decide if Q-worship is right for your ministry.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button and Support - Full Width */}
              <div className="space-y-4">
                <Button
                  onClick={handleTrialWelcomeConfirm}
                  disabled={planSelectionMutation.isPending}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-4 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] text-base transition-all duration-200"
                >
                  {planSelectionMutation.isPending ? 'Setting up your trial...' : 'Start My Q-worship Journey →'}
                </Button>

                {/* Support Contact */}
                <div className="text-center">
                  <p className="text-gray-300 text-sm [font-family:'Lufga-Regular',Helvetica]">
                    Questions? Contact us at{' '}
                    <span className="text-purple-300">support@qworship.com</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}