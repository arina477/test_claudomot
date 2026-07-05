import { z } from 'zod';

import { STUDY_TIMER_PHASES, STUDY_TIMER_RUN_STATES } from './study-timer.js';

// ---------------------------------------------------------------------------
// FocusRoomViewerSchema — a single member currently focusing in a room
// wave-52 M8 task d123d9e0
//
// Mirrors the study-timer viewer shape (userId + displayName) and extends it
// with avatarUrl, which the focus-room roster panel renders.  The study-timer
// presence intentionally omits avatarUrl (widget-compact use-case); the two
// shapes stay independent per MUST-LOCK 2.
// ---------------------------------------------------------------------------

export const FocusRoomViewerSchema = z.object({
  userId: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
});
export type FocusRoomViewer = z.infer<typeof FocusRoomViewerSchema>;

// ---------------------------------------------------------------------------
// FocusRoomSchema — an open, ephemeral focus room within a server
// wave-52 M8 task d123d9e0
//
// Rooms live in-memory only (MUST-LOCK 1 — no focus_rooms/attendance table).
// id: server-generated UUID at create time.
// count: current number of joined (focusing) members.  Equals the roster
//   length; carried here so list-view badge renders without a separate fetch.
// ---------------------------------------------------------------------------

export const FocusRoomSchema = z.object({
  id: z.string(),
  serverId: z.string(),
  name: z.string(),
  count: z.number().int().nonnegative(),
});
export type FocusRoom = z.infer<typeof FocusRoomSchema>;

// ---------------------------------------------------------------------------
// FocusRoomRosterSchema — the live roster for one focus room
// wave-52 M8 task d123d9e0
//
// Emitted on every join/leave for the room.  Ephemeral — NOT persisted, NOT
// attendance/history (deferred).  count == viewers.length; both carried so
// badge UI can skip a .length call and the roster component has the full list.
// ---------------------------------------------------------------------------

export const FocusRoomRosterSchema = z.object({
  roomId: z.string(),
  viewers: z.array(FocusRoomViewerSchema),
  count: z.number().int().nonnegative(),
});
export type FocusRoomRoster = z.infer<typeof FocusRoomRosterSchema>;

// ---------------------------------------------------------------------------
// Socket event constants — server→client
// wave-52 M8 task d123d9e0
//
// All events live on the `/study-room` namespace — DISTINCT from the wave-49
// `/study-timer` namespace (MUST-LOCK 2).  Using namespaced strings so
// accidental collision with study-timer events is caught at import time.
// ---------------------------------------------------------------------------

/**
 * Socket.IO event name: broadcast of all open focus rooms within a server.
 * Emitted to the server-scoped room on create, remove, and count changes.
 * Payload: FocusRoomRoomsEvent.
 */
export const STUDY_ROOM_ROOMS_EVENT = 'study-room:rooms' as const;

/**
 * Socket.IO event name: roster update for a specific focus room.
 * Emitted to the focus-room-scoped Socket.IO room on every join/leave.
 * Payload: FocusRoomPresenceEvent.
 */
export const STUDY_ROOM_PRESENCE_EVENT = 'study-room:presence' as const;

/**
 * Socket.IO event name: join or create failure, emitted to the requesting
 * socket only.  Uses a namespaced event instead of the reserved Socket.IO
 * 'error' channel — mirrors the wave-49 lesson (STUDY_TIMER_JOIN_ERROR_EVENT).
 */
export const STUDY_ROOM_JOIN_ERROR_EVENT = 'study-room:join_error' as const;

// ---------------------------------------------------------------------------
// Socket verb constants — client→server
// wave-52 M8 task d123d9e0
//
// Gateway message names for the three explicit join-lifecycle signals.
// Mirroring study-timer.ts's level of formality: study-timer.ts does not
// define client→server verb consts (its control verbs are HTTP), but the
// focus-room surface is socket-only with three distinct socket verbs, so
// consts prevent typos across gateway and socket-hook layers.
// ---------------------------------------------------------------------------

/** Client emits this to create a new focus room in a server. Payload: { serverId, name }. */
export const STUDY_ROOM_CREATE_VERB = 'create_focus_room' as const;

/** Client emits this to join an existing focus room. Payload: { serverId, roomId }. */
export const STUDY_ROOM_JOIN_VERB = 'join_focus_room' as const;

/** Client emits this to leave the active focus room. Payload: { serverId, roomId }. */
export const STUDY_ROOM_LEAVE_VERB = 'leave_focus_room' as const;

