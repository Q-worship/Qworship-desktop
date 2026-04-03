import React from 'react';
import { Button } from "@/components/ui/button";
import { 
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Link } from "wouter";
import Footer from "@/features/web/components/Footer";
import { Check, ArrowRight } from "lucide-react";
import heroWorshipImage from "@assets/Group 1171275221 1_1753732981369.png";
import liveBibleCompanionImage from "@assets/image_1753733554695.png";
import sermonRecordImage from "@assets/image_1753734604578.png";
import backgroundsImage from "@assets/image_1753735602503.png";
import qWorshipMicImage from "@assets/Group 1171275237_1753736777068.png";
import pastorInterfaceImage from "@assets/personalise 1_1753740063052.png";
import responsiveInterfaceImage from "@assets/Frame 2085662141 1_1753740063056.png";
import sermonRecordInterfaceImage from "@assets/image_1753741278188.png";
import bibleVersionsInterfaceImage from "@assets/image_1753742101307.png";
import bibleVersionsLeftImage from "@assets/Group 1171275238_1753742900712.png";
import bibleVersionsRightImage from "@assets/Group 1171275239_1753742907833.png";
import qWorshipLogo from "@assets/Group 1_1753744125839.png";

import Group_1171275523 from "@assets/Group 1171275523.png";

import Group_1171275235 from "@assets/Group 1171275235.png";

import Group_1171275212_1 from "@assets/Group 1171275212 1.png";

import Group_1171275237__1_ from "@assets/Group 1171275237 (1).png";

import speech_to_text from "@assets/speech to text.png";

