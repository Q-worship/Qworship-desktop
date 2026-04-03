import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceSection extends Document {
  name: string;
  description?: string;
  order: number;
  organizationId?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceSectionSchema = new Schema<IServiceSection>(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    order: { type: Number, required: true, default: 0 },
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceSection = mongoose.model<IServiceSection>('ServiceSection', ServiceSectionSchema);
