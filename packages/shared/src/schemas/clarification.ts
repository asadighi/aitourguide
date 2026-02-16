import { z } from "zod";

export const ClarificationRequiredSchema = z.object({
  schema: z.literal("clarification_required.v1"),
  reason: z.string(),
  options: z.array(
    z.object({
      label: z.string(),
      description: z.string(),
    })
  ),
  original_input_summary: z.string(),
});

export type ClarificationRequired = z.infer<
  typeof ClarificationRequiredSchema
>;

