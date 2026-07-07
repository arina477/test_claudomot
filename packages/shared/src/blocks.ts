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
// BlockListResponseSchema — GET /blocks response envelope
// ---------------------------------------------------------------------------

export const BlockListResponseSchema = z.object({
  blocks: z.array(BlockSchema),
});
export type BlockListResponse = z.infer<typeof BlockListResponseSchema>;
