import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: string;
  category: 'system' | 'subscription' | 'admin' | 'user_activity';
  title: string;
  message: string;
  icon?: string;
  actionUrl?: string;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: [
        // System / Automatic
        'welcome',
        'password_change',
        // Subscription
        'plan_subscription',
        'plan_expiry_reminder',
        'plan_expired',
        'payment_success',
        'new_plan',
        // Admin-triggered
        'admin_feature',
        'admin_bible',
        'admin_promotion',
        'admin_general',
        // User activity
        'recording_saved',
      ],
    },
    category: {
      type: String,
      required: true,
      enum: ['system', 'subscription', 'admin', 'user_activity'],
      default: 'system',
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    icon: { type: String },           // lucide icon name hint for the frontend
    actionUrl: { type: String },      // optional deep-link
    isRead: { type: Boolean, default: false, index: true },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

// Compound index for efficient user-notification queries
NotificationSchema.index({ userId: 1, createdAt: -1 });
NotificationSchema.index({ userId: 1, isRead: 1 });

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
