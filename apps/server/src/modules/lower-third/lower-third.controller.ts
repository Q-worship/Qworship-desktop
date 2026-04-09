import { Request, Response } from "express";
import { LowerThirdTemplate } from "./lower-third.model.js";
import {
  objectStorage,
  ObjectNotFoundError,
} from "../media/s3.service.js";
import { randomUUID } from "crypto";

// ─── Environment ──────────────────────────────────────────────────────────────

const LT_BASE_URL = (process.env.LT_BASE_URL || "http://localhost:3400").replace(
  /\/$/,
  ""
);
const LT_API_KEY = process.env.LT_API_KEY || "";
const R2_PUBLIC_URL = (
  process.env.R2_PUBLIC_DOMAIN ||
  process.env.R2_PUBLIC_URL ||
  ""
).replace(/\/$/, "");

const ltHeaders: Record<string, string> = {
  "Content-Type": "application/json",
  "X-LT-Api-Key": LT_API_KEY,
};

const TEMPLATE_LIMIT = 10;

// ─── Proxy: Push state to microservice ────────────────────────────────────────

export const pushState = async (req: Request, res: Response) => {
  const { userId, feature, template, settings, bindingData, isVisible, enabled } =
    req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  console.log(
    `[LT Proxy] /push received for userId: ${userId}, feature: ${feature}, isVisible: ${isVisible}`
  );

  try {
    const response = await fetch(`${LT_BASE_URL}/rooms/${userId}/state`, {
      method: "PATCH",
      headers: ltHeaders,
      body: JSON.stringify({
        feature,
        template,
        settings,
        bindingData,
        isVisible,
        enabled,
      }),
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    console.error("[LT Proxy] Failed to reach lower-thirds service:", err.message);
    res.status(502).json({ error: "Lower-thirds service unavailable" });
  }
};

// ─── Proxy: Push preview state (isolated room) ───────────────────────────────

export const pushPreview = async (req: Request, res: Response) => {
  const { userId, feature, template, settings, bindingData, isVisible, enabled } =
    req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  try {
    const response = await fetch(
      `${LT_BASE_URL}/rooms/preview-${userId}/state`,
      {
        method: "PATCH",
        headers: ltHeaders,
        body: JSON.stringify({
          feature,
          template,
          settings,
          bindingData,
          isVisible,
          enabled,
        }),
      }
    );
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err: any) {
    console.error("[LT Preview Proxy] Failed:", err.message);
    res.status(502).json({ error: "Lower-thirds service unavailable" });
  }
};

// ─── Proxy: Snapshot (Puppeteer PNG → R2) ─────────────────────────────────────

export const snapshotTemplate = async (req: Request, res: Response) => {
  const { template, bindingData, templateId } = req.body;
  const userId = (req as any).user?._id?.toString() ?? "unknown";

  if (!template || !templateId) {
    return res
      .status(400)
      .json({ error: "template and templateId are required" });
  }

  try {
    const snapResponse = await fetch(`${LT_BASE_URL}/snapshot`, {
      method: "POST",
      headers: ltHeaders,
      body: JSON.stringify({ template, bindingData: bindingData ?? {} }),
    });

    if (!snapResponse.ok) {
      const errText = await snapResponse.text();
      throw new Error(`Snapshot service error: ${errText}`);
    }

    const pngBuffer = Buffer.from(await snapResponse.arrayBuffer());
    const key = `lower-third-thumbnails/${userId}/${templateId}.png`;
    await objectStorage.uploadFile(key, pngBuffer, "image/png");

    const thumbnailUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `/api/lower-third/thumbnail/${userId}/${templateId}`;

    res.json({ ok: true, thumbnailUrl });
  } catch (err: any) {
    console.error("[LT Snapshot] Failed:", err.message);
    res
      .status(500)
      .json({ error: "Snapshot generation failed", detail: err.message });
  }
};

// ─── Upload Asset (base64 → R2) ──────────────────────────────────────────────

export const uploadAsset = async (req: Request, res: Response) => {
  const { fileBase64, mimeType, filename } = req.body;
  const userId = (req as any).user?._id?.toString() ?? "unknown";

  if (!fileBase64 || !mimeType) {
    return res
      .status(400)
      .json({ error: "fileBase64 and mimeType are required" });
  }

  try {
    const buffer = Buffer.from(fileBase64, "base64");
    const ext =
      filename?.split(".").pop() || mimeType.split("/")[1] || "png";
    const key = `lower-third-assets/${userId}/${randomUUID()}.${ext}`;
    await objectStorage.uploadFile(key, buffer, mimeType);

    const assetUrl = R2_PUBLIC_URL
      ? `${R2_PUBLIC_URL}/${key}`
      : `/api/lower-third/asset/${key}`;

    res.json({ ok: true, assetUrl });
  } catch (err: any) {
    console.error("[LT Asset Upload] Failed:", err.message);
    res
      .status(500)
      .json({ error: "Asset upload failed", detail: err.message });
  }
};

// ─── Serve R2 Asset ───────────────────────────────────────────────────────────

export const serveAsset = async (req: Request, res: Response) => {
  const key = (req.params as any)[0] as string;
  if (!key) {
    return res.status(400).json({ error: "Missing asset key" });
  }

  try {
    const buffer = await objectStorage.downloadFile(key);
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    res.setHeader("Content-Type", mimeMap[ext] ?? "application/octet-stream");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (err: any) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Asset not found" });
    } else {
      console.error("[LT Asset Serve] Failed:", err.message);
      res.status(500).json({ error: "Failed to retrieve asset" });
    }
  }
};

// ─── Serve Thumbnail ──────────────────────────────────────────────────────────

export const serveThumbnail = async (req: Request, res: Response) => {
  const { userId, templateId } = req.params;
  const key = `lower-third-thumbnails/${userId}/${templateId}.png`;

  try {
    const buffer = await objectStorage.downloadFile(key);
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=3600");
    res.send(buffer);
  } catch (err: any) {
    if (err instanceof ObjectNotFoundError) {
      res.status(404).json({ error: "Thumbnail not found" });
    } else {
      console.error("[LT Thumbnail Serve] Failed:", err.message);
      res.status(500).json({ error: "Failed to retrieve thumbnail" });
    }
  }
};

// ─── Config (safe, no secrets) ────────────────────────────────────────────────

export const getConfig = (_req: Request, res: Response) => {
  res.json({ ltBaseUrl: LT_BASE_URL });
};

export const getStaticUrl = (_req: Request, res: Response) => {
  res.json({
    staticBase: `${LT_BASE_URL}/r/static`,
    previewBase: LT_BASE_URL,
  });
};

// ─── Custom Template CRUD (user-scoped) ───────────────────────────────────────

export const listTemplates = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const rows = await LowerThirdTemplate.find({ userId }).sort({
      createdAt: -1,
    });
    const templates = rows.map((r) => ({
      ...JSON.parse(r.data),
      thumbnail: r.thumbnail ?? undefined,
    }));
    res.json({ ok: true, templates });
  } catch (err: any) {
    console.error("[LT Templates] GET error:", err.message);
    res.status(500).json({ error: "Failed to load templates" });
  }
};

