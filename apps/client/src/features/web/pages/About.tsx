import React from 'react';
import { Button } from "@/components/ui/button";
import { Section8 } from "@/features/web/components/sections/Section8";
import { 
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Link } from "wouter";
import Footer from "@/features/web/components/Footer";
import productShowcaseImage from "@assets/Frame 2085662258_1753603800542.png";
import pastorToolsetImage from "@assets/Frame 2085662080_1753686858077.png";
import pastorToolsImage from "@assets/Rectangle 41704_1753687342067.png";
import churchEngagementImage from "@assets/Rectangle 41704 (1)_1753687342066.png";
import qWorshipMicImage from "@assets/span_1753689555223.png";

import Frame_2085662223_1 from "@assets/Frame 2085662223 1.png";

export default function About() {
  // Navigation menu items
  const navItems = [
    { name: "Home", isActive: false },
    { name: "About", isActive: true },
    { name: "Features", isActive: false },
    { name: "Pricing", isActive: false },
  ];

  return (
    <div className="min-h-screen w-full overflow-x-hidden">
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
              <Link href="/signup">
                <Button
                  variant="outline"
                  className="h-12 px-6 rounded-lg bg-transparent border-white text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-white hover:text-[#0F1419] transition-colors"
                >
                  Sign Up
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
      <section className="w-full bg-[#0F1419] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-4xl md:text-5xl lg:text-6xl leading-tight mb-8">
            Built By Pastors, Built for<br />Pastors.
          </h2>
          
          <Link href="/contact">
            <Button className="bg-[#7a5af8] text-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium text-lg hover:bg-[#6949e8] transition-colors mb-16">
              Book Demo
            </Button>
          </Link>

          {/* Product Showcase Image */}
          <div className="max-w-6xl mx-auto px-4">
            <img
              className="w-full h-auto object-contain rounded-lg shadow-2xl"
              alt="Q-worship product showcase with multiple interface screens"
              src={productShowcaseImage}
            />
          </div>
        </div>
      </section>
      {/* Team Support Section */}
      <section className="w-full bg-[#0F1419] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <p className="[font-family:'Lufga-Medium',Helvetica] text-[#8B5CF6] text-sm md:text-base mb-4 uppercase tracking-wide font-semibold">
            From volunteers to Pastors
          </p>
          <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl mb-6">
            Designed with tools to support the entire team
          </h3>
          <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-lg max-w-2xl mx-auto mb-12">
            In just a few easy steps, you can get church services up and running with access to voice command Bible AI tools, multiple Bible versions, vibrant backgrounds and much more.
          </p>
        </div>
      </section>
      {/* Product Showcase Section */}
      <section className="w-full bg-gradient-to-br from-[#FDF2F8] to-[#EBF8FF] py-20">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left - Product Image */}
            <div className="flex justify-center lg:justify-start">
              <img
                className="w-full max-w-lg h-auto object-contain rounded-2xl shadow-2xl"
                alt="Q-worship pastor toolset demonstration"
                src={Frame_2085662223_1}
              />
            </div>
            
            {/* Right - Content */}
            <div className="text-center lg:text-left">
              <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-3xl md:text-4xl lg:text-5xl mb-6 leading-tight">
                The complete toolset for Pastors
              </h3>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-lg mb-8 leading-relaxed max-w-xl">
                Q-worship offers a comprehensive suite, streamlining sermon preparation, service planning, and congregation engagement. Elevate pastoral impact effortlessly with our hands-free Bible and integrated tools designed for effective ministry leadership
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button className="bg-gray-900 text-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-gray-800 transition-colors">
                  Get started for free →
                </Button>
                <Button 
                  variant="outline"
                  className="border-gray-900 text-gray-900 px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-gray-900 hover:text-white transition-colors"
                >
                  Book a demo →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Tools for Pastors Section */}
      <section className="w-full bg-[#0F1419] py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl mb-6">
              Crafted with tools for pastors<br />Churches & devotees
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Left Card */}
            <div className="bg-white rounded-2xl p-8">
              <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-xl mb-4">
                Easy access to advance
              </h4>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-base mb-6">
                Streamlined interface designed for pastors to quickly access advanced features during live services.
              </p>
              <div className="rounded-lg h-72 overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Pastor using advanced tools with Bible and technology"
                  src={pastorToolsImage}
                />
              </div>
            </div>

            {/* Right Card */}
            <div className="bg-[#E5D5FF] rounded-2xl p-8">
              <h4 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-xl mb-4">
                Increase church engagement
              </h4>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 text-base mb-6">
                Interactive features and seamless presentation tools that keep your congregation engaged throughout the service.
              </p>
              <div className="rounded-lg h-72 overflow-hidden">
                <img
                  className="w-full h-full object-cover"
                  alt="Engaged congregation with raised hands in worship"
                  src={churchEngagementImage}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Team Support Section - Direct mirror of Section 8 from Home */}
      <Section8 />
      {/* Performance Section */}
      <section className="w-full py-16 bg-[#575757]">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left - Content */}
            <div>
              <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl md:text-4xl mb-6">
                Experience the performance power of<br />our Q-worship mic
              </h3>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-white/80 text-lg mb-8 leading-relaxed">
                Crystal-clear audio capture with advanced noise cancellation technology, designed specifically for worship environments and pastoral presentations.
              </p>
              <Link href="/features">
                <Button className="bg-[#06020f] text-white px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#6949e8] transition-colors">
                  Learn More
                </Button>
              </Link>
            </div>
            
            {/* Right - Microphone Image */}
            <div className="flex justify-center">
              <div className="w-96 h-96 flex items-center justify-center">
                <img
                  className="w-full h-full object-contain"
                  alt="Q-worship professional microphone system with charging case and dual wireless mics"
                  src={qWorshipMicImage}
                />
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* Final CTA Section */}
      <section className="w-full bg-white py-16">
        <div className="container mx-auto px-4 md:px-6 lg:px-8 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="w-16 h-16 bg-[#fd348f] rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white font-bold text-xl">Q</span>
            </div>
            <h3 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-gray-900 text-2xl md:text-3xl mb-8">
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
                  className="border-[#7a5af8] text-[#7a5af8] px-8 py-4 rounded-lg [font-family:'Lufga-Medium',Helvetica] font-medium hover:bg-[#7a5af8] hover:text-white transition-colors"
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