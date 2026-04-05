import { useToast } from "@/hooks/use-toast";
import { getServiceSectionKey } from "./useHistoryManager";

interface UseServiceItemManagerProps {
  selectedServiceSection: string | null;
  setShowSectionWarning: (v: boolean) => void;
  recordAction: (action: any) => void;
  setSectionItems: React.Dispatch<React.SetStateAction<Record<string, any[]>>>;
  setExpandedSections: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  setInsertedItems: React.Dispatch<React.SetStateAction<any[]>>;
  setSelectedContentType: (type: string | null) => void;
  setEditingContent: React.Dispatch<React.SetStateAction<any>>;
  setCurrentSongTitle: (title: string) => void;
  setSongEditorContent: (content: string) => void;
  setEditorHistory: React.Dispatch<React.SetStateAction<string[]>>;
  setHistoryIndex: React.Dispatch<React.SetStateAction<number>>;
  setEditorState: React.Dispatch<React.SetStateAction<any>>;
  setSelectedSlide: (slide: any) => void;
  setIsSlideEditorOpen: (open: boolean) => void;
  setServiceItems: React.Dispatch<React.SetStateAction<any[]>>;
  serviceItems: any[];
  sectionItems: Record<string, any[]>;
  editingContent: any;
  songSearchTerm: string;
  savedSongs: any;
  setFilteredSongs: React.Dispatch<React.SetStateAction<any[]>>;
  setIsSearchModalOpen: (open: boolean) => void;
  setShowSearchResults: (show: boolean) => void;
  setSongSearchTerm: (term: string) => void;
  setParsedLyrics: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setSongArrangement: React.Dispatch<React.SetStateAction<string[]>>;
  deleteConfirmation: { isOpen: boolean; item: any; sectionName: string };
  setDeleteConfirmation: React.Dispatch<
    React.SetStateAction<{ isOpen: boolean; item: any; sectionName: string }>
  >;
  rebuildSlidesFromServiceItems: () => void;
}

