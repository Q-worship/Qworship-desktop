import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  MapPin, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  Settings, 
  Bell, 
  Archive, 
  UserX, 
  Key, 
  Send, 
  Eye, 
  Edit, 
  Save, 
  X, 
  Crown, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  Target, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Users, 
  MessageSquare, 
  Headphones, 
  Mic, 
  ArrowLeft,
  ExternalLink,
  Download,
  Trash2,
  RotateCcw,
  Globe,
  Server,
  Database,
  Zap,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  CheckCircle2,
  Shield,
  Wrench
} from 'lucide-react';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  organization: {
    name: string;
    type: string;
    address: string;
    city: string;
    country: string;
    website: string;
    size: string;
    denomination: string;
    foundedYear: number;
    description: string;
  };
  subscription: {
    plan: string;
    status: string;
    startDate: string;
    endDate: string;
    nextBilling: string;
    amount: number;
    currency: string;
    paymentMethod: string;
  };
  activity: {
    lastLogin: string;
    totalLogins: number;
    accountCreated: string;
    presentationsCreated: number;
    bibleSearches: number;
    voiceCommands: number;
  };
  featureUsage: {
    bibleWidget: number;
    voiceNavigation: number;
    presentationBuilder: number;
    collaborativeTools: number;
    mobileApp: number;
  };
  supportRequests: number;
  notifications: {
    unread: number;
    total: number;
  };
  status: string;
  role: string;
}

interface UserProfileViewProps {
  userId: number;
  onClose: () => void;
  isDarkMode: boolean;
}

