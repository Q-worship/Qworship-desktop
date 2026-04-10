import React from "react";
import { buildUrl } from "@/lib/queryClient";

const resolveMediaUrl = (url: string | null | undefined): string | undefined => {
  if (!url) return undefined;
  if (url === "Worship background image" || url === "Inspirational worship video" || url === "Background Image" || url === "Ready for content") return undefined;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('data:') || url.startsWith('blob:')) return url;
  if (url.startsWith('/api/') || url.startsWith('/uploads/')) return buildUrl(url);
  return undefined;
};

interface LiveBackgroundLayerProps {
  appliedBackgroundType: string;
  appliedBackgroundVideo: string | null;
}

export const LiveBackgroundLayer: React.FC<LiveBackgroundLayerProps> = ({
  appliedBackgroundType,
  appliedBackgroundVideo,
}) => {
  return (
    <>
      {/* Background Video Element - Only rendered when video background is applied */}
            {appliedBackgroundType === "video" && appliedBackgroundVideo && (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src={resolveMediaUrl(appliedBackgroundVideo) || appliedBackgroundVideo}
                onLoadStart={() =>
                  console.log("Video loading started:", appliedBackgroundVideo)
                }
                onCanPlay={() =>
                  console.log("Video can play:", appliedBackgroundVideo)
                }
                onError={(e) =>
                  console.error("Video error:", e, "src:", appliedBackgroundVideo)
                }
                onLoadedData={() =>
                  console.log("Video loaded data:", appliedBackgroundVideo)
                }
              />
            )}
    </>
  );
};
