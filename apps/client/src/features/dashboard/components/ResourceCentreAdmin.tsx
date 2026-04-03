import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Book, 
  HelpCircle, 
  MessageSquare, 
  ExternalLink, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Search,
  RefreshCw,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Clock,
  Users,
  FileText
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: string;
  readTime: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  content: string;
  tags: string[];
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface ResourceLink {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon: string;
  published: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const ResourceCentreAdmin: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState("articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [previewItem, setPreviewItem] = useState<any>(null);

  // Form states
  const [articleForm, setArticleForm] = useState<Partial<HelpArticle>>({
    title: "",
    description: "",
    category: "getting-started",
    readTime: "",
    difficulty: "beginner",
    content: "",
    tags: [],
    published: false
  });

  const [faqForm, setFaqForm] = useState<Partial<FAQItem>>({
    question: "",
    answer: "",
    category: "general",
    published: false
  });

  const [resourceForm, setResourceForm] = useState<Partial<ResourceLink>>({
    title: "",
    description: "",
    url: "",
    category: "general",
    icon: "ExternalLink",
    published: false
  });

  // Categories
  const categories = [
    { value: "getting-started", label: "Getting Started" },
    { value: "bible-companion", label: "Bible Companion" },
    { value: "presentations", label: "Presentations" },
    { value: "billing", label: "Billing & Plans" },
    { value: "organization", label: "Organization" },
    { value: "troubleshooting", label: "Troubleshooting" },
    { value: "general", label: "General" }
  ];

  // Fetch data from API with SuperAdmin authentication
  const { data: articlesData } = useQuery({
    queryKey: ['/api/admin/articles'],
    queryFn: async () => {
      const response = await fetch('/api/admin/articles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'qworship-superadmin-2025'
        }
      });
      return await response.json();
    }
  });

  const { data: faqsData } = useQuery({
    queryKey: ['/api/admin/faqs'],
    queryFn: async () => {
      const response = await fetch('/api/admin/faqs', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'qworship-superadmin-2025'
        }
      });
      return await response.json();
    }
  });

  const { data: resourcesData } = useQuery({
    queryKey: ['/api/admin/resources'],
    queryFn: async () => {
      const response = await fetch('/api/admin/resources', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'qworship-superadmin-2025'
        }
      });
      return await response.json();
    }
  });

  const articles = articlesData?.articles || [];
  const faqs = faqsData?.faqs || [];
  const resources = resourcesData?.resources || [];

  // Create/Update mutations
  const createArticleMutation = useMutation({
    mutationFn: async (article: Partial<HelpArticle>) => {
      const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'qworship-superadmin-2025'
        },
        body: JSON.stringify(article)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Article created successfully" });
      setShowCreateDialog(false);
      setArticleForm({
        title: "",
        description: "",
        category: "getting-started",
        readTime: "",
        difficulty: "beginner",
        content: "",
        tags: [],
        published: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/articles'] });
    }
  });

  const createFAQMutation = useMutation({
    mutationFn: async (faq: Partial<FAQItem>) => {
      const response = await fetch('/api/admin/faqs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'qworship-superadmin-2025'
        },
        body: JSON.stringify(faq)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "FAQ created successfully" });
      setShowCreateDialog(false);
      setFaqForm({
        question: "",
        answer: "",
        category: "general",
        published: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/faqs'] });
    }
  });

  const createResourceMutation = useMutation({
    mutationFn: async (resource: Partial<ResourceLink>) => {
      const response = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': 'qworship-superadmin-2025'
        },
        body: JSON.stringify(resource)
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({ title: "Resource created successfully" });
      setShowCreateDialog(false);
      setResourceForm({
        title: "",
        description: "",
        url: "",
        category: "general",
        icon: "ExternalLink",
        published: false
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/resources'] });
    }
  });

  const handleCreateItem = () => {
    if (activeTab === "articles") {
      createArticleMutation.mutate(articleForm);
    } else if (activeTab === "faqs") {
      createFAQMutation.mutate(faqForm);
    } else if (activeTab === "resources") {
      createResourceMutation.mutate(resourceForm);
    }
  };

  const handlePublishToggle = async (type: string, id: string, currentStatus: boolean) => {
    try {
      const endpoint = `/api/admin/${type}/${id}`;
      await apiRequest('PUT', endpoint, { published: !currentStatus });
      toast({ 
        title: `${type.slice(0, -1)} ${!currentStatus ? 'published' : 'unpublished'}` 
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/${type}`] });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to update publish status",
        variant: "destructive" 
      });
    }
  };

  const filteredData = (data: any[]) => {
    return data.filter(item => {
      const searchMatch = item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.question?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchQuery.toLowerCase());
      return searchMatch;
    });
  };

  const renderStats = () => {
    const stats = {
      articles: { total: articles.length, published: articles.filter((a: any) => a.published).length },
      faqs: { total: faqs.length, published: faqs.filter((f: any) => f.published).length },
      resources: { total: resources.length, published: resources.filter((r: any) => r.published).length }
    };

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Book className="w-4 h-4" />
              Articles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.articles.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stats.articles.published} published</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              FAQs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.faqs.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stats.faqs.published} published</div>
          </CardContent>
        </Card>
        
        <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Resources
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resources.total}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">{stats.resources.published} published</div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderPreviewDialog = () => (
    <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Preview {previewItem?.title || previewItem?.question}
          </DialogTitle>
        </DialogHeader>
        
        {previewItem && (
          <div className="space-y-4">
            {previewItem.title && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{previewItem.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{previewItem.description}</p>
                {previewItem.readTime && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <span>Read time: {previewItem.readTime}</span>
                    <Badge className={previewItem.difficulty === 'beginner' ? 'bg-green-900/40 text-green-400' : 
                                    previewItem.difficulty === 'intermediate' ? 'bg-yellow-900/40 text-yellow-400' : 'bg-red-900/40 text-red-400'}>
                      {previewItem.difficulty}
                    </Badge>
                  </div>
                )}
                {previewItem.content && (
                  <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border max-h-96 overflow-y-auto">
                    <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">{previewItem.content}</div>
                  </div>
                )}
              </div>
            )}
            
            {previewItem.question && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{previewItem.question}</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded border">
                  <p className="text-gray-700 dark:text-gray-300">{previewItem.answer}</p>
                </div>
                {(previewItem.helpful || previewItem.notHelpful) && (
                  <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-4">
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {previewItem.helpful || 0} helpful
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsDown className="w-4 h-4" />
                      {previewItem.notHelpful || 0} not helpful
                    </span>
                  </div>
                )}
              </div>
            )}
            
            {previewItem.url && (
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{previewItem.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{previewItem.description}</p>
                <a 
                  href={previewItem.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                >
                  {previewItem.url}
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
              <div className="flex items-center gap-2">
                <Badge variant={previewItem.published ? "default" : "secondary"}>
                  {previewItem.published ? "Published" : "Draft"}
                </Badge>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Category: {categories.find(c => c.value === previewItem.category)?.label}
                </span>
              </div>
              <Button variant="outline" onClick={() => setPreviewItem(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const renderEditDialog = () => (
    <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit {editingItem?.title || editingItem?.question}
          </DialogTitle>
        </DialogHeader>
        
        {editingItem && (
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Edit functionality will be implemented in a future update. For now, you can view the content above.
            </p>
            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditingItem(null)}>
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );

  const renderCreateDialog = () => (
    <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
      <DialogContent className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Create New {activeTab === "articles" ? "Article" : activeTab === "faqs" ? "FAQ" : "Resource"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {activeTab === "articles" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={articleForm.title || ""}
                    onChange={(e) => setArticleForm({...articleForm, title: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={articleForm.category}
                    onValueChange={(value) => setArticleForm({...articleForm, category: value})}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Read Time</Label>
                  <Input
                    value={articleForm.readTime || ""}
                    onChange={(e) => setArticleForm({...articleForm, readTime: e.target.value})}
                    placeholder="e.g., 5 min"
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label>Difficulty</Label>
                  <Select
                    value={articleForm.difficulty}
                    onValueChange={(value: any) => setArticleForm({...articleForm, difficulty: value})}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={articleForm.description || ""}
                  onChange={(e) => setArticleForm({...articleForm, description: e.target.value})}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
              
              <div>
                <Label>Content</Label>
                <Textarea
                  value={articleForm.content || ""}
                  onChange={(e) => setArticleForm({...articleForm, content: e.target.value})}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  rows={10}
                  placeholder="Enter the full article content..."
                />
              </div>
            </>
          )}
          
          {activeTab === "faqs" && (
            <>
              <div>
                <Label>Question</Label>
                <Input
                  value={faqForm.question || ""}
                  onChange={(e) => setFaqForm({...faqForm, question: e.target.value})}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <Label>Category</Label>
                <Select
                  value={faqForm.category}
                  onValueChange={(value) => setFaqForm({...faqForm, category: value})}
                >
                  <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                    {categories.map(cat => (
                      <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Answer</Label>
                <Textarea
                  value={faqForm.answer || ""}
                  onChange={(e) => setFaqForm({...faqForm, answer: e.target.value})}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  rows={6}
                />
              </div>
            </>
          )}
          
          {activeTab === "resources" && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    value={resourceForm.title || ""}
                    onChange={(e) => setResourceForm({...resourceForm, title: e.target.value})}
                    className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={resourceForm.category}
                    onValueChange={(value) => setResourceForm({...resourceForm, category: value})}
                  >
                    <SelectTrigger className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                      {categories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label>URL</Label>
                <Input
                  value={resourceForm.url || ""}
                  onChange={(e) => setResourceForm({...resourceForm, url: e.target.value})}
                  placeholder="https://..."
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                />
              </div>
              
              <div>
                <Label>Description</Label>
                <Textarea
                  value={resourceForm.description || ""}
                  onChange={(e) => setResourceForm({...resourceForm, description: e.target.value})}
                  className="bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </>
          )}
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={
                activeTab === "articles" ? articleForm.published :
                activeTab === "faqs" ? faqForm.published :
                resourceForm.published
              }
              onChange={(e) => {
                if (activeTab === "articles") {
                  setArticleForm({...articleForm, published: e.target.checked});
                } else if (activeTab === "faqs") {
                  setFaqForm({...faqForm, published: e.target.checked});
                } else {
                  setResourceForm({...resourceForm, published: e.target.checked});
                }
              }}
              className="rounded"
            />
            <Label>Publish immediately</Label>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={handleCreateItem} className="bg-purple-600 hover:bg-purple-700">
              <Save className="w-4 h-4 mr-2" />
              Create {activeTab === "articles" ? "Article" : activeTab === "faqs" ? "FAQ" : "Resource"}
            </Button>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-6 p-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Resource Centre</h2>
          <p className="text-gray-600 dark:text-gray-400">Manage all Help & Support content for users</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-purple-600 hover:bg-purple-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create New
        </Button>
      </div>

      {/* Stats */}
      {renderStats()}

      {/* Search */}
      <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" />
            <Input
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-gray-100 dark:bg-gray-900">
          <TabsTrigger value="articles" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Book className="w-4 h-4 mr-2" />
            Articles
          </TabsTrigger>
          <TabsTrigger value="faqs" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <HelpCircle className="w-4 h-4 mr-2" />
            FAQs
          </TabsTrigger>
          <TabsTrigger value="resources" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <ExternalLink className="w-4 h-4 mr-2" />
            Resources
          </TabsTrigger>
        </TabsList>

        <TabsContent value="articles" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Articles ({filteredData(articles).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData(articles).map((article) => (
                  <div key={article.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{article.title}</h3>
                          <Badge variant={article.published ? "default" : "secondary"}>
                            {article.published ? "Published" : "Draft"}
                          </Badge>
                          <Badge className={`${
                            article.difficulty === 'beginner' ? 'bg-green-900/40 text-green-400' :
                            article.difficulty === 'intermediate' ? 'bg-yellow-900/40 text-yellow-400' :
                            'bg-red-900/40 text-red-400'
                          }`}>
                            {article.difficulty}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{article.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{categories.find(c => c.value === article.category)?.label}</span>
                          <span>{article.readTime}</span>
                          <span>Updated: {article.updatedAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewItem(article)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(article)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={article.published ? "destructive" : "default"}
                          onClick={() => handlePublishToggle("articles", article.id, article.published)}
                        >
                          {article.published ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faqs" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">FAQs ({filteredData(faqs).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData(faqs).map((faq) => (
                  <div key={faq.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{faq.question}</h3>
                          <Badge variant={faq.published ? "default" : "secondary"}>
                            {faq.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2 line-clamp-2">{faq.answer}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{categories.find(c => c.value === faq.category)?.label}</span>
                          <span className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {faq.helpful}
                          </span>
                          <span className="flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            {faq.notHelpful}
                          </span>
                          <span>Updated: {faq.updatedAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => setPreviewItem(faq)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(faq)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={faq.published ? "destructive" : "default"}
                          onClick={() => handlePublishToggle("faqs", faq.id, faq.published)}
                        >
                          {faq.published ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-4">
          <Card className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-700 shadow-md">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Resources ({filteredData(resources).length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredData(resources).map((resource) => (
                  <div key={resource.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">{resource.title}</h3>
                          <Badge variant={resource.published ? "default" : "secondary"}>
                            {resource.published ? "Published" : "Draft"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{resource.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>{categories.find(c => c.value === resource.category)?.label}</span>
                          <span className="text-blue-600 dark:text-blue-400">{resource.url}</span>
                          <span>Updated: {resource.updatedAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => window.open(resource.url, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingItem(resource)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant={resource.published ? "destructive" : "default"}
                          onClick={() => handlePublishToggle("resources", resource.id, resource.published)}
                        >
                          {resource.published ? "Unpublish" : "Publish"}
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {renderCreateDialog()}
      {renderPreviewDialog()}
      {renderEditDialog()}
    </div>
  );
};