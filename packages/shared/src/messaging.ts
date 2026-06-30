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
//   Extended for wave-18 (task 497c2ae6):
//   - threadParentId — non-null on reply rows; null/absent on top-level messages
//   - replyCount — denormalized count of live replies (top-level messages only)
//   - lastReplyAt — ISO timestamp of the most-recent live reply (top-level only)
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
  // wave-18 thread reply fields
  threadParentId: z.string().nullable().optional(),
  replyCount: z.number().int().nonnegative().optional(),
  lastReplyAt: z.string().nullable().optional(),
});
export type MessageResponse = z.infer<typeof MessageResponseSchema>;

// ---------------------------------------------------------------------------
// ThreadRepliesResponse — paginated list of replies for a thread parent
// wave-18 task 497c2ae6
//
// Mirrors the MessageList shape but scoped to a single thread (no top-level
// channel stream). Items are ordered oldest-first (ASC created_at) so clients
// can render the reply chain chronologically.
// ---------------------------------------------------------------------------

export const ThreadRepliesResponseSchema = z.object({
  items: z.array(MessageResponseSchema),
  nextCursor: z.string().nullable().optional(),
});
export type ThreadRepliesResponse = z.infer<typeof ThreadRepliesResponseSchema>;

// ---------------------------------------------------------------------------
// ThreadReplyEvent — Socket.IO 'message.reply.created' event payload
// wave-18 task 497c2ae6
//
// Emitted to the channel room 'channel:<channelId>' over the /messaging
// namespace when a reply is created. DISTINCT from 'message:new' (top-level
// message.created) — clients must NOT add this reply to the top-level channel
// stream; only the thread panel for parentId should be updated.
//
// Shape rationale:
//   - parentId: identifies which thread parent to update (reply_count + last_reply_at
//     affordance + open panel append).
//   - channelId: lets the client scope the event to the correct channel room.
//   - reply: the full MessageResponse DTO so the client can render immediately
//     without a follow-up fetch.
// ---------------------------------------------------------------------------

export const ThreadReplyEventSchema = z.object({
  parentId: z.string(),
  channelId: z.string(),
  reply: MessageResponseSchema,
});
export type ThreadReplyEvent = z.infer<typeof ThreadReplyEventSchema>;

/** Socket.IO event name for a new thread reply — distinct from 'message:new'. */
export const THREAD_REPLY_CREATED_EVENT = 'thread:reply:created' as const;

// ---------------------------------------------------------------------------
// ThreadReplyDeletedEvent — Socket.IO 'thread:reply:deleted' event payload
// wave-18 B-6 fix
//
// Emitted to 'channel:<channelId>' when a reply is soft-deleted. Clients use
// this to:
//   (a) remove the reply from an open thread panel (replyId match), AND
//   (b) update the thread affordance on the parent message (replyCount + lastReplyAt).
//
// Both signals ride in one event so the client can update both surfaces
// atomically from the server's post-decrement values (no race with stale GET).
//
// Shape rationale:
//   - parentId: identifies the thread parent whose affordance must be updated.
//   - channelId: lets the client scope the event to the correct channel room.
//   - replyId: the soft-deleted reply's id — used to remove it from the open panel.
//   - replyCount: the parent's NEW reply_count (post-decrement, already committed).
//   - lastReplyAt: the parent's NEW last_reply_at (null when no live replies remain).
// ---------------------------------------------------------------------------

export const ThreadReplyDeletedEventSchema = z.object({
  parentId: z.string(),
  channelId: z.string(),
  replyId: z.string(),
  replyCount: z.number().int().nonnegative(),
  lastReplyAt: z.string().nullable(),
});
export type ThreadReplyDeletedEvent = z.infer<typeof ThreadReplyDeletedEventSchema>;

/** Socket.IO event name for a deleted thread reply. */
export const THREAD_REPLY_DELETED_EVENT = 'thread:reply:deleted' as const;

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
