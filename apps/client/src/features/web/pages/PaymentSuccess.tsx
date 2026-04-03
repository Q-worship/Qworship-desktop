import React, { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight, Calendar, CreditCard } from 'lucide-react';
import { apiRequest } from "@/lib/queryClient";
import qWorshipLogo from '@assets/Group 1_1753843572404.png';

export default function PaymentSuccess() {
  const [, setLocation] = useLocation();
  
  // Get session ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('session_id');

  const { data: paymentDetails, isLoading } = useQuery({
    queryKey: ['/api/stripe/payment-success', sessionId],
    queryFn: async () => {
      const response = await apiRequest('POST', '/api/stripe/payment-success', {
        sessionId
      });
      return response.json();
    },
    enabled: !!sessionId,
  });

  useEffect(() => {
    // Auto-redirect to dashboard after 5 seconds
    const timer = setTimeout(() => {
      setLocation('/dashboard');
    }, 5000);

    return () => clearTimeout(timer);
  }, [setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={qWorshipLogo} alt="Q-worship" className="h-16 w-16 mx-auto" />
          <p className="text-lg [font-family:'Lufga-Medium',Helvetica]">
            Confirming your payment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gray-900 px-6 py-4">
        <div className="flex items-center justify-center max-w-4xl mx-auto">
          <div className="flex items-center space-x-4">
            <img src={qWorshipLogo} alt="Q-worship" className="h-8 w-8" />
            <span className="text-xl font-bold [font-family:'Lufga-Bold',Helvetica]">
              Q-worship
            </span>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center space-y-8">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-600 rounded-full flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          {/* Success Message */}
          <div className="space-y-4">
            <h1 className="text-4xl font-bold [font-family:'Lufga-Bold',Helvetica]">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-300 [font-family:'Lufga-Regular',Helvetica]">
              Welcome to Q-worship! Your account has been activated.
            </p>
          </div>

          {/* Payment Details */}
          {paymentDetails && (
            <Card className="bg-gray-900 border-green-600 text-left">
              <CardHeader>
                <CardTitle className="text-green-400 [font-family:'Lufga-Bold',Helvetica]">
                  Subscription Details
                </CardTitle>
                <CardDescription>
                  Your Q-worship account is now active
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Plan:</span>
                    <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                      {paymentDetails.planName}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Amount:</span>
                    <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                      {paymentDetails.amount}/{paymentDetails.interval}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Payment Method:</span>
                    <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                      •••• •••• •••• {paymentDetails.lastFour || '4242'}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Transaction ID:</span>
                    <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica] text-xs">
                      {paymentDetails.transactionId}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Email Receipt:</span>
                    <span className="text-green-400 font-medium [font-family:'Lufga-Medium',Helvetica]">
                      Sent ✓
                    </span>
                  </div>
                  {paymentDetails.nextBillingDate && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Next billing:</span>
                      <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                        {new Date(paymentDetails.nextBillingDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  
                  {/* Plan Features */}
                  {paymentDetails.features && (
                    <div className="mt-6 pt-4 border-t border-gray-700">
                      <h4 className="text-white font-medium mb-3 [font-family:'Lufga-Medium',Helvetica]">
                        Your Plan Includes:
                      </h4>
                      <ul className="space-y-2">
                        {paymentDetails.features.map((feature: string, index: number) => (
                          <li key={index} className="text-sm text-gray-300 [font-family:'Lufga-Regular',Helvetica] flex items-center">
                            <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full mr-3 flex-shrink-0"></div>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button
              onClick={() => setLocation('/dashboard')}
              className="w-full h-12 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-black font-bold text-lg [font-family:'Lufga-Bold',Helvetica]"
            >
              Go to Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            
            <p className="text-sm text-gray-400 [font-family:'Lufga-Regular',Helvetica]">
              You'll be automatically redirected in a few seconds...
            </p>
          </div>

          {/* Welcome Message */}
          <div className="bg-gray-900 rounded-lg p-6 text-left">
            <h3 className="text-lg font-bold mb-3 [font-family:'Lufga-Bold',Helvetica]">
              What's Next?
            </h3>
            <ul className="space-y-2 text-gray-300 [font-family:'Lufga-Regular',Helvetica]">
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span>Access your Q-worship dashboard with all premium features</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span>Set up your first worship presentation</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span>Explore the Hands-Free Bible Companion AI feature</span>
              </li>
              <li className="flex items-start space-x-3">
                <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                <span>Contact support anytime for help and training</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}