import React from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  UndoIcon,
  RedoIcon,
  PlayIcon,
  PauseIcon,
  StopCircleIcon,
  Maximize2,
  Minimize2,
  UserIcon,
  LogOut,
  CreditCard,
  HelpCircle,
  SettingsIcon,
  Bell,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import qworshipLogo from "@assets/Group 1_1754122708985.png";

export interface AppHeaderProps {
  isBuildMode: boolean;
  isFullscreen: boolean;
  toggleFullscreen: () => void;

  // Project name editing
  currentPresentationName: string;
  isEditingProjectName: boolean;
  editingProjectName: string;
  setEditingProjectName: (name: string) => void;
  projectNameInputRef: React.RefObject<HTMLInputElement>;
  startEditingProjectName: () => void;
  saveProjectName: () => void;
  handleProjectNameKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;

  // Nav tabs
  activeTab: string;
  setActiveTab: (tab: string) => void;
  navItems: Array<{ name: string; active: boolean; notification?: boolean }>;

  // Dropdown state
  activeDropdown: string | null;
  setActiveDropdown: (d: string | null) => void;
  hoveredSubmenu: string | null;
  setHoveredSubmenu: (s: string | null) => void;

  // Navigation
  setLocation: (path: string) => void;
  setIsSongbookOpen: (open: boolean) => void;

  // Menu items (passed from parent to avoid re-creating inline)
  projectMenuItems: any[];
  insertItemMenuItems: any[];
  settingsMenuItems: any[];

  // Presentation helpers
  getRecentPresentations: () => any[];
  calculateSlideCount: (project: any) => number;
  formatProjectDate: (date: any) => string | null;
  handleOpenRecentPresentation: (id: number) => void;
  handleDuplicateRecentPresentation: (id: number) => void;

  // Undo/Redo
  performUndo: () => void;
  performRedo: () => void;
  actionHistory: any[];
  actionHistoryIndex: number;

  // Recording
  isRecording: boolean;
  startRecording: () => void;
  recordingDropdownOpen: boolean;
  showRecordingControls: boolean;
  setShowRecordingControls: (show: boolean) => void;
  isPaused: boolean;
  resumeRecording: () => void;
  pauseRecording: () => void;
  stopRecording: () => void;
  recordingTime: number;
  formatRecordingTime: (time: number) => string;

  // Build/Preview/Live
  isLive: boolean;
  isInPreview: boolean;
  setIsBuildMode: (mode: boolean) => void;
  setIsInPreview: (v: boolean) => void;
  isLiveConsoleOpen: boolean;
  setIsLiveConsoleOpen: (open: boolean) => void;
  setDisplayMode: (mode: string) => void;
  setCurrentSlide?: (slide: number) => void;
  liveWindow?: Window | null;
  slides?: any[];
  itemBackgrounds?: Record<string, any>;
  goLive: () => void;
  exitLive: () => void;

  // Profile/Notifications
  isProfileMenuOpen: boolean;
  setIsProfileMenuOpen: (open: boolean) => void;
  currentUser: any;
  notifications: any[];
  unreadCount: number;
  getNotificationIcon: (type: string) => React.ReactNode;
  formatTimestamp: (date: Date) => string;
  markNotificationAsRead: (id: string) => void;
  setIsProfileSettingsOpen: (open: boolean) => void;
  setIsSubscriptionOpen: (open: boolean) => void;
  handleLogout: () => void;
}

