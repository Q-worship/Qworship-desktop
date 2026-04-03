import React, { useState } from "react";
import { Button } from "@/components/ui/button";

export const Section9 = (): JSX.Element => {
  const [selectedPricing, setSelectedPricing] = useState(0);

  // Pricing tiers with different pricing options
  const pricingTiers = [
    {
      basic: { price: "£9.99", annual: "£99.99" },
      premium: { price: "£14.00", annual: "£140.00" }
    },
    {
      basic: { price: "£12.99", annual: "£129.99" },
      premium: { price: "£16.00", annual: "£160.00" }
    },
    {
      basic: { price: "£14.99", annual: "£149.99" },
      premium: { price: "£18.00", annual: "£180.00" }
    },
    {
      basic: { price: "£16.99", annual: "£169.99" },
      premium: { price: "£20.00", annual: "£200.00" }
    }
  ];

  const currentPricing = pricingTiers[selectedPricing];

  return (
    <div className="w-full py-16 bg-[#2B2B52] text-[#D8B4FE]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-12">
          {/* Left side - Pricing Table Info */}
          <div className="w-full lg:w-1/2">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight mb-6">
              Pricing<br />Table
            </h2>

            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-base md:text-lg leading-relaxed mb-8">
              All our plans come with a complimentary Q-worship microphone to elevate the church experience
            </p>

            {/* Pricing Slider */}
            <div className="mb-6 lg:mb-8">
              <p className="[font-family:'Lufga-Regular',Helvetica] text-sm mb-4 text-[#D8B4FE] font-semibold">
                Affordable pricing options
              </p>
              <div className="flex items-center gap-4">
                {pricingTiers.map((_, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <button
                      onClick={() => setSelectedPricing(index)}
                      className={`w-4 h-4 rounded-full transition-all ${
                        selectedPricing === index
                          ? 'bg-white'
                          : 'bg-white/30 hover:bg-white/50'
                      }`}
                    />
                    <span className="text-white/80 text-xs [font-family:'Lufga-Regular',Helvetica] mt-2">
                      {index === 0 && '1-5'}
                      {index === 1 && '6-10'}
                      {index === 2 && '11-20'}
                      {index === 3 && '20-50'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right side - Pricing Cards */}
          <div className="w-full lg:w-1/2">
            <div className="flex flex-col sm:flex-row gap-6">
              {/* Basic Plan */}
              <div className="bg-white rounded-2xl p-4 sm:p-6 flex-1">
                <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#6366f1] text-lg mb-2">
                  Basic Plan
                </h3>
                <div className="mb-4">
                  <span className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#6366f1] text-3xl">
                    {currentPricing.basic.price}
                  </span>
                  <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-sm">
                    /Month
                  </span>
                </div>
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-xs mb-3">
                  Billed yearly, prepaid at {currentPricing.basic.annual}/yr
                </p>
                <p className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-800 text-sm mb-6">
                  Plan Feature
                </p>
                <Button className="w-full bg-gradient-to-r from-[#a78bfa] to-[#fb7185] text-white rounded-full py-3 [font-family:'Lufga-Medium',Helvetica] font-medium hover:opacity-90 transition-opacity">
                  Choose plan
                </Button>
              </div>

              {/* Premium Plan */}
              <div className="bg-[#374151] rounded-2xl p-4 sm:p-6 flex-1">
                <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                  Premium Plan
                </h3>
                <div className="mb-4">
                  <span className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl">
                    {currentPricing.premium.price}
                  </span>
                  <span className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-sm">
                    /Month
                  </span>
                </div>
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-xs mb-3">
                  Billed yearly, prepaid at {currentPricing.premium.annual}/yr
                </p>
                <p className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-sm mb-6">
                  Plan Feature
                </p>
                <Button className="w-full bg-[#8b5cf6] text-white rounded-full py-3 [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#7c3aed] transition-colors">
                  Choose plan
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};