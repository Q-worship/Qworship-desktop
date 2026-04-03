import fs from "fs";
import path from "path";

const layoutPath = "/Users/rebeccashewuri/Documents/development/qworship/Qworship-v2/apps/client/src/features/dashboard/DashboardLayout.tsx";
let content = fs.readFileSync(layoutPath, "utf-8");

// The markers to slice
const startMarker = "// Load complete project bundle - IMPLEMENTATION per spec";
const endMarker = "// Handle deleting a project - now shows confirmation modal";

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found!", { startIndex, endIndex });
    process.exit(1);
}

// 1. Extract the raw block
const rawBlock = content.slice(startIndex, endIndex);

// 2. Generate the useProjectMutations Hook File
const hookContent = `import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export const useProjectMutations = ({
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
}: any) => {

${rawBlock}

  return {
    loadProjectMutation,
    handleOpenProject,
    savePresentationMutation,
    deletePresentationMutation,
    updatePresentationNameMutation,
    duplicatePresentationMutation,
    backupPresentationMutation,
    importPresentationMutation
  };
};
`;

const hookPath = "/Users/rebeccashewuri/Documents/development/qworship/Qworship-v2/apps/client/src/features/dashboard/hooks/useProjectMutations.ts";
fs.writeFileSync(hookPath, hookContent, "utf-8");

// 3. Replace the block in DashboardLayout.tsx
const replacement = `// Custom Hook for all API Mutations
  const {
    loadProjectMutation,
    handleOpenProject,
    savePresentationMutation,
    deletePresentationMutation,
    updatePresentationNameMutation,
    duplicatePresentationMutation,
    backupPresentationMutation,
    importPresentationMutation
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

  `;

content = content.slice(0, startIndex) + replacement + content.slice(endIndex);

// Add the import statement
const importStatement = 'import { useProjectMutations } from "@/features/dashboard/hooks/useProjectMutations";\n';
if (!content.includes("useProjectMutations")) {
    const importMarker = 'import { useProjectManager } from "@/features/dashboard/hooks/useProjectManager";';
    if (content.includes(importMarker)) {
        content = content.replace(importMarker, importMarker + "\n" + importStatement);
    } else {
        const topMarker = "import React,";
        content = content.replace(topMarker, importStatement + topMarker);
    }
}

fs.writeFileSync(layoutPath, content, "utf-8");
console.log("Extraction complete!");
