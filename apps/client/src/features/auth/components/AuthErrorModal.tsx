import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from 'lucide-react';

interface AuthErrorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: React.ReactNode;
  type: string;
  onTryAgain: () => void;
}

export const AuthErrorModal: React.FC<AuthErrorModalProps> = ({
  open,
  onOpenChange,
  title,
  message,
  type,
  onTryAgain
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md mx-auto bg-gradient-to-br from-[#4A4570] via-[#6B5B95] to-[#7B6BAE] border-purple-400/30 p-0 overflow-hidden">
        <div className="relative">
          <div className="bg-gradient-to-r from-red-500/20 to-purple-600/20 px-6 py-4 border-b border-purple-400/20">
            <DialogHeader>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <DialogTitle className="text-white text-lg font-semibold [font-family:'Lufga-Medium',Helvetica]">
                    {title}
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>
          </div>

          <div className="px-6 py-6">
            <DialogDescription className="text-gray-200 text-sm leading-relaxed [font-family:'Lufga-Regular',Helvetica] mb-6">
              {message}
            </DialogDescription>

            <div className="flex justify-end space-x-3">
              <Button
                onClick={onTryAgain}
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-2 rounded-lg font-medium [font-family:'Lufga-Medium',Helvetica] transition-all duration-200"
              >
                Try Again
              </Button>
            </div>

            {type === 'invalid-credentials' && (
              <div className="mt-4 p-3 bg-purple-600/10 rounded-lg border border-purple-400/20">
                <p className="text-gray-300 text-xs [font-family:'Lufga-Regular',Helvetica]">
                  Need help? Make sure you're using the correct email address and password. If you forgot your password, please contact support.
                </p>
              </div>
            )}

            {type === 'empty-fields' && (
              <div className="mt-4 p-3 bg-blue-600/10 rounded-lg border border-blue-400/20">
                <p className="text-gray-300 text-xs [font-family:'Lufga-Regular',Helvetica]">
                  Please fill in both the username/email and password fields to sign in to your Q-worship account.
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
