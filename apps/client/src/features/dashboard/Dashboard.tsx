import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Calendar, Clock, CreditCard, Settings, LogOut } from 'lucide-react';
import { Link } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import qWorshipLogo from '@assets/Group 1_1753843572404.png';

interface TrialStatus {
  isOnTrial: boolean;
  daysRemaining: number;
  trialEndDate: string | null;
  accountStatus: string;
}

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  priority: string;
  createdAt: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trial status
  const { data: trialStatus, isLoading: trialLoading } = useQuery<TrialStatus>({
    queryKey: ['/api/trial/status'],
    refetchInterval: 60000, // Refresh every minute
  });

  // Fetch notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery<Notification[]>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      return await apiRequest(`/api/notifications/${notificationId}/read`, 'POST');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/auth/logout', 'POST');
    },
    onSuccess: () => {
      window.location.href = '/';
    },
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTrialStatusColor = (daysRemaining: number): "default" | "destructive" | "outline" | "secondary" => {
    if (daysRemaining <= 1) return 'destructive';
    if (daysRemaining <= 3) return 'secondary';
    if (daysRemaining <= 7) return 'outline';
    return 'default';
  };

  const getPriorityColor = (priority: string): "default" | "destructive" | "outline" | "secondary" => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      case 'low': return 'outline';
      default: return 'default';
    }
  };

  if (trialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white text-lg [font-family:'Lufga-Regular',Helvetica]">Loading your dashboard...</div>
      </div>
    );
  }

  // If account is locked/expired, show upgrade page
  if (trialStatus?.accountStatus === 'expired') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <Card className="w-full max-w-md bg-gray-900 border-red-600">
          <CardHeader className="text-center">
            <img src={qWorshipLogo} alt="Q-worship" className="h-12 w-12 mx-auto mb-4" />
            <CardTitle className="text-red-400 [font-family:'Lufga-Bold',Helvetica]">
              Trial Expired
            </CardTitle>
            <CardDescription className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">
              Your free trial has ended. Choose a plan to continue using Q-worship.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/pricing">
              <Button className="w-full bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-black font-bold [font-family:'Lufga-Bold',Helvetica]">
                Choose Your Plan
              </Button>
            </Link>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-purple-900 to-indigo-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <img src={qWorshipLogo} alt="Q-worship" className="h-8 w-8" />
            <span className="text-xl font-bold [font-family:'Lufga-Medium',Helvetica]">Q-worship</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-300 [font-family:'Lufga-Regular',Helvetica]">
              Welcome, {user?.firstName}
            </span>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trial Status Card */}
            {trialStatus?.isOnTrial && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-5 h-5 text-cyan-400" />
                      <CardTitle className="text-white [font-family:'Lufga-Bold',Helvetica]">
                        Free Trial Status
                      </CardTitle>
                    </div>
                    <Badge variant={getTrialStatusColor(trialStatus.daysRemaining)}>
                      {trialStatus.daysRemaining} days left
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-300 [font-family:'Lufga-Regular',Helvetica]">
                        Trial ends on:
                      </span>
                      <span className="text-white font-medium [font-family:'Lufga-Medium',Helvetica]">
                        {trialStatus.trialEndDate ? formatDate(trialStatus.trialEndDate) : 'N/A'}
                      </span>
                    </div>
                    
                    {trialStatus.daysRemaining <= 7 && (
                      <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
                        <p className="text-orange-300 text-sm [font-family:'Lufga-Regular',Helvetica]">
                          ⚠️ Your trial expires soon! Choose a plan to continue using all Q-worship features.
                        </p>
                        <Link href="/pricing">
                          <Button className="mt-3 bg-gradient-to-r from-cyan-400 to-teal-400 hover:from-cyan-500 hover:to-teal-500 text-black font-bold [font-family:'Lufga-Bold',Helvetica]">
                            <CreditCard className="w-4 h-4 mr-2" />
                            Upgrade Now
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white [font-family:'Lufga-Bold',Helvetica]">
                  Quick Actions
                </CardTitle>
                <CardDescription className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">
                  Get started with Q-worship
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16 justify-start">
                    <Calendar className="w-5 h-5 mr-3 text-cyan-400" />
                    <div className="text-left">
                      <div className="font-medium [font-family:'Lufga-Medium',Helvetica]">Create Presentation</div>
                      <div className="text-xs text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Start your worship service</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" className="h-16 justify-start">
                    <Settings className="w-5 h-5 mr-3 text-cyan-400" />
                    <div className="text-left">
                      <div className="font-medium [font-family:'Lufga-Medium',Helvetica]">Manage Bible Library</div>
                      <div className="text-xs text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Add scripture versions</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* N1 Panel (Legacy Notifications) */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Bell className="w-5 h-5 text-cyan-400" />
                  <CardTitle className="text-white [font-family:'Lufga-Bold',Helvetica]">
                    N1 Panel
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {notificationsLoading ? (
                  <div className="text-gray-400 text-sm [font-family:'Lufga-Regular',Helvetica]">
                    Loading notifications...
                  </div>
                ) : notifications && notifications.length > 0 ? (
                  <div className="space-y-3">
                    {notifications.slice(0, 5).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${
                          notification.isRead 
                            ? 'bg-gray-800 border-gray-600' 
                            : 'bg-gray-700 border-gray-500'
                        } cursor-pointer transition-colors hover:bg-gray-600`}
                        onClick={() => !notification.isRead && markAsReadMutation.mutate(notification.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h4 className="text-sm font-medium text-white [font-family:'Lufga-Medium',Helvetica]">
                                {notification.title}
                              </h4>
                              <Badge variant={getPriorityColor(notification.priority)} className="text-xs">
                                {notification.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-300 [font-family:'Lufga-Regular',Helvetica]">
                              {notification.message}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 [font-family:'Lufga-Regular',Helvetica]">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-cyan-400 rounded-full mt-1"></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-sm [font-family:'Lufga-Regular',Helvetica]">
                    No notifications yet
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Account Info */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white [font-family:'Lufga-Bold',Helvetica]">
                  Account Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Plan:</span>
                  <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                    {trialStatus?.isOnTrial ? 'Free Trial' : 'Premium'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 [font-family:'Lufga-Regular',Helvetica]">Status:</span>
                  <Badge variant={trialStatus?.accountStatus === 'active' ? 'default' : 'destructive'}>
                    {trialStatus?.accountStatus || 'Active'}
                  </Badge>
                </div>
                <div className="pt-2">
                  <Link href="/pricing">
                    <Button variant="outline" className="w-full">
                      <CreditCard className="w-4 h-4 mr-2" />
                      Manage Plan
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}