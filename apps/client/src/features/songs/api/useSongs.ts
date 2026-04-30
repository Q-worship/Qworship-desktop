import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { useSongRAMCache } from "@/features/dashboard/hooks/useSongRAMCache";

export interface Song {
  id: string;
  title: string;
  artist?: string;
  dateAdded: string;
  thumbnail?: string;
  alternativeTitles?: string[];
  sections?: Array<{
    id: string;
    type: "verse" | "chorus";
    number: number;
    label: string;
    content: string;
  }>;
  verseOrder?: string;
  authors?: string[] | string;
  topics?: string[] | string;
  copyright?: string;
  createdAt?: string;
  updatedAt?: string;
  structure?: string[];
  lyrics?: string;
  songId?: string;
}

type SongRecord = Omit<Song, "id" | "songId" | "structure" | "authors" | "topics"> & {
  id?: number;
  songId: string;
  structure: string[];
  authors: string[];
  topics: string[];
};

type ImportedSongResponse = {
  success: boolean;
  song: Song;
};

const SONGS_QUERY_KEY = ["/api/songs"] as const;

const makeSongId = () =>
  `local-song-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const toIso = () => new Date().toISOString();

const toDisplayDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  return date.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

const normalizeStringArray = (value?: string[] | string) => {
  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [] as string[];
};

const parseStructureValue = (value?: string[] | string) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value) return [] as string[];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
};

const normalizeSong = (record: any): Song => {
  const createdAt = record.createdAt || record.updatedAt || toIso();
  const structure = parseStructureValue(record.structure);
  const songId = String(record.songId || record.id || makeSongId());

  return {
    ...record,
    id: songId,
    songId,
    title: record.title || "Untitled Song",
    artist: record.artist,
    authors: Array.isArray(record.authors) ? record.authors : normalizeStringArray(record.authors),
    topics: Array.isArray(record.topics) ? record.topics : normalizeStringArray(record.topics),
    copyright: record.copyright || "",
    lyrics: record.lyrics || "",
    structure,
    verseOrder: record.verseOrder || structure.join(", "),
    createdAt,
    updatedAt: record.updatedAt || createdAt,
    dateAdded: record.dateAdded || toDisplayDate(createdAt),
  };
};

const buildSongRecord = (songData: Partial<Song>, existing?: any): SongRecord => {
  const now = toIso();
  const structure = parseStructureValue(songData.structure || songData.verseOrder);
  const songId = String(existing?.songId || existing?.id || songData.songId || songData.id || makeSongId());

  const record: SongRecord = {
    ...(existing || {}),
    songId,
    title: songData.title?.trim() || existing?.title || "Untitled Song",
    artist:
      typeof songData.artist === "string"
        ? songData.artist.trim()
        : existing?.artist || undefined,
    lyrics: songData.lyrics || existing?.lyrics || "",
    structure,
    verseOrder: structure.join(", "),
    authors: normalizeStringArray(songData.authors ?? existing?.authors),
    topics: normalizeStringArray(songData.topics ?? existing?.topics),
    copyright:
      typeof songData.copyright === "string"
        ? songData.copyright
        : existing?.copyright || "",
    sections: songData.sections || existing?.sections || [],
    alternativeTitles: songData.alternativeTitles || existing?.alternativeTitles || [],
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    dateAdded: existing?.dateAdded || toDisplayDate(now),
  };

  return record;
};

const getRecordBySongId = async (songId: string) => {
  return db.songs.where("songId").equals(songId).first();
};

const invalidateSongCaches = async (queryClient: ReturnType<typeof useQueryClient>, song?: any) => {
  queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });

  if (song) {
    await useSongRAMCache.getState().invalidate(song);
    return;
  }

  const cache = useSongRAMCache.getState();
  await cache.loadFromDisk(true);
};

const normalizeImportedSongText = (rawText: string) => {
  let normalized = rawText.replace(/\r/g, "").replace(/\u00a0/g, " ");

  normalized = normalized.replace(/([a-z])([A-Z])/g, "$1 $2");
  normalized = normalized.replace(
    /([^\n])\s*(\[?(?:verse\s+\d+|chorus(?:\s+\d+)?|pre[- ]?chorus|bridge|tag|intro|outro)\]?)/gi,
    "$1\n$2",
  );
  normalized = normalized.replace(
    /([^\n])\s*(title:|song title:|author:|authors:|written by:|artist:|copyright:|ccli:|key:|tempo:|topic:|topics:)/gi,
    "$1\n$2",
  );

  return normalized.replace(/\n{3,}/g, "\n\n").trim();
};

const parseSongTextToPayload = (rawText: string, fallbackTitle: string): Partial<Song> => {
  const sanitized = normalizeImportedSongText(rawText);
  const rawLines = sanitized.split("\n").map((line) => line.trim());
  const lines = rawLines.filter(Boolean);

  const metadataPrefixes = [
    "title:",
    "song title:",
    "author:",
    "authors:",
    "written by:",
    "artist:",
    "copyright:",
    "ccli:",
    "key:",
    "tempo:",
    "topic:",
    "topics:",
  ];

  const firstMeaningfulLine =
    lines.find((line) => !metadataPrefixes.some((prefix) => line.toLowerCase().startsWith(prefix))) ||
    fallbackTitle.replace(/\.[^.]+$/, "");

  const extractMetadataValue = (prefixes: string[]) => {
    const line = lines.find((entry) =>
      prefixes.some((prefix) => entry.toLowerCase().startsWith(prefix)),
    );
    if (!line) return undefined;
    const [, ...rest] = line.split(":");
    return rest.join(":").trim() || undefined;
  };

  const normalizeSectionHeader = (line: string) => {
    const cleaned = line.replace(/^\[|\]$/g, "").trim();
    const lower = cleaned.toLowerCase();

    if (/^(verse|v)\s*\d+/i.test(cleaned)) {
      const number = cleaned.match(/\d+/)?.[0] || "1";
      return `Verse ${number}`;
    }

    if (/^(chorus|c)(\s*\d+)?$/i.test(cleaned)) {
      const number = cleaned.match(/\d+/)?.[0];
      return number ? `Chorus ${number}` : "Chorus";
    }

    if (/^pre[- ]?chorus/i.test(lower)) return "Pre-Chorus";
    if (/^bridge/i.test(lower)) return "Bridge";
    if (/^tag/i.test(lower)) return "Tag";
    if (/^intro/i.test(lower)) return "Intro";
    if (/^outro/i.test(lower)) return "Outro";

    return cleaned;
  };

  const isSectionHeader = (line: string) => {
    const cleaned = line.replace(/^\[|\]$/g, "").trim();
    return /^(verse|v)\s*\d+/i.test(cleaned) || /^(chorus|c)(\s*\d+)?$/i.test(cleaned) || /^(pre[- ]?chorus|bridge|tag|intro|outro)/i.test(cleaned);
  };

  const sections: { header: string; lines: string[] }[] = [];
  let currentSection: { header: string; lines: string[] } | null = null;

  for (const line of rawLines) {
    if (!line) {
      if (currentSection) currentSection.lines.push("");
      continue;
    }

    if (isSectionHeader(line)) {
      if (currentSection) sections.push(currentSection);
      currentSection = {
        header: normalizeSectionHeader(line),
        lines: [],
      };
      continue;
    }

    if (!currentSection) {
      currentSection = {
        header: "Verse 1",
        lines: [],
      };
    }

    currentSection.lines.push(line);
  }

  if (currentSection) sections.push(currentSection);

    const normalizedSections = sections
    .map((section, index) => ({
      header: section.header,
      index,
      lines: section.lines.map((line) => line.trim()).filter(Boolean),
    }))
    .filter((section) => section.lines.length > 0)
    .map((section) => ({
      ...section,
      content: section.lines.join("\n").trim(),
    }))
    .filter((section) => section.content);
  const getStructureToken = (header: string) => {
    const lower = header.toLowerCase();
    if (lower.startsWith("verse")) {
      return `V${header.match(/\d+/)?.[0] || "1"}`;
    }
    if (lower.startsWith("chorus")) {
      return `C${header.match(/\d+/)?.[0] || "1"}`;
    }
    if (lower.startsWith("pre-chorus")) return "PC";
    if (lower.startsWith("bridge")) return "B";
    if (lower.startsWith("tag")) return "T";
    if (lower.startsWith("intro")) return "I";
    if (lower.startsWith("outro")) return "O";
    return header;
  };
  const lyrics = normalizedSections.length
    ? normalizedSections
        .map((section) => `[${section.header}]\n${section.content}`)
        .join("\n\n")
    : sanitized.trim();
  const structure = normalizedSections.map((section) => getStructureToken(section.header));
  const normalizedSongSections = normalizedSections.map((section) => ({
    id: `imported-section-${section.index + 1}`,
    type: section.header.toLowerCase().startsWith("chorus") ? "chorus" : "verse",
    number: Number(section.header.match(/\d+/)?.[0] || section.index + 1),
    label: section.header,
    content: section.content,
  }));
  const fallbackBaseTitle = fallbackTitle.replace(/\.[^.]+$/, "").trim();
  const inferredTitle = extractMetadataValue(["title:", "song title:"]) || firstMeaningfulLine;
  const safeTitle = !inferredTitle || inferredTitle.length > 120 ? fallbackBaseTitle : inferredTitle;

  return {
    title: safeTitle,
    artist: extractMetadataValue(["artist:", "author:", "authors:", "written by:"]),
    authors: extractMetadataValue(["author:", "authors:", "written by:"]) || undefined,
    copyright: extractMetadataValue(["copyright:", "ccli:"]) || "",
    topics: extractMetadataValue(["topic:", "topics:"]) || undefined,
    lyrics,
    structure,
    sections: normalizedSongSections,
  };;
};

const parseDocxFileOffline = async (file: File): Promise<Partial<Song>> => {
  const mammothModule: any = await import("mammoth/mammoth.browser.js");
  const mammoth = mammothModule.default || mammothModule;
  const arrayBuffer = await file.arrayBuffer();
  const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
  const container = typeof document !== "undefined" ? document.createElement("div") : null;

  if (container) {
    container.innerHTML = htmlResult.value || "";

    const blockLines = Array.from(
      container.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li"),
    )
      .map((element) => element.textContent?.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim() || "")
      .filter(Boolean);

    const htmlText = normalizeImportedSongText(blockLines.join("\n"));
    if (htmlText) {
      return parseSongTextToPayload(htmlText, file.name);
    }
  }

  const result = await mammoth.extractRawText({ arrayBuffer });
  return parseSongTextToPayload(result.value || "", file.name);
};

const parseTextFileOffline = async (file: File): Promise<Partial<Song>> => {
  const text = await file.text();
  return parseSongTextToPayload(text, file.name);
};

export const useSongs = () => {
  return useQuery<{ success: boolean; songs: Song[] }>({
    queryKey: SONGS_QUERY_KEY,
    queryFn: async () => {
      const records = await db.songs.toArray();
      const songs = records
        .map((record) => normalizeSong(record))
        .sort(
          (a, b) =>
            new Date(b.updatedAt || b.createdAt || 0).getTime() -
            new Date(a.updatedAt || a.createdAt || 0).getTime(),
        );

      return { success: true, songs };
    },
    enabled: true,
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
};

export const useCreateSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (songData: Partial<Song>) => {
      const record = buildSongRecord(songData);
      const primaryKey = await db.songs.add(record);
      const saved = normalizeSong({ ...record, id: primaryKey });
      await invalidateSongCaches(queryClient, saved);
      return { success: true, song: saved };
    },
  });
};

export const useUpdateSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, songData }: { id: string; songData: Partial<Song> }) => {
      const existing = (await getRecordBySongId(id)) || (await db.songs.get(id as any));
      if (!existing) {
        throw new Error("Song not found");
      }

      const record = buildSongRecord(songData, existing);
      const primaryKey = existing.id;
      if (primaryKey !== undefined) {
        await db.songs.update(primaryKey, record);
      } else {
        await db.songs.put(record as any);
      }

      const saved = normalizeSong({ ...existing, ...record });
      await invalidateSongCaches(queryClient, saved);
      return { success: true, song: saved };
    },
  });
};

export const useDeleteSong = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const existing = (await getRecordBySongId(id)) || (await db.songs.get(id as any));
      if (!existing) {
        throw new Error("Song not found");
      }

      if (existing.id !== undefined) {
        await db.songs.delete(existing.id);
      }

      queryClient.invalidateQueries({ queryKey: SONGS_QUERY_KEY });
      const cache = useSongRAMCache.getState();
      await cache.loadFromDisk(true);
      return { success: true };
    },
  });
};

export const useImportSong = () => {
  const queryClient = useQueryClient();

  return useMutation<ImportedSongResponse, Error, { file: File; format: string }>({
    mutationFn: async ({ file, format }) => {
      const normalizedFormat = format.trim().toUpperCase();
      let parsedSong: Partial<Song>;

      if (normalizedFormat === "DOCX") {
        parsedSong = await parseDocxFileOffline(file);
      } else if (normalizedFormat === "TEXT" || normalizedFormat === "TXT") {
        parsedSong = await parseTextFileOffline(file);
      } else {
        throw new Error(`${normalizedFormat} import is not yet available in offline Songbook mode.`);
      }

      const record = buildSongRecord(parsedSong);
      const primaryKey = await db.songs.add(record);
      const savedSong = normalizeSong({ ...record, id: primaryKey });
      await invalidateSongCaches(queryClient, savedSong);

      return {
        success: true,
        song: savedSong,
      };
    },
  });
};
