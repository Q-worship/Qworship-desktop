import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, Image } from "lucide-react";

interface CloudMediaAsset {
  id: number;
  title: string;
  description?: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
  tags: string[];
  isPremium: boolean;
  downloadCount: number;
  viewCount: number;
  createdAt: string;
  categories: {
    id: number;
    name: string;
    slug: string;
  }[];
}

interface MediaAsset {
  id: number;
  title: string;
  type: string;
  thumbnail: string | null;
  uploadedBy: string;
  tags: string[] | null;
  collection: string;
  season?: string | null;
  usageCount: number;
  createdAt: string;
  lastUsed?: string | null;
  fileSize?: number;
  description?: string;
}

interface DynamicMediaSectionsProps {
  activeTab: "cloud-media" | "my-media" | "templates";
  userId: string;
  hasUsedAssets: boolean;
  hasUploadedAssets: boolean;
  selectedMedia?: {
    sectionIndex: number;
    itemIndex: number;
    title: string;
    color: string;
    type: string;
    asset?: MediaAsset;
  } | null;
  onMediaSelect?: (
    selectedMedia: {
      sectionIndex: number;
      itemIndex: number;
      title: string;
      color: string;
      type: string;
      asset?: MediaAsset;
    } | null,
  ) => void;
  activeFilters?: {
    categories: string[];
    mediaTypes: string[];
    tags: string[];
    seasons: string[];
    recent: string[];
    service: string[];
    liveScreen: string[];
  };
  isVideoOnly?: boolean;
  onAssetSelect?: (assetUrl: string, assetType: string, assetTitle?: string) => void;
  isModal?: boolean;
  recentlyUploadedMediaId?: number | null;
}

