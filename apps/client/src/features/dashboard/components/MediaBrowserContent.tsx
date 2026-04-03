import React from "react";
import type { MediaAsset, User } from "@/types";
import { DynamicMediaSections } from "@/features/dashboard/components/sections/DynamicMediaSections";

// Enhanced media browser component for background selection - matches Assets page design
export const MediaBrowserContent: React.FC<{
  onSelectMedia: (asset: MediaAsset) => void;
  currentUser: User | null;
}> = ({ onSelectMedia, currentUser }) => {
  const [activeTab, setActiveTab] = React.useState<"cloud-media" | "my-media">(
    "my-media",
  );
  const [selectedMedia, setSelectedMedia] = React.useState<any>(null);
  const [activeFilters, setActiveFilters] = React.useState({
    categories: [],
    mediaTypes: [],
    tags: [],
    seasons: [],
    recent: [],
    service: [],
    liveScreen: [],
  });

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-600 bg-[#0f0920]">
        <button
          onClick={() => setActiveTab("cloud-media")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "cloud-media"
              ? "text-[#8356F3] border-[#8356F3]"
              : "text-gray-400 border-transparent hover:text-white"
          }`}>
          CLOUD MEDIA
        </button>
        <button
          onClick={() => setActiveTab("my-media")}
          className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${
            activeTab === "my-media"
              ? "text-[#8356F3] border-[#8356F3]"
              : "text-gray-400 border-transparent hover:text-white"
          }`}>
          MY MEDIA
        </button>
      </div>

      {/* Media Content */}
      <div className="flex-1 overflow-hidden">
        <DynamicMediaSections
          activeTab={activeTab}
          userId={currentUser?.id?.toString() || ""}
          hasUsedAssets={false}
          hasUploadedAssets={true}
          selectedMedia={selectedMedia}
          onMediaSelect={(selectedItem) => {
            setSelectedMedia(selectedItem);
            if (selectedItem?.asset) {
              onSelectMedia(selectedItem.asset);
            }
          }}
          activeFilters={activeFilters}
        />
      </div>
    </div>
  );
};
