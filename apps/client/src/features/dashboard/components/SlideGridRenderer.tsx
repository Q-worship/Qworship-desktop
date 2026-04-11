import React from "react";
import { isWindowOpen } from "@/utils/windowUtils";

import { buildUrl, resolveMediaUrl } from "@/lib/queryClient";

export const SlideGridRenderer = (props: any) => {
  const { 
    currentSlide, setCurrentSlide, setCurrentlyDisplayedSlide, 
    slides, totalSlides, clearZustandProjection, liveWindow, 
    serviceItems, itemBackgrounds, editorState, getCurrentItemId, 
    getItemBackground, isBuildMode, handleSlideClick 
  } = props;
  
  return (
    <>
                    {/* Bottom Slideshow Bar - Centered */}
                    <div
                      className="h-36 bg-[#1a0f2e] border border-gray-600 rounded-lg p-5 flex-shrink-0"
                      style={{ width: "70vw", maxWidth: "1200px" }}
                    >
                      <div className="flex items-center justify-between h-full">
                        {/* Slide Navigation */}
                        <div className="flex items-center space-x-3 flex-1">
                          {/* Slide Thumbnails with Content Previews */}
                          {slides.map((slide: any, index: number) => (
                            <div
                              key={slide.id}
                              className={`w-32 h-18 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden ${
                                index + 1 === currentSlide
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
                                  // Ensure URL is properly resolved for media rendering
                                  const backgroundUrl = resolveMediaUrl(background.value) || background.value;

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
                                if (liveWindow && isWindowOpen(liveWindow)) {
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
                                    "*",
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
                                className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                                  slide.type === "verse" ||
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
                          {slides.map((slide: any, index: number) => {
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
                                (s: any) =>
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
                                (s: any) =>
                                  s.type === "bible" &&
                                  s.title.split(":")[0] === bibleRef,
                              );
                              itemSlideNumber =
                                bibleSameChapterSlides.findIndex(
                                  (s: any) => s.id === slide.id,
                                ) + 1;
                              totalItemSlides = bibleSameChapterSlides.length;
                            }

                            // Dynamically get live title from the updated service item to ensure edits reflect instantly
                            const liveItem = slide.itemId ? serviceItems.find((item: any) => item.id === slide.itemId) : null;
                            const itemTitle = liveItem ? liveItem.title : (slide.songTitle || slide.title.split(" - ")[0] || slide.title);

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
                                (s: any) =>
                                  (s.type === "verse" || s.type === "chorus") &&
                                  (s.songTitle || s.title.split(" - ")[0]) ===
                                    songName,
                              );
                              isItemSelected = sameItemSlides.some(
                                (s: any) => slides.indexOf(s) + 1 === currentSlide,
                              );
                            } else if (slide.type === "bible") {
                              const bibleRef = slide.title.split(":")[0];
                              const sameItemSlides = slides.filter(
                                (s: any) =>
                                  s.type === "bible" &&
                                  s.title.split(":")[0] === bibleRef,
                              );
                              isItemSelected = sameItemSlides.some(
                                (s: any) => slides.indexOf(s) + 1 === currentSlide,
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
                                      className={`absolute bottom-1 right-1 text-white text-xs px-1.5 py-0.5 font-bold z-10 rounded ${
                                        slide.type === "verse" ||
                                        slide.type === "chorus"
                                          ? "bg-purple-600"
                                          : slide.type === "bible"
                                            ? "bg-cyan-600"
                                            : slide.title
                                                  .toLowerCase()
                                                  .includes("announcement")
                                              ? "bg-orange-600"
                                              : slide.title
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
                                          (item: any) =>
                                            item.slides.some(
                                              (s: any) => s.id === slide.id,
                                            ),
                                        );
                                        if (parentItem) {
                                          const itemBackground =
                                            getItemBackground(parentItem.id);
                                          
                                          if (slide.type === "media" && slide.content) {
                                             let slideContentUrl = typeof slide.content === 'object' ? (slide.content as any).url : slide.content;
                                             if (slideContentUrl && typeof slideContentUrl === 'string') {
                                               slideContentUrl = resolveMediaUrl(slideContentUrl) || "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop";
                                               return {
                                                 backgroundImage: `url("${slideContentUrl}")`,
                                                 backgroundSize: "cover",
                                                 backgroundPosition: "center",
                                                 backgroundRepeat: "no-repeat",
                                                 backgroundColor: "#1a0f2e"
                                               };
                                             }
                                          }

                                          if (
                                            itemBackground.type === "image" ||
                                            itemBackground.type === "video"
                                          ) {
                                            // Ensure URL is properly resolved for media rendering
                                            const backgroundUrl = resolveMediaUrl(itemBackground.value) || itemBackground.value;

                                            return {
                                              backgroundImage: `url("${backgroundUrl}")`,
                                              backgroundSize: "cover",
                                              backgroundPosition: "center",
                                              backgroundRepeat: "no-repeat",
                                              backgroundColor: "#1a0f2e",
                                            };
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
                                        ) : (slide.type === "media" && (slide as any).subtype === "video") ? (
                                          <div className="h-full flex flex-col justify-center items-center z-20">
                                            <div className="text-2xl text-white/90 drop-shadow-lg mb-1">
                                              ▶
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
    </>
  );
};
