import { z } from "zod";

export const SocialShareContentSchema = z.object({
  schema: z.literal("social_share_content.v1"),
  landmark_name: z.string(),
  share_text: z.string(),
  hashtags: z.array(z.string()),
  locale: z.string(),
});

export type SocialShareContent = z.infer<typeof SocialShareContentSchema>;

