import React, { useState } from "react";
import { XIcon, PlusIcon, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SongEditorModal } from "./SongEditorModal";
import { SongViewerModal } from "./SongViewerModal";
import { SongImportModal } from "./SongImportModal";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

// Helper function to parse lyrics into sections
const parseLyricsIntoSections = (lyrics: string) => {
  const sections = [];
  const lines = lyrics.split("\n");
  let currentSection = null;
  let sectionContent = [];
  let verseCount = 0;
  let chorusCount = 0;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
      // Save previous section if exists
      if (currentSection && sectionContent.length > 0) {
        const isChorus =
          currentSection.toLowerCase().includes("chorus") ||
          currentSection.toLowerCase() === "c" ||
          currentSection.toLowerCase().startsWith("c");

        const sectionNumber = isChorus ? chorusCount + 1 : verseCount + 1;
        if (isChorus) {
          chorusCount++;
        } else {
          verseCount++;
        }

        const sectionData: any = {
          id: `section${sections.length + 1}`,
          type: isChorus ? "chorus" : "verse",
          number: sectionNumber,
          label: currentSection,
          content: sectionContent.join("\n"),
        };

        sections.push(sectionData);
      }

      // Start new section
      currentSection = trimmedLine.slice(1, -1);
      sectionContent = [];
    } else if (trimmedLine && currentSection) {
      sectionContent.push(trimmedLine);
    }
  }

  // Add final section
  if (currentSection && sectionContent.length > 0) {
    const isChorus =
      currentSection.toLowerCase().includes("chorus") ||
      currentSection.toLowerCase() === "c" ||
      currentSection.toLowerCase().startsWith("c");

    const sectionNumber = isChorus ? chorusCount + 1 : verseCount + 1;
    if (isChorus) {
      chorusCount++;
    } else {
      verseCount++;
    }

    const sectionData = {
      id: `section${sections.length + 1}`,
      type: isChorus ? "chorus" : "verse",
      number: sectionNumber,
      label: currentSection,
      content: sectionContent.join("\n"),
    };

    sections.push(sectionData);
  }

  return sections;
};

interface Song {
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
}

interface SongbookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSongEditor: (songData?: any) => void;
  savedSongs: Song[];
  onAddToServiceSection?: (songItem: any, sectionIds: string[]) => void;
}

