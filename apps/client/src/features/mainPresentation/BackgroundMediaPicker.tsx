import { useCallback, useEffect, useRef, useState } from "react";
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
import {
  deleteLocalBackgroundMedia,
  listLocalBackgroundMedia,
  makeLocalBackgroundMediaRef,
  saveLocalBackgroundMedia,
} from "@/lib/localBackgroundMedia";

function getAuthHeaders(contentType?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (contentType) headers["Content-Type"] = contentType;
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

interface MediaAssetBase {
  id: string;
  _id?: string;
  title: string;
  fileName: string;
  fileType: "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT";
  mimeType: string;
  filePath: string;
  thumbnailPath: string | null;
  fileSize: number;
}

interface LocalMediaAsset extends MediaAssetBase {
  source: "local";
  uploadedAt: string;
}

interface UserMediaAsset extends MediaAssetBase {
  source: "user";
  uploadedAt: string;
}

interface CloudMediaAsset extends MediaAssetBase {
  source: "cloud";
  categoryName?: string;
}

type MediaAsset = LocalMediaAsset | UserMediaAsset | CloudMediaAsset;

interface BackgroundMediaPickerProps {
  selectedMediaId?: string;
  selectedMediaSource?: "user" | "cloud" | "local";
  onSelect: (asset: {
    id: string;
    url: string;
    mediaType: "image" | "video";
    source: "user" | "cloud" | "local";
  }) => void;
  onClear: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isVideoFileType(ft: string): boolean {
  return ft === "VIDEO";
}

function getAssetId(asset: MediaAsset): string {
  return asset._id ?? asset.id;
}

function mapMimeToFileType(mime: string): "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" {
  if (mime.startsWith("image")) return "IMAGE";
  if (mime.startsWith("video")) return "VIDEO";
  if (mime.startsWith("audio")) return "AUDIO";
  return "DOCUMENT";
}

export function BackgroundMediaPicker({
  selectedMediaId,
  selectedMediaSource,
  onSelect,
  onClear,
}: BackgroundMediaPickerProps) {
  const [activeTab, setActiveTab] = useState<"user" | "cloud">("user");
  const [userAssets, setUserAssets] = useState<Array<LocalMediaAsset | UserMediaAsset>>([]);
  const [cloudAssets, setCloudAssets] = useState<CloudMediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localObjectUrlsRef = useRef<string[]>([]);
  const { toast } = useToast();

  const revokeLocalObjectUrls = useCallback(() => {
    for (const url of localObjectUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    localObjectUrlsRef.current = [];
  }, []);

  useEffect(() => revokeLocalObjectUrls, [revokeLocalObjectUrls]);

  const fetchLocalAssets = useCallback(async (): Promise<LocalMediaAsset[]> => {
    const records = await listLocalBackgroundMedia();
    return records.map((record) => {
      const objectUrl = URL.createObjectURL(record.blob);
      localObjectUrlsRef.current.push(objectUrl);
      return {
        id: record.id,
        title: record.title,
        fileName: record.fileName,
        fileType: record.fileType,
        mimeType: record.mimeType,
        filePath: objectUrl,
        thumbnailPath: objectUrl,
        fileSize: record.fileSize,
        source: "local",
        uploadedAt: record.updatedAt,
      };
    });
  }, []);

  const fetchUserAssets = useCallback(async (): Promise<UserMediaAsset[]> => {
    try {
      const res = await fetch("/api/user-media-assets", {
        headers: getAuthHeaders(),
      });
      if (!res.ok) throw new Error("Failed to load user media");
      const json = await res.json();
      const rawAssets: any[] = json.assets ?? json;
      return rawAssets
        .filter((a: any) => {
          const ft = mapMimeToFileType(a.fileType || a.type || "");
          return ft === "IMAGE" || ft === "VIDEO";
        })
        .map((a: any): UserMediaAsset => {
          const id = a._id ?? a.id;
          const mapped = mapMimeToFileType(a.fileType || a.type || "");
          return {
            id,
            _id: a._id,
            title: a.title || a.fileName || "Untitled",
            fileName: a.fileName || "",
            fileType: mapped,
            mimeType: a.fileType || "application/octet-stream",
            filePath: `/api/user-media-assets/${id}/file`,
            thumbnailPath: `/api/user-media-assets/${id}/thumbnail`,
            fileSize: a.fileSize || 0,
            source: "user",
            uploadedAt: a.createdAt || a.uploadedAt || new Date().toISOString(),
          };
        });
    } catch {
      return [];
    }
  }, []);

  const fetchCloudAssets = useCallback(async (): Promise<CloudMediaAsset[]> => {
    try {
      const res = await fetch("/api/cloud-media");
      if (!res.ok) throw new Error("Failed to load cloud media");
      const data: any[] = await res.json();
      return data
        .filter((a: any) => a.fileType === "IMAGE" || a.fileType === "VIDEO")
        .map((a: any): CloudMediaAsset => {
          const id = a._id ?? a.id;
          return {
            id,
            _id: a._id,
            title: a.title || a.fileName || "Untitled",
            fileName: a.fileName || "",
            fileType: a.fileType,
            mimeType: a.mimeType || a.fileType || "application/octet-stream",
            filePath: `/api/cloud-media/${id}/file`,
            thumbnailPath: `/api/cloud-media/${id}/thumbnail`,
            fileSize: a.fileSize || 0,
            source: "cloud",
            categoryName: a.categoryName,
          };
        });
    } catch {
      return [];
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    revokeLocalObjectUrls();
    try {
      const [local, user, cloud] = await Promise.all([
        fetchLocalAssets(),
        fetchUserAssets(),
        fetchCloudAssets(),
      ]);
      setUserAssets([...local, ...user]);
      setCloudAssets(cloud);
    } catch (err: any) {
      setError(err?.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [fetchCloudAssets, fetchLocalAssets, fetchUserAssets, revokeLocalObjectUrls]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      toast({
        title: "Unsupported File",
        description: "Please choose an image or video file.",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please choose a file under 100 MB.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    try {
      const record = await saveLocalBackgroundMedia(file);
      await fetchAll();
      onSelect({
        id: record.id,
        url: makeLocalBackgroundMediaRef(record.id),
        mediaType: record.fileType === "VIDEO" ? "video" : "image",
        source: "local",
      });
      toast({
        title: "Background Added",
        description: "The file was stored locally and is now available offline in Your Media.",
      });
    } catch (err: any) {
      toast({
        title: "Local Save Failed",
        description: err?.message || "Could not store the selected background locally.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (deleting) return;
    const assetId = getAssetId(asset);
    setDeleting(assetId);
    try {
      if (asset.source === "local") {
        await deleteLocalBackgroundMedia(assetId);
      } else if (asset.source === "user") {
        const res = await fetch(`/api/user-media-assets/${assetId}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.message || "Failed to delete media");
        }
      }

      if (selectedMediaId === assetId && selectedMediaSource === asset.source) {
        onClear();
      }

      await fetchAll();
      toast({
        title: asset.source === "local" ? "Local Background Removed" : "Media Deleted",
        description:
          asset.source === "local"
            ? "The locally stored background has been removed from Your Media."
            : "The selected media asset has been deleted.",
      });
    } catch (err: any) {
      toast({
        title: "Delete Failed",
        description: err?.message || "Could not delete the selected media.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleSelect = (asset: MediaAsset) => {
    const assetId = getAssetId(asset);
    const url =
      asset.source === "cloud"
        ? `/api/cloud-media/${assetId}/file`
        : asset.source === "user"
          ? `/api/user-media-assets/${assetId}/file`
          : makeLocalBackgroundMediaRef(assetId);

    onSelect({
      id: assetId,
      url,
      mediaType: isVideoFileType(asset.fileType) ? "video" : "image",
      source: asset.source,
    });
  };

  const currentAssets: MediaAsset[] = activeTab === "user" ? userAssets : cloudAssets;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="text-sm text-gray-300">Background Media</Label>
        {selectedMediaId ? (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            Clear Selection
          </button>
        ) : null}
      </div>

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

      {activeTab === "user" ? (
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
                Saving Locally…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Add Image or Video from This Computer
              </>
            )}
          </button>
        </div>
      ) : null}

      {error ? (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          {error}
        </div>
      ) : null}

      {loading && !error ? (
        <div className="flex items-center justify-center py-6 text-gray-500">
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Loading media…
        </div>
      ) : null}

      {!loading && currentAssets.length > 0 ? (
        <div className="space-y-2">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
            {activeTab === "user" ? "Your Media" : "Cloud Media Library"}
          </p>
          <div className="grid grid-cols-3 gap-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
            {currentAssets.map((asset) => {
              const assetId = getAssetId(asset);
              const isSelected =
                selectedMediaId === assetId && selectedMediaSource === asset.source;
              const isBeingDeleted = deleting === assetId;
              const thumbnailUrl = asset.thumbnailPath || asset.filePath;
              const videoPreviewUrl = asset.filePath;

              return (
                <div key={`${asset.source}-${assetId}`} className="relative group">
                  <button
                    onClick={() => handleSelect(asset)}
                    className={`w-full rounded-lg overflow-hidden border transition-all text-left ${
                      isSelected
                        ? "border-purple-400 ring-2 ring-purple-500/40"
                        : "border-gray-700/70 hover:border-purple-500/50"
                    }`}
                  >
                    <div className="aspect-video bg-[#0a0614] relative">
                      {isVideoFileType(asset.fileType) ? (
                        <video
                          src={videoPreviewUrl}
                          muted
                          playsInline
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}

                      <div className="absolute left-2 top-2 flex items-center gap-1">
                        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          asset.source === "local"
                            ? "bg-emerald-500/85 text-white"
                            : asset.source === "user"
                              ? "bg-purple-500/85 text-white"
                              : "bg-indigo-500/85 text-white"
                        }`}>
                          {asset.source === "local"
                            ? "YOUR MEDIA"
                            : asset.source === "user"
                              ? "YOUR MEDIA"
                              : "Cloud"}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="absolute right-2 top-2 rounded-full bg-purple-500 text-white p-1">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : null}
                    </div>
                    <div className="p-2 space-y-1 bg-[#120a26]">
                      <p className="text-xs text-white font-medium truncate">{asset.title}</p>
                      <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                        <span>{isVideoFileType(asset.fileType) ? "Video" : "Image"}</span>
                        <span>{formatFileSize(asset.fileSize)}</span>
                      </div>
                    </div>
                  </button>

                  {asset.source !== "cloud" ? (
                    <button
                      onClick={() => handleDelete(asset)}
                      disabled={isBeingDeleted}
                      className="absolute right-2 bottom-14 z-10 rounded-full bg-black/70 p-1.5 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-100"
                      title={asset.source === "local" ? "Remove local background" : "Delete media"}
                    >
                      {isBeingDeleted ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {!loading && !error && currentAssets.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-gray-700/70 rounded-lg bg-[#0a0614]/50">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1a0f2e] text-gray-500">
            {activeTab === "user" ? <Upload className="h-4 w-4" /> : <Cloud className="h-4 w-4" />}
          </div>
          <p className="text-sm text-gray-400">
            {activeTab === "user" ? "No media added yet" : "No cloud media available"}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            {activeTab === "user"
              ? "Add an image or video from this computer to use it offline as a background."
              : "Cloud media will appear here when available."}
          </p>
        </div>
      ) : null}
    </div>
  );
}
