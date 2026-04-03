import React from "react";
import { Button } from "@/components/ui/button";
import MicImage from "@assets/image_1753549304400.png";

import IMG_0356__1__2 from "@assets/IMG_0356 (1) 2.png";

export const Section7 = (): JSX.Element => {
  return (
    <div className="w-screen py-16 bg-white relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
      {/* Content section with proper margins matching other sections */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left side - Q-worship Mic image */}
          <div className="w-full lg:w-1/2">
            <img
              className="w-full h-auto object-contain"
              alt="Q-worship microphone system with wireless mics and base station"
              src={IMG_0356__1__2}
            />
          </div>

          {/* Right side - Text content */}
          <div className="w-full lg:w-1/2">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-black text-2xl md:text-3xl lg:text-4xl leading-tight mb-6">
              Meet the Q-worship Mic
            </h2>

            <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-black text-lg md:text-xl leading-tight mb-4">
              Elevating worship with unrivalled technology.
            </h3>

            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#6e7277] text-base md:text-lg leading-relaxed mb-8">
              Enjoy the added benefit of improved sermons and elevated engagement with our embedded speech to text Bible AI. Put your service on auto pilot
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
                Learn more
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};