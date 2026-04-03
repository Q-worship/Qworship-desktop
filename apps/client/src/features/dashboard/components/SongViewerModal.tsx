import React, { useState } from "react";
import { XIcon, Edit, Play, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDeleteSong } from "@/features/songs/api/useSongs";

interface SongData {
  id: string;
  title: string;
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
  dateAdded: string;
  artist?: string;
}

interface SongViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  song: SongData | null;
  onEdit?: (song: SongData) => void;
  onDelete?: (songId: string) => void;
  onAddToServiceSection?: (songItem: any, sectionIds: string[]) => void;
}

export const SongViewerModal: React.FC<SongViewerModalProps> = ({ 
  isOpen, 
  onClose, 
  song,
  onEdit,
  onDelete,
  onAddToServiceSection
}) => {
  const [activeTab, setActiveTab] = useState("lyrics");
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showServiceSectionModal, setShowServiceSectionModal] = useState(false);
  const [selectedServiceSections, setSelectedServiceSections] = useState<string[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Service sections for presentation
  const serviceSections = [
    { id: "PRE-SERVICE ITEMS", label: "PRE-SERVICE ITEMS", description: "Items to display before the service begins" },
    { id: "WARM - UP", label: "WARM - UP", description: "Opening songs and welcome content" },
    { id: "SERVICE ITEMS", label: "SERVICE ITEMS", description: "Main service content and worship songs" },
    { id: "POST SERVICE LOOP", label: "POST SERVICE LOOP", description: "Closing songs and announcements" }
  ];

  // Delete mutation
  const deleteMutation = useDeleteSong();

  const handleDelete = () => {
    if (song?.id) {
      deleteMutation.mutate(song.id, {
        onSuccess: () => {
          toast({
            title: "Song deleted successfully",
            description: "The song has been removed from your songbook.",
            className: "bg-gradient-to-r from-purple-900 to-purple-800 text-white backdrop-blur-sm"
          });
          onClose();
          setShowDeleteConfirmation(false);
        },
        onError: (error: any) => {
          toast({
            title: "Delete failed",
            description: error.message || "Failed to delete the song. Please try again.",
            variant: "destructive"
          });
        }
      });
    }
  };

  const handlePresent = () => {
    setSelectedServiceSections([]);
    setShowServiceSectionModal(true);
  };

  const handleServiceSectionToggle = (sectionId: string) => {
    setSelectedServiceSections(prev => {
      if (prev.includes(sectionId)) {
        return prev.filter(id => id !== sectionId);
      } else {
        return [...prev, sectionId];
      }
    });
  };

  const handleAddToSelectedSections = () => {
    if (!song || selectedServiceSections.length === 0) return;

    // Create song item for the service sections
    const songItem = {
      id: `song-${song.id}-${Date.now()}`,
      type: "song",
      title: song.title,
      artist: song.artist || (Array.isArray(song.authors) ? song.authors.join(", ") : song.authors) || "Unknown Artist",
      content: song.sections || [],
      sections: song.sections || [], // Add sections field for slide creation
      lyrics: (song as any).lyrics, // Include lyrics field for fallback slide creation
      structure: (song as any).structure, // Include structure field
      verseOrder: song.verseOrder,
      songId: song.id
    };

    if (onAddToServiceSection) {
      // Use the prop function to integrate with dashboard state
      onAddToServiceSection(songItem, selectedServiceSections);
    } else {
      // Fallback to localStorage (for backward compatibility)
      const existingItems = JSON.parse(localStorage.getItem('qworship-service-items') || '{}');
      
      selectedServiceSections.forEach(sectionId => {
        const sectionItems = existingItems[sectionId] || [];
        sectionItems.push({...songItem, id: `song-${song.id}-${sectionId}-${Date.now()}`});
        existingItems[sectionId] = sectionItems;
      });
      
      localStorage.setItem('qworship-service-items', JSON.stringify(existingItems));
    }

    const sectionNames = selectedServiceSections.join(", ");
    toast({
      title: "Song added to service sections",
      description: `"${song.title}" has been added to: ${sectionNames}`,
      className: "bg-gradient-to-r from-purple-900 to-purple-800 text-white backdrop-blur-sm"
    });

    setShowServiceSectionModal(false);
    setSelectedServiceSections([]);
    onClose(); // Close the song viewer modal
  };

  if (!isOpen || !song) return null;

  // Debug logging
  console.log("SongViewerModal received song:", song);
  console.log("Song sections:", song.sections);
  console.log("Song verseOrder:", song.verseOrder);

  const renderSongLyrics = () => {
    if (!song.sections || song.sections.length === 0) {
      return (
        <div className="bg-[#3d3166] rounded-lg p-4">
          <p className="text-gray-400">No lyrics available for this song.</p>
        </div>
      );
    }

    if (!song.verseOrder) {
      return (
        <div className="space-y-4">
          {song.sections.map((section) => (
            <div key={section.id} className="bg-[#3d3166] rounded-lg p-4">
              <h4 className="text-[#8356F3] font-medium mb-2">{section.label}</h4>
              <div className="text-white whitespace-pre-line leading-relaxed">
                {section.content || "No lyrics added yet..."}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Render sections based on verse order
    const orderArray = song.verseOrder.split(", ");
    return (
      <div className="space-y-4">
        {orderArray.map((sectionTag, index) => {
          console.log(`Looking for section with tag: "${sectionTag}"`);
          
          const section = song.sections?.find(s => {
            const prefix = s.type === "verse" ? "V" : "C";
            const expectedTag = `${prefix}${s.number}`;
            const alternateTag = s.type === "chorus" && s.number === 1 ? "C" : expectedTag;
            
            console.log(`  Checking section: ${s.label} (type: ${s.type}, number: ${s.number})`);
            console.log(`  Expected tags: "${expectedTag}" or "${alternateTag}"`);
            
            return expectedTag === sectionTag || alternateTag === sectionTag;
          });
          
          console.log(`  Found section for "${sectionTag}":`, section);
          
          if (!section) {
            console.log(`  No section found for "${sectionTag}"`);
            return null;
          }
          
          return (
            <div key={`${section.id}-${index}`} className="bg-[#3d3166] rounded-lg p-4">
              <h4 className="text-[#8356F3] font-medium mb-2">{section.label}</h4>
              <div className="text-white whitespace-pre-line leading-relaxed">
                {section.content || "No lyrics added yet..."}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-[#2a1f3f] rounded-lg w-full max-w-6xl h-[750px] flex flex-col text-white">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600">
          <div>
            <h2 className="text-2xl font-semibold">{song.title}</h2>
            {song.alternativeTitles && song.alternativeTitles.length > 0 && (
              <p className="text-sm text-gray-400 mt-1">
                Also known as: {song.alternativeTitles.filter(Boolean).join(", ")}
              </p>
            )}
            {(song.authors && Array.isArray(song.authors) && song.authors.length > 0) ? (
              <p className="text-sm text-gray-400">by {song.authors.join(", ")}</p>
            ) : song.artist && song.artist !== "Unknown Artist" && song.artist ? (
              <p className="text-sm text-gray-400">by {song.artist}</p>
            ) : null}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors p-1"
          >
            <XIcon size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600">
          <button
            onClick={() => setActiveTab("lyrics")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "lyrics"
                ? "text-[#8356F3] border-b-2 border-[#8356F3]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Lyrics
          </button>
          <button
            onClick={() => setActiveTab("details")}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === "details"
                ? "text-[#8356F3] border-b-2 border-[#8356F3]"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Details
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === "lyrics" && (
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium mb-2">Song Structure</h3>
                {song.verseOrder && (
                  <div className="bg-[#3d3166] rounded-lg p-3 mb-4">
                    <p className="text-sm text-gray-300">
                      <span className="font-medium">Order:</span> {song.verseOrder}
                    </p>
                  </div>
                )}
              </div>
              {renderSongLyrics()}
            </div>
          )}

          {activeTab === "details" && (
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Authors</h4>
                  <p className="text-white">{song.authors || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Topics</h4>
                  <p className="text-white">{song.topics || "Not specified"}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Date Added</h4>
                  <p className="text-white">{song.dateAdded}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Sections</h4>
                  <p className="text-white">{song.sections?.length || 0} sections</p>
                </div>
              </div>
              
              {song.copyright && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Copyright</h4>
                  <div className="bg-[#3d3166] rounded-lg p-4">
                    <p className="text-white whitespace-pre-line">{song.copyright}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-600">
          <Button
            onClick={onClose}
            variant="outline"
            className="bg-transparent border-gray-500 text-gray-300 hover:bg-[#3d3166] hover:border-gray-400"
          >
            Close
          </Button>
          <div className="flex gap-3">
            <Button
              onClick={handlePresent}
              className="bg-[#8356F3] hover:bg-[#6d42c7] text-white"
            >
              <Play size={16} className="mr-2" />
              Present
            </Button>
            {onEdit && (
              <Button
                onClick={() => onEdit(song)}
                className="bg-[#8356F3] hover:bg-[#6d42c7] text-white"
              >
                <Edit size={16} className="mr-2" />
                Edit
              </Button>
            )}
            <Button
              onClick={() => setShowDeleteConfirmation(true)}
              variant="outline"
              className="bg-transparent border-red-500 text-red-400 hover:bg-red-500/10 hover:border-red-400"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-[#2a1f3f] rounded-lg p-6 w-full max-w-md mx-4 text-white border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-red-500/10 border border-red-500/20">
                <Trash2 size={20} className="text-red-400" />
              </div>
              <h3 className="text-xl font-semibold">Delete Song</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete <span className="font-semibold text-white">"{song.title}"</span>?
              </p>
              <p className="text-sm text-gray-400">
                This action cannot be undone. The song and all its lyrics will be permanently removed from your songbook.
              </p>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowDeleteConfirmation(false)}
                variant="outline"
                className="bg-transparent border-gray-500 text-gray-300 hover:bg-[#3d3166] hover:border-gray-400"
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                {deleteMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={16} className="mr-2" />
                    Delete Song
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Service Section Selection Modal */}
      {showServiceSectionModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
          <div className="bg-[#2a1f3f] rounded-lg p-6 w-full max-w-md mx-4 text-white border border-gray-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                <Play size={20} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold">Add to Service</h3>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-300 mb-4">
                Choose which service section to add <span className="font-semibold text-white">"{song?.title}"</span> to:
              </p>
              
              <div className="space-y-2">
                {serviceSections.map((section) => {
                  const isSelected = selectedServiceSections.includes(section.id);
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleServiceSectionToggle(section.id)}
                      className={`w-full text-left p-3 rounded-lg transition-colors border ${
                        isSelected 
                          ? 'bg-purple-600/20 border-purple-500 hover:bg-purple-600/30' 
                          : 'bg-[#3d3166] hover:bg-[#4a3a75] border-gray-600 hover:border-purple-500/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-white mb-1">{section.label}</div>
                          <div className="text-sm text-gray-400">{section.description}</div>
                        </div>
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ml-3 ${
                          isSelected 
                            ? 'bg-purple-600 border-purple-500' 
                            : 'border-gray-500'
                        }`}>
                          {isSelected && <Check size={14} className="text-white" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            
            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => {
                  setShowServiceSectionModal(false);
                  setSelectedServiceSections([]);
                }}
                variant="outline"
                className="bg-transparent border-gray-500 text-gray-300 hover:bg-[#3d3166] hover:border-gray-400"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToSelectedSections}
                disabled={selectedServiceSections.length === 0}
                className="bg-[#8356F3] hover:bg-[#6d42c7] text-white disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Add ({selectedServiceSections.length})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};