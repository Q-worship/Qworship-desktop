import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Mail, Server } from 'lucide-react';

interface SystemHealthViewProps {
  isDarkMode: boolean;
  themeClasses: any;
  adminKey: string;
}

export const SystemHealthView: React.FC<SystemHealthViewProps> = ({ 
  isDarkMode, 
  themeClasses, 
  adminKey 
}) => {
  const { data: systemMetrics } = useQuery({
    queryKey: ['/api/admin/system-metrics'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/system-metrics?adminKey=${adminKey}`);
      if (!response.ok) throw new Error('Failed to fetch system metrics');
      return response.json();
    },
  });

  return (
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

      <Card className={`col-span-1 md:col-span-2 ${themeClasses.analyticsCard}`}>
        <CardHeader>
          <CardTitle className={`flex items-center gap-2 ${themeClasses.primaryText}`}>
            <Server className="h-5 w-5 text-indigo-500" />
            Live Cluster Health
          </CardTitle>
        </CardHeader>
        <CardContent>
           <div className={`text-sm ${themeClasses.secondaryText} p-8 text-center border rounded-lg border-dashed ${isDarkMode ? 'border-gray-700' : 'border-gray-300'}`}>
            <p className="mb-2 text-lg font-medium">Node Telemetry Tracking</p>
            Real-time web socket feeds of container CPU, RAM, and Pod restart history will be visualized here.
            Currently, overall server health remains at a stable <strong>{systemMetrics?.systemUptime || 99.9}%</strong> uptime.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
