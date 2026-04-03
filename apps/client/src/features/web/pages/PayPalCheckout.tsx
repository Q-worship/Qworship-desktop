import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, X } from 'lucide-react';
import qWorshipLogo from '@assets/Group 1_1753843572404.png';

export default function PayPalCheckout() {
  const [, setLocation] = useLocation();
  const [orderData, setOrderData] = useState<any>(null);
  
  // Get order data from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const amount = urlParams.get('amount');
    const currency = urlParams.get('currency');
    
    if (token && amount && currency) {
      setOrderData({
        token,
        amount,
        currency,
        orderId: token
      });
    }
  }, []);

  const handleApprovePayment = async () => {
    try {
      // Simulate payment processing
      const response = await fetch(`/paypal/order/${orderData.orderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (result.status === 'COMPLETED') {
        // Redirect to success page
        setLocation(`/payment-success?payment=paypal&amount=${orderData.amount}&currency=${orderData.currency}`);
      }
    } catch (error) {
      console.error('Payment processing failed:', error);
    }
  };

  const handleCancelPayment = () => {
    setLocation('/checkout');
  };

  if (!orderData) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={qWorshipLogo} alt="Q-worship" className="h-16 w-16 mx-auto" />
          <p className="text-lg [font-family:'Lufga-Medium',Helvetica]">
            Loading payment details...
          </p>
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
              PayPal Checkout
            </span>
          </div>
          <Button 
            onClick={handleCancelPayment}
            variant="ghost" 
            size="sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checkout
          </Button>
        </div>
      </header>

      {/* PayPal Payment Interface */}
      <div className="max-w-2xl mx-auto px-6 py-16">
        <div className="space-y-8">
          {/* PayPal Branding */}
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-500 mb-2">PayPal</div>
            <p className="text-gray-400">Secure payment processing</p>
          </div>

          {/* Payment Details Card */}
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Payment Details
                <div className="text-blue-500">🛡️ Secure</div>
              </CardTitle>
              <CardDescription className="text-gray-300">
                Review and confirm your payment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Amount Display */}
              <div className="text-center py-8 border border-gray-700 rounded-lg bg-gray-800">
                <div className="text-3xl font-bold text-white mb-2">
                  {orderData.currency} {orderData.amount}
                </div>
                <div className="text-gray-400">
                  Q-worship Subscription Payment
                </div>
              </div>

              {/* Payment Method */}
              <div className="flex items-center justify-between p-4 border border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-8 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white font-bold text-sm">PP</span>
                  </div>
                  <div>
                    <div className="text-white font-medium">PayPal Account</div>
                    <div className="text-gray-400 text-sm">demo@example.com</div>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4 pt-6">
                <Button
                  onClick={handleCancelPayment}
                  variant="outline"
                  className="flex-1 bg-transparent border-gray-600 text-gray-300 hover:bg-gray-800"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  onClick={handleApprovePayment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Pay Now
                </Button>
              </div>

              {/* Security Notice */}
              <div className="text-center text-sm text-gray-500 mt-6">
                🔒 Your payment information is encrypted and secure
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}