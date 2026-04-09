import React, { useRef, useState, useMemo, useEffect } from "react";
import { useDashboardUI } from "@/features/dashboard/providers/DashboardUIProvider";

import { Input } from "@/components/ui/input";
import { XIcon, UndoIcon, RedoIcon, LinkIcon, ChevronDownIcon, ChevronRightIcon, Book, SearchIcon, Music, ChevronLeftIcon, ImageIcon, PlusIcon, ChevronRight, Image, Trash2, GripVertical, FolderOpen, Upload } from "lucide-react";
import { OnScreenBibleEditor } from "@/features/dashboard/components/OnScreenBibleEditor";
import { BackgroundAssetsModal } from "@/features/dashboard/components/modals/BackgroundAssetsModal";
import { ImportFilesModal } from "@/features/dashboard/components/modals/ImportFilesModal";
import { toast } from "@/hooks/use-toast";
import qworshipLogoEdit from "@assets/Frame 2085662258_1754172975921.png";
import qworshipLogo from "@assets/Group 1_1754122708985.png";
import type { Slide } from "@/types";
import type { EditorState } from "@/features/dashboard/hooks/useWysiwygEditor";
import { useDashboardModals } from "@/features/dashboard/providers/DashboardModalProvider";
import { useDashboardPresentation } from "@/features/dashboard/providers/DashboardPresentationProvider";
import { Button } from "@/components/ui/button";

import { SlideEditorPanel } from "@/features/dashboard/components/SlideEditorPanel";
import { SlideGridRenderer } from "@/features/dashboard/components/SlideGridRenderer";
import { EditAndPreparationArea } from "@/features/dashboard/components/EditAndPreparationArea";
import { SidebarOpen, SidebarClose } from "lucide-react";
import { apiClient } from "@/lib/api";

