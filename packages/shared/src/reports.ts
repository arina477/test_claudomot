import { z } from 'zod';

// ---------------------------------------------------------------------------
// ReportTargetType — the three reportable entity kinds
// ---------------------------------------------------------------------------

export const ReportTargetType = z.enum(['server', 'member', 'message']);
export type ReportTargetType = z.infer<typeof ReportTargetType>;

// ---------------------------------------------------------------------------
// ReportStatus — lifecycle states for a filed report
// ---------------------------------------------------------------------------

export const ReportStatus = z.enum(['open', 'resolved', 'dismissed']);
export type ReportStatus = z.infer<typeof ReportStatus>;

// ---------------------------------------------------------------------------
// ResolveReportAction — moderator actions taken when resolving a report
// ---------------------------------------------------------------------------

export const ResolveReportAction = z.enum(['timeout', 'delete_message', 'dismiss']);
export type ResolveReportAction = z.infer<typeof ResolveReportAction>;

// ---------------------------------------------------------------------------
// CreateReportSchema — POST /reports request body
//
// Cross-field invariants (enforced via .superRefine):
//   target_type='server'  → target_server_id must be present
//   target_type='member'  → target_user_id must be present
//   target_type='message' → target_message_id must be present
//
// target_server_id is optional in the input schema because for 'member' and
// 'message' targets the server context can be resolved server-side from the
// target entity. The DB column is NOT NULL — the server always persists it.
// ---------------------------------------------------------------------------

export const CreateReportSchema = z
  .object({
    target_type: ReportTargetType,
    target_server_id: z.string().uuid().optional(),
    target_user_id: z.string().optional(),
    target_message_id: z.string().uuid().optional(),
    reason: z.string().trim().min(1).max(1000),
  })
  .superRefine((data, ctx) => {
    if (data.target_type === 'server' && !data.target_server_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_server_id'],
        message: 'target_server_id is required when target_type is "server"',
      });
    }
    if (data.target_type === 'member' && !data.target_user_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_user_id'],
        message: 'target_user_id is required when target_type is "member"',
      });
    }
    if (data.target_type === 'message' && !data.target_message_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['target_message_id'],
        message: 'target_message_id is required when target_type is "message"',
      });
    }
  });
export type CreateReport = z.infer<typeof CreateReportSchema>;

// ---------------------------------------------------------------------------
// ReportSchema — full Report entity returned by the API
//
// Mirrors the DB row column-for-column (snake_case, matching the reports table
// in apps/api/src/db/schema/reports.ts).
// Timestamps are serialized as ISO-8601 strings (z.string()) consistent with
// every other entity DTO in this package (MessageResponseSchema, RoleSchema,
// etc. all use z.string() for timestamp columns).
// Nullable DB columns use .nullable() per sibling DTO convention.
// ---------------------------------------------------------------------------

export const ReportSchema = z.object({
  id: z.string().uuid(),
  reporter_id: z.string(),
  target_type: ReportTargetType,
  target_server_id: z.string().uuid(),
  target_user_id: z.string().nullable(),
  target_message_id: z.string().uuid().nullable(),
  reason: z.string(),
  status: ReportStatus,
  created_at: z.string(),
  resolved_at: z.string().nullable(),
  resolved_by: z.string().nullable(),
});
export type Report = z.infer<typeof ReportSchema>;

// ---------------------------------------------------------------------------
// ResolveReportSchema — POST /servers/:serverId/reports/:reportId/resolve body
// ---------------------------------------------------------------------------

export const ResolveReportSchema = z.object({
  action: ResolveReportAction,
});
export type ResolveReport = z.infer<typeof ResolveReportSchema>;
