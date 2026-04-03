import React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

export interface LiveConsoleSettingsProps {
  isSettingsModalOpen: boolean;
  settingsModalPos: { x: number; y: number };
  startModalDrag: (modal: "background" | "obs" | "settings" | "slides", e: React.MouseEvent) => void;
  settingsScreen: "main" | "slide" | "customization" | "display";
  setSettingsScreen: (val: "main" | "slide" | "customization" | "display") => void;
  closeSettings: () => void;
  navigate: (path: string) => void;
  
  slidesTransparent: boolean; setSlidesTransparent: (v: boolean) => void;
  slideTextSize: string; setSlideTextSize: (v: string) => void;
  slideAlignment: string; setSlideAlignment: (v: string) => void;
  contentFixedArea: boolean; setContentFixedArea: (v: boolean) => void;
  slideTransition: string; setSlideTransition: (v: string) => void;
  autoAdvanceSlides: boolean; setAutoAdvanceSlides: (v: boolean) => void;
  
  customLogo: string; setCustomLogo: (v: string) => void;
  logoSize: string; setLogoSize: (v: string) => void;
  logoPosition: string; setLogoPosition: (v: string) => void;
  setIsLogoAssetsModalOpen: (v: boolean) => void;
  
  displayTheme: string; setDisplayTheme: (v: string) => void;
  showTimestamp: boolean; setShowTimestamp: (v: boolean) => void;
  timestampFormat: string; setTimestampFormat: (v: string) => void;
  showSlideCounter: boolean; setShowSlideCounter: (v: boolean) => void;
  slideNumberPosition: string; setSlideNumberPosition: (v: string) => void;
  
  showServiceTitle: boolean; setShowServiceTitle: (v: boolean) => void;
  customServiceTitle: string; setCustomServiceTitle: (v: string) => void;
  serviceTitleSize: string; setServiceTitleSize: (v: string) => void;
  
  showCopyrightInfo: boolean; setShowCopyrightInfo: (v: boolean) => void;
  copyrightPosition: string; setCopyrightPosition: (v: string) => void;
  showAuthorInfo: boolean; setShowAuthorInfo: (v: boolean) => void;
  
  showSocialHandles: boolean; setShowSocialHandles: (v: boolean) => void;
  facebookHandle: string; setFacebookHandle: (v: string) => void;
  instagramHandle: string; setInstagramHandle: (v: string) => void;
  socialHandlesColor: string; setSocialHandlesColor: (v: string) => void;
  socialHandlesPosition: string; setSocialHandlesPosition: (v: string) => void;
  socialHandlesSize: string; setSocialHandlesSize: (v: string) => void;
}

