import React from "react";
import { FeatureSection } from "@/features/web/components/sections/FeatureSection";
import { HeroSection } from "@/features/web/components/sections/HeroSection";
import { Section5 } from "@/features/web/components/sections/Section5";
import { Section6 } from "@/features/web/components/sections/Section6";
import { Section7 } from "@/features/web/components/sections/Section7";
import { Section8 } from "@/features/web/components/sections/Section8";
import { Section9 } from "@/features/web/components/sections/Section9";
import Section10 from "@/features/web/components/sections/Section10";
import Section11 from "@/features/web/components/sections/Section11";
import Section12 from "@/features/web/components/sections/Section12";
import Section13 from "@/features/web/components/sections/Section13";
import Footer from "@/features/web/components/Footer";
import { ServiceOverviewSection } from "@/features/web/components/sections/ServiceOverviewSection";
import { TestimonialSection } from "@/features/web/components/sections/TestimonialSection";

export const Home = (): JSX.Element => {
  return (
    <div className="bg-white w-full">
      {/* Hero Section */}
      <HeroSection />

      {/* Service Overview Section */}
      <ServiceOverviewSection />

      {/* Feature Section */}
      <FeatureSection />

      {/* Testimonial Section */}
      <TestimonialSection />

      {/* Section 5 */}
      <Section5 />

      {/* Section 6 */}
      <Section6 />

      {/* Section 7 */}
      <Section7 />

      {/* Section 8 */}
      <Section8 />

      {/* Section 9 */}
      <Section9 />

      {/* Section 10 */}
      <Section10 />

      {/* Section 11 */}
      <Section11 />

      {/* Section 12 */}
      <Section12 />

      {/* Section 13 */}
      <Section13 />

      {/* Footer */}
      <Footer />
    </div>
  );
};
