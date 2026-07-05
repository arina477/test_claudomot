/**
 * StudyRoomGateway — Socket.IO /study-room namespace
 * Wave-52 M8 tasks d123d9e0 (rooms+presence) + ef84b378 (room-timer)
 *
 * MUST-LOCK 2: This gateway is a DISTINCT namespace (/study-room) with its own
 * in-memory presence structures. It MUST NOT import or touch:
 *   - StudyTimerGateway or its timerPresence Map
 *   - The /study-timer namespace or server_study_timer table
 *   - Any event constants from the study-timer namespace
 *
 * Security:
 *   WS-upgrade auth: shared installWsAuthMiddleware() (common/ws-auth.ts).
 *   After afterInit(), socket.data.userId is guaranteed (SuperTokens session).
 *   displayName + avatarUrl resolved from DB server-side at connect time —
 *   never client-provided (prevents fake-name injection in presence roster).
 *
 * Room naming:
 *   study-room:server:<serverId>     — joined on first create/join within a server.
 *     Receives: STUDY_ROOM_ROOMS_EVENT (open rooms list updates).
 *   study-room:room:<roomId>         — joined when user joins a focus room.
 *     Receives: STUDY_ROOM_PRESENCE_EVENT (roster updates) + STUDY_ROOM_TIMER_UPDATE_EVENT.
 *
 * REST decision (jenny-gap-1):
 *   Socket-only. Initial open-rooms list is pushed via STUDY_ROOM_ROOMS_EVENT on
 *   server-room join. No REST GET endpoint added (kept simple, no additional surface).
 *
 * Timer fan-out:
 *   StudyRoomService calls the registered timerUpdateCallback (registered at afterInit
 *   to avoid circular DI) → gateway broadcasts to study-room:room:<roomId>.
 *
 * Reconnect reconciliation:
 *   On join_focus_room: self-heal overdue timer, emit current timer DTO to socket,
 *   push the open-rooms list to the joining socket.
 */

import { ForbiddenException, Logger } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type {
  FocusRoomPresenceEvent,
  FocusRoomRoomsEvent,
  StudyRoomTimerUpdateEvent,
} from '@studyhall/shared';
import {
  STUDY_ROOM_CREATE_VERB,
  STUDY_ROOM_JOIN_ERROR_EVENT,
  STUDY_ROOM_JOIN_VERB,
  STUDY_ROOM_LEAVE_VERB,
  STUDY_ROOM_PRESENCE_EVENT,
  STUDY_ROOM_ROOMS_EVENT,
  STUDY_ROOM_SUBSCRIBE_VERB,
  STUDY_ROOM_TIMER_CONFIG_VERB,
  STUDY_ROOM_TIMER_PAUSE_VERB,
  STUDY_ROOM_TIMER_RESET_VERB,
  STUDY_ROOM_TIMER_START_VERB,
  STUDY_ROOM_TIMER_UPDATE_EVENT,
} from '@studyhall/shared';
import type { Server, Socket } from 'socket.io';
import { isInvalidTextRepresentation } from '../auth/pg-error-utils';
import { isUuid } from '../common/uuid.util';
import { installWsAuthMiddleware } from '../common/ws-auth';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { StudyRoomService } from './study-room.service';

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

