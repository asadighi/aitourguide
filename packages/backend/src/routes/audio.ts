import { Router, Request, Response } from "express";
import * as fs from "node:fs";
import * as path from "node:path";
import { requireAuth } from "../middleware/auth.js";
import { getAudioById, getAudioByGuideContentId } from "../services/tts.js";
import { logger } from "../middleware/logger.js";

export const audioRouter = Router();

/**
 * GET /audio/:id
 *
 * Serve a cached TTS audio file by AudioNarration ID.
 * Returns the audio as an mp3 stream.
 * Requires authentication.
 */
audioRouter.get(
  "/audio/:id",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const audio = await getAudioById(id);

      if (!audio) {
        logger.warn({
          event: "audio.not_found",
          audioId: id,
          requestId: req.requestId,
        });
        res.status(404).json({
          schema: "error.v1",
          error_type: "not_found",
          message: "Audio not found",
          recoverable: false,
          suggested_action: "The audio may not have been generated yet",
        });
        return;
      }

      const stat = fs.statSync(audio.filePath);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${path.basename(audio.filePath)}"`
      );
      res.setHeader("Cache-Control", "public, max-age=86400"); // 24h cache

      const stream = fs.createReadStream(audio.filePath);
      stream.pipe(res);
    } catch (err) {
      logger.error({
        event: "audio.serve.error",
        audioId: req.params.id,
        requestId: req.requestId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      res.status(500).json({
        schema: "error.v1",
        error_type: "unknown",
        message: "Failed to serve audio",
        recoverable: true,
        suggested_action: "Try again later",
      });
    }
  }
);

/**
 * GET /audio/guide/:guideContentId
 *
 * Serve cached TTS audio by guide content ID.
 * This is the primary way the frontend fetches audio for a specific guide.
 * Returns the audio as an mp3 stream.
 * Requires authentication.
 */
audioRouter.get(
  "/audio/guide/:guideContentId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { guideContentId } = req.params;

      const audio = await getAudioByGuideContentId(guideContentId);

      if (!audio) {
        res.status(404).json({
          schema: "error.v1",
          error_type: "not_found",
          message: "Audio not found for this guide content",
          recoverable: false,
          suggested_action:
            "The audio may not have been generated yet. Try snapping again.",
        });
        return;
      }

      const stat = fs.statSync(audio.filePath);

      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Content-Length", stat.size);
      res.setHeader(
        "Content-Disposition",
        `inline; filename="${path.basename(audio.filePath)}"`
      );
      res.setHeader("Cache-Control", "public, max-age=86400");

      const stream = fs.createReadStream(audio.filePath);
      stream.pipe(res);
    } catch (err) {
      logger.error({
        event: "audio.serve.error",
        guideContentId: req.params.guideContentId,
        requestId: req.requestId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      res.status(500).json({
        schema: "error.v1",
        error_type: "unknown",
        message: "Failed to serve audio",
        recoverable: true,
        suggested_action: "Try again later",
      });
    }
  }
);

