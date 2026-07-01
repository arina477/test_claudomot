import { z } from 'zod';

export const ProfileResponseSchema = z.object({
  userId: z.string(),
  displayName: z.string().nullable(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  accentColor: z.string().nullable(),
});

export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;

export const UpdateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  username: z
    .string()
    .regex(
      /^[a-z0-9_]{3,20}$/,
      'Username must be 3-20 characters: lowercase letters, numbers, underscores only',
    )
    .optional(),
  accentColor: z.string().optional(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

export const AvatarPresignResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
});

export type AvatarPresignResponse = z.infer<typeof AvatarPresignResponseSchema>;
