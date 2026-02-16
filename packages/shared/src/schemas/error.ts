import { z } from "zod";

export const ErrorResponseSchema = z.object({
  schema: z.literal("error.v1"),
  error_type: z.enum([
    "identification_failed",
    "generation_failed",
    "safety_violation",
    "unknown",
  ]),
  message: z.string(),
  recoverable: z.boolean(),
  suggested_action: z.string().nullable(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

