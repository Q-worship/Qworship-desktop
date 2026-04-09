import {
  PlusIcon,
  SearchIcon,
  XIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  SettingsIcon,
  UndoIcon,
  RedoIcon,
  ChevronLeftIcon,
  Bell,
  CheckCircle,
  Mic,
  Music,
  BookOpen,
  Book,
  RotateCcw,
  Volume2,
  Palette,
  Play,
  Image,
  Globe,
  LinkIcon,
  SidebarOpen,
  SidebarClose,
  AlertTriangle,
} from "lucide-react";
// import { isAuthError } from "@/shared/utils/errorHandler";
import { isAuthError } from "@/utils/errorHandler";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/features/auth/auth.store";
import type { MediaAsset, User, Slide, Presentation, Song } from "@/types";
import qworshipLogo from "@assets/Group 1_1754122708985.png";
import qworshipLogoEdit from "@assets/Frame 2085662258_1754172975921.png";
import { ProfileSettings } from "@/features/dashboard/components/ProfileSettings";
import { SubscriptionManagement } from "@/features/dashboard/components/SubscriptionManagement";
import { SongbookModal } from "@/features/dashboard/components/SongbookModal";
import { SongSearchModal } from "@/features/dashboard/components/SongSearchModal";
import { useDebounce } from "@/hooks/use-debounce";
import { SongEditorModal } from "@/features/dashboard/components/SongEditorModal";
import { ImportFilesModal } from "@/features/dashboard/components/modals/ImportFilesModal";
import { StylesDropdown } from "@/features/dashboard/components/StylesDropdown";
import { useBibleProjectionStore } from "@/stores/useBibleProjectionStore";
import { useDisplayModeStore } from "@/stores/useDisplayModeStore";
import { useLowerThirdStore } from "@/stores/useLowerThirdStore";
import {
  useMainPresentationStore,
  setMPUserIdImmediate,
} from "@/stores/useMainPresentationStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSongs } from "@/features/songs/api/useSongs";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";
import { Switch } from "@/components/ui/switch";
import { HandsfreeBibleWidget } from "@/features/dashboard/components/HandsfreeBibleWidget";
import { OnScreenBibleEditor } from "@/features/dashboard/components/OnScreenBibleEditor";
import { useToast } from "@/hooks/use-toast";
import { useAudioDevices } from "@/hooks/use-audio-devices";
import { useRecordingManager } from "@/features/dashboard/hooks/useRecordingManager";
import { useLivePresentation } from "@/features/dashboard/hooks/useLivePresentation";
import { useProjectManager } from "@/features/dashboard/hooks/useProjectManager";
import { useProjectMutations } from "@/features/dashboard/hooks/useProjectMutations";
import {
  useHistoryManager,
  getServiceSectionKey,
} from "@/features/dashboard/hooks/useHistoryManager";
import { useWysiwygEditor } from "@/features/dashboard/hooks/useWysiwygEditor";
import { useHandsfreeBible } from "@/features/dashboard/hooks/useHandsfreeBible";
import { CloudMediaTab } from "@/features/dashboard/components/CloudMediaTab";
import { MyMediaTab } from "@/features/dashboard/components/MyMediaTab";
import { BackgroundAssetsModal } from "@/features/dashboard/components/modals/BackgroundAssetsModal";
import { NewPresentationModal } from "@/features/dashboard/components/modals/NewPresentationModal";
import { ServiceSectionsSidebar } from "@/features/dashboard/components/ServiceSectionsSidebar";
import { AppHeader } from "@/features/dashboard/components/AppHeader";
import { SecondaryToolbar } from "@/features/dashboard/components/SecondaryToolbar";
import { ModalsContainer } from "@/features/dashboard/components/ModalsContainer";
import {
  useDashboardUI,
  DashboardUIProvider,
} from "@/features/dashboard/providers/DashboardUIProvider";
import {
  useDashboardModals,
  DashboardModalProvider,
} from "@/features/dashboard/providers/DashboardModalProvider";
import {
  useDashboardPresentation,
  DashboardPresentationProvider,
} from "@/features/dashboard/providers/DashboardPresentationProvider";
import { DashboardMainWorkspace } from "@/features/dashboard/components/DashboardMainWorkspace";

// CloudMediaTab, MyMediaTab, and MediaBrowserContent are imported from ../components/

