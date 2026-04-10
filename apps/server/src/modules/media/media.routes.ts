import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { protect, authorizeAdmin } from '../auth/auth.middleware.js';
import {
  uploadMedia,
  listUserMedia,
  getMediaFile,
  getMediaThumbnail,
  deleteMedia,
  listCloudMedia,
  getCloudMediaThumbnail,
  getCloudMediaFile,
  uploadCloudMedia,
  updateCloudMedia,
  getUserMediaStats
} from './media.controller.js';

// Setup multer storage
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename preserving extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

const memoryStorage = multer.memoryStorage();
const memoryUpload = multer({
  storage: memoryStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

export const mediaRouter = Router();

// User Media Routes -> /api/user-media-assets
mediaRouter.post('/user-media-assets/upload', protect, memoryUpload.array('files'), uploadMedia); // The frontend uses 'files' for FormData
mediaRouter.get('/user-media-stats', protect, getUserMediaStats);
mediaRouter.get('/user-media-assets', protect, listUserMedia);
mediaRouter.get('/user-media-assets/:id/file', getMediaFile);
mediaRouter.get('/user-media-assets/:id/thumbnail', getMediaThumbnail);
mediaRouter.delete('/user-media-assets/:id', deleteMedia);

// Cloud Media Routes -> /api/cloud-media
mediaRouter.post('/cloud-media', protect, authorizeAdmin, memoryUpload.array('files'), uploadCloudMedia);
mediaRouter.get('/cloud-media', listCloudMedia);
mediaRouter.get('/cloud-media/:id/thumbnail', getCloudMediaThumbnail);
mediaRouter.get('/cloud-media/:id/file', getCloudMediaFile);
mediaRouter.patch('/cloud-media/:id', protect, authorizeAdmin, updateCloudMedia);
