import React from "react";
import { IntegrationsModal } from "@/features/dashboard/components/modals/IntegrationsModal";
import { PreferencesModal } from "@/features/dashboard/components/modals/PreferencesModal";
import { DisplaySettingsModal } from "@/features/dashboard/components/modals/DisplaySettingsModal";
import { AccountSettingsModal } from "@/features/dashboard/components/modals/AccountSettingsModal";
import { AudioSettingsModal } from "@/features/dashboard/components/modals/AudioSettingsModal";
import { LiveControlCentre } from "@/features/dashboard/components/LiveControlCentre";
import { OpenProjectsModal } from "./modals/OpenProjectsModal";
import { DeleteConfirmationModal } from "./modals/DeleteConfirmationModal";
import { ProjectDeleteConfirmationModal } from "./modals/ProjectDeleteConfirmationModal";
import { ImportPresentationModal } from "./modals/ImportPresentationModal";

interface ModalsContainerProps {
  // Open Projects Modal
  isOpenModalOpen: boolean;
  setIsOpenModalOpen: (open: boolean) => void;
  projectSearchQuery: string;
  setProjectSearchQuery: (query: string) => void;
  projectSortBy: string;
  setProjectSortBy: (sort: string) => void;
  projectSortOrder: "desc" | "asc";
  setProjectSortOrder: (order: "desc" | "asc") => void;
  projectViewMode: "list" | "grid";
  setProjectViewMode: React.Dispatch<React.SetStateAction<"list" | "grid">>;
  getFilteredAndSortedProjects: () => any[];
  savedProjects: any[];
  setIsNewPresentationModalOpen: (open: boolean) => void;
  handleOpenProject: (project: any) => void;
  handleDeleteProject: (projectId: number) => void;
  editingModalProjectId: string | number | null;
  modalProjectNameInputRef: React.RefObject<HTMLInputElement>;
  editingModalProjectName: string;
  setEditingModalProjectName: (name: string) => void;
  handleModalProjectNameKeyDown: (e: React.KeyboardEvent) => void;
  saveModalProjectName: () => void;
  startEditingModalProjectName: (project: any) => void;
  formatProjectDate: (date: any) => string;
  calculateSlideCount: (project: any) => number;

  // Import Presentation Modal
  isImportModalOpen: boolean;
  setIsImportModalOpen: (open: boolean) => void;
  handleFileImport: (file: File) => void;
  importPresentationMutation: any;

  // Delete Confirmation Modal
  deleteConfirmation: { isOpen: boolean; item: any; sectionName: string };
  cancelDelete: () => void;
  confirmDelete: () => void;

  // Project Delete Confirmation Modal
  isDeleteModalOpen: boolean;
  projectToDelete: any;
  cancelDeleteProject: () => void;
  confirmDeleteProject: () => void;
  deletePresentationMutation: any;

  // Integrations Settings Modal
  isIntegrationsModalOpen: boolean;
  setIsIntegrationsModalOpen: (open: boolean) => void;

  // Preferences Modal
  isPreferencesModalOpen: boolean;
  setIsPreferencesModalOpen: (open: boolean) => void;

  // Display Settings Modal
  isDisplaySettingsModalOpen: boolean;
  setIsDisplaySettingsModalOpen: (open: boolean) => void;

  // Account Settings Modal
  isAccountSettingsModalOpen: boolean;
  setIsAccountSettingsModalOpen: (open: boolean) => void;

  // Audio Settings Modal
  isAudioSettingsModalOpen: boolean;
  setIsAudioSettingsModalOpen: (open: boolean) => void;
  audioDevices: any[];
  selectedAudioDeviceId: string | null;
  hasAudioPermission: boolean | null;
  audioDevicesLoading: boolean;
  audioDevicesError: string | null;
  selectAudioDevice: (id: string) => void;
  getSelectedDevice: () => any;
  requestAudioPermission: () => void;
  refreshAudioDevices: () => void;

