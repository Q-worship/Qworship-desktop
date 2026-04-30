import { db, type LocalBackgroundMedia } from "@/lib/db";

export const LOCAL_BACKGROUND_MEDIA_PREFIX = "localmedia:";

export function makeLocalBackgroundMediaRef(id: string): string {
  return `${LOCAL_BACKGROUND_MEDIA_PREFIX}${id}`;
}

export function isLocalBackgroundMediaRef(value: string | null | undefined): boolean {
  return Boolean(value && value.startsWith(LOCAL_BACKGROUND_MEDIA_PREFIX));
}

export function parseLocalBackgroundMediaId(value: string | null | undefined): string | null {
  if (!isLocalBackgroundMediaRef(value)) return null;
  return value!.slice(LOCAL_BACKGROUND_MEDIA_PREFIX.length) || null;
}

function createLocalBackgroundMediaId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `local-bg-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveLocalBackgroundMedia(file: File): Promise<LocalBackgroundMedia> {
  const now = new Date().toISOString();
  const fileType = file.type.startsWith("video/") ? "VIDEO" : "IMAGE";
  const record: LocalBackgroundMedia = {
    id: createLocalBackgroundMediaId(),
    title: file.name.replace(/\.[^.]+$/, "") || "Untitled",
    fileName: file.name,
    fileType,
    mimeType: file.type || (fileType === "VIDEO" ? "video/mp4" : "image/jpeg"),
    fileSize: file.size,
    createdAt: now,
    updatedAt: now,
    blob: file,
  };

  await db.localBackgroundMedia.put(record);
  return record;
}

export async function listLocalBackgroundMedia(): Promise<LocalBackgroundMedia[]> {
  return db.localBackgroundMedia.orderBy("updatedAt").reverse().toArray();
}

export async function deleteLocalBackgroundMedia(id: string): Promise<void> {
  await db.localBackgroundMedia.delete(id);
}

export async function getLocalBackgroundMedia(id: string): Promise<LocalBackgroundMedia | undefined> {
  return db.localBackgroundMedia.get(id);
}

export async function resolveLocalBackgroundMediaObjectUrl(value: string): Promise<string | undefined> {
  const id = parseLocalBackgroundMediaId(value);
  if (!id) return undefined;
  const record = await getLocalBackgroundMedia(id);
  if (!record?.blob) return undefined;
  return URL.createObjectURL(record.blob);
}
