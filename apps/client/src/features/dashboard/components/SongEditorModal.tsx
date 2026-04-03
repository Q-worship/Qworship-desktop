import React, { useState } from "react";
import { XIcon, PlusIcon, Edit, Trash2, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useCreateSong, useUpdateSong } from "@/features/songs/api/useSongs";
import { useDebounce } from "@/hooks/use-debounce";

interface SectionItem {
  id: string;
  type: "verse" | "chorus";
  number: number;
  label: string;
  content: string;
}

interface SongEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave?: (songData: any) => void;
  initialData?: any;
}

export const SongEditorModal: React.FC<SongEditorModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave,
  initialData 
}) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("title-lyrics");
  const [songTitle, setSongTitle] = useState("");
  const [alternativeTitle1, setAlternativeTitle1] = useState("");
  const [alternativeTitle2, setAlternativeTitle2] = useState("");
  const [verseOrder, setVerseOrder] = useState<string[]>([]);
  const [verseOrderInput, setVerseOrderInput] = useState("");
  const debouncedVerseOrderInput = useDebounce(verseOrderInput, 300);
  const [showAddOptions, setShowAddOptions] = useState(false);
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  const [sections, setSections] = useState<SectionItem[]>([
    { id: "v1", type: "verse", number: 1, label: "V1 (Verse 1)", content: "" },
    { id: "v2", type: "verse", number: 2, label: "V2 (Verse 2)", content: "" },
    { id: "v3", type: "verse", number: 3, label: "V3 (Verse 3)", content: "" }
  ]);

  const [authors, setAuthors] = useState("");
  const [topics, setTopics] = useState("");
  const [copyright, setCopyright] = useState("");

  // Mutation hooks from FSD architecture
  const createSongMutation = useCreateSong();
  const updateSongMutation = useUpdateSong();

  // Reset or populate fields when modal opens or initialData changes
  React.useEffect(() => {
    if (initialData) {
      setSongTitle(initialData.title || "");
      
      // For editing existing songs, use authors array, for imports use artist
      if (initialData.authors && Array.isArray(initialData.authors)) {
        setAuthors(initialData.authors.join(", "));
      } else if (initialData.artist) {
        setAuthors(initialData.artist);
      }
      
      // Set topics and copyright for editing existing songs
      if (initialData.topics && Array.isArray(initialData.topics)) {
        setTopics(initialData.topics.join(", "));
      }
      setCopyright(initialData.copyright || "");
      
      // Parse lyrics into sections if provided
      if (initialData.lyrics) {
        const parsedSections = parseLyricsIntoSections(initialData.lyrics);
        if (parsedSections.length > 0) {
          setSections(parsedSections);
        }
      } else if (initialData.sections && Array.isArray(initialData.sections)) {
        // If sections are directly provided (from existing songs)
        setSections(initialData.sections);
      }
      
      // Handle verse order/structure
      if (initialData.structure) {
        let structureArray;
        if (typeof initialData.structure === 'string') {
          try {
            structureArray = JSON.parse(initialData.structure);
          } catch (e) {
            // If parsing fails, treat as comma-separated string
            structureArray = initialData.structure.split(',').map(s => s.trim());
          }
        } else {
          structureArray = initialData.structure;
        }
        
        setVerseOrder(structureArray);
        setVerseOrderInput(structureArray.join(", "));
      } else if (initialData.verseOrder) {
        // Handle verseOrder string format from song viewer
        const orderArray = initialData.verseOrder.split(", ").map(s => s.trim());
        setVerseOrder(orderArray);
        setVerseOrderInput(initialData.verseOrder);
      }
    } else {
      // Reset form when no initial data (creating new song)
      setSongTitle("");
      setAuthors("");
      setTopics("");
      setCopyright("");
      setVerseOrder([]);
      setVerseOrderInput("");
      setSections([
        { id: "v1", type: "verse", number: 1, label: "V1 (Verse 1)", content: "" },
        { id: "v2", type: "verse", number: 2, label: "V2 (Verse 2)", content: "" },
        { id: "v3", type: "verse", number: 3, label: "V3 (Verse 3)", content: "" }
      ]);
    }
  }, [initialData, isOpen]);

  // Helper function to parse lyrics into sections
  const parseLyricsIntoSections = (lyrics: string): SectionItem[] => {
    const sections: SectionItem[] = [];
    const lines = lyrics.split('\n');
    let currentSection: { type: 'verse' | 'chorus', label: string, content: string[] } | null = null;
    let verseCount = 0;
    let chorusCount = 0;

    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('[') && trimmedLine.endsWith(']')) {
        // Save previous section if exists
        if (currentSection && currentSection.content.length > 0) {
          const isChorus = currentSection.type === 'chorus';
          sections.push({
            id: `${currentSection.type[0]}${isChorus ? chorusCount : verseCount}_${Date.now()}_${sections.length}`,
            type: currentSection.type,
            number: isChorus ? chorusCount : verseCount,
            label: currentSection.label,
            content: currentSection.content.join('\n')
          });
        }
        
        // Start new section
        const sectionLabel = trimmedLine.slice(1, -1);
        const isChorus = sectionLabel.toLowerCase().includes('chorus');
        if (isChorus) {
          chorusCount++;
        } else {
          verseCount++;
        }
        
        currentSection = {
          type: isChorus ? 'chorus' : 'verse',
          label: sectionLabel,
          content: []
        };
      } else if (trimmedLine && currentSection) {
        currentSection.content.push(trimmedLine);
      }
    }
    
    // Add final section
    if (currentSection && currentSection.content.length > 0) {
      const isChorus = currentSection.type === 'chorus';
      sections.push({
        id: `${currentSection.type[0]}${isChorus ? chorusCount : verseCount}_${Date.now()}_${sections.length}`,
        type: currentSection.type,
        number: isChorus ? chorusCount : verseCount,
        label: currentSection.label,
        content: currentSection.content.join('\n')
      });
    }
    
    return sections;
  };

  const addSection = (type: "verse" | "chorus") => {
    const existingSections = sections.filter(section => section.type === type);
    const newNumber = existingSections.length + 1;
    const prefix = type === "verse" ? "V" : "C";
    const label = type === "verse" ? `V${newNumber} (Verse ${newNumber})` : `C${newNumber} (Chorus ${newNumber})`;
    
    const newSection: SectionItem = {
      id: `${type[0]}${newNumber}_${Date.now()}`,
      type,
      number: newNumber,
      label,
      content: ""
    };
    setSections([...sections, newSection]);
    setShowAddOptions(false);
  };

  const updateSectionContent = (sectionId: string, content: string) => {
    setSections(sections.map(section => 
      section.id === sectionId ? { ...section, content } : section
    ));
  };

  const deleteSection = (sectionId: string) => {
    if (sections.length > 1) {
      setSections(sections.filter(section => section.id !== sectionId));
    }
  };

  // Get available sections for verse order
  const getAvailableSections = () => {
    return sections.map(section => {
      const prefix = section.type === "verse" ? "V" : "C";
      return `${prefix}${section.number}`;
    });
  };

  // Add section to verse order (allow duplicates)
  const addToVerseOrder = (sectionTag: string) => {
    setVerseOrder([...verseOrder, sectionTag]);
    setVerseOrderInput("");
  };

  // Remove section from verse order
  const removeFromVerseOrder = (index: number) => {
    setVerseOrder(verseOrder.filter((_, i) => i !== index));
  };

  // Filter sections based on input
  const getFilteredSections = () => {
    const available = getAvailableSections();
    if (!debouncedVerseOrderInput) return available;
    return available.filter(section => 
      section.toLowerCase().includes(debouncedVerseOrderInput.toLowerCase())
    );
  };

  const handleSave = () => {
    if (!songTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a song title",
        variant: "destructive",
      });
      return;
    }

    // Construct lyrics from sections
    const lyrics = sections.map(section => 
      `[${section.label}]\n${section.content}`
    ).join('\n\n');

    const songData = {
      title: songTitle,
      lyrics,
      structure: JSON.stringify(verseOrder), // Convert array to JSON string
      authors,
      topics,
      copyright
    };
    
    setShowSaveConfirmation(true);
    
    const isEditing = initialData && initialData.id;
    const mutationOptions = {
      onSuccess: () => {
        setShowSaveConfirmation(false);
        toast({
          title: isEditing ? "Song Updated Successfully!" : "Song Saved Successfully!",
          description: isEditing 
            ? `"${songTitle}" has been updated in your songbook.`
            : `"${songTitle}" has been added to your songbook and will appear in recent songs.`,
        });
        onSave?.({ title: songTitle });
        onClose();
      },
      onError: (error: any) => {
        setShowSaveConfirmation(false);
        toast({
          title: "Error",
          description: "Failed to save song: " + (error.message || "Unknown error"),
          variant: "destructive",
        });
      }
    };

    if (isEditing) {
      updateSongMutation.mutate({ id: initialData.id, songData }, mutationOptions);
    } else {
      createSongMutation.mutate(songData, mutationOptions);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-[#2a1f4b] rounded-lg w-full max-w-7xl max-h-[90vh] flex flex-col text-white overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-600 flex-shrink-0">
          <h2 className="text-xl font-semibold">Song editor</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <XIcon size={20} />
          </button>
        </div>

        {/* Custom Tab Navigation */}
        <div className="flex border-b border-gray-600 flex-shrink-0">
          <button
            onClick={() => setActiveTab("title-lyrics")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "title-lyrics" 
                ? "bg-[#8356F3] text-white" 
                : "bg-[#1a1537] text-gray-300 hover:bg-[#6d42c7] hover:text-white"
            }`}
          >
            Title & Lyrics
          </button>
          <button
            onClick={() => setActiveTab("authors-topics")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "authors-topics" 
                ? "bg-[#8356F3] text-white" 
                : "bg-[#1a1537] text-gray-300 hover:bg-[#6d42c7] hover:text-white"
            }`}
          >
            Authors & Topics
          </button>
          <button
            onClick={() => setActiveTab("copyright")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "copyright" 
                ? "bg-[#8356F3] text-white" 
                : "bg-[#1a1537] text-gray-300 hover:bg-[#6d42c7] hover:text-white"
            }`}
          >
            Copyright
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Title & Lyrics Tab */}
          {activeTab === "title-lyrics" && (
            <div className="p-4 space-y-4">
              {/* Title Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Song Title</label>
                  <Input
                    value={songTitle}
                    onChange={(e) => setSongTitle(e.target.value)}
                    className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 h-8 text-sm"
                    placeholder=""
                  />
                </div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Alternative Title</label>
                  <Input
                    value={alternativeTitle1}
                    onChange={(e) => setAlternativeTitle1(e.target.value)}
                    className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 h-8 text-sm"
                    placeholder=""
                  />
                </div>
                <div></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Alternative Title</label>
                  <Input
                    value={alternativeTitle2}
                    onChange={(e) => setAlternativeTitle2(e.target.value)}
                    className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 h-8 text-sm"
                    placeholder=""
                  />
                </div>
                <div></div>
              </div>

              {/* Sections (Songs & Choruses) */}
              <div className="flex gap-4 mt-6">
                {/* Sections List */}
                <div className="flex-1 space-y-3">
                  {sections.map((section, index) => (
                    <div key={section.id} className="bg-[#3d3166] border border-gray-500 rounded">
                      <div className="flex items-center justify-between p-2 border-b border-gray-500">
                        <span className="text-gray-300 font-medium text-sm">{section.label}</span>
                        <Button
                          onClick={() => deleteSection(section.id)}
                          className="bg-[#8356F3] hover:bg-[#6d42c7] text-white text-xs h-6 w-6 p-0"
                        >
                          ×
                        </Button>
                      </div>
                      <div className="p-2">
                        <Textarea
                          value={section.content}
                          onChange={(e) => updateSectionContent(section.id, e.target.value)}
                          className="bg-transparent border-none text-white placeholder-gray-400 resize-none h-24 text-sm p-0"
                          placeholder={`Enter ${section.type} lyrics...`}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="w-20 space-y-2 flex-shrink-0 relative">
                  <div className="relative">
                    <Button
                      onClick={() => setShowAddOptions(!showAddOptions)}
                      className="w-full bg-[#8356F3] hover:bg-[#6d42c7] text-white text-xs h-8 flex items-center justify-center gap-1"
                    >
                      Add
                      <ChevronDownIcon size={12} />
                    </Button>
                    
                    {/* Add Options Dropdown */}
                    {showAddOptions && (
                      <div className="absolute top-10 left-0 w-full bg-[#3d3166] border border-gray-500 rounded shadow-lg z-10">
                        <Button
                          onClick={() => addSection("verse")}
                          className="w-full bg-transparent hover:bg-[#4a3a75] text-white text-xs h-8 justify-start rounded-none"
                        >
                          Verse
                        </Button>
                        <Button
                          onClick={() => addSection("chorus")}
                          className="w-full bg-transparent hover:bg-[#4a3a75] text-white text-xs h-8 justify-start rounded-none"
                        >
                          Chorus
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    className="w-full bg-[#8356F3] hover:bg-[#6d42c7] text-white text-xs h-8"
                  >
                    Edit
                  </Button>
                  <Button
                    className="w-full bg-[#8356F3] hover:bg-[#6d42c7] text-white text-xs h-8"
                  >
                    Edit All
                  </Button>
                </div>
              </div>

              {/* Verse Order - Dynamic Tag System */}
              <div className="mt-4">
                <label className="block text-xs font-medium text-gray-300 mb-1">Verse Order</label>
                
                {/* Current Tags */}
                <div className="flex flex-wrap gap-1 mb-2 min-h-[32px] p-2 bg-[#3d3166] border border-gray-500 rounded">
                  {verseOrder.map((tag, index) => (
                    <span 
                      key={index}
                      className="bg-[#8356F3] text-white px-2 py-1 rounded text-xs flex items-center gap-1"
                    >
                      {tag}
                      <button
                        onClick={() => removeFromVerseOrder(index)}
                        className="hover:bg-[#6d42c7] rounded"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {verseOrder.length === 0 && (
                    <span className="text-gray-400 text-xs">Search and add sections (e.g., V1, C1, V2...)</span>
                  )}
                </div>

                {/* Search Input */}
                <div className="relative">
                  <Input
                    value={verseOrderInput}
                    onChange={(e) => setVerseOrderInput(e.target.value)}
                    className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 h-8 text-sm"
                    placeholder="Type to search sections (V1, C1, etc.)"
                  />
                  
                  {/* Dropdown with filtered options */}
                  {verseOrderInput && (
                    <div className="absolute top-10 left-0 right-0 bg-[#3d3166] border border-gray-500 rounded shadow-lg z-20 max-h-32 overflow-y-auto">
                      {getFilteredSections().map((section) => (
                        <button
                          key={section}
                          onClick={() => addToVerseOrder(section)}
                          className="w-full text-left px-3 py-2 text-white text-sm hover:bg-[#4a3a75] flex items-center gap-2"
                        >
                          <span className="bg-[#8356F3] px-1 py-0.5 rounded text-xs">{section}</span>
                          <span className="text-gray-300">
                            {sections.find(s => `${s.type === "verse" ? "V" : "C"}${s.number}` === section)?.label}
                          </span>
                        </button>
                      ))}
                      {getFilteredSections().length === 0 && (
                        <div className="px-3 py-2 text-gray-400 text-sm">No matching sections found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Authors & Topics Tab */}
          {activeTab === "authors-topics" && (
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Authors</label>
                <Textarea
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 text-sm"
                  placeholder=""
                  rows={4}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Topics</label>
                <Textarea
                  value={topics}
                  onChange={(e) => setTopics(e.target.value)}
                  className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 text-sm"
                  placeholder=""
                  rows={4}
                />
              </div>
            </div>
          )}

          {/* Copyright Tab */}
          {activeTab === "copyright" && (
            <div className="p-4">
              <div>
                <label className="block text-xs font-medium text-gray-300 mb-1">Copyright Information</label>
                <Textarea
                  value={copyright}
                  onChange={(e) => setCopyright(e.target.value)}
                  className="bg-[#3d3166] border-gray-500 text-white placeholder-gray-400 text-sm"
                  placeholder=""
                  rows={8}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-gray-600 flex-shrink-0">
          <Button
            onClick={handleCancel}
            variant="outline"
            className="bg-transparent border-gray-500 text-gray-300 hover:bg-[#3d3166] hover:border-gray-400 h-8 px-4 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            className="bg-[#8356F3] hover:bg-[#6d42c7] text-white h-8 px-4 text-sm"
          >
            Save
          </Button>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#2a1f3f] border border-gray-500 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-[#8356F3] border-t-transparent rounded-full mx-auto mb-4" />
              <h3 className="text-white text-lg font-medium mb-2">Saving Song...</h3>
              <p className="text-gray-300 text-sm">
                "{songTitle}" is being added to your songbook
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};