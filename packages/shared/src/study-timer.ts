import { z } from 'zod';

// ---------------------------------------------------------------------------
// Enum constants — phase and run-state values
// wave-49 M8 task 1387d845
//
// Exported as const tuples so callers can use them with z.enum() and
// also derive the union type via [number] indexing — same idiom as
// PROFILE_VISIBILITY / WHO_CAN_DM in privacy.ts.
// ---------------------------------------------------------------------------

export const STUDY_TIMER_PHASES = ['work', 'break'] as const;
export const STUDY_TIMER_RUN_STATES = ['idle', 'running', 'paused'] as const;

export type StudyTimerPhase = (typeof STUDY_TIMER_PHASES)[number];
export type StudyTimerRunState = (typeof STUDY_TIMER_RUN_STATES)[number];

// ---------------------------------------------------------------------------
// StudyTimerSchema — GET /servers/:serverId/study-timer response DTO
// wave-49 M8 task 1387d845
//
// Persisted anchors: serverId, phase, runState, endsAt, updatedBy.
// Compute-on-read derived fields (server derives; DTO carries them):
//   remainingMs — ms until endsAt when running; paused_remaining_ms when
//                 paused; 0 when idle or expired. Always non-negative.
//   running     — convenience boolean alias for runState === 'running'.
// endsAt: ISO 8601 string when running or paused (the countdown target the
//   client counts to locally — anti-drift); null when idle.
// updatedBy: userId of the last control caller; null for a fresh/never-touched
//   row (server populates from session; client never supplies).
// ---------------------------------------------------------------------------

export const StudyTimerSchema = z.object({
  serverId: z.string(),
  phase: z.enum(STUDY_TIMER_PHASES),
  runState: z.enum(STUDY_TIMER_RUN_STATES),
  endsAt: z.string().nullable(), // ISO 8601 — null when idle
  remainingMs: z.number().int().nonnegative(),
  running: z.boolean(),
  updatedBy: z.string().nullable(),
});
export type StudyTimer = z.infer<typeof StudyTimerSchema>;

// ---------------------------------------------------------------------------
// Socket event constants
// wave-49 M8 task cb81bf03
// ---------------------------------------------------------------------------

/** Socket.IO event name: authoritative timer state broadcast on any control or phase transition. */
export const STUDY_TIMER_UPDATE_EVENT = 'study-timer:update' as const;

/** Socket.IO event name: ephemeral live-presence roster broadcast on viewer join/leave. */
export const STUDY_TIMER_PRESENCE_EVENT = 'study-timer:presence' as const;

// ---------------------------------------------------------------------------
// StudyTimerUpdateEventSchema — `study-timer:update` payload
// wave-49 M8 task cb81bf03
//
// Emitted to the server room on every timer control (start/pause/resume/reset)
// and on phase auto-advance (work→break→work). Clients reconcile to this
// authoritative state and count down locally to endsAt (anti-drift — the
// client NEVER authors its own countdown anchor; it derives from endsAt).
// ---------------------------------------------------------------------------

export const StudyTimerUpdateEventSchema = z.object({
  serverId: z.string(),
  timer: StudyTimerSchema,
});
export type StudyTimerUpdateEvent = z.infer<typeof StudyTimerUpdateEventSchema>;

// ---------------------------------------------------------------------------
// StudyTimerPresenceEventSchema — `study-timer:presence` payload
// wave-49 M8 task cb81bf03
//
// Emitted when a member joins or leaves the timer presence room (widget
// mount/unmount). Ephemeral — NOT persisted, NOT attendance/history (deferred
// to a later study-sessions slice). count == viewers.length; both are carried
// so the badge UI can avoid a .length call and the roster component has the
// full viewer list without a separate fetch.
// ---------------------------------------------------------------------------

export const StudyTimerPresenceEventSchema = z.object({
  serverId: z.string(),
  viewers: z.array(
    z.object({
      userId: z.string(),
      displayName: z.string(),
    }),
  ),
  count: z.number().int().nonnegative(),
});
export type StudyTimerPresenceEvent = z.infer<typeof StudyTimerPresenceEventSchema>;
