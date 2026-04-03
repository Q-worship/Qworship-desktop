import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthSignInFormProps {
  formData: any;
  isPending: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToSignUp: () => void;
}

export const AuthSignInForm: React.FC<AuthSignInFormProps> = ({
  formData,
  isPending,
  onInputChange,
  onSubmit,
  onSwitchToSignUp
}) => {
  return (
    <>
      <h1 className="text-white text-4xl font-bold mb-2 [font-family:'Lufga-Medium',Helvetica]">Login</h1>
      <p className="text-gray-200 text-sm mb-8 leading-relaxed [font-family:'Lufga-Regular',Helvetica]">
        Welcome to Q-worship. Continue your journey to elevate your worship experience.
      </p>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label htmlFor="username" className="text-white text-sm font-medium mb-2 block [font-family:'Lufga-Medium',Helvetica]">
            Username
          </Label>
          <Input
            id="username"
            name="username"
            type="text"
            placeholder="email or username"
            value={formData.username}
            onChange={onInputChange}
            className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-white text-sm font-medium mb-2 block [font-family:'Lufga-Medium',Helvetica]">
            Password
          </Label>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="Forgot password?"
            value={formData.password}
            onChange={onInputChange}
            className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <Button
            type="submit"
            disabled={isPending}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica]"
          >
            {isPending ? 'Signing in...' : 'Login'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToSignUp}
            className="bg-[#0f1017] border-gray-400 text-white hover:bg-white/10 px-8 py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica]"
          >
            Sign Up
          </Button>
        </div>
      </form>
    </>
  );
};
