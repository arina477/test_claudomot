import { z } from 'zod';

// ---------------------------------------------------------------------------
// MessageResponse — single message DTO (wave-12 task a0c322b4)
// ---------------------------------------------------------------------------

export const MessageResponseSchema = z.object({
  id: z.string(),
  channelId: z.string(),
  authorId: z.string(),
  content: z.string(),
  createdAt: z.string(),
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
// MessageList — paginated list response
// ---------------------------------------------------------------------------

export const MessageListSchema = z.object({
  messages: z.array(MessageResponseSchema),
  nextCursor: z.string().nullable(),
});
export type MessageList = z.infer<typeof MessageListSchema>;
