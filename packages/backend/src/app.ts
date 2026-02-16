import express from "express";
import cors from "cors";
import { requestIdMiddleware } from "./middleware/request-id.js";
import { loggerMiddleware } from "./middleware/logger.js";
import { healthRouter } from "./routes/health.js";
import { authRouter } from "./routes/auth.js";
import { snapRouter } from "./routes/snap.js";
import { audioRouter } from "./routes/audio.js";

export function createApp() {
  const app = express();

  // middleware
  app.use(cors());
  app.use(express.json({ limit: "10mb" }));
  app.use(requestIdMiddleware);
  app.use(loggerMiddleware);

  // routes
  app.use(healthRouter);
  app.use(authRouter);
  app.use(snapRouter);
  app.use(audioRouter);

  return app;
}

