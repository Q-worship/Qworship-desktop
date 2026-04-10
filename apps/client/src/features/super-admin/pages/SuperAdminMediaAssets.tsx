import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, adminApiRequest, getAdminQueryFn, buildUrl } from "@/lib/queryClient";
import { 
  Upload, 
  Image, 
  Video, 
  FileAudio, 
  FileText, 
  Eye, 
  Download, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  FolderPlus,
  Tags,
  Crown,
  Calendar,
  BarChart3,
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  Check,
  AlertTriangle,
  X,
  Grid3X3,
  List
} from 'lucide-react';

// Form schemas
const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  parentId: z.string().optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().default(0),
});

const collectionFormSchema = z.object({
  name: z.string().min(1, 'Collection name is required'),
  description: z.string().optional(),
  slug: z.string().min(1, 'Slug is required'),
  isPublished: z.boolean().default(false),
  sortOrder: z.number().default(0),
});

const mediaUploadSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  tags: z.string().optional(),
  isPremium: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  categoryId: z.string().optional(),
  categoryIds: z.array(z.string()).default([]), // New multi-select categories
  collectionIds: z.array(z.string()).default([]),
});

interface MediaAsset {
  id: string;
  title: string;
  description?: string;
  fileName: string;
  originalFileName: string;
  fileType: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'DOCUMENT';
  mimeType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
  duration?: number;
  dimensions?: string;
  tags: string[];
  isPremium: boolean;
  isPublished: boolean;
  downloadCount: number;
  viewCount: number;
  categoryId?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  uploadedByAdmin?: {
    id: string;
    username: string;
    email: string;
  };
}

