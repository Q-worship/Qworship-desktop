import { Router } from 'express';
import { searchBible, handleVoiceCommand } from './bible.controller.js';

export const bibleRouter = Router();

bibleRouter.get('/search', searchBible);
bibleRouter.post('/voice-command', handleVoiceCommand);
