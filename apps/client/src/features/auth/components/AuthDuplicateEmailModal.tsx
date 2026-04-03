import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import qWorshipBrandLogo from "@assets/Group 1_1753867403180.png";

interface AuthDuplicateEmailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSignInInstead: () => void;
  onTryDifferentEmail: () => void;
}

export const AuthDuplicateEmailModal: React.FC<AuthDuplicateEmailModalProps> = ({
  open,
  onOpenChange,
  onSignInInstead,
  onTryDifferentEmail
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-2xl border-0 p-0 overflow-hidden">
        <div className="p-8 text-center">
          <DialogHeader className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <img 
                src={qWorshipBrandLogo} 
                alt="Q-worship logo" 
                className="w-16 h-16"
              />
            </div>
            
            <DialogTitle className="text-2xl font-bold text-gray-900 [font-family:'Lufga-Medium',Helvetica]">
              Account Already Exists
            </DialogTitle>
            
            <DialogDescription className="text-gray-600 text-base leading-relaxed [font-family:'Lufga-Regular',Helvetica]">
              An account with this email address already exists in our Q-worship community. 
              Please sign in with your existing credentials or use a different email address.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-4">
            <Button
              onClick={onSignInInstead}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] h-12"
            >
              Sign In Instead
            </Button>
            
            <Button
              variant="outline"
              onClick={onTryDifferentEmail}
              className="w-full border-2 border-gray-200 text-gray-700 hover:bg-gray-50 py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] h-12"
            >
              Try Different Email
            </Button>
          </div>

          <p className="text-xs text-gray-500 mt-6 [font-family:'Lufga-Regular',Helvetica]">
            Need help? Contact our support team at support@qworship.com
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
