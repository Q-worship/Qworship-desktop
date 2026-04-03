import React from "react";
import { useQuery } from "@tanstack/react-query";
import type { MediaAsset } from "@/types";
import { MediaAssetGridCard } from "./MediaAssetGridCard";

// Cloud Media Tab Component
export function CloudMediaTab({
  onSelectMedia,
  searchQuery = "",
  typeFilters = [],
  categoryFilters = [],
}: {
  onSelectMedia: (media: MediaAsset) => void;
  searchQuery?: string;
  typeFilters?: string[];
  categoryFilters?: string[];
}) {
  const { data: cloudMediaResult = [], isLoading } = useQuery({
    queryKey: ["/api/cloud-media"],
  });

  // Extract the actual array from the result safely
  const cloudMedia = React.useMemo(() => {
    return Array.isArray(cloudMediaResult) ? cloudMediaResult : [];
  }, [cloudMediaResult]);

  // Filter media based on search and filters from props
  const filteredMedia = React.useMemo(() => {
    return cloudMedia.filter((media: MediaAsset) => {
      const matchesSearch =
        !searchQuery ||
        media.title?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType =
        typeFilters.length === 0 ||
        typeFilters.includes("All Types") ||
        (typeFilters.includes("Images") && media.type?.toUpperCase() === "IMAGE") ||
        (typeFilters.includes("Videos") && media.type?.toUpperCase() === "VIDEO") ||
        (typeFilters.includes("Motion Backgrounds") &&
          (media.type?.toUpperCase() === "VIDEO" ||
            media.category?.toLowerCase().includes("motion")));

      const matchesCategory =
        categoryFilters.length === 0 ||
        categoryFilters.includes("All Categories") ||
        categoryFilters.some(
          (cat) =>
            media.category?.toLowerCase().includes(cat.toLowerCase()) ||
            (media.tags &&
              media.tags.some((tag: string) =>
                tag.toLowerCase().includes(cat.toLowerCase()),
              )),
        );

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [cloudMedia, searchQuery, typeFilters, categoryFilters]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">Loading Cloud Media...</div>
          <div className="text-sm">Please wait</div>
        </div>
      </div>
    );
  }

  if (!cloudMedia.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <div className="text-lg mb-2">No Cloud Media Available</div>
          <div className="text-sm">
            Cloud media will appear here when available
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Media Grid */}
      <div className="flex-1 p-4 overflow-y-auto">
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
                onSelectMedia={onSelectMedia}
                thumbnailUrl={media.thumbnail || `/api/cloud-media/${media.id}/thumbnail`}
                fileUrl={media.fileUrl || `/api/cloud-media/${media.id}/file`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
