import React, { useState, useMemo } from "react";
import { XIcon, Bell, Mail, Monitor, RefreshCw, CreditCard, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useNotifications, NotificationItem } from "@/hooks/useNotifications";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterTab = "all" | "email" | "system" | "updates" | "billing";

const FILTER_TABS: { key: FilterTab; label: string; icon: React.ReactNode }[] = [
  { key: "all", label: "All", icon: <Bell className="w-3.5 h-3.5" /> },
  { key: "email", label: "Email", icon: <Mail className="w-3.5 h-3.5" /> },
  { key: "system", label: "System", icon: <Monitor className="w-3.5 h-3.5" /> },
  { key: "updates", label: "Updates", icon: <RefreshCw className="w-3.5 h-3.5" /> },
  { key: "billing", label: "Billing", icon: <CreditCard className="w-3.5 h-3.5" /> },
];

const getNotificationIcon = (type: string) => {
  switch (type) {
    // System / Automatic
    case "welcome":
      return <CheckCircle className="w-5 h-5 text-green-400" />;
    case "password_change":
      return <Monitor className="w-5 h-5 text-blue-400" />;
    // Subscription / Billing
    case "plan_subscription":
    case "new_plan":
    case "payment_success":
      return <CreditCard className="w-5 h-5 text-green-400" />;
    case "plan_expiry_reminder":
      return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
    case "plan_expired":
      return <AlertTriangle className="w-5 h-5 text-red-400" />;
    // Admin-triggered
    case "admin_feature":
    case "admin_bible":
    case "admin_promotion":
    case "admin_general":
      return <Bell className="w-5 h-5 text-purple-400" />;
    // User activity
    case "recording_saved":
      return <CheckCircle className="w-5 h-5 text-pink-400" />;
    default:
      return <Info className="w-5 h-5 text-gray-400" />;
  }
};

const mapNotificationToFilter = (notification: NotificationItem): FilterTab => {
  const cat = notification.category;
  const type = notification.type?.toLowerCase() || "";

  // ─── Billing: subscription-related notifications ──────────────────
  // category: 'subscription' OR types: plan_subscription, plan_expiry_reminder,
  // plan_expired, payment_success, new_plan
  if (
    cat === "subscription" ||
    type === "plan_subscription" ||
    type === "plan_expiry_reminder" ||
    type === "plan_expired" ||
    type === "payment_success" ||
    type === "new_plan"
  ) return "billing";

  // ─── System: system-generated automated notifications ─────────────
  // category: 'system' OR types: welcome, password_change
  if (
    cat === "system" ||
    type === "welcome" ||
    type === "password_change"
  ) return "system";

  // ─── Updates: admin-issued feature/promotion announcements ────────
  // category: 'admin' OR types: admin_feature, admin_bible, admin_promotion, admin_general
  if (
    cat === "admin" ||
    type === "admin_feature" ||
    type === "admin_bible" ||
    type === "admin_promotion" ||
    type === "admin_general"
  ) return "updates";

  // ─── Email: user activity notifications (recording saved, etc.) ───
  // category: 'user_activity' OR type: recording_saved
  if (
    cat === "user_activity" ||
    type === "recording_saved"
  ) return "email";

  // Fallback — will only show under the "All" tab
  return "all";
};

