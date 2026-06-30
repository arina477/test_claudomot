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
// MessageResponse — single message DTO (wave-12 task a0c322b4)
//   Extended for wave-13 (task e12886d7 + d78df376):
//   - isEdited / editedAt — populated after PATCH
//   - isDeleted — true when soft-deleted; content becomes null (tombstone)
//   - reactions — aggregated [{emoji, count, reactedByMe}]
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
