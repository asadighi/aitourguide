import { prisma } from "../lib/prisma.js";
import {
  PromptRegistry,
  identifyLandmark,
  generateGuide,
  type LLMProvider,
} from "@aitourguide/mcp";
import type { LandmarkIdentification, GuideContent } from "@aitourguide/shared";
import { logger } from "../middleware/logger.js";
import { getOrGenerateTTS } from "./tts.js";

export interface SnapInput {
  imageBase64: string;
  gps?: { lat: number; lng: number };
  locale: string;
  requestId: string;
}

export interface SnapResult {
  landmark: LandmarkIdentification;
  guide: GuideContent | null;
  cached: boolean;
  audio: {
    audioId: string;
    url: string;
    cached: boolean;
    voice: string;
  } | null;
  ads: Array<{
    id: string;
    title: string;
    body: string;
    image_url: string | null;
    link_url: string;
  }>;
}

/**
 * Main snap processing pipeline:
 * 1. Identify landmark(s) from photo via LLM vision
 * 2. If needs_clarification, return early with candidates
 * 3. Check cache for existing guide content
 * 4. If cache miss, generate guide content via LLM
 * 5. Store/cache landmark + guide content
 * 6. Fetch relevant ads for the landmark
 * 7. Return complete result
 */
export async function processSnap(
  provider: LLMProvider,
  registry: PromptRegistry,
  input: SnapInput
): Promise<SnapResult> {
  const log = logger.child({ requestId: input.requestId });

  // Step 1: Identify landmark
  log.info({ event: "snap.identify.start" });
  const identification = await identifyLandmark(provider, registry, {
    imageBase64: input.imageBase64,
    gps: input.gps,
  });
  log.info({
    event: "snap.identify.complete",
    model: identification.model,
    latencyMs: identification.latencyMs,
    landmarkCount: identification.data.landmarks.length,
    needsClarification: identification.data.needs_clarification,
    usage: identification.usage,
  });

  // Step 2: If needs clarification, return early
  if (
    identification.data.needs_clarification ||
    identification.data.landmarks.length === 0
  ) {
    return {
      landmark: identification.data,
      guide: null,
      cached: false,
      audio: null,
      ads: [],
    };
  }

  const topLandmark = identification.data.landmarks[0];

  // Resolve the current active prompt version for cache invalidation
  const activeGuidePrompt = registry.getActive("guide_generate");
  const currentPromptVersion = activeGuidePrompt?.version ?? null;

  // Step 3: Check DB for existing landmark + cached guide content
  let dbLandmark = await prisma.landmark.findFirst({
    where: { name: topLandmark.name },
  });

  let cached = false;
  let guideData: GuideContent | null = null;
  let guideContentId: string | null = null;

  if (dbLandmark) {
    // Check for cached active guide content in requested locale
    // Also require prompt_version to match — stale content from older prompts is a cache miss
    const cachedGuide = await prisma.guideContent.findFirst({
      where: {
        landmark_id: dbLandmark.id,
        locale: input.locale,
        is_active: true,
        ...(currentPromptVersion
          ? { prompt_version: currentPromptVersion }
          : {}),
      },
    });

    if (cachedGuide) {
      log.info({
        event: "snap.guide.cache_hit",
        landmarkId: dbLandmark.id,
        locale: input.locale,
        guideVersion: cachedGuide.version,
        promptVersion: cachedGuide.prompt_version,
      });
      cached = true;
      guideContentId = cachedGuide.id;
      guideData = {
        schema: "guide_content.v1",
        landmark_name: cachedGuide.title, // use stored title as landmark_name
        locale: cachedGuide.locale,
        title: cachedGuide.title,
        summary: cachedGuide.summary,
        facts: cachedGuide.facts as Array<{ heading: string; body: string }>,
        narration_script: cachedGuide.narration_script,
        fun_fact: cachedGuide.fun_fact,
        confidence_note: null,
      };
    }
  }

  // Step 4: Cache miss — generate guide content
  if (!guideData) {
    log.info({ event: "snap.guide.generate.start", locale: input.locale });

    const guideResult = await generateGuide(provider, registry, {
      landmarkName: topLandmark.name,
      locale: input.locale,
    });

    log.info({
      event: "snap.guide.generate.complete",
      model: guideResult.model,
      latencyMs: guideResult.latencyMs,
      usage: guideResult.usage,
    });

    guideData = guideResult.data;

    // Step 5: Persist landmark + guide content
    if (!dbLandmark) {
      dbLandmark = await prisma.landmark.create({
        data: {
          name: topLandmark.name,
          city: topLandmark.location.city,
          country: topLandmark.location.country,
          lat: topLandmark.location.coordinates?.lat,
          lng: topLandmark.location.coordinates?.lng,
          category:
            (topLandmark.category as
              | "monument"
              | "building"
              | "natural"
              | "religious"
              | "historical"
              | "cultural"
              | "other") || "other",
        },
      });
    }

    // Deactivate any previously active guide for this landmark+locale
    // (prompt version changed, so old content is stale)
    if (dbLandmark) {
      await prisma.guideContent.updateMany({
        where: {
          landmark_id: dbLandmark.id,
          locale: input.locale,
          is_active: true,
        },
        data: { is_active: false },
      });
    }

    // Determine next version number for this landmark+locale
    const prevVersionCount = dbLandmark
      ? await prisma.guideContent.count({
          where: {
            landmark_id: dbLandmark.id,
            locale: input.locale,
          },
        })
      : 0;

    const createdGuide = await prisma.guideContent.create({
      data: {
        landmark_id: dbLandmark.id,
        locale: input.locale,
        version: prevVersionCount + 1,
        title: guideData.title,
        summary: guideData.summary,
        facts: guideData.facts,
        narration_script: guideData.narration_script,
        fun_fact: guideData.fun_fact,
        prompt_version: guideResult.promptVersion,
        is_active: true,
      },
    });
    guideContentId = createdGuide.id;
  }

  // Step 6: Generate or retrieve TTS audio
  let audioResult: SnapResult["audio"] = null;
  if (guideContentId && guideData?.narration_script) {
    try {
      const tts = await getOrGenerateTTS(
        provider,
        guideContentId,
        guideData.narration_script,
        input.requestId,
        input.locale
      );
      audioResult = {
        audioId: tts.audioId,
        url: `/audio/${tts.audioId}`,
        cached: tts.cached,
        voice: tts.voice,
      };
    } catch (err) {
      // TTS failure should not block the snap response
      log.error({
        event: "snap.tts.error",
        guideContentId,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  // Step 7: Fetch approved ads for this landmark
  const ads = dbLandmark
    ? await prisma.ad.findMany({
        where: {
          status: "approved",
          ad_landmarks: {
            some: { landmark_id: dbLandmark.id },
          },
        },
        select: {
          id: true,
          title: true,
          body: true,
          image_url: true,
          link_url: true,
        },
      })
    : [];

  return {
    landmark: identification.data,
    guide: guideData,
    cached,
    audio: audioResult,
    ads,
  };
}

