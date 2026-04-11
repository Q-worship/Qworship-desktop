import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import AdminManagement from "@/features/super-admin/pages/AdminManagement";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminTopBar from "@/features/super-admin/components/AdminTopBar";

// Restored actual UI pages replacing old placeholders
import { DashboardView } from "@/features/super-admin/components/views/DashboardView";
import { UserAnalyticsView } from "@/features/super-admin/components/views/UserAnalyticsView";
import { TrialManagementView } from "@/features/super-admin/components/views/TrialManagementView";
import { RevenueAnalyticsView } from "@/features/super-admin/components/views/RevenueAnalyticsView";
import { SystemHealthView } from "@/features/super-admin/components/views/SystemHealthView";

// Remaining mock components for incomplete sections
const UserOnboarding = ({ onSetActiveSection }: any) => <div className="p-8"><h2 className="text-2xl font-bold">User Onboarding</h2><p className="text-muted-foreground mt-2">This section is currently under development.</p></div>;
const AuthTracking = ({ onSetActiveSection }: any) => <div className="p-8"><h2 className="text-2xl font-bold">Auth Tracking</h2><p className="text-muted-foreground mt-2">This section is currently under development.</p></div>;
const ContactData = ({ adminKey }: any) => <div className="p-8"><h2 className="text-2xl font-bold">Contact Data</h2><p className="text-muted-foreground mt-2">This section is currently under development.</p></div>;

import {
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  AlertTriangle,
  Mail,
  Database,
  Activity,
  Calendar,
  Download,
  Filter,
  Search,
  Moon,
  Sun,
  BarChart3,
  Settings,
  Shield,
  FileText,
  Zap,
  Globe,
  UserCheck,
  User,
  CreditCard,
  Bell,
  Home,
  PieChart,
  MessageSquare,
  HelpCircle,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Key,
  Trash2,
  Save,
  RotateCcw,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  ChevronRight,
  ChevronLeft,
  Building2,
  Gauge,
  TrendingDown,
  X,
  ExternalLink,
  ArrowLeft,
  Mic,
  Monitor,
  Crown,
  UserPlus,
  Church,
  Heart,
  FileSpreadsheet,
  Share,
  Lock,
  UserX,
  AlertCircle,
  Plus,
  Wifi,
  Phone,
  Star,
  Book,
  Music,
  Code,
  MoreHorizontal,
  Server,
  Briefcase,
  Target,
  Copy,
  Pause,
  Play,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
} from "recharts";
import { Link } from "wouter";
import qWorshipLogo from "@assets/Group 1_1753843572404.png";
import AdminSettings from "@/features/super-admin/pages/AdminSettings";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserProfileView from "@/features/dashboard/profile/UserProfileView";
import { SupportCentreAdmin } from "@/features/dashboard/components/SupportCentreAdmin";
import { ResourceCentreAdmin } from "@/features/dashboard/components/ResourceCentreAdmin";
import SuperAdminMediaAssets from "@/features/super-admin/pages/SuperAdminMediaAssets";

interface TrialAnalytics {
  totalUsers: number;
  activeTrials: number;
  expiredTrials: number;
  trialConversionRate: number;
  averageTrialDuration: number;
  upcomingExpirations: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
}

interface UserMetrics {
  totalRegistrations: number;
  dailySignups: number;
  weeklySignups: number;
  monthlySignups: number;
  activeUsers: number;
  organizationsCreated: number;
  emailVerificationRate: number;
}

interface RevenueData {
  totalRevenue: number;
  monthlyRecurringRevenue: number;
  averageRevenuePerUser: number;
  trialToPayingConversion: number;
  churnRate: number;
  lifetimeValue: number;
}

interface SystemMetrics {
  emailsSent: number;
  emailDeliveryRate: number;
  notificationsSent: number;
  systemUptime: number;
  databaseSize: string;
  activeConnections: number;
}

interface ChartData {
  date: string;
  users: number;
  revenue: number;
  trials: number;
  conversions: number;
  usersPrevious?: number;
  revenuePrevious?: number;
  trialsPrevious?: number;
  conversionsPrevious?: number;
  period: "current" | "previous";
}

interface RegionalData {
  region: string;
  users: number;
  percentage: number;
  growth: number;
  color: string;
}

interface RecentActivity {
  id: string;
  type:
    | "signup"
    | "trial_start"
    | "plan_selection"
    | "payment"
    | "organization_setup";
  organization: string;
  description: string;
  status: "in_progress" | "completed" | "pending";
  timestamp: string;
  progress: number;
  nextStep?: string;
}