export default function UserProfileView({ userId, onClose, isDarkMode }: UserProfileViewProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [editMode, setEditMode] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');
  const [expandedNotifications, setExpandedNotifications] = useState<number[]>([]);
  const [showSendNotificationDialog, setShowSendNotificationDialog] = useState(false);
  const [selectedNotificationType, setSelectedNotificationType] = useState('');
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);

  const themeClasses = {
    cardBackground: isDarkMode 
      ? 'bg-gray-800/80 border-gray-700 text-gray-100' 
      : 'bg-white border-gray-200 text-gray-900',
    primaryText: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    mutedText: isDarkMode ? 'text-gray-400' : 'text-gray-500',
    border: isDarkMode ? 'border-gray-700' : 'border-gray-200',
    inputBackground: isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-gray-100' 
      : 'bg-white border-gray-300 text-gray-900',
    selectTrigger: isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600' 
      : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-50',
    selectContent: isDarkMode 
      ? 'bg-gray-800 border-gray-600' 
      : 'bg-white border-gray-200',
    buttonPrimary: isDarkMode 
      ? 'bg-blue-600 hover:bg-blue-700 text-white' 
      : 'bg-blue-600 hover:bg-blue-700 text-white',
    buttonSecondary: isDarkMode 
      ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border-gray-600' 
      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300'
  };

  // Fetch user profile data
  const { data: userProfile, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/user-profile', userId],
    queryFn: async () => {
      // Dynamic mock data based on userId - replace with actual API call
      const userProfiles: { [key: number]: UserProfile } = {
        1: {
          id: 1,
          name: 'Rev. James Carter',
          email: 'james@gracechurch.org',
          phone: '+1 (555) 234-5678',
          avatar: 'JC',
          organization: {
            name: 'Grace Community Church',
            type: 'Non-denominational',
            address: '123 Church Street',
            city: 'Nashville',
            country: 'United States',
            website: 'www.gracechurch.org',
            size: '500-1000 members',
            denomination: 'Non-denominational',
            foundedYear: 1985,
            description: 'A vibrant community church focused on worship, fellowship, and serving our local community through the love of Christ.'
          },
          subscription: {
            plan: 'Professional',
            status: 'Active',
            startDate: '2025-01-15',
            endDate: '2025-02-14',
            nextBilling: '2025-02-15',
            amount: 49.99,
            currency: 'USD',
            paymentMethod: '**** 1234'
          },
          activity: {
            lastLogin: '1 hour ago',
            totalLogins: 156,
            accountCreated: '2025-01-15',
            presentationsCreated: 23,
            bibleSearches: 87,
            voiceCommands: 45
          },
          featureUsage: {
            bibleWidget: 75,
            voiceNavigation: 68,
            presentationBuilder: 82,
            collaborativeTools: 28,
            mobileApp: 55
          },
          supportRequests: 1,
          notifications: {
            unread: 3,
            total: 15
          },
          status: 'Active',
          role: 'Pastor'
        },
        2: {
          id: 2,
          name: 'Pastor Sarah Wilson',
          email: 'sarah@faithhope.church',
          phone: '+1 (555) 345-6789',
          avatar: 'SW',
          organization: {
            name: 'Faith & Hope Ministry',
            type: 'Pentecostal',
            address: '456 Hope Avenue',
            city: 'Dallas',
            country: 'United States',
            website: 'www.faithhope.church',
            size: '1000+ members',
            denomination: 'Pentecostal',
            foundedYear: 1978,
            description: 'A Spirit-filled church committed to spreading hope and faith through dynamic worship and community outreach.'
          },
          subscription: {
            plan: 'Premium',
            status: 'Active',
            startDate: '2025-01-10',
            endDate: '2025-02-09',
            nextBilling: '2025-02-10',
            amount: 79.99,
            currency: 'USD',
            paymentMethod: '**** 5678'
          },
          activity: {
            lastLogin: '30 minutes ago',
            totalLogins: 289,
            accountCreated: '2025-01-10',
            presentationsCreated: 45,
            bibleSearches: 234,
            voiceCommands: 189
          },
          featureUsage: {
            bibleWidget: 92,
            voiceNavigation: 87,
            presentationBuilder: 95,
            collaborativeTools: 67,
            mobileApp: 78
          },
          supportRequests: 2,
          notifications: {
            unread: 7,
            total: 28
          },
          status: 'Active',
          role: 'Senior Pastor'
        },
        3: {
          id: 3,
          name: 'Dr. Michael Rodriguez',
          email: 'mike@newlife.church',
          phone: '+1 (555) 456-7890',
          avatar: 'MR',
          organization: {
            name: 'New Life Church',
            type: 'Baptist',
            address: '789 Life Way',
            city: 'Phoenix',
            country: 'United States',
            website: 'www.newlife.church',
            size: '100-500 members',
            denomination: 'Baptist',
            foundedYear: 1995,
            description: 'A growing Baptist church dedicated to nurturing new believers and strengthening families in Christ.'
          },
          subscription: {
            plan: 'Basic',
            status: 'Active',
            startDate: '2025-01-20',
            endDate: '2025-02-19',
            nextBilling: '2025-02-20',
            amount: 29.99,
            currency: 'USD',
            paymentMethod: '**** 9012'
          },
          activity: {
            lastLogin: '6 hours ago',
            totalLogins: 78,
            accountCreated: '2025-01-20',
            presentationsCreated: 12,
            bibleSearches: 45,
            voiceCommands: 23
          },
          featureUsage: {
            bibleWidget: 45,
            voiceNavigation: 38,
            presentationBuilder: 52,
            collaborativeTools: 15,
            mobileApp: 32
          },
          supportRequests: 0,
          notifications: {
            unread: 2,
            total: 8
          },
          status: 'Active',
          role: 'Pastor'
        },
        4: {
          id: 4,
          name: 'Rev. Lisa Thompson',
          email: 'lisa@unitychurch.net',
          phone: '+1 (555) 567-8901',
          avatar: 'LT',
          organization: {
            name: 'Unity Baptist Church',
            type: 'Baptist',
            address: '321 Unity Road',
            city: 'Atlanta',
            country: 'United States',
            website: 'www.unitychurch.net',
            size: '200-500 members',
            denomination: 'Baptist',
            foundedYear: 1962,
            description: 'A traditional Baptist church with a heart for unity, community service, and biblical teaching.'
          },
          subscription: {
            plan: 'Basic',
            status: 'Expired',
            startDate: '2024-12-28',
            endDate: '2025-01-27',
            nextBilling: null as string | null,
            amount: 29.99,
            currency: 'USD',
            paymentMethod: '**** 3456'
          },
          activity: {
            lastLogin: '5 days ago',
            totalLogins: 34,
            accountCreated: '2024-12-28',
            presentationsCreated: 8,
            bibleSearches: 28,
            voiceCommands: 12
          },
          featureUsage: {
            bibleWidget: 25,
            voiceNavigation: 18,
            presentationBuilder: 32,
            collaborativeTools: 8,
            mobileApp: 15
          },
          supportRequests: 1,
          notifications: {
            unread: 4,
            total: 12
          },
          status: 'Expired',
          role: 'Pastor'
        },
        5: {
          id: 5,
          name: 'Pastor David Kim',
          email: 'david@crossroads.church',
          phone: '+1 (555) 678-9012',
          avatar: 'DK',
          organization: {
            name: 'Crossroads Fellowship',
            type: 'Evangelical',
            address: '567 Crossroads Blvd',
            city: 'Seattle',
            country: 'United States',
            website: 'www.crossroads.church',
            size: '1000+ members',
            denomination: 'Evangelical',
            foundedYear: 1988,
            description: 'A dynamic evangelical church at the crossroads of faith and community, reaching out to transform lives through Christ.'
          },
          subscription: {
            plan: 'Premium',
            status: 'Active',
            startDate: '2025-01-05',
            endDate: '2025-02-04',
            nextBilling: '2025-02-05',
            amount: 79.99,
            currency: 'USD',
            paymentMethod: '**** 7890'
          },
          activity: {
            lastLogin: '15 minutes ago',
            totalLogins: 345,
            accountCreated: '2025-01-05',
            presentationsCreated: 67,
            bibleSearches: 456,
            voiceCommands: 289
          },
          featureUsage: {
            bibleWidget: 98,
            voiceNavigation: 95,
            presentationBuilder: 99,
            collaborativeTools: 87,
            mobileApp: 92
          },
          supportRequests: 0,
          notifications: {
            unread: 1,
            total: 34
          },
          status: 'Active',
          role: 'Senior Pastor'
        },
        6: {
          id: 6,
          name: 'Rev. Maria Santos',
          email: 'maria@holyspirit.org',
          phone: '+1 (555) 789-0123',
          avatar: 'MS',
          organization: {
            name: 'Holy Spirit Cathedral',
            type: 'Catholic',
            address: '890 Cathedral Square',
            city: 'San Francisco',
            country: 'United States',
            website: 'www.holyspirit.org',
            size: '2000+ members',
            denomination: 'Catholic',
            foundedYear: 1923,
            description: 'A historic Catholic cathedral serving the spiritual needs of our diverse community with reverence, tradition, and modern outreach.'
          },
          subscription: {
            plan: 'Enterprise',
            status: 'Active',
            startDate: '2025-01-12',
            endDate: '2026-01-12',
            nextBilling: '2026-01-12',
            amount: 199.99,
            currency: 'USD',
            paymentMethod: '**** 2345'
          },
          activity: {
            lastLogin: '3 hours ago',
            totalLogins: 425,
            accountCreated: '2025-01-12',
            presentationsCreated: 89,
            bibleSearches: 567,
            voiceCommands: 345
          },
          featureUsage: {
            bibleWidget: 99,
            voiceNavigation: 98,
            presentationBuilder: 100,
            collaborativeTools: 95,
            mobileApp: 97
          },
          supportRequests: 3,
          notifications: {
            unread: 8,
            total: 45
          },
          status: 'Active',
          role: 'Pastor'
        }
      };

      // Return the specific user profile or default to Sarah Johnson
      return userProfiles[userId] || {
        id: userId,
        name: 'Sarah Johnson',
        email: 'sarah@gracechurch.org',
        phone: '+1 (555) 123-4567',
        avatar: 'SJ',
        organization: {
          name: 'Grace Community Church',
          type: 'Non-denominational',
          address: '123 Church Street',
          city: 'Nashville',
          country: 'United States',
          website: 'www.gracechurch.org',
          size: '500-1000 members',
          denomination: 'Non-denominational',
          foundedYear: 1985,
          description: 'A vibrant community church focused on worship, fellowship, and serving our local community through the love of Christ.'
        },
        subscription: {
          plan: 'Premium',
          status: 'Active',
          startDate: '2024-01-15',
          endDate: '2025-01-15',
          nextBilling: '2024-02-15',
          amount: 29.99,
          currency: 'USD',
          paymentMethod: '**** 4532'
        },
        activity: {
          lastLogin: '2 hours ago',
          totalLogins: 247,
          accountCreated: '2024-01-15',
          presentationsCreated: 45,
          bibleSearches: 189,
          voiceCommands: 156
        },
        featureUsage: {
          bibleWidget: 89,
          voiceNavigation: 76,
          presentationBuilder: 92,
          collaborativeTools: 34,
          mobileApp: 67
        },
        supportRequests: 3,
        notifications: {
          unread: 5,
          total: 23
        },
        status: 'Active',
        role: 'Admin'
      } as UserProfile;
    },
  });

  const featureUsageData = userProfile ? [
    { name: 'Bible Widget', value: userProfile.featureUsage.bibleWidget, color: '#3b82f6' },
    { name: 'Voice Navigation', value: userProfile.featureUsage.voiceNavigation, color: '#10b981' },
    { name: 'Presentation Builder', value: userProfile.featureUsage.presentationBuilder, color: '#f59e0b' },
    { name: 'Collaborative Tools', value: userProfile.featureUsage.collaborativeTools, color: '#ef4444' },
    { name: 'Mobile App', value: userProfile.featureUsage.mobileApp, color: '#8b5cf6' }
  ] : [];

  const usageActivityData = [
    { date: 'Jan 15', logins: 12, presentations: 3, searches: 8 },
    { date: 'Jan 16', logins: 8, presentations: 5, searches: 12 },
    { date: 'Jan 17', logins: 15, presentations: 2, searches: 6 },
    { date: 'Jan 18', logins: 10, presentations: 7, searches: 15 },
    { date: 'Jan 19', logins: 18, presentations: 4, searches: 9 },
    { date: 'Jan 20', logins: 14, presentations: 6, searches: 11 },
    { date: 'Jan 21', logins: 20, presentations: 8, searches: 14 }
  ];

  const paymentHistory = [
    { id: 1, date: '2024-01-15', amount: 29.99, status: 'Paid', method: '**** 4532' },
    { id: 2, date: '2023-12-15', amount: 29.99, status: 'Paid', method: '**** 4532' },
    { id: 3, date: '2023-11-15', amount: 29.99, status: 'Paid', method: '**** 4532' },
    { id: 4, date: '2024-02-15', amount: 29.99, status: 'Upcoming', method: '**** 4532' }
  ];

  const supportTickets = [
    { id: 1, title: 'Bible search not working', status: 'Resolved', date: '2024-01-10', priority: 'Medium' },
    { id: 2, title: 'Voice commands setup help', status: 'Open', date: '2024-01-18', priority: 'Low' },
    { id: 3, title: 'Presentation export issue', status: 'In Progress', date: '2024-01-20', priority: 'High' }
  ];

  // Preset notification templates for Q-worship
  const notificationTemplates = [
    {
      id: 'payment_reminder',
      title: 'Payment Reminder',
      subject: 'Payment Due - Q-worship Premium',
      content: 'Your Q-worship Premium subscription payment is due soon. Please update your payment method to continue enjoying uninterrupted access to all premium features including voice navigation, unlimited presentations, and priority support.',
      icon: 'billing',
      color: 'text-orange-500'
    },
    {
      id: 'trial_expiring',
      title: 'Trial Expiring Soon',
      subject: 'Your Q-worship Trial Ends Soon',
      content: 'Your free trial of Q-worship expires in 3 days. Upgrade to Premium today to keep all your presentations, settings, and continue using advanced features like AI-powered Bible search and voice commands.',
      icon: 'trial',
      color: 'text-yellow-500'
    },
    {
      id: 'feature_update',
      title: 'New Feature Announcement',
      subject: 'Exciting New Features in Q-worship',
      content: 'We\'ve added powerful new features to enhance your worship experience! Check out the improved voice navigation, enhanced Bible search capabilities, and new presentation templates designed specifically for modern worship services.',
      icon: 'feature',
      color: 'text-purple-500'
    },
    {
      id: 'maintenance_notice',
      title: 'Maintenance Notification',
      subject: 'Scheduled Maintenance - Q-worship Platform',
      content: 'We\'ll be performing scheduled maintenance on the Q-worship platform tomorrow from 2:00 AM to 4:00 AM EST. During this time, the service may be temporarily unavailable. All your data and presentations will remain safe.',
      icon: 'system',
      color: 'text-blue-500'
    },
    {
      id: 'usage_report',
      title: 'Weekly Usage Summary',
      subject: 'Your Weekly Q-worship Activity Report',
      content: 'Here\'s your weekly activity summary: You\'ve created new presentations, used voice commands multiple times, and explored new Bible translations. Keep up the great work in your ministry preparation!',
      icon: 'report',
      color: 'text-teal-500'
    },
    {
      id: 'welcome_premium',
      title: 'Welcome to Premium',
      subject: 'Welcome to Q-worship Premium!',
      content: 'Congratulations! Your Q-worship Premium subscription is now active. You now have access to unlimited presentations, advanced voice navigation, priority support, and exclusive worship resources. Start exploring your premium features today!',
      icon: 'welcome',
      color: 'text-green-500'
    },
    {
      id: 'support_response',
      title: 'Support Ticket Update',
      subject: 'Update on Your Support Request',
      content: 'We\'ve updated your support ticket and provided a solution to your question. Our team is committed to helping you get the most out of Q-worship. Please check your support dashboard for the complete response.',
      icon: 'support',
      color: 'text-indigo-500'
    },
    {
      id: 'security_alert',
      title: 'Security Notification',
      subject: 'Important Security Update',
      content: 'We\'ve detected unusual activity on your account or need to inform you about important security updates. Please review your account settings and ensure your password is strong and unique to keep your Q-worship account secure.',
      icon: 'security',
      color: 'text-red-500'
    }
  ];

  const notifications = [
    { 
      id: 1, 
      subject: 'Welcome to Q-worship Premium!', 
      preview: 'Your premium subscription is now active...', 
      fullContent: 'Welcome to Q-worship Premium! Your subscription is now active and you have access to all premium features including advanced voice navigation, unlimited presentations, and priority support.',
      date: '2024-01-15', 
      isRead: false, 
      type: 'welcome' 
    },
    { 
      id: 2, 
      subject: 'Payment Confirmation', 
      preview: 'Your payment of $29.99 has been processed...', 
      fullContent: 'Your payment of $29.99 for Q-worship Premium has been successfully processed. Your next billing date is February 15, 2024. Thank you for choosing Q-worship!',
      date: '2024-01-15', 
      isRead: true, 
      type: 'billing' 
    },
    { 
      id: 3, 
      subject: 'New Feature: Enhanced Voice Commands', 
      preview: 'We\'ve added new voice navigation features...', 
      fullContent: 'We\'ve added new voice navigation features to make your worship experience even smoother. Try saying "Show next verse" or "Go to Psalms chapter 23" to experience the enhanced voice controls.',
      date: '2024-01-18', 
      isRead: false, 
      type: 'feature' 
    },
    { 
      id: 4, 
      subject: 'Trial Ending Soon', 
      preview: 'Your trial period ends in 3 days...', 
      fullContent: 'Your Q-worship trial period ends in 3 days. Upgrade to Premium to continue enjoying all features including unlimited presentations, advanced Bible search, and voice navigation.',
      date: '2024-01-20', 
      isRead: true, 
      type: 'trial' 
    },
    { 
      id: 5, 
      subject: 'Weekly Usage Report', 
      preview: 'Your weekly activity summary is ready...', 
      fullContent: 'This week you created 3 presentations, used voice commands 12 times, and searched the Bible 25 times. Keep up the great work in your ministry!',
      date: '2024-01-21', 
      isRead: false, 
      type: 'report' 
    }
  ];

  // Helper functions
  const toggleNotification = (notificationId: number) => {
    setExpandedNotifications(prev => 
      prev.includes(notificationId) 
        ? prev.filter(id => id !== notificationId)
        : [...prev, notificationId]
    );
  };

  const getNotificationIcon = (type: string, size: string = "h-4 w-4") => {
    switch (type) {
      case 'welcome': return <CheckCircle2 className={`${size} text-green-500`} />;
      case 'billing': return <DollarSign className={`${size} text-blue-500`} />;
      case 'feature': return <Zap className={`${size} text-purple-500`} />;
      case 'trial': return <AlertTriangle className={`${size} text-orange-500`} />;
      case 'report': return <BarChart3 className={`${size} text-teal-500`} />;
      case 'system': return <Wrench className={`${size} text-blue-500`} />;
      case 'support': return <Headphones className={`${size} text-indigo-500`} />;
      case 'security': return <Shield className={`${size} text-red-500`} />;
      default: return <Bell className={`${size} text-gray-500`} />;
    }
  };

  // Suspend account handler
  const handleSuspendAccount = async () => {
    try {
      // Here you would typically make an API call to suspend the account
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Account suspended successfully",
        description: `${userProfile?.name}'s account has been suspended. They will not be able to access Q-worship until reactivated.`,
      });

      setShowSuspendDialog(false);
    } catch (error) {
      toast({
        title: "Failed to suspend account",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive"
      });
    }
  };

  // Archive user handler
  const handleArchiveUser = async () => {
    try {
      // Here you would typically make an API call to archive the user
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "User archived successfully",
        description: `${userProfile?.name}'s account has been archived. All data has been preserved but the account is no longer active.`,
      });

      setShowArchiveDialog(false);
    } catch (error) {
      toast({
        title: "Failed to archive user",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive"
      });
    }
  };

  // Send notification handler
  const handleSendNotification = async () => {
    if (!selectedNotificationType) {
      toast({
        title: "Please select a notification type",
        description: "Choose a notification template to send to the user.",
        variant: "destructive"
      });
      return;
    }

    try {
      const template = notificationTemplates.find(t => t.id === selectedNotificationType);
      if (!template) return;

      // Here you would typically make an API call to send the notification
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast({
        title: "Notification sent successfully",
        description: `"${template.title}" notification has been sent to ${userProfile?.name}.`,
      });

      setShowSendNotificationDialog(false);
      setSelectedNotificationType('');
    } catch (error) {
      toast({
        title: "Failed to send notification",
        description: "Please try again or contact support if the problem persists.",
        variant: "destructive"
      });
    }
  };

  // User action handlers
  const handleUserAction = async (action: string) => {
    try {
      switch (action) {
        case 'send_notification':
          setShowSendNotificationDialog(true);
          break;
        case 'send_email':
          toast({
            title: "Email Sent",
            description: `Email sent to ${userProfile?.email}`,
          });
          break;
        case 'reset_password':
          toast({
            title: "Password Reset",
            description: `Password reset link sent to ${userProfile?.email}`,
          });
          break;
        case 'suspend_account':
          setShowSuspendDialog(true);
          break;
        case 'archive_user':
          setShowArchiveDialog(true);
          break;
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to perform action. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RotateCcw className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-spin mx-auto mb-4`} />
          <p className={`${themeClasses.secondaryText}`}>Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm sm:text-lg font-semibold ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
              {userProfile?.avatar}
            </div>
            <div>
              <h1 className={`text-lg sm:text-2xl font-bold ${themeClasses.primaryText}`}>
                {userProfile?.name}
              </h1>
              <p className={`text-sm ${themeClasses.secondaryText}`}>
                <span className="hidden sm:inline">{userProfile?.organization.name} • </span>
                {userProfile?.role}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Badge 
              variant={userProfile?.status === 'Active' ? 'default' : 'secondary'}
              className={userProfile?.status === 'Active' 
                ? 'bg-green-100 text-green-700 border-green-200' 
                : 'bg-gray-100 text-gray-700 border-gray-200'
              }
            >
              {userProfile?.status}
            </Badge>
            <Button
              variant={editMode ? "destructive" : "outline"}
              size="sm"
              onClick={() => setEditMode(!editMode)}
              className={`${editMode ? 'bg-red-600 hover:bg-red-700 text-white' : themeClasses.buttonSecondary} transition-all duration-200`}
            >
              {editMode ? <X className="h-4 w-4 mr-2" /> : <Edit className="h-4 w-4 mr-2" />}
              <span className="hidden sm:inline">{editMode ? 'Cancel Edit' : 'Edit Profile'}</span>
              <span className="sm:hidden">{editMode ? 'Cancel' : 'Edit'}</span>
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Card className={`${themeClasses.cardBackground} border ${isDarkMode ? 'border-blue-700/50 bg-gradient-to-br from-blue-900/20 to-blue-800/10' : 'border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                  <Activity className="h-5 w-5" />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" />
                  Active
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>
                  {userProfile?.activity.totalLogins}
                </div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Total Logins</div>
                <div className={`text-xs ${themeClasses.mutedText} mt-1`}>
                  Last: {userProfile?.activity.lastLogin}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${themeClasses.cardBackground} border ${isDarkMode ? 'border-green-700/50 bg-gradient-to-br from-green-900/20 to-green-800/10' : 'border-green-200 bg-gradient-to-br from-green-50 to-green-100/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-600/20 text-green-400' : 'bg-green-100 text-green-600'}`}>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" />
                  +12%
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>
                  {userProfile?.activity.presentationsCreated}
                </div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Presentations</div>
                <div className={`text-xs ${themeClasses.mutedText} mt-1`}>
                  This month
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${themeClasses.cardBackground} border ${isDarkMode ? 'border-purple-700/50 bg-gradient-to-br from-purple-900/20 to-purple-800/10' : 'border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-600/20 text-purple-400' : 'bg-purple-100 text-purple-600'}`}>
                  <Mic className="h-5 w-5" />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-1`}>
                  <TrendingUp className="h-3 w-3" />
                  +8%
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>
                  {userProfile?.activity.voiceCommands}
                </div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Voice Commands</div>
                <div className={`text-xs ${themeClasses.mutedText} mt-1`}>
                  Last 30 days
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={`${themeClasses.cardBackground} border ${isDarkMode ? 'border-orange-700/50 bg-gradient-to-br from-orange-900/20 to-orange-800/10' : 'border-orange-200 bg-gradient-to-br from-orange-50 to-orange-100/50'}`}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-600/20 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                  <Crown className="h-5 w-5" />
                </div>
                <div className={`text-xs ${isDarkMode ? 'text-green-400' : 'text-green-600'} flex items-center gap-1`}>
                  <CheckCircle className="h-3 w-3" />
                  Active
                </div>
              </div>
              <div className="mt-4">
                <div className={`text-xl font-bold ${themeClasses.primaryText}`}>
                  {userProfile?.subscription.plan}
                </div>
                <div className={`text-sm ${themeClasses.secondaryText}`}>Subscription</div>
                <div className={`text-xs ${themeClasses.mutedText} mt-1`}>
                  ${userProfile?.subscription.amount}/month
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className={`p-1 rounded-xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50 backdrop-blur-sm' : 'bg-white/80 border-gray-200/50 backdrop-blur-sm'} shadow-lg grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-1 h-auto`}>
            <TabsTrigger 
              value="overview" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-blue-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <User className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Overview</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="organization" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-green-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-green-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <Building2 className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Organization</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="subscription" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-purple-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <Crown className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Subscription</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="analytics" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-orange-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-orange-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <BarChart3 className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Analytics</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="support" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-teal-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-teal-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <HelpCircle className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Support</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="payments" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-emerald-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <CreditCard className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Payments</span>
            </TabsTrigger>
            
            <TabsTrigger 
              value="actions" 
              className={`
                relative px-4 py-3 rounded-lg font-medium transition-all duration-200 flex flex-col items-center justify-center h-16 gap-1
                data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-red-700 data-[state=active]:text-white 
                data-[state=active]:shadow-lg data-[state=active]:scale-105 data-[state=active]:shadow-red-500/25
                ${isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700/50' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
            >
              <Settings className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Actions</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Information */}
              <Card className={`${themeClasses.cardBackground} ${editMode ? 'ring-2 ring-blue-500/50 border-blue-500/50' : ''}`}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                    <User className="h-5 w-5" />
                    Contact Information
                    {editMode && (
                      <Badge variant="secondary" className="ml-2 text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                        Editing
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <Label className={`text-sm font-medium ${themeClasses.primaryText} flex items-center gap-2`}>
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    {editMode ? (
                      <Input 
                        defaultValue={userProfile?.email}
                        className={`${themeClasses.inputBackground} focus:ring-2 focus:ring-blue-500/50`}
                        type="email"
                      />
                    ) : (
                      <div className={`text-sm ${themeClasses.secondaryText} ml-6`}>{userProfile?.email}</div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label className={`text-sm font-medium ${themeClasses.primaryText} flex items-center gap-2`}>
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    {editMode ? (
                      <Input 
                        defaultValue={userProfile?.phone}
                        className={`${themeClasses.inputBackground} focus:ring-2 focus:ring-blue-500/50`}
                        type="tel"
                      />
                    ) : (
                      <div className={`text-sm ${themeClasses.secondaryText} ml-6`}>{userProfile?.phone}</div>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <Label className={`text-sm font-medium ${themeClasses.primaryText} flex items-center gap-2`}>
                      <Calendar className="h-4 w-4" />
                      Member Since
                    </Label>
                    <div className={`text-sm ${themeClasses.secondaryText} ml-6`}>{userProfile?.activity.accountCreated}</div>
                  </div>
                  
                  {editMode && (
                    <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        size="sm"
                        className={`${themeClasses.buttonPrimary} flex items-center gap-2`}
                        onClick={() => {
                          toast({
                            title: "Profile Updated",
                            description: "Contact information has been saved successfully.",
                          });
                          setEditMode(false);
                        }}
                      >
                        <Save className="h-4 w-4" />
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditMode(false)}
                        className={themeClasses.buttonSecondary}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-opacity-50 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
                        <div>
                          <div className={`text-sm font-medium ${themeClasses.primaryText}`}>Logged in</div>
                          <div className={`text-xs ${themeClasses.secondaryText}`}>2 hours ago</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-opacity-50 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-blue-500`}></div>
                        <div>
                          <div className={`text-sm font-medium ${themeClasses.primaryText}`}>Created presentation</div>
                          <div className={`text-xs ${themeClasses.secondaryText}`}>5 hours ago</div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-opacity-50 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full bg-purple-500`}></div>
                        <div>
                          <div className={`text-sm font-medium ${themeClasses.primaryText}`}>Used voice navigation</div>
                          <div className={`text-xs ${themeClasses.secondaryText}`}>1 day ago</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Usage Chart */}
            <Card className={themeClasses.cardBackground}>
              <CardHeader>
                <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                  <PieChartIcon className="h-5 w-5" />
                  Feature Usage Overview
                </CardTitle>
                <CardDescription className={themeClasses.secondaryText}>
                  Usage distribution across Q-worship features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={featureUsageData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {featureUsageData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                            border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                            borderRadius: '8px',
                            color: isDarkMode ? '#f9fafb' : '#111827'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    {featureUsageData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: item.color }}
                          ></div>
                          <span className={`text-sm ${themeClasses.primaryText}`}>{item.name}</span>
                        </div>
                        <span className={`text-sm font-medium ${themeClasses.primaryText}`}>{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Organization Tab */}
          <TabsContent value="organization" className="space-y-8 mt-8">
            <Card className={themeClasses.cardBackground}>
              <CardHeader>
                <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                  <Building2 className="h-5 w-5" />
                  Organization Details
                </CardTitle>
                <CardDescription className={themeClasses.secondaryText}>
                  Complete organizational information from onboarding
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Organization Name</Label>
                      {editMode ? (
                        <Input 
                          defaultValue={userProfile?.organization.name}
                          className={`mt-1 ${themeClasses.inputBackground}`}
                        />
                      ) : (
                        <div className={`mt-1 text-sm ${themeClasses.secondaryText}`}>{userProfile?.organization.name}</div>
                      )}
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Type</Label>
                      {editMode ? (
                        <Select defaultValue={userProfile?.organization.type}>
                          <SelectTrigger className={`mt-1 ${themeClasses.selectTrigger}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={themeClasses.selectContent}>
                            <SelectItem value="non-denominational">Non-denominational</SelectItem>
                            <SelectItem value="baptist">Baptist</SelectItem>
                            <SelectItem value="methodist">Methodist</SelectItem>
                            <SelectItem value="presbyterian">Presbyterian</SelectItem>
                            <SelectItem value="catholic">Catholic</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className={`mt-1 text-sm ${themeClasses.secondaryText}`}>{userProfile?.organization.type}</div>
                      )}
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Size</Label>
                      <div className={`mt-1 text-sm ${themeClasses.secondaryText}`}>{userProfile?.organization.size}</div>
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Founded</Label>
                      <div className={`mt-1 text-sm ${themeClasses.secondaryText}`}>{userProfile?.organization.foundedYear}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Address</Label>
                      {editMode ? (
                        <Textarea 
                          defaultValue={`${userProfile?.organization.address}, ${userProfile?.organization.city}, ${userProfile?.organization.country}`}
                          className={`mt-1 ${themeClasses.inputBackground}`}
                        />
                      ) : (
                        <div className={`mt-1 text-sm ${themeClasses.secondaryText}`}>
                          {userProfile?.organization.address}<br/>
                          {userProfile?.organization.city}, {userProfile?.organization.country}
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Website</Label>
                      {editMode ? (
                        <Input 
                          defaultValue={userProfile?.organization.website}
                          className={`mt-1 ${themeClasses.inputBackground}`}
                        />
                      ) : (
                        <div className={`mt-1 text-sm ${themeClasses.secondaryText} flex items-center gap-2`}>
                          <Globe className="h-4 w-4" />
                          <a href={`https://${userProfile?.organization.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                            {userProfile?.organization.website}
                          </a>
                          <ExternalLink className="h-3 w-3" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label className={`text-sm font-medium ${themeClasses.primaryText}`}>Description</Label>
                  {editMode ? (
                    <Textarea 
                      defaultValue={userProfile?.organization.description}
                      className={`mt-1 ${themeClasses.inputBackground}`}
                      rows={4}
                    />
                  ) : (
                    <div className={`mt-1 text-sm ${themeClasses.secondaryText}`}>{userProfile?.organization.description}</div>
                  )}
                </div>
                
                {editMode && (
                  <div className="flex items-center gap-3 pt-4">
                    <Button className={themeClasses.buttonPrimary}>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} className={themeClasses.buttonSecondary}>
                      Cancel
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription Tab */}
          <TabsContent value="subscription" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                    <Crown className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className={`text-xl font-bold ${themeClasses.primaryText}`}>{userProfile?.subscription.plan}</div>
                      <div className={`text-sm ${themeClasses.secondaryText}`}>Active subscription</div>
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      {userProfile?.subscription.status}
                    </Badge>
                  </div>
                  <Separator className={themeClasses.border} />
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className={`text-sm ${themeClasses.secondaryText}`}>Monthly Cost</span>
                      <span className={`text-sm font-medium ${themeClasses.primaryText}`}>
                        ${userProfile?.subscription.amount} {userProfile?.subscription.currency}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${themeClasses.secondaryText}`}>Next Billing</span>
                      <span className={`text-sm font-medium ${themeClasses.primaryText}`}>
                        {userProfile?.subscription.nextBilling}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-sm ${themeClasses.secondaryText}`}>Payment Method</span>
                      <span className={`text-sm font-medium ${themeClasses.primaryText}`}>
                        {userProfile?.subscription.paymentMethod}
                      </span>
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <Button className={`w-full ${themeClasses.buttonPrimary}`}>
                      Upgrade Plan
                    </Button>
                    <Button variant="outline" className={`w-full ${themeClasses.buttonSecondary}`}>
                      Manage Billing
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                    <Target className="h-5 w-5" />
                    Conversion Tracking
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <div className={`text-sm font-medium ${themeClasses.primaryText}`}>Trial to Paid</div>
                        <div className={`text-xs ${themeClasses.secondaryText}`}>Converted on day 12 of trial</div>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div>
                        <div className={`text-sm font-medium ${themeClasses.primaryText}`}>Feature Adoption</div>
                        <div className={`text-xs ${themeClasses.secondaryText}`}>95% of features used</div>
                      </div>
                      <div className={`text-sm font-bold text-blue-500`}>95%</div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div>
                        <div className={`text-sm font-medium ${themeClasses.primaryText}`}>Engagement Score</div>
                        <div className={`text-xs ${themeClasses.secondaryText}`}>High usage pattern</div>
                      </div>
                      <div className={`text-sm font-bold text-purple-500`}>High</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-8 mt-8">
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${themeClasses.primaryText}`}>Feature Usage Analytics</h3>
              <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
                <SelectTrigger className={`w-32 ${themeClasses.selectTrigger}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={themeClasses.selectContent}>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card className={themeClasses.cardBackground}>
              <CardHeader>
                <CardTitle className={`${themeClasses.primaryText}`}>Usage Activity Timeline</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={usageActivityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
                      <XAxis 
                        dataKey="date" 
                        stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <YAxis 
                        stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: isDarkMode ? '#1f2937' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                          borderRadius: '8px',
                          color: isDarkMode ? '#f9fafb' : '#111827'
                        }}
                      />
                      <Line type="monotone" dataKey="logins" stroke="#3b82f6" strokeWidth={2} />
                      <Line type="monotone" dataKey="presentations" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="searches" stroke="#f59e0b" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                    <Headphones className="h-5 w-5" />
                    Support Tickets
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {supportTickets.map((ticket) => (
                      <div key={ticket.id} className={`p-4 rounded-lg border ${themeClasses.border}`}>
                        <div className="flex items-center justify-between mb-2">
                          <div className={`text-sm font-medium ${themeClasses.primaryText}`}>
                            #{ticket.id}: {ticket.title}
                          </div>
                          <Badge 
                            variant={ticket.status === 'Resolved' ? 'default' : ticket.status === 'Open' ? 'destructive' : 'secondary'}
                            className={
                              ticket.status === 'Resolved' 
                                ? 'bg-green-100 text-green-700 border-green-200'
                                : ticket.status === 'Open'
                                ? 'bg-red-100 text-red-700 border-red-200'
                                : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }
                          >
                            {ticket.status}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className={themeClasses.secondaryText}>{ticket.date}</span>
                          <span className={`px-2 py-1 rounded ${
                            ticket.priority === 'High' 
                              ? 'bg-red-100 text-red-700' 
                              : ticket.priority === 'Medium'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                    <Bell className="h-5 w-5" />
                    Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <div className={`text-2xl font-bold ${themeClasses.primaryText}`}>
                        {notifications.filter(n => !n.isRead).length}
                      </div>
                      <div className={`text-sm ${themeClasses.secondaryText}`}>Unread notifications</div>
                    </div>
                    <div>
                      <div className={`text-lg font-semibold ${themeClasses.primaryText}`}>
                        {notifications.length}
                      </div>
                      <div className={`text-sm ${themeClasses.secondaryText}`}>Total</div>
                    </div>
                  </div>
                  
                  {/* Itemized Notifications */}
                  <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                    {notifications.slice(0, 4).map((notification) => (
                      <Collapsible 
                        key={notification.id}
                        open={expandedNotifications.includes(notification.id)}
                        onOpenChange={() => toggleNotification(notification.id)}
                      >
                        <CollapsibleTrigger className={`w-full text-left p-3 rounded-lg border transition-colors hover:bg-opacity-50 ${
                          !notification.isRead 
                            ? (isDarkMode ? 'border-blue-600/50 bg-blue-900/20' : 'border-blue-200 bg-blue-50/50')
                            : themeClasses.border
                        }`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {!notification.isRead && (
                                <Circle className="h-2 w-2 fill-blue-500 text-blue-500 flex-shrink-0" />
                              )}
                              {getNotificationIcon(notification.type)}
                              <div className="min-w-0 flex-1">
                                <div className={`text-sm font-medium truncate ${themeClasses.primaryText}`}>
                                  {notification.subject}
                                </div>
                                <div className={`text-xs ${themeClasses.secondaryText} truncate`}>
                                  {notification.preview}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span className={`text-xs ${themeClasses.mutedText}`}>
                                {notification.date}
                              </span>
                              {expandedNotifications.includes(notification.id) ? (
                                <ChevronDown className="h-4 w-4 text-gray-400" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="px-3 pb-3">
                          <div className={`text-sm ${themeClasses.secondaryText} mt-2 pl-6 leading-relaxed`}>
                            {notification.fullContent}
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                    
                    {notifications.length > 4 && (
                      <div className={`text-center py-2 text-xs ${themeClasses.mutedText}`}>
                        +{notifications.length - 4} more notifications
                      </div>
                    )}
                  </div>
                  
                  <Button 
                    className={`w-full ${themeClasses.buttonPrimary}`}
                    onClick={() => setShowSendNotificationDialog(true)}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="space-y-8 mt-8">
            <Card className={themeClasses.cardBackground}>
              <CardHeader>
                <CardTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                  <CreditCard className="h-5 w-5" />
                  Payment History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className={`flex items-center justify-between p-4 rounded-lg border ${themeClasses.border}`}>
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${
                          payment.status === 'Paid' 
                            ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-600')
                            : payment.status === 'Upcoming'
                            ? (isDarkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-600')
                            : (isDarkMode ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-600')
                        }`}>
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${themeClasses.primaryText}`}>
                            ${payment.amount}
                          </div>
                          <div className={`text-xs ${themeClasses.secondaryText}`}>
                            {payment.date} • {payment.method}
                          </div>
                        </div>
                      </div>
                      <Badge 
                        variant={payment.status === 'Paid' ? 'default' : 'secondary'}
                        className={
                          payment.status === 'Paid' 
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : payment.status === 'Upcoming'
                            ? 'bg-blue-100 text-blue-700 border-blue-200'
                            : 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions Tab */}
          <TabsContent value="actions" className="space-y-8 mt-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} text-lg`}>Communication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    className={`w-full ${themeClasses.buttonPrimary}`}
                    onClick={() => handleUserAction('send_notification')}
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Send Notification
                  </Button>
                  <Button 
                    className={`w-full ${themeClasses.buttonPrimary}`}
                    onClick={() => handleUserAction('send_email')}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </CardContent>
              </Card>

              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} text-lg`}>Account Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline"
                    className={`w-full ${themeClasses.buttonSecondary}`}
                    onClick={() => handleUserAction('reset_password')}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Reset Password
                  </Button>
                  <Button 
                    variant="outline"
                    className={`w-full border-orange-300 text-orange-600 hover:bg-orange-50`}
                    onClick={() => handleUserAction('suspend_account')}
                  >
                    <UserX className="h-4 w-4 mr-2" />
                    Suspend Account
                  </Button>
                </CardContent>
              </Card>

              <Card className={themeClasses.cardBackground}>
                <CardHeader>
                  <CardTitle className={`${themeClasses.primaryText} text-lg`}>Data Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline"
                    className={`w-full ${themeClasses.buttonSecondary}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>
                  <Button 
                    variant="outline"
                    className={`w-full border-red-300 text-red-600 hover:bg-red-50`}
                    onClick={() => handleUserAction('archive_user')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Archive User
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Send Notification Dialog */}
        <Dialog open={showSendNotificationDialog} onOpenChange={setShowSendNotificationDialog}>
          <DialogContent className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} max-w-2xl`}>
            <DialogHeader>
              <DialogTitle className={themeClasses.primaryText}>
                Send Notification to {userProfile?.name}
              </DialogTitle>
              <DialogDescription className={themeClasses.secondaryText}>
                Choose a preset notification template to send to this user.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Label className={`text-sm font-medium mb-3 block ${themeClasses.primaryText}`}>
                Select Notification Type
              </Label>
              <div className="grid grid-cols-1 gap-3 max-h-96 overflow-y-auto">
                {notificationTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedNotificationType === template.id
                        ? (isDarkMode 
                            ? 'border-blue-500 bg-blue-900/20 shadow-md' 
                            : 'border-blue-500 bg-blue-50 shadow-md')
                        : (isDarkMode 
                            ? 'border-gray-700 bg-gray-800/50 hover:border-gray-600' 
                            : 'border-gray-200 bg-gray-50 hover:border-gray-300')
                    }`}
                    onClick={() => setSelectedNotificationType(template.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-1">
                        {getNotificationIcon(template.icon, "h-5 w-5")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold mb-1 ${themeClasses.primaryText}`}>
                          {template.title}
                        </div>
                        <div className={`text-xs font-medium mb-2 ${themeClasses.secondaryText}`}>
                          Subject: {template.subject}
                        </div>
                        <div className={`text-xs leading-relaxed ${themeClasses.mutedText}`}>
                          {template.content.length > 120 
                            ? `${template.content.substring(0, 120)}...` 
                            : template.content
                          }
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {selectedNotificationType === template.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {selectedNotificationType && (
                <div className={`mt-4 p-4 rounded-lg border ${
                  isDarkMode ? 'border-gray-700 bg-gray-800/30' : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className={`text-sm font-medium mb-2 ${themeClasses.primaryText}`}>
                    Preview - Full Content:
                  </div>
                  <div className={`text-sm leading-relaxed ${themeClasses.secondaryText}`}>
                    {notificationTemplates.find(t => t.id === selectedNotificationType)?.content}
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowSendNotificationDialog(false);
                  setSelectedNotificationType('');
                }}
                className={isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendNotification}
                disabled={!selectedNotificationType}
                className={themeClasses.buttonPrimary}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Notification
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Account Confirmation Dialog */}
        <Dialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
          <DialogContent className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} max-w-md`}>
            <DialogHeader>
              <DialogTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                <UserX className="h-5 w-5 text-orange-500" />
                Suspend Account
              </DialogTitle>
              <DialogDescription className={themeClasses.secondaryText}>
                Are you sure you want to suspend {userProfile?.name}'s account?
              </DialogDescription>
            </DialogHeader>
            
            <div className={`py-4 p-4 rounded-lg border ${
              isDarkMode ? 'border-orange-800/50 bg-orange-900/20' : 'border-orange-200 bg-orange-50'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className={`text-sm font-medium mb-1 ${themeClasses.primaryText}`}>
                    This action will:
                  </div>
                  <ul className={`text-sm space-y-1 ${themeClasses.secondaryText}`}>
                    <li>• Immediately block access to Q-worship</li>
                    <li>• Preserve all user data and presentations</li>
                    <li>• Stop billing for subscription services</li>
                    <li>• Send account suspension notification</li>
                  </ul>
                  <div className={`text-xs mt-2 ${themeClasses.mutedText}`}>
                    The account can be reactivated at any time.
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowSuspendDialog(false)}
                className={isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSuspendAccount}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                <UserX className="h-4 w-4 mr-2" />
                Suspend Account
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Archive User Confirmation Dialog */}
        <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
          <DialogContent className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} max-w-md`}>
            <DialogHeader>
              <DialogTitle className={`${themeClasses.primaryText} flex items-center gap-2`}>
                <Trash2 className="h-5 w-5 text-red-500" />
                Archive User
              </DialogTitle>
              <DialogDescription className={themeClasses.secondaryText}>
                Are you sure you want to archive {userProfile?.name}'s account?
              </DialogDescription>
            </DialogHeader>
            
            <div className={`py-4 p-4 rounded-lg border ${
              isDarkMode ? 'border-red-800/50 bg-red-900/20' : 'border-red-200 bg-red-50'
            }`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className={`text-sm font-medium mb-1 ${themeClasses.primaryText}`}>
                    This action will:
                  </div>
                  <ul className={`text-sm space-y-1 ${themeClasses.secondaryText}`}>
                    <li>• Permanently deactivate the account</li>
                    <li>• Archive all presentations and user data</li>
                    <li>• Cancel active subscriptions</li>
                    <li>• Remove access to Q-worship services</li>
                  </ul>
                  <div className={`text-xs mt-2 font-medium ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                    ⚠️ This action cannot be easily undone.
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowArchiveDialog(false)}
                className={isDarkMode ? 'border-gray-700 text-gray-300 hover:bg-gray-800' : ''}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleArchiveUser}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Archive User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    </div>
  );
}