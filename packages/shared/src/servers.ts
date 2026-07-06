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
  /**
   * ISO-8601 timestamp until which the member is timed out (muted), or null.
   * Public — all viewers receive this field so the muted indicator renders for
   * every member regardless of the viewer's permissions.
   * wave-41 M8.
   */
  mutedUntil: z.string().nullable(),
});
export type ServerMember = z.infer<typeof ServerMemberSchema>;

// ---------------------------------------------------------------------------
// Server discovery (wave-67)
// DiscoverServer — one entry in the public discover listing.
// ---------------------------------------------------------------------------

export const DiscoverServersQuerySchema = z.object({
  q: z.string().optional(),
  limit: z.coerce.number().int().positive().max(50).default(20),
  offset: z.coerce.number().int().nonnegative().default(0),
});
export type DiscoverServersQuery = z.infer<typeof DiscoverServersQuerySchema>;

export const DiscoverServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  topic: z.string().nullable(),
  memberCount: z.number().int().nonnegative(),
});
export type DiscoverServer = z.infer<typeof DiscoverServerSchema>;

export const DiscoverServersResponseSchema = z.object({
  servers: z.array(DiscoverServerSchema),
});
export type DiscoverServersResponse = z.infer<typeof DiscoverServersResponseSchema>;

// ---------------------------------------------------------------------------
// UpdateServer — PATCH /servers/:id (wave-68)
// Partial update: only the supplied fields are written to the row.
// description and topic accept null to clear the field.
// ---------------------------------------------------------------------------

export const UpdateServerSchema = z.object({
  is_public: z.boolean().optional(),
  description: z.string().max(500).nullable().optional(),
  topic: z.string().max(100).nullable().optional(),
});
export type UpdateServer = z.infer<typeof UpdateServerSchema>;
