import { PromptRegistry } from "../registry.js";
import { renderPromptFromRegistry } from "../renderer.js";
import { validateOutput } from "../validator.js";
import type { LLMProvider } from "../adapters/types.js";
import { getLocaleAccent, type GuideContent } from "@aitourguide/shared";

export interface GenerateGuideInput {
  landmarkName: string;
  locale: string;
  adminPrompt?: string;
}

export interface GenerateGuideResult {
  data: GuideContent;
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
 * MCP tool: generate guide content for a landmark.
 * Uses the guide_generate prompt with text completion.
 */
export async function generateGuide(
  provider: LLMProvider,
  registry: PromptRegistry,
  input: GenerateGuideInput
): Promise<GenerateGuideResult> {
  // Build admin prompt context
  const adminPromptContext = input.adminPrompt
    ? `Additional guidance from admin: ${input.adminPrompt}`
    : "";

  // Resolve locale-specific dialect hint for authentic accent
  const accentConfig = getLocaleAccent(input.locale);

  // Render prompt with variables and fragments
  const rendered = renderPromptFromRegistry(registry, "guide_generate", {
    landmark_name: input.landmarkName,
    locale: input.locale,
    dialect_hint: accentConfig.dialectHint,
    admin_prompt_context: adminPromptContext,
  });

  if (!rendered) {
    throw new Error("Prompt 'guide_generate' not found in registry");
  }

  // Extract system prompt and user prompt from the rendered markdown
  const { systemPrompt, userPrompt } = extractPromptSections(
    rendered.rendered
  );

  // Call text completion model
  const response = await provider.complete({
    systemPrompt,
    userPrompt,
    temperature: 0.7,
    maxTokens: 2000,
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
  const validation = validateOutput("guide_content.v1", parsed);
  if (!validation.ok) {
    throw new Error(
      `LLM output failed schema validation: ${validation.error}`
    );
  }

  return {
    data: validation.data as GuideContent,
    model: response.model,
    latencyMs: response.latencyMs,
    promptVersion: rendered.version,
    usage: response.usage,
  };
}

/**
 * Extract System Prompt and User Prompt sections from rendered markdown.
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

