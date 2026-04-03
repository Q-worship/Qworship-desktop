import React, { useRef, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  LinkIcon,
  RedoIcon,
  UndoIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ServiceItem } from "@shared/schema";
import { Slide } from "@shared/types";
import { useWysiwygEditor } from "@/hooks/useWysiwygEditor";

// SlideEditorPanel Props Interface
export interface SlideEditorPanelProps {
  // State
  serviceItems: ServiceItem[];
  editingContent: ServiceItem | null;
  selectedSlide: { itemId: string; slide: Slide } | null;
  isSlideEditorOpen: boolean;
  songSearchTerm: string;
  currentSongTitle: string;
  showAuthorOnScreen: boolean;
  songArrangement: string[];
  parsedLyrics: Record<string, string>;
  hoveredArrangementButton: number | null;
  showListStyleDropdown: boolean;
  totalSlides: number;
  slides: Slide[];

  // Setters
  setServiceItems: React.Dispatch<React.SetStateAction<ServiceItem[]>>;
  setEditingContent: React.Dispatch<React.SetStateAction<ServiceItem | null>>;
  setSelectedSlide: React.Dispatch<
    React.SetStateAction<{ itemId: string; slide: Slide } | null>
  >;
  setIsSlideEditorOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setSongSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  setCurrentSongTitle: React.Dispatch<React.SetStateAction<string>>;
  setShowAuthorOnScreen: React.Dispatch<React.SetStateAction<boolean>>;
  setSongArrangement: React.Dispatch<React.SetStateAction<string[]>>;
  setParsedLyrics: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setHoveredArrangementButton: React.Dispatch<
    React.SetStateAction<number | null>
  >;
  setShowListStyleDropdown: React.Dispatch<React.SetStateAction<boolean>>;
  setSongEditorContent: React.Dispatch<React.SetStateAction<string>>;

  // Functions
  handleBrowseSongs: () => void;
  updateItemContent: (
    itemId: string,
    title?: string,
    content?: any,
    slides?: Slide[],
  ) => void;
  createSlidesFromSong: (song: any) => Slide[];
  getItemBackground: (itemId: string) => {
    type: "color" | "image" | "video";
    value: string;
  };
}

