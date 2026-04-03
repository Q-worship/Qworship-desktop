import { Router } from "express";
import {
  getSections,
  initializeSections,
  createServiceItem,
} from "./service-sections.controller.js";
import { protect } from "../auth/auth.middleware.js";

export const serviceSectionsRouter = Router();

// Section endpoints
serviceSectionsRouter.get("/service-sections", protect, getSections);
serviceSectionsRouter.post("/service-sections/initialize", protect, initializeSections);

// Item endpoints (grouped here since they interact intimately)
serviceSectionsRouter.post("/service-items", protect, createServiceItem);
