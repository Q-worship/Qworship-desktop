import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserAnalyticsViewProps {
  isDarkMode: boolean;
  themeClasses: any;
  dateRange: string;
  adminKey: string;
}

export const UserAnalyticsView: React.FC<UserAnalyticsViewProps> = ({ 
  isDarkMode, 
  themeClasses, 
  dateRange, 
  adminKey 
}) => {
  const { data: userMetrics } = useQuery({
    queryKey: ['/api/admin/user-metrics', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/user-metrics?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch user metrics');
      return response.json();
    },
  });

  return (
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
            <div>
              <div className="text-2xl font-bold text-indigo-500">{userMetrics?.monthlySignups || 0}</div>
              <div className={`text-sm ${themeClasses.secondaryText}`}>Monthly Signups</div>
            </div>
          </div>
          <div className="pt-4 border-t border-dashed mt-4">
            <div className={`text-sm ${themeClasses.secondaryText}`}>Email Verification Rate</div>
            <div className="text-xl font-semibold text-blue-500">{userMetrics?.emailVerificationRate || 0}%</div>
          </div>
        </CardContent>
      </Card>

      <Card className={themeClasses.analyticsCard}>
        <CardHeader>
          <CardTitle className={themeClasses.primaryText}>Organization Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className={`flex justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <span className={themeClasses.secondaryText}>Organizations Created:</span>
              <span className={`font-semibold ${themeClasses.primaryText}`}>{userMetrics?.organizationsCreated || 0}</span>
            </div>
            <div className={`flex justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <span className={themeClasses.secondaryText}>Active Users:</span>
              <span className={`font-semibold ${themeClasses.primaryText}`}>{userMetrics?.activeUsers || 0}</span>
            </div>
            <div className={`flex justify-between p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <span className={themeClasses.secondaryText}>Total Registrations (All time):</span>
              <span className={`font-semibold ${themeClasses.primaryText}`}>{userMetrics?.totalRegistrations || 0}</span>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className={`col-span-1 md:col-span-2 ${themeClasses.analyticsCard}`}>
        <CardHeader>
          <CardTitle className={themeClasses.primaryText}>User Demographic Distribution</CardTitle>
        </CardHeader>
        <CardContent>
           <div className={`text-sm ${themeClasses.secondaryText} p-8 text-center border rounded-lg border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <p className="mb-2 text-lg font-medium">User Distribution Connect</p>
            Detailed charts for geographical and organizational distribution of users will be securely loaded here.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
