import { z } from 'zod';

// ---------------------------------------------------------------------------
// DmParticipantSchema — identity of a single participant in a DM conversation
// wave-46 M8 task a48f1910
//
// avatar is nullable (user may have no avatar set).
// presence is optional — not always fetched; hydrated when the UI needs
// live status (e.g. conversation list header).
// ---------------------------------------------------------------------------

export const DmParticipantSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatar: z.string().nullable(),
  presence: z.enum(['online', 'offline']).optional(),
});
export type DmParticipant = z.infer<typeof DmParticipantSchema>;

// ---------------------------------------------------------------------------
// DmConversationSchema — conversation DTO surfaced to clients
// wave-46 M8 task a48f1910
//
// isGroup: false → exactly 2 participants (1:1); true → 3–10 participants.
// lastMessage: nullable — null for a freshly-created conversation with no
//   messages yet. Content, createdAt, and authorId are the minimal preview
//   fields (mirrors channel-message list preview pattern).
// unreadCount: optional — not always computed; hydrated when the UI tracks
//   per-conversation badge counts (deferred to a later M8 slice).
// ---------------------------------------------------------------------------

export const DmConversationSchema = z.object({
  id: z.string(),
  isGroup: z.boolean(),
  participants: z.array(DmParticipantSchema),
  lastMessage: z
    .object({
      content: z.string(),
      createdAt: z.string(), // ISO 8601
      authorId: z.string(),
    })
    .nullable(),
  createdAt: z.string(), // ISO 8601
  unreadCount: z.number().int().nonnegative().optional(),
});
export type DmConversation = z.infer<typeof DmConversationSchema>;

// ---------------------------------------------------------------------------
// DmMessageSchema — single DM message DTO
// wave-46 M8 task a48f1910
//
// Timestamps are ISO 8601 strings, matching the channel-message DTO convention
// (createdAt: z.string() — see MessageResponseSchema in messaging.ts).
//
// wave-79 E2E encryption envelope (server-blind):
//   content is NULLABLE — a plaintext message sets content (ciphertext null);
//     an encrypted message sets ciphertext (content null). The gateway passes
//     the envelope through without reading it; the client decrypts locally.
//   ciphertext      — base64 AES-GCM envelope (iv + ct + tag); null for plaintext.
//   senderKeyRef    — opaque ref to the sender public key the recipient needs to
//                     derive the shared secret; null for plaintext.
//   envelopeVersion — envelope-format version for forward-compatible decryption;
//                     null for plaintext.
// Backward-compatible: pre-encryption rows are { content set, ciphertext null }.
// The three envelope fields are .nullable() (always present, may be null) so the
// contract is explicit rather than sometimes-absent.
// ---------------------------------------------------------------------------

export const DmMessageSchema = z.object({
  id: z.string(),
  conversationId: z.string(),
  authorId: z.string(),
  content: z.string().nullable(),
  ciphertext: z.string().nullable().optional(),
  senderKeyRef: z.string().nullable().optional(),
  envelopeVersion: z.number().int().nullable().optional(),
  createdAt: z.string(), // ISO 8601
});
export type DmMessage = z.infer<typeof DmMessageSchema>;

// ---------------------------------------------------------------------------
// CreateConversationSchema — POST /dm/conversations request body
// wave-46 M8 task a48f1910
//
// participantIds: the OTHER participants the caller wants to start a DM with
// (creator is added server-side and MUST NOT be included in this array).
// min(1) → at least one other participant (1:1 minimum).
// max(9) → at most 9 others → up to 10 total including creator (server cap).
// isGroup: optional; when omitted the server derives it from participant count
//   (1 other → 1:1, 2+ → group).
// ---------------------------------------------------------------------------

export const CreateConversationSchema = z
  .object({
    participantIds: z
      .array(z.string().min(1))
      .min(1, 'At least one participant is required')
      .max(9, 'Total participants must not exceed 10 (including yourself)'),
    isGroup: z.boolean().optional(),
  })
  .refine((data) => new Set(data.participantIds).size === data.participantIds.length, {
    message: 'participantIds must not contain duplicates',
    path: ['participantIds'],
  });
export type CreateConversationInput = z.infer<typeof CreateConversationSchema>;

// ---------------------------------------------------------------------------
// SendDmMessageSchema — POST /dm/conversations/:id/messages request body
// wave-46 M8 task a48f1910; wave-79 E2E envelope (task 491cb85d)
//
// A DM send carries EITHER a plaintext body OR a server-blind encrypted
// envelope — the two are MUTUALLY EXCLUSIVE (enforced here at the write
// boundary so server-blindness cannot be violated by sending both):
//
//   plaintext path — content set (1–4000 trimmed), envelope fields absent.
//     Backward-compatible: pre-encryption clients / keyless-peer fallback.
//   envelope path  — ciphertext + senderKeyRef + envelopeVersion set,
//     content absent. The server persists the ciphertext and leaves the
//     plaintext content column NULL (it stores no readable plaintext).
//
// idempotencyKey: required (not optional unlike channel send) — the server
//   enforces UNIQUE(conversation_id, idempotency_key) for exactly-once delivery
//   and the offline outbox always supplies one. Applies to both paths.
// ---------------------------------------------------------------------------

