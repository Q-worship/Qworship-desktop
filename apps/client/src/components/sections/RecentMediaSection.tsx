import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RecentMediaSectionProps {
  selectedMedia: {
    sectionIndex: number;
    itemIndex: number;
    title: string;
    color: string;
    type: string;
    asset?: any; // Complete asset data
  } | null;
  activeTab: 'cloud-media' | 'my-media' | 'templates';
}

const ImagePreviewCard = ({ asset }: { asset: any }) => {
  const [hasError, setHasError] = useState(false);
  const fallbackSrc = '/figmaAssets/image-7.png';

  // Reset error state if a different asset is selected
  React.useEffect(() => {
    setHasError(false);
  }, [asset?.id]);

  const isVideo = asset?.type?.toLowerCase() === 'video';

  // Determine the file URL if it's a video based on who owns the asset
  const videoUrl = asset?.uploadedBy === 'admin' 
    ? `/api/cloud-media/${asset?.id}/file`
    : `/api/user-media-assets/${asset?.id}/file`;

  if (isVideo) {
    return (
      <div className="w-full relative h-64 mt-[12px] mb-[12px] rounded-lg overflow-hidden bg-black/40 flex items-center justify-center shadow-inner">
        <video
          src={videoUrl}
          controls
          className="w-full h-full object-contain"
          playsInline
          controlsList="nodownload"
          crossOrigin="use-credentials"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (hasError || !asset?.thumbnail) {
    return (
      <div className="w-full relative h-64 mt-[12px] mb-[12px] rounded-lg overflow-hidden bg-[#2a1b3e] shadow-inner flex items-center justify-center border border-[#cea2fd]/20">
        <div className="text-[#cea2fd]/40 text-sm font-medium font-['Poppins',Helvetica]">
          Preview not available
        </div>
      </div>
    );
  }

  return (
    <div className="w-full relative h-64 mt-[12px] mb-[12px] rounded-lg overflow-hidden bg-[#2a1b3e] shadow-inner flex items-center justify-center border border-[#cea2fd]/20">
      <img
        src={asset.thumbnail}
        alt={asset?.title || 'Media preview'}
        className="max-w-full max-h-full object-contain"
        onError={() => {
          if (!hasError) setHasError(true);
        }}
      />
    </div>
  );
};

export const RecentMediaSection = ({ selectedMedia, activeTab }: RecentMediaSectionProps): JSX.Element => {
  
  // State for managing tags and editable content
  const [tags, setTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  const [editableTitle, setEditableTitle] = useState("");
  const [editableDescription, setEditableDescription] = useState("");
  const [editableCollection, setEditableCollection] = useState("");
  const [showSaveConfirmation, setShowSaveConfirmation] = useState(false);
  
  // API integration
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Check if it's editable (MY MEDIA only)
  const isEditable = activeTab === 'my-media';

  // Initialize editable fields based on selected media
  React.useEffect(() => {
    if (selectedMedia?.asset) {
      // Use the actual data from the asset
      const assetTags = selectedMedia.asset.tags || [];
      setTags(assetTags.length > 0 ? assetTags : [selectedMedia.type === "video" ? "Motion" : "Still"]);
      setEditableTitle(selectedMedia.asset.title || "");
      setEditableDescription(selectedMedia.asset.description || "");
      setEditableCollection(selectedMedia.asset.collection || "general");
    } else if (selectedMedia) {
      const defaultTags = [
        selectedMedia.type === "video" ? "Motion" : "Still",
        selectedMedia.title
      ];
      setTags(defaultTags);
      setEditableTitle(selectedMedia.title);
      setEditableDescription("");
      setEditableCollection("general");
    }
    // Reset save confirmation
    setShowSaveConfirmation(false);
  }, [selectedMedia]);

  // Function to add a new tag
  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput("");
      setIsAddingTag(false);
    }
  };

  // Function to remove a tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Handle Enter key press for adding tags
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddTag();
    } else if (e.key === 'Escape') {
      setIsAddingTag(false);
      setNewTagInput("");
    }
  };

  // Mutation for updating user media asset
  const updateAssetMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!selectedMedia?.asset?.id) {
        throw new Error('No asset selected for update');
      }
      
      const response = await fetch(`/api/user-media-assets/${selectedMedia.asset.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`${response.status}: ${errorData.error || response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Show success notification
      toast({
        title: "Changes Saved",
        description: "Your media asset has been updated successfully!",
        className: "bg-[#8356f3] text-white",
      });
      
      // Invalidate and refetch user media assets to update the UI
      queryClient.invalidateQueries({ queryKey: ['/api/user-media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
      
      // Show save confirmation popup briefly
      setShowSaveConfirmation(true);
      setTimeout(() => setShowSaveConfirmation(false), 2000);
    },
    onError: (error: any) => {
      console.error('Error updating asset:', error);
      console.error('Full error object:', JSON.stringify(error, null, 2));
      console.error('Selected media:', selectedMedia);
      
      let errorMessage = "Failed to save changes to media asset";
      
      if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
        errorMessage = "You must be logged in to edit media assets";
      } else if (error.message?.includes("403") || error.message?.includes("Access denied")) {
        errorMessage = "You can only edit your own media assets";
      } else if (error.message?.includes("404") || error.message?.includes("not found")) {
        errorMessage = "Media asset not found or has been deleted";
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      toast({
        title: "Error Saving Changes",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  // Handle saving changes
  const handleSave = () => {
    if (!selectedMedia?.asset?.id) {
      toast({
        title: "Error",
        description: "No media asset selected to save",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare update data
    const updateData = {
      title: editableTitle.trim(),
      description: editableDescription.trim(),
      collection: editableCollection,
      tags: tags.filter(tag => tag.trim().length > 0)
    };
    
    console.log('Saving asset with ID:', selectedMedia.asset.id);
    console.log('Update data:', updateData);
    console.log('Selected media:', selectedMedia);
    
    updateAssetMutation.mutate(updateData);
  };

  // Handle canceling changes
  const handleCancel = () => {
    if (selectedMedia?.asset) {
      // Reset to original values
      const assetTags = selectedMedia.asset.tags || [];
      setTags(assetTags.length > 0 ? assetTags : [selectedMedia.type === "video" ? "Motion" : "Still"]);
      setEditableTitle(selectedMedia.asset.title || "");
      setEditableDescription(selectedMedia.asset.description || "");
      setEditableCollection(selectedMedia.asset.collection || "general");
    }
  };
  // Only render if there's a selected media item
  if (!selectedMedia?.asset) {
    return (
      <section className="w-full p-4 flex flex-col gap-4">
        <div className="w-full h-64 mt-[12px] mb-[12px] rounded-lg flex items-center justify-center text-[#cea2fd]/40 text-lg font-medium border-2 border-dashed border-[#cea2fd]/20">
          No media selected
        </div>
      </section>
    );
  }

  return (
    <section className="w-full p-4 flex flex-col gap-4">
      {/* Large Media Preview */}
      <ImagePreviewCard asset={selectedMedia.asset} />
      {/* Media Title */}
      <div className="bg-[#392a48] p-3 rounded-lg">
        {isEditable ? (
          <input
            type="text"
            value={editableTitle}
            onChange={(e) => setEditableTitle(e.target.value)}
            className="w-full bg-transparent text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica] border-none outline-none focus:ring-1 focus:ring-[#cea2fd] rounded px-1"
            placeholder="Media title"
          />
        ) : (
          <h2 className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
            {selectedMedia.asset.title}
          </h2>
        )}
      </div>
      {/* Tags Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
          Tags
        </h3>
        <div 
          className={`bg-[#392a48] rounded px-3 py-2 flex flex-wrap items-center gap-2 min-h-[40px] border border-[#4a3b5e] ${
            isEditable ? 'cursor-text' : 'cursor-default'
          }`}
          onClick={() => isEditable && !isAddingTag && setIsAddingTag(true)}
        >
          {tags.map((tag, index) => (
            <div 
              key={index}
              className="bg-[#8356f3] text-white px-2 py-1 rounded text-sm flex items-center gap-1"
            >
              <span>{tag}</span>
              {isEditable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveTag(tag);
                  }}
                  className="text-white/70 hover:text-white transition-colors mt-[-5px] mb-[-5px] ml-[-10px] mr-[-10px] pl-[12px] pr-[12px]"
                  title="Remove tag"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          ))}
          
          {/* Add Tag Input - Only for editable */}
          {isEditable && (
            isAddingTag ? (
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={() => {
                  if (!newTagInput.trim()) {
                    setIsAddingTag(false);
                  }
                }}
                placeholder="Add tag"
                className="bg-transparent text-white placeholder-[#cea2fd]/60 border-none outline-none flex-1 min-w-[80px] text-sm"
                autoFocus
              />
            ) : (
              <span className="text-[#cea2fd]/60 text-sm italic">Add tag</span>
            )
          )}
        </div>
      </div>
      {/* Collection Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
          Collection
        </h3>
        {isEditable ? (
          <Select value={editableCollection} onValueChange={setEditableCollection}>
            <SelectTrigger className="w-full bg-[#392a48] border-none text-white">
              <SelectValue placeholder="Select collection" />
            </SelectTrigger>
            <SelectContent className="bg-[#392a48] border-[#666]">
              <SelectItem value="general" className="text-white">General</SelectItem>
              <SelectItem value="praise-worship" className="text-white">Praise & worship</SelectItem>
              <SelectItem value="contemporary" className="text-white">Contemporary</SelectItem>
              <SelectItem value="traditional" className="text-white">Traditional</SelectItem>
              <SelectItem value="waves" className="text-white">Waves</SelectItem>
              <SelectItem value="science-visuals" className="text-white">Science Visuals</SelectItem>
              <SelectItem value="trees" className="text-white">Trees</SelectItem>
              <SelectItem value="flowers" className="text-white">Flowers</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <div className="w-full bg-[#392a48] border-none text-white p-3 rounded-lg">
            <span className="text-white text-sm">{selectedMedia.asset.collection || 'General'}</span>
          </div>
        )}
      </div>
      {/* Description Section */}
      <div className="flex flex-col gap-2">
        <h3 className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
          Description
        </h3>
        <Textarea 
          className="w-full h-32 bg-[#392a48] border-none text-white resize-none"
          placeholder="Enter description..."
          value={isEditable ? editableDescription : (selectedMedia.asset.description || "")}
          onChange={isEditable ? (e) => setEditableDescription(e.target.value) : undefined}
          readOnly={!isEditable}
        />
      </div>

      {/* Asset Details */}
      {(
        <div className="flex flex-col gap-2">
          <h3 className="text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica]">
            Asset Details
          </h3>
          <div className="bg-[#392a48] p-3 rounded-lg space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[#cea2fd]/60">Type:</span>
              <span className="text-white">{selectedMedia.asset.type}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#cea2fd]/60">Size:</span>
              <span className="text-white">
                {selectedMedia.asset.fileSize 
                  ? `${(selectedMedia.asset.fileSize / 1024 / 1024).toFixed(2)} MB`
                  : 'N/A'
                }
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#cea2fd]/60">Owned by:</span>
              <span className="text-white">
                {selectedMedia.asset.uploadedBy === 'admin' ? 'Q-worship' : 'You'}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#cea2fd]/60">Views:</span>
              <span className="text-white">{selectedMedia.asset.usageCount || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons - Only show for MY MEDIA */}
      {isEditable && (
        <div className="flex justify-between mt-4 gap-3">
          <Button 
            onClick={handleSave}
            disabled={updateAssetMutation.isPending}
            className="bg-[#8356f3] hover:bg-[#9567f4] disabled:bg-[#8356f3]/50 disabled:cursor-not-allowed text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica] rounded-lg px-6 py-2 flex-1 transition-all duration-200"
          >
            {updateAssetMutation.isPending ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Saving...
              </div>
            ) : (
              'Customise'
            )}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={updateAssetMutation.isPending}
            className="bg-[#2a1b3e] hover:bg-[#3a2b4e] disabled:bg-[#2a1b3e]/50 disabled:cursor-not-allowed text-white text-sm font-medium [font-family:'Lufga-Medium',Helvetica] border border-[#4a3b5e] rounded-lg px-6 py-2 flex-1 transition-all duration-200"
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Save Confirmation Popup */}
      {showSaveConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1d0d46] border border-[#8356f3] rounded-lg p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-[#8356f3] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-white text-lg font-medium [font-family:'Lufga-Medium',Helvetica] mb-2">
                Changes Saved Successfully
              </h3>
              <p className="text-[#cea2fd]/80 text-sm [font-family:'Lufga-Regular',Helvetica]">
                Your media asset has been updated with the new information.
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};