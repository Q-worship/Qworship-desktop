import mongoose, { Schema, Document } from 'mongoose';

export interface IHelpArticle extends Document {
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  readTime?: string;
  difficulty?: string;
  tags?: string[];
  helpful: number;
  notHelpful: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HelpArticleSchema = new Schema<IHelpArticle>({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  content: { type: String, required: true },
  category: { type: String, required: true },
  readTime: { type: String },
  difficulty: { type: String },
  tags: [{ type: String }],
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

export const HelpArticle = mongoose.model<IHelpArticle>('HelpArticle', HelpArticleSchema);

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category: string;
  helpful: number;
  notHelpful: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  helpful: { type: Number, default: 0 },
  notHelpful: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

export const FAQ = mongoose.model<IFAQ>('FAQ', FAQSchema);

export interface IResourceLink extends Document {
  title: string;
  description: string;
  url: string;
  category: string;
  icon?: string;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceLinkSchema = new Schema<IResourceLink>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  url: { type: String, required: true },
  category: { type: String, required: true },
  icon: { type: String },
  isPublished: { type: Boolean, default: true }
}, { timestamps: true });

export const ResourceLink = mongoose.model<IResourceLink>('ResourceLink', ResourceLinkSchema);

export interface ISupportTicket extends Document {
  subject: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  submittedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SupportTicketSchema = new Schema<ISupportTicket>({
  subject: { type: String, required: true },
  message: { type: String, required: true },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  category: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

export const SupportTicket = mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
