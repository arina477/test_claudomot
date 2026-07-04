import { z } from 'zod';

// ---------------------------------------------------------------------------
// ScheduledSession — session DTO as surfaced to clients
// wave-43 — no reminders/RSVP/attendance/timezone/ICS fields
//
// organizer is the resolved identity object, mirroring how the assignment
// submission roster row carries submitter identity.
// ---------------------------------------------------------------------------

export const ScheduledSessionSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  organizerId: z.string(),
  title: z.string(),
  description: z.string().nullable(),
  startsAt: z.string(), // ISO 8601 — starts_at timestamptz
  endsAt: z.string(), // ISO 8601 — ends_at timestamptz
  recurrence: z.enum(['none', 'weekly']),
  recurrenceUntil: z.string().nullable(), // ISO 8601 — null when recurrence='none'
  organizer: z.object({
    userId: z.string(),
    displayName: z.string(),
    username: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});
export type ScheduledSession = z.infer<typeof ScheduledSessionSchema>;

// ---------------------------------------------------------------------------
// CreateScheduledSessionInput — POST /servers/:serverId/sessions
// endsAt must be after startsAt.
// When recurrence='weekly' and recurrenceUntil is present, recurrenceUntil
// must be >= startsAt.
// ---------------------------------------------------------------------------

export const CreateScheduledSessionSchema = z
  .object({
    title: z.string().min(1).max(200),
    description: z.string().nullable().optional(),
    startsAt: z.string(),
    endsAt: z.string(),
    recurrence: z.enum(['none', 'weekly']).default('none'),
    recurrenceUntil: z.string().nullable().optional(),
  })
  .refine((data) => new Date(data.endsAt) > new Date(data.startsAt), {
    message: 'endsAt must be after startsAt',
    path: ['endsAt'],
  })
  .refine(
    (data) => {
      if (data.recurrence === 'weekly' && data.recurrenceUntil != null) {
        return new Date(data.recurrenceUntil) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'recurrenceUntil must be on or after startsAt for weekly recurrence',
      path: ['recurrenceUntil'],
    },
  );
export type CreateScheduledSessionInput = z.infer<typeof CreateScheduledSessionSchema>;

// ---------------------------------------------------------------------------
// UpdateScheduledSessionInput — PATCH /sessions/:id
// All fields optional (partial update); cross-field refines applied only
// when the relevant fields are present.
// ---------------------------------------------------------------------------

export const UpdateScheduledSessionSchema = z
  .object({
    title: z.string().min(1).max(200).optional(),
    description: z.string().nullable().optional(),
    startsAt: z.string().optional(),
    endsAt: z.string().optional(),
    recurrence: z.enum(['none', 'weekly']).optional(),
    recurrenceUntil: z.string().nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.startsAt != null && data.endsAt != null) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'endsAt must be after startsAt',
      path: ['endsAt'],
    },
  )
  .refine(
    (data) => {
      if (data.recurrence === 'weekly' && data.recurrenceUntil != null && data.startsAt != null) {
        return new Date(data.recurrenceUntil) >= new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'recurrenceUntil must be on or after startsAt for weekly recurrence',
      path: ['recurrenceUntil'],
    },
  );
export type UpdateScheduledSessionInput = z.infer<typeof UpdateScheduledSessionSchema>;

// ---------------------------------------------------------------------------
// ScheduledSessionListResponse — GET /servers/:serverId/sessions
// ---------------------------------------------------------------------------

export const ScheduledSessionListResponseSchema = z.object({
  sessions: z.array(ScheduledSessionSchema),
});
export type ScheduledSessionListResponse = z.infer<typeof ScheduledSessionListResponseSchema>;