export const SendDmMessageSchema = z
  .object({
    content: z
      .string()
      .trim()
      .min(1, 'Message content must not be empty')
      .max(4000, 'Message content must not exceed 4000 characters')
      .optional(),
    // wave-79 encrypted envelope (server-blind). base64 AES-GCM envelope,
    // bounded to keep an oversized ciphertext from being persisted.
    ciphertext: z
      .string()
      .min(1, 'ciphertext must not be empty')
      .max(20000, 'ciphertext must not exceed 20000 characters')
      .optional(),
    senderKeyRef: z.string().min(1).max(2000).optional(),
    envelopeVersion: z.number().int().positive().optional(),
    idempotencyKey: z.string().min(1, 'idempotencyKey must not be empty'),
  })
  .refine(
    (data) => {
      const hasContent = data.content !== undefined;
      const hasCiphertext = data.ciphertext !== undefined;
      // Exactly one payload path: plaintext XOR encrypted envelope.
      // Rejecting BOTH preserves server-blindness at the write boundary
      // (an encrypted send must never also carry readable plaintext).
      return hasContent !== hasCiphertext;
    },
    {
      message:
        'A DM must carry either plaintext content OR an encrypted envelope (ciphertext), never both and never neither',
      path: ['content'],
    },
  )
  .refine(
    (data) => {
      // Envelope integrity: if a ciphertext is present, the full envelope
      // (senderKeyRef + envelopeVersion) MUST accompany it. A partial
      // envelope is rejected rather than silently persisted.
      if (data.ciphertext === undefined) return true;
      return data.senderKeyRef !== undefined && data.envelopeVersion !== undefined;
    },
    {
      message:
        'An encrypted envelope requires ciphertext, senderKeyRef, and envelopeVersion together',
      path: ['ciphertext'],
    },
  );
export type SendDmMessageInput = z.infer<typeof SendDmMessageSchema>;

// ---------------------------------------------------------------------------
// DmConversationListResponseSchema — GET /dm/conversations
// wave-46 M8 task a48f1910
// ---------------------------------------------------------------------------

export const DmConversationListResponseSchema = z.object({
  conversations: z.array(DmConversationSchema),
});
export type DmConversationListResponse = z.infer<typeof DmConversationListResponseSchema>;

// ---------------------------------------------------------------------------
// DmMessageListResponseSchema — GET /dm/conversations/:id/messages
// wave-46 M8 task a48f1910
//
// Cursor-paginated; nextCursor is null when no further pages exist.
// Mirrors MessageListSchema (messaging.ts) — z.string().nullable() (not
// .nullable().optional()) so the field is always present in the response.
// Messages ordered oldest→newest within the page (ASC created_at).
// ---------------------------------------------------------------------------

export const DmMessageListResponseSchema = z.object({
  messages: z.array(DmMessageSchema),
  nextCursor: z.string().nullable(),
});
export type DmMessageListResponse = z.infer<typeof DmMessageListResponseSchema>;

// ---------------------------------------------------------------------------
// DmMessageEventSchema — Socket.IO `dm:message` event payload
// wave-46 M8 task 32f5d29e
//
// Emitted to participant sockets when a new DM message is created.
// conversationId allows the receiver to route the event to the correct
// open thread / conversation list entry without an additional fetch.
// ---------------------------------------------------------------------------

export const DmMessageEventSchema = z.object({
  conversationId: z.string(),
  message: DmMessageSchema,
});
export type DmMessageEvent = z.infer<typeof DmMessageEventSchema>;

/** Socket.IO event name for an inbound DM message. */
export const DM_MESSAGE_EVENT = 'dm:message' as const;

// ---------------------------------------------------------------------------
// DmCandidateSchema — a server member eligible to start a DM with
// wave-47 M8 DM entry-point
//
// Mirrors ServerMemberSchema (servers.ts) field names and nullability exactly:
//   userId        — string (non-nullable)
//   displayName   — string (non-nullable)
//   avatarUrl     — string | null  (user may have no avatar)
//
// NOTE: avatarUrl follows the ServerMemberSchema name (NOT DmParticipantSchema
// which uses `avatar`).  Candidates ARE server members returned from
// GET /dm/candidates, and the response is a BARE array — mirroring the
// GET /servers/:id/members convention (bare ServerMember[]) rather than the
// wrapped DmConversationListResponse / DmMessageListResponse convention.
// ---------------------------------------------------------------------------

export const DmCandidateSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});
export type DmCandidate = z.infer<typeof DmCandidateSchema>;
