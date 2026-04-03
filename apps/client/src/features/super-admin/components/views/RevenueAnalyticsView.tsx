import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface RevenueAnalyticsViewProps {
  isDarkMode: boolean;
  themeClasses: any;
  dateRange: string;
  adminKey: string;
}

export const RevenueAnalyticsView: React.FC<RevenueAnalyticsViewProps> = ({ 
  isDarkMode, 
  themeClasses, 
  dateRange, 
  adminKey 
}) => {
  const { data: revenueData } = useQuery({
    queryKey: ['/api/admin/revenue-data', dateRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/revenue-data?dateRange=${dateRange}&adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch revenue data');
      return response.json();
    },
  });

  return (
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
            <span className={themeClasses.secondaryText}>MRR (Monthly):</span>
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
            <span className="text-purple-500 font-semibold">£{revenueData?.averageRevenuePerUser || 0}</span>
          </div>
          <div className="flex justify-between">
            <span className={themeClasses.secondaryText}>LTV:</span>
            <span className="text-pink-500 font-semibold">£{revenueData?.lifetimeValue || 0}</span>
          </div>
        </CardContent>
      </Card>

      <Card className={themeClasses.analyticsCard}>
        <CardHeader>
          <CardTitle className={themeClasses.primaryText}>Conversion & Churn</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between items-center">
            <span className={themeClasses.secondaryText}>Trial Conversion:</span>
            <Badge className="bg-green-600 text-white border-0">{revenueData?.trialToPayingConversion || 0}%</Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className={themeClasses.secondaryText}>Churn Rate:</span>
            <Badge className="bg-red-600 text-white border-0">{revenueData?.churnRate || 0}%</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className={`col-span-1 md:col-span-3 ${themeClasses.analyticsCard}`}>
        <CardHeader>
          <CardTitle className={themeClasses.primaryText}>Historical Income Flow</CardTitle>
        </CardHeader>
        <CardContent>
           <div className={`text-sm ${themeClasses.secondaryText} p-8 text-center border rounded-lg border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <p className="mb-2 text-lg font-medium">Financial Metrics Projection</p>
            Line graph of Monthly Recurring Revenue vs Gross Income stream over {dateRange} will be rendered here via Recharts.
            Currently reporting a positive MRR pool of <strong className="text-blue-500">£{revenueData?.monthlyRecurringRevenue?.toLocaleString() || 0}</strong>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