@WebSocketGateway({
  namespace: '/study-room',
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class StudyRoomGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(StudyRoomGateway.name);

  /**
   * Reverse index: socketId → Array<{serverId, roomId}> entries the socket joined.
   * Used for O(1) disconnect cleanup without scanning all rooms.
   */
  private readonly socketRoomIndex = new Map<string, Array<{ serverId: string; roomId: string }>>();

  /**
   * Reverse index: socketId → Set<serverId> server-rooms this socket joined.
   * For unsubscribing from study-room:server:<serverId> on disconnect.
   */
  private readonly socketServerIndex = new Map<string, Set<string>>();

  constructor(private readonly roomService: StudyRoomService) {}

  // -------------------------------------------------------------------------
  // afterInit — install WS auth + register timer fan-out callback
  // -------------------------------------------------------------------------

  afterInit(server: Server): void {
    installWsAuthMiddleware(server);

    // Register the timer update callback (avoids circular DI — service calls this).
    // Guard: roomService may be undefined in rare test isolation scenarios where
    // afterInit fires before full DI resolution; safe to skip in that case since
    // the callback is registered again on subsequent valid initializations.
    if (!this.roomService) return;

    this.roomService.registerTimerCallback((payload: StudyRoomTimerUpdateEvent) => {
      this.server
        .to(`study-room:room:${payload.roomId}`)
        .emit(STUDY_ROOM_TIMER_UPDATE_EVENT, payload);
      this.logger.debug(`Fanned out room timer update to study-room:room:${payload.roomId}`);
    });
  }

  // -------------------------------------------------------------------------
  // handleConnection — resolve + cache displayName + avatarUrl server-side
  // -------------------------------------------------------------------------

  async handleConnection(socket: Socket): Promise<void> {
    const userId = socket.data.userId as string;
    this.logger.debug(`Connected: ${socket.id} userId=${userId}`);

    try {
      const profile = await this.roomService.resolveUserProfile(userId);
      socket.data.displayName = profile.displayName;
      socket.data.avatarUrl = profile.avatarUrl;
    } catch {
      socket.data.displayName = userId;
      socket.data.avatarUrl = null;
    }
  }

  // -------------------------------------------------------------------------
  // handleDisconnect — clean up all room and server-room memberships
  // -------------------------------------------------------------------------

  handleDisconnect(socket: Socket): void {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    this.logger.debug(`Disconnected: ${socket.id} userId=${userId}`);

    // Leave all focus rooms this socket was in
    const roomEntries = this.socketRoomIndex.get(socket.id) ?? [];
    for (const { serverId, roomId } of roomEntries) {
      const result = this.roomService.leaveRoom(userId, serverId, roomId, socket.id);
      if (result.roomRemoved) {
        this.broadcastRoomsUpdate(serverId, result.rooms);
      } else {
        this.broadcastRosterUpdate(roomId, result.roster);
        this.broadcastRoomsUpdate(serverId, result.rooms);
      }
    }
    this.socketRoomIndex.delete(socket.id);
    this.socketServerIndex.delete(socket.id);
  }

  // -------------------------------------------------------------------------
  // create_focus_room — create a new ephemeral focus room in a server
  // -------------------------------------------------------------------------

  @SubscribeMessage(STUDY_ROOM_CREATE_VERB)
  async handleCreateRoom(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = parseCreatePayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId and name required',
      });
      return;
    }

    const { serverId, name } = parsed;

    try {
      const { roomId } = await this.roomService.createRoom(userId, serverId, name);

      // AUTO-JOIN: creator is immediately added to the room roster via the same
      // join path as handleJoinRoom. This guarantees:
      //   1. The room is born with count=1 (no ghost count-0 rooms — MUST-LOCK 1).
      //   2. The only removal path (last-member-leave → removeRoom) is reachable
      //      for the creator via normal leave or disconnect.
      //   3. All bookkeeping (socketRoomIndex, socket.join, presence broadcast)
      //      is identical to a manual join_focus_room, so disconnect cleanup works.
      await this.performJoin(socket, serverId, roomId);

      this.logger.debug(`Room created and creator auto-joined by ${userId} in server ${serverId}`);
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to create room', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  // -------------------------------------------------------------------------
  // join_focus_room — join an existing focus room
  // -------------------------------------------------------------------------

  @SubscribeMessage(STUDY_ROOM_JOIN_VERB)
  async handleJoinRoom(socket: Socket, payload: unknown): Promise<void> {
    const parsed = parseRoomPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId and roomId required',
      });
      return;
    }

    const { serverId, roomId } = parsed;

    try {
      await this.performJoin(socket, serverId, roomId);
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to join room', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  // -------------------------------------------------------------------------
  // performJoin — shared join path used by handleJoinRoom AND handleCreateRoom.
  // Adds creator/joiner to the room roster with full bookkeeping so that
  // disconnect cleanup works identically regardless of whether the user
  // entered via create or via join.
  // -------------------------------------------------------------------------

  private async performJoin(socket: Socket, serverId: string, roomId: string): Promise<void> {
    const userId = socket.data.userId as string;
    const displayName = (socket.data.displayName as string | undefined) ?? userId;
    const avatarUrl = (socket.data.avatarUrl as string | null | undefined) ?? null;

    const { roster, rooms, timer } = await this.roomService.joinRoom(
      userId,
      serverId,
      roomId,
      socket.id,
      displayName,
      avatarUrl,
    );

    // Self-heal the room timer if it drifted while this socket was away
    this.roomService.selfHealRoomTimerIfOverdue(roomId);

    // Ensure socket is in the server-room channel
    await this.ensureServerRoom(socket, serverId);

    // Join the per-room Socket.IO room
    await socket.join(`study-room:room:${roomId}`);

    // Track for disconnect cleanup
    const roomEntries = this.socketRoomIndex.get(socket.id) ?? [];
    if (!roomEntries.some((e) => e.roomId === roomId && e.serverId === serverId)) {
      roomEntries.push({ serverId, roomId });
    }
    this.socketRoomIndex.set(socket.id, roomEntries);

    // Reconnect reconciliation: push current timer state to this socket only
    socket.emit(STUDY_ROOM_TIMER_UPDATE_EVENT, {
      roomId,
      timer,
    } satisfies StudyRoomTimerUpdateEvent);

    // Push current open-rooms list to this socket (jenny-gap-1: socket-only initial state)
    socket.emit(STUDY_ROOM_ROOMS_EVENT, { serverId, rooms } satisfies FocusRoomRoomsEvent);

    // Broadcast updated roster to the whole room (creator gets STUDY_ROOM_PRESENCE_EVENT)
    this.broadcastRosterUpdate(roomId, roster);
    // Broadcast updated rooms list (count changed) to the whole server channel
    this.broadcastRoomsUpdate(serverId, rooms);

    this.logger.debug(`${socket.id} joined study-room:room:${roomId}`);
  }

  // -------------------------------------------------------------------------
  // leave_focus_room — leave an active focus room
  // -------------------------------------------------------------------------

  @SubscribeMessage(STUDY_ROOM_LEAVE_VERB)
  async handleLeaveRoom(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = parseRoomPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId and roomId required',
      });
      return;
    }

    const { serverId, roomId } = parsed;

    const result = this.roomService.leaveRoom(userId, serverId, roomId, socket.id);

    // Leave the per-room Socket.IO room
    await socket.leave(`study-room:room:${roomId}`);

    // Update reverse index
    const roomEntries = this.socketRoomIndex.get(socket.id) ?? [];
    const filtered = roomEntries.filter((e) => !(e.serverId === serverId && e.roomId === roomId));
    if (filtered.length > 0) {
      this.socketRoomIndex.set(socket.id, filtered);
    } else {
      this.socketRoomIndex.delete(socket.id);
    }

    if (result.roomRemoved) {
      this.broadcastRoomsUpdate(serverId, result.rooms);
    } else {
      this.broadcastRosterUpdate(roomId, result.roster);
      this.broadcastRoomsUpdate(serverId, result.rooms);
    }

    this.logger.debug(`${socket.id} left study-room:room:${roomId}`);
  }

  // -------------------------------------------------------------------------
  // subscribe_server_rooms — push current open-rooms list to a viewer-only client
  //
  // Called by the client on panel mount (and on reconnect) BEFORE joining any
  // room.  This is the fix for the chicken-and-egg skeleton-stuck bug: a client
  // that has only connected to the namespace (connect-ack received) but has NOT
  // joined a room needs the current rooms list so it can decide what to join,
  // display the empty-state, or render the create affordance.
  //
  // Steps on receipt:
  //   1. assertMember (403/join_error if non-member — IDOR guard).
  //   2. ensureServerRoom: join study-room:server:<serverId> if not already in it.
  //      From this point all subsequent STUDY_ROOM_ROOMS_EVENT broadcasts for the
  //      server arrive automatically at this socket (live list without polling).
  //   3. Immediately emit STUDY_ROOM_ROOMS_EVENT to THIS SOCKET ONLY with the
  //      current open-rooms list (possibly empty [] — resolves the skeleton).
  //
  // Idempotent: re-subscribing re-emits the current list; socket.join on an
  // already-joined room is a no-op at the Socket.IO level; ensureServerRoom
  // guards the Set addition so socketServerIndex stays accurate.
  // -------------------------------------------------------------------------

  @SubscribeMessage(STUDY_ROOM_SUBSCRIBE_VERB)
  async handleSubscribeServerRooms(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = parseServerPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId required',
      });
      return;
    }

    const { serverId } = parsed;

    try {
      // Member guard — same as joinRoom / createRoom (IDOR-safe)
      const rooms = await this.roomService.getOpenRooms(userId, serverId);

      // Ensure the socket is in the server-rooms broadcast channel so it
      // receives all future STUDY_ROOM_ROOMS_EVENT emissions for this server.
      await this.ensureServerRoom(socket, serverId);

      // Immediately push the current rooms list to resolve the loading skeleton.
      socket.emit(STUDY_ROOM_ROOMS_EVENT, { serverId, rooms } satisfies FocusRoomRoomsEvent);

      this.logger.debug(
        `${socket.id} subscribed to server rooms: serverId=${serverId} (${rooms.length} open rooms)`,
      );
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to subscribe to server rooms', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  // -------------------------------------------------------------------------
  // Room-timer controls — only JOINED members can control the room timer
  // -------------------------------------------------------------------------

  @SubscribeMessage(STUDY_ROOM_TIMER_START_VERB)
  handleTimerStart(socket: Socket, payload: unknown): void {
    const userId = socket.data.userId as string;

    const parsed = parseRoomPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId and roomId required',
      });
      return;
    }

    const { serverId, roomId } = parsed;

    try {
      this.roomService.startRoomTimer(userId, serverId, roomId);
      // Fan-out handled via timerUpdateCallback registered in afterInit
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to start room timer', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  @SubscribeMessage(STUDY_ROOM_TIMER_PAUSE_VERB)
  handleTimerPause(socket: Socket, payload: unknown): void {
    const userId = socket.data.userId as string;

    const parsed = parseRoomPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId and roomId required',
      });
      return;
    }

    const { serverId, roomId } = parsed;

    try {
      this.roomService.pauseRoomTimer(userId, serverId, roomId);
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to pause room timer', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  @SubscribeMessage(STUDY_ROOM_TIMER_RESET_VERB)
  handleTimerReset(socket: Socket, payload: unknown): void {
    const userId = socket.data.userId as string;

    const parsed = parseRoomPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId and roomId required',
      });
      return;
    }

    const { serverId, roomId } = parsed;

    try {
      this.roomService.resetRoomTimer(userId, serverId, roomId);
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to reset room timer', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  @SubscribeMessage(STUDY_ROOM_TIMER_CONFIG_VERB)
  handleTimerConfig(socket: Socket, payload: unknown): void {
    const userId = socket.data.userId as string;

    const parsed = parseConfigPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, {
        message: 'Invalid payload: serverId, roomId, workMinutes, breakMinutes required',
      });
      return;
    }

    const { serverId, roomId, workMinutes, breakMinutes } = parsed;

    try {
      this.roomService.configureRoomTimer(userId, serverId, roomId, workMinutes, breakMinutes);
    } catch (err) {
      const message = safeErrorMessage(err, 'Failed to configure room timer', this.logger);
      socket.emit(STUDY_ROOM_JOIN_ERROR_EVENT, { message });
    }
  }

  // =========================================================================
  // Broadcast helpers (private)
  // =========================================================================

  private broadcastRoomsUpdate(serverId: string, rooms: FocusRoomRoomsEvent['rooms']): void {
    this.server
      .to(`study-room:server:${serverId}`)
      .emit(STUDY_ROOM_ROOMS_EVENT, { serverId, rooms } satisfies FocusRoomRoomsEvent);
  }

  private broadcastRosterUpdate(
    roomId: string,
    viewers: FocusRoomPresenceEvent['roster']['viewers'],
  ): void {
    const payload: FocusRoomPresenceEvent = {
      roomId,
      roster: {
        roomId,
        viewers,
        count: viewers.length,
      },
    };
    this.server.to(`study-room:room:${roomId}`).emit(STUDY_ROOM_PRESENCE_EVENT, payload);
  }

  /**
   * ensureServerRoom — join the study-room:server:<serverId> Socket.IO room if not already in it.
   * Tracks membership in socketServerIndex for disconnect cleanup.
   */
  private async ensureServerRoom(socket: Socket, serverId: string): Promise<void> {
    const serverRooms = this.socketServerIndex.get(socket.id) ?? new Set<string>();
    if (!serverRooms.has(serverId)) {
      await socket.join(`study-room:server:${serverId}`);
      serverRooms.add(serverId);
      this.socketServerIndex.set(socket.id, serverRooms);
    }
  }

  // =========================================================================
  // Testability helpers (exposed for unit tests)
  // =========================================================================

  /** Get the current open rooms list for a server (for tests). */
  getRoomsForServer(serverId: string): import('@studyhall/shared').FocusRoom[] {
    return this.roomService.roomsListFor(serverId);
  }
}

