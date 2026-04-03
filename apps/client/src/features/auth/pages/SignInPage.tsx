import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
// import { apiRequest } from "@/lib/queryClient";
import { useAuthStore } from "@/features/auth/auth.store";
import { AuthDuplicateEmailModal } from "@/features/auth/components/AuthDuplicateEmailModal";
import { AuthErrorModal } from "@/features/auth/components/AuthErrorModal";
import { AuthMarketingCarousel } from "@/features/auth/components/AuthMarketingCarousel";
import { AuthSignInForm } from "@/features/auth/components/AuthSignInForm";
import { AuthSignUpForm } from "@/features/auth/components/AuthSignUpForm";
import qWorshipLogo from "@assets/Group 1_1753834112739.png";
import qWorshipBrandLogo from "@assets/Group 1_1753867403180.png";
import qWorshipLogoLarge from "@assets/Group 1_1753835537799.png";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showDuplicateEmailModal, setShowDuplicateEmailModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalContent, setErrorModalContent] = useState({
    title: "",
    message: "",
    type: "", // 'empty-fields' or 'invalid-credentials'
  });
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const [signUpData, setSignUpData] = useState({
    firstName: "",
    lastName: "",
    countryCode: "+44",
    phoneNumber: "",
    email: "",
    password: "",
    agreeToMarketing: false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const signInMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest("POST", "/api/auth/signin", {
        username: data.username,
        password: data.password,
      });
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to Q-worship.",
      });
      // Store user ID and JWT token for session
      sessionStorage.setItem("qworship_user_id", response.user.id.toString());
      localStorage.setItem("token", response.token);

      // Update global Zustand store
      useAuthStore.getState().setAuth(response.user);

      // Navigate to next step based on user progress
      setLocation(response.nextStep);
    },
    onError: (error: any) => {
      setErrorModalContent({
        title: "Sign-in Failed",
        message:
          "Invalid credentials. Please check your username and password and try again.",
        type: "invalid-credentials",
      });
      setShowErrorModal(true);
      console.error("Sign-in error:", error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check for empty fields
    if (!formData.username.trim() || !formData.password.trim()) {
      setErrorModalContent({
        title: "Missing Information",
        message: "Please enter both username and password to continue.",
        type: "empty-fields",
      });
      setShowErrorModal(true);
      return;
    }

    signInMutation.mutate(formData);
  };

  const handleSignUpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignUpData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (checked: boolean) => {
    setSignUpData((prev) => ({ ...prev, agreeToMarketing: checked }));
  };

  const handleCountryCodeChange = (value: string) => {
    setSignUpData((prev) => ({ ...prev, countryCode: value }));
  };

  const signUpMutation = useMutation({
    mutationFn: async (data: typeof signUpData) => {
      const userData = {
        username: data.email,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        organizationName: null,
        role: "user",
        accountType: "free",
        isActive: true,
        emailVerified: false,
      };
      const response = await apiRequest("POST", "/api/auth/register", userData);
      return await response.json();
    },
    onSuccess: (response) => {
      toast({
        title: "Account Created!",
        description: "Welcome to Q-worship! Please set up your organization.",
      });
      // Store user ID in sessionStorage for organization setup
      sessionStorage.setItem("qworship_user_id", response.user.id.toString());
      localStorage.setItem("token", response.token);

      // Update global Zustand store
      useAuthStore.getState().setAuth(response.user);

      // Navigate to organization setup
      setLocation("/organization-setup");
    },
    onError: (error: any) => {
      console.error("Sign-up error:", error);
      // The error message format is "400: {\"success\":false,\"error\":\"An account with this email already exists\"}"
      const errorMessage = error.message || "";

      // Parse the error message to extract the actual error content
      let isDuplicateEmail = false;
      try {
        // Check if the error message contains JSON data
        if (errorMessage.includes("{") && errorMessage.includes("}")) {
          const jsonPart = errorMessage.substring(errorMessage.indexOf("{"));
          const errorData = JSON.parse(jsonPart);
          if (
            errorData.error &&
            errorData.error.toLowerCase().includes("already exists")
          ) {
            isDuplicateEmail = true;
          }
        }
      } catch (parseError) {
        // If JSON parsing fails, check the raw message
        if (
          errorMessage.toLowerCase().includes("already exists") ||
          errorMessage.toLowerCase().includes("duplicate")
        ) {
          isDuplicateEmail = true;
        }
      }

      if (isDuplicateEmail) {
        setShowDuplicateEmailModal(true);
      } else {
        toast({
          title: "Sign-up Failed",
          description:
            errorMessage ||
            "There was an error creating your account. Please try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpData.firstName || !signUpData.email || !signUpData.password) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    signUpMutation.mutate(signUpData);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-6 pt-24 pb-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-[#5A4B7C] via-[#6B5B95] to-[#7B6BAE] rounded-3xl p-0 overflow-hidden shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[600px]">
              {/* Left Side - Login/SignUp Form */}
              <div className="bg-gradient-to-br from-[#4A4570] to-[#6B5B95] p-12 flex flex-col justify-center">
                <div className="max-w-md mx-auto w-full">
                  {!isSignUp ? (
                    <AuthSignInForm
                      formData={formData}
                      isPending={signInMutation.isPending}
                      onInputChange={handleInputChange}
                      onSubmit={handleSubmit}
                      onSwitchToSignUp={() => setIsSignUp(true)}
                    />
                  ) : (
                    <AuthSignUpForm
                      signUpData={signUpData}
                      isPending={signUpMutation.isPending}
                      onInputChange={handleSignUpInputChange}
                      onCountryCodeChange={handleCountryCodeChange}
                      onCheckboxChange={handleCheckboxChange}
                      onSubmit={handleSignUpSubmit}
                      onSwitchToSignIn={() => setIsSignUp(false)}
                    />
                  )}
                </div>
              </div>

              {/* Right Side - Marketing Content */}
              <AuthMarketingCarousel isSignUp={isSignUp} />
            </div>
          </div>
        </div>
      </div>
      {/* Duplicate Email Modal */}
      <AuthDuplicateEmailModal
        open={showDuplicateEmailModal}
        onOpenChange={setShowDuplicateEmailModal}
        onSignInInstead={() => {
          setShowDuplicateEmailModal(false);
          setIsSignUp(false);
          setFormData((prev) => ({ ...prev, username: signUpData.email }));
        }}
        onTryDifferentEmail={() => {
          setShowDuplicateEmailModal(false);
          setSignUpData((prev) => ({ ...prev, email: "" }));
        }}
      />

      {/* Themed Error Modal */}
      <AuthErrorModal
        open={showErrorModal}
        onOpenChange={setShowErrorModal}
        title={errorModalContent.title}
        message={errorModalContent.message}
        type={errorModalContent.type}
        onTryAgain={() => setShowErrorModal(false)}
      />
    </div>
  );
}
