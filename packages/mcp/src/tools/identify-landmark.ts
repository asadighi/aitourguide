import { PromptRegistry } from "../registry.js";
import { renderPromptFromRegistry } from "../renderer.js";
import { validateOutput } from "../validator.js";
import type { LLMProvider } from "../adapters/types.js";
import type { LandmarkIdentification } from "@aitourguide/shared";

export interface IdentifyLandmarkInput {
  imageBase64: string;
  gps?: { lat: number; lng: number };
}

export interface IdentifyLandmarkResult {
  data: LandmarkIdentification;
  model: string;
  latencyMs: number;
  promptVersion: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * MCP tool: identify landmarks from a photo.
 * Uses the landmark_identify prompt with vision model.
 */
export async function identifyLandmark(
  provider: LLMProvider,
  registry: PromptRegistry,
  input: IdentifyLandmarkInput
): Promise<IdentifyLandmarkResult> {
  // Build GPS context
  const gpsContext = input.gps
    ? `GPS coordinates of the user: lat=${input.gps.lat}, lng=${input.gps.lng}. Use this to improve identification accuracy.`
    : "No GPS data available.";

  // Render prompt with variables and fragments
  const rendered = renderPromptFromRegistry(registry, "landmark_identify", {
    gps_context: gpsContext,
  });

  if (!rendered) {
    throw new Error("Prompt 'landmark_identify' not found in registry");
  }

  // Extract system prompt and user prompt from the rendered markdown
  const { systemPrompt, userPrompt } = extractPromptSections(
    rendered.rendered
  );

  // Call vision model
  const response = await provider.vision({
    systemPrompt,
    userPrompt,
    imageBase64: input.imageBase64,
    temperature: 0.3,
    maxTokens: 1000,
  });

  // Parse JSON from response
  let parsed: unknown;
  try {
    parsed = JSON.parse(response.content);
  } catch {
    throw new Error(
      `Failed to parse LLM response as JSON: ${response.content.slice(0, 200)}`
    );
  }

  // Validate against schema
  const validation = validateOutput("landmark_identification.v1", parsed);
  if (!validation.ok) {
    throw new Error(
      `LLM output failed schema validation: ${validation.error}`
    );
  }

  return {
    data: validation.data as LandmarkIdentification,
    model: response.model,
    latencyMs: response.latencyMs,
    promptVersion: rendered.version,
    usage: response.usage,
  };
}

/**
 * Extract System Prompt and User Prompt (Prompt Content) sections from rendered markdown.
 */
function extractPromptSections(markdown: string): {
  systemPrompt: string;
  userPrompt: string;
} {
  const sysMatch = markdown.match(
    /## System Prompt\s*\n([\s\S]*?)(?=\n## Prompt Content)/
  );
  const promptMatch = markdown.match(/## Prompt Content\s*\n([\s\S]*)$/);

  return {
    systemPrompt: sysMatch?.[1]?.trim() || "",
    userPrompt: promptMatch?.[1]?.trim() || "",
  };
}

