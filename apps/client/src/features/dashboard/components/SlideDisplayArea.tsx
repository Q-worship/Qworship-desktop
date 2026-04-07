import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import qworshipLogo from "@/assets/logo.png";

interface SlideDisplayAreaProps {
  isBuildMode: boolean;
  editingContent: any;
  getItemBackground: (id: string) => any;
  selectedSlide: any;
  slides: any[];
  totalSlides: number;
  titleEditorState: any;
  showAuthorOnScreen: boolean;
  editorState: any;
  togglePreview: () => void;
  toggleHandsfreeBible: () => void;
  currentlyDisplayedSlide: any;
  serviceItems: any[];
  previousSlide: () => void;
  nextSlide: () => void;
  currentSlide: number;
  getCurrentItemId: () => string;
  setCurrentSlide: (index: number) => void;
  setCurrentlyDisplayedSlide: (slide: any) => void;
  clearZustandProjection: () => void;
  liveWindow: Window | null;
  itemBackgrounds: Record<string, any>;
}

export const SlideDisplayArea: React.FC<SlideDisplayAreaProps> = ({
  isBuildMode,
  editingContent,
  getItemBackground,
  selectedSlide,
  slides,
  totalSlides,
  titleEditorState,
  showAuthorOnScreen,
  editorState,
  togglePreview,
  toggleHandsfreeBible,
  currentlyDisplayedSlide,
  serviceItems,
  previousSlide,
  nextSlide,
  currentSlide,
  getCurrentItemId,
  setCurrentSlide,
  setCurrentlyDisplayedSlide,
  clearZustandProjection,
  liveWindow,
  itemBackgrounds,
}) => {
  return (
    <div
      className={`flex-1 flex items-center justify-center relative min-h-[500px] bg-[#000000] ${
        !isBuildMode
          ? "fixed inset-0 backdrop-blur-md bg-black/40 z-[999999] p-0 m-0"
          : ""
      }`}
      style={(() => {
        if (!isBuildMode) {
          return {
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            flexDirection: "column",
            justifyContent: "flex-start",
          };
        }
        // Apply the background of the currently editing item to the entire preview section
        if (editingContent) {
          const itemBackground = getItemBackground(editingContent.id);
          if (
            itemBackground.type === "image" ||
            itemBackground.type === "video"
          ) {
            let backgroundUrl = itemBackground.value;
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
              minHeight: "100%",
              width: "100%",
            };
          } else {
            return {
              backgroundColor: itemBackground.value || "#000000",
            };
          }
        }
        return { backgroundColor: "#000000" };
      })()}>
      {isBuildMode ? (
        // BUILD MODE Preview
        <>
          {selectedSlide ? (
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
                        fontFamily: titleEditorState.selectedFont || "Lufgord",
                        fontSize: titleEditorState.fontSize || "18px",
                        color: titleEditorState.textColor || "#ffffff",
                        textAlign:
                          (titleEditorState.textAlign as any) || "center",
                        fontWeight: titleEditorState.isBold ? "bold" : "normal",
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
                        textAlign: (editorState.textAlign as any) || "left",
                        fontWeight: editorState.isBold ? "bold" : "normal",
                        fontStyle: editorState.isItalic ? "italic" : "normal",
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
                ) : selectedSlide.slide.type === "media" ? (
                  <div className="absolute inset-0 w-full h-full">
                    {(selectedSlide.slide as any).subtype === "video" ? (
                      <video
                        src={selectedSlide.slide.content && selectedSlide.slide.content !== "Inspirational worship video" ? selectedSlide.slide.content : undefined}
                        autoPlay loop muted playsInline
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <img
                        src={typeof selectedSlide.slide.content === 'string' && selectedSlide.slide.content.length > 5 && selectedSlide.slide.content !== "Worship background image" ? selectedSlide.slide.content : "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                        alt={selectedSlide.slide.title || "Media slide"}
                        className="w-full h-full object-cover"
                      />
                    )}
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
                        textAlign: (editorState.textAlign as any) || "left",
                        fontWeight: editorState.isBold ? "bold" : "normal",
                        fontStyle: editorState.isItalic ? "italic" : "normal",
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
                {slides.findIndex((s) => s.id === selectedSlide.slide.id) + 1}{" "}
                of {totalSlides}
              </div>
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
        </>
      ) : (
        // PREVIEW MODE - Windowed Preview
        <>
          {/* Top Control Bar */}
          <div className="absolute top-2 left-6 right-6 flex items-center justify-between z-10 w-full px-6 py-4">
            {/* Back to Build Mode Button */}
            <button
              onClick={togglePreview}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors border border-white/20 hover:border-white/30">
              <ChevronLeftIcon className="w-4 h-4" />
              <span className="font-medium">Back to Build</span>
            </button>

            {/* Hands-Free Bible Button */}
            <button
              onClick={toggleHandsfreeBible}
              className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-lg flex items-center space-x-2 transition-colors border border-white/20 hover:border-white/30">
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
                const parentItem = serviceItems.find((item) =>
                  item.slides.some(
                    (s: any) => s.id === currentlyDisplayedSlide.id,
                  ),
                );
                if (parentItem) {
                  const itemBackground = getItemBackground(parentItem.id);
                  if (
                    itemBackground.type === "image" ||
                    itemBackground.type === "video"
                  ) {
                    let backgroundUrl = itemBackground.value;
                    if (
                      !backgroundUrl.startsWith("http") &&
                      !backgroundUrl.startsWith("data:")
                    ) {
                      backgroundUrl = `${window.location.origin}${backgroundUrl.startsWith("/") ? "" : "/"}${backgroundUrl}`;
                    }
                    return {
                      ...baseStyle,
                      backgroundImage: `url("${backgroundUrl}")`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      backgroundRepeat: "no-repeat",
                      backgroundColor: "#000000",
                    };
                  } else {
                    return {
                      ...baseStyle,
                      backgroundColor: itemBackground.value || "#000000",
                    };
                  }
                }
              }

              return { ...baseStyle, backgroundColor: "#000000" };
            })()}>
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                {currentlyDisplayedSlide ? (
                  currentlyDisplayedSlide.type === "media" ? (
                    <div className="absolute inset-0 w-full h-full">
                      {(currentlyDisplayedSlide as any).subtype === "video" ? (
                        <video
                          src={currentlyDisplayedSlide.content && currentlyDisplayedSlide.content !== "Inspirational worship video" ? currentlyDisplayedSlide.content : undefined}
                          autoPlay loop muted playsInline
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          src={typeof currentlyDisplayedSlide.content === 'string' && currentlyDisplayedSlide.content.length > 5 && currentlyDisplayedSlide.content !== "Worship background image" ? currentlyDisplayedSlide.content : "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?q=80&w=2673&auto=format&fit=crop"}
                          alt={currentlyDisplayedSlide.title || "Media slide"}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                  <div
                    className="text-white text-center max-w-4xl mx-auto px-8"
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      fontSize: "3rem",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      textAlign: (editorState.textAlign as any) || "center",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      lineHeight: "1.2",
                    }}>
                    {currentlyDisplayedSlide.content || "No content available"}
                  </div>
                  )
                ) : (
                  <>
                    <h1 className="text-white text-6xl font-bold mb-8">
                      Welcome to Service
                    </h1>
                    <p className="text-gray-300 text-2xl">
                      Sample presentation content
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Live Screen Controls Overlay */}
            <div className="absolute bottom-6 left-6">
              <div className="flex items-center space-x-4">
                <button
                  onClick={previousSlide}
                  disabled={currentSlide <= 1}
                  className="px-4 py-2 bg-black/70 hover:bg-black/90 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronLeftIcon className="w-4 h-4" />
                </button>
                <div className="text-white/80 text-sm font-medium bg-black/70 px-3 py-2 rounded-lg border border-gray-600">
                  Slide {currentSlide} of {totalSlides}
                </div>
                <button
                  onClick={nextSlide}
                  disabled={currentSlide >= totalSlides}
                  className="px-4 py-2 bg-black/70 hover:bg-black/90 text-white rounded-lg text-sm font-medium transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Slideshow Bar - Centered */}
          <div
            className="h-36 bg-[#1a0f2e] border border-gray-600 rounded-lg p-5 flex-shrink-0 mt-4 mx-auto"
            style={{ width: "70vw", maxWidth: "1200px" }}>
            <div className="flex items-center justify-between h-full">
              {/* Slide Navigation */}
              <div
                className="flex items-center space-x-3 flex-1 overflow-x-auto"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
                {slides.map((slide, index) => {
                  let itemSlideNumber = 1;
                  let totalItemSlides = 1;

                  if (slide.type === "verse" || slide.type === "chorus") {
                    const songName =
                      slide.songTitle || slide.title.split(" - ")[0];
                    const sameTypeSlides = slides.filter(
                      (s) =>
                        (s.type === "verse" || s.type === "chorus") &&
                        (s.songTitle || s.title.split(" - ")[0]) === songName,
                    );
                    itemSlideNumber =
                      sameTypeSlides.findIndex((s) => s.id === slide.id) + 1;
                    totalItemSlides = sameTypeSlides.length;
                  } else if (slide.type === "bible") {
                    const bibleRef = slide.title.split(":")[0];
                    const bibleSameChapterSlides = slides.filter(
                      (s) =>
                        s.type === "bible" &&
                        s.title.split(":")[0] === bibleRef,
                    );
                    itemSlideNumber =
                      bibleSameChapterSlides.findIndex(
                        (s) => s.id === slide.id,
                      ) + 1;
                    totalItemSlides = bibleSameChapterSlides.length;
                  }

                  return (
                    <div
                      key={slide.id}
                      className={`w-32 h-18 rounded-lg border-2 cursor-pointer transition-all relative overflow-hidden flex-shrink-0 ${
                        index + 1 === currentSlide
                          ? "border-[#8356F3]"
                          : "border-gray-600 hover:border-gray-500"
                      }`}
                      style={(() => {
                        const currentItemId = getCurrentItemId();
                        const background = getItemBackground(currentItemId);

                        if (
                          background.type === "image" ||
                          background.type === "video"
                        ) {
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
                          backgroundColor: background.value || "#000000",
                        };
                      })()}
                      onClick={() => {
                        setCurrentSlide(index + 1);
                        setCurrentlyDisplayedSlide(slide);
                        clearZustandProjection();
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
                      title={slide.title}>
                      <div className="absolute top-1 left-1 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded z-10">
                        {index + 1}
                      </div>
                      <div className="p-1.5 pt-5 h-full flex flex-col justify-center bg-black/40">
                        {slide.type === "verse" || slide.type === "chorus" ? (
                          <div className="text-center">
                            <div className="text-white text-xs font-semibold mb-1 leading-tight">
                              {slide.sectionLabel ||
                                (slide.type === "verse" ? "VERSE" : "CHORUS")}
                            </div>
                            <div
                              className="text-gray-300 text-xs leading-tight overflow-hidden text-ellipsis"
                              style={{
                                fontSize: "8px",
                                fontFamily:
                                  editorState.styleFontFamily ||
                                  editorState.selectedFont ||
                                  "Lufgord",
                                color: editorState.styleColor || "#d1d5db",
                              }}>
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
                              style={{ fontSize: "8px" }}>
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
                              style={{ fontSize: "8px" }}>
                              {slide.title || "Content"}
                            </div>
                          </div>
                        )}
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${slide.type === "verse" || slide.type === "chorus" ? "bg-blue-500" : slide.type === "bible" ? "bg-green-500" : "bg-gray-500"}`}></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center ml-8 flex-shrink-0">
                <div className="text-gray-400 text-base font-medium">
                  {currentSlide} / {totalSlides}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
