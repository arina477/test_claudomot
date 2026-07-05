/**
 * studyRoomSocket — focus-room realtime events over the /study-room namespace.
 *
 * Owns a dedicated Socket.IO client for the /study-room gateway, mirroring the
 * studyTimerSocket.ts convention exactly (io(`${BASE}/study-room`) with
 * withCredentials, singleton lifecycle, and reconnect re-join).
 *
 * The StudyRoomGateway (backend) hosts ephemeral focus rooms within a server.
 * Clients emit create/join/leave verbs; the gateway fans out rooms + roster events.
 *
 * CRITICAL — namespace correctness (wave-49 B-6 lesson):
 *   This socket connects to `/study-room` — NOT /messaging or /study-timer.
 *   A namespace mismatch makes all emit/subscribe calls dead.
 *   A namespace-assertion unit test in studyRoomSocket.test.ts is the
 *   regression guard (mirrors studyTimerSocket.test.ts).
 *
 * Client→server events (verbs, mirroring shared STUDY_ROOM_*_VERB consts):
 *   create_focus_room  { serverId, name }         — create a new room
 *   join_focus_room    { serverId, roomId }        — join an existing room
 *   leave_focus_room   { serverId, roomId }        — leave the active room
 *   study_room_timer_start  { serverId, roomId }   — start/resume room timer
 *   study_room_timer_pause  { serverId, roomId }   — pause room timer
 *   study_room_timer_reset  { serverId, roomId }   — reset room timer
 *   study_room_timer_config { serverId, roomId,    — configure room timer durations
 *                             workMinutes, breakMinutes }
 *
 * Server→client events:
 *   study-room:rooms        { serverId, rooms[] }         — open rooms for a server
 *   study-room:presence     { roomId, roster }            — live roster for a room
 *   study-room:join_error   { message }                   — error on create/join
 *   study-room:timer_update { roomId, timer }             — room-scoped timer state
 *
 * Reconnect: tracks the active roomId + serverId; re-emits join_focus_room on
 * socket 'connect' so the gateway re-registers the member after a transient drop
 * (same pattern as studyTimerSocket._activeServerId).
 *
 * wave-52 M8 task aad849ac (client surface).
 */

import type {
  FocusRoomPresenceEvent,
  FocusRoomRoomsEvent,
  StudyRoomTimerUpdateEvent,
} from '@studyhall/shared';
import { type Socket, io } from 'socket.io-client';

// Local event name constants — avoids CJS named-export resolution failure when
// importing from shared dist (same pattern as studyTimerSocket.ts TIMER_UPDATE_EVENT).
const ROOMS_EVENT = 'study-room:rooms' as const;
const PRESENCE_EVENT = 'study-room:presence' as const;
const JOIN_ERROR_EVENT = 'study-room:join_error' as const;
const TIMER_UPDATE_EVENT = 'study-room:timer_update' as const;

// Verb sent to the server so it joins this socket to the server-rooms channel
// and immediately emits the current open-rooms list. Using a local const
// (mirrors ROOMS_EVENT above) to avoid CJS named-export resolution issues
// when importing STUDY_ROOM_SUBSCRIBE_VERB from shared dist.
const SUBSCRIBE_SERVER_ROOMS_VERB = 'subscribe_server_rooms' as const;

// ---------------------------------------------------------------------------
// Socket singleton
// ---------------------------------------------------------------------------

const BASE = (import.meta.env.VITE_API_ORIGIN as string | undefined) ?? '';

let _socket: Socket | null = null;

// Track the active room join for reconnect re-join (one room at a time).
let _activeServerId: string | null = null;
let _activeRoomId: string | null = null;

// Track the active server-rooms subscription for reconnect re-subscribe.
// Panel sets this via subscribeServerRooms(); cleared when panel unmounts is
// not strictly necessary (the backend cleans up on disconnect) but the reconnect
// handler only re-fires when this is non-null, so stale values are harmless.
let _activeSubscribeServerId: string | null = null;

