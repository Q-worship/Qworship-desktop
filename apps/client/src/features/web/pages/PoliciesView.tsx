import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  FileText, 
  Shield, 
  RefreshCw, 
  Scale, 
  Cookie, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Ban
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Policy {
  id: number;
  title: string;
  type: 'privacy' | 'refund' | 'eula' | 'terms' | 'cookies';
  content: string;
  status: 'draft' | 'active' | 'archived';
  version: string;
  description?: string;
  lastModified: string;
  createdAt: string;
  updatedAt: string;
}

interface PoliciesViewProps {
  adminKey: string;
}

export default function PoliciesView({ adminKey }: PoliciesViewProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [policyToDelete, setPolicyToDelete] = useState<Policy | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('superadmin-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Enhanced dark mode theme classes
  const themeClasses = {
    background: isDarkMode ? 'bg-gray-900' : 'bg-gray-50',
    cardBackground: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    cardBackgroundHover: isDarkMode ? 'hover:bg-gray-750 hover:border-gray-600' : 'hover:bg-gray-50 hover:border-gray-300',
    primaryText: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    mutedText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    accentText: isDarkMode ? 'text-gray-200' : 'text-gray-700',
    border: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    borderLight: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    inputBackground: isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    inputFocus: isDarkMode ? 'focus:border-yellow-500 focus:ring-yellow-500/20' : 'focus:border-yellow-500 focus:ring-yellow-500/20',
    buttonPrimary: isDarkMode ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-yellow-500 hover:bg-yellow-600 text-white',
    buttonSecondary: isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300',
    searchBackground: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300',
    tabsBackground: isDarkMode ? 'bg-gray-800' : 'bg-gray-100',
    tabActive: isDarkMode ? 'bg-yellow-600 text-white' : 'bg-yellow-500 text-white',
    tabInactive: isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-900',
    modalBackground: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    gradientCard: isDarkMode ? 'from-gray-800 to-gray-750' : 'from-gray-50 to-gray-100',
    shadowClass: isDarkMode ? 'shadow-2xl shadow-black/20' : 'shadow-xl shadow-gray-500/10',
    hoverBackground: isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
  };

  // Form state for create/edit
  const [formData, setFormData] = useState({
    title: '',
    type: 'privacy' as Policy['type'],
    content: '',
    status: 'draft' as Policy['status'],
    version: '1.0',
    description: ''
  });

  const policyTypes = [
    { value: 'privacy', label: 'Privacy Policy', icon: Shield },
    { value: 'refund', label: 'Refund Policy', icon: RefreshCw },
    { value: 'eula', label: 'End User License Agreement', icon: Scale },
    { value: 'terms', label: 'Terms of Service', icon: FileText },
    { value: 'cookies', label: 'Cookie Policy', icon: Cookie }
  ];

  const statusOptions = [
    { value: 'draft', label: 'Draft', color: 'bg-gray-500' },
    { value: 'active', label: 'Active', color: 'bg-green-500' },
    { value: 'archived', label: 'Archived', color: 'bg-orange-500' }
  ];

  useEffect(() => {
    fetchPolicies();
    // Create sample policies if none exist
    createSamplePoliciesIfNeeded();
  }, []);

  const createSamplePoliciesIfNeeded = async () => {
    try {
      const response = await fetch(`/api/admin/policies?adminKey=${adminKey}`);
      if (response.ok) {
        const existingPolicies = await response.json();
        if (existingPolicies.length === 0) {
          // Create sample policies
          const samplePolicies = [
            {
              title: "Privacy Policy",
              type: "privacy",
              content: "Q-worship Privacy Policy - We are committed to protecting your privacy and personal information when you use our church presentation platform...",
              status: "active",
              version: "1.0",
              description: "Our comprehensive privacy policy covering data collection and usage"
            },
            {
              title: "Refund Policy", 
              type: "refund",
              content: "Q-worship Refund Policy - We stand behind our service and want you to be completely satisfied...",
              status: "active", 
              version: "1.0",
              description: "Fair refund terms for church organizations"
            },
            {
              title: "End User License Agreement",
              type: "eula",
              content: "Q-worship EULA - This End User License Agreement governs your use of the Q-worship platform...",
              status: "active",
              version: "1.0", 
              description: "Legal terms for platform usage"
            }
          ];

          for (const policy of samplePolicies) {
            await fetch(`/api/admin/policies?adminKey=${adminKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(policy)
            });
          }
          // Refresh policies after creating samples
          fetchPolicies();
        }
      }
    } catch (error) {
      console.error('Error creating sample policies:', error);
    }
  };

  const fetchPolicies = async () => {
    try {
      const response = await fetch(`/api/admin/policies?adminKey=${adminKey}`);
      if (response.ok) {
        const data = await response.json();
        setPolicies(data);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/admin/policies?adminKey=${adminKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPolicies();
        setIsCreateModalOpen(false);
        resetForm();
        toast({
          title: "Success",
          description: "Policy created successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to create policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating policy:', error);
      toast({
        title: "Error",
        description: "Failed to create policy",
        variant: "destructive",
      });
    }
  };

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPolicy) return;

    try {
      const response = await fetch(`/api/admin/policies/${selectedPolicy.id}?adminKey=${adminKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        await fetchPolicies();
        setIsEditModalOpen(false);
        setSelectedPolicy(null);
        resetForm();
        toast({
          title: "Success",
          description: "Policy updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating policy:', error);
      toast({
        title: "Error",
        description: "Failed to update policy",
        variant: "destructive",
      });
    }
  };

  const openDeleteModal = (policy: Policy) => {
    setPolicyToDelete(policy);
    setIsDeleteModalOpen(true);
  };

  const handleDeletePolicy = async () => {
    if (!policyToDelete) return;

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/admin/policies/${policyToDelete.id}?adminKey=${adminKey}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchPolicies();
        toast({
          title: "Success",
          description: "Policy deleted successfully",
        });
        setIsDeleteModalOpen(false);
        setPolicyToDelete(null);
      } else {
        toast({
          title: "Error",
          description: "Failed to delete policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error deleting policy:', error);
      toast({
        title: "Error",
        description: "Failed to delete policy",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: 'privacy',
      content: '',
      status: 'draft',
      version: '1.0',
      description: ''
    });
  };

  const openEditModal = (policy: Policy) => {
    setSelectedPolicy(policy);
    setFormData({
      title: policy.title,
      type: policy.type,
      content: policy.content,
      status: policy.status,
      version: policy.version,
      description: policy.description || ''
    });
    setIsEditModalOpen(true);
  };

  const openDetailModal = (policy: Policy) => {
    setSelectedPolicy(policy);
    setIsDetailModalOpen(true);
  };

  const openCreateModal = () => {
    resetForm();
    setIsCreateModalOpen(true);
  };

  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter;
    const matchesType = typeFilter === 'all' || policy.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: Policy['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'draft': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'archived': return <XCircle className="h-4 w-4 text-orange-500" />;
    }
  };

  const getPolicyTypeIcon = (type: Policy['type']) => {
    const policyType = policyTypes.find(pt => pt.value === type);
    if (policyType) {
      const Icon = policyType.icon;
      return <Icon className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
  };

  const policyStats = {
    total: policies.length,
    active: policies.filter(p => p.status === 'active').length,
    draft: policies.filter(p => p.status === 'draft').length,
    archived: policies.filter(p => p.status === 'archived').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${themeClasses.background} min-h-screen p-6 rounded-lg`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h2 className={`text-3xl font-bold tracking-tight ${themeClasses.primaryText}`}>Policies Management</h2>
          <p className={`text-lg ${themeClasses.secondaryText}`}>
            Manage legal documents and policies that feed directly into the Contact page Quick Access section
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className={`${themeClasses.buttonPrimary} ${themeClasses.shadowClass} transition-all duration-200 hover:scale-105`}>
              <Plus className="mr-2 h-4 w-4" />
              Create Policy
            </Button>
          </DialogTrigger>
          <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${themeClasses.modalBackground}`}>
            <DialogHeader>
              <DialogTitle className={themeClasses.primaryText}>Create New Policy</DialogTitle>
              <DialogDescription className={themeClasses.secondaryText}>
                Create a new policy document that will be available in the Contact page Quick Access section
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreatePolicy} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className={`${themeClasses.accentText} font-medium`}>Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type" className={`${themeClasses.accentText} font-medium`}>Policy Type</Label>
                  <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Policy['type'] })}>
                    <SelectTrigger className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={themeClasses.modalBackground}>
                      {policyTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value} className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}>
                          <div className="flex items-center">
                            <type.icon className="w-4 h-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="version" className={`${themeClasses.accentText} font-medium`}>Version</Label>
                  <Input
                    id="version"
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="status" className={`${themeClasses.accentText} font-medium`}>Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Policy['status'] })}>
                    <SelectTrigger className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={themeClasses.modalBackground}>
                      {statusOptions.map((status) => (
                        <SelectItem key={status.value} value={status.value} className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description" className={`${themeClasses.accentText} font-medium`}>Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of this policy"
                  className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                />
              </div>
              <div>
                <Label htmlFor="content" className={`${themeClasses.accentText} font-medium`}>Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Enter the full policy content here..."
                  className={`min-h-[200px] ${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)} className={themeClasses.buttonSecondary}>
                  Cancel
                </Button>
                <Button type="submit" className={`${themeClasses.buttonPrimary} transition-all duration-200 hover:scale-105`}>
                  Create Policy
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className={`${themeClasses.cardBackground} ${themeClasses.shadowClass} hover:shadow-lg transition-all duration-200`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.accentText}`}>Total Policies</CardTitle>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-900/20' : 'bg-blue-100'}`}>
              <FileText className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>{policyStats.total}</div>
            <p className={`text-xs ${themeClasses.mutedText} mt-1`}>Total documents</p>
          </CardContent>
        </Card>
        <Card className={`${themeClasses.cardBackground} ${themeClasses.shadowClass} hover:shadow-lg transition-all duration-200`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.accentText}`}>Active</CardTitle>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-900/20' : 'bg-green-100'}`}>
              <CheckCircle className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{policyStats.active}</div>
            <p className={`text-xs ${themeClasses.mutedText} mt-1`}>Live policies</p>
          </CardContent>
        </Card>
        <Card className={`${themeClasses.cardBackground} ${themeClasses.shadowClass} hover:shadow-lg transition-all duration-200`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.accentText}`}>Drafts</CardTitle>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Clock className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{policyStats.draft}</div>
            <p className={`text-xs ${themeClasses.mutedText} mt-1`}>In progress</p>
          </CardContent>
        </Card>
        <Card className={`${themeClasses.cardBackground} ${themeClasses.shadowClass} hover:shadow-lg transition-all duration-200`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-sm font-medium ${themeClasses.accentText}`}>Archived</CardTitle>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-900/20' : 'bg-orange-100'}`}>
              <XCircle className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{policyStats.archived}</div>
            <p className={`text-xs ${themeClasses.mutedText} mt-1`}>Old versions</p>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Filters */}
      <Card className={`${themeClasses.cardBackground} ${themeClasses.shadowClass}`}>
        <CardHeader>
          <CardTitle className={`${themeClasses.primaryText} flex items-center`}>
            <Filter className="w-5 h-5 mr-2" />
            Filter Policies
          </CardTitle>
          <CardDescription className={themeClasses.secondaryText}>
            Search and filter your policy documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <Label htmlFor="search" className={`${themeClasses.accentText} font-medium`}>Search</Label>
              <div className="relative">
                <Search className={`absolute left-3 top-3 h-4 w-4 ${themeClasses.mutedText}`} />
                <Input
                  id="search"
                  placeholder="Search by title, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`pl-10 ${themeClasses.inputBackground} ${themeClasses.inputFocus} transition-all duration-200`}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status-filter" className={`${themeClasses.accentText} font-medium`}>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className={themeClasses.modalBackground}>
                  <SelectItem value="all" className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}>All Statuses</SelectItem>
                  {statusOptions.map((status) => (
                    <SelectItem 
                      key={status.value} 
                      value={status.value}
                      className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}
                    >
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter" className={`${themeClasses.accentText} font-medium`}>Policy Type</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className={themeClasses.modalBackground}>
                  <SelectItem value="all" className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}>All Types</SelectItem>
                  {policyTypes.map((type) => (
                    <SelectItem 
                      key={type.value} 
                      value={type.value}
                      className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}
                    >
                      <div className="flex items-center">
                        <type.icon className="w-4 h-4 mr-2" />
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Policies Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredPolicies.map((policy) => (
          <Card key={policy.id} className={`${themeClasses.cardBackground} ${themeClasses.shadowClass} hover:shadow-xl transition-all duration-300 hover:scale-[1.02] group`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'} group-hover:scale-110 transition-transform duration-200`}>
                    {getPolicyTypeIcon(policy.type)}
                  </div>
                  <CardTitle className={`text-lg ${themeClasses.primaryText} font-semibold`}>{policy.title}</CardTitle>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(policy.status)}
                  <Badge 
                    variant={policy.status === 'active' ? 'default' : 'secondary'}
                    className={`${policy.status === 'active' 
                      ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                      : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')
                    }`}
                  >
                    {policy.status}
                  </Badge>
                </div>
              </div>
              <CardDescription className={`${themeClasses.secondaryText} text-sm leading-relaxed`}>
                {policy.description || `${policy.type.charAt(0).toUpperCase() + policy.type.slice(1)} policy version ${policy.version}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className={`space-y-2 text-sm ${themeClasses.secondaryText} mb-4`}>
                <div className="flex items-center justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Type:</span>
                  <span className={themeClasses.accentText}>{policyTypes.find(pt => pt.value === policy.type)?.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Version:</span>
                  <span className={themeClasses.accentText}>{policy.version}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Modified:</span>
                  <span className={themeClasses.accentText}>{new Date(policy.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={`border-t ${themeClasses.borderLight} pt-4`}>
                <div className="flex flex-wrap gap-2">
                  {(policy.type === 'eula' || policy.type === 'privacy' || policy.type === 'refund') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/superadmin/policy-viewer/${policy.id}`, '_blank')}
                      className={`${isDarkMode ? 'text-green-400 border-green-700 hover:bg-green-900/20' : 'text-green-600 border-green-200 hover:bg-green-50'} transition-all duration-200`}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openDetailModal(policy)}
                      className={`${themeClasses.buttonSecondary} transition-all duration-200`}
                    >
                      <Eye className="mr-1 h-3 w-3" />
                      View
                    </Button>
                  )}
                  {(policy.type === 'eula' || policy.type === 'privacy' || policy.type === 'refund') ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`/admin/policy-editor/${policy.id}?adminKey=${adminKey}`, '_blank')}
                      className={`${isDarkMode ? 'text-blue-400 border-blue-700 hover:bg-blue-900/20' : 'text-blue-600 border-blue-200 hover:bg-blue-50'} transition-all duration-200`}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Visual Edit
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(policy)}
                      className={`${themeClasses.buttonSecondary} transition-all duration-200`}
                    >
                      <Edit className="mr-1 h-3 w-3" />
                      Edit
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDeleteModal(policy)}
                    className={`${isDarkMode ? 'text-red-400 hover:text-red-300 border-red-700 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50'} transition-all duration-200`}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPolicies.length === 0 && (
        <Card className={`${themeClasses.cardBackground} ${themeClasses.shadowClass} text-center py-12`}>
          <CardContent className="space-y-6">
            <div className={`mx-auto w-20 h-20 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'} rounded-full flex items-center justify-center`}>
              <FileText className={`h-10 w-10 ${themeClasses.mutedText}`} />
            </div>
            <div className="space-y-2">
              <h3 className={`text-xl font-semibold ${themeClasses.primaryText}`}>No policies found</h3>
              <p className={`text-base ${themeClasses.secondaryText} max-w-md mx-auto`}>
                {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' 
                  ? 'Try adjusting your filters to see more policies. You can clear filters above to view all documents.'
                  : 'Get started by creating your first policy document. These will be available in the Contact page Quick Access section.'
                }
              </p>
            </div>
            {!(searchTerm || statusFilter !== 'all' || typeFilter !== 'all') && (
              <Button 
                onClick={openCreateModal}
                className={`${themeClasses.buttonPrimary} ${themeClasses.shadowClass} transition-all duration-200 hover:scale-105`}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Policy
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enhanced Policy Detail Modal */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className={`max-w-4xl max-h-[80vh] overflow-y-auto ${themeClasses.modalBackground}`}>
          <DialogHeader>
            <DialogTitle className={`flex items-center space-x-2 ${themeClasses.primaryText}`}>
              {selectedPolicy && (
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-yellow-900/20' : 'bg-yellow-100'}`}>
                  {getPolicyTypeIcon(selectedPolicy.type)}
                </div>
              )}
              <span>{selectedPolicy?.title}</span>
            </DialogTitle>
            <DialogDescription className={themeClasses.secondaryText}>
              {selectedPolicy?.description || `${selectedPolicy?.type} policy version ${selectedPolicy?.version}`}
            </DialogDescription>
          </DialogHeader>
          {selectedPolicy && (
            <div className="space-y-6">
              <div className={`grid grid-cols-2 gap-4 text-sm p-4 rounded-lg ${themeClasses.gradientCard} border ${themeClasses.borderLight}`}>
                <div className="flex justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Type:</span>
                  <span className={themeClasses.accentText}>{policyTypes.find(pt => pt.value === selectedPolicy.type)?.label}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Status:</span>
                  <Badge 
                    variant={selectedPolicy.status === 'active' ? 'default' : 'secondary'}
                    className={`${selectedPolicy.status === 'active' 
                      ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-700')
                      : (isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600')
                    }`}
                  >
                    {selectedPolicy.status}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Version:</span>
                  <span className={themeClasses.accentText}>{selectedPolicy.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${themeClasses.mutedText} font-medium`}>Last Modified:</span>
                  <span className={themeClasses.accentText}>{new Date(selectedPolicy.lastModified).toLocaleDateString()}</span>
                </div>
              </div>
              <div className={`border-t ${themeClasses.borderLight} pt-4`}>
                <h4 className={`font-semibold mb-3 ${themeClasses.primaryText} flex items-center`}>
                  <FileText className="w-4 h-4 mr-2" />
                  Policy Content
                </h4>
                <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'} p-4 rounded-lg max-h-96 overflow-y-auto border`}>
                  <pre className={`whitespace-pre-wrap text-sm ${themeClasses.primaryText} leading-relaxed`}>{selectedPolicy.content}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Edit Policy Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className={`max-w-3xl max-h-[80vh] overflow-y-auto ${themeClasses.modalBackground}`}>
          <DialogHeader>
            <DialogTitle className={`${themeClasses.primaryText} flex items-center`}>
              <Edit className="w-5 h-5 mr-2" />
              Edit Policy
            </DialogTitle>
            <DialogDescription className={themeClasses.secondaryText}>
              Update the policy content and settings
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdatePolicy} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-title" className={`${themeClasses.accentText} font-medium`}>Title</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-type" className={`${themeClasses.accentText} font-medium`}>Policy Type</Label>
                <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value as Policy['type'] })}>
                  <SelectTrigger className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={themeClasses.modalBackground}>
                    {policyTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value} className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}>
                        <div className="flex items-center">
                          <type.icon className="w-4 h-4 mr-2" />
                          {type.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-version" className={`${themeClasses.accentText} font-medium`}>Version</Label>
                <Input
                  id="edit-version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-status" className={`${themeClasses.accentText} font-medium`}>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Policy['status'] })}>
                  <SelectTrigger className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={themeClasses.modalBackground}>
                    {statusOptions.map((status) => (
                      <SelectItem key={status.value} value={status.value} className={`${themeClasses.primaryText} hover:${themeClasses.hoverBackground}`}>
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-description" className={`${themeClasses.accentText} font-medium`}>Description</Label>
              <Input
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this policy"
                className={`${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
              />
            </div>
            <div>
              <Label htmlFor="edit-content" className={`${themeClasses.accentText} font-medium`}>Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Enter the full policy content here..."
                className={`min-h-[200px] ${themeClasses.inputBackground} ${themeClasses.inputFocus}`}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className={themeClasses.buttonSecondary}>
                Cancel
              </Button>
              <Button type="submit" className={`${themeClasses.buttonPrimary} transition-all duration-200 hover:scale-105`}>
                Update Policy
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md mx-auto">
          <div className="flex flex-col items-center text-center space-y-4 p-6">
            {/* Warning Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <AlertTriangle className="w-10 h-10 text-white" />
            </div>
            
            {/* Title */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Delete Policy?
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                Are you sure you want to delete this policy? This action cannot be undone.
              </p>
            </div>

            {/* Policy Info Card */}
            {policyToDelete && (
              <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    {getPolicyTypeIcon(policyToDelete.type)}
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {policyToDelete.title}
                    </h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                      <Badge variant={policyToDelete.status === 'active' ? 'default' : 'secondary'}>
                        {policyToDelete.status}
                      </Badge>
                      <span>•</span>
                      <span>Version {policyToDelete.version}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warning Message */}
            <div className="w-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">Warning</p>
                  <p>This will permanently delete the policy and all its versions. Users will no longer be able to access this policy content.</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 w-full pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 h-12 text-gray-700 border-gray-300 hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                disabled={isDeleting}
              >
                <Ban className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleDeletePolicy}
                disabled={isDeleting}
                className="flex-1 h-12 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg transform transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:transform-none"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Forever
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}