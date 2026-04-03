import React from "react";

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
                src={appliedBackgroundVideo}
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
