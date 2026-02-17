import { z } from "zod";

// Placeholder schema — replace with real ones as you build features
export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export type User = z.infer<typeof userSchema>;
