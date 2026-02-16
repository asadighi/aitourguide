import { z } from "zod";

export const AdStatusSchema = z.enum(["pending", "approved", "rejected"]);

export type AdStatus = z.infer<typeof AdStatusSchema>;

export const AdSchema = z.object({
  id: z.string().uuid(),
  provider_id: z.string().uuid(),
  title: z.string().min(1),
  body: z.string().min(1),
  image_url: z.string().url().nullable(),
  link_url: z.string().url(),
  status: AdStatusSchema,
  admin_feedback: z.string().nullable(),
  landmark_ids: z.array(z.string().uuid()),
});

export type Ad = z.infer<typeof AdSchema>;

export const AdCreateSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  image_url: z.string().url().nullable().optional(),
  link_url: z.string().url(),
  landmark_ids: z.array(z.string().uuid()).min(1),
});

export type AdCreate = z.infer<typeof AdCreateSchema>;