export default function SuperAdminSidebar() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState("30d");
  const [userFilter, setUserFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeSection, setActiveSection] = useState("dashboard");

  // Trial Management States
  const [selectedTrial, setSelectedTrial] = useState<any>(null);
  const [showExtendDialog, setShowExtendDialog] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [extensionDays, setExtensionDays] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [selectedPlan, setSelectedPlan] = useState("");

  // Plan editing states
  const [editingPlan, setEditingPlan] = useState<string | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: "",
    price: "",
    currency: "gbp",
    description: "",
    features: [] as string[],
  });

  // Plan editing functions
  const handleEditPlan = (planType: string) => {
    const planData = {
      basic: {
        name: "Basic",
        price: "15",
        currency: "gbp",
        description: "Essential features for small churches",
        features: [
          "Core presentation tools",
          "Basic Bible widget",
          "Up to 100 slides",
          "Email support",
        ],
      },
      professional: {
        name: "Professional",
        price: "25",
        currency: "gbp",
        description: "Advanced features for growing churches",
        features: [
          "Advanced presentation tools",
          "Full Bible widget",
          "Unlimited slides",
          "Priority support",
          "Advanced analytics",
        ],
      },
      enterprise: {
        name: "Enterprise",
        price: "45",
        currency: "gbp",
        description: "Complete solution for large organizations",
        features: [
          "Enterprise-grade tools",
          "Custom Bible widget",
          "Unlimited everything",
          "24/7 support",
          "Custom integrations",
          "White-label options",
        ],
      },
    };

    const data = planData[planType as keyof typeof planData];
    if (data) {
      setPlanFormData(data);
      setEditingPlan(planType);
    }
  };

  const handleSavePlan = () => {
    console.log("Saving plan:", editingPlan, planFormData);
    // Add save functionality here
    setEditingPlan(null);
  };

  // Trial Management Actions
  const handleViewDetails = (trial: any) => {
    // Use the same user profile functionality as User Management section
    setProfileUserId(trial.user.id);
    setShowUserProfile(true);
  };

  const handleExtendTrial = (trial: any) => {
    setSelectedTrial(trial);
    setExtensionDays("");
    setShowExtendDialog(true);
  };

  const handleConvertToPaid = (trial: any) => {
    setSelectedTrial(trial);
    setSelectedPlan("");
    setShowConvertDialog(true);
  };

  const handleSendMessage = (trial: any) => {
    setSelectedTrial(trial);
    setMessageContent("");
    setShowMessageDialog(true);
  };

  const handleCancelTrial = (trial: any) => {
    setSelectedTrial(trial);
    setShowCancelDialog(true);
  };

  const handleSendReminder = (trial: any) => {
    toast({
      title: "Reminder Sent",
      description: `Trial expiration reminder sent to ${trial.user.name}`,
    });
  };

  const handleReactivateTrial = (trial: any) => {
    toast({
      title: "Trial Reactivated",
      description: `Trial for ${trial.user.name} has been reactivated for 30 days`,
    });
  };

  const handleViewSubscription = (trial: any) => {
    toast({
      title: "Redirecting",
      description: `Opening subscription details for ${trial.user.name}`,
    });
  };

  const handleExportData = (trial: any) => {
    toast({
      title: "Data Export",
      description: `Exporting trial data for ${trial.user.name}`,
    });
  };

  const confirmExtendTrial = () => {
    if (!extensionDays || parseInt(extensionDays) <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of days",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Trial Extended",
      description: `${selectedTrial?.user.name}'s trial has been extended by ${extensionDays} days`,
    });
    setShowExtendDialog(false);
    setExtensionDays("");
  };

  const confirmConvertTrial = () => {
    if (!selectedPlan) {
      toast({
        title: "Plan Required",
        description: "Please select a plan for conversion",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Trial Converted",
      description: `${selectedTrial?.user.name} has been converted to ${selectedPlan} plan`,
    });
    setShowConvertDialog(false);
    setSelectedPlan("");
  };

  const confirmSendMessage = () => {
    if (!messageContent.trim()) {
      toast({
        title: "Message Required",
        description: "Please enter a message to send",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Message Sent",
      description: `Message sent to ${selectedTrial?.user.name}`,
    });
    setShowMessageDialog(false);
    setMessageContent("");
  };

  const confirmCancelTrial = () => {
    toast({
      title: "Trial Cancelled",
      description: `Trial for ${selectedTrial?.user.name} has been cancelled`,
    });
    setShowCancelDialog(false);
  };

  // Chart control states
  const [chartMetric, setChartMetric] = useState("users");
  const [chartDateRange, setChartDateRange] = useState("30d");
  const [chartGroupBy, setChartGroupBy] = useState("day");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Customer subscription table states
  const [customerPage, setCustomerPage] = useState(1);
  const [customerPageSize, setCustomerPageSize] = useState(10);
  const [customerFilter, setCustomerFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [cycleFilter, setCycleFilter] = useState("all");
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [customerActionLoading, setCustomerActionLoading] = useState(false);

  // Customer data
  const customerData = [
    {
      id: 1,
      name: "Sarah Johnson",
      email: "sarah@gracechapel.org",
      organization: "Grace Chapel Community",
      plan: "Premium",
      amount: 25,
      cycle: "Monthly",
      nextPayment: "2025-02-15",
      status: "Active",
      joinedDate: "2024-08-15",
      totalSpent: 150,
      avatar: "SJ",
    },
    {
      id: 2,
      name: "Michael Chen",
      email: "michael@newlifefellowship.com",
      organization: "New Life Fellowship",
      plan: "Basic",
      amount: 15,
      cycle: "Quarterly",
      nextPayment: "2025-03-01",
      status: "Active",
      joinedDate: "2024-06-20",
      totalSpent: 90,
      avatar: "MC",
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      email: "emily@cityheightsbaptist.org",
      organization: "City Heights Baptist",
      plan: "Enterprise",
      amount: 49,
      cycle: "Annual",
      nextPayment: "2025-12-15",
      status: "Active",
      joinedDate: "2024-01-10",
      totalSpent: 588,
      avatar: "ER",
    },
    {
      id: 4,
      name: "David Thompson",
      email: "david@riverside.church",
      organization: "Riverside Methodist",
      plan: "Basic",
      amount: 15,
      cycle: "Monthly",
      nextPayment: "2025-02-05",
      status: "Payment Due",
      joinedDate: "2024-11-12",
      totalSpent: 45,
      avatar: "DT",
    },
    {
      id: 5,
      name: "Lisa Park",
      email: "lisa@hopechurch.international",
      organization: "Hope Church International",
      plan: "Premium",
      amount: 25,
      cycle: "Monthly",
      nextPayment: "2025-02-10",
      status: "Active",
      joinedDate: "2024-03-22",
      totalSpent: 275,
      avatar: "LP",
    },
    {
      id: 6,
      name: "James Wilson",
      email: "james@trinityanglican.org",
      organization: "Trinity Anglican Church",
      plan: "Basic",
      amount: 15,
      cycle: "Quarterly",
      nextPayment: "2025-04-15",
      status: "Active",
      joinedDate: "2024-07-08",
      totalSpent: 90,
      avatar: "JW",
    },
    {
      id: 7,
      name: "Maria Santos",
      email: "maria@stmarks.church",
      organization: "St. Mark's Catholic",
      plan: "Free Trial",
      amount: 0,
      cycle: "Trial",
      nextPayment: "2025-02-28",
      status: "Trial Ending",
      joinedDate: "2025-01-28",
      totalSpent: 0,
      avatar: "MS",
    },
    {
      id: 8,
      name: "Robert Lee",
      email: "robert@faithcommunity.org",
      organization: "Faith Community Church",
      plan: "Premium",
      amount: 25,
      cycle: "Monthly",
      nextPayment: "2025-01-20",
      status: "Overdue",
      joinedDate: "2024-05-14",
      totalSpent: 200,
      avatar: "RL",
    },
    {
      id: 9,
      name: "Jennifer Brown",
      email: "jennifer@crossroads.church",
      organization: "Crossroads Fellowship",
      plan: "Enterprise",
      amount: 49,
      cycle: "Annual",
      nextPayment: "2025-08-30",
      status: "Active",
      joinedDate: "2024-09-01",
      totalSpent: 196,
      avatar: "JB",
    },
    {
      id: 10,
      name: "Thomas Anderson",
      email: "thomas@lighthouse.ministry",
      organization: "Lighthouse Ministry",
      plan: "Basic",
      amount: 15,
      cycle: "Monthly",
      nextPayment: "2025-02-12",
      status: "Active",
      joinedDate: "2024-12-01",
      totalSpent: 30,
      avatar: "TA",
    },
  ];

  // Filter customers based on search and filters
  const filteredCustomers = customerData.filter((customer) => {
    // Search filter
    const searchMatch =
      customerSearch === "" ||
      customer.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.email.toLowerCase().includes(customerSearch.toLowerCase()) ||
      customer.organization
        .toLowerCase()
        .includes(customerSearch.toLowerCase());

    // Plan filter
    const planMatch =
      customerFilter === "all" ||
      (customerFilter === "free" && customer.plan === "Free Trial") ||
      (customerFilter === "basic" && customer.plan === "Basic") ||
      (customerFilter === "premium" && customer.plan === "Premium") ||
      (customerFilter === "enterprise" && customer.plan === "Enterprise");

    // Payment status filter
    const paymentMatch =
      paymentFilter === "all" ||
      (paymentFilter === "upcoming" && customer.status === "Active") ||
      (paymentFilter === "overdue" && customer.status === "Overdue") ||
      (paymentFilter === "paid" && customer.status === "Active") ||
      (paymentFilter === "failed" &&
        (customer.status === "Payment Due" || customer.status === "Overdue"));

    // Billing cycle filter
    const cycleMatch =
      cycleFilter === "all" ||
      (cycleFilter === "monthly" && customer.cycle === "Monthly") ||
      (cycleFilter === "quarterly" && customer.cycle === "Quarterly") ||
      (cycleFilter === "annual" && customer.cycle === "Annual") ||
      (cycleFilter === "lifetime" && customer.cycle === "Lifetime");

    return searchMatch && planMatch && paymentMatch && cycleMatch;
  });

  // Reset page to 1 when filters change
  React.useEffect(() => {
    setCustomerPage(1);
  }, [customerSearch, customerFilter, paymentFilter, cycleFilter]);

  // Customer action handlers
  const handleViewCustomer = async (customer: any) => {
    setSelectedCustomer(customer);
    setCustomerActionLoading(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Customer Details",
        description: `Viewing details for ${customer.name} (${customer.organization})`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load customer details",
        variant: "destructive",
      });
    } finally {
      setCustomerActionLoading(false);
    }
  };

  const handleViewPaymentHistory = async (customer: any) => {
    setCustomerActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Payment History",
        description: `Viewing payment history for ${customer.name}. Total spent: £${customer.totalSpent}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive",
      });
    } finally {
      setCustomerActionLoading(false);
    }
  };

  const handleManageSubscription = async (customer: any) => {
    setCustomerActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Subscription Management",
        description: `Managing ${customer.plan} subscription for ${customer.name}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to manage subscription",
        variant: "destructive",
      });
    } finally {
      setCustomerActionLoading(false);
    }
  };

  const handleSendEmail = async (customer: any) => {
    setCustomerActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Email Sent",
        description: `Email sent successfully to ${customer.email}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setCustomerActionLoading(false);
    }
  };

  const handleSuspendAccount = async (customer: any) => {
    setCustomerActionLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast({
        title: "Account Action",
        description: `Account action completed for ${customer.name}`,
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to perform account action",
        variant: "destructive",
      });
    } finally {
      setCustomerActionLoading(false);
    }
  };

  // Activity popup states
  const [selectedActivity, setSelectedActivity] =
    useState<RecentActivity | null>(null);
  const [showActivityModal, setShowActivityModal] = useState(false);

  // User management states
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userActionLoading, setUserActionLoading] = useState(false);

  // Define the renderFunnelPopup function
  const renderFunnelPopup = () => {
    if (!showFunnelPopup || !selectedFunnelStep) return null;

    const getFunnelStepData = (step: string) => {
      switch (step) {
        case "registration":
          return {
            title: "Initial Registration",
            icon: <UserPlus className="h-6 w-6" />,
            color: "blue",
            totalUsers: 1247,
            percentage: 100,
            conversionRate: 91.6,
            nextStepUsers: 1142,
            avgTimeSpent: "2.3 min",
            dropOffReasons: [
              { reason: "Complex form fields", percentage: 45 },
              { reason: "Email verification delay", percentage: 30 },
              { reason: "Password requirements", percentage: 25 },
            ],
            keyMetrics: [
              { label: "Form Completion Rate", value: "87.3%", trend: "+5.2%" },
              {
                label: "Email Verification Rate",
                value: "91.6%",
                trend: "+8.1%",
              },
              { label: "Mobile Registration", value: "34.2%", trend: "+12.4%" },
              { label: "Social Sign-ups", value: "42.7%", trend: "+18.9%" },
            ],
            recentActivity: [
              {
                time: "2 min ago",
                user: "Sarah Johnson",
                action: "Completed registration",
                status: "success",
              },
              {
                time: "5 min ago",
                user: "Michael Chen",
                action: "Started form",
                status: "in-progress",
              },
              {
                time: "8 min ago",
                user: "Emily Rodriguez",
                action: "Email verified",
                status: "success",
              },
              {
                time: "12 min ago",
                user: "David Thompson",
                action: "Registration abandoned",
                status: "failed",
              },
            ],
          };
        default:
          return null;
      }
    };

    const stepData = getFunnelStepData(selectedFunnelStep);
    if (!stepData) return null;

    return (
      <Dialog open={showFunnelPopup} onOpenChange={setShowFunnelPopup}>
        <DialogContent
          className={`max-w-4xl max-h-[80vh] overflow-y-auto ${isDarkMode ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`}>
          <DialogHeader>
            <DialogTitle
              className={`text-xl font-bold ${isDarkMode ? "text-gray-200" : "text-gray-900"}`}>
              {stepData.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="text-center">
              <div className="text-sm text-gray-500">Sample funnel data</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [profileUserId, setProfileUserId] = useState<number | null>(null);

  // Onboarding funnel popup states
  const [showFunnelPopup, setShowFunnelPopup] = useState(false);
  const [selectedFunnelStep, setSelectedFunnelStep] = useState<string | null>(
    null,
  );

  // Authentication tracking states
  const [authTimeRange, setAuthTimeRange] = useState("7d");

  // Authentication timeline data
  const authTimelineData = [
    { time: "00:00", successful: 45, failed: 2, sessions: 123 },
    { time: "04:00", successful: 23, failed: 1, sessions: 89 },
    { time: "08:00", successful: 134, failed: 5, sessions: 245 },
    { time: "12:00", successful: 189, failed: 3, sessions: 332 },
    { time: "16:00", successful: 167, failed: 4, sessions: 298 },
    { time: "20:00", successful: 98, failed: 2, sessions: 201 },
  ];

  // Recent authentication events
  const recentAuthEvents = [
    {
      type: "success",
      user: "Pastor David Kim",
      action: "Successful login",
      location: "Los Angeles, CA",
      device: "Chrome on Windows",
      time: "2 minutes ago",
    },
    {
      type: "failed",
      user: "Unknown User",
      action: "Failed login attempt",
      location: "Unknown Location",
      device: "Firefox on Mac",
      time: "5 minutes ago",
    },
    {
      type: "success",
      user: "Rev. Sarah Johnson",
      action: "Successful login",
      location: "New York, NY",
      device: "Safari on iPhone",
      time: "8 minutes ago",
    },
    {
      type: "logout",
      user: "Pastor Michael Chen",
      action: "Session ended",
      location: "Chicago, IL",
      device: "Edge on Windows",
      time: "12 minutes ago",
    },
    {
      type: "suspicious",
      user: "Rev. Lisa Thompson",
      action: "Multiple failed attempts",
      location: "Atlanta, GA",
      device: "Chrome on Android",
      time: "15 minutes ago",
    },
  ];

  // User action handlers
  const handleUserAction = async (
    userId: number,
    action: string,
    userData: any,
  ) => {
    setUserActionLoading(true);
    setSelectedUserId(userId);

    try {
      switch (action) {
        case "view":
          setProfileUserId(userId);
          setShowUserProfile(true);
          setUserActionLoading(false);
          setSelectedUserId(null);
          return;

        case "suspend":
          if (userData.status === "Suspended") {
            toast({
              title: "Account Reactivated",
              description: `${userData.name}'s account has been reactivated`,
            });
          } else {
            toast({
              title: "Account Suspended",
              description: `${userData.name}'s account has been suspended`,
            });
          }
          break;

        case "payment_reminder":
          toast({
            title: "Payment Reminder Sent",
            description: `Payment reminder email sent to ${userData.email}`,
          });
          break;

        case "archive":
          toast({
            title: "User Archived",
            description: `${userData.name} has been archived and moved to inactive users`,
          });
          break;

        case "reset_password":
          toast({
            title: "Password Reset",
            description: `Password reset link sent to ${userData.email}`,
          });
          break;

        case "upgrade_plan":
          toast({
            title: "Plan Upgrade",
            description: `Opening plan upgrade options for ${userData.name}`,
          });
          break;

        default:
          break;
      }
    } catch (error) {
      toast({
        title: "Action Failed",
        description: "Failed to perform user action. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUserActionLoading(false);
      setSelectedUserId(null);
    }
  };

  // Auto-adjust grouping based on date range for better visualization
  useEffect(() => {
    const smartGrouping = () => {
      switch (chartDateRange) {
        case "7d":
          return "day";
        case "30d":
          return "day";
        case "90d":
          return "week";
        case "1y":
          return "month";
        default:
          return "day";
      }
    };
    setChartGroupBy(smartGrouping());
  }, [chartDateRange]);

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("superadmin-theme");
    if (savedTheme) {
      setIsDarkMode(savedTheme === "dark");
    }
  }, []);

  // Save theme preference to localStorage
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem("superadmin-theme", newTheme ? "dark" : "light");
  };

  // Data fetching with proper admin key
  const adminKey = "qworship-superadmin-2025";

  const { data: trialAnalytics, isLoading: trialsLoading } = useQuery({
    queryKey: ["/api/admin/trial-analytics", dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/trial-analytics?dateRange=${dateRange}&adminKey=${adminKey}`,
      );
      if (!response.ok) throw new Error("Failed to fetch trial analytics");
      return response.json();
    },
  });

  const { data: userMetrics, isLoading: userLoading } = useQuery({
    queryKey: ["/api/admin/user-metrics", dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/user-metrics?dateRange=${dateRange}&adminKey=${adminKey}`,
      );
      if (!response.ok) throw new Error("Failed to fetch user metrics");
      return response.json();
    },
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ["/api/admin/revenue-data", dateRange],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/revenue-data?dateRange=${dateRange}&adminKey=${adminKey}`,
      );
      if (!response.ok) throw new Error("Failed to fetch revenue data");
      return response.json();
    },
  });

  const { data: systemMetrics, isLoading: systemLoading } = useQuery({
    queryKey: ["/api/admin/system-metrics"],
    queryFn: async () => {
      const response = await fetch(
        `/api/admin/system-metrics?adminKey=${adminKey}`,
      );
      if (!response.ok) throw new Error("Failed to fetch system metrics");
      return response.json();
    },
  });

  const isLoading =
    trialsLoading || userLoading || revenueLoading || systemLoading;

  const themeClasses = {
    background: isDarkMode ? "bg-gray-900" : "bg-gray-50",
    headerBackground: isDarkMode ? "bg-gray-800" : "bg-white",
    sidebarBackground: isDarkMode ? "bg-gray-800" : "bg-white",
    cardBackground: isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200",
    primaryText: isDarkMode ? "text-white" : "text-gray-900",
    secondaryText: isDarkMode ? "text-gray-300" : "text-gray-600",
    sectionHeader: isDarkMode ? "text-gray-400" : "text-gray-500",
    border: isDarkMode ? "border-gray-700" : "border-gray-200",
    inputBackground: isDarkMode
      ? "bg-gray-700 border-gray-600"
      : "bg-white border-gray-300",
    inputField: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400"
      : "bg-white border-gray-300 text-gray-900 placeholder-gray-500",
    button: isDarkMode
      ? "text-gray-300 hover:text-white hover:bg-gray-700"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    buttonSecondary: isDarkMode
      ? "text-gray-300 hover:text-gray-100 hover:bg-gray-700"
      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
    dropdownBackground: isDarkMode
      ? "bg-gray-800 border-gray-700"
      : "bg-white border-gray-200",
    dropdownItem: isDarkMode
      ? "text-gray-300 hover:bg-gray-700"
      : "text-gray-700 hover:bg-gray-100",
    // Sidebar navigation theming
    activeSidebarItem: isDarkMode
      ? "bg-blue-600 text-white"
      : "bg-blue-600 text-white",
    inactiveSidebarItem: isDarkMode ? "text-gray-300" : "text-gray-700",
    hoverSidebarItem: isDarkMode ? "bg-gray-700" : "bg-gray-100",
    activeSidebarIcon: "text-white",
    inactiveSidebarIcon: isDarkMode ? "text-gray-400" : "text-gray-500",
    activeSidebarText: "text-white",
    inactiveSidebarText: isDarkMode ? "text-gray-300" : "text-gray-700",
    activeSidebarSubtext: "text-blue-100",
    inactiveSidebarSubtext: isDarkMode ? "text-gray-400" : "text-gray-500",
    // Gradient cards for metrics with proper theming
    userCard: isDarkMode
      ? "bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700"
      : "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200",
    trialCard: isDarkMode
      ? "bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700"
      : "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200",
    revenueCard: isDarkMode
      ? "bg-gradient-to-br from-pink-900 to-pink-800 border-pink-700"
      : "bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200",
    systemCard: isDarkMode
      ? "bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700"
      : "bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200",
    analyticsCard: isDarkMode
      ? "bg-gray-800/95 border-gray-600 backdrop-blur-sm"
      : "bg-white border-gray-200",
    selectTrigger: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100 hover:bg-gray-600"
      : "bg-white border-gray-300 text-gray-900 hover:bg-gray-50",
    selectContent: isDarkMode
      ? "bg-gray-700 border-gray-600 text-gray-100"
      : "bg-white border-gray-300 text-gray-900",
  };

  // Sidebar navigation items
  const sidebarItems = [
    {
      section: "Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: Home,
          description: "Main analytics overview",
        },
        {
          id: "insights",
          label: "Business Insights",
          icon: BarChart3,
          description: "Key business metrics",
        },
      ],
    },
    {
      section: "User Management",
      items: [
        {
          id: "users",
          label: "User Analytics",
          icon: Users,
          description: "User registration & activity",
        },
        {
          id: "trials",
          label: "Trial Management",
          icon: Clock,
          description: "Free trial tracking",
        },
        {
          id: "onboarding",
          label: "User Onboarding",
          icon: UserCheck,
          description: "Signup flow analytics",
        },
        {
          id: "authentication",
          label: "Auth Tracking",
          icon: Shield,
          description: "Login & security events",
        },
      ],
    },
    {
      section: "Business Operations",
      items: [
        {
          id: "revenue",
          label: "Revenue Analytics",
          icon: DollarSign,
          description: "Financial performance",
        },
        {
          id: "subscriptions",
          label: "Subscriptions",
          icon: CreditCard,
          description: "Plan management",
        },
        {
          id: "organizations",
          label: "Organizations",
          icon: Briefcase,
          description: "Church & org tracking",
        },
        {
          id: "conversion",
          label: "Conversion Funnel",
          icon: Target,
          description: "User journey optimization",
        },
      ],
    },
    {
      section: "Platform Management",
      items: [
        {
          id: "system",
          label: "System Health",
          icon: Activity,
          description: "Platform monitoring",
        },
        {
          id: "notifications",
          label: "Notifications",
          icon: Bell,
          description: "Email & alert systems",
        },
        {
          id: "database",
          label: "Database Analytics",
          icon: Database,
          description: "Data storage metrics",
        },
        {
          id: "api",
          label: "API Usage",
          icon: Zap,
          description: "Endpoint performance",
        },
      ],
    },
    {
      section: "Content & Features",
      items: [
        {
          id: "bible-widget",
          label: "Bible Widget Usage",
          icon: FileText,
          description: "AI Bible companion analytics",
        },
        {
          id: "features",
          label: "Feature Adoption",
          icon: PieChart,
          description: "Product feature tracking",
        },
        {
          id: "feedback",
          label: "User Feedback",
          icon: MessageSquare,
          description: "Support & testimonials",
        },
        {
          id: "global",
          label: "Global Reach",
          icon: Globe,
          description: "Worldwide usage patterns",
        },
        {
          id: "policies",
          label: "Policies",
          icon: Shield,
          description: "Privacy, refund, and legal policy management",
        },
        {
          id: "media-assets",
          label: "Media & Assets",
          icon: FileText,
          description: "Cloud media assets management for all users",
        },
      ],
    },
    {
      section: "Administration",
      items: [
        {
          id: "admin-management",
          label: "Admin Management",
          icon: Shield,
          description: "Manage administrator accounts and permissions",
        },
        {
          id: "contact-data",
          label: "Contact Data",
          icon: MessageSquare,
          description: "Manage contact form submissions",
        },
        {
          id: "reports",
          label: "Custom Reports",
          icon: FileText,
          description: "Export & data analysis",
        },
        {
          id: "settings",
          label: "Admin Settings",
          icon: Settings,
          description: "Platform configuration",
        },
        {
          id: "support",
          label: "Support Center",
          icon: HelpCircle,
          description: "Help desk management",
        },
        {
          id: "resource-centre",
          label: "Resource Centre",
          icon: Book,
          description: "Manage Help & Support content",
        },
      ],
    },
  ];

  // Historical chart, regional demographics, and activity mock logic has been extracted directly to features/super-admin/components/views/DashboardView.tsx



  // System performance data for System Health page
  const systemPerformanceData = [
    { time: "00:00", uptime: 99.8, response: 89, cpu: 67, memory: 45 },
    { time: "04:00", uptime: 99.9, response: 92, cpu: 72, memory: 48 },
    { time: "08:00", uptime: 99.7, response: 156, cpu: 85, memory: 62 },
    { time: "12:00", uptime: 99.8, response: 134, cpu: 78, memory: 55 },
    { time: "16:00", uptime: 99.9, response: 98, cpu: 69, memory: 47 },
    { time: "20:00", uptime: 99.8, response: 87, cpu: 64, memory: 43 },
  ];

  // Export functionality
  const exportData = async (reportType: string) => {
    try {
      const response = await fetch(
        `/api/admin/export/${reportType}?dateRange=${dateRange}&adminKey=${adminKey}`,
      );
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = `${reportType}-${dateRange}-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  // Handle activity item click
  const handleActivityClick = (activity: RecentActivity) => {
    setSelectedActivity(activity);
    setShowActivityModal(true);
  };

  // Handle redirect actions from activity modal
  const handleRedirectToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setShowActivityModal(false);
  };

  // Admin Management Component
  const AdminManagementView = () => {
    return <AdminManagement adminKey={adminKey} />;
  };
  const renderMainContent = () => {
    // Shared user profile logic
    if (showUserProfile && profileUserId) {
      return (
        <UserProfileView
          userId={profileUserId}
          onClose={() => {
            setShowUserProfile(false);
            setProfileUserId(null);
          }}
          isDarkMode={isDarkMode}
        />
      );
    }

    if (activeSection === "user-profile" && selectedUserId) {
      return (
        <UserProfileView
          userId={selectedUserId}
          onClose={() => {
            setActiveSection("onboarding");
            setSelectedUserId(null);
          }}
          isDarkMode={isDarkMode}
        />
      );
    }

    switch (activeSection) {
      // Dashboard
      case "dashboard":
        return <DashboardView 
                 isDarkMode={isDarkMode} 
                 themeClasses={themeClasses} 
                 dateRange={dateRange} 
                 adminKey={adminKey} 
               />;

      // User Management
      case "users":
      case "analytics":
        return <UserAnalyticsView 
                 isDarkMode={isDarkMode} 
                 themeClasses={themeClasses} 
                 dateRange={dateRange} 
                 adminKey={adminKey} 
               />;
      case "trials":
        return <TrialManagementView 
                 isDarkMode={isDarkMode} 
                 themeClasses={themeClasses} 
                 dateRange={dateRange} 
                 adminKey={adminKey} 
               />;
      case "onboarding":
        return <UserOnboarding onSetActiveSection={setActiveSection} />;
      case "auth":
        return <AuthTracking onSetActiveSection={setActiveSection} />;

      // Business Operations
      case "revenue":
      case "subscriptions":
      case "organizations":
      case "conversion":
        return <RevenueAnalyticsView 
                 isDarkMode={isDarkMode} 
                 themeClasses={themeClasses} 
                 dateRange={dateRange} 
                 adminKey={adminKey} 
               />;

      // Platform Management
      case "system":
      case "notifications":
      case "database":
      case "api":
      case "health":
        return <SystemHealthView 
                 isDarkMode={isDarkMode} 
                 themeClasses={themeClasses} 
                 adminKey={adminKey} 
               />;

      // Content & Features
      case "policies":
        return <div className="p-8"><h2 className="text-2xl font-bold">Policies Data</h2><p className="text-muted-foreground mt-2">This section has been omitted in the desktop client.</p></div>;
      case "media-assets":
        return <SuperAdminMediaAssets isDarkMode={isDarkMode} />;

      // Administration
      case "admin-management":
        return <AdminManagement adminKey={adminKey} />;
      case "contact-data":
        return <ContactData adminKey={adminKey} />;
      case "support":
        return (
          <SupportCentreAdmin />
        );
      case "resource-centre":
        return (
          <ResourceCentreAdmin />
        );

      default:
        // Fallback for unhandled sections
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full">
            <h2
              className={`text-2xl font-bold mb-4 ${themeClasses.primaryText}`}>
              Section under construction
            </h2>
            <p className={themeClasses.secondaryText}>
              The {activeSection.replace("-", " ")} feature is currently being
              developed.
            </p>
          </div>
        );
    }
  };

  return (
    <div
      className={`h-screen ${themeClasses.background} font-sans flex flex-col overflow-hidden`}>
      {/* Top Bar */}
      <AdminTopBar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExportData={exportData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        activeSection={activeSection}
        setActiveSection={setActiveSection}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`w-80 ${themeClasses.sidebarBackground} border-r ${themeClasses.border} flex-shrink-0 flex flex-col`}>
          {/* Sidebar Header */}
          <div
            className={`${themeClasses.headerBackground} border-b ${themeClasses.border} p-6 flex-shrink-0`}>
            <div className="flex items-center space-x-3">
              <div>
                <span
                  className={`text-lg font-bold [font-family:'Lufga-Medium',Helvetica] ${themeClasses.primaryText}`}>
                  SuperAdmin Portal
                </span>
                <p className={`text-sm ${themeClasses.secondaryText}`}>
                  Management Dashboard
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-6">
              {sidebarItems.map((section, index) => (
                <div key={index}>
                  <h3
                    className={`text-xs font-semibold uppercase tracking-wider mb-3 ${themeClasses.sectionHeader}`}>
                    {section.section}
                  </h3>
                  <div className="space-y-1">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive =
                        activeSection === item.id && !showUserProfile;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveSection(item.id);
                            setShowUserProfile(false);
                            setProfileUserId(null);
                          }}
                          className={`w-full flex items-center px-3 py-2 rounded-lg text-left transition-all duration-200 group ${
                            isActive
                              ? `${themeClasses.activeSidebarItem} shadow-sm`
                              : `${themeClasses.inactiveSidebarItem} hover:${themeClasses.hoverSidebarItem}`
                          }`}>
                          <Icon
                            className={`h-4 w-4 mr-3 flex-shrink-0 ${
                              isActive
                                ? themeClasses.activeSidebarIcon
                                : themeClasses.inactiveSidebarIcon
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <div
                              className={`text-sm font-medium [font-family:'Lufga-Medium',Helvetica] ${
                                isActive
                                  ? themeClasses.activeSidebarText
                                  : themeClasses.inactiveSidebarText
                              }`}>
                              {item.label}
                            </div>
                            <div
                              className={`text-xs truncate ${
                                isActive
                                  ? themeClasses.activeSidebarSubtext
                                  : themeClasses.inactiveSidebarSubtext
                              }`}>
                              {item.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar Footer */}
          <div className={`border-t ${themeClasses.border} p-4 flex-shrink-0`}>
            <Button
              variant="ghost"
              size="sm"
              className={`w-full justify-start ${themeClasses.button}`}
              onClick={() => setLocation("/")}>
              <LogOut className="h-4 w-4 mr-2" />
              Exit SuperAdmin
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Section Header */}
          <div
            className={`${themeClasses.headerBackground} border-b ${themeClasses.border} px-6 py-4 flex-shrink-0`}>
            <div className="flex items-center justify-between">
              <div>
                <h1
                  className={`text-2xl font-bold [font-family:'Lufga-Medium',Helvetica] ${themeClasses.primaryText}`}>
                  {showUserProfile
                    ? "User Profile"
                    : sidebarItems
                        .flatMap((s) => s.items)
                        .find((item) => item.id === activeSection)?.label ||
                      "Dashboard"}
                </h1>
                <p className={`mt-1 ${themeClasses.secondaryText}`}>
                  {showUserProfile
                    ? "Comprehensive user profile and management"
                    : sidebarItems
                        .flatMap((s) => s.items)
                        .find((item) => item.id === activeSection)
                        ?.description ||
                      "Comprehensive analytics and management"}
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <Card
                    key={i}
                    className={`animate-pulse ${themeClasses.cardBackground}`}>
                    <CardHeader className="pb-2">
                      <div
                        className={`h-4 rounded w-3/4 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    </CardHeader>
                    <CardContent>
                      <div
                        className={`h-8 rounded w-1/2 mb-2 ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                      <div
                        className={`h-3 rounded w-full ${isDarkMode ? "bg-gray-700" : "bg-gray-300"}`}></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              renderMainContent()
            )}
          </div>
        </div>
      </div>

      {/* Render Funnel Popup */}
      {renderFunnelPopup()}
    </div>
  );
}
