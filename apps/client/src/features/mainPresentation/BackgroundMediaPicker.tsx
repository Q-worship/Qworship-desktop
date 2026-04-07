import { useState, useEffect, useCallback, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Film,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
  Cloud,
  User,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// ── Types ───────────────────────────────────────────────────────────────────────

interface MediaAssetBase {
  id: number;
  _id?: string;
  title: string;
  fileName: string;
  fileType: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  mimeType: string;
  filePath: string;
  thumbnailPath: string | null;
  fileSize: number;
}

interface UserMediaAsset extends MediaAssetBase {
  source: "user";
  uploadedAt: string;
}

interface CloudMediaAsset extends MediaAssetBase {
  source: "cloud";
  categoryName?: string;
}

type MediaAsset = UserMediaAsset | CloudMediaAsset;

interface BackgroundMediaPickerProps {
  selectedMediaId?: number;
  selectedMediaSource?: "user" | "cloud";
  onSelect: (asset: {
    id: number;
    url: string;
    mediaType: "image" | "video";
    source: "user" | "cloud";
  }) => void;
  onClear: () => void;
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideoMime(mime: string): boolean {
  return mime.startsWith("video/");
}

function isVideoFileType(ft: string): boolean {
  return ft === "VIDEO";
}

function getAssetId(asset: MediaAsset): string | number {
  return (asset as any)._id ?? asset.id;
}

// ── Component ───────────────────────────────────────────────────────────────────

export function BackgroundMediaPicker({
  selectedMediaId,
  selectedMediaSource,
  onSelect,
  onClear,
}: BackgroundMediaPickerProps) {
  const [activeTab, setActiveTab] = useState<"user" | "cloud">("user");
  const [userAssets, setUserAssets] = useState<UserMediaAsset[]>([]);
  const [cloudAssets, setCloudAssets] = useState<CloudMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // ── Fetch user media assets (images + videos only) ──────────────────────────
  const fetchUserAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/user-media-assets", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to load user media");
      const data: Omit<UserMediaAsset, "source">[] = await res.json();
      return data
        .filter((a) => a.fileType === "IMAGE" || a.fileType === "VIDEO")
        .map((a) => ({ ...a, source: "user" as const }));
    } catch {
      return [];
    }
  }, []);

  // ── Fetch cloud media assets ────────────────────────────────────────────────
  const fetchCloudAssets = useCallback(async () => {
    try {
      const res = await fetch("/api/cloud-media");
      if (!res.ok) throw new Error("Failed to load cloud media");
      const data: (Omit<CloudMediaAsset, "source"> & { categoryName?: string })[] = await res.json();
      return data
        .filter((a) => a.fileType === "IMAGE" || a.fileType === "VIDEO")
        .map((a) => ({ ...a, source: "cloud" as const }));
    } catch {
      return [];
    }
  }, []);

  // ── Load all assets ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [user, cloud] = await Promise.all([fetchUserAssets(), fetchCloudAssets()]);
      setUserAssets(user);
      setCloudAssets(cloud);
    } catch (err: any) {
      setError(err.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [fetchUserAssets, fetchCloudAssets]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Upload ──────────────────────────────────────────────────────────────────
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Unsupported File",
        description: "Please upload an image (jpg, png, webp) or video (mp4, webm) file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Maximum file size is 100MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("files", file);

      const res = await fetch("/api/user-media-assets/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Upload failed");
      }

      const uploaded: Omit<UserMediaAsset, "source">[] = await res.json();
      toast({ title: "Upload Complete", description: `${file.name} uploaded successfully.` });

      // Refresh and auto-select
      await fetchAll();
      if (uploaded.length > 0) {
        const asset = uploaded[0];
        const assetId = getAssetId(asset as any);
        onSelect({
          id: asset.id,
          url: `${window.location.origin}/api/user-media-assets/${assetId}/file`,
          mediaType: isVideoMime(asset.mimeType) ? "video" : "image",
          source: "user",
        });
      }
    } catch (err: any) {
      toast({
        title: "Upload Failed",
        description: err.message || "Could not upload file.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async (asset: UserMediaAsset) => {
    if (deleting) return;
    const assetId = getAssetId(asset);
    setDeleting(asset.id);
    try {
      const res = await fetch(`/api/user-media-assets/${assetId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Delete failed");
      }

      toast({ title: "Deleted", description: `${asset.title} removed.` });

      // If this was the selected asset, clear selection
      if (selectedMediaId === asset.id) {
        onClear();
      }

      // Refresh list
      setUserAssets((prev) => prev.filter((a) => a.id !== asset.id));
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err.message || "Could not delete file.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  // ── Select ──────────────────────────────────────────────────────────────────
  const handleSelect = (asset: MediaAsset) => {
    const assetId = getAssetId(asset);
    const downloadBase =
      asset.source === "cloud"
        ? `/api/cloud-media/${assetId}/file`
        : `/api/user-media-assets/${assetId}/file`;

    onSelect({
      id: asset.id,
      url: `${window.location.origin}${downloadBase}`,
      mediaType: isVideoFileType(asset.fileType) ? "video" : "image",
      source: asset.source,
    });
  };

  // ── Current tab assets ──────────────────────────────────────────────────────
  const currentAssets: MediaAsset[] = activeTab === "user" ? userAssets : cloudAssets;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-sm text-gray-300">Background Media</Label>
        {selectedMediaId && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear Selection
          </button>
        )}
      </div>

      {/* Tabs: Your Media / Cloud Library */}
      <div className="flex gap-1 bg-[#0a0614] border border-gray-700/60 rounded-lg p-1">
        <button
          onClick={() => setActiveTab("user")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === "user"
              ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
              : "text-gray-400 hover:text-gray-300 border border-transparent"
          }`}
        >
          <User className="w-3.5 h-3.5" />
          Your Media
        </button>
        <button
          onClick={() => setActiveTab("cloud")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === "cloud"
              ? "bg-indigo-600/30 text-indigo-300 border border-indigo-500/50"
              : "text-gray-400 hover:text-gray-300 border border-transparent"
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          Cloud Library
        </button>
      </div>

      {/* Upload button (only for user tab) */}
      {activeTab === "user" && (
        <div className="relative">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
            id="bg-media-upload"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed transition-all ${
              uploading
                ? "border-purple-500/40 bg-purple-500/10 text-purple-300 cursor-wait"
                : "border-gray-600 hover:border-purple-500/60 hover:bg-purple-500/5 text-gray-400 hover:text-purple-300"
            }`}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Image or Video
              </>
            )}
          </button>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && !error && (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading media…
        </div>
      )}

      {/* Assets gallery */}
      {!loading && currentAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            {activeTab === "user" ? "Your Uploads" : "Cloud Media Library"}
          </p>
          <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {currentAssets.map((asset) => {
              const isSelected = selectedMediaId === asset.id && selectedMediaSource === asset.source;
              const isVideo = asset.fileType === "VIDEO";
              const isUserAsset = asset.source === "user";
              const isBeingDeleted = deleting === asset.id;
              const assetId = getAssetId(asset);
              const thumbnailUrl =
                asset.source === "cloud"
                  ? `/api/cloud-media/${assetId}/thumbnail`
                  : `/api/user-media-assets/${assetId}/thumbnail`;
              const videoPreviewUrl =
                asset.source === "cloud"
                  ? `/api/cloud-media/${assetId}/file`
                  : `/api/user-media-assets/${assetId}/file`;

              return (
                <div key={`${asset.source}-${asset.id}`} className="relative group">
                  <button
                    onClick={() => handleSelect(asset)}
                    disabled={isBeingDeleted}
                    className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                      isBeingDeleted
                        ? "opacity-50 cursor-wait border-gray-700"
                        : isSelected
                        ? "border-purple-500 ring-2 ring-purple-500/30"
                        : "border-gray-700 hover:border-gray-500"
                    }`}
                    title={`${asset.title} (${formatFileSize(asset.fileSize)})`}
                  >
                    {isVideo ? (
                      <video
                        src={videoPreviewUrl}
                        muted
                        playsInline
                        preload="metadata"
                        className="w-full h-full object-cover"
                        onLoadedData={(e) => {
                          (e.target as HTMLVideoElement).currentTime = 0.1;
                        }}
                      />
                    ) : (
                      <img
                        src={thumbnailUrl}
                        alt={asset.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = "none";
                        }}
                      />
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isVideo ? (
                        <Film className="w-5 h-5 text-white" />
                      ) : (
                        <ImageIcon className="w-5 h-5 text-white" />
                      )}
                    </div>

                    {/* Type badge */}
                    <div className="absolute top-1 right-1 flex gap-1">
                      {isVideo ? (
                        <span className="bg-blue-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          VIDEO
                        </span>
                      ) : (
                        <span className="bg-emerald-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          IMG
                        </span>
                      )}
                    </div>

                    {/* Source badge (cloud only) */}
                    {!isUserAsset && (
                      <div className="absolute top-1 left-1">
                        <span className="bg-indigo-600/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
                          <Cloud className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    )}

                    {/* Selected checkmark */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-purple-600/20 flex items-center justify-center">
                        <div className="bg-purple-600 rounded-full p-1">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}

                    {/* Deleting spinner */}
                    {isBeingDeleted && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-red-400 animate-spin" />
                      </div>
                    )}

                    {/* File name on hover */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[9px] text-white truncate">{asset.title}</p>
                    </div>
                  </button>

                  {/* Delete button (user assets only) */}
                  {isUserAsset && !isBeingDeleted && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(asset as UserMediaAsset);
                      }}
                      className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all shadow-lg z-10"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && currentAssets.length === 0 && !error && (
        <div className="text-center py-6 text-gray-500">
          {activeTab === "user" ? (
            <>
              <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No media uploaded yet.</p>
              <p className="text-[10px] mt-1">Upload an image or video to use as a background.</p>
            </>
          ) : (
            <>
              <Cloud className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-xs">No cloud media available.</p>
              <p className="text-[10px] mt-1">Cloud media is uploaded by your administrator.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
