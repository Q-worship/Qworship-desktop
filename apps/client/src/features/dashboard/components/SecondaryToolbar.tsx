import React from "react";
import { ChevronDownIcon, SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SecondaryToolbarProps {
  isSidebarCollapsed: boolean;

  // Background dropdown
  isBackgroundDropdownOpen: boolean;
  setIsBackgroundDropdownOpen: (open: boolean) => void;
  setIsBackgroundAssetsModalOpen: (open: boolean) => void;
  setBackgroundModalMode: (mode: string) => void;
  setIsImportImageOpen: (open: boolean) => void;
  gradientBackgrounds: Array<{
    id: string;
    name: string;
    gradient: string;
    preview: string;
  }>;
  fillColorBackgrounds: Array<{ id: string; name: string; color: string }>;
  getCurrentItemId: () => string | null;
  serviceItems: any[];
  applyBackgroundToCurrentItem: (bg: {
    type: string;
    value: string;
    name: string;
  }) => void;
  setSelectedBackgroundType: (type: string) => void;

  // Bible Preferences dropdown
  isBiblePreferencesOpen: boolean;
  setIsBiblePreferencesOpen: (open: boolean) => void;
  selectedBibleMode: string;
  setSelectedBibleMode: (mode: string) => void;

  // Hands-free Bible button
  handsfreeBibleButtonRef: React.RefObject<HTMLButtonElement>;
  toggleHandsfreeBible: () => void;
}

export function SecondaryToolbar({
  isSidebarCollapsed,
  isBackgroundDropdownOpen,
  setIsBackgroundDropdownOpen,
  setIsBackgroundAssetsModalOpen,
  setBackgroundModalMode,
  setIsImportImageOpen,
  gradientBackgrounds,
  fillColorBackgrounds,
  getCurrentItemId,
  serviceItems,
  applyBackgroundToCurrentItem,
  setSelectedBackgroundType,
  isBiblePreferencesOpen,
  setIsBiblePreferencesOpen,
  selectedBibleMode,
  setSelectedBibleMode,
  handsfreeBibleButtonRef,
  toggleHandsfreeBible,
}: SecondaryToolbarProps) {
  const currentItemId = getCurrentItemId();
  const currentItem = serviceItems.find((item) => item.id === currentItemId);

  return (
    <div className="flex">
      <div
        className={`${isSidebarCollapsed ? "ml-0" : "ml-80"} flex-1 h-12 bg-[#3a2f5f] border-b border-gray-600 flex items-center justify-between px-4 transition-all duration-300`}>
        <div className="flex items-center space-x-4" />
        <div className="flex items-center space-x-3">
          {/* Background Dropdown with purple separators */}
          <div className="flex items-center">
            <div className="w-px h-8 bg-purple-400 mr-1" />
            <DropdownMenu
              open={isBackgroundDropdownOpen}
              onOpenChange={setIsBackgroundDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-white hover:bg-[#ffffff20] h-8 px-2">
                  <span className="text-sm">Background</span>
                  <ChevronDownIcon className="w-4 h-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="bg-[#1a0f2e] border border-[#8356F3]/20 shadow-2xl shadow-purple-500/10 w-80 p-0"
                align="end"
                sideOffset={5}>
                <div className="w-full">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-[#8356F3]/20 bg-gradient-to-r from-[#1a0f2e] to-[#2a1f3d]">
                    <h3 className="text-white text-sm font-medium">
                      Please select a background
                    </h3>
                    <div className="text-gray-400 text-xs mt-1">
                      {currentItem
                        ? `For: "${currentItem.title}"`
                        : "For current item"}
                    </div>
                  </div>

                  {/* Browse media section */}
                  <div className="px-4 py-3 border-b border-[#8356F3]/20">
                    <button
                      onClick={() => {
                        setIsBackgroundDropdownOpen(false);
                        setIsBackgroundAssetsModalOpen(true);
                        setBackgroundModalMode("browse");
                      }}
                      className="w-full text-left text-gray-300 text-sm py-2 hover:text-[#8356F3] hover:bg-[#8356F3]/10 rounded transition-all duration-200 px-2 -mx-2">
                      Browse media
                    </button>
                    <button
                      onClick={() => {
                        setIsBackgroundDropdownOpen(false);
                        setIsImportImageOpen(true);
                      }}
                      className="w-full text-left text-gray-300 text-sm py-2 hover:text-[#8356F3] hover:bg-[#8356F3]/10 rounded transition-all duration-200 px-2 -mx-2">
                      Import Media
                    </button>
                  </div>

                  {/* Gradients section */}
                  <div className="px-4 py-3 border-b border-[#8356F3]/20">
                    <h4 className="text-white text-sm font-medium mb-3">
                      Gradients
                    </h4>
                    <div className="grid grid-cols-4 gap-2">
                      {gradientBackgrounds.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => {
                            setSelectedBackgroundType("gradient");
                            applyBackgroundToCurrentItem({
                              type: "gradient",
                              value: bg.gradient,
                              name: bg.name,
                            });
                            setIsBackgroundDropdownOpen(false);
                          }}
                          className="w-16 h-12 rounded border-2 border-gray-600 hover:border-[#8356F3] hover:shadow-lg hover:shadow-[#8356F3]/20 transition-all duration-200 relative overflow-hidden hover:scale-105"
                          style={{ backgroundColor: bg.preview }}
                          title={bg.name}>
                          {bg.id === "gradient-1" && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-xs text-gray-700 font-medium">
                                No image
                              </span>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fill colour section */}
                  <div className="px-4 py-4 bg-gradient-to-b from-[#1a0f2e] to-[#0f0920]">
                    <h4 className="text-white text-sm font-medium mb-3">
                      Fill colour
                    </h4>
                    <div className="grid grid-cols-8 gap-1.5">
                      {fillColorBackgrounds.map((bg) => (
                        <button
                          key={bg.id}
                          onClick={() => {
                            setSelectedBackgroundType("fill");
                            applyBackgroundToCurrentItem({
                              type: "fill",
                              value: bg.color,
                              name: bg.name,
                            });
                            setIsBackgroundDropdownOpen(false);
                          }}
                          className="w-8 h-8 rounded border-2 border-gray-600 hover:border-[#8356F3] hover:shadow-lg hover:shadow-[#8356F3]/30 transition-all duration-200 hover:scale-110"
                          style={{ backgroundColor: bg.color }}
                          title={bg.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="w-px h-8 bg-purple-400 ml-1" />
          </div>

          {/* Image Icon */}
          <Button
            variant="ghost"
            className="w-8 h-8 p-0 hover:bg-[#ffffff20] border border-gray-500">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          </Button>

          {/* Bible Preferences Dropdown */}
          <div className="relative" data-bible-preferences-dropdown>
            <Button
              variant="ghost"
              className="w-8 h-8 p-0 hover:bg-[#ffffff20]"
              onClick={() =>
                setIsBiblePreferencesOpen(!isBiblePreferencesOpen)
              }>
              <SettingsIcon className="w-4 h-4 text-white" />
            </Button>

            {isBiblePreferencesOpen && (
              <div className="absolute top-full right-0 mt-2 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-xl z-50 min-w-[280px]">
                <div className="p-4 space-y-4">
                  <div className="border-b border-gray-600 pb-3">
                    <h3 className="text-white font-medium text-sm">
                      Hands-free Bible Quick Preferences
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">
                      Choose the hands-free Bible mode you'd like to use for
                      voice commands
                    </p>
                  </div>

                  <div className="space-y-2">
                    {[
                      "Classic Hands-free Bible",
                      "Standard Hands-free Bible",
                    ].map((mode) => (
                      <button
                        key={mode}
                        onClick={() => {
                          setSelectedBibleMode(mode);
                          setIsBiblePreferencesOpen(false);
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-colors ${
                          selectedBibleMode === mode
                            ? "border-[#8356F3] bg-[#8356F3]/10 text-white"
                            : "border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white"
                        }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{mode}</div>
                            <div className="text-xs text-gray-400 mt-1">
                              {mode === "Classic Hands-free Bible"
                                ? "Traditional voice command interface with standard Bible search"
                                : "Enhanced voice recognition with advanced search capabilities"}
                            </div>
                          </div>
                          {selectedBibleMode === mode && (
                            <div className="w-2 h-2 bg-[#8356F3] rounded-full" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-gray-600">
                    <div className="text-xs text-gray-400">
                      Current selection:{" "}
                      <span className="text-[#8356F3] font-medium">
                        {selectedBibleMode}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Hands Free Bible Button */}
          <Button
            ref={handsfreeBibleButtonRef}
            variant="ghost"
            onClick={toggleHandsfreeBible}
            className="text-white hover:bg-[#ffffff20] h-8 px-3 text-sm">
            Hands Free Bible
            <ChevronDownIcon className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
