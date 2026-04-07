import mongoose from 'mongoose';
import { Notification } from './notification.model.js';
import { User } from '../auth/auth.model.js';

/**
 * Notification Service — single place to create notifications.
 * All auto-triggers call into this module so creation logic is centralised.
 */

interface CreateNotificationPayload {
  userId: string | mongoose.Types.ObjectId;
  type: string;
  category: 'system' | 'subscription' | 'admin' | 'user_activity';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// ─── Single-user notification ────────────────────────────────────────
export const createNotification = async (payload: CreateNotificationPayload) => {
  try {
    const notification = new Notification(payload);
    await notification.save();
    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error);
    return null;
  }
};

// ─── Broadcast to ALL users (admin-triggered) ────────────────────────
export const broadcastNotification = async (
  payload: Omit<CreateNotificationPayload, 'userId'>
) => {
  try {
    const users = await User.find({ isActive: true }).select('_id').lean();
    const docs = users.map((u) => ({
      userId: u._id,
      ...payload,
      isRead: false,
    }));
    if (docs.length > 0) {
      await Notification.insertMany(docs, { ordered: false });
    }
    return docs.length;
  } catch (error) {
    console.error('[NotificationService] Broadcast failed:', error);
    return 0;
  }
};

// ─── Pre-built notification templates ────────────────────────────────

export const notifyWelcome = (userId: string | mongoose.Types.ObjectId, firstName?: string) =>
  createNotification({
    userId,
    type: 'welcome',
    category: 'system',
    title: 'Welcome to QWorship! 🎉',
    message: `Hi ${firstName || 'there'}! Welcome to QWorship — your all-in-one worship presentation platform. Explore song projection, Bible search, and hands-free voice navigation to supercharge your worship services.`,
    icon: 'PartyPopper',
    actionUrl: '/dashboard',
  });

export const notifyPasswordChange = (userId: string | mongoose.Types.ObjectId) =>
  createNotification({
    userId,
    type: 'password_change',
    category: 'system',
    title: 'Password Changed Successfully',
    message: 'Your account password has been updated. If you did not make this change, please contact our support team immediately.',
    icon: 'ShieldCheck',
  });

export const notifyPlanSubscription = (
  userId: string | mongoose.Types.ObjectId,
  planName: string
) =>
  createNotification({
    userId,
    type: 'plan_subscription',
    category: 'subscription',
    title: `Subscribed to ${planName} Plan`,
    message: `Congratulations! You are now on the ${planName} plan. Enjoy all the premium features QWorship has to offer.`,
    icon: 'Crown',
    actionUrl: '/dashboard?tab=subscription',
    metadata: { planName },
  });

export const notifyPlanExpiryReminder = (
  userId: string | mongoose.Types.ObjectId,
  daysLeft: number,
  planName: string
) => {
  const timeLabel =
    daysLeft >= 1 ? `${daysLeft} day${daysLeft > 1 ? 's' : ''}` : 'less than 24 hours';
  return createNotification({
    userId,
    type: 'plan_expiry_reminder',
    category: 'subscription',
    title: `Your ${planName} Plan Expires Soon`,
    message: `Your ${planName} subscription expires in ${timeLabel}. Renew now to avoid any interruption in your premium worship experience.`,
    icon: 'Clock',
    actionUrl: '/dashboard?tab=subscription',
    metadata: { daysLeft, planName },
  });
};

export const notifyPlanExpired = (
  userId: string | mongoose.Types.ObjectId,
  planName: string
) =>
  createNotification({
    userId,
    type: 'plan_expired',
    category: 'subscription',
    title: 'Your Plan Has Expired',
    message: `Your ${planName} subscription has now expired. Renew or upgrade your plan to continue enjoying premium features.`,
    icon: 'AlertTriangle',
    actionUrl: '/dashboard?tab=subscription',
    metadata: { planName },
  });

export const notifyPaymentSuccess = (
  userId: string | mongoose.Types.ObjectId,
  amount: number,
  currency: string
) =>
  createNotification({
    userId,
    type: 'payment_success',
    category: 'subscription',
    title: 'Payment Successful ✅',
    message: `Your payment of ${currency} ${amount.toFixed(2)} has been processed successfully. Thank you for your continued support!`,
    icon: 'CreditCard',
    metadata: { amount, currency },
  });

export const notifyNewPlan = (
  userId: string | mongoose.Types.ObjectId,
  oldPlan: string,
  newPlan: string
) =>
  createNotification({
    userId,
    type: 'new_plan',
    category: 'subscription',
    title: `Plan Upgraded to ${newPlan}`,
    message: `You've successfully upgraded from ${oldPlan} to ${newPlan}. Enjoy your enhanced QWorship experience!`,
    icon: 'Rocket',
    actionUrl: '/dashboard?tab=subscription',
    metadata: { oldPlan, newPlan },
  });

export const notifyRecordingSaved = (
  userId: string | mongoose.Types.ObjectId,
  recordingName?: string
) =>
  createNotification({
    userId,
    type: 'recording_saved',
    category: 'user_activity',
    title: 'Recording Saved',
    message: `Your recording${recordingName ? ` "${recordingName}"` : ''} has been saved successfully. You can access it from your media library.`,
    icon: 'Video',
    metadata: { recordingName },
  });

// ─── Admin broadcast helpers ─────────────────────────────────────────

export const broadcastNewFeature = (title: string, message: string) =>
  broadcastNotification({
    type: 'admin_feature',
    category: 'admin',
    title,
    message,
    icon: 'Sparkles',
  });

export const broadcastNewBible = (bibleName: string) =>
  broadcastNotification({
    type: 'admin_bible',
    category: 'admin',
    title: `New Bible Translation Added: ${bibleName}`,
    message: `Great news! The ${bibleName} Bible translation is now available in QWorship. Try it out in the Bible search widget.`,
    icon: 'BookOpen',
  });

export const broadcastPromotion = (title: string, message: string) =>
  broadcastNotification({
    type: 'admin_promotion',
    category: 'admin',
    title,
    message,
    icon: 'BadgePercent',
  });