/**
 * Returns the singleton Socket.IO client for the /study-room namespace.
 * Created lazily on first call; kept for the app session lifetime.
 * withCredentials: true matches the studyTimerSocket / presenceSocket auth strategy.
 *
 * NAMESPACE CONTRACT: MUST connect to `/study-room` — verified by the
 * namespace-assertion unit test in studyRoomSocket.test.ts.
 */
export function getStudyRoomSocket(): Socket {
  if (!_socket) {
    _socket = io(`${BASE}/study-room`, {
      withCredentials: true,
      autoConnect: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    // Reconnect handler: after a transient drop the server loses all memberships
    // and channel subscriptions for this socket.
    //   1. Re-subscribe to the server-rooms channel so the open-rooms list
    //      resumes without a full panel remount (mirrors subscribe on mount).
    //   2. Re-join the active focus room so presence / timer_update events resume.
    // Both re-emits are idempotent on the backend.
    _socket.on('connect', () => {
      if (_activeSubscribeServerId) {
        _socket?.emit(SUBSCRIBE_SERVER_ROOMS_VERB, {
          serverId: _activeSubscribeServerId,
        });
      }
      if (_activeServerId && _activeRoomId) {
        _socket?.emit('join_focus_room', {
          serverId: _activeServerId,
          roomId: _activeRoomId,
        });
      }
    });
  }

  return _socket;
}

// ---------------------------------------------------------------------------
// Server-rooms subscription
// ---------------------------------------------------------------------------

/**
 * Subscribe this socket to the server's open-rooms channel.
 * Emits STUDY_ROOM_SUBSCRIBE_VERB so the gateway joins the socket to the
 * server-rooms channel and immediately responds with a STUDY_ROOM_ROOMS_EVENT
 * carrying the current open-rooms list (possibly []).  That response resolves
 * the FocusRoomPanel's loading skeleton regardless of whether rooms are empty.
 *
 * Tracks the active serverId so the 'connect' reconnect handler can re-subscribe
 * after a transient socket drop without requiring a full panel remount.
 *
 * Must be called on panel mount when serverId is known, and the reconnect
 * handler re-calls it automatically on every subsequent socket reconnect.
 */
export function subscribeServerRooms(serverId: string): void {
  _activeSubscribeServerId = serverId;
  getStudyRoomSocket().emit(SUBSCRIBE_SERVER_ROOMS_VERB, { serverId });
}

// ---------------------------------------------------------------------------
// Client→server emitters
// ---------------------------------------------------------------------------

/**
 * Create a new focus room in the server.
 * Server auto-joins the creator: responds with STUDY_ROOM_TIMER_UPDATE_EVENT +
 * STUDY_ROOM_ROOMS_EVENT to the creator's socket, then broadcasts
 * STUDY_ROOM_PRESENCE_EVENT (creator in roster) + STUDY_ROOM_ROOMS_EVENT to
 * the server channel.  On error: STUDY_ROOM_JOIN_ERROR_EVENT to caller.
 * The caller must call setActiveRoom(serverId, roomId) once the roomId is known
 * (from the presence event) so reconnect re-join resumes correctly.
 */
export function createFocusRoom(serverId: string, name: string): void {
  getStudyRoomSocket().emit('create_focus_room', { serverId, name });
}

/**
 * Set the active room for reconnect re-join tracking without emitting a join verb.
 * Used after create-auto-join: the server already joined the creator, so we
 * must NOT emit join_focus_room again — but we still need to record the active
 * room so the 'connect' reconnect handler re-joins after a transient disconnect.
 */
export function setActiveRoom(serverId: string, roomId: string): void {
  _activeServerId = serverId;
  _activeRoomId = roomId;
}

/**
 * Join an existing focus room.
 * Sets _activeServerId + _activeRoomId for reconnect re-join.
 * Server responds with STUDY_ROOM_PRESENCE_EVENT to the room and
 * STUDY_ROOM_ROOMS_EVENT (updated count) to the server.
 * On error (room not found, not a member): STUDY_ROOM_JOIN_ERROR_EVENT.
 */
export function joinFocusRoom(serverId: string, roomId: string): void {
  _activeServerId = serverId;
  _activeRoomId = roomId;
  getStudyRoomSocket().emit('join_focus_room', { serverId, roomId });
}

/**
 * Leave the active focus room.
 * Clears _activeRoomId so reconnect does NOT re-join after intentional leave.
 * Server: removes from roster, broadcasts STUDY_ROOM_PRESENCE_EVENT + removes room
 * if zero members + broadcasts STUDY_ROOM_ROOMS_EVENT.
 */
export function leaveFocusRoom(serverId: string, roomId: string): void {
  if (_activeRoomId === roomId) {
    _activeServerId = null;
    _activeRoomId = null;
  }
  getStudyRoomSocket().emit('leave_focus_room', { serverId, roomId });
}

// ---------------------------------------------------------------------------
// Room-timer control emitters
// ---------------------------------------------------------------------------

/** Start (or resume) the room-scoped Pomodoro timer. */
export function startRoomTimer(serverId: string, roomId: string): void {
  getStudyRoomSocket().emit('study_room_timer_start', { serverId, roomId });
}

/** Pause the room-scoped Pomodoro timer. */
export function pauseRoomTimer(serverId: string, roomId: string): void {
  getStudyRoomSocket().emit('study_room_timer_pause', { serverId, roomId });
}

/** Reset the room-scoped Pomodoro timer to idle. */
export function resetRoomTimer(serverId: string, roomId: string): void {
  getStudyRoomSocket().emit('study_room_timer_reset', { serverId, roomId });
}

/** Configure custom durations for the room-scoped Pomodoro timer. */
export function configureRoomTimer(
  serverId: string,
  roomId: string,
  workMinutes: number,
  breakMinutes: number,
): void {
  getStudyRoomSocket().emit('study_room_timer_config', {
    serverId,
    roomId,
    workMinutes,
    breakMinutes,
  });
}

// ---------------------------------------------------------------------------
// Server→client subscriptions
// ---------------------------------------------------------------------------

/**
 * Subscribe to study-room:rooms events.
 * Emitted to all sockets in the server room when rooms open, close, or change
 * member count. Payload: { serverId, rooms[] } — the full current list.
 * Returns unsubscribe fn.
 */
export function onRooms(handler: (event: FocusRoomRoomsEvent) => void): () => void {
  const socket = getStudyRoomSocket();
  socket.on(ROOMS_EVENT, handler);
  return () => {
    socket.off(ROOMS_EVENT, handler);
  };
}

/**
 * Subscribe to study-room:presence events.
 * Emitted to sockets in the focus-room's Socket.IO room on every join/leave.
 * Payload: { roomId, roster: { viewers[], count } }.
 * Ephemeral — NOT attendance history.
 * Returns unsubscribe fn.
 */
export function onPresence(handler: (event: FocusRoomPresenceEvent) => void): () => void {
  const socket = getStudyRoomSocket();
  socket.on(PRESENCE_EVENT, handler);
  return () => {
    socket.off(PRESENCE_EVENT, handler);
  };
}

/**
 * Subscribe to study-room:join_error events.
 * Emitted to the requesting socket on create/join failure (room not found,
 * not a member, empty name, etc.).
 * Returns unsubscribe fn.
 */
export function onJoinError(handler: (event: { message: string }) => void): () => void {
  const socket = getStudyRoomSocket();
  socket.on(JOIN_ERROR_EVENT, handler);
  return () => {
    socket.off(JOIN_ERROR_EVENT, handler);
  };
}

/**
 * Subscribe to study-room:timer_update events.
 * Emitted to the focus-room Socket.IO room on any timer control or auto-advance.
 * Payload: { roomId, timer } — room-scoped StudyRoomTimer DTO.
 * Returns unsubscribe fn.
 */
export function onTimerUpdate(handler: (event: StudyRoomTimerUpdateEvent) => void): () => void {
  const socket = getStudyRoomSocket();
  socket.on(TIMER_UPDATE_EVENT, handler);
  return () => {
    socket.off(TIMER_UPDATE_EVENT, handler);
  };
}