export const QworshipHomeV2Base = (): JSX.Element => {
  // Fetch current user data for profile display with error handling
  const {
    data: currentUserResponse,
    isLoading: isUserLoading,
    error: userError,
  } = useQuery<{ success: boolean; user: User }>({
    queryKey: ["/api/user/current"],
    retry: (failureCount, error: unknown) => {
      if (isAuthError(error)) return false;
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  const { toast } = useToast();
  const {
    devices: audioDevices,
    selectedDeviceId: selectedAudioDeviceId,
    getSelectedDevice,
    hasPermission: hasAudioPermission,
    requestPermission: requestAudioPermission,
    isLoading: audioDevicesLoading,
    error: audioDevicesError,
    selectDevice: selectAudioDevice,
    refreshDevices: refreshAudioDevices,
  } = useAudioDevices();

  // Zustand store for cross-window Bible projection sync
  const {
    setVerse: setZustandVerse,
    clearProjection: clearZustandProjection,
    setBibleVersion: setZustandBibleVersion,
  } = useBibleProjectionStore();

  // Display mode store for automatic mode switching
  const { setMode: setDisplayMode } = useDisplayModeStore();

  // Lower Third store — register userId and auto-forward HFB projections to OBS
  const {
    setUserId: ltSetUserId,
    projectScripture: ltProjectScripture,
    projectLyric: ltProjectLyric,
    projectAnnouncement: ltProjectAnnouncement,
    clearActiveData: ltClear,
    enabled: ltEnabled,
  } = useLowerThirdStore();

  // Main Presentation store — mirrors lower-third pushes to the main presentation overlay
  const {
    setUserId: mpSetUserId,
    projectScripture: mpProjectScripture,
    projectLyric: mpProjectLyric,
    projectAnnouncement: mpProjectAnnouncement,
    clearActiveData: mpClear,
    enabled: mpEnabled,
  } = useMainPresentationStore();

  // Register the current user's ID so the OBS render URL is unique per user.
  // Raw query response is { success, user: { id } }
  const currentUserId = currentUserResponse?.user?.id as
    | string
    | number
    | undefined;

  // Set MP userId at render time so pushToServer works even before the useEffect fires
  setMPUserIdImmediate(currentUserId != null ? String(currentUserId) : null);

  useEffect(() => {
    if (currentUserId) {
      ltSetUserId(currentUserId);
      mpSetUserId(String(currentUserId));
    }
  }, [currentUserId]);

  // Forward Hands-free Bible projections to the Lower Third OBS overlay.
  // Only project/clear on actual isProjecting TRANSITIONS — never clear when
  // the store was already idle (prevents verse searches and sync events from
  // wiping a live lower-third that was set by the Bible editor or song panel).
  useEffect(() => {
    let prevProjecting =
      useBibleProjectionStore.getState().isProjecting &&
      !!useBibleProjectionStore.getState().currentVerse;

    const unsubscribe = useBibleProjectionStore.subscribe((state) => {
      const nowProjecting = state.isProjecting && !!state.currentVerse;

      if (nowProjecting) {
        const versionKey = (
          state.bibleVersion ?? "kjv"
        ).toLowerCase() as keyof typeof state.currentVerse;
        const verseText =
          (state.currentVerse![versionKey] as string | undefined) ??
          state.currentVerse!.kjv ??
          "";
        const ref = state.formattedReference ?? "";
        const ver = state.bibleVersion ?? "KJV";
        // Pass currentUser?.id directly so pushToServer gets userId even
        // before the setUserId useEffect has had a chance to fire.
        if (ltEnabled) {
          ltProjectScripture(verseText, ref, ver, currentUserId);
        }
        if (mpEnabled) {
          mpProjectScripture(verseText, ref, ver, currentUserId != null ? String(currentUserId) : null);
        }
      } else if (!nowProjecting && prevProjecting) {
        if (ltEnabled) ltClear(currentUserId);
        if (mpEnabled) mpClear(currentUserId != null ? String(currentUserId) : null);
      }

      prevProjecting = nowProjecting;
    });
    return unsubscribe;
  }, [ltEnabled, ltProjectScripture, ltClear, mpEnabled, mpProjectScripture, mpClear, currentUserId]);
  const [, setLocation] = useLocation();
  const {
    activeTab,
    setActiveTab,
    isFullscreen,
    setIsFullscreen,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    activeMediaTab,
    setActiveMediaTab,
    isLiveMode,
    setIsLiveMode,
  } = useDashboardUI();

  const {
    isSlideEditorOpen,
    setIsSlideEditorOpen,
    isCalendarOpen,
    setIsCalendarOpen,
    isVoiceMenuOpen,
    setIsVoiceMenuOpen,
    isListeningDropdownOpen,
    setIsListeningDropdownOpen,
    isLiveConsoleOpen,
    setIsLiveConsoleOpen,
    isBiblePreferencesOpen,
    setIsBiblePreferencesOpen,
    isSearchModalOpen,
    setIsSearchModalOpen,
    isSettingsOpen,
    setIsSettingsOpen,
    showAssetsModal,
    setShowAssetsModal,
    showImportModal,
    setShowImportModal,
    showSongbook,
    setShowSongbook,
    isStylesDropdownOpen,
    setIsStylesDropdownOpen,
    isBackgroundDropdownOpen,
    setIsBackgroundDropdownOpen,
    isMediaBrowserOpen,
    setIsMediaBrowserOpen,
    isImportImageOpen,
    setIsImportImageOpen,
    isBackgroundAssetsModalOpen,
    setIsBackgroundAssetsModalOpen,
    isNewPresentationModalOpen,
    setIsNewPresentationModalOpen,
    isIntegrationsModalOpen,
    setIsIntegrationsModalOpen,
    isPreferencesModalOpen,
    setIsPreferencesModalOpen,
    isDisplaySettingsModalOpen,
    setIsDisplaySettingsModalOpen,
    isAccountSettingsModalOpen,
    setIsAccountSettingsModalOpen,
    isAudioSettingsModalOpen,
    setIsAudioSettingsModalOpen,
    isOpenModalOpen,
    setIsOpenModalOpen,
    isDeleteModalOpen,
    setIsDeleteModalOpen,
    isDuplicateModalOpen,
    setIsDuplicateModalOpen,
    isDuplicateRecentOpen,
    setIsDuplicateRecentOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    isRestoreModalOpen,
    setIsRestoreModalOpen,
    isImportModalOpen,
    setIsImportModalOpen,
  } = useDashboardModals();

  const liveWindowRef = useRef<Window | null>(null); // Ref to avoid stale closure in speech recognition
  const {
    serviceItems,
    setServiceItems,
    slides,
    totalSlides,
    currentSlide,
    setCurrentSlide,
    selectedSlide,
    setSelectedSlide,
    selectedMediaAsset,
    setSelectedMediaAsset,
    activeFilters,
    setActiveFilters,
    slideTransparency,
    setSlideTransparency,
    slideTextSize,
    setSlideTextSize,
    logoSettings,
    setLogoSettings,
    transitionEffect,
    setTransitionEffect,
  } = useDashboardPresentation();

  // Slide Editor State (selectedSlide migrated)
  // Modal hooks migrated to Context
  const [selectedDate, setSelectedDate] = useState(new Date(2025, 4, 25)); // May 25, 2025 (Sunday)
  const [currentMonth, setCurrentMonth] = useState(new Date(2025, 4, 1)); // May 2025
  const [selectedBibleMode, setSelectedBibleMode] = useState(
    "Classic Hands-free Bible",
  );
  const [isSuggestedItemsVisible, setIsSuggestedItemsVisible] = useState(true);
  const [isAddItemVisible, setIsAddItemVisible] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    "PRE-SERVICE ITEMS": true,
    "WARM - UP": true,
    "SERVICE ITEMS": true,
    "POST SERVICE LOOP": true,
  });

  // Sidebar collapse state for expanded view
  // (Migrated to Context)

  // isSettingsOpen migrated to Context

  // Song search state
  const [songSearchTerm, setSongSearchTerm] = useState<string>("");
  const [filteredSongs, setFilteredSongs] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  // isSearchModalOpen migrated to context
  const [currentSongTitle, setCurrentSongTitle] = useState("");

  // Live Settings State - for presentation controls
  // slideTransparency, slideTextSize, logoSettings migrated
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(false);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(5);
  // transitionEffect migrated
  const [showTimestamp, setShowTimestamp] = useState(false);
  const [timestampPosition, setTimestampPosition] = useState("bottom-left");

  // Bible Widget State - for persistent scripture navigation
  const [bibleWidgetVisible, setBibleWidgetVisible] = useState(false);
  const [bibleWidgetPosition, setBibleWidgetPosition] = useState({
    x: 100,
    y: 100,
  });
  const [currentVerse, setCurrentVerse] = useState(1);
  const [currentBook, setCurrentBook] = useState("Genesis");
  const [currentChapter, setCurrentChapter] = useState(1);
  const [bibleWidgetDragMode, setBibleWidgetDragMode] = useState(false);

  // Additional UI and content state for persistence
  const [activeServiceItem, setActiveServiceItem] = useState<
    string | number | null
  >(null);
  const [editorContent, setEditorContent] = useState<any>(null);
  // selectedMediaAsset, activeFilters migrated
  // isLiveMode migrated to context
  const [showSettings, setShowSettings] = useState(false);
  // Modals migrated to context

  // Enhanced song editor state
  const [showAuthorOnScreen, setShowAuthorOnScreen] = useState(false);
  const [songArrangement, setSongArrangement] = useState(["V1", "V2", "C"]);
  const [parsedLyrics, setParsedLyrics] = useState<{ [key: string]: string }>(
    {},
  );
  const [hoveredArrangementButton, setHoveredArrangementButton] = useState<
    number | null
  >(null);

  // Visual styles dropdown state
  // isStylesDropdownOpen migrated
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const stylesButtonRef = useRef<HTMLButtonElement>(null);

  // Background dropdown state
  // isBackgroundDropdownOpen migrated
  const [selectedBackgroundType, setSelectedBackgroundType] = useState<
    "none" | "gradient" | "fill" | "media"
  >("none");
  // isMediaBrowserOpen migrated
  // isImportImageOpen migrated

  // Background assets modal state - using Background Implementation 1
  // isBackgroundAssetsModalOpen migrated
  const [backgroundModalMode, setBackgroundModalMode] = useState<
    "browse" | "import"
  >("browse");

  // Filter states for media browser
  const [mediaSearchQuery, setMediaSearchQuery] = useState("");
  const [mediaTypeFilters, setMediaTypeFilters] = useState<string[]>([]);
  const [mediaCategoryFilters, setMediaCategoryFilters] = useState<string[]>(
    [],
  );
  const [mediaTagFilters, setMediaTagFilters] = useState<string[]>([]);

  // Media browser tab state
  // activeMediaTab migrated to context

  // Track recently uploaded media for preselection
  const [recentlyUploadedMediaId, setRecentlyUploadedMediaId] = useState<
    number | null
  >(null);

  // New Presentation modal state
  // isNewPresentationModalOpen migrated
  const [newPresentationName, setNewPresentationName] = useState("");
  const [newPresentationDate, setNewPresentationDate] = useState("");

  // Integrations modal state
  // isIntegrationsModalOpen, isPreferencesModalOpen, isDisplaySettingsModalOpen migrated
  // isAccountSettingsModalOpen, isAudioSettingsModalOpen migrated

  // Check URL query params to open integrations modal from external navigation
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("openIntegrations") === "true") {
      setIsIntegrationsModalOpen(true);
      // Clean up the URL to remove the query parameter
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  // Open Projects Modal states
  // isOpenModalOpen migrated
  const [projectSearchQuery, setProjectSearchQuery] = useState("");
  const [projectSortBy, setProjectSortBy] = useState("lastModified");

  // Delete Confirmation Modal states
  // isDeleteModalOpen migrated
  const [projectToDelete, setProjectToDelete] = useState<{
    id: string | number;
    name: string;
  } | null>(null);

  // Projects Menu functionality states
  // isDuplicateModalOpen, isDuplicateRecentOpen, isBackupModalOpen, isRestoreModalOpen, isImportModalOpen migrated
  const [selectedPresentationToDuplicate, setSelectedPresentationToDuplicate] =
    useState<Presentation | null>(null);
  const [projectSortOrder, setProjectSortOrder] = useState<"asc" | "desc">(
    "desc",
  );
  const [projectViewMode, setProjectViewMode] = useState<"grid" | "list">(
    "list",
  );
  // Fetch user presentations from API
  const {
    data: presentationsData,
    isLoading: isPresentationsLoading,
    refetch: refetchPresentations,
  } = useQuery<{ presentations: Presentation[] }>({
    queryKey: ["/api/presentations"],
    retry: (failureCount, error: any) => {
      // Don't retry if it's an authentication error
      if (
        error?.message?.includes("401") ||
        error?.message?.includes("Not authenticated")
      ) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: 1000,
  });

  const savedProjects = presentationsData?.presentations || [];
  // Get presentation info from session storage (set by ProjectSelection component)
  const [currentPresentationName, setCurrentPresentationName] = useState(() => {
    return (
      sessionStorage.getItem("qworship_current_presentation_name") ||
      "New Presentation"
    );
  });
  const [currentPresentationId, setCurrentPresentationId] = useState<
    string | number | null
  >(() => {
    return sessionStorage.getItem("qworship_current_presentation_id") || null;
  });

  const {
    isEditingProjectName,
    setIsEditingProjectName,
    editingProjectName,
    setEditingProjectName,
    projectNameInputRef,
    editingModalProjectId,
    setEditingModalProjectId,
    editingModalProjectName,
    setEditingModalProjectName,
    modalProjectNameInputRef,
    startEditingProjectName,
    saveProjectName,
    cancelEditingProjectName,
    handleProjectNameKeyDown,
    startEditingModalProjectName,
    saveModalProjectName,
    cancelEditingModalProjectName,
    handleModalProjectNameKeyDown,
  } = useProjectManager({
    currentPresentationId,
    currentPresentationName,
    savedProjects,
    updatePresentationName: (presentationId, name) => {
      updatePresentationNameMutation.mutate({ presentationId, name });
    },
  });

  // Modal calendar state
  const [isModalCalendarOpen, setIsModalCalendarOpen] = useState(false);
  const [modalSelectedDate, setModalSelectedDate] = useState<Date>(() => {
    // Calculate the next coming Sunday
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(
      today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
    );
    return nextSunday;
  });
  const [modalCurrentMonth, setModalCurrentMonth] = useState(() => {
    const today = new Date();
    const daysUntilSunday = (7 - today.getDay()) % 7;
    const nextSunday = new Date(today);
    nextSunday.setDate(
      today.getDate() + (daysUntilSunday === 0 ? 7 : daysUntilSunday),
    );
    return new Date(nextSunday.getFullYear(), nextSunday.getMonth(), 1);
  });

  // Fetch user media assets to extract tags dynamically
  const { data: userMediaAssets = [] } = useQuery<
    MediaAsset[] | { assets: MediaAsset[] }
  >({
    queryKey: ["/api/user-media-assets"],
    enabled: activeMediaTab === "my", // Only fetch when MY MEDIA tab is active
    retry: false,
  });

  // Extract unique tags from user media assets
  const getUserMediaTags = () => {
    // Handle both direct array and nested API response structure
    const assets = Array.isArray(userMediaAssets)
      ? userMediaAssets
      : userMediaAssets?.assets;
    if (!assets || !Array.isArray(assets)) {
      return [];
    }

    const allTags: string[] = [];
    assets.forEach((asset: any) => {
      if (asset.tags && Array.isArray(asset.tags)) {
        allTags.push(...asset.tags);
      }
    });

    // Return unique tags, sorted alphabetically
    return Array.from(new Set(allTags)).sort();
  };

  // Clear media tag filters when switching between tabs to prevent confusion
  useEffect(() => {
    setMediaTagFilters([]);
  }, [activeMediaTab]);

  // Close modal calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isModalCalendarOpen) {
        // Check if the click target is inside the calendar dropdown or date button
        const target = event.target as Node;
        const calendarDropdown = document.querySelector(
          ".modal-calendar-dropdown",
        );
        const dateButton = document.querySelector(".modal-date-button");

        if (
          calendarDropdown &&
          !calendarDropdown.contains(target) &&
          dateButton &&
          !dateButton.contains(target)
        ) {
          setIsModalCalendarOpen(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalCalendarOpen]);

  // Item-specific backgrounds - tracks background for each service item
  const [itemBackgrounds, setItemBackgrounds] = useState<
    Record<
      string,
      {
        type: "none" | "gradient" | "fill" | "image" | "video";
        value: string;
        name?: string;
      }
    >
  >({});

  // Predefined gradient backgrounds
  const gradientBackgrounds = [
    {
      id: "gradient-1",
      name: "No image",
      gradient: "#ffffff",
      preview: "#ffffff",
    },
    {
      id: "gradient-2",
      name: "Light Gray",
      gradient: "#e5e7eb",
      preview: "#e5e7eb",
    },
    {
      id: "gradient-3",
      name: "Medium Gray",
      gradient: "#9ca3af",
      preview: "#9ca3af",
    },
    {
      id: "gradient-4",
      name: "Dark Gray",
      gradient: "#6b7280",
      preview: "#6b7280",
    },
    { id: "gradient-5", name: "Teal", gradient: "#14b8a6", preview: "#14b8a6" },
    { id: "gradient-6", name: "Blue", gradient: "#3b82f6", preview: "#3b82f6" },
    { id: "gradient-7", name: "Red", gradient: "#ef4444", preview: "#ef4444" },
    { id: "gradient-8", name: "Cyan", gradient: "#06b6d4", preview: "#06b6d4" },
  ];

  // Fill color backgrounds
  const fillColorBackgrounds = [
    { id: "fill-1", name: "White", color: "#ffffff" },
    { id: "fill-2", name: "Black", color: "#000000" },
    { id: "fill-3", name: "Light Gray", color: "#f3f4f6" },
    { id: "fill-4", name: "Gray", color: "#9ca3af" },
    { id: "fill-5", name: "Dark Gray", color: "#4b5563" },
    { id: "fill-6", name: "Red", color: "#dc2626" },
    { id: "fill-7", name: "Orange", color: "#ea580c" },
    { id: "fill-8", name: "Yellow", color: "#ca8a04" },
    { id: "fill-9", name: "Green", color: "#16a34a" },
    { id: "fill-10", name: "Blue", color: "#2563eb" },
    { id: "fill-11", name: "Purple", color: "#9333ea" },
  ];

  // Get current item ID (based on selected slide or current slide)
  const getCurrentItemId = () => {
    if (selectedSlide?.itemId) {
      return selectedSlide.itemId;
    }

    // Find item containing current slide
    const currentSlideData = slides[currentSlide - 1];
    if (currentSlideData) {
      const parentItem = serviceItems.find((item) =>
        item.slides.some((s: any) => s.id === currentSlideData.id),
      );
      const itemId = parentItem?.id || "default";
      return itemId;
    }

    // If no current slide, use the first service item if available
    if (serviceItems.length > 0) {
      const firstItemId = serviceItems[0].id;
      return firstItemId;
    }

    return "default";
  };

  // Get background for a specific item
  const getItemBackground = (itemId: string) => {
    const background = itemBackgrounds[itemId] || {
      type: "fill",
      value: "#000000",
    };

    return background;
  };

  // Apply background to specific item
  const applyBackgroundToCurrentItem = (background: {
    type: "none" | "gradient" | "fill" | "image" | "video";
    value: string;
    name?: string;
  }) => {
    const currentItemId = getCurrentItemId();

    // Update item-specific background
    setItemBackgrounds((prev) => {
      const updated = {
        ...prev,
        [currentItemId]: background,
      };
      return updated;
    });

    // Update live presentation window with new background
    if (liveWindow && !liveWindow.closed) {
      liveWindow.postMessage(
        {
          type: "BACKGROUND_UPDATE",
          data: {
            background: background,
            itemId: currentItemId,
          },
        },
        window.location.origin,
      );
    }

    // Find item title for better toast message
    const currentItem = serviceItems.find((item) => item.id === currentItemId);
    const itemTitle = currentItem ? currentItem.title : "current item";

    // Show confirmation toast
    toast({
      title: "Background updated",
      description: `Applied ${background.name || background.type} background to "${itemTitle}"`,
      className: "bg-purple-600 border-purple-400 text-white",
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isStylesDropdownOpen && !target.closest(".styles-dropdown")) {
        setIsStylesDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isStylesDropdownOpen]);

  // Calculate dropdown position when opening
  const handleStylesClick = () => {
    if (!isStylesDropdownOpen && stylesButtonRef.current) {
      const rect = stylesButtonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
      });
    }
    setIsStylesDropdownOpen(!isStylesDropdownOpen);
  };

  const handsfreeBibleButtonRef = React.useRef<HTMLButtonElement>(null);

  // Recording state

  // Slide interaction handlers
  const handleSlideClick = (slide: Slide, slideIndex: number) => {
    // Find the service item that contains this slide
    const parentItem = serviceItems.find((item) =>
      item.slides.some((s: any) => s.id === slide.id),
    );

    if (parentItem) {
      // For song items, route to Song Editor 1 instead of slide editor modal
      if (parentItem.type === "song") {
        // Set editing content to show Song Editor 1
        setEditingContent(parentItem);
        setSelectedContentType("song");

        // Initialize song title if it's a generic song
        if (parentItem.title === "Song") {
          setCurrentSongTitle("");
        } else {
          setCurrentSongTitle(parentItem.title || "");
        }

        // Clear slide editor state
        setSelectedSlide(null);
        setIsSlideEditorOpen(false);
      } else {
        // For non-song items, use the existing slide editor modal
        setSelectedSlide({
          slideId: slide.id,
          itemId: parentItem.id,
          slide: slide,
          item: parentItem,
        });

        // Open slide editor in Edit & Preparation section
        setIsSlideEditorOpen(true);
      }

      // Update current slide for preview
      setCurrentSlide(slideIndex + 1);

      // Notify live presentation of slide change with background information
      if (liveWindow && !liveWindow.closed) {
        const slideItemBackground = getItemBackground(parentItem.id);
        console.log("📤 SENDING SLIDE CHANGE WITH BACKGROUND to Live Window");
        console.log("🎬 Slide number:", slideIndex + 1);
        console.log("🎯 Parent item ID:", parentItem.id);
        console.log("🎨 Background data:", slideItemBackground);

        liveWindow.postMessage(
          {
            type: "SLIDE_CHANGE",
            data: {
              slideNumber: slideIndex + 1,
              background: slideItemBackground,
              itemId: parentItem.id,
            },
          },
          window.location.origin,
        );
      }

      // Switch to Edit & Preparation tab if not already there
      if (activeTab !== "Edit & Preparation") {
        setActiveTab("Edit & Preparation");
      }
    }
  };

  const handleGroupSlideClick = (itemId: string) => {
    // Find the service item
    const item = serviceItems.find((i) => i.id === itemId);
    if (item && item.slides.length > 0) {
      // For song items, route directly to Song Editor 1
      if (item.type === "song") {
        // Set editing content to show Song Editor 1
        setEditingContent(item);
        setSelectedContentType("song");

        // Initialize song title if it's a generic song
        if (item.title === "Song") {
          setCurrentSongTitle("");
        } else {
          setCurrentSongTitle(item.title || "");
        }

        // Clear slide editor state
        setSelectedSlide(null);
        setIsSlideEditorOpen(false);

        // Switch to Edit & Preparation tab if not already there
        if (activeTab !== "Edit & Preparation") {
          setActiveTab("Edit & Preparation");
        }
      } else {
        // For non-song items, use existing slide click logic
        const firstSlide = item.slides[0];
        const slideIndex = slides.findIndex((s: any) => s.id === firstSlide.id);
        handleSlideClick(firstSlide as any, slideIndex);
      }
    }
  };

  const {
    isRecording,
    setIsRecording,
    isPaused,
    setIsPaused,
    recordingTime,
    setRecordingTime,
    mediaRecorder,
    setMediaRecorder,
    recordingDropdownOpen,
    setRecordingDropdownOpen,
    recordingTimer,
    setRecordingTimer,
    showRecordingControls,
    setShowRecordingControls,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    formatRecordingTime,
  } = useRecordingManager();

  const handleEditorUndoRedo = (newContent: string) => {
    setSongEditorContent(newContent);
    if (editingContent && editingContent.type === "song") {
      const updatedSong = {
        ...editingContent.content,
        lyrics: newContent,
      };
      updateItemContent(
        editingContent.id,
        editingContent.title,
        updatedSong,
        createSlidesFromSong(updatedSong),
      );
      const sections = parseLyricsIntoSections(newContent);
      setParsedLyrics(sections);
    }
  };

  const {
    editorState,
    setEditorState,
    titleEditorState,
    setTitleEditorState,
    activeTextarea,
    setActiveTextarea,
    textAreaRef,
    titleTextAreaRef,
    editorHistory,
    setEditorHistory,
    historyIndex,
    setHistoryIndex,
    addToHistory,
    handleUndo,
    handleRedo,
    applyFormatting,
    applyTextAlign,
    insertTextAtCursor,
    applyFontSize,
    applyTextColor,
    applyFontFamily,
    applyVisualStyleToTextarea,
    applyVisualStyle,
    applyStylesToTextarea,
    applyListFormatting,
  } = useWysiwygEditor({
    onContentChange: (content, textarea) => updateContentFromTextarea(textarea),
    onUndoRedo: handleEditorUndoRedo,
  });

  const {
    isBuildMode,
    setIsBuildMode,
    isLive,
    setIsLive,
    isInPreview,
    setIsInPreview,
    liveWindow,
    setLiveWindow,
    goLive,
    exitLive,
    togglePreview,
  } = useLivePresentation({
    currentUser: currentUserResponse?.user || null,
    slides,
    totalSlides,
    titleEditorState,
    serviceItems,
    itemBackgrounds,
    currentSlide,
    setCurrentSlide,
    getItemBackground,
    getCurrentItemId,
    // onSlideProjected is intentionally left empty here.
    // Lower-third projection (ltProjectScripture / ltClear) is handled by the
    // dedicated currentSlide watcher below, which fires for BOTH dashboard-panel
    // clicks and live-window navigation. Having the logic in two places caused a
    // race condition where ltClear() from one path could wipe ltProjectScripture()
    // from the other.
    onSlideProjected: () => {},
  });

  // ── Lower Third: push current slide to OBS whenever the live slide changes ──
  // This fires for BOTH dashboard-panel clicks (which call setCurrentSlide directly)
  // AND live-window navigation (SLIDE_CHANGE_FROM_LIVE). It is the single source
  // of truth for lower-third projection during a live presentation.
  useEffect(() => {
    if (!isLive) return;

    const slide = slides[currentSlide - 1] as any;
    if (!slide) return;

    const type: string = slide.type ?? "";
    const content: string = slide.content ?? "";
    const mpUserId = currentUserId != null ? String(currentUserId) : null;

    if (type === "bible") {
      const reference: string =
        slide.bibleReference ?? slide.reference ?? slide.title ?? "";
      const version: string = slide.bibleVersion ?? slide.version ?? "KJV";
      if (ltEnabled) ltProjectScripture(content, reference, version, currentUserId);
      if (mpEnabled) mpProjectScripture(content, reference, version, mpUserId);
    } else if (type === "verse" || type === "chorus" || type === "song") {
      const label: string = slide.sectionLabel ?? slide.title ?? "";
      const songTitle: string = slide.songTitle ?? "";
      if (ltEnabled) ltProjectLyric(content, label, songTitle, currentUserId);
      if (mpEnabled) mpProjectLyric(content, label, songTitle, mpUserId);
    } else if (type === "announcement") {
      const category: string = slide.category ?? slide.title ?? "";
      const subtitle: string = slide.subtitle ?? "";
      if (ltEnabled) ltProjectAnnouncement(content, category, subtitle, currentUserId);
      if (mpEnabled) mpProjectAnnouncement(content, category, subtitle, mpUserId);
    } else {
      if (ltEnabled) ltClear(currentUserId);
      if (mpEnabled) mpClear(mpUserId);
    }
  }, [
    currentSlide,
    isLive,
    slides,
    ltEnabled,
    ltProjectScripture,
    ltProjectLyric,
    ltProjectAnnouncement,
    ltClear,
    mpEnabled,
    mpProjectScripture,
    mpProjectLyric,
    mpProjectAnnouncement,
    mpClear,
    currentUserId,
  ]);

  const {
    isHandsfreeBibleOpen,
    isWidgetVisible,
    widgetPosition,
    isDragging,
    isListeningMode,
    isSleepMode,
    microphoneStatus,
    detectedCommands,
    selectedBibleVersion,
    widgetVerseData,
    widgetFormattedReference,
    toggleHandsfreeBible,
    toggleMicrophone,
    setSelectedBibleVersion,
    handleDragStart,
    setIsListeningMode,
    setDetectedCommands,
    volume,
    executeNavigation,
  } = useHandsfreeBible({
    liveWindow,
    handsfreeBibleButtonRef,
  });

  const [showListStyleDropdown, setShowListStyleDropdown] = useState(false);
  const listDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        listDropdownRef.current &&
        !listDropdownRef.current.contains(event.target as Node)
      ) {
        setShowListStyleDropdown(false);
      }
    };

    if (showListStyleDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showListStyleDropdown]);

  // Current slide being displayed in preview
  const [currentlyDisplayedSlide, setCurrentlyDisplayedSlide] =
    useState<any>(null);

  const [songEditorContent, setSongEditorContent] = useState("");
  const [textSelection, setTextSelection] = useState({ start: 0, end: 0 });

  // Ref to track last sent payload to prevent duplicate SLIDES_SYNC messages
  const lastSentSlidesRef = useRef<string>("");

  // Sync slides and backgrounds to live presentation (core slide data only)
  // NOTE: editorState and titleEditorState are synced separately on blur/explicit save to avoid rapid updates during typing
  useEffect(() => {
    if (liveWindow && !liveWindow.closed) {
      // Create a stable hash of the full payload for comparison
      // Includes slide IDs, contents, itemId and full background data to detect all meaningful changes
      const payloadKey = JSON.stringify({
        slides: slides.map((s) => ({
          id: s.id,
          content: s.content,
          title: s.title,
          type: s.type,
          sectionLabel: s.sectionLabel,
          itemId: s.itemId,
        })),
        itemBackgrounds,
      });

      // Only send if payload has actually changed
      if (payloadKey !== lastSentSlidesRef.current) {
        lastSentSlidesRef.current = payloadKey;
        liveWindow.postMessage(
          {
            type: "SLIDES_SYNC",
            data: {
              slides,
              totalSlides,
              itemBackgrounds,
            },
          },
          window.location.origin,
        );
      }
    }
  }, [slides, totalSlides, itemBackgrounds, liveWindow]);

  // Sync editor formatting state separately with debounce (changes frequently during typing)
  const editorSyncDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (liveWindow && !liveWindow.closed) {
      // Clear any existing debounce timer
      if (editorSyncDebounceRef.current) {
        clearTimeout(editorSyncDebounceRef.current);
      }

      // Debounce editor state sync to prevent rapid firing during typing
      editorSyncDebounceRef.current = setTimeout(() => {
        liveWindow.postMessage(
          {
            type: "EDITOR_STATE_SYNC",
            data: {
              titleEditorState,
              editorState,
            },
          },
          window.location.origin,
        );
      }, 500); // 500ms debounce for editor state
    }

    return () => {
      if (editorSyncDebounceRef.current) {
        clearTimeout(editorSyncDebounceRef.current);
      }
    };
  }, [titleEditorState, editorState, liveWindow]);

  // Auto-resize all textareas when parsedLyrics or currentSongTitle changes
  useEffect(() => {
    const resizeTextareas = () => {
      const textareas = document.querySelectorAll(
        "textarea[data-section], textarea[data-title-field]",
      );
      textareas.forEach((textarea) => {
        const element = textarea as HTMLTextAreaElement;

        // Reset height to auto first
        element.style.height = "auto";
        element.style.overflow = "hidden";

        // Different minimum heights for different textarea types
        const isTitle = element.getAttribute("data-title-field") === "true";
        const minHeight = isTitle ? 48 : 128;

        // Calculate needed height with extra padding for full content visibility
        const computedHeight = Math.max(minHeight, element.scrollHeight + 16);
        element.style.height = computedHeight + "px";

        // Double-check if content is still cut off and adjust accordingly
        if (element.scrollHeight > computedHeight) {
          element.style.height = element.scrollHeight + 20 + "px";
        }
      });
    };

    // Multiple delays to ensure DOM is fully updated
    setTimeout(resizeTextareas, 100);
    setTimeout(resizeTextareas, 300);
    setTimeout(resizeTextareas, 500);
  }, [parsedLyrics, currentSongTitle]);

  // Update content from textarea to maintain synchronization
  const updateContentFromTextarea = (textarea: HTMLTextAreaElement) => {
    const content = textarea.value;

    // Find which section this textarea belongs to
    const textareaElement = textarea;
    const sectionContainer = textareaElement.closest("[data-section]");
    const sectionName = sectionContainer?.getAttribute("data-section");

    if (sectionName && parsedLyrics[sectionName] !== undefined) {
      // Update ONLY the specific section to prevent cross-contamination
      setParsedLyrics((prevLyrics) => {
        const updatedLyrics = { ...prevLyrics, [sectionName]: content };

        // Update full song content with proper isolation
        const fullLyricsText = Object.entries(updatedLyrics)
          .map(([section, text]) => `[${section}]\n${text}`)
          .join("\n\n");
        setSongEditorContent(fullLyricsText);
        addToHistory(fullLyricsText);

        // Update song content in both state systems within the same scope
        if (editingContent && editingContent.type === "song") {
          const updatedSong = {
            ...editingContent.content,
            lyrics: fullLyricsText,
          };
          updateItemContent(
            editingContent.id,
            editingContent.title,
            updatedSong,
            createSlidesFromSong(updatedSong),
          );
        }

        return updatedLyrics;
      });
    } else {
      // Update main song editor content and add to history
      setSongEditorContent(content);
      addToHistory(content);
      if (editingContent && editingContent.type === "song") {
        const updatedSong = {
          ...editingContent.content,
          lyrics: content,
        };
        updateItemContent(
          editingContent.id,
          editingContent.title,
          updatedSong,
          createSlidesFromSong(updatedSong),
        );
      }
    }
  };

  // User profile dropdown state
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isProfileSettingsOpen, setIsProfileSettingsOpen] = useState(false);
  const [isSubscriptionOpen, setIsSubscriptionOpen] = useState(false);
  const [isSongbookOpen, setIsSongbookOpen] = useState(false);
  const [isSongEditorOpen, setIsSongEditorOpen] = useState(false);
  const [importedSongData, setImportedSongData] = useState<any>(null);
  // Force cache invalidation
  const queryClient = useQueryClient();

  // Fetch songs from API instead of localStorage using FSD hook
  const {
    data: songsData,
    isLoading: isSongsLoading,
    error: songsError,
    refetch: refetchSongs,
  } = useSongs();

  // Force invalidate all songs cache on component mount
  useEffect(() => {
    queryClient.removeQueries({ queryKey: ["/api/songs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
  }, [queryClient]);

  // Extract songs from the API response structure: {success: true, songs: [...]}
  const savedSongs = songsData?.songs || [];

  const debouncedSongSearchTerm = useDebounce(songSearchTerm, 300);

  useEffect(() => {
    if (debouncedSongSearchTerm.length >= 3) {
      const searchLower = debouncedSongSearchTerm.toLowerCase();
      const songsArray = (savedSongs as any)?.songs || savedSongs || [];
      const filtered = songsArray.filter(
        (song: any) =>
          song.title?.toLowerCase().includes(searchLower) ||
          song.lyrics?.toLowerCase().includes(searchLower) ||
          song.artist?.toLowerCase().includes(searchLower) ||
          song.authors?.some((author: string) =>
            author?.toLowerCase().includes(searchLower),
          ),
      );
      setFilteredSongs(filtered);
      setShowSearchResults(true);
    } else {
      setFilteredSongs([]);
      setShowSearchResults(false);
    }
  }, [debouncedSongSearchTerm, savedSongs]);

  // Navigation menu dropdown states
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredSubmenu, setHoveredSubmenu] = useState<string | null>(null);

  // Insert item states
  const [insertedItems, setInsertedItems] = useState<any[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<string | null>(
    null,
  );
  const [editingContent, setEditingContent] = useState<any>(null);
  const [selectedServiceSection, setSelectedServiceSection] = useState<
    string | null
  >(null);
  const [sectionItems, setSectionItems] = useState<{ [key: string]: any[] }>({
    "PRE-SERVICE ITEMS": [],
    "WARM - UP": [],
    "SERVICE ITEMS": [],
    "POST SERVICE LOOP": [],
  });
  const [showSectionWarning, setShowSectionWarning] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    item: any;
    sectionName: string;
  }>({
    isOpen: false,
    item: null,
    sectionName: "",
  });

  const {
    actionHistory,
    setActionHistory,
    actionHistoryIndex,
    setActionHistoryIndex,
    recordAction,
    performUndo,
    performRedo,
  } = useHistoryManager({
    setSectionItems,
    setServiceItems,
    setInsertedItems,
    editingContent,
    setEditingContent,
    setSelectedContentType,
    setCurrentSongTitle,
  });

  // Function to show delete confirmation
  const showDeleteConfirmation = (sectionName: string, item: any) => {
    setDeleteConfirmation({
      isOpen: true,
      item,
      sectionName,
    });
  };

  // Function to remove item from service section
  const removeItemFromServiceSection = (
    sectionName: string,
    itemId: string,
  ) => {
    // Find the item being removed to store it for undo
    const itemToRemove = sectionItems[sectionName]?.find(
      (item) => item.id === itemId,
    );

    if (itemToRemove) {
      // Record the removal action for undo/redo
      recordAction({
        type: "REMOVE_ITEM",
        itemId: itemId,
        sectionName: sectionName,
        item: itemToRemove,
        description: `Remove ${itemToRemove.title || itemToRemove.type} from ${sectionName}`,
      });
    }

    setSectionItems((prev) => ({
      ...prev,
      [sectionName]: (prev[sectionName] || []).filter(
        (item) => item.id !== itemId,
      ),
    }));

    // Remove from serviceItems (which contains the slides)
    setServiceItems((prev) => prev.filter((item) => item.id !== itemId));

    // Remove from insertedItems (legacy state that shows in Edit & Preparation)
    setInsertedItems((prev) => prev.filter((item) => item.id !== itemId));

    // Clear editing state if the deleted item was being edited
    if (editingContent?.id === itemId) {
      setEditingContent(null);
      setSelectedContentType(null);
      setCurrentSongTitle("");
    }
  };

  // Function to confirm delete
  const confirmDelete = () => {
    if (deleteConfirmation.item && deleteConfirmation.sectionName) {
      removeItemFromServiceSection(
        deleteConfirmation.sectionName,
        deleteConfirmation.item.id,
      );
    }
    setDeleteConfirmation({
      isOpen: false,
      item: null,
      sectionName: "",
    });
  };

  // Function to cancel delete
  const cancelDelete = () => {
    setDeleteConfirmation({
      isOpen: false,
      item: null,
      sectionName: "",
    });
  };

  const [notifications, setNotifications] = useState([
    {
      id: "1",
      type: "success",
      title: "Recording Saved",
      message:
        "Your sermon recording has been successfully saved to your library",
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      read: false,
    },
    {
      id: "2",
      type: "info",
      title: "New Bible Version Available",
      message:
        "ESV translation has been added to your Hands-Free Bible Companion",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
      read: false,
    },
    {
      id: "3",
      type: "warning",
      title: "Storage Almost Full",
      message: "You are using 85% of your available storage space",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      read: true,
    },
  ]);
  const [unreadCount, setUnreadCount] = useState(2);

  // Unified listening state - syncs Button 1 and Hands-free Bible widget
  const toggleListening = (newState: boolean) => {
    if (newState !== isListeningMode) {
      toggleMicrophone();
    }
  };

  // Profile dropdown helper functions
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60),
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  // Slide navigation functions
  const nextSlide = () => {
    if (currentSlide < totalSlides) {
      const newSlide = currentSlide + 1;
      setCurrentSlide(newSlide);

      // Update the displayed slide content
      const slideToDisplay = slides[newSlide - 1];
      if (slideToDisplay) {
        setCurrentlyDisplayedSlide(slideToDisplay);
      }

      // Send to live window with background data
      if (liveWindow && !liveWindow.closed) {
        // Get the correct background data using getItemBackground function
        const slideBackground = slideToDisplay?.itemId
          ? getItemBackground(slideToDisplay.itemId)
          : null;

        liveWindow.postMessage(
          {
            type: "SLIDE_CHANGE",
            data: {
              slideNumber: newSlide,
              background: slideBackground,
              itemId: slideToDisplay?.itemId,
            },
          },
          window.location.origin,
        );
      }
    }
  };

  const previousSlide = () => {
    if (currentSlide > 1) {
      const newSlide = currentSlide - 1;
      setCurrentSlide(newSlide);

      // Update the displayed slide content
      const slideToDisplay = slides[newSlide - 1];
      if (slideToDisplay) {
        setCurrentlyDisplayedSlide(slideToDisplay);
      }

      // Send to live window with background data
      if (liveWindow && !liveWindow.closed) {
        // Get the correct background data using getItemBackground function
        const slideBackground = slideToDisplay?.itemId
          ? getItemBackground(slideToDisplay.itemId)
          : null;

        liveWindow.postMessage(
          {
            type: "SLIDE_CHANGE",
            data: {
              slideNumber: newSlide,
              background: slideBackground,
              itemId: slideToDisplay?.itemId,
            },
          },
          window.location.origin,
        );
      }
    }
  };

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (
        isListeningDropdownOpen &&
        !target.closest("[data-listening-dropdown]")
      ) {
        setIsListeningDropdownOpen(false);
      }
      if (
        isBiblePreferencesOpen &&
        !target.closest("[data-bible-preferences-dropdown]")
      ) {
        setIsBiblePreferencesOpen(false);
      }
    };

    if (isListeningDropdownOpen || isBiblePreferencesOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isListeningDropdownOpen, isBiblePreferencesOpen]);

  const navItems = [
    { name: "Project", active: activeTab === "Project" },
    { name: "Insert Item", active: activeTab === "Insert Item" },
    { name: "Assets", active: false },
    { name: "Songbook", active: false, notification: true },
    { name: "Settings", active: false },
    { name: "Guide", active: false },
    { name: "Help", active: false },
  ];

  // Project menu structure based on the attached UI
  const projectMenuItems = [
    {
      name: "New",
      shortcut: "",
      hasSubmenu: true,
      submenuItems: [
        {
          name: "New Presentation",
          subtitle:
            "Start your church presentation quickly with your content and background.",
          action: () => setIsNewPresentationModalOpen(true),
        },
        { name: "RESOURCES", isHeading: true },
        {
          name: "Getting Started",
          subtitle: "Tips to help you get started with Q-worship.",
          action: () => setLocation("/dashboard-help?article=getting-started"),
        },
        {
          name: "Example Presentation",
          subtitle:
            "An example church service presentation with content, images and backgrounds.",
          action: () =>
            setLocation("/dashboard-help?article=example-presentation"),
        },
        {
          name: "How to Record Sermons",
          subtitle:
            "Instructions on how to record and edit your sermons about your scriptures.",
          action: () => setLocation("/dashboard-help?article=record-sermons"),
        },
        {
          name: "How to create On-screen Bible",
          subtitle:
            "Create and fully show the Bible verse in a new readable and scriptures.",
          action: () => setLocation("/dashboard-help?article=onscreen-bible"),
        },
        {
          name: "How to create Sermon slides",
          subtitle:
            "Live create content for all the ones the live content and scripture.",
          action: () => setLocation("/dashboard-help?article=sermon-slides"),
        },
      ],
    },
    {
      name: "Open...",
      shortcut: "Ctrl+O",
      hasSubmenu: false,
      action: () => {
        setIsOpenModalOpen(true);
      },
    },
    {
      name: "Open Recent",
      shortcut: "",
      hasSubmenu: true,
      submenuItems: [], // Will be populated dynamically with last 5 presentations
    },
    {
      name: "Save",
      shortcut: "Ctrl+S",
      hasSubmenu: false,
      action: () => handleSavePresentation(true),
    },
    {
      name: "Import Presentation",
      shortcut: "",
      hasSubmenu: true,
      submenuItems: [
        {
          name: "PowerPoint File Type",
          action: () => handleImportPresentation(),
        },
        { name: "Choose File...", action: () => handleRestorePresentation() },
      ],
    },
    {
      name: "Duplicate",
      shortcut: "",
      hasSubmenu: false,
      action: () => handleDuplicateCurrentPresentation(),
    },
    {
      name: "Duplicate Recent",
      shortcut: "",
      hasSubmenu: true,
      submenuItems: [], // Will be populated dynamically when needed
    },
    {
      name: "Backup Presentation",
      shortcut: "",
      hasSubmenu: false,
      action: () => handleBackupCurrentPresentation(),
    },
    {
      name: "Restore Presentation",
      shortcut: "",
      hasSubmenu: false,
      action: () => handleRestorePresentation(),
    },
    {
      name: "Print Presentation",
      shortcut: "Ctrl+P",
      hasSubmenu: false,
      action: () => console.log("Print presentation"),
    },
    {
      name: "Exit",
      shortcut: "Alt+F4",
      hasSubmenu: false,
      action: () => handleExitApplication(),
    },
  ];

  // Insert Item menu structure based on the attached UI
  const insertItemMenuItems = [
    {
      name: "Song",
      shortcut: "Ctrl + Shift + S",
      iconComponent: Music,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `song-${Date.now()}`,
          type: "song",
          title: "Song",
          content: "",
          sections: [],
        }),
    },
    {
      name: "Hands - free Bible",
      shortcut: "Ctrl + Shift + B",
      iconComponent: BookOpen,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `bible-${Date.now()}`,
          type: "bible",
          title: "John 3:16",
          content:
            "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
          version: "NIV",
          reference: "John 3:16",
        }),
    },
    {
      name: "On-Screen Bible",
      shortcut: "Ctrl + Shift + O",
      iconComponent: RotateCcw,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `onscreen-bible-${Date.now()}`,
          type: "bible",
          title: "Bible - on screen",
          content: "",
          version: "KJV",
          reference: "",
        }),
    },
    {
      name: "Announcement",
      shortcut: "Ctrl + Shift + N",
      iconComponent: Volume2,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `announcement-${Date.now()}`,
          type: "announcement",
          title: "Welcome Announcement",
          content:
            "Welcome to our Sunday service! We're glad you're here with us today.",
        }),
    },
    {
      name: "Slide Canvas",
      shortcut: "",
      iconComponent: Palette,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `slide-${Date.now()}`,
          type: "media",
          subtype: "slide",
          title: "Custom Slide",
          content: "Custom presentation slide",
        }),
    },
    {
      name: "Video",
      shortcut: "Ctrl + Shift + V",
      iconComponent: Play,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `video-${Date.now()}`,
          type: "media",
          subtype: "video",
          title: "Worship Video",
          content: "Inspirational worship video",
        }),
    },
    {
      name: "Image",
      shortcut: "Ctrl + Shift + I",
      iconComponent: Image,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `image-${Date.now()}`,
          type: "media",
          subtype: "image",
          title: "Background Image",
          content: "Worship background image",
        }),
    },
    {
      name: "Web Page",
      shortcut: "Ctrl + Shift + W",
      iconComponent: Globe,
      hasSubmenu: false,
      action: () =>
        addItemToPreparation({
          id: `webpage-${Date.now()}`,
          type: "media",
          subtype: "webpage",
          title: "Web Page",
          content: "External web page content",
        }),
    },
    {
      name: "Import Item",
      shortcut: "",
      iconComponent: PlusIcon,
      hasSubmenu: true,
      submenuItems: [
        {
          name: "PowerPoint Presentation",
          action: () => console.log("Import PowerPoint"),
        },
        { name: "Media Files", action: () => console.log("Import Media") },
        { name: "Song Database", action: () => console.log("Import Songs") },
      ],
    },
  ];

  // Settings menu items
  const settingsMenuItems = [
    {
      name: "Integrations",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setIsIntegrationsModalOpen(true);
        setActiveDropdown(null);
      },
    },
    {
      name: "Preferences",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setIsPreferencesModalOpen(true);
        setActiveDropdown(null);
      },
    },
    {
      name: "Display Settings",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setIsDisplaySettingsModalOpen(true);
        setActiveDropdown(null);
      },
    },
    {
      name: "Audio Settings",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setIsAudioSettingsModalOpen(true);
        setActiveDropdown(null);
      },
    },
    {
      name: "Account Settings",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setIsAccountSettingsModalOpen(true);
        setActiveDropdown(null);
      },
    },
    {
      name: "Lower Third Settings",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setLocation("/lower-third-settings");
        setActiveDropdown(null);
      },
    },
    {
      name: "Main Presentation Settings",
      shortcut: "",
      hasSubmenu: false,
      action: () => {
        setLocation("/main-presentation-settings");
        setActiveDropdown(null);
      },
    },
  ];

  // Insert item functions
  const insertBibleVerse = () => {
    const bibleVerse = {
      id: `bible-${Date.now()}`,
      type: "bible",
      title: "John 3:16",
      content:
        "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      version: "NIV",
      reference: "John 3:16",
    };
    addItemToPreparation(bibleVerse);
  };

  const showPopularVerses = () => {
    const popularVerses = [
      { reference: "John 3:16", title: "For God so loved the world..." },
      { reference: "Psalm 23:1", title: "The Lord is my shepherd..." },
      { reference: "Romans 8:28", title: "And we know that in all things..." },
      { reference: "Philippians 4:13", title: "I can do all things..." },
    ];
    console.log("Show popular verses:", popularVerses);
  };

  const showRecentVerses = () => {
    console.log("Show recent verses");
  };

  const createAnnouncement = () => {
    const announcement = {
      id: `announcement-${Date.now()}`,
      type: "announcement",
      title: "Welcome Announcement",
      content:
        "Welcome to our Sunday service! We're glad you're here with us today.",
    };
    addItemToPreparation(announcement);
  };

  const createEventAnnouncement = () => {
    const eventAnnouncement = {
      id: `event-${Date.now()}`,
      type: "announcement",
      title: "Upcoming Event",
      content: "Join us next Sunday for our special guest speaker at 10:30 AM.",
    };
    addItemToPreparation(eventAnnouncement);
  };

  const showAnnouncementTemplates = () => {
    console.log("Show announcement templates");
  };

  // Handle opening song search modal
  const handleBrowseSongs = () => {
    if (songSearchTerm.length < 3) {
      toast({
        title: "Search Term Too Short",
        description: "Please enter at least 3 characters to search for songs.",
        variant: "destructive",
      });
      return;
    }

    // Automatically perform the search with the current search term
    const searchLower = songSearchTerm.toLowerCase();
    const filtered =
      ((savedSongs as any)?.songs || []).filter(
        (song: any) =>
          song.title?.toLowerCase().includes(searchLower) ||
          song.lyrics?.toLowerCase().includes(searchLower) ||
          song.artist?.toLowerCase().includes(searchLower) ||
          song.authors?.some((author: string) =>
            author?.toLowerCase().includes(searchLower),
          ),
      ) || [];

    setFilteredSongs(filtered);
    setIsSearchModalOpen(true);
  };

  // Handle search within modal
  const handleModalSearch = () => {
    if (songSearchTerm.length < 3) return;

    // Filter songs based on search term
    const searchLower = songSearchTerm.toLowerCase();
    const filtered = (savedSongs || []).filter(
      (song: any) =>
        song.title?.toLowerCase().includes(searchLower) ||
        song.lyrics?.toLowerCase().includes(searchLower) ||
        song.artist?.toLowerCase().includes(searchLower) ||
        song.authors?.some((author: string) =>
          author?.toLowerCase().includes(searchLower),
        ),
    );

    setFilteredSongs(filtered);
  };

  // Parse lyrics into sections (V1, V2, C, etc.)
  const parseLyricsIntoSections = (lyrics: string) => {
    const sections: { [key: string]: string } = {};
    if (!lyrics) return sections;

    // Split by section markers like [V1], [V2], [C1], etc.
    const lines = lyrics.split("\n");
    let currentSection = "";
    let currentContent = "";

    for (const line of lines) {
      const sectionMatch = line.match(/^\[([^\]]+)\]/);
      if (sectionMatch) {
        // Save previous section
        if (currentSection && currentContent.trim()) {
          sections[currentSection] = currentContent.trim();
        }
        // Start new section
        currentSection = sectionMatch[1];
        currentContent = "";
      } else if (currentSection) {
        currentContent += line + "\n";
      }
    }

    // Save last section
    if (currentSection && currentContent.trim()) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  };

  // Universal function to update item content across both state systems
  const updateItemContent = (
    itemId: string,
    newTitle: string,
    newContent: any,
    slides?: any[],
  ) => {
    console.log("Updating item content for:", itemId, "with title:", newTitle);

    // Update serviceItems
    setServiceItems((prev) => {
      const updated = prev.map((item) => {
        if (item.id === itemId) {
          console.log(
            "Updating service item title from",
            item.title,
            "to",
            newTitle,
          );
          return {
            ...item,
            title: newTitle,
            content: newContent,
            slides: slides || item.slides,
          };
        }
        return item;
      });
      return updated;
    });

    // Update sectionItems for sidebar display
    setSectionItems((prev) => {
      const newSectionItems = { ...prev };
      for (const section in newSectionItems) {
        const sectionItemIndex = newSectionItems[section].findIndex(
          (item) => item.id === itemId,
        );
        if (sectionItemIndex !== -1) {
          console.log(
            "Updating section item title in",
            section,
            "from",
            newSectionItems[section][sectionItemIndex].title,
            "to",
            newTitle,
          );
          newSectionItems[section] = [...newSectionItems[section]];
          newSectionItems[section][sectionItemIndex] = {
            ...newSectionItems[section][sectionItemIndex],
            title: newTitle,
            content: newContent,
            slides: slides || newSectionItems[section][sectionItemIndex].slides,
          };
          break;
        }
      }
      return newSectionItems;
    });

    // Update editing content
    setEditingContent((prev: any) =>
      prev && prev.id === itemId
        ? {
            ...prev,
            title: newTitle,
            content: newContent,
            slides: slides || prev.slides,
          }
        : prev,
    );
  };

  // Handle selecting a song from search results
  const handleSelectSong = (song: any) => {
    console.log("handleSelectSong called with:", song);
    console.log("editingContent:", editingContent);

    if (editingContent) {
      updateItemContent(
        editingContent.id,
        song.title,
        song,
        createSlidesFromSong(song),
      );

      // Update the current song title for the preview section
      setCurrentSongTitle(song.title);

      // Set the song editor content for formatting toolbar
      setSongEditorContent(song.lyrics || "");

      // Parse lyrics into sections for enhanced editor
      const sections = parseLyricsIntoSections(song.lyrics);
      setParsedLyrics(sections);

      // Update editingContent to reflect the newly loaded song data
      setEditingContent((prev: any) =>
        prev
          ? {
              ...prev,
              title: song.title,
              content: song,
            }
          : null,
      );

      // Set default arrangement based on available sections
      const availableSections = Object.keys(sections);
      const defaultArrangement = availableSections.filter(
        (section) =>
          section.toLowerCase().includes("v1") ||
          section.toLowerCase().includes("verse 1") ||
          section.toLowerCase().includes("v2") ||
          section.toLowerCase().includes("verse 2") ||
          section.toLowerCase().includes("c") ||
          section.toLowerCase().includes("chorus"),
      );
      setSongArrangement(
        defaultArrangement.length > 0 ? defaultArrangement : ["V1", "V2", "C"],
      );

      // Clear search state and slide selection to ensure Song Editor 2 is shown
      setShowSearchResults(false);
      setSongSearchTerm("");
      setSelectedSlide(null); // Clear any selected slide to show Song Editor 2 (elaborate editor)

      toast({
        title: "Song Loaded",
        description: `"${song.title}" has been loaded and the service item title has been updated.`,
      });
    } else {
      console.log("No editing content found");
    }
  };

  // Handle selecting a Bible verse (for both Hands-free and On-screen Bible)
  const handleSelectBibleVerse = (verse: any) => {
    console.log("handleSelectBibleVerse called with:", verse);
    console.log("editingContent:", editingContent);

    if (editingContent && editingContent.type === "bible") {
      const verseTitle = `${verse.book} ${verse.chapter}:${verse.verse}`;
      updateItemContent(editingContent.id, verseTitle, {
        ...verse,
        reference: verseTitle,
      });

      // Bible reference is updated through the item content update above

      toast({
        title: "Bible Verse Loaded",
        description: `"${verseTitle}" has been loaded and the service item title has been updated.`,
      });
    } else {
      console.log("No editing content found or not a Bible item");
    }
  };

  // Handle manual Bible reference input (for title field changes)
  const handleBibleReferenceChange = (reference: string) => {
    if (editingContent && editingContent.type === "bible") {
      updateItemContent(editingContent.id, reference || editingContent.title, {
        ...editingContent.content,
        reference: reference,
      });
    }
  };

  // Helper function to create slides from song data
  const createSlidesFromSong = (song: any) => {
    const slides: any[] = [];

    if (song.lyrics) {
      const parsedSections = parseLyricsIntoSections(song.lyrics);
      let slideNumber = 1;

      // Create slides from parsed sections
      Object.entries(parsedSections).forEach(([sectionName, lyrics]) => {
        const isVerse1 =
          sectionName.toLowerCase().includes("v1") ||
          sectionName.toLowerCase().includes("verse 1");
        const isVerse2 =
          sectionName.toLowerCase().includes("v2") ||
          sectionName.toLowerCase().includes("verse 2");
        const isChorus =
          sectionName.toLowerCase().includes("c") ||
          sectionName.toLowerCase().includes("chorus");

        let type = "verse";
        let label = "VERSE";

        if (isVerse1) {
          type = "verse";
          label = "V1";
        } else if (isVerse2) {
          type = "verse";
          label = "V2";
        } else if (isChorus) {
          type = "chorus";
          label = "C1";
        }

        slides.push({
          id: `slide-${song.id}-${slideNumber}`,
          type: type,
          title: song.title, // Show song title on all slides
          content: lyrics.trim(),
          sectionLabel: label,
          songTitle: song.title, // Store song title separately for display
        });

        slideNumber++;
      });
    }

    // If no lyrics sections were found, create a basic slide
    if (slides.length === 0) {
      slides.push({
        id: `slide-${song.id}-1`,
        type: "verse",
        title: song.title,
        content: song.lyrics || "No lyrics available",
        sectionLabel: "V1",
        songTitle: song.title,
      });
    }

    return slides;
  };

  const insertImage = () => {
    const imageItem = {
      id: `image-${Date.now()}`,
      type: "media",
      subtype: "image",
      title: "Background Image",
      content: "Worship background image",
    };
    addItemToPreparation(imageItem);
  };

  const insertVideo = () => {
    const videoItem = {
      id: `video-${Date.now()}`,
      type: "media",
      subtype: "video",
      title: "Worship Video",
      content: "Inspirational worship video",
    };
    addItemToPreparation(videoItem);
  };

  const insertAudio = () => {
    const audioItem = {
      id: `audio-${Date.now()}`,
      type: "media",
      subtype: "audio",
      title: "Background Music",
      content: "Soft instrumental music",
    };
    addItemToPreparation(audioItem);
  };

  const insertPrayer = () => {
    const prayer = {
      id: `prayer-${Date.now()}`,
      type: "liturgy",
      subtype: "prayer",
      title: "Opening Prayer",
      content: "Heavenly Father, we gather in Your name today...",
    };
    addItemToPreparation(prayer);
  };

  const insertScriptureReading = () => {
    const scriptureReading = {
      id: `scripture-${Date.now()}`,
      type: "liturgy",
      subtype: "scripture",
      title: "Scripture Reading",
      content: "Today's scripture reading from Romans 12:1-2",
    };
    addItemToPreparation(scriptureReading);
  };

  const insertCommunion = () => {
    const communion = {
      id: `communion-${Date.now()}`,
      type: "liturgy",
      subtype: "communion",
      title: "Holy Communion",
      content: "The Lord's Supper preparation and elements",
    };
    addItemToPreparation(communion);
  };

  // Add item to selected service section and preparation area - 3-Action System
  const addItemToPreparation = (item: any) => {
    if (!selectedServiceSection) {
      // Show warning notification that user needs to select a section first
      setShowSectionWarning(true);
      setTimeout(() => setShowSectionWarning(false), 3000);
      return;
    }

    // Record the addition action for undo/redo
    recordAction({
      type: "ADD_ITEM",
      itemId: item.id,
      sectionName: selectedServiceSection,
      item: item,
      description: `Add ${item.title || item.type} to ${selectedServiceSection}`,
    });

    // ACTION 1: Create generic item in selected service section
    setSectionItems((prev) => ({
      ...prev,
      [selectedServiceSection]: [...(prev[selectedServiceSection] || []), item],
    }));

    // Auto-expand the section to show the added item
    setExpandedSections((prev) => ({
      ...prev,
      [selectedServiceSection]: true,
    }));

    // ACTION 2: Load appropriate editor UI in Edit & Preparation
    setInsertedItems((prev) => [...prev, item]);
    setSelectedContentType(item.type);
    setEditingContent(item);

    // Initialize song title if it's a song item
    if (item.type === "song") {
      setCurrentSongTitle(item.title === "Song" ? "" : item.title || "");
    }

    // Clear any previous slide selection to show the new editor
    setSelectedSlide(null);
    setIsSlideEditorOpen(false);

    // ACTION 3: Create generic blank slide in slide section
    createSlideFromItem(item);

    // ACTION 3: Immediately add item to serviceItems with slides for display
    const newServiceItem = {
      id: item.id,
      section: getServiceSectionKey(selectedServiceSection),
      type: item.type,
      title: item.title,
      content: item.content || {},
      slides: [
        {
          id: `slide-${item.id}-${Date.now()}`,
          type: item.type === "song" ? ("song" as const) : ("custom" as const),
          title: item.title,
          content:
            item.type === "song" ? "Please select a song" : "Ready for content",
          sectionLabel: item.type === "song" ? "Song" : "Content",
        },
      ],
    };

    // Add to serviceItems for slide display
    setServiceItems((prev) => [...prev, newServiceItem]);

    console.log(
      `✅ Added item to serviceItems for slide display:`,
      newServiceItem,
    );

    console.log(
      `3-Action System completed for ${item.type} in ${selectedServiceSection}:`,
      item,
    );
  };

  // Helper function to create slides for a single item without adding to state
  const createSlidesForItem = (item: any) => {
    const songSections = item.sections || item.content;

    if (item.type === "song" && songSections && Array.isArray(songSections)) {
      // Create individual slides for each verse/chorus
      return songSections.map((section: any, index: number) => ({
        id: `song-${item.songId}-${section.id}-${Date.now()}-${index}`,
        type:
          section.type === "verse" ? ("verse" as const) : ("chorus" as const),
        title: `${item.title} - ${section.label}`,
        content: section.content,
        songId: item.songId,
        sectionLabel: section.label,
      }));
    } else {
      // For non-song items, create a single slide
      return [
        {
          id: `item-${item.id}-${Date.now()}`,
          type: "custom" as const,
          title: item.title || "Untitled",
          content: item.content || item.title || "Custom Content",
        },
      ];
    }
  };

  // Function to add song to multiple service sections (from Song Viewer)
  const addSongToServiceSections = (songItem: any, sectionIds: string[]) => {
    sectionIds.forEach((sectionId) => {
      // Create unique item for each section
      const itemWithUniqueId = {
        ...songItem,
        id: `song-${songItem.songId}-${sectionId}-${Date.now()}`,
      };

      // Record the addition action for undo/redo
      recordAction({
        type: "ADD_ITEM",
        itemId: itemWithUniqueId.id,
        sectionName: sectionId,
        item: itemWithUniqueId,
        description: `Add song "${songItem.title}" to ${sectionId}`,
      });
    });

    sectionIds.forEach((sectionId) => {
      // Create unique item for each section
      const itemWithUniqueId = {
        ...songItem,
        id: `song-${songItem.songId}-${sectionId}-${Date.now()}`,
      };

      // Add item to the section
      setSectionItems((prev) => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), itemWithUniqueId],
      }));

      // Auto-expand the section to show the added item
      setExpandedSections((prev) => ({
        ...prev,
        [sectionId]: true,
      }));
    });

    // Add to global inserted items (only add one instance)
    setInsertedItems((prev) => [...prev, songItem]);
    setSelectedContentType(songItem.type);
    setEditingContent(songItem);

    // Initialize song title for immediate editing
    setCurrentSongTitle(songItem.title === "Song" ? "" : songItem.title || "");

    // Initialize editor history when starting to edit a song
    const initialContent = songItem.content?.lyrics || "";
    setSongEditorContent(initialContent);
    setEditorHistory([initialContent]);
    setHistoryIndex(0);
    setEditorState((prev) => ({
      ...prev,
      canUndo: false,
      canRedo: false,
    }));

    // Rebuild slides to append new song slides
    setTimeout(() => {
      rebuildSlidesFromServiceItems();
    }, 100);
  };

  const createSlideFromItem = (item: any) => {
    console.log("Creating slides from item:", item);
    console.log("Item type:", item.type);
    console.log("Item sections:", item.sections);
    console.log("Item content:", item.content);

    // ACTION 3: Create generic blank slide with appropriate icon
    if (item.type === "song") {
      // For new songs, create a generic slide with song icon
      if (!item.sections || item.sections.length === 0) {
        toast({
          title: "Generic Song Slide Created",
          description: `Created generic slide for "${item.title}" - ready for lyrics`,
        });
        console.log("Created generic song slide with song icon");
      } else {
        // For songs with sections, create multiple slides
        toast({
          title: "Song Slides Created",
          description: `Created ${item.sections.length} slides for "${item.title}"`,
        });
        console.log(`Created ${item.sections.length} slides for song sections`);
      }
    } else {
      toast({
        title: "Slide Created",
        description: `Created slide for "${item.title}"`,
      });
      console.log("Created single slide for item");
    }
  };

  const serviceSections = [
    "PRE-SERVICE ITEMS",
    "WARM - UP",
    "SERVICE ITEMS",
    "POST SERVICE LOOP",
  ];

  // Function to rebuild all slides based on service section items order
  const rebuildSlidesFromServiceItems = () => {
    // Preserve existing slides from current serviceItems
    const existingSlides: any[] = [];
    serviceItems.forEach((serviceItem) => {
      if (serviceItem.slides && Array.isArray(serviceItem.slides)) {
        existingSlides.push(...serviceItem.slides);
      }
    });

    const allSlides: any[] = [...existingSlides]; // Start with existing slides

    // Process service sections in order to add NEW slides
    serviceSections.forEach((sectionName) => {
      const items = sectionItems[sectionName] || [];

      items.forEach((item, itemIndex) => {
        // Check if this item already has slides in the existing slides
        const itemAlreadyHasSlides = existingSlides.some(
          (slide) =>
            slide.songId === item.songId || slide.id?.includes(item.id),
        );

        if (itemAlreadyHasSlides) {
          return; // Skip items that already have slides
        }

        // Handle both 'sections' and 'content' fields for song sections
        const songSections = item.sections || item.content;

        if (
          item.type === "song" &&
          songSections &&
          Array.isArray(songSections) &&
          songSections.length > 0
        ) {
          // Create individual slides for each verse/chorus
          const songSlides = songSections.map((section: any, index: number) => {
            return {
              id: `song-${item.songId}-${section.id || index}-${Date.now()}-${index}`,
              type:
                section.type === "verse"
                  ? ("verse" as const)
                  : ("chorus" as const),
              title: `${item.title} - ${section.label || section.type || `Section ${index + 1}`}`,
              content: section.content || section.text || "No content",
              songId: item.songId,
              sectionLabel:
                section.label || section.type || `Section ${index + 1}`,
            };
          });
          allSlides.push(...songSlides); // Append to existing slides
        } else if (item.type === "song") {
          // Create generic song slide
          const genericSongSlide = {
            id: `song-${item.id}-${Date.now()}`,
            type: "song" as const,
            title: item.title || "Song",
            content: item.content || item.lyrics || "Ready for lyrics",
            songId: item.id,
            sectionLabel: "Song",
          };
          allSlides.push(genericSongSlide); // Append to existing slides
        } else {
          // For non-song items, create a single slide
          const singleSlide = {
            id: `item-${item.id}-${Date.now()}`,
            type: "custom" as const,
            title: item.title || "Untitled",
            content: item.content || item.title || "Custom Content",
          };
          allSlides.push(singleSlide); // Append to existing slides
        }
      });
    });

    // Update service items to include their generated slides
    const updatedServiceItems: any[] = [];

    serviceSections.forEach((sectionName) => {
      const items = sectionItems[sectionName] || [];
      items.forEach((item) => {
        // Calculate how many slides this item has (from all slides)
        const itemSlides = allSlides.filter(
          (slide) =>
            slide.songId === item.songId ||
            slide.songId === item.id ||
            slide.id?.includes(item.id),
        );

        // Add slides property to the item
        const updatedItem = {
          ...item,
          slides: itemSlides,
        };

        updatedServiceItems.push(updatedItem);
      });
    });

    // Update the serviceItems state with slides attached
    setServiceItems(updatedServiceItems);
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName as keyof typeof prev],
    }));
  };

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/auth/logout"),
    onSuccess: () => {
      // Clear any local storage data
      localStorage.removeItem("qworship-saved-songs");
      localStorage.removeItem("handsfreeBibleState");

      // Wipe the global AuthStore session entirely
      useAuthStore.getState().logout();

      // Redirect to login page
      window.location.href = "/login";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if logout fails on server, still redirect to login
      window.location.href = "/login";
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // Fullscreen functionality
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      document.documentElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
        })
        .catch((err) => {
          console.error("Error entering fullscreen:", err);
        });
    } else {
      // Exit fullscreen
      document
        .exitFullscreen()
        .then(() => {
          setIsFullscreen(false);
        })
        .catch((err) => {
          console.error("Error exiting fullscreen:", err);
        });
    }
  };

  // Handle fullscreen change event (when user presses ESC or F11)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Handle CTRL + F keyboard shortcut for fullscreen
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key === "f") {
        event.preventDefault(); // Prevent browser's default find dialog
        toggleFullscreen();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-select first service item function
  const autoSelectFirstServiceItem = (serviceItemsData: any) => {
    console.log("🎯 === AUTO-SELECTING FIRST SERVICE ITEM ===");
    console.log("🎯 Service items data received:", serviceItemsData);
    console.log("🎯 Type of service items data:", typeof serviceItemsData);

    if (!serviceItemsData) {
      console.log("🎯 No service items data provided");
      return false;
    }

    // Define the section priority order
    const sectionOrder = [
      "PRE-SERVICE ITEMS",
      "WARM - UP",
      "SERVICE ITEMS",
      "POST SERVICE LOOP",
    ];

    let firstItem = null;
    let selectedSectionName = "";

    console.log(
      "🎯 Available sections in service data:",
      Object.keys(serviceItemsData),
    );

    // Try to find the first item in order of priority
    for (const sectionName of sectionOrder) {
      const sectionItems = serviceItemsData?.[sectionName];
      console.log(`🎯 Checking section "${sectionName}":`, sectionItems);
      if (
        sectionItems &&
        Array.isArray(sectionItems) &&
        sectionItems.length > 0
      ) {
        firstItem = sectionItems[0];
        selectedSectionName = sectionName;
        console.log(
          `🎯 Found first item in section "${sectionName}":`,
          firstItem.title || firstItem,
        );
        break;
      }
    }

    // If no item found in priority sections, check any other sections
    if (!firstItem) {
      const allSections = Object.keys(serviceItemsData || {});
      console.log("🎯 Checking other sections:", allSections);
      for (const sectionName of allSections) {
        if (!sectionOrder.includes(sectionName)) {
          const sectionItems = serviceItemsData[sectionName];
          console.log(
            `🎯 Checking other section "${sectionName}":`,
            sectionItems,
          );
          if (
            sectionItems &&
            Array.isArray(sectionItems) &&
            sectionItems.length > 0
          ) {
            firstItem = sectionItems[0];
            selectedSectionName = sectionName;
            console.log(
              `🎯 Found first item in other section "${sectionName}":`,
              firstItem.title || firstItem,
            );
            break;
          }
        }
      }
    }

    if (firstItem) {
      console.log(
        `🎯 Auto-selecting item: "${firstItem.title || firstItem.name || "Unknown"}" from section "${selectedSectionName}"`,
      );
      console.log("🎯 Full item object:", firstItem);

      // Set the active service item
      setActiveServiceItem(firstItem);

      // Load the editor content for this item
      if (firstItem.content) {
        console.log("🎯 Setting editor content from item.content");
        setEditorContent(firstItem.content);
      } else if (firstItem.sections && firstItem.sections.length > 0) {
        // For songs, load the first section
        const firstSection = firstItem.sections[0];
        console.log(
          "🎯 Setting editor content from first section:",
          firstSection,
        );
        if (firstSection.content) {
          setEditorContent(firstSection.content);
        }
      } else {
        console.log("🎯 No content found in item, setting empty content");
        setEditorContent("");
      }

      // Expand the section that contains the selected item
      setExpandedSections((prev) => {
        const newExpanded = {
          ...prev,
          [selectedSectionName]: true,
        };
        console.log(
          "🎯 Expanding section, new expanded sections:",
          newExpanded,
        );
        return newExpanded;
      });

      console.log("🎯 Auto-selection completed successfully!");
      console.log(
        "🎯 Active service item set to:",
        firstItem.title || firstItem.name,
      );
      return true;
    } else {
      console.log("🎯 No service items found to auto-select");
      console.log(
        "🎯 Available sections were:",
        Object.keys(serviceItemsData || {}),
      );
      return false;
    }
  };

  // Handler functions for Projects Menu functionality
  const handleDuplicateCurrentPresentation = () => {
    if (currentPresentationId) {
      duplicatePresentationMutation.mutate(currentPresentationId);
    } else {
      toast({
        title: "No Presentation Selected",
        description: "Please open a presentation first before duplicating.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateRecentPresentation = (
    presentationId: string | number,
  ) => {
    duplicatePresentationMutation.mutate(presentationId);
    setIsDuplicateRecentOpen(false);
    setActiveDropdown(null);
  };

  const handleOpenRecentPresentation = (presentationId: string | number) => {
    // Find the presentation to open
    const presentation = savedProjects?.find(
      (p: any) => p.id === presentationId,
    );
    if (presentation) {
      console.log("📂 === OPENING RECENT Q-WORSHIP PROJECT ===");
      console.log("📂 Project:", presentation);
      console.log("📂 Project ID:", presentation.id);
      console.log("📂 Project Name:", presentation.name);

      // 1. Clear current workspace state before switching (like closing current PowerPoint file)
      console.log("📂 Clearing current workspace state...");
      clearWorkspaceState();

      // 2. Set the opened project as current context
      setCurrentPresentationName(presentation.name);
      setCurrentPresentationId(presentation.id);

      // 3. Sync with session storage for persistence
      sessionStorage.setItem(
        "qworship_current_presentation_id",
        presentation.id.toString(),
      );
      sessionStorage.setItem(
        "qworship_current_presentation_name",
        presentation.name,
      );

      // 4. Load the complete project bundle from database
      console.log(
        "📂 Loading complete service bundle for ID:",
        presentation.id,
      );
      loadProjectMutation.mutate(presentation.id);

      toast({
        title: "Project Opened",
        description: `"${presentation.name}" service bundle loaded successfully.`,
      });
    } else {
      toast({
        title: "Error",
        description: "Could not find the selected presentation.",
        variant: "destructive",
      });
    }
    setActiveDropdown(null);
  };

  const handleBackupCurrentPresentation = () => {
    if (currentPresentationId) {
      backupPresentationMutation.mutate(currentPresentationId);
    } else {
      toast({
        title: "No Presentation Selected",
        description: "Please open a presentation first before backing up.",
        variant: "destructive",
      });
    }
  };

  const handleRestorePresentation = () => {
    // Open file picker for PowerPoint files
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pptx,.ppt";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        importPresentationMutation.mutate(file);
      }
    };
    input.click();
  };

  const handleImportPresentation = () => {
    setIsImportModalOpen(true);
  };

  const handleFileImport = (file: File) => {
    importPresentationMutation.mutate(file);
  };

  const handleExitApplication = () => {
    // Clear all session data and navigate to project selection
    sessionStorage.removeItem("qworship_current_presentation_id");
    sessionStorage.removeItem("qworship_current_presentation_name");
    localStorage.removeItem("qworship-saved-songs");
    localStorage.removeItem("handsfreeBibleState");

    // Navigate back to project selection
    setLocation("/project-selection");

    toast({
      title: "Session Ended",
      description: "You have been returned to project selection.",
    });
  };

  // Get the 5 most recent presentations for Duplicate Recent functionality
  const getRecentPresentations = () => {
    return savedProjects
      .sort(
        (a: any, b: any) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 5);
  };

  // Calendar helper functions
  const formatDate = (date: Date) => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isSunday = (date: Date) => {
    return date.getDay() === 0;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  };

  const navigateMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(currentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  const selectDate = (day: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day,
    );
    setSelectedDate(newDate);
    setIsCalendarOpen(false);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const monthName = currentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Create array of days
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth(),
        day,
      );
      const isSelected = isSameDay(date, selectedDate);
      const isSundayDate = isSunday(date);

      days.push(
        <button
          key={day}
          onClick={() => selectDate(day)}
          className={`w-8 h-8 text-sm rounded-full flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-[#8356F3] text-white font-semibold"
              : isSundayDate
                ? "bg-cyan-400 text-cyan-900 font-medium hover:bg-cyan-300"
                : "text-white hover:bg-gray-700"
          }`}
        >
          {day}
        </button>,
      );
    }

    return (
      <div className="p-4 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateMonth("prev")}
            className="text-gray-400 hover:text-white p-1"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-white font-medium">{monthName}</h3>
          <button
            onClick={() => navigateMonth("next")}
            className="text-gray-400 hover:text-white p-1"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={day + index}
              className={`text-center text-xs font-medium p-1 ${
                index === 0 ? "text-cyan-400" : "text-gray-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <span className="text-gray-300">Sundays</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#8356F3] rounded-full"></div>
              <span className="text-gray-300">Selected</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Modal calendar helper functions
  const formatModalDate = (date: Date | null) => {
    if (!date) return "";
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const navigateModalMonth = (direction: "prev" | "next") => {
    const newMonth = new Date(modalCurrentMonth);
    if (direction === "prev") {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setModalCurrentMonth(newMonth);
  };

  const selectModalDate = (day: number) => {
    const newDate = new Date(
      modalCurrentMonth.getFullYear(),
      modalCurrentMonth.getMonth(),
      day,
    );
    setModalSelectedDate(newDate);
    setSelectedDate(newDate); // Also update the main sidebar date
    setCurrentMonth(new Date(newDate.getFullYear(), newDate.getMonth(), 1)); // Also update the main calendar month
    setIsModalCalendarOpen(false);
  };

  const renderModalCalendar = () => {
    const daysInMonth = getDaysInMonth(modalCurrentMonth);
    const firstDay = getFirstDayOfMonth(modalCurrentMonth);
    const monthName = modalCurrentMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Create array of days
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(
        modalCurrentMonth.getFullYear(),
        modalCurrentMonth.getMonth(),
        day,
      );
      const isSelected = isSameDay(date, modalSelectedDate);
      const isSundayDate = isSunday(date);

      days.push(
        <button
          key={day}
          onClick={() => selectModalDate(day)}
          className={`w-8 h-8 text-sm rounded-full flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-[#8356F3] text-white font-semibold"
              : isSundayDate
                ? "bg-cyan-400 text-cyan-900 font-medium hover:bg-cyan-300"
                : "text-white hover:bg-gray-700"
          }`}
        >
          {day}
        </button>,
      );
    }

    return (
      <div className="modal-calendar-dropdown absolute bottom-full left-0 mb-2 p-4 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-lg z-50">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigateModalMonth("prev")}
            className="text-gray-400 hover:text-white p-1"
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          <h3 className="text-white font-medium">{monthName}</h3>
          <button
            onClick={() => navigateModalMonth("next")}
            className="text-gray-400 hover:text-white p-1"
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
            <div
              key={day + index}
              className={`text-center text-xs font-medium p-1 ${
                index === 0 ? "text-cyan-400" : "text-gray-400"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">{days}</div>

        {/* Legend */}
        <div className="mt-3 pt-3 border-t border-gray-600">
          <div className="flex items-center justify-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
              <span className="text-gray-300">Sundays</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-[#8356F3] rounded-full"></div>
              <span className="text-gray-300">Selected</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Create presentation mutation
  const createPresentationMutation = useMutation({
    mutationFn: async (presentationData: {
      name: string;
      presentationDate?: string;
      description?: string;
    }) => {
      console.log(
        "Attempting to create presentation with data:",
        presentationData,
      );
      try {
        const response = await apiRequest(
          "POST",
          "/api/presentations",
          presentationData,
        );
        const result = await response.json();
        console.log("API request successful:", result);
        return result;
      } catch (error) {
        console.error("API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      refetchPresentations();

      // Clear any existing workspace state before creating new project
      clearWorkspaceState();

      setCurrentPresentationName(data.presentation.name);
      setCurrentPresentationId(data.presentation.id);

      // Sync with session storage
      sessionStorage.setItem(
        "qworship_current_presentation_id",
        data.presentation.id.toString(),
      );
      sessionStorage.setItem(
        "qworship_current_presentation_name",
        data.presentation.name,
      );

      // Clear all current service items and slides for fresh start
      setServiceItems([]);
      setSectionItems({
        "PRE-SERVICE ITEMS": [],
        "WARM - UP": [],
        "SERVICE ITEMS": [],
        "POST SERVICE LOOP": [],
      });
      setInsertedItems([]);
      setEditingContent(null);
      setSelectedContentType(null);
      setCurrentSongTitle("");

      // Clear undo/redo history for fresh start
      setActionHistory([]);
      setActionHistoryIndex(-1);

      // Close modal and reset form
      setIsNewPresentationModalOpen(false);
      setNewPresentationName("");
      setNewPresentationDate("");

      toast({
        title: "New Presentation Created",
        description: `"${data.presentation.name}" is ready for content.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create presentation",
        variant: "destructive",
      });
    },
  });

  // Handle creating a new presentation
  const handleCreateNewPresentation = () => {
    if (!newPresentationName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your new presentation.",
        variant: "destructive",
      });
      return;
    }

    const now = new Date();
    createPresentationMutation.mutate({
      name: newPresentationName.trim(),
      presentationDate: newPresentationDate || now.toISOString().split("T")[0],
      description: `New presentation created on ${now.toLocaleDateString()}`,
    });
  };

  // Initialize current date for new presentation modal
  useEffect(() => {
    if (isNewPresentationModalOpen && !newPresentationDate) {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];
      setNewPresentationDate(formattedDate);
    }
  }, [isNewPresentationModalOpen, newPresentationDate]);

  // Handle saving current presentation
  const handleSavePresentation = (isManualSave = false) => {
    console.log("=== SAVE PRESENTATION DEBUG ===");
    console.log("currentPresentationId:", currentPresentationId);
    console.log("currentPresentationName:", currentPresentationName);
    console.log("serviceItems length:", serviceItems.length);
    console.log("sectionItems:", sectionItems);
    console.log("slides length:", slides.length);
    console.log("isManualSave:", isManualSave);

    if (!currentPresentationId) {
      console.error("❌ SAVE FAILED: No currentPresentationId found");
      if (isManualSave) {
        toast({
          title: "No Project Open",
          description: "Please open or create a project before saving.",
          variant: "destructive",
        });
      }
      return;
    }

    // Show immediate "Saving..." feedback only for manual saves
    if (isManualSave) {
      toast({
        title: "Saving...",
        description: `Saving "${currentPresentationName}"`,
        className: "bg-purple-600 border-purple-400 text-white",
      });
    }

    // Prepare comprehensive presentation data to save ALL state
    const presentationData = {
      name: currentPresentationName,
      description: `Updated on ${new Date().toLocaleDateString()}`,
      slideCount: slides.length,
      // Serialize complete service and presentation state
      serviceData: {
        // Core content data
        serviceItems: serviceItems,
        sectionItems: sectionItems,
        slides: slides,

        // Navigation and interaction state
        expandedSections: expandedSections,
        currentSlide: currentSlide,

        // Undo/redo system state
        actionHistory: actionHistory,
        actionHistoryIndex: actionHistoryIndex,

        // Background and visual settings
        backgroundSettings: {
          itemBackgrounds: itemBackgrounds || {},
        },

        // Live settings state
        liveSettings: {
          transparency: slideTransparency,
          textSize: slideTextSize,
          logoSettings: logoSettings,
          autoAdvance: autoAdvanceEnabled,
          autoAdvanceDelay: autoAdvanceDelay,
          transitionEffect: transitionEffect,
          showTimestamp: showTimestamp,
          timestampPosition: timestampPosition,
        },

        // Bible widget state if present
        bibleWidgetState: bibleWidgetVisible
          ? {
              visible: bibleWidgetVisible,
              position: bibleWidgetPosition,
              currentVerse: currentVerse,
              currentBook: currentBook,
              currentChapter: currentChapter,
              dragMode: bibleWidgetDragMode,
            }
          : null,

        // Media and asset state
        selectedMedia: selectedMediaAsset
          ? {
              type: selectedMediaAsset.type,
              url: selectedMediaAsset.url,
              title: selectedMediaAsset.title,
            }
          : null,

        // Search and filter state
        searchQuery: searchQuery,
        activeFilters: activeFilters,

        // Editor state for active items
        editorState: activeServiceItem
          ? {
              activeItemId: activeServiceItem,
              activeItemType:
                serviceItems.find((item) => item.id === activeServiceItem)
                  ?.type || "custom",
              editorContent: editorContent,
            }
          : null,

        // Timestamp for save tracking
        lastSaved: new Date().toISOString(),
        version: "2.0", // Version tracking for future compatibility
      },
    };

    savePresentationMutation.mutate({
      presentationId: currentPresentationId,
      data: presentationData,
      isManualSave: isManualSave,
    });
  };

  // Auto-save mechanism - saves changes automatically when state changes
  const [lastAutoSave, setLastAutoSave] = useState<number>(0);
  const AUTO_SAVE_DELAY = 2000; // 2 seconds after changes stop

  const triggerAutoSave = useCallback(() => {
    if (!currentPresentationId) return;

    const now = Date.now();
    setLastAutoSave(now);

    setTimeout(() => {
      // Only save if no newer changes have been made
      if (lastAutoSave === now) {
        console.log("🔄 Auto-saving presentation...");
        handleSavePresentation(false); // Auto-save, no toast
      }
    }, AUTO_SAVE_DELAY);
  }, [currentPresentationId, lastAutoSave, handleSavePresentation]);

  // Auto-save when critical state changes
  useEffect(() => {
    if (currentPresentationId) {
      triggerAutoSave();
    }
  }, [
    // Core content changes
    serviceItems,
    sectionItems,
    slides,

    // Visual and settings changes
    itemBackgrounds,
    slideTransparency,
    slideTextSize,
    logoSettings,
    autoAdvanceEnabled,
    autoAdvanceDelay,
    transitionEffect,
    showTimestamp,
    timestampPosition,

    // Bible widget changes
    bibleWidgetVisible,
    bibleWidgetPosition,
    currentVerse,
    currentBook,
    currentChapter,

    // Media and editor changes
    selectedMediaAsset,
    activeServiceItem,
    editorContent,

    // Navigation changes
    currentSlide,
    expandedSections,

    triggerAutoSave,
  ]);

  // Persistent state management - saves complete workspace state to localStorage
  const saveWorkspaceState = useCallback(() => {
    if (!currentPresentationId) return;

    const workspaceState = {
      // Presentation identification
      presentationId: currentPresentationId,
      presentationName: currentPresentationName,

      // Complete application state
      serviceItems,
      sectionItems,
      slides,
      expandedSections,
      currentSlide,
      actionHistory,
      actionHistoryIndex,

      // Visual and settings state
      itemBackgrounds,
      slideTransparency,
      slideTextSize,
      logoSettings,
      autoAdvanceEnabled,
      autoAdvanceDelay,
      transitionEffect,
      showTimestamp,
      timestampPosition,

      // Bible widget state
      bibleWidgetVisible,
      bibleWidgetPosition,
      currentVerse,
      currentBook,
      currentChapter,
      bibleWidgetDragMode,

      // Editor and content state
      activeServiceItem,
      editorContent,
      selectedMediaAsset,
      searchQuery,
      activeFilters,

      // UI state
      activeTab,
      isLiveMode,
      showSettings,
      showAssetsModal,
      showImportModal,
      showSongbook,

      // Timestamp for state freshness
      savedAt: new Date().toISOString(),
      version: "2.0",
    };

    localStorage.setItem(
      "qworship_workspace_state",
      JSON.stringify(workspaceState),
    );
    console.log("💾 Workspace state saved to localStorage");
  }, [
    currentPresentationId,
    currentPresentationName,
    serviceItems,
    sectionItems,
    slides,
    expandedSections,
    currentSlide,
    actionHistory,
    actionHistoryIndex,
    itemBackgrounds,
    slideTransparency,
    slideTextSize,
    logoSettings,
    autoAdvanceEnabled,
    autoAdvanceDelay,
    transitionEffect,
    showTimestamp,
    timestampPosition,
    bibleWidgetVisible,
    bibleWidgetPosition,
    currentVerse,
    currentBook,
    currentChapter,
    bibleWidgetDragMode,
    activeServiceItem,
    editorContent,
    selectedMediaAsset,
    searchQuery,
    activeFilters,
    activeTab,
    isLiveMode,
    showSettings,
    showAssetsModal,
    showImportModal,
    showSongbook,
  ]);

  // Load workspace state from localStorage on component mount
  useEffect(() => {
    const restoreWorkspaceState = () => {
      try {
        const savedState = localStorage.getItem("qworship_workspace_state");
        if (!savedState) return;

        const workspaceState = JSON.parse(savedState);

        // Check if the saved state is recent (within last 24 hours)
        const savedAt = new Date(workspaceState.savedAt);
        const now = new Date();
        const hoursSinceLastSave =
          (now.getTime() - savedAt.getTime()) / (1000 * 60 * 60);

        if (hoursSinceLastSave > 24) {
          console.log("⚠️ Workspace state is too old, clearing...");
          localStorage.removeItem("qworship_workspace_state");
          return;
        }

        // Check if there's a current session presentation that matches
        const sessionPresentationId = sessionStorage.getItem(
          "qworship_current_presentation_id",
        );

        // Only restore state if no session presentation or if it matches the saved one
        if (!sessionPresentationId && workspaceState.presentationId) {
          // Restore presentation identification
          setCurrentPresentationId(workspaceState.presentationId);
          setCurrentPresentationName(workspaceState.presentationName);

          // Update session storage as well
          sessionStorage.setItem(
            "qworship_current_presentation_id",
            workspaceState.presentationId.toString(),
          );
          sessionStorage.setItem(
            "qworship_current_presentation_name",
            workspaceState.presentationName,
          );
        } else if (
          sessionPresentationId &&
          workspaceState.presentationId &&
          sessionPresentationId === workspaceState.presentationId.toString()
        ) {
          // Update presentation name if needed
          setCurrentPresentationName(workspaceState.presentationName);
        } else {
          return;
        }

        // Restore complete application state
        if (workspaceState.serviceItems)
          setServiceItems(workspaceState.serviceItems);
        if (workspaceState.sectionItems)
          setSectionItems(workspaceState.sectionItems);
        // Slides are computed from serviceItems - no direct restoration needed
        if (workspaceState.expandedSections)
          setExpandedSections(workspaceState.expandedSections);
        if (workspaceState.currentSlide !== undefined)
          setCurrentSlide(workspaceState.currentSlide);
        if (workspaceState.actionHistory) {
          setActionHistory(workspaceState.actionHistory);
          setActionHistoryIndex(workspaceState.actionHistoryIndex || -1);
        }

        // Restore visual and settings state
        if (workspaceState.itemBackgrounds)
          setItemBackgrounds(workspaceState.itemBackgrounds);
        if (workspaceState.slideTransparency !== undefined)
          setSlideTransparency(workspaceState.slideTransparency);
        if (workspaceState.slideTextSize !== undefined)
          setSlideTextSize(workspaceState.slideTextSize);
        if (workspaceState.logoSettings)
          setLogoSettings(workspaceState.logoSettings);
        if (workspaceState.autoAdvanceEnabled !== undefined)
          setAutoAdvanceEnabled(workspaceState.autoAdvanceEnabled);
        if (workspaceState.autoAdvanceDelay !== undefined)
          setAutoAdvanceDelay(workspaceState.autoAdvanceDelay);
        if (workspaceState.transitionEffect !== undefined)
          setTransitionEffect(workspaceState.transitionEffect);
        if (workspaceState.showTimestamp !== undefined)
          setShowTimestamp(workspaceState.showTimestamp);
        if (workspaceState.timestampPosition !== undefined)
          setTimestampPosition(workspaceState.timestampPosition);

        // Restore Bible widget state
        if (workspaceState.bibleWidgetVisible !== undefined)
          setBibleWidgetVisible(workspaceState.bibleWidgetVisible);
        if (workspaceState.bibleWidgetPosition)
          setBibleWidgetPosition(workspaceState.bibleWidgetPosition);
        if (workspaceState.currentVerse)
          setCurrentVerse(workspaceState.currentVerse);
        if (workspaceState.currentBook)
          setCurrentBook(workspaceState.currentBook);
        if (workspaceState.currentChapter !== undefined)
          setCurrentChapter(workspaceState.currentChapter);
        if (workspaceState.bibleWidgetDragMode !== undefined)
          setBibleWidgetDragMode(workspaceState.bibleWidgetDragMode);

        // Restore editor and content state
        if (workspaceState.activeServiceItem)
          setActiveServiceItem(workspaceState.activeServiceItem);
        if (workspaceState.editorContent)
          setEditorContent(workspaceState.editorContent);
        if (workspaceState.selectedMediaAsset)
          setSelectedMediaAsset(workspaceState.selectedMediaAsset);
        if (workspaceState.searchQuery)
          setSearchQuery(workspaceState.searchQuery);
        if (workspaceState.activeFilters)
          setActiveFilters(workspaceState.activeFilters);

        // Restore UI state
        if (workspaceState.activeTab) setActiveTab(workspaceState.activeTab);
        if (workspaceState.isLiveMode !== undefined)
          setIsLiveMode(workspaceState.isLiveMode);
        if (workspaceState.showSettings !== undefined)
          setShowSettings(workspaceState.showSettings);
        if (workspaceState.showAssetsModal !== undefined)
          setShowAssetsModal(workspaceState.showAssetsModal);
        if (workspaceState.showImportModal !== undefined)
          setShowImportModal(workspaceState.showImportModal);
        if (workspaceState.showSongbook !== undefined)
          setShowSongbook(workspaceState.showSongbook);
      } catch (error) {
        console.error("❌ Error restoring workspace state:", error);
        localStorage.removeItem("qworship_workspace_state");
      }
    };

    restoreWorkspaceState();
  }, []); // Only run once on mount

  // Save workspace state whenever it changes (debounced by 1.5s to prevent UI thrashing)
  useEffect(() => {
    if (!currentPresentationId) return;

    const timeoutId = setTimeout(() => {
      saveWorkspaceState();
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [saveWorkspaceState, currentPresentationId]);

  // Clear workspace state when user logs out or switches presentations
  const clearWorkspaceState = useCallback(() => {
    console.log("🗑️ Clearing workspace state for project switch...");

    // Clear localStorage
    localStorage.removeItem("qworship_workspace_state");

    // Reset all state variables to their defaults
    setServiceItems([]);
    setSectionItems({});
    // Slides will be cleared when serviceItems are cleared
    setExpandedSections({
      "PRE-SERVICE ITEMS": true,
      "WARM - UP": true,
      "SERVICE ITEMS": true,
      "POST SERVICE LOOP": true,
    });
    setCurrentSlide(1);
    setActionHistory([]);
    setActionHistoryIndex(-1);

    // Reset visual and settings state
    setItemBackgrounds({});
    setSlideTransparency(1);
    setSlideTextSize(1);
    setLogoSettings({
      visible: false,
      position: "bottom-right",
      size: "medium",
    });
    setAutoAdvanceEnabled(false);
    setAutoAdvanceDelay(5);
    setTransitionEffect("none");
    setShowTimestamp(false);
    setTimestampPosition("bottom-left");

    // Reset Bible widget state
    setBibleWidgetVisible(false);
    setBibleWidgetPosition({ x: 50, y: 50 });
    setCurrentVerse(1);
    setCurrentBook("Genesis");
    setCurrentChapter(1);
    setBibleWidgetDragMode(false);

    // Reset editor and content state
    setActiveServiceItem(null);
    setEditorContent("");
    setSelectedMediaAsset(null);
    setSearchQuery("");
    setActiveFilters([]);

    // Reset UI state (but keep basic navigation)
    setIsLiveMode(false);
    setShowSettings(false);
    setShowAssetsModal(false);
    setShowImportModal(false);
    setShowSongbook(false);

    console.log("✅ Workspace state completely cleared and reset");
  }, []);

  // Save state before page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPresentationId) {
        saveWorkspaceState();
        console.log("💾 Workspace state saved before page unload");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveWorkspaceState, currentPresentationId]);

  // Add keyboard shortcut for CTRL+O to open projects modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.key.toLowerCase() === "o") {
        event.preventDefault();
        setIsOpenModalOpen(true);
      }
      if (event.ctrlKey && event.key.toLowerCase() === "n") {
        event.preventDefault();
        setIsNewPresentationModalOpen(true);
      }
      if (event.ctrlKey && event.key.toLowerCase() === "s") {
        event.preventDefault();
        handleSavePresentation(true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleSavePresentation]);

  // Check for presentation data from ProjectSelection component on dashboard load
  useEffect(() => {
    const pendingPresentationData = sessionStorage.getItem(
      "qworship_presentation_to_load",
    );
    if (pendingPresentationData) {
      try {
        const presentation = JSON.parse(pendingPresentationData);
        console.log(
          "🔄 LOADING PRESENTATION FROM PROJECT SELECTION:",
          presentation.name,
        );

        // Clear the pending data to prevent reloading
        sessionStorage.removeItem("qworship_presentation_to_load");

        // Load the presentation using the existing comprehensive loading system
        loadProjectMutation.mutate(presentation.id);
      } catch (error) {
        console.error("❌ Failed to parse pending presentation data:", error);
        sessionStorage.removeItem("qworship_presentation_to_load");
      }
    }
  }, []); // Run once on component mount

  // Custom Hook for all API Mutations
  const {
    loadProjectMutation,
    handleOpenProject,
    savePresentationMutation,
    deletePresentationMutation,
    updatePresentationNameMutation,
    duplicatePresentationMutation,
    backupPresentationMutation,
    importPresentationMutation,
  } = useProjectMutations({
    toast,
    refetchPresentations,
    setServiceItems,
    setSectionItems,
    setCurrentSlide,
    setExpandedSections,
    setActionHistory,
    setActionHistoryIndex,
    setItemBackgrounds,
    setSlideTransparency,
    setSlideTextSize,
    setLogoSettings,
    setAutoAdvanceEnabled,
    setAutoAdvanceDelay,
    setTransitionEffect,
    setShowTimestamp,
    setTimestampPosition,
    setBibleWidgetVisible,
    setBibleWidgetPosition,
    setCurrentVerse,
    setCurrentBook,
    setCurrentChapter,
    setBibleWidgetDragMode,
    setSelectedMediaAsset,
    setSearchQuery,
    setActiveFilters,
    setActiveServiceItem,
    setEditorContent,
    autoSelectFirstServiceItem,
    liveWindow,
    itemBackgrounds,
    serviceItems,
    clearWorkspaceState,
    setCurrentPresentationName,
    setCurrentPresentationId,
    setIsOpenModalOpen,
    setProjectSearchQuery,
    setProjectSortBy,
    setProjectSortOrder,
    setProjectViewMode,
    currentPresentationName,
    setIsImportModalOpen,
    activeServiceItem,
  });

  // Handle deleting a project - now shows confirmation modal
  const handleDeleteProject = (projectId: number) => {
    const project = savedProjects.find((p) => p.id === projectId);
    if (project) {
      setProjectToDelete({ id: project.id, name: project.name });
      setIsDeleteModalOpen(true);
    }
  };

  // Confirm delete project
  const confirmDeleteProject = () => {
    if (projectToDelete) {
      deletePresentationMutation.mutate(projectToDelete.id);
      setIsDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  // Cancel delete project
  const cancelDeleteProject = () => {
    setIsDeleteModalOpen(false);
    setProjectToDelete(null);
  };

  // Format date for display
  const formatProjectDate = (
    dateString: string | Date | number | null | undefined,
  ) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Helper function to calculate slide count from project data
  const calculateSlideCount = (project: any) => {
    if (!project.serviceData) return 0;

    try {
      const serviceData =
        typeof project.serviceData === "string"
          ? JSON.parse(project.serviceData)
          : project.serviceData;

      if (serviceData.serviceItems && Array.isArray(serviceData.serviceItems)) {
        return serviceData.serviceItems.reduce((total: number, item: any) => {
          return total + (item.slides ? item.slides.length : 0);
        }, 0);
      }

      // Fallback to slides array if available
      if (serviceData.slides && Array.isArray(serviceData.slides)) {
        return serviceData.slides.length;
      }
    } catch (error: any) {
      console.error(
        "Error calculating slide count for project:",
        project.id,
        error,
      );
    }

    return 0;
  };

  // Filter and sort projects
  const getFilteredAndSortedProjects = () => {
    let filtered = savedProjects;

    // Apply search filter
    if (projectSearchQuery.trim()) {
      const query = projectSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          (project.presentationDate &&
            formatProjectDate(project.presentationDate)
              .toLowerCase()
              .includes(query)) ||
          (project.createdAt &&
            formatProjectDate(project.createdAt)
              .toLowerCase()
              .includes(query)) ||
          (project.description &&
            project.description.toLowerCase().includes(query)),
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (projectSortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "createdDate":
          aValue = new Date(a.createdAt || Date.now()).getTime();
          bValue = new Date(b.createdAt || Date.now()).getTime();
          break;
        case "presentationDate":
          aValue = new Date(a.presentationDate || Date.now()).getTime();
          bValue = new Date(b.presentationDate || Date.now()).getTime();
          break;
        case "slideCount":
          aValue = calculateSlideCount(a);
          bValue = calculateSlideCount(b);
          break;
        default: // lastModified
          aValue = new Date(a.updatedAt || a.createdAt || Date.now()).getTime();
          bValue = new Date(b.updatedAt || b.createdAt || Date.now()).getTime();
          break;
      }

      if (projectSortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  return (
    <div className="bg-[#2a1f4b] w-full min-h-screen flex flex-col relative">
      {/* Blur Overlay for Preview Mode */}
      {!isBuildMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-30 pointer-events-none"></div>
      )}
      {/* Fixed Header Container */}
      <AppHeader
        isBuildMode={isBuildMode}
        isFullscreen={isFullscreen}
        toggleFullscreen={toggleFullscreen}
        currentPresentationName={currentPresentationName}
        isEditingProjectName={isEditingProjectName}
        editingProjectName={editingProjectName}
        setEditingProjectName={setEditingProjectName}
        projectNameInputRef={projectNameInputRef}
        startEditingProjectName={startEditingProjectName}
        saveProjectName={saveProjectName}
        handleProjectNameKeyDown={handleProjectNameKeyDown}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        navItems={navItems}
        activeDropdown={activeDropdown}
        setActiveDropdown={setActiveDropdown}
        hoveredSubmenu={hoveredSubmenu}
        setHoveredSubmenu={setHoveredSubmenu}
        setLocation={setLocation}
        setIsSongbookOpen={setIsSongbookOpen}
        projectMenuItems={projectMenuItems}
        insertItemMenuItems={insertItemMenuItems}
        settingsMenuItems={settingsMenuItems}
        getRecentPresentations={getRecentPresentations}
        calculateSlideCount={calculateSlideCount}
        formatProjectDate={formatProjectDate}
        handleOpenRecentPresentation={handleOpenRecentPresentation}
        handleDuplicateRecentPresentation={handleDuplicateRecentPresentation}
        performUndo={performUndo}
        performRedo={performRedo}
        actionHistory={actionHistory}
        actionHistoryIndex={actionHistoryIndex}
        isRecording={isRecording}
        startRecording={startRecording}
        recordingDropdownOpen={recordingDropdownOpen}
        showRecordingControls={showRecordingControls}
        setShowRecordingControls={setShowRecordingControls}
        isPaused={isPaused}
        resumeRecording={resumeRecording}
        pauseRecording={pauseRecording}
        stopRecording={stopRecording}
        recordingTime={recordingTime}
        formatRecordingTime={formatRecordingTime}
        isLive={isLive}
        isInPreview={isInPreview}
        setIsBuildMode={setIsBuildMode}
        setIsInPreview={setIsInPreview}
        isLiveConsoleOpen={isLiveConsoleOpen}
        setIsLiveConsoleOpen={setIsLiveConsoleOpen}
        setDisplayMode={() => setDisplayMode}
        setCurrentSlide={setCurrentSlide}
        liveWindow={liveWindow}
        slides={slides}
        itemBackgrounds={itemBackgrounds}
        goLive={goLive}
        exitLive={exitLive}
        isProfileMenuOpen={isProfileMenuOpen}
        setIsProfileMenuOpen={setIsProfileMenuOpen}
        currentUser={currentUserResponse?.user || null}
        notifications={notifications}
        unreadCount={unreadCount}
        getNotificationIcon={getNotificationIcon}
        formatTimestamp={formatTimestamp}
        markNotificationAsRead={markNotificationAsRead}
        setIsProfileSettingsOpen={setIsProfileSettingsOpen}
        setIsSubscriptionOpen={setIsSubscriptionOpen}
        handleLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 pt-[128px] h-screen overflow-hidden">
        {/* Container for secondary nav and content */}
        <div className="flex flex-col w-full h-full">
          {/* Secondary Navigation Bar */}
          <SecondaryToolbar
            isSidebarCollapsed={isSidebarCollapsed}
            isBackgroundDropdownOpen={isBackgroundDropdownOpen}
            setIsBackgroundDropdownOpen={setIsBackgroundDropdownOpen}
            setIsBackgroundAssetsModalOpen={setIsBackgroundAssetsModalOpen}
            setBackgroundModalMode={(mode: string) =>
              setBackgroundModalMode(mode as "browse" | "import")
            }
            setIsImportImageOpen={setIsImportImageOpen}
            gradientBackgrounds={gradientBackgrounds}
            fillColorBackgrounds={fillColorBackgrounds}
            getCurrentItemId={getCurrentItemId}
            serviceItems={serviceItems}
            applyBackgroundToCurrentItem={(bg: any) =>
              applyBackgroundToCurrentItem(bg)
            }
            setSelectedBackgroundType={(type: string) =>
              setSelectedBackgroundType(
                type as "none" | "gradient" | "fill" | "media",
              )
            }
            isBiblePreferencesOpen={isBiblePreferencesOpen}
            setIsBiblePreferencesOpen={setIsBiblePreferencesOpen}
            selectedBibleMode={selectedBibleMode}
            setSelectedBibleMode={setSelectedBibleMode}
            handsfreeBibleButtonRef={handsfreeBibleButtonRef}
            toggleHandsfreeBible={toggleHandsfreeBible}
          />

          {/* Content Area with Sidebar and Main */}
          <div className="flex flex-1 h-full overflow-hidden">
            {/* Left Sidebar (Nav Bar 2) */}
            <ServiceSectionsSidebar
              isSidebarCollapsed={isSidebarCollapsed}
              isCalendarOpen={isCalendarOpen}
              setIsCalendarOpen={setIsCalendarOpen}
              selectedDate={selectedDate}
              renderCalendar={renderCalendar}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              isVoiceMenuOpen={isVoiceMenuOpen}
              setIsVoiceMenuOpen={setIsVoiceMenuOpen}
              isListeningMode={isListeningMode}
              toggleListening={toggleListening}
              isSuggestedItemsVisible={isSuggestedItemsVisible}
              setIsSuggestedItemsVisible={setIsSuggestedItemsVisible}
              serviceSections={serviceSections}
              selectedServiceSection={selectedServiceSection}
              setSelectedServiceSection={setSelectedServiceSection}
              sectionItems={sectionItems}
              toggleSection={toggleSection}
              expandedSections={expandedSections}
              setEditingContent={setEditingContent}
              setSelectedContentType={setSelectedContentType}
              setCurrentSongTitle={setCurrentSongTitle}
              setSongEditorContent={setSongEditorContent}
              parseLyricsIntoSections={parseLyricsIntoSections}
              setParsedLyrics={setParsedLyrics}
              setSongArrangement={setSongArrangement}
              setSelectedSlide={setSelectedSlide}
              editingContent={editingContent}
              showDeleteConfirmation={showDeleteConfirmation}
              isAddItemVisible={isAddItemVisible}
              setIsAddItemVisible={setIsAddItemVisible}
            />

            {/* Warning Notification */}
            {showSectionWarning && (
              <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
                <div className="bg-orange-500 border border-orange-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-3 animate-bounce">
                  <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                    <span className="text-orange-500 text-sm font-bold">!</span>
                  </div>
                  <span className="font-medium">
                    Please select a service section first (PRE-SERVICE, WARM-UP,
                    etc.)
                  </span>
                </div>
              </div>
            )}

            {/* Main Content Area - Build/Preview Mode */}
            <DashboardMainWorkspace
              isBuildMode={isBuildMode}
              editingContent={editingContent}
              selectedServiceSection={selectedServiceSection}
              handleSlideClick={handleSlideClick}
              setEditingContent={setEditingContent}
              updateItemContent={updateItemContent}
              isFullScreen={isFullscreen}
              toggleFullscreen={toggleFullscreen}
              isLive={isLive}
              parseLyricsIntoSections={parseLyricsIntoSections}
              setParsedLyrics={setParsedLyrics}
              setSongArrangement={setSongArrangement}
              setSelectedContentType={setSelectedContentType}
              setCurrentSongTitle={setCurrentSongTitle}
              setSongEditorContent={setSongEditorContent}
              showDeleteConfirmation={showDeleteConfirmation}
              isListeningMode={isListeningMode}
              toggleListening={toggleListening}
              toggleSection={toggleSection}
              activeMediaTab={activeMediaTab}
              gradientBackgrounds={gradientBackgrounds}
              fillColorBackgrounds={fillColorBackgrounds}
              applyBackgroundToCurrentItem={applyBackgroundToCurrentItem}
              getItemBackground={getItemBackground}
              currentUserId={currentUserId}
              goLive={goLive}
              exitLive={exitLive}
              editorState={editorState}
              titleEditorState={titleEditorState}
              activeTextarea={activeTextarea}
              handleUndo={handleUndo}
              handleRedo={handleRedo}
              setEditorState={setEditorState}
              applyFontFamily={applyFontFamily}
              applyFormatting={applyFormatting}
              listDropdownRef={listDropdownRef}
              setShowListStyleDropdown={setShowListStyleDropdown}
              showListStyleDropdown={showListStyleDropdown}
              insertTextAtCursor={insertTextAtCursor}
              parsedLyrics={parsedLyrics}
              currentSongTitle={currentSongTitle}
              titleTextAreaRef={titleTextAreaRef}
              setActiveTextarea={setActiveTextarea}
              applyStylesToTextarea={applyStylesToTextarea}
              showAuthorOnScreen={showAuthorOnScreen}
              setShowAuthorOnScreen={setShowAuthorOnScreen}
              songArrangement={songArrangement}
              createSlidesFromSong={createSlidesFromSong}
              songSearchTerm={songSearchTerm}
              setSongSearchTerm={setSongSearchTerm}
              showSearchResults={showSearchResults}
              filteredSongs={filteredSongs}
              setShowSearchResults={setShowSearchResults}
              handleSelectSong={handleSelectSong}
              insertedItems={insertedItems}
              setActiveTab={setActiveTab}
              togglePreview={togglePreview}
              currentlyDisplayedSlide={currentlyDisplayedSlide}
              previousSlide={previousSlide}
              nextSlide={nextSlide}
              getCurrentItemId={getCurrentItemId}
              setCurrentlyDisplayedSlide={setCurrentlyDisplayedSlide}
              clearZustandProjection={clearZustandProjection}
              liveWindow={liveWindow}
              itemBackgrounds={itemBackgrounds}
              toggleHandsfreeBible={toggleHandsfreeBible}
            />
          </div>
        </div>
      </div>
      {/* Hands-Free Bible Widget - Floating */}
      {isHandsfreeBibleOpen && (
        <div
          className="fixed z-50 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-xl cursor-move transition-opacity duration-200"
          style={{
            left: `${widgetPosition.x}px`,
            top: `${widgetPosition.y}px`,
            minWidth:
              selectedBibleMode === "Classic Hands-free Bible"
                ? "500px"
                : "400px",
            maxWidth:
              selectedBibleMode === "Classic Hands-free Bible"
                ? "600px"
                : "500px",
            opacity: isWidgetVisible ? 1 : 0,
            visibility: isWidgetVisible ? "visible" : "hidden",
          }}
          onMouseDown={handleDragStart}
        >
          {selectedBibleMode === "Classic Hands-free Bible" ? (
            /* Classic Hands-free Bible Widget */
            <>
              {/* Close Button - Top Right */}
              <button
                onClick={toggleHandsfreeBible}
                className="absolute top-4 right-4 text-gray-400 hover:text-white no-drag z-10"
              >
                <XIcon className="w-5 h-5" />
              </button>
              {/* Content */}
              <div className="p-6 space-y-6 text-center">
                {/* Q-worship Logo */}
                <div className="flex justify-center">
                  <img
                    src={qworshipLogo}
                    alt="Q-worship Logo"
                    className="w-12 h-12"
                  />
                </div>

                {/* Title with LIVE indicator */}
                <div className="flex items-center justify-center gap-3">
                  <h2 className="text-white text-2xl font-medium">
                    Hands-free Bible Companion
                  </h2>
                  {liveWindow && !liveWindow.closed && (
                    <span className="flex items-center gap-1 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded animate-pulse">
                      <span className="w-2 h-2 bg-white rounded-full"></span>
                      LIVE
                    </span>
                  )}
                </div>

                {/* Listening Status Bar */}
                <div
                  className={`rounded-full p-3 flex items-center justify-between ${
                    isSleepMode ? "bg-[#3D3D3D]" : "bg-[#444444]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center relative ${
                        isSleepMode
                          ? "bg-amber-600"
                          : isListeningMode
                            ? "bg-[#8356F3]"
                            : "bg-gray-600"
                      }`}
                    >
                      <Mic
                        className={`w-5 h-5 ${
                          isSleepMode
                            ? "text-amber-200"
                            : isListeningMode
                              ? "text-white"
                              : "text-gray-400"
                        } ${isListeningMode && !isSleepMode ? "animate-pulse" : ""}`}
                      />
                      {/* Mic off indicator */}
                      {!isListeningMode && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-0.5 bg-red-500 rotate-45 absolute"></div>
                        </div>
                      )}
                      {/* Beeping animation when actively listening (not sleeping) */}
                      {isListeningMode && !isSleepMode && (
                        <>
                          <div className="absolute inset-0 rounded-full bg-[#8356F3] animate-ping opacity-30"></div>
                          <div className="absolute inset-0 rounded-full bg-[#8356F3] animate-pulse opacity-20"></div>
                        </>
                      )}
                      {/* Sleep mode indicator - gentle pulse */}
                      {isListeningMode && isSleepMode && (
                        <div className="absolute inset-0 rounded-full bg-amber-600 animate-pulse opacity-30"></div>
                      )}
                    </div>
                    <span
                      className={`text-sm ${isSleepMode ? "text-amber-300" : "text-gray-300"}`}
                    >
                      {isSleepMode
                        ? 'Sleeping... Say "Bible"'
                        : isListeningMode
                          ? "Q-worship is listening"
                          : "Q-worship is off"}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 no-drag">
                    <span
                      className={`text-xs ${
                        isSleepMode
                          ? "text-amber-400"
                          : isListeningMode
                            ? "text-white"
                            : "text-gray-400"
                      }`}
                    >
                      {isSleepMode ? "SLEEP" : isListeningMode ? "ON" : "OFF"}
                    </span>
                    <Switch
                      checked={isListeningMode}
                      onCheckedChange={toggleMicrophone}
                      className={`${isSleepMode ? "data-[state=checked]:bg-amber-600" : "data-[state=checked]:bg-[#8356F3]"} data-[state=unchecked]:bg-gray-600`}
                    />
                  </div>
                </div>

                {/* Microphone Status and Commands Display - Only show when listening */}
                {isListeningMode && (
                  <div
                    className={`rounded-lg p-4 space-y-3 ${isSleepMode ? "bg-[#2D2518]" : "bg-[#2D1B42]"}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isSleepMode ? "bg-amber-600" : "bg-[#8356F3]"
                        }`}
                      >
                        <Mic
                          className={`w-4 h-4 ${isSleepMode ? "text-amber-200" : "text-white"}`}
                        />
                      </div>
                      <div>
                        <span
                          className={`text-sm font-medium block ${isSleepMode ? "text-amber-300" : "text-white"}`}
                        >
                          {isSleepMode
                            ? "Sleeping - waiting for wake phrase"
                            : "Listening for commands"}
                        </span>
                        <span
                          className={`text-xs ${isSleepMode ? "text-amber-400" : "text-gray-400"}`}
                        >
                          {microphoneStatus}
                        </span>
                      </div>
                    </div>
                    <div className="text-left">
                      <div
                        className={`text-xs mb-1 ${isSleepMode ? "text-amber-400" : "text-gray-400"}`}
                      >
                        {isSleepMode
                          ? 'Say "Bible" or "I\'m ready":'
                          : "Latest Detection:"}
                      </div>
                      <div
                        className={`text-sm rounded p-2 font-mono ${isSleepMode ? "text-amber-200 bg-[#1a1408]" : "text-white bg-[#1a0f2e]"}`}
                      >
                        {detectedCommands}
                      </div>
                    </div>
                  </div>
                )}

                {/* Scripture Display Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-white text-lg font-medium">
                      Scripture Display
                    </h3>
                    <button className="text-gray-400 hover:text-white no-drag">
                      <SettingsIcon className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Bible Version Tabs */}
                  <div className="bg-[#444444] rounded-lg p-1 flex space-x-1 no-drag">
                    {["KJV", "NKJV", "NIV", "AMP", "GN", "MSG", "ESV"].map(
                      (version) => (
                        <button
                          key={version}
                          onClick={() => {
                            setSelectedBibleVersion(version);
                            setZustandBibleVersion(version.toLowerCase());
                          }}
                          className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                            selectedBibleVersion === version
                              ? "bg-[#8356F3] text-white"
                              : "text-gray-300 hover:text-white hover:bg-gray-600"
                          }`}
                        >
                          {version}
                        </button>
                      ),
                    )}
                  </div>

                  {/* Scripture Content Area */}
                  <div className="bg-[#444444] rounded-lg p-6 min-h-[120px]">
                    {widgetVerseData && widgetVerseData[0] ? (
                      <div className="space-y-3">
                        {/* Reference Header */}
                        {widgetFormattedReference && (
                          <div className="flex items-center justify-between">
                            <span className="text-purple-400 text-sm font-medium">
                              {widgetFormattedReference}
                            </span>
                            <span className="text-gray-500 text-xs">
                              {selectedBibleVersion}
                            </span>
                          </div>
                        )}
                        {/* Verse Text */}
                        <p className="text-white text-base leading-relaxed">
                          {(() => {
                            const versionKey =
                              selectedBibleVersion.toLowerCase();
                            const verseText =
                              (widgetVerseData[0] as Record<string, any>)[
                                versionKey
                              ] ||
                              widgetVerseData[0].kjv ||
                              "";
                            return (
                              verseText ||
                              "Verse text not available for this version"
                            );
                          })()}
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <p className="text-gray-400 text-center">
                          {detectedCommands === "No commands detected"
                            ? "Say a Bible reference or use voice commands..."
                            : detectedCommands}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Navigation Controls */}
                  <div className="flex items-center justify-center space-x-4">
                    <button
                      className="w-10 h-10 rounded-full border-2 border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors no-drag"
                      onClick={() =>
                        executeNavigation("verse_change", "previous")
                      }
                    >
                      <ChevronLeftIcon className="w-5 h-5" />
                    </button>
                    <span className="text-gray-400 text-sm px-4">
                      Verse change
                    </span>
                    <button
                      className="w-10 h-10 rounded-full border-2 border-gray-500 flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-400 transition-colors no-drag"
                      onClick={() => executeNavigation("verse_change", "next")}
                    >
                      <ChevronRightIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* HFB-Editor: Standard Hands-free Bible Widget with Speech-to-text (Editor/Dashboard View) */
            <div
              className="fixed z-50 bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-xl w-80"
              style={{ left: widgetPosition.x, top: widgetPosition.y }}
            >
              <HandsfreeBibleWidget
                isFullscreen={false}
                isLive={liveWindow !== null && !liveWindow.closed}
                onClose={toggleHandsfreeBible}
                isListeningMode={isListeningMode}
                onToggleMicrophone={toggleMicrophone}
                selectedBibleVersion={selectedBibleVersion}
                setSelectedBibleVersion={setSelectedBibleVersion}
                detectedCommands={detectedCommands}
                setDetectedCommands={setDetectedCommands}
                verseData={widgetVerseData}
                formattedReference={widgetFormattedReference}
                volume={volume}
                onNavigate={(dir) => executeNavigation("verse_change", dir)}
              />
            </div>
          )}
        </div>
      )}
      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={isProfileSettingsOpen}
        onClose={() => setIsProfileSettingsOpen(false)}
      />
      {/* Subscription Management Modal */}
      <SubscriptionManagement
        isOpen={isSubscriptionOpen}
        onClose={() => setIsSubscriptionOpen(false)}
      />
      {/* Songbook Modal */}
      <SongbookModal
        isOpen={isSongbookOpen}
        onClose={() => setIsSongbookOpen(false)}
        onOpenSongEditor={(songData?: any) => {
          setImportedSongData(songData || null);
          setIsSongEditorOpen(true);
        }}
        savedSongs={savedSongs}
        onAddToServiceSection={addSongToServiceSections}
      />
      {/* Song Editor Modal */}
      <SongEditorModal
        isOpen={isSongEditorOpen}
        onClose={() => {
          setIsSongEditorOpen(false);
          setImportedSongData(null);
        }}
        initialData={importedSongData}
        onSave={(songData) => {
          console.log("Song saved:", songData);
          // No need to manually update state, as the song is already saved to the database
          // The query will automatically refresh to show the new song
          setIsSongEditorOpen(false);
          setImportedSongData(null);
        }}
      />
      {/* Song Search Modal */}
      <SongSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onSelectSong={handleSelectSong}
        searchTerm={songSearchTerm}
        onSearchTermChange={setSongSearchTerm}
        filteredSongs={filteredSongs || []}
        onSearch={handleModalSearch}
      />
      {/* Fixed Position Visual Styles Dropdown */}
      <StylesDropdown
        isOpen={isStylesDropdownOpen}
        position={dropdownPosition}
        onApplyStyle={applyFormatting}
        onClose={() => setIsStylesDropdownOpen(false)}
      />
      {/* Browse Media Modal */}
      {isMediaBrowserOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsMediaBrowserOpen(false);
            }
          }}
        >
          <div
            className="bg-[#1a0f2e] border border-gray-600 rounded-lg shadow-xl w-[95vw] h-[85vh] max-w-[1400px] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-600">
              <h3 className="text-white text-lg font-medium">
                Select Background Media
              </h3>
              <button
                onClick={() => setIsMediaBrowserOpen(false)}
                className="text-gray-400 hover:text-white p-1"
              >
                <XIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Media Browser Content - With Left Filter Panel */}
            <div className="flex h-full bg-[#0f0920]">
              {/* Left - Filter Panel */}
              <div className="w-64 border-r border-gray-600 bg-[#0f0920]">
                <div className="p-4 space-y-6 h-full overflow-y-auto">
                  {/* Search */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Search
                    </h3>
                    <div className="relative">
                      <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Search media..."
                        value={mediaSearchQuery}
                        onChange={(e) => setMediaSearchQuery(e.target.value)}
                        className="pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {/* Media Type Filter */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Media Type
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Motion Background",
                        "Motion Backgrounds",
                        "Images",
                        "Videos",
                        "Slides",
                      ].map((type) => (
                        <label
                          key={type}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={mediaTypeFilters.includes(type)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMediaTypeFilters([
                                  ...mediaTypeFilters,
                                  type,
                                ]);
                              } else {
                                setMediaTypeFilters(
                                  mediaTypeFilters.filter((f) => f !== type),
                                );
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                          />
                          <span className="text-gray-300 text-sm">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Categories/Tags Filter */}
                  {activeMediaTab === "cloud" && (
                    <div>
                      <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                        Categories
                      </h3>
                      <div className="space-y-2">
                        {[
                          "All Categories",
                          "Worship",
                          "Nature",
                          "Abstract",
                          "Biblical",
                          "Seasonal",
                        ].map((category) => (
                          <label
                            key={category}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={mediaCategoryFilters.includes(category)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMediaCategoryFilters([
                                    ...mediaCategoryFilters,
                                    category,
                                  ]);
                                } else {
                                  setMediaCategoryFilters(
                                    mediaCategoryFilters.filter(
                                      (f) => f !== category,
                                    ),
                                  );
                                }
                              }}
                              className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                            />
                            <span className="text-gray-300 text-sm">
                              {category}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recent */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Recent
                    </h3>
                    <div className="space-y-2">
                      {["Recently used", "Recently added"].map((item) => (
                        <label
                          key={item}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={mediaTypeFilters.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMediaTypeFilters([
                                  ...mediaTypeFilters,
                                  item,
                                ]);
                              } else {
                                setMediaTypeFilters(
                                  mediaTypeFilters.filter((f) => f !== item),
                                );
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                          />
                          <span className="text-gray-300 text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Media Tags & Collections */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Media Tags & Collections
                    </h3>
                    <div className="space-y-2">
                      {(() => {
                        // Show user-specific tags when on MY MEDIA tab, static tags for CLOUD MEDIA
                        const tagsToShow =
                          activeMediaTab === "my"
                            ? getUserMediaTags()
                            : [
                                "Waves",
                                "Science Visuals",
                                "Trees",
                                "Flowers",
                                "Backgrounds",
                                "Nature",
                                "Abstract",
                              ];

                        if (
                          activeMediaTab === "my" &&
                          tagsToShow.length === 0
                        ) {
                          return (
                            <div className="text-gray-400 text-sm italic">
                              No tags found in your media
                            </div>
                          );
                        }

                        return tagsToShow.map((tag) => (
                          <label
                            key={tag}
                            className="flex items-center space-x-2 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={mediaTagFilters.includes(tag)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setMediaTagFilters([...mediaTagFilters, tag]);
                                } else {
                                  setMediaTagFilters(
                                    mediaTagFilters.filter((f) => f !== tag),
                                  );
                                }
                              }}
                              className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                            />
                            <span className="text-gray-300 text-sm">{tag}</span>
                          </label>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Seasons */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Seasons
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Easter",
                        "Christmas",
                        "Lent",
                        "Advent",
                        "Ordinary Time",
                        "Thanksgiving",
                      ].map((season) => (
                        <label
                          key={season}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={mediaTagFilters.includes(season)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMediaTagFilters([
                                  ...mediaTagFilters,
                                  season,
                                ]);
                              } else {
                                setMediaTagFilters(
                                  mediaTagFilters.filter((f) => f !== season),
                                );
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                          />
                          <span className="text-gray-300 text-sm">
                            {season}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Service Items */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Service Items
                    </h3>
                    <div className="space-y-2">
                      {[
                        "Hands-free Bible",
                        "Song",
                        "Announcement",
                        "On-screen Bible",
                        "Slide Canvas",
                        "Content",
                      ].map((item) => (
                        <label
                          key={item}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={mediaTagFilters.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMediaTagFilters([...mediaTagFilters, item]);
                              } else {
                                setMediaTagFilters(
                                  mediaTagFilters.filter((f) => f !== item),
                                );
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                          />
                          <span className="text-gray-300 text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Live Screen Items */}
                  <div>
                    <h3 className="text-[#cea2fd] text-sm font-medium mb-3">
                      Live Screen Items
                    </h3>
                    <div className="space-y-2">
                      {["Logo", "Images", "Videos", "Content"].map((item) => (
                        <label
                          key={item}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={mediaTagFilters.includes(item)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setMediaTagFilters([...mediaTagFilters, item]);
                              } else {
                                setMediaTagFilters(
                                  mediaTagFilters.filter((f) => f !== item),
                                );
                              }
                            }}
                            className="rounded border-gray-600 bg-gray-700 text-[#8356F3]"
                          />
                          <span className="text-gray-300 text-sm">{item}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Clear Filters */}
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setMediaSearchQuery("");
                        setMediaTypeFilters([]);
                        setMediaCategoryFilters([]);
                        setMediaTagFilters([]);
                      }}
                      className="w-full border-gray-600 text-white hover:bg-gray-700 hover:text-white bg-[#0f0920]"
                    >
                      Clear All Filters
                    </Button>
                  </div>
                </div>
              </div>

              {/* Right - Media Content */}
              <div className="flex-1 overflow-hidden">
                <div className="h-full flex flex-col">
                  {/* Tab Navigation */}
                  <div className="flex border-b border-gray-600 bg-[#1a0f2e]">
                    <button
                      onClick={() => setActiveMediaTab("cloud")}
                      className={`px-6 py-3 transition-colors ${
                        activeMediaTab === "cloud"
                          ? "text-[#8356F3] border-b-2 border-[#8356F3] bg-[#8356F3]/10"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      CLOUD MEDIA
                    </button>
                    <button
                      onClick={() => setActiveMediaTab("my")}
                      className={`px-6 py-3 transition-colors ${
                        activeMediaTab === "my"
                          ? "text-[#8356F3] border-b-2 border-[#8356F3] bg-[#8356F3]/10"
                          : "text-gray-400 hover:text-white"
                      }`}
                    >
                      MY MEDIA
                    </button>
                  </div>

                  {/* Content based on active tab - now with filter support */}
                  <div className="flex-1 overflow-hidden custom-scrollbar">
                    {activeMediaTab === "cloud" ? (
                      <CloudMediaTab
                        searchQuery={mediaSearchQuery}
                        typeFilters={mediaTypeFilters}
                        categoryFilters={mediaCategoryFilters}
                        onSelectMedia={(mediaAsset) => {
                          console.log("🌩️ CLOUD MEDIA SELECTED:", mediaAsset);
                          const fileUrl =
                            mediaAsset.fileUrl ||
                            `${window.location.origin}/api/cloud-media/${mediaAsset.id}/file`;
                          console.log(
                            "⚡ APPLYING CLOUD MEDIA BACKGROUND:",
                            fileUrl,
                          );
                          console.log(
                            "🎭 Background type:",
                            mediaAsset.fileType?.startsWith("video")
                              ? "video"
                              : "image",
                          );
                          const currentItemId = getCurrentItemId();
                          console.log(
                            "🎯 Current item ID before apply:",
                            currentItemId,
                          );

                          const backgroundData = {
                            type: (mediaAsset.fileType?.startsWith("video")
                              ? "video"
                              : "image") as "video" | "image",
                            value: fileUrl,
                            name: mediaAsset.title,
                          };
                          console.log(
                            "📦 Final cloud background data:",
                            backgroundData,
                          );
                          console.log(
                            "🚀 About to call applyBackgroundToCurrentItem...",
                          );

                          applyBackgroundToCurrentItem(backgroundData);
                          console.log(
                            "✅ applyBackgroundToCurrentItem completed!",
                          );
                          setIsMediaBrowserOpen(false);
                        }}
                      />
                    ) : (
                      <MyMediaTab
                        currentUser={currentUserResponse?.user || null}
                        searchQuery={mediaSearchQuery}
                        typeFilters={mediaTypeFilters}
                        tagFilters={mediaTagFilters}
                        recentlyUploadedId={recentlyUploadedMediaId}
                        onSelectMedia={(mediaAsset) => {
                          console.log("🎯 MY MEDIA SELECTED:", mediaAsset);
                          const fileUrl = `${window.location.origin}/api/user-media-assets/${mediaAsset.id}/file`;
                          console.log(
                            "🚀 APPLYING USER MEDIA BACKGROUND:",
                            fileUrl,
                          );
                          console.log(
                            "🎨 Background type:",
                            mediaAsset.fileType?.startsWith("video")
                              ? "video"
                              : "image",
                          );
                          const currentItemId = getCurrentItemId();
                          console.log(
                            "🆔 Current item ID before apply:",
                            currentItemId,
                          );

                          const backgroundData = {
                            type: (mediaAsset.fileType?.startsWith("video")
                              ? "video"
                              : "image") as "video" | "image",
                            value: fileUrl,
                            name: mediaAsset.title,
                          };
                          console.log(
                            "🏷️ Final background data:",
                            backgroundData,
                          );
                          console.log(
                            "🚀 About to call applyBackgroundToCurrentItem...",
                          );

                          applyBackgroundToCurrentItem(backgroundData);
                          console.log(
                            "✅ applyBackgroundToCurrentItem completed!",
                          );
                          setIsMediaBrowserOpen(false);
                          // Clear the recently uploaded state after selection
                          setRecentlyUploadedMediaId(null);
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Background Import Media Modal */}
      <ImportFilesModal
        open={isImportImageOpen}
        onOpenChange={(open) => {
          setIsImportImageOpen(open);
          if (!open && recentlyUploadedMediaId) {
            // When import modal closes after successful upload,
            // open the full Assets page with the newly uploaded media pre-selected
            setTimeout(() => {
              setIsBackgroundAssetsModalOpen(true);
              setBackgroundModalMode("browse"); // Set to browse mode to show selection interface
            }, 300);
          }
        }}
        onMediaUploaded={(mediaAsset) => {
          // Store the uploaded media ID for preselection
          setRecentlyUploadedMediaId(mediaAsset.id);

          toast({
            title: "Media Uploaded Successfully!",
            description: "Your media is now available in MY MEDIA section",
            className: "bg-[#8356f3] text-white",
          });
        }}
      />
      {/* Background Assets Modal */}
      <BackgroundAssetsModal
        isOpen={isBackgroundAssetsModalOpen}
        onClose={() => setIsBackgroundAssetsModalOpen(false)}
        backgroundModalMode={backgroundModalMode}
        recentlyUploadedMediaId={recentlyUploadedMediaId}
        getCurrentItemId={getCurrentItemId}
        applyBackgroundToCurrentItem={(bg: any) =>
          applyBackgroundToCurrentItem(bg)
        }
      />

      {/* New Presentation Modal */}
      <NewPresentationModal
        isOpen={isNewPresentationModalOpen}
        onClose={() => setIsNewPresentationModalOpen(false)}
        newPresentationName={newPresentationName}
        setNewPresentationName={setNewPresentationName}
        isModalCalendarOpen={isModalCalendarOpen}
        setIsModalCalendarOpen={setIsModalCalendarOpen}
        modalSelectedDate={modalSelectedDate}
        formatModalDate={formatModalDate}
        renderModalCalendar={renderModalCalendar}
        handleCreateNewPresentation={handleCreateNewPresentation}
      />

      <ModalsContainer
        isOpenModalOpen={isOpenModalOpen}
        setIsOpenModalOpen={setIsOpenModalOpen}
        projectSearchQuery={projectSearchQuery}
        setProjectSearchQuery={setProjectSearchQuery}
        projectSortBy={projectSortBy}
        setProjectSortBy={setProjectSortBy}
        projectSortOrder={projectSortOrder}
        setProjectSortOrder={setProjectSortOrder}
        projectViewMode={projectViewMode}
        setProjectViewMode={setProjectViewMode}
        getFilteredAndSortedProjects={getFilteredAndSortedProjects}
        savedProjects={savedProjects}
        setIsNewPresentationModalOpen={setIsNewPresentationModalOpen}
        handleOpenProject={handleOpenProject}
        handleDeleteProject={handleDeleteProject}
        editingModalProjectId={editingModalProjectId}
        modalProjectNameInputRef={modalProjectNameInputRef}
        editingModalProjectName={editingModalProjectName}
        setEditingModalProjectName={setEditingModalProjectName}
        handleModalProjectNameKeyDown={handleModalProjectNameKeyDown}
        saveModalProjectName={saveModalProjectName}
        startEditingModalProjectName={startEditingModalProjectName}
        formatProjectDate={formatProjectDate}
        calculateSlideCount={calculateSlideCount}
        isImportModalOpen={isImportModalOpen}
        setIsImportModalOpen={setIsImportModalOpen}
        handleFileImport={handleFileImport}
        importPresentationMutation={importPresentationMutation}
        deleteConfirmation={deleteConfirmation}
        cancelDelete={cancelDelete}
        confirmDelete={confirmDelete}
        isDeleteModalOpen={isDeleteModalOpen}
        projectToDelete={projectToDelete}
        cancelDeleteProject={cancelDeleteProject}
        confirmDeleteProject={confirmDeleteProject}
        deletePresentationMutation={deletePresentationMutation}
        isIntegrationsModalOpen={isIntegrationsModalOpen}
        setIsIntegrationsModalOpen={setIsIntegrationsModalOpen}
        isPreferencesModalOpen={isPreferencesModalOpen}
        setIsPreferencesModalOpen={setIsPreferencesModalOpen}
        isDisplaySettingsModalOpen={isDisplaySettingsModalOpen}
        setIsDisplaySettingsModalOpen={setIsDisplaySettingsModalOpen}
        isAccountSettingsModalOpen={isAccountSettingsModalOpen}
        setIsAccountSettingsModalOpen={setIsAccountSettingsModalOpen}
        isAudioSettingsModalOpen={isAudioSettingsModalOpen}
        setIsAudioSettingsModalOpen={setIsAudioSettingsModalOpen}
        audioDevices={audioDevices}
        selectedAudioDeviceId={selectedAudioDeviceId}
        hasAudioPermission={hasAudioPermission}
        audioDevicesLoading={audioDevicesLoading}
        audioDevicesError={audioDevicesError}
        selectAudioDevice={selectAudioDevice}
        getSelectedDevice={getSelectedDevice}
        requestAudioPermission={requestAudioPermission}
        refreshAudioDevices={refreshAudioDevices}
        isLiveConsoleOpen={isLiveConsoleOpen}
        setIsLiveConsoleOpen={setIsLiveConsoleOpen}
        setCurrentSlide={setCurrentSlide}
        liveWindow={liveWindow}
        slides={slides}
        itemBackgrounds={itemBackgrounds}
        currentSlide={currentSlide}
        totalSlides={totalSlides}
        serviceItems={serviceItems}
        clearZustandProjection={clearZustandProjection}
        setActiveTab={setActiveTab}
        toggleHandsfreeBible={toggleHandsfreeBible}
        setIsSongbookOpen={setIsSongbookOpen}
        setIsBackgroundAssetsModalOpen={setIsBackgroundAssetsModalOpen}
      />
    </div>
  );
};

export const QworshipHomeV2Wrapper = () => (
  <DashboardUIProvider>
    <DashboardModalProvider>
      <DashboardPresentationProvider>
        <QworshipHomeV2Base />
      </DashboardPresentationProvider>
    </DashboardModalProvider>
  </DashboardUIProvider>
);
export default QworshipHomeV2Wrapper;
