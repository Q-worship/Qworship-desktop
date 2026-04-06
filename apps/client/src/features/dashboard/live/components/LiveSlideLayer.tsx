import React from "react";
import { useLivePresentationState } from "../useLivePresentationState";

export const LiveSlideLayer: React.FC<ReturnType<typeof useLivePresentationState>> = (props) => {
  const {
    contentFixedArea,
    currentSongProjection,
    activeMode,
    projectionType,
    slidesTransparent,
    getSlideTransitionClass,
    slideAlignment,
    getTextSizeClass,
    editorState,
    liveProjection,
    getSlideStyle,
    slides,
    currentSlide,
    animationKey,
    titleEditorState,
    totalSlides,
    pacingLineIdx
  } = props;

  return (
    <div
          className={`text-center max-w-6xl relative ${contentFixedArea ? "h-[85vh] max-h-[85vh] flex flex-col justify-center overflow-hidden" : ""}`}>
          {/* Content is conditionally rendered based on activeMode from display mode store */}
          {/* Song/Bible Projection - only show when mode matches */}
          {currentSongProjection &&
          ((activeMode === "song" && projectionType === "song") ||
            (activeMode === "hfb-bible" && projectionType === "bible") ||
            (activeMode === "on-screen-bible" &&
              projectionType === "bible")) ? (
            /* Live Song/Bible Projection for Congregation */
            <div
              key={`song-projection-${animationKey}`}
              className={`${slidesTransparent ? "" : "bg-black/60 backdrop-blur-sm"} rounded-2xl p-12 ${slidesTransparent ? "" : "border border-white/10 shadow-2xl"} ${getSlideTransitionClass()} ${contentFixedArea ? "max-h-[75vh] overflow-hidden flex flex-col justify-center" : ""}`}
              style={
                slidesTransparent
                  ? { backgroundColor: "transparent", backgroundImage: "none" }
                  : {}
              }>
              {/* Title and section - for songs, show section below title; for Bible, show only title */}
              <div className="mb-6" style={{ textAlign: slideAlignment }}>
                <h2
                  className={`text-white mb-2 font-bold ${getTextSizeClass()}`}>
                  {currentSongProjection.title}
                </h2>
                {projectionType !== "bible" && (
                  <h3
                    className={`text-blue-300 font-medium ${getTextSizeClass()}`}>
                    {currentSongProjection.sectionTitle}
                  </h3>
                )}
              </div>
              {/* Content text (lyrics or scripture) */}
              <div
                className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                style={{
                  fontFamily:
                    editorState.styleFontFamily ||
                    editorState.selectedFont ||
                    "Lufgord",
                  color:
                    editorState.styleColor ||
                    editorState.textColor ||
                    "#ffffff",
                  fontWeight: editorState.isBold ? "bold" : "normal",
                  fontStyle: editorState.isItalic ? "italic" : "normal",
                  textDecoration:
                    `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                    "none",
                  textShadow: editorState.styleTextShadow || "",
                  letterSpacing: editorState.styleLetterSpacing || "",
                  textTransform: (editorState.styleTextTransform as any) || "",
                  textAlign: slideAlignment,
                }}>
                {projectionType === "song" && pacingLineIdx >= 0 ? (
                  currentSongProjection.lyrics.split("\n").map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      style={{
                        color: line.trim() === ""
                          ? "transparent"
                          : lineIdx <= pacingLineIdx
                            ? "#fbbf24" // Amber highlight color
                            : (editorState.styleColor || editorState.textColor || "#ffffff"),
                        minHeight: "1.2em",
                        transition: "color 0.15s ease",
                      }}
                    >
                      {line || "\u00A0"}
                    </div>
                  ))
                ) : (
                  currentSongProjection.lyrics
                )}
              </div>
              {/* For Bible projections, show version below the scripture text */}
              {projectionType === "bible" &&
                currentSongProjection.sectionTitle && (
                  <div className="mt-6" style={{ textAlign: slideAlignment }}>
                    <span
                      className={`text-blue-300 font-medium ${getTextSizeClass()}`}>
                      {currentSongProjection.sectionTitle}
                    </span>
                  </div>
                )}
            </div>
          ) : liveProjection &&
            (activeMode === "hfb-bible" || activeMode === "on-screen-bible") ? (
            /* Live Scripture Projection for Congregation - only when Bible mode is active */
            <div
              key={`scripture-projection-${animationKey}`}
              className={`${slidesTransparent ? "" : "bg-black/40 backdrop-blur-sm"} rounded-3xl p-16 ${slidesTransparent ? "" : "border border-white/20 shadow-2xl"} ${getSlideTransitionClass()} ${contentFixedArea ? "max-h-[75vh] overflow-hidden flex flex-col justify-center" : ""}`}
              style={getSlideStyle()}>
              <div
                className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                style={{
                  fontFamily:
                    editorState.styleFontFamily ||
                    editorState.selectedFont ||
                    "Lufgord",
                  color:
                    editorState.styleColor ||
                    editorState.textColor ||
                    "#ffffff",
                  fontWeight: editorState.isBold ? "bold" : "normal",
                  fontStyle: editorState.isItalic ? "italic" : "normal",
                  textDecoration:
                    `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                    "none",
                  textShadow: editorState.styleTextShadow || "",
                  letterSpacing: editorState.styleLetterSpacing || "",
                  textTransform: (editorState.styleTextTransform as any) || "",
                  textAlign: slideAlignment,
                }}>
                {liveProjection}
              </div>
            </div>
          ) : slides.length > 0 &&
            slides[currentSlide - 1] &&
            activeMode === "slides" ? (
            /* Display Current Slide from Dashboard - only when activeMode is 'slides' */
            <div
              key={`slide-${currentSlide}-${animationKey}`}
              className={`${slidesTransparent ? "" : "bg-black/40 backdrop-blur-sm"} rounded-3xl p-16 ${slidesTransparent ? "" : "border border-white/20 shadow-2xl"} ${getSlideTransitionClass()} ${contentFixedArea ? "max-h-[75vh] overflow-hidden flex flex-col justify-center" : ""}`}>
              {slides[currentSlide - 1].type === "verse" ||
              slides[currentSlide - 1].type === "chorus" ? (
                <>
                  <h1
                    className={`text-white mb-6 ${getTextSizeClass()}`}
                    style={{
                      fontFamily: titleEditorState.selectedFont || "Lufgord",
                      color: titleEditorState.textColor || "#ffffff",
                      textAlign: slideAlignment,
                      fontWeight: titleEditorState.isBold ? "bold" : "normal",
                      fontStyle: titleEditorState.isItalic
                        ? "italic"
                        : "normal",
                      textDecoration:
                        `${titleEditorState.isUnderline ? "underline" : ""} ${titleEditorState.isStrikethrough ? "line-through" : ""}`.trim() ||
                        "none",
                    }}>
                    {slides[currentSlide - 1].songTitle ||
                      slides[currentSlide - 1].title}
                  </h1>
                  <div
                    className={`text-purple-400 font-medium mb-6 ${getTextSizeClass()}`}
                    style={{ textAlign: slideAlignment }}>
                    {slides[currentSlide - 1].sectionLabel ||
                      (slides[currentSlide - 1].type === "verse"
                        ? "VERSE"
                        : "CHORUS")}
                  </div>
                  <div
                    className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      textAlign: slideAlignment,
                      ...(contentFixedArea && {
                        maxHeight: "60vh",
                        overflow: "hidden",
                      }),
                    }}>
                    {slides[currentSlide - 1].content}
                  </div>
                </>
              ) : slides[currentSlide - 1].type === "bible" ? (
                <>
                  <h1
                    className={`text-white font-bold mb-6 ${getTextSizeClass()}`}
                    style={{ textAlign: slideAlignment }}>
                    {slides[currentSlide - 1].title}
                  </h1>
                  <div
                    className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      textAlign: slideAlignment,
                      ...(contentFixedArea && {
                        maxHeight: "60vh",
                        overflow: "hidden",
                      }),
                    }}>
                    {slides[currentSlide - 1].content}
                  </div>
                </>
              ) : (
                <>
                  <h1
                    className={`text-white font-bold mb-6 ${getTextSizeClass()}`}
                    style={{ textAlign: slideAlignment }}>
                    {slides[currentSlide - 1].title}
                  </h1>
                  <div
                    className={`text-white whitespace-pre-line leading-relaxed font-light tracking-wide ${getTextSizeClass()}`}
                    style={{
                      fontFamily:
                        editorState.styleFontFamily ||
                        editorState.selectedFont ||
                        "Lufgord",
                      color:
                        editorState.styleColor ||
                        editorState.textColor ||
                        "#ffffff",
                      fontWeight: editorState.isBold ? "bold" : "normal",
                      fontStyle: editorState.isItalic ? "italic" : "normal",
                      textDecoration:
                        `${editorState.isUnderline ? "underline" : ""} ${editorState.isStrikethrough ? "line-through" : ""} ${editorState.styleTextDecoration || ""}`.trim() ||
                        "none",
                      textShadow: editorState.styleTextShadow || "",
                      letterSpacing: editorState.styleLetterSpacing || "",
                      textTransform:
                        (editorState.styleTextTransform as any) || "",
                      textAlign: slideAlignment,
                      ...(contentFixedArea && {
                        maxHeight: "60vh",
                        overflow: "hidden",
                      }),
                    }}>
                    {slides[currentSlide - 1].content}
                  </div>
                </>
              )}
            </div>
          ) : (
            /* Default Live Service Display */
            <>
              <h1 className="text-white text-8xl font-bold mb-12">
                Live Service
              </h1>
              <p className="text-gray-300 text-4xl mb-8">
                Now presenting live to congregation
              </p>
              <div className="flex items-center justify-center space-x-3">
                <div className="w-4 h-4 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-red-400 text-2xl font-medium">LIVE</span>
              </div>
              <div className="mt-8 text-gray-400 text-lg">
                Slide {currentSlide} of {totalSlides}
              </div>
            </>
          )}
        </div>
  );
};
