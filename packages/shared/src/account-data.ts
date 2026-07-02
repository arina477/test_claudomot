import { z } from 'zod';

export const AccountDataResponseSchema = z.object({
  profile: z.object({
    userId: z.string(),
    displayName: z.string().nullable(),
    username: z.string().nullable(),
    avatarUrl: z.string().nullable(),
    accentColor: z.string().nullable(),
    email: z.string(),
  }),
  memberships: z.array(
    z.object({
      serverId: z.string(),
      serverName: z.string(),
      joinedAt: z.string(),
    }),
  ),
  activitySummary: z.object({
    serversJoined: z.number().int(),
    accountCreatedAt: z.string(),
  }),
});

export type AccountDataResponse = z.infer<typeof AccountDataResponseSchema>;
