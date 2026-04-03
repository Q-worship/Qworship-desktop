import { Router } from 'express';
import { protect } from '../auth/auth.middleware.js';
import * as presentationController from './presentation.controller.js';

export const presentationRouter = Router();

// Retrieve presentations
presentationRouter.get('/', protect, presentationController.getPresentations);
presentationRouter.get('/:id', protect, presentationController.getPresentationById);

// Creation
presentationRouter.post('/', protect, presentationController.createPresentation);

// Modification
presentationRouter.put('/:id', protect, presentationController.updatePresentation);
presentationRouter.delete('/:id', protect, presentationController.deletePresentation);
