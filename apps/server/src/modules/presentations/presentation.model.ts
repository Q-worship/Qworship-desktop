import mongoose, { Schema, Document } from 'mongoose';

export interface IServiceItem {
  type: 'song' | 'scripture' | 'bible' | 'announcement' | 'prayer' | 'offering' | 'custom';
  title: string;
  content?: string;
  bibleReference?: string;
  songRef?: mongoose.Types.ObjectId;
  duration?: number;
  order: number;
}

export interface IPresentationSection {
  name: string;
  order: number;
  items: IServiceItem[];
}

export interface IPresentation extends Document {
  name: string;
  date?: Date;
  sections: IPresentationSection[];
  serviceData?: any; // Supports Qworship-v2 dynamic payloads
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>({
  type: { type: String, required: true },
  title: { type: String, required: true },
  content: String,
  bibleReference: String,
  songRef: { type: Schema.Types.ObjectId, ref: 'Song' },
  duration: Number,
  order: { type: Number, required: true },
}, { _id: false });

const PresentationSectionSchema = new Schema<IPresentationSection>({
  name: { type: String, required: true },
  order: { type: Number, required: true },
  items: [ServiceItemSchema],
}, { _id: false });

const PresentationSchema = new Schema<IPresentation>(
  {
    name: { type: String, required: true },
    date: Date,
    sections: [PresentationSectionSchema], // Deeply embedded to avoid nasty JOIN queries
    serviceData: { type: Schema.Types.Mixed }, // V2 Unstructured bundle data
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Presentation = mongoose.model<IPresentation>('Presentation', PresentationSchema);
