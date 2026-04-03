import { Request, Response } from 'express';
import { Presentation } from './presentation.model.js';
import { Organization } from '../organization/organization.model.js';

export const getPresentations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    // Find presentations created by this user
    const presentations = await Presentation.find({ createdBy: userId })
      .sort({ createdAt: -1 });

    const formatted = presentations.map((p) => ({
      id: p._id.toString(), // map to frontend expected field
      name: p.name,
      description: p.date ? `Scheduled for ${p.date.toDateString()}` : 'No description',
      presentationDate: p.date ? p.date.toISOString() : p.createdAt.toISOString(),
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      slideCount: p.sections.reduce((acc, sec) => acc + sec.items.length, 0),
      serviceData: p.serviceData || p.sections,
      status: 'active'
    }));

    res.json({ presentations: formatted });
  } catch (error) {
    console.error('Error fetching presentations:', error);
    res.status(500).json({ error: 'Failed to fetch presentations' });
  }
};

export const createPresentation = async (req: Request, res: Response) => {
  try {
    const { name, presentationDate, description } = req.body;
    const userId = (req as any).user.id;

    // Try to find user's organization to link it
    let org = await Organization.findOne({ ownerId: userId });
    
    // If no org found, use a fallback (or fail, but fallback is better for dev)
    const orgId = org ? org._id : userId; // using userId as fallback objectId

    const newPresentation = await Presentation.create({
      name,
      date: presentationDate ? new Date(presentationDate) : new Date(),
      sections: [],
      organizationId: orgId,
      createdBy: userId,
    });

    res.status(201).json({
      success: true,
      presentation: {
        id: newPresentation._id.toString(),
        name: newPresentation.name,
        description: description || '',
        presentationDate: newPresentation.date?.toISOString() || new Date().toISOString(),
        createdAt: newPresentation.createdAt.toISOString(),
        updatedAt: newPresentation.updatedAt.toISOString(),
        slideCount: 0,
        status: 'active',
        serviceData: newPresentation.serviceData || null // Empty for new project
      }
    });
  } catch (error) {
    console.error('Error creating presentation:', error);
    res.status(500).json({ error: 'Failed to create presentation' });
  }
};

export const getPresentationById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const presentation = await Presentation.findById(id);

    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    res.json({
      presentation: {
        id: presentation._id.toString(),
        name: presentation.name,
        description: presentation.date ? `Scheduled for ${presentation.date.toDateString()}` : '',
        presentationDate: presentation.date ? presentation.date.toISOString() : presentation.createdAt.toISOString(),
        createdAt: presentation.createdAt.toISOString(),
        updatedAt: presentation.updatedAt.toISOString(),
        slideCount: presentation.sections.reduce((acc, sec) => acc + sec.items.length, 0),
        status: 'active',
        serviceData: presentation.serviceData || presentation.sections // payload used by dash
      }
    });
  } catch (error) {
    console.error('Error fetching presentation by ID:', error);
    res.status(500).json({ error: 'Failed to fetch presentation' });
  }
};

export const updatePresentation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, serviceData } = req.body;
    
    // Find and update the presentation
    const presentation = await Presentation.findById(id);
    if (!presentation) {
      return res.status(404).json({ error: 'Presentation not found' });
    }

    // Support both naming updates and full bundle updates
    if (name) presentation.name = name;
    if (serviceData !== undefined) {
      presentation.serviceData = typeof serviceData === 'string' ? JSON.parse(serviceData) : serviceData; 
    }
    
    // As per legacy layout, serviceData might just be strings or objects being sent dynamically
    // Let's explicitly do an update payload mapping
    const updatePayload: any = { updatedAt: new Date() };
    if (name) updatePayload.name = name;
    if (serviceData !== undefined) {
       updatePayload.serviceData = typeof serviceData === 'string' ? JSON.parse(serviceData) : serviceData;
    }

    const updatedPresentation = await Presentation.findByIdAndUpdate(id, updatePayload, { new: true });

    res.json({
      success: true,
      presentation: {
        id: updatedPresentation?._id.toString(),
        name: updatedPresentation?.name,
        serviceData: updatedPresentation?.serviceData || updatedPresentation?.sections
      }
    });
  } catch (error) {
    console.error('Error updating presentation:', error);
    res.status(500).json({ error: 'Failed to update presentation' });
  }
};

export const deletePresentation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await Presentation.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Presentation not found' });
    }
    res.json({ success: true, message: 'Presentation deleted' });
  } catch (error) {
    console.error('Error deleting presentation:', error);
    res.status(500).json({ error: 'Failed to delete presentation' });
  }
};
