import mongoose, { Schema, Document } from 'mongoose';

export interface IOrganization extends Document {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  phone?: string;
  website?: string;
  subscriptionType: 'free' | 'basic' | 'premium' | 'enterprise';
  subscriptionStatus: 'active' | 'inactive' | 'trial' | 'cancelled';
  owner: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    address: String,
    city: String,
    state: String,
    country: String,
    phone: String,
    website: String,
    subscriptionType: {
      type: String,
      enum: ['free', 'basic', 'premium', 'enterprise'],
      default: 'free',
    },
    subscriptionStatus: {
      type: String,
      enum: ['active', 'inactive', 'trial', 'cancelled'],
      default: 'trial',
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Organization = mongoose.model<IOrganization>('Organization', OrganizationSchema);
