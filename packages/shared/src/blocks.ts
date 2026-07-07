import { z } from 'zod';

// ---------------------------------------------------------------------------
// CreateBlockSchema — POST /blocks request body
// ---------------------------------------------------------------------------

export const CreateBlockSchema = z.object({
  blockedUserId: z.string().min(1),
});
export type CreateBlock = z.infer<typeof CreateBlockSchema>;

// ---------------------------------------------------------------------------
// BlockSchema — full Block entity returned by the API
//
// Mirrors the DB row column-for-column (snake_case, matching the user_blocks
// table in apps/api/src/db/schema/user-blocks.ts).
// This follows the same convention as ReportSchema in reports.ts, which uses
// snake_case field names so the API can return the Drizzle row with zero
// mapping overhead.
// Timestamps are serialized as ISO-8601 strings (z.string()) consistent with
// ReportSchema and every other entity DTO in this package.
// ---------------------------------------------------------------------------

export const BlockSchema = z.object({
  id: z.string().uuid(),
  blocker_id: z.string(),
  blocked_id: z.string(),
  created_at: z.string(),
});
export type Block = z.infer<typeof BlockSchema>;

// ---------------------------------------------------------------------------
// BlockedUserDisplaySchema — display fields for the blocked user, enriched by
// GET /blocks.
//
// Mirrors ServerMemberSchema (servers.ts) field names and nullability:
//   userId       — string (non-nullable; echoes blocked_id for convenience)
//   displayName  — string (non-nullable; server fills display_name ?? username ?? "Unknown")
//   username     — string | null  (may be NULL in DB)
//   avatarUrl    — string | null  (user may have no avatar)
//
// avatarUrl follows the ServerMemberSchema / DmCandidateSchema name (NOT
// DmParticipantSchema which uses `avatar`). Aligns with the existing convention
// so the web layer can render blocked users with the same member-display
// component used for server members and DM candidates.
// ---------------------------------------------------------------------------

export const BlockedUserDisplaySchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  username: z.string().nullable(),
  avatarUrl: z.string().nullable(),
});
export type BlockedUserDisplay = z.infer<typeof BlockedUserDisplaySchema>;

// ---------------------------------------------------------------------------
// BlockListItemSchema — enriched block record returned by GET /blocks.
//
// Extends BlockSchema (POST /blocks returns the bare BlockSchema; GET /blocks
// returns the enriched BlockListItemSchema). Using a distinct schema keeps
// BlockSchema as the bare DB-row DTO so the POST return type is unaffected.
// ---------------------------------------------------------------------------

export const BlockListItemSchema = BlockSchema.extend({
  blockedUser: BlockedUserDisplaySchema,
});
export type BlockListItem = z.infer<typeof BlockListItemSchema>;

// ---------------------------------------------------------------------------
// BlockListResponseSchema — GET /blocks response envelope
// ---------------------------------------------------------------------------

export const BlockListResponseSchema = z.object({
  blocks: z.array(BlockListItemSchema),
});
export type BlockListResponse = z.infer<typeof BlockListResponseSchema>;
