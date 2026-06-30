import { z } from 'zod';

// ---------------------------------------------------------------------------
// PresenceStatus — online / offline enum
// ---------------------------------------------------------------------------

/** Union of possible presence states for a user. */
export const PresenceStatusSchema = z.enum(['online', 'offline']);
export type PresenceStatus = z.infer<typeof PresenceStatusSchema>;

// ---------------------------------------------------------------------------
// PresenceState — single member's current presence snapshot
// wave-14 task d1c4693d
// ---------------------------------------------------------------------------

/** Presence state for a single user (userId + status). */
export const PresenceStateSchema = z.object({
  userId: z.string().uuid(),
  status: PresenceStatusSchema,
});
export type PresenceState = z.infer<typeof PresenceStateSchema>;

// ---------------------------------------------------------------------------
// PresenceSnapshot — server→client on join: co-members' current states
// ---------------------------------------------------------------------------

/** Bulk snapshot of all co-members' presence states sent on channel join. */
export const PresenceSnapshotSchema = z.object({
  members: z.array(PresenceStateSchema),
});
export type PresenceSnapshot = z.infer<typeof PresenceSnapshotSchema>;

// ---------------------------------------------------------------------------
// PresenceOnlinePayload / PresenceOfflinePayload
// Server→client events: presence:online / presence:offline
// ---------------------------------------------------------------------------

/** Payload emitted on `presence:online` — user just came online. */
export const PresenceOnlinePayloadSchema = z.object({
  userId: z.string().uuid(),
});
export type PresenceOnlinePayload = z.infer<typeof PresenceOnlinePayloadSchema>;

/** Payload emitted on `presence:offline` — user disconnected or went offline. */
export const PresenceOfflinePayloadSchema = z.object({
  userId: z.string().uuid(),
});
export type PresenceOfflinePayload = z.infer<typeof PresenceOfflinePayloadSchema>;

// ---------------------------------------------------------------------------
// TypingStart / TypingStop — client→server events
// ---------------------------------------------------------------------------

/** Client→server: user started typing in a channel. */
export const TypingStartSchema = z.object({
  channelId: z.string().uuid(),
});
export type TypingStartInput = z.infer<typeof TypingStartSchema>;

/** Client→server: user stopped typing in a channel. */
export const TypingStopSchema = z.object({
  channelId: z.string().uuid(),
});
export type TypingStopInput = z.infer<typeof TypingStopSchema>;

// ---------------------------------------------------------------------------
// TypingActive — server→client broadcast of current typers in a channel
// ---------------------------------------------------------------------------

/** Server→client: current set of users actively typing in a channel. */
export const TypingActiveSchema = z.object({
  channelId: z.string().uuid(),
  typers: z.array(
    z.object({
      userId: z.string().uuid(),
      displayName: z.string(),
    }),
  ),
});
export type TypingActive = z.infer<typeof TypingActiveSchema>;

// ---------------------------------------------------------------------------
// Socket event name constants
// ---------------------------------------------------------------------------

/** Socket.IO event names for the presence + typing subsystem. */
export const PRESENCE_EVENTS = {
  /** Server→client: sent once on join with co-members' presence states. */
  SNAPSHOT: 'presence:snapshot',
  /** Server→client: a co-member came online. */
  ONLINE: 'presence:online',
  /** Server→client: a co-member went offline. */
  OFFLINE: 'presence:offline',
  /** Client→server: user started typing. */
  TYPING_START: 'typing:start',
  /** Client→server: user stopped typing. */
  TYPING_STOP: 'typing:stop',
  /** Server→client: broadcast current typers list. */
  TYPING_ACTIVE: 'typing:active',
} as const;
