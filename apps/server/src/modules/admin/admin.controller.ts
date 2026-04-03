import { Request, Response } from "express";
import { MediaCategory, MediaCollection } from "../media/media.model.js";

export const getSystemStatus = (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    version: "1.0.0",
    uptime: process.uptime(),
    database: "connected",
    lastBackup: new Date().toISOString(),
  });
};

export const getTrialAnalytics = (req: Request, res: Response) => {
  res.status(200).json({
    totalUsers: 2542,
    activeTrials: 342,
    expiredTrials: 156,
    trialConversionRate: 60.1,
    averageTrialDuration: 12, // days
    upcomingExpirations: {
      today: 14,
      thisWeek: 56,
      thisMonth: 124,
    },
  });
};

export const getUserMetrics = (req: Request, res: Response) => {
  res.status(200).json({
    totalRegistrations: 4521,
    dailySignups: 42,
    weeklySignups: 210,
    monthlySignups: 854,
    activeUsers: 3102,
    organizationsCreated: 154,
    emailVerificationRate: 94.2,
  });
};

export const getRevenueData = (req: Request, res: Response) => {
  res.status(200).json({
    totalRevenue: 125400,
    monthlyRecurringRevenue: 15400,
    averageRevenuePerUser: 42.5,
    trialToPayingConversion: 45.2,
    churnRate: 1.2,
    lifetimeValue: 1240,
  });
};

export const getSystemMetrics = (req: Request, res: Response) => {
  res.status(200).json({
    emailsSent: 15240,
    emailDeliveryRate: 99.4,
    notificationsSent: 45210,
    systemUptime: 99.99,
    databaseSize: "24.5 GB",
    activeConnections: 154,
  });
};

export const getAdminAccounts = (req: Request, res: Response) => {
  res.status(200).json([
    {
      id: "admin-1",
      email: "superadmin@qworship.com",
      role: "superadmin",
      status: "active",
      lastLogin: new Date().toISOString(),
    },
    {
      id: "admin-2",
      email: "moderator@qworship.com",
      role: "moderator",
      status: "active",
      lastLogin: new Date(Date.now() - 86400000).toISOString(),
    }
  ]);
};

// --- Media Taxonomy Endpoints ---
export const getMediaCategories = async (req: Request, res: Response) => {
  try {
    const categories = await MediaCategory.find().sort({ sortOrder: 1 });
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching categories" });
  }
};

export const createMediaCategory = async (req: Request, res: Response) => {
  try {
    const category = new MediaCategory(req.body);
    await category.save();
    res.status(201).json(category);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getMediaCollections = async (req: Request, res: Response) => {
  try {
    const collections = await MediaCollection.find().sort({ sortOrder: 1 });
    res.status(200).json(collections);
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching collections" });
  }
};

export const createMediaCollection = async (req: Request, res: Response) => {
  try {
    const collection = new MediaCollection(req.body);
    await collection.save();
    res.status(201).json(collection);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};
