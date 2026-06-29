import { z } from 'zod';

export const ProfileResponseSchema = z.object({
  displayName: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
