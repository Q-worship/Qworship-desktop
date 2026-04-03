import { Router } from "express";
import {
  getSystemStatus,
  getTrialAnalytics,
  getUserMetrics,
  getRevenueData,
  getSystemMetrics,
  getAdminAccounts,
  getMediaCategories,
  createMediaCategory,
  getMediaCollections,
  createMediaCollection
} from "./admin.controller.js";
import { authorizeAdmin } from "../auth/auth.middleware.js";

const router = Router();

// To be safe, the frontend sends adminKey as a query parameter.
router.use(authorizeAdmin);

router.get("/system-status", getSystemStatus);
router.get("/trial-analytics", getTrialAnalytics);
router.get("/user-metrics", getUserMetrics);
router.get("/revenue-data", getRevenueData);
router.get("/system-metrics", getSystemMetrics);
router.get("/accounts", getAdminAccounts);

// Media Metadata Routes for Super Admin
router.get("/media/categories", getMediaCategories);
router.post("/media/categories", createMediaCategory);
router.get("/media/collections", getMediaCollections);
router.post("/media/collections", createMediaCollection);

export default router;