export function AppHeader({
  isBuildMode,
  isFullscreen,
  toggleFullscreen,
  currentPresentationName,
  isEditingProjectName,
  editingProjectName,
  setEditingProjectName,
  projectNameInputRef,
  startEditingProjectName,
  saveProjectName,
  handleProjectNameKeyDown,
  activeTab,
  setActiveTab,
  navItems,
  activeDropdown,
  setActiveDropdown,
  hoveredSubmenu,
  setHoveredSubmenu,
  setLocation,
  setIsSongbookOpen,
  projectMenuItems,
  insertItemMenuItems,
  settingsMenuItems,
  getRecentPresentations,
  calculateSlideCount,
  formatProjectDate,
  handleOpenRecentPresentation,
  handleDuplicateRecentPresentation,
  performUndo,
  performRedo,
  actionHistory,
  actionHistoryIndex,
  isRecording,
  startRecording,
  recordingDropdownOpen,
  showRecordingControls,
  setShowRecordingControls,
  isPaused,
  resumeRecording,
  pauseRecording,
  stopRecording,
  recordingTime,
  formatRecordingTime,
  isLive,
  isInPreview,
  setIsBuildMode,
  setIsInPreview,
  isLiveConsoleOpen,
  setIsLiveConsoleOpen,
  setDisplayMode,
  goLive,
  exitLive,
  isProfileMenuOpen,
  setIsProfileMenuOpen,
  currentUser,
  notifications,
  unreadCount,
  getNotificationIcon,
  formatTimestamp,
  markNotificationAsRead,
  setIsProfileSettingsOpen,
  setIsSubscriptionOpen,
  handleLogout,
}: AppHeaderProps) {
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 ${!isBuildMode ? "blur-sm" : ""}`}>
      {/* Top Header */}
      <header className="bg-[#1a0f2e] px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-3">
          {/* Qworship Logo */}
          <img src={qworshipLogo} alt="Q-worship Logo" className="w-6 h-6" />
          {isEditingProjectName ? (
            <div className="flex items-center space-x-1">
              <input
                ref={projectNameInputRef}
                type="text"
                value={editingProjectName}
                onChange={(e) => setEditingProjectName(e.target.value)}
                onKeyDown={handleProjectNameKeyDown}
                onBlur={saveProjectName}
                className="bg-transparent text-white font-medium border-b border-white/50 focus:border-white outline-none px-1"
                style={{
                  width: `${Math.max(editingProjectName.length * 8 + 20, 100)}px`,
                }}
              />
              <span className="text-white font-medium"> - Qworship</span>
            </div>
          ) : (
            <span
              className="text-white font-medium cursor-pointer hover:text-gray-200 transition-colors"
              onClick={startEditingProjectName}
              title="Click to rename project">
              {currentPresentationName} - Qworship
            </span>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {/* Fullscreen Toggle Icon */}
          <button
            onClick={toggleFullscreen}
            className="p-1 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700/50"
            title={
              isFullscreen
                ? "Exit fullscreen (Ctrl+F)"
                : "Enter fullscreen (Ctrl+F)"
            }>
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-[#2a1f4b] px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-6 relative">
          {navItems.map((item) => (
            <div key={item.name} className="relative">
              <button
                onClick={() => {
                  setActiveTab(item.name);
                  if (item.name === "Project") {
                    setActiveDropdown(
                      activeDropdown === "Project" ? null : "Project",
                    );
                  } else if (item.name === "Insert Item") {
                    setActiveDropdown(
                      activeDropdown === "Insert Item" ? null : "Insert Item",
                    );
                  } else if (item.name === "Settings") {
                    setActiveDropdown(
                      activeDropdown === "Settings" ? null : "Settings",
                    );
                  } else if (item.name === "Assets") {
                    setLocation("/dashboard-assets");
                    setActiveDropdown(null);
                  } else if (item.name === "Songbook") {
                    setIsSongbookOpen(true);
                    setActiveDropdown(null);
                  } else if (item.name === "Help") {
                    setLocation("/dashboard-help");
                    setActiveDropdown(null);
                  } else if (item.name === "Guide") {
                    setLocation("/guides");
                    setActiveDropdown(null);
                  } else {
                    setActiveDropdown(null);
                  }
                }}
                onMouseEnter={() => {
                  if (item.name === "Project") setActiveDropdown("Project");
                  else if (item.name === "Insert Item")
                    setActiveDropdown("Insert Item");
                  else if (item.name === "Settings")
                    setActiveDropdown("Settings");
                }}
                className={`text-sm font-medium px-3 py-2 rounded relative ${
                  activeTab === item.name
                    ? "text-white bg-[#3d2f5f]"
                    : "text-gray-300 hover:text-white"
                }`}>
                {item.name}
                {item.notification && (
                  <div className="absolute -top-1 -right-2 w-2 h-2 bg-pink-500 rounded-full animate-beep mt-[11px] mb-[11px] ml-[9px] mr-[9px]" />
                )}
              </button>

              {/* Project Dropdown Menu */}
              {item.name === "Project" && activeDropdown === "Project" && (
                <div
                  className="absolute top-full left-0 mt-1 min-w-[320px] w-auto bg-[#2a1f4b] border border-gray-600 rounded-lg shadow-xl z-50"
                  onMouseLeave={() => {
                    setActiveDropdown(null);
                    setHoveredSubmenu(null);
                  }}>
                  {projectMenuItems.map((menuItem, index) => (
                    <div key={menuItem.name} className="relative">
                      <div
                        className={`flex items-center justify-between px-5 py-3 text-sm text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors min-w-0 ${index === 0 ? "rounded-t-lg" : ""} ${index === projectMenuItems.length - 1 ? "rounded-b-lg" : ""}`}
                        onMouseEnter={() =>
                          menuItem.hasSubmenu
                            ? setHoveredSubmenu(menuItem.name)
                            : setHoveredSubmenu(null)
                        }
                        onClick={() => {
                          if (!menuItem.hasSubmenu && menuItem.action) {
                            menuItem.action();
                            setActiveDropdown(null);
                          }
                        }}>
                        <span className="flex-shrink-0 mr-6">
                          {menuItem.name}
                        </span>
                        <div className="flex items-center space-x-3 flex-shrink-0">
                          {menuItem.shortcut && (
                            <span className={`text-xs text-gray-500 font-mono ${menuItem.shortcut === 'coming soon' ? 'font-bold' : ''}`}>
                              {menuItem.shortcut}
                            </span>
                          )}
                          {menuItem.hasSubmenu && (
                            <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Submenu */}
                      {menuItem.hasSubmenu &&
                        hoveredSubmenu === menuItem.name && (
                          <div
                            className={`absolute left-full top-0 ml-1 bg-[#2a1f4b] border border-gray-600 rounded-lg shadow-xl z-60 ${
                              menuItem.name === "New"
                                ? "min-w-[400px] w-auto"
                                : menuItem.name === "Open Recent" ||
                                    menuItem.name === "Duplicate Recent"
                                  ? "min-w-[360px] w-auto"
                                  : "min-w-[280px] w-auto"
                            }`}>
                            {(() => {
                              if (menuItem.name === "Open Recent") {
                                const recentProjects =
                                  getRecentPresentations().slice(0, 5);
                                if (recentProjects.length === 0) {
                                  return (
                                    <div className="px-5 py-4 text-gray-400 text-sm">
                                      No recent presentations
                                    </div>
                                  );
                                }
                                return recentProjects.map(
                                  (project: any, subIndex: number) => {
                                    const slideCount =
                                      calculateSlideCount(project);
                                    const presentationDate =
                                      project.presentationDate
                                        ? formatProjectDate(
                                            project.presentationDate,
                                          )
                                        : null;
                                    return (
                                      <div
                                        key={project.id}
                                        className={`px-5 py-4 text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors ${subIndex === 0 ? "rounded-t-lg" : ""} ${subIndex === recentProjects.length - 1 ? "rounded-b-lg" : ""}`}
                                        onClick={() => {
                                          handleOpenRecentPresentation(
                                            project.id,
                                          );
                                          setActiveDropdown(null);
                                          setHoveredSubmenu(null);
                                        }}>
                                        <div className="text-sm font-medium mb-1">
                                          {project.name}
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs text-gray-400">
                                            <div>
                                              {presentationDate && (
                                                <span>
                                                  📅 {presentationDate}
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              {slideCount > 0 && (
                                                <span>{slideCount} slides</span>
                                              )}
                                            </div>
                                          </div>
                                          {project.description && (
                                            <div className="text-xs text-gray-400 truncate max-w-[240px]">
                                              {project.description.length > 50
                                                ? `${project.description.substring(0, 50)}...`
                                                : project.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                );
                              }

                              if (menuItem.name === "Duplicate Recent") {
                                const recentProjects =
                                  getRecentPresentations().slice(0, 5);
                                if (recentProjects.length === 0) {
                                  return (
                                    <div className="px-5 py-4 text-gray-400 text-sm">
                                      No recent presentations
                                    </div>
                                  );
                                }
                                return recentProjects.map(
                                  (project: any, subIndex: number) => {
                                    const slideCount =
                                      calculateSlideCount(project);
                                    const presentationDate =
                                      project.presentationDate
                                        ? formatProjectDate(
                                            project.presentationDate,
                                          )
                                        : null;
                                    return (
                                      <div
                                        key={project.id}
                                        className={`px-5 py-4 text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors ${subIndex === 0 ? "rounded-t-lg" : ""} ${subIndex === recentProjects.length - 1 ? "rounded-b-lg" : ""}`}
                                        onClick={() => {
                                          handleDuplicateRecentPresentation(
                                            project.id,
                                          );
                                          setActiveDropdown(null);
                                          setHoveredSubmenu(null);
                                        }}>
                                        <div className="text-sm font-medium mb-1">
                                          {project.name}
                                        </div>
                                        <div className="space-y-1">
                                          <div className="flex items-center justify-between text-xs text-gray-400">
                                            <div>
                                              {presentationDate && (
                                                <span>
                                                  📅 {presentationDate}
                                                </span>
                                              )}
                                            </div>
                                            <div>
                                              {slideCount > 0 && (
                                                <span>{slideCount} slides</span>
                                              )}
                                            </div>
                                          </div>
                                          {project.description && (
                                            <div className="text-xs text-gray-400 truncate max-w-[240px]">
                                              {project.description.length > 50
                                                ? `${project.description.substring(0, 50)}...`
                                                : project.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                );
                              }

                              // Regular submenu items
                              return (menuItem.submenuItems || []).map(
                                (subItem: any, subIndex: number) => {
                                  const isHeading = subItem.isHeading;
                                  return (
                                    <div
                                      key={subItem.name}
                                      className={`${
                                        isHeading
                                          ? "px-5 py-2 text-gray-400 text-xs font-bold uppercase border-b border-gray-600"
                                          : `px-5 py-4 text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors ${subIndex === 0 ? "rounded-t-lg" : ""} ${subIndex === (menuItem.submenuItems || []).length - 1 ? "rounded-b-lg" : ""}`
                                      }`}
                                      onClick={() => {
                                        if (!isHeading && subItem.action) {
                                          subItem.action();
                                          setActiveDropdown(null);
                                          setHoveredSubmenu(null);
                                        }
                                      }}>
                                      {isHeading ? (
                                        <div>{subItem.name}</div>
                                      ) : (
                                        <div className="flex items-start">
                                          {menuItem.name === "New" && (
                                            <div className="w-12 h-8 bg-[#8356F3] rounded mr-3 flex-shrink-0 flex items-center justify-center">
                                              <span className="text-white text-xs font-bold">
                                                WELCOME
                                              </span>
                                            </div>
                                          )}
                                          <div className="flex-1">
                                            <div className="text-sm font-medium">
                                              {subItem.name}
                                            </div>
                                            {subItem.subtitle && (
                                              <div className="text-xs text-gray-400 mt-1 leading-relaxed">
                                                {subItem.subtitle}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                },
                              );
                            })()}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}

              {/* Insert Item Dropdown Menu */}
              {item.name === "Insert Item" &&
                activeDropdown === "Insert Item" && (
                  <div
                    className="absolute top-full left-0 mt-1 min-w-[320px] w-auto bg-[#2a1f4b] border border-gray-600 rounded-lg shadow-xl z-50"
                    onMouseLeave={() => {
                      setActiveDropdown(null);
                      setHoveredSubmenu(null);
                    }}>
                    {insertItemMenuItems.map((menuItem: any, index: number) => (
                      <div key={menuItem.name} className="relative">
                        <div
                          className={`flex items-center justify-between px-5 py-3 text-sm text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors min-w-0 ${index === 0 ? "rounded-t-lg" : ""} ${index === insertItemMenuItems.length - 1 ? "rounded-b-lg" : ""}`}
                          onMouseEnter={() =>
                            menuItem.hasSubmenu
                              ? setHoveredSubmenu(menuItem.name)
                              : setHoveredSubmenu(null)
                          }
                          onClick={() => {
                            if (!menuItem.hasSubmenu && menuItem.action) {
                              menuItem.action();
                              setActiveDropdown(null);
                            }
                          }}>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            {menuItem.iconComponent && (
                              <div className="w-5 h-5 flex items-center justify-center">
                                {React.createElement(menuItem.iconComponent, {
                                  size: 16,
                                })}
                              </div>
                            )}
                            <span className="flex-shrink-0">
                              {menuItem.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3 flex-shrink-0">
                            {menuItem.shortcut && (
                              <span className={`text-xs font-mono text-gray-500 ${menuItem.shortcut === 'coming soon' ? 'font-bold' : ''}`}>
                                {menuItem.shortcut}
                              </span>
                            )}
                            {menuItem.hasSubmenu && (
                              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                            )}
                          </div>
                        </div>

                        {/* Submenu for Import Item */}
                        {menuItem.hasSubmenu &&
                          hoveredSubmenu === menuItem.name &&
                          menuItem.submenuItems && (
                            <div className="absolute left-full top-0 ml-1 min-w-[280px] w-auto bg-[#2a1f4b] border border-gray-600 rounded-lg shadow-xl z-60">
                              {menuItem.submenuItems.map(
                                (subItem: any, subIndex: number) => (
                                  <div
                                    key={subItem.name}
                                    className={`px-5 py-3 text-sm text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors ${subIndex === 0 ? "rounded-t-lg" : ""} ${subIndex === menuItem.submenuItems.length - 1 ? "rounded-b-lg" : ""}`}
                                    onClick={() => {
                                      subItem.action();
                                      setActiveDropdown(null);
                                      setHoveredSubmenu(null);
                                    }}>
                                    {subItem.name}
                                  </div>
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}

              {/* Settings Dropdown Menu */}
              {item.name === "Settings" && activeDropdown === "Settings" && (
                <div
                  className="absolute top-full left-0 mt-1 min-w-[220px] w-auto bg-[#2a1f4b] border border-gray-600 rounded-lg shadow-xl z-50"
                  onMouseLeave={() => setActiveDropdown(null)}
                  data-testid="dropdown-settings">
                  {settingsMenuItems.map((menuItem: any, index: number) => (
                    <div key={menuItem.name} className="relative">
                      <div
                        className={`flex items-center justify-between px-5 py-3 text-sm text-gray-300 hover:bg-[#8356F3] hover:text-white cursor-pointer transition-colors min-w-0 ${index === 0 ? "rounded-t-lg" : ""} ${index === settingsMenuItems.length - 1 ? "rounded-b-lg" : ""}`}
                        onClick={() => {
                          if (menuItem.action) menuItem.action();
                        }}
                        data-testid={`settings-menu-${menuItem.name.toLowerCase().replace(/\s+/g, "-")}`}>
                        <span className="flex-shrink-0">{menuItem.name}</span>
                        {menuItem.shortcut && (
                          <span className={`text-xs text-gray-500 font-mono ml-4 ${menuItem.shortcut === 'coming soon' ? 'font-bold' : ''}`}>
                            {menuItem.shortcut}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between flex-1">
          {/* Center Section with Undo/Redo and Record */}
          <div className="flex items-center space-x-4 mx-auto">
            {/* Undo/Redo Controls */}
            <div className="flex items-center space-x-3 h-12">
              <div className="w-px h-12 bg-purple-500" />
              <div className="flex items-center space-x-2">
                <button
                  onClick={performUndo}
                  disabled={actionHistoryIndex < 0}
                  className={`p-1 rounded transition-colors ${actionHistoryIndex < 0 ? "text-gray-500 cursor-not-allowed" : "text-gray-300 hover:text-white hover:bg-gray-700"}`}
                  title="Undo (Ctrl+Z)">
                  <UndoIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={performRedo}
                  disabled={actionHistoryIndex >= actionHistory.length - 1}
                  className={`p-1 rounded transition-colors ${actionHistoryIndex >= actionHistory.length - 1 ? "text-gray-500 cursor-not-allowed" : "text-gray-300 hover:text-white hover:bg-gray-700"}`}
                  title="Redo (Ctrl+Y or Ctrl+Shift+Z)">
                  <UndoIcon className="w-5 h-5 scale-x-[-1]" />
                </button>
              </div>
              <div className="w-px h-12 bg-purple-500" />
            </div>

            {/* Record Button */}
            <div className="relative flex items-center space-x-2">
              <button
                onClick={isRecording ? undefined : startRecording}
                className="bg-white text-purple-800 px-4 py-2 rounded-lg flex items-center space-x-2 text-sm font-medium hover:bg-gray-100">
                <div
                  className={`w-3 h-3 bg-red-500 rounded-full ${isRecording ? "animate-beep" : ""}`}
                />
                <span>
                  {isRecording
                    ? `Recording ${formatRecordingTime(recordingTime)}`
                    : "Record"}
                </span>
              </button>

              {/* Dropdown Arrow - Only show when recording */}
              {recordingDropdownOpen && (
                <button
                  onClick={() =>
                    setShowRecordingControls(!showRecordingControls)
                  }
                  className="text-gray-300 hover:text-white p-1 rounded transition-colors">
                  <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${showRecordingControls ? "rotate-180" : ""}`}
                  />
                </button>
              )}

              {/* Recording Controls Dropdown */}
              {recordingDropdownOpen && showRecordingControls && (
                <div className="absolute top-full -left-4 mt-2 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg z-50 min-w-[200px]">
                  <div className="p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-white text-sm font-medium pt-[4px] pb-[4px]">
                        Recording Sermon
                      </span>
                    </div>
                    <div className="flex items-center justify-center space-x-4">
                      {isPaused ? (
                        <button
                          onClick={resumeRecording}
                          className="w-10 h-10 rounded-full bg-green-600/20 hover:bg-green-600/40 text-green-400 hover:text-green-300 transition-colors flex items-center justify-center"
                          title="Resume">
                          <PlayIcon className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          onClick={pauseRecording}
                          className="w-10 h-10 rounded-full bg-yellow-600/20 hover:bg-yellow-600/40 text-yellow-400 hover:text-yellow-300 transition-colors flex items-center justify-center"
                          title="Pause">
                          <PauseIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={stopRecording}
                        className="w-10 h-10 rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 hover:text-red-300 transition-colors flex items-center justify-center"
                        title="Stop">
                        <StopCircleIcon className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div
                          className={`w-2 h-2 rounded-full ${isRecording && !isPaused ? "bg-red-500 animate-beep" : isPaused ? "bg-yellow-500" : "bg-gray-500"}`}
                        />
                        <span className="text-gray-300 text-xs">
                          {isPaused
                            ? "Paused"
                            : isRecording
                              ? "Recording..."
                              : "Stopped"}
                        </span>
                      </div>
                      <div className="text-cyan-400 text-xs font-mono">
                        {formatRecordingTime(recordingTime)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Section */}
          <div className="flex items-center space-x-4">
            {/* Build/Preview Toggle */}
            <div className="flex items-center space-x-3">
              <span
                className={`text-sm ${isBuildMode ? "text-pink-500" : "text-gray-400"}`}>
                Build
              </span>
              <Switch
                checked={!isBuildMode}
                onCheckedChange={(checked) => {
                  if (isLive) return;
                  setIsBuildMode(!checked);
                  setIsInPreview(checked);
                }}
                disabled={isLive}
                className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-[#34383b]"
              />
              <span
                className={`text-sm ${!isBuildMode ? "text-white" : "text-gray-400"}`}>
                {isLive ? "Live" : "Preview"}
              </span>
            </div>

            {/* Live Console Button - Only active when live */}
            <div className="relative" data-live-console>
              <button
                onClick={() => {
                  if (isLive) {
                    if (!isLiveConsoleOpen) {
                      setDisplayMode("slides");
                    }
                    setIsLiveConsoleOpen(!isLiveConsoleOpen);
                  }
                }}
                disabled={!isLive}
                className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${!isLive ? "bg-gray-600 cursor-not-allowed opacity-50" : isLiveConsoleOpen ? "bg-[#6a45d1] ring-2 ring-purple-400" : "bg-[#8356F3] hover:bg-[#7347e6]"}`}>
                <img
                  src={qworshipLogo}
                  alt="Q-worship"
                  className={`w-5 h-5 object-contain ${!isLive ? "opacity-50" : ""}`}
                />
                <span
                  className={`text-sm font-medium ${!isLive ? "text-gray-400" : "text-white"}`}>
                  Live Console
                </span>
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${!isLive ? "text-gray-400" : "text-white"} ${isLiveConsoleOpen ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* GO LIVE Button */}
            <Button
              variant="outline"
              onClick={isLive ? exitLive : goLive}
              className={`${isLive ? "border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30 animate-pulse" : "border-[#8356F3] bg-transparent text-white hover:bg-[#8356F3]"} px-6 transition-colors`}>
              <div className="flex items-center space-x-2">
                {isLive && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                <span>{isLive ? "EXIT LIVE" : "GO LIVE"}</span>
              </div>
            </Button>

            {/* User Profile Dropdown */}
            {(() => {
              const userObj = (currentUser as any)?.user || currentUser;
              const getUserInitials = (u: any) => {
                if (!u) return "U";
                if (u.firstName || u.lastName) {
                  return `${u.firstName?.[0] || ""}${u.lastName?.[0] || ""}`.toUpperCase();
                }
                if (u.username) return u.username[0].toUpperCase();
                if (u.email) return u.email[0].toUpperCase();
                return "U";
              };
              const getUserDisplayName = (u: any) => {
                if (!u) return "User";
                const fullName = `${u.firstName || ""} ${u.lastName || ""}`.trim();
                if (fullName) return fullName;
                if (u.username) return u.username;
                if (u.email) return u.email.split('@')[0];
                return "User";
              };
              
              const initials = getUserInitials(userObj);
              const displayName = getUserDisplayName(userObj);
              const displayEmail = userObj?.email || "No email";
              const rawProfilePic = userObj?.profilePicture;

              const getProfilePictureSrc = (pic: string | null | undefined) => {
                if (!pic) return undefined;
                if (pic.startsWith('http') || pic.startsWith('/')) return pic;
                return `/api/user-media-assets/${pic}/file`; // Map legacy DB string IDs directly dynamically.
              };
              
              const profilePic = getProfilePictureSrc(rawProfilePic);
              
              return (
                <Popover
                  open={isProfileMenuOpen}
                  onOpenChange={setIsProfileMenuOpen}>
              <PopoverTrigger asChild>
                <button className="relative">
                  <Avatar className="w-8 h-8 hover:ring-2 hover:ring-purple-400 transition-all bg-gray-800">
                    {profilePic && (
                      <img src={profilePic} alt="Profile" className="object-cover h-full w-full rounded-full" />
                    )}
                    <AvatarFallback className="bg-purple-300 text-purple-800">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </Badge>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 bg-[#1a0f2e] border border-gray-600 shadow-lg">
                <div className="space-y-4">
                  {/* Profile Header */}
                  <div className="flex items-center space-x-3 pb-3 border-b border-gray-600">
                    <Avatar className="w-10 h-10 bg-gray-800">
                      {profilePic && (
                        <img src={profilePic} alt="Profile" className="object-cover h-full w-full rounded-full" />
                      )}
                      <AvatarFallback className="bg-purple-300 text-purple-800">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-white font-medium">
                        {displayName}
                      </div>
                      <div className="text-gray-400 text-sm">
                        {displayEmail}
                      </div>
                    </div>
                  </div>

                  {/* Notifications Section */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">Notifications</h4>
                      {unreadCount > 0 && (
                        <Badge
                          variant="secondary"
                          className="text-xs bg-gray-700 text-gray-300">
                          {unreadCount} new
                        </Badge>
                      )}
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${notification.read ? "hover:bg-gray-700 opacity-75" : "hover:bg-gray-700 border-l-2 border-blue-400"} border border-gray-700`}
                          onClick={() =>
                            markNotificationAsRead(notification.id)
                          }>
                          <div className="flex items-start space-x-3">
                            {getNotificationIcon(notification.type)}
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-white">
                                {notification.title}
                              </div>
                              <div className="text-xs text-gray-400 truncate mt-1">
                                {notification.message}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                {formatTimestamp(notification.timestamp)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator className="bg-gray-600" />

                  {/* Menu Items */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsProfileSettingsOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors text-white">
                      <UserIcon className="h-4 w-4" />
                      <span className="text-sm">Profile Settings</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsSubscriptionOpen(true);
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors text-white">
                      <CreditCard className="h-4 w-4" />
                      <span className="text-sm">Subscription</span>
                    </button>
                    <button
                      onClick={() => {
                        window.location.href = "/dashboard-help";
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-700 rounded-lg transition-colors text-white">
                      <HelpCircle className="h-4 w-4" />
                      <span className="text-sm">Help &amp; Support</span>
                    </button>
                  </div>

                  <Separator className="bg-gray-600" />

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-red-600/20 rounded-lg transition-colors text-red-400">
                    <LogOut className="h-4 w-4" />
                    <span className="text-sm">Sign Out</span>
                  </button>
                </div>
              </PopoverContent>
            </Popover>
            );
            })()}
          </div>
        </div>
      </nav>
    </div>
  );
}
