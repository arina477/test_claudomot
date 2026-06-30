import { z } from 'zod';

// ---------------------------------------------------------------------------
// ReactionSummary — aggregated reaction count for a single emoji
// Included in MessageResponse.reactions — wave-13 task d78df376
// ---------------------------------------------------------------------------

export const ReactionSummarySchema = z.object({
  emoji: z.string(),
  count: z.number().int().nonnegative(),
  reactedByMe: z.boolean(),
});
export type ReactionSummary = z.infer<typeof ReactionSummarySchema>;

// ---------------------------------------------------------------------------
// MentionRef — a single @mention reference embedded in a message
// Included in MessageResponse.mentions — wave-15 task 3d238446
// ---------------------------------------------------------------------------

export const MentionRefSchema = z.object({
  userId: z.string(),
  username: z.string(),
});
export type MentionRef = z.infer<typeof MentionRefSchema>;

// ---------------------------------------------------------------------------
// MessageResponse — single message DTO (wave-12 task a0c322b4)
//   Extended for wave-13 (task e12886d7 + d78df376):
//   - isEdited / editedAt — populated after PATCH
//   - isDeleted — true when soft-deleted; content becomes null (tombstone)
//   - reactions — aggregated [{emoji, count, reactedByMe}]
//   Extended for wave-15 (task 3d238446):
//   - mentions — [{userId, username}] users @mentioned in this message
// ---------------------------------------------------------------------------

export const MessageResponseSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  authorId: z.string(),
  content: z.string().nullable(),
  createdAt: z.string(),
  // wave-13 edit/delete fields
  isEdited: z.boolean(),
  editedAt: z.string().nullable(),
  isDeleted: z.boolean(),
  // wave-13 reactions
  reactions: z.array(ReactionSummarySchema),
  // wave-15 mentions
  mentions: z.array(MentionRefSchema),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

// ---------------------------------------------------------------------------
// SendMessage — request body for POST /channels/:channelId/messages
// content: 1-4000 chars (trimmed), idempotencyKey: optional client-generated key
// ---------------------------------------------------------------------------

export const SendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content must not be empty')
    .max(4000, 'Message content must not exceed 4000 characters'),
  idempotencyKey: z.string().optional(),
});
export type SendMessageInput = z.infer<typeof SendMessageSchema>;

// ---------------------------------------------------------------------------
// EditMessage — request body for PATCH /channels/:channelId/messages/:messageId
// wave-13 task e12886d7
// ---------------------------------------------------------------------------

export const EditMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, 'Message content must not be empty')
    .max(4000, 'Message content must not exceed 4000 characters'),
});
export type EditMessageInput = z.infer<typeof EditMessageSchema>;

// ---------------------------------------------------------------------------
// ReactionToggle — request body for POST /channels/:channelId/messages/:messageId/reactions
// wave-13 task d78df376
// ---------------------------------------------------------------------------

export const ReactionToggleSchema = z.object({
  emoji: z
    .string()
    .trim()
    .min(1, 'Emoji must not be empty')
    .max(64, 'Emoji must not exceed 64 characters'),
});
export type ReactionToggleInput = z.infer<typeof ReactionToggleSchema>;

// ---------------------------------------------------------------------------
// ReactionToggleResponse — returned by POST reactions toggle
// ---------------------------------------------------------------------------

export const ReactionToggleResponseSchema = z.object({
  reacted: z.boolean(),
});
export type ReactionToggleResponse = z.infer<typeof ReactionToggleResponseSchema>;

// ---------------------------------------------------------------------------
// MessageList — paginated list response
// ---------------------------------------------------------------------------

export const MessageListSchema = z.object({
  messages: z.array(MessageResponseSchema),
  nextCursor: z.string().nullable(),
});
export type MessageList = z.infer<typeof MessageListSchema>;

// ---------------------------------------------------------------------------
// MyMentionsResponse — paginated response for GET /me/mentions
// wave-15 task 3d238446
// ---------------------------------------------------------------------------

export const MyMentionsResponseSchema = z.object({
  items: z.array(MessageResponseSchema),
  nextCursor: z.string().nullish(),
});
export type MyMentionsResponse = z.infer<typeof MyMentionsResponseSchema>;

// ---------------------------------------------------------------------------
// MentionEvent — Socket.IO 'mention' event pushed to each mentioned user's
// per-user room ('user:<userId>') by the /messaging gateway.
//
// wave-15 task c3f3f62a — cross-channel unread-mention realtime signal.
//
// Shape rationale:
//   - messageId: lets the client deduplicate if the same event fires twice.
//   - channelId: required so the client can attribute the badge to the correct
//     channel; it is the minimum viable field for the unread-mention counter.
//   - channelName: optional display label (populated when cheap to include).
//   - serverId: optional; allows the client to scope the badge per-server.
//   - mentionedUserId: the recipient's own userId — lets a shared handler
//     verify the event is addressed to the current user (defensive).
//
// The server emits one MentionEvent per mentioned user (not a broadcast with
// all mentionedUserIds in a single payload) so each user's 'user:<id>' room
// receives only their own event.  The author is NEVER emitted a mention event
// for their own message (excluded server-side).
// ---------------------------------------------------------------------------

export const MentionEventSchema = z.object({
  messageId: z.string(),
  channelId: z.string(),
  channelName: z.string().optional(),
  serverId: z.string().optional(),
  mentionedUserId: z.string(),
});
export type MentionEvent = z.infer<typeof MentionEventSchema>;
