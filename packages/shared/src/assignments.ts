import { z } from 'zod';
import { AttachmentRefSchema } from './messaging.js';

// ---------------------------------------------------------------------------
// Assignment — wave-22 M5 (task 01fcefb8)
//
// myStatus is per-authenticated-user state (LEFT JOIN assignment_status, default 'todo').
// attachment is optional (0-1 per assignment this wave).
// dueDate is an ISO 8601 string (timestamptz serialized to ISO on the wire).
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
