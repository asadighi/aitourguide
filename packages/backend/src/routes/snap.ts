import { Router, Request, Response } from "express";
import { SnapRequestSchema } from "@aitourguide/shared";
import { PromptRegistry, OpenAIAdapter, type LLMProvider } from "@aitourguide/mcp";
import { requireAuth } from "../middleware/auth.js";
import { processSnap } from "../services/snap.js";
import { logger } from "../middleware/logger.js";

export const snapRouter = Router();

// Initialize MCP registry and LLM provider (singleton)
let registry: PromptRegistry | null = null;
let provider: LLMProvider | null = null;

function getRegistry(): PromptRegistry {
  if (!registry) {
    registry = new PromptRegistry();
    registry.loadFromFilesystem();
  }
  return registry;
}

function getProvider(): LLMProvider {
  if (!provider) {
    provider = new OpenAIAdapter();
  }
  return provider;
}

/**
 * Allow injecting a mock provider for tests.
 */
export function setSnapDependencies(deps: {
  provider?: LLMProvider;
  registry?: PromptRegistry;
}) {
  if (deps.provider) provider = deps.provider;
  if (deps.registry) registry = deps.registry;
}

/**
 * POST /snap
 *
 * Accept a photo (base64), optional GPS coordinates, and locale.
 * Returns landmark identification + guide content + ads.
 *
 * Requires authentication.
 */
snapRouter.post("/snap", requireAuth, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const parseResult = SnapRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        schema: "error.v1",
        error_type: "unknown",
        message: "Invalid request body",
        recoverable: true,
        suggested_action: "Check the request format and try again",
        details: parseResult.error.errors,
      });
      return;
    }

    const { image_base64, gps, locale } = parseResult.data;

    logger.info({
      event: "snap.request",
      requestId: req.requestId,
      hasGps: !!gps,
      locale,
      imageSize: image_base64.length,
    });

    const result = await processSnap(getProvider(), getRegistry(), {
      imageBase64: image_base64,
      gps,
      locale,
      requestId: req.requestId,
    });

    res.json(result);
  } catch (err) {
    logger.error({
      event: "snap.error",
      requestId: req.requestId,
      error: err instanceof Error ? err.message : "Unknown error",
    });

    res.status(500).json({
      schema: "error.v1",
      error_type: "identification_failed",
      message: "Failed to process snap",
      recoverable: true,
      suggested_action: "Try taking a clearer photo or try again later",
    });
  }
});

