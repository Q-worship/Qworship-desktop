import { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import qWorshipLogo from "@assets/Group 1_1753834112739.png";

// Import the organization setup image (will need to create this)
import organizationSetupImage from "@assets/image_1753814269268.png";

import Group_1171275212_1 from "@assets/Group 1171275212 1.png";

export default function OrganizationSetup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Get userId from session storage
  const actualUserId = sessionStorage.getItem('qworship_user_id') || '';
  const [orgData, setOrgData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    phone: '',
    website: '',
    denomination: '',
    size: 0,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrgData(prev => ({ 
      ...prev, 
      [name]: name === 'size' ? parseInt(value) || 0 : value 
    }));
  };

  const createOrganizationMutation = useMutation({
    mutationFn: async (data: typeof orgData & { userId: string }) => {
      const response = await apiRequest('POST', '/api/organizations', data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Organization Created",
        description: "Your church organization has been set up successfully!",
      });
      // Redirect to plan selection
      setLocation('/plan-selection');
    },
    onError: (error) => {
      toast({
        title: "Setup Failed",
        description: "There was an error setting up your organization. Please try again.",
        variant: "destructive",
      });
      console.error('Organization setup error:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!orgData.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter your church name.",
        variant: "destructive",
      });
      return;
    }
    
    if (!actualUserId) {
      toast({
        title: "Session Error",
        description: "User session not found. Please sign up again.",
        variant: "destructive",
      });
      setLocation('/signin');
      return;
    }
    
    console.log('Submitting organization data:', { ...orgData, userId: actualUserId });
    createOrganizationMutation.mutate({ ...orgData, userId: actualUserId });
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
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-6">
        <div className="w-full max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-[#4A3F7A] via-[#5D4E8A] to-[#7B6BAE] rounded-3xl overflow-hidden shadow-2xl min-h-[600px]">
            
            {/* Left Side - Organization Setup Form */}
            <div className="p-12 flex flex-col justify-center">
              <div className="max-w-md mx-auto w-full">
                <h1 className="text-white text-4xl font-bold mb-4 [font-family:'Lufga-Medium',Helvetica]">
                  Ready to elevate your worship experience?
                </h1>
                
                <p className="text-white/80 mb-8 [font-family:'Lufga-Regular',Helvetica]">
                  Thank you for downloading Q-worship. Please answer a few questions so we can help you elevate your worship experience.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Church Name */}
                  <div>
                    <Label htmlFor="name" className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
                      Church name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      value={orgData.name}
                      onChange={handleInputChange}
                      placeholder="Main Point Text Church"
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
                      required
                    />
                    <p className="text-white/60 text-xs mt-2 [font-family:'Lufga-Regular',Helvetica]">
                      The Q-worship license belongs to the church group. New churches receive a trial license.
                    </p>
                  </div>

                  {/* Church Address */}
                  <div>
                    <Label htmlFor="address" className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
                      Church address
                    </Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      value={orgData.address}
                      onChange={handleInputChange}
                      placeholder="Number 9, Greydon Road, London, SW16 2JP"
                      className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
                    />
                    <p className="text-white/60 text-xs mt-2 [font-family:'Lufga-Regular',Helvetica]">
                      Please enter an address for your church to personalise your experience.
                    </p>
                  </div>

                  {/* Additional Fields in Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city" className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
                        City
                      </Label>
                      <Input
                        id="city"
                        name="city"
                        type="text"
                        value={orgData.city}
                        onChange={handleInputChange}
                        placeholder="London"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="zipCode" className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
                        Zip Code
                      </Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        type="text"
                        value={orgData.zipCode}
                        onChange={handleInputChange}
                        placeholder="SW16 2JP"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="denomination" className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
                        Denomination
                      </Label>
                      <Input
                        id="denomination"
                        name="denomination"
                        type="text"
                        value={orgData.denomination}
                        onChange={handleInputChange}
                        placeholder="Baptist"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
                      />
                    </div>
                    <div>
                      <Label htmlFor="size" className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
                        Church Size
                      </Label>
                      <Input
                        id="size"
                        name="size"
                        type="number"
                        value={orgData.size}
                        onChange={handleInputChange}
                        placeholder="150"
                        className="mt-2 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-pink-400 focus:ring-pink-400 h-12 [font-family:'Lufga-Regular',Helvetica]"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation('/signin')}
                      className="flex-1 bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] h-12"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createOrganizationMutation.isPending}
                      className="flex-1 bg-pink-500 hover:bg-pink-600 text-white py-3 rounded-lg font-semibold [font-family:'Lufga-Medium',Helvetica] h-12"
                    >
                      {createOrganizationMutation.isPending ? 'Setting up...' : 'Next'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* Right Side - Visual Content */}
            <div className="bg-gradient-to-br from-[#7B6BAE] to-[#8B7BBE] p-12 flex flex-col justify-center items-center text-center">
              <div className="max-w-md">
                <h2 className="text-white text-3xl font-bold mb-8 leading-tight [font-family:'Lufga-Medium',Helvetica]">
                  Make it personal with visual editing tools
                </h2>

                {/* Organization Setup Visual */}
                <div className="mb-8 shadow-xl">
                  <img 
                    src={Group_1171275212_1} 
                    alt="Q-worship visual editing tools" 
                    className="w-full max-w-md rounded-2xl"
                  />
                </div>

                {/* Navigation Dots */}
                <div className="flex justify-center space-x-2">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                  <div className="w-2 h-2 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}