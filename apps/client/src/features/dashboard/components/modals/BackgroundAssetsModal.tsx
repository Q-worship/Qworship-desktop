import React from "react";
import { XIcon } from "lucide-react";
import { AssetsPage } from "@/features/web/pages/AssetsPage";
import { toast } from "@/hooks/use-toast";

interface BackgroundAssetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  backgroundModalMode: "import" | "browse";
  recentlyUploadedMediaId: number | string | null;
  getCurrentItemId: () => number | string | null;
  applyBackgroundToCurrentItem: (backgroundData: any) => void;
}

export function BackgroundAssetsModal({
  isOpen,
  onClose,
  backgroundModalMode,
  recentlyUploadedMediaId,
  getCurrentItemId,
  applyBackgroundToCurrentItem,
}: BackgroundAssetsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] bg-gray-900"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Header with Close Button */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-r from-purple-900 to-purple-800 border-b border-purple-500/30 flex items-center justify-between px-6 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
            <span className="text-purple-900 font-bold text-sm">Q</span>
          </div>
          <h1 className="text-xl font-bold text-white">
            {backgroundModalMode === "import"
              ? "Import Media for Background"
              : "Select Background from Assets"}
          </h1>
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-purple-700/50 rounded-lg transition-colors"
        >
          <XIcon className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Assets Page Content */}
      <div className="pt-16 h-full">
        <AssetsPage
          mode={backgroundModalMode as any}
          recentlyUploadedMediaId={recentlyUploadedMediaId as any}
          onAssetSelect={(assetUrl: string, assetType: string) => {
            const currentItemId = getCurrentItemId();
            const backgroundData = {
              type:
                assetType === "video" || assetType.toLowerCase().includes("video")
                  ? "video"
                  : ("image" as "video" | "image"),
              value: assetUrl,
              name: "Selected Asset",
            };

            applyBackgroundToCurrentItem(backgroundData);
            onClose();

            toast({
              title: "Background Selected",
              description: `${backgroundData.type.toUpperCase()} background applied to current slide`,
              className: "bg-gradient-to-r from-purple-900/90 to-purple-800/90 border-purple-500/30 text-white",
            });
          }}
          isModal={true}
          filterType="all"
        />
      </div>
    </div>
  );
}
