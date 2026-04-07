import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username?: string;
  email: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  countryCode?: string;
  phoneNumber?: string;
  agreeToMarketing?: boolean;
  organizationName?: string;
  bio?: string;
  accountType?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  profilePicture?: string;
  role: 'user' | 'admin' | 'superadmin' | 'pastor' | 'worship_leader' | 'member';
  planType?: string;
  trialStartDate?: Date;
  trialEndDate?: Date;
  subscriptionStatus?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String }, // Optional for OAuth
    firstName: { type: String },
    lastName: { type: String },
    countryCode: { type: String },
    phoneNumber: { type: String },
    agreeToMarketing: { type: Boolean, default: false },
    organizationName: { type: String },
    bio: { type: String },
    accountType: { type: String, default: 'free' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    profilePicture: { type: String },
    role: { type: String, enum: ['user', 'admin', 'superadmin', 'pastor', 'worship_leader', 'member'], default: 'user' },
    planType: { type: String, default: 'trial' },
    trialStartDate: { type: Date, default: Date.now },
    trialEndDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    subscriptionStatus: { type: String, default: 'trial' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
