/**
 * presenceSocket — singleton Socket.IO client for the /presence namespace.
 *
 * Mirrors messagingSocket.ts pattern exactly:
 *   - Created lazily on first import; kept for app session lifetime.
 *   - withCredentials: true for cookie-based auth (same-origin, no extra token).
 *   - Presence store: Map<userId, status> — seeded from presence:snapshot on connect,
 *     updated incrementally by presence:online / presence:offline.
 *   - Typing store: Map<channelId, typers[]> — maintained from typing:active events.
 *   - Subscribe helpers return unsubscribe functions (consistent with messaging pattern).
 *
 * Wave-14 events consumed (server→client):
 *   presence:snapshot  — { members:[{userId,status}] }  — bulk initial state on connect
 *   presence:online    — { userId }                      — a co-member came online
 *   presence:offline   — { userId }                      — a co-member went offline
 *   typing:active      — { channelId, typers:[{userId,displayName}] }
 *
 * Wave-14 events emitted (client→server):
 *   join_channel       — { channelId }   — subscribe to typing events for that channel
 *   typing:start       — { channelId }   — user is typing
 *   typing:stop        — { channelId }   — user stopped typing
 */

import type {
  PresenceOfflinePayload,
  PresenceOnlinePayload,
  PresenceSnapshot,
  PresenceStatus,
  TypingActive,
} from '@studyhall/shared';

// Local event-name constants — mirrors packages/shared/src/presence.ts PRESENCE_EVENTS
// values exactly. Not imported at runtime to avoid rollup CJS named-export resolution
// failure (shared compiles to CJS; Vite/rollup cannot statically resolve a named value
// export from it when every other web import is import-type only).
const PRESENCE_EVENTS = {
  SNAPSHOT: 'presence:snapshot',
  ONLINE: 'presence:online',
  OFFLINE: 'presence:offline',
  TYPING_START: 'typing:start',
  TYPING_STOP: 'typing:stop',
  TYPING_ACTIVE: 'typing:active',
} as const;
import { type Socket, io } from 'socket.io-client';

// ---------------------------------------------------------------------------
// Stores
// ---------------------------------------------------------------------------

/** Presence state: userId → 'online' | 'offline'. Seeded from snapshot. */
const presenceStore = new Map<string, PresenceStatus>();

/** Typing state: channelId → current typers array (server-authoritative). */
const typingStore = new Map<string, TypingActive['typers']>();

// ---------------------------------------------------------------------------
// Presence store subscriber registry
// ---------------------------------------------------------------------------

type PresenceSubscriber = () => void;
const presenceSubscribers = new Set<PresenceSubscriber>();

function notifyPresence() {
  for (const sub of presenceSubscribers) sub();
}

// ---------------------------------------------------------------------------
// Typing store subscriber registry
// ---------------------------------------------------------------------------

type TypingSubscriber = (channelId: string) => void;
const typingSubscribers = new Set<TypingSubscriber>();

function notifyTyping(channelId: string) {
  for (const sub of typingSubscribers) sub(channelId);
}

// ---------------------------------------------------------------------------
// Socket singleton
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? '';

let _socket: Socket | null = null;

/**
 * L-1: Track the channelId most recently passed to joinPresenceChannel().
 * On reconnect the server drops all room memberships, so we re-emit join_channel
 * for the still-active channel so typing:active events resume without requiring a
 * full hook remount. Only one channel is active at a time (single-channel view).
 */
let _activeJoinedChannel: string | null = null;

