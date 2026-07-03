import { z } from 'zod';
import { AttachmentRefSchema } from './messaging.js';

// ---------------------------------------------------------------------------
// AssignmentSubmission — student submission DTO as surfaced to clients
// wave-42 — no grade/score field (grading excluded from milestone scope)
//
// Defined before AssignmentSchema so AssignmentSchema can reference it
// directly (mySubmission field) without z.lazy().
// ---------------------------------------------------------------------------

export const AssignmentSubmissionSchema = z.object({
  userId: z.string(),
  assignmentId: z.string(),
  text: z.string().nullable(),
  attachment: AttachmentRefSchema.nullable(),
  submittedAt: z.string(), // ISO 8601 — submitted_at timestamptz
  returnedAt: z.string().nullable(), // ISO 8601 — null until organizer returns
  organizerComment: z.string().nullable(), // null until organizer returns with comment
});
export type AssignmentSubmission = z.infer<typeof AssignmentSubmissionSchema>;

// ---------------------------------------------------------------------------
// Assignment — wave-22 M5 (task 01fcefb8)
//
// myStatus is per-authenticated-user state (LEFT JOIN assignment_status, default 'todo').
// attachment is optional (0-1 per assignment this wave).
// dueDate is an ISO 8601 string (timestamptz serialized to ISO on the wire).
// mySubmission added wave-42 — authenticated member's own submission (null when not yet submitted).
// ---------------------------------------------------------------------------

export const AssignmentSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  organizerId: z.string(),
  title: z.string(),
  description: z.string().nullable().optional(),
  dueDate: z.string(), // ISO 8601 — due_date timestamptz NOT NULL
  attachment: AttachmentRefSchema.nullable().optional(),
  myStatus: z.enum(['todo', 'done']),
  createdAt: z.string(),
  mySubmission: AssignmentSubmissionSchema.nullable().optional(),
});
export type Assignment = z.infer<typeof AssignmentSchema>;

// ---------------------------------------------------------------------------
// CreateAssignmentInput — POST /servers/:serverId/assignments
// ---------------------------------------------------------------------------

export const CreateAssignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  dueDate: z.string().datetime({ message: 'dueDate must be an ISO 8601 datetime string' }),
  attachment: z
    .object({
      key: z.string(),
      filename: z.string(),
      contentType: z.string(),
    })
    .optional(),
});
export type CreateAssignmentInput = z.infer<typeof CreateAssignmentSchema>;

// ---------------------------------------------------------------------------
// UpdateAssignmentInput — PATCH /assignments/:id
// All fields optional (partial update).
// ---------------------------------------------------------------------------

export const UpdateAssignmentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  dueDate: z
    .string()
    .datetime({ message: 'dueDate must be an ISO 8601 datetime string' })
    .optional(),
  attachment: z
    .object({
      key: z.string(),
      filename: z.string(),
      contentType: z.string(),
    })
    .nullable()
    .optional(),
});
export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentSchema>;

// ---------------------------------------------------------------------------
// AssignmentStatusInput — PUT /assignments/:id/status
// member toggle: 'todo' | 'done'
// ---------------------------------------------------------------------------

export const AssignmentStatusSchema = z.object({
  state: z.enum(['todo', 'done']),
});
export type AssignmentStatusInput = z.infer<typeof AssignmentStatusSchema>;

// ---------------------------------------------------------------------------
// AssignmentListResponse — GET /servers/:serverId/assignments
// Ordered due_date ASC.
// ---------------------------------------------------------------------------

export const AssignmentListResponseSchema = z.object({
  assignments: z.array(AssignmentSchema),
});
export type AssignmentListResponse = z.infer<typeof AssignmentListResponseSchema>;

// ---------------------------------------------------------------------------
// AssignmentPresignResponse — POST /servers/:serverId/assignments/attachments/presign
// Mirrors AttachmentPresignResponse.
// ---------------------------------------------------------------------------

export const AssignmentPresignResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
});
export type AssignmentPresignResponse = z.infer<typeof AssignmentPresignResponseSchema>;

// ---------------------------------------------------------------------------
// SubmitAssignmentInput — POST /assignments/:id/submissions
// At least one of text or attachment must be present.
// ---------------------------------------------------------------------------

export const SubmitAssignmentSchema = z
  .object({
    text: z.string().max(5000).nullable().optional(),
    attachment: z
      .object({
        key: z.string(),
        filename: z.string(),
        contentType: z.string(),
      })
      .nullable()
      .optional(),
  })
  .refine((data) => (data.text != null && data.text.length > 0) || data.attachment != null, {
    message: 'A submission must include text or an attachment.',
  });
export type SubmitAssignmentInput = z.infer<typeof SubmitAssignmentSchema>;

// ---------------------------------------------------------------------------
// AssignmentSubmissionPresignResponse — POST /assignments/:id/submissions/attachments/presign
// Mirrors AssignmentPresignResponseSchema.
// ---------------------------------------------------------------------------

export const AssignmentSubmissionPresignResponseSchema = z.object({
  uploadUrl: z.string(),
  key: z.string(),
});
export type AssignmentSubmissionPresignResponse = z.infer<
  typeof AssignmentSubmissionPresignResponseSchema
>;

// ---------------------------------------------------------------------------
// AssignmentSubmissionsListResponse — GET /assignments/:id/submissions (educator roster)
// Each row extends AssignmentSubmission with the submitter's profile fields.
// ---------------------------------------------------------------------------

export const AssignmentSubmissionRosterRowSchema = AssignmentSubmissionSchema.extend({
  submitter: z.object({
    userId: z.string(),
    displayName: z.string(),
    username: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});
export type AssignmentSubmissionRosterRow = z.infer<typeof AssignmentSubmissionRosterRowSchema>;

export const AssignmentSubmissionsListResponseSchema = z.object({
  submissions: z.array(AssignmentSubmissionRosterRowSchema),
});
export type AssignmentSubmissionsListResponse = z.infer<
  typeof AssignmentSubmissionsListResponseSchema
>;

// ---------------------------------------------------------------------------
// ReturnSubmissionInput — POST /assignments/:id/submissions/:userId/return
// Organizer returns a submission with an optional comment.
// ---------------------------------------------------------------------------

export const ReturnSubmissionSchema = z.object({
  comment: z.string().max(2000).nullable().optional(),
});
export type ReturnSubmissionInput = z.infer<typeof ReturnSubmissionSchema>;
