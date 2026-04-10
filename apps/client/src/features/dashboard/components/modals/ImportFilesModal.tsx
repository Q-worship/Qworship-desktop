import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { X, Upload, Image, Video, Music, FileText, Plus, ChevronDown, Check } from "lucide-react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest, buildUrl } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface ImportFilesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMediaUploaded?: (mediaAsset: { id: number; title: string; fileType: string, fileUrl?: string }) => void;
  onMultipleMediaUploaded?: (mediaAssets: { id: number; title: string; fileType: string, fileUrl?: string }[]) => void;
}

interface FilePreview {
  file: File;
  id: string;
  fileName: string;
  fileType: 'image' | 'video' | 'audio' | 'document';
  tags: string[];
  categories: string[];
  description: string;
  preview?: string;
}

const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
  const mimeType = file.type.toLowerCase();
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'document';
};

const getFileIcon = (fileType: string) => {
  switch (fileType) {
    case 'image': return <Image className="h-5 w-5 text-purple-400" />;
    case 'video': return <Video className="h-5 w-5 text-purple-400" />;
    case 'audio': return <Music className="h-5 w-5 text-purple-400" />;
    default: return <FileText className="h-5 w-5 text-purple-400" />;
  }
};

const availableCategories = [
  'Motion Background',
  'Motion Backgrounds',
  'Images',
  'Videos',
  'Slides',
  'Waves',
  'Science Visuals',
  'Trees',
  'Flowers',
  'Easter',
  'Christmas',
  'Lent',
  'Advent',
  'Ordinary Time',
  'Thanksgiving',
  'Hands-free Bible',
  'Song',
  'Announcement',
  'On-screen Bible',
  'Slide Canvas',
  'Content',
  'Logo'
];

