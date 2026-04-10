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
// Handle legacy raw R2 urls organically that were pushed to slides before being caught
mediaRouter.get('/user-media-assets/resolve-r2', async (req, res) => {
  try {
    const r2Url = req.query.url as string;
    if (!r2Url) return res.status(400).json({ message: 'URL required' });
    
    // Find the media by fileUrl
    const { Media } = await import('./media.model.js');
    const { objectStorage } = await import('./s3.service.js');
    
    // Check both Cloud Media and User Media for this exact url
    const media = await Media.findOne({ fileUrl: r2Url });
    if (!media || !media.cloudKey) {
       // if we can't find it, we can't sign it.
       return res.status(404).json({ message: 'Corresponding media asset not found or lacks cloudKey' });
    }
    
    const signedUrl = await objectStorage.getSignedDownloadUrl(media.cloudKey, 3600);
    return res.redirect(signedUrl);
  } catch (error) {
    console.error('Failed to resolve legacy R2 URL:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});
mediaRouter.get('/user-media-assets/:id/file', getMediaFile);
mediaRouter.get('/user-media-assets/:id/thumbnail', getMediaThumbnail);
mediaRouter.delete('/user-media-assets/:id', deleteMedia);

// Cloud Media Routes -> /api/cloud-media
mediaRouter.post('/cloud-media', protect, authorizeAdmin, memoryUpload.array('files'), uploadCloudMedia);
mediaRouter.get('/cloud-media', listCloudMedia);
mediaRouter.get('/cloud-media/:id/thumbnail', getCloudMediaThumbnail);
mediaRouter.get('/cloud-media/:id/file', getCloudMediaFile);
mediaRouter.patch('/cloud-media/:id', protect, authorizeAdmin, updateCloudMedia);
