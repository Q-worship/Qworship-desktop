import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./core/db.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { subscriptionRouter } from "./modules/auth/subscription.routes.js";
import { organizationRouter } from "./modules/organization/organization.routes.js";
import { helpRouter } from "./modules/help/help.routes.js";
import { createServer } from "http";
import { setupAudioSocket } from "./modules/bible/audio.socket.js";

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }),
); // Connect to Vite App
app.use(express.json());

// Request Telemetry Pipeline
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? "\x1b[31m" : "\x1b[32m"; // Red for errors, Green for success
    console.log(
      `\x1b[36m[API]\x1b[0m ${req.method} ${req.originalUrl} | Status: ${statusColor}${res.statusCode}\x1b[0m | Duration: ${duration}ms`,
    );
  });
  next();
});

import { serviceSectionsRouter } from "./modules/service-sections/service-sections.routes.js";
import { songsRouter } from "./modules/songs/songs.routes.js";
import { presentationRouter } from "./modules/presentations/presentation.routes.js";
import { mediaRouter } from "./modules/media/media.routes.js";
import { bibleRouter } from "./modules/bible/bible.routes.js";
import adminRouter from "./modules/admin/admin.routes.js";
import { notificationRouter } from "./modules/notifications/notification.routes.js";

// Main Routes
app.use("/api/auth", authRouter);
app.use("/api/user", authRouter); // Aliases for legacy pathways
app.use("/api", subscriptionRouter);
app.use("/api/songs", songsRouter);
app.use("/api/presentations", presentationRouter);
app.use("/api", organizationRouter);
app.use("/api", serviceSectionsRouter);
app.use("/api", mediaRouter);
app.use("/api/help", helpRouter);
app.use("/api/bible", bibleRouter);
app.use("/api/admin", adminRouter);
app.use("/api", notificationRouter);

// Database & Server Initialization
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    const server = createServer(app);
    setupAudioSocket(server);
    server.listen(PORT, () => {
      console.log(`[Q-worship] Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