export const SlideEditorPanel: React.FC<SlideEditorPanelProps> = ({
  serviceItems,
  editingContent,
  selectedSlide,
  isSlideEditorOpen,
  songSearchTerm,
  currentSongTitle,
  showAuthorOnScreen,
  songArrangement,
  parsedLyrics,
  hoveredArrangementButton,
  showListStyleDropdown,
  totalSlides,
  slides,
  setServiceItems,
  setEditingContent,
  setSelectedSlide,
  setIsSlideEditorOpen,
  setSongSearchTerm,
  setCurrentSongTitle,
  setShowAuthorOnScreen,
  setSongArrangement,
  setParsedLyrics,
  setHoveredArrangementButton,
  setShowListStyleDropdown,
  setSongEditorContent,
  handleBrowseSongs,
  updateItemContent,
  createSlidesFromSong,
  getItemBackground,
}) => {
  // WYSIWYG Editor Hook
  const {
    editorState,
    setEditorState,
    titleEditorState,
    activeTextarea,
    setActiveTextarea,
    applyFormatting,
    applyFontFamily,
    applyStylesToTextarea,
    handleUndo,
    handleRedo,
    handleStylesClick,
    insertTextAtCursor,
    stylesButtonRef,
    listDropdownRef,
    titleTextAreaRef,
    textAreaRef,
  } = useWysiwygEditor({
    onContentChange: (content) => setSongEditorContent(content),
    onUndoRedo: (content) => setSongEditorContent(content),
  });

  if (!isSlideEditorOpen) return null;

  return (
    <div className="absolute top-0 right-0 bottom-0 w-[45%] bg-[#1E1E1E] border-l border-gray-600 shadow-2xl flex flex-col z-40 transform transition-transform duration-300 translate-x-0">
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Slide Editor Header */}
        <div className="p-4 border-b border-gray-600 flex justify-between items-center bg-[#2a1f3d]">
          <h3 className="text-white font-semibold text-lg flex items-center">
            {editingContent?.type === "song" ? (
              <>
                <span className="w-8 h-8 rounded-full bg-[#8356F3]/20 flex items-center justify-center mr-3">
                  <span className="text-[#8356F3] text-sm font-bold">♫</span>
                </span>
                Song Editor
              </>
            ) : editingContent?.type === "bible" ? (
              <>
                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <span className="text-blue-400 text-sm font-bold">B</span>
                </span>
                Bible Slide Settings
              </>
            ) : selectedSlide?.slide.type === "verse" ||
              selectedSlide?.slide.type === "chorus" ? (
              <>
                <span className="w-8 h-8 rounded-full bg-[#8356F3]/20 flex items-center justify-center mr-3">
                  <span className="text-[#8356F3] text-sm font-bold">♫</span>
                </span>
                Edit Song Slide
              </>
            ) : selectedSlide?.slide.type === "bible" ? (
              <>
                <span className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                  <span className="text-blue-400 text-sm font-bold">B</span>
                </span>
                Bible Slide Preview
              </>
            ) : (
              "Edit Slide"
            )}
            {editingContent && (
              <span className="ml-3 text-sm text-gray-400 font-normal truncate max-w-[200px]">
                {editingContent.title}
              </span>
            )}
          </h3>
          <button
            onClick={() => {
              setIsSlideEditorOpen(false);
              setSelectedSlide(null);
            }}
            className="text-gray-400 hover:text-white transition-colors p-2 rounded-full hover:bg-white/10">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Slide Editor Content Area */}
        <div className="flex-1 overflow-y-auto w-full max-w-full">
          {selectedSlide ? (
            /* Selected Slide Edit/Preview View */
            <div className="flex flex-col md:flex-row h-full">
              {/* Left Section - Controls */}
              <div className="w-[300px] border-r border-gray-600 bg-[#1a0f2e] p-6 flex flex-col min-h-full">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-6">
                    {selectedSlide.slide.type === "bible"
                      ? "Bible Preview"
                      : "Slide Details"}
                  </h4>

                  {selectedSlide.slide.type === "verse" ||
                  selectedSlide.slide.type === "chorus" ? (
                    /* Song Slide Editor - Just shows info, editing done in Song Editor 2 */
                    <div className="space-y-6">
                      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4">
                        <h5 className="text-purple-300 font-medium mb-2">
                          Song Slide
                        </h5>
                        <p className="text-sm text-gray-300 mb-3">
                          You are viewing a slide generated from the song "
                          {selectedSlide.slide.songTitle}".
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-400">
                          <span className="bg-[#2a1f3d] px-2 py-1 rounded">
                            {selectedSlide.slide.sectionLabel || "Section"}
                          </span>
                        </div>
                      </div>

                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <p className="text-sm text-blue-300">
                          💡 To edit the text, font, or layout of this song,
                          click the "Back to Build" button and use the main Song
                          Editor.
                        </p>
                      </div>

                      <div className="border-t border-gray-600 pt-4 mt-6">
                        <h5 className="text-white font-medium mb-3">
                          Quick Actions
                        </h5>
                        <Button
                          className="w-full bg-[#2a1f3d] hover:bg-[#3a2f4d] text-white border border-gray-600 mb-2"
                          onClick={() => {
                            setSelectedSlide(null);
                            const parentItem = serviceItems.find(
                              (item) =>
                                String(item.id) ===
                                String(selectedSlide.itemId),
                            );
                            if (parentItem) {
                              setEditingContent(parentItem);
                            }
                          }}>
                          Edit Full Song
                        </Button>
                      </div>
                    </div>
                  ) : selectedSlide.slide.type === "bible" ? (
                    /* Bible Slide Preview Settings */
                    <div className="space-y-6">
                      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                        <h5 className="text-blue-300 font-medium mb-2">
                          Bible Mode
                        </h5>
                        <p className="text-sm text-gray-300">
                          You are viewing a generated Bible slide. The text is
                          read-only to preserve biblical accuracy.
                        </p>
                      </div>

                      <div>
                        <label className="text-white font-medium block mb-2 text-sm">
                          Slide Preview
                        </label>
                        <div className="w-full h-48 bg-black border border-gray-600 rounded-lg relative overflow-hidden">
                          {/* Background with Q-worship styling */}
                          <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 to-blue-900/20"></div>

                          {/* Content overlay */}
                          <div className="relative h-full flex flex-col justify-center items-center p-4">
                            {(() => {
                              const parentItem = serviceItems.find(
                                (item) =>
                                  String(item.id) ===
                                  String(selectedSlide.itemId),
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
                                  {/* Scripture Reference at top */}
                                  {showReference && (
                                    <div className="text-purple-300 text-xs font-medium mb-2 text-center">
                                      {reference}
                                    </div>
                                  )}

                                  {/* Main verse content */}
                                  <div className="text-white text-sm text-center leading-relaxed flex-1 flex items-center justify-center px-2">
                                    <div className="max-w-full">
                                      {selectedSlide.slide.content ||
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
                                          : bibleVersion === "NKJV"
                                            ? "New King James Version"
                                            : bibleVersion === "ESV"
                                              ? "English Standard Version"
                                              : bibleVersion === "AMP"
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
                          This preview reflects your current Bible Display
                          Settings from the main editor.
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
                                const parentItem = serviceItems.find(
                                  (item) =>
                                    String(item.id) ===
                                    String(selectedSlide.itemId),
                                );
                                const version =
                                  selectedSlide.slide.bibleVersion ||
                                  parentItem?.content?.version ||
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
                                const parentItem = serviceItems.find(
                                  (item) =>
                                    String(item.id) ===
                                    String(selectedSlide.itemId),
                                );
                                const referenceDisplay =
                                  parentItem?.content?.referenceDisplay ||
                                  "every-slide";
                                return referenceDisplay === "every-slide"
                                  ? "Every Slide"
                                  : referenceDisplay === "first-slide"
                                    ? "First Slide Only"
                                    : referenceDisplay === "last-slide"
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
                                const parentItem = serviceItems.find(
                                  (item) =>
                                    String(item.id) ===
                                    String(selectedSlide.itemId),
                                );
                                const versionDisplay =
                                  parentItem?.content?.versionDisplay ||
                                  "every-slide";
                                return versionDisplay === "every-slide"
                                  ? "Every Slide"
                                  : versionDisplay === "first-slide"
                                    ? "First Slide Only"
                                    : versionDisplay === "last-slide"
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
                                const parentItem = serviceItems.find(
                                  (item) =>
                                    String(item.id) ===
                                    String(selectedSlide.itemId),
                                );
                                return parentItem?.content?.includeVerseNumbers
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
                                const parentItem = serviceItems.find(
                                  (item) =>
                                    String(item.id) ===
                                    String(selectedSlide.itemId),
                                );
                                return parentItem?.content?.oneVersePerSlide
                                  ? "Yes"
                                  : "No";
                              })()}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
                          <p className="text-blue-300 text-xs">
                            💡 To change these settings including Bible version,
                            edit them in the main On-screen Bible Editor.
                            Changes there will automatically apply to all verse
                            slides.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Non-Bible Slide Editor - Original functionality */
                    <>
                      <div>
                        <label className="text-white font-medium block mb-2">
                          Slide Title
                        </label>
                        <Input
                          value={selectedSlide.slide.title}
                          onChange={(e) => {
                            // Update slide title functionality would go here
                            console.log("Update slide title:", e.target.value);
                          }}
                          className="bg-[#2a1f3d] border-gray-600 text-white"
                          placeholder="Enter slide title..."
                        />
                      </div>

                      <div>
                        <label className="text-white font-medium block mb-2">
                          Slide Content
                        </label>
                        <textarea
                          value={selectedSlide.slide.content}
                          onChange={(e) => {
                            // Update slide content functionality would go here
                            console.log(
                              "Update slide content:",
                              e.target.value,
                            );
                          }}
                          className="w-full h-64 p-3 bg-[#2a1f3d] border border-gray-600 rounded-lg text-white resize-none"
                          placeholder="Enter slide content..."
                        />
                      </div>

                      {/* Slide Settings */}
                      <div className="border-t border-gray-600 pt-4 mt-6">
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
                            <span className="text-gray-300">Text Size</span>
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
                  <div className="flex space-x-3 pt-4 mt-6">
                    <Button
                      className="bg-[#8356F3] hover:bg-[#7C4DFF] text-white"
                      onClick={() => {
                        if (selectedSlide.slide.type === "bible") {
                          // For Bible slides, switch to main Bible editor
                          const parentItem = serviceItems.find(
                            (item) =>
                              String(item.id) === String(selectedSlide.itemId),
                          );
                          if (parentItem) {
                            setEditingContent(parentItem);
                            setSelectedSlide(null);
                            setIsSlideEditorOpen(false);
                            // Assuming toast is available globally or passed as prop.
                            // Since it's from a UI component, in a real scenario you'd pass it or use a hook here.
                            // For now, I will omit the toast locally or assume the user will see the UX change.
                            console.log("Switched to Bible Editor");
                          }
                        } else {
                          // Save changes for non-Bible slides
                          console.log("Save changes for non-Bible slide");
                        }
                      }}>
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
                      }}>
                      Close
                    </Button>
                    {selectedSlide.slide.type !== "bible" && (
                      <Button
                        variant="outline"
                        className="border-red-600 text-red-400 hover:text-red-300">
                        Delete Slide
                      </Button>
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
                    const itemBackground = getItemBackground(editingContent.id);
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
                        backgroundColor: itemBackground.value || "#000000",
                      };
                    }
                  }
                  return { backgroundColor: "#000000" };
                })()}>
                {/* Show Selected Slide Content */}
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
                              titleEditorState.selectedFont || "Lufgord",
                            fontSize: titleEditorState.fontSize || "18px",
                            color: titleEditorState.textColor || "#ffffff",
                            textAlign:
                              (titleEditorState.textAlign as any) || "center",
                            fontWeight: titleEditorState.isBold
                              ? "bold"
                              : "normal",
                            fontStyle: titleEditorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                              "none",
                          }}>
                          {selectedSlide.slide.songTitle ||
                            selectedSlide.slide.title}
                        </h1>
                        {/* Show author's name when enabled */}
                        {showAuthorOnScreen &&
                          editingContent?.content?.authors &&
                          editingContent.content.authors.length > 0 && (
                            <div className="text-gray-400 text-base font-medium mb-2">
                              By: {editingContent.content.authors.join(", ")}
                            </div>
                          )}
                        <div className="text-purple-400 text-lg font-medium mb-4">
                          {selectedSlide.slide.sectionLabel ||
                            (selectedSlide.slide.type === "verse"
                              ? "VERSE"
                              : "CHORUS")}
                        </div>
                        <div
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
                            textAlign: (editorState.textAlign as any) || "left",
                            fontWeight: editorState.isBold ? "bold" : "normal",
                            fontStyle: editorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                              "none",
                            textShadow: editorState.styleTextShadow || "",
                            letterSpacing: editorState.styleLetterSpacing || "",
                            textTransform:
                              (editorState.styleTextTransform as any) || "",
                          }}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedSlide.slide.content.replace(
                                /\n/g,
                                "<br/>",
                              ),
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <>
                        <h1 className="text-white text-4xl font-bold mb-4">
                          {selectedSlide.slide.title}
                        </h1>
                        <div
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
                            textAlign: (editorState.textAlign as any) || "left",
                            fontWeight: editorState.isBold ? "bold" : "normal",
                            fontStyle: editorState.isItalic
                              ? "italic"
                              : "normal",
                            textDecoration:
                              `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                              "none",
                            textShadow: editorState.styleTextShadow || "",
                            letterSpacing: editorState.styleLetterSpacing || "",
                            textTransform:
                              (editorState.styleTextTransform as any) || "",
                          }}>
                          <div
                            dangerouslySetInnerHTML={{
                              __html: selectedSlide.slide.content.replace(
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
                    {slides.findIndex((s) => s.id === selectedSlide.slide.id) +
                      1}{" "}
                    of {totalSlides}
                  </div>
                </div>
              </div>
            </div>
          ) : editingContent?.type === "song" ? (
            /* Song Editor */
            <div className="h-full flex flex-col bg-[#4a3a6b]">
              {/* Song Editor Rich Text Editor Toolbar */}
              <div className="bg-[#2d1f4a] border-b border-gray-600">
                <div className="px-4 py-2 border-b border-gray-600">
                  <span className="text-white text-sm font-medium">
                    Slides (Lyrics)
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 px-4 py-2 overflow-x-auto">
                  {/* Undo/Redo */}
                  <div className="flex items-center">
                    <button
                      className={`p-1.5 rounded transition-colors ${editorState.canUndo ? "text-white hover:bg-white/10" : "text-gray-500 cursor-not-allowed"}`}
                      disabled={!editorState.canUndo}
                      onClick={handleUndo}
                      title="Undo (Ctrl+Z)">
                      <UndoIcon className="w-4 h-4" />
                    </button>
                    <button
                      className={`p-1.5 rounded transition-colors ${editorState.canRedo ? "text-white hover:bg-white/10" : "text-gray-500 cursor-not-allowed"}`}
                      disabled={!editorState.canRedo}
                      onClick={handleRedo}
                      title="Redo (Ctrl+Y)">
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
                      setEditorState((prev) => ({
                        ...prev,
                        selectedFont: newFont,
                      }));
                      applyFontFamily(newFont);
                    }}
                    title="Font Family">
                    <option className="bg-[#2d1f4a]" value="Lufgord">
                      Lufgord
                    </option>
                    <option className="bg-[#2d1f4a]" value="Arial">
                      Arial
                    </option>
                    <option className="bg-[#2d1f4a]" value="Helvetica">
                      Helvetica
                    </option>
                    <option className="bg-[#2d1f4a]" value="Times New Roman">
                      Times New Roman
                    </option>
                  </select>

                  <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                  {/* Visual Styles Dropdown */}
                  <div className="relative styles-dropdown">
                    <button
                      ref={stylesButtonRef}
                      onClick={handleStylesClick}
                      className="bg-transparent text-white text-sm border border-gray-500 rounded focus:border-gray-400 outline-none w-[120px] flex-shrink-0 box-border flex items-center justify-between"
                      title="Visual Style Presets">
                      <span>
                        {(activeTextarea?.getAttribute("data-title-field") ===
                        "true"
                          ? titleEditorState.selectedStyle
                          : editorState.selectedStyle) || "Styles"}
                      </span>
                      <ChevronDownIcon className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="h-5 w-px bg-gray-500 hidden sm:block"></div>

                  {/* Text Formatting - B, I, U, S */}
                  <div className="flex items-center">
                    <button
                      className={`p-1.5 rounded font-bold text-sm transition-colors ${
                        (
                          activeTextarea?.getAttribute("data-title-field") ===
                          "true"
                            ? titleEditorState.isBold
                            : editorState.isBold
                        )
                          ? "bg-white/20 text-white"
                          : "text-white hover:bg-white/10"
                      }`}
                      onClick={() => applyFormatting("bold")}
                      title="Bold (Ctrl+B)">
                      B
                    </button>
                    <button
                      className={`p-1.5 rounded italic text-sm transition-colors ${
                        (
                          activeTextarea?.getAttribute("data-title-field") ===
                          "true"
                            ? titleEditorState.isItalic
                            : editorState.isItalic
                        )
                          ? "bg-white/20 text-white"
                          : "text-white hover:bg-white/10"
                      }`}
                      onClick={() => applyFormatting("italic")}
                      title="Italic (Ctrl+I)">
                      I
                    </button>
                    <button
                      className={`p-1.5 rounded underline text-sm transition-colors ${
                        (
                          activeTextarea?.getAttribute("data-title-field") ===
                          "true"
                            ? titleEditorState.isUnderline
                            : editorState.isUnderline
                        )
                          ? "bg-white/20 text-white"
                          : "text-white hover:bg-white/10"
                      }`}
                      onClick={() => applyFormatting("underline")}
                      title="Underline (Ctrl+U)">
                      U
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-6 overflow-y-auto">
                {editingContent?.content &&
                Object.keys(parsedLyrics).length > 0 ? (
                  /* Enhanced Lyrics Editor */
                  <div className="relative h-full">
                    <div
                      className="space-y-6 overflow-y-auto scroll-smooth pr-4"
                      style={{ maxHeight: "480px" }}>
                      {/* Song Title Display */}
                      <div className="text-center">
                        <h2
                          className="text-2xl font-bold text-white mb-2"
                          style={{
                            fontFamily:
                              titleEditorState.selectedFont || "Lufgord",
                            fontSize: titleEditorState.fontSize || "24px",
                            color: titleEditorState.textColor || "#ffffff",
                          }}>
                          {currentSongTitle || editingContent.title}
                        </h2>
                      </div>

                      {/* Main Arrangement Section */}
                      <div className="bg-[#2a1f3d] rounded-xl border border-gray-600 p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">
                          Main Arrangement
                        </h3>

                        {/* On Screen Title */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-white text-sm font-medium mb-2">
                              On screen Title
                            </label>
                            <input
                              type="text"
                              value={currentSongTitle}
                              onChange={(e) => {
                                setCurrentSongTitle(e.target.value);
                                if (editingContent) {
                                  updateItemContent(
                                    String(editingContent.id),
                                    e.target.value || "Song",
                                    editingContent.content,
                                  );
                                }
                              }}
                              className="w-full bg-[#1a0f2e] border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-[#8356F3] outline-none"
                              placeholder="Enter song title"
                            />
                          </div>

                          {/* Song Arrangement (Simplified drag/drop in visual) */}
                          <div>
                            <label className="block text-white text-sm font-medium mb-3">
                              Song Arrangement
                            </label>
                            <div className="flex items-center space-x-2 bg-[#1a0f2e] rounded-lg p-3 border border-gray-600 overflow-x-auto">
                              {songArrangement.map((section, index) => (
                                <div
                                  key={index}
                                  className="flex items-center flex-shrink-0">
                                  <button className="bg-[#8356F3] text-white px-4 py-2 rounded-lg text-sm font-medium">
                                    {section}
                                  </button>
                                  {index < songArrangement.length - 1 && (
                                    <ChevronRightIcon className="w-4 h-4 text-gray-400 mx-1" />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Individual Verse Sections - WYSIWYG Editing */}
                      <div className="space-y-4">
                        {songArrangement.map((arrangementSection, index) => {
                          const lyricEntry = Object.entries(parsedLyrics).find(
                            ([sectionName]) =>
                              sectionName
                                .toLowerCase()
                                .includes(arrangementSection.toLowerCase()),
                          );

                          if (!lyricEntry) return null;

                          const [sectionName, lyrics] = lyricEntry;
                          return (
                            <div
                              key={sectionName}
                              className="bg-[#1a0f2e] rounded-xl border border-gray-600 p-6">
                              <h4 className="text-lg font-semibold text-white mb-4">
                                {sectionName}
                              </h4>
                              <div className="bg-[#0f0624] rounded-lg border border-gray-700 p-4">
                                <textarea
                                  value={lyrics}
                                  onChange={(e) => {
                                    const newLyrics = e.target.value;
                                    setParsedLyrics((prev) => ({
                                      ...prev,
                                      [sectionName]: newLyrics,
                                    }));

                                    // Normally you would rebuild full text and update editor content here
                                    const fullText = Object.entries({
                                      ...parsedLyrics,
                                      [sectionName]: newLyrics,
                                    })
                                      .map(([s, t]) => `[${s}]\n${t}`)
                                      .join("\n\n");
                                    setSongEditorContent(fullText);
                                  }}
                                  className="w-full min-h-32 text-gray-200 bg-transparent border-none outline-none resize-none"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Initial state when no song content is parsed */
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400">Loading song data...</p>
                  </div>
                )}
              </div>
            </div>
          ) : editingContent?.type === "bible" ? (
            <div className="w-full h-full p-6 flex flex-col space-y-4">
              {/* Bible content simplified preview for panel */}
              <h2 className="text-2xl font-bold text-white text-center">
                {editingContent.title}
              </h2>
              <div className="bg-[#2a1f3d] p-4 rounded-xl">
                <p className="text-gray-300">
                  Bible preview settings for this presentation are active.
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
