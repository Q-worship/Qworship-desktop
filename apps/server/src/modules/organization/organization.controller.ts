import { Request, Response } from 'express';
import { Organization } from './organization.model.js';
import { User } from '../auth/auth.model.js';

export const createOrganization = async (req: Request, res: Response) => {
  try {
    const { 
      name, address, city, state, zipCode, country, 
      phone, website, denomination, size, userId 
    } = req.body;

    if (!name || !userId) {
      return res.status(400).json({ success: false, message: 'Name and userId are required' });
    }

    // 1. Create Organization
    const organization = await Organization.create({
      name, address, city, state, zipCode, country,
      phone, website, denomination, size,
      ownerId: userId // Binding the caller
    });

    // 2. Link the organization back to the user
    await User.findByIdAndUpdate(userId, {
      organizationName: name
    });

    return res.status(201).json({
      success: true,
      message: 'Organization created successfully',
      organization: {
        id: organization._id, // Map MongoDB _id natively
        name: organization.name
      }
    });

  } catch (error) {
    console.error('Organization creation error:', error);
    res.status(500).json({ success: false, error: 'Organization setup failed' });
  }
};

export const selectPlan = async (req: Request, res: Response) => {
  try {
    const { planType, userId, billingPeriod, isExtension } = req.body;

    if (!planType || !userId) {
      return res.status(400).json({ success: false, error: 'planType and userId are required' });
    }

    // Convert planType to accountType format
    const accountType = planType === 'trial' ? 'free' : planType;

    // Persist to user model 
    await User.findByIdAndUpdate(userId, {
      accountType,
      isActive: true
    });

    res.json({
      success: true,
      message: 'Plan selected successfully',
      nextStep: '/project-selection',
      planType,
    });
  } catch (error) {
    console.error('Plan selection error:', error);
    res.status(500).json({ success: false, error: 'Plan selection failed' });
  }
};
