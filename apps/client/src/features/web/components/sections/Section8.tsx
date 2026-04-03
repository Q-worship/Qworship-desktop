import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import TechTeamImage from "@assets/techteam 1_1753554491531.png";
import WorshipTeamImage from "@assets/song.png";
import PastoralTeamImage from "@assets/Sermon-Record.png";

export const Section8 = (): JSX.Element => {
  const [activeTab, setActiveTab] = useState<'technical' | 'worship' | 'pastoral'>('technical');

  const tabContent = {
    technical: {
      title: "Technical Team",
      description: "Our user-friendly tools empower tech teams to craft presentations, control speech-to-text Bible features remotely, and create seamless slides all from a single, intuitive platform.",
      image: TechTeamImage // techteam interface screenshot
    },
    worship: {
      title: "Worship Team", 
      description: "Streamline worship preparation with integrated song libraries. Worship teams can easily plan setlists, sync lyrics, and manage media in real time. Q-Worship helps create smooth, spirit-led transitions so your team can focus less on logistics and more on leading authentic, powerful worship.",
      image: WorshipTeamImage // song/worship interface
    },
    pastoral: {
      title: "Pastoral Team",
      description: "Enhance sermon delivery with AI-powered scripture navigation, automated verse display, and hands-free Bible companion. Pastors can prepare sermons, schedule services, and access scripture tools all from one place. Q-Worship simplifies planning, supports biblical accuracy, and frees pastors to focus on shepherding their people with clarity and purpose.",
      image: PastoralTeamImage // sermon recording interface
    }
  };

  const currentContent = tabContent[activeTab];

  return (
    <div className="w-screen py-16 from-[#6366f1] to-[#8b5cf6] relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] bg-[#524F81]">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        {/* Section heading */}
        <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl lg:text-5xl leading-tight text-center mb-16">
          Designed with tools to support<br />the entire team
        </h2>

        {/* Tab buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Button
            onClick={() => setActiveTab('technical')}
            className={`px-8 py-3 rounded-full text-base [font-family:'Lufga-Medium',Helvetica] font-medium transition-all ${
              activeTab === 'technical'
                ? 'bg-[#a78bfa] text-white'
                : 'bg-[#1f2937] text-white hover:bg-[#374151]'
            }`}
          >
            Technical Team
          </Button>
          <Button
            onClick={() => setActiveTab('worship')}
            className={`px-8 py-3 rounded-full text-base [font-family:'Lufga-Medium',Helvetica] font-medium transition-all ${
              activeTab === 'worship'
                ? 'bg-[#a78bfa] text-white'
                : 'bg-[#1f2937] text-white hover:bg-[#374151]'
            }`}
          >
            Worship Team
          </Button>
          <Button
            onClick={() => setActiveTab('pastoral')}
            className={`px-8 py-3 rounded-full text-base [font-family:'Lufga-Medium',Helvetica] font-medium transition-all ${
              activeTab === 'pastoral'
                ? 'bg-[#a78bfa] text-white'
                : 'bg-[#1f2937] text-white hover:bg-[#374151]'
            }`}
          >
            Pastoral Team
          </Button>
        </div>

        {/* Content area */}
        <div className="flex flex-col lg:flex-row items-center gap-12">
          {/* Left side - Image */}
          <div className="w-full lg:w-1/2">
            <div className="rounded-lg overflow-hidden">
              <img
                key={activeTab}
                className="w-full h-auto object-cover"
                alt={`${currentContent.title} interface preview showing Q-worship platform in action`}
                src={currentContent.image}
              />
            </div>
          </div>

          {/* Right side - Text content */}
          <div className="w-full lg:w-1/2">
            <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-2xl md:text-3xl leading-tight mb-6">
              {currentContent.title}
            </h3>

            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-base md:text-lg leading-relaxed mb-8">
              {currentContent.description}
            </p>

            <Button className="bg-white text-[#6366f1] rounded-full px-6 py-3 text-sm [font-family:'Lufga-Medium',Helvetica] font-medium flex items-center gap-2 hover:bg-gray-100 transition-colors">
              Learn more
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};