// ---------------------------------------------------------------------------
// Event payload schemas — server→client
// wave-52 M8 task d123d9e0
//
// Matching study-timer.ts's formality: StudyTimerUpdateEventSchema +
// StudyTimerPresenceEventSchema are explicitly typed.  Same here for both
// fan-out events so gateway and socket-hook layers validate against a schema.
// ---------------------------------------------------------------------------

/**
 * Payload for STUDY_ROOM_ROOMS_EVENT.
 * Contains all currently open focus rooms within a given server.
 */
export const FocusRoomRoomsEventSchema = z.object({
  serverId: z.string(),
  rooms: z.array(FocusRoomSchema),
});
export type FocusRoomRoomsEvent = z.infer<typeof FocusRoomRoomsEventSchema>;

/**
 * Payload for STUDY_ROOM_PRESENCE_EVENT.
 * Contains the full live roster of a single focus room.
 */
export const FocusRoomPresenceEventSchema = z.object({
  roomId: z.string(),
  roster: FocusRoomRosterSchema,
});
export type FocusRoomPresenceEvent = z.infer<typeof FocusRoomPresenceEventSchema>;

// ---------------------------------------------------------------------------
// StudyRoomTimerSchema — room-scoped synchronized Pomodoro
// wave-52 M8 task ef84b378
//
// Reuses the wave-49/50 StudyTimer field shape with roomId replacing serverId
// (rooms are ephemeral in-memory; timer anchors keyed by roomId — MUST-LOCK 3).
// Pure compute-on-read formulas (computeCurrentPhase / phaseDurationMs) and
// one-shot auto-advance are reused unchanged from the wave-49 service.
// A distinct schema keeps the DTO type-safe without reusing StudyTimerSchema
// directly (which carries serverId — wrong key for room-scoped state).
// ---------------------------------------------------------------------------

export const StudyRoomTimerSchema = z.object({
  roomId: z.string(),
  phase: z.enum(STUDY_TIMER_PHASES),
  runState: z.enum(STUDY_TIMER_RUN_STATES),
  endsAt: z.string().nullable(), // ISO 8601 — null when idle
  remainingMs: z.number().int().nonnegative(),
  running: z.boolean(),
  updatedBy: z.string().nullable(),
  workDurationMs: z.number().int().positive(),
  breakDurationMs: z.number().int().positive(),
});
export type StudyRoomTimer = z.infer<typeof StudyRoomTimerSchema>;

// ---------------------------------------------------------------------------
// Room-timer event constants — broadcast over /study-room namespace
// wave-52 M8 task ef84b378
//
// Distinct from the server-level study-timer events (MUST-LOCK 2 + 3).
// ---------------------------------------------------------------------------

/**
 * Socket.IO event name: room-scoped timer state broadcast.
 * Emitted to the focus-room Socket.IO room on any control or phase transition.
 * Payload: StudyRoomTimerUpdateEvent.
 */
export const STUDY_ROOM_TIMER_UPDATE_EVENT = 'study-room:timer_update' as const;

/** Room-timer update payload. */
export const StudyRoomTimerUpdateEventSchema = z.object({
  roomId: z.string(),
  timer: StudyRoomTimerSchema,
});
export type StudyRoomTimerUpdateEvent = z.infer<typeof StudyRoomTimerUpdateEventSchema>;

// ---------------------------------------------------------------------------
// Room-timer control verb constants — client→server
// wave-52 M8 task ef84b378
// ---------------------------------------------------------------------------

/** Client emits this to start or resume the room timer. Payload: { serverId, roomId }. */
export const STUDY_ROOM_TIMER_START_VERB = 'study_room_timer_start' as const;

/** Client emits this to pause the room timer. Payload: { serverId, roomId }. */
export const STUDY_ROOM_TIMER_PAUSE_VERB = 'study_room_timer_pause' as const;

/** Client emits this to reset the room timer. Payload: { serverId, roomId }. */
export const STUDY_ROOM_TIMER_RESET_VERB = 'study_room_timer_reset' as const;

/**
 * Client emits this to configure custom durations for the room timer.
 * Payload: { serverId, roomId, workMinutes, breakMinutes } (validated ranges
 * mirror wave-50 StudyTimerConfigSchema: work 1-120, break 1-60).
 */
export const STUDY_ROOM_TIMER_CONFIG_VERB = 'study_room_timer_config' as const;