export function NotificationsModal({ isOpen, onClose }: NotificationsModalProps) {
  const {
    notifications,
    isLoading,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    formatTimestamp,
  } = useNotifications();

  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  const filteredNotifications = useMemo(() => {
    if (activeFilter === "all") return notifications;
    return notifications.filter((n) => mapNotificationToFilter(n) === activeFilter);
  }, [notifications, activeFilter]);

  // Auto-select first notification when filter changes or modal opens
  React.useEffect(() => {
    if (filteredNotifications.length > 0 && !selectedNotification) {
      setSelectedNotification(filteredNotifications[0]);
    }
  }, [filteredNotifications, selectedNotification]);

  // Reset selected when filter changes
  React.useEffect(() => {
    if (filteredNotifications.length > 0) {
      setSelectedNotification(filteredNotifications[0]);
    } else {
      setSelectedNotification(null);
    }
  }, [activeFilter]);

  if (!isOpen) return null;

  const handleSelectNotification = (notification: NotificationItem) => {
    setSelectedNotification(notification);
    if (!notification.isRead) {
      markNotificationAsRead(notification._id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative bg-[#1a0f2e] border border-gray-600/50 rounded-xl shadow-2xl w-[900px] max-w-[95vw] max-h-[80vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700/60">
          <h2 className="text-white text-xl font-bold tracking-tight">Your Notifications</h2>
          <div className="flex items-center gap-3">
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-purple-300 hover:text-purple-200 transition-colors font-medium px-3 py-1.5 rounded-md border border-purple-500/20 hover:border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20"
              >
                Mark all as read
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-gray-700/40 bg-[#1a0f2e]/80">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                activeFilter === tab.key
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-500/25"
                  : "bg-[#2a1f4b] text-gray-300 hover:bg-[#3a2f5d] hover:text-white border border-gray-600/30"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area - Split Panel */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Notification List */}
          <div className="w-[320px] flex-shrink-0 border-r border-gray-700/40 overflow-y-auto custom-scrollbar bg-[#150c26]">
            {isLoading ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-500 border-t-transparent mr-3" />
                Loading...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6 py-12">
                <Bell className="w-10 h-10 mb-3 opacity-30" />
                <p className="text-sm font-medium">No notifications</p>
                <p className="text-xs mt-1 text-gray-600">
                  {activeFilter === "all" ? "You're all caught up!" : `No ${activeFilter} notifications`}
                </p>
              </div>
            ) : (
              <div className="py-1">
                {filteredNotifications.map((notification) => (
                  <button
                    key={notification._id}
                    onClick={() => handleSelectNotification(notification)}
                    className={`w-full text-left px-4 py-3.5 transition-all duration-150 border-b border-gray-800/40 ${
                      selectedNotification?._id === notification._id
                        ? "bg-purple-600/20 border-l-2 border-l-purple-500"
                        : notification.isRead
                          ? "hover:bg-white/5 opacity-70"
                          : "hover:bg-white/5 border-l-2 border-l-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className={`text-sm font-semibold truncate ${
                          notification.isRead ? "text-gray-300" : "text-white"
                        }`}>
                          {notification.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {notification.message}
                        </p>
                      </div>
                      <span className="text-[10px] text-gray-600 whitespace-nowrap flex-shrink-0 mt-0.5">
                        {formatTimestamp(notification.createdAt)}
                      </span>
                    </div>
                    {!notification.isRead && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 w-2 h-2 bg-purple-500 rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Panel - Notification Detail */}
          <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#2a1f4b]/40">
            {selectedNotification ? (
              <div className="p-8">
                {/* Notification Header */}
                <div className="flex items-start gap-4 mb-6">
                  <div className="p-3 rounded-xl bg-purple-600/15 border border-purple-500/20 flex-shrink-0">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white text-xl font-bold mb-1">
                      {selectedNotification.title}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-gray-500">
                        {new Date(selectedNotification.createdAt).toLocaleString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        selectedNotification.isRead
                          ? "bg-gray-700 text-gray-400"
                          : "bg-purple-600/30 text-purple-300 border border-purple-500/30"
                      }`}>
                        {selectedNotification.isRead ? "Read" : "Unread"}
                      </span>
                      {selectedNotification.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-700/50 text-gray-400 capitalize">
                          {selectedNotification.category.replace("_", " ")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notification Body */}
                <div className="bg-[#2a1f4b]/60 rounded-xl p-6 border border-gray-700/30">
                  <p className="text-gray-200 leading-relaxed text-[15px] whitespace-pre-wrap">
                    {selectedNotification.message}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-3 mt-6">
                  {!selectedNotification.isRead && (
                    <button
                      onClick={() => markNotificationAsRead(selectedNotification._id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-sm font-medium transition-colors border border-purple-500/20"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark as read
                    </button>
                  )}
                  <button
                    onClick={() => {
                      deleteNotification(selectedNotification._id);
                      setSelectedNotification(null);
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/10 hover:bg-red-600/20 text-red-400 text-sm font-medium transition-colors border border-red-500/20"
                  >
                    <XIcon className="w-4 h-4" />
                    Delete
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 px-6">
                <Bell className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">Select a notification</p>
                <p className="text-xs mt-1">Click on a notification to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
