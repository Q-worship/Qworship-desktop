import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Mic,
  SettingsIcon,
  XIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookOpen,
} from "lucide-react";

interface BibleVerseData {
  verse: number;
  kjv: string;
  nkjv: string;
  amp: string;
  msg: string;
  esv: string;
  niv: string;
}

interface HandsfreeBibleWidgetProps {
  isFullscreen?: boolean;
  isLive?: boolean;
  onClose?: () => void;
  isListeningMode: boolean;
  onToggleMicrophone: () => void;
  selectedBibleVersion: string;
  setSelectedBibleVersion: (version: string) => void;
  detectedCommands: string;
  setDetectedCommands: (commands: string) => void;
  onClearProjection?: () => void;
  verseData?: BibleVerseData[] | null;
  formattedReference?: string | null;
  volume?: number;
  onNavigate?: (direction: "next" | "previous") => void;
  onVoiceCommand?: (command: string) => void;
}

const BIBLE_VERSIONS = [
  "KJV",
  "NKJV",
  "NIV",
  "AMP",
  "GN",
  "MSG",
  "ESV",
] as const;

const getVerseText = (
  verseData: BibleVerseData | undefined,
  version: string,
): string => {
  if (!verseData) return "";
  const versionKey = version.toLowerCase() as keyof Omit<
    BibleVerseData,
    "verse"
  >;
  return verseData[versionKey] || verseData.kjv || "";
};

