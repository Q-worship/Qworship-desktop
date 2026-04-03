import { Check, X } from 'lucide-react';

export default function Section10() {
  return (
    <div className="w-full py-16 bg-[#DDD6F3]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="relative">
          {/* Main comparison table */}
          <div className="hidden md:grid grid-cols-4 gap-0">
          
            
            {/* First Column - Questions */}
            <div className="bg-[#B8A8DB] rounded-l-xl">
              {/* Header */}
              <div className="p-4 h-16 flex items-center">
                <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm leading-tight">
                  Why choose Q-worship over your favorite church presentation systems ?
                </h3>
              </div>
              
              {/* Feature rows */}
              <div className="p-4 border-t border-white/20">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  Q-worship Handsfree Bible Voice Command AI with up to 6 Bible versions
                </p>
              </div>
              
              <div className="p-4 border-t border-white/20">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  Q-worship extreme noise cancellation and enhancement mic (free)
                </p>
              </div>
              
              {/* Basic Plan */}
              <div className="p-4 border-t border-white/20">
                <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm">
                  Basic Plan
                </h4>
              </div>
              
              {/* Advanced Plan */}
              <div className="p-4 border-t border-white/20">
                <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm">
                  Advanced plan
                </h4>
              </div>
            </div>

            {/* Easy Worship Column */}
            <div className="bg-[#EEEAEF]">
              {/* Header */}
              <div className="p-4 h-16 flex items-center justify-center border-l border-white/30">
                <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm">
                  Easy Worship
                </h4>
              </div>
              
              {/* Feature responses */}
              <div className="p-4 border-t border-white/20 border-l border-white/30 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              
              <div className="p-4 border-t border-white/20 border-l border-white/30 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              
              {/* Basic Plan */}
              <div className="p-4 border-t border-white/20 border-l border-white/30">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  From £12.40/mo Billed yearly, prepaid at £148/yr
                </p>
              </div>
              
              {/* Advanced Plan */}
              <div className="p-4 border-t border-white/20 border-l border-white/30">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  From £20/mo Billed yearly, prepaid at £240/yr
                </p>
              </div>
            </div>

            {/* Faithlife Proclaim Column */}
            <div className="bg-[#EEEAEF]">
              {/* Header */}
              <div className="p-4 h-16 flex items-center justify-center border-l border-white/30">
                <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm">
                  Faithlife Proclaim
                </h4>
              </div>
              
              {/* Feature responses */}
              <div className="p-4 border-t border-white/20 border-l border-white/30 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              
              <div className="p-4 border-t border-white/20 border-l border-white/30 flex items-center justify-center">
                <X className="w-5 h-5 text-red-500" />
              </div>
              
              {/* Basic Plan */}
              <div className="p-4 border-t border-white/20 border-l border-white/30">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  From £12.40/mo Billed yearly, prepaid at £148/yr
                </p>
              </div>
              
              {/* Advanced Plan */}
              <div className="p-4 border-t border-white/20 border-l border-white/30">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  From £31/mo Billed yearly, prepaid at £372/yr
                </p>
              </div>
            </div>

            {/* Q-worship Column - This will be overlaid with white card */}
            <div className="bg-[#EEEAEF] rounded-r-xl">
              <div className="p-4 h-16"></div>
              <div className="p-4 border-t border-white/20"></div>
              <div className="p-4 border-t border-white/20"></div>
              <div className="p-4 border-t border-white/20"></div>
              <div className="p-4 border-t border-white/20"></div>
            </div>
          </div>

          {/* Q-worship White Card Overlay */}
          <div className="absolute top-0 right-0 w-1/4 bg-white rounded-xl shadow-lg p-4 h-full flex flex-col">
            {/* Header */}
            <div className="h-16 flex items-center justify-center">
              <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#E91E63] text-sm">
                Q-worship
              </h4>
            </div>
            
            {/* Feature responses */}
            <div className="flex-1 flex flex-col">
              <div className="p-4 flex items-center justify-center border-t border-gray-100">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              
              <div className="p-4 flex items-center justify-center border-t border-gray-100">
                <Check className="w-5 h-5 text-green-500" />
              </div>
              
              {/* Basic Plan */}
              <div className="p-4 border-t border-gray-100">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  From £16.50 Billed yearly, prepaid at £194.82/yr
                </p>
              </div>
              
              {/* Advanced Plan */}
              <div className="p-4 border-t border-gray-100">
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-[#2B2B52] text-xs">
                  From £31/mo Billed yearly, prepaid at £199.99/yr with 1x Free Q-worship mic
                </p>
              </div>
            </div>
          </div>

          {/* Mobile-friendly version */}
          <div className="md:hidden space-y-6">
            <div className="text-center mb-6">
              <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-xl mb-4">
                Why choose Q-worship?
              </h2>
            </div>

            {/* Mobile comparison cards */}
            <div className="space-y-4">
              <div className="bg-[#B8A8DB] rounded-xl p-4">
                <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm mb-3">
                  Q-worship Handsfree Bible Voice Command AI
                </h3>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className="text-[#2B2B52] font-medium text-xs mb-1">Q-worship</div>
                    <Check className="w-4 h-4 text-green-500 mx-auto" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-[#2B2B52] font-medium text-xs mb-1">Easy Worship</div>
                    <X className="w-4 h-4 text-red-500 mx-auto" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-[#2B2B52] font-medium text-xs mb-1">ProPresenter</div>
                    <X className="w-4 h-4 text-red-500 mx-auto" />
                  </div>
                </div>
              </div>

              <div className="bg-[#EEEAEF] rounded-xl p-4">
                <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2B2B52] text-sm mb-3">
                  Free Enhancement Microphone
                </h3>
                <div className="flex justify-between items-center">
                  <div className="text-center flex-1">
                    <div className="text-[#2B2B52] font-medium text-xs mb-1">Q-worship</div>
                    <Check className="w-4 h-4 text-green-500 mx-auto" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-[#2B2B52] font-medium text-xs mb-1">Easy Worship</div>
                    <X className="w-4 h-4 text-red-500 mx-auto" />
                  </div>
                  <div className="text-center flex-1">
                    <div className="text-[#2B2B52] font-medium text-xs mb-1">ProPresenter</div>
                    <X className="w-4 h-4 text-red-500 mx-auto" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}