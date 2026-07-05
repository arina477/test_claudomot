/**
 * studyTimerSocket — study timer event subscriptions over the /study-timer namespace.
 *
 * Owns a dedicated Socket.IO client for the /study-timer gateway, mirroring the
 * presenceSocket.ts convention (io(`${BASE}/study-timer`) with withCredentials,
 * singleton lifecycle, and reconnect re-join).
 *
 * The StudyTimerGateway (backend) hosts per-server rooms and broadcasts study-timer
 * events. Clients emit join_timer_room on widget mount so the gateway can track the
 * ephemeral viewer presence roster for "N studying".
 *
 * Client→server events:
 *   join_timer_room  { serverId }  — widget mount; gateway adds socket to the
 *                                   timer presence room and emits study-timer:presence.
 *   leave_timer_room { serverId }  — widget unmount; gateway removes socket.
 *
 * Server→client events (broadcast to per-server presence room):
 *   study-timer:update   { serverId, timer }  — authoritative state after any
 *                                              control or phase auto-advance.
 *   study-timer:presence { serverId, viewers, count } — ephemeral viewer roster.
 *
 * Reconnect: tracks the active serverId; re-emits join_timer_room on socket
 * 'connect' so the gateway re-registers the viewer after a transient drop
 * (same pattern as presenceSocket._activeJoinedChannel).
 *
 * wave-49 M8 tasks cb81bf03 / 832b83b7 (client half).
 * B-6 fix: corrected namespace from /messaging to /study-timer (wave-49 B-6 gate).
 */

import type { StudyTimerPresenceEvent, StudyTimerUpdateEvent } from '@studyhall/shared';
import { type Socket, io } from 'socket.io-client';

// Local event name constants — avoids CJS named-export resolution failure when
// importing from shared dist (same pattern as presenceSocket.ts PRESENCE_EVENTS).
const TIMER_UPDATE_EVENT = 'study-timer:update' as const;
const TIMER_PRESENCE_EVENT = 'study-timer:presence' as const;

// ---------------------------------------------------------------------------
// Socket singleton
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? '';

let _socket: Socket | null = null;

// Track active serverId for reconnect re-join (one timer widget at a time).
let _activeServerId: string | null = null;

/**
 * Returns the singleton Socket.IO client for the /study-timer namespace.
 * Created lazily on first call; kept for the app session lifetime.
 * withCredentials: true matches the presenceSocket / messagingSocket auth strategy
 * (session cookie, same-origin deploy — no extra token needed).
 */
export function getStudyTimerSocket(): Socket {
  if (!_socket) {
    _socket = io(`${BASE}/study-timer`, {
      withCredentials: true,
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Reconnect re-join: after a transient drop the server loses all room
    // memberships for this socket. Re-emit join_timer_room for the still-active
    // serverId so study-timer:update / study-timer:presence resume without waiting
    // for a full widget remount. Mirrors presenceSocket._activeJoinedChannel.
    _socket.on('connect', () => {
      if (_activeServerId) {
        _socket?.emit('join_timer_room', { serverId: _activeServerId });
      }
    });
  }

  return _socket;
}

// ---------------------------------------------------------------------------
// Client→server emitters
// ---------------------------------------------------------------------------

/**
 * Join the server's timer presence room.
 * Call on widget mount. Server-side: dedupes room joins, adds socket to roster,
 * emits study-timer:presence to reflect the new viewer count.
 * Also re-emits on socket reconnect via the internal reconnect handler.
 */
export function joinTimerRoom(serverId: string): void {
  _activeServerId = serverId;
  getStudyTimerSocket().emit('join_timer_room', { serverId });
}

/**
 * Leave the server's timer presence room.
 * Call on widget unmount so the gateway removes the socket from the roster
 * and broadcasts the updated study-timer:presence count.
 */
export function leaveTimerRoom(serverId: string): void {
  if (_activeServerId === serverId) _activeServerId = null;
  getStudyTimerSocket().emit('leave_timer_room', { serverId });
}

// ---------------------------------------------------------------------------
// Server→client subscriptions
// ---------------------------------------------------------------------------

/**
 * Subscribe to study-timer:update events.
 * Emitted on every control (start/pause/resume/reset) and phase auto-advance.
 * Clients reconcile to this authoritative state and count down to endsAt locally
 * (anti-drift — the client never authors its own countdown anchor).
 * Returns unsubscribe fn.
 */
export function onStudyTimerUpdate(handler: (event: StudyTimerUpdateEvent) => void): () => void {
  const socket = getStudyTimerSocket();
  socket.on(TIMER_UPDATE_EVENT, handler);
  return () => {
    socket.off(TIMER_UPDATE_EVENT, handler);
  };
}

/**
 * Subscribe to study-timer:presence events.
 * Emitted when a member joins or leaves the timer presence room (widget mount/unmount).
 * Ephemeral — NOT persisted, NOT attendance history. Distinct from online-presence
 * (presenceSocket.ts) which tracks online/offline status. This roster only reflects
 * members currently viewing the study timer widget.
 * Returns unsubscribe fn.
 */
export function onStudyTimerPresence(
  handler: (event: StudyTimerPresenceEvent) => void,
): () => void {
  const socket = getStudyTimerSocket();
  socket.on(TIMER_PRESENCE_EVENT, handler);
  return () => {
    socket.off(TIMER_PRESENCE_EVENT, handler);
  };
}