export function LiveConsoleSettingsModal(props: LiveConsoleSettingsProps) {
  const {
    isSettingsModalOpen, settingsModalPos, startModalDrag, settingsScreen, setSettingsScreen, closeSettings, navigate,
    slidesTransparent, setSlidesTransparent, slideTextSize, setSlideTextSize, slideAlignment, setSlideAlignment,
    contentFixedArea, setContentFixedArea, slideTransition, setSlideTransition, autoAdvanceSlides, setAutoAdvanceSlides,
    customLogo, setCustomLogo, logoSize, setLogoSize, logoPosition, setLogoPosition, setIsLogoAssetsModalOpen,
    displayTheme, setDisplayTheme, showTimestamp, setShowTimestamp, timestampFormat, setTimestampFormat,
    showSlideCounter, setShowSlideCounter, slideNumberPosition, setSlideNumberPosition, showServiceTitle, setShowServiceTitle,
    customServiceTitle, setCustomServiceTitle, serviceTitleSize, setServiceTitleSize, showCopyrightInfo, setShowCopyrightInfo,
    copyrightPosition, setCopyrightPosition, showAuthorInfo, setShowAuthorInfo, showSocialHandles, setShowSocialHandles,
    facebookHandle, setFacebookHandle, instagramHandle, setInstagramHandle, socialHandlesColor, setSocialHandlesColor,
    socialHandlesPosition, setSocialHandlesPosition, socialHandlesSize, setSocialHandlesSize
  } = props;

  if (!isSettingsModalOpen) return null;

  return (
    <div
      className="fixed z-[110] w-96 bg-[#2d2a3e] rounded-2xl shadow-2xl"
      style={{ left: settingsModalPos.x, top: settingsModalPos.y }}
      onClick={(e) => e.stopPropagation()}>
      {/* Draggable Header */}
      <div
        className="p-5 pb-4 cursor-move select-none"
        onMouseDown={(e) => startModalDrag("settings", e as any)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {settingsScreen !== "main" && (
              <button
                onClick={() => setSettingsScreen("main")}
                className="text-[#c4b5fd] hover:text-white transition-colors p-1 hover:bg-[#4a4560] rounded">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="text-[#c4b5fd] text-xl font-semibold">
              {settingsScreen === "main"
                ? "Live Settings"
                : settingsScreen === "slide"
                  ? "Slide Settings"
                  : settingsScreen === "customization"
                    ? "Customization"
                    : "Display Settings"}
            </h3>
          </div>
          <button
            onClick={closeSettings}
            className="text-[#9ca3af] hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings Content */}
      <div
        className={`px-5 pb-5 ${settingsScreen === "display" ? "max-h-[70vh] overflow-y-auto scrollbar-thin scrollbar-thumb-[#4a4560] scrollbar-track-transparent" : ""}`}>
        {settingsScreen === "main" && (
          <div className="space-y-3">
            <button
              onClick={() => setSettingsScreen("slide")}
              className="w-full p-5 bg-[#4a4560] hover:bg-[#5a5575] rounded-xl text-left transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold text-lg">
                    Slide Settings
                  </h4>
                  <p className="text-[#9ca3af] text-sm mt-1">
                    Transparency, Text size, Transitions
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setSettingsScreen("customization")}
              className="w-full p-5 bg-[#4a4560] hover:bg-[#5a5575] rounded-xl text-left transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold text-lg">
                    Customization
                  </h4>
                  <p className="text-[#9ca3af] text-sm mt-1">
                    Logo upload, positioning, branding
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </div>
            </button>

            <button
              onClick={() => setSettingsScreen("display")}
              className="w-full p-5 bg-[#4a4560] hover:bg-[#5a5575] rounded-xl text-left transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold text-lg">
                    Display Settings
                  </h4>
                  <p className="text-[#9ca3af] text-sm mt-1">
                    Timestamp, overlay, options
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </div>
            </button>

            <button
              onClick={() => navigate("/lower-third-settings")}
              className="w-full p-5 bg-[#4a4560] hover:bg-[#5a5575] rounded-xl text-left transition-all group">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-white font-semibold text-lg">
                    Lower Third Settings
                  </h4>
                  <p className="text-[#9ca3af] text-sm mt-1">
                    Templates, font sizing, animations
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#9ca3af] group-hover:text-white transition-colors" />
              </div>
            </button>
          </div>
        )}

        {settingsScreen === "slide" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between p-4 bg-[#4a4560] rounded-xl">
              <div>
                <label className="text-white text-sm font-medium">
                  Transparent Slides
                </label>
                <p className="text-[#9ca3af] text-xs mt-1">
                  Remove slide background for overlay effect
                </p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={slidesTransparent}
                  onChange={(e) => setSlidesTransparent(e.target.checked)}
                  className="sr-only"
                />
                <div
                  className={`relative w-6 h-6 rounded border-2 transition-all ${
                    slidesTransparent
                      ? "bg-[#8b5cf6] border-[#8b5cf6]"
                      : "bg-transparent border-[#6b7280] hover:border-[#a78bfa]"
                  }`}>
                  {slidesTransparent && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </label>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">
                Text Size
              </label>
              <select
                value={slideTextSize}
                onChange={(e) => setSlideTextSize(e.target.value)}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
                <option value="extra-large">Extra Large</option>
                <option value="2x-extra-large">2 Extra Large</option>
                <option value="3x-extra-large">3 Extra Large</option>
                <option value="4x-extra-large">4 Extra Large</option>
                <option value="5x-extra-large">5 Extra Large</option>
                <option value="6x-extra-large">6 Extra Large</option>
              </select>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">
                Alignment
              </label>
              <select
                value={slideAlignment}
                onChange={(e) => setSlideAlignment(e.target.value)}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={contentFixedArea}
                    onChange={(e) => setContentFixedArea(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${contentFixedArea ? "bg-[#8b5cf6] border-[#8b5cf6]" : "border-[#6b7280] group-hover:border-[#a78bfa]"}`}>
                    {contentFixedArea && (
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-white text-sm font-medium">Set content to fixed area</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Prevents text from extending beyond visible display area</p>
                </div>
              </label>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">Slide Transition</label>
              <select
                value={slideTransition}
                onChange={(e) => setSlideTransition(e.target.value)}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                <option value="none">None</option>
                <option value="fade">Fade In/Out</option>
                <option value="slide">Slide (Default)</option>
                <option value="slideUp">Slide Up</option>
                <option value="slideDown">Slide Down</option>
                <option value="slideLeft">Slide Left</option>
                <option value="slideRight">Slide Right</option>
                <option value="zoom">Zoom In/Out</option>
                <option value="flipX">Flip Horizontal</option>
                <option value="flipY">Flip Vertical</option>
                <option value="dissolve">Dissolve</option>
                <option value="wipe">Wipe</option>
              </select>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#4a4560] rounded-xl">
              <div>
                <label className="text-white text-sm font-medium">Auto Advance Slides</label>
                <p className="text-[#9ca3af] text-xs mt-1">Automatically move to next slide</p>
              </div>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAdvanceSlides}
                  onChange={(e) => setAutoAdvanceSlides(e.target.checked)}
                  className="sr-only"
                />
                <div className={`relative w-6 h-6 rounded border-2 transition-all ${autoAdvanceSlides ? "bg-[#8b5cf6] border-[#8b5cf6]" : "bg-transparent border-[#6b7280] hover:border-[#a78bfa]"}`}>
                  {autoAdvanceSlides && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                         <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>
        )}

        {settingsScreen === "customization" && (
          <div className="space-y-5">
            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">Q-worship Cloud Storage</label>
              <p className="text-[#9ca3af] text-xs mb-3">Access your uploaded logos and images from Q-worship cloud</p>
              <button
                onClick={() => setIsLogoAssetsModalOpen(true)}
                className="w-full px-3 py-2.5 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white rounded-lg text-sm font-medium transition-all">
                Browse My Assets
              </button>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">Upload from Computer</label>
              <input
                type="file"
                accept="image/png,image/jpeg,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = URL.createObjectURL(file);
                    setCustomLogo(url);
                  }
                }}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[#8b5cf6] file:text-white file:cursor-pointer focus:border-[#a78bfa] transition-all"
              />
              {customLogo && (
                <div className="mt-3">
                  <img src={customLogo} className="w-20 h-20 object-contain rounded-lg border border-[#5a5575] bg-[#3a3550]" alt="Custom logo" />
                  <button onClick={() => setCustomLogo("")} className="mt-2 text-red-400 hover:text-red-300 text-xs hover:underline transition-all">Remove Logo</button>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">Logo Size</label>
              <select
                value={logoSize}
                onChange={(e) => setLogoSize(e.target.value)}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">Logo Position</label>
              <select
                value={logoPosition}
                onChange={(e) => setLogoPosition(e.target.value)}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
                <option value="center">Center</option>
              </select>
            </div>
          </div>
        )}

        {settingsScreen === "display" && (
          <div className="space-y-5">
            <div className="p-4 bg-[#4a4560] rounded-xl">
              <label className="text-white text-sm font-medium block mb-3">Display Theme</label>
              <select
                value={displayTheme}
                onChange={(e) => setDisplayTheme(e.target.value)}
                className="w-full px-3 py-3 bg-[#3a3550] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                <option value="modern">Modern (Default)</option>
                <option value="classic">Classic</option>
                <option value="minimalist">Minimalist</option>
                <option value="bold">Bold & High Contrast</option>
              </select>
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#5a5575] pb-4">
                <div>
                  <span className="text-white text-sm font-medium block">Show Time</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Display current time on screen</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={showTimestamp} onChange={(e) => setShowTimestamp(e.target.checked)} className="sr-only" />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${showTimestamp ? "bg-[#8b5cf6]" : "bg-[#6b7280]"}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showTimestamp ? "translate-x-4" : ""}`} />
                  </div>
                </label>
              </div>

              {showTimestamp && (
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Time Format</label>
                  <select value={timestampFormat} onChange={(e) => setTimestampFormat(e.target.value)} className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                    <option value="12h">12 Hour (e.g. 10:30 AM)</option>
                    <option value="24h">24 Hour (e.g. 10:30)</option>
                    <option value="12h-sec">12 Hour with Seconds (e.g. 10:30:45 AM)</option>
                    <option value="24h-sec">24 Hour with Seconds (e.g. 10:30:45)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#5a5575] pb-4">
                <div>
                  <span className="text-white text-sm font-medium block">Show Slide Count</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Display current/total slide number (e.g. 1/4)</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={showSlideCounter} onChange={(e) => setShowSlideCounter(e.target.checked)} className="sr-only" />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${showSlideCounter ? "bg-[#8b5cf6]" : "bg-[#6b7280]"}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showSlideCounter ? "translate-x-4" : ""}`} />
                  </div>
                </label>
              </div>
              
              {showSlideCounter && (
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Position</label>
                  <select value={slideNumberPosition} onChange={(e) => setSlideNumberPosition(e.target.value)} className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-left">Bottom Left</option>
                    <option value="top-right">Top Right</option>
                    <option value="top-left">Top Left</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#5a5575] pb-4">
                <div>
                  <span className="text-white text-sm font-medium block">Service Title Overlay</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Display fixed title text on screen</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={showServiceTitle} onChange={(e) => setShowServiceTitle(e.target.checked)} className="sr-only" />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${showServiceTitle ? "bg-[#8b5cf6]" : "bg-[#6b7280]"}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showServiceTitle ? "translate-x-4" : ""}`} />
                  </div>
                </label>
              </div>

              {showServiceTitle && (
                <>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Custom Title</label>
                    <input type="text" value={customServiceTitle} onChange={(e) => setCustomServiceTitle(e.target.value)} placeholder="e.g. Sunday Service, Night Vigil" className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all placeholder-[#6b7280]" />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Title Size</label>
                    <select value={serviceTitleSize} onChange={(e) => setServiceTitleSize(e.target.value)} className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="extralarge">Extra Large</option>
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#5a5575]">
                <div>
                  <span className="text-white text-sm font-medium block">Copyright Information</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Display song copyright details if available</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={showCopyrightInfo} onChange={(e) => setShowCopyrightInfo(e.target.checked)} className="sr-only" />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${showCopyrightInfo ? "bg-[#8b5cf6]" : "bg-[#6b7280]"}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showCopyrightInfo ? "translate-x-4" : ""}`} />
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-white text-sm font-medium block">Author / Writer Info</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Display song author details if available</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={showAuthorInfo} onChange={(e) => setShowAuthorInfo(e.target.checked)} className="sr-only" />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${showAuthorInfo ? "bg-[#8b5cf6]" : "bg-[#6b7280]"}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showAuthorInfo ? "translate-x-4" : ""}`} />
                  </div>
                </label>
              </div>

              {(showCopyrightInfo || showAuthorInfo) && (
                <div>
                  <label className="text-white text-sm font-medium block mb-3">Position</label>
                  <select value={copyrightPosition} onChange={(e) => setCopyrightPosition(e.target.value)} className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                    <option value="bottom-left">Bottom Left</option>
                    <option value="bottom-right">Bottom Right</option>
                    <option value="bottom-center">Bottom Center</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#4a4560] rounded-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#5a5575] pb-4">
                <div>
                  <span className="text-white text-sm font-medium block">Social Media Handles</span>
                  <p className="text-[#9ca3af] text-xs mt-1">Display your church social handles on screen</p>
                </div>
                <label className="flex items-center cursor-pointer">
                  <input type="checkbox" checked={showSocialHandles} onChange={(e) => setShowSocialHandles(e.target.checked)} className="sr-only" />
                  <div className={`relative w-10 h-6 rounded-full transition-colors ${showSocialHandles ? "bg-[#8b5cf6]" : "bg-[#6b7280]"}`}>
                    <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${showSocialHandles ? "translate-x-4" : ""}`} />
                  </div>
                </label>
              </div>
              
              {showSocialHandles && (
                <>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Facebook Handle</label>
                    <input type="text" value={facebookHandle} onChange={(e) => setFacebookHandle(e.target.value)} placeholder="e.g. @mychurch" className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all placeholder-[#6b7280]" />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Instagram Handle</label>
                    <input type="text" value={instagramHandle} onChange={(e) => setInstagramHandle(e.target.value)} placeholder="e.g. @mychurch" className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all placeholder-[#6b7280]" />
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Text Color</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={socialHandlesColor} onChange={(e) => setSocialHandlesColor(e.target.value)} className="w-12 h-12 bg-transparent border-2 border-[#5a5575] rounded-lg cursor-pointer" />
                      <input type="text" value={socialHandlesColor} onChange={(e) => setSocialHandlesColor(e.target.value)} placeholder="#ffffff" className="flex-1 px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all placeholder-[#6b7280]" />
                    </div>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Position</label>
                    <select value={socialHandlesPosition} onChange={(e) => setSocialHandlesPosition(e.target.value)} className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                      <option value="top-left">Top Left</option>
                      <option value="top-right">Top Right</option>
                      <option value="bottom-left">Bottom Left</option>
                      <option value="bottom-right">Bottom Right</option>
                      <option value="bottom-center">Bottom Center</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white text-sm font-medium block mb-3">Display Size</label>
                    <select value={socialHandlesSize} onChange={(e) => setSocialHandlesSize(e.target.value)} className="w-full px-3 py-3 bg-[#2d2a3e] border border-[#5a5575] rounded-lg text-white text-base font-medium focus:border-[#a78bfa] focus:outline-none transition-all">
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