export function getPresenceSocket(): Socket {
  if (!_socket) {
    _socket = io(`${BASE}/presence`, {
      withCredentials: true,
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // ── presence:snapshot — bulk initial state ──────────────────────────────
    _socket.on(PRESENCE_EVENTS.SNAPSHOT, (payload: PresenceSnapshot) => {
      for (const { userId, status } of payload.members) {
        presenceStore.set(userId, status);
      }
      notifyPresence();
    });

    // ── presence:online ─────────────────────────────────────────────────────
    _socket.on(PRESENCE_EVENTS.ONLINE, (payload: PresenceOnlinePayload) => {
      presenceStore.set(payload.userId, 'online');
      notifyPresence();
    });

    // ── presence:offline ────────────────────────────────────────────────────
    _socket.on(PRESENCE_EVENTS.OFFLINE, (payload: PresenceOfflinePayload) => {
      presenceStore.set(payload.userId, 'offline');
      notifyPresence();
    });

    // ── typing:active ────────────────────────────────────────────────────────
    _socket.on(PRESENCE_EVENTS.TYPING_ACTIVE, (payload: TypingActive) => {
      typingStore.set(payload.channelId, payload.typers);
      notifyTyping(payload.channelId);
    });

    // ── L-1: reconnect — re-join active channel typing room ──────────────────
    // After a transient drop the server has lost all room memberships for this
    // socket. Re-emit join_channel for the channel the hook last joined so
    // typing:active events resume without waiting for a full hook remount.
    _socket.on('connect', () => {
      if (_activeJoinedChannel) {
        _socket?.emit('join_channel', { channelId: _activeJoinedChannel });
      }
    });
  }

  return _socket;
}

// ---------------------------------------------------------------------------
// Public accessors (snapshot reads — no copy-per-call for perf)
// ---------------------------------------------------------------------------

/** Get the current presence status for a userId. Defaults to 'offline'. */
export function getPresenceStatus(userId: string): PresenceStatus {
  return presenceStore.get(userId) ?? 'offline';
}

/**
 * Returns true if the presence store has ever observed this userId
 * (i.e. a snapshot / online / offline event has been received for them).
 * Returns false when the userId is absent — the "unknown" case.
 * Use this to distinguish KNOWN-offline from UNKNOWN before rendering a dot.
 */
export function hasPresence(userId: string): boolean {
  return presenceStore.has(userId);
}

/** Get the full presence store snapshot (read-only view). */
export function getPresenceSnapshot(): ReadonlyMap<string, PresenceStatus> {
  return presenceStore;
}

/** Get current typers for a channelId. */
export function getTypers(channelId: string): TypingActive['typers'] {
  return typingStore.get(channelId) ?? [];
}

// ---------------------------------------------------------------------------
// Subscribe / unsubscribe helpers
// ---------------------------------------------------------------------------

/**
 * Subscribe to any presence change (online/offline/snapshot).
 * Returns an unsubscribe function.
 */
export function subscribePresence(handler: PresenceSubscriber): () => void {
  // Ensure socket is initialised so the stores are live
  getPresenceSocket();
  presenceSubscribers.add(handler);
  return () => {
    presenceSubscribers.delete(handler);
  };
}

/**
 * Subscribe to typing:active events for any channel.
 * The handler receives the channelId that changed.
 * Returns an unsubscribe function.
 */
export function subscribeTyping(handler: TypingSubscriber): () => void {
  getPresenceSocket();
  typingSubscribers.add(handler);
  return () => {
    typingSubscribers.delete(handler);
  };
}

// ---------------------------------------------------------------------------
// Client→server emitters
// ---------------------------------------------------------------------------

/**
 * Join a channel's typing room.
 * Server-side canViewChannelById() is enforced — non-members are rejected.
 * Tracks the joined channelId in _activeJoinedChannel for reconnect re-join (L-1).
 */
export function joinPresenceChannel(channelId: string): void {
  _activeJoinedChannel = channelId;
  getPresenceSocket().emit('join_channel', { channelId });
}

/** Emit typing:start for a channel. */
export function emitTypingStart(channelId: string): void {
  getPresenceSocket().emit(PRESENCE_EVENTS.TYPING_START, { channelId });
}

/** Emit typing:stop for a channel. */
export function emitTypingStop(channelId: string): void {
  getPresenceSocket().emit(PRESENCE_EVENTS.TYPING_STOP, { channelId });
}
