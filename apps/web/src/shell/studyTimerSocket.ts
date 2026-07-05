/**
 * studyTimerSocket — study timer event subscriptions over the /messaging namespace.
 *
 * The messaging.gateway (backend) hosts per-server rooms and broadcasts
 * study-timer events. Clients emit join_timer_room on widget mount so the
 * gateway can track the ephemeral viewer presence roster for "N studying".
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
 */

import type { StudyTimerPresenceEvent, StudyTimerUpdateEvent } from '@studyhall/shared';
import { getMessagingSocket } from './messagingSocket';

// Local event name constants — avoids CJS named-export resolution failure when
// importing from shared dist (same pattern as presenceSocket.ts PRESENCE_EVENTS).
const TIMER_UPDATE_EVENT = 'study-timer:update' as const;
const TIMER_PRESENCE_EVENT = 'study-timer:presence' as const;

// Track active serverId for reconnect re-join (one timer widget at a time).
let _activeServerId: string | null = null;
let _reconnectBound = false;

/** Register the reconnect handler once on the singleton socket. */
function ensureReconnect(): void {
  if (_reconnectBound) return;
  _reconnectBound = true;
  getMessagingSocket().on('connect', () => {
    if (_activeServerId) {
      getMessagingSocket().emit('join_timer_room', { serverId: _activeServerId });
    }
  });
}

/**
 * Join the server's timer presence room.
 * Call on widget mount. Server-side: dedupes room joins, adds socket to roster,
 * emits study-timer:presence to reflect the new viewer count.
 * Also re-emits on socket reconnect via the internal reconnect handler.
 */
export function joinTimerRoom(serverId: string): void {
  ensureReconnect();
  _activeServerId = serverId;
  getMessagingSocket().emit('join_timer_room', { serverId });
}

/**
 * Leave the server's timer presence room.
 * Call on widget unmount so the gateway removes the socket from the roster
 * and broadcasts the updated study-timer:presence count.
 */
export function leaveTimerRoom(serverId: string): void {
  if (_activeServerId === serverId) _activeServerId = null;
  getMessagingSocket().emit('leave_timer_room', { serverId });
}

/**
 * Subscribe to study-timer:update events.
 * Emitted on every control (start/pause/resume/reset) and phase auto-advance.
 * Clients reconcile to this authoritative state and count down to endsAt locally
 * (anti-drift — the client never authors its own countdown anchor).
 * Returns unsubscribe fn.
 */
export function onStudyTimerUpdate(handler: (event: StudyTimerUpdateEvent) => void): () => void {
  const socket = getMessagingSocket();
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
  const socket = getMessagingSocket();
  socket.on(TIMER_PRESENCE_EVENT, handler);
  return () => {
    socket.off(TIMER_PRESENCE_EVENT, handler);
  };
}
