import supportImage from '@assets/image_1753571051827.png';

import Pexels_Photo_by_Antoni_Shkraba_Studio from "@assets/Pexels Photo by Antoni Shkraba Studio.png";

export default function Section12() {
  return (
    <div className="py-16 bg-gradient-to-br from-purple-100 via-blue-50 to-green-50">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8">
              <h2 className="[font-family:'Lufga-Medium',Helvetica] text-[#8B5CF6] text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight">
                Dedicated Support
              </h2>
              
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-700 text-lg md:text-xl leading-relaxed">
                Our team is here for you every step offering expert, faith-aware support to ensure your services run smoothly, with confidence and care.
              </p>
              
              <button className="[font-family:'Lufga-Medium',Helvetica] font-medium bg-[#8B5CF6] text-white px-8 py-4 rounded-full hover:bg-[#7C3AED] transition-all duration-300 text-lg">
                Choose plan
              </button>
            </div>

            {/* Right Image */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative max-w-full">
                <img 
                  src={Pexels_Photo_by_Antoni_Shkraba_Studio} 
                  alt="Dedicated support representative with headset" 
                  className="w-full max-w-sm sm:max-w-md lg:max-w-lg rounded-2xl shadow-lg object-cover h-auto"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}