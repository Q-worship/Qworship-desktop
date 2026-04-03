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
  accountType?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  role: 'user' | 'admin' | 'superadmin';
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
    accountType: { type: String, default: 'free' },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    role: { type: String, enum: ['user', 'admin', 'superadmin'], default: 'user' },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
