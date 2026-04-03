import React from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import Group_1171275465 from "@assets/Group 1171275465.png";

export const ServiceOverviewSection = (): JSX.Element => {
  return (
    <section className="w-full py-16 bg-[#D9D9D9]">
      {/* Top heading section */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 mb-16 text-center">
        <h2 className="[font-family:'Lufga-Medium',Helvetica] md:text-4xl lg:text-5xl font-bold text-[42px] text-[#2B1C50] mt-[12px] mb-[12px] pt-[0px] pb-[0px]">
          Why hundred of churches are using Q-worship
        </h2>
        <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#6e7277] text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
          Join the hundreds of churches who are using Q-worship and change your worship experience for the better.
        </p>
      </div>
      {/* Content section with image and text */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left side - Complete Q-worship Interface */}
          <div className="w-full lg:w-1/2">
            <img
              className="w-full h-auto object-contain"
              alt="Q-worship Hands-free Bible Companion interface with pastor speaking and scripture display"
              src={Group_1171275465}
            />
          </div>

          {/* Right side - Text content */}
          <div className="w-full lg:w-1/2">
            <h3 className="[font-family:'Lufga-Medium',Helvetica] text-black md:text-3xl lg:text-4xl mb-6 font-medium text-[35px]">
              Automate service with Hands-free Bible Companion
            </h3>

            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#6e7277] text-base md:text-lg leading-relaxed mb-8">
              Our proprietary Q-worship hands-free Bible companion uses voice command AI takes it a step further by offering a live, on-screen hands free Bible with the option to request scriptural references by voice command during a live service.
            </p>

            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link href="/pricing">
                <Button className="bg-black text-white rounded-full px-6 py-3 text-sm [font-family:'Lufga-Medium',Helvetica] font-medium flex items-center gap-2 hover:bg-gray-800 transition-colors">
                  Get started for free
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </Link>

              <Link href="/contact">
                <Button
                  variant="link"
                  className="text-black text-sm [font-family:'Lufga-Regular',Helvetica] font-normal flex items-center gap-2 p-0 h-auto hover:text-gray-600"
                >
                  Book a demo
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
