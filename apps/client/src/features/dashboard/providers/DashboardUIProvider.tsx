import React, { createContext, useContext, useState, ReactNode } from "react";

export interface DashboardUIContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isFullscreen: boolean;
  setIsFullscreen: (fullscreen: boolean) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  activeMediaTab: "cloud" | "my";
  setActiveMediaTab: (tab: "cloud" | "my") => void;
  isLiveMode: boolean;
  setIsLiveMode: (live: boolean) => void;
}

const DashboardUIContext = createContext<DashboardUIContextType | undefined>(undefined);

export const DashboardUIProvider = ({ children }: { children: ReactNode }) => {
  const [activeTab, setActiveTab] = useState("Project");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<"cloud" | "my">("cloud");
  const [isLiveMode, setIsLiveMode] = useState(false);

  return (
    <DashboardUIContext.Provider
      value={{
        activeTab,
        setActiveTab,
        isFullscreen,
        setIsFullscreen,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        activeMediaTab,
        setActiveMediaTab,
        isLiveMode,
        setIsLiveMode,
      }}
    >
      {children}
    </DashboardUIContext.Provider>
  );
};

export const useDashboardUI = () => {
  const context = useContext(DashboardUIContext);
  if (context === undefined) {
    throw new Error("useDashboardUI must be used within a DashboardUIProvider");
  }
  return context;
};
