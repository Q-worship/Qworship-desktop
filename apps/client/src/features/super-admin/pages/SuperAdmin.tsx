import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import AdminTopBar from "@/features/super-admin/components/AdminTopBar";
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
  CreditCard,
  Bell,
  Home,
  PieChart,
  Target,
  Briefcase,
  MessageSquare,
  HelpCircle,
  LogOut,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Link } from 'wouter';

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

export default function SuperAdmin() {
  const [dateRange, setDateRange] = useState('30d');
  const [userFilter, setUserFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [activeSection, setActiveSection] = useState('dashboard'); // Sidebar navigation state

  // Load theme preference from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('superadmin-theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  // Save theme preference
  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('superadmin-theme', newTheme ? 'dark' : 'light');
  };

  // Theme-aware class generator
  const getThemeClasses = () => ({
    // Page backgrounds
    pageBackground: isDarkMode ? 'bg-gray-950' : 'bg-gray-50',
    headerBackground: isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    cardBackground: isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    
    // Text colors
    primaryText: isDarkMode ? 'text-white' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-300' : 'text-gray-600',
    
    // Form elements
    selectBackground: isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900',
    selectContent: isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200',
    selectItem: isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-900 hover:bg-gray-100',
    inputBackground: isDarkMode ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    
    // Tab system
    tabsList: isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-gray-100 border-gray-200',
    tabTrigger: isDarkMode ? 'text-gray-300' : 'text-gray-700',
    
    // Metric cards - completely light in light mode
    userCard: isDarkMode ? 'bg-gradient-to-br from-blue-900 to-blue-800 border-blue-700 text-white' : 'bg-white border-gray-200 text-gray-900',
    trialCard: isDarkMode ? 'bg-gradient-to-br from-purple-900 to-purple-800 border-purple-700 text-white' : 'bg-white border-gray-200 text-gray-900',
    revenueCard: isDarkMode ? 'bg-gradient-to-br from-pink-900 to-pink-800 border-pink-700 text-white' : 'bg-white border-gray-200 text-gray-900',
    systemCard: isDarkMode ? 'bg-gradient-to-br from-indigo-900 to-indigo-800 border-indigo-700 text-white' : 'bg-white border-gray-200 text-gray-900',
    
    // Analytics section cards - light in light mode
    analyticsCard: isDarkMode ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200',
    
    // Progress bars
    progressBackground: isDarkMode ? 'bg-gray-700' : 'bg-gray-200',
    progressFill: isDarkMode ? 'bg-gradient-to-r from-green-500 to-blue-500' : 'bg-gradient-to-r from-green-600 to-blue-600'
  });

  // Fetch analytics data with admin authentication
  const adminKey = 'qworship-superadmin-2025'; // In production, get from secure storage
  
  const { data: trialAnalytics, isLoading: trialLoading } = useQuery<TrialAnalytics>({
    queryKey: ['/api/admin/trial-analytics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/trial-analytics?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch trial analytics');
      return response.json();
    },
  });

  const { data: userMetrics, isLoading: userLoading } = useQuery<UserMetrics>({
    queryKey: ['/api/admin/user-metrics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/user-metrics?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch user metrics');
      return response.json();
    },
  });

  const { data: revenueData, isLoading: revenueLoading } = useQuery<RevenueData>({
    queryKey: ['/api/admin/revenue-data', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/revenue-data?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
  });

  const { data: systemMetrics, isLoading: systemLoading } = useQuery<SystemMetrics>({
    queryKey: ['/api/admin/system-metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/system-metrics?adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json();
    },
  });

  const { data: usersList } = useQuery({
    queryKey: ['/api/admin/users', userFilter, searchTerm],
  });

  const { data: trialsList } = useQuery({
    queryKey: ['/api/admin/trials', userFilter],
  });

  const exportData = async (type: string) => {
    try {
      const adminKey = 'qworship-superadmin-2025'; // In production, get from secure storage
      let url = '';
      
      switch (type) {
        case 'trial-report':
          url = `/api/admin/export/trial-report?dateRange=${dateRange}&adminKey=${adminKey}`;
          break;
        case 'user-report':
          url = `/api/admin/export/user-report?dateRange=${dateRange}&adminKey=${adminKey}`;
          break;
        case 'revenue-report':
          url = `/api/admin/export/revenue-report?dateRange=${dateRange}&adminKey=${adminKey}`;
          break;
        default:
          console.log(`Exporting all data for ${dateRange}...`);
          return;
      }
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${type}-${dateRange}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`${type} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const isLoading = trialLoading || userLoading || revenueLoading || systemLoading;
  const themeClasses = getThemeClasses();

  return (
    <div className={`min-h-screen ${themeClasses.pageBackground}`}>
      {/* Top Bar */}
      <AdminTopBar
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        dateRange={dateRange}
        setDateRange={setDateRange}
        onExportData={exportData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
      />

      <div className="p-6">
        <div className="mb-6">
          <h1 className={`text-3xl font-bold [font-family:'Lufga-Medium',Helvetica] ${themeClasses.primaryText}`}>
            Q-worship SuperAdmin Dashboard
          </h1>
          <p className={`mt-1 ${themeClasses.secondaryText}`}>Comprehensive analytics and management for Q-worship platform</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className={`animate-pulse ${themeClasses.cardBackground}`}>
                <CardHeader className="pb-2">
                  <div className={`h-4 rounded w-3/4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </CardHeader>
                <CardContent>
                  <div className={`h-8 rounded w-1/2 mb-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                  <div className={`h-3 rounded w-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-300'}`}></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <>
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className={themeClasses.userCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-blue-100' : 'text-blue-800'}`}>Total Users</CardTitle>
                  <Users className={`h-4 w-4 ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>{userMetrics?.totalRegistrations?.toLocaleString() || '0'}</div>
                  <p className={`text-xs ${isDarkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                    +{userMetrics?.dailySignups || 0} today
                  </p>
                </CardContent>
              </Card>

              <Card className={themeClasses.trialCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-purple-100' : 'text-purple-800'}`}>Active Trials</CardTitle>
                  <Clock className={`h-4 w-4 ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-purple-900'}`}>{trialAnalytics?.activeTrials?.toLocaleString() || '0'}</div>
                  <p className={`text-xs ${isDarkMode ? 'text-purple-200' : 'text-purple-700'}`}>
                    {trialAnalytics?.trialConversionRate || 0}% conversion rate
                  </p>
                </CardContent>
              </Card>

              <Card className={themeClasses.revenueCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-pink-100' : 'text-pink-800'}`}>Monthly Revenue</CardTitle>
                  <DollarSign className={`h-4 w-4 ${isDarkMode ? 'text-pink-300' : 'text-pink-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-pink-900'}`}>£{revenueData?.monthlyRecurringRevenue?.toLocaleString() || '0'}</div>
                  <p className={`text-xs ${isDarkMode ? 'text-pink-200' : 'text-pink-700'}`}>
                    £{revenueData?.averageRevenuePerUser || 0} ARPU
                  </p>
                </CardContent>
              </Card>

              <Card className={themeClasses.systemCard}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className={`text-sm font-medium ${isDarkMode ? 'text-indigo-100' : 'text-indigo-800'}`}>System Health</CardTitle>
                  <Activity className={`h-4 w-4 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`} />
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-900'}`}>{systemMetrics?.systemUptime || 99.9}%</div>
                  <p className={`text-xs ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
                    {systemMetrics?.activeConnections || 0} active connections
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Analytics Tabs */}
            <Tabs defaultValue="trials" className="space-y-4">
              <TabsList className={`grid w-full grid-cols-5 ${themeClasses.tabsList}`}>
                <TabsTrigger value="trials" className={`data-[state=active]:bg-blue-600 data-[state=active]:text-white ${themeClasses.tabTrigger}`}>Trial Management</TabsTrigger>
                <TabsTrigger value="users" className={`data-[state=active]:bg-purple-600 data-[state=active]:text-white ${themeClasses.tabTrigger}`}>User Analytics</TabsTrigger>
                <TabsTrigger value="revenue" className={`data-[state=active]:bg-pink-600 data-[state=active]:text-white ${themeClasses.tabTrigger}`}>Revenue Data</TabsTrigger>
                <TabsTrigger value="system" className={`data-[state=active]:bg-indigo-600 data-[state=active]:text-white ${themeClasses.tabTrigger}`}>System Metrics</TabsTrigger>
                <TabsTrigger value="reports" className={`data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-purple-600 data-[state=active]:text-white ${themeClasses.tabTrigger}`}>Custom Reports</TabsTrigger>
              </TabsList>

              {/* Trial Management Tab */}
              <TabsContent value="trials" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                        <AlertTriangle className="h-5 w-5 text-orange-400" />
                        Upcoming Expirations
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Today:</span>
                        <Badge className="bg-red-600 text-white border-0">{trialAnalytics?.upcomingExpirations?.today || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>This Week:</span>
                        <Badge className="bg-orange-600 text-white border-0">{trialAnalytics?.upcomingExpirations?.thisWeek || 0}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>This Month:</span>
                        <Badge className="bg-yellow-600 text-white border-0">{trialAnalytics?.upcomingExpirations?.thisMonth || 0}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Trial Performance</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className={themeClasses.secondaryText}>Conversion Rate</span>
                          <span className={themeClasses.primaryText}>{trialAnalytics?.trialConversionRate || 0}%</span>
                        </div>
                        <div className={`w-full rounded-full h-2 ${themeClasses.progressBackground}`}>
                          <div 
                            className={`h-2 rounded-full ${themeClasses.progressFill}`}
                            style={{ width: `${trialAnalytics?.trialConversionRate || 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <span className={`text-sm ${themeClasses.secondaryText}`}>Average Trial Duration</span>
                        <div className={`text-lg font-semibold ${themeClasses.primaryText}`}>{trialAnalytics?.averageTrialDuration || 0} days</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Email Notifications</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Total Sent:</span>
                        <span className={themeClasses.primaryText}>{systemMetrics?.emailsSent?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Delivery Rate:</span>
                        <Badge className="bg-green-600 text-white border-0">{systemMetrics?.emailDeliveryRate || 0}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Notifications:</span>
                        <span className={themeClasses.primaryText}>{systemMetrics?.notificationsSent?.toLocaleString() || 0}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Trial Users Table */}
                <Card className={themeClasses.analyticsCard}>
                  <CardHeader>
                    <CardTitle className={themeClasses.primaryText}>Trial Users Management</CardTitle>
                    <div className="flex gap-2">
                      <div className="relative flex-1 max-w-sm">
                        <Search className={`absolute left-2 top-2.5 h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`pl-8 ${themeClasses.inputBackground}`}
                        />
                      </div>
                      <Select value={userFilter} onValueChange={setUserFilter}>
                        <SelectTrigger className={`w-48 ${themeClasses.selectBackground}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={themeClasses.selectContent}>
                          <SelectItem value="all" className={themeClasses.selectItem}>All Users</SelectItem>
                          <SelectItem value="active_trial" className={themeClasses.selectItem}>Active Trials</SelectItem>
                          <SelectItem value="expiring_soon" className={themeClasses.selectItem}>Expiring Soon</SelectItem>
                          <SelectItem value="expired" className={themeClasses.selectItem}>Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className={`text-sm ${themeClasses.secondaryText}`}>
                      Detailed user trial data would be displayed here with real-time status updates, 
                      remaining days, notification history, and management actions.
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* User Analytics Tab */}
              <TabsContent value="users" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Registration Trends</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-2xl font-bold text-purple-500">{userMetrics?.dailySignups || 0}</div>
                          <div className={`text-sm ${themeClasses.secondaryText}`}>Daily Signups</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-pink-500">{userMetrics?.weeklySignups || 0}</div>
                          <div className={`text-sm ${themeClasses.secondaryText}`}>Weekly Signups</div>
                        </div>
                      </div>
                      <div>
                        <div className={`text-sm ${themeClasses.secondaryText}`}>Email Verification Rate</div>
                        <div className="text-lg font-semibold text-blue-500">{userMetrics?.emailVerificationRate || 0}%</div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Organization Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className={themeClasses.secondaryText}>Organizations Created:</span>
                          <span className={`font-semibold ${themeClasses.primaryText}`}>{userMetrics?.organizationsCreated || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={themeClasses.secondaryText}>Active Users:</span>
                          <span className={`font-semibold ${themeClasses.primaryText}`}>{userMetrics?.activeUsers || 0}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Revenue Data Tab */}
              <TabsContent value="revenue" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Revenue Overview</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Total Revenue:</span>
                        <span className="font-bold text-green-500">£{revenueData?.totalRevenue?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>MRR:</span>
                        <span className="font-bold text-blue-500">£{revenueData?.monthlyRecurringRevenue?.toLocaleString() || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Customer Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>ARPU:</span>
                        <span className="text-purple-500">£{revenueData?.averageRevenuePerUser || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>LTV:</span>
                        <span className="text-pink-500">£{revenueData?.lifetimeValue || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={themeClasses.primaryText}>Conversion & Churn</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Trial Conversion:</span>
                        <Badge className="bg-green-600 text-white border-0">{revenueData?.trialToPayingConversion || 0}%</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Churn Rate:</span>
                        <Badge className="bg-red-600 text-white border-0">{revenueData?.churnRate || 0}%</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* System Metrics Tab */}
              <TabsContent value="system" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                        <Database className="h-5 w-5 text-blue-500" />
                        Database Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Database Size:</span>
                        <span className={themeClasses.primaryText}>{systemMetrics?.databaseSize || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Active Connections:</span>
                        <span className={themeClasses.primaryText}>{systemMetrics?.activeConnections || 0}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className={themeClasses.analyticsCard}>
                    <CardHeader>
                      <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
                        <Mail className="h-5 w-5 text-purple-500" />
                        Communication Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Emails Sent:</span>
                        <span className={themeClasses.primaryText}>{systemMetrics?.emailsSent?.toLocaleString() || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={themeClasses.secondaryText}>Delivery Rate:</span>
                        <Badge className="bg-green-600 text-white border-0">{systemMetrics?.emailDeliveryRate || 0}%</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Custom Reports Tab */}
              <TabsContent value="reports" className="space-y-4">
                <Card className={themeClasses.analyticsCard}>
                  <CardHeader>
                    <CardTitle className={themeClasses.primaryText}>Custom Report Builder</CardTitle>
                    <CardDescription className={themeClasses.secondaryText}>
                      Generate custom reports for specific date ranges and metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Button 
                        onClick={() => exportData('trial-report')}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white border-0"
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        Trial Analytics Report
                      </Button>
                      <Button 
                        onClick={() => exportData('user-report')}
                        className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white border-0"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        User Growth Report
                      </Button>
                      <Button 
                        onClick={() => exportData('revenue-report')}
                        className="bg-gradient-to-r from-pink-600 to-pink-700 hover:from-pink-700 hover:to-pink-800 text-white border-0"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Revenue Analysis
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  );
}