  // Live Console Modal
  isLiveConsoleOpen: boolean;
  setIsLiveConsoleOpen: (open: boolean) => void;
  setCurrentSlide: (slide: number) => void;
  liveWindow: Window | null;
  slides: any[];
  itemBackgrounds: Record<string, any>;
  currentSlide: number;
  totalSlides: number;
  serviceItems: any[];
  clearZustandProjection: () => void;
  setActiveTab: (tab: string) => void;
  toggleHandsfreeBible: () => void;
  setIsSongbookOpen: (open: boolean) => void;
  setIsBackgroundAssetsModalOpen: (open: boolean) => void;
}

export const ModalsContainer: React.FC<ModalsContainerProps> = (props) => {
  return (
    <>
      <OpenProjectsModal
        isOpenModalOpen={props.isOpenModalOpen}
        setIsOpenModalOpen={props.setIsOpenModalOpen}
        projectSearchQuery={props.projectSearchQuery}
        setProjectSearchQuery={props.setProjectSearchQuery}
        projectSortBy={props.projectSortBy}
        setProjectSortBy={props.setProjectSortBy}
        projectSortOrder={props.projectSortOrder}
        setProjectSortOrder={props.setProjectSortOrder}
        projectViewMode={props.projectViewMode}
        setProjectViewMode={props.setProjectViewMode}
        getFilteredAndSortedProjects={props.getFilteredAndSortedProjects}
        savedProjects={props.savedProjects}
        setIsNewPresentationModalOpen={props.setIsNewPresentationModalOpen}
        handleOpenProject={props.handleOpenProject}
        handleDeleteProject={props.handleDeleteProject}
        editingModalProjectId={props.editingModalProjectId}
        modalProjectNameInputRef={props.modalProjectNameInputRef}
        editingModalProjectName={props.editingModalProjectName}
        setEditingModalProjectName={props.setEditingModalProjectName}
        handleModalProjectNameKeyDown={props.handleModalProjectNameKeyDown}
        saveModalProjectName={props.saveModalProjectName}
        startEditingModalProjectName={props.startEditingModalProjectName}
        formatProjectDate={props.formatProjectDate}
        calculateSlideCount={props.calculateSlideCount}
      />

      <ImportPresentationModal
        isImportModalOpen={props.isImportModalOpen}
        setIsImportModalOpen={props.setIsImportModalOpen}
        handleFileImport={props.handleFileImport}
        importPresentationMutation={props.importPresentationMutation}
      />

      <DeleteConfirmationModal
        deleteConfirmation={props.deleteConfirmation}
        cancelDelete={props.cancelDelete}
        confirmDelete={props.confirmDelete}
      />

      <ProjectDeleteConfirmationModal
        isDeleteModalOpen={props.isDeleteModalOpen}
        projectToDelete={props.projectToDelete}
        cancelDeleteProject={props.cancelDeleteProject}
        confirmDeleteProject={props.confirmDeleteProject}
        deletePresentationMutation={props.deletePresentationMutation}
      />

      {/* Integrations Settings Modal */}
      <IntegrationsModal
        isOpen={props.isIntegrationsModalOpen}
        onClose={() => props.setIsIntegrationsModalOpen(false)}
      />

      {/* Preferences Modal */}
      <PreferencesModal
        isOpen={props.isPreferencesModalOpen}
        onClose={() => props.setIsPreferencesModalOpen(false)}
      />

      {/* Display Settings Modal */}
      <DisplaySettingsModal
        isOpen={props.isDisplaySettingsModalOpen}
        onClose={() => props.setIsDisplaySettingsModalOpen(false)}
      />

      {/* Account Settings Modal */}
      <AccountSettingsModal
        isOpen={props.isAccountSettingsModalOpen}
        onClose={() => props.setIsAccountSettingsModalOpen(false)}
      />

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={props.isAudioSettingsModalOpen}
        onClose={() => props.setIsAudioSettingsModalOpen(false)}
        devices={props.audioDevices}
        selectedDeviceId={props.selectedAudioDeviceId}
        hasPermission={props.hasAudioPermission ?? false}
        isLoading={props.audioDevicesLoading}
        error={props.audioDevicesError}
        selectDevice={props.selectAudioDevice}
        getSelectedDevice={props.getSelectedDevice}
        requestPermission={async () => {
          await props.requestAudioPermission();
          return props.hasAudioPermission ?? false;
        }}
        refreshDevices={async () => {
          await props.refreshAudioDevices();
        }}
      />
      {/* Live Console Modal */}
      <LiveControlCentre
        isOpen={props.isLiveConsoleOpen}
        onClose={() => {
          props.setIsLiveConsoleOpen(false);
          // Reset to first slide when closing Live Console
          props.setCurrentSlide(1);
          if (props.liveWindow && !props.liveWindow.closed) {
            const slideData = props.slides[0];
            const itemId = slideData?.itemId;
            const background = itemId ? props.itemBackgrounds[itemId] : null;
            props.liveWindow.postMessage(
              {
                type: "GO_TO_SLIDE",
                data: { slideIndex: 0, background, itemId },
              },
              window.location.origin,
            );
          }
        }}
        liveWindow={props.liveWindow}
        currentSlide={props.currentSlide}
        totalSlides={props.totalSlides || 1}
        slides={props.slides}
        serviceItems={props.serviceItems}
        itemBackgrounds={props.itemBackgrounds}
        onGoToSlide={(slideNumber) => {
          props.setCurrentSlide(slideNumber);
          // Clear Bible projection when navigating to slides
          props.clearZustandProjection();
          if (props.liveWindow && !props.liveWindow.closed) {
            const slideData = props.slides[slideNumber - 1];
            const itemId =
              slideData?.itemId || props.serviceItems[slideNumber - 1]?.id;
            const background = itemId ? props.itemBackgrounds[itemId] : null;

            props.liveWindow.postMessage(
              {
                type: "GO_TO_SLIDE",
                data: {
                  slideIndex: slideNumber - 1,
                  background: background,
                  itemId: itemId,
                },
              },
              window.location.origin,
            );
          }
        }}
        onPrevSlide={() => {
          if (props.currentSlide > 1) {
            const newSlideNumber = props.currentSlide - 1;
            props.setCurrentSlide(newSlideNumber);
            // Clear Bible projection when navigating to slides
            props.clearZustandProjection();
            if (props.liveWindow && !props.liveWindow.closed) {
              const slideData = props.slides[newSlideNumber - 1];
              const itemId =
                slideData?.itemId || props.serviceItems[newSlideNumber - 1]?.id;
              const background = itemId ? props.itemBackgrounds[itemId] : null;

              props.liveWindow.postMessage(
                {
                  type: "GO_TO_SLIDE",
                  data: {
                    slideIndex: newSlideNumber - 1,
                    background: background,
                    itemId: itemId,
                  },
                },
                window.location.origin,
              );
            }
          }
        }}
        onNextSlide={() => {
          const maxSlide = props.serviceItems.length || 1;
          if (props.currentSlide < maxSlide) {
            const newSlideNumber = props.currentSlide + 1;
            props.setCurrentSlide(newSlideNumber);
            // Clear Bible projection when navigating to slides
            props.clearZustandProjection();
            if (props.liveWindow && !props.liveWindow.closed) {
              const slideData = props.slides[newSlideNumber - 1];
              const itemId =
                slideData?.itemId || props.serviceItems[newSlideNumber - 1]?.id;
              const background = itemId ? props.itemBackgrounds[itemId] : null;

              props.liveWindow.postMessage(
                {
                  type: "GO_TO_SLIDE",
                  data: {
                    slideIndex: newSlideNumber - 1,
                    background: background,
                    itemId: itemId,
                  },
                },
                window.location.origin,
              );
            }
          }
        }}
        onOpenSlides={() => {
          props.setActiveTab("Project");
        }}
        onOpenBible={() => {
          props.toggleHandsfreeBible();
        }}
        onOpenHandsfreeBible={() => {
          props.toggleHandsfreeBible();
        }}
        onOpenSongs={() => {
          props.setIsSongbookOpen(true);
        }}
        onOpenBackground={() => {
          props.setIsBackgroundAssetsModalOpen(true);
        }}
        onOpenOBS={() => {
          props.setIsIntegrationsModalOpen(true);
        }}
        onOpenSettings={() => {
          props.setIsDisplaySettingsModalOpen(true);
        }}
      />
    </>
  );
};
