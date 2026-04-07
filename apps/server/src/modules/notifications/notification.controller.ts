import { Request, Response } from 'express';
import { Notification } from './notification.model.js';
import {
  broadcastNewFeature,
  broadcastNewBible,
  broadcastPromotion,
  broadcastNotification,
  notifyRecordingSaved,
} from './notification.service.js';

// ─── User endpoints ──────────────────────────────────────────────────

/** GET /api/notifications — list authenticated user's notifications */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    res.json({
      success: true,
      notifications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      unreadCount,
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** GET /api/notifications/unread-count — lightweight badge count */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const unreadCount = await Notification.countDocuments({ userId, isRead: false });
    res.json({ success: true, unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** PUT /api/notifications/:id/read — mark single as read */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** PUT /api/notifications/read-all — mark all as read */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all as read:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** DELETE /api/notifications/:id — delete a notification */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const result = await Notification.findOneAndDelete({ _id: req.params.id, userId });
    if (!result) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** DELETE /api/notifications — clear all notifications for user */
export const clearAllNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    await Notification.deleteMany({ userId });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

/** POST /api/notifications/trigger-recording-saved — User triggered notification for recording */
export const triggerRecordingSaved = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { recordingName } = req.body;
    
    // Fire-and-forget notification creation
    notifyRecordingSaved(userId, recordingName).catch(() => {});
    
    res.json({ success: true, message: 'Recording saved notification triggered' });
  } catch (error) {
    console.error('Error triggering recording notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// ─── Admin broadcast endpoint ────────────────────────────────────────

/** POST /api/admin/notifications/broadcast — send a notification to ALL users */
export const adminBroadcast = async (req: Request, res: Response) => {
  try {
    const { type, title, message } = req.body;
    if (!type || !title || !message) {
      return res.status(400).json({ success: false, message: 'type, title, and message are required' });
    }

    let count = 0;

    switch (type) {
      case 'admin_feature':
        count = await broadcastNewFeature(title, message);
        break;
      case 'admin_bible':
        count = await broadcastNewBible(title); // message is baked into the helper
        break;
      case 'admin_promotion':
        count = await broadcastPromotion(title, message);
        break;
      default:
        count = await broadcastNotification({
          type: 'admin_general',
          category: 'admin',
          title,
          message,
          icon: 'Megaphone',
        });
    }

    res.json({ success: true, message: `Notification broadcast to ${count} users` });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
