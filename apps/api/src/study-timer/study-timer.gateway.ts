/**
 * StudyTimerGateway — Socket.IO /study-timer namespace
 * Wave-49 M8 tasks cb81bf03 (fan-out + presence) + 832b83b7 (reconnect reconciliation)
 *
 * Security:
 *   WS-upgrade auth: shared installWsAuthMiddleware (common/ws-auth.ts) — identical
 *   to MessagingGateway and PresenceGateway; installs io.use() per-connection middleware.
 *
 * Room naming:
 *   study-timer:server:<serverId> — one room per server.
 *   Joined/left on explicit 'join_timer_room' / 'leave_timer_room' events
 *   (widget mount/unmount) after server_members membership check.
 *
 * Fan-out:
 *   @OnEvent(STUDY_TIMER_UPDATED_EVENT) ← StudyTimerService emits on every control
 *   and on phase auto-advance. Broadcasts study-timer:update to the server room.
 *
 * Presence (ephemeral — cb81bf03):
 *   In-memory timerPresence Map tracks which members are VIEWING the running timer.
 *   Keyed: serverId → userId → { userId, displayName, sockets: Set<socketId> }.
 *   On join: add entry + broadcast study-timer:presence to room.
 *   On leave/disconnect: remove entry + broadcast presence.
 *   NO persistence — server restart rebuilds from live sockets (not attendance history).
 *
 * Reconnect reconciliation (832b83b7):
 *   On join_timer_room, the gateway emits the current authoritative timer DTO to
 *   the (re)joining socket so late joiners reconcile to the live state immediately.
 *
 * displayName: resolved server-side at connect time (cached on socket.data.displayName).
 *   Never client-provided — prevents fake name injection in presence roster.
 */

import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { StudyTimerPresenceEvent, StudyTimerUpdateEvent } from '@studyhall/shared';
import {
  STUDY_TIMER_JOIN_ERROR_EVENT,
  STUDY_TIMER_PRESENCE_EVENT,
  STUDY_TIMER_UPDATE_EVENT,
} from '@studyhall/shared';
import { and, eq } from 'drizzle-orm';
import type { Server, Socket } from 'socket.io';
import { installWsAuthMiddleware } from '../common/ws-auth';
import { db } from '../db/index';
import { server_members, users } from '../db/schema/index';
import { STUDY_TIMER_UPDATED_EVENT } from './study-timer.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { StudyTimerService } from './study-timer.service';

// ---------------------------------------------------------------------------
// Presence data structures (ephemeral — not persisted)
// ---------------------------------------------------------------------------

interface PresenceEntry {
  userId: string;
  displayName: string;
  /** All socket IDs from this user that have joined this server's timer room */
  sockets: Set<string>;
}

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

