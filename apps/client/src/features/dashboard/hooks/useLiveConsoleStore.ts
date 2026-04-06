import { create } from 'zustand';

export type LeftPanelTab = 'on-screen-bible' | 'hfb' | null;
export type LiveScreenMode = 'none' | 'song' | 'bible' | 'hfb-bible' | 'image' | 'video' | 'slides';
export type BackgroundType = 'color' | 'image' | 'video';

interface LiveConsoleStore {
  // Panel Toggles
  leftPanelTab: LeftPanelTab;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  isBibleMode: boolean;
  setIsBibleMode: (isBibleMode: boolean) => void;
  isSongMode: boolean;
  setIsSongMode: (isSongMode: boolean) => void;

  // Global Active Mode
  activeMode: LiveScreenMode;
  setActiveMode: (mode: LiveScreenMode) => void;

  // Modals
  isBackgroundModalOpen: boolean;
  setIsBackgroundModalOpen: (open: boolean) => void;
  isOBSModalOpen: boolean;
  setIsOBSModalOpen: (open: boolean) => void;
  isSettingsModalOpen: boolean;
  setIsSettingsModalOpen: (open: boolean) => void;
  isLogoAssetsModalOpen: boolean;
  setIsLogoAssetsModalOpen: (open: boolean) => void;
  isBackgroundAssetsModalOpen: boolean;
  setIsBackgroundAssetsModalOpen: (open: boolean) => void;
  isLowerThirdSettingsOpen: boolean;
  setIsLowerThirdSettingsOpen: (open: boolean) => void;
  isSongModalOpen: boolean;
  setIsSongModalOpen: (open: boolean) => void;

  // Background Customization (Staging)
  backgroundType: BackgroundType;
  setBackgroundType: (type: BackgroundType) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
  backgroundImage: string | null;
  setBackgroundImage: (image: string | null) => void;
  backgroundVideo: string | null;
  setBackgroundVideo: (video: string | null) => void;

  // Background Customization (Applied/Live)
  appliedBackgroundType: BackgroundType;
  setAppliedBackgroundType: (type: BackgroundType) => void;
  appliedBackgroundColor: string;
  setAppliedBackgroundColor: (color: string) => void;
  appliedBackgroundImage: string | null;
  setAppliedBackgroundImage: (image: string | null) => void;
  appliedBackgroundVideo: string | null;
  setAppliedBackgroundVideo: (video: string | null) => void;
  hasLiveSettingsBackground: boolean;
  setHasLiveSettingsBackground: (has: boolean) => void;
  backgroundAssetType: 'image' | 'video';
  setBackgroundAssetType: (type: 'image' | 'video') => void;

