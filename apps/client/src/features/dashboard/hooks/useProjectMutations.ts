import { useMutation } from "@tanstack/react-query";
import { isWindowOpen } from "@/utils/windowUtils";
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

// Load complete project bundle - IMPLEMENTATION per spec
  const loadProjectMutation = useMutation({
    mutationFn: async (presentationId: string | number) => {
      console.log("📥 === LOADING COMPLETE Q-WORSHIP SERVICE BUNDLE ===");
      console.log("📥 Presentation ID:", presentationId);
      try {
        const response = await apiRequest(
          "GET",
          `/api/presentations/${presentationId}`,
        );
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        console.log("📥 API Response received:", result);
        return result;
      } catch (error) {
        console.error("❌ FAILED TO LOAD SERVICE BUNDLE:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("✅ === SERVICE BUNDLE LOADED SUCCESSFULLY ===");
      console.log("✅ Response data:", data);

      if (data.success && data.presentation) {
        const presentation = data.presentation;
        console.log("✅ Presentation container:", presentation);

        // Extract the complete service bundle from the .qwp container
        if (presentation.serviceData) {
          try {
            console.log(
              "✅ Raw service bundle data:",
              presentation.serviceData,
            );
            console.log("✅ Data type:", typeof presentation.serviceData);

            // Parse the JSON service bundle (equivalent to unzipping .pptx)
            const serviceBundle =
              typeof presentation.serviceData === "string"
                ? JSON.parse(presentation.serviceData)
                : presentation.serviceData;

            console.log("✅ Parsed service bundle:", serviceBundle);
            console.log("✅ Bundle contains:", Object.keys(serviceBundle));

            // === RESTORE COMPLETE WORSHIP SERVICE ===
            console.log("🎼 Restoring service items and songs...");
            if (serviceBundle.serviceItems) {
              console.log(
                "🎼 Service sections found:",
                Object.keys(serviceBundle.serviceItems),
              );
              setServiceItems(serviceBundle.serviceItems);
            }
            if (serviceBundle.sectionItems) {
              console.log(
                "🎼 Section items found:",
                serviceBundle.sectionItems,
              );
              setSectionItems(serviceBundle.sectionItems);
            }

            console.log(
              "🎬 Slides are computed from service items - no direct restoration needed",
            );
            // Note: slides and totalSlides are computed values from serviceItems
            // They will be automatically updated when serviceItems are restored above

            console.log("🎯 Restoring navigation and UI state...");
            if (serviceBundle.expandedSections) {
              console.log(
                "🎯 Expanded sections:",
                serviceBundle.expandedSections,
              );
              // Restore expandedSections as object structure (not Set)
              setExpandedSections(serviceBundle.expandedSections);
            }
            if (serviceBundle.currentSlide !== undefined) {
              console.log("🎯 Current slide:", serviceBundle.currentSlide);
              setCurrentSlide(serviceBundle.currentSlide);
            }

            console.log("↩️ Restoring undo/redo history...");
            if (serviceBundle.actionHistory) {
              console.log(
                "↩️ Action history entries:",
                serviceBundle.actionHistory.length,
              );
              setActionHistory(serviceBundle.actionHistory);
            }
            if (serviceBundle.actionHistoryIndex !== undefined) {
              console.log(
                "↩️ Action history index:",
                serviceBundle.actionHistoryIndex,
              );
              setActionHistoryIndex(serviceBundle.actionHistoryIndex);
            }

            console.log("🎨 Restoring background settings...");
            if (serviceBundle.backgroundSettings?.itemBackgrounds) {
              console.log(
                "🎨 Item backgrounds count:",
                Object.keys(serviceBundle.backgroundSettings.itemBackgrounds)
                  .length,
              );
              console.log(
                "🎨 Background details:",
                serviceBundle.backgroundSettings.itemBackgrounds,
              );
              setItemBackgrounds(
                serviceBundle.backgroundSettings.itemBackgrounds,
              );

              // Force re-render of components that depend on backgrounds
              console.log(
                "🎨 Triggering background restoration force update...",
              );
              setTimeout(() => {
                // Force component re-render by updating a state value
                setCurrentSlide((prev) => prev); // Trigger re-render without changing value

                // Also trigger custom event for any listening components
                const event = new CustomEvent("backgroundsRestored");
                document.dispatchEvent(event);

                console.log("🎨 Background restoration triggers completed");
              }, 100);
            }

            console.log("⚙️ Restoring live presentation settings...");
            if (serviceBundle.liveSettings) {
              console.log("⚙️ Live settings:", serviceBundle.liveSettings);
              const settings = serviceBundle.liveSettings;

              if (settings.transparency !== undefined)
                setSlideTransparency(settings.transparency);
              if (settings.textSize !== undefined)
                setSlideTextSize(settings.textSize);
              if (settings.logoSettings) setLogoSettings(settings.logoSettings);
              if (settings.autoAdvance !== undefined)
                setAutoAdvanceEnabled(settings.autoAdvance);
              if (settings.autoAdvanceDelay !== undefined)
                setAutoAdvanceDelay(settings.autoAdvanceDelay);
              if (settings.transitionEffect !== undefined)
                setTransitionEffect(settings.transitionEffect);
              if (settings.showTimestamp !== undefined)
                setShowTimestamp(settings.showTimestamp);
              if (settings.timestampPosition !== undefined)
                setTimestampPosition(settings.timestampPosition);
            }

            console.log("📖 Restoring Bible widget state...");
            if (serviceBundle.bibleWidgetState) {
              console.log(
                "📖 Bible widget settings:",
                serviceBundle.bibleWidgetState,
              );
              const bibleState = serviceBundle.bibleWidgetState;

              if (bibleState.visible !== undefined)
                setBibleWidgetVisible(bibleState.visible);
              if (bibleState.position)
                setBibleWidgetPosition(bibleState.position);
              if (bibleState.currentVerse)
                setCurrentVerse(bibleState.currentVerse);
              if (bibleState.currentBook)
                setCurrentBook(bibleState.currentBook);
              if (bibleState.currentChapter !== undefined)
                setCurrentChapter(bibleState.currentChapter);
              if (bibleState.dragMode !== undefined)
                setBibleWidgetDragMode(bibleState.dragMode);
            }

            console.log("🔍 Restoring media and search state...");
            if (serviceBundle.selectedMedia) {
              console.log("🔍 Selected media:", serviceBundle.selectedMedia);
              setSelectedMediaAsset(serviceBundle.selectedMedia);
            }
            if (serviceBundle.searchQuery) {
              console.log("🔍 Search query:", serviceBundle.searchQuery);
              setSearchQuery(serviceBundle.searchQuery);
            }
            if (serviceBundle.activeFilters) {
              console.log("🔍 Active filters:", serviceBundle.activeFilters);
              setActiveFilters(serviceBundle.activeFilters);
            }

            console.log("✏️ Restoring editor state...");
            if (serviceBundle.editorState) {
              console.log(
                "✏️ Editor configuration:",
                serviceBundle.editorState,
              );
              const editorState = serviceBundle.editorState;

              if (editorState.activeItemId) {
                // Find the active item from service items
                const activeItem = Object.values(
                  serviceBundle.serviceItems || {},
                )
                  .flat()
                  .find((item: any) => item.id === editorState.activeItemId);

                if (activeItem) {
                  setActiveServiceItem(editorState.activeItemId);
                  console.log(
                    "✏️ Active service item restored:",
                    (activeItem as any).title,
                  );
                }
              }

              if (editorState.editorContent) {
                setEditorContent(editorState.editorContent);
                console.log("✏️ Editor content restored");
              }
            }

            console.log(
              "✅ === Q-WORSHIP SERVICE BUNDLE COMPLETELY RESTORED ===",
            );
            console.log("📊 Final restoration summary:");
            console.log(
              "📊 Service sections:",
              Object.keys(serviceBundle.serviceItems || {}).length,
            );
            console.log(
              "📊 Total slides:",
              (serviceBundle.slides || []).length,
            );
            console.log(
              "📊 Background items:",
              Object.keys(
                serviceBundle.backgroundSettings?.itemBackgrounds || {},
              ).length,
            );
            console.log(
              "📊 Current itemBackgrounds state after restore:",
              itemBackgrounds,
            );
            console.log(
              "📊 The entire worship service is now loaded exactly as saved",
            );

            // Auto-select first item if no active service item was restored
            console.log("🎯 Checking if auto-selection should run...");
            console.log("🎯 Current activeServiceItem:", activeServiceItem);
            console.log(
              "🎯 serviceBundle.editorState?.activeItemId:",
              serviceBundle.editorState?.activeItemId,
            );

            // Force auto-selection for better user experience
            console.log("🎯 FORCING auto-selection for loaded project...");
            console.log(
              "🎯 Available service items for auto-selection:",
              serviceBundle.serviceItems,
            );
            // Use a timeout to ensure all state has been updated
            setTimeout(() => {
              autoSelectFirstServiceItem(serviceBundle.serviceItems);
            }, 300);

            // Trigger background update to live presentation if it's open
            if (liveWindow && isWindowOpen(liveWindow)) {
              console.log(
                "🎨 Syncing restored backgrounds to live presentation...",
              );
              liveWindow.postMessage(
                {
                  type: "BACKGROUNDS_RESTORED",
                  itemBackgrounds:
                    serviceBundle.backgroundSettings?.itemBackgrounds || {},
                },
                "*",
              );
            }
          } catch (parseError) {
            console.error("🔴 ERROR PARSING SAVED DATA:", parseError);
            console.error(
              "🔴 RAW DATA THAT FAILED TO PARSE:",
              presentation.serviceData,
            );
          }
        } else {
          console.log(
            "🔴 NO SERVICE DATA FOUND IN PRESENTATION:",
            presentation,
          );
          // Still try to auto-select first item from current state
          console.log("🎯 FORCING auto-selection from current state...");
          console.log("🎯 Current service items:", serviceItems);
          setTimeout(() => {
            autoSelectFirstServiceItem(serviceItems);
          }, 300);
        }
      } else {
        console.log("🔴 INVALID RESPONSE DATA:", data);
      }
    },
    onError: (error: any) => {
      console.error("Failed to load project:", error);
      toast({
        title: "Load Failed",
        description: error.message || "Failed to load project data",
        variant: "destructive",
      });
    },
  });

  // Handle opening a project - COMPLETE IMPLEMENTATION per requirements
  const handleOpenProject = (project: any) => {
    console.log("📂 === OPENING Q-WORSHIP PROJECT ===");
    console.log("📂 Project:", project);
    console.log("📂 Project ID:", project.id);
    console.log("📂 Project Name:", project.name);

    // 1. Clear current workspace state before switching (like closing current PowerPoint file)
    console.log("📂 Clearing current workspace state...");
    clearWorkspaceState();

    // 2. Set the opened project as current context
    setCurrentPresentationName(project.name);
    setCurrentPresentationId(project.id);

    // 3. Sync with session storage for persistence
    sessionStorage.setItem(
      "qworship_current_presentation_id",
      project.id.toString(),
    );
    sessionStorage.setItem("qworship_current_presentation_name", project.name);

    // 4. Load the complete project bundle from database
    console.log("📂 Loading complete service bundle for ID:", project.id);
    loadProjectMutation.mutate(project.id);

    // 5. Close modal and reset UI
    setIsOpenModalOpen(false);
    setProjectSearchQuery("");
    setProjectSortBy("lastModified");
    setProjectSortOrder("desc");
    setProjectViewMode("list");

    toast({
      title: "Project Opened",
      description: `"${project.name}" service bundle loaded successfully.`,
    });
  };

  // Save presentation mutation
  const savePresentationMutation = useMutation({
    mutationFn: async ({
      presentationId,
      data,
      isManualSave,
    }: {
      presentationId: string | number;
      data: any;
      isManualSave?: boolean;
    }) => {
      console.log("Saving presentation with data:", {
        presentationId,
        data,
        isManualSave,
      });
      try {
        const response = await apiRequest(
          "PUT",
          `/api/presentations/${presentationId}`,
          data,
        );
        const result = await response.json();
        console.log("Save API request successful:", result);
        return { ...result, isManualSave };
      } catch (error: any) {
        console.error("Save API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      refetchPresentations();
      // Only show success toast for manual saves
      if (data.isManualSave) {
        toast({
          title: "Presentation Saved",
          description: `"${currentPresentationName}" has been saved successfully.`,
          className: "bg-green-600 border-green-400 text-white",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Save Failed",
        description: error.message || "Failed to save presentation",
        variant: "destructive",
      });
    },
  });

  // Delete presentation mutation
  const deletePresentationMutation = useMutation({
    mutationFn: async (presentationId: string | number) => {
      return await apiRequest("DELETE", `/api/presentations/${presentationId}`);
    },
    onSuccess: () => {
      refetchPresentations();
      toast({
        title: "Project Deleted",
        description: "The project has been deleted successfully.",
        variant: "destructive",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete presentation",
        variant: "destructive",
      });
    },
  });

  // Update presentation name mutation
  const updatePresentationNameMutation = useMutation({
    mutationFn: async ({
      presentationId,
      name,
    }: {
      presentationId: string | number;
      name: string;
    }) => {
      console.log("Updating presentation name:", { presentationId, name });
      try {
        const response = await apiRequest(
          "PUT",
          `/api/presentations/${presentationId}`,
          { name },
        );
        const result = await response.json();
        console.log("Update name API request successful:", result);
        return result;
      } catch (error: any) {
        console.error("Update name API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      refetchPresentations();
      setCurrentPresentationName(data.presentation.name);

      // Sync with session storage
      sessionStorage.setItem(
        "qworship_current_presentation_name",
        data.presentation.name,
      );

      toast({
        title: "Project Renamed",
        description: `Project renamed to "${data.presentation.name}"`,
        className: "bg-purple-600 border-purple-400 text-white",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rename Failed",
        description: error.message || "Failed to rename project",
        variant: "destructive",
      });
    },
  });

  // Duplicate presentation mutation
  const duplicatePresentationMutation = useMutation({
    mutationFn: async (originalPresentationId: string | number) => {
      console.log("Duplicating presentation:", originalPresentationId);
      try {
        const response = await apiRequest(
          "POST",
          `/api/presentations/${originalPresentationId}/duplicate`,
        );
        const result = await response.json();
        console.log("Duplicate API request successful:", result);
        return result;
      } catch (error: any) {
        console.error("Duplicate API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      refetchPresentations();

      console.log("📋 === DUPLICATE PRESENTATION SUCCESS ===");
      console.log("📋 Duplicated presentation:", data.presentation);
      console.log("📋 Loading duplicated content...");

      // Clear any existing workspace state before switching to duplicated project
      clearWorkspaceState();

      // Set the duplicated project as current context
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

      // Load the complete duplicated project bundle from database
      console.log(
        "📋 Loading complete service bundle for duplicated ID:",
        data.presentation.id,
      );
      loadProjectMutation.mutate(data.presentation.id);

      toast({
        title: "Presentation Duplicated",
        description: `"${data.presentation.name}" has been created and loaded successfully.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Duplicate Failed",
        description: error.message || "Failed to duplicate presentation",
        variant: "destructive",
      });
    },
  });

  // Backup presentation (export to PowerPoint) mutation
  const backupPresentationMutation = useMutation({
    mutationFn: async (presentationId: string | number) => {
      console.log("Backing up presentation:", presentationId);
      try {
        const response = await fetch(
          `/api/presentations/${presentationId}/backup`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (response.ok) {
          const blob = await response.blob();

          // Use File System Access API for proper "Save as" dialog
          if ("showSaveFilePicker" in window) {
            try {
              const fileHandle = await (window as any).showSaveFilePicker({
                suggestedName: `${currentPresentationName}.pptx`,
                types: [
                  {
                    description: "PowerPoint presentations",
                    accept: {
                      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
                        [".pptx"],
                    },
                  },
                ],
              });

              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();

              return { success: true, method: "file-system-api" };
            } catch (error: any) {
              // User cancelled the save dialog or browser doesn't support it
              if (error.name === "AbortError") {
                throw new Error("Save operation was cancelled");
              }
              throw error;
            }
          } else {
            // Fallback to traditional download for browsers that don't support File System Access API
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${currentPresentationName}.pptx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            return { success: true, method: "download-fallback" };
          }
        } else {
          throw new Error("Failed to backup presentation");
        }
      } catch (error: any) {
        console.error("Backup API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      const method = data?.method || "unknown";
      const message =
        method === "file-system-api"
          ? `"${currentPresentationName}" has been saved to your selected location.`
          : `"${currentPresentationName}" has been exported to your Downloads folder.`;

      toast({
        title: "Backup Complete",
        description: message,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Backup Failed",
        description: error.message || "Failed to backup presentation",
        variant: "destructive",
      });
    },
  });

  // Import presentation from PowerPoint mutation
  const importPresentationMutation = useMutation({
    mutationFn: async (file: File) => {
      console.log("Importing presentation from file:", file.name);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/presentations/import", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to import presentation");
        }

        const result = await response.json();
        console.log("Import API request successful:", result);
        return result;
      } catch (error: any) {
        console.error("Import API request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      refetchPresentations();
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

      // Load imported slides into current service items
      if (data.presentation.slides && data.presentation.slides.length > 0) {
        const importedServiceItems = data.presentation.slides.map(
          (slide: any, index: number) => ({
            id: `imported-${Date.now()}-${index}`,
            section: "service" as const,
            type: "custom" as const,
            title: slide.title || `Slide ${index + 1}`,
            content: slide.content || "",
            slides: [
              {
                id: `slide-${Date.now()}-${index}`,
                type: "custom" as const,
                title: slide.title || `Slide ${index + 1}`,
                content: slide.content || "",
                sectionLabel: "Imported",
              },
            ],
          }),
        );

        setServiceItems((prev: any[]) => [...prev, ...importedServiceItems]);
        setSectionItems((prev: Record<string, any[]>) => ({
          ...prev,
          "SERVICE ITEMS": [
            ...(prev["SERVICE ITEMS"] || []),
            ...importedServiceItems,
          ],
        }));
      }

      toast({
        title: "Import Complete",
        description: `"${data.presentation.name}" has been imported successfully.`,
      });
      setIsImportModalOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import presentation",
        variant: "destructive",
      });
    },
  });

  

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