@WebSocketGateway({
  namespace: '/study-timer',
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class StudyTimerGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(StudyTimerGateway.name);

  /**
   * Ephemeral presence tracking.
   * Map<serverId, Map<userId, PresenceEntry>>
   * NO persistence — rebuilt from live sockets on reconnect; not attendance.
   */
  private readonly timerPresence = new Map<string, Map<string, PresenceEntry>>();

  /**
   * Reverse index for O(1) disconnect cleanup.
   * Map<socketId, Array<{serverId, userId}>>
   */
  private readonly socketPresenceIndex = new Map<
    string,
    Array<{ serverId: string; userId: string }>
  >();

  constructor(private readonly timerService: StudyTimerService) {}

  // -------------------------------------------------------------------------
  // afterInit — install shared WS-upgrade auth middleware (io.use())
  // -------------------------------------------------------------------------

  afterInit(server: Server): void {
    installWsAuthMiddleware(server);
  }

  // -------------------------------------------------------------------------
  // handleConnection — resolve + cache displayName server-side.
  //
  // socket.data.userId is guaranteed by installWsAuthMiddleware before this fires.
  // displayName is resolved from DB (never client-provided) and cached on socket.data.
  // -------------------------------------------------------------------------

  async handleConnection(socket: Socket): Promise<void> {
    const userId = socket.data.userId as string;
    this.logger.debug(`Connected: ${socket.id} userId=${userId}`);

    try {
      const [userRow] = await db
        .select({ display_name: users.display_name, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      const displayName = userRow?.display_name ?? userRow?.email?.split('@')[0] ?? userId;
      socket.data.displayName = displayName;
    } catch {
      socket.data.displayName = userId;
    }
  }

  // -------------------------------------------------------------------------
  // handleDisconnect — clean up all presence entries for this socket.
  //
  // Emits updated presence for each server room the socket was viewing.
  // -------------------------------------------------------------------------

  handleDisconnect(socket: Socket): void {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    this.logger.debug(`Disconnected: ${socket.id} userId=${userId}`);

    const entries = this.socketPresenceIndex.get(socket.id) ?? [];
    for (const { serverId } of entries) {
      this.removePresenceSocket(serverId, userId, socket.id);
      this.broadcastPresence(serverId);
    }
    this.socketPresenceIndex.delete(socket.id);
  }

  // -------------------------------------------------------------------------
  // join_timer_room — widget mount: join the server room + add to presence.
  //
  // Security: server_members membership check before joining (IDOR-safe —
  //   serverId from client payload is re-verified server-side).
  //
  // Reconnect reconciliation: emits current authoritative timer DTO to this
  //   socket so late joiners see the same state as everyone else.
  // -------------------------------------------------------------------------

  @SubscribeMessage('join_timer_room')
  async handleJoinTimerRoom(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = parseServerIdPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_TIMER_JOIN_ERROR_EVENT, { message: 'Invalid payload: serverId required' });
      return;
    }
    const { serverId } = parsed;

    // Member check — server_members row required; non-member gets no timer events
    let isMember = false;
    try {
      const [row] = await db
        .select({ id: server_members.id })
        .from(server_members)
        .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
        .limit(1);
      isMember = row !== undefined;
    } catch {
      socket.emit(STUDY_TIMER_JOIN_ERROR_EVENT, {
        message: 'Internal error checking membership',
      });
      return;
    }

    if (!isMember) {
      socket.emit(STUDY_TIMER_JOIN_ERROR_EVENT, {
        message: 'Forbidden: not a member of this server',
      });
      return;
    }

    await socket.join(`study-timer:server:${serverId}`);

    // Add to ephemeral presence map
    const displayName = (socket.data.displayName as string | undefined) ?? userId;
    this.addPresenceSocket(serverId, userId, displayName, socket.id);

    // Register in reverse index for disconnect cleanup
    const index = this.socketPresenceIndex.get(socket.id) ?? [];
    index.push({ serverId, userId });
    this.socketPresenceIndex.set(socket.id, index);

    // Reconnect reconciliation: emit authoritative state to this socket only
    try {
      const timer = await this.timerService.getTimerForRoom(serverId);
      socket.emit(STUDY_TIMER_UPDATE_EVENT, {
        serverId,
        timer,
      } satisfies StudyTimerUpdateEvent);
    } catch (err) {
      this.logger.error(`Reconciliation emit failed for server=${serverId}`, err);
    }

    // Broadcast updated presence roster to the whole server room
    this.broadcastPresence(serverId);

    this.logger.debug(`${socket.id} joined study-timer:server:${serverId}`);
  }

  // -------------------------------------------------------------------------
  // leave_timer_room — widget unmount: leave room + remove from presence.
  // No permission re-check needed — leaving is always allowed.
  // -------------------------------------------------------------------------

  @SubscribeMessage('leave_timer_room')
  async handleLeaveTimerRoom(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = parseServerIdPayload(payload);
    if (!parsed) {
      socket.emit(STUDY_TIMER_JOIN_ERROR_EVENT, { message: 'Invalid payload: serverId required' });
      return;
    }
    const { serverId } = parsed;

    await socket.leave(`study-timer:server:${serverId}`);

    this.removePresenceSocket(serverId, userId, socket.id);

    // Update reverse index
    const index = this.socketPresenceIndex.get(socket.id) ?? [];
    const filtered = index.filter((e) => !(e.serverId === serverId && e.userId === userId));
    if (filtered.length > 0) {
      this.socketPresenceIndex.set(socket.id, filtered);
    } else {
      this.socketPresenceIndex.delete(socket.id);
    }

    this.broadcastPresence(serverId);
    this.logger.debug(`${socket.id} left study-timer:server:${serverId}`);
  }

  // -------------------------------------------------------------------------
  // @OnEvent(STUDY_TIMER_UPDATED_EVENT) — fan-out timer update to server room.
  //
  // Fired by StudyTimerService on: start, pause, resume, reset, phase auto-
  // advance, and self-heal. Broadcasts study-timer:update to every socket in
  // the study-timer:server:<serverId> room (member-scoped: only sockets that
  // passed the membership check at join_timer_room are in this room).
  // -------------------------------------------------------------------------

  @OnEvent(STUDY_TIMER_UPDATED_EVENT)
  handleTimerUpdated(payload: StudyTimerUpdateEvent): void {
    this.server
      .to(`study-timer:server:${payload.serverId}`)
      .emit(STUDY_TIMER_UPDATE_EVENT, payload);
    this.logger.debug(`Fanned out study-timer:update to study-timer:server:${payload.serverId}`);
  }

  // =========================================================================
  // Presence helpers (private)
  // =========================================================================

  private addPresenceSocket(
    serverId: string,
    userId: string,
    displayName: string,
    socketId: string,
  ): void {
    if (!this.timerPresence.has(serverId)) {
      this.timerPresence.set(serverId, new Map());
    }
    const serverMap = this.timerPresence.get(serverId);
    if (!serverMap) return;

    const entry = serverMap.get(userId);
    if (entry) {
      entry.sockets.add(socketId);
    } else {
      serverMap.set(userId, { userId, displayName, sockets: new Set([socketId]) });
    }
  }

  private removePresenceSocket(serverId: string, userId: string, socketId: string): void {
    const serverMap = this.timerPresence.get(serverId);
    if (!serverMap) return;

    const entry = serverMap.get(userId);
    if (!entry) return;

    entry.sockets.delete(socketId);
    if (entry.sockets.size === 0) {
      serverMap.delete(userId);
    }
    if (serverMap.size === 0) {
      this.timerPresence.delete(serverId);
    }
  }

  /**
   * Get current viewers list for a server (deduplicated by userId).
   * Exported for testability.
   */
  getViewers(serverId: string): Array<{ userId: string; displayName: string }> {
    const serverMap = this.timerPresence.get(serverId);
    if (!serverMap) return [];
    return Array.from(serverMap.values()).map((e) => ({
      userId: e.userId,
      displayName: e.displayName,
    }));
  }

  private broadcastPresence(serverId: string): void {
    const viewers = this.getViewers(serverId);
    const payload: StudyTimerPresenceEvent = {
      serverId,
      viewers,
      count: viewers.length,
    };
    this.server.to(`study-timer:server:${serverId}`).emit(STUDY_TIMER_PRESENCE_EVENT, payload);
  }
}

// ---------------------------------------------------------------------------
// Payload parser — type-safe, avoids noExplicitAny
// ---------------------------------------------------------------------------

function parseServerIdPayload(payload: unknown): { serverId: string } | null {
  if (typeof payload !== 'object' || payload === null) return null;
  const p = payload as Record<string, unknown>;
  if (typeof p.serverId !== 'string' || p.serverId.length === 0) return null;
  return { serverId: p.serverId };
}
