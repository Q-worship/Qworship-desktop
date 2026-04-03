import React, { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { ArrowLeft, MessageSquare, Scale, Users, Shield, Download, AlertTriangle, Mail, Send, Database, UserCheck, RotateCcw, CheckCircle, Clock, CreditCard, AlertCircle, Calendar, Eye, Lock } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import worshipImage from "@assets/Group 1171275221 1_1753809462960.png";

interface Policy {
  id: number;
  title: string;
  type: string;
  content: string;
  status: string;
  version: string;
  description: string;
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

export default function PolicyViewer() {
  const [, params] = useRoute('/superadmin/policy-viewer/:id');
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [sections, setSections] = useState<PolicySection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const adminKey = 'qworship-superadmin-2025';

  // Policy type configurations matching frontend designs
  const policyConfigs = {
    privacy: {
      icon: Shield,
      colorClass: '#fd348f',
      sections: [
        { id: 'information-collect', title: 'Information We Collect', icon: Database, colorClass: '#fd348f' },
        { id: 'data-usage', title: 'How We Use Your Data', icon: Eye, colorClass: '#10b981' },
        { id: 'data-protection', title: 'Data Protection & Security', icon: Lock, colorClass: '#3b82f6' },
        { id: 'user-rights', title: 'Your Rights & Controls', icon: UserCheck, colorClass: '#f59e0b' },
        { id: 'third-parties', title: 'Third-Party Services', icon: Users, colorClass: '#8b5cf6' },
        { id: 'contact-privacy', title: 'Contact Privacy Team', icon: Mail, colorClass: '#ef4444' }
      ]
    },
    refund: {
      icon: RotateCcw,
      colorClass: '#4ECDC4',
      sections: [
        { id: 'money-back', title: '30-Day Money-Back Guarantee', icon: CheckCircle, colorClass: '#4ECDC4' },
        { id: 'refund-process', title: 'Refund Process', icon: Clock, colorClass: '#10b981' },
        { id: 'payment-methods', title: 'Payment Methods', icon: CreditCard, colorClass: '#3b82f6' },
        { id: 'special-circumstances', title: 'Special Circumstances', icon: AlertCircle, colorClass: '#f59e0b' },
        { id: 'non-refundable', title: 'Non-Refundable Items', icon: Calendar, colorClass: '#ef4444' },
        { id: 'contact-billing', title: 'Contact Billing Team', icon: Mail, colorClass: '#8b5cf6' }
      ]
    },
    eula: {
      icon: MessageSquare,
      colorClass: '#7a5af8',
      sections: [
        { id: 'license-grant', title: 'License Grant', icon: Scale, colorClass: '#7a5af8' },
        { id: 'usage-restrictions', title: 'Usage Restrictions', icon: AlertTriangle, colorClass: '#f59e0b' },
        { id: 'user-responsibilities', title: 'User Responsibilities', icon: Users, colorClass: '#10b981' },
        { id: 'data-protection', title: 'Data Protection', icon: Shield, colorClass: '#3b82f6' },
        { id: 'termination', title: 'Termination', icon: Download, colorClass: '#ef4444' },
        { id: 'contact', title: 'Contact Information', icon: Mail, colorClass: '#8b5cf6' }
      ]
    }
  };

  const parseContentIntoSections = (content: string, policyType: string): PolicySection[] => {
    const config = policyConfigs[policyType as keyof typeof policyConfigs];
    if (!config) return [];

    // For demo purposes, split content into sections based on the configuration
    const contentParts = content.split('\n\n').filter(part => part.trim());
    
    return config.sections.map((section, index) => ({
      ...section,
      content: contentParts[index] || `Content for ${section.title} section will be displayed here. This section covers important aspects of our ${section.title.toLowerCase()} policies and procedures.`
    }));
  };

  useEffect(() => {
    if (params?.id) {
      fetchPolicy(params.id);
    }
  }, [params?.id]);

  const fetchPolicy = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/policies/${id}?adminKey=${adminKey}`);
      if (response.ok) {
        const policyData = await response.json();
        setPolicy(policyData);
        
        // Parse content into sections
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

  const goBack = () => {
    window.history.back();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-[#7a5af8] border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading policy...</p>
        </div>
      </div>
    );
  }

  if (!policy) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Policy Not Found</h2>
          <p className="text-gray-600 mb-4">The requested policy could not be found.</p>
          <Button onClick={goBack} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  const config = policyConfigs[policy.type as keyof typeof policyConfigs];
  const IconComponent = config?.icon || MessageSquare;

  return (
    <div className="min-h-screen bg-white">
      {/* Header - Exactly like EndUserLicense.tsx */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 md:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div 
              onClick={goBack}
              className="flex items-center text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="[font-family:'Lufga-Medium',Helvetica] font-medium">Back to Policies</span>
            </div>
            <div className="flex items-center">
              <IconComponent className="w-6 h-6 text-[#7a5af8] mr-2" />
              <span className="[font-family:'Lufga-Bold',Helvetica] font-bold text-xl text-gray-900">{policy.title}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Exactly like EndUserLicense.tsx */}
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-12">
        <div>
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg" style={{
              background: `linear-gradient(135deg, ${config.colorClass}, ${config.colorClass}dd)`
            }}>
              <IconComponent className="w-10 h-10 text-white" />
            </div>
            <h1 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-4xl md:text-5xl text-gray-900 mb-4">
              {policy.title}
            </h1>
            <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-lg text-gray-600 max-w-2xl mx-auto">
              {policy.description || `This ${policy.title.toLowerCase()} outlines the terms and conditions for using Q-worship software and services. Please read carefully before using our platform.`}
            </p>
          </div>

          {/* Policy Content Sections - Matching EndUserLicense.tsx structure */}
          <div className="space-y-12">
            {sections.map((section) => {
              const SectionIcon = section.icon;
              const colorClass = section.colorClass.replace(/\[|\]/g, '');
              
              return (
                <section key={section.id}>
                  <div className="flex items-center mb-6">
                    <SectionIcon className="w-6 h-6 mr-3" style={{ color: colorClass }} />
                    <h2 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900">{section.title}</h2>
                  </div>
                  <div 
                    className="rounded-xl p-8 border-2" 
                    style={{ 
                      backgroundColor: `${colorClass}15`, 
                      borderColor: `${colorClass}40` 
                    }}
                  >
                    <div className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 leading-relaxed whitespace-pre-wrap">
                      {section.content}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>

          {/* Bottom CTA - Similar to EndUserLicense.tsx */}
          <div className="mt-16 text-center bg-gradient-to-r from-gray-50 to-white rounded-2xl p-8 border border-gray-200">
            <div className="max-w-2xl mx-auto">
              <h3 className="[font-family:'Lufga-Bold',Helvetica] font-bold text-2xl text-gray-900 mb-4">
                Questions About This Policy?
              </h3>
              <p className="[font-family:'Lufga-Regular',Helvetica] font-normal text-gray-600 mb-6">
                Our legal team is here to help clarify any aspects of this agreement and ensure your complete understanding.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  className="bg-[#7a5af8] hover:bg-[#6949e8] text-white px-6 py-3"
                  onClick={goBack}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Policies
                </Button>
                <Button 
                  variant="outline"
                  className="border-[#7a5af8] text-[#7a5af8] hover:bg-[#7a5af8] hover:text-white px-6 py-3"
                  onClick={() => window.open('/contact', '_blank')}
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Contact Legal Team 
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}