const ImageThumbnail = ({ asset, activeTab }: { asset: MediaAsset; activeTab: string }) => {
  const [hasError, setHasError] = React.useState(false);
  const isVideo = asset.type?.toLowerCase().startsWith('video');

  if (hasError || !asset.thumbnail) {
    if (isVideo && activeTab) {
      const videoUrl = activeTab === 'cloud-media' 
        ? `/api/cloud-media/${asset.id}/file` 
        : `/api/user-media-assets/${asset.id}/file`;
        
      return (
        <video
          src={videoUrl}
          className="w-full h-48 object-cover rounded-t pointer-events-none bg-black/40"
          preload="metadata"
          muted
          playsInline
        />
      );
    }

    return (
      <div className="w-full h-48 bg-[#2a1b3e] flex items-center justify-center rounded-t border-b border-[#cea2fd]/20">
        <div className="text-[#cea2fd]/40 text-xs font-medium font-['Poppins',Helvetica]">
          {isVideo ? 'Video asset' : 'Media preview'}
        </div>
      </div>
    );
  }

  return (
    <img
      src={asset.thumbnail}
      alt="Media preview"
      className="w-full h-48 object-cover rounded-t pointer-events-none"
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
};

export const DynamicMediaSections: React.FC<DynamicMediaSectionsProps> = ({
  activeTab,
  userId,
  hasUsedAssets,
  hasUploadedAssets,
  selectedMedia,
  onMediaSelect,
  activeFilters,
  isVideoOnly = false,
  onAssetSelect,
  isModal = false,
  recentlyUploadedMediaId = null,
}) => {
  // Fetch cloud media assets with categories for CLOUD MEDIA tab
  const { data: cloudMediaAssets = [], isLoading: cloudLoading } = useQuery<
    CloudMediaAsset[]
  >({
    queryKey: ["/api/cloud-media"],
    enabled: activeTab === "cloud-media",
    staleTime: 30 * 1000,
  });

  // Fetch user media assets for MY MEDIA tab using the correct API endpoint
  const { data: userMediaResponse, isLoading: userLoading } = useQuery<{
    success: boolean;
    assets: any[];
  }>({
    queryKey: ["/api/user-media-assets"],
    enabled: activeTab === "my-media",
    staleTime: 30 * 1000,
  });

  // Transform user media assets to match MediaAsset interface
  const userMediaAssets: MediaAsset[] =
    userMediaResponse?.assets?.map((asset) => {
      // For video files, use generated thumbnail if available, otherwise use placeholder
      const assetType = asset.fileType?.toLowerCase() || "image";
      let thumbnailPath = `/api/user-media-assets/${asset.id}/thumbnail`;
      
      if (assetType === "video") {
        if (!asset.thumbnailPath) {
          // Fallback to placeholder if no thumbnail generated
          thumbnailPath = "";
        }
      }

      // Debug logging for video assets
      if (assetType === "video") {
        console.log("Processing video asset:", {
          id: asset.id,
          title: asset.title,
          fileType: asset.fileType,
          originalFilePath: asset.filePath,
          newThumbnailPath: thumbnailPath,
          mimeType: asset.mimeType,
        });
      }

      return {
        id: asset.id,
        title: asset.title,
        type: assetType,
        thumbnail: thumbnailPath,
        uploadedBy: "user",
        tags: Array.isArray(asset.tags)
          ? asset.tags
          : asset.tags
            ? [asset.tags]
            : [],
        collection: Array.isArray(asset.categories)
          ? asset.categories.join(", ")
          : asset.categories || "Uncategorized",
        season: null,
        usageCount: 0,
        createdAt:
          asset.uploadedAt || asset.createdAt || new Date().toISOString(),
        lastUsed: null,
        fileSize: asset.fileSize,
        description: asset.description,
      };
    }) || [];

  // Helper function to apply filters to assets
  const applyFilters = (assets: any[]) => {
    // First apply video-only filter if specified
    let filteredAssets = assets;
    if (isVideoOnly) {
      filteredAssets = assets.filter((asset: any) => {
        const assetType = asset.fileType || asset.type;
        return assetType?.toLowerCase() === "video";
      });
    }

    if (
      !activeFilters ||
      (activeFilters.categories.length === 0 &&
        activeFilters.mediaTypes.length === 0 &&
        activeFilters.tags.length === 0 &&
        activeFilters.seasons.length === 0 &&
        activeFilters.recent.length === 0 &&
        activeFilters.service?.length === 0 &&
        activeFilters.liveScreen?.length === 0)
    ) {
      return filteredAssets;
    }

    return filteredAssets.filter((asset: any) => {
      // Check category filters
      if (activeFilters.categories.length > 0) {
        const hasMatchingCategory = activeFilters.categories.some(
          (category) => {
            // Check if asset collection matches
            if (
              asset.collection &&
              asset.collection.toLowerCase().includes(category.toLowerCase())
            ) {
              return true;
            }
            // Check if asset tags contain the category
            if (
              asset.tags &&
              Array.isArray(asset.tags) &&
              asset.tags.some((tag: string) =>
                tag.toLowerCase().includes(category.toLowerCase()),
              )
            ) {
              return true;
            }
            // Check if asset categories contain the category (for user uploaded media)
            if (
              asset.categories &&
              Array.isArray(asset.categories) &&
              asset.categories.some((cat: string) =>
                cat.toLowerCase().includes(category.toLowerCase()),
              )
            ) {
              return true;
            }
            return false;
          },
        );
        if (!hasMatchingCategory) return false;
      }

      // Check media type filters
      if (activeFilters.mediaTypes.length > 0) {
        const hasMatchingType = activeFilters.mediaTypes.some((type) => {
          const assetType = asset.fileType || asset.type;
          if (type === "Images" && assetType?.toLowerCase() === "image")
            return true;
          if (type === "Videos" && assetType?.toLowerCase() === "video")
            return true;
          if (
            type === "Motion Background" &&
            assetType?.toLowerCase() === "video"
          )
            return true;
          if (
            type === "Motion Backgrounds" &&
            assetType?.toLowerCase() === "video"
          )
            return true;
          if (
            type === "Slides" &&
            (assetType?.toLowerCase() === "image" ||
              assetType?.toLowerCase() === "document")
          )
            return true;
          return false;
        });
        if (!hasMatchingType) return false;
      }

      // Check tag filters
      if (activeFilters.tags.length > 0) {
        const hasMatchingTag = activeFilters.tags.some(
          (filterTag) =>
            asset.tags &&
            Array.isArray(asset.tags) &&
            asset.tags.some((assetTag: string) =>
              assetTag.toLowerCase().includes(filterTag.toLowerCase()),
            ),
        );
        if (!hasMatchingTag) return false;
      }

      // Check season filters
      if (activeFilters.seasons.length > 0) {
        const hasMatchingSeason = activeFilters.seasons.some((season) => {
          if (
            asset.season &&
            asset.season.toLowerCase().includes(season.toLowerCase())
          ) {
            return true;
          }
          // Also check tags for seasonal content
          if (
            asset.tags &&
            asset.tags.some((tag: string) =>
              tag.toLowerCase().includes(season.toLowerCase()),
            )
          ) {
            return true;
          }
          return false;
        });
        if (!hasMatchingSeason) return false;
      }

      // Check service item filters
      if (activeFilters.service && activeFilters.service.length > 0) {
        const hasMatchingService = activeFilters.service.some((service) => {
          if (
            asset.serviceType &&
            asset.serviceType.toLowerCase().includes(service.toLowerCase())
          ) {
            return true;
          }
          // Also check tags for service items
          if (
            asset.tags &&
            asset.tags.some((tag: string) =>
              tag.toLowerCase().includes(service.toLowerCase()),
            )
          ) {
            return true;
          }
          return false;
        });
        if (!hasMatchingService) return false;
      }

      // Check live screen filters
      if (activeFilters.liveScreen && activeFilters.liveScreen.length > 0) {
        const hasMatchingLiveScreen = activeFilters.liveScreen.some((item) => {
          if (
            asset.liveScreenType &&
            asset.liveScreenType.toLowerCase().includes(item.toLowerCase())
          ) {
            return true;
          }
          // Also check tags for live screen items
          if (
            asset.tags &&
            asset.tags.some((tag: string) =>
              tag.toLowerCase().includes(item.toLowerCase()),
            )
          ) {
            return true;
          }
          return false;
        });
        if (!hasMatchingLiveScreen) return false;
      }

      return true;
    });
  };

  // Helper function to sort assets based on recent filters
  const applySorting = (assets: any[]) => {
    if (!activeFilters || activeFilters.recent.length === 0) {
      return assets;
    }

    // Create a copy to avoid mutating the original
    let sortedAssets = [...assets];

    activeFilters.recent.forEach((recentFilter) => {
      if (recentFilter === "Recently added") {
        sortedAssets = sortedAssets.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
      } else if (recentFilter === "Recently used") {
        sortedAssets = sortedAssets.sort((a, b) => {
          const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          return bLastUsed - aLastUsed;
        });
      }
    });

    return sortedAssets;
  };

  // Transform and determine which data to use based on active tab
  const rawMediaAssets =
    activeTab === "cloud-media"
      ? // Convert cloud media assets to MediaAsset interface for compatibility
        cloudMediaAssets.map((asset) => {
          // For cloud media, handle video thumbnails properly too
          const assetType = asset?.fileType?.toLowerCase() || "image";
          let thumbnailPath = `/api/cloud-media/${asset.id}/thumbnail`;
          
          if (assetType === "video" && !asset?.thumbnailPath) {
            // Use placeholder only if no thumbnail available
            thumbnailPath = "";
          }

          return {
            id: asset.id,
            title: asset.title,
            type: asset.fileType,
            thumbnail: thumbnailPath,
            uploadedBy: "admin",
            tags: asset.tags,
            collection:
              asset.categories?.find((cat) =>
                ["Waves", "Science Visuals", "Trees", "Flowers"].includes(
                  cat.name,
                ),
              )?.name || "General",
            season:
              asset.categories?.find((cat) =>
                [
                  "Easter",
                  "Christmas",
                  "Lent",
                  "Advent",
                  "Ordinary Time",
                  "Thanksgiving",
                ].includes(cat.name),
              )?.name || null,
            usageCount: asset.viewCount || 0,
            createdAt: asset.createdAt,
            lastUsed: null,
            fileSize: asset.fileSize,
            description: asset.description,
          };
        })
      : userMediaAssets;

  // Apply filters and sorting to the assets
  const filteredAssets = applyFilters(rawMediaAssets);
  const mediaAssets = applySorting(filteredAssets);

  const isLoading = activeTab === "cloud-media" ? cloudLoading : userLoading;

  // Clear selection immediately when switching to MY MEDIA with no assets
  React.useEffect(() => {
    if (activeTab === "my-media" && !hasUploadedAssets && onMediaSelect) {
      onMediaSelect(null);
    }
  }, [activeTab, hasUploadedAssets, onMediaSelect]);

  // Auto-select first item when tab changes or data loads
  React.useEffect(() => {
    if (onMediaSelect) {
      // For CLOUD MEDIA: Always auto-select first item when data is loaded
      if (activeTab === "cloud-media" && !isLoading && mediaAssets.length > 0) {
        const firstAsset = mediaAssets[0];
        if (selectedMedia?.asset?.id !== firstAsset.id) {
          onMediaSelect({
            sectionIndex: 1, // Recently added section
            itemIndex: 0,
            title: firstAsset.title,
            color: "#8356f3",
            type: firstAsset.type,
            asset: firstAsset,
          });
        }
      // For MY MEDIA: Auto-selection is handled entirely in MyMediaPatch.tsx to avoid infinite loop conflicts
      }
    }
  }, [
    activeTab,
    isLoading,
    mediaAssets.length, // Only depend on length to prevent ref-change loops
    hasUploadedAssets,
    onMediaSelect,
    selectedMedia?.asset?.id,
  ]);

  // Effect to handle filter changes and auto-select when returning to default view
  React.useEffect(() => {
    // When filters are cleared (all empty), auto-select first item if available
    const allFiltersEmpty =
      !activeFilters ||
      (activeFilters.categories.length === 0 &&
        activeFilters.mediaTypes.length === 0 &&
        activeFilters.tags.length === 0 &&
        activeFilters.seasons.length === 0 &&
        activeFilters.recent.length === 0);

    if (
      allFiltersEmpty &&
      onMediaSelect &&
      !isLoading &&
      mediaAssets.length > 0
    ) {
      // For CLOUD MEDIA: Auto-select first item when returning to default view
      if (activeTab === "cloud-media") {
        const firstAsset = mediaAssets[0];
        if (selectedMedia?.asset?.id !== firstAsset.id) {
          onMediaSelect({
            sectionIndex: 1,
            itemIndex: 0,
            title: firstAsset.title,
            color: "#8356f3",
            type: firstAsset.type,
            asset: firstAsset,
          });
        }
      }
      // For MY MEDIA: Auto-selection is handled in MyMediaPatch.tsx to avoid conflicts
      // Remove this duplicate logic to prevent asset mismatch issues
    }
  }, [
    activeFilters,
    activeTab,
    isLoading,
    mediaAssets.length, // Only depend on length
    hasUploadedAssets,
    onMediaSelect,
    selectedMedia?.asset?.id,
  ]);

  // Process assets for different sections
  const getRecentlyUsedAssets = () => {
    if (!hasUsedAssets) return [];
    return mediaAssets
      .filter((asset) => asset.lastUsed)
      .sort(
        (a, b) =>
          new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime(),
      )
      .slice(0, 6);
  };

  const getRecentlyAddedAssets = () => {
    if (activeTab === "cloud-media") {
      return mediaAssets
        .filter((asset) => asset.uploadedBy === "admin")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    } else {
      if (!hasUploadedAssets) return [];
      return mediaAssets
        .filter((asset) => asset.uploadedBy === "user")
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
  };

  // Auto-select recently uploaded media when it becomes available
  useEffect(() => {
    if (
      recentlyUploadedMediaId &&
      userMediaAssets.length > 0 &&
      activeTab === "my-media" &&
      onMediaSelect
    ) {
      const uploadedAsset = userMediaAssets.find(
        (asset) => asset.id === recentlyUploadedMediaId,
      );
      if (uploadedAsset) {
        // Find the index of this asset in the Recently Added section
        const recentlyAddedAssets = getRecentlyAddedAssets();
        const itemIndex = recentlyAddedAssets.findIndex(
          (asset) => asset.id === recentlyUploadedMediaId,
        );

        if (selectedMedia?.asset?.id !== uploadedAsset.id) {
          console.log(
            "Auto-selecting recently uploaded media:",
            uploadedAsset.title,
          );
          console.log("Asset position in Recently Added:", itemIndex);

          onMediaSelect({
            sectionIndex: 1, // Recently Added section index
            itemIndex: itemIndex >= 0 ? itemIndex : 0, // Use actual index or fallback to 0
            title: uploadedAsset.title,
            color: "#8356f3", // Q-worship purple
            type: uploadedAsset.type,
            asset: uploadedAsset,
          });
        }
      }
    }
  }, [
    recentlyUploadedMediaId,
    userMediaAssets.length, // Use length instead of object ref
    activeTab,
    onMediaSelect,
    mediaAssets.length, // Use length instead of object ref
    selectedMedia?.asset?.id,
  ]);

  const getSuggestedAssets = () => {
    const adminAssets = mediaAssets.filter(
      (asset) => asset.uploadedBy === "admin",
    );
    return adminAssets.sort(() => Math.random() - 0.5);
  };

  const getPopularAssets = () => {
    return mediaAssets.sort((a, b) => b.usageCount - a.usageCount);
  };

  const getTagsCollectionsAssets = () => {
    const uniqueCollections = Array.from(
      new Set(mediaAssets.map((asset) => asset.collection)),
    );
    const uniqueTags = Array.from(
      new Set(mediaAssets.flatMap((asset) => asset.tags || [])),
    );

    const sampleAssets: MediaAsset[] = [];

    uniqueCollections.forEach((collection) => {
      const collectionAssets = mediaAssets.filter(
        (asset) => asset.collection === collection,
      );
      if (collectionAssets.length > 0) {
        sampleAssets.push(...collectionAssets);
      }
    });

    uniqueTags.forEach((tag) => {
      const tagAssets = mediaAssets.filter(
        (asset) => asset.tags && asset.tags.includes(tag),
      );
      tagAssets.forEach((asset) => {
        if (!sampleAssets.find((a) => a.id === asset.id)) {
          sampleAssets.push(asset);
        }
      });
    });

    return sampleAssets;
  };

  const getSeasonsAssets = () => {
    const seasons = [
      "Easter",
      "Christmas",
      "Lent",
      "Advent",
      "Ordinary Time",
      "Thanksgiving",
    ];
    const sampleAssets: MediaAsset[] = [];

    seasons.forEach((season) => {
      const seasonAssets = mediaAssets.filter(
        (asset) => asset.season === season,
      );
      sampleAssets.push(...seasonAssets);
    });

    return sampleAssets;
  };

  const renderMediaCard = (
    asset: MediaAsset,
    index: number,
    sectionIndex: number,
  ) => {
    const isSelected =
      selectedMedia?.sectionIndex === sectionIndex &&
      selectedMedia?.itemIndex === index;

    const handleCardClick = () => {
      console.log("🎬 CARD CLICKED - Asset:", asset.title, "Type:", asset.type);
      console.log("🔧 Modal mode:", isModal);
      console.log("📋 OnAssetSelect available:", !!onAssetSelect);

      // Check if this window was opened for background selection from Live Settings
      const isBackgroundSelection =
        window.opener && window.name === "qworship-assets";
      console.log("🪟 Background selection mode:", isBackgroundSelection);

      // Priority 1: Handle modal selection
      if (isModal && onAssetSelect) {
        console.log("✅ MODAL SELECTION PATH - Processing asset");
        // For background selection, we need the ACTUAL file path, not the thumbnail
        let assetUrl: string;

        // For user media assets, use the original filePath property from the raw asset data
        // This contains the actual video file path, not the thumbnail
        const rawAsset =
          activeTab === "my-media"
            ? userMediaResponse?.assets?.find((a) => a.id === asset.id)
            : cloudMediaAssets?.find((a) => a.id === asset.id);

        if (activeTab === "cloud-media") {
          assetUrl = `/api/cloud-media/${asset.id}/file`;
        } else if (activeTab === "my-media") {
          assetUrl = `/api/user-media-assets/${asset.id}/file`;
        } else {
          // Final fallback to thumbnail
          assetUrl = asset.thumbnail || "";
        }

        // Call the callback with the asset URL, type, and title
        console.log("🚀 CALLING onAssetSelect with:", assetUrl, asset.type, asset.title);
        onAssetSelect(assetUrl, asset.type, asset.title);
        console.log("✅ onAssetSelect callback completed");
        return; // Don't proceed with normal selection behavior
      }

      if (isBackgroundSelection) {
        // For background selection, we need the ACTUAL file path, not the thumbnail
        let assetUrl: string;

        // For user media assets, use the original filePath property from the raw asset data
        // This contains the actual video file path, not the thumbnail
        const rawAsset =
          activeTab === "my-media"
            ? userMediaResponse?.assets?.find((a) => a.id === asset.id)
            : cloudMediaAssets?.find((a) => a.id === asset.id);

        if (activeTab === "cloud-media") {
          assetUrl = `/api/cloud-media/${asset.id}/file`;
        } else if (activeTab === "my-media") {
          assetUrl = `/api/user-media-assets/${asset.id}/file`;
        } else {
          // Final fallback to thumbnail
          assetUrl = asset.thumbnail || "";
        }

        console.log(
          "Sending asset URL for background:",
          assetUrl,
          "Asset type:",
          asset.type,
          "Raw asset data:",
          rawAsset,
        );

        if (assetUrl && window.opener && !window.opener.closed) {
          window.opener.postMessage(
            {
              type: "ASSET_SELECTED_FOR_BACKGROUND",
              assetUrl: assetUrl,
            },
            window.location.origin,
          );
        }
        return; // Don't proceed with normal selection behavior
      }

      // Normal selection behavior for regular Assets page usage
      if (onMediaSelect) {
        onMediaSelect({
          sectionIndex,
          itemIndex: index,
          title: asset.title,
          color: "#8356f3", // Q-worship purple
          type: asset.type,
          asset: asset, // Pass the complete asset data
        });
      }
    };

    console.log(
      "🔄 Rendering media card:",
      asset.title,
      "isModal:",
      isModal,
      "onAssetSelect:",
      !!onAssetSelect,
    );

    return (
      <div
        className={`bg-transparent border-0 hover:border hover:border-[#cea2fd] transition-colors cursor-pointer rounded-lg ${
          isSelected ? "border border-[#cea2fd] bg-[#cea2fd]/10" : ""
        }`}
        onClick={(e) => {
          console.log("🖱️ CLICK EVENT TRIGGERED for asset:", asset.title);
          e.preventDefault();
          e.stopPropagation();
          handleCardClick();
        }}
        onMouseDown={(e) => {
          console.log("🖱️ MOUSEDOWN EVENT TRIGGERED for asset:", asset.title);
          e.preventDefault();
          e.stopPropagation();
          handleCardClick();
        }}
        onMouseEnter={() => {
          console.log("🏠 MOUSE ENTER for asset:", asset.title);
        }}
        onMouseLeave={() => {
          console.log("🚪 MOUSE LEAVE for asset:", asset.title);
        }}
        style={{
          userSelect: "none",
          pointerEvents: "auto",
          zIndex: 1,
          position: "relative",
        }}>
        <div className="p-0">
          <div className="flex flex-col">
            <div className="relative">
              <ImageThumbnail asset={asset} activeTab={activeTab} />
              <div className="absolute top-2 right-2 bg-black/60 rounded-full p-1.5 pointer-events-none">
                {asset.type?.toLowerCase() === "video" ? (
                  <Play className="w-4 h-4 text-white fill-white" />
                ) : activeTab === "templates" ? (
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-[400px]">
              <div className="text-gray-400 text-lg mb-4 font-medium uppercase tracking-widest relative z-10" style={{ textShadow: "0 2px 4px rgba(0,0,0,0.5)" }}>
                Premium Templates Coming Soon
              </div>
              <p className="text-gray-500 text-center max-w-md text-sm mt-2">
                Professionally designed presentation templates will be available in the upcoming release to help you create stunning worship experiences faster.
              </p>
            </div>
          ) : (
                  <Image className="w-4 h-4 text-white" />
                )}
              </div>
              {/* NEW badge for recently uploaded media */}
              {recentlyUploadedMediaId === asset.id && (
                <div className="absolute top-2 left-2 bg-[#8356f3] text-white text-xs font-bold px-2 py-1 rounded-full pointer-events-none">
                  NEW
                </div>
              )}
            </div>
            <p className="text-white p-2 text-xs font-medium font-['Poppins',Helvetica] pointer-events-none">
              {asset.title}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderMediaSection = (
    title: string,
    assets: MediaAsset[],
    show: boolean = true,
    sectionIndex: number,
  ) => {
    if (!show || assets.length === 0) return null;

    return (
      <div className="mb-8 transition-all duration-300 ease-in-out">
        <h2 className="text-white text-lg font-semibold mb-4 font-['Poppins',Helvetica]">
          {title}
        </h2>
        <div className="grid grid-cols-3 gap-4">
            {/* Only limit Recently used media to 6 items, show all for other sections */}
            {(title === "Recently used media" ? assets.slice(0, 6) : assets).map(
              (asset, index) => (
                <div key={`${asset.id}-${index}`}>
                  {renderMediaCard(asset, index, sectionIndex)}
                </div>
              )
            )}
          </div>
        </div>
      );
    };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-white">Loading media assets...</div>
      </div>
    );
  }

  // Show empty state for MY MEDIA when no user assets exist
  if (activeTab === "my-media" && mediaAssets.length === 0) {
    return (
      <ScrollArea className="h-full pr-3">
        <div className="space-y-8 transition-all duration-300 ease-in-out">
          {/* Recently used media empty state */}
          <div className="mb-8">
            <h2 className="text-white text-lg font-semibold mb-4 font-['Poppins',Helvetica]">
              Recently used media
            </h2>
            <div className="flex items-center justify-center py-20">
              <div className="border-2 border-dashed border-[#8356f3] rounded-lg px-16 py-32 w-full max-w-lg">
                <div className="text-center">
                  <div className="text-white text-base font-medium font-['Poppins',Helvetica]">
                    You have no recent media
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>
    );
  }

  return (
    <ScrollArea className="h-full pr-3">
      <div className="space-y-8 transition-all duration-300 ease-in-out">
        {renderMediaSection(
          "Recently used media",
          getRecentlyUsedAssets(),
          hasUsedAssets,
          0
        )}

        {renderMediaSection(
          "Recently added media",
          getRecentlyAddedAssets(),
          activeTab === "cloud-media" || hasUploadedAssets,
          1
        )}

        {renderMediaSection(
          "Suggested items",
          getSuggestedAssets(),
          activeTab === "cloud-media",
          2
        )}

        {renderMediaSection(
          "Popular",
          getPopularAssets(),
          activeTab === "cloud-media",
          3
        )}

        {renderMediaSection(
          "Tags & Collections",
          getTagsCollectionsAssets(),
          activeTab === "cloud-media",
          4
        )}

        {renderMediaSection(
          "Seasons",
          getSeasonsAssets(),
          activeTab === "cloud-media",
          5
        )}
      </div>
    </ScrollArea>
  );
};
