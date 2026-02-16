import { z } from "zod";

export const UserRoleSchema = z.enum(["end_user", "ad_provider", "admin"]);

export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string(),
  role: UserRoleSchema,
  locale: z.string().default("en"),
});

export type User = z.infer<typeof UserSchema>;

