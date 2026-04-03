export interface User {
  id: number | string;
  username: string;
  email: string;
  [key: string]: any;
}

export interface MediaAsset {
  id: number | string;
  title: string;
  type: string;
  thumbnail: string | null;
  uploadedBy: string;
  tags: string[] | null;
  collection: string;
  season?: string | null;
  usageCount: number;
  createdAt: string;
  lastUsed?: string | null;
  fileSize?: number;
  description?: string;
  fileType?: string;
  fileName?: string;
  category?: string;
  categories?: string[];
  fileUrl?: string;
}

export type BackgroundType = "none" | "color" | "gradient" | "image" | "video" | "fill" | "media";

export interface BackgroundData {
  type: BackgroundType;
  value: string;
  name?: string;
}

export interface SlideContent {
  id?: string;
  text?: string;
  type?: string;
  html?: string;
  [key: string]: any;
}

export interface Slide {
  id: string;
  type: "blank" | "text" | "lyrics" | "bible" | "media" | "web" | string;
  content: string | SlideContent;
  background: BackgroundData;
  notes?: string;
  title?: string;
  order?: number;
  sectionLabel?: string;
  songTitle?: string;
}

export interface Presentation {
  id: number | string;
  name: string;
  date: string;
  [key: string]: any;
}

export interface Song {
  id: number | string;
  title: string;
  lyrics: string;
  [key: string]: any;
}

export interface Item {
  id: string | number;
  type: string;
  title?: string;
  songTitle?: string;
  content?: string | any;
  sections?: any[];
  background?: BackgroundData;
  [key: string]: any;
}

export interface ServiceSection {
  id: string | number;
  label: string;
  [key: string]: any;
}
