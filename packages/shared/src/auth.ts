import { z } from 'zod';

export const MeResponseSchema = z.object({
  userId: z.string(),
  email: z.string(),
  emailVerified: z.boolean(),
});

export type MeResponse = z.infer<typeof MeResponseSchema>;
