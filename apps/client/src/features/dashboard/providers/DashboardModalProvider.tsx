import React, { createContext, useContext, useState, ReactNode } from "react";

export interface DashboardModalContextType {
  isSlideEditorOpen: boolean; setIsSlideEditorOpen: (val: boolean) => void;
  isCalendarOpen: boolean; setIsCalendarOpen: (val: boolean) => void;
  isVoiceMenuOpen: boolean; setIsVoiceMenuOpen: (val: boolean) => void;
  isListeningDropdownOpen: boolean; setIsListeningDropdownOpen: (val: boolean) => void;
  isLiveConsoleOpen: boolean; setIsLiveConsoleOpen: (val: boolean) => void;
  isBiblePreferencesOpen: boolean; setIsBiblePreferencesOpen: (val: boolean) => void;
  isSearchModalOpen: boolean; setIsSearchModalOpen: (val: boolean) => void;
  isSettingsOpen: boolean; setIsSettingsOpen: (val: boolean) => void;
  showAssetsModal: boolean; setShowAssetsModal: (val: boolean) => void;
  showImportModal: boolean; setShowImportModal: (val: boolean) => void;
  showSongbook: boolean; setShowSongbook: (val: boolean) => void;
  isStylesDropdownOpen: boolean; setIsStylesDropdownOpen: (val: boolean) => void;
  isBackgroundDropdownOpen: boolean; setIsBackgroundDropdownOpen: (val: boolean) => void;
  isMediaBrowserOpen: boolean; setIsMediaBrowserOpen: (val: boolean) => void;
  isImportImageOpen: boolean; setIsImportImageOpen: (val: boolean) => void;
  isBackgroundAssetsModalOpen: boolean; setIsBackgroundAssetsModalOpen: (val: boolean) => void;
  isNewPresentationModalOpen: boolean; setIsNewPresentationModalOpen: (val: boolean) => void;
  isIntegrationsModalOpen: boolean; setIsIntegrationsModalOpen: (val: boolean) => void;
  isPreferencesModalOpen: boolean; setIsPreferencesModalOpen: (val: boolean) => void;
  isDisplaySettingsModalOpen: boolean; setIsDisplaySettingsModalOpen: (val: boolean) => void;
  isAccountSettingsModalOpen: boolean; setIsAccountSettingsModalOpen: (val: boolean) => void;
  isAudioSettingsModalOpen: boolean; setIsAudioSettingsModalOpen: (val: boolean) => void;
  isOpenModalOpen: boolean; setIsOpenModalOpen: (val: boolean) => void;
  isDeleteModalOpen: boolean; setIsDeleteModalOpen: (val: boolean) => void;
  isDuplicateModalOpen: boolean; setIsDuplicateModalOpen: (val: boolean) => void;
  isDuplicateRecentOpen: boolean; setIsDuplicateRecentOpen: (val: boolean) => void;
  isBackupModalOpen: boolean; setIsBackupModalOpen: (val: boolean) => void;
  isRestoreModalOpen: boolean; setIsRestoreModalOpen: (val: boolean) => void;
  isImportModalOpen: boolean; setIsImportModalOpen: (val: boolean) => void;
}

const DashboardModalContext = createContext<DashboardModalContextType | undefined>(undefined);

export const DashboardModalProvider = ({ children }: { children: ReactNode }) => {
  const [isSlideEditorOpen, setIsSlideEditorOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isVoiceMenuOpen, setIsVoiceMenuOpen] = useState(false);
  const [isListeningDropdownOpen, setIsListeningDropdownOpen] = useState(false);
  const [isLiveConsoleOpen, setIsLiveConsoleOpen] = useState(false);
  const [isBiblePreferencesOpen, setIsBiblePreferencesOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showAssetsModal, setShowAssetsModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showSongbook, setShowSongbook] = useState(false);
  const [isStylesDropdownOpen, setIsStylesDropdownOpen] = useState(false);
  const [isBackgroundDropdownOpen, setIsBackgroundDropdownOpen] = useState(false);
  const [isMediaBrowserOpen, setIsMediaBrowserOpen] = useState(false);
  const [isImportImageOpen, setIsImportImageOpen] = useState(false);
  const [isBackgroundAssetsModalOpen, setIsBackgroundAssetsModalOpen] = useState(false);
  const [isNewPresentationModalOpen, setIsNewPresentationModalOpen] = useState(false);
  const [isIntegrationsModalOpen, setIsIntegrationsModalOpen] = useState(false);
  const [isPreferencesModalOpen, setIsPreferencesModalOpen] = useState(false);
  const [isDisplaySettingsModalOpen, setIsDisplaySettingsModalOpen] = useState(false);
  const [isAccountSettingsModalOpen, setIsAccountSettingsModalOpen] = useState(false);
  const [isAudioSettingsModalOpen, setIsAudioSettingsModalOpen] = useState(false);
  const [isOpenModalOpen, setIsOpenModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
  const [isDuplicateRecentOpen, setIsDuplicateRecentOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  return (
    <DashboardModalContext.Provider
      value={{
        isSlideEditorOpen, setIsSlideEditorOpen,
        isCalendarOpen, setIsCalendarOpen,
        isVoiceMenuOpen, setIsVoiceMenuOpen,
        isListeningDropdownOpen, setIsListeningDropdownOpen,
        isLiveConsoleOpen, setIsLiveConsoleOpen,
        isBiblePreferencesOpen, setIsBiblePreferencesOpen,
        isSearchModalOpen, setIsSearchModalOpen,
        isSettingsOpen, setIsSettingsOpen,
        showAssetsModal, setShowAssetsModal,
        showImportModal, setShowImportModal,
        showSongbook, setShowSongbook,
        isStylesDropdownOpen, setIsStylesDropdownOpen,
        isBackgroundDropdownOpen, setIsBackgroundDropdownOpen,
        isMediaBrowserOpen, setIsMediaBrowserOpen,
        isImportImageOpen, setIsImportImageOpen,
        isBackgroundAssetsModalOpen, setIsBackgroundAssetsModalOpen,
        isNewPresentationModalOpen, setIsNewPresentationModalOpen,
        isIntegrationsModalOpen, setIsIntegrationsModalOpen,
        isPreferencesModalOpen, setIsPreferencesModalOpen,
        isDisplaySettingsModalOpen, setIsDisplaySettingsModalOpen,
        isAccountSettingsModalOpen, setIsAccountSettingsModalOpen,
        isAudioSettingsModalOpen, setIsAudioSettingsModalOpen,
        isOpenModalOpen, setIsOpenModalOpen,
        isDeleteModalOpen, setIsDeleteModalOpen,
        isDuplicateModalOpen, setIsDuplicateModalOpen,
        isDuplicateRecentOpen, setIsDuplicateRecentOpen,
        isBackupModalOpen, setIsBackupModalOpen,
        isRestoreModalOpen, setIsRestoreModalOpen,
        isImportModalOpen, setIsImportModalOpen,
      }}
    >
      {children}
    </DashboardModalContext.Provider>
  );
};

export const useDashboardModals = () => {
  const context = useContext(DashboardModalContext);
  if (context === undefined) {
    throw new Error("useDashboardModals must be used within a DashboardModalProvider");
  }
  return context;
};