interface MediaCategory {
  id: string;
  name: string;
  description?: string;
  slug: string;
  parentId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface MediaCollection {
  id: string;
  name: string;
  description?: string;
  slug: string;
  coverImagePath?: string;
  isPublished: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface SuperAdminMediaAssetsProps {
  isDarkMode: boolean;
}

export default function SuperAdminMediaAssets({ isDarkMode }: SuperAdminMediaAssetsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [filePreviews, setFilePreviews] = useState<{[key: string]: string}>({});
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [renamingAsset, setRenamingAsset] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<MediaAsset | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Dark mode theme classes
  const themeClasses = {
    primaryText: isDarkMode ? 'text-white' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    mutedText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    card: isDarkMode 
      ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm' 
      : 'bg-white border-gray-200',
    input: isDarkMode 
      ? 'bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder:text-gray-500',
    button: isDarkMode
      ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500'
      : 'bg-purple-600 hover:bg-purple-700 text-white border-purple-500',
    buttonSecondary: isDarkMode
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600'
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
    select: isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white'
      : 'bg-white border-gray-300 text-gray-900',
    badge: isDarkMode
      ? 'bg-gray-700/50 text-gray-300 border-gray-600'
      : 'bg-gray-100 text-gray-700 border-gray-300',
    tab: isDarkMode
      ? 'text-gray-300 data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-gray-700/50 hover:text-gray-200'
      : 'text-gray-700 data-[state=active]:bg-purple-600 data-[state=active]:text-white hover:bg-gray-100/80 hover:text-gray-800',
    mediaCard: isDarkMode
      ? 'bg-gradient-to-br from-gray-800/80 to-gray-900/50 border-gray-700/50 hover:from-gray-700/80 hover:to-gray-800/50'
      : 'bg-gradient-to-br from-white to-gray-50/50 border-gray-200 hover:from-gray-50 hover:to-gray-100/50',
    uploadArea: isDarkMode
      ? 'border-gray-600 bg-gray-800/30 hover:bg-gray-700/30'
      : 'border-gray-300 bg-gray-50 hover:bg-gray-100/50'
  };

  // Fetch media assets with admin authentication
  const { data: mediaAssets = [], isLoading: assetsLoading } = useQuery<MediaAsset[]>({
    queryKey: ['/api/cloud-media'],
    queryFn: getAdminQueryFn({ on401: "throw" }),
  });

  // Fetch categories with admin authentication
  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MediaCategory[]>({
    queryKey: ['/api/admin/media/categories'],
    queryFn: getAdminQueryFn({ on401: "throw" }),
  });

  // Fetch collections with admin authentication
  const { data: collections = [], isLoading: collectionsLoading } = useQuery<MediaCollection[]>({
    queryKey: ['/api/admin/media/collections'],
    queryFn: getAdminQueryFn({ on401: "throw" }),
  });

  // Category form
  const categoryForm = useForm<z.infer<typeof categoryFormSchema>>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      parentId: undefined,
      isActive: true,
      sortOrder: 0,
    },
  });

  // Collection form
  const collectionForm = useForm<z.infer<typeof collectionFormSchema>>({
    resolver: zodResolver(collectionFormSchema),
    defaultValues: {
      name: '',
      description: '',
      slug: '',
      isPublished: false,
      sortOrder: 0,
    },
  });

  // Media upload form
  const mediaForm = useForm<z.infer<typeof mediaUploadSchema>>({
    resolver: zodResolver(mediaUploadSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: '',
      isPremium: false,
      isPublished: false,
      categoryId: undefined,
      categoryIds: [], // New multi-select categories
      collectionIds: [],
    },
  });

  // Mutations
  const createCategoryMutation = useMutation({
    mutationFn: (data: z.infer<typeof categoryFormSchema>) =>
      adminApiRequest('POST', '/api/admin/media/categories', data),
    onSuccess: () => {
      toast({ title: 'Category created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/categories'] });
      categoryForm.reset();
    },
    onError: () => {
      toast({ title: 'Failed to create category', variant: 'destructive' });
    },
  });

  const createCollectionMutation = useMutation({
    mutationFn: (data: z.infer<typeof collectionFormSchema>) =>
      adminApiRequest('POST', '/api/admin/media/collections', data),
    onSuccess: () => {
      toast({ title: 'Collection created successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/media/collections'] });
      collectionForm.reset();
    },
    onError: () => {
      toast({ title: 'Failed to create collection', variant: 'destructive' });
    },
  });

  const uploadMediaMutation = useMutation({
    mutationFn: async (data: { formData: FormData; metadata: z.infer<typeof mediaUploadSchema> }) => {
      setIsUploading(true);
      setUploadProgress(0);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await adminApiRequest('POST', '/api/cloud-media', data.formData);

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        return response;
      } catch (error) {
        clearInterval(progressInterval);
        setUploadProgress(0);
        throw error;
      } finally {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 1000);
      }
    },
    onSuccess: () => {
      toast({ title: 'Media uploaded successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
      mediaForm.reset();
      setSelectedFiles(null);
      setFilePreviews({});
    },
    onError: () => {
      toast({ title: 'Failed to upload media', variant: 'destructive' });
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: (id: string) =>
      adminApiRequest('DELETE', `/api/user-media-assets/${id}`), // Or we could make a specific cloud delete route later
    onSuccess: () => {
      toast({ title: 'Media deleted successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
    },
    onError: () => {
      toast({ title: 'Failed to delete media', variant: 'destructive' });
    },
  });

  const toggleMediaStatusMutation = useMutation({
    mutationFn: ({ id, field, value }: { id: string; field: 'isPublished' | 'isPremium'; value: boolean }) =>
      adminApiRequest('PATCH', `/api/cloud-media/${id}`, { [field]: value }), // Placeholder if patched later
    onSuccess: () => {
      toast({ title: 'Media updated successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
    },
    onError: () => {
      toast({ title: 'Failed to update media', variant: 'destructive' });
    },
  });

  const renameMediaMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      adminApiRequest('PATCH', `/api/cloud-media/${id}`, { title }), // Placeholder
    onSuccess: () => {
      toast({ title: 'File renamed successfully' });
      queryClient.invalidateQueries({ queryKey: ['/api/cloud-media'] });
      setRenamingAsset(null);
      setRenameValue('');
    },
    onError: () => {
      toast({ title: 'Failed to rename file', variant: 'destructive' });
    },
  });

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    processSelectedFiles(files);
  };

  // Process selected files
  const processSelectedFiles = (files: FileList | null) => {
    setSelectedFiles(files);
    
    if (files && files.length > 0) {
      // Auto-generate title from first file
      const firstFile = files[0];
      const titleWithoutExt = firstFile.name.replace(/\.[^/.]+$/, '');
      mediaForm.setValue('title', titleWithoutExt);
      
      // Generate previews for image files
      const previews: {[key: string]: string} = {};
      Array.from(files).forEach((file, index) => {
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (event) => {
            if (event.target?.result) {
              previews[`${index}-${file.name}`] = event.target.result as string;
              setFilePreviews(prev => ({ ...prev, ...previews }));
            }
          };
          reader.readAsDataURL(file);
        }
      });
    } else {
      setFilePreviews({});
    }
  };

  // Handle drag and drop
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
    const files = e.dataTransfer.files;
    processSelectedFiles(files);
  };

  // Handle file rename
  const startRename = (asset: MediaAsset) => {
    setRenamingAsset(asset.id);
    setRenameValue(asset.title);
  };

  const cancelRename = () => {
    setRenamingAsset(null);
    setRenameValue('');
  };

  const confirmRename = (id: string) => {
    if (renameValue.trim() && renameValue.trim() !== '') {
      renameMediaMutation.mutate({ id, title: renameValue.trim() });
    } else {
      cancelRename();
    }
  };

  const handleRenameKeyPress = (e: React.KeyboardEvent, id: string) => {
    if (e.key === 'Enter') {
      confirmRename(id);
    } else if (e.key === 'Escape') {
      cancelRename();
    }
  };

  // Handle media upload
  const handleUploadMedia = async (data: z.infer<typeof mediaUploadSchema>) => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({ title: 'Please select files to upload', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    
    // Append files
    Array.from(selectedFiles).forEach((file) => {
      formData.append('files', file);
    });

    // Append metadata
    formData.append('metadata', JSON.stringify(data));

    uploadMediaMutation.mutate({ formData, metadata: data });
  };

  // Filter media assets
  const filteredAssets = mediaAssets.filter(asset => {
    const matchesSearch = asset.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || asset.fileType.toLowerCase() === filterType.toLowerCase();
    const matchesCategory = filterCategory === 'all' || asset.categoryId?.toString() === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && asset.isPublished) ||
                         (filterStatus === 'draft' && !asset.isPublished) ||
                         (filterStatus === 'premium' && asset.isPremium);

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Get file type icon
  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'IMAGE': return <Image className="w-4 h-4" />;
      case 'VIDEO': return <Video className="w-4 h-4" />;
      case 'AUDIO': return <FileAudio className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className={`min-h-screen transition-all duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-800' 
        : 'bg-gradient-to-br from-purple-50 to-indigo-100'
    }`}>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className={`text-4xl font-bold mb-2 ${themeClasses.primaryText}`}>
            Media & Assets Management
          </h1>
          <p className={themeClasses.secondaryText}>
            Upload and manage cloud media assets for all Q-worship users
          </p>
        </div>

        <Tabs defaultValue="assets" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-4 h-12 p-1 rounded-lg ${
            isDarkMode 
              ? 'bg-gray-800/70 border border-gray-600/50' 
              : 'bg-white border border-gray-300 shadow-sm'
          }`}>
            <TabsTrigger 
              value="assets" 
              className={`h-full px-4 py-2 rounded-md transition-all ${themeClasses.tab}`}
            >
              Media Assets
            </TabsTrigger>
            <TabsTrigger 
              value="upload"
              className={`h-full px-4 py-2 rounded-md transition-all ${themeClasses.tab}`}
            >
              Upload Media
            </TabsTrigger>
            <TabsTrigger 
              value="categories"
              className={`h-full px-4 py-2 rounded-md transition-all ${themeClasses.tab}`}
            >
              Categories
            </TabsTrigger>
            <TabsTrigger 
              value="collections"
              className={`h-full px-4 py-2 rounded-md transition-all ${themeClasses.tab}`}
            >
              Collections
            </TabsTrigger>
          </TabsList>

          {/* Media Assets Tab */}
          <TabsContent value="assets" className="space-y-6">
            {/* Filters */}
            <Card className={themeClasses.card}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                  <Filter className="w-5 h-5" />
                  Filter & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="search" className={themeClasses.primaryText}>Search</Label>
                    <div className="relative">
                      <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${themeClasses.mutedText}`} />
                      <Input
                        id="search"
                        placeholder="Search media..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex h-9 w-full rounded-md border px-3 py-1 text-base shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pl-10 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 mt-[2px] mb-[2px]"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="filterType" className={themeClasses.primaryText}>File Type</Label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className={themeClasses.select}>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent className={themeClasses.card}>
                        <SelectItem value="all" className={themeClasses.primaryText}>All Types</SelectItem>
                        <SelectItem value="image" className={themeClasses.primaryText}>Images</SelectItem>
                        <SelectItem value="video" className={themeClasses.primaryText}>Videos</SelectItem>
                        <SelectItem value="audio" className={themeClasses.primaryText}>Audio</SelectItem>
                        <SelectItem value="document" className={themeClasses.primaryText}>Documents</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filterCategory" className={themeClasses.primaryText}>Category</Label>
                    <Select value={filterCategory} onValueChange={setFilterCategory}>
                      <SelectTrigger className={themeClasses.select}>
                        <SelectValue placeholder="All categories" />
                      </SelectTrigger>
                      <SelectContent className={themeClasses.card}>
                        <SelectItem value="all" className={themeClasses.primaryText}>All Categories</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()} className={themeClasses.primaryText}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="filterStatus" className={themeClasses.primaryText}>Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className={themeClasses.select}>
                        <SelectValue placeholder="All status" />
                      </SelectTrigger>
                      <SelectContent className={themeClasses.card}>
                        <SelectItem value="all" className={themeClasses.primaryText}>All Status</SelectItem>
                        <SelectItem value="published" className={themeClasses.primaryText}>Published</SelectItem>
                        <SelectItem value="draft" className={themeClasses.primaryText}>Draft</SelectItem>
                        <SelectItem value="premium" className={themeClasses.primaryText}>Premium</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* View Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${themeClasses.secondaryText}`}>
                  View Options:
                </span>
                <div className={`flex items-center rounded-lg p-1 ${
                  isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-gray-100 border border-gray-300'
                }`}>
                  <Button
                    size="sm"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('grid')}
                    className={`h-8 px-3 ${
                      viewMode === 'grid' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <Grid3X3 className="w-4 h-4 mr-1" />
                    Grid
                  </Button>
                  <Button
                    size="sm"
                    variant={viewMode === 'list' ? 'default' : 'ghost'}
                    onClick={() => setViewMode('list')}
                    className={`h-8 px-3 ${
                      viewMode === 'list' 
                        ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                        : isDarkMode 
                          ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4 mr-1" />
                    List
                  </Button>
                </div>
              </div>
              <div className={`text-sm ${themeClasses.mutedText}`}>
                {filteredAssets.length} {filteredAssets.length === 1 ? 'asset' : 'assets'} found
              </div>
            </div>

            {/* Media Display */}
            {assetsLoading ? (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className={`animate-pulse ${themeClasses.card}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className={`h-48 rounded-t-lg ${
                          isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                        }`} />
                        <CardContent className="p-4">
                          <div className={`h-4 rounded mb-2 ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                          }`} />
                          <div className={`h-4 rounded w-2/3 ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                          }`} />
                        </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className={`w-16 h-16 rounded-lg flex-shrink-0 ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                          }`} />
                          <div className="flex-1 space-y-2">
                            <div className={`h-4 rounded w-1/2 ${
                              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                            }`} />
                            <div className={`h-3 rounded w-3/4 ${
                              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                            }`} />
                            <div className={`h-3 rounded w-1/4 ${
                              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                            }`} />
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
              }>
                {filteredAssets.map((asset) => (
                  <Card key={asset.id} className={`group hover:shadow-lg transition-all duration-300 ${themeClasses.mediaCard}`}>
                    {viewMode === 'grid' ? (
                      <>
                        <div className={`relative h-48 rounded-t-lg overflow-hidden ${
                          isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                        }`}>
                          {asset.fileType === 'IMAGE' ? (
                            <img
                              src={buildUrl(asset.filePath)}
                              alt={asset.title}
                              className="w-full h-full object-cover"
                            />
                          ) : asset.fileType === 'VIDEO' && asset.thumbnailPath ? (
                            <div className="relative w-full h-full">
                              <img
                                src={buildUrl(asset.thumbnailPath)}
                                alt={asset.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-black/50 rounded-full p-2">
                                  <Video className="w-6 h-6 text-white" />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${themeClasses.secondaryText}`}>
                              {getFileTypeIcon(asset.fileType)}
                              <span className="ml-2 text-sm">
                                {asset.fileType}
                              </span>
                            </div>
                          )}
                          
                          {/* Overlay with actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button 
                              size="sm" 
                              variant="secondary" 
                              onClick={() => setPreviewAsset(asset)}
                              className="bg-white/90 hover:bg-white text-gray-700 hover:text-gray-900"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              onClick={() => startRename(asset)}
                              className="bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Rename
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => setDeleteAsset(asset)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* File type icon badge */}
                          <div className="absolute top-2 left-2">
                            <div className={`flex items-center p-1.5 rounded-full shadow-sm ${
                              asset.fileType === 'IMAGE' ? 'text-green-500' :
                              asset.fileType === 'VIDEO' ? 'text-blue-500' :
                              asset.fileType === 'AUDIO' ? 'text-purple-500' :
                              'text-orange-500'
                            } bg-black/60 backdrop-blur-sm`}>
                              {getFileTypeIcon(asset.fileType)}
                            </div>
                          </div>
                          
                          <div className="absolute top-2 right-2 flex gap-1">
                            {asset.isPremium && (
                              <Badge variant="secondary" className="bg-yellow-500 text-white">
                                <Crown className="w-3 h-3 mr-1" />
                                Premium
                              </Badge>
                            )}
                            {!asset.isPublished && (
                              <Badge variant="secondary" className={`${
                                isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-500 text-white'
                              }`}>
                                Draft
                              </Badge>
                            )}
                          </div>
                        </div>

                        <CardContent className="p-4">
                      {/* File title with rename functionality */}
                      {renamingAsset === asset.id ? (
                        <div className="mb-1">
                          <Input
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            onKeyDown={(e) => handleRenameKeyPress(e, asset.id)}
                            onBlur={() => confirmRename(asset.id)}
                            className={`text-lg font-semibold ${themeClasses.input}`}
                            autoFocus
                          />
                          <div className="flex gap-1 mt-1">
                            <Button
                              size="sm"
                              onClick={() => confirmRename(asset.id)}
                              className="h-6 px-2 text-xs"
                            >
                              <Check className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={cancelRename}
                              className="h-6 px-2 text-xs"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="group/title mb-1">
                          <h3 className={`font-semibold text-lg truncate ${themeClasses.primaryText}`}>
                            {asset.title}
                          </h3>
                        </div>
                      )}
                      {asset.description && (
                        <p className={`text-sm mb-2 line-clamp-2 ${themeClasses.secondaryText}`}>
                          {asset.description}
                        </p>
                      )}
                      
                      <div className={`flex items-center justify-between text-xs mb-3 ${themeClasses.mutedText}`}>
                        <span>{formatFileSize(asset.fileSize)}</span>
                        <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                      </div>

                      {asset.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {asset.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className={`text-xs ${themeClasses.badge}`}>
                              {tag}
                            </Badge>
                          ))}
                          {asset.tags.length > 3 && (
                            <Badge variant="outline" className={`text-xs ${themeClasses.badge}`}>
                              +{asset.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className={`flex items-center justify-between text-xs ${themeClasses.mutedText}`}>
                        <div className="flex items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {asset.viewCount}
                          </span>
                          <span className="flex items-center gap-1">
                            <Download className="w-3 h-3" />
                            {asset.downloadCount}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <Switch
                            checked={asset.isPublished}
                            onCheckedChange={(value) =>
                              toggleMediaStatusMutation.mutate({
                                id: asset.id,
                                field: 'isPublished',
                                value,
                              })
                            }
                          />
                          <Switch
                            checked={asset.isPremium}
                            onCheckedChange={(value) =>
                              toggleMediaStatusMutation.mutate({
                                id: asset.id,
                                field: 'isPremium',
                                value,
                              })
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                      </>
                    ) : (
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {/* List view content here */}
                          <div className={`w-16 h-16 rounded-lg flex-shrink-0 overflow-hidden ${
                            isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                          }`}>
                            {asset.fileType === 'IMAGE' ? (
                              <img
                                src={asset.filePath}
                                alt={asset.title}
                                className="w-full h-full object-cover"
                              />
                            ) : asset.fileType === 'VIDEO' && asset.thumbnailPath ? (
                              <div className="relative w-full h-full">
                                <img
                                  src={asset.thumbnailPath}
                                  alt={asset.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="bg-black/50 rounded-full p-1">
                                    <Video className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${themeClasses.secondaryText}`}>
                                {getFileTypeIcon(asset.fileType)}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                {renamingAsset === asset.id ? (
                                  <div className="mb-1">
                                    <Input
                                      value={renameValue}
                                      onChange={(e) => setRenameValue(e.target.value)}
                                      onKeyDown={(e) => handleRenameKeyPress(e, asset.id)}
                                      onBlur={() => confirmRename(asset.id)}
                                      className={`text-lg font-semibold ${themeClasses.input}`}
                                      autoFocus
                                    />
                                    <div className="flex gap-1 mt-1">
                                      <Button
                                        size="sm"
                                        onClick={() => confirmRename(asset.id)}
                                        className="h-6 px-2 text-xs"
                                      >
                                        <Check className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={cancelRename}
                                        className="h-6 px-2 text-xs"
                                      >
                                        <X className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <h3 className={`font-semibold text-lg truncate ${themeClasses.primaryText}`}>
                                    {asset.title}
                                  </h3>
                                )}
                                
                                <div className={`flex items-center gap-2 text-xs ${themeClasses.mutedText} mt-1`}>
                                  <span className="flex items-center gap-1">
                                    {getFileTypeIcon(asset.fileType)}
                                    {asset.fileType}
                                  </span>
                                  <span>•</span>
                                  <span>{formatFileSize(asset.fileSize)}</span>
                                  <span>•</span>
                                  <span>{new Date(asset.createdAt).toLocaleDateString()}</span>
                                </div>
                                
                                {asset.description && (
                                  <p className={`text-sm mt-1 line-clamp-1 ${themeClasses.secondaryText}`}>
                                    {asset.description}
                                  </p>
                                )}
                                
                                {asset.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {asset.tags.slice(0, 2).map((tag) => (
                                      <Badge key={tag} variant="outline" className={`text-xs ${themeClasses.badge}`}>
                                        {tag}
                                      </Badge>
                                    ))}
                                    {asset.tags.length > 2 && (
                                      <Badge variant="outline" className={`text-xs ${themeClasses.badge}`}>
                                        +{asset.tags.length - 2}
                                      </Badge>
                                    )}
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-start gap-2 ml-4">
                                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {asset.viewCount}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Download className="w-3 h-3" />
                                    {asset.downloadCount}
                                  </span>
                                </div>
                                
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="secondary" 
                                    onClick={() => setPreviewAsset(asset)}
                                    className="h-8 px-3"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="secondary"
                                    onClick={() => startRename(asset)}
                                    className="h-8 px-3"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="destructive"
                                    onClick={() => setDeleteAsset(asset)}
                                    className="h-8 px-3"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                              <div className="flex items-center gap-2">
                                {asset.isPremium && (
                                  <Badge variant="secondary" className="bg-yellow-500 text-white">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                                {!asset.isPublished && (
                                  <Badge variant="secondary" className={`${
                                    isDarkMode ? 'bg-gray-600 text-gray-200' : 'bg-gray-500 text-white'
                                  }`}>
                                    Draft
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="flex gap-2">
                                <Switch
                                  checked={asset.isPublished}
                                  onCheckedChange={(value) =>
                                    toggleMediaStatusMutation.mutate({
                                      id: asset.id,
                                      field: 'isPublished',
                                      value,
                                    })
                                  }
                                />
                                <Switch
                                  checked={asset.isPremium}
                                  onCheckedChange={(value) =>
                                    toggleMediaStatusMutation.mutate({
                                      id: asset.id,
                                      field: 'isPremium',
                                      value,
                                    })
                                  }
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Upload Media Tab */}
          <TabsContent value="upload" className="space-y-6">
            <Card className={themeClasses.card}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                  <Upload className="w-5 h-5" />
                  Upload New Media
                </CardTitle>
                <CardDescription className={themeClasses.secondaryText}>
                  Upload multiple images, videos, audio files, and documents to the cloud media library at once
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...mediaForm}>
                  <form onSubmit={mediaForm.handleSubmit(handleUploadMedia)} className="space-y-6">
                    {/* File Upload */}
                    <div>
                      <Label htmlFor="files" className={themeClasses.primaryText}>Select Multiple Files</Label>
                      <div 
                        className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                          isDragOver 
                            ? isDarkMode ? 'border-purple-400 bg-purple-900/20' : 'border-purple-500 bg-purple-50'
                            : isDarkMode 
                              ? 'border-gray-600 hover:border-purple-500 bg-gray-800/30' 
                              : 'border-gray-300 hover:border-purple-500 bg-gray-50'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center space-y-4">
                          <Upload className={`w-12 h-12 ${themeClasses.mutedText}`} />
                          <div>
                            <Input
                              id="files"
                              type="file"
                              multiple
                              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
                              onChange={handleFileSelect}
                              className="hidden"
                            />
                            <label
                              htmlFor="files"
                              className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-md transition-colors ${themeClasses.button}`}
                            >
                              Choose Multiple Files
                            </label>
                          </div>
                          <p className={`text-sm ${themeClasses.mutedText}`}>
                            or drag and drop files here
                          </p>
                          <p className={`text-xs ${themeClasses.mutedText}`}>
                            Supports: Images, Videos, Audio, PDF, DOC, DOCX
                          </p>
                        </div>
                      </div>
                      {selectedFiles && selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-4">
                          <p className={`text-sm font-medium ${themeClasses.secondaryText}`}>
                            {selectedFiles.length} file(s) selected
                          </p>
                          
                          {/* File Previews */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {Array.from(selectedFiles).map((file, index) => {
                              const previewKey = `${index}-${file.name}`;
                              const isImage = file.type.startsWith('image/');
                              const isVideo = file.type.startsWith('video/');
                              const isAudio = file.type.startsWith('audio/');
                              
                              return (
                                <Card key={index} className={`p-4 ${themeClasses.card}`}>
                                  <div className="space-y-3">
                                    {/* Preview Area */}
                                    <div className={`relative h-32 rounded-lg overflow-hidden ${
                                      isDarkMode ? 'bg-gray-700/30' : 'bg-gray-100'
                                    }`}>
                                      {isImage && filePreviews[previewKey] ? (
                                        <img
                                          src={filePreviews[previewKey]}
                                          alt={file.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : isVideo ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <Video className={`w-12 h-12 ${themeClasses.mutedText}`} />
                                        </div>
                                      ) : isAudio ? (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <FileAudio className={`w-12 h-12 ${themeClasses.mutedText}`} />
                                        </div>
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                          <FileText className={`w-12 h-12 ${themeClasses.mutedText}`} />
                                        </div>
                                      )}
                                    </div>
                                    
                                    {/* File Info */}
                                    <div className="space-y-1">
                                      <p className={`text-sm font-medium truncate ${themeClasses.primaryText}`}>
                                        {file.name}
                                      </p>
                                      <div className={`flex items-center justify-between text-xs ${themeClasses.mutedText}`}>
                                        <span className="capitalize">{file.type.split('/')[0]}</span>
                                        <span>{formatFileSize(file.size)}</span>
                                      </div>
                                    </div>
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Upload Progress */}
                    {isUploading && (
                      <div className="space-y-2">
                        <div className={`flex items-center justify-between text-sm ${themeClasses.primaryText}`}>
                          <span>Uploading...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="w-full" />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Basic Info */}
                      <div className="space-y-4">
                        <FormField
                          control={mediaForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={themeClasses.primaryText}>Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter media title" className={themeClasses.input} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={mediaForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={themeClasses.primaryText}>Description</FormLabel>
                              <FormControl>
                                <Textarea placeholder="Enter media description" className={themeClasses.input} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={mediaForm.control}
                          name="tags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={themeClasses.primaryText}>Tags</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter tags separated by commas" className={themeClasses.input} {...field} />
                              </FormControl>
                              <FormDescription className={themeClasses.secondaryText}>
                                Enter tags separated by commas (e.g., worship, background, nature)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Settings */}
                      <div className="space-y-4">
                        <FormField
                          control={mediaForm.control}
                          name="categoryIds"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className={themeClasses.primaryText}>Categories</FormLabel>
                              <div className="space-y-2">
                                <div className={`border rounded-md p-2 min-h-[100px] max-h-[200px] overflow-y-auto ${themeClasses.input}`}>
                                  {categoriesLoading ? (
                                    <p className={`text-sm ${themeClasses.mutedText}`}>Loading categories...</p>
                                  ) : categories.length === 0 ? (
                                    <p className={`text-sm ${themeClasses.mutedText}`}>No categories available. Add one in the Categories tab.</p>
                                  ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                      {categories.map((category) => (
                                        <label 
                                          key={category.id} 
                                          className={`flex items-center space-x-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700/50 cursor-pointer ${themeClasses.primaryText}`}
                                        >
                                          <input
                                            type="checkbox"
                                            checked={field.value?.includes(category.id) || false}
                                            onChange={(e) => {
                                              const currentValues = field.value || [];
                                              if (e.target.checked) {
                                                field.onChange([...currentValues, category.id]);
                                              } else {
                                                field.onChange(currentValues.filter(id => id !== category.id));
                                              }
                                            }}
                                            className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                          />
                                          <span className="text-sm">{category.name}</span>
                                        </label>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {field.value && field.value.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {field.value.map(categoryId => {
                                      const category = categories.find(c => c.id === categoryId);
                                      return category ? (
                                        <Badge key={categoryId} variant="outline" className={`text-xs ${themeClasses.badge}`}>
                                          {category.name}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                )}
                              </div>
                              <FormDescription className={themeClasses.secondaryText}>
                                Select multiple categories where this media should appear in user filters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={mediaForm.control}
                          name="isPremium"
                          render={({ field }) => (
                            <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-3 ${
                              isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/30'
                            }`}>
                              <div className="space-y-0.5">
                                <FormLabel className={themeClasses.primaryText}>Premium Content</FormLabel>
                                <FormDescription className={themeClasses.secondaryText}>
                                  Mark as premium content (requires upgrade)
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={mediaForm.control}
                          name="isPublished"
                          render={({ field }) => (
                            <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-3 ${
                              isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/30'
                            }`}>
                              <div className="space-y-0.5">
                                <FormLabel className={themeClasses.primaryText}>Publish Immediately</FormLabel>
                                <FormDescription className={themeClasses.secondaryText}>
                                  Make available to all users immediately
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch checked={field.value} onCheckedChange={field.onChange} />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button 
                      type="submit" 
                      disabled={isUploading || !selectedFiles || selectedFiles.length === 0}
                      className={`w-full ${themeClasses.button}`}
                    >
                      {isUploading ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Media
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Category */}
              <Card className={themeClasses.card}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                    <FolderPlus className="w-5 h-5" />
                    Create Category
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...categoryForm}>
                    <form onSubmit={categoryForm.handleSubmit((data) => createCategoryMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={categoryForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Category name" className={themeClasses.input} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="category-slug" className={themeClasses.input} {...field} />
                            </FormControl>
                            <FormDescription className={themeClasses.secondaryText}>
                              URL-friendly version (e.g., worship-backgrounds)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Category description" className={themeClasses.input} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={categoryForm.control}
                        name="parentId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Parent Category</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(value)}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className={themeClasses.select}>
                                  <SelectValue placeholder="Select parent category (optional)" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className={themeClasses.card}>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()} className={themeClasses.primaryText}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={createCategoryMutation.isPending} className={themeClasses.button}>
                        {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Categories List */}
              <Card className={themeClasses.card}>
                <CardHeader>
                  <CardTitle className={themeClasses.primaryText}>Existing Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {categoriesLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`h-12 rounded animate-pulse ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {categories.map((category) => (
                          <div key={category.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800/30' 
                              : 'border-gray-200 bg-gray-50/30'
                          }`}>
                            <div>
                              <h4 className={`font-semibold ${themeClasses.primaryText}`}>{category.name}</h4>
                              <p className={`text-sm ${themeClasses.secondaryText}`}>/{category.slug}</p>
                              {category.description && (
                                <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>{category.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={category.isActive ? "default" : "secondary"} className={
                                category.isActive 
                                  ? 'bg-purple-600 text-white' 
                                  : `${themeClasses.badge}`
                              }>
                                {category.isActive ? "Active" : "Inactive"}
                              </Badge>
                              <Button size="sm" variant="ghost" className={`${
                                isDarkMode 
                                  ? 'hover:bg-gray-700/50 text-gray-300' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Create Collection */}
              <Card className={themeClasses.card}>
                <CardHeader>
                  <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                    <Plus className="w-5 h-5" />
                    Create Collection
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...collectionForm}>
                    <form onSubmit={collectionForm.handleSubmit((data) => createCollectionMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={collectionForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Collection name" className={themeClasses.input} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={collectionForm.control}
                        name="slug"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Slug</FormLabel>
                            <FormControl>
                              <Input placeholder="collection-slug" className={themeClasses.input} {...field} />
                            </FormControl>
                            <FormDescription className={themeClasses.secondaryText}>
                              URL-friendly version (e.g., christmas-2024)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={collectionForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className={themeClasses.primaryText}>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Collection description" className={themeClasses.input} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={collectionForm.control}
                        name="isPublished"
                        render={({ field }) => (
                          <FormItem className={`flex flex-row items-center justify-between rounded-lg border p-3 ${
                            isDarkMode ? 'border-gray-600 bg-gray-800/30' : 'border-gray-300 bg-gray-50/30'
                          }`}>
                            <div className="space-y-0.5">
                              <FormLabel className={themeClasses.primaryText}>Publish Collection</FormLabel>
                              <FormDescription className={themeClasses.secondaryText}>
                                Make collection visible to users
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <Button type="submit" disabled={createCollectionMutation.isPending} className={themeClasses.button}>
                        {createCollectionMutation.isPending ? 'Creating...' : 'Create Collection'}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Collections List */}
              <Card className={themeClasses.card}>
                <CardHeader>
                  <CardTitle className={themeClasses.primaryText}>Existing Collections</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    {collectionsLoading ? (
                      <div className="space-y-2">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className={`h-12 rounded animate-pulse ${
                            isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'
                          }`} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {collections.map((collection) => (
                          <div key={collection.id} className={`flex items-center justify-between p-3 border rounded-lg ${
                            isDarkMode 
                              ? 'border-gray-600 bg-gray-800/30' 
                              : 'border-gray-200 bg-gray-50/30'
                          }`}>
                            <div>
                              <h4 className={`font-semibold ${themeClasses.primaryText}`}>{collection.name}</h4>
                              <p className={`text-sm ${themeClasses.secondaryText}`}>/{collection.slug}</p>
                              {collection.description && (
                                <p className={`text-xs mt-1 ${themeClasses.mutedText}`}>{collection.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={collection.isPublished ? "default" : "secondary"} className={
                                collection.isPublished 
                                  ? 'bg-purple-600 text-white' 
                                  : `${themeClasses.badge}`
                              }>
                                {collection.isPublished ? "Published" : "Draft"}
                              </Badge>
                              <Button size="sm" variant="ghost" className={`${
                                isDarkMode 
                                  ? 'hover:bg-gray-700/50 text-gray-300' 
                                  : 'hover:bg-gray-200 text-gray-600'
                              }`}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Media Preview Modal */}
      {previewAsset && (
        <Dialog open={!!previewAsset} onOpenChange={() => setPreviewAsset(null)}>
          <DialogContent className={`max-w-6xl w-[90vw] max-h-[90vh] overflow-hidden ${themeClasses.card}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                {getFileTypeIcon(previewAsset.fileType)}
                {previewAsset.title}
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-2 gap-8 h-[70vh]">
              {/* Media Preview - Full Left Side */}
              <div className="flex items-center justify-center">
                <div className={`w-full h-full rounded-lg overflow-hidden flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800/50' : 'bg-gray-100'
                }`} style={{ minHeight: '400px', maxHeight: '70vh' }}>
                  {previewAsset.fileType === 'IMAGE' ? (
                    <img
                      src={previewAsset.filePath}
                      alt={previewAsset.title}
                      className="w-full h-full object-contain"
                      style={{ maxHeight: '70vh' }}
                    />
                  ) : previewAsset.fileType === 'VIDEO' ? (
                    <video
                      src={previewAsset.filePath}
                      controls
                      className="w-full h-full"
                      style={{ maxHeight: '70vh' }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : previewAsset.fileType === 'AUDIO' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8">
                      <FileAudio className="w-24 h-24 text-purple-500 mb-6" />
                      <audio
                        src={previewAsset.filePath}
                        controls
                        className="w-full max-w-md"
                      >
                        Your browser does not support the audio tag.
                      </audio>
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-8">
                      <FileText className="w-24 h-24 text-orange-500 mb-6" />
                      <p className={`text-center text-lg ${themeClasses.secondaryText}`}>
                        Document preview not available
                      </p>
                      <Button 
                        className="mt-6" 
                        size="lg"
                        onClick={() => window.open(previewAsset.filePath, '_blank')}
                      >
                        <Download className="w-5 h-5 mr-2" />
                        Download File
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Media Details - Full Right Side */}
              <div className="flex flex-col h-full">
                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-auto pr-2 space-y-4" style={{ maxHeight: 'calc(70vh - 80px)' }}>
                  <div>
                    <h3 className={`text-lg font-semibold mb-3 ${themeClasses.primaryText}`}>
                      File Details
                    </h3>
                    
                    <div className="space-y-3">
                      <div>
                        <Label className={themeClasses.secondaryText}>Original Name</Label>
                        <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.originalFileName}</p>
                      </div>
                      
                      <div>
                        <Label className={themeClasses.secondaryText}>File Type</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${
                            previewAsset.fileType === 'IMAGE' ? 'bg-green-500 text-white' :
                            previewAsset.fileType === 'VIDEO' ? 'bg-blue-500 text-white' :
                            previewAsset.fileType === 'AUDIO' ? 'bg-purple-500 text-white' :
                            'bg-orange-500 text-white'
                          }`}>
                            {getFileTypeIcon(previewAsset.fileType)}
                            <span className="ml-1">{previewAsset.fileType}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <div>
                        <Label className={themeClasses.secondaryText}>File Size</Label>
                        <p className={`text-sm ${themeClasses.primaryText}`}>{formatFileSize(previewAsset.fileSize)}</p>
                      </div>
                      
                      <div>
                        <Label className={themeClasses.secondaryText}>MIME Type</Label>
                        <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.mimeType}</p>
                      </div>
                      
                      {previewAsset.dimensions && (
                        <div>
                          <Label className={themeClasses.secondaryText}>Dimensions</Label>
                          <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.dimensions}</p>
                        </div>
                      )}
                      
                      {previewAsset.duration && (
                        <div>
                          <Label className={themeClasses.secondaryText}>Duration</Label>
                          <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.duration}s</p>
                        </div>
                      )}
                      
                      <div>
                        <Label className={themeClasses.secondaryText}>Downloads</Label>
                        <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.downloadCount}</p>
                      </div>
                      
                      <div>
                        <Label className={themeClasses.secondaryText}>Views</Label>
                        <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.viewCount}</p>
                      </div>
                      
                      <div>
                        <Label className={themeClasses.secondaryText}>Uploaded</Label>
                        <p className={`text-sm ${themeClasses.primaryText}`}>
                          {new Date(previewAsset.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      {previewAsset.description && (
                        <div>
                          <Label className={themeClasses.secondaryText}>Description</Label>
                          <p className={`text-sm ${themeClasses.primaryText}`}>{previewAsset.description}</p>
                        </div>
                      )}

                      {previewAsset.tags.length > 0 && (
                        <div>
                          <Label className={themeClasses.secondaryText}>Tags</Label>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {previewAsset.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className={themeClasses.badge}>
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Fixed Action Buttons */}
                <div className="flex-shrink-0 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => window.open(previewAsset.filePath, '_blank')}
                      className="flex-1"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        startRename(previewAsset);
                        setPreviewAsset(null);
                      }}
                      className="flex-1"
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Rename
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {deleteAsset && (
        <Dialog open={!!deleteAsset} onOpenChange={() => setDeleteAsset(null)}>
          <DialogContent className={`max-w-md ${themeClasses.card}`}>
            <DialogHeader>
              <DialogTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                </div>
                Delete Media File
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${
                isDarkMode ? 'bg-red-900/10 border border-red-800/20' : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-start gap-3">
                  <div className={`rounded-lg overflow-hidden flex-shrink-0 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                  }`} style={{ width: '64px', height: '64px' }}>
                    {deleteAsset.fileType === 'IMAGE' ? (
                      <img
                        src={deleteAsset.filePath}
                        alt={deleteAsset.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className={`${
                          deleteAsset.fileType === 'VIDEO' ? 'text-blue-500' :
                          deleteAsset.fileType === 'AUDIO' ? 'text-purple-500' :
                          'text-orange-500'
                        }`}>
                          {getFileTypeIcon(deleteAsset.fileType)}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-medium truncate ${themeClasses.primaryText}`}>
                      {deleteAsset.title}
                    </h4>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>
                      {deleteAsset.originalFileName}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`text-xs ${
                        deleteAsset.fileType === 'IMAGE' ? 'bg-green-500 text-white' :
                        deleteAsset.fileType === 'VIDEO' ? 'bg-blue-500 text-white' :
                        deleteAsset.fileType === 'AUDIO' ? 'bg-purple-500 text-white' :
                        'bg-orange-500 text-white'
                      }`}>
                        {deleteAsset.fileType}
                      </Badge>
                      <span className={`text-xs ${themeClasses.mutedText}`}>
                        {formatFileSize(deleteAsset.fileSize)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <p className={`text-sm ${themeClasses.primaryText}`}>
                  Are you sure you want to delete this media file? This action cannot be undone.
                </p>
                <div className={`p-3 rounded-md ${
                  isDarkMode ? 'bg-yellow-900/20 border border-yellow-800/30' : 'bg-yellow-50 border border-yellow-200'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className={`text-xs font-medium text-yellow-800 dark:text-yellow-200`}>
                        Warning
                      </p>
                      <p className={`text-xs text-yellow-700 dark:text-yellow-300`}>
                        Any content using this media file will be affected
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => setDeleteAsset(null)}
                className={themeClasses.buttonSecondary}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive"
                onClick={() => {
                  deleteMediaMutation.mutate(deleteAsset.id);
                  setDeleteAsset(null);
                }}
                disabled={deleteMediaMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white border-red-600"
              >
                {deleteMediaMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete File
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}