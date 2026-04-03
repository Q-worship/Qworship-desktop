import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Scale, Shield, RefreshCw, Cookie, FileText, Save, Eye, AlertTriangle, Database, UserCheck, Users, Mail, CheckCircle, Clock, CreditCard, AlertCircle, Calendar, Download, Lock } from 'lucide-react';
import { useLocation, useRoute } from 'wouter';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

interface PolicySection {
  id: string;
  title: string;
  content: string;
  icon: any;
  colorClass: string;
}

export default function PolicyEditor() {
  const [, params] = useRoute('/admin/policy-editor/:id');
  const [, setLocation] = useLocation();
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const { toast } = useToast();
  
  const adminKey = new URLSearchParams(window.location.search).get('adminKey') || 'qworship-superadmin-2025';

  const policyTypeConfig = {
    privacy: {
      icon: Shield,
      title: 'Privacy Policy',
      description: 'Data protection and privacy information',
      colorClass: '#fd348f'
    },
    refund: {
      icon: RefreshCw,
      title: 'Refund Policy',
      description: 'Terms and conditions for refunds',
      colorClass: '#4ECDC4'
    },
    eula: {
      icon: MessageSquare,
      title: 'End User License Agreement',
      description: 'Software usage terms and conditions',
      colorClass: '#7a5af8'
    },
    terms: {
      icon: FileText,
      title: 'Terms of Service',
      description: 'Service usage terms and conditions',
      colorClass: '#fd348f'
    },
    cookies: {
      icon: Cookie,
      title: 'Cookie Policy',
      description: 'Information about cookie usage',
      colorClass: '#FFA726'
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchPolicy(params.id);
    }
  }, [params?.id]);

  const fetchPolicy = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/policies/${id}?adminKey=${adminKey}`);
      if (response.ok) {
        const policyData = await response.json();
        setPolicy(policyData);
        
        // Parse content into sections (assuming content is structured with section headers)
        const contentSections = parseContentIntoSections(policyData.content, policyData.type);
        setSections(contentSections);
      } else {
        toast({
          title: "Error",
          description: "Failed to load policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching policy:', error);
      toast({
        title: "Error",
        description: "Failed to load policy",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const parseContentIntoSections = (content: string, type: string): PolicySection[] => {
    // Default sections based on policy type - matching frontend designs
    const defaultSections = {
      privacy: [
        { id: 'information-collect', title: 'Information We Collect', icon: Database, colorClass: '#fd348f' },
        { id: 'data-usage', title: 'How We Use Your Data', icon: Eye, colorClass: '#10b981' },
        { id: 'data-protection', title: 'Data Protection & Security', icon: Lock, colorClass: '#3b82f6' },
        { id: 'user-rights', title: 'Your Rights & Controls', icon: UserCheck, colorClass: '#f59e0b' },
        { id: 'third-parties', title: 'Third-Party Services', icon: Users, colorClass: '#8b5cf6' },
        { id: 'contact-privacy', title: 'Contact Privacy Team', icon: Mail, colorClass: '#ef4444' }
      ],
      refund: [
        { id: 'money-back', title: '30-Day Money-Back Guarantee', icon: CheckCircle, colorClass: '#4ECDC4' },
        { id: 'refund-process', title: 'Refund Process', icon: Clock, colorClass: '#10b981' },
        { id: 'payment-methods', title: 'Payment Methods', icon: CreditCard, colorClass: '#3b82f6' },
        { id: 'special-circumstances', title: 'Special Circumstances', icon: AlertCircle, colorClass: '#f59e0b' },
        { id: 'non-refundable', title: 'Non-Refundable Items', icon: Calendar, colorClass: '#ef4444' },
        { id: 'contact-billing', title: 'Contact Billing Team', icon: Mail, colorClass: '#8b5cf6' }
      ],
      eula: [
        { id: 'license-grant', title: 'License Grant', icon: Scale, colorClass: '#7a5af8' },
        { id: 'usage-restrictions', title: 'Usage Restrictions', icon: AlertTriangle, colorClass: '#f59e0b' },
        { id: 'user-responsibilities', title: 'User Responsibilities', icon: Users, colorClass: '#10b981' },
        { id: 'data-protection', title: 'Data Protection', icon: Shield, colorClass: '#3b82f6' },
        { id: 'termination', title: 'Termination', icon: Download, colorClass: '#ef4444' },
        { id: 'contact', title: 'Contact Information', icon: Mail, colorClass: '#8b5cf6' }
      ]
    };

    const typeDefault = defaultSections[type as keyof typeof defaultSections] || defaultSections.eula;
    
    // Try to split content by sections or use default structure
    if (content.includes('##') || content.includes('#')) {
      // Content has section headers
      const lines = content.split('\n');
      const parsedSections: PolicySection[] = [];
      let currentSection: PolicySection | null = null;
      
      lines.forEach((line, index) => {
        if (line.startsWith('## ') || line.startsWith('# ')) {
          if (currentSection) {
            parsedSections.push(currentSection);
          }
          const title = line.replace(/^#+\s/, '');
          const defaultSection = typeDefault.find((s: any) => s.title.toLowerCase().includes(title.toLowerCase().split(' ')[0])) || typeDefault[0];
          currentSection = {
            id: title.toLowerCase().replace(/\s+/g, '-'),
            title,
            content: '',
            icon: defaultSection.icon,
            colorClass: defaultSection.colorClass
          };
        } else if (currentSection && line.trim()) {
          currentSection.content += line + '\n';
        }
      });
      
      if (currentSection) {
        parsedSections.push(currentSection);
      }
      
      return parsedSections.length > 0 ? parsedSections : typeDefault.map((s: any) => ({ ...s, content: content }));
    } else {
      // No section headers, use default structure with content
      return typeDefault.map((section: any, index: number) => ({
        ...section,
        content: index === 0 ? content : ''
      }));
    }
  };

  const handleSectionUpdate = (sectionId: string, newContent: string) => {
    setSections(prev => prev.map(section => 
      section.id === sectionId 
        ? { ...section, content: newContent }
        : section
    ));
  };

  const handleSave = async () => {
    if (!policy) return;
    
    setIsSaving(true);
    try {
      // Combine sections back into content
      const combinedContent = sections.map(section => 
        `## ${section.title}\n\n${section.content}\n`
      ).join('\n');

      const response = await fetch(`/api/admin/policies/${policy.id}?adminKey=${adminKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...policy,
          content: combinedContent,
          lastModified: new Date().toISOString()
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Policy updated successfully",
        });
        // Refresh the policy data
        fetchPolicy(params?.id || '');
      } else {
        toast({
          title: "Error",
          description: "Failed to save policy",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      toast({
        title: "Error",
        description: "Failed to save policy",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const config = policy ? policyTypeConfig[policy.type] : null;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-yellow-400"></div>
      </div>
    );
  }

  if (!policy || !config) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Policy Not Found</h1>
          <Button onClick={() => setLocation('/admin/policies')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Policies
          </Button>
        </div>
      </div>
    );
  }

  const IconComponent = config.icon;

  return (
    <div className="min-h-screen bg-white">
      {/* Header - matches frontend design */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Button
              variant="ghost"
              onClick={() => setLocation('/admin/policies')}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="[font-family:'Lufga-Medium',Helvetica] font-medium">Back to Policies</span>
            </Button>
            <div className="flex items-center">
              <IconComponent className={`w-6 h-6 text-${config.colorClass} mr-2`} />
              <span className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl text-gray-900">{config.title} Editor</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsPreviewMode(!isPreviewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {isPreviewMode ? 'Edit' : 'Preview'}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-yellow-500 hover:bg-yellow-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        {/* Policy Info Section */}
        <div className="mb-8">
          <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg" style={{
                    background: `linear-gradient(135deg, ${config.colorClass.replace(/\[|\]/g, '')}, ${config.colorClass.replace(/\[|\]/g, '')})`
                  }}>
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">{policy.title}</h1>
                    <p className="[font-family:'Lufga-Regular',Helvetica] text-gray-600">{policy.description || config.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={policy.status === 'active' ? 'default' : 'secondary'}>
                    {policy.status}
                  </Badge>
                  <div className="text-sm text-gray-500 mt-1">Version {policy.version}</div>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">Policy Type</Label>
                  <Select value={policy.type} onValueChange={(value) => setPolicy({...policy, type: value as Policy['type']})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="privacy">Privacy Policy</SelectItem>
                      <SelectItem value="refund">Refund Policy</SelectItem>
                      <SelectItem value="eula">End User License Agreement</SelectItem>
                      <SelectItem value="terms">Terms of Service</SelectItem>
                      <SelectItem value="cookies">Cookie Policy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">Status</Label>
                  <Select value={policy.status} onValueChange={(value) => setPolicy({...policy, status: value as Policy['status']})}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="[font-family:'Lufga-Medium',Helvetica] font-medium">Version</Label>
                  <Input 
                    value={policy.version}
                    onChange={(e) => setPolicy({...policy, version: e.target.value})}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Sections - matches frontend design */}
        <div className="space-y-12">
          {isPreviewMode ? (
            // Preview Mode - render like frontend
            sections.map((section) => {
              const SectionIcon = section.icon;
              const colorClass = section.colorClass.replace(/\[|\]/g, '');
              return (
                <section key={section.id}>
                  <div className="flex items-center mb-6">
                    <SectionIcon className={`w-6 h-6 mr-3`} style={{ color: colorClass }} />
                    <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">{section.title}</h2>
                  </div>
                  <div className="rounded-xl p-8 border-2" style={{ 
                    backgroundColor: `${colorClass}15`, 
                    borderColor: `${colorClass}40` 
                  }}>
                    <div className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                </section>
              );
            })
          ) : (
            // Edit Mode - editable sections
            sections.map((section) => {
              const SectionIcon = section.icon;
              const colorClass = section.colorClass.replace(/\[|\]/g, '');
              return (
                <Card key={section.id} className="border-2 border-gray-200 hover:border-gray-300 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <SectionIcon className="w-6 h-6 mr-3" style={{ color: colorClass }} />
                      <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl text-gray-900">{section.title}</h3>
                    </div>
                    <Textarea
                      value={section.content}
                      onChange={(e) => handleSectionUpdate(section.id, e.target.value)}
                      placeholder={`Enter content for ${section.title}...`}
                      className="min-h-[200px] [font-family:'Lufga-Regular',Helvetica] font-normal"
                    />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Add Section Button */}
        {!isPreviewMode && (
          <div className="mt-8 text-center">
            <Button
              variant="outline"
              onClick={() => {
                const newSection: PolicySection = {
                  id: `section-${Date.now()}`,
                  title: 'New Section',
                  content: '',
                  icon: FileText,
                  colorClass: config.colorClass
                };
                setSections([...sections, newSection]);
              }}
              className="[font-family:'Lufga-Medium',Helvetica] font-medium"
            >
              <FileText className="w-4 h-4 mr-2" />
              Add New Section
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}