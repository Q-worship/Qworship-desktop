import { Router } from "express";
import express from "express";
import { protect } from "../auth/auth.middleware.js";
import {
  pushState,
  pushPreview,
  snapshotTemplate,
  uploadAsset,
  serveAsset,
  serveThumbnail,
  getConfig,
  getStaticUrl,
  listTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from "./lower-third.controller.js";

export const lowerThirdRouter = Router();

// Increase JSON body size limit for template data and base64 assets
lowerThirdRouter.use(express.json({ limit: "20mb" }));

// ── Proxy to microservice ────────────────────────────────────────────────────
lowerThirdRouter.post("/push", protect, pushState);
lowerThirdRouter.patch("/push-preview", protect, pushPreview);
lowerThirdRouter.post("/snapshot", protect, snapshotTemplate);
lowerThirdRouter.post("/upload-asset", protect, uploadAsset);

// ── R2 asset serving ─────────────────────────────────────────────────────────
lowerThirdRouter.get("/asset/*", serveAsset);
lowerThirdRouter.get("/thumbnail/:userId/:templateId", protect, serveThumbnail);

// ── Config (safe, no secrets) ────────────────────────────────────────────────
lowerThirdRouter.get("/config", protect, getConfig);
lowerThirdRouter.get("/static-url", protect, getStaticUrl);

// ── Custom template CRUD (user-scoped) ───────────────────────────────────────
lowerThirdRouter.get("/templates", protect, listTemplates);
lowerThirdRouter.post("/templates", protect, createTemplate);
lowerThirdRouter.put("/templates/:templateId", protect, updateTemplate);
lowerThirdRouter.delete("/templates/:templateId", protect, deleteTemplate);