export const ImportFilesModal = ({ open, onOpenChange, onMediaUploaded, onMultipleMediaUploaded }: ImportFilesModalProps): JSX.Element => {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [currentTag, setCurrentTag] = useState('');
  const [tagDropdownOpen, setTagDropdownOpen] = useState<string>(''); // Track which file's dropdown is open
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch existing user media assets to get available tags
  const { data: userMediaData } = useQuery({
    queryKey: ['/api/user-media-assets'],
    enabled: open // Only fetch when modal is open
  });

  // Fetch cloud media to get additional tags
  const { data: cloudMedia } = useQuery({
    queryKey: ['/api/cloud-media'],
    enabled: open // Only fetch when modal is open
  });

  // Extract unique tags from existing user media AND cloud media (same as Media Tags & Collections section)
  const existingTags = React.useMemo(() => {
    const tagSet = new Set<string>();
    
    // Add tags from user uploaded media
    if (userMediaData && (userMediaData as any)?.assets) {
      (userMediaData as any).assets.forEach((asset: any) => {
        if (asset.tags && Array.isArray(asset.tags)) {
          asset.tags.forEach((tag: string) => tagSet.add(tag));
        }
        if (asset.categories && Array.isArray(asset.categories)) {
          asset.categories.forEach((category: string) => tagSet.add(category));
        }
      });
    }
    
    // Add tags from cloud media (same logic as MediaFilterSection)
    if (Array.isArray(cloudMedia)) {
      cloudMedia.forEach((asset: any) => {
        if (asset.tags) {
          asset.tags.forEach((tag: string) => tagSet.add(tag));
        }
        if (asset.collection) {
          tagSet.add(asset.collection);
        }
      });
    }
    
    return Array.from(tagSet).sort(); // Sort alphabetically for better UX
  }, [userMediaData, cloudMedia]);

  // Mutation for uploading media assets
  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      console.log('Starting upload mutation...');
      
      // Use fetch directly with buildUrl for FormData uploads instead of apiRequest
      const response = await fetch(buildUrl('/api/user-media-assets/upload'), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        },
        body: formData,
        // Don't set Content-Type header - browser will set it with boundary
      });
      
      console.log('Upload response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Upload failed:', response.status, errorText);
        throw new Error(`${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      console.log('Upload result:', result);
      return result;
    },
    onSuccess: (data) => {
      // Visual debug to verify onSuccess is called
      toast({
        title: "DEBUG: onSuccess Called",
        description: `Assets: ${data?.assets?.length || 0}, Callback: ${!!onMediaUploaded}`,
        className: "bg-blue-600 text-white",
      });
      
      toast({
        title: "Success",
        description: "Media files uploaded successfully!",
        className: "bg-[#8356f3] text-white",
      });
      
      // If callback is provided and we have uploaded assets, apply the first one as background
      if (onMediaUploaded && data?.assets && data.assets.length > 0) {
        const firstAsset = data.assets[0];
        onMediaUploaded({
          id: firstAsset.id,
          title: firstAsset.title || firstAsset.fileName,
          fileType: firstAsset.fileType,
          fileUrl: buildUrl(`/api/user-media-assets/${firstAsset.id}/file`)
        });
      }

      if (onMultipleMediaUploaded && data?.assets && data.assets.length > 0) {
        onMultipleMediaUploaded(data.assets.map((a: any) => ({
          id: a.id,
          title: a.title || a.fileName,
          fileType: a.fileType,
          fileUrl: buildUrl(`/api/user-media-assets/${a.id}/file`)
        })));
      }
      
      // Invalidate both caches to ensure tag dropdown updates dynamically
      queryClient.invalidateQueries({ queryKey: ['/api/user-media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
      handleClose();
    },
    onError: (error: any) => {
      console.error('Upload error:', error);
      
      let errorMessage = "Failed to upload media files";
      
      if (error.message?.includes("401") || error.message?.includes("Unauthorized") || error.message?.includes("Not authenticated")) {
        errorMessage = "Please log in to upload media files. You need to be authenticated to access this feature.";
      } else if (error.message?.includes("not a valid HTTP method")) {
        errorMessage = "Authentication required. Please log in to upload files.";
      }
      
      toast({
        title: "Authentication Required",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const [isDragOver, setIsDragOver] = useState(false);

  const processSelectedFiles = (selectedFilesArray: File[]) => {
    selectedFilesArray.forEach((file) => {
      const filePreview: FilePreview = {
        file,
        id: Math.random().toString(36).substr(2, 9),
        fileName: file.name,
        fileType: getFileType(file),
        tags: [],
        categories: [],
        description: ''
      };

      if (filePreview.fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          filePreview.preview = e.target?.result as string;
          setFiles(prev => [...prev, filePreview]);
        };
        reader.readAsDataURL(file);
      } else {
        setFiles(prev => [...prev, filePreview]);
      }
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    processSelectedFiles(selectedFiles);
    // Reset input so the same file could be selected again if needed
    if (event.target) event.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processSelectedFiles(Array.from(e.dataTransfer.files));
    }
  };

  const updateFile = (id: string, updates: Partial<FilePreview>) => {
    setFiles(prev => prev.map(file => 
      file.id === id ? { ...file, ...updates } : file
    ));
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(file => file.id !== id));
  };

  const addTag = (fileId: string, tag: string) => {
    if (tag.trim()) {
      updateFile(fileId, {
        tags: [...(files.find(f => f.id === fileId)?.tags || []), tag.trim()]
      });
    }
  };

  const removeTag = (fileId: string, tagIndex: number) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      updateFile(fileId, {
        tags: file.tags.filter((_, index) => index !== tagIndex)
      });
    }
  };

  const toggleCategory = (fileId: string, category: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const categories = file.categories.includes(category)
        ? file.categories.filter(c => c !== category)
        : [...file.categories, category];
      
      updateFile(fileId, { categories });
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    console.log('handleUpload called with files:', files.length);

    // Create FormData for file upload
    const formData = new FormData();
    
    // Add files to FormData
    files.forEach((filePreview, index) => {
      formData.append('files', filePreview.file);
      
      // Add metadata for each file
      const metadata = {
        title: filePreview.fileName,
        tags: filePreview.tags,
        categories: filePreview.categories,
        description: filePreview.description
      };
      formData.append(`metadata_${index}`, JSON.stringify(metadata));
    });

    console.log('About to call uploadMutation.mutateAsync...');
    
    try {
      const result = await uploadMutation.mutateAsync(formData);
      console.log('Upload completed successfully:', result);
      
      // Manually trigger the callback since mutateAsync might not call onSuccess
      if (onMultipleMediaUploaded && result?.assets && result.assets.length > 0) {
        onMultipleMediaUploaded(result.assets.map((a: any) => ({
          id: a.id,
          title: a.title || a.fileName,
          fileType: a.fileType,
          fileUrl: a.fileUrl ? buildUrl(a.fileUrl) : buildUrl(`/api/user-media-assets/${a.id}/file`)
        })));
      }

      if (onMediaUploaded && result?.assets && result.assets.length > 0) {
        const firstAsset = result.assets[0];
        console.log('Manually triggering callback with asset:', firstAsset);
        
        // Visual debug to confirm callback is about to be called
        toast({
          title: "DEBUG: About to call callback",
          description: `Asset ID: ${firstAsset.id}, Has callback: ${!!onMediaUploaded}`,
          className: "bg-green-600 text-white",
        });
        
        onMediaUploaded({
          id: firstAsset.id,
          title: firstAsset.title || firstAsset.fileName,
          fileType: firstAsset.fileType,
          fileUrl: firstAsset.fileUrl ? buildUrl(firstAsset.fileUrl) : buildUrl(`/api/user-media-assets/${firstAsset.id}/file`)
        });
      } else if (!onMultipleMediaUploaded) {
        // Debug why callback isn't being called
        toast({
          title: "DEBUG: Callback NOT called",
          description: `Callback: ${!!onMediaUploaded}, Assets: ${result?.assets?.length || 0}`,
          className: "bg-red-600 text-white",
        });
      }
      
      // Show success toast
      toast({
        title: "Success",
        description: "Media files uploaded successfully!",
        className: "bg-[#8356f3] text-white",
      });
      
      // Invalidate caches and close modal
      queryClient.invalidateQueries({ queryKey: ['/api/user-media-assets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
      handleClose();
      
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleClose = () => {
    setFiles([]);
    setCurrentTag('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-[#2a1a3a] border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-white text-xl font-semibold">Import Files to MY MEDIA</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[75vh] pr-3">
          <div className="space-y-6">
          {/* File Selection */}
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragOver ? 'border-[#8356f3] bg-[#8356f3]/10' : 'border-white/20 bg-transparent'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-white/50 mx-auto mb-4" />
            <p className="text-white/70 mb-4">
              Drag and drop files here or click to browse
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Browse Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* File Previews */}
          {files.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-white font-medium">Files to Upload ({files.length})</h3>
              
              {files.map((file) => (
                <div key={file.id} className="bg-[#1d0d46] rounded-lg p-4 border border-white/10">
                  <div className="flex gap-4">
                    {/* File Preview */}
                    <div className="w-24 h-24 bg-[#392a48] rounded-lg flex items-center justify-center overflow-hidden">
                      {file.preview ? (
                        <img 
                          src={file.preview} 
                          alt={file.fileName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getFileIcon(file.fileType)
                      )}
                    </div>

                    {/* File Details */}
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-white font-medium">{file.fileName}</p>
                          <p className="text-white/60 text-sm">
                            {file.fileType.toUpperCase()} • {(file.file.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                          className="text-white/60 hover:text-white hover:bg-white/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Filename Field */}
                      <div>
                        <Label className="text-white/70 text-xs">Filename</Label>
                        <Input
                          value={file.fileName}
                          onChange={(e) => updateFile(file.id, { fileName: e.target.value })}
                          className="bg-[#392a48] border-white/20 text-white"
                        />
                      </div>

                      {/* Tags */}
                      <div>
                        <Label className="text-white/70 text-xs">Tags</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {file.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="bg-[#8356f3] text-white"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(file.id, index)}
                                className="ml-2 text-white/70 hover:text-white"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        
                        {/* Tag Dropdown for Existing Tags + Input for New Tags */}
                        <Popover open={tagDropdownOpen === file.id} onOpenChange={(open) => setTagDropdownOpen(open ? file.id : '')}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between bg-[#392a48] border-white/20 text-white hover:bg-[#4a3859] hover:border-white/30 mt-1"
                            >
                              <span className="text-left flex-1">
                                {existingTags.length > 0 ? "Select existing tag or create new..." : "Create new tag..."}
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-[var(--radix-popover-trigger-width)] bg-[#1d0d46] border border-white/20 p-3"
                            align="start"
                          >
                            <div className="space-y-3">
                              {/* New Tag Input */}
                              <div>
                                <p className="text-white/70 text-xs font-medium mb-2">Create New Tag</p>
                                <div className="flex gap-2">
                                  <Input
                                    placeholder="Enter new tag name"
                                    value={currentTag}
                                    onChange={(e) => setCurrentTag(e.target.value)}
                                    onKeyPress={(e) => {
                                      if (e.key === 'Enter' && currentTag.trim()) {
                                        addTag(file.id, currentTag.trim());
                                        setCurrentTag('');
                                        setTagDropdownOpen('');
                                      }
                                    }}
                                    className="bg-[#392a48] border-white/20 text-white text-sm flex-1"
                                  />
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      if (currentTag.trim()) {
                                        addTag(file.id, currentTag.trim());
                                        setCurrentTag('');
                                        setTagDropdownOpen('');
                                      }
                                    }}
                                    className="bg-[#8356f3] hover:bg-[#9567f4] text-white"
                                  >
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                              
                              {/* Existing Tags */}
                              {existingTags.length > 0 && (
                                <div>
                                  <p className="text-white/70 text-xs font-medium mb-2">Select Existing Tags ({existingTags.length} available)</p>
                                  <ScrollArea 
                                    className="h-32 pr-3" 
                                    onWheel={(e) => {
                                      // Ensure mouse scroll works properly within the ScrollArea
                                      e.stopPropagation();
                                    }}
                                  >
                                    <div className="space-y-1">
                                      {existingTags.map((tag) => (
                                        <Button
                                          key={tag}
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            if (!file.tags.includes(tag)) {
                                              addTag(file.id, tag);
                                            }
                                            setTagDropdownOpen('');
                                          }}
                                          className={`w-full justify-start text-left text-xs transition-colors ${
                                            file.tags.includes(tag) 
                                              ? 'bg-[#8356f3] text-white cursor-default' 
                                              : 'text-white hover:bg-[#4a3558] hover:text-white/90'
                                          }`}
                                          disabled={file.tags.includes(tag)}
                                        >
                                          <span className="truncate flex-1">{tag}</span>
                                          {file.tags.includes(tag) && (
                                            <Check className="h-3 w-3 ml-2 flex-shrink-0" />
                                          )}
                                        </Button>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>
                              )}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Categories */}
                      <div>
                        <Label className="text-white/70 text-xs">Categories</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full justify-between bg-[#392a48] border-white/20 text-white hover:bg-[#4a3859] hover:border-white/30 mt-1"
                            >
                              <span className="text-left flex-1">
                                {file.categories.length === 0 
                                  ? "Select categories..." 
                                  : `${file.categories.length} selected`
                                }
                              </span>
                              <ChevronDown className="h-4 w-4 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className="w-[var(--radix-popover-trigger-width)] bg-[#1d0d46] border border-white/20 p-3"
                            align="start"
                            side="top"
                          >
                            <div className="space-y-2">
                              <p className="text-white/70 text-xs font-medium mb-3">Select Categories</p>
                              <ScrollArea className="h-32 pr-3" onWheel={(e) => {
                                const scrollContainer = e.currentTarget.querySelector('[data-radix-scroll-area-viewport]');
                                if (scrollContainer) {
                                  scrollContainer.scrollTop += e.deltaY;
                                  e.preventDefault();
                                }
                              }}>
                                <div className="grid grid-cols-2 gap-2 pr-2">
                                  {availableCategories.map((category) => (
                                    <div key={category} className="flex items-center space-x-2 min-h-[28px]">
                                      <Checkbox
                                        id={`${file.id}-${category}`}
                                        checked={file.categories.includes(category)}
                                        onCheckedChange={() => toggleCategory(file.id, category)}
                                        className="border-white/20 data-[state=checked]:bg-[#8356f3] data-[state=checked]:border-[#8356f3] flex-shrink-0"
                                      />
                                      <label
                                        htmlFor={`${file.id}-${category}`}
                                        className="text-white text-xs cursor-pointer flex-1 leading-tight"
                                      >
                                        {category}
                                      </label>
                                      {file.categories.includes(category) && (
                                        <Check className="h-3 w-3 text-[#8356f3] flex-shrink-0" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </ScrollArea>
                            </div>
                          </PopoverContent>
                        </Popover>
                        
                        {/* Selected Categories Display */}
                        {file.categories.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {file.categories.map((category, index) => (
                              <Badge
                                key={`selected-${index}`}
                                variant="secondary"
                                className="bg-[#8356f3] text-white text-xs"
                              >
                                {category}
                                <button
                                  onClick={() => toggleCategory(file.id, category)}
                                  className="ml-2 text-white/70 hover:text-white"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div>
                        <Label className="text-white/70 text-xs">Description (Optional)</Label>
                        <Textarea
                          value={file.description}
                          onChange={(e) => updateFile(file.id, { description: e.target.value })}
                          placeholder="Add a description..."
                          className="bg-[#392a48] border-white/20 text-white resize-none"
                          rows={2}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
            <Button
              variant="outline"
              onClick={handleClose}
              className="bg-transparent border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={files.length === 0 || uploadMutation.isPending}
              className="bg-[#8356f3] hover:bg-[#9567f4] text-white"
            >
              {uploadMutation.isPending ? 'Uploading...' : `Add ${files.length} Media`}
            </Button>
          </div>
        </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};