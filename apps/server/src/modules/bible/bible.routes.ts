import { Router } from 'express';
import { searchBible, handleVoiceCommand, structuredSearchBible } from './bible.controller.js';

export const bibleRouter = Router();

bibleRouter.get('/search', searchBible);
bibleRouter.post('/search', structuredSearchBible);
bibleRouter.post('/voice-command', handleVoiceCommand);
