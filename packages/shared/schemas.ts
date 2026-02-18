import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),                          // Clerk user ID
  username: z.string().nullable(),
  email: z.string().email().optional(),    // from Clerk, not stored in DB
  name: z.string().optional(),             // from Clerk, not stored in DB
  imageUrl: z.string().url().optional(),   // from Clerk, not stored in DB
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
