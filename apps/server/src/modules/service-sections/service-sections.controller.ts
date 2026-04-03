import { Request, Response } from 'express';
import { ServiceSection } from './service-section.model.js';
import { ServiceItem } from './service-item.model.js';

export const getSections = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    // Alternatively, filter by organizationId if available
    
    // Fetch all active sections and populate their active items
    const sections = await ServiceSection.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // Since Mongoose population with sorting on child arrays is tricky natively without aggregate,
    // we fetch items matching these sections manually or via $lookup.
    const sectionIds = sections.map(s => s._id);
    const items = await ServiceItem.find({ 
      sectionId: { $in: sectionIds },
      isActive: true 
    }).sort({ order: 1 }).lean();

    // Group items into their sections
    const populatedSections = sections.map(section => ({
      ...section,
      id: section._id,
      items: items.filter(item => item.sectionId.toString() === section._id.toString()).map(i => ({ ...i, id: i._id }))
    }));

    res.json({ success: true, sections: populatedSections });
  } catch (error) {
    console.error('Error fetching service sections:', error);
    res.status(500).json({ success: false, message: 'Server error fetching service sections' });
  }
};

export const initializeSections = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Check if sections already exist
    const existingCount = await ServiceSection.countDocuments({ isActive: true });
    if (existingCount > 0) {
      return res.status(400).json({ success: false, message: 'Sections already initialized' });
    }

    const defaultSections = [
      { name: "Pre-Service", description: "Countdown, announcements, etc.", order: 1 },
      { name: "Worship", description: "Praise and worship songs", order: 2 },
      { name: "Sermon", description: "Message notes and scriptures", order: 3 },
      { name: "Response / Ministry", description: "Altar call, closing songs", order: 4 }
    ];

    const createdSections = await Promise.all(
      defaultSections.map(s => 
        ServiceSection.create({
          ...s,
          createdBy: userId,
          isActive: true
        })
      )
    );

    res.status(201).json({ 
      success: true, 
      message: 'Default sections initialized',
      sections: createdSections 
    });
  } catch (error) {
    console.error('Error initializing sections:', error);
    res.status(500).json({ success: false, message: 'Server error initializing sections' });
  }
};

export const createServiceItem = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { sectionId, type, title, songId, bibleReference, bibleVersion, bibleVerses, order } = req.body;

    if (!sectionId || !type || !title) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    const newItem = await ServiceItem.create({
      sectionId,
      type,
      title,
      songId: songId || null,
      bibleReference,
      bibleVersion,
      bibleVerses,
      order: order || 0,
      createdBy: userId
    });

    res.status(201).json({ success: true, item: { ...newItem.toObject(), id: newItem._id } });
  } catch (error) {
    console.error('Error creating service item:', error);
    res.status(500).json({ success: false, message: 'Server error creating service item' });
  }
};
