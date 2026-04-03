import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Search, 
  Bell, 
  MessageSquare, 
  Settings, 
  User, 
  LogOut, 
  Moon, 
  Sun,
  Shield,
  Activity,
  Database,
  Download,
  HelpCircle,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Mail,
  Globe,
  Zap,
  DollarSign
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import qWorshipLogo from '@assets/Group 1_1753843572404.png';
import { useAuthStore } from '@/features/auth/auth.store';

interface AdminTopBarProps {
  isDarkMode: boolean;
  toggleTheme: () => void;
  dateRange: string;
  setDateRange: (range: string) => void;
  onExportData: (type: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeSection?: string;
  setActiveSection?: (section: string) => void;
}

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

interface SystemStatus {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  activeUsers: number;
  serverLoad: number;
  databaseConnections: number;
}

export default function AdminTopBar({
  isDarkMode,
  toggleTheme,
  dateRange,
  setDateRange,
  onExportData,
  searchTerm,
  setSearchTerm,
  activeSection,
  setActiveSection
}: AdminTopBarProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [_, setLocation] = useLocation();
  const logout = useAuthStore(state => state.logout);

  // Enhanced theme-aware classes for better dark mode optimization
  const themeClasses = {
    background: isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200',
    text: isDarkMode ? 'text-gray-100' : 'text-gray-900',
    secondaryText: isDarkMode ? 'text-gray-400' : 'text-gray-600',
    hover: isDarkMode ? 'hover:bg-gray-800 hover:text-gray-100' : 'hover:bg-gray-100',
    border: isDarkMode ? 'border-gray-600' : 'border-gray-300',
    inputBg: isDarkMode ? 'bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500',
    dropdownBg: isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200',
    dropdownContent: isDarkMode ? 'bg-gray-800 border-gray-600 shadow-2xl' : 'bg-white border-gray-200 shadow-lg',
    dropdownItem: isDarkMode ? 'text-gray-200 hover:bg-gray-700 hover:text-gray-100 focus:bg-gray-700' : 'text-gray-700 hover:bg-gray-100 focus:bg-gray-100',
    buttonPrimary: isDarkMode ? 'bg-blue-600 hover:bg-blue-500 text-white border-0' : 'bg-blue-600 hover:bg-blue-700 text-white border-0',
    buttonSecondary: isDarkMode ? 'text-gray-300 hover:text-gray-100 hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
    badge: isDarkMode ? 'bg-red-600 text-gray-100' : 'bg-red-600 text-white',
    separator: isDarkMode ? 'border-gray-600' : 'border-gray-200',
  };

  // Fetch system status
  const adminKey = 'qworship-superadmin-2025';
  const { data: systemStatus } = useQuery<SystemStatus>({
    queryKey: ['/api/admin/system-status'],
    queryFn: async () => {
      const response = await fetch(`/api/admin/system-status?adminKey=${adminKey}`);
      if (!response.ok) {
        // Return mock data if endpoint doesn't exist
        return {
          status: 'healthy' as const,
          uptime: 99.9,
          activeUsers: 142,
          serverLoad: 23,
          databaseConnections: 8
        };
      }
      return response.json();
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Mock notifications data (in production, this would come from an API)
  useEffect(() => {
    const mockNotifications: NotificationItem[] = [
      {
        id: '1',
        title: 'Trial Expiring Soon',
        message: '15 trial accounts expire today',
        type: 'warning',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        read: false
      },
      {
        id: '2',
        title: 'New User Registration',
        message: '8 new users registered in the last hour',
        type: 'info',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        read: false
      },
      {
        id: '3',
        title: 'System Health Check',
        message: 'All systems operating normally',
        type: 'success',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        read: true
      },
      {
        id: '4',
        title: 'Revenue Milestone',
        message: 'Monthly recurring revenue exceeded £1000',
        type: 'success',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        read: false
      }
    ];
    
    setNotifications(mockNotifications);
    setUnreadCount(mockNotifications.filter(n => !n.read).length);
  }, []);

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Bell className="h-4 w-4 text-blue-500" />;
    }
  };

  const getSystemStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <header className={`shadow-lg border-b ${themeClasses.background}`}>
      <div className="flex items-center justify-between px-6 py-4">
        {/* Left Section - Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link href="/">
            <div className="flex items-center space-x-2">
              <img src={qWorshipLogo} alt="Q-worship" className="h-8 w-8" />
              <span className={`text-xl font-bold [font-family:'Lufga-Medium',Helvetica] ${themeClasses.text}`}>
                Q-worship
              </span>
            </div>
          </Link>
          <Badge className="text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0">
            SUPERADMIN
          </Badge>
        </div>

        {/* Center Section - Global Search */}
        <div className="flex-1 max-w-lg mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users, organizations, trials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${themeClasses.inputBg} ${themeClasses.text} placeholder-gray-400`}
            />
          </div>
        </div>

        {/* Right Section - Action Items */}
        <div className="flex items-center space-x-2">
          {/* System Status Indicator */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`${themeClasses.buttonSecondary} relative transition-colors duration-200`}
              >
                <Activity className={`h-4 w-4 ${getSystemStatusColor(systemStatus?.status || 'healthy')}`} />
                <span className={`ml-1 text-xs ${themeClasses.secondaryText}`}>
                  {systemStatus?.uptime || 99.9}%
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-80 ${themeClasses.dropdownContent}`}>
              <div className="space-y-3">
                <h4 className={`font-medium ${themeClasses.text}`}>System Status</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className={`flex justify-between ${themeClasses.secondaryText}`}>
                      <span>Uptime:</span>
                      <span className={`font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{systemStatus?.uptime || 99.9}%</span>
                    </div>
                    <div className={`flex justify-between ${themeClasses.secondaryText}`}>
                      <span>Active Users:</span>
                      <span className={`font-medium ${themeClasses.text}`}>{systemStatus?.activeUsers || 142}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className={`flex justify-between ${themeClasses.secondaryText}`}>
                      <span>Server Load:</span>
                      <span className={`font-medium ${themeClasses.text}`}>{systemStatus?.serverLoad || 23}%</span>
                    </div>
                    <div className={`flex justify-between ${themeClasses.secondaryText}`}>
                      <span>DB Connections:</span>
                      <span className={`font-medium ${themeClasses.text}`}>{systemStatus?.databaseConnections || 8}</span>
                    </div>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Messages */}
          <Popover open={isMessagesOpen} onOpenChange={setIsMessagesOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={`${themeClasses.buttonSecondary} relative transition-colors duration-200`}>
                <MessageSquare className={`h-4 w-4 ${themeClasses.text}`} />
                <Badge className={`absolute -top-1 -right-1 h-5 w-5 rounded-full ${isDarkMode ? 'bg-blue-500' : 'bg-blue-600'} text-white text-xs flex items-center justify-center`}>
                  3
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-80 ${themeClasses.dropdownContent}`}>
              <div className="space-y-3">
                <h4 className={`font-medium ${themeClasses.text}`}>Recent Messages</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition-colors duration-200 border ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`font-medium text-sm ${themeClasses.text}`}>Support Request</div>
                    <div className={`text-xs ${themeClasses.secondaryText} mt-1`}>User needs help with organization setup</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>15 minutes ago</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition-colors duration-200 border ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`font-medium text-sm ${themeClasses.text}`}>Billing Inquiry</div>
                    <div className={`text-xs ${themeClasses.secondaryText} mt-1`}>Question about subscription upgrade</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>1 hour ago</div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} cursor-pointer transition-colors duration-200 border ${isDarkMode ? 'border-gray-700 hover:border-gray-600' : 'border-gray-100 hover:border-gray-200'}`}>
                    <div className={`font-medium text-sm ${themeClasses.text}`}>Feature Request</div>
                    <div className={`text-xs ${themeClasses.secondaryText} mt-1`}>Request for new Bible translation</div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>2 hours ago</div>
                  </div>
                </div>
                <Button variant="outline" size="sm" className={`w-full ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  View All Messages
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Notifications */}
          <Popover open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className={`${themeClasses.buttonSecondary} relative transition-colors duration-200`}>
                <Bell className={`h-4 w-4 ${themeClasses.text}`} />
                {unreadCount > 0 && (
                  <Badge className={`absolute -top-1 -right-1 h-5 w-5 rounded-full ${themeClasses.badge} text-xs flex items-center justify-center`}>
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className={`w-80 ${themeClasses.dropdownContent}`}>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className={`font-medium ${themeClasses.text}`}>Notifications</h4>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className={`text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                      {unreadCount} new
                    </Badge>
                  )}
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-3 rounded-lg cursor-pointer transition-colors duration-200 ${
                        notification.read 
                          ? `${isDarkMode ? 'hover:bg-gray-700 opacity-75' : 'hover:bg-gray-50 opacity-75'}` 
                          : `${isDarkMode ? 'hover:bg-gray-700 border-l-2 border-blue-400' : 'hover:bg-gray-50 border-l-2 border-blue-500'}`
                      } border ${isDarkMode ? 'border-gray-700' : 'border-gray-100'}`}
                      onClick={() => markNotificationAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium text-sm ${themeClasses.text}`}>
                            {notification.title}
                          </div>
                          <div className={`text-xs ${themeClasses.secondaryText} truncate mt-1`}>
                            {notification.message}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'} mt-1`}>
                            {formatTimestamp(notification.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className={`w-full ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-gray-100' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
                  View All Notifications
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Theme Toggle */}
          <Button
            onClick={toggleTheme}
            variant="ghost"
            size="sm"
            className={`${themeClasses.buttonSecondary} transition-colors duration-200`}
          >
            {isDarkMode ? 
              <Sun className={`h-4 w-4 ${isDarkMode ? 'text-yellow-400' : 'text-gray-600'}`} /> : 
              <Moon className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-gray-600'}`} />
            }
          </Button>

          {/* Date Range Selector */}
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-3 py-1.5 text-sm rounded-md border ${themeClasses.inputBg} ${themeClasses.border} focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-blue-500 focus:border-blue-500' : 'focus:ring-blue-500 focus:border-blue-500'} transition-colors duration-200`}
            style={{
              backgroundColor: isDarkMode ? '#374151' : '#ffffff',
              color: isDarkMode ? '#f3f4f6' : '#111827',
              borderColor: isDarkMode ? '#4b5563' : '#d1d5db'
            }}
          >
            <option value="7d" style={{ backgroundColor: isDarkMode ? '#374151' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Last 7 days</option>
            <option value="30d" style={{ backgroundColor: isDarkMode ? '#374151' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Last 30 days</option>
            <option value="90d" style={{ backgroundColor: isDarkMode ? '#374151' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Last 90 days</option>
            <option value="1y" style={{ backgroundColor: isDarkMode ? '#374151' : '#ffffff', color: isDarkMode ? '#f3f4f6' : '#111827' }}>Last year</option>
          </select>

          {/* Export Data */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className={`${themeClasses.buttonPrimary} shadow-md transition-all duration-200 hover:shadow-lg`}>
                <Download className="h-4 w-4 mr-1" />
                Export
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`${themeClasses.dropdownContent} min-w-[180px]`}>
              <DropdownMenuItem 
                onClick={() => onExportData('trial-report')} 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
              >
                <Clock className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                Trial Report
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onExportData('user-report')} 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
              >
                <User className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                User Report
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onExportData('revenue-report')} 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
              >
                <DollarSign className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                Revenue Report
              </DropdownMenuItem>
              <DropdownMenuSeparator className={themeClasses.separator} />
              <DropdownMenuItem 
                onClick={() => onExportData('all')} 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200 font-medium`}
              >
                <Download className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                Export All Data
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Account Menu */}
          <DropdownMenu open={isAccountOpen} onOpenChange={setIsAccountOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={`${themeClasses.buttonSecondary} px-2 transition-colors duration-200`}>
                <Avatar className="h-7 w-7 mr-2">
                  <AvatarFallback className={`${isDarkMode ? 'bg-gradient-to-br from-pink-600 to-purple-700' : 'bg-gradient-to-br from-pink-500 to-purple-600'} text-white text-xs font-medium`}>
                    SA
                  </AvatarFallback>
                </Avatar>
                <span className={`text-sm ${themeClasses.text} hidden md:inline font-medium`}>SuperAdmin</span>
                <ChevronDown className={`h-3 w-3 ml-1 ${themeClasses.secondaryText}`} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className={`w-56 ${themeClasses.dropdownContent}`} align="end">
              <div className={`px-3 py-2 border-b ${themeClasses.separator}`}>
                <div className={`font-medium ${themeClasses.text}`}>SuperAdmin</div>
                <div className={`text-xs ${themeClasses.secondaryText} mt-0.5`}>admin@qworship.com</div>
              </div>
              <DropdownMenuItem 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
                onClick={() => {
                  setIsAccountOpen(false);
                  setActiveSection?.('profile-settings');
                }}
              >
                <User className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
                onClick={() => {
                  setIsAccountOpen(false);
                  setActiveSection?.('security-settings');
                }}
              >
                <Shield className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                Security Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
                onClick={() => {
                  setIsAccountOpen(false);
                  setActiveSection?.('admin-preferences');
                }}
              >
                <Settings className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                Preferences
              </DropdownMenuItem>
              <DropdownMenuSeparator className={themeClasses.separator} />
              <DropdownMenuItem 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200`}
                onClick={() => {
                  setIsAccountOpen(false);
                  setActiveSection?.('support-center');
                }}
              >
                <HelpCircle className={`h-4 w-4 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                Help & Support
              </DropdownMenuItem>
              <DropdownMenuSeparator className={themeClasses.separator} />
              <DropdownMenuItem 
                className={`${themeClasses.dropdownItem} cursor-pointer transition-colors duration-200 ${isDarkMode ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                onClick={() => {
                  setIsAccountOpen(false);
                  logout();
                  setLocation('/admin/login');
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}