import React, { useState } from "react";
import type { MediaAsset } from "@/types";

interface MediaAssetGridCardProps {
  media: MediaAsset;
  onSelectMedia: (media: MediaAsset) => void;
  isRecentlyUploaded?: boolean;
  thumbnailUrl: string;
  fileUrl: string;
}

export const MediaAssetGridCard = React.memo(
  ({
    media,
    onSelectMedia,
    isRecentlyUploaded = false,
    thumbnailUrl,
    fileUrl,
  }: MediaAssetGridCardProps) => {
    const [hasError, setHasError] = useState(false);

    // Differentiate video streams logically instead of crushing DOM img tags
    const isVideo = media.type?.toLowerCase() === "video";

    return (
      <div
        className={`aspect-video rounded-lg cursor-pointer hover:bg-gray-600 transition-all duration-200 flex items-center justify-center relative overflow-hidden z-10 ${
          isRecentlyUploaded
            ? "bg-[#8356f3] ring-2 ring-[#8356f3] ring-offset-2 ring-offset-[#0f0920] scale-105"
            : "bg-gray-700"
        }`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onSelectMedia(media);
        }}>
        
        {isRecentlyUploaded && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full z-10 font-bold pointer-events-none">
            NEW
          </div>
        )}

        {!hasError ? (
          <>
            <img
              src={thumbnailUrl}
              alt={media.title}
              loading="lazy"
              className="w-full h-full object-cover pointer-events-none absolute inset-0"
              onError={() => {
                // If thumbnail fails specifically for video, try using the video tag but paused as a fallback
                // or just set error
                setHasError(true);
              }}
            />
            {isVideo && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/10">
                <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center border border-white/30 backdrop-blur-sm">
                  <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-1" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col text-center text-gray-400 w-full h-full items-center justify-center absolute inset-0 bg-gray-800 pointer-events-none">
            <div className="text-xs max-w-[80%] truncate px-2">{media.title}</div>
            <div className="text-[10px] mt-1 text-gray-500 uppercase">{media.fileType || media.type}</div>
          </div>
        )}

        {/* Floating Gradient Label overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-1 pointer-events-none">
          <div className="text-xs text-white truncate px-1">{media.title}</div>
        </div>
      </div>
    );
  },
  // Strict deep memoization lock—only evaluate if ID or highlight status changes
  (prevProps, nextProps) => {
    return (
      prevProps.media.id === nextProps.media.id &&
      prevProps.isRecentlyUploaded === nextProps.isRecentlyUploaded &&
      prevProps.thumbnailUrl === nextProps.thumbnailUrl &&
      prevProps.fileUrl === nextProps.fileUrl
    );
  }
);
