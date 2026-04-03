import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Shield, ArrowLeft, AlertTriangle } from 'lucide-react';
import PayPalButton from "@/features/web/components/PayPalButton";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import qWorshipLogo from '@assets/Group 1_1753843572404.png';

interface CheckoutSessionData {
  clientSecret: string;
  planDetails: {
    name: string;
    price: string;
    period: string;
    features: string[];
  };
}

export default function StripeCheckout() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'paypal'>('stripe');

  // Get plan details from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const planType = urlParams.get('plan') || '';
  const billingPeriod = urlParams.get('billing') || 'monthly';
  const userId = urlParams.get('userId') || '1';
  const isUpgrade = urlParams.get('upgrade') === 'true';

  const { data: checkoutSession, isLoading, error } = useQuery({
    queryKey: ['/api/stripe/create-checkout-session', planType, billingPeriod, userId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/create-checkout-session', {
        planType,
        billingPeriod,
        userId: parseInt(userId)
      });
      return response.json() as Promise<CheckoutSessionData>;
    },
    enabled: !!planType && !!billingPeriod,
  });

  const handleStripeCheckout = async () => {
    setIsProcessing(true);
    
    try {
      // Process payment and track activity
      const response = await apiRequest('POST', '/api/stripe/process-payment', {
        planType: checkoutSession?.planDetails?.name,
        amount: checkoutSession?.planDetails?.price,
        billingPeriod: checkoutSession?.planDetails?.period
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Payment Successful!",
          description: "Welcome to Q-worship! Redirecting to confirmation...",
        });
        
        // Redirect to payment success page with session ID
        setTimeout(() => {
          setLocation(`/payment-success?session_id=${result.sessionId}`);
        }, 1500);
      } else {
        throw new Error(result.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "There was an issue processing your payment. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  // Handle configuration error - show demo mode
  const isDemoMode = error || !checkoutSession?.clientSecret || checkoutSession.clientSecret.includes('demo-mock');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={qWorshipLogo} alt="Q-worship" className="h-16 w-16 mx-auto" />
          <div className="flex items-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg [font-family:'Lufga-Medium',Helvetica]">
              Setting up your checkout...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <img src={qWorshipLogo} alt="Q-worship" className="h-8 w-8" />
            <span className="text-xl font-bold [font-family:'Lufga-Bold',Helvetica]">
              Q-worship Checkout
            </span>
          </div>
          <Button 
            onClick={() => setLocation(isUpgrade ? '/dashboard' : '/plan-selection')}
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {isUpgrade ? 'Back to Dashboard' : 'Back to Plans'}
          </Button>
        </div>
      </header>

      {/* Checkout Content */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Plan Summary */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold mb-2 [font-family:'Lufga-Bold',Helvetica]">
                Complete Your Purchase
              </h1>
              <p className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">
                You're almost ready to transform your worship experience with Q-worship.
              </p>
            </div>

            {checkoutSession && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white [font-family:'Lufga-Bold',Helvetica]">
                    {checkoutSession.planDetails.name}
                  </CardTitle>
                  <CardDescription>
                    <span className="text-2xl font-bold text-cyan-400">
                      {checkoutSession.planDetails.price}
                    </span>
                    <span className="text-gray-400 ml-2">
                      /{checkoutSession.planDetails.period}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium text-gray-300 [font-family:'Lufga-Medium',Helvetica]">
                      What's included:
                    </h4>
                    <ul className="space-y-2">
                      {checkoutSession.planDetails.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                          <span className="text-gray-300 [font-family:'Lufga-Regular',Helvetica]">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Security Features */}
            <div className="flex items-center space-x-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>{selectedPaymentMethod === 'stripe' ? 'Stripe Protected' : 'PayPal Protected'}</span>
              </div>
            </div>
          </div>

          {/* Checkout Button */}
          <div className="space-y-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white [font-family:'Lufga-Bold',Helvetica]">
                  Payment Details
                </CardTitle>
                <CardDescription>
                  Complete your subscription to Q-worship
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Payment Method Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white [font-family:'Lufga-Medium',Helvetica]">
                    Choose Payment Method
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPaymentMethod('stripe')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedPaymentMethod === 'stripe'
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-white" />
                        <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                          Credit Card
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Powered by Stripe</p>
                    </button>
                    
                    <button
                      onClick={() => setSelectedPaymentMethod('paypal')}
                      className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                        selectedPaymentMethod === 'paypal'
                          ? 'border-cyan-400 bg-cyan-400/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                          <span className="text-xs font-bold text-white">P</span>
                        </div>
                        <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                          PayPal
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Pay with PayPal</p>
                    </button>
                  </div>
                </div>

                {/* Stripe Payment Form */}
                {selectedPaymentMethod === 'stripe' && (
                  <div className="space-y-4">
                    <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 [font-family:'Lufga-Medium',Helvetica]">
                      Email address
                    </label>
                    <input
                      type="email"
                      placeholder="your-email@example.com"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [font-family:'Lufga-Regular',Helvetica]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 [font-family:'Lufga-Medium',Helvetica]">
                      Card information
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="1234 1234 1234 1234"
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-t-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [font-family:'Lufga-Regular',Helvetica]"
                      />
                      <div className="grid grid-cols-2 gap-0">
                        <input
                          type="text"
                          placeholder="MM / YY"
                          className="px-3 py-2 bg-gray-800 border border-gray-600 border-r-0 rounded-bl-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [font-family:'Lufga-Regular',Helvetica]"
                        />
                        <input
                          type="text"
                          placeholder="CVC"
                          className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-br-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [font-family:'Lufga-Regular',Helvetica]"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 [font-family:'Lufga-Medium',Helvetica]">
                      Cardholder name
                    </label>
                    <input
                      type="text"
                      placeholder="Full name on card"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [font-family:'Lufga-Regular',Helvetica]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 [font-family:'Lufga-Medium',Helvetica]">
                      Country or region
                    </label>
                    <select className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent [font-family:'Lufga-Regular',Helvetica]">
                      <option value="GB">United Kingdom</option>
                      <option value="US">United States</option>
                      <option value="CA">Canada</option>
                      <option value="AU">Australia</option>
                      <option value="DE">Germany</option>
                      <option value="FR">France</option>
                    </select>
                  </div>
                </div>
                )}

                {/* PayPal Payment */}
                {selectedPaymentMethod === 'paypal' && checkoutSession && (
                  <div className="space-y-4">
                    <div className="text-center">
                      <h4 className="text-lg font-medium text-white [font-family:'Lufga-Medium',Helvetica] mb-2">
                        Pay with PayPal
                      </h4>
                      <p className="text-gray-400 text-sm [font-family:'Lufga-Regular',Helvetica]">
                        You'll be redirected to PayPal to complete your payment securely.
                      </p>
                    </div>
                    
                    <style>{`
                      paypal-button {
                        width: 100% !important;
                        height: 48px !important;
                        border-radius: 8px !important;
                        background: linear-gradient(to right, #0070ba, #003087) !important;
                        color: white !important;
                        font-family: 'Lufga-Bold', Helvetica !important;
                        font-size: 18px !important;
                        font-weight: bold !important;
                        border: none !important;
                        cursor: pointer !important;
                        transition: all 0.2s ease !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
                      }
                      paypal-button:hover {
                        background: linear-gradient(to right, #005ea6, #002973) !important;
                        transform: translateY(-1px) !important;
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
                      }
                      paypal-button:before {
                        content: "🅿️ Pay with PayPal" !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                        width: 100% !important;
                        height: 100% !important;
                      }
                    `}</style>
                    
                    <PayPalButton 
                      amount={checkoutSession.planDetails.price.replace('£', '')}
                      currency="GBP"
                      intent="CAPTURE"
                    />
                  </div>
                )}

                {selectedPaymentMethod === 'stripe' && (
                  <Button
                    onClick={handleStripeCheckout}
                    disabled={isProcessing || !checkoutSession}
                    className="w-full h-12 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-black font-bold text-lg [font-family:'Lufga-Bold',Helvetica]"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Subscribe with Card
                      </>
                    )}
                  </Button>
                )}



                <div className="text-center space-y-2">
                  <p className="text-sm text-gray-400 [font-family:'Lufga-Regular',Helvetica]">
                    {selectedPaymentMethod === 'stripe' ? 'Powered by Stripe' : 'Powered by PayPal'}
                  </p>
                  <p className="text-xs text-gray-500 [font-family:'Lufga-Regular',Helvetica]">
                    Your payment information is secure and encrypted.
                    You can cancel anytime from your account settings.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}