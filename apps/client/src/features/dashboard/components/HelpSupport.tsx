import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  ArrowLeft, 
  MessageSquare, 
  Mail, 
  Phone, 
  Video, 
  Clock,
  User,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Users
} from "lucide-react";

interface SupportTicket {
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
}

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  helpful?: number;
  notHelpful?: number;
}

import { HelpArticle, articleMap } from "../data/helpArticles";

interface ResourceLink {
  id: string;
  title: string;
  description: string;
  url: string;
  category: string;
  icon?: string;
}

export const HelpSupport: React.FC = () => {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [activeTab, setActiveTab] = useState("help-articles");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showContactForm, setShowContactForm] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<HelpArticle | null>(null);
  const [ticketForm, setTicketForm] = useState<SupportTicket>({
    subject: "",
    message: "",
    priority: "medium",
    category: "general"
  });

  // Fetch data from API
  const { data: articlesData, isLoading: articlesLoading } = useQuery({
    queryKey: ['/api/help/articles'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/help/articles');
      return await response.json();
    }
  });

  const { data: faqsData, isLoading: faqsLoading } = useQuery({
    queryKey: ['/api/help/faqs'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/help/faqs');
      return await response.json();
    }
  });

  const { data: resourcesData, isLoading: resourcesLoading } = useQuery({
    queryKey: ['/api/help/resources'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/help/resources');
      return await response.json();
    }
  });

  // Use API data with fallback to empty arrays
  const helpArticles = articlesData?.articles || [];
  const faqData = faqsData?.faqs || [];
  const resourceLinks = resourcesData?.resources || [];

  // Handle URL parameters for direct article access
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const articleParam = urlParams.get('article');
    
    if (articleParam) {
      const targetArticle = articleMap[articleParam];
      if (targetArticle) {
        setSelectedArticle(targetArticle);
        setActiveTab("help-articles");
      }
    }
  }, []);

  // Submit support ticket mutation
  const submitTicketMutation = useMutation({
    mutationFn: async (ticket: SupportTicket) => {
      const response = await apiRequest('POST', '/api/support-tickets', ticket);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Support Ticket Submitted Successfully",
        description: data.message || "A member of our team will be in touch shortly.",
      });
      setShowContactForm(false);
      setTicketForm({
        subject: "",
        message: "",
        priority: "medium",
        category: "general"
      });
    },
    onError: () => {
      toast({
        title: "Submission Failed",
        description: "Unable to submit your request. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Categories for filtering
  const categories = [
    { value: "all", label: "All Topics" },
    { value: "bible-companion", label: "Bible Companion" },
    { value: "billing", label: "Billing & Plans" },
    { value: "presentations", label: "Presentations" },
    { value: "organization", label: "Organization" },
    { value: "troubleshooting", label: "Troubleshooting" },
    { value: "technical", label: "Technical" }
  ];

  // Contact options for support
  const contactOptions = [
    {
      icon: MessageSquare,
      title: "Live Chat",
      description: "Get instant help from our support team",
      action: () => {
        // Start live chat session
        toast({
          title: "Starting Live Chat",
          description: "Connecting you to our support team...",
        });
        
        // Simulate chat widget initialization
        setTimeout(() => {
          // In a real implementation, this would open a chat widget
          // For now, we'll open the contact form as fallback
          setShowContactForm(true);
          toast({
            title: "Live Chat Available",
            description: "Use the form below or call us directly for immediate assistance.",
          });
        }, 1500);
      }
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message about your issue",
      action: () => {
        // Pre-fill contact form for email support
        setTicketForm({
          ...ticketForm,
          category: "general",
          subject: "Email Support Request"
        });
        setShowContactForm(true);
        toast({
          title: "Email Support",
          description: "Fill out the form below and we'll respond within 24 hours.",
        });
      }
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with a support representative",
      action: () => {
        // Enhanced phone support with business hours info
        const now = new Date();
        const currentHour = now.getHours();
        const isWeekday = now.getDay() >= 1 && now.getDay() <= 5;
        const isBusinessHours = isWeekday && currentHour >= 9 && currentHour < 17;
        
        if (isBusinessHours) {
          toast({
            title: "Calling Q-worship Support",
            description: "We're available now! Connecting you to: 1-800-QWORSHIP",
          });
          window.open("tel:+1-800-QWORSHIP", "_blank");
        } else {
          toast({
            title: "Phone Support Hours",
            description: "We're available Mon-Fri 9AM-5PM EST. You can still call and leave a message, or use our email support.",
          });
          window.open("tel:+1-800-QWORSHIP", "_blank");
        }
      }
    },
    {
      icon: Video,
      title: "Schedule Demo",
      description: "Book a personalized walkthrough session",
      action: () => {
        toast({
          title: "Opening Scheduling Calendar",
          description: "Book your personalized Q-worship demo session.",
        });
        
        // Check if we can detect user's timezone for better scheduling
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const schedulingUrl = `https://calendly.com/qworship-demo?timezone=${encodeURIComponent(userTimezone)}`;
        
        setTimeout(() => {
          window.open(schedulingUrl, "_blank");
        }, 500);
      }
    }
  ];

  const filteredFAQs = faqData.filter((faq: FAQItem) => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredArticles = helpArticles.filter((article: HelpArticle) => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         article.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredResources = resourceLinks.filter((resource: ResourceLink) => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedArticle(null)}
              className="text-purple-300 hover:text-white hover:bg-purple-800/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Help Center
            </Button>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 border border-purple-500/20 rounded-xl p-8 backdrop-blur-sm">
            <div className="flex items-start gap-4 mb-6">
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2 text-white">{selectedArticle.title}</h1>
                <p className="text-purple-200 text-lg mb-4">{selectedArticle.description}</p>
                <div className="flex items-center gap-4 text-sm text-purple-300">
                  {selectedArticle.readTime && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {selectedArticle.readTime}
                    </div>
                  )}
                  {selectedArticle.difficulty && (
                    <Badge variant="secondary" className="bg-purple-800/30 text-purple-200 border-purple-600/30">
                      {selectedArticle.difficulty}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="prose prose-invert prose-purple max-w-none">
              <div 
                className="text-gray-200 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: selectedArticle.content.replace(/\n/g, '<br/>').replace(/##/g, '<h2 class="text-xl font-bold text-purple-300 mt-6 mb-4">').replace(/<h2/g, '</p><h2').replace(/###/g, '<h3 class="text-lg font-semibold text-purple-200 mt-4 mb-2">').replace(/<h3/g, '</p><h3').replace(/####/g, '<h4 class="text-base font-medium text-purple-100 mt-3 mb-2">').replace(/<h4/g, '</p><h4').replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-white">$1</strong>').replace(/- \*\*(.*?)\*\*:/g, '<li class="mb-1"><strong class="text-purple-200">$1</strong>:').replace(/- (.*?)$/gm, '<li class="mb-1">$1</li>').replace(/^\s*-/gm, '<ul class="list-disc pl-6 mb-4"><li>').replace(/<\/li>\n<li>/g, '</li><li>').replace(/<li>(.*?)<\/li>$/g, '<li>$1</li></ul>') 
                }}
              />
            </div>

            {selectedArticle.tags && selectedArticle.tags.length > 0 && (
              <div className="mt-8 pt-6 border-t border-purple-500/20">
                <h3 className="text-sm font-medium text-purple-300 mb-3">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedArticle.tags.map((tag) => (
                    <Badge key={tag} variant="outline" className="text-purple-200 border-purple-600/30 hover:bg-purple-800/20">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-purple-500/20">
              <h3 className="text-sm font-medium text-purple-300 mb-4">Was this article helpful?</h3>
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-green-400 border-green-600/30 hover:bg-green-800/20"
                >
                  <ThumbsUp className="w-4 h-4 mr-2" />
                  Yes ({selectedArticle.helpful || 0})
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-red-400 border-red-600/30 hover:bg-red-800/20"
                >
                  <ThumbsDown className="w-4 h-4 mr-2" />
                  No ({selectedArticle.notHelpful || 0})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-gray-950 to-black text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
            Help & Support Center
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Find answers, get support, and learn how to make the most of Q-worship
          </p>
        </div>

        {/* Search and Filters */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for help articles, FAQs, or topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-900/50 border-purple-500/30 text-white placeholder-purple-300 focus:border-purple-400"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-48 bg-gray-900/50 border-purple-500/30 text-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-gray-900 border-purple-500/30">
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value} className="text-white hover:bg-purple-800/20">
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900/50 border-purple-500/30 p-1 rounded-lg h-12">
              <TabsTrigger 
                value="help-articles"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all h-10"
              >
                <BookOpen className="w-4 h-4" />
                <span className="hidden sm:inline">Articles</span>
              </TabsTrigger>
              <TabsTrigger 
                value="faq"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all h-10"
              >
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline">FAQ</span>
              </TabsTrigger>
              <TabsTrigger 
                value="resources"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all h-10"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger 
                value="contact"
                className="data-[state=active]:bg-purple-600 data-[state=active]:text-white text-purple-300 flex items-center justify-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all h-10"
              >
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Contact</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="help-articles" className="mt-8">
              {articlesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-300">Loading help articles...</p>
                </div>
              ) : filteredArticles.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No articles found</h3>
                  <p className="text-purple-300">Try adjusting your search terms or category filter.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article: HelpArticle) => (
                    <Card 
                      key={article.id}
                      className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 border border-purple-500/20 hover:border-purple-400/40 transition-colors cursor-pointer backdrop-blur-sm"
                      onClick={() => setSelectedArticle(article)}
                    >
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{article.title}</CardTitle>
                        <CardDescription className="text-purple-200">
                          {article.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-purple-300 mb-4">
                          {article.readTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {article.readTime}
                            </div>
                          )}
                          {article.difficulty && (
                            <Badge variant="secondary" className="bg-purple-800/30 text-purple-200 border-purple-600/30">
                              {article.difficulty}
                            </Badge>
                          )}
                        </div>
                        {article.tags && (
                          <div className="flex flex-wrap gap-1 mb-4">
                            {article.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs text-purple-300 border-purple-600/30">
                                {tag}
                              </Badge>
                            ))}
                            {article.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs text-purple-300 border-purple-600/30">
                                +{article.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-purple-400">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className="w-3 h-3" />
                            {article.helpful || 0}
                          </div>
                          <div className="flex items-center gap-1">
                            <ThumbsDown className="w-3 h-3" />
                            {article.notHelpful || 0}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="faq" className="mt-8">
              {faqsLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-300">Loading frequently asked questions...</p>
                </div>
              ) : filteredFAQs.length === 0 ? (
                <div className="text-center py-12">
                  <HelpCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No FAQs found</h3>
                  <p className="text-purple-300">Try adjusting your search terms or category filter.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredFAQs.map((faq: FAQItem) => (
                    <Card key={faq.id} className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 border border-purple-500/20 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">{faq.question}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-purple-200 mb-4">{faq.answer}</p>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-purple-300 border-purple-600/30">
                            {faq.category}
                          </Badge>
                          <div className="flex items-center gap-4 text-xs text-purple-400">
                            <div className="flex items-center gap-1">
                              <ThumbsUp className="w-3 h-3" />
                              {faq.helpful || 0}
                            </div>
                            <div className="flex items-center gap-1">
                              <ThumbsDown className="w-3 h-3" />
                              {faq.notHelpful || 0}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="mt-8">
              {resourcesLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-purple-300">Loading resources...</p>
                </div>
              ) : filteredResources.length === 0 ? (
                <div className="text-center py-12">
                  <ExternalLink className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No resources found</h3>
                  <p className="text-purple-300">Try adjusting your search terms or category filter.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredResources.map((resource: ResourceLink) => (
                    <Card 
                      key={resource.id}
                      className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 border border-purple-500/20 hover:border-purple-400/40 transition-colors cursor-pointer backdrop-blur-sm relative"
                      onClick={() => window.open(resource.url, "_blank")}
                    >
                      {/* Coming Soon Badge */}
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 text-xs font-medium shadow-lg">
                          Coming Soon
                        </Badge>
                      </div>
                      
                      <CardHeader>
                        <CardTitle className="text-white text-lg flex items-center gap-2">
                          {resource.title}
                          <ExternalLink className="w-4 h-4" />
                        </CardTitle>
                        <CardDescription className="text-purple-200">
                          {resource.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Badge variant="outline" className="text-purple-300 border-purple-600/30">
                          {resource.category}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="contact" className="mt-8">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                  {contactOptions.map((option) => (
                    <Card 
                      key={option.title}
                      className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 border border-purple-500/20 hover:border-purple-400/40 transition-colors cursor-pointer backdrop-blur-sm"
                      onClick={option.action}
                    >
                      <CardHeader className="text-center">
                        <div className="mx-auto w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-4">
                          <option.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle className="text-white">{option.title}</CardTitle>
                        <CardDescription className="text-purple-200">
                          {option.description}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  ))}
                </div>

                <Card className="bg-gradient-to-br from-purple-900/20 to-gray-900/40 border border-purple-500/20 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white text-2xl">Send us a message</CardTitle>
                    <CardDescription className="text-purple-200">
                      Can't find what you're looking for? Send us a detailed message and we'll get back to you.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-purple-300 mb-2 block">Subject</label>
                        <Input
                          type="text"
                          value={ticketForm.subject}
                          onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                          className="bg-gray-900/50 border-purple-500/30 text-white placeholder-purple-400 focus:border-purple-400"
                          placeholder="Brief description of your issue"
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-purple-300 mb-2 block">Priority</label>
                        <Select 
                          value={ticketForm.priority} 
                          onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                            setTicketForm({...ticketForm, priority: value})
                          }
                        >
                          <SelectTrigger className="bg-gray-900/50 border-purple-500/30 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-900 border-purple-500/30">
                            <SelectItem value="low" className="text-white hover:bg-purple-800/20">Low</SelectItem>
                            <SelectItem value="medium" className="text-white hover:bg-purple-800/20">Medium</SelectItem>
                            <SelectItem value="high" className="text-white hover:bg-purple-800/20">High</SelectItem>
                            <SelectItem value="urgent" className="text-white hover:bg-purple-800/20">Urgent</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-purple-300 mb-2 block">Category</label>
                      <Select 
                        value={ticketForm.category} 
                        onValueChange={(value) => setTicketForm({...ticketForm, category: value})}
                      >
                        <SelectTrigger className="bg-gray-900/50 border-purple-500/30 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-purple-500/30">
                          <SelectItem value="general" className="text-white hover:bg-purple-800/20">General Support</SelectItem>
                          <SelectItem value="technical" className="text-white hover:bg-purple-800/20">Technical Issue</SelectItem>
                          <SelectItem value="billing" className="text-white hover:bg-purple-800/20">Billing & Account</SelectItem>
                          <SelectItem value="feature" className="text-white hover:bg-purple-800/20">Feature Request</SelectItem>
                          <SelectItem value="bug" className="text-white hover:bg-purple-800/20">Bug Report</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-purple-300 mb-2 block">Message</label>
                      <Textarea
                        value={ticketForm.message}
                        onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                        className="bg-gray-900/50 border-purple-500/30 text-white placeholder-purple-400 focus:border-purple-400 min-h-[120px]"
                        placeholder="Please provide as much detail as possible about your issue or question..."
                      />
                    </div>

                    <Button 
                      onClick={() => submitTicketMutation.mutate(ticketForm)}
                      disabled={submitTicketMutation.isPending || !ticketForm.subject || !ticketForm.message}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {submitTicketMutation.isPending ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Contact Form Modal */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="bg-gradient-to-br from-purple-900/95 to-gray-900/95 border border-purple-500/30 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-white">Contact Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-purple-300 mb-2 block">Subject</label>
                <Input
                  type="text"
                  value={ticketForm.subject}
                  onChange={(e) => setTicketForm({...ticketForm, subject: e.target.value})}
                  className="bg-gray-900/50 border-purple-500/30 text-white placeholder-purple-400 focus:border-purple-400"
                  placeholder="Brief description of your issue"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-purple-300 mb-2 block">Priority</label>
                <Select 
                  value={ticketForm.priority} 
                  onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => 
                    setTicketForm({...ticketForm, priority: value})
                  }
                >
                  <SelectTrigger className="bg-gray-900/50 border-purple-500/30 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-purple-500/30">
                    <SelectItem value="low" className="text-white hover:bg-purple-800/20">Low</SelectItem>
                    <SelectItem value="medium" className="text-white hover:bg-purple-800/20">Medium</SelectItem>
                    <SelectItem value="high" className="text-white hover:bg-purple-800/20">High</SelectItem>
                    <SelectItem value="urgent" className="text-white hover:bg-purple-800/20">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-purple-300 mb-2 block">Category</label>
              <Select 
                value={ticketForm.category} 
                onValueChange={(value) => setTicketForm({...ticketForm, category: value})}
              >
                <SelectTrigger className="bg-gray-900/50 border-purple-500/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-purple-500/30">
                  <SelectItem value="general" className="text-white hover:bg-purple-800/20">General Support</SelectItem>
                  <SelectItem value="technical" className="text-white hover:bg-purple-800/20">Technical Issue</SelectItem>
                  <SelectItem value="billing" className="text-white hover:bg-purple-800/20">Billing & Account</SelectItem>
                  <SelectItem value="feature" className="text-white hover:bg-purple-800/20">Feature Request</SelectItem>
                  <SelectItem value="bug" className="text-white hover:bg-purple-800/20">Bug Report</SelectItem>
                  <SelectItem value="live-chat" className="text-white hover:bg-purple-800/20">Live Chat Request</SelectItem>
                  <SelectItem value="demo" className="text-white hover:bg-purple-800/20">Demo Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-purple-300 mb-2 block">Message</label>
              <Textarea
                value={ticketForm.message}
                onChange={(e) => setTicketForm({...ticketForm, message: e.target.value})}
                className="bg-gray-900/50 border-purple-500/30 text-white placeholder-purple-400 focus:border-purple-400 min-h-[120px]"
                placeholder="Please provide as much detail as possible about your issue or question..."
              />
            </div>

            <div className="flex gap-4">
              <Button 
                onClick={() => submitTicketMutation.mutate(ticketForm)}
                disabled={submitTicketMutation.isPending || !ticketForm.subject || !ticketForm.message}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
              >
                {submitTicketMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  'Send Message'
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowContactForm(false)}
                className="border-purple-500/30 text-purple-300 hover:bg-purple-800/20"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};