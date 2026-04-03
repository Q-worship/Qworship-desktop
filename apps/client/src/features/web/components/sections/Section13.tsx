export default function Section13() {
  return (
    <div className="py-20 bg-gradient-to-br from-purple-100 to-purple-200">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          
          {/* Pink Circle Icon */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 bg-white rounded-full"></div>
              </div>
              {/* Small pink dot */}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-pink-400 rounded-full"></div>
            </div>
          </div>

          {/* Main Headline */}
          <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight mb-8 lg:mb-12">
            Your complete Church Companion
          </h2>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <button className="[font-family:'Lufga-Medium',Helvetica] font-medium bg-[#8B5CF6] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-[#7C3AED] transition-all duration-300 text-base sm:text-lg w-full sm:w-auto sm:min-w-[160px]">
              TRY IT FREE
            </button>
            
            <button className="[font-family:'Lufga-Medium',Helvetica] font-medium bg-transparent border-2 border-[#8B5CF6] text-[#8B5CF6] px-6 sm:px-8 py-3 sm:py-4 rounded-lg hover:bg-[#8B5CF6] hover:text-white transition-all duration-300 text-base sm:text-lg w-full sm:w-auto sm:min-w-[160px]">
              SEE PRICING
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}