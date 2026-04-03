import React from "react";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  SearchIcon,
  XIcon,
  Music,
  BookOpen,
  AlertTriangle,
  Play,
  CheckCircle,
  Globe,
  PlusIcon,
} from "lucide-react";
import { format } from "date-fns";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ServiceSectionsSidebarProps {
  // UI State
  isSidebarCollapsed: boolean;

  // Calendar State
  selectedDate: Date;
  isCalendarOpen: boolean;
  setIsCalendarOpen: (open: boolean) => void;
  renderCalendar: () => React.ReactNode;

  // Search State
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isSearchFocused: boolean;
  setIsSearchFocused: (focused: boolean) => void;

  // Voice Command State
  isVoiceMenuOpen: boolean;
  setIsVoiceMenuOpen: (open: boolean) => void;
  isListeningMode: boolean;
  toggleListening: (enabled: boolean) => void;

  // Service Sections State
  serviceSections: string[];
  selectedServiceSection: string | null;
  setSelectedServiceSection: (section: string | null) => void;
  sectionItems: Record<string, any[]>;
  expandedSections: Record<string, boolean>;
  toggleSection: (section: string) => void;

  // UI Visibility State
  isSuggestedItemsVisible: boolean;
  setIsSuggestedItemsVisible: (visible: boolean) => void;
  isAddItemVisible: boolean;
  setIsAddItemVisible: (visible: boolean) => void;

  // Content Editing State
  setEditingContent: (item: any) => void;
  setSelectedContentType: (type: string) => void;
  setCurrentSongTitle: (title: string) => void;
  setSongEditorContent: (content: string) => void;
  parseLyricsIntoSections: (lyrics: string) => any;
  setParsedLyrics: (lyrics: any) => void;
  setSongArrangement: (arrangement: string[]) => void;
  setSelectedSlide: (slide: any) => void;
  editingContent: any;
  showDeleteConfirmation: (section: string, item: any) => void;
}

