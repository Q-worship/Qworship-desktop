import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceItem extends Document {
  sectionId: mongoose.Types.ObjectId;
  type: string;
  title: string;
  content?: string;
  bibleReference?: string;
  bibleVersion?: string;
  bibleVerses?: string;
  songId?: mongoose.Types.ObjectId | null;
  order: number;
  duration?: number;
  notes?: string;
  slides?: string;
  organizationId?: mongoose.Types.ObjectId | null;
  createdBy?: mongoose.Types.ObjectId | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>(
  {
    sectionId: { type: Schema.Types.ObjectId, ref: 'ServiceSection', required: true },
    type: { 
      type: String, 
      required: true,
      enum: ["song", "scripture", "bible", "announcement", "prayer", "offering", "custom"]
    },
    title: { type: String, required: true },
    content: { type: String, default: "" },
    bibleReference: { type: String },
    bibleVersion: { type: String },
    bibleVerses: { type: String },
    songId: { type: Schema.Types.ObjectId, ref: 'Song', default: null },
    order: { type: Number, required: true, default: 0 },
    duration: { type: Number },
    notes: { type: String },
    slides: { type: String }, // JSON string of layout details
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', default: null },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ServiceItem = mongoose.model<IServiceItem>('ServiceItem', ServiceItemSchema);
