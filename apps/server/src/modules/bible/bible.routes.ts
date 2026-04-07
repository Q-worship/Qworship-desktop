import { Router } from 'express';
import { searchBible, handleVoiceCommand, structuredSearchBible, exportBibleVersion } from './bible.controller.js';

export const bibleRouter = Router();

bibleRouter.get('/search', searchBible);
bibleRouter.post('/search', structuredSearchBible);
bibleRouter.post('/voice-command', handleVoiceCommand);
bibleRouter.get('/export/:version', exportBibleVersion);
