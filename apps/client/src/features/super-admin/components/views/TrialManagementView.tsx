import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Search } from 'lucide-react';

interface TrialManagementViewProps {
  isDarkMode: boolean;
  themeClasses: any;
  dateRange: string;
  adminKey: string;
}

export const TrialManagementView: React.FC<TrialManagementViewProps> = ({ 
  isDarkMode, 
  themeClasses, 
  dateRange, 
  adminKey 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');

  const { data: trialAnalytics } = useQuery({
    queryKey: ['/api/admin/trial-analytics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/trial-analytics?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch trial analytics');
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

  return (
    <div className="space-y-6">
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
          <div className={`text-sm ${themeClasses.secondaryText} p-8 text-center border rounded-lg border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <p className="mb-2 text-lg font-medium">Trial User Directory Connect</p>
            Detailed user trial data will be displayed here securely. This module is connected to the master database. 
            Features will include extending trials, manual conversion overrides, and custom email notifications.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
