import React from "react";
import { Button } from "@/components/ui/button";
import Group_1171275473 from "@assets/Group 1171275473_1753546977705.png";

export const TestimonialSection = (): JSX.Element => {
  return (
    <section className="w-full py-16 bg-[#D9D9D9]">
      {/* Content section with proper margins matching Section 2 and 3 */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left side - Pastors image */}
          <div className="w-full lg:w-1/2">
            <img
              className="w-full h-auto object-contain"
              alt="Pastors in worship - showing Q-worship is built by pastors for pastors"
              src={Group_1171275473}
            />
          </div>

          {/* Right side - Text content */}
          <div className="w-full lg:w-1/2">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-black text-2xl md:text-3xl lg:text-4xl leading-tight mb-6">
              Q-worship is built by pastors for pastors
            </h2>

            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#6e7277] text-base md:text-lg leading-relaxed mb-8">
              Crafted by Pastors, Tailored for Pastors. Q-worship embodies the collective wisdom and needs of pastors, offering an intuitive platform that streamlines every aspect of worship. Experience innovation designed by those who understand the heartbeat of ministry.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Button className="bg-black text-white rounded-full px-6 py-3 text-sm [font-family:'Lufga-Medium',Helvetica] font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
                Get started for free
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>

              <Button
                variant="link"
                className="text-black text-sm [font-family:'Lufga-Regular',Helvetica] font-normal flex items-center gap-2 p-0 h-auto hover:text-gray-600"
              >
                Book a demo
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
