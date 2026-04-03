import React from "react";
import { useLivePresentationState } from "../useLivePresentationState";
import facebookIcon from "@assets/R (2)_1756733484236.png";
import instagramIcon from "@assets/1658586823instagram-logo-transparent_1756733484234.png";

export const LiveOverlayLayer: React.FC<ReturnType<typeof useLivePresentationState>> = (props) => {
  const {
    customLogo,
    getLogoPositionClass,
    getLogoSizeClass,
    showServiceTitle,
    getServiceTitleSizeClass,
    getCurrentServiceTitle,
    showSlideCounter,
    slides,
    getPositionClass,
    slideNumberPosition,
    getSlideCounterText,
    showAuthorInfo,
    currentSlide,
    showCopyrightInfo,
    copyrightPosition,
    showTimestamp,
    formatTimestamp,
    showSocialHandles,
    facebookHandle,
    instagramHandle,
    getSocialHandlesPositionClass,
    getSocialHandlesSizeClasses,
    socialHandlesColor
  } = props;

  return (
    <>
      {/* Custom Logo Overlay */}
              {customLogo && (
                <div className={`absolute z-30 ${getLogoPositionClass()}`}>
                  <img
                    src={customLogo}
                    alt="Custom Logo"
                    className={`object-contain ${getLogoSizeClass()}`}
                  />
                </div>
              )}
      
              {/* Service Title Overlay */}
              {showServiceTitle && (
                <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30">
                  <div className="bg-black/60 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                    <span
                      className={`text-white font-medium ${getServiceTitleSizeClass()}`}>
                      {getCurrentServiceTitle()}
                    </span>
                  </div>
                </div>
              )}
      
              {/* Slide Counter Overlay */}
              {showSlideCounter && slides.length > 0 && (
                <div
                  className={`absolute z-30 ${getPositionClass(slideNumberPosition)}`}>
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                    <span className="text-white text-sm font-medium">
                      {getSlideCounterText()}
                    </span>
                  </div>
                </div>
              )}
      
              {/* Author Info Overlay */}
              {showAuthorInfo &&
                slides.length > 0 &&
                slides[currentSlide - 1] &&
                (slides[currentSlide - 1].type === "verse" ||
                  slides[currentSlide - 1].type === "chorus") &&
                slides[currentSlide - 1].author && (
                  <div className="absolute top-4 right-4 z-30">
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                      <span className="text-white text-sm">
                        By: {slides[currentSlide - 1].author}
                      </span>
                    </div>
                  </div>
                )}
      
              {/* Copyright Info Overlay */}
              {showCopyrightInfo &&
                slides.length > 0 &&
                slides[currentSlide - 1] &&
                (slides[currentSlide - 1].type === "verse" ||
                  slides[currentSlide - 1].type === "chorus") &&
                slides[currentSlide - 1].copyright && (
                  <div
                    className={`absolute z-30 ${getPositionClass(copyrightPosition)}`}>
                    <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                      <span className="text-white text-xs opacity-80">
                        © {slides[currentSlide - 1].copyright}
                      </span>
                    </div>
                  </div>
                )}
      
              {/* Live Timestamp Overlay */}
              {showTimestamp && (
                <div className="absolute bottom-4 left-4 z-30">
                  <div className="bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg border border-white/20">
                    <span className="text-white text-sm font-medium">
                      {formatTimestamp()}
                    </span>
                  </div>
                </div>
              )}
      
              {/* Social Handles Overlay */}
              {showSocialHandles && (facebookHandle || instagramHandle) && (
                <div className={`absolute z-30 ${getSocialHandlesPositionClass()}`}>
                  <div
                    className={`bg-black/60 backdrop-blur-sm ${getSocialHandlesSizeClasses().padding} rounded-lg border border-white/20`}>
                    <div
                      className={`flex items-center ${getSocialHandlesSizeClasses().spacing}`}>
                      {facebookHandle && (
                        <div
                          className={`flex items-center ${getSocialHandlesSizeClasses().spacing}`}>
                          <img
                            src={facebookIcon}
                            alt="Facebook"
                            className={getSocialHandlesSizeClasses().icon}
                          />
                          <span
                            className={`${getSocialHandlesSizeClasses().text} font-medium`}
                            style={{ color: socialHandlesColor }}>
                            {facebookHandle}
                          </span>
                        </div>
                      )}
                      {instagramHandle && (
                        <div
                          className={`flex items-center ${getSocialHandlesSizeClasses().spacing}`}>
                          <img
                            src={instagramIcon}
                            alt="Instagram"
                            className={getSocialHandlesSizeClasses().icon}
                          />
                          <span
                            className={`${getSocialHandlesSizeClasses().text} font-medium`}
                            style={{ color: socialHandlesColor }}>
                            {instagramHandle}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            
    </>
  );
};