export const ServiceSectionsSidebar: React.FC<ServiceSectionsSidebarProps> = ({
  selectedDate,
  isCalendarOpen,
  setIsCalendarOpen,
  renderCalendar,
  searchQuery,
  setSearchQuery,
  isSearchFocused,
  setIsSearchFocused,
  isVoiceMenuOpen,
  setIsVoiceMenuOpen,
  isListeningMode,
  toggleListening,
  serviceSections,
  selectedServiceSection,
  setSelectedServiceSection,
  sectionItems,
  expandedSections,
  toggleSection,
  isSuggestedItemsVisible,
  setIsSuggestedItemsVisible,
  isAddItemVisible,
  setIsAddItemVisible,
  setEditingContent,
  setSelectedContentType,
  setCurrentSongTitle,
  setSongEditorContent,
  parseLyricsIntoSections,
  setParsedLyrics,
  setSongArrangement,
  setSelectedSlide,
  editingContent,
  showDeleteConfirmation,
  isSidebarCollapsed,
}) => {
  return (
    <aside
      className={`bg-[#12091c] flex flex-col h-full z-10 transition-all duration-300 ease-in-out border-[#ffffff20] ${
        isSidebarCollapsed
          ? "w-0 overflow-hidden opacity-0 border-r-0"
          : "w-80 opacity-100 border-r"
      }`}>
      <div className="flex flex-col h-full bg-[#12091c] min-w-[20rem]">
        {/* Getting Started Section */}
        <div className="p-4 border-b border-gray-600 bg-gradient-to-r from-[#1E1430] to-[#261B3B]">
          <h2 className="text-white font-medium mb-1">Getting Started</h2>
          <p className="text-gray-400 text-xs">Prepare your service</p>
        </div>

        {/* Date Selector */}
        <div className="p-4 border-b border-gray-600">
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="flex items-center space-x-3 w-full bg-[#1a0f2e] border border-gray-600 rounded-lg p-3 hover:bg-[#2a1f3d] transition-colors relative">
                <CalendarIcon className="w-5 h-5 text-purple-400" />
                <div className="flex-1 text-left">
                  <div className="text-white text-sm font-medium">
                    {format(selectedDate, "EEEE")}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {format(selectedDate, "MMM d, yyyy")}
                  </div>
                </div>
                <ChevronDownIcon className="w-4 h-4 text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto p-0 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-xl"
              align="start">
              {renderCalendar()}
            </PopoverContent>
          </Popover>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-600">
          <div className="relative">
            <SearchIcon
              className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 transition-colors ${
                isSearchFocused ? "text-cyan-400" : "text-gray-400"
              }`}
            />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              placeholder="Search slides, Bible verses, songs..."
              className={`bg-[#ffffff1a] border-2 transition-all text-white pl-10 placeholder:text-gray-400 ${
                isSearchFocused
                  ? "border-cyan-400 bg-[#ffffff25]"
                  : "border-transparent hover:border-gray-500"
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors">
                <XIcon className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {searchQuery && (
            <div className="mt-2 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              <div className="p-2 space-y-1">
                <div className="text-xs text-cyan-400 font-medium px-2 py-1">
                  Bible Verses
                </div>
                <button className="w-full text-left px-2 py-1 text-sm text-white hover:bg-gray-700 rounded">
                  John 3:16 - "For God so loved the world..."
                </button>
                <button className="w-full text-left px-2 py-1 text-sm text-white hover:bg-gray-700 rounded">
                  Psalm 23:1 - "The Lord is my shepherd..."
                </button>

                <div className="text-xs text-cyan-400 font-medium px-2 py-1 mt-2">
                  Worship Songs
                </div>
                <button className="w-full text-left px-2 py-1 text-sm text-white hover:bg-gray-700 rounded">
                  Amazing Grace
                </button>
                <button className="w-full text-left px-2 py-1 text-sm text-white hover:bg-gray-700 rounded">
                  How Great Thou Art
                </button>

                <div className="text-xs text-cyan-400 font-medium px-2 py-1 mt-2">
                  Slides
                </div>
                <button className="w-full text-left px-2 py-1 text-sm text-white hover:bg-gray-700 rounded">
                  Welcome Slide
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Button 1 - Voice Commands */}
        <div className="p-4 border-b border-gray-600 relative">
          <div className="relative">
            <DropdownMenu
              open={isVoiceMenuOpen}
              onOpenChange={setIsVoiceMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button className="w-full bg-purple-300 border-2 border-purple-800 rounded-lg px-4 py-3 flex items-center justify-between text-purple-900 text-sm font-medium hover:bg-purple-200 transition-colors">
                  <span>No Voice commands detected</span>
                  <ChevronDownIcon className="w-4 h-4 text-purple-800" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[var(--radix-dropdown-menu-trigger-width)] bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg"
                align="start"
                sideOffset={4}>
                <div className="py-1">
                  <div className="flex items-center justify-between px-4 py-2 hover:bg-gray-700 transition-colors">
                    <span className="text-white text-sm">Listening Mode</span>
                    <Switch
                      checked={isListeningMode}
                      onCheckedChange={toggleListening}
                      className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-gray-600"
                    />
                  </div>
                  <button className="w-full px-4 py-2 text-left text-white text-sm hover:bg-gray-700 transition-colors">
                    End session
                  </button>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Button 2 - Suggested Items */}
        {isSuggestedItemsVisible && (
          <div className="p-4 border-b border-gray-600">
            <div className="w-full bg-cyan-400 border-2 border-cyan-600 rounded-lg px-4 py-3 flex items-center justify-between text-cyan-900 text-sm font-medium h-[50px]">
              <span>Suggested Items</span>
              <button
                onClick={() => setIsSuggestedItemsVisible(false)}
                className="hover:bg-cyan-500 rounded p-1 transition-colors">
                <XIcon className="w-4 h-4 text-cyan-900" />
              </button>
            </div>
          </div>
        )}

        {/* Service Sections */}
        <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {serviceSections.map((section) => {
              const isSelected = selectedServiceSection === section;
              const sectionItemCount = sectionItems[section]?.length || 0;

              return (
                <div key={section} className="border-b border-gray-700 pb-2">
                  <button
                    onClick={() => {
                      setSelectedServiceSection(isSelected ? null : section);
                      toggleSection(section);
                    }}
                    className={`flex items-center space-x-3 w-full text-left py-3 px-3 rounded-lg transition-all duration-300 relative ${
                      isSelected
                        ? "bg-[#8356F3]/10 border border-[#8356F3]/30"
                        : "hover:bg-[#ffffff10] border border-transparent"
                    }`}>
                    {/* Selected indicator bar */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#8356F3] rounded-r-full"></div>
                    )}
                    {expandedSections[
                      section as keyof typeof expandedSections
                    ] ? (
                      <ChevronDownIcon
                        className={`w-4 h-4 ${
                          isSelected ? "text-white" : "text-cyan-400"
                        }`}
                      />
                    ) : (
                      <ChevronRightIcon
                        className={`w-4 h-4 ${
                          isSelected ? "text-white" : "text-gray-400"
                        }`}
                      />
                    )}
                    <div className="flex-1 flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          isSelected ? "text-white" : "text-white"
                        }`}>
                        {section}
                      </span>

                      {isSelected && (
                        <div className="flex items-center space-x-1">
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                          <span className="text-xs text-white/80">
                            {sectionItemCount > 0
                              ? sectionItemCount
                              : "Selected"}
                          </span>
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Default message when section is selected - always show if selected */}
                  {isSelected && (
                    <div className="ml-7 mt-2 mb-1">
                      <p className="text-gray-400 text-xs">
                        Ready to receive items - use Insert Item menu above
                      </p>
                    </div>
                  )}

                  {expandedSections[
                    section as keyof typeof expandedSections
                  ] && (
                    <div className="ml-7 py-2 space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                      {sectionItems[section]?.length > 0 ? (
                        sectionItems[section].map((item, index) => (
                          <div
                            key={item.id}
                            className="p-4 rounded-lg cursor-pointer transition-all group hover:bg-[#ffffff10] relative">
                            <div
                              onClick={() => {
                                setEditingContent(item);
                                setSelectedContentType(item.type);

                                // Initialize song title if it's a song item
                                if (item.type === "song") {
                                  setCurrentSongTitle(
                                    item.title === "Song"
                                      ? ""
                                      : item.title || "",
                                  );

                                  // If this song has content (like "Example Song"), populate editor data for Song Editor 2
                                  if (item.content && item.content.lyrics) {
                                    setSongEditorContent(
                                      item.content.lyrics || "",
                                    );
                                    const sections = parseLyricsIntoSections(
                                      item.content.lyrics,
                                    );
                                    setParsedLyrics(sections);

                                    // Set default arrangement based on available sections
                                    const availableSections =
                                      Object.keys(sections);
                                    const defaultArrangement =
                                      availableSections.filter(
                                        (section) =>
                                          section
                                            .toLowerCase()
                                            .includes("v1") ||
                                          section
                                            .toLowerCase()
                                            .includes("verse 1") ||
                                          section
                                            .toLowerCase()
                                            .includes("v2") ||
                                          section
                                            .toLowerCase()
                                            .includes("verse 2") ||
                                          section.toLowerCase().includes("c") ||
                                          section
                                            .toLowerCase()
                                            .includes("chorus"),
                                      );
                                    setSongArrangement(
                                      defaultArrangement.length > 0
                                        ? defaultArrangement
                                        : ["V1", "V2", "C"],
                                    );
                                  }
                                }

                                // Clear any selected slide to ensure proper editor is shown
                                setSelectedSlide(null);
                              }}
                              className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded flex items-center justify-center ${
                                  item.type === "song"
                                    ? "bg-pink-500/20 border border-pink-500/30"
                                    : item.type === "bible"
                                      ? "bg-blue-500/20 border border-blue-500/30"
                                      : item.type === "announcement"
                                        ? "bg-orange-500/20 border border-orange-500/30"
                                        : item.type === "media"
                                          ? "bg-purple-500/20 border border-purple-500/30"
                                          : item.type === "liturgy"
                                            ? "bg-green-500/20 border border-green-500/30"
                                            : "bg-gray-500/20 border border-gray-500/30"
                                }`}>
                                {item.type === "song" ? (
                                  <Music className="w-4 h-4 text-pink-300" />
                                ) : item.type === "bible" ? (
                                  <BookOpen className="w-4 h-4 text-blue-300" />
                                ) : item.type === "announcement" ? (
                                  <AlertTriangle className="w-4 h-4 text-orange-300" />
                                ) : item.type === "media" ? (
                                  <Play className="w-4 h-4 text-purple-300" />
                                ) : item.type === "liturgy" ? (
                                  <CheckCircle className="w-4 h-4 text-green-300" />
                                ) : (
                                  <Globe className="w-4 h-4 text-gray-300" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-white text-sm font-medium">
                                  {item.title}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                {editingContent?.id === item.id && (
                                  <div className="w-2 h-2 bg-[#8356F3] rounded-full animate-pulse"></div>
                                )}
                                <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                              </div>
                            </div>
                            {/* Delete button - appears on hover */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                showDeleteConfirmation(section, item);
                              }}
                              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center">
                              <XIcon className="w-3 h-3 text-red-400" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-400 text-xs">
                          No items in this section
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Item */}
        {isAddItemVisible && (
          <div className="p-4">
            <Card className="bg-[#ffffff30] border-none">
              <CardContent className="p-4 text-center relative">
                <div className="flex items-center justify-center space-x-2">
                  <PlusIcon className="w-5 h-5 text-white opacity-80" />
                  <span className="text-white text-sm opacity-80">
                    Add Item
                  </span>
                </div>
                <button
                  onClick={() => setIsAddItemVisible(false)}
                  className="absolute top-2 right-2 hover:bg-[#ffffff20] rounded p-1 transition-colors">
                  <XIcon className="w-3 h-3 text-white opacity-60" />
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </aside>
  );
};
