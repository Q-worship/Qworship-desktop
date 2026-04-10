import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaAsset, User } from "@/types";
import { MediaAssetGridCard } from "./MediaAssetGridCard";
import { buildUrl } from "@/lib/queryClient";

// My Media Tab Component
export function MyMediaTab({
  currentUser,
  onSelectMedia,
  searchQuery: filterSearchQuery = "",
  typeFilters = [],
  tagFilters = [],
  recentlyUploadedId = null,
}: {
  currentUser: User | null;
  onSelectMedia: (media: MediaAsset) => void;
  searchQuery?: string;
  typeFilters?: string[];
  tagFilters?: string[];
  recentlyUploadedId?: number | null;
}) {
  const { data: userMediaResult, isLoading } = useQuery<{
    assets: MediaAsset[];
  }>({
    queryKey: ["/api/user-media-assets"],
    enabled: !!currentUser,
  });

  const userMedia = userMediaResult?.assets || [];

  // Filter media based on search and filters from props, then sort with recently uploaded first
  const filteredMedia = useMemo(() => {
    return userMedia
      .filter((media: MediaAsset) => {
        const matchesSearch =
          !filterSearchQuery ||
          media.title?.toLowerCase().includes(filterSearchQuery.toLowerCase());

        const matchesType =
          typeFilters.length === 0 ||
          typeFilters.includes("All Types") ||
          (typeFilters.includes("Images") && media.type?.toUpperCase() === "IMAGE") ||
          (typeFilters.includes("Videos") && media.type?.toUpperCase() === "VIDEO") ||
          (typeFilters.includes("Motion Backgrounds") &&
            (media.type?.toUpperCase() === "VIDEO" ||
              media.category?.toLowerCase().includes("motion")));

        const matchesTag =
          tagFilters.length === 0 ||
          tagFilters.includes("All Tags") ||
          tagFilters.some(
            (tag) =>
              (media.tags &&
                media.tags.some((mediaTag: string) =>
                  mediaTag.toLowerCase().includes(tag.toLowerCase()),
                )) ||
              (media.categories &&
                media.categories.some((cat: string) =>
                  cat.toLowerCase().includes(tag.toLowerCase()),
                )),
          );

        return matchesSearch && matchesType && matchesTag;
      })
      .sort((a: MediaAsset, b: MediaAsset) => {
        // Sort recently uploaded media to the top
        if (recentlyUploadedId === a.id) return -1;
        if (recentlyUploadedId === b.id) return 1;
        // Then sort by creation date (most recent first)
        return (
          new Date(b.createdAt || 0).getTime() -
          new Date(a.createdAt || 0).getTime()
        );
      });
  }, [userMedia, filterSearchQuery, typeFilters, tagFilters, recentlyUploadedId]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">Loading Your Media...</div>
          <div className="text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  if (!userMedia.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">No Media Uploaded Yet</div>
          <div className="text-sm">Upload media files to see them here</div>
          <div className="text-xs mt-2">
            Supported: JPG, PNG, GIF, MP4, MOV, WebM
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Media Grid */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {filteredMedia.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-400">
              <div className="text-lg mb-2">No media found</div>
              <div className="text-sm">Try adjusting your search or filter</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {filteredMedia.map((media: MediaAsset) => (
              <MediaAssetGridCard
                key={media.id}
                media={media}
                isRecentlyUploaded={recentlyUploadedId === media.id}
                onSelectMedia={onSelectMedia}
                thumbnailUrl={buildUrl(`/api/user-media-assets/${media.id}/thumbnail`)}
                fileUrl={buildUrl(`/api/user-media-assets/${media.id}/file`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
