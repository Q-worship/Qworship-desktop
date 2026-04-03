import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Clock, DollarSign, Activity, MapPin, CheckCircle2, AlertCircle, TrendingUp, XCircle } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend
} from 'recharts';

interface DashboardViewProps {
  isDarkMode: boolean;
  themeClasses: any;
  dateRange: string;
  adminKey: string;
}

interface ChartData {
  date: string;
  users: number;
  revenue: number;
  trials: number;
  conversions: number;
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
  type: "signup" | "trial_start" | "plan_selection" | "payment" | "organization_setup";
  organization: string;
  description: string;
  status: "in_progress" | "completed" | "pending" | "failed";
  timestamp: string;
  progress: number;
  nextStep?: string;
}

// Regional usage data
const regionalData: RegionalData[] = [
  { region: "United Kingdom", users: 847, percentage: 42.3, growth: 12.5, color: "#3b82f6" },
  { region: "United States", users: 623, percentage: 31.2, growth: 8.7, color: "#8b5cf6" },
  { region: "Canada", users: 234, percentage: 11.7, growth: 15.2, color: "#06b6d4" },
  { region: "Australia", users: 156, percentage: 7.8, growth: 6.3, color: "#10b981" },
  { region: "Other", users: 140, percentage: 7.0, growth: 9.1, color: "#f59e0b" },
];

const recentActivities: RecentActivity[] = [
  { id: "1", type: "organization_setup", organization: "Grace Community Church", description: "Completed organization setup and team configuration", status: "completed", timestamp: "2 hours ago", progress: 100 },
  { id: "2", type: "plan_selection", organization: "New Life Fellowship", description: "Currently reviewing Premium plan features", status: "in_progress", timestamp: "4 hours ago", progress: 75, nextStep: "Payment processing" },
  { id: "3", type: "trial_start", organization: "City Heights Baptist", description: "Started 30-day free trial - Basic plan", status: "completed", timestamp: "6 hours ago", progress: 100 },
  { id: "4", type: "signup", organization: "Riverside Methodist", description: "User registration completed, pending email verification", status: "pending", timestamp: "8 hours ago", progress: 50, nextStep: "Email verification" },
  { id: "5", type: "payment", organization: "Hope Church International", description: "Premium subscription payment successful", status: "completed", timestamp: "12 hours ago", progress: 100 },
  { id: "6", type: "organization_setup", organization: "Trinity Anglican Church", description: "Setting up multi-campus organization structure", status: "in_progress", timestamp: "1 day ago", progress: 60, nextStep: "Campus configuration" },
];

export const DashboardView: React.FC<DashboardViewProps> = ({ 
  isDarkMode, 
  themeClasses, 
  dateRange, 
  adminKey 
}) => {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  const { data: userMetrics } = useQuery({
    queryKey: ['/api/admin/user-metrics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/user-metrics?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch user metrics');
      return response.json();
    },
  });

  const { data: trialAnalytics } = useQuery({
    queryKey: ['/api/admin/trial-analytics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/trial-analytics?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch trial analytics');
      return response.json();
    },
  });

  const { data: revenueData } = useQuery({
    queryKey: ['/api/admin/revenue-data', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/revenue-data?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/system-metrics?adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json();
    },
  });

  // Dynamic Chart Generation Effect matching original logic
  useEffect(() => {
    const data: ChartData[] = [];
    const startDate = new Date();
    const totalDays = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : dateRange === "90d" ? 90 : 365;
    startDate.setDate(startDate.getDate() - totalDays);

    const intervalCount = Math.min(totalDays, 30);
    const intervalDays = Math.max(1, Math.floor(totalDays / intervalCount));

    for (let i = 0; i < intervalCount; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i * intervalDays);
      
      const multiplier = intervalDays;
      const baseUsers = Math.floor((Math.random() * 50 + 20) * multiplier);
      const baseRevenue = Math.floor((Math.random() * 2000 + 500) * multiplier);
      const isCurrentPeriod = i === intervalCount - 1;
      const currentMultiplier = isCurrentPeriod ? 1.2 : 1;

      data.push({
        date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        users: Math.floor(baseUsers * currentMultiplier),
        revenue: Math.floor(baseRevenue * currentMultiplier),
        trials: Math.floor((Math.random() * 15 + 5) * multiplier),
        conversions: Math.floor((Math.random() * 8 + 2) * multiplier),
        period: "current"
      });
    }
    setChartData(data);
  }, [dateRange]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "in_progress": return <Activity className="h-4 w-4 text-blue-500" />;
      case "pending": return <Clock className="h-4 w-4 text-orange-500" />;
      case "failed": return <XCircle className="h-4 w-4 text-red-500" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Growth Chart */}
        <Card className={`lg:col-span-2 ${themeClasses.analyticsCard}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
              <TrendingUp className="h-5 w-5 text-blue-500" />
              User & Revenue Growth
            </CardTitle>
            <CardDescription className={themeClasses.secondaryText}>Aggregated metrics over {dateRange}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} vertical={false} />
                  <XAxis dataKey="date" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `£${value}`} />
                  <YAxis yAxisId="right" orientation="right" stroke={isDarkMode ? "#9ca3af" : "#6b7280"} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ 
                      backgroundColor: isDarkMode ? "#1f2937" : "#ffffff",
                      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
                      color: isDarkMode ? "#f3f4f6" : "#111827"
                    }}
                  />
                  <Legend verticalAlign="top" height={36}/>
                  <Area yAxisId="left" type="monotone" dataKey="revenue" name="Revenue" stroke="#ec4899" fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area yAxisId="right" type="monotone" dataKey="users" name="Active Users" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Regional Data */}
        <Card className={themeClasses.analyticsCard}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
              <MapPin className="h-5 w-5 text-purple-500" />
              Regional Demographics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {regionalData.map((region, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className={`font-medium ${themeClasses.primaryText}`}>{region.region}</span>
                    <span className={themeClasses.secondaryText}>{region.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ width: `${region.percentage}%`, backgroundColor: region.color }} 
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{region.users.toLocaleString()} users</span>
                    <span className="text-green-500">+{region.growth}% growth</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1">
        {/* Recent Activity Timeline */}
        <Card className={themeClasses.analyticsCard}>
          <CardHeader>
            <CardTitle className={themeClasses.primaryText}>Recent Platform Activity</CardTitle>
            <CardDescription className={themeClasses.secondaryText}>Live stream of significant client actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 pl-2">
              {recentActivities.map((activity, idx) => (
                <div key={activity.id} className="relative pl-8 pb-6 border-l last:border-0 border-gray-200 dark:border-gray-700">
                  <div className={`absolute -left-[9px] top-1 bg-white dark:bg-gray-900 rounded-full p-1 border ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                    {getStatusIcon(activity.status)}
                  </div>
                  <div className="flex flex-col space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${themeClasses.primaryText}`}>{activity.organization}</span>
                      <span className={`text-xs ${themeClasses.secondaryText}`}>{activity.timestamp}</span>
                    </div>
                    <p className={`text-sm ${themeClasses.secondaryText}`}>{activity.description}</p>
                    {activity.progress < 100 && (
                      <div className="mt-2 flex items-center gap-4">
                        <div className="flex-1 max-w-[200px] bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full bg-blue-500" style={{ width: `${activity.progress}%` }} />
                        </div>
                        <span className={`text-xs ${themeClasses.secondaryText}`}>Next step: {activity.nextStep}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