  // Customization Settings
  customLogo: string;
  setCustomLogo: (logo: string) => void;
  logoSize: 'small' | 'medium' | 'large';
  setLogoSize: (size: 'small' | 'medium' | 'large') => void;
  logoPosition: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  setLogoPosition: (pos: 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right') => void;
  showServiceTitle: boolean;
  setShowServiceTitle: (show: boolean) => void;
  customServiceTitle: string;
  setCustomServiceTitle: (title: string) => void;
  serviceTitleSize: 'small' | 'medium' | 'large' | 'extra-large';
  setServiceTitleSize: (size: 'small' | 'medium' | 'large' | 'extra-large') => void;
  showTimestamp: boolean;
  setShowTimestamp: (show: boolean) => void;
  showSocialHandles: boolean;
  setShowSocialHandles: (show: boolean) => void;

  // Preview Prejections
  previewProjectionType: 'song' | 'bible' | null;
  setPreviewProjectionType: (type: 'song' | 'bible' | null) => void;
  previewSongProjection: { title: string; sectionTitle: string; lyrics: string; background?: any; itemId?: string; } | null;
  setPreviewSongProjection: (proj: any) => void;
  previewBibleProjection: { reference: string; text: string; version: string; background?: any; } | null;
  setPreviewBibleProjection: (proj: any) => void;

  settingsScreen: 'main' | 'slide' | 'customization' | 'display';
  setSettingsScreen: (screen: 'main' | 'slide' | 'customization' | 'display') => void;
}

export const useLiveConsoleStore = create<LiveConsoleStore>((set) => ({
  leftPanelTab: null,
  setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
  isBibleMode: false,
  setIsBibleMode: (isBibleMode) => set({ isBibleMode }),
  isSongMode: false,
  setIsSongMode: (isSongMode) => set({ isSongMode }),

  activeMode: 'none',
  setActiveMode: (mode) => set({ activeMode: mode }),

  isBackgroundModalOpen: false,
  setIsBackgroundModalOpen: (o) => set({ isBackgroundModalOpen: o }),
  isOBSModalOpen: false,
  setIsOBSModalOpen: (o) => set({ isOBSModalOpen: o }),
  isSettingsModalOpen: false,
  setIsSettingsModalOpen: (o) => set({ isSettingsModalOpen: o }),
  isLogoAssetsModalOpen: false,
  setIsLogoAssetsModalOpen: (o) => set({ isLogoAssetsModalOpen: o }),
  isBackgroundAssetsModalOpen: false,
  setIsBackgroundAssetsModalOpen: (o) => set({ isBackgroundAssetsModalOpen: o }),
  isLowerThirdSettingsOpen: false,
  setIsLowerThirdSettingsOpen: (o) => set({ isLowerThirdSettingsOpen: o }),
  isSongModalOpen: false,
  setIsSongModalOpen: (o) => set({ isSongModalOpen: o }),

  backgroundType: 'color',
  setBackgroundType: (t) => set({ backgroundType: t }),
  backgroundColor: '#000000',
  setBackgroundColor: (c) => set({ backgroundColor: c }),
  backgroundImage: null,
  setBackgroundImage: (i) => set({ backgroundImage: i }),
  backgroundVideo: null,
  setBackgroundVideo: (v) => set({ backgroundVideo: v }),

  appliedBackgroundType: 'color',
  setAppliedBackgroundType: (t) => set({ appliedBackgroundType: t }),
  appliedBackgroundColor: '#000000',
  setAppliedBackgroundColor: (c) => set({ appliedBackgroundColor: c }),
  appliedBackgroundImage: null,
  setAppliedBackgroundImage: (i) => set({ appliedBackgroundImage: i }),
  appliedBackgroundVideo: null,
  setAppliedBackgroundVideo: (v) => set({ appliedBackgroundVideo: v }),
  hasLiveSettingsBackground: false,
  setHasLiveSettingsBackground: (h) => set({ hasLiveSettingsBackground: h }),
  backgroundAssetType: 'image',
  setBackgroundAssetType: (t) => set({ backgroundAssetType: t }),

  customLogo: '',
  setCustomLogo: (l) => set({ customLogo: l }),
  logoSize: 'medium',
  setLogoSize: (s) => set({ logoSize: s }),
  logoPosition: 'bottom-right',
  setLogoPosition: (p) => set({ logoPosition: p }),
  showServiceTitle: false,
  setShowServiceTitle: (s) => set({ showServiceTitle: s }),
  customServiceTitle: '',
  setCustomServiceTitle: (t) => set({ customServiceTitle: t }),
  serviceTitleSize: 'medium',
  setServiceTitleSize: (s) => set({ serviceTitleSize: s }),
  showTimestamp: false,
  setShowTimestamp: (s) => set({ showTimestamp: s }),
  showSocialHandles: false,
  setShowSocialHandles: (s) => set({ showSocialHandles: s }),

  previewProjectionType: null,
  setPreviewProjectionType: (t) => set({ previewProjectionType: t }),
  previewSongProjection: null,
  setPreviewSongProjection: (p) => set({ previewSongProjection: p }),
  previewBibleProjection: null,
  setPreviewBibleProjection: (p) => set({ previewBibleProjection: p }),

  settingsScreen: 'main',
  setSettingsScreen: (s) => set({ settingsScreen: s }),
}));
