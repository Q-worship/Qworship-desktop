import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  firstName?: string;
  lastName?: string;
  role: 'superadmin' | 'admin' | 'pastor' | 'worship_leader' | 'member';
  accountType: 'free' | 'basic' | 'premium' | 'enterprise';
  isActive: boolean;
  emailVerified: boolean;
  organizations: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    firstName: String,
    lastName: String,
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'pastor', 'worship_leader', 'member'],
      default: 'member',
    },
    accountType: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free',
    },
    isActive: { type: Boolean, default: true },
    emailVerified: { type: Boolean, default: false },
    organizations: [{ type: Schema.Types.ObjectId, ref: 'Organization' }],
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);