export const SongbookModal: React.FC<SongbookModalProps> = ({
  isOpen,
  onClose,
  onOpenSongEditor,
  savedSongs,
  onAddToServiceSection,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const [sortBy, setSortBy] = useState("Suggested");
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isSongViewerOpen, setIsSongViewerOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle song editing
  const handleEditSong = (song: Song) => {
    // Close all modals
    setIsSongViewerOpen(false);
    setSelectedSong(null);
    onClose(); // Close songbook modal

    // Prepare song data for editor
    const songDataForEditor = {
      id: song.id,
      title: song.title,
      authors: song.authors,
      topics: song.topics,
      copyright: song.copyright,
      lyrics: song.sections
        ? song.sections
            .map((section) => `[${section.label}]\n${section.content}`)
            .join("\n\n")
        : "",
      sections: song.sections,
      structure: song.verseOrder
        ? song.verseOrder.split(", ").map((s) => s.trim())
        : [],
      verseOrder: song.verseOrder,
    };

    // Open song editor with the song data
    onOpenSongEditor(songDataForEditor);
  };

  // Handle song deletion
  const handleDeleteSong = async (songId: string) => {
    try {
      // Close the viewer modal first
      setIsSongViewerOpen(false);
      setSelectedSong(null);

      // The SongViewerModal already handles the API call and toast notifications
      // We just need to refresh the songs list
      queryClient.invalidateQueries({ queryKey: ["/api/songs"] });
    } catch (error) {
      console.error("Error handling song deletion:", error);
    }
  };

  // Use real songs from API, with fallback example song if needed
  const recentSongs: Song[] = React.useMemo(() => {
    console.log(
      "SongbookModal recalculating recentSongs based on savedSongs trigger",
    );
    return savedSongs?.length > 0
      ? savedSongs.map((song) => {
          const sections = song.lyrics
            ? parseLyricsIntoSections(song.lyrics)
            : undefined;

          // Parse structure from database and create proper verseOrder string
          let verseOrder = undefined;
          if (
            song.structure &&
            Array.isArray(song.structure) &&
            song.structure.length > 0
          ) {
            verseOrder = song.structure.join(", ");
          }

          console.log(`Song "${song.title}" structure:`, song.structure);
          console.log(`Song "${song.title}" verseOrder:`, verseOrder);
          console.log(`Transforming song "${song.title}":`, {
            originalSong: song,
            parsedSections: sections,
            verseOrder,
            authors: song.authors,
            artist: song.artist,
          });

          return {
            id: song.id?.toString() || "unknown",
            title: song.title || "Unknown Title",
            artist:
              song.authors &&
              Array.isArray(song.authors) &&
              song.authors.length > 0
                ? song.authors.join(", ")
                : song.artist && song.artist !== "Unknown Artist"
                  ? song.artist
                  : undefined,
            dateAdded: new Date(
              song.createdAt || Date.now(),
            ).toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
            }),
            thumbnail: song.title?.substring(0, 2).toUpperCase() || "??",
            verseOrder,
            sections,
            authors: song.authors,
            topics: song.topics,
            copyright: song.copyright,
          };
        })
      : [
          // Fallback example song when user is not authenticated or no songs exist
          {
            id: "example",
            title: "Example Song",
            artist: "Q-worship Demo",
            dateAdded: "Sun, Jun 1",
            thumbnail: "EX",
            verseOrder: "V1, V2, C1",
            structure: ["verse1", "verse2", "chorus"],
            sections: [
              {
                id: "verse1",
                type: "verse" as const,
                number: 1,
                label: "Verse 1",
                content:
                  "This is a sample verse\nTo show how songs work\nIn Q-worship presentation system",
              },
              {
                id: "verse2",
                type: "verse" as const,
                number: 2,
                label: "Verse 2",
                content:
                  "Add your church songs here\nDelete this example when ready\nQ-worship makes it easy",
              },
              {
                id: "chorus1",
                type: "chorus" as const,
                number: 1,
                label: "Chorus",
                content:
                  "Example song for your ministry\nHelping you learn the system\nReplace with your own songs",
              },
            ],
          },
        ];
  }, [savedSongs]);

  const handleSongClick = (song: Song) => {
    setSelectedSong(song);
    setIsSongViewerOpen(true);
  };

  const handleImportComplete = (songData: any) => {
    setIsImportModalOpen(false);
    onClose(); // Close songbook modal

    const songDataForEditor = {
      id: songData.id,
      title: songData.title,
      authors: songData.authors,
      topics: songData.topics,
      copyright: songData.copyright,
      artist: songData.artist,
      lyrics: songData.lyrics || "",
      sections: songData.sections,
      structure: songData.structure || [],
      verseOrder: Array.isArray(songData.structure)
        ? songData.structure.join(", ")
        : songData.verseOrder,
    };

    onOpenSongEditor(songDataForEditor); // Open song editor with imported data
  };

  const sortOptions = [
    { value: "Date", label: "Date" },
    { value: "Name", label: "Name" },
    { value: "Recently opened", label: "Recently opened" },
    { value: "Suggested", label: "Suggested" },
  ];

  const filteredSongs = recentSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
      (song.artist &&
        song.artist.toLowerCase().includes(debouncedSearchQuery.toLowerCase())),
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#2a1f4b] rounded-lg w-full max-w-6xl h-[750px] flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <h2 className="text-2xl font-semibold">Songbook</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1">
            <XIcon size={24} />
          </button>
        </div>

        {/* Search and Sort Controls */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-600">
          <div className="flex-1">
            <Input
              type="text"
              placeholder="Find..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#1a1537] border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-300">Sort by</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 bg-[#8356F3] border-none text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#2a1f4b] border-gray-600">
                {sortOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className={`text-white hover:bg-[#8356F3] ${
                      option.value === "Suggested"
                        ? "bg-[#E91E63] hover:bg-[#C2185B]"
                        : "hover:bg-[#6d42c7]"
                    }`}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Recent Songs Section */}
        <div className="flex-1 p-6 overflow-y-auto">
          <h3 className="text-lg font-medium mb-4 text-white">Recent songs</h3>

          {filteredSongs.length > 0 ? (
            <div className="space-y-2">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  onClick={() => handleSongClick(song)}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a1537] cursor-pointer transition-colors border border-gray-600">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-[#8356F3] rounded flex items-center justify-center text-white font-medium text-sm">
                      {song.thumbnail ||
                        song.title.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{song.title}</h4>
                      {song.artist && (
                        <p className="text-sm text-gray-400">{song.artist}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {song.dateAdded}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>No songs found matching your search.</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-600">
          <Button
            onClick={() => {
              onClose(); // Close the Songbook modal first
              onOpenSongEditor(); // Open Song Editor via parent
            }}
            variant="outline"
            className="bg-transparent border-gray-600 text-white hover:bg-[#1a1537] hover:border-gray-500">
            <PlusIcon size={16} className="mr-2" />
            Add new song
          </Button>
          <Button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-[#8356F3] hover:bg-[#6d42c7] text-white">
            <Download size={16} className="mr-2" />
            Import song
          </Button>
        </div>
      </div>

      {/* Song Viewer Modal */}
      <SongViewerModal
        isOpen={isSongViewerOpen}
        onClose={() => {
          setIsSongViewerOpen(false);
          setSelectedSong(null);
        }}
        song={selectedSong}
        onEdit={handleEditSong}
        onDelete={handleDeleteSong}
        onAddToServiceSection={onAddToServiceSection}
      />

      {/* Song Import Modal */}
      <SongImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportComplete={handleImportComplete}
      />
    </div>
  );
};