export default function Features() {
  // Navigation menu items
  const navItems = [
    { name: "Home", isActive: false },
    { name: "About", isActive: false },
    { name: "Features", isActive: true },
    { name: "Pricing", isActive: false },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#0F1419]">
      {/* Header Section */}
      <section className="relative w-full bg-[#0F1419] py-4">
        <header className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center">
              <div className="relative h-[45px] w-[46px]">
                <img
                  className="w-[43px] h-[43px]"
                  alt="Q-worship logo"
                  src="/figmaAssets/ellipse-3.svg"
                />
                <div className="absolute w-[8px] h-[8px] top-[37px] left-[37px] bg-[#fd348f] rounded-[4px]" />
              </div>
              <h1 className="ml-4 [font-family:'Lufga-Medium',Helvetica] font-bold text-white text-xl md:text-2xl lg:text-3xl">
                Q-worship
              </h1>
            </div>

            {/* Navigation */}
            <NavigationMenu className="hidden lg:flex">
              <NavigationMenuList className="flex space-x-6">
                {navItems.map((item) => (
                  <NavigationMenuItem key={item.name}>
                    <NavigationMenuLink
                      className={`[font-family:'Lufga-Medium',Helvetica] font-medium text-base hover:text-[#fd348f] transition-colors ${
                        item.isActive ? "text-[#fd348f]" : "text-white"
                      }`}
                      asChild
                    >
                      <Link 
                        href={item.name === "Home" ? "/" : `/${item.name.toLowerCase()}`}
                      >
                        {item.name}
                      </Link>
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>

            {/* CTA Buttons */}
            <div className="hidden md:flex space-x-3">
              <Link href="/pricing">
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-lg bg-transparent border-white text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-white hover:text-[#0F1419] transition-colors"
                >
                  Get Started
                </Button>
              </Link>
              <Link href="/contact">
                <Button className="h-12 px-6 rounded-lg bg-[#7a5af8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-[#6949e8] transition-colors">
                  Book Demo
                </Button>
              </Link>
            </div>
          </div>
        </header>
      </section>
      {/* Hero Section */}
      <section className="w-full bg-[#0F1419] py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          {/* Hero Text */}
          <div className="text-center mb-12">
            <h1 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-4xl md:text-5xl lg:text-6xl leading-tight mb-6">
              Bring your church service to<br />
              life with automation
            </h1>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Experience the transformative power of Q-worship, increase engagement, foster deeper connections, and create unforgettable worship experiences.
            </p>
            <Link href="/contact">
              <Button className="bg-[#fd348f] text-white px-8 py-4 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#e02d7d] transition-colors">
                Book Demo
              </Button>
            </Link>
          </div>

          {/* Complete Hero Interface Image */}
          <div className="max-w-4xl mx-auto">
            <img
              className="w-full h-auto object-contain"
              alt="Complete Q-worship live streaming interface with church service, GO LIVE button, and control panel overlay"
              src={heroWorshipImage}
            />
          </div>
        </div>
      </section>
      {/* F2 - Stream Bible pages with our live Bible Companion */}
      <section className="w-full py-16 bg-[#0f1419]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Real Product Image */}
              <div className="order-2 lg:order-1">
                <img
                  className="w-full h-auto object-contain rounded-2xl"
                  alt="Hands-free Bible Companion interface showing pastor with microphone and mobile app"
                  src={Group_1171275523}
                />
              </div>
              
              {/* Right - Content */}
              <div className="order-1 lg:order-2">
                {/* Purple Badge */}
                <div className="inline-block mb-6">
                  <span className="bg-[#7a5af8] text-white px-4 py-2 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium text-sm">
                    Hands-free Bible
                  </span>
                </div>
                
                <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2d2d30] text-2xl md:text-3xl lg:text-4xl mb-6 leading-tight">
                  Search Bible Easier with our<br />
                  Hands-free Bible Companion
                </h2>
                
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-lg mb-8 leading-relaxed">
                  Our proprietary Q-worship hands-free Bible companion offers a live, on-screen hands free Bible with the option to request scriptural references by voice command during a live service.
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#05040a] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#06020f] transition-colors flex items-center gap-2">
                    Get started for free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#2d2d30] text-[#2d2d30] px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#2d2d30] hover:text-white transition-colors flex items-center gap-2"
                  >
                    Book a demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* F3 - Sermon Recording Feature */}
      <section className="w-full py-16 bg-[#0f1419]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div className="order-1 lg:order-1">
                {/* Purple Badge */}
                <div className="inline-block mb-6">
                  <span className="bg-[#7a5af8] text-white px-4 py-2 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium text-sm">
                    Sermon record
                  </span>
                </div>
                
                <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2d2d30] text-2xl md:text-3xl lg:text-4xl mb-6 leading-tight">
                  Preserve impactful messages<br />
                  with Q-worship sermon reccord
                </h2>
                
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-lg mb-8 leading-relaxed">
                  Reccord sermons in real time with the q-worship sermon reccord feature. Empower your ministry by effortlessly archiving teachings
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#05040a] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#06020f] transition-colors flex items-center gap-2">
                    Get started for free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#2d2d30] text-[#2d2d30] px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#2d2d30] hover:text-white transition-colors flex items-center gap-2"
                  >
                    Book a demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Right - Real Product Image */}
              <div className="order-2 lg:order-2">
                <img
                  className="w-full h-auto object-contain rounded-2xl"
                  alt="Q-worship sermon recording interface with live recording controls and waveform visualization"
                  src={Group_1171275235}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* F4 - Backgrounds Feature */}
      <section className="w-full py-16 bg-[#0f1419]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-blue-100 via-indigo-50 to-purple-100 rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Real Product Image */}
              <div className="order-2 lg:order-1">
                <img
                  className="w-full h-auto object-contain rounded-2xl"
                  alt="Q-worship backgrounds interface showing immersive visual themes and Bible verse displays"
                  src={Group_1171275212_1}
                />
              </div>
              
              {/* Right - Content */}
              <div className="order-1 lg:order-2">
                {/* Purple Badge */}
                <div className="inline-block mb-6">
                  <span className="bg-[#7a5af8] text-white px-4 py-2 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium text-sm">
                    Backgrounds
                  </span>
                </div>
                
                <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2d2d30] text-2xl md:text-3xl lg:text-4xl mb-6 leading-tight">
                  Breathe life into your church<br />
                  with immersive backgrounds
                </h2>
                
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-lg mb-8 leading-relaxed">
                  Add live to your church service with multiple interactive backgrounds. Choose a background for every event and make your service colourful
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#05040a] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#06020f] transition-colors flex items-center gap-2">
                    Get started for free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#2d2d30] text-[#2d2d30] px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#2d2d30] hover:text-white transition-colors flex items-center gap-2"
                  >
                    Book a demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* F5 - Q-worship Mic Feature */}
      <section className="w-full py-16 bg-[#2d2d30]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-pink-50 via-pink-25 to-white rounded-3xl p-8 lg:p-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left - Content */}
              <div className="order-1 lg:order-1">
                {/* Purple Badge */}
                <div className="inline-block mb-6">
                  <span className="bg-[#7a5af8] text-white px-4 py-2 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium text-sm">
                    Q-worship Mic
                  </span>
                </div>
                
                <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-[#2d2d30] text-xl md:text-2xl lg:text-3xl mb-6 leading-tight">
                  Elevating worship with unrivalled<br />
                  technology.
                </h2>
                
                <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-lg mb-8 leading-relaxed">
                  Enjoy the added benefit of improved sermons and elevated engagements
                </p>
                
                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="bg-[#05040a] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#06020f] transition-colors flex items-center gap-2">
                    Get started for free
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-[#2d2d30] text-[#2d2d30] px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#2d2d30] hover:text-white transition-colors flex items-center gap-2"
                  >
                    Book a demo
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {/* Right - Real Product Image */}
              <div className="order-2 lg:order-2 flex items-center justify-center">
                <img
                  className="w-full max-h-96 object-contain rounded-2xl"
                  alt="Q-worship microphone hardware showing advanced wireless technology and charging station"
                  src={Group_1171275237__1_}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* F6 - Q-worship Mic Features Grid */}
      <section className="w-full bg-[#2d2d30] py-16 ml-[1px] mr-[1px] pt-[89px] pb-[89px] mt-[-52px] mb-[-52px]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            
            {/* Feature 1: Extreme Noise Suppression */}
            <div className="bg-[#3a3a3d] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-[#FD348F]">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM15.657 6.343a1 1 0 011.414 0A9.972 9.972 0 0119 12a9.972 9.972 0 01-1.929 5.657 1 1 0 11-1.414-1.414A7.971 7.971 0 0017 12a7.971 7.971 0 00-1.343-4.243 1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                    Extreme Noise Suppression
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                    Qmic employs cutting-edge noise suppression technology, ensuring crystal-clear sound quality even in noisy environments, maintaining the focus on the speaker's voice
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2: Voice Command Activation */}
            <div className="bg-[#3a3a3d] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                    Voice Command Activation
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                    Activate Q-worship speech-to-text feature effortlessly with voice commands, offering hands-free control for pastors during sermons or worship sessions.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3: Intelligent Voice Recognition */}
            <div className="bg-[#3a3a3d] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                    Intelligent Voice Recognition
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                    Qmic's intelligent voice recognition adapts to various accents and speech patterns, ensuring accurate and efficient command recognition for seamless functionality.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4: Gesture Control */}
            <div className="bg-[#3a3a3d] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.5 16a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 16h-8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                    Gesture Control
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                    Intuitive gesture controls enable quick adjustments to volume, activation, and other settings, providing a seamless and intuitive user experience.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 5: Battery Longevity */}
            <div className="bg-[#3a3a3d] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 9V7a1 1 0 011-1h10a1 1 0 011 1v2h1a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1v-6a1 1 0 011-1h1zm2-2h8v2H6V7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                    Battery Longevity
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                    Q-worship mic boasts extended battery life, ensuring uninterrupted use throughout long services or events without the need for frequent recharging.
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 6: Secure Connectivity */}
            <div className="bg-[#3a3a3d] rounded-2xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg mb-2">
                    Secure Connectivity
                  </h3>
                  <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-sm leading-relaxed">
                    Utilizing secure connectivity protocols, the Qmic ensures a reliable and secure connection to Q-worship, preventing interference or unauthorized access.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>
      {/* Interactive Features Grid */}
      <section className="w-full py-16 bg-[#0c0c0d] mt-[42px] mb-[42px]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Feature Card 1 */}
            <div className="bg-white rounded-2xl p-8">
              <div className="rounded-lg h-48 mb-6 overflow-hidden">
                <img 
                  className="w-full h-full object-cover"
                  alt="Pastor interface showing settings panel with recent media, display options, and customization features"
                  src={pastorInterfaceImage}
                />
              </div>
              <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-xl mb-4">
                Hands-free Bible reader with our<br />
                live Bible Companion
              </h3>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-base mb-6">
                Voice-activated scripture navigation allows pastors to focus on preaching while the system automatically displays relevant Bible passages.
              </p>
              <Link href="/contact">
                <Button className="bg-[#0F1419] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-gray-800 transition-colors">
                  Learn More
                </Button>
              </Link>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-[#E5D5FF] rounded-2xl p-8">
              <div className="rounded-lg h-48 mb-6 overflow-hidden">
                <img 
                  className="w-full h-full object-cover"
                  alt="Live worship service showing responsive presentation management with slides, backgrounds, and church content"
                  src={responsiveInterfaceImage}
                />
              </div>
              <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-xl mb-4">
                Responsive Hands-On interaction<br />
                with presentations and media
              </h3>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-base mb-6">
                Interactive media controls that respond to voice commands and gesture inputs for seamless worship presentation management.
              </p>
              <Link href="/contact">
                <Button className="bg-[#0F1419] text-white px-6 py-3 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-gray-800 transition-colors">
                  Learn More
                </Button>
              </Link>
            </div>

            

            
          </div>
        </div>
      </section>
      {/* F7 - Sermon Record Section */}
      <section className="w-full bg-[#1a1a1a] py-16 mt-[4px] mb-[4px]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Left - Content */}
            <div>
              {/* Small Badge */}
              <div className="inline-block mb-6">
                <span className="bg-transparent text-[#7a5af8] px-0 py-0 [font-family:'Lufga-Regular',Helvetica] font-normal text-sm">Worship team</span>
              </div>
              
              <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-2xl md:text-3xl lg:text-4xl mb-6 leading-tight">
                Empower your worship team<br />
                with easy, engaging tools
              </h2>
              
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-300 text-lg leading-relaxed mt-[29px] mb-[29px]">
                Equip your team with simple tools to manage and import lyrics, media, and flow so they can focus fully on leading worship, not handling tech.
              </p>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-[11px] pb-[11px]">
                <Button className="bg-[#7a5af8] text-white px-6 py-3 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#6949e8] transition-colors flex items-center gap-2">
                  Get started for free
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button 
                  variant="ghost"
                  className="text-white px-6 py-3 rounded-full [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                >
                  Book a demo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Right - Interface Image */}
            <div className="order-1 lg:order-2">
              <img
                className="w-full h-auto object-contain"
                alt="Sermon record interface showing worship team management tools with verse selection, background options, and media organization"
                src={speech_to_text}
              />
            </div>
          </div>
        </div>
      </section>
      {/* F8 - Bible Versions Section */}
      <section className="w-full from-[#6b5bd6] via-[#7c6cd8] to-[#8e7dda] py-16 bg-[#524F81]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header Content */}
          <div className="text-center mb-16">
            <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight">
              Select from Multiple Bible Versions
            </h2>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/90 text-lg md:text-xl max-w-4xl mx-auto leading-relaxed">
              Trusted Bible versions at your fingertips used by churches everywhere to bring scripture to life with clarity and ease.
            </p>
          </div>

          {/* Interface Showcase - Two Images Side by Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            
            {/* Left Image - Pastor with Bible verse display */}
            <div className="flex justify-center">
              <img
                className="w-full h-80 object-cover rounded-2xl shadow-2xl max-w-lg mt-[29px] mb-[29px]"
                alt="Pastor reading from Bible with Matthew 8:20 verse displayed showing King James Version quote about foxes having holes and birds having nests, with voice command interface"
                src={bibleVersionsLeftImage}
              />
            </div>

            {/* Right Image - Bible version selection panel */}
            <div className="flex justify-center">
              <img
                className="w-full h-80 object-cover rounded-2xl shadow-2xl max-w-lg mt-[31px] mb-[31px]"
                alt="Bible version selection interface displaying Matthew 8:20 in King James Version with multiple Bible translation options including New King James Version, Amplified, Standard Version, and New International Version"
                src={bibleVersionsRightImage}
              />
            </div>

          </div>

        </div>
      </section>
      {/* Final CTA */}
      <section className="w-full bg-[#0F1419] py-16 mt-[39px] mb-[39px]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 flex items-center justify-center mx-auto mb-6">
              <img
                className="w-16 h-16 object-contain"
                alt="Q-worship logo"
                src={qWorshipLogo}
              />
            </div>
            <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-2xl md:text-3xl mb-8">
              Your complete AI Bible software
            </h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/contact">
                <Button className="bg-[#7a5af8] text-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#6949e8] transition-colors">
                  Book Demo
                </Button>
              </Link>
              <Link href="/pricing">
                <Button 
                  variant="outline"
                  className="border-white text-[#0F1419] bg-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#0F1419] hover:text-white transition-colors"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      {/* Footer */}
      <Footer />
    </div>
  );
}