// ---------------------------------------------------------------------------
// Error-message helper — defense-in-depth: never leak raw DB errors to clients
// ---------------------------------------------------------------------------

/**
 * safeErrorMessage — returns a client-safe error message.
 *
 * Forwards the real message only for ForbiddenException (user-safe authz denial,
 * e.g. "You are not a member of this server"). For every other error, returns the
 * provided fallback string and logs the full error server-side.
 *
 * Belt-and-suspenders: if a malformed UUID somehow escapes the parse-layer guard
 * and reaches the DB (SQLSTATE 22P02), that is explicitly logged as a warning.
 */
function safeErrorMessage(err: unknown, fallback: string, logger: Logger): string {
  if (err instanceof ForbiddenException) {
    return err.message;
  }
  // Belt-and-suspenders: log specifically if a uuid cast error reached the DB
  if (isInvalidTextRepresentation(err)) {
    logger.warn('malformed-uuid cast reached the DB — parse-layer guard may have been bypassed', {
      error: err,
    });
  } else {
    logger.error(`Unexpected error in study-room gateway (${fallback})`, { error: err });
  }
  return fallback;
}

// ---------------------------------------------------------------------------
// Payload parsers — type-safe, avoids noExplicitAny
// ---------------------------------------------------------------------------

function parseServerPayload(payload: unknown): { serverId: string } | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.serverId !== 'string' || p.serverId.length === 0 || !isUuid(p.serverId)) return null;
  return { serverId: p.serverId };
}

function parseCreatePayload(payload: unknown): { serverId: string; name: string } | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.serverId !== 'string' || p.serverId.length === 0 || !isUuid(p.serverId)) return null;
  if (typeof p.name !== 'string' || p.name.length === 0) return null;
  return { serverId: p.serverId, name: p.name };
}

function parseRoomPayload(payload: unknown): { serverId: string; roomId: string } | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.serverId !== 'string' || p.serverId.length === 0 || !isUuid(p.serverId)) return null;
  if (typeof p.roomId !== 'string' || p.roomId.length === 0 || !isUuid(p.roomId)) return null;
  return { serverId: p.serverId, roomId: p.roomId };
}

function parseConfigPayload(payload: unknown): {
  serverId: string;
  roomId: string;
  workMinutes: number;
  breakMinutes: number;
} | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.serverId !== 'string' || p.serverId.length === 0 || !isUuid(p.serverId)) return null;
  if (typeof p.roomId !== 'string' || p.roomId.length === 0 || !isUuid(p.roomId)) return null;
  if (typeof p.workMinutes !== 'number' || !Number.isInteger(p.workMinutes) || p.workMinutes <= 0)
    return null;
  if (
    typeof p.breakMinutes !== 'number' ||
    !Number.isInteger(p.breakMinutes) ||
    p.breakMinutes <= 0
  )
    return null;
  return {
    serverId: p.serverId,
    roomId: p.roomId,
    workMinutes: p.workMinutes,
    breakMinutes: p.breakMinutes,
  };
}
