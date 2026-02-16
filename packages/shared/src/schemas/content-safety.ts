import { z } from "zod";

export const ContentSafetyCheckSchema = z.object({
  schema: z.literal("content_safety_check.v1"),
  is_safe: z.boolean(),
  violations: z.array(
    z.object({
      type: z.enum([
        "political_bias",
        "cultural_insensitivity",
        "fabrication",
        "offensive",
        "other",
      ]),
      description: z.string(),
      severity: z.enum(["low", "medium", "high", "critical"]),
    })
  ),
  recommendation: z.enum(["approve", "flag_for_review", "reject"]),
});

export type ContentSafetyCheck = z.infer<typeof ContentSafetyCheckSchema>;