export const createTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { template } = req.body as {
      template: { id: string; name: string; [k: string]: unknown };
    };

    if (!template?.id || !template?.name) {
      return res
        .status(400)
        .json({ error: "template.id and template.name are required" });
    }

    // Enforce per-user limit
    const existing = await LowerThirdTemplate.countDocuments({ userId });
    if (existing >= TEMPLATE_LIMIT) {
      return res.status(429).json({
        error: `Maximum of ${TEMPLATE_LIMIT} custom templates reached. Delete one to add another.`,
      });
    }

    await LowerThirdTemplate.create({
      userId,
      templateId: template.id,
      name: template.name,
      data: JSON.stringify(template),
      thumbnail: (template.thumbnail as string) || null,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[LT Templates] POST error:", err.message);
    res.status(500).json({ error: "Failed to save template" });
  }
};

export const updateTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { templateId } = req.params;
    const { template } = req.body as {
      template: { id: string; name: string; [k: string]: unknown };
    };

    if (!template) {
      return res.status(400).json({ error: "template body is required" });
    }

    const result = await LowerThirdTemplate.findOneAndUpdate(
      { userId, templateId },
      {
        name: template.name,
        data: JSON.stringify(template),
        thumbnail: (template.thumbnail as string) || null,
      },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Template not found" });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("[LT Templates] PUT error:", err.message);
    res.status(500).json({ error: "Failed to update template" });
  }
};

export const deleteTemplate = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user._id;
    const { templateId } = req.params;

    await LowerThirdTemplate.deleteOne({ userId, templateId });
    res.json({ ok: true });
  } catch (err: any) {
    console.error("[LT Templates] DELETE error:", err.message);
    res.status(500).json({ error: "Failed to delete template" });
  }
};
