import React from "react";
import {
  SidebarOpen,
  SidebarClose,
  XIcon,
  Music,
  Book,
  CheckCircle,
  Globe,
  Play,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import qworshipLogoEdit from "@/assets/logo.png"; // Fallback logo import
import { OnScreenBibleEditor } from "./OnScreenBibleEditor"; // Required import

interface EditAndPreparationAreaProps {
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  editingContent: any;
  setEditingContent: (content: any) => void;
  selectedServiceSection: string | null;
  selectedSlide: any;
  setSelectedSlide: (slide: any) => void;
  setIsSlideEditorOpen: (open: boolean) => void;
  serviceItems: any[];
  updateItemContent: (
    id: string,
    title?: string,
    content?: any,
    slides?: any[],
  ) => void;
  insertedItems: any[];
  setSelectedContentType: (type: string) => void;
  currentSongTitle: string;
  setCurrentSongTitle: (title: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  titleEditorState: any;
  showAuthorOnScreen: boolean;
  editorState: any;
  slides: any[];
  totalSlides: number;
}

export const EditAndPreparationArea: React.FC<EditAndPreparationAreaProps> = ({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  editingContent,
  setEditingContent,
  selectedServiceSection,
  selectedSlide,
  setSelectedSlide,
  setIsSlideEditorOpen,
  serviceItems,
  updateItemContent,
  insertedItems,
  setSelectedContentType,
  currentSongTitle,
  setCurrentSongTitle,
  activeTab,
  setActiveTab,
  titleEditorState,
  showAuthorOnScreen,
  editorState,
  slides,
  totalSlides,
}) => {
  return (
    <div className="flex-1 bg-[#1a0f2e] p-6 border-r border-gray-600">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-gray-400 hover:text-white hover:bg-[#ffffff20] w-8 h-8 p-0"
              title={isSidebarCollapsed ? "Show sidebar" : "Hide sidebar"}>
              {isSidebarCollapsed ? (
                <SidebarOpen className="w-4 h-4" />
              ) : (
                <SidebarClose className="w-4 h-4" />
              )}
            </Button>
            <h3 className="text-white font-medium text-lg">
              Edit & Preparation
            </h3>
          </div>
          <div className="text-gray-400 text-sm">
            {editingContent
              ? `Editing: ${editingContent.title}`
              : selectedServiceSection
                ? `Section: ${selectedServiceSection}`
                : "Select service section first"}
          </div>
        </div>

        {/* Edit Content Area */}
        <div className="flex-1 border-2 border-dashed border-gray-600 rounded-lg">
          {selectedSlide ? (
            /* Slide Editor */
            <div className="p-6 h-full overflow-y-auto">
              <div className="space-y-6">
                {/* Slide Header */}
                <div className="flex items-center justify-between pb-4 border-b border-gray-600">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                        selectedSlide.slide.type === "bible"
                          ? "bg-green-500/20 text-green-300"
                          : selectedSlide.slide.type === "verse" ||
                              selectedSlide.slide.type === "chorus"
                            ? "bg-blue-500/20 text-blue-300"
                            : "bg-gray-500/20 text-gray-300"
                      }`}>
                      {selectedSlide.slide.type === "bible"
                        ? "📖"
                        : selectedSlide.slide.type === "verse" ||
                            selectedSlide.slide.type === "chorus"
                          ? "🎵"
                          : "📄"}
                    </div>
                    <div>
                      <h4 className="text-white font-medium text-lg">
                        {selectedSlide.slide.title}
                      </h4>
                      <p className="text-gray-400 text-sm">
                        {selectedSlide.slide.type === "bible"
                          ? "Bible Verse"
                          : selectedSlide.slide.type === "verse"
                            ? "Song Verse"
                            : selectedSlide.slide.type === "chorus"
                              ? "Song Chorus"
                              : "Custom Slide"}{" "}
                        • From: {selectedSlide.item.title}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSlide(null);
                      setIsSlideEditorOpen(false);
                    }}
                    className="text-gray-400 hover:text-white transition-colors">
                    <XIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Slide Content Editor */}
                <div className="space-y-4">
                  {selectedSlide.slide.type === "bible" ? (
                    /* Bible Verse Slide Editor - Enhanced with Bible-specific controls */
                    <>
                      <div>
                        <label className="text-white font-medium block mb-2">
                          Scripture Reference
                        </label>
                        <Input
                          value={
                            selectedSlide.slide.bibleReference ||
                            selectedSlide.slide.title
                          }
                          onChange={(e) => {
                            // Update Bible reference functionality
                            const newReference = e.target.value;
                            const parentItem = serviceItems.find(
                              (item) => item.id === selectedSlide.itemId,
                            );
                            if (parentItem) {
                              // Update the parent item's Bible reference
                              updateItemContent(parentItem.id, newReference, {
                                ...parentItem.content,
                                reference: newReference,
                              });
                            }
                          }}
                          className="bg-[#2a1f3d] border-gray-600 text-white"
                          placeholder="e.g., John 3:16"
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium block mb-2">
                          Verse Content
                        </label>
                        <textarea
                          value={selectedSlide.slide.content}
                          onChange={(e) => {
                            // Update slide content functionality - read-only for now since it comes from Bible data
                            console.log(
                              "Bible verse content is controlled by the main Bible editor settings",
                            );
                          }}
                          className="w-full h-32 p-3 bg-[#2a1f3d] border border-gray-600 rounded-lg text-white resize-none"
                          placeholder="Bible verse content..."
                          readOnly
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          This content is controlled by the main Bible editor
                          settings and translation selection.
                        </p>
                      </div>

                      {/* Live Preview Screen - Shows how the verse will appear */}
                      <div>
                        <label className="text-white font-medium block mb-2">
                          Slide Preview
                        </label>
                        <div className="w-full h-48 bg-black border border-gray-600 rounded-lg relative overflow-hidden">
                          {/* Background with Q-worship styling */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20"></div>

                          {/* Content overlay */}
                          <div className="relative h-full flex flex-col justify-center items-center p-4">
                            {(() => {
                              const parentItem = serviceItems.find(
                                (item) => item.id === selectedSlide.itemId,
                              );
                              const referenceDisplay =
                                parentItem?.content?.referenceDisplay ||
                                "every-slide";
                              const versionDisplay =
                                parentItem?.content?.versionDisplay ||
                                "every-slide";
                              const includeVerseNumbers =
                                parentItem?.content?.includeVerseNumbers ||
                                false;
                              const bibleVersion =
                                selectedSlide.slide.bibleVersion ||
                                parentItem?.content?.version ||
                                "KJV";
                              const reference =
                                selectedSlide.slide.bibleReference ||
                                selectedSlide.slide.title;

                              // Determine current slide position (for first/last slide logic)
                              const allSlides = parentItem?.slides || [];
                              const currentSlideIndex = allSlides.findIndex(
                                (s) => s.id === selectedSlide.slide.id,
                              );
                              const isFirstSlide = currentSlideIndex === 0;
                              const isLastSlide =
                                currentSlideIndex === allSlides.length - 1;

                              // Determine if reference should show
                              const showReference =
                                referenceDisplay === "every-slide" ||
                                (referenceDisplay === "first-slide" &&
                                  isFirstSlide) ||
                                (referenceDisplay === "last-slide" &&
                                  isLastSlide);

                              // Determine if version should show
                              const showVersion =
                                versionDisplay === "every-slide" ||
                                (versionDisplay === "first-slide" &&
                                  isFirstSlide) ||
                                (versionDisplay === "last-slide" &&
                                  isLastSlide);

                              return (
                                <>
                                  <div className="text-white text-lg font-medium text-center max-w-full overflow-hidden text-ellipsis px-4">
                                    {selectedSlide.slide.content}
                                  </div>
                                  <div className="mt-4 flex flex-col items-center">
                                    <div className="text-purple-300 text-sm font-semibold">
                                      {showReference ? reference : ""}
                                    </div>
                                    <div className="text-gray-400 text-xs mt-1">
                                      {showVersion ? bibleVersion : ""}
                                    </div>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Default Slide Editor for other types */
                    <>
                      <div>
                        <label className="text-white font-medium block mb-2">
                          Slide Title
                        </label>
                        <Input
                          value={selectedSlide.slide.title}
                          onChange={(e) => {
                            // Update title functionality
                            const newSlides = [...slides];
                            const index = newSlides.findIndex(
                              (s) => s.id === selectedSlide.slide.id,
                            );
                            if (index !== -1) {
                              newSlides[index].title = e.target.value;
                              // Update main state and serviceItems logic here
                            }
                          }}
                          className="bg-[#2a1f3d] border-gray-600 text-white"
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium block mb-2">
                          Content
                        </label>
                        <textarea
                          value={selectedSlide.slide.content}
                          onChange={(e) => {
                            // Update content functionality
                            const newContent = e.target.value;
                            const parentItem = serviceItems.find(
                              (item) => item.id === selectedSlide.itemId,
                            );
                            if (parentItem) {
                              // We update the parent item which will regenerate slides
                              if (
                                parentItem.type === "song" &&
                                parentItem.content?.lyrics
                              ) {
                                // Basic approach for song - real implementation would update specific verse
                                console.log(
                                  "Editing song verse directly not fully implemented",
                                );
                              } else if (parentItem.type === "announcement") {
                                updateItemContent(
                                  parentItem.id,
                                  parentItem.title,
                                  newContent,
                                );
                              }
                            }
                          }}
                          className="w-full h-48 p-3 bg-[#2a1f3d] border border-gray-600 rounded-lg text-white resize-none"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : insertedItems.length > 0 ? (
            /* Content List */
            <div className="p-4 space-y-3 overflow-y-auto h-full">
              {insertedItems.map((item, index) => (
                <div
                  key={item.id}
                  onClick={() => {
                    console.log("🎵 SERVICE ITEM CLICKED:", item);
                    setEditingContent(item);
                    setSelectedContentType(item.type);

                    // Initialize song title for song items
                    if (item.type === "song") {
                      if (item.title === "Song") {
                        setCurrentSongTitle("");
                      } else {
                        setCurrentSongTitle(item.title || "");
                      }
                    }

                    // Switch to Edit & Preparation tab if not already there
                    if (activeTab !== "Edit & Preparation") {
                      setActiveTab("Edit & Preparation");
                    }
                  }}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    editingContent?.id === item.id
                      ? "border-[#8356F3] bg-[#8356F3]/10"
                      : "border-gray-600 hover:border-gray-500 bg-[#1a0f2e]/50"
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                          item.type === "bible"
                            ? "bg-blue-500/20 text-blue-300"
                            : item.type === "announcement"
                              ? "bg-orange-500/20 text-orange-300"
                              : item.type === "media"
                                ? "bg-purple-500/20 text-purple-300"
                                : item.type === "liturgy"
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-gray-500/20 text-gray-300"
                        }`}>
                        {item.type === "bible"
                          ? "📖"
                          : item.type === "announcement"
                            ? "📢"
                            : item.type === "media"
                              ? "🎬"
                              : item.type === "liturgy"
                                ? "✝"
                                : "📄"}
                      </div>
                      <div>
                        <h4 className="text-white text-sm font-medium">
                          {item.title}
                        </h4>
                        <p className="text-gray-400 text-xs">{item.type}</p>
                      </div>
                    </div>
                    <div className="text-gray-500 text-xs">
                      Slide {index + 1}
                    </div>
                  </div>

                  {editingContent?.id === item.id && (
                    <div className="mt-3 pt-3 border-t border-gray-600">
                      <div className="space-y-2">
                        <div>
                          <label className="text-xs text-gray-400 block mb-1">
                            Content:
                          </label>
                          <div className="text-sm text-white bg-[#0f0624] rounded p-2 max-h-20 overflow-y-auto">
                            {item.content}
                          </div>
                        </div>
                        {item.reference && (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Reference:
                            </label>
                            <div className="text-sm text-cyan-300">
                              {item.reference}
                            </div>
                          </div>
                        )}
                        {item.version && (
                          <div>
                            <label className="text-xs text-gray-400 block mb-1">
                              Version:
                            </label>
                            <div className="text-sm text-gray-300">
                              {item.version}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <img
                    src={qworshipLogoEdit}
                    alt="Q-worship Logo"
                    className="w-16 h-16 object-contain"
                  />
                </div>
                <h4 className="text-gray-300 font-medium mb-2">
                  Content Editor
                </h4>
                <p className="text-gray-400 text-sm max-w-xs">
                  Select songs, Bible verses, announcements, or other content
                  from "Insert item" to begin editing
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