export function useServiceItemManager({
  selectedServiceSection,
  setShowSectionWarning,
  recordAction,
  setSectionItems,
  setExpandedSections,
  setInsertedItems,
  setSelectedContentType,
  setEditingContent,
  setCurrentSongTitle,
  setSongEditorContent,
  setEditorHistory,
  setHistoryIndex,
  setEditorState,
  setSelectedSlide,
  setIsSlideEditorOpen,
  setServiceItems,
  serviceItems,
  sectionItems,
  editingContent,
  songSearchTerm,
  savedSongs,
  setFilteredSongs,
  setIsSearchModalOpen,
  setShowSearchResults,
  setSongSearchTerm,
  setParsedLyrics,
  setSongArrangement,
  deleteConfirmation,
  setDeleteConfirmation,
  rebuildSlidesFromServiceItems,
}: UseServiceItemManagerProps) {
  const { toast } = useToast();

  const parseLyricsIntoSections = (lyrics: string): Record<string, string> => {
    const sections: Record<string, string> = {};
    if (!lyrics) return sections;

    const lines = lyrics.split("\n");
    let currentSection = "";
    let currentContent = "";

    for (const line of lines) {
      const sectionMatch = line.match(/^\[([^\]]+)\]/);
      if (sectionMatch) {
        if (currentSection && currentContent.trim()) {
          sections[currentSection] = currentContent.trim();
        }
        currentSection = sectionMatch[1];
        currentContent = "";
      } else if (currentSection) {
        currentContent += line + "\n";
      }
    }

    if (currentSection && currentContent.trim()) {
      sections[currentSection] = currentContent.trim();
    }

    return sections;
  };

  const createSlidesFromSong = (song: any): any[] => {
    const slides: any[] = [];

    if (song.lyrics) {
      const parsedSections = parseLyricsIntoSections(song.lyrics);
      let slideNumber = 1;

      Object.entries(parsedSections).forEach(([sectionName, lyrics]) => {
        const isVerse1 =
          sectionName.toLowerCase().includes("v1") ||
          sectionName.toLowerCase().includes("verse 1");
        const isVerse2 =
          sectionName.toLowerCase().includes("v2") ||
          sectionName.toLowerCase().includes("verse 2");
        const isChorus =
          sectionName.toLowerCase().includes("c") ||
          sectionName.toLowerCase().includes("chorus");

        let type = "verse";
        let label = "VERSE";

        if (isVerse1) {
          type = "verse";
          label = "V1";
        } else if (isVerse2) {
          type = "verse";
          label = "V2";
        } else if (isChorus) {
          type = "chorus";
          label = "C1";
        }

        slides.push({
          id: `slide-${song.id}-${slideNumber}`,
          type,
          title: song.title,
          content: (lyrics as string).trim(),
          sectionLabel: label,
          songTitle: song.title,
        });

        slideNumber++;
      });
    }

    if (slides.length === 0) {
      slides.push({
        id: `slide-${song.id}-1`,
        type: "verse",
        title: song.title,
        content: song.lyrics || "No lyrics available",
        sectionLabel: "V1",
        songTitle: song.title,
      });
    }

    return slides;
  };

  const updateItemContent = (
    itemId: string,
    newTitle: string,
    newContent: any,
    slides?: any[],
    metadata?: Record<string, any>,
  ) => {
    // For announcement items, auto-regenerate slides to reflect title/content changes
    const resolveSlides = (existingItem: any) => {
      if (slides) return slides;
      if (existingItem?.type === "announcement") {
        const merged = { ...existingItem, ...(metadata || {}) };
        const contentStr = typeof newContent === "string" ? newContent : (typeof merged.content === "string" ? merged.content : "");
        return [{
          id: existingItem.slides?.[0]?.id || `slide-${itemId}-${Date.now()}`,
          type: "announcement" as const,
          title: newTitle,
          content: contentStr,
          location: merged.location || "",
          eventDate: merged.eventDate || "",
          eventTime: merged.eventTime || "",
          contact: merged.contact || "",
          sectionLabel: "Announcement",
        }];
      }
      return existingItem?.slides;
    };

    const extra = metadata || {};

    setServiceItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              ...extra,
              title: newTitle,
              content: newContent,
              slides: resolveSlides(item),
            }
          : item,
      ),
    );

    setSectionItems((prev) => {
      const newSectionItems = { ...prev };
      for (const section in newSectionItems) {
        const idx = newSectionItems[section].findIndex(
          (item) => item.id === itemId,
        );
        if (idx !== -1) {
          newSectionItems[section] = [...newSectionItems[section]];
          const existingItem = newSectionItems[section][idx];
          newSectionItems[section][idx] = {
            ...existingItem,
            ...extra,
            title: newTitle,
            content: newContent,
            slides: resolveSlides(existingItem),
          };
          break;
        }
      }
      return newSectionItems;
    });

    setEditingContent((prev: any) =>
      prev && prev.id === itemId
        ? {
            ...prev,
            ...extra,
            title: newTitle,
            content: newContent,
            slides: resolveSlides(prev),
          }
        : prev,
    );
  };

  const addItemToPreparation = (item: any) => {
    if (!selectedServiceSection) {
      setShowSectionWarning(true);
      setTimeout(() => setShowSectionWarning(false), 3000);
      return;
    }

    recordAction({
      type: "ADD_ITEM",
      itemId: item.id,
      sectionName: selectedServiceSection,
      item,
      description: `Add ${item.title || item.type} to ${selectedServiceSection}`,
    });

    setSectionItems((prev) => ({
      ...prev,
      [selectedServiceSection]: [...(prev[selectedServiceSection] || []), item],
    }));

    setExpandedSections((prev) => ({
      ...prev,
      [selectedServiceSection]: true,
    }));

    setInsertedItems((prev) => [...prev, item]);
    setSelectedContentType(item.type);
    setEditingContent(item);

    if (item.type === "song") {
      setCurrentSongTitle(item.title === "Song" ? "" : item.title || "");
    }

    setSelectedSlide(null);
    setIsSlideEditorOpen(false);

    const newServiceItem = {
      id: item.id,
      section: getServiceSectionKey(selectedServiceSection),
      type: item.type,
      title: item.title,
      content: item.content || {},
      location: item.location || "",
      eventDate: item.eventDate || "",
      eventTime: item.eventTime || "",
      contact: item.contact || "",
      slides: [
        {
          id: `slide-${item.id}-${Date.now()}`,
          type: item.type === "song" ? ("song" as const) : item.type === "announcement" ? ("announcement" as const) : ("custom" as const),
          title: item.title,
          content:
            item.type === "song" ? "Please select a song" : (typeof item.content === "string" ? item.content : "Ready for content"),
          sectionLabel: item.type === "song" ? "Song" : item.type === "announcement" ? "Announcement" : "Content",
          ...(item.type === "announcement" ? {
            location: item.location || "",
            eventDate: item.eventDate || "",
            eventTime: item.eventTime || "",
            contact: item.contact || "",
          } : {}),
        },
      ],
    };

    setServiceItems((prev) => [...prev, newServiceItem]);
  };

  const createSlidesForItem = (item: any): any[] => {
    const songSections = item.sections || item.content;

    if (item.type === "song" && songSections && Array.isArray(songSections)) {
      return songSections.map((section: any, index: number) => ({
        id: `song-${item.songId}-${section.id}-${Date.now()}-${index}`,
        type:
          section.type === "verse" ? ("verse" as const) : ("chorus" as const),
        title: `${item.title} - ${section.label}`,
        content: section.content,
        songId: item.songId,
        sectionLabel: section.label,
      }));
    }

    if (item.type === "announcement") {
      return [
        {
          id: `item-${item.id}-${Date.now()}`,
          type: "announcement" as const,
          title: item.title || "Announcement",
          content: typeof item.content === "string" ? item.content : (item.title || "Announcement"),
          location: item.location || "",
          eventDate: item.eventDate || "",
          eventTime: item.eventTime || "",
          contact: item.contact || "",
          sectionLabel: "Announcement",
        },
      ];
    }

    return [
      {
        id: `item-${item.id}-${Date.now()}`,
        type: "custom" as const,
        title: item.title || "Untitled",
        content: item.content || item.title || "Custom Content",
      },
    ];
  };

  const addSongToServiceSections = (songItem: any, sectionIds: string[]) => {
    sectionIds.forEach((sectionId) => {
      const itemWithUniqueId = {
        ...songItem,
        id: `song-${songItem.songId}-${sectionId}-${Date.now()}`,
      };
      recordAction({
        type: "ADD_ITEM",
        itemId: itemWithUniqueId.id,
        sectionName: sectionId,
        item: itemWithUniqueId,
        description: `Add song "${songItem.title}" to ${sectionId}`,
      });
    });

    sectionIds.forEach((sectionId) => {
      const itemWithUniqueId = {
        ...songItem,
        id: `song-${songItem.songId}-${sectionId}-${Date.now()}`,
      };
      setSectionItems((prev) => ({
        ...prev,
        [sectionId]: [...(prev[sectionId] || []), itemWithUniqueId],
      }));
      setExpandedSections((prev) => ({ ...prev, [sectionId]: true }));
    });

    setInsertedItems((prev) => [...prev, songItem]);
    setSelectedContentType(songItem.type);
    setEditingContent(songItem);
    setCurrentSongTitle(songItem.title === "Song" ? "" : songItem.title || "");

    const initialContent = songItem.content?.lyrics || "";
    setSongEditorContent(initialContent);
    setEditorHistory([initialContent]);
    setHistoryIndex(0);
    setEditorState((prev: any) => ({
      ...prev,
      canUndo: false,
      canRedo: false,
    }));

    setTimeout(() => {
      rebuildSlidesFromServiceItems();
    }, 100);
  };

  const createSlideFromItem = (item: any) => {
    if (item.type === "song") {
      if (!item.sections || item.sections.length === 0) {
        toast({
          title: "Generic Song Slide Created",
          description: `Created generic slide for "${item.title}" - ready for lyrics`,
        });
      } else {
        toast({
          title: "Song Slides Created",
          description: `Created ${item.sections.length} slides for "${item.title}"`,
        });
      }
    } else {
      toast({
        title: "Slide Created",
        description: `Created slide for "${item.title}"`,
      });
    }
  };

  const toggleSection = (sectionName: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName as keyof typeof prev],
    }));
  };

  const rebuildSlidesFromServiceItemsLocal = () => {
    rebuildSlidesFromServiceItems();
  };

  // Insert helper functions
  const insertBibleVerse = () =>
    addItemToPreparation({
      id: `bible-${Date.now()}`,
      type: "bible",
      title: "John 3:16",
      content:
        "For God so loved the world that he gave his one and only Son, that whoever believes in him shall not perish but have eternal life.",
      version: "NIV",
      reference: "John 3:16",
    });
  const showPopularVerses = () => console.log("Show popular verses");
  const showRecentVerses = () => console.log("Show recent verses");
  const createAnnouncement = () =>
    addItemToPreparation({
      id: `announcement-${Date.now()}`,
      type: "announcement",
      title: "Welcome Announcement",
      content:
        "Welcome to our Sunday service! We're glad you're here with us today.",
      location: "",
      eventDate: "",
      eventTime: "",
      contact: "",
      duration: "manual",
    });
  const createEventAnnouncement = () =>
    addItemToPreparation({
      id: `event-${Date.now()}`,
      type: "announcement",
      title: "Upcoming Event",
      content: "Join us next Sunday for our special guest speaker at 10:30 AM.",
      location: "Main Sanctuary",
      eventDate: "",
      eventTime: "10:30",
      contact: "",
      duration: "manual",
    });
  const showAnnouncementTemplates = () =>
    console.log("Show announcement templates");
  const insertImage = () =>
    addItemToPreparation({
      id: `image-${Date.now()}`,
      type: "media",
      subtype: "image",
      title: "Background Image",
      content: "Worship background image",
    });
  const insertVideo = () =>
    addItemToPreparation({
      id: `video-${Date.now()}`,
      type: "media",
      subtype: "video",
      title: "Worship Video",
      content: "Inspirational worship video",
    });
  const insertAudio = () =>
    addItemToPreparation({
      id: `audio-${Date.now()}`,
      type: "media",
      subtype: "audio",
      title: "Background Music",
      content: "Soft instrumental music",
    });
  const insertPrayer = () =>
    addItemToPreparation({
      id: `prayer-${Date.now()}`,
      type: "liturgy",
      subtype: "prayer",
      title: "Opening Prayer",
      content: "Heavenly Father, we gather in Your name today...",
    });
  const insertScriptureReading = () =>
    addItemToPreparation({
      id: `scripture-${Date.now()}`,
      type: "liturgy",
      subtype: "scripture",
      title: "Scripture Reading",
      content: "Today's scripture reading from Romans 12:1-2",
    });
  const insertCommunion = () =>
    addItemToPreparation({
      id: `communion-${Date.now()}`,
      type: "liturgy",
      subtype: "communion",
      title: "Holy Communion",
      content: "The Lord's Supper preparation and elements",
    });

  const handleBrowseSongs = () => {
    if (songSearchTerm.length < 3) {
      toast({
        title: "Search Term Too Short",
        description: "Please enter at least 3 characters to search for songs.",
        variant: "destructive",
      });
      return;
    }
    const searchLower = songSearchTerm.toLowerCase();
    const filtered =
      ((savedSongs as any)?.songs || []).filter(
        (song: any) =>
          song.title?.toLowerCase().includes(searchLower) ||
          song.lyrics?.toLowerCase().includes(searchLower) ||
          song.artist?.toLowerCase().includes(searchLower) ||
          song.authors?.some((author: string) =>
            author?.toLowerCase().includes(searchLower),
          ),
      ) || [];
    setFilteredSongs(filtered);
    setIsSearchModalOpen(true);
  };

  const handleModalSearch = () => {
    if (songSearchTerm.length < 3) return;
    const searchLower = songSearchTerm.toLowerCase();
    const filtered = (savedSongs || []).filter(
      (song: any) =>
        song.title?.toLowerCase().includes(searchLower) ||
        song.lyrics?.toLowerCase().includes(searchLower) ||
        song.artist?.toLowerCase().includes(searchLower) ||
        song.authors?.some((author: string) =>
          author?.toLowerCase().includes(searchLower),
        ),
    );
    setFilteredSongs(filtered);
  };

  const handleSelectSong = (song: any) => {
    if (editingContent) {
      updateItemContent(
        editingContent.id,
        song.title,
        song,
        createSlidesFromSong(song),
      );
      setCurrentSongTitle(song.title);
      setSongEditorContent(song.lyrics || "");
      const sections = parseLyricsIntoSections(song.lyrics);
      setParsedLyrics(sections);
      setEditingContent((prev: any) =>
        prev ? { ...prev, title: song.title, content: song } : null,
      );
      const availableSections = Object.keys(sections);
      const defaultArrangement = availableSections.filter(
        (s) =>
          s.toLowerCase().includes("v1") ||
          s.toLowerCase().includes("verse 1") ||
          s.toLowerCase().includes("v2") ||
          s.toLowerCase().includes("verse 2") ||
          s.toLowerCase().includes("c") ||
          s.toLowerCase().includes("chorus"),
      );
      setSongArrangement(
        defaultArrangement.length > 0 ? defaultArrangement : ["V1", "V2", "C"],
      );
      setShowSearchResults(false);
      setSongSearchTerm("");
      setSelectedSlide(null);
      toast({
        title: "Song Loaded",
        description: `"${song.title}" has been loaded and the service item title has been updated.`,
      });
    }
  };

  const handleSelectBibleVerse = (verse: any) => {
    if (editingContent && editingContent.type === "bible") {
      const verseTitle = `${verse.book} ${verse.chapter}:${verse.verse}`;
      updateItemContent(editingContent.id, verseTitle, {
        ...verse,
        reference: verseTitle,
      });
      toast({
        title: "Bible Verse Loaded",
        description: `"${verseTitle}" has been loaded and the service item title has been updated.`,
      });
    }
  };

  const handleBibleReferenceChange = (reference: string) => {
    if (editingContent && editingContent.type === "bible") {
      updateItemContent(editingContent.id, reference || editingContent.title, {
        ...editingContent.content,
        reference,
      });
    }
  };

  const showDeleteConfirmation = (sectionName: string, item: any) => {
    setDeleteConfirmation({ isOpen: true, item, sectionName });
  };

  const removeItemFromServiceSection = (
    sectionName: string,
    itemId: string,
  ) => {
    const itemToRemove = sectionItems[sectionName]?.find(
      (item) => item.id === itemId,
    );
    if (itemToRemove) {
      recordAction({
        type: "REMOVE_ITEM",
        itemId,
        sectionName,
        item: itemToRemove,
        description: `Remove ${itemToRemove.title || itemToRemove.type} from ${sectionName}`,
      });
    }

    setSectionItems((prev) => ({
      ...prev,
      [sectionName]: (prev[sectionName] || []).filter(
        (item) => item.id !== itemId,
      ),
    }));
    setServiceItems((prev) => prev.filter((item) => item.id !== itemId));
    setInsertedItems((prev) => prev.filter((item) => item.id !== itemId));

    if (editingContent?.id === itemId) {
      setEditingContent(null);
      setSelectedContentType(null);
      setCurrentSongTitle("");
    }
  };

  const confirmDelete = () => {
    if (deleteConfirmation.item && deleteConfirmation.sectionName) {
      removeItemFromServiceSection(
        deleteConfirmation.sectionName,
        deleteConfirmation.item.id,
      );
    }
    setDeleteConfirmation({ isOpen: false, item: null, sectionName: "" });
  };

  const cancelDelete = () => {
    setDeleteConfirmation({ isOpen: false, item: null, sectionName: "" });
  };

  return {
    parseLyricsIntoSections,
    createSlidesFromSong,
    updateItemContent,
    addItemToPreparation,
    createSlidesForItem,
    addSongToServiceSections,
    createSlideFromItem,
    toggleSection,
    rebuildSlidesFromServiceItems: rebuildSlidesFromServiceItemsLocal,
    insertBibleVerse,
    showPopularVerses,
    showRecentVerses,
    createAnnouncement,
    createEventAnnouncement,
    showAnnouncementTemplates,
    insertImage,
    insertVideo,
    insertAudio,
    insertPrayer,
    insertScriptureReading,
    insertCommunion,
    handleBrowseSongs,
    handleModalSearch,
    handleSelectSong,
    handleSelectBibleVerse,
    handleBibleReferenceChange,
    showDeleteConfirmation,
    removeItemFromServiceSection,
    confirmDelete,
    cancelDelete,
  };
}
