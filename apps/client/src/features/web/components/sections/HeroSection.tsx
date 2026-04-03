import React from "react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import { Link } from "wouter";

export const HeroSection = (): JSX.Element => {
  // Navigation menu items data
  const navItems = [
    { name: "Home", isActive: true },
    { name: "About", isActive: false },
    { name: "Features", isActive: false },
    { name: "Pricing", isActive: false },
  ];

  return (
    <section className="relative w-full bg-[#100730] pt-4 pb-12 overflow-hidden min-h-screen">
      {/* Header/Navigation */}
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
                      href={
                        item.name === "Home"
                          ? "/"
                          : `/${item.name.toLowerCase()}`
                      }
                    >
                      {item.name}
                    </Link>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white p-2">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* CTA Buttons */}
          <div className="hidden md:flex space-x-3">
            {/* <Link href="/login">
              <Button
                variant="ghost"
                className="h-12 px-6 rounded-lg text-white [font-family:'Lufga-Medium',Helvetica] text-sm hover:bg-white/10 transition-colors font-bold"
              >
                Log In
              </Button>
            </Link> */}
            <Link href="/signup">
              <Button
                variant="outline"
                className="h-12 px-6 rounded-lg bg-white text-[#102865] [font-family:'Lufga-Medium',Helvetica] text-sm hover:bg-gray-50 transition-colors font-bold"
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
      {/* Mobile CTA Buttons */}
      <div className="md:hidden container mx-auto px-4 mt-8">
        <div className="flex flex-col space-y-3">
          <Link href="/login">
            <Button
              variant="outline"
              className="h-12 w-full rounded-lg bg-transparent border-white text-white [font-family:'Lufga-Medium',Helvetica] text-sm hover:bg-white/10 transition-colors font-bold"
            >
              Log In
            </Button>
          </Link>
          <Link href="/signup">
            <Button
              variant="outline"
              className="h-12 w-full rounded-lg bg-white text-[#102865] [font-family:'Lufga-Medium',Helvetica] text-sm hover:bg-gray-50 transition-colors font-bold"
            >
              Sign Up
            </Button>
          </Link>
          <Link href="/contact">
            <Button className="h-12 w-full rounded-lg bg-[#7a5af8] text-white [font-family:'Lufga-Medium',Helvetica] font-medium text-sm hover:bg-[#6949e8] transition-colors">
              Book Demo
            </Button>
          </Link>
        </div>
      </div>
      {/* Hero Content */}
      <div className="container mx-auto px-4 md:px-6 lg:px-8 mt-20 md:mt-28 lg:mt-32 text-center">
        <h2 className="[font-family:'Lufga-Medium',Helvetica] font-medium text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl leading-tight">
          Changing the phase of worship.
        </h2>

        <p className="mt-6 md:mt-8 lg:mt-10 [font-family:'Lufga-Medium',Helvetica] font-medium text-white text-lg md:text-xl lg:text-2xl leading-relaxed max-w-4xl mx-auto">
          Finally, a church presentation system built with Bible AI, songs,
          lyrics, slides and much more
        </p>

        <div className="flex flex-col md:flex-row justify-center gap-4 mt-8 md:mt-10 lg:mt-12">
          <Link href="/pricing">
            <Button className="h-14 w-full md:w-[200px] rounded-lg bg-[#7a5af8] text-white [font-family:'Lufga-Medium',Helvetica] font-semibold text-base hover:bg-[#6949e8] transition-colors">
              Get Started
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              className="h-14 w-full md:w-[200px] rounded-lg bg-[#30284c] text-white [font-family:'Lufga-Medium',Helvetica] font-semibold text-base border-none hover:bg-[#3a3250] transition-colors"
            >
              Book Demo
            </Button>
          </Link>
        </div>
      </div>
      {/* Bottom Video */}
      <div className="mt-16 md:mt-20 lg:mt-24 flex justify-center px-4">
        <video
          className="w-full max-w-6xl object-contain h-auto rounded-lg"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/worship-loop.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    </section>
  );
};
