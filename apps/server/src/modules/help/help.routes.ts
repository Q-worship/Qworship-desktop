import { Router } from 'express';
import { getHelpArticles, getHelpArticleBySlug, getFAQs, getResources, submitSupportTicket, seedHelpData } from './help.controller.js';
import { protect } from '../auth/auth.middleware.js';

export const helpRouter = Router();

// Public routes for help content
helpRouter.get('/articles', getHelpArticles);
helpRouter.get('/articles/:slug', getHelpArticleBySlug);
helpRouter.get('/faqs', getFAQs);
helpRouter.get('/resources', getResources);

// Seed data (in a real app, protect this or remove it)
helpRouter.post('/seed', protect, seedHelpData);

// Protected routes
helpRouter.post('/support-tickets', protect, submitSupportTicket);
