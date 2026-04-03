import React, { useState, useEffect } from 'react';
import qWorshipLogoLarge from "@assets/Group 1_1753835537799.png";
import qWorshipInterface from "@assets/Group 1171275235 (1)_1753835853749.png";
import techTeamImage from "@assets/techteam 1_1753839058801.png";
import qWorshipMicrophone from "@assets/span_1753839325270.png";

interface AuthMarketingCarouselProps {
  isSignUp: boolean;
}

export const AuthMarketingCarousel: React.FC<AuthMarketingCarouselProps> = ({ isSignUp }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // Auto-rotate slides every 6 seconds when in the Sign Up view
  useEffect(() => {
    if (isSignUp) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % 2);
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isSignUp]);

  return (
    <div className="bg-gradient-to-br from-[#7B6BAE] to-[#8B7BBE] p-12 flex flex-col justify-center items-center text-center h-full">
      <div className="max-w-md w-full">
        {!isSignUp ? (
          <>
            {/* Q-worship Logo */}
            <div className="w-20 h-20 mb-8 mx-auto flex items-center justify-center">
              <img 
                src={qWorshipLogoLarge} 
                alt="Q-worship logo" 
                className="w-20 h-20"
              />
            </div>

            <h2 className="text-white text-3xl font-bold mb-8 leading-tight [font-family:'Lufga-Medium',Helvetica]">
              Changing the way you deliver worship
            </h2>

            {/* App Preview Interface */}
            <div className="mb-8 shadow-xl">
              <img 
                src={qWorshipInterface} 
                alt="Q-worship interface preview" 
                className="w-full max-w-md rounded-2xl"
              />
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center space-x-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <div className="w-2 h-2 bg-white/30 rounded-full"></div>
              <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            </div>
          </>
        ) : (
          <>
            {/* Slide Content */}
            <div className="transition-all duration-500 ease-in-out">
              {currentSlide === 0 ? (
                <>
                  <h2 className="text-white text-3xl font-bold mb-8 leading-tight [font-family:'Lufga-Medium',Helvetica]">
                    Built with tools to support the entire team
                  </h2>

                  {/* Tech Team Interface Preview */}
                  <div className="mb-8 shadow-xl">
                    <img 
                      src={techTeamImage} 
                      alt="Q-worship tech team interface" 
                      className="w-full max-w-md rounded-2xl"
                    />
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-white text-3xl font-bold mb-8 leading-tight [font-family:'Lufga-Medium',Helvetica]">
                    Sign up today and elevate your church experience with your free Q-worship mic
                  </h2>

                  {/* Q-worship Microphone Preview */}
                  <div className="mb-8 shadow-xl">
                    <img 
                      src={qWorshipMicrophone} 
                      alt="Q-worship microphone system" 
                      className="w-full max-w-md rounded-2xl"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center space-x-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentSlide === 0 ? 'bg-pink-500' : 'bg-white/30'}`}></div>
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${currentSlide === 1 ? 'bg-pink-500' : 'bg-white/30'}`}></div>
              <div className="w-2 h-2 bg-white/30 rounded-full"></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
