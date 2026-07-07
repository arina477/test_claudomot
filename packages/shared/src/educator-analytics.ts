import { z } from 'zod';

// ---------------------------------------------------------------------------
// RoleBreakdownItemSchema — a single entry in the per-role member breakdown.
//
// roleId      — opaque role identifier (matches the roles table PK).
// roleName    — display name for the role at the time the snapshot was taken.
// memberCount — number of server members currently assigned this role.
// ---------------------------------------------------------------------------

const RoleBreakdownItemSchema = z.object({
  roleId: z.string(),
  roleName: z.string(),
  memberCount: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// SubmissionRollupSchema — aggregate counts for assignment submissions
// across the server.
//
// assignmentCount — total number of assignments in scope.
// submissionCount — total number of submission records received.
// ---------------------------------------------------------------------------

const SubmissionRollupSchema = z.object({
  assignmentCount: z.number().int().nonnegative(),
  submissionCount: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// RecentActivityBucketSchema — a single activity-type count bucket.
//
// type  — opaque activity type label (e.g. "message_sent", "assignment_submitted").
// count — number of events of this type within the recent-activity window.
//         Contains aggregate counts only — no raw content, no PII.
// ---------------------------------------------------------------------------

const RecentActivityBucketSchema = z.object({
  type: z.string(),
  count: z.number().int().nonnegative(),
});

// ---------------------------------------------------------------------------
// ServerAnalyticsSchema — read-only server analytics aggregate response.
//
// Returned by GET /educator/servers/:serverId/analytics. All fields are
// server-scoped COUNTS and ROLLUPS. No raw message content, no per-user
// identifiers, no PII is included.
//
// memberCount       — total number of members in the server.
// roleBreakdown     — per-role member counts; see RoleBreakdownItemSchema.
// messageVolume     — total messages sent in the server (all time, or window
//                     as defined by the backend — contract carries the count).
// assignmentCount   — total number of assignments created in the server.
// submissionRollup  — aggregate assignment/submission counts; see
//                     SubmissionRollupSchema.
// recentActivity    — activity aggregate buckets ordered by recency window;
//                     see RecentActivityBucketSchema.
// ---------------------------------------------------------------------------

export const ServerAnalyticsSchema = z.object({
  memberCount: z.number().int().nonnegative(),
  roleBreakdown: z.array(RoleBreakdownItemSchema),
  messageVolume: z.number().int().nonnegative(),
  assignmentCount: z.number().int().nonnegative(),
  submissionRollup: SubmissionRollupSchema,
  recentActivity: z.array(RecentActivityBucketSchema),
});
export type ServerAnalytics = z.infer<typeof ServerAnalyticsSchema>;

// ---------------------------------------------------------------------------
// EducatorToolsStatusSchema — response shape for GET /educator/servers/:id/status.
//
// serverId — the server whose educator-tools gate this describes.
// enabled  — whether educator admin tools are currently active for this server.
//            Mirrors the wave-75 /status endpoint response.
// ---------------------------------------------------------------------------

export const EducatorToolsStatusSchema = z.object({
  serverId: z.string(),
  enabled: z.boolean(),
});
export type EducatorToolsStatus = z.infer<typeof EducatorToolsStatusSchema>;