export const HandsfreeBibleWidget: React.FC<HandsfreeBibleWidgetProps> = ({
  isFullscreen = false,
  isLive = false,
  onClose,
  isListeningMode,
  onToggleMicrophone,
  selectedBibleVersion,
  setSelectedBibleVersion,
  detectedCommands,
  setDetectedCommands,
  onClearProjection,
  verseData,
  formattedReference,
  volume = 0,
  onNavigate,
  onVoiceCommand,
}) => {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAllVersions, setShowAllVersions] = useState(false);

  const currentVerseData = verseData?.[0];
  const currentVerseText = getVerseText(currentVerseData, selectedBibleVersion);

  if (isFullscreen) {
    // Full-screen version for live presentation
    return (
      <div className="fixed top-8 right-8 z-50 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-xl w-96">
        {/* Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white z-10">
            <XIcon className="w-5 h-5" />
          </button>
        )}

        {/* Fullscreen Content */}
        <div className="p-6 space-y-6">
          {/* Header with LIVE indicator */}
          <div className="flex items-center justify-center gap-3">
            <h2 className="text-white text-xl font-medium">
              Hands-free Bible Companion
            </h2>
            {isLive && (
              <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                LIVE
              </span>
            )}
          </div>

          {/* Listening Status Bar */}
          <div className="bg-[#444444] rounded-full p-3 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center relative transition-all duration-75 ${
                  isListeningMode ? "bg-[#8356F3]" : "bg-gray-600"
                }`}
                style={
                  isListeningMode
                    ? {
                        transform: `scale(${1 + (volume / 100) * 0.5})`,
                        boxShadow: `0 0 ${volume}px rgba(131, 86, 243, ${Math.min(1, volume / 50)})`,
                      }
                    : {}
                }>
                <Mic
                  className={`w-4 h-4 ${isListeningMode ? "text-white" : "text-gray-400"}`}
                />
              </div>
              <span className="text-gray-300 text-sm">
                {isListeningMode
                  ? "Q-worship is listening"
                  : "Q-worship is off"}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span
                className={`text-xs ${isListeningMode ? "text-white" : "text-gray-400"}`}>
                {isListeningMode ? "ON" : "OFF"}
              </span>
              <Switch
                checked={isListeningMode}
                onCheckedChange={() => onToggleMicrophone()}
                className="data-[state=checked]:bg-[#8356F3] data-[state=unchecked]:bg-gray-600"
              />
            </div>
          </div>

          {/* Bible Version Selector */}
          <div className="space-y-3">
            <h3 className="text-white text-sm font-medium">Bible Version</h3>
            <select
              value={selectedBibleVersion}
              onChange={(e) => setSelectedBibleVersion(e.target.value)}
              className="w-full bg-[#444444] text-white border border-gray-600 rounded-lg px-3 py-2 text-sm">
              {["KJV", "NKJV", "AMP", "MSG", "GN", "ESV"].map((version) => (
                <option key={version} value={version}>
                  {version}
                </option>
              ))}
            </select>
          </div>

          {/* Scripture Display */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-sm font-medium">Scripture</h3>
              {formattedReference && (
                <Badge
                  variant="secondary"
                  className="bg-[#8356F3] text-white text-xs">
                  {formattedReference}
                </Badge>
              )}
            </div>
            <div className="bg-[#444444] rounded-lg p-4 text-left min-h-[80px]">
              {currentVerseText ? (
                <div className="space-y-2">
                  <p className="text-white text-sm leading-relaxed">
                    {currentVerseText}
                  </p>
                  <p className="text-gray-400 text-xs">
                    — {selectedBibleVersion}
                  </p>
                </div>
              ) : (
                <p className="text-gray-400 text-sm italic">
                  Say a Bible reference to display scripture...
                </p>
              )}
            </div>
          </div>

          {/* Multi-Version Display */}
          {currentVerseData && showAllVersions && (
            <ScrollArea className="h-40">
              <div className="space-y-2">
                {BIBLE_VERSIONS.filter((v) => v !== selectedBibleVersion).map(
                  (version) => {
                    const text = getVerseText(currentVerseData, version);
                    return text ? (
                      <div key={version} className="bg-[#333333] rounded p-2">
                        <p className="text-gray-300 text-xs leading-relaxed">
                          {text}
                        </p>
                        <p className="text-gray-500 text-xs mt-1">
                          — {version}
                        </p>
                      </div>
                    ) : null;
                  },
                )}
              </div>
            </ScrollArea>
          )}

          {currentVerseData && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllVersions(!showAllVersions)}
              className="w-full text-gray-400 hover:text-white text-xs">
              {showAllVersions ? "Hide" : "Show"} other translations
            </Button>
          )}

          {/* Detected Command */}
          {detectedCommands && (
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                Heard: "{detectedCommands}"
              </p>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              className="w-10 h-10 rounded-full border-2 border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
              onClick={() => {
                setDetectedCommands("Previous verse");
                onNavigate?.("previous");
              }}>
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <span className="text-gray-400 text-sm px-4">Verse navigation</span>
            <button
              className="w-10 h-10 rounded-full border-2 border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors"
              onClick={() => {
                setDetectedCommands("Next verse");
                onNavigate?.("next");
              }}>
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Standard dashboard widget
  return (
    <>
      {/* Widget Header with LIVE indicator */}
      <div className="flex items-center justify-between p-4 border-b border-gray-600">
        <div className="flex items-center space-x-2">
          <div
            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-75 z-10 ${isListeningMode ? "bg-[#8356F3]" : "bg-gray-600"}`}
            style={
              isListeningMode
                ? {
                    transform: `scale(${1 + (volume / 100) * 0.4})`,
                    boxShadow: `0 0 ${volume / 1.5}px rgba(131, 86, 243, ${Math.min(1, volume / 50)})`,
                  }
                : {}
            }>
            <Mic
              className={`w-4 h-4 ${isListeningMode ? "text-white" : "text-gray-400"}`}
            />
          </div>
          <h3 className="text-white font-medium">Hands-Free Bible Companion</h3>
          {isLive && (
            <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="text-gray-400 hover:text-white no-drag">
            <SettingsIcon className="w-4 h-4" />
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white no-drag">
              <XIcon className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Widget Content */}
      <div className="p-4 space-y-4">
        {/* Bible Version Selector */}
        <div className="flex items-center space-x-2 no-drag">
          <span className="text-white text-sm font-medium">Version:</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="bg-[#2a1f4b] border-gray-600 text-white hover:bg-[#3a2f5f] no-drag">
                {selectedBibleVersion}
                <ChevronDownIcon className="w-3 h-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#1a0f2e] border border-gray-600">
              <div className="p-1">
                {["KJV", "NKJV", "AMP", "MSG", "GN", "ESV"].map((version) => (
                  <div
                    key={version}
                    onClick={() => setSelectedBibleVersion(version)}
                    className="text-white text-sm py-1 px-2 hover:bg-gray-700 rounded cursor-pointer">
                    {version}
                  </div>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Listening Status */}
        <div className="flex items-center justify-between no-drag">
          <div className="flex items-center space-x-2">
            <div
              className={`w-3 h-3 rounded-full ${isListeningMode ? "bg-green-500" : "bg-red-500"}`}></div>
            <span className="text-white text-sm">
              {isListeningMode ? "Listening..." : "Not Listening"}
            </span>
          </div>
          <Switch
            checked={isListeningMode}
            onCheckedChange={() => onToggleMicrophone()}
            className="data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-gray-600"
          />
        </div>

        {/* Scripture Display */}
        <div className="bg-[#2a1f4b] p-3 rounded border border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white text-sm font-medium">
              {formattedReference || "Scripture"}
            </span>
            <Badge
              variant="secondary"
              className="bg-[#8356F3] text-white text-xs">
              {selectedBibleVersion}
            </Badge>
          </div>
          {currentVerseText ? (
            <div className="space-y-2">
              <p className="text-white text-sm leading-relaxed">
                {currentVerseText}
              </p>
              {detectedCommands && (
                <p className="text-gray-500 text-xs">
                  Heard: "{detectedCommands}"
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-400 text-sm italic">
              {detectedCommands || "Say a Bible reference..."}
            </p>
          )}
        </div>

        {/* Multi-Version Toggle */}
        {currentVerseData && (
          <div className="no-drag">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllVersions(!showAllVersions)}
              className="w-full text-gray-400 hover:text-white text-xs">
              <BookOpen className="w-3 h-3 mr-1" />
              {showAllVersions ? "Hide" : "Show"} other translations
            </Button>

            {showAllVersions && (
              <ScrollArea className="h-32 mt-2">
                <div className="space-y-2">
                  {BIBLE_VERSIONS.filter((v) => v !== selectedBibleVersion).map(
                    (version) => {
                      const text = getVerseText(currentVerseData, version);
                      return text ? (
                        <div
                          key={version}
                          className="bg-[#1a0f2e] rounded p-2 border border-gray-700">
                          <p className="text-gray-300 text-xs leading-relaxed">
                            {text}
                          </p>
                          <p className="text-gray-500 text-xs mt-1">
                            — {version}
                          </p>
                        </div>
                      ) : null;
                    },
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}

        {/* Quick Commands */}
        <div className="no-drag">
          <h4 className="text-white text-sm font-medium mb-2">
            Quick Commands:
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2a1f4b] border-gray-600 text-white hover:bg-[#3a2f5f] text-xs"
              onClick={() => {
                const cmd = "Show John 3:16";
                setDetectedCommands(cmd);
                onVoiceCommand?.(cmd);
              }}>
              "Show John 3:16"
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2a1f4b] border-gray-600 text-white hover:bg-[#3a2f5f] text-xs"
              onClick={() => {
                setDetectedCommands("Next verse");
                onNavigate?.("next");
              }}>
              "Next verse"
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2a1f4b] border-gray-600 text-white hover:bg-[#3a2f5f] text-xs"
              onClick={() => {
                const cmd = "Search Psalm 23";
                setDetectedCommands(cmd);
                onVoiceCommand?.(cmd);
              }}>
              "Search Psalm 23"
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="bg-[#2a1f4b] border-gray-600 text-white hover:bg-[#3a2f5f] text-xs"
              onClick={() => {
                setDetectedCommands("Clear screen");
                if (onClearProjection) {
                  onClearProjection();
                }
              }}>
              "Clear screen"
            </Button>
          </div>
        </div>

        {/* Settings Panel (if open) */}
        {isSettingsOpen && (
          <div className="border-t border-gray-600 pt-4 no-drag">
            <h4 className="text-white text-sm font-medium mb-3">Settings</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Auto-scroll</span>
                <Switch className="data-[state=checked]:bg-[#8356F3] data-[state=unchecked]:bg-gray-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Voice feedback</span>
                <Switch className="data-[state=checked]:bg-[#8356F3] data-[state=unchecked]:bg-gray-600" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">Auto-hide</span>
                <Switch className="data-[state=checked]:bg-[#8356F3] data-[state=unchecked]:bg-gray-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
