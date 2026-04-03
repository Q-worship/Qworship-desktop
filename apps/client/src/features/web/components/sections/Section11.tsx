import microphoneImage from '@assets/techteam 1_1753554491531.png';

import IMG_0356__1__2 from "@assets/IMG_0356 (1) 2.png";

export default function Section11() {
  return (
    <div className="py-16 bg-white">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Main Title */}
        <div className="text-center mb-12">
          <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-3xl md:text-4xl lg:text-5xl leading-tight">
            Go further with Q-worship, elevate your experience
          </h2>
        </div>

        {/* Two Separate Cards with Connecting Ribbon */}
        <div className="relative">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-0 relative">
            
            {/* Left Card - What's New */}
            <div className="bg-[#2B2B52] rounded-2xl p-6 sm:p-8 lg:p-12 relative overflow-hidden lg:mr-2 lg:col-span-2 order-1 lg:order-none">
              <div className="relative z-10">
                <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-2xl md:text-3xl mb-4">
                  What's New
                </h3>
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-base mb-8 leading-relaxed">
                  See all the latest features enhancements, software updates, and more in Q-worship.
                </p>
                <button className="[font-family:'Lufga-Medium',Helvetica] font-medium bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-[#2B2B52] transition-all duration-300">
                  Check this out
                </button>
              </div>
              
              {/* White curved wave decoration flowing out */}
              <div className="absolute bottom-0 right-0 w-full h-32 opacity-30 overflow-hidden">
                <svg viewBox="0 0 400 120" className="w-full h-full">
                  <path d="M0,80 Q100,40 200,60 Q300,80 400,40" stroke="white" strokeWidth="6" fill="none" />
                  <path d="M0,90 Q100,50 200,70 Q300,90 400,50" stroke="white" strokeWidth="4" fill="none" />
                  <path d="M0,100 Q100,60 200,80 Q300,100 400,60" stroke="white" strokeWidth="3" fill="none" />
                </svg>
              </div>
            </div>

            {/* Right Card - Claim your free Q-worship mic */}
            <div className="bg-[#2B2B52] rounded-2xl p-6 sm:p-8 lg:p-12 relative overflow-hidden lg:ml-2 lg:col-span-3 order-2 lg:order-none">
              <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-8 relative z-10">
                <div className="flex-1 text-center lg:text-left">
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-xl sm:text-2xl md:text-3xl mb-4">Claim your free Q-worship mic</h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-sm sm:text-base mb-6 lg:mb-8 leading-relaxed">
                    Receive a free Q-worship mic when you subscribe to any of our plans
                  </p>
                  <button className="[font-family:'Lufga-Medium',Helvetica] font-medium bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg hover:bg-white hover:text-[#2B2B52] transition-all duration-300 text-sm sm:text-base">
                    See plans
                  </button>
                </div>
                
                {/* Microphone Image */}
                <div className="flex-shrink-0 max-w-full">
                  <img 
                    src={microphoneImage} 
                    alt="Q-worship microphone" 
                    className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 xl:w-64 xl:h-64 object-contain mx-auto"
                  />
                </div>
              </div>
              
              {/* White curved wave decoration flowing in */}
              <div className="absolute bottom-0 left-0 w-full h-32 opacity-30 overflow-hidden">
                <svg viewBox="0 0 400 120" className="w-full h-full">
                  <path d="M0,40 Q100,80 200,60 Q300,40 400,80" stroke="white" strokeWidth="6" fill="none" />
                  <path d="M0,50 Q100,90 200,70 Q300,50 400,90" stroke="white" strokeWidth="4" fill="none" />
                  <path d="M0,60 Q100,100 200,80 Q300,60 400,100" stroke="white" strokeWidth="3" fill="none" />
                </svg>
              </div>
            </div>
          </div>

          {/* Connecting White Ribbon Between Cards */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-24 hidden lg:block pointer-events-none">
            <svg viewBox="0 0 120 80" className="w-full h-full">
              <path 
                d="M0,40 Q30,20 60,40 Q90,60 120,40" 
                stroke="white" 
                strokeWidth="8" 
                fill="none"
                opacity="0.6"
              />
              <path 
                d="M0,35 Q30,15 60,35 Q90,55 120,35" 
                stroke="white" 
                strokeWidth="6" 
                fill="none"
                opacity="0.4"
              />
              <path 
                d="M0,45 Q30,25 60,45 Q90,65 120,45" 
                stroke="white" 
                strokeWidth="4" 
                fill="none"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}