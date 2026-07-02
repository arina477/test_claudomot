import { z } from 'zod';

export const PROFILE_VISIBILITY = ['everyone', 'server-members', 'nobody'] as const;
export const WHO_CAN_DM = ['everyone', 'server-members', 'nobody'] as const;

export type ProfileVisibility = (typeof PROFILE_VISIBILITY)[number];
export type WhoCanDm = (typeof WHO_CAN_DM)[number];

export const PrivacySettingsResponseSchema = z.object({
  profileVisibility: z.enum(PROFILE_VISIBILITY),
  whoCanDm: z.enum(WHO_CAN_DM),
});

export type PrivacySettingsResponse = z.infer<typeof PrivacySettingsResponseSchema>;

export const UpdatePrivacySchema = z.object({
  profileVisibility: z.enum(PROFILE_VISIBILITY),
  whoCanDm: z.enum(WHO_CAN_DM),
});

export type UpdatePrivacyInput = z.infer<typeof UpdatePrivacySchema>;
