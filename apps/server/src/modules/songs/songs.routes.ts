import { Router } from 'express';
import multer from 'multer';
import { protect } from '../auth/auth.middleware.js';
import * as songsController from './songs.controller.js';

export const songsRouter = Router();

// Configure multer for legacy song file import buffers
const songUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type. Only TEXT, PDF, and DOCX are allowed."));
  },
});

// Retrieve library
songsRouter.get('/', protect, songsController.getSongs);
songsRouter.get('/:id', protect, songsController.getSongById);

// Creation and modification
songsRouter.post('/', protect, songsController.createSong);
songsRouter.put('/:id', protect, songsController.updateSong);
songsRouter.delete('/:id', protect, songsController.deleteSong);

// Utilities
songsRouter.post('/projection', songsController.getSongForProjection);
songsRouter.post('/search', protect, songsController.searchSongs);
songsRouter.post('/import', protect, songUpload.single('file'), songsController.importSong);
