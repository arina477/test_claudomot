import { z } from 'zod';

export const CreateServerSchema = z.object({
  name: z.string().trim().min(1).max(100),
});
export type CreateServerInput = z.infer<typeof CreateServerSchema>;

export const ServerResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
  createdAt: z.string(),
});
export type ServerResponse = z.infer<typeof ServerResponseSchema>;

export const ServerSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  ownerId: z.string(),
});
export type ServerSummary = z.infer<typeof ServerSummarySchema>;

export const ServerSummaryWithInviteSchema = ServerSummarySchema.extend({
  inviteCode: z.string().nullable(),
});
export type ServerSummaryWithInvite = z.infer<typeof ServerSummaryWithInviteSchema>;

export const ChannelSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  isPrivate: z.boolean(),
  position: z.number(),
});
export type ChannelSummary = z.infer<typeof ChannelSummarySchema>;

export const CategoryWithChannelsSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: z.number(),
  channels: z.array(ChannelSummarySchema),
});
export type CategoryWithChannels = z.infer<typeof CategoryWithChannelsSchema>;

export const ServerDetailSchema = z.object({
  server: ServerSummaryWithInviteSchema,
  categories: z.array(CategoryWithChannelsSchema),
});
export type ServerDetail = z.infer<typeof ServerDetailSchema>;

// ---------------------------------------------------------------------------
// ServerMember — public member record for the member-list panel (wave-14)
// username added in wave-15 B-4: required by MentionAutocomplete so that
// autocomplete-inserted @tokens match the users.username column in the
// resolveMentions resolver. Nullable because username IS NULL is valid in DB.
// ---------------------------------------------------------------------------

export const ServerMemberSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  username: z.string().nullable(),
});
export type ServerMember = z.infer<typeof ServerMemberSchema>;

export const ServerMembersResponseSchema = z.object({
  members: z.array(ServerMemberSchema),
});
export type ServerMembersResponse = z.infer<typeof ServerMembersResponseSchema>;
