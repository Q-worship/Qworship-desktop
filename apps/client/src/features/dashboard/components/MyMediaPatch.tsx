import React, { useState, useEffect } from "react";
import { MediaFilterSection } from "@/components/sections/MediaFilterSection";
import { MediaGallerySection } from "@/components/sections/MediaGallerySection";
import { RecentMediaSection } from "@/components/sections/RecentMediaSection";
import { DynamicMediaSections } from "@/components/sections/DynamicMediaSections";
import { ImportFilesModal } from "./modals/ImportFilesModal";
import { useAuthStore } from "@/features/auth/auth.store";
import { useQuery } from "@tanstack/react-query";
import { Home } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface MyMediaPatchProps {
  onAssetSelect?: (assetUrl: string, assetType: string) => void;
  isModal?: boolean;
  filterType?: 'all' | 'video';
  mode?: 'browse' | 'import';
  recentlyUploadedMediaId?: number | null;
}

export const MyMediaPatch = ({ onAssetSelect, isModal = false, filterType = 'all', mode = 'browse', recentlyUploadedMediaId = null }: MyMediaPatchProps): JSX.Element => {
  
  // Import functionality state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  
  // Check for video-only filter from URL parameters or props
  const urlParams = new URLSearchParams(window.location.search);
  const isVideoOnly = filterType === 'video' || urlParams.get('filter') === 'video';
  
  // State for selected media item shared between components
  const [selectedMedia, setSelectedMedia] = useState<{
    sectionIndex: number;
    itemIndex: number;
    title: string;
    color: string;
    type: string;
    asset?: any; // MediaAsset from DynamicMediaSections
  } | null>(null);

  // Get current active tab from MediaGallerySection
  const [activeTab, setActiveTab] = useState<'cloud-media' | 'my-media'>('my-media');
  const user = useAuthStore((state) => state.user);
  const [, setLocation] = useLocation();
  
  // State for active filters - auto-set to videos if video-only mode
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    mediaTypes: string[];
    tags: string[];
    seasons: string[];
    recent: string[];
    service: string[];
    liveScreen: string[];
  }>({
    categories: [],
    mediaTypes: isVideoOnly ? ['Videos'] : [],
    tags: [],
    seasons: [],
    recent: [],
    service: [],
    liveScreen: []
  });

  const handleFilterChange = React.useCallback((filterCriteria: any) => {
    setActiveFilters({
      ...filterCriteria,
      service: [],
      liveScreen: []
    });
  }, []);
  
  // Check if user has uploaded assets by fetching their media
  const { data: userMediaResponse } = useQuery<{success: boolean, assets: any[]}>({
    queryKey: ['/api/user-media-assets'],
    enabled: !!user?.id,
    staleTime: 30 * 1000,
  });

  const userId = user?.id?.toString() || '';
  const hasUsedAssets = false; // TODO: Implement usage tracking
  const hasUploadedAssets = Boolean(userMediaResponse?.assets && userMediaResponse.assets.length > 0);

  // Auto-select first asset when switching to MY MEDIA tab or when user media loads
  useEffect(() => {
    if (activeTab === 'my-media' && userMediaResponse?.assets && userMediaResponse.assets.length > 0) {
      // Apply the exact same filtering and sorting logic as getRecentlyAddedAssets() in DynamicMediaSections
      let filteredAssets = userMediaResponse.assets
        .filter(asset => asset.userId); // Filter to user assets only
      
      // If in video-only mode, filter for video assets only
      if (isVideoOnly) {
        filteredAssets = filteredAssets.filter(asset => 
          asset.fileType?.toLowerCase() === 'video'
        );
      }
      
      const recentlyAddedAssets = filteredAssets
        .sort((a, b) => new Date(b.createdAt || b.uploadedAt || '').getTime() - new Date(a.createdAt || a.uploadedAt || '').getTime())
        .slice(0, 6); // Match the slice limit used in display
      
      // Always auto-select the first asset from the Recently Added section (which will be displayed first)
      const firstAsset = recentlyAddedAssets[0];
      
      // Guard: if no assets exist, don't try to auto-select
      if (!firstAsset) {
        return;
      }
      
      // Transform the raw asset to match the MediaAsset interface like in DynamicMediaSections
      const assetType = firstAsset.fileType?.toLowerCase() || 'image';
      
      // For video files, use generated thumbnail if available, otherwise use placeholder
      let thumbnailPath = firstAsset.filePath;
      if (assetType === 'video') {
        // Check if we have a generated thumbnail
        if (firstAsset.thumbnailPath) {
          thumbnailPath = firstAsset.thumbnailPath;
        } else {
          // Fallback to placeholder if no thumbnail generated
          thumbnailPath = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CiAgPHJlY3Qgd2lkdGg9IjQwMCIgaGVpZ2h0PSIzMDAiIGZpbGw9IiMxYTFhMWEiLz4KICA8Y2lyY2xlIGN4PSIyMDAiIGN5PSIxNTAiIHI9IjMwIiBmaWxsPSJ3aGl0ZSIgZmlsbC1vcGFjaXR5PSIwLjgiLz4KICA8cG9seWdvbiBwb2ludHM9IjE4OCwxMzUgMTg4LDE2NSAyMTgsMTUwIiBmaWxsPSIjMWExYTFhIi8+CiAgPHRleHQgeD0iMjAwIiB5PSIyMDAiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0id2hpdGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIG9wYWNpdHk9IjAuNyI+VmlkZW88L3RleHQ+Cjwvc3ZnPg==';
        }
      }
      
      // Debug logging for video assets
      if (assetType === 'video') {
        console.log('MyMediaPatch - Processing video asset:', {
          id: firstAsset.id,
          title: firstAsset.title,
          fileType: firstAsset.fileType,
          originalFilePath: firstAsset.filePath,
          newThumbnailPath: thumbnailPath,
          mimeType: firstAsset.mimeType
        });
      }
      
      const transformedAsset = {
        id: firstAsset.id,
        title: firstAsset.title,
        type: assetType,
        thumbnail: thumbnailPath,
        filePath: firstAsset.filePath, // Include the original file path for background selection
        uploadedBy: 'user',
        tags: Array.isArray(firstAsset.tags) ? firstAsset.tags : (firstAsset.tags ? [firstAsset.tags] : []),
        collection: firstAsset.categories || 'Uncategorized',
        season: null,
        usageCount: 0,
        createdAt: firstAsset.uploadedAt || firstAsset.createdAt || new Date().toISOString(),
        lastUsed: null,
        fileSize: firstAsset.fileSize,
        description: firstAsset.description,
      };

      // Auto-select the first asset
      setSelectedMedia({
        sectionIndex: 1, // MY MEDIA typically appears in section 1
        itemIndex: 0,    // First item
        title: transformedAsset.title,
        color: '#8356f3', // Q-worship purple
        type: transformedAsset.type,
        asset: transformedAsset
      });
    }
  }, [activeTab, userMediaResponse?.assets, isVideoOnly]); // Include isVideoOnly in dependencies

  // Clear selection when switching away from MY MEDIA
  useEffect(() => {
    if (activeTab === 'cloud-media') {
      setSelectedMedia(null);
    }
  }, [activeTab]);

  // Auto-open import modal when mode is 'import'
  useEffect(() => {
    if (mode === 'import') {
      setIsImportModalOpen(true);
      setActiveTab('my-media'); // Switch to MY MEDIA tab for import
    }
  }, [mode]);

  // Check if this window was opened for background selection
  const isBackgroundSelection = window.opener && window.name === 'qworship-assets';

  return (
    <main className="bg-[#1d0d46] w-full h-screen flex flex-col overflow-hidden">
      {/* SECTION A: Header */}
      <header className="w-full bg-[#0d002e] py-2 flex-shrink-0">
        <div className="w-full px-4 flex items-center justify-between mt-[5px] mb-[5px]">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                className="w-8 h-8"
                alt="Ellipse"
                src="/figmaAssets/ellipse-3.svg"
              />
              <div className="absolute bottom-0 right-0 w-2 h-2 bg-[#fd348f] rounded-full" />
            </div>

            <h1 className="font-bold text-white text-lg [font-family:'Lufga-Bold',Helvetica]">
              Qworship - Assets
            </h1>
          </div>
          
          {/* Home icon on the far right */}
          <button
            onClick={() => setLocation('/dashboard')}
            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[#9b6bff] transition-colors duration-200 group bg-[#392a48]"
            title="Back to Dashboard"
          >
            <Home className="w-3.5 h-3.5 text-white group-hover:scale-110 transition-transform duration-200" />
          </button>
        </div>
      </header>

      {/* Background Selection Banner */}
      {(isBackgroundSelection || isModal) && (
        <div className="w-full bg-gradient-to-r from-purple-600 to-purple-700 py-3 px-4 flex items-center justify-center space-x-2 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span className="text-white text-sm font-medium">
              {isVideoOnly ? 'Select a video to apply as Live Screen background' : 'Select an image or video to apply as Live Screen background'}
            </span>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      )}
      <div className="w-full flex flex-col flex-1 overflow-hidden">
        {/* SECTION B: Media Gallery Controls (Search, Tabs, Filter) */}
        <section className="w-full flex-shrink-0">
          <MediaGallerySection activeTab={activeTab} onTabChange={setActiveTab} />
        </section>

        {/* Main Content Area */}
        <div className="w-full flex flex-row gap-4 p-4 bg-[#1a0b2e] flex-1 overflow-hidden mt-[-7px] mb-[-7px]">
          {/* SECTION C: Left Sidebar (Filter Categories) */}
          <section className="h-full overflow-hidden">
            <MediaFilterSection 
              selectedMedia={selectedMedia}
              onMediaSelect={setSelectedMedia}
              onFilterChange={handleFilterChange}
              activeTab={activeTab}
            />
          </section>

          {/* SECTION D: Main Content Area (Media Grids - Cloud/My Media) */}
          <section className="flex-1 pl-4 pr-1 py-4 bg-[#1a0b2e] overflow-hidden">
            <DynamicMediaSections
              activeTab={activeTab}
              userId={userId}
              hasUsedAssets={hasUsedAssets}
              hasUploadedAssets={hasUploadedAssets}
              selectedMedia={selectedMedia}
              onMediaSelect={setSelectedMedia}
              activeFilters={activeFilters}
              isVideoOnly={isVideoOnly}
              onAssetSelect={onAssetSelect}
              isModal={isModal}
              recentlyUploadedMediaId={recentlyUploadedMediaId}
            />
          </section>

          {/* SECTION E: Right Sidebar (Media Details Panel) */}
          <section className="w-80 flex-shrink-0 overflow-y-auto border-l border-gray-600/30">
            <RecentMediaSection selectedMedia={selectedMedia} activeTab={activeTab} />
          </section>
        </div>
      </div>

      {/* Import Files Modal */}
      <ImportFilesModal
        open={isImportModalOpen}
        onOpenChange={(open) => {
          setIsImportModalOpen(open);
          if (!open && mode === 'import') {
            // When import modal closes in import mode, the assets should now be visible
            // Refresh the query to show the newly uploaded assets
            console.log('Import modal closed - imported assets should now be visible');
          }
        }}
        onMediaUploaded={(mediaAsset) => {
          console.log('Media uploaded successfully:', mediaAsset);
          // The toast will be shown by the parent component
        }}
      />
    </main>
  );
};