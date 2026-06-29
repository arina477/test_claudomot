import { z } from 'zod';

export const InvitePreviewSchema = z.object({
  server: z.object({
    id: z.string(),
    name: z.string(),
    memberCount: z.number().int().nonnegative(),
  }),
});
export type InvitePreview = z.infer<typeof InvitePreviewSchema>;

export const CreateInviteSchema = z.object({
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});
export type CreateInviteInput = z.infer<typeof CreateInviteSchema>;

export const InviteResponseSchema = z.object({
  code: z.string(),
  url: z.string().optional(),
});
export type InviteResponse = z.infer<typeof InviteResponseSchema>;

export const JoinResultSchema = z.object({
  serverId: z.string(),
});
export type JoinResult = z.infer<typeof JoinResultSchema>;