export const DashboardMainWorkspace = (props: any) => {
  const {
    isBuildMode, editingContent, selectedServiceSection, handleSlideClick,
    setEditingContent, updateItemContent, isFullScreen, toggleFullscreen,
    handleGoLive, isLive, parseLyricsIntoSections,
    setParsedLyrics, setSongArrangement, setSelectedContentType, setCurrentSongTitle,
    setSongEditorContent, showDeleteConfirmation, isListeningMode, toggleListening,
    toggleSection, activeMediaTab, gradientBackgrounds, fillColorBackgrounds,
    applyBackgroundToCurrentItem, getItemBackground, currentUserId, goLive, exitLive,
    editorState, titleEditorState, activeTextarea, handleUndo, handleRedo, setEditorState,
    applyFontFamily, applyFormatting, listDropdownRef, setShowListStyleDropdown, showListStyleDropdown,
    insertTextAtCursor, parsedLyrics, currentSongTitle, titleTextAreaRef, setActiveTextarea,
    applyStylesToTextarea, showAuthorOnScreen, setShowAuthorOnScreen, songArrangement,
    createSlidesFromSong, songSearchTerm, setSongSearchTerm, showSearchResults, filteredSongs,
    setShowSearchResults, handleSelectSong, insertedItems, setActiveTab, togglePreview,
    currentlyDisplayedSlide, previousSlide, nextSlide, getCurrentItemId, setCurrentlyDisplayedSlide,
    clearZustandProjection, liveWindow, itemBackgrounds, toggleHandsfreeBible, stylesButtonRef, handleStylesClick, setHoveredArrangementButton, hoveredArrangementButton, textAreaRef,
    setIsBackgroundAssetsModalOpen, setBackgroundModalMode, setIsImportImageOpen,
    recentlyUploadedMediaId, setRecentlyUploadedMediaId,
  } = props;

  // Local state for Image Editor Browse Media modal
  const [isImageBrowseModalOpen, setIsImageBrowseModalOpen] = useState(false);
  const [isImageImportModalOpen, setIsImageImportModalOpen] = useState(false);
  // Local state for Video Editor Browse Media modal
  const [isVideoBrowseModalOpen, setIsVideoBrowseModalOpen] = useState(false);
  const [isVideoImportModalOpen, setIsVideoImportModalOpen] = useState(false);
  const [videoBrowseModalMode, setVideoBrowseModalMode] = useState<"browse" | "import">("browse");

  const { isLiveMode, activeTab, isSidebarCollapsed, setIsSidebarCollapsed } = useDashboardUI();
  const { isSlideEditorOpen, setIsSlideEditorOpen } = useDashboardModals();
  const { serviceItems, setServiceItems, slides, selectedSlide, setSelectedSlide, currentSlide, setCurrentSlide, totalSlides } = useDashboardPresentation();

  // Helper to update a field on the selected slide and the underlying serviceItems state
  const updateSelectedSlideField = (field: string, value: string) => {
    if (!selectedSlide) return;
    // Update selectedSlide for immediate UI feedback
    setSelectedSlide((prev: any) => ({
      ...prev,
      slide: { ...prev.slide, [field]: value },
      ...(field === "title" ? { item: { ...prev.item, [field]: value } } : {}),
    }));
    // Update serviceItems so the derived slides array recomputes
    setServiceItems((prevItems: any[]) =>
      prevItems.map((item: any) => {
        if (item.id === selectedSlide.itemId) {
          const updatedItem = {
            ...item,
            // Also update item-level fields for title and announcement metadata
            ...(field === "title" ? { title: value } : {}),
            ...(field === "location" ? { location: value } : {}),
            ...(field === "eventDate" ? { eventDate: value } : {}),
            ...(field === "eventTime" ? { eventTime: value } : {}),
            ...(field === "contact" ? { contact: value } : {}),
            ...(field === "content" ? { content: value } : {}),
            ...(field === "subtype" ? { subtype: value } : {}),
            slides: item.slides.map((s: any) =>
              s.id === selectedSlide.slide.id
                ? { ...s, [field]: value }
                : s
            ),
          };

          // Asynchronously propagate to backend storage to ensure data parity
          setTimeout(() => {
            if (updateItemContent) {
              const updatedTitle = field === "title" ? value : item.title;
              // Only override content parameter for generic texts, not URLs
              updateItemContent(
                item.id,
                updatedTitle,
                item.content,
                undefined,
                updatedItem
              );
            }
          }, 0);

          return updatedItem;
        }
        return item;
      })
    );
  };

  return (
    <main
      className={`flex-1 ${isBuildMode ? "bg-[#2a1f4b] p-8 overflow-hidden h-full" : "bg-transparent p-0"} ${!isBuildMode ? "relative z-40" : ""}`}
    >
      <div
        className={`w-full flex flex-col ${isBuildMode ? "space-y-4 h-full" : "items-center justify-center h-full"}`}
      >
        {isBuildMode ? (
          /* BUILD MODE - Continuous Split */
          <div
            className="flex-1 bg-[#1a0f2e] border border-gray-600 rounded-lg overflow-x-auto flex"
            style={{
              height: "600px",
              minHeight: "600px",
              maxHeight: "600px",
              minWidth: "100%",
            }}
          >
            {/* Left Section - Edit & Preparation */}
            <div className="flex-1 bg-[#1a0f2e] p-6 border-r border-gray-600">
              <div className="h-full flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setIsSidebarCollapsed(!isSidebarCollapsed)
                      }
                      className="text-gray-400 hover:text-white hover:bg-[#ffffff20] w-8 h-8 p-0"
                      title={
                        isSidebarCollapsed
                          ? "Show sidebar"
                          : "Hide sidebar"
                      }
                    >
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
                  {selectedSlide && !(selectedSlide.item?.type === "media" && selectedSlide.item?.subtype === "video") ? (
                    /* Slide Editor */
                    <div className="p-6 h-full overflow-y-auto">
                      <div className="space-y-6">
                        {/* Slide Header */}
                        <div className="flex items-center justify-between pb-4 border-b border-gray-600">
                          <div className="flex items-center space-x-4">
                            <div
                              className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${selectedSlide.slide.type === "bible"
                                ? "bg-green-500/20 text-green-300"
                                : selectedSlide.slide.type ===
                                  "verse" ||
                                  selectedSlide.slide.type ===
                                  "chorus"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : selectedSlide.slide.type === "announcement"
                                    ? "bg-orange-500/20 text-orange-300"
                                    : "bg-gray-500/20 text-gray-300"
                                }`}
                            >
                              {selectedSlide.slide.type === "bible"
                                ? "📖"
                                : selectedSlide.slide.type ===
                                  "verse" ||
                                  selectedSlide.slide.type ===
                                  "chorus"
                                  ? "🎵"
                                  : selectedSlide.slide.type === "announcement"
                                    ? "📢"
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
                                    : selectedSlide.slide.type ===
                                      "chorus"
                                      ? "Song Chorus"
                                      : selectedSlide.slide.type === "announcement"
                                        ? "Announcement"
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
                            className="text-gray-400 hover:text-white transition-colors"
                          >
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
                                    selectedSlide.slide
                                      .bibleReference ||
                                    selectedSlide.slide.title
                                  }
                                  onChange={(e) => {
                                    // Update Bible reference functionality
                                    const newReference = e.target.value;
                                    const parentItem =
                                      serviceItems.find(
                                        (item) =>
                                          item.id ===
                                          selectedSlide.itemId,
                                      );
                                    if (parentItem) {
                                      // Update the parent item's Bible reference
                                      updateItemContent(
                                        parentItem.id,
                                        newReference,
                                        {
                                          ...parentItem.content,
                                          reference: newReference,
                                        },
                                      );
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
                                  This content is controlled by the main
                                  Bible editor settings and translation
                                  selection.
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
                                      const parentItem =
                                        serviceItems.find(
                                          (item) =>
                                            item.id ===
                                            selectedSlide.itemId,
                                        );
                                      const referenceDisplay =
                                        parentItem?.content
                                          ?.referenceDisplay ||
                                        "every-slide";
                                      const versionDisplay =
                                        parentItem?.content
                                          ?.versionDisplay ||
                                        "every-slide";
                                      const includeVerseNumbers =
                                        parentItem?.content
                                          ?.includeVerseNumbers ||
                                        false;
                                      const bibleVersion =
                                        selectedSlide.slide
                                          .bibleVersion ||
                                        parentItem?.content?.version ||
                                        "KJV";
                                      const reference =
                                        selectedSlide.slide
                                          .bibleReference ||
                                        selectedSlide.slide.title;

                                      // Determine current slide position (for first/last slide logic)
                                      const allSlides =
                                        parentItem?.slides || [];
                                      const currentSlideIndex =
                                        allSlides.findIndex(
                                          (s: Slide) =>
                                            s.id ===
                                            selectedSlide.slide.id,
                                        );
                                      const isFirstSlide =
                                        currentSlideIndex === 0;
                                      const isLastSlide =
                                        currentSlideIndex ===
                                        allSlides.length - 1;

                                      // Determine if reference should show
                                      const showReference =
                                        referenceDisplay ===
                                        "every-slide" ||
                                        (referenceDisplay ===
                                          "first-slide" &&
                                          isFirstSlide) ||
                                        (referenceDisplay ===
                                          "last-slide" &&
                                          isLastSlide);

                                      // Determine if version should show
                                      const showVersion =
                                        versionDisplay ===
                                        "every-slide" ||
                                        (versionDisplay ===
                                          "first-slide" &&
                                          isFirstSlide) ||
                                        (versionDisplay ===
                                          "last-slide" &&
                                          isLastSlide);

                                      return (
                                        <>
                                          {/* Scripture Reference at top */}
                                          {showReference && (
                                            <div className="text-purple-300 text-xs font-medium mb-2 text-center">
                                              {reference}
                                            </div>
                                          )}

                                          {/* Main verse content */}
                                          <div className="text-white text-sm text-center leading-relaxed flex-1 flex items-center justify-center px-2">
                                            <div className="max-w-full">
                                              {selectedSlide.slide
                                                .content ||
                                                "Bible verse content will appear here"}
                                            </div>
                                          </div>

                                          {/* Bible Version at bottom */}
                                          {showVersion && (
                                            <div className="text-gray-400 text-xs mt-2 text-center">
                                              {bibleVersion === "KJV"
                                                ? "King James Version"
                                                : bibleVersion === "NIV"
                                                  ? "New International Version"
                                                  : bibleVersion ===
                                                    "NKJV"
                                                    ? "New King James Version"
                                                    : bibleVersion ===
                                                      "ESV"
                                                      ? "English Standard Version"
                                                      : bibleVersion ===
                                                        "AMP"
                                                        ? "Amplified Bible"
                                                        : bibleVersion}
                                            </div>
                                          )}
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                  This preview reflects your current
                                  Bible Display Settings from the main
                                  editor.
                                </p>
                              </div>

                              {/* Bible Display Settings - Synced with main editor */}
                              <div className="border-t border-gray-600 pt-4">
                                <h5 className="text-white font-medium mb-3">
                                  Bible Display Settings
                                </h5>
                                <div className="space-y-3 text-sm">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      Current Bible Version
                                    </span>
                                    <span className="text-purple-300 font-medium">
                                      {(() => {
                                        const parentItem =
                                          serviceItems.find(
                                            (item) =>
                                              item.id ===
                                              selectedSlide.itemId,
                                          );
                                        const version =
                                          selectedSlide.slide
                                            .bibleVersion ||
                                          parentItem?.content
                                            ?.version ||
                                          "KJV";
                                        return version === "KJV"
                                          ? "King James Version (KJV)"
                                          : version === "NIV"
                                            ? "New International Version (NIV)"
                                            : version === "NKJV"
                                              ? "New King James Version (NKJV)"
                                              : version === "ESV"
                                                ? "English Standard Version (ESV)"
                                                : version === "AMP"
                                                  ? "Amplified Bible (AMP)"
                                                  : version;
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      Show Scripture Reference
                                    </span>
                                    <span className="text-purple-300">
                                      {(() => {
                                        const parentItem =
                                          serviceItems.find(
                                            (item) =>
                                              item.id ===
                                              selectedSlide.itemId,
                                          );
                                        const referenceDisplay =
                                          parentItem?.content
                                            ?.referenceDisplay ||
                                          "every-slide";
                                        return referenceDisplay ===
                                          "every-slide"
                                          ? "Every Slide"
                                          : referenceDisplay ===
                                            "first-slide"
                                            ? "First Slide Only"
                                            : referenceDisplay ===
                                              "last-slide"
                                              ? "Last Slide Only"
                                              : "None";
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      Show Bible Version
                                    </span>
                                    <span className="text-purple-300">
                                      {(() => {
                                        const parentItem =
                                          serviceItems.find(
                                            (item) =>
                                              item.id ===
                                              selectedSlide.itemId,
                                          );
                                        const versionDisplay =
                                          parentItem?.content
                                            ?.versionDisplay ||
                                          "every-slide";
                                        return versionDisplay ===
                                          "every-slide"
                                          ? "Every Slide"
                                          : versionDisplay ===
                                            "first-slide"
                                            ? "First Slide Only"
                                            : versionDisplay ===
                                              "last-slide"
                                              ? "Last Slide Only"
                                              : "None";
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      Include Verse Numbers
                                    </span>
                                    <span className="text-purple-300">
                                      {(() => {
                                        const parentItem =
                                          serviceItems.find(
                                            (item) =>
                                              item.id ===
                                              selectedSlide.itemId,
                                          );
                                        return parentItem?.content
                                          ?.includeVerseNumbers
                                          ? "Yes"
                                          : "No";
                                      })()}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      One Verse Per Slide
                                    </span>
                                    <span className="text-purple-300">
                                      {(() => {
                                        const parentItem =
                                          serviceItems.find(
                                            (item) =>
                                              item.id ===
                                              selectedSlide.itemId,
                                          );
                                        return parentItem?.content
                                          ?.oneVersePerSlide
                                          ? "Yes"
                                          : "No";
                                      })()}
                                    </span>
                                  </div>
                                </div>
                                <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                                  <p className="text-blue-300 text-xs">
                                    💡 To change these settings
                                    including Bible version, edit them
                                    in the main On-screen Bible Editor.
                                    Changes there will automatically
                                    apply to all verse slides.
                                  </p>
                                </div>
                              </div>
                            </>
                          ) : selectedSlide.slide.type === "announcement" ? (
                            /* Announcement Slide Editor - with metadata fields */
                            <>
                              <div>
                                <label className="text-white font-medium block mb-2">
                                  Announcement Title
                                </label>
                                <Input
                                  value={selectedSlide.slide.title}
                                  onChange={(e) => updateSelectedSlideField("title", e.target.value)}
                                  className="bg-[#2a1f3d] border-gray-600 text-white"
                                  placeholder="Enter announcement title..."
                                />
                              </div>

                              <div>
                                <label className="text-white font-medium block mb-2">
                                  Message
                                </label>
                                <textarea
                                  value={typeof selectedSlide.slide.content === "string" ? selectedSlide.slide.content : ""}
                                  onChange={(e) => updateSelectedSlideField("content", e.target.value)}
                                  className="w-full h-32 p-3 bg-[#2a1f3d] border border-gray-600 rounded-lg text-white resize-none"
                                  placeholder="Enter announcement message..."
                                />
                              </div>

                              {/* Metadata Fields */}
                              <div className="border-t border-gray-600 pt-4">
                                <h5 className="text-white font-medium mb-3 flex items-center gap-2">
                                  <span className="text-orange-400">📋</span> Event Details
                                </h5>
                                <div className="space-y-3">
                                  <div>
                                    <label className="text-gray-300 text-sm block mb-1">
                                      📍 Location
                                    </label>
                                    <Input
                                      value={selectedSlide.slide.location || ""}
                                      onChange={(e) => updateSelectedSlideField("location", e.target.value)}
                                      className="bg-[#2a1f3d] border-gray-600 text-white"
                                      placeholder="e.g., Main Sanctuary"
                                    />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                    <div>
                                      <label className="text-gray-300 text-sm block mb-1">
                                        📅 Event Date
                                      </label>
                                      <Input
                                        type="date"
                                        value={selectedSlide.slide.eventDate || ""}
                                        onChange={(e) => updateSelectedSlideField("eventDate", e.target.value)}
                                        className="bg-[#2a1f3d] border-gray-600 text-white"
                                      />
                                    </div>
                                    <div>
                                      <label className="text-gray-300 text-sm block mb-1">
                                        🕐 Event Time
                                      </label>
                                      <Input
                                        type="time"
                                        value={selectedSlide.slide.eventTime || ""}
                                        onChange={(e) => updateSelectedSlideField("eventTime", e.target.value)}
                                        className="bg-[#2a1f3d] border-gray-600 text-white"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-gray-300 text-sm block mb-1">
                                      📞 Contact
                                    </label>
                                    <Input
                                      value={selectedSlide.slide.contact || ""}
                                      onChange={(e) => updateSelectedSlideField("contact", e.target.value)}
                                      className="bg-[#2a1f3d] border-gray-600 text-white"
                                      placeholder="e.g., email or phone"
                                    />
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : selectedSlide.slide.type === "media" || selectedSlide.item?.type === "media" ? (
                            /* Media Settings Editor */
                            <>
                              <div>
                                <label className="text-white font-medium block mb-2">
                                  Media Title
                                </label>
                                <Input
                                  value={selectedSlide.slide.title}
                                  onChange={(e) => updateSelectedSlideField("title", e.target.value)}
                                  className="bg-[#2a1f3d] border-gray-600 text-white"
                                  placeholder="Enter media title..."
                                />
                              </div>

                              <div className="mt-4 border-t border-gray-600 pt-4">
                                <label className="text-white font-medium block mb-3">
                                  Media File Source
                                </label>
                                <div className="space-y-5">
                                  <div className="flex flex-col space-y-2">
                                    <label className="text-gray-300 text-sm font-medium">Target URL (External Source)</label>
                                    <Input
                                      value={typeof selectedSlide.slide.content === "string" && !selectedSlide.slide.content.startsWith("blob:") && !selectedSlide.slide.content.startsWith("data:") ? selectedSlide.slide.content : ""}
                                      onChange={(e) => updateSelectedSlideField("content", e.target.value)}
                                      className="bg-[#2a1f3d] border-gray-600 text-white"
                                      placeholder="https://example.com/video.mp4"
                                    />
                                    <p className="text-xs text-purple-400 font-medium">Enter a direct link to an image or video file.</p>
                                  </div>

                                  <div className="flex flex-col space-y-2">
                                    <label className="text-gray-300 text-sm font-medium">Local Override (Upload from Device)</label>
                                    <input
                                      type="file"
                                      accept="video/*,image/*"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                          if (file.type.startsWith("video/")) {
                                            const url = URL.createObjectURL(file);
                                            updateSelectedSlideField("content", url);
                                            updateSelectedSlideField("subtype", "video");
                                          } else {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              updateSelectedSlideField("content", event.target?.result as string);
                                              updateSelectedSlideField("subtype", "image");
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }
                                      }}
                                      className="w-full px-3 py-2 bg-[#2a1f3d] border border-gray-600 rounded text-white text-sm file:mr-3 file:py-1.5 file:px-4 file:rounded-md file:border-0 file:bg-gradient-to-r file:from-purple-600 file:to-purple-700 file:text-white file:cursor-pointer hover:border-purple-400 transition-all shadow-lg"
                                    />
                                    <p className="text-xs text-gray-400">If providing a local file, it overrides the external target URL.</p>
                                  </div>
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Generic Slide Editor */
                            <>
                              <div>
                                <label className="text-white font-medium block mb-2">
                                  Slide Title
                                </label>
                                <Input
                                  value={selectedSlide.slide.title}
                                  onChange={(e) => updateSelectedSlideField("title", e.target.value)}
                                  className="bg-[#2a1f3d] border-gray-600 text-white"
                                  placeholder="Enter slide title..."
                                />
                              </div>

                              <div>
                                <label className="text-white font-medium block mb-2">
                                  Slide Content
                                </label>
                                <textarea
                                  value={typeof selectedSlide.slide.content === "string" ? selectedSlide.slide.content : ""}
                                  onChange={(e) => updateSelectedSlideField("content", e.target.value)}
                                  className="w-full h-64 p-3 bg-[#2a1f3d] border border-gray-600 rounded-lg text-white resize-none"
                                  placeholder="Enter slide content..."
                                />
                              </div>

                              {/* Slide Settings */}
                              <div className="border-t border-gray-600 pt-4">
                                <h5 className="text-white font-medium mb-3">
                                  Slide Settings
                                </h5>
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      Background Color
                                    </span>
                                    <div className="flex space-x-2">
                                      <button className="w-8 h-8 bg-black border border-gray-600 rounded"></button>
                                      <button className="w-8 h-8 bg-blue-600 border border-gray-600 rounded"></button>
                                      <button className="w-8 h-8 bg-purple-600 border border-gray-600 rounded"></button>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-gray-300">
                                      Text Size
                                    </span>
                                    <select className="bg-[#2a1f3d] border border-gray-600 rounded px-2 py-1 text-white text-sm">
                                      <option>Small</option>
                                      <option>Medium</option>
                                      <option>Large</option>
                                    </select>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Action Buttons */}
                          <div className="flex space-x-3 pt-4">
                            <Button
                              className="bg-[#8356F3] hover:bg-[#7C4DFF] text-white"
                              onClick={() => {
                                if (
                                  selectedSlide.slide.type === "bible"
                                ) {
                                  // For Bible slides, switch to main Bible editor
                                  const parentItem = serviceItems.find(
                                    (item) =>
                                      item.id === selectedSlide.itemId,
                                  );
                                  if (parentItem) {
                                    setEditingContent(parentItem);
                                    setSelectedSlide(null);
                                    setIsSlideEditorOpen(false);
                                    toast({
                                      title: "Switched to Bible Editor",
                                      description:
                                        "Edit all Bible settings from the main On-screen Bible Editor",
                                      className:
                                        "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white",
                                    });
                                  }
                                } else {
                                  // Save changes for non-Bible slides
                                  console.log(
                                    "Save changes for non-Bible slide",
                                  );
                                }
                              }}
                            >
                              {selectedSlide.slide.type === "bible"
                                ? "Edit in Bible Editor"
                                : "Save Changes"}
                            </Button>
                            <Button
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:text-white"
                              onClick={() => {
                                setSelectedSlide(null);
                                setIsSlideEditorOpen(false);
                              }}
                            >
                              Close
                            </Button>
                            {selectedSlide.slide.type !== "bible" && (
                              <Button
                                variant="outline"
                                className="border-red-600 text-red-400 hover:text-red-300"
                              >
                                Delete Slide
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : editingContent?.type === "song" ? (
                    /* Song Editor 2 (Elaborate) - Full formatting toolbar and lyric editing tools */
                    <div className="h-full flex flex-col bg-[#4a3a6b]">
                      {/* Song Editor 2: Rich Text Editor Toolbar - Responsive Design */}
                      <div className="bg-[#2d1f4a] border-b border-gray-600">
                        {/* Top Row - Slides (Lyrics) Tab */}
                        <div className="px-4 py-2 border-b border-gray-600">
                          <span className="text-white text-sm font-medium">
                            Slides (Lyrics)
                          </span>
                        </div>

                        {/* Toolbar - Single Responsive Row */}
                        <div className="flex flex-wrap items-center gap-2 px-4 py-2 overflow-x-auto">
                          {/* Undo/Redo */}
                          <div className="flex items-center">
                            <button
                              className={`p-1.5 rounded transition-colors ${editorState.canUndo ? "text-white hover:bg-white/10" : "text-gray-500 cursor-not-allowed"}`}
                              disabled={!editorState.canUndo}
                              onClick={handleUndo}
                              title="Undo (Ctrl+Z)"
                            >
                              <UndoIcon className="w-4 h-4" />
                            </button>
                            <button
                              className={`p-1.5 rounded transition-colors ${editorState.canRedo ? "text-white hover:bg-white/10" : "text-gray-500 cursor-not-allowed"}`}
                              disabled={!editorState.canRedo}
                              onClick={handleRedo}
                              title="Redo (Ctrl+Y)"
                            >
                              <RedoIcon className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                          {/* Font Dropdown */}
                          <select
                            className="bg-transparent text-white text-sm px-2 py-1 border border-gray-500 rounded focus:border-gray-400 outline-none min-w-0 flex-shrink-0"
                            value={editorState.selectedFont}
                            onChange={(e) => {
                              const newFont = e.target.value;
                              setEditorState((prev: EditorState) => ({
                                ...prev,
                                selectedFont: newFont,
                              }));
                              applyFontFamily(newFont);
                            }}
                            title="Font Family"
                          >
                            <option
                              className="bg-[#2d1f4a]"
                              value="Lufgord"
                            >
                              Lufgord
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Arial"
                            >
                              Arial
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Helvetica"
                            >
                              Helvetica
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Times New Roman"
                            >
                              Times New Roman
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Georgia"
                            >
                              Georgia
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Verdana"
                            >
                              Verdana
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Tahoma"
                            >
                              Tahoma
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Trebuchet MS"
                            >
                              Trebuchet MS
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Impact"
                            >
                              Impact
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Palatino"
                            >
                              Palatino
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Garamond"
                            >
                              Garamond
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Bookman"
                            >
                              Bookman
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Comic Sans MS"
                            >
                              Comic Sans MS
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Courier New"
                            >
                              Courier New
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Lucida Console"
                            >
                              Lucida Console
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Monaco"
                            >
                              Monaco
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Roboto"
                            >
                              Roboto
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Open Sans"
                            >
                              Open Sans
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Lato"
                            >
                              Lato
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Montserrat"
                            >
                              Montserrat
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Source Sans Pro"
                            >
                              Source Sans Pro
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Poppins"
                            >
                              Poppins
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Nunito"
                            >
                              Nunito
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Inter"
                            >
                              Inter
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Playfair Display"
                            >
                              Playfair Display
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Merriweather"
                            >
                              Merriweather
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="PT Serif"
                            >
                              PT Serif
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Crimson Text"
                            >
                              Crimson Text
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Dancing Script"
                            >
                              Dancing Script
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="Great Vibes"
                            >
                              Great Vibes
                            </option>
                          </select>

                          {/* Chain Link Icons */}
                          <div className="flex items-center">
                            <button
                              className="p-1.5 text-white hover:bg-white/10 rounded"
                              title="Insert Link"
                            >
                              <LinkIcon className="w-4 h-4" />
                            </button>
                            <button
                              className="p-1.5 text-white hover:bg-white/10 rounded"
                              title="Link Options"
                            >
                              <span className="text-sm">🔗</span>
                            </button>
                            <button
                              className="p-1.5 text-white hover:bg-white/10 rounded"
                              title="Text Format"
                            >
                              <span className="text-sm font-bold">
                                A
                              </span>
                            </button>
                          </div>

                          <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                          {/* Heading and Styles Dropdowns */}
                          <div className="relative">
                            <select
                              className="bg-transparent text-white text-sm border border-gray-500 rounded focus:border-gray-400 outline-none w-[120px] flex-shrink-0 box-border appearance-none"
                              style={{
                                height: "26px",
                                paddingLeft: "8px",
                                paddingRight: "8px",
                                paddingTop: "0px",
                                paddingBottom: "0px",
                                lineHeight: "26px",
                                borderWidth: "1px",
                                borderStyle: "solid",
                                margin: "0",
                                fontSize: "14px",
                              }}
                              value={
                                activeTextarea?.getAttribute(
                                  "data-title-field",
                                ) === "true"
                                  ? titleEditorState.selectedHeading
                                  : editorState.selectedHeading
                              }
                              onChange={(e) => {
                                const newHeading = e.target.value;
                                applyFormatting("heading", newHeading);
                              }}
                              title="Text Hierarchy"
                            >
                              <option
                                className="bg-[#2d1f4a]"
                                value="Heading 1"
                              >
                                Heading 1
                              </option>
                              <option
                                className="bg-[#2d1f4a]"
                                value="Heading 2"
                              >
                                Heading 2
                              </option>
                              <option
                                className="bg-[#2d1f4a]"
                                value="Heading 3"
                              >
                                Heading 3
                              </option>
                              <option
                                className="bg-[#2d1f4a]"
                                value="Paragraph"
                              >
                                Paragraph
                              </option>
                            </select>
                            <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                          </div>

                          {/* Visual Styles Dropdown */}
                          <div className="relative styles-dropdown">
                            <button
                              ref={stylesButtonRef}
                              onClick={handleStylesClick}
                              className="bg-transparent text-white text-sm border border-gray-500 rounded focus:border-gray-400 outline-none w-[120px] flex-shrink-0 box-border flex items-center justify-between"
                              style={{
                                height: "26px",
                                paddingLeft: "8px",
                                paddingRight: "8px",
                                paddingTop: "0px",
                                paddingBottom: "0px",
                                lineHeight: "26px",
                                borderWidth: "1px",
                                borderStyle: "solid",
                                margin: "0",
                                fontSize: "14px",
                              }}
                              title="Visual Style Presets"
                            >
                              <span>
                                {(activeTextarea?.getAttribute(
                                  "data-title-field",
                                ) === "true"
                                  ? titleEditorState.selectedStyle
                                  : editorState.selectedStyle) ||
                                  "Styles"}
                              </span>
                              <ChevronDownIcon className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                          {/* Text Formatting - B, I, U, S */}
                          <div className="flex items-center">
                            <button
                              className={`p-1.5 rounded font-bold text-sm transition-colors ${(
                                activeTextarea?.getAttribute(
                                  "data-title-field",
                                ) === "true"
                                  ? titleEditorState.isBold
                                  : editorState.isBold
                              )
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("bold");
                              }}
                              title="Bold (Ctrl+B)"
                            >
                              B
                            </button>
                            <button
                              className={`p-1.5 rounded italic text-sm transition-colors ${(
                                activeTextarea?.getAttribute(
                                  "data-title-field",
                                ) === "true"
                                  ? titleEditorState.isItalic
                                  : editorState.isItalic
                              )
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("italic");
                              }}
                              title="Italic (Ctrl+I)"
                            >
                              I
                            </button>
                            <button
                              className={`p-1.5 rounded underline text-sm transition-colors ${(
                                activeTextarea?.getAttribute(
                                  "data-title-field",
                                ) === "true"
                                  ? titleEditorState.isUnderline
                                  : editorState.isUnderline
                              )
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("underline");
                              }}
                              title="Underline (Ctrl+U)"
                            >
                              U
                            </button>
                            <button
                              className={`p-1.5 rounded line-through text-sm transition-colors ${(
                                activeTextarea?.getAttribute(
                                  "data-title-field",
                                ) === "true"
                                  ? titleEditorState.isStrikethrough
                                  : editorState.isStrikethrough
                              )
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("strikethrough");
                              }}
                              title="Strikethrough"
                            >
                              S
                            </button>
                          </div>

                          <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                          {/* Font Size and Color */}
                          <select
                            className="bg-transparent text-white text-sm px-2 py-1 border border-gray-500 rounded focus:border-gray-400 outline-none min-w-0 flex-shrink-0"
                            value={
                              activeTextarea?.getAttribute(
                                "data-title-field",
                              ) === "true"
                                ? titleEditorState.fontSize
                                : editorState.fontSize
                            }
                            onChange={(e) => {
                              const newSize = e.target.value;
                              applyFormatting("fontSize", newSize);
                            }}
                            title="Font Size"
                          >
                            <option
                              className="bg-[#2d1f4a]"
                              value="12px"
                            >
                              12px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="14px"
                            >
                              14px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="16px"
                            >
                              16px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="18px"
                            >
                              18px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="20px"
                            >
                              20px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="24px"
                            >
                              24px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="28px"
                            >
                              28px
                            </option>
                            <option
                              className="bg-[#2d1f4a]"
                              value="32px"
                            >
                              32px
                            </option>
                          </select>
                          <input
                            type="color"
                            value={
                              activeTextarea?.getAttribute(
                                "data-title-field",
                              ) === "true"
                                ? titleEditorState.textColor
                                : editorState.textColor
                            }
                            onChange={(e) => {
                              const newColor = e.target.value;
                              applyFormatting("color", newColor);
                            }}
                            className="w-8 h-8 bg-transparent border border-gray-500 rounded cursor-pointer flex-shrink-0"
                            title="Text Color"
                          />

                          <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                          {/* List and Alignment Options */}
                          <div className="flex items-center">
                            {/* Bullet Lists */}
                            <button
                              className={`p-1.5 rounded text-sm transition-colors ${editorState.listType === "bullet"
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("bulletList");
                                setEditorState((prev: EditorState) => ({
                                  ...prev,
                                  listType:
                                    prev.listType === "bullet"
                                      ? "none"
                                      : "bullet",
                                }));
                              }}
                              title="Bullet List"
                            >
                              •
                            </button>
                            <button
                              className={`p-1.5 rounded text-sm transition-colors ${editorState.listType === "numbered"
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("numberedList");
                                setEditorState((prev: EditorState) => ({
                                  ...prev,
                                  listType:
                                    prev.listType === "numbered"
                                      ? "none"
                                      : "numbered",
                                }));
                              }}
                              title="Numbered List"
                            >
                              1.
                            </button>

                            {/* More List Options with Dropdown */}
                            <div
                              className="relative"
                              ref={listDropdownRef}
                            >
                              <button
                                className="p-1.5 text-white hover:bg-white/10 rounded flex items-center"
                                onClick={() =>
                                  setShowListStyleDropdown(
                                    !showListStyleDropdown,
                                  )
                                }
                                title="More List Styles"
                              >
                                <span className="text-sm">•</span>
                                <ChevronDownIcon className="w-3 h-3 ml-1" />
                              </button>

                              {/* Dropdown Menu */}
                              {showListStyleDropdown && (
                                <div
                                  className="bg-[#2a1f3d] border border-gray-600 rounded-lg shadow-xl min-w-[180px]"
                                  style={{
                                    position: "fixed",
                                    top: "50%",
                                    left: "50%",
                                    transform: "translate(-50%, -50%)",
                                    zIndex: 9999,
                                  }}
                                >
                                  <div className="p-2">
                                    <div className="text-xs text-gray-400 mb-2">
                                      Choose list style:
                                    </div>
                                    {[
                                      {
                                        label: "• Circle bullets",
                                        symbol: "•",
                                      },
                                      {
                                        label: "○ Hollow bullets",
                                        symbol: "○",
                                      },
                                      {
                                        label: "■ Square bullets",
                                        symbol: "■",
                                      },
                                      {
                                        label: "→ Arrow bullets",
                                        symbol: "→",
                                      },
                                    ].map((option) => (
                                      <button
                                        key={option.label}
                                        className="w-full text-left px-2 py-1 text-sm text-white hover:bg-white/10 rounded flex items-center"
                                        onClick={() => {
                                          insertTextAtCursor(
                                            option.symbol + " ",
                                          );
                                          setShowListStyleDropdown(
                                            false,
                                          );
                                        }}
                                      >
                                        <span className="mr-2">
                                          {option.symbol}
                                        </span>
                                        {option.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Text Alignment Options */}
                            <button
                              className={`p-1.5 rounded text-sm transition-colors ${(activeTextarea?.getAttribute(
                                "data-title-field",
                              ) === "true"
                                ? titleEditorState.textAlign
                                : editorState.textAlign) === "left"
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("align-left");
                              }}
                              title="Align Left"
                            >
                              ≡
                            </button>
                            <button
                              className={`p-1.5 rounded text-sm transition-colors ${(activeTextarea?.getAttribute(
                                "data-title-field",
                              ) === "true"
                                ? titleEditorState.textAlign
                                : editorState.textAlign) === "center"
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("align-center");
                              }}
                              title="Align Center"
                            >
                              ⊞
                            </button>
                            <button
                              className={`p-1.5 rounded text-sm transition-colors ${(activeTextarea?.getAttribute(
                                "data-title-field",
                              ) === "true"
                                ? titleEditorState.textAlign
                                : editorState.textAlign) === "right"
                                ? "bg-white/20 text-white"
                                : "text-white hover:bg-white/10"
                                }`}
                              onClick={() => {
                                applyFormatting("align-right");
                              }}
                              title="Align Right"
                            >
                              ≣
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* Content Area */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        {/* Check if song is loaded, show enhanced editor or search */}
                        {editingContent?.content &&
                          Object.keys(parsedLyrics).length > 0 ? (
                          /* Enhanced Lyrics Editor */
                          <div className="relative h-full">
                            <div
                              id="edit-preparation-scroller"
                              className="space-y-6 overflow-y-auto scroll-smooth pr-4"
                              style={{
                                maxHeight: "480px",
                                scrollbarWidth: "none",
                                msOverflowStyle: "none",
                                paddingBottom: "20px",
                              }}
                              onScroll={(e) => {
                                const container = e.currentTarget;
                                const maxScrollTop =
                                  container.scrollHeight -
                                  container.clientHeight;
                                const scrollPercentage =
                                  maxScrollTop > 0
                                    ? (container.scrollTop /
                                      maxScrollTop) *
                                    100
                                    : 0;

                                // Update progress bar
                                const progressBar =
                                  document.getElementById(
                                    "edit-preparation-progress",
                                  );
                                if (progressBar) {
                                  progressBar.style.height = `${Math.min(scrollPercentage, 100)}%`;
                                }

                                // Prevent over-scrolling at the end
                                if (
                                  container.scrollTop >= maxScrollTop
                                ) {
                                  container.scrollTop = maxScrollTop;
                                }
                              }}
                            >
                              {/* Song Title Display */}
                              <div className="text-center">
                                <h2
                                  className="text-2xl font-bold text-white mb-2 whitespace-pre-wrap leading-relaxed"
                                  style={{
                                    fontFamily:
                                      titleEditorState.selectedFont ||
                                      "Lufgord",
                                    fontSize:
                                      titleEditorState.fontSize ||
                                      "24px",
                                    color:
                                      titleEditorState.textColor ||
                                      "#ffffff",
                                    textAlign:
                                      (titleEditorState.textAlign as any) ||
                                      "center",
                                    fontWeight: titleEditorState.isBold
                                      ? "bold"
                                      : "normal",
                                    fontStyle: titleEditorState.isItalic
                                      ? "italic"
                                      : "normal",
                                    textDecoration:
                                      `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                      "none",
                                  }}
                                >
                                  {currentSongTitle ||
                                    editingContent.title}
                                </h2>
                                <div className="h-px bg-gradient-to-r from-transparent via-[#8356F3] to-transparent"></div>
                              </div>

                              {/* Main Arrangement Section */}
                              <div className="bg-[#2a1f3d] rounded-xl border border-gray-600 p-6">
                                <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                                  <span className="w-3 h-3 bg-[#8356F3] rounded-full mr-3"></span>
                                  Main Arrangement
                                </h3>

                                {/* On Screen Title */}
                                <div className="space-y-4">
                                  <div>
                                    <label className="block text-white text-sm font-medium mb-2">
                                      On screen Title
                                    </label>
                                    <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                      <textarea
                                        ref={titleTextAreaRef}
                                        value={currentSongTitle}
                                        onFocus={(e) => {
                                          // Set this textarea as the active target for WYSIWYG formatting
                                          const textarea =
                                            e.target as HTMLTextAreaElement;
                                          setActiveTextarea(textarea);

                                          // Apply current title formatting styles to make it WYSIWYG
                                          applyStylesToTextarea(
                                            textarea,
                                            titleEditorState,
                                          );

                                          // Auto-resize textarea to fit content
                                          textarea.style.height =
                                            "auto";
                                          textarea.style.overflow =
                                            "hidden";
                                          const computedHeight =
                                            Math.max(
                                              48,
                                              textarea.scrollHeight +
                                              16,
                                            );
                                          textarea.style.height =
                                            computedHeight + "px";
                                          if (
                                            textarea.scrollHeight >
                                            computedHeight
                                          ) {
                                            textarea.style.height =
                                              textarea.scrollHeight +
                                              20 +
                                              "px";
                                          }
                                        }}
                                        onChange={(e) => {
                                          const newTitle =
                                            e.target.value;
                                          const textarea =
                                            e.target as HTMLTextAreaElement;

                                          // Auto-resize textarea to fit content as user types
                                          textarea.style.height =
                                            "auto";
                                          textarea.style.overflow =
                                            "hidden";
                                          const computedHeight =
                                            Math.max(
                                              48,
                                              textarea.scrollHeight +
                                              16,
                                            );
                                          textarea.style.height =
                                            computedHeight + "px";
                                          if (
                                            textarea.scrollHeight >
                                            computedHeight
                                          ) {
                                            textarea.style.height =
                                              textarea.scrollHeight +
                                              20 +
                                              "px";
                                          }

                                          setCurrentSongTitle(newTitle);

                                          // Update the service item title in real-time using universal system
                                          if (editingContent) {
                                            const finalTitle =
                                              newTitle ||
                                              editingContent.content
                                                ?.title ||
                                              "Song";
                                            updateItemContent(
                                              editingContent.id,
                                              finalTitle,
                                              editingContent.content,
                                            );
                                          }
                                        }}
                                        className="w-full min-h-12 bg-transparent border-none outline-none resize-none px-4 py-3 text-white text-lg whitespace-pre-wrap leading-relaxed"
                                        style={{
                                          fontFamily:
                                            titleEditorState.selectedFont ||
                                            "Lufgord",
                                          fontSize:
                                            titleEditorState.fontSize ||
                                            "18px",
                                          color:
                                            titleEditorState.textColor ||
                                            "#ffffff",
                                          textAlign:
                                            (titleEditorState.textAlign as any) ||
                                            "left",
                                          fontWeight:
                                            titleEditorState.isBold
                                              ? "bold"
                                              : "normal",
                                          fontStyle:
                                            titleEditorState.isItalic
                                              ? "italic"
                                              : "normal",
                                          textDecoration:
                                            `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                            "none",
                                        }}
                                        placeholder="Enter song title to display on screen"
                                        data-title-field="true"
                                      />
                                    </div>
                                  </div>

                                  {/* Show Author Toggle */}
                                  <div className="flex items-center space-x-3">
                                    <label className="flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={showAuthorOnScreen}
                                        onChange={(e) =>
                                          setShowAuthorOnScreen(
                                            e.target.checked,
                                          )
                                        }
                                        className="sr-only"
                                      />
                                      <div
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${showAuthorOnScreen
                                          ? "bg-[#8356F3] border-[#8356F3]"
                                          : "border-gray-500 bg-transparent"
                                          }`}
                                      >
                                        {showAuthorOnScreen && (
                                          <svg
                                            className="w-3 h-3 text-white"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                          >
                                            <path
                                              fillRule="evenodd"
                                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                              clipRule="evenodd"
                                            />
                                          </svg>
                                        )}
                                      </div>
                                      <span className="ml-3 text-white">
                                        Show author's name on screen
                                      </span>
                                    </label>
                                  </div>

                                  {/* Song Arrangement */}
                                  <div>
                                    <label className="block text-white text-sm font-medium mb-3">
                                      Song Arrangement
                                    </label>
                                    <div className="flex items-center space-x-2 bg-[#1a0f2e] rounded-lg p-3 border border-gray-600">
                                      {songArrangement.map(
                                        (section: string, index: number) => (
                                          <div
                                            key={index}
                                            className="flex items-center"
                                          >
                                            <button
                                              className="bg-[#8356F3] hover:bg-[#7C4DFF] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-move"
                                              draggable
                                              onDragStart={(e) => {
                                                e.stopPropagation();
                                                e.dataTransfer.setData(
                                                  "text/plain",
                                                  index.toString(),
                                                );
                                                e.dataTransfer.effectAllowed =
                                                  "move";
                                                // Add visual feedback
                                                e.currentTarget.style.opacity =
                                                  "0.5";
                                              }}
                                              onDragEnd={(e) => {
                                                e.stopPropagation();
                                                // Reset visual feedback
                                                e.currentTarget.style.opacity =
                                                  "1";
                                              }}
                                              onDragOver={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                e.dataTransfer.dropEffect =
                                                  "move";
                                              }}
                                              onDrop={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                const draggedIndex =
                                                  parseInt(
                                                    e.dataTransfer.getData(
                                                      "text/plain",
                                                    ),
                                                  );
                                                const targetIndex =
                                                  index;

                                                if (
                                                  draggedIndex !==
                                                  targetIndex
                                                ) {
                                                  const newArrangement =
                                                    [
                                                      ...songArrangement,
                                                    ];
                                                  const draggedItem =
                                                    newArrangement[
                                                    draggedIndex
                                                    ];
                                                  newArrangement.splice(
                                                    draggedIndex,
                                                    1,
                                                  );
                                                  newArrangement.splice(
                                                    targetIndex,
                                                    0,
                                                    draggedItem,
                                                  );
                                                  setSongArrangement(
                                                    newArrangement,
                                                  );

                                                  // Reorder slides to match new arrangement
                                                  if (
                                                    editingContent &&
                                                    editingContent.slides
                                                  ) {
                                                    const reorderedSlides =
                                                      newArrangement
                                                        .map(
                                                          (
                                                            sectionKey,
                                                          ) => {
                                                            return editingContent.slides.find(
                                                              (
                                                                slide: Slide,
                                                              ) => {
                                                                // Direct match first
                                                                if (
                                                                  slide.sectionLabel ===
                                                                  sectionKey
                                                                )
                                                                  return true;

                                                                // Handle mappings from arrangement to slide labels
                                                                if (
                                                                  sectionKey ===
                                                                  "Verse 1" &&
                                                                  slide.sectionLabel ===
                                                                  "V1"
                                                                )
                                                                  return true;
                                                                if (
                                                                  sectionKey ===
                                                                  "Verse 2" &&
                                                                  slide.sectionLabel ===
                                                                  "V2"
                                                                )
                                                                  return true;
                                                                if (
                                                                  sectionKey ===
                                                                  "Chorus" &&
                                                                  slide.sectionLabel ===
                                                                  "C1"
                                                                )
                                                                  return true;
                                                                if (
                                                                  sectionKey ===
                                                                  "V1" &&
                                                                  slide.sectionLabel ===
                                                                  "V1"
                                                                )
                                                                  return true;
                                                                if (
                                                                  sectionKey ===
                                                                  "V2" &&
                                                                  slide.sectionLabel ===
                                                                  "V2"
                                                                )
                                                                  return true;
                                                                if (
                                                                  sectionKey ===
                                                                  "C" &&
                                                                  (slide.sectionLabel ===
                                                                    "C1" ||
                                                                    slide.sectionLabel ===
                                                                    "C")
                                                                )
                                                                  return true;

                                                                // Fallback to text-based matching
                                                                const slideLabel =
                                                                  slide.sectionLabel?.toLowerCase() ||
                                                                  "";
                                                                const arrangementKey =
                                                                  sectionKey.toLowerCase();

                                                                if (
                                                                  arrangementKey.includes(
                                                                    "verse 1",
                                                                  ) &&
                                                                  slideLabel.includes(
                                                                    "v1",
                                                                  )
                                                                )
                                                                  return true;
                                                                if (
                                                                  arrangementKey.includes(
                                                                    "verse 2",
                                                                  ) &&
                                                                  slideLabel.includes(
                                                                    "v2",
                                                                  )
                                                                )
                                                                  return true;
                                                                if (
                                                                  arrangementKey.includes(
                                                                    "chorus",
                                                                  ) &&
                                                                  slideLabel.includes(
                                                                    "c1",
                                                                  )
                                                                )
                                                                  return true;

                                                                return false;
                                                              },
                                                            );
                                                          },
                                                        )
                                                        .filter(
                                                          Boolean,
                                                        );

                                                    if (
                                                      reorderedSlides.length >
                                                      0
                                                    ) {
                                                      // Update both serviceItems and editingContent directly
                                                      setServiceItems(
                                                        (prev: any[]) =>
                                                          prev.map(
                                                            (item: any) =>
                                                              item.id ===
                                                                editingContent.id
                                                                ? {
                                                                  ...item,
                                                                  slides:
                                                                    reorderedSlides,
                                                                }
                                                                : item,
                                                          ),
                                                      );

                                                      setEditingContent(
                                                        (
                                                          prev: any,
                                                        ) => ({
                                                          ...prev,
                                                          slides:
                                                            reorderedSlides,
                                                        }),
                                                      );
                                                    }
                                                  }
                                                }
                                              }}
                                              onMouseEnter={() =>
                                                setHoveredArrangementButton(
                                                  index,
                                                )
                                              }
                                              onMouseLeave={() =>
                                                setHoveredArrangementButton(
                                                  null,
                                                )
                                              }
                                            >
                                              {section}
                                            </button>
                                            {index <
                                              songArrangement.length -
                                              1 && (
                                                <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                                              )}
                                          </div>
                                        ),
                                      )}
                                      <button className="text-gray-400 hover:text-white p-2 rounded-lg transition-colors">
                                        <ChevronDownIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                    {/* Custom tooltip for drag instructions */}
                                    {hoveredArrangementButton !==
                                      null && (
                                        <div className="mt-2 text-gray-400 text-xs">
                                          Drag to reorder sections
                                        </div>
                                      )}
                                  </div>
                                </div>
                              </div>

                              {/* Individual Verse Sections - WYSIWYG Editing */}
                              <div className="space-y-4">
                                {songArrangement.map(
                                  (arrangementSection: any, index: number) => {
                                    // Find the corresponding lyrics for this arrangement section
                                    const lyricEntry = Object.entries(
                                      parsedLyrics,
                                    ).find(([sectionName]) => {
                                      const normalizedSectionName =
                                        sectionName.toLowerCase();
                                      const normalizedArrangement =
                                        arrangementSection.toLowerCase();
                                      return (
                                        normalizedSectionName.includes(
                                          normalizedArrangement,
                                        ) ||
                                        (arrangementSection === "V1" &&
                                          (normalizedSectionName.includes(
                                            "verse 1",
                                          ) ||
                                            normalizedSectionName.includes(
                                              "v1",
                                            ))) ||
                                        (arrangementSection === "V2" &&
                                          (normalizedSectionName.includes(
                                            "verse 2",
                                          ) ||
                                            normalizedSectionName.includes(
                                              "v2",
                                            ))) ||
                                        (arrangementSection === "C" &&
                                          (normalizedSectionName.includes(
                                            "chorus",
                                          ) ||
                                            normalizedSectionName.includes(
                                              "c",
                                            )))
                                      );
                                    });

                                    if (!lyricEntry) return null;

                                    const [sectionName, lyrics] =
                                      lyricEntry;
                                    return (
                                      <div
                                        key={sectionName}
                                        className="bg-[#1a0f2e] rounded-xl border border-gray-600 p-6"
                                        data-section={sectionName}
                                      >
                                        <h4 className="text-lg font-semibold text-white mb-4">
                                          {sectionName.includes("V1") ||
                                            sectionName
                                              .toLowerCase()
                                              .includes("verse 1")
                                            ? "Verse 1"
                                            : sectionName.includes(
                                              "V2",
                                            ) ||
                                              sectionName
                                                .toLowerCase()
                                                .includes("verse 2")
                                              ? "Verse 2"
                                              : sectionName.includes(
                                                "C",
                                              ) ||
                                                sectionName
                                                  .toLowerCase()
                                                  .includes("chorus")
                                                ? "Chorus"
                                                : sectionName}
                                        </h4>
                                        <div className="bg-[#0f0624] rounded-lg border border-gray-700 p-4 min-h-fit">
                                          <textarea
                                            ref={
                                              index === 0
                                                ? textAreaRef
                                                : undefined
                                            }
                                            value={lyrics as string}
                                            onFocus={(e) => {
                                              // Set this textarea as the active target for WYSIWYG formatting
                                              const textarea =
                                                e.target as HTMLTextAreaElement;
                                              setActiveTextarea(
                                                textarea,
                                              );

                                              // Apply current formatting styles to make it WYSIWYG
                                              applyStylesToTextarea(
                                                textarea,
                                                editorState,
                                              );

                                              // Auto-resize textarea to fit content
                                              textarea.style.height =
                                                "auto";
                                              textarea.style.overflow =
                                                "hidden";
                                              const computedHeight =
                                                Math.max(
                                                  128,
                                                  textarea.scrollHeight +
                                                  16,
                                                );
                                              textarea.style.height =
                                                computedHeight + "px";
                                              if (
                                                textarea.scrollHeight >
                                                computedHeight
                                              ) {
                                                textarea.style.height =
                                                  textarea.scrollHeight +
                                                  20 +
                                                  "px";
                                              }
                                            }}
                                            onChange={(e) => {
                                              const newLyrics =
                                                e.target.value;
                                              const textarea =
                                                e.target as HTMLTextAreaElement;

                                              // Auto-resize textarea to fit content as user types
                                              textarea.style.height =
                                                "auto";
                                              textarea.style.overflow =
                                                "hidden";
                                              const computedHeight =
                                                Math.max(
                                                  128,
                                                  textarea.scrollHeight +
                                                  16,
                                                );
                                              textarea.style.height =
                                                computedHeight + "px";
                                              if (
                                                textarea.scrollHeight >
                                                computedHeight
                                              ) {
                                                textarea.style.height =
                                                  textarea.scrollHeight +
                                                  20 +
                                                  "px";
                                              }

                                              // Update ONLY this specific section to prevent cross-contamination
                                              setParsedLyrics(
                                                (prevLyrics: Record<string, string>) => {
                                                  const updatedSection =
                                                  {
                                                    [sectionName]:
                                                      newLyrics,
                                                  };
                                                  const updatedLyrics =
                                                  {
                                                    ...prevLyrics,
                                                    ...updatedSection,
                                                  };

                                                  // Rebuild full lyrics from isolated section updates
                                                  const fullLyricsText =
                                                    Object.entries(
                                                      updatedLyrics,
                                                    )
                                                      .map(
                                                        ([
                                                          section,
                                                          text,
                                                        ]) =>
                                                          `[${section}]\nimport { Input } from "@/components/ui/input";
import { XIcon, UndoIcon, RedoIcon, LinkIcon, ChevronDownIcon, ChevronRightIcon, Book, SearchIcon, Music, ChevronLeftIcon } from "lucide-react";
import { OnScreenBibleEditor } from "@/features/dashboard/components/OnScreenBibleEditor";
import { toast } from "@/hooks/use-toast";
import qworshipLogoEdit from "@assets/Frame 2085662258_1754172975921.png";
import qworshipLogo from "@assets/Group 1_1754122708985.png";
import type { Slide } from "@/types";\n${text}`,
                                                      )
                                                      .join("\n\n");

                                                  // Update editor content immediately
                                                  setSongEditorContent(
                                                    fullLyricsText,
                                                  );

                                                  // Update song content in state systems
                                                  if (
                                                    editingContent &&
                                                    editingContent.type ===
                                                    "song"
                                                  ) {
                                                    const updatedSong =
                                                    {
                                                      ...editingContent.content,
                                                      lyrics:
                                                        fullLyricsText,
                                                    };

                                                    // Create new slides from updated song
                                                    const newSlides =
                                                      createSlidesFromSong(
                                                        updatedSong,
                                                        editingContent.id
                                                      );

                                                    updateItemContent(
                                                      editingContent.id,
                                                      editingContent.title,
                                                      updatedSong,
                                                      newSlides,
                                                    );
                                                  }

                                                  return updatedLyrics;
                                                },
                                              );
                                            }}
                                            className="w-full min-h-32 text-gray-200 text-sm bg-transparent border-none outline-none resize-none whitespace-pre-wrap leading-relaxed"
                                            data-section={sectionName}
                                            style={{
                                              fontFamily:
                                                editorState.selectedFont ||
                                                "Lufgord",
                                              fontSize:
                                                editorState.fontSize ||
                                                "16px",
                                              color:
                                                editorState.textColor ||
                                                "#ffffff",
                                              textAlign:
                                                (editorState.textAlign as any) ||
                                                "left",
                                              fontWeight:
                                                editorState.isBold
                                                  ? "bold"
                                                  : "normal",
                                              fontStyle:
                                                editorState.isItalic
                                                  ? "italic"
                                                  : "normal",
                                              textDecoration:
                                                `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                                "none",
                                            }}
                                            placeholder="Enter lyrics for this section..."
                                          />
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            </div>
                            {/* Custom Progress Bar for Edit & Preparation Scroller */}
                            <div className="absolute right-0 top-0 bottom-0 w-1">
                              <div className="h-full bg-gray-600 rounded-full">
                                <div
                                  id="edit-preparation-progress"
                                  className="w-1 bg-purple-500 rounded-full transition-all duration-300"
                                  style={{ height: "30%" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* Song Editor 1: Song Search and Browse Section */
                          <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                              <div className="flex-1 relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                  <SearchIcon className="w-4 h-4 text-gray-400" />
                                </div>
                                <Input
                                  placeholder="Enter Song name"
                                  className="bg-[#2a1f3d] border-gray-600 text-white h-11 pl-10"
                                  value={songSearchTerm}
                                  onChange={(e) =>
                                    setSongSearchTerm(e.target.value)
                                  }
                                />
                              </div>
                            </div>
                            <div className="text-left space-y-2 mb-4">
                              <h5 className="text-white text-lg">
                                Search your Q-worship songbook
                              </h5>
                              <p className="text-gray-400 text-sm">
                                Enter 3+ characters to instantly search out local songs.
                              </p>
                            </div>

                            {/* Search Results Section */}
                            {showSearchResults && (
                              <div className="mt-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="text-white font-medium">
                                    Search Results (
                                    {filteredSongs.length} found)
                                  </h3>
                                  <button
                                    onClick={() => {
                                      setShowSearchResults(false);
                                      setSongSearchTerm("");
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="max-h-60 overflow-y-auto space-y-2 bg-[#1a0f2e] rounded-lg border border-gray-600 p-3">
                                  {filteredSongs.length > 0 ? (
                                    filteredSongs.map((song: any) => (
                                      <div
                                        key={song.id}
                                        className="flex items-center justify-between p-3 bg-[#0f0624] rounded-lg border border-gray-700 hover:border-[#8356F3] cursor-pointer transition-colors"
                                        onClick={() => handleSelectSong(song)}
                                      >
                                        <div>
                                          <h4 className="text-white font-medium">
                                            {song.title}
                                          </h4>
                                          <p className="text-gray-400 text-sm">
                                            {song.artist || (song.authors && song.authors.join(", ")) || "Unknown Artist"}
                                          </p>
                                        </div>
                                        <div className="text-xs text-[#8356F3]">Select</div>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-4">
                                      <p className="text-gray-400 text-sm">No songs match "{songSearchTerm}"</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : editingContent ? (
                    /* Other Item Editors */
                    <div className="p-6 h-full overflow-y-auto">
                      <div className="space-y-6">
                        {/* Item Header */}
                        <div className="flex items-center space-x-4 pb-4 border-b border-gray-600">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${editingContent.type === "bible"
                              ? "bg-blue-500/20 text-blue-300"
                              : editingContent.type === "announcement"
                                ? "bg-orange-500/20 text-orange-300"
                                : editingContent.type === "media"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : editingContent.type === "liturgy"
                                    ? "bg-green-500/20 text-green-300"
                                    : "bg-gray-500/20 text-gray-300"
                              }`}
                          >
                            {editingContent.type === "bible"
                              ? "📖"
                              : editingContent.type === "announcement"
                                ? "📢"
                                : editingContent.type === "media"
                                  ? "🎬"
                                  : editingContent.type === "liturgy"
                                    ? "✝"
                                    : "📄"}
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white text-xl font-medium">
                              {editingContent.title}
                            </h4>
                            <p className="text-gray-400 capitalize">
                              {editingContent.type} Content
                            </p>
                          </div>
                          <div className="text-sm text-gray-400">
                            In: {selectedServiceSection}
                          </div>
                        </div>

                        {/* Content Editor - Dynamic based on content type */}
                        {editingContent.type === "song" && (
                          <div className="h-full flex flex-col">
                            {/* Song Editor 2: Advanced editing tabs for loaded songs */}
                            <div className="flex border-b border-gray-600 mb-4">
                              <button className="px-4 py-2 text-sm bg-[#8356F3] text-white rounded-t-lg border-b-2 border-[#8356F3]">
                                Slides (Lyrics)
                              </button>
                              <button className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                Confidence (Default)
                              </button>
                              <button className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                Notes
                              </button>
                              <button className="px-4 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-700 transition-colors">
                                Signals
                              </button>
                            </div>

                            {/* Formatting Toolbar */}
                            <div className="flex items-center space-x-4 mb-4 p-3 bg-[#2a1f4b] rounded-lg border border-gray-600">
                              {/* Font Selection */}
                              <div className="flex items-center space-x-2">
                                <select className="bg-[#0f0624] border border-gray-600 rounded px-2 py-1 text-white text-sm">
                                  <option>Museo Sans</option>
                                  <option>Arial</option>
                                  <option>Times New Roman</option>
                                </select>
                                <select className="bg-[#0f0624] border border-gray-600 rounded px-2 py-1 text-white text-sm">
                                  <option>Bold</option>
                                  <option>Regular</option>
                                  <option>Light</option>
                                </select>
                              </div>

                              {/* Font Size and Styling */}
                              <div className="flex items-center space-x-2">
                                <input
                                  type="number"
                                  defaultValue="84"
                                  className="w-12 bg-[#0f0624] border border-gray-600 rounded px-2 py-1 text-white text-sm"
                                />
                                <button className="w-8 h-8 bg-yellow-600 hover:bg-yellow-500 rounded flex items-center justify-center text-black font-bold text-sm">
                                  B
                                </button>
                                <button className="w-8 h-8 hover:bg-gray-600 rounded flex items-center justify-center text-white font-bold text-sm italic">
                                  I
                                </button>
                                <button className="w-8 h-8 hover:bg-gray-600 rounded flex items-center justify-center text-white text-sm">
                                  T↑
                                </button>
                              </div>

                              {/* Alignment and Lists */}
                              <div className="flex items-center space-x-1">
                                <button className="w-8 h-8 hover:bg-gray-600 rounded flex items-center justify-center text-white">
                                  <div className="w-4 h-1 bg-white"></div>
                                </button>
                                <button className="w-8 h-8 hover:bg-gray-600 rounded flex items-center justify-center text-white">
                                  <div className="space-y-0.5">
                                    <div className="w-2 h-0.5 bg-white"></div>
                                    <div className="w-3 h-0.5 bg-white"></div>
                                    <div className="w-2 h-0.5 bg-white"></div>
                                  </div>
                                </button>
                              </div>

                              {/* Color and Effects */}
                              <div className="flex items-center space-x-2">
                                <button className="w-8 h-8 bg-white border border-gray-400 rounded"></button>
                                <select className="bg-[#0f0624] border border-gray-600 rounded px-2 py-1 text-white text-sm">
                                  <option>Effects</option>
                                  <option>Shadow</option>
                                  <option>Outline</option>
                                </select>
                              </div>
                            </div>

                            {/* Search Bar */}
                            <div className="flex items-center space-x-3 mb-4">
                              <div className="flex-1 relative">
                                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                                  <SearchIcon className="w-4 h-4 text-gray-400" />
                                </div>
                                <input
                                  type="text"
                                  placeholder="Enter Song name"
                                  className="w-full bg-[#0f0624] border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white"
                                  value={songSearchTerm}
                                  onChange={(e) =>
                                    setSongSearchTerm(e.target.value)
                                  }
                                />
                              </div>
                            </div>

                            {/* Search Description */}
                            <div className="mb-6">
                              <h3 className="text-white font-medium text-lg mb-2">
                                Search your Q-worship songbook
                              </h3>
                              <p className="text-gray-300 text-sm">
                                Enter 3+ characters to instantly search out local songs.
                              </p>
                            </div>

                            {/* Search Results Section */}
                            {showSearchResults && (
                              <div className="mb-6">
                                <div className="flex justify-between items-center mb-3">
                                  <h3 className="text-white font-medium">
                                    Search Results (
                                    {filteredSongs.length} found)
                                  </h3>
                                  <button
                                    onClick={() => {
                                      setShowSearchResults(false);
                                      setSongSearchTerm("");
                                    }}
                                    className="text-gray-400 hover:text-white transition-colors"
                                  >
                                    <XIcon className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="max-h-60 overflow-y-auto space-y-2 bg-[#1a0f2e] rounded-lg border border-gray-600 p-3">
                                  {filteredSongs.length > 0 ? (
                                    filteredSongs.map((song: any) => (
                                      <div
                                        key={song.id}
                                        className="flex items-center justify-between p-3 bg-[#0f0624] rounded-lg border border-gray-700 hover:border-[#8356F3] cursor-pointer transition-colors"
                                        onClick={() =>
                                          handleSelectSong(song)
                                        }
                                      >
                                        <div className="flex-1">
                                          <h4 className="text-white font-medium mb-1">
                                            {song.title}
                                          </h4>
                                          <p className="text-gray-400 text-sm">
                                            {song.authors?.length > 0
                                              ? song.authors.join(", ")
                                              : song.artist ||
                                              "Unknown Artist"}
                                          </p>
                                        </div>
                                        <button className="text-[#8356F3] hover:text-[#7145E6] transition-colors ml-4">
                                          Select
                                        </button>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-center py-8">
                                      <Music className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                                      <p className="text-gray-400">
                                        No songs found matching "
                                        {songSearchTerm}"
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Lyrics Editor Area */}
                            <div className="flex-1 border-2 border-dashed border-gray-600 rounded-lg p-6">
                              {editingContent?.content?.lyrics ? (
                                <div className="h-full">
                                  <h4 className="text-white font-medium mb-4">
                                    {currentSongTitle ||
                                      editingContent.title}
                                  </h4>
                                  <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-line max-h-full overflow-y-auto">
                                    {editingContent.content.lyrics}
                                  </div>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center">
                                  <div className="text-center">
                                    <Music className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <h4 className="text-gray-300 font-medium mb-2">
                                      Song Lyrics Editor
                                    </h4>
                                    <p className="text-gray-400 text-sm max-w-xs">
                                      Search for a song above or start
                                      typing lyrics to create a new song
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {editingContent.type === "media" && editingContent.subtype === "slideshow" && (
                          <div className="space-y-6">
                            <div className="flex justify-between items-center bg-[#2a1f3d] p-4 rounded-lg border border-gray-600">
                              <div>
                                <h3 className="text-white font-medium text-lg">Image Slideshow Configuration</h3>
                                <p className="text-sm text-gray-400">Upload multiple images to sequence dynamically</p>
                              </div>
                              <label className="bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 text-white px-5 py-2.5 rounded-lg border border-purple-500 shadow-lg cursor-pointer transition-all flex items-center space-x-2 font-medium">
                                <PlusIcon className="w-4 h-4" />
                                <span>Add Images</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  multiple
                                  className="hidden"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      const files = Array.from(e.target.files);
                                      const newSlides = files.map(file => ({
                                        id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                        type: "media",
                                        subtype: "image",
                                        title: file.name,
                                        content: URL.createObjectURL(file),
                                        itemId: editingContent.id
                                      }));
                                      const updatedSlides = [...(editingContent.slides || []), ...newSlides];
                                      updateItemContent(editingContent.id, editingContent.title, editingContent.content, updatedSlides);
                                      setEditingContent({ ...editingContent, slides: updatedSlides });
                                    }
                                  }}
                                />
                              </label>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="bg-[#2a1f3d] p-4 rounded-lg border border-gray-600">
                                <label className="text-white font-medium mb-3 block">Playback Settings</label>
                                <div className="space-y-4 text-sm mt-3">
                                  <label className="flex items-center space-x-3 text-white">
                                    <input
                                      type="checkbox"
                                      className="rounded bg-[#0f0624] border-gray-600 text-purple-600 focus:ring-purple-500 w-4 h-4"
                                      checked={editingContent.content?.autoAdvance ?? true}
                                      onChange={(e) => {
                                        const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), autoAdvance: e.target.checked };
                                        updateItemContent(editingContent.id, editingContent.title, nextContent, editingContent.slides);
                                        setEditingContent({ ...editingContent, content: nextContent });
                                      }}
                                    />
                                    <span>Advance to next slide automatically</span>
                                  </label>
                                  <div className="flex items-center justify-between text-gray-300 pl-7">
                                    <span>Auto-advance timer (sec):</span>
                                    <input
                                      type="number"
                                      className="bg-[#0f0624] border border-gray-600 w-16 text-center rounded py-1 px-2 text-white"
                                      value={typeof editingContent.content?.timer === 'number' ? editingContent.content.timer : 5}
                                      min={1}
                                      onChange={(e) => {
                                        const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), timer: parseInt(e.target.value) || 5 };
                                        updateItemContent(editingContent.id, editingContent.title, nextContent, editingContent.slides);
                                        setEditingContent({ ...editingContent, content: nextContent });
                                      }}
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-gray-300">
                                    <span>Transition Effect:</span>
                                    <select
                                      className="bg-[#0f0624] border border-gray-600 rounded py-1 px-2 text-white outline-none w-32"
                                      value={editingContent.content?.transition ?? "fade"}
                                      onChange={(e) => {
                                        const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), transition: e.target.value };
                                        updateItemContent(editingContent.id, editingContent.title, nextContent, editingContent.slides);
                                        setEditingContent({ ...editingContent, content: nextContent });
                                      }}
                                    >
                                      <option value="none">None</option>
                                      <option value="fade">Fade In/Out</option>
                                      <option value="slide">Slide Left</option>
                                    </select>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-[#2a1f3d] p-4 rounded-lg border border-gray-600 flex flex-col justify-center items-center text-center">
                                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mb-3">
                                  <ImageIcon className="w-6 h-6" />
                                </div>
                                <span className="text-white text-4xl font-bold">{editingContent.slides?.length || 0}</span>
                                <p className="text-gray-400 text-sm mt-1">Total Images In Sequence</p>
                              </div>
                            </div>

                            <h4 className="text-white font-medium mt-8 border-b border-gray-600 pb-2">Image Sequence Map</h4>

                            {/* Slide Grid Configuration */}
                            {editingContent.slides?.length > 0 ? (
                              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto max-h-[500px] p-2 bg-[#0f0624] rounded-lg border border-gray-600 shadow-inner">
                                {editingContent.slides.map((slide: any, idx: number) => (
                                  <div key={slide.id}
                                    className="relative group bg-[#1a0f2e] border border-gray-600 shadow-md rounded-lg overflow-hidden flex flex-col aspect-video hover:border-purple-500 transition-colors cursor-pointer"
                                    onClick={() => {
                                      if (setCurrentlyDisplayedSlide) {
                                        setCurrentlyDisplayedSlide(slide);
                                      }
                                    }}>
                                    <img src={slide.content} className="w-full h-full object-cover" />
                                    <div className="absolute top-0 right-0 left-0 bg-black/70 p-2 flex justify-between opacity-100 transition-opacity backdrop-blur-sm">
                                      <div className="flex space-x-1">
                                        <button disabled={idx === 0} className="bg-gray-700/80 hover:bg-gray-500 text-white p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newSlides = [...editingContent.slides];
                                            [newSlides[idx - 1], newSlides[idx]] = [newSlides[idx], newSlides[idx - 1]];
                                            updateItemContent(editingContent.id, editingContent.title, editingContent.content, newSlides);
                                            setEditingContent({ ...editingContent, slides: newSlides });
                                          }}>
                                          <ChevronLeftIcon className="w-4 h-4" />
                                        </button>
                                        <button disabled={idx === editingContent.slides.length - 1} className="bg-gray-700/80 hover:bg-gray-500 text-white p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newSlides = [...editingContent.slides];
                                            [newSlides[idx + 1], newSlides[idx]] = [newSlides[idx], newSlides[idx + 1]];
                                            updateItemContent(editingContent.id, editingContent.title, editingContent.content, newSlides);
                                            setEditingContent({ ...editingContent, slides: newSlides });
                                          }}>
                                          <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <button className="bg-red-600 hover:bg-red-500 text-white p-1 rounded"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextSlides = editingContent.slides.filter((s: any) => s.id !== slide.id);
                                          updateItemContent(editingContent.id, editingContent.title, editingContent.content, nextSlides);
                                          setEditingContent({ ...editingContent, slides: nextSlides });
                                        }}>
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-xs text-white font-medium border border-gray-600">Slide {idx + 1}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-[#1a0f2e] border-2 border-dashed border-gray-600 rounded-lg p-12 text-center text-gray-400">
                                No images uploaded. <br />Click <span className="text-purple-400">"Add Images"</span> above to start building your slideshow sequence.
                              </div>
                            )}
                          </div>
                        )}

                        {/* ========== IMAGE EDITOR ========== */}
                        {editingContent.type === "media" && editingContent.subtype === "image" && (
                          <div className="space-y-6">
                            {/* Title & Import block */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#2a1f3d] p-4 rounded-lg border border-gray-600">
                              <div className="flex items-center space-x-3 w-full">
                                <label className="text-white font-medium whitespace-nowrap">Image Title</label>
                                <input
                                  type="text"
                                  value={editingContent.title || ""}
                                  onChange={(e) => {
                                    const newTitle = e.target.value;
                                    updateItemContent(editingContent.id, newTitle, editingContent.content, editingContent.slides);
                                    setEditingContent({ ...editingContent, title: newTitle });
                                  }}
                                  className="w-full bg-[#0f0624] border border-gray-600 text-white rounded px-3 py-1.5 outline-none"
                                  placeholder="Enter image title..."
                                />
                              </div>
                              <div className="flex space-x-2 shrink-0">
                                <button
                                  onClick={() => setIsImageBrowseModalOpen(true)}
                                  className="h-8 bg-[#1a0f2e] hover:bg-[#3a2f4d] text-white px-3 rounded border border-purple-500/30 shadow transition-all flex items-center space-x-2 text-xs font-medium"
                                >
                                  <FolderOpen className="w-3 h-3 text-purple-400" />
                                  <span>Browse media</span>
                                </button>
                                <button
                                  onClick={() => setIsImageImportModalOpen(true)}
                                  className="h-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 text-white px-3 rounded border border-purple-500 shadow cursor-pointer transition-all flex items-center space-x-2 text-xs font-medium m-0"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Import Media</span>
                                </button>
                              </div>
                            </div>
                            
                            {/* Import Media Modal for Image Editor */}
                            <ImportFilesModal
                              open={isImageImportModalOpen}
                              onOpenChange={setIsImageImportModalOpen}
                              onMultipleMediaUploaded={(assets: any[]) => {
                                const newSlides = assets.map((asset) => {
                                  return {
                                    id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    type: "media" as const,
                                    subtype: "image" as const,
                                    title: editingContent.title || asset.title || "Imported Image",
                                    content: asset.fileUrl,
                                    itemId: editingContent.id
                                  }
                                });

                                const existingRealSlides = (editingContent.slides || []).filter(
                                  (s: any) => s.content && s.content !== "Worship background image" && s.content !== "Inspirational worship video" && s.content !== "Ready for content"
                                );
                                const updatedSlides = [...existingRealSlides, ...newSlides];
                                updateItemContent(editingContent.id, editingContent.title, editingContent.content, updatedSlides);
                                setEditingContent({ ...editingContent, slides: updatedSlides });
                                setIsImageImportModalOpen(false);
                              }}
                            />

                            {/* Inline Playback Settings */}
                            <div className="flex flex-wrap items-center bg-[#2a1f3d] p-3 rounded-lg border border-gray-600 gap-x-6 gap-y-2 text-sm">
                               <label className="flex items-center space-x-2 text-white cursor-pointer w-max m-0">
                                 <input
                                   type="checkbox"
                                   className="rounded bg-[#0f0624] border-gray-600 text-purple-600 focus:ring-purple-500 w-4 h-4 m-0 p-0"
                                   checked={editingContent.content?.autoAdvance ?? true}
                                   onChange={(e) => {
                                     const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), autoAdvance: e.target.checked };
                                     updateItemContent(editingContent.id, editingContent.title, nextContent, editingContent.slides);
                                     setEditingContent({...editingContent, content: nextContent});
                                   }}
                                 />
                                 <span>Auto-advance sequence</span>
                               </label>
                               
                               <div className="flex items-center space-x-2 text-gray-300 border-l border-gray-600 pl-6">
                                 <span>Timer (sec):</span>
                                 <input
                                    type="number"
                                    className="h-7 w-14 bg-[#0f0624] border border-gray-600 text-center rounded text-white"
                                    value={typeof editingContent.content?.timer === 'number' ? editingContent.content.timer : 5}
                                    min={1}
                                    onChange={(e) => {
                                      const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), timer: parseInt(e.target.value) || 5 };
                                      updateItemContent(editingContent.id, editingContent.title, nextContent, editingContent.slides);
                                      setEditingContent({...editingContent, content: nextContent});
                                    }}
                                 />
                               </div>
                               
                               <div className="flex items-center space-x-2 text-gray-300 border-l border-gray-600 pl-6">
                                 <span>Transition:</span>
                                 <select
                                    className="h-7 bg-[#0f0624] border border-gray-600 rounded px-1 text-white outline-none w-28"
                                    value={editingContent.content?.transition ?? "fade"}
                                    onChange={(e) => {
                                      const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), transition: e.target.value };
                                      updateItemContent(editingContent.id, editingContent.title, nextContent, editingContent.slides);
                                      setEditingContent({...editingContent, content: nextContent});
                                    }}
                                 >
                                   <option value="none">None</option>
                                   <option value="fade">Fade In/Out</option>
                                   <option value="slide">Slide Left</option>
                                 </select>
                               </div>
                            </div>

                            {/* Image Sequence Grid */}
                            <h4 className="text-white font-medium mt-2 border-b border-gray-600 pb-2 flex items-center justify-between">
                               <span>Image Sequence</span>
                               <span className="text-purple-300 font-medium text-xs bg-purple-900/30 px-2 py-1 rounded border border-purple-500/30">{editingContent.slides?.length || 0} Slides Total</span>
                            </h4>

                            {editingContent.slides?.length > 0 ? (
                              <div className="flex flex-row overflow-x-auto gap-4 custom-scrollbar p-4 bg-[#0f0624] rounded-lg border border-gray-600 shadow-inner max-w-full">
                                {editingContent.slides.map((slide: any, idx: number) => (
                                  <div key={slide.id} className="relative group bg-black border border-gray-600 shadow-md rounded-lg overflow-hidden flex flex-col flex-shrink-0 w-[240px] aspect-video hover:border-purple-500 transition-colors">
                                    <img src={slide.content} alt={slide.title || `Slide ${idx + 1}`} className="relative z-10 w-full h-full object-contain bg-black" />
                                    <div className="absolute z-20 top-0 right-0 left-0 bg-black/70 p-2 flex justify-between opacity-100 transition-opacity backdrop-blur-sm">
                                      <div className="flex space-x-1">
                                        <button disabled={idx === 0} className="bg-gray-700 hover:bg-gray-500 text-white p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newSlides = [...editingContent.slides];
                                            [newSlides[idx - 1], newSlides[idx]] = [newSlides[idx], newSlides[idx - 1]];
                                            updateItemContent(editingContent.id, editingContent.title, editingContent.content, newSlides);
                                            setEditingContent({ ...editingContent, slides: newSlides });
                                          }}
                                          title="Move Left"
                                        >
                                          <ChevronLeftIcon className="w-4 h-4" />
                                        </button>
                                        <button disabled={idx === editingContent.slides.length - 1} className="bg-gray-700 hover:bg-gray-500 text-white p-1 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const newSlides = [...editingContent.slides];
                                            [newSlides[idx + 1], newSlides[idx]] = [newSlides[idx], newSlides[idx + 1]];
                                            updateItemContent(editingContent.id, editingContent.title, editingContent.content, newSlides);
                                            setEditingContent({ ...editingContent, slides: newSlides });
                                          }}
                                          title="Move Right"
                                        >
                                          <ChevronRightIcon className="w-4 h-4" />
                                        </button>
                                      </div>
                                      <button className="bg-red-600 hover:bg-red-500 text-white p-1 rounded"
                                        title="Remove Image"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const nextSlides = editingContent.slides.filter((s: any) => s.id !== slide.id);
                                          updateItemContent(editingContent.id, editingContent.title, editingContent.content, nextSlides);
                                          setEditingContent({ ...editingContent, slides: nextSlides });
                                        }}>
                                        <XIcon className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <div className="absolute bottom-2 left-2 bg-black/80 px-2 py-0.5 rounded text-xs text-white font-medium border border-gray-600">Slide {idx + 1}</div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-[#1a0f2e] border-2 border-dashed border-gray-600 rounded-lg p-12 text-center text-gray-400">
                                <ImageIcon className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                                No images added yet.<br />Use <span className="text-purple-400">"Browse media"</span> or <span className="text-purple-400">"Import Media"</span> above to start.
                              </div>
                            )}

                            {/* Browse Media Modal for Image Editor */}
                            <BackgroundAssetsModal
                              isOpen={isImageBrowseModalOpen}
                              onClose={() => setIsImageBrowseModalOpen(false)}
                              backgroundModalMode={"browse"}
                              recentlyUploadedMediaId={null}
                              getCurrentItemId={() => editingContent?.id || null}
                              applyBackgroundToCurrentItem={(bg: any) => {
                                // Add the selected cloud asset as a new slide
                                const newSlide = {
                                  id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  type: "media" as const,
                                  subtype: "image" as const,
                                  title: editingContent.title || bg.name || "Cloud Image",
                                  content: bg.value,
                                  itemId: editingContent.id
                                };
                                const existingRealSlides = (editingContent.slides || []).filter(
                                  (s: any) => s.content && s.content !== "Worship background image" && s.content !== "Inspirational worship video" && s.content !== "Ready for content"
                                );
                                const updatedSlides = [...existingRealSlides, newSlide];
                                updateItemContent(editingContent.id, editingContent.title, editingContent.content, updatedSlides);
                                setEditingContent({ ...editingContent, slides: updatedSlides });
                                setIsImageBrowseModalOpen(false);
                              }}
                            />
                          </div>
                        )}

                        {/* ========== VIDEO EDITOR ========== */}
                        {editingContent.type === "media" && editingContent.subtype === "video" && (
                          <div className="space-y-6">
                            {/* Title & Import block */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#2a1f3d] p-4 rounded-lg border border-gray-600">
                              <div className="flex items-center space-x-3 w-full">
                                <label className="text-white font-medium whitespace-nowrap">Video Title</label>
                                <Input
                                  value={editingContent.title}
                                  onChange={(e) => {
                                    const newTitle = e.target.value;
                                    updateItemContent(editingContent.id, newTitle, editingContent.content, editingContent.slides);
                                    setEditingContent({ ...editingContent, title: newTitle });
                                  }}
                                  className="w-full bg-[#0f0624] border border-gray-600 text-white rounded px-3 py-1.5 outline-none"
                                  placeholder="Enter video title..."
                                />
                              </div>
                              <div className="flex space-x-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setVideoBrowseModalMode("browse");
                                    setIsVideoBrowseModalOpen(true);
                                  }}
                                  className="h-8 bg-[#1a0f2e] hover:bg-[#3a2f4d] text-white px-3 rounded border border-purple-500/30 shadow transition-all flex items-center space-x-2 text-xs font-medium"
                                >
                                  <FolderOpen className="w-3 h-3 text-purple-400" />
                                  <span>Browse media</span>
                                </button>
                                <button
                                  onClick={() => setIsVideoImportModalOpen(true)}
                                  className="h-8 bg-gradient-to-r from-purple-600 to-purple-700 hover:opacity-90 text-white px-3 rounded border border-purple-500 shadow cursor-pointer transition-all flex items-center space-x-2 text-xs font-medium m-0"
                                >
                                  <Upload className="w-3 h-3" />
                                  <span>Import Video</span>
                                </button>
                              </div>
                            </div>

                            {/* Import Media Modal for Video Editor */}
                            <ImportFilesModal
                              open={isVideoImportModalOpen}
                              onOpenChange={setIsVideoImportModalOpen}
                              onMultipleMediaUploaded={(assets: any[]) => {
                                const contentObj = {
                                  ...((typeof editingContent.content === 'object' && editingContent.content !== null) ? editingContent.content : {}),
                                  autoPlay: true,
                                  displayMode: "fullscreen",
                                  endAction: "loop",
                                };

                                const newSlides = assets.map((asset) => {
                                  const url = asset.fileUrl;
                                  return {
                                    id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                    type: "media" as const,
                                    subtype: "video" as const,
                                    title: editingContent.title || asset.title || "Imported Video",
                                    content: url,
                                    videoSettings: { ...contentObj, url },
                                    itemId: editingContent.id
                                  }
                                });

                                const existingRealSlides = (editingContent.slides || []).filter(
                                  (s: any) => s.content && s.content !== "Worship background image" && s.content !== "Inspirational worship video" && s.content !== "Ready for content"
                                );

                                const updatedSlides = [...existingRealSlides, ...newSlides];
                                const finalContentObj = { ...contentObj, url: newSlides[0]?.content };
                                updateItemContent(editingContent.id, editingContent.title, finalContentObj, updatedSlides);
                                setEditingContent({...editingContent, content: finalContentObj, slides: updatedSlides});
                                setIsVideoImportModalOpen(false);
                              }}
                            />

                            {/* Video Settings */}
                            {/* Inline Video Settings */}
                            <div className="flex flex-wrap items-center bg-[#2a1f3d] p-3 rounded-lg border border-gray-600 gap-x-6 gap-y-3 text-sm">
                              <label className="flex items-center space-x-2 text-white cursor-pointer w-max m-0">
                                <input
                                  type="checkbox"
                                  className="rounded bg-[#0f0624] border-gray-600 text-purple-600 focus:ring-purple-500 w-4 h-4 m-0 p-0 cursor-pointer"
                                  checked={typeof editingContent.content === 'object' && editingContent.content?.autoPlay !== undefined ? editingContent.content.autoPlay : true}
                                  onChange={(e) => {
                                    const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), autoPlay: e.target.checked };
                                    const nextSlides = editingContent.slides?.map((s: any) => ({ ...s, videoSettings: nextContent }));
                                    updateItemContent(editingContent.id, editingContent.title, nextContent, nextSlides);
                                    setEditingContent({ ...editingContent, content: nextContent, slides: nextSlides });
                                  }}
                                />
                                <span>Auto-play video</span>
                              </label>

                              <div className="flex items-center space-x-2 text-gray-300 border-l border-gray-600 pl-6">
                                <span>Display:</span>
                                <select
                                  className="h-7 bg-[#0f0624] border border-gray-600 rounded px-1 text-white outline-none w-28"
                                  value={typeof editingContent.content === 'object' ? editingContent.content?.displayMode : "fullscreen"}
                                  onChange={(e) => {
                                    const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), displayMode: e.target.value };
                                    const nextSlides = editingContent.slides?.map((s: any) => ({ ...s, videoSettings: nextContent }));
                                    updateItemContent(editingContent.id, editingContent.title, nextContent, nextSlides);
                                    setEditingContent({ ...editingContent, content: nextContent, slides: nextSlides });
                                  }}
                                >
                                  <option value="fullscreen">Full</option>
                                  <option value="center">Centre</option>
                                </select>
                              </div>

                              <div className="flex items-center space-x-2 text-gray-300 border-l border-gray-600 pl-6">
                                <span>End Action:</span>
                                <select
                                  className="h-7 bg-[#0f0624] border border-gray-600 rounded px-1 text-white outline-none w-32"
                                  value={typeof editingContent.content === 'object' ? editingContent.content?.endAction : "loop"}
                                  onChange={(e) => {
                                    const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}), endAction: e.target.value };
                                    const nextSlides = editingContent.slides?.map((s: any) => ({ ...s, videoSettings: nextContent }));
                                    updateItemContent(editingContent.id, editingContent.title, nextContent, nextSlides);
                                    setEditingContent({ ...editingContent, content: nextContent, slides: nextSlides });
                                  }}
                                >
                                  <option value="loop">Loop</option>
                                  <option value="nothing">Stop</option>
                                  <option value="advance">Next</option>
                                </select>
                              </div>

                              <div className="flex items-center space-x-2 text-gray-300 border-l border-gray-600 pl-6">
                                <span>Start/End (s):</span>
                                <div className="flex items-center space-x-1">
                                  <input
                                    type="number"
                                    min={0}
                                    className="h-7 w-14 bg-[#0f0624] border border-gray-600 text-center rounded text-white"
                                    value={typeof editingContent.content === 'object' && editingContent.content?.startTime !== undefined ? editingContent.content.startTime : ""}
                                    placeholder="0"
                                    onChange={(e) => {
                                      const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}) };
                                      if (e.target.value === '') { delete nextContent.startTime; } else { nextContent.startTime = parseFloat(e.target.value); }
                                      const startT = nextContent.startTime || 0;
                                      const endT = nextContent.endTime ? ',' + nextContent.endTime : '';
                                      const nextSlides = editingContent.slides?.map((s: any) => ({ ...s, content: `${nextContent.url || s.content.split('#')[0]}#t=${startT}${endT}`, videoSettings: nextContent }));
                                      updateItemContent(editingContent.id, editingContent.title, nextContent, nextSlides);
                                      setEditingContent({ ...editingContent, content: nextContent, slides: nextSlides });
                                    }}
                                  />
                                  <span>-</span>
                                  <input
                                    type="number"
                                    min={0}
                                    className="h-7 w-14 bg-[#0f0624] border border-gray-600 text-center rounded text-white"
                                    value={typeof editingContent.content === 'object' && editingContent.content?.endTime !== undefined ? editingContent.content.endTime : ""}
                                    placeholder="End"
                                    onChange={(e) => {
                                      const nextContent = { ...((typeof editingContent.content === 'object' && editingContent.content) ? editingContent.content : {}) };
                                      if (e.target.value === '') { delete nextContent.endTime; } else { nextContent.endTime = parseFloat(e.target.value); }
                                      const startT = nextContent.startTime || 0;
                                      const endT = nextContent.endTime ? ',' + nextContent.endTime : '';
                                      const nextSlides = editingContent.slides?.map((s: any) => ({ ...s, content: `${nextContent.url || s.content.split('#')[0]}#t=${startT}${endT}`, videoSettings: nextContent }));
                                      updateItemContent(editingContent.id, editingContent.title, nextContent, nextSlides);
                                      setEditingContent({ ...editingContent, content: nextContent, slides: nextSlides });
                                    }}
                                  />
                                </div>
                              </div>
                            </div>



                            {/* Browse Media Modal for Video Editor */}
                            <BackgroundAssetsModal
                              isOpen={isVideoBrowseModalOpen}
                              onClose={() => setIsVideoBrowseModalOpen(false)}
                              backgroundModalMode={videoBrowseModalMode}
                              recentlyUploadedMediaId={null}
                              filterType={"video"}
                              getCurrentItemId={() => editingContent?.id || null}
                              applyBackgroundToCurrentItem={(bg: any) => {
                                const contentObj = {
                                  ...((typeof editingContent.content === 'object' && editingContent.content !== null) ? editingContent.content : {}),
                                  url: bg.value,
                                  autoPlay: true,
                                  displayMode: "fullscreen",
                                  endAction: "loop",
                                };
                                const newSlide = {
                                  id: `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                                  type: "media" as const,
                                  subtype: "video" as const,
                                  title: editingContent.title || bg.name || "Cloud Video",
                                  content: bg.value,
                                  videoSettings: contentObj,
                                  itemId: editingContent.id
                                };
                                const existingRealSlides = (editingContent.slides || []).filter(
                                  (s: any) => s.content && s.content !== "Worship background image" && s.content !== "Inspirational worship video" && s.content !== "Ready for content"
                                );
                                const updatedSlides = [...existingRealSlides, newSlide];
                                updateItemContent(editingContent.id, editingContent.title, contentObj, updatedSlides);
                                setEditingContent({ ...editingContent, content: contentObj, slides: updatedSlides });
                                setIsVideoBrowseModalOpen(false);
                              }}
                            />

                          </div>
                        )}

                        {editingContent.type === "bible" && (
                          <OnScreenBibleEditor
                            content={
                              editingContent.content || editingContent
                            }
                            onUpdate={(updatedContent) => {
                              console.log(
                                "📝 PARENT: OnScreenBibleEditor onUpdate called with:",
                                updatedContent,
                              );
                              console.log(
                                "📝 PARENT: Current editingContent.id:",
                                editingContent.id,
                              );
                              console.log(
                                "📝 PARENT: About to call updateItemContent...",
                              );
                              updateItemContent(
                                editingContent.id,
                                updatedContent.title ||
                                updatedContent.reference,
                                updatedContent,
                                updatedContent.slides,
                              );
                              console.log(
                                "📝 PARENT: updateItemContent completed",
                              );
                            }}
                          />
                        )}

                        {/* OLD BIBLE EDITOR - REPLACED WITH OnScreenBibleEditor ABOVE */}
                        {false && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-gray-300 block mb-2">
                                Scripture Reference
                              </label>
                              <input
                                type="text"
                                value={editingContent.reference || ""}
                                onChange={(e) => {
                                  const newReference = e.target.value;
                                  if (editingContent) {
                                    updateItemContent(
                                      editingContent.id,
                                      newReference ||
                                      editingContent.title,
                                      {
                                        ...editingContent.content,
                                        reference: newReference,
                                      },
                                    );
                                  }
                                }}
                                className="w-full bg-[#0f0624] border border-gray-600 rounded-lg px-3 py-2 text-white"
                                placeholder="e.g., John 3:16"
                              />
                            </div>
                            <div>
                              <label className="text-sm text-gray-300 block mb-2">
                                Bible Version
                              </label>
                              <select
                                value={editingContent.version || "NIV"}
                                onChange={(e) => {
                                  const newVersion = e.target.value;
                                  if (editingContent) {
                                    updateItemContent(
                                      editingContent.id,
                                      editingContent.title,
                                      {
                                        ...editingContent.content,
                                        version: newVersion,
                                      },
                                    );
                                  }
                                }}
                                className="w-full bg-[#0f0624] border border-gray-600 rounded-lg px-3 py-2 text-white"
                              >
                                <option>NIV</option>
                                <option>KJV</option>
                                <option>ESV</option>
                                <option>NKJV</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300 block mb-2">
                                Scripture Text
                              </label>
                              <textarea
                                value={editingContent.content || ""}
                                onChange={(e) => {
                                  const newContent = e.target.value;
                                  if (editingContent) {
                                    updateItemContent(
                                      editingContent.id,
                                      editingContent.title,
                                      newContent,
                                    );
                                  }
                                }}
                                rows={4}
                                className="w-full bg-[#0f0624] border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
                                placeholder="Scripture text will appear here..."
                              />
                            </div>
                          </div>
                        )}

                        {editingContent.type === "announcement" && (
                          <div className="h-full flex flex-col">
                            {/* Announcement Editor: Rich Text Editor Toolbar - Matches Song Editor */}
                            <div className="bg-[#2d1f4a] rounded-t-lg border border-gray-600 mb-0" onMouseDown={(e) => { if ((e.target as HTMLElement).tagName !== 'SELECT' && (e.target as HTMLElement).tagName !== 'INPUT') e.preventDefault(); }}>
                              {/* Top Row - Slides (Announcement) Tab */}
                              <div className="px-4 py-2 border-b border-gray-600">
                                <span className="text-white text-sm font-medium">
                                  Slides (Announcement)
                                </span>
                              </div>

                              {/* Toolbar Row 1 - Font, Links, Heading, Styles */}
                              <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-600 overflow-x-auto">
                                {/* Undo/Redo */}
                                <div className="flex items-center">
                                  <button
                                    className={`p-1.5 rounded transition-colors ${editorState.canUndo ? "text-white hover:bg-white/10" : "text-gray-500 cursor-not-allowed"}`}
                                    disabled={!editorState.canUndo}
                                    onClick={handleUndo}
                                    title="Undo (Ctrl+Z)"
                                  >
                                    <UndoIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    className={`p-1.5 rounded transition-colors ${editorState.canRedo ? "text-white hover:bg-white/10" : "text-gray-500 cursor-not-allowed"}`}
                                    disabled={!editorState.canRedo}
                                    onClick={handleRedo}
                                    title="Redo (Ctrl+Y)"
                                  >
                                    <RedoIcon className="w-4 h-4" />
                                  </button>
                                </div>

                                <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                                {/* Font Dropdown */}
                                <select
                                  className="bg-transparent text-white text-sm px-2 py-1 border border-gray-500 rounded focus:border-gray-400 outline-none min-w-0 flex-shrink-0"
                                  value={editorState.selectedFont}
                                  onChange={(e) => {
                                    const newFont = e.target.value;
                                    setEditorState((prev: any) => ({
                                      ...prev,
                                      selectedFont: newFont,
                                    }));
                                    applyFontFamily(newFont);
                                  }}
                                  title="Font Family"
                                >
                                  <option className="bg-[#2d1f4a]" value="Lufgord">Lufgord</option>
                                  <option className="bg-[#2d1f4a]" value="Arial">Arial</option>
                                  <option className="bg-[#2d1f4a]" value="Helvetica">Helvetica</option>
                                  <option className="bg-[#2d1f4a]" value="Times New Roman">Times New Roman</option>
                                  <option className="bg-[#2d1f4a]" value="Georgia">Georgia</option>
                                  <option className="bg-[#2d1f4a]" value="Roboto">Roboto</option>
                                  <option className="bg-[#2d1f4a]" value="Open Sans">Open Sans</option>
                                  <option className="bg-[#2d1f4a]" value="Montserrat">Montserrat</option>
                                  <option className="bg-[#2d1f4a]" value="Poppins">Poppins</option>
                                  <option className="bg-[#2d1f4a]" value="Inter">Inter</option>
                                  <option className="bg-[#2d1f4a]" value="Playfair Display">Playfair Display</option>
                                </select>

                                {/* Chain Link Icons */}
                                <div className="flex items-center">
                                  <button className="p-1.5 text-white hover:bg-white/10 rounded" title="Insert Link">
                                    <LinkIcon className="w-4 h-4" />
                                  </button>
                                  <button className="p-1.5 text-white hover:bg-white/10 rounded" title="Link Options">
                                    <span className="text-sm">🔗</span>
                                  </button>
                                  <button className="p-1.5 text-white hover:bg-white/10 rounded" title="Text Format">
                                    <span className="text-sm font-bold">A</span>
                                  </button>
                                </div>

                                <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                                {/* Heading Dropdown */}
                                <div className="relative">
                                  <select
                                    className="bg-transparent text-white text-sm border border-gray-500 rounded focus:border-gray-400 outline-none w-[120px] flex-shrink-0 box-border appearance-none"
                                    style={{
                                      height: "26px",
                                      paddingLeft: "8px",
                                      paddingRight: "8px",
                                      lineHeight: "26px",
                                      fontSize: "14px",
                                    }}
                                    value={editorState.selectedHeading}
                                    onChange={(e) => {
                                      applyFormatting("heading", e.target.value);
                                    }}
                                    title="Text Hierarchy"
                                  >
                                    <option className="bg-[#2d1f4a]" value="Heading 1">Heading 1</option>
                                    <option className="bg-[#2d1f4a]" value="Heading 2">Heading 2</option>
                                    <option className="bg-[#2d1f4a]" value="Heading 3">Heading 3</option>
                                    <option className="bg-[#2d1f4a]" value="Paragraph">Paragraph</option>
                                  </select>
                                  <ChevronDownIcon className="absolute right-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400 pointer-events-none" />
                                </div>

                                {/* Styles Dropdown */}
                                <div className="relative styles-dropdown">
                                  <button
                                    ref={stylesButtonRef}
                                    onClick={handleStylesClick}
                                    className="bg-transparent text-white text-sm border border-gray-500 rounded focus:border-gray-400 outline-none w-[120px] flex-shrink-0 box-border flex items-center justify-between"
                                    style={{
                                      height: "26px",
                                      paddingLeft: "8px",
                                      paddingRight: "8px",
                                      lineHeight: "26px",
                                      fontSize: "14px",
                                    }}
                                    title="Visual Style Presets"
                                  >
                                    <span>{editorState.selectedStyle || "Styles"}</span>
                                    <ChevronDownIcon className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Toolbar Row 2 - B/I/U/S, Font Size, Color, Lists, Alignment */}
                              <div className="flex flex-wrap items-center gap-2 px-4 py-2 overflow-x-auto">
                                {/* Text Formatting - B, I, U, S */}
                                <div className="flex items-center">
                                  <button
                                    className={`p-1.5 rounded font-bold text-sm transition-colors ${editorState.isBold
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("bold")}
                                    title="Bold (Ctrl+B)"
                                  >
                                    B
                                  </button>
                                  <button
                                    className={`p-1.5 rounded italic text-sm transition-colors ${editorState.isItalic
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("italic")}
                                    title="Italic (Ctrl+I)"
                                  >
                                    I
                                  </button>
                                  <button
                                    className={`p-1.5 rounded underline text-sm transition-colors ${editorState.isUnderline
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("underline")}
                                    title="Underline (Ctrl+U)"
                                  >
                                    U
                                  </button>
                                  <button
                                    className={`p-1.5 rounded line-through text-sm transition-colors ${editorState.isStrikethrough
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("strikethrough")}
                                    title="Strikethrough"
                                  >
                                    S
                                  </button>
                                </div>

                                <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                                {/* Font Size */}
                                <select
                                  className="bg-transparent text-white text-sm px-2 py-1 border border-gray-500 rounded focus:border-gray-400 outline-none min-w-0 flex-shrink-0"
                                  value={editorState.fontSize}
                                  onChange={(e) => {
                                    applyFormatting("fontSize", e.target.value);
                                  }}
                                  title="Font Size"
                                >
                                  <option className="bg-[#2d1f4a]" value="12px">12px</option>
                                  <option className="bg-[#2d1f4a]" value="14px">14px</option>
                                  <option className="bg-[#2d1f4a]" value="16px">16px</option>
                                  <option className="bg-[#2d1f4a]" value="18px">18px</option>
                                  <option className="bg-[#2d1f4a]" value="20px">20px</option>
                                  <option className="bg-[#2d1f4a]" value="24px">24px</option>
                                  <option className="bg-[#2d1f4a]" value="28px">28px</option>
                                  <option className="bg-[#2d1f4a]" value="32px">32px</option>
                                </select>

                                {/* Color Picker */}
                                <input
                                  type="color"
                                  value={editorState.textColor}
                                  onChange={(e) => {
                                    applyFormatting("color", e.target.value);
                                  }}
                                  className="w-8 h-8 bg-transparent border border-gray-500 rounded cursor-pointer flex-shrink-0"
                                  title="Text Color"
                                />

                                <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                                {/* Lists */}
                                <div className="flex items-center">
                                  <button
                                    className={`p-1.5 rounded text-sm transition-colors ${editorState.listType === "bullet"
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => {
                                      applyFormatting("bulletList");
                                      setEditorState((prev: any) => ({
                                        ...prev,
                                        listType: prev.listType === "bullet" ? "none" : "bullet",
                                      }));
                                    }}
                                    title="Bullet List"
                                  >
                                    •
                                  </button>
                                  <button
                                    className={`p-1.5 rounded text-sm transition-colors ${editorState.listType === "numbered"
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => {
                                      applyFormatting("numberedList");
                                      setEditorState((prev: any) => ({
                                        ...prev,
                                        listType: prev.listType === "numbered" ? "none" : "numbered",
                                      }));
                                    }}
                                    title="Numbered List"
                                  >
                                    1.
                                  </button>

                                  {/* Text Alignment */}
                                  <button
                                    className={`p-1.5 rounded text-sm transition-colors ${editorState.textAlign === "left"
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("align-left")}
                                    title="Align Left"
                                  >
                                    ≡
                                  </button>
                                  <button
                                    className={`p-1.5 rounded text-sm transition-colors ${editorState.textAlign === "center"
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("align-center")}
                                    title="Align Center"
                                  >
                                    ⊞
                                  </button>
                                  <button
                                    className={`p-1.5 rounded text-sm transition-colors ${editorState.textAlign === "right"
                                      ? "bg-white/20 text-white"
                                      : "text-white hover:bg-white/10"
                                      }`}
                                    onClick={() => applyFormatting("align-right")}
                                    title="Align Right"
                                  >
                                    ≣
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Announcement Content Area */}
                            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                              {/* Announcement Title - Editable */}
                              <div>
                                <label className="block text-white text-xs font-medium mb-1">
                                  Announcement Title
                                </label>
                                <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                  <input
                                    type="text"
                                    value={editingContent.title || ""}
                                    onFocus={(e) => {
                                      // Register title input as active for toolbar interaction
                                      setActiveTextarea(e.target as any);
                                    }}
                                    onChange={(e) => {
                                      const newTitle = e.target.value;
                                      setEditingContent((prev: any) =>
                                        prev ? { ...prev, title: newTitle } : null,
                                      );
                                      updateItemContent(
                                        editingContent.id,
                                        newTitle,
                                        editingContent.content,
                                        undefined,
                                        { location: editingContent.location, eventDate: editingContent.eventDate, eventTime: editingContent.eventTime, contact: editingContent.contact, duration: editingContent.duration },
                                      );
                                    }}
                                    className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-white text-base"
                                    style={{
                                      fontFamily: editorState.selectedFont || "Lufgord",
                                      fontSize: editorState.fontSize || "16px",
                                      color: editorState.styleColor || editorState.textColor || "#ffffff",
                                      textAlign: (editorState.textAlign as any) || "left",
                                      fontWeight: editorState.isBold ? "bold" : "normal",
                                      fontStyle: editorState.isItalic ? "italic" : "normal",
                                      textDecoration:
                                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                        "none",
                                    }}
                                    placeholder="Enter announcement title..."
                                  />
                                </div>
                              </div>

                              {/* Announcement Message - Editable with WYSIWYG styling */}
                              <div>
                                <label className="block text-white text-xs font-medium mb-1">
                                  Message
                                </label>
                                <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                  <textarea
                                    ref={textAreaRef}
                                    value={
                                      typeof editingContent.content === "string"
                                        ? editingContent.content
                                        : ""
                                    }
                                    onFocus={(e) => {
                                      const textarea = e.target as HTMLTextAreaElement;
                                      setActiveTextarea(textarea);
                                      applyStylesToTextarea(textarea, editorState);
                                    }}
                                    onChange={(e) => {
                                      const newContent = e.target.value;
                                      setEditingContent((prev: any) =>
                                        prev ? { ...prev, content: newContent } : null,
                                      );
                                      updateItemContent(
                                        editingContent.id,
                                        editingContent.title,
                                        newContent,
                                        undefined,
                                        { location: editingContent.location, eventDate: editingContent.eventDate, eventTime: editingContent.eventTime, contact: editingContent.contact, duration: editingContent.duration },
                                      );
                                    }}
                                    rows={3}
                                    className="w-full min-h-[80px] bg-transparent border-none outline-none resize-none px-3 py-2.5 text-white text-sm whitespace-pre-wrap leading-relaxed"
                                    style={{
                                      fontFamily: editorState.selectedFont || "Lufgord",
                                      fontSize: editorState.fontSize || "14px",
                                      color: editorState.textColor || "#ffffff",
                                      textAlign: (editorState.textAlign as any) || "left",
                                      fontWeight: editorState.isBold ? "bold" : "normal",
                                      fontStyle: editorState.isItalic ? "italic" : "normal",
                                      textDecoration:
                                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                        "none",
                                    }}
                                    placeholder="Enter announcement message..."
                                  />
                                </div>
                              </div>

                              {/* Location */}
                              <div>
                                <label className="block text-white text-xs font-medium mb-1">
                                  <span className="inline-flex items-center gap-1">📍 Location</span>
                                </label>
                                <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                  <input
                                    type="text"
                                    value={editingContent.location || ""}
                                    onChange={(e) => {
                                      const newLocation = e.target.value;
                                      setEditingContent((prev: any) =>
                                        prev ? { ...prev, location: newLocation } : null,
                                      );
                                      // Propagate to service items & slides
                                      updateItemContent(
                                        editingContent.id,
                                        editingContent.title,
                                        editingContent.content,
                                        undefined,
                                        { location: newLocation, eventDate: editingContent.eventDate, eventTime: editingContent.eventTime, contact: editingContent.contact, duration: editingContent.duration },
                                      );
                                    }}
                                    className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-white text-sm"
                                    placeholder="e.g. Main Sanctuary, Fellowship Hall..."
                                  />
                                </div>
                              </div>

                              {/* Event Date & Time - Side by Side */}
                              <div>
                                <label className="block text-white text-xs font-medium mb-1">
                                  <span className="inline-flex items-center gap-1">📅 Event Date & Time</span>
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                    <input
                                      type="date"
                                      value={editingContent.eventDate || ""}
                                      onChange={(e) => {
                                        const newDate = e.target.value;
                                        setEditingContent((prev: any) =>
                                          prev ? { ...prev, eventDate: newDate } : null,
                                        );
                                        updateItemContent(
                                          editingContent.id,
                                          editingContent.title,
                                          editingContent.content,
                                          undefined,
                                          { location: editingContent.location, eventDate: newDate, eventTime: editingContent.eventTime, contact: editingContent.contact, duration: editingContent.duration },
                                        );
                                      }}
                                      className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-white text-sm [color-scheme:dark]"
                                    />
                                  </div>
                                  <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                    <input
                                      type="time"
                                      value={editingContent.eventTime || ""}
                                      onChange={(e) => {
                                        const newTime = e.target.value;
                                        setEditingContent((prev: any) =>
                                          prev ? { ...prev, eventTime: newTime } : null,
                                        );
                                        updateItemContent(
                                          editingContent.id,
                                          editingContent.title,
                                          editingContent.content,
                                          undefined,
                                          { location: editingContent.location, eventDate: editingContent.eventDate, eventTime: newTime, contact: editingContent.contact, duration: editingContent.duration },
                                        );
                                      }}
                                      className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-white text-sm [color-scheme:dark]"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Contact Info */}
                              <div>
                                <label className="block text-white text-xs font-medium mb-1">
                                  <span className="inline-flex items-center gap-1">📞 Contact Info</span>
                                </label>
                                <div className="bg-[#1a0f2e] border border-gray-600 rounded-lg focus-within:border-[#8356F3] transition-colors">
                                  <input
                                    type="text"
                                    value={editingContent.contact || ""}
                                    onChange={(e) => {
                                      const newContact = e.target.value;
                                      setEditingContent((prev: any) =>
                                        prev ? { ...prev, contact: newContact } : null,
                                      );
                                      // Propagate to service items & slides
                                      updateItemContent(
                                        editingContent.id,
                                        editingContent.title,
                                        editingContent.content,
                                        undefined,
                                        { location: editingContent.location, eventDate: editingContent.eventDate, eventTime: editingContent.eventTime, contact: newContact, duration: editingContent.duration },
                                      );
                                    }}
                                    className="w-full bg-transparent border-none outline-none px-3 py-2.5 text-white text-sm"
                                    placeholder="e.g. Call John 555-0123, email@church.com"
                                  />
                                </div>
                              </div>

                              {/* Display Duration - Reactive */}
                              <div>
                                <label className="block text-white text-xs font-medium mb-1">
                                  Display Duration
                                </label>
                                <select
                                  className="w-full bg-[#1a0f2e] border border-gray-600 rounded-lg px-3 py-2.5 text-white text-sm focus:border-[#8356F3] outline-none transition-colors"
                                  value={editingContent.duration || "manual"}
                                  onChange={(e) => {
                                    const newDuration = e.target.value;
                                    setEditingContent((prev: any) =>
                                      prev ? { ...prev, duration: newDuration } : null,
                                    );
                                    updateItemContent(
                                      editingContent.id,
                                      editingContent.title,
                                      editingContent.content,
                                      undefined,
                                      { location: editingContent.location, eventDate: editingContent.eventDate, eventTime: editingContent.eventTime, contact: editingContent.contact, duration: newDuration },
                                    );
                                  }}
                                >
                                  <option value="15">15 seconds</option>
                                  <option value="30">30 seconds</option>
                                  <option value="60">1 minute</option>
                                  <option value="120">2 minutes</option>
                                  <option value="300">5 minutes</option>
                                  <option value="manual">Manual advance</option>
                                </select>
                              </div>


                            </div>
                          </div>
                        )}

                        {/* Duplicate generic media editor removed - specific image/slideshow editors above handle all media types */}

                        {editingContent.type === "liturgy" && (
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm text-gray-300 block mb-2">
                                Liturgy Type
                              </label>
                              <select className="w-full bg-[#0f0624] border border-gray-600 rounded-lg px-3 py-2 text-white">
                                <option>Prayer</option>
                                <option>Scripture Reading</option>
                                <option>Communion</option>
                                <option>Responsive Reading</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-sm text-gray-300 block mb-2">
                                Content
                              </label>
                              <textarea
                                value={editingContent.content || ""}
                                rows={6}
                                className="w-full bg-[#0f0624] border border-gray-600 rounded-lg px-3 py-2 text-white resize-none"
                                placeholder="Enter liturgy content..."
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : insertedItems.length > 0 ? (
                    /* Content List */
                    <div className="p-4 space-y-3 overflow-y-auto h-full">
                      {insertedItems.map((item: any, index: number) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            console.log(
                              "🎵 SERVICE ITEM CLICKED:",
                              item,
                            );
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
                          className={`p-4 rounded-lg border cursor-pointer transition-all ${editingContent?.id === item.id
                            ? "border-[#8356F3] bg-[#8356F3]/10"
                            : "border-gray-600 hover:border-gray-500 bg-[#1a0f2e]/50"
                            }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${item.type === "bible"
                                  ? "bg-blue-500/20 text-blue-300"
                                  : item.type === "announcement"
                                    ? "bg-orange-500/20 text-orange-300"
                                    : item.type === "media"
                                      ? "bg-purple-500/20 text-purple-300"
                                      : item.type === "liturgy"
                                        ? "bg-green-500/20 text-green-300"
                                        : "bg-gray-500/20 text-gray-300"
                                  }`}
                              >
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
                                <p className="text-gray-400 text-xs">
                                  {item.type}
                                </p>
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
                          Select songs, Bible verses, announcements, or
                          other content from "Insert item" to begin
                          editing
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* Right Section - Presentation Preview */}
            <div
              className="flex-1 flex items-center justify-center relative min-h-[500px] bg-[#000000]"
              style={(() => {
                // Apply the background of the currently editing item to the entire preview section
                if (editingContent) {
                  const itemBackground = getItemBackground(
                    editingContent.id,
                  );

                  if (
                    itemBackground.type === "image" ||
                    itemBackground.type === "video"
                  ) {
                    // Ensure URL is properly formatted with absolute path
                    let backgroundUrl = itemBackground.value;
                    if (
                      !backgroundUrl.startsWith("http") &&
                      !backgroundUrl.startsWith("data:")
                    ) {
                      backgroundUrl = `${window.location.origin}${backgroundUrl.startsWith("/") ? "" : "/"}${backgroundUrl}`;
                    }

                    const backgroundStyle = {
                      backgroundImage: `url("${backgroundUrl}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundColor: "#000000", // Black fallback
                      minHeight: "100%",
                      width: "100%",
                    };

                    return backgroundStyle;
                  } else {
                    return {
                      backgroundColor:
                        itemBackground.value || "#000000",
                    };
                  }
                }
                return { backgroundColor: "#000000" };
              })()}
            >
              {selectedSlide && !(selectedSlide.item?.type === "media" && selectedSlide.item?.subtype === "video") ? (
                /* Show Selected Slide Content */
                <div className="w-full h-full p-8 flex flex-col justify-center">
                  <div className="text-center space-y-6">
                    {selectedSlide.slide.type === "bible" ? (
                      <>
                        <h1 className="text-white text-4xl font-bold mb-4">
                          {selectedSlide.slide.title}
                        </h1>
                        <p className="text-gray-300 text-xl leading-relaxed max-w-2xl mx-auto">
                          {selectedSlide.slide.content}
                        </p>
                      </>
                    ) : selectedSlide.slide.type === "verse" ||
                      selectedSlide.slide.type === "chorus" ? (
                      <>
                        <h1
                          className="text-white text-3xl font-bold mb-6"
                          style={{
                            fontFamily:
                              titleEditorState.selectedFont ||
                              "Lufgord",
                            fontSize:
                              titleEditorState.fontSize || "18px",
                            color:
                              titleEditorState.textColor || "#ffffff",
                            textAlign:
                              (titleEditorState.textAlign as any) ||
                              "center",
                            fontWeight: titleEditorState.isBold
                              ? "bold"
                              : "normal",
                            fontStyle: titleEditorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                              "none",
                          }}
                        >
                          {selectedSlide.slide.songTitle ||
                            selectedSlide.slide.title}
                        </h1>
                        {/* Show author's name when enabled */}
                        {showAuthorOnScreen &&
                          editingContent?.content?.authors &&
                          editingContent.content.authors.length > 0 && (
                            <div className="text-gray-400 text-base font-medium mb-2">
                              By:{" "}
                              {editingContent.content.authors.join(
                                ", ",
                              )}
                            </div>
                          )}
                        <div className="text-purple-400 text-lg font-medium mb-4">
                          {selectedSlide.slide.sectionLabel ||
                            (selectedSlide.slide.type === "verse"
                              ? "VERSE"
                              : "CHORUS")}
                        </div>
                        <div
                          key={`preview-song-content-${JSON.stringify(editorState)}`}
                          className="text-gray-300 text-xl leading-relaxed space-y-2"
                          style={{
                            fontFamily:
                              editorState.styleFontFamily ||
                              editorState.selectedFont ||
                              "Lufgord",
                            fontSize: editorState.fontSize || "16px",
                            color:
                              editorState.styleColor ||
                              editorState.textColor ||
                              "#ffffff",
                            textAlign:
                              (editorState.textAlign as any) || "left",
                            fontWeight: editorState.isBold
                              ? "bold"
                              : "normal",
                            fontStyle: editorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                              "none",
                            textShadow:
                              editorState.styleTextShadow || "",
                            letterSpacing:
                              editorState.styleLetterSpacing || "",
                            textTransform:
                              (editorState.styleTextTransform as any) ||
                              "",
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                selectedSlide.slide.content.replace(
                                  /\n/g,
                                  "<br/>",
                                ),
                            }}
                          />
                        </div>
                      </>
                    ) : selectedSlide.slide.type === "announcement" ? (
                      <>
                        <h1 className="text-white text-4xl font-bold mb-4">
                          {selectedSlide.slide.title}
                        </h1>
                        {/* Announcement Metadata */}
                        {(selectedSlide.slide.eventDate || selectedSlide.slide.eventTime || selectedSlide.slide.location || selectedSlide.slide.contact) && (
                          <div className="flex items-center gap-4 mb-6 flex-wrap justify-center text-base">
                            {(selectedSlide.slide.eventDate || selectedSlide.slide.eventTime) && (
                              <span className="text-orange-300 font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.8)" }}>
                                📅 {selectedSlide.slide.eventDate ? new Date(selectedSlide.slide.eventDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                                {selectedSlide.slide.eventDate && selectedSlide.slide.eventTime ? " · " : ""}
                                {selectedSlide.slide.eventTime || ""}
                              </span>
                            )}
                            {selectedSlide.slide.location && (
                              <span className="text-purple-300 font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.8)" }}>
                                📍 {selectedSlide.slide.location}
                              </span>
                            )}
                            {selectedSlide.slide.contact && (
                              <span className="text-blue-300 font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.8)" }}>
                                📞 {selectedSlide.slide.contact}
                              </span>
                            )}
                          </div>
                        )}
                        <div
                          key={`preview-announcement-content-${JSON.stringify(editorState)}`}
                          className="text-gray-300 text-xl leading-relaxed space-y-2"
                          style={{
                            fontFamily:
                              editorState.styleFontFamily ||
                              editorState.selectedFont ||
                              "Lufgord",
                            fontSize: editorState.fontSize || "16px",
                            color:
                              editorState.styleColor ||
                              editorState.textColor ||
                              "#ffffff",
                            textAlign:
                              (editorState.textAlign as any) || "left",
                            fontWeight: editorState.isBold
                              ? "bold"
                              : "normal",
                            fontStyle: editorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                              "none",
                            textShadow:
                              editorState.styleTextShadow || "",
                            letterSpacing:
                              editorState.styleLetterSpacing || "",
                            textTransform:
                              (editorState.styleTextTransform as any) ||
                              "",
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                (typeof selectedSlide.slide.content === "string" ? selectedSlide.slide.content : "").replace(
                                  /\n/g,
                                  "<br/>",
                                ),
                            }}
                          />
                        </div>
                      </>
                    ) : selectedSlide.slide.type === "media" ? (
                      <div className="w-full flex-1 flex flex-col justify-center items-center h-full bg-black">
                        {(selectedSlide.slide as any).subtype !== "video" && (
                          <h1 className="text-white text-3xl font-bold mb-4 w-full text-center" style={{ textShadow: "2px 2px 8px rgba(0,0,0,0.8)" }}>
                            {selectedSlide.slide.title}
                          </h1>
                        )}
                        <div className="w-full flex justify-center items-center rounded-xl overflow-hidden shadow-2xl relative" style={{ maxHeight: "calc(100% - 2rem)", height: "100%" }}>
                          {(selectedSlide.slide as any).subtype === "video" ? (
                            <video
                              src={typeof selectedSlide.slide.content === "string" && selectedSlide.slide.content !== "Inspirational worship video" ? selectedSlide.slide.content : (selectedSlide.slide.videoSettings?.url || undefined)}
                              autoPlay={(selectedSlide.slide as any).videoSettings?.autoPlay ?? true}
                              loop={(selectedSlide.slide as any).videoSettings?.endAction !== "nothing"}
                              muted
                              className={(selectedSlide.slide as any).videoSettings?.displayMode === "center" ? "max-w-full max-h-full object-contain rounded-xl" : "w-full h-full object-cover rounded-xl"}
                            />
                          ) : (
                            <img
                              src={typeof selectedSlide.slide.content === "string" && selectedSlide.slide.content.length > 5 && selectedSlide.slide.content !== "Worship background image" && selectedSlide.slide.content !== "Inspirational worship video" ? selectedSlide.slide.content : "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                              alt={selectedSlide.slide.title || "Media preview"}
                              className="max-w-full max-h-full object-contain rounded-xl"
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <h1 className="text-white text-4xl font-bold mb-4">
                          {selectedSlide.slide.title}
                        </h1>
                        <div
                          key={`preview-general-content-${JSON.stringify(editorState)}`}
                          className="text-gray-300 text-xl leading-relaxed space-y-2"
                          style={{
                            fontFamily:
                              editorState.styleFontFamily ||
                              editorState.selectedFont ||
                              "Lufgord",
                            fontSize: editorState.fontSize || "16px",
                            color:
                              editorState.styleColor ||
                              editorState.textColor ||
                              "#ffffff",
                            textAlign:
                              (editorState.textAlign as any) || "left",
                            fontWeight: editorState.isBold
                              ? "bold"
                              : "normal",
                            fontStyle: editorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                              "none",
                            textShadow:
                              editorState.styleTextShadow || "",
                            letterSpacing:
                              editorState.styleLetterSpacing || "",
                            textTransform:
                              (editorState.styleTextTransform as any) ||
                              "",
                          }}
                        >
                          <div
                            dangerouslySetInnerHTML={{
                              __html:
                                (typeof selectedSlide.slide.content === "string" ? selectedSlide.slide.content : "").replace(
                                  /\n/g,
                                  "<br/>",
                                ),
                            }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                  {/* Preview Controls */}
                  <div className="absolute bottom-4 left-4 text-gray-500 text-sm">
                    Preview Mode • Slide{" "}
                    {slides.findIndex(
                      (s: any) => s.id === selectedSlide.slide.id,
                    ) + 1}{" "}
                    of {totalSlides}
                  </div>
                </div>
              ) : editingContent?.type === "song" ? (
                /* Song Editor 1 (Initial/Generic) - Basic song title input and search functionality */
                <div className="w-full h-full p-6 flex flex-col space-y-4">
                  {/* Song Editor 1: Song Title Section with Input and Preview */}
                  <div className="w-full space-y-3">
                    <input
                      type="text"
                      placeholder="Song Title"
                      className="w-full bg-transparent border border-gray-500 rounded-lg px-4 py-3 text-white text-lg placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      value={
                        currentSongTitle ||
                        (editingContent.title === "Song" ||
                          editingContent.title === "Example Song"
                          ? ""
                          : editingContent.title || "")
                      }
                      onChange={(e) =>
                        setCurrentSongTitle(e.target.value)
                      }
                    />

                    {/* Formatted Title Preview */}
                    {(currentSongTitle || editingContent.title) && (
                      <div className="border border-gray-600 rounded-lg p-4 bg-black/20">
                        <div className="text-xs text-gray-400 mb-2">
                          Preview:
                        </div>
                        <h1
                          className="text-white text-center"
                          style={{
                            fontFamily:
                              titleEditorState.selectedFont ||
                              "Lufgord",
                            fontSize:
                              titleEditorState.fontSize || "18px",
                            color:
                              titleEditorState.textColor || "#ffffff",
                            textAlign:
                              (titleEditorState.textAlign as any) ||
                              "center",
                            fontWeight: titleEditorState.isBold
                              ? "bold"
                              : "normal",
                            fontStyle: titleEditorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                              "none",
                          }}
                        >
                          {currentSongTitle || editingContent.title}
                        </h1>
                        {/* Show author's name when enabled */}
                        {showAuthorOnScreen &&
                          editingContent?.content?.authors &&
                          editingContent.content.authors.length > 0 && (
                            <div className="text-gray-400 text-sm text-center mt-2">
                              By:{" "}
                              {editingContent.content.authors.join(
                                ", ",
                              )}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                  {/* Verse Sections - Custom scroller */}
                  <div className="relative flex-1">
                    <div
                      id="preview-scroller"
                      className="space-y-4 scroll-smooth p-4 rounded-lg"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        backgroundColor: "transparent",
                      }}
                      onScroll={(e) => {
                        const container = e.currentTarget;
                        const maxScrollTop =
                          container.scrollHeight -
                          container.clientHeight;
                        const scrollPercentage =
                          maxScrollTop > 0
                            ? (container.scrollTop / maxScrollTop) * 100
                            : 0;

                        // Update progress bar
                        const progressBar =
                          document.getElementById("preview-progress");
                        if (progressBar) {
                          progressBar.style.height = `${Math.min(scrollPercentage, 100)}%`;
                        }

                        // Prevent over-scrolling at the end
                        if (container.scrollTop >= maxScrollTop) {
                          container.scrollTop = maxScrollTop;
                        }
                      }}
                    >
                      {editingContent?.slides?.map(
                        (slide: any, index: number) => (
                          <div
                            key={slide.id}
                            className="border border-gray-500 rounded-lg p-4 min-h-[12rem] bg-black/20"
                          >
                            <div className="text-gray-400 text-sm font-medium mb-2">
                              {slide.sectionLabel ||
                                `Section ${index + 1}`}
                            </div>
                            <div
                              className="text-white text-sm leading-relaxed whitespace-pre-line"
                              style={{
                                fontFamily:
                                  editorState.selectedFont || "Lufgord",
                                fontSize:
                                  editorState.fontSize || "16px",
                                color:
                                  editorState.textColor || "#ffffff",
                                textAlign:
                                  (editorState.textAlign as any) ||
                                  "left",
                                fontWeight: editorState.isBold
                                  ? "bold"
                                  : "normal",
                                fontStyle: editorState.isItalic
                                  ? "italic"
                                  : "normal",
                                textDecoration:
                                  `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                  "none",
                              }}
                            >
                              {slide.content || "No content available"}
                            </div>
                          </div>
                        ),
                      ) || (
                          <>
                            {/* Default empty sections when no song is loaded */}
                            <div className="border border-gray-500 rounded-lg p-4 h-48 bg-black/20">
                              <div className="text-gray-400 text-sm font-medium mb-2">
                                V1
                              </div>
                              <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-sm">
                                  Select a song to load lyrics
                                </p>
                              </div>
                            </div>

                            <div className="border border-gray-500 rounded-lg p-4 h-48 bg-black/20">
                              <div className="text-gray-400 text-sm font-medium mb-2">
                                V2
                              </div>
                              <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-sm">
                                  Additional verses will appear here
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                    </div>

                    {/* Custom Progress Bar for Preview Scroller */}
                    <div className="absolute right-0 top-0 bottom-0 w-1">
                      <div className="h-full bg-gray-600 rounded-full">
                        <div
                          id="preview-progress"
                          className="w-1 bg-purple-500 rounded-full transition-all duration-300"
                          style={{ height: "30%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : editingContent?.type === "bible" ? (
                /* Bible Editor Presentation View Screen (B2) - Bible-specific visual editor with verse boxes */
                <div className="w-full h-full p-6 flex flex-col space-y-4">
                  {/* Bible Reference Section with Input and Preview */}
                  <div className="w-full space-y-3">
                    <input
                      type="text"
                      placeholder="Scripture Reference (e.g., John 3:16)"
                      className="w-full bg-transparent border border-gray-500 rounded-lg px-4 py-3 text-white text-lg placeholder-gray-400 focus:border-gray-400 focus:outline-none"
                      value={
                        editingContent?.content?.reference ||
                        editingContent?.reference ||
                        ""
                      }
                      readOnly
                    />

                    {/* Bible Reference Preview */}
                    {(editingContent?.content?.reference ||
                      editingContent?.reference) && (
                        <div className="border border-gray-600 rounded-lg p-4 bg-black/20">
                          <div className="text-xs text-gray-400 mb-2">
                            Preview:
                          </div>
                          <h1
                            className="text-white text-center text-2xl font-bold"
                            style={{
                              fontFamily:
                                titleEditorState.selectedFont ||
                                "Lufgord",
                              fontSize:
                                titleEditorState.fontSize || "24px",
                              color:
                                titleEditorState.textColor || "#ffffff",
                              textAlign:
                                (titleEditorState.textAlign as any) ||
                                "center",
                              fontWeight: titleEditorState.isBold
                                ? "bold"
                                : "normal",
                              fontStyle: titleEditorState.isItalic
                                ? "italic"
                                : "normal",
                              textDecoration:
                                `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                "none",
                            }}
                          >
                            {editingContent?.content?.reference ||
                              editingContent?.reference}
                          </h1>
                          {/* Show Bible version when available */}
                          {(editingContent?.content?.version ||
                            editingContent?.version) && (
                              <div className="text-gray-400 text-sm text-center mt-2">
                                {editingContent?.content?.version ||
                                  editingContent?.version}{" "}
                                Translation
                              </div>
                            )}
                        </div>
                      )}
                  </div>

                  {/* Bible Verses - Custom scroller with verse boxes */}
                  <div className="relative flex-1">
                    <div
                      id="bible-preview-scroller"
                      className="space-y-4 scroll-smooth p-4 rounded-lg"
                      style={{
                        maxHeight: "400px",
                        overflowY: "auto",
                        scrollbarWidth: "none",
                        msOverflowStyle: "none",
                        backgroundColor: "transparent",
                      }}
                      onScroll={(e) => {
                        const container = e.currentTarget;
                        const maxScrollTop =
                          container.scrollHeight -
                          container.clientHeight;
                        const scrollPercentage =
                          maxScrollTop > 0
                            ? (container.scrollTop / maxScrollTop) * 100
                            : 0;

                        // Update progress bar
                        const progressBar = document.getElementById(
                          "bible-preview-progress",
                        );
                        if (progressBar) {
                          progressBar.style.height = `${Math.min(scrollPercentage, 100)}%`;
                        }

                        // Prevent over-scrolling at the end
                        if (container.scrollTop >= maxScrollTop) {
                          container.scrollTop = maxScrollTop;
                        }
                      }}
                    >
                      {editingContent?.slides?.map(
                        (slide: any, index: number) => (
                          <div
                            key={slide.id}
                            className="border border-gray-500 rounded-lg p-4 min-h-[12rem] bg-black/20"
                          >
                            <div className="text-gray-400 text-sm font-medium mb-2 flex items-center justify-between">
                              <span>
                                {slide.title || `Verse ${index + 1}`}
                              </span>
                              <span className="text-xs text-purple-400">
                                {slide.version ||
                                  editingContent?.content?.version ||
                                  "KJV"}
                              </span>
                            </div>
                            <div
                              className="text-white text-sm leading-relaxed"
                              style={{
                                fontFamily:
                                  editorState.selectedFont || "Lufgord",
                                fontSize:
                                  editorState.fontSize || "16px",
                                color:
                                  editorState.textColor || "#ffffff",
                                textAlign:
                                  (editorState.textAlign as any) ||
                                  "left",
                                fontWeight: editorState.isBold
                                  ? "bold"
                                  : "normal",
                                fontStyle: editorState.isItalic
                                  ? "italic"
                                  : "normal",
                                textDecoration:
                                  `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                                  "none",
                                lineHeight: "1.6",
                              }}
                            >
                              {slide.content ||
                                "No verse content available"}
                            </div>
                            {/* Bible reference footer */}
                            <div className="mt-3 pt-2 border-t border-gray-600">
                              <div className="text-gray-500 text-xs text-right">
                                {slide.bibleReference ||
                                  editingContent?.content?.reference ||
                                  editingContent?.reference}
                              </div>
                            </div>
                          </div>
                        ),
                      ) || (
                          <>
                            {/* Default empty state when no Bible content is loaded */}
                            <div className="border border-gray-500 rounded-lg p-4 h-48 bg-black/20">
                              <div className="text-gray-400 text-sm font-medium mb-2">
                                Verse 1
                              </div>
                              <div className="h-full flex items-center justify-center">
                                <div className="text-center">
                                  <Book className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                  <p className="text-gray-500 text-sm">
                                    Search for a Bible passage above
                                  </p>
                                  <p className="text-gray-400 text-xs mt-1">
                                    e.g., John 3:16 or Romans 8:28
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="border border-gray-500 rounded-lg p-4 h-48 bg-black/20">
                              <div className="text-gray-400 text-sm font-medium mb-2">
                                Verse 2
                              </div>
                              <div className="h-full flex items-center justify-center">
                                <p className="text-gray-500 text-sm">
                                  Additional verses will appear here
                                </p>
                              </div>
                            </div>
                          </>
                        )}
                    </div>

                    {/* Custom Progress Bar for Bible Preview Scroller */}
                    <div className="absolute right-0 top-0 bottom-0 w-1">
                      <div className="h-full bg-gray-600 rounded-full">
                        <div
                          id="bible-preview-progress"
                          className="w-1 bg-purple-500 rounded-full transition-all duration-300"
                          style={{ height: "30%" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : editingContent?.type === "announcement" ? (
                /* Announcement Preview Screen */
                <div className="w-full h-full relative overflow-hidden flex flex-col justify-center items-center p-8 bg-black rounded border border-gray-600/30">
                  <div className="relative z-10 w-full flex flex-col justify-center items-center">
                    <h3
                      className="text-white font-bold mb-4 text-center"
                      style={{
                        fontFamily: editorState.selectedFont || "Lufgord",
                        fontSize: "3vw",
                        textShadow: "4px 4px 12px rgba(0, 0, 0, 0.9)",
                      }}
                    >
                      {editingContent.title || "Announcement Title"}
                    </h3>
                    {/* Date/Time & Location metadata bar */}
                    {(editingContent.eventDate || editingContent.eventTime || editingContent.location || editingContent.contact) && (
                      <div className="flex items-center gap-6 mb-6 flex-wrap justify-center">
                        {(editingContent.eventDate || editingContent.eventTime) && (
                          <span className="text-orange-300 text-[1.2vw] font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}>
                            📅 {editingContent.eventDate ? new Date(editingContent.eventDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                            {editingContent.eventDate && editingContent.eventTime ? " · " : ""}
                            {editingContent.eventTime || ""}
                          </span>
                        )}
                        {editingContent.location && (
                          <span className="text-purple-300 text-[1.2vw] font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}>
                            📍 {editingContent.location}
                          </span>
                        )}
                        {editingContent.contact && (
                          <span className="text-blue-300 text-[1.2vw] font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}>
                            📞 {editingContent.contact}
                          </span>
                        )}
                      </div>
                    )}
                    <p
                      className="text-center w-4/5 max-w-full"
                      style={{
                        fontFamily: editorState.selectedFont || "Lufgord",
                        fontSize: "1.8vw",
                        color: editorState.textColor || "#ffffff",
                        textAlign: (editorState.textAlign as any) || "center",
                        fontWeight: editorState.isBold ? "bold" : "normal",
                        fontStyle: editorState.isItalic ? "italic" : "normal",
                        textDecoration:
                          `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                          "none",
                        textShadow: "3px 3px 10px rgba(0, 0, 0, 0.9)",
                        lineHeight: "1.6",
                      }}
                    >
                      {(typeof editingContent.content === "string"
                        ? editingContent.content
                        : "") || "Your announcement message will appear here..."}
                    </p>
                  </div>
                </div>
              ) : editingContent?.type === "media" ? (
                /* Media Preview Screen */
                <div className="w-full h-full relative overflow-hidden flex flex-col justify-center items-center bg-black rounded border border-gray-600/30">
                  {/* For image/slideshow items with slides, show slide image fullscreen */}
                  {(editingContent.subtype === "image" || editingContent.subtype === "slideshow") && editingContent.slides?.length > 0 ? (
                    <>
                      {(() => {
                        // Show the currently displayed slide's image, or the first slide
                        const displaySlide = currentlyDisplayedSlide && editingContent.slides.some((s: any) => s.id === currentlyDisplayedSlide.id)
                          ? currentlyDisplayedSlide
                          : editingContent.slides[0];
                        const slideIdx = editingContent.slides.findIndex((s: any) => s.id === displaySlide?.id);
                        return (
                          <>
                            <img
                              src={displaySlide?.content}
                              alt={displaySlide?.title || editingContent.title}
                              className="relative z-10 w-full h-full object-contain drop-shadow-2xl bg-black"
                            />
                            <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2.5 py-1 rounded-md border border-gray-600 z-10 font-medium">
                              Slide {slideIdx + 1} / {editingContent.slides.length}
                            </div>
                          </>
                        );
                      })()}
                    </>
                  ) : editingContent.subtype === "video" ? (
                    <video
                      src={typeof editingContent.content === 'string' ? editingContent.content : (editingContent.content?.url || editingContent.slides?.[0]?.content?.split('#')[0] || undefined)}
                      autoPlay loop muted
                      controls
                      className={editingContent.content?.displayMode === "center" ? "absolute inset-0 w-full h-full object-contain" : "absolute inset-0 w-full h-full object-cover"}
                    />
                  ) : (
                    /* Single image fallback */
                    <>
                      <img
                        src={typeof editingContent.content === 'string' && editingContent.content.length > 5 && editingContent.content !== "Worship background image" ? editingContent.content : "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                        alt={editingContent.title}
                        className="relative z-10 w-full h-full object-contain drop-shadow-2xl bg-black"
                      />
                    </>
                  )}
                  {editingContent.subtype !== "video" && (
                    <h3 className="absolute top-6 w-full text-center text-white/80 font-bold text-xl z-20" style={{ textShadow: "2px 2px 4px rgba(0,0,0,0.8)" }}>
                      {editingContent.title || "Media File"}
                    </h3>
                  )}
                </div>
              ) : (
                /* Default Preview State */
                <div className="text-center">
                  <div className="text-gray-600 text-lg font-medium mb-2">
                    Preview Screen
                  </div>
                  <div className="text-gray-500 text-sm">
                    Click a slide to preview content
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* PREVIEW MODE - Windowed Preview */
          <div
            className="fixed inset-0 flex flex-col items-center justify-start backdrop-blur-md bg-black/40"
            style={{
              zIndex: 999999,
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
            }}
          >
            {/* Top Control Bar */}
            <div className="absolute top-2 left-6 right-6 flex items-center justify-between z-10">
              {/* Back to Build Mode Button - Left side */}
              <button
                onClick={togglePreview}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors border border-white/20 hover:border-white/30"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span className="font-medium">Back to Build</span>
              </button>

              {/* Hands-Free Bible Companion Trigger - Right side */}
              <button
                onClick={toggleHandsfreeBible}
                className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors border border-white/20 hover:border-white/30"
              >
                <img
                  src={qworshipLogo}
                  alt="Q-worship"
                  className="w-4 h-4 object-contain"
                />
                <span className="font-medium">Hands-free Bible</span>
              </button>
            </div>
            {/* Preview Screen Content - Windowed */}
            <div
              className="border border-gray-600 rounded-lg overflow-hidden relative flex-shrink-0 mt-24 cursor-pointer"
              onDoubleClick={() => {
                const elem = document.documentElement;
                if (elem.requestFullscreen) {
                  elem.requestFullscreen();
                }
              }}
              title="Double-click to enter fullscreen"
              style={(() => {
                const baseStyle = {
                  aspectRatio: "16/9",
                  height: "calc(90vh - 100px)",
                  width: "85vw",
                  maxWidth: "1500px",
                };

                if (currentlyDisplayedSlide) {
                  // Find the service item that contains this slide
                  const parentItem = serviceItems.find((item) =>
                    item.slides.some(
                      (s: any) => s.id === currentlyDisplayedSlide.id,
                    ),
                  );
                  if (parentItem) {
                    const itemBackground = getItemBackground(
                      parentItem.id,
                    );
                    console.log("🖼️ Main preview area background:", {
                      parentItemId: parentItem.id,
                      itemBackground,
                    });

                    if (
                      itemBackground.type === "image" ||
                      itemBackground.type === "video"
                    ) {
                      // Ensure URL is properly formatted with absolute path
                      let backgroundUrl = itemBackground.value;
                      if (
                        !backgroundUrl.startsWith("http") &&
                        !backgroundUrl.startsWith("data:")
                      ) {
                        backgroundUrl = `${window.location.origin}${backgroundUrl.startsWith("/") ? "" : "/"}${backgroundUrl}`;
                      }

                      console.log(
                        "🌄 Main preview applying media background URL:",
                        backgroundUrl,
                      );

                      return {
                        ...baseStyle,
                        backgroundImage: `url("${backgroundUrl}")`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                        backgroundRepeat: "no-repeat",
                        backgroundColor: "#000000", // Fallback color
                      };
                    } else {
                      return {
                        ...baseStyle,
                        backgroundColor:
                          itemBackground.value || "#000000",
                      };
                    }
                  }
                }

                return {
                  ...baseStyle,
                  backgroundColor: "#000000",
                };
              })()}
            >
              <div className="w-full h-full flex flex-col items-center justify-center p-12 relative overflow-hidden">
                {currentlyDisplayedSlide ? (
                  currentlyDisplayedSlide.type === "media" ? (
                    <>
                      <h1
                        className="text-white font-bold mb-8 z-10 w-full text-center"
                        style={{
                          fontSize: "3vw",
                          textShadow: "2px 2px 8px rgba(0,0,0,0.9)",
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                        }}
                      >
                        {currentlyDisplayedSlide.title}
                      </h1>
                      <div className="w-full flex-1 flex justify-center items-center rounded-xl overflow-hidden shadow-2xl relative z-10 p-4">
                        {(currentlyDisplayedSlide as any).subtype === "video" ? (
                          <video
                            src={typeof currentlyDisplayedSlide.content === "string" && currentlyDisplayedSlide.content !== "Inspirational worship video" ? currentlyDisplayedSlide.content : ((currentlyDisplayedSlide as any).videoSettings?.url || undefined)}
                            autoPlay={(currentlyDisplayedSlide as any).videoSettings?.autoPlay ?? true}
                            loop={(currentlyDisplayedSlide as any).videoSettings?.endAction !== "nothing"}
                            muted
                            controls
                            className={(currentlyDisplayedSlide as any).videoSettings?.displayMode === "center" ? "w-full h-full object-contain rounded-xl bg-black" : "absolute inset-0 w-full h-full object-cover rounded-none"}
                          />
                        ) : (
                          <img
                            src={typeof currentlyDisplayedSlide.content === "string" && currentlyDisplayedSlide.content.length > 5 && currentlyDisplayedSlide.content !== "Worship background image" && currentlyDisplayedSlide.content !== "Inspirational worship video" ? currentlyDisplayedSlide.content : "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                            alt={currentlyDisplayedSlide.title || "Media preview"}
                            className="max-w-full max-h-full object-contain rounded-xl"
                          />
                        )}
                      </div>
                    </>
                  ) : currentlyDisplayedSlide.type === "announcement" ? (
                    <div className="z-10 w-full flex flex-col justify-center items-center p-8">
                      <h1
                        className="text-white font-bold mb-6 text-center w-full"
                        style={{
                          fontSize: "3.5vw",
                          textShadow: "4px 4px 12px rgba(0,0,0,0.9)",
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                        }}
                      >
                        {currentlyDisplayedSlide.title}
                      </h1>

                      {(currentlyDisplayedSlide.eventDate || currentlyDisplayedSlide.eventTime || currentlyDisplayedSlide.location || currentlyDisplayedSlide.contact) && (
                        <div className="flex items-center gap-6 mb-8 flex-wrap justify-center text-2xl w-full">
                          {(currentlyDisplayedSlide.eventDate || currentlyDisplayedSlide.eventTime) && (
                            <span className="text-orange-300 font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}>
                              📅 {currentlyDisplayedSlide.eventDate ? new Date(currentlyDisplayedSlide.eventDate + "T00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                              {currentlyDisplayedSlide.eventDate && currentlyDisplayedSlide.eventTime ? " · " : ""}
                              {currentlyDisplayedSlide.eventTime || ""}
                            </span>
                          )}
                          {currentlyDisplayedSlide.location && (
                            <span className="text-purple-300 font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}>
                              📍 {currentlyDisplayedSlide.location}
                            </span>
                          )}
                          {currentlyDisplayedSlide.contact && (
                            <span className="text-blue-300 font-medium" style={{ textShadow: "2px 2px 6px rgba(0,0,0,0.9)" }}>
                              📞 {currentlyDisplayedSlide.contact}
                            </span>
                          )}
                        </div>
                      )}

                      <div
                        className="text-white whitespace-pre-line leading-relaxed font-light tracking-wide text-center max-w-5xl"
                        style={{
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                          fontSize: "2.5vw",
                          color: editorState.textColor || "#ffffff",
                          fontWeight: editorState.isBold ? "bold" : "normal",
                          fontStyle: editorState.isItalic ? "italic" : "normal",
                          textDecoration: `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() || "none",
                          textShadow: "3px 3px 10px rgba(0,0,0,0.9)",
                        }}
                      >
                        {currentlyDisplayedSlide.content}
                      </div>
                    </div>
                  ) : currentlyDisplayedSlide.type === "bible" ? (
                    <div className="z-10 w-full flex flex-col justify-center items-center p-8">
                      <h1
                        className="text-white font-bold mb-6 text-center w-full"
                        style={{
                          fontSize: "3vw",
                          textShadow: "4px 4px 12px rgba(0,0,0,0.9)",
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                        }}
                      >
                        {currentlyDisplayedSlide.title}
                      </h1>
                      <div
                        className="text-white whitespace-pre-line leading-relaxed font-light tracking-wide text-center max-w-5xl"
                        style={{
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                          fontSize: "2.5vw",
                          color: editorState.textColor || "#ffffff",
                          fontWeight: editorState.isBold ? "bold" : "normal",
                          fontStyle: editorState.isItalic ? "italic" : "normal",
                          textDecoration: `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""}`.trim() || "none",
                          textShadow: "3px 3px 10px rgba(0,0,0,0.9)",
                        }}
                      >
                        {currentlyDisplayedSlide.content}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center z-10 w-full flex flex-col items-center">
                      <h1
                        className="text-white font-bold mb-4 w-full"
                        style={{
                          fontSize: "2.5vw",
                          textShadow: "3px 3px 10px rgba(0,0,0,0.9)",
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                        }}
                      >
                        {currentlyDisplayedSlide.songTitle || currentlyDisplayedSlide.title || ""}
                      </h1>
                      {(currentlyDisplayedSlide.type === "verse" || currentlyDisplayedSlide.type === "chorus") && (
                        <div className="text-purple-400 font-medium mb-4" style={{ fontSize: "1.5vw" }}>
                          {currentlyDisplayedSlide.sectionLabel || (currentlyDisplayedSlide.type === "verse" ? "VERSE" : "CHORUS")}
                        </div>
                      )}
                      <div
                        className="text-white text-center max-w-4xl mx-auto px-8"
                        style={{
                          fontFamily: editorState.styleFontFamily || editorState.selectedFont || "Lufgord",
                          fontSize: "3rem",
                          color: editorState.styleColor || editorState.textColor || "#ffffff",
                          textAlign: (editorState.textAlign as any) || "center",
                          fontWeight: editorState.isBold ? "bold" : "normal",
                          fontStyle: editorState.isItalic ? "italic" : "normal",
                          textDecoration: `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() || "none",
                          textShadow: editorState.styleTextShadow || "",
                          letterSpacing: editorState.styleLetterSpacing || "",
                          textTransform: (editorState.styleTextTransform as any) || "",
                          lineHeight: "1.2",
                        }}
                      >
                        {currentlyDisplayedSlide.content || "No content available"}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="text-center z-10">
                    <h1 className="text-white text-6xl font-bold mb-8">
                      Welcome to Service
                    </h1>
                    <p className="text-gray-300 text-2xl">
                      Sample presentation content
                    </p>
                  </div>
                )}
              </div>

              {/* Top Control Bar - Back to Build and Hands-free Bible */}
              <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-30">
                {/* Back to Build Mode Button */}
                <button
                  onClick={togglePreview}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors border border-white/20 hover:border-white/30"
                >
                  <ChevronLeftIcon className="w-4 h-4" />
                  <span className="font-medium">Back to Build</span>
                </button>

                {/* Hands-Free Bible Button */}
                <button
                  onClick={toggleHandsfreeBible}
                  className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors border border-white/20 hover:border-white/30"
                >
                  <img
                    src={qworshipLogo}
                    alt="Q-worship"
                    className="w-4 h-4 object-contain"
                  />
                  <span className="font-medium">Hands-free Bible</span>
                </button>
              </div>

              {/* Live Screen Controls Overlay */}
              <div className="absolute bottom-6 left-6">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={previousSlide}
                    disabled={currentSlide <= 1}
                    className="px-4 py-2 bg-black/70 hover:bg-black/90 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                  </button>
                  <div className="text-white/80 text-sm font-medium bg-black/70 px-3 py-2 rounded-lg border border-gray-600">
                    Slide {currentSlide} of {totalSlides}
                  </div>
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide >= totalSlides}
                    className="px-4 py-2 bg-black/70 hover:bg-black/90 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRightIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            {/* Bottom Slideshow Bar - Centered */}
            <div
              className="h-36 bg-[#1a0f2e] border border-gray-600 rounded-lg p-5 flex-shrink-0"
              style={{ width: "70vw", maxWidth: "1200px" }}
            >
              <div className="flex items-center justify-between h-full">
                {/* Slide Navigation */}
                <div className="flex items-center space-x-3 flex-1">
                  {/* Slide Thumbnails with Content Previews */}
                  {slides.map((slide, index) => (
                    <div
                      key={slide.id}
                      className={`w-32 h-18 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden ${index + 1 === currentSlide
                        ? "border-[#8356F3]"
                        : "border-gray-600 hover:border-gray-500"
                        }`}
                      style={(() => {
                        const currentItemId = getCurrentItemId();
                        const background =
                          getItemBackground(currentItemId);

                        if (
                          background.type === "image" ||
                          background.type === "video"
                        ) {
                          // Ensure URL is properly formatted with absolute path
                          let backgroundUrl = background.value;
                          if (
                            !backgroundUrl.startsWith("http") &&
                            !backgroundUrl.startsWith("data:")
                          ) {
                            backgroundUrl = `${window.location.origin}${backgroundUrl.startsWith("/") ? "" : "/"}${backgroundUrl}`;
                          }

                          return {
                            backgroundImage: `url("${backgroundUrl}")`,
                            backgroundSize: "cover",
                            backgroundPosition: "center",
                            backgroundRepeat: "no-repeat",
                            backgroundColor: "#000000",
                          };
                        }

                        return {
                          backgroundColor:
                            background.value || "#000000",
                        };
                      })()}
                      onClick={() => {
                        setCurrentSlide(index + 1);
                        setCurrentlyDisplayedSlide(slide);
                        // Clear Bible projection when navigating to slides
                        clearZustandProjection();
                        // Send slide change to live presentation if connected
                        if (liveWindow && !liveWindow.closed) {
                          const itemId =
                            slide.itemId || serviceItems[index]?.id;
                          const background = itemId
                            ? itemBackgrounds[itemId]
                            : null;
                          liveWindow.postMessage(
                            {
                              type: "GO_TO_SLIDE",
                              data: {
                                slideIndex: index,
                                background: background,
                                itemId: itemId,
                              },
                            },
                            window.location.origin,
                          );
                        }
                      }}
                      title={slide.title}
                    >
                      {/* Slide Number Badge */}
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
                        {index + 1}
                      </div>

                      {/* Content Preview */}
                      <div className="p-1.5 pt-5 h-full flex flex-col justify-center">
                        {slide.type === "verse" ||
                          slide.type === "chorus" ? (
                          <div className="text-center">
                            <div className="text-white text-xs font-semibold mb-1 leading-tight">
                              {slide.sectionLabel ||
                                (slide.type === "verse"
                                  ? "VERSE"
                                  : "CHORUS")}
                            </div>
                            <div
                              className="text-gray-300 text-xs leading-tight overflow-hidden"
                              style={{
                                fontSize: "8px",
                                fontFamily:
                                  editorState.styleFontFamily ||
                                  editorState.selectedFont ||
                                  "Lufgord",
                                color:
                                  editorState.styleColor || "#d1d5db",
                                fontWeight: editorState.isBold
                                  ? "bold"
                                  : "normal",
                                fontStyle: editorState.isItalic
                                  ? "italic"
                                  : "normal",
                                textDecoration:
                                  `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                                  "none",
                                textShadow:
                                  editorState.styleTextShadow || "",
                                letterSpacing:
                                  editorState.styleLetterSpacing || "",
                                textTransform:
                                  (editorState.styleTextTransform as any) ||
                                  "",
                              }}
                            >
                              {slide.content
                                ? typeof slide.content === "string"
                                  ? slide.content
                                    .split("\n")
                                    .slice(0, 1)
                                    .join("\n")
                                  : "Song lyrics"
                                : "No lyrics"}
                            </div>
                          </div>
                        ) : slide.type === "bible" ? (
                          <div className="text-center">
                            <div className="text-white text-xs font-semibold mb-1">
                              BIBLE
                            </div>
                            <div
                              className="text-gray-300 text-xs overflow-hidden"
                              style={{ fontSize: "8px" }}
                            >
                              {slide.title || "Scripture"}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-white text-xs font-semibold">
                              {slide.type.toUpperCase()}
                            </div>
                            <div
                              className="text-gray-300 text-xs overflow-hidden"
                              style={{ fontSize: "8px" }}
                            >
                              {slide.title || "Content"}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Type indicator */}
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${slide.type === "verse" ||
                          slide.type === "chorus"
                          ? "bg-blue-500"
                          : slide.type === "bible"
                            ? "bg-green-500"
                            : "bg-gray-500"
                          }`}
                      ></div>
                    </div>
                  ))}
                </div>

                {/* Slide Counter Only */}
                <div className="flex items-center ml-8">
                  <div className="text-gray-400 text-base font-medium">
                    {currentSlide} / {totalSlides}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Slideshow Bar - Only in Build Mode */}
        {isBuildMode && (
          <div
            className="h-64 bg-[#2a1f3d] border border-gray-600 rounded-lg p-6 relative overflow-hidden"
            style={{ minHeight: "256px", maxHeight: "256px" }}
          >
            {slides.length > 0 ? (
              /* Custom Horizontal Scroller Container */
              <div className="relative h-full">
                <div
                  id="slides-container"
                  className="flex items-start space-x-4 h-full overflow-x-auto overflow-y-hidden scroll-smooth pb-8"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                  onScroll={(e) => {
                    const container = e.currentTarget;
                    const maxScrollLeft =
                      container.scrollWidth - container.clientWidth;
                    const scrollPercentage =
                      maxScrollLeft > 0
                        ? (container.scrollLeft / maxScrollLeft) * 100
                        : 0;

                    // Update progress bar
                    const progressBar =
                      document.getElementById("scroll-progress");
                    if (progressBar) {
                      progressBar.style.width = `${Math.min(scrollPercentage, 100)}%`;
                    }
                  }}
                  onWheel={(e) => {
                    e.preventDefault();
                    const container = e.currentTarget;
                    const scrollAmount = e.deltaY * 2; // Adjust sensitivity
                    container.scrollLeft += scrollAmount;
                  }}
                >
                  {/* Slide Thumbnails with uniform background and external titles */}
                  {slides.map((slide, index) => {
                    // Group slides by content type and item to calculate item slide numbers
                    let itemSlideNumber = 1;
                    let totalItemSlides = 1;

                    if (
                      slide.type === "verse" ||
                      slide.type === "chorus"
                    ) {
                      // For songs, group by song name
                      const songName =
                        slide.songTitle || slide.title.split(" - ")[0];
                      const sameTypeSlides = slides.filter(
                        (s) =>
                          (s.type === "verse" || s.type === "chorus") &&
                          (s.songTitle || s.title.split(" - ")[0]) ===
                          songName,
                      );
                      itemSlideNumber =
                        sameTypeSlides.findIndex(
                          (s: any) => s.id === slide.id,
                        ) + 1;
                      totalItemSlides = sameTypeSlides.length;
                    } else if (slide.type === "bible") {
                      // For Bible verses, group by chapter
                      const bibleRef = slide.title.split(":")[0];
                      const bibleSameChapterSlides = slides.filter(
                        (s) =>
                          s.type === "bible" &&
                          s.title.split(":")[0] === bibleRef,
                      );
                      itemSlideNumber =
                        bibleSameChapterSlides.findIndex(
                          (s: any) => s.id === slide.id,
                        ) + 1;
                      totalItemSlides = bibleSameChapterSlides.length;
                    }

                    // Get item title (song name, bible reference, etc.)
                    const itemTitle =
                      slide.songTitle ||
                      slide.title.split(" - ")[0] ||
                      slide.title;

                    // Determine if this is the first slide of an item (should show title)
                    const isFirstSlideOfItem = itemSlideNumber === 1;

                    // Check if this item is selected (any slide of this item is the current slide)
                    let isItemSelected = false;
                    if (
                      slide.type === "verse" ||
                      slide.type === "chorus"
                    ) {
                      const songName =
                        slide.songTitle || slide.title.split(" - ")[0];
                      const sameItemSlides = slides.filter(
                        (s) =>
                          (s.type === "verse" || s.type === "chorus") &&
                          (s.songTitle || s.title.split(" - ")[0]) ===
                          songName,
                      );
                      isItemSelected = sameItemSlides.some(
                        (s) => slides.indexOf(s) + 1 === currentSlide,
                      );
                    } else if (slide.type === "bible") {
                      const bibleRef = slide.title.split(":")[0];
                      const sameItemSlides = slides.filter(
                        (s) =>
                          s.type === "bible" &&
                          s.title.split(":")[0] === bibleRef,
                      );
                      isItemSelected = sameItemSlides.some(
                        (s) => slides.indexOf(s) + 1 === currentSlide,
                      );
                    } else {
                      isItemSelected = index + 1 === currentSlide;
                    }

                    return (
                      <div
                        key={slide.id}
                        className="flex flex-col flex-shrink-0 relative"
                      >
                        {/* Selection background behind entire tile */}
                        {isItemSelected && (
                          <div className="absolute inset-0 -inset-x-2 -inset-y-2 rounded-lg shadow-lg shadow-purple-500/20 transition-all duration-200 z-0 bg-[#392A48]"></div>
                        )}
                        <div className="relative z-10">
                          {/* Title above thumbnail - only for first slide of each item */}
                          <div className="h-6 mb-2 flex items-end">
                            {isFirstSlideOfItem && (
                              <div className="text-white text-sm font-medium text-left">
                                {itemTitle}
                              </div>
                            )}
                          </div>
                          {/* Thumbnail Box - matching reference design exactly */}
                          <div
                            className="relative w-48 h-32 rounded-lg cursor-pointer transition-all overflow-hidden"
                            onClick={() =>
                              handleSlideClick(slide as any, index)
                            }
                            title={slide.title}
                            style={{
                              backgroundColor: "#2E2D39",
                              transition: "background-color 0.2s ease",
                            }}
                          >
                            {/* Slide Number Badge - Top Left Corner (black background) */}
                            <div className="absolute top-1 left-1 text-white text-xs px-1.5 py-0.5 font-bold z-10 rounded bg-[#000000]">
                              {index + 1}
                            </div>

                            {/* Item Slide Count - Bottom Right Corner (colored background) */}
                            <div
                              className={`absolute bottom-1 right-1 text-white text-xs px-1.5 py-0.5 font-bold z-10 rounded ${slide.type === "verse" ||
                                slide.type === "chorus"
                                ? "bg-purple-600"
                                : slide.type === "bible"
                                  ? "bg-cyan-600"
                                  : slide.type === "announcement" ||
                                    slide.title
                                      .toLowerCase()
                                      .includes("announcement")
                                    ? "bg-orange-600"
                                    : slide.type === "media" || slide.title
                                      .toLowerCase()
                                      .includes("video")
                                      ? "bg-pink-600"
                                      : "bg-gray-600"
                                }`}
                            >
                              {totalItemSlides > 1
                                ? itemSlideNumber
                                : "1"}
                            </div>

                            {/* Content Area - Exact spacing like reference image */}
                            <div
                              className="px-4 pt-8 pb-6 h-full relative bg-[#000000]"
                              style={(() => {
                                // Find the service item that contains this slide
                                const parentItem = serviceItems.find(
                                  (item) =>
                                    item.slides.some(
                                      (s: any) => s.id === slide.id,
                                    ),
                                );
                                if (parentItem) {
                                  const itemBackground =
                                    getItemBackground(parentItem.id);
                                  if (
                                    itemBackground.type === "image" ||
                                    itemBackground.type === "video"
                                  ) {
                                    // Ensure URL is properly formatted with absolute path
                                    let backgroundUrl =
                                      itemBackground.value;
                                    if (
                                      !backgroundUrl.startsWith(
                                        "http",
                                      ) &&
                                      !backgroundUrl.startsWith("data:")
                                    ) {
                                      // Convert relative path to absolute
                                      backgroundUrl = `${window.location.origin}${backgroundUrl.startsWith("/") ? "" : "/"}${backgroundUrl}`;
                                    }

                                    const styles = {
                                      backgroundImage: `url("${backgroundUrl}")`,
                                      backgroundSize: "cover",
                                      backgroundPosition: "center",
                                      backgroundRepeat: "no-repeat",
                                      backgroundColor: "#1a0f2e", // Dark purple fallback
                                    };
                                    console.log(
                                      "🎨 Applying slide thumbnail image background styles:",
                                      styles,
                                    );
                                    console.log(
                                      "🔗 Final thumbnail background URL:",
                                      backgroundUrl,
                                    );
                                    return styles;
                                  } else if (
                                    itemBackground.type ===
                                    "gradient" ||
                                    itemBackground.type === "fill"
                                  ) {
                                    return {
                                      backgroundColor:
                                        itemBackground.value,
                                    };
                                  }
                                }
                                return { backgroundColor: "#2E2D39" };
                              })()}
                            >
                              {/* Content Preview - Even smaller text for cleaner appearance */}
                              <div className="text-white text-[10px] leading-relaxed overflow-hidden">
                                {slide.type === "verse" ||
                                  slide.type === "chorus" ? (
                                  <div className="space-y-0">
                                    {slide.content ? (
                                      <div
                                        className="text-[10px] leading-tight"
                                        style={{
                                          fontFamily:
                                            editorState.styleFontFamily ||
                                            editorState.selectedFont ||
                                            "Lufgord",
                                          color:
                                            editorState.styleColor ||
                                            "#ffffff",
                                          fontWeight: editorState.isBold
                                            ? "bold"
                                            : "normal",
                                          fontStyle:
                                            editorState.isItalic
                                              ? "italic"
                                              : "normal",
                                          textDecoration:
                                            `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                                            "none",
                                          textShadow:
                                            editorState.styleTextShadow ||
                                            "",
                                          letterSpacing:
                                            editorState.styleLetterSpacing ||
                                            "",
                                          textTransform:
                                            (editorState.styleTextTransform as any) ||
                                            "",
                                        }}
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            typeof slide.content ===
                                              "string"
                                              ? slide.content
                                                .split("\n")
                                                .slice(0, 6)
                                                .join("<br/>")
                                              : (slide as any).content
                                                ?.content ||
                                              "Song lyrics",
                                        }}
                                      />
                                    ) : (
                                      <div className="text-[10px]">
                                        No lyrics available
                                      </div>
                                    )}
                                  </div>
                                ) : slide.type === "bible" ? (
                                  <div
                                    className="text-[10px] leading-tight"
                                    style={{
                                      fontFamily:
                                        editorState.styleFontFamily ||
                                        editorState.selectedFont ||
                                        "Lufgord",
                                      color:
                                        editorState.styleColor ||
                                        "#ffffff",
                                      fontWeight: editorState.isBold
                                        ? "bold"
                                        : "normal",
                                      fontStyle: editorState.isItalic
                                        ? "italic"
                                        : "normal",
                                      textDecoration:
                                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                                        "none",
                                      textShadow:
                                        editorState.styleTextShadow ||
                                        "",
                                      letterSpacing:
                                        editorState.styleLetterSpacing ||
                                        "",
                                      textTransform:
                                        (editorState.styleTextTransform as any) ||
                                        "",
                                    }}
                                    dangerouslySetInnerHTML={{
                                      __html: slide.content
                                        ? (
                                          slide.content.substring(
                                            0,
                                            180,
                                          ) +
                                          (slide.content.length > 180
                                            ? "..."
                                            : "")
                                        ).replace(/\n/g, "<br/>")
                                        : "Scripture text will appear here",
                                    }}
                                  />
                                ) : slide.type === "announcement" ? (
                                  <div className="space-y-0.5">
                                    <div
                                      className="text-[8px] font-bold text-orange-300 leading-tight"
                                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                                    >
                                      {slide.title || "Announcement"}
                                    </div>
                                    {(slide.eventDate || slide.eventTime || slide.location || slide.contact) && (
                                      <div className="flex items-center gap-1 flex-wrap">
                                        {(slide.eventDate || slide.eventTime) && (
                                          <span className="text-orange-200/60 text-[6px]">
                                            📅{slide.eventDate ? ` ${slide.eventDate}` : ""}{slide.eventTime ? ` ${slide.eventTime}` : ""}
                                          </span>
                                        )}
                                        {slide.location && (
                                          <span className="text-purple-200/60 text-[6px]">📍{slide.location}</span>
                                        )}
                                        {slide.contact && (
                                          <span className="text-blue-200/60 text-[6px]">📞{slide.contact}</span>
                                        )}
                                      </div>
                                    )}
                                    <div
                                      className="text-[7px] leading-tight text-white/80"
                                      style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
                                      dangerouslySetInnerHTML={{
                                        __html:
                                          typeof slide.content === "string"
                                            ? slide.content
                                              .split("\n")
                                              .slice(0, 3)
                                              .join("<br/>")
                                            : "Announcement content",
                                      }}
                                    />
                                  </div>
                                ) : slide.type === "media" ? (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    {(slide as any).subtype === "video" ? (
                                      <video
                                        src={typeof slide.content === 'string' && slide.content !== "Inspirational worship video" ? slide.content : ((slide as any).videoSettings?.url || undefined)}
                                        className={(slide as any).videoSettings?.displayMode === "center" ? "w-full h-full object-contain bg-black" : "w-full h-full object-cover"}
                                        preload="metadata"
                                        muted
                                        playsInline
                                      />
                                    ) : (
                                      <img
                                        src={typeof slide.content === 'string' && slide.content.length > 5 && slide.content !== "Worship background image" && slide.content !== "Inspirational worship video" ? slide.content : "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                                        alt={slide.title}
                                        className="relative z-10 w-full h-full object-contain bg-black"
                                      />
                                    )}
                                  </div>
                                ) : slide.type === "custom" &&
                                  slide.title
                                    .toLowerCase()
                                    .includes("video") ? (
                                  <div className="h-full flex flex-col justify-center items-center">
                                    <div className="text-2xl text-white/60 mb-1">
                                      ▶
                                    </div>
                                    <div className="text-[10px] text-gray-300">
                                      Video Content
                                    </div>
                                  </div>
                                ) : (
                                  <div className="space-y-0">
                                    {slide.content ? (
                                      <div
                                        className="text-[10px] leading-tight"
                                        style={{
                                          fontFamily:
                                            editorState.styleFontFamily ||
                                            editorState.selectedFont ||
                                            "Lufgord",
                                          color:
                                            editorState.styleColor ||
                                            "#ffffff",
                                          fontWeight: editorState.isBold
                                            ? "bold"
                                            : "normal",
                                          fontStyle:
                                            editorState.isItalic
                                              ? "italic"
                                              : "normal",
                                          textDecoration:
                                            `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                                            "none",
                                          textShadow:
                                            editorState.styleTextShadow ||
                                            "",
                                          letterSpacing:
                                            editorState.styleLetterSpacing ||
                                            "",
                                          textTransform:
                                            (editorState.styleTextTransform as any) ||
                                            "",
                                        }}
                                        dangerouslySetInnerHTML={{
                                          __html:
                                            typeof slide.content ===
                                              "string"
                                              ? slide.content
                                                .split("\n")
                                                .slice(0, 5)
                                                .join("<br/>")
                                              : slide.content
                                                ?.content ||
                                              "Song content",
                                        }}
                                      />
                                    ) : (
                                      <div className="text-[10px]">
                                        {slide.title}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {/* Custom Progress Bar */}
                <div className="absolute bottom-0 left-0 right-0 px-6 py-3">
                  <div className="h-1 bg-gray-600 rounded-full">
                    <div
                      id="scroll-progress"
                      className="h-1 bg-purple-500 rounded-full transition-all duration-300"
                      style={{ width: "30%" }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              /* Empty State - Following Design */
              <div className="relative h-full">
                <div className="flex items-center justify-start h-full pl-6">
                  {/* Dashed Border Rectangle with Plus Icon */}
                  <div className="border-2 border-dashed border-purple-400/60 rounded-lg p-8 flex flex-col items-center justify-center bg-purple-400/5 hover:bg-purple-400/10 transition-colors cursor-pointer min-w-32 min-h-20">
                    <div className="text-purple-400 mb-2">
                      <svg
                        className="w-8 h-8"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Text */}
                  <div className="ml-6">
                    <p className="text-gray-300 text-sm">
                      No slides added yet
                    </p>
                  </div>
                </div>
                {/* Progress Bar - Matching Design */}
                <div className="absolute bottom-0 left-0 right-0 px-6 py-3">
                  <div className="h-1 bg-gray-600 rounded-full">
                    <div
                      className="h-1 bg-gradient-to-r from-purple-600 to-purple-400 rounded-full transition-all duration-300"
                      style={{ width: "25%" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};
