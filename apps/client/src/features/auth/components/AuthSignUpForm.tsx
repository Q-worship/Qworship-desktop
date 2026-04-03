import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import qWorshipLogoLarge from "@assets/Group 1_1753835537799.png";

interface AuthSignUpFormProps {
  signUpData: any;
  isPending: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCountryCodeChange: (value: string) => void;
  onCheckboxChange: (checked: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSwitchToSignIn: () => void;
}

export const AuthSignUpForm: React.FC<AuthSignUpFormProps> = ({
  signUpData,
  isPending,
  onInputChange,
  onCountryCodeChange,
  onCheckboxChange,
  onSubmit,
  onSwitchToSignIn,
}) => {
  return (
    <>
      {/* Q-worship Logo */}
      <div className="w-16 h-16 mb-8">
        <img
          src={qWorshipLogoLarge}
          alt="Q-worship logo"
          className="w-16 h-16"
        />
      </div>

      <h1 className="text-white text-2xl font-bold mb-8 [font-family:'Lufga-Medium',Helvetica]">
        Create An Account
      </h1>

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <Label className="text-white text-sm font-medium mb-2 block [font-family:'Lufga-Medium',Helvetica]">
            Name
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              value={signUpData.firstName}
              onChange={onInputChange}
              className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
              required
            />
            <Input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              value={signUpData.lastName}
              onChange={onInputChange}
              className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="phoneNumber"
            className="text-white text-sm font-medium mb-2 block [font-family:'Lufga-Medium',Helvetica]"
          >
            Phone number
          </Label>
          <div className="flex space-x-2">
            <Select
              value={signUpData.countryCode}
              onValueChange={onCountryCodeChange}
            >
              <SelectTrigger className="bg-gray-600/50 border-gray-500 text-white focus:border-purple-400 focus:ring-purple-400 h-12 w-24 [font-family:'Lufga-Regular',Helvetica]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-700 border-gray-600 max-h-60 overflow-y-auto">
                <SelectItem value="+1" className="text-white hover:bg-gray-600">
                  +1 (US, Canada)
                </SelectItem>
                <SelectItem
                  value="+44"
                  className="text-white hover:bg-gray-600"
                >
                  +44 (UK)
                </SelectItem>
                <SelectItem
                  value="+234"
                  className="text-white hover:bg-gray-600"
                >
                  +234 (Nigeria)
                </SelectItem>
                <SelectItem
                  value="+27"
                  className="text-white hover:bg-gray-600"
                >
                  +27 (South Africa)
                </SelectItem>
                <SelectItem
                  value="+91"
                  className="text-white hover:bg-gray-600"
                >
                  +91 (India)
                </SelectItem>
                {/* Simplified to top 5 locations but all can be added via the database mapping */}
              </SelectContent>
            </Select>
            <Input
              id="phoneNumber"
              name="phoneNumber"
              type="tel"
              placeholder="Enter phone number"
              value={signUpData.phoneNumber}
              onChange={onInputChange}
              className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 flex-1 [font-family:'Lufga-Regular',Helvetica]"
            />
          </div>
        </div>

        <div>
          <Label
            htmlFor="signupEmail"
            className="text-white text-sm font-medium mb-2 block [font-family:'Lufga-Medium',Helvetica]"
          >
            Email
          </Label>
          <Input
            id="signupEmail"
            name="email"
            type="email"
            placeholder="johndoe@email.com"
            value={signUpData.email}
            onChange={onInputChange}
            className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
          />
        </div>

        <div>
          <Label
            htmlFor="signupPassword"
            className="text-white text-sm font-medium mb-2 block [font-family:'Lufga-Medium',Helvetica]"
          >
            Password
          </Label>
          <Input
            id="signupPassword"
            name="password"
            type="password"
            placeholder="••••••••••••"
            value={signUpData.password}
            onChange={onInputChange}
            className="bg-gray-600/50 border-gray-500 text-white placeholder:text-gray-300 focus:border-purple-400 focus:ring-purple-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
          />
        </div>

        {/* Marketing Checkbox */}
        <div className="flex items-start space-x-3 pt-4">
          <Checkbox
            id="marketing"
            checked={signUpData.agreeToMarketing}
            onCheckedChange={onCheckboxChange}
            className="bg-gray-600/50 border-gray-500 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 mt-1"
          />
          <Label
            htmlFor="marketing"
            className="text-white text-sm [font-family:'Lufga-Regular',Helvetica] leading-relaxed"
          >
            Sign me up to receive product training and special offers from
            Q-worship
          </Label>
        </div>

        {/* Terms and Privacy */}
        <p className="text-gray-300 text-xs [font-family:'Lufga-Regular',Helvetica] leading-relaxed">
          By registering for an account, you agree to Q-worship's{" "}
          <Link
            href="/privacy-policy"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            terms and conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy-policy"
            className="text-purple-400 hover:text-purple-300 underline"
          >
            privacy policy
          </Link>
          .
        </p>

        <div className="pt-6">
          <Button
            type="submit"
            disabled={isPending}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] h-12"
          >
            {isPending ? "Creating account..." : "Create account"}
          </Button>
        </div>

        <div className="pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onSwitchToSignIn}
            className="w-full bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] h-12"
          >
            Back to Login
          </Button>
        </div>
      </form>
    </>
  );
};
