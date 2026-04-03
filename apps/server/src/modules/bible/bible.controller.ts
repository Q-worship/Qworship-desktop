import { Request, Response } from 'express';
import { BibleService } from './bible.service.js';
import type { BibleReference } from './bible.service.js';

export const searchBible = async (req: Request, res: Response) => {
  try {
    const reference = req.query.reference as string;
    const version = (req.query.version as string) || 'kjv';

    if (!reference) {
      return res.status(400).json({ success: false, message: 'Reference is required' });
    }

    // Try to parse the reference using the service
    const parsedRef = BibleService.parseVoiceCommandOptimized(reference);

    let searchReference: BibleReference | null = null;

    if (parsedRef && parsedRef.parsedReference) {
      searchReference = parsedRef.parsedReference;
      searchReference.version = (version as any) || 'kjv';
    } else {
      // Fallback manual parsing if voice parser fails on strict strings
      const basicMatch = reference.match(/^([1-3]?\s*[a-zA-Z]+)\s+(\d+)(?:[:\s]+(\d+)(?:[-](\d+))?)?$/);
      if (basicMatch) {
         searchReference = {
             book: basicMatch[1].trim(),
             chapter: parseInt(basicMatch[2]),
             verseStart: basicMatch[3] ? parseInt(basicMatch[3]) : 1,
             verseEnd: basicMatch[4] ? parseInt(basicMatch[4]) : undefined,
             version: (version as any) || 'kjv'
         };
      }
    }

    if (!searchReference) {
      return res.status(400).json({ success: false, message: 'Invalid reference format' });
    }

    const result = await BibleService.searchBible(searchReference);
    
    if (result && result.verses.length > 0) {
      // Map the internal structure to the old NextJS API interface expected by the React components
      const requestedVersion = (searchReference.version || 'kjv').toLowerCase();
      
      const mappedVerses = result.verses.map(v => ({
         number: v.verse,
         // The DB stores versions as lowercase keys: v.kjv, v.nkjv, etc.
         text: (v as any)[requestedVersion] || v.kjv || ''
      }));

      const passage = {
         reference: result.formattedReference,
         version: result.version || requestedVersion.toUpperCase(),
         verses: mappedVerses
      };

      return res.json({ success: true, passage });
    } else {
      return res.status(404).json({ success: false, message: 'Verses not found' });
    }
  } catch (error) {
    console.error('Bible Search Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

export const handleVoiceCommand = async (req: Request, res: Response) => {
  try {
    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ success: false, message: 'Text is required' });
    }

    const command = BibleService.parseVoiceCommandOptimized(text);

    if (!command.parsedReference && command.commandType === 'lookup') {
      return res.json({ success: false, commandType: command.commandType, error: 'Could not parse reference' });
    }

    if (command.commandType === 'lookup' && command.parsedReference) {
      const result = await BibleService.searchBible(command.parsedReference);
      if (result && result.verses.length > 0) {
        return res.json({ 
            success: true, 
            commandType: 'lookup',
            parsedReference: command.parsedReference,
            data: result 
        });
      } else {
        return res.json({ success: false, commandType: 'lookup', message: 'Not found' });
      }
    }

    // For non-lookup commands (navigation, version change)
    return res.json({
        success: true,
        commandType: command.commandType,
        parsedReference: command.parsedReference,
        actionParams: {
           direction: command.navigationDirection,
           version: command.requestedVersion
        }
    });

  } catch (error) {
    console.error('Voice Command Error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
