import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  category: 'system' | 'subscription' | 'admin' | 'user_activity';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

interface NotificationsResponse {
  success: boolean;
  notifications: NotificationItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  unreadCount: number;
}

interface UnreadCountResponse {
  success: boolean;
  unreadCount: number;
}

/**
 * useNotifications — React Query-based hook that fetches,
 * marks-as-read, and deletes real notifications from the API.
 * Designed as a drop-in replacement for the old mock state.
 */
export function useNotifications() {
  const queryClient = useQueryClient();

  // ─── Fetch notifications (paginated, most-recent first) ─────────
  const {
    data: notificationsData,
    isLoading,
    error,
  } = useQuery<NotificationsResponse>({
    queryKey: ['/api/notifications'],
    refetchInterval: 30_000, // Poll every 30 seconds for new notifications
    staleTime: 10_000,
  });

  // ─── Lightweight unread badge count (separate fast endpoint) ────
  const { data: unreadData } = useQuery<UnreadCountResponse>({
    queryKey: ['/api/notifications/unread-count'],
    refetchInterval: 15_000, // Poll more frequently for the badge
    staleTime: 5_000,
  });

  // ─── Derived state ─────────────────────────────────────────────
  const notifications = useMemo(
    () => notificationsData?.notifications ?? [],
    [notificationsData]
  );

  const unreadCount = unreadData?.unreadCount ?? notificationsData?.unreadCount ?? 0;

  // ─── Mark single notification as read ──────────────────────────
  const markAsReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('PUT', `/api/notifications/${id}/read`);
    },
    onMutate: async (id: string) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['/api/notifications'] });
      await queryClient.cancelQueries({ queryKey: ['/api/notifications/unread-count'] });

      const prevNotifications = queryClient.getQueryData<NotificationsResponse>(['/api/notifications']);
      const prevUnread = queryClient.getQueryData<UnreadCountResponse>(['/api/notifications/unread-count']);

      if (prevNotifications) {
        const wasUnread = prevNotifications.notifications.find(n => n._id === id && !n.isRead);
        queryClient.setQueryData<NotificationsResponse>(['/api/notifications'], {
          ...prevNotifications,
          notifications: prevNotifications.notifications.map(n =>
            n._id === id ? { ...n, isRead: true } : n
          ),
          unreadCount: wasUnread
            ? Math.max(0, prevNotifications.unreadCount - 1)
            : prevNotifications.unreadCount,
        });
      }

      if (prevUnread) {
        const wasUnread = prevNotifications?.notifications.find(n => n._id === id && !n.isRead);
        if (wasUnread) {
          queryClient.setQueryData<UnreadCountResponse>(['/api/notifications/unread-count'], {
            ...prevUnread,
            unreadCount: Math.max(0, prevUnread.unreadCount - 1),
          });
        }
      }

      return { prevNotifications, prevUnread };
    },
    onError: (_error, _id, context) => {
      if (context?.prevNotifications) {
        queryClient.setQueryData(['/api/notifications'], context.prevNotifications);
      }
      if (context?.prevUnread) {
        queryClient.setQueryData(['/api/notifications/unread-count'], context.prevUnread);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // ─── Mark ALL as read ─────────────────────────────────────────
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('PUT', '/api/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // ─── Delete a notification ────────────────────────────────────
  const deleteNotificationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // ─── Clear all notifications ──────────────────────────────────
  const clearAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/notifications');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
    },
  });

  // ─── Simple callback wrappers ─────────────────────────────────
  const markNotificationAsRead = useCallback(
    (id: string) => markAsReadMutation.mutate(id),
    [markAsReadMutation]
  );

  const markAllAsRead = useCallback(
    () => markAllAsReadMutation.mutate(),
    [markAllAsReadMutation]
  );

  const deleteNotification = useCallback(
    (id: string) => deleteNotificationMutation.mutate(id),
    [deleteNotificationMutation]
  );

  const clearAll = useCallback(
    () => clearAllMutation.mutate(),
    [clearAllMutation]
  );

  // ─── Format timestamp for display ────────────────────────────
  const formatTimestamp = useCallback((dateInput: Date | string) => {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markNotificationAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    formatTimestamp,
  };
}
