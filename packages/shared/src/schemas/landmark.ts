import { z } from "zod";

export const LandmarkCategorySchema = z.enum([
  "monument",
  "building",
  "natural",
  "religious",
  "historical",
  "cultural",
  "other",
]);

export type LandmarkCategory = z.infer<typeof LandmarkCategorySchema>;

export const LandmarkLocationSchema = z.object({
  city: z.string().nullable(),
  country: z.string().nullable(),
  coordinates: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
});

export const LandmarkIdentificationSchema = z.object({
  schema: z.literal("landmark_identification.v1"),
  landmarks: z.array(
    z.object({
      name: z.string(),
      confidence: z.number().min(0).max(1),
      location: LandmarkLocationSchema,
      category: LandmarkCategorySchema,
      brief_description: z.string(),
    })
  ),
  needs_clarification: z.boolean(),
  clarification_message: z.string().nullable(),
});

export type LandmarkIdentification = z.infer<
  typeof LandmarkIdentificationSchema
>;

export const SnapRequestSchema = z.object({
  image_base64: z.string(),
  gps: z
    .object({
      lat: z.number(),
      lng: z.number(),
    })
    .optional(),
  locale: z.string().default("en"),
});

export type SnapRequest = z.infer<typeof SnapRequestSchema>;

