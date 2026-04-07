import { Router } from 'express';
import { protect } from '../auth/auth.middleware.js';
import { authorizeAdmin } from '../auth/auth.middleware.js';
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
  adminBroadcast,
  triggerRecordingSaved,
} from './notification.controller.js';

export const notificationRouter = Router();

// ─── User routes (require authentication) ────────────────────────────
notificationRouter.get('/notifications', protect, getUserNotifications as any);
notificationRouter.get('/notifications/unread-count', protect, getUnreadCount as any);
notificationRouter.put('/notifications/read-all', protect, markAllAsRead as any);
notificationRouter.put('/notifications/:id/read', protect, markAsRead as any);
notificationRouter.delete('/notifications/:id', protect, deleteNotification as any);
notificationRouter.delete('/notifications', protect, clearAllNotifications as any);
notificationRouter.post('/notifications/trigger-recording-saved', protect, triggerRecordingSaved as any);

// ─── Admin routes ────────────────────────────────────────────────────
notificationRouter.post('/admin/notifications/broadcast', authorizeAdmin, adminBroadcast as any);
