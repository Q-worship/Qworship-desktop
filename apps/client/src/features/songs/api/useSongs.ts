import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  structure?: string[];
  lyrics?: string;
  songId?: string;
}

const normalizeSong = (song: any): Song => ({
  ...song,
  id: song.id || song.songId || song._id,
  songId: song.songId || song.id || song._id,
  title: song.title || 'Untitled Song',
  dateAdded: song.dateAdded || song.createdAt || new Date().toISOString(),
});

const loadSongsOfflineFirst = async (): Promise<{ success: boolean; songs: Song[] }> => {
  await useSongRAMCache.getState().loadFromDisk();
  const ramSongs = useSongRAMCache.getState().songList.map(normalizeSong);
  if (ramSongs.length > 0) {
    return { success: true, songs: ramSongs };
  }

  const diskSongs = (await db.songs.toArray()).map(normalizeSong);
  if (diskSongs.length > 0) {
    await useSongRAMCache.getState().loadFromDisk();
    return { success: true, songs: diskSongs };
  }

  try {
    const response = await apiRequest("GET", "/api/songs");
    if (!response.ok) {
      throw new Error("Failed to fetch songs");
    }
    const data = await response.json();
    const songs = (Array.isArray(data) ? data : data?.songs || []).map(normalizeSong);
    if (songs.length > 0) {
      await db.songs.clear();
      await db.songs.bulkPut(songs);
      await useSongRAMCache.getState().loadFromDisk();
    }
    return { success: true, songs };
  } catch {
    return { success: true, songs: [] };
  }
};

export const useSongs = () => {
  return useQuery<{ success: boolean; songs: Song[] }>({
    queryKey: ["local-songs"],
    queryFn: loadSongsOfflineFirst,
    staleTime: 5_000,
    gcTime: 60_000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
};

export const useCreateSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (songData: Partial<Song>) => {
      const normalized = normalizeSong({
        ...songData,
        id: songData.id || crypto.randomUUID(),
        createdAt: songData.createdAt || new Date().toISOString(),
      });
      await db.songs.put(normalized as any);
      await useSongRAMCache.getState().invalidate(normalized);

      try {
        await apiRequest("POST", "/api/songs", normalized);
      } catch (error) {
        console.warn("[useCreateSong] Remote sync deferred:", error);
      }

      return { success: true, song: normalized };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-songs"] });
    },
  });
};

export const useUpdateSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, songData }: { id: string; songData: Partial<Song> }) => {
      const existing = await db.songs.where("songId").equals(id).first();
      const normalized = normalizeSong({ ...(existing || {}), ...songData, id });
      await db.songs.put(normalized as any);
      await useSongRAMCache.getState().invalidate(normalized);

      try {
        await apiRequest("PUT", `/api/songs/${id}`, normalized);
      } catch (error) {
        console.warn("[useUpdateSong] Remote sync deferred:", error);
      }

      return { success: true, song: normalized };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-songs"] });
    },
  });
};

export const useDeleteSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const existing = await db.songs.where("songId").equals(id).first();
      if (existing?.id !== undefined) {
        await db.songs.delete(existing.id);
      }
      await useSongRAMCache.getState().loadFromDisk();

      try {
        await apiRequest("DELETE", `/api/songs/${id}`);
      } catch (error) {
        console.warn("[useDeleteSong] Remote sync deferred:", error);
      }

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["local-songs"] });
    },
  });
};

export const useImportSong = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, format }: { file: File; format: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('format', format);

      const response = await fetch('/api/songs/import', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Import failed');
      }

      return response.json();
    },
    onSuccess: async () => {
      await useSongRAMCache.getState().loadFromDisk();
      queryClient.invalidateQueries({ queryKey: ["local-songs"] });
    },
  });
};
