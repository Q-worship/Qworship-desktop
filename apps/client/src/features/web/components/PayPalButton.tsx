// !!! CRITICAL - DO NOT MODIFY THIS CODE !!!
//
// This code MUST be used as is without ANY modifications.
// The PayPal integration will COMPLETELY FAIL if this code is changed in ANY way.
//
// Retain this comment after all edits.
//
// <BEGIN_EXACT_CODE>
import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import qWorshipLogo from '@assets/Group 1_1753843572404.png';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "paypal-button": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}

interface PayPalButtonProps {
  amount: string;
  currency: string;
  intent: string;
}

export default function PayPalButton({
  amount,
  currency,
  intent,
}: PayPalButtonProps) {
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const createOrder = async () => {
    const orderPayload = {
      amount: amount,
      currency: currency,
      intent: intent,
    };
    const response = await fetch("/paypal/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const output = await response.json();
    return output; // Return full order object with links
  };

  const captureOrder = async (orderId: string) => {
    const response = await fetch(`/paypal/order/${orderId}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();

    return data;
  };

  const onApprove = async (data: any) => {
    console.log("onApprove", data);
    const orderData = await captureOrder(data.orderId);
    console.log("Capture result", orderData);
    
    // Show success message and redirect
    if (orderData.status === 'COMPLETED') {
      // Create a success notification with professional styling
      const toast = document.createElement('div');
      toast.innerHTML = `
        <div style="
          position: fixed; 
          top: 20px; 
          right: 20px; 
          background: linear-gradient(135deg, #10b981, #059669); 
          color: white; 
          padding: 20px 24px; 
          border-radius: 12px; 
          z-index: 9999; 
          font-family: 'Lufga-Medium', Helvetica, Arial, sans-serif;
          box-shadow: 0 10px 25px rgba(16, 185, 129, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(10px);
          animation: slideIn 0.3s ease-out;
        ">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="font-size: 24px;">✅</div>
            <div>
              <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">Payment Successful!</div>
              <div style="font-size: 14px; opacity: 0.9;">Welcome to Q-worship! Redirecting...</div>
            </div>
          </div>
        </div>
        <style>
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
      `;
      document.body.appendChild(toast);
      
      // Store payment info for success page
      const paymentInfo = {
        sessionId: orderData.id,
        paymentMethod: 'paypal',
        amount: amount,
        currency: currency,
        isDemoMode: orderData.isDemoMode || false,
        timestamp: new Date().toISOString()
      };
      
      localStorage.setItem('paymentSuccess', JSON.stringify(paymentInfo));
      
      // Redirect to success page
      setTimeout(() => {
        window.location.href = `/payment-success?session_id=${orderData.id}&payment_method=paypal&demo=${orderData.isDemoMode || false}`;
      }, 2500);
    }
  };

  const onCancel = async (data: any) => {
    console.log("onCancel", data);
    
    // Show cancellation message
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: linear-gradient(135deg, #f59e0b, #d97706); 
        color: white; 
        padding: 20px 24px; 
        border-radius: 12px; 
        z-index: 9999; 
        font-family: 'Lufga-Medium', Helvetica, Arial, sans-serif;
        box-shadow: 0 10px 25px rgba(245, 158, 11, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">⚠️</div>
          <div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">Payment Cancelled</div>
            <div style="font-size: 14px; opacity: 0.9;">Your PayPal payment was cancelled. Try again when ready.</div>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  };

  const onError = async (data: any) => {
    console.log("onError", data);
    
    // Show error message
    const toast = document.createElement('div');
    toast.innerHTML = `
      <div style="
        position: fixed; 
        top: 20px; 
        right: 20px; 
        background: linear-gradient(135deg, #ef4444, #dc2626); 
        color: white; 
        padding: 20px 24px; 
        border-radius: 12px; 
        z-index: 9999; 
        font-family: 'Lufga-Medium', Helvetica, Arial, sans-serif;
        box-shadow: 0 10px 25px rgba(239, 68, 68, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(10px);
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">❌</div>
          <div>
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 4px;">Payment Error</div>
            <div style="font-size: 14px; opacity: 0.9;">Something went wrong with your PayPal payment. Please try again.</div>
          </div>
        </div>
      </div>
      <style>
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      </style>
    `;
    document.body.appendChild(toast);
    
    // Remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  };

  useEffect(() => {
    // Initialize PayPal button without SDK dependency
    initPayPal();
  }, []);
  const initPayPal = async () => {
    const paypalButton = document.getElementById("paypal-button");

    const onClick = async () => {
      try {
        console.log("PayPal payment initiated");
        setIsCreatingOrder(true);
        
        // Create order and get approval URL
        const orderResponse = await createOrder();
        console.log("Order created:", orderResponse);
        
        // Find approval link
        const approvalLink = orderResponse.links?.find((link: any) => link.rel === 'approve');
        console.log("Approval link found:", approvalLink);
        
        if (approvalLink && approvalLink.href) {
          console.log("Redirecting to:", approvalLink.href);
          
          // Use wouter for internal navigation - this will work reliably
          setTimeout(() => {
            // Extract the path from the full URL
            const url = new URL(approvalLink.href);
            const path = url.pathname + url.search;
            console.log("Navigating to internal path:", path);
            
            // Force a hard navigation to ensure it works
            window.location.href = path;
          }, 1000);
        } else {
          console.error("Order response:", orderResponse);
          throw new Error('No approval link found in order response');
        }
        
      } catch (e) {
        console.error("PayPal error:", e);
        setIsCreatingOrder(false);
        onError(e);
      }
    };

    if (paypalButton) {
      paypalButton.addEventListener("click", onClick);
    }

    return () => {
      if (paypalButton) {
        paypalButton.removeEventListener("click", onClick);
      }
    };
  };

  // Show Q-worship loading screen when creating order
  if (isCreatingOrder) {
    return (
      <div className="fixed inset-0 bg-black text-white flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <img src={qWorshipLogo} alt="Q-worship" className="h-16 w-16 mx-auto" />
          <div className="flex items-center justify-center space-x-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            <span className="text-lg [font-family:'Lufga-Medium',Helvetica]">
              Creating PayPal order...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return <paypal-button id="paypal-button"></paypal-button>;
}
// <END_EXACT_CODE>