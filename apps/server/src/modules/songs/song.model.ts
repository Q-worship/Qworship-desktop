import mongoose, { Schema, Document } from 'mongoose';

export interface ISongSection {
  type: 'verse' | 'chorus' | 'bridge' | 'pre_chorus' | 'tag' | 'intro' | 'outro';
  title: string;
  content: string;
  order: number;
}

export interface ISong extends Document {
  title: string;
  artist?: string;
  album?: string;
  lyrics: string;
  structure?: string[];
  key?: string;
  tempo?: number;
  ccliNumber?: string;
  tags?: string[];
  sections: ISongSection[];
  organizationId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SongSectionSchema = new Schema<ISongSection>({
  type: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  order: { type: Number, required: true },
}, { _id: false });

const SongSchema = new Schema<ISong>(
  {
    title: { type: String, required: true, index: true },
    artist: String,
    album: String,
    lyrics: { type: String, required: true },
    structure: [String],
    key: String,
    tempo: Number,
    ccliNumber: String,
    tags: [String],
    sections: [SongSectionSchema], // Embedded subdocument arrays
    organizationId: { type: Schema.Types.ObjectId, ref: 'Organization', required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Song = mongoose.model<ISong>('Song', SongSchema);
