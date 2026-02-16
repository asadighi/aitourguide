import { z } from "zod";
import {
  LandmarkIdentificationSchema,
  GuideContentSchema,
  ErrorResponseSchema,
  ClarificationRequiredSchema,
  ContentSafetyCheckSchema,
  SocialShareContentSchema,
} from "@aitourguide/shared";

const schemaMap: Record<string, z.ZodSchema> = {
  "landmark_identification.v1": LandmarkIdentificationSchema,
  "guide_content.v1": GuideContentSchema,
  "error.v1": ErrorResponseSchema,
  "clarification_required.v1": ClarificationRequiredSchema,
  "content_safety_check.v1": ContentSafetyCheckSchema,
  "social_share_content.v1": SocialShareContentSchema,
};

export interface ValidationResult {
  ok: boolean;
  error: string | null;
  data: unknown;
}

/**
 * Validate an LLM output against a named schema.
 */
export function validateOutput(
  schemaId: string,
  output: unknown
): ValidationResult {
  const schema = schemaMap[schemaId];

  if (!schema) {
    return {
      ok: false,
      error: `Unknown schema: ${schemaId}`,
      data: null,
    };
  }

  const result = schema.safeParse(output);

  if (result.success) {
    return { ok: true, error: null, data: result.data };
  }

  return {
    ok: false,
    error: result.error.message,
    data: null,
  };
}

