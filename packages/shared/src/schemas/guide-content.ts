import { z } from "zod";

export const GuideContentSchema = z.object({
  schema: z.literal("guide_content.v1"),
  landmark_name: z.string(),
  locale: z.string(),
  title: z.string(),
  summary: z.string(),
  facts: z.array(
    z.object({
      heading: z.string(),
      body: z.string(),
    })
  ),
  narration_script: z.string(),
  fun_fact: z.string().nullable(),
  confidence_note: z.string().nullable(),
});

export type GuideContent = z.infer<typeof GuideContentSchema>;

