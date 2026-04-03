import React, { createContext, useContext, useState, ReactNode, useMemo } from "react";
import type { Slide, Presentation, MediaAsset } from "@/types";

export interface DashboardPresentationContextType {
  // Service Items & Slides
  serviceItems: Array<any>;
  setServiceItems: React.Dispatch<React.SetStateAction<Array<any>>>;
  slides: Array<any>;
  totalSlides: number;
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  selectedSlide: { slideId: string; itemId: string; slide: any; item: any } | null;
  setSelectedSlide: React.Dispatch<React.SetStateAction<any>>;

  // Media
  selectedMediaAsset: any | null;
  setSelectedMediaAsset: React.Dispatch<React.SetStateAction<any>>;
  activeFilters: any[];
  setActiveFilters: React.Dispatch<React.SetStateAction<any[]>>;

  // Settings
  slideTransparency: number;
  setSlideTransparency: React.Dispatch<React.SetStateAction<number>>;
  slideTextSize: number | string;
  setSlideTextSize: React.Dispatch<React.SetStateAction<any>>;
  logoSettings: any;
  setLogoSettings: React.Dispatch<React.SetStateAction<any>>;
  transitionEffect: string;
  setTransitionEffect: React.Dispatch<React.SetStateAction<string>>;
}

const DashboardPresentationContext = createContext<DashboardPresentationContextType | undefined>(undefined);

export const DashboardPresentationProvider = ({ children }: { children: ReactNode }) => {
  const [currentSlide, setCurrentSlide] = useState(1);
  const [serviceItems, setServiceItems] = useState<Array<any>>([]);
  
  const slides = useMemo(() => {
    return serviceItems.flatMap((item) =>
      item.slides.map((slide: any) => ({ ...slide, itemId: item.id }))
    );
  }, [serviceItems]);
  const totalSlides = slides.length;

  const [selectedSlide, setSelectedSlide] = useState<{
    slideId: string;
    itemId: string;
    slide: any;
    item: any;
  } | null>(null);

  const [selectedMediaAsset, setSelectedMediaAsset] = useState<any>(null);
  const [activeFilters, setActiveFilters] = useState<any[]>([]);

  // Settings
  const [slideTransparency, setSlideTransparency] = useState(1.0);
  const [slideTextSize, setSlideTextSize] = useState<any>("large");
  const [logoSettings, setLogoSettings] = useState({
    visible: false,
    position: "bottom-right",
    size: "medium",
  });
  const [transitionEffect, setTransitionEffect] = useState("none");

  return (
    <DashboardPresentationContext.Provider
      value={{
        serviceItems, setServiceItems,
        slides, totalSlides,
        currentSlide, setCurrentSlide,
        selectedSlide, setSelectedSlide,
        selectedMediaAsset, setSelectedMediaAsset,
        activeFilters, setActiveFilters,
        slideTransparency, setSlideTransparency,
        slideTextSize, setSlideTextSize,
        logoSettings, setLogoSettings,
        transitionEffect, setTransitionEffect,
      }}
    >
      {children}
    </DashboardPresentationContext.Provider>
  );
};

export const useDashboardPresentation = () => {
  const context = useContext(DashboardPresentationContext);
  if (context === undefined) {
    throw new Error("useDashboardPresentation must be used within a DashboardPresentationProvider");
  }
  return context;
};
