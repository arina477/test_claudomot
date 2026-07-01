/**
 * PresenceGateway — Socket.IO /presence namespace
 *
 * Security boundary:
 *   WS upgrade auth: shared installWsAuthMiddleware() (common/ws-auth.ts).
 *   After afterInit() installs the middleware, every socket that reaches
 *   handleConnection() has socket.data.userId verified and email-verified.
 *
 * Room naming:
 *   presence:server:<serverId>  — one room per server the user belongs to.
 *     Used for presence:online / presence:offline fan-out to co-members.
 *     Joined automatically on connection for all of the user's servers.
 *
 *   presence:channel:<channelId> — one room per channel.
 *     Used for typing:active fan-out, scoped to channel viewers only.
 *     Joined on explicit 'join_channel' event after canViewChannelById() check.
 *     This is required for private-channel typing privacy:
 *     a non-viewer MUST NOT receive typing events for a channel they cannot see.
 *
 * Typing scoping mechanism (chosen: presence:channel:<channelId> room):
 *   Clients emit 'join_channel' with { channelId } to subscribe to typing events
 *   for that channel. Server-side canViewChannelById() is re-checked on every
 *   join_channel (never client-trusted). typing:active is emitted ONLY to
 *   presence:channel:<channelId> — never to the whole server room — so a
 *   non-member who cannot view a private channel never receives its typers.
 *
 *   Alternative considered (server-room with filter): emitting to the server room
 *   and skipping non-viewers server-side is too complex to implement correctly
 *   without per-emit recipient queries. The channel-room pattern matches the
 *   messaging gateway's existing join-and-gate pattern and is simpler.
 *
 * displayName: resolved server-side from users.display_name at connect time
 *   and cached on socket.data.displayName. Never client-provided — prevents
 *   fake display-name injection in typing indicators.
 *
 * socket.data fields managed by this gateway:
 *   userId       (string)      — set by installWsAuthMiddleware before handleConnection
 *   displayName  (string)      — set in handleConnection from DB lookup
 *   serverIds    (string[])    — captured at connect time; reused at disconnect for
 *                                offline fan-out so membership changes mid-session do
 *                                not cause stale "online" states for ex-co-members
 *   typingChannels (Set<string>) — channels this socket currently has an active typing
 *                                  entry in; populated by handleTypingStart, cleared by
 *                                  handleTypingStop and handleDisconnect so ghost typers
 *                                  are evicted immediately on tab-close
 *
 * Fan-out invariant:
 *   ALL emits are room-scoped. No global broadcasts.
 */

import { Logger } from '@nestjs/common';
import {
  type OnGatewayConnection,
  type OnGatewayDisconnect,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {
  PRESENCE_EVENTS,
  type PresenceOfflinePayload,
  type PresenceOnlinePayload,
  type PresenceSnapshot,
  type PresenceState,
  TypingStartSchema,
  TypingStopSchema,
} from '@studyhall/shared';
import { eq } from 'drizzle-orm';
import type { Server, Socket } from 'socket.io';
import { installWsAuthMiddleware } from '../common/ws-auth';
import { db } from '../db/index';
import { users } from '../db/schema/index';
// biome-ignore lint/style/useImportType: value import required — emitDecoratorMetadata needs the runtime symbol for NestJS DI
import { RbacService } from '../rbac/rbac.service';
// biome-ignore lint/style/useImportType: value import required — emitDecoratorMetadata needs the runtime symbol for NestJS DI
import { PresenceService } from './presence.service';

@WebSocketGateway({
  namespace: '/presence',
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class PresenceGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(PresenceGateway.name);

  constructor(
    private readonly presenceService: PresenceService,
    private readonly rbacService: RbacService,
  ) {}

  // -------------------------------------------------------------------------
  // afterInit — install shared WS-upgrade auth middleware
  // -------------------------------------------------------------------------

  afterInit(server: Server): void {
    installWsAuthMiddleware(server);
  }

  // -------------------------------------------------------------------------
  // handleConnection — ref-count up, join server rooms, emit snapshot
  //
  // By the time handleConnection fires, socket.data.userId is guaranteed
  // to be set (installWsAuthMiddleware rejects before this if auth failed).
  // -------------------------------------------------------------------------

  async handleConnection(socket: Socket): Promise<void> {
    const userId = socket.data.userId as string;
    this.logger.debug(`Connected: ${socket.id} userId=${userId}`);

    // 1. Resolve and cache displayName server-side (never client-provided)
    try {
      const [userRow] = await db
        .select({ display_name: users.display_name, email: users.email })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Fall back to email prefix if display_name is not set
      const displayName = userRow?.display_name || userRow?.email?.split('@')[0] || userId;
      socket.data.displayName = displayName;
    } catch {
      socket.data.displayName = userId;
    }

    // 2. Ref-count up
    const { wentOnline } = this.presenceService.connect(userId, socket.id);

    // 3. Resolve this user's servers and join presence:server:<serverId> rooms.
    //    Capture the resolved set on socket.data.serverIds so handleDisconnect
    //    can fan-out offline to exactly the same audience without re-querying the
    //    DB (H-1b: membership changes after connect should not affect offline reach).
    let serverIds: string[];
    try {
      serverIds = await this.presenceService.getServerIdsForUser(userId);
    } catch (err) {
      this.logger.error(`Failed to resolve servers for userId=${userId}`, err);
      socket.disconnect(true);
      return;
    }

    socket.data.serverIds = serverIds;
    // Initialise the per-socket typing channel tracker (H-1).
    socket.data.typingChannels = new Set<string>();

    for (const serverId of serverIds) {
      await socket.join(`presence:server:${serverId}`);
    }

    // 4. Emit presence:snapshot to the joining socket with co-members' current states
    try {
      const coMemberIds = await this.presenceService.getCoMemberUserIds(userId);
      const members: PresenceState[] = coMemberIds.map((uid) => ({
        userId: uid,
        status: this.presenceService.isOnline(uid) ? 'online' : 'offline',
      }));
      const snapshot: PresenceSnapshot = { members };
      socket.emit(PRESENCE_EVENTS.SNAPSHOT, snapshot);
    } catch (err) {
      this.logger.error(`Failed to build snapshot for userId=${userId}`, err);
      // Non-fatal: socket stays connected; client can re-connect to retry
    }

    // 5. If first socket for this user, broadcast presence:online to co-member rooms
    if (wentOnline) {
      const onlinePayload: PresenceOnlinePayload = { userId };
      for (const serverId of serverIds) {
        // socket.to() excludes this socket — co-members only
        socket.to(`presence:server:${serverId}`).emit(PRESENCE_EVENTS.ONLINE, onlinePayload);
      }
      this.logger.debug(
        `userId=${userId} came online — notified ${serverIds.length} server room(s)`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // handleDisconnect — ref-count down; if last socket, broadcast offline
  // -------------------------------------------------------------------------

  async handleDisconnect(socket: Socket): Promise<void> {
    const userId = socket.data.userId as string | undefined;

    // userId may be undefined if the socket was rejected during auth (middleware
    // called next(error) but handleDisconnect still fires). Guard here.
    if (!userId) return;

    this.logger.debug(`Disconnected: ${socket.id} userId=${userId}`);

    // H-1: Clear all active typing entries for this socket immediately.
    // socket.data.typingChannels is the set of channels this socket has called
    // typing:start on (populated in handleTypingStart, cleared in handleTypingStop).
    // Without this, a tab-close mid-type leaves a ghost typer for up to the 5s TTL.
    const typingChannels = socket.data.typingChannels as Set<string> | undefined;
    if (typingChannels && typingChannels.size > 0) {
      for (const channelId of typingChannels) {
        this.presenceService.stopTyping(channelId, userId);
        // Emit updated typing:active immediately — don't wait for TTL to clear the ghost.
        void this.emitTypingActive(channelId);
      }
      this.logger.debug(
        `userId=${userId} disconnected mid-type — cleared ${typingChannels.size} channel(s)`,
      );
    }

    const { wentOffline } = this.presenceService.disconnect(userId, socket.id);

    if (wentOffline) {
      // H-1b: Use the serverIds captured at connect time rather than re-querying the DB.
      // If membership changed during the session, the offline event still reaches every
      // co-member who received the online event — no stale "online" states.
      const serverIds = (socket.data.serverIds as string[] | undefined) ?? [];

      const offlinePayload: PresenceOfflinePayload = { userId };
      for (const serverId of serverIds) {
        this.server.to(`presence:server:${serverId}`).emit(PRESENCE_EVENTS.OFFLINE, offlinePayload);
      }
      this.logger.debug(
        `userId=${userId} went offline — notified ${serverIds.length} server room(s)`,
      );
    }
  }

  // -------------------------------------------------------------------------
  // join_channel — subscribe to typing events for a channel
  //
  // Security invariant: canViewChannelById() is re-derived from the DB on
  // every join_channel event — the client is never trusted to self-assert access.
  // This prevents a non-viewer from joining a private channel's typing room.
  // -------------------------------------------------------------------------

  @SubscribeMessage('join_channel')
  async handleJoinChannel(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = TypingStartSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid payload: channelId (UUID) required' });
      return;
    }
    const { channelId } = parsed.data;

    let allowed = false;
    try {
      allowed = await this.rbacService.canViewChannelById(userId, channelId);
    } catch {
      socket.emit('error', { message: 'Internal error checking channel access' });
      return;
    }

    if (!allowed) {
      socket.emit('error', { message: 'Forbidden: cannot view channel' });
      return;
    }

    await socket.join(`presence:channel:${channelId}`);
    this.logger.debug(`${socket.id} joined presence:channel:${channelId}`);
  }

  // -------------------------------------------------------------------------
  // leave_channel — unsubscribe from typing events for a channel
  //
  // No permission re-check needed: leaving is always allowed.
  // -------------------------------------------------------------------------

  @SubscribeMessage('leave_channel')
  async handleLeaveChannel(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = TypingStopSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid payload: channelId (UUID) required' });
      return;
    }
    const { channelId } = parsed.data;

    await socket.leave(`presence:channel:${channelId}`);
    // Clean up any lingering typing state for this user and remove from tracker.
    const typingChannels = socket.data.typingChannels as Set<string> | undefined;
    if (typingChannels) {
      typingChannels.delete(channelId);
    }
    this.presenceService.stopTyping(channelId, userId);
    this.logger.debug(`${socket.id} left presence:channel:${channelId}`);
  }

  // -------------------------------------------------------------------------
  // typing:start — user started typing in a channel
  //
  // Security: canViewChannelById() re-check prevents a non-member from injecting
  // fake typing events even without having joined via join_channel.
  // displayName comes from socket.data.displayName (server-resolved at connect).
  // -------------------------------------------------------------------------

  @SubscribeMessage(PRESENCE_EVENTS.TYPING_START)
  async handleTypingStart(socket: Socket, payload: unknown): Promise<void> {
    const userId = socket.data.userId as string;

    const parsed = TypingStartSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid payload: channelId (UUID) required' });
      return;
    }
    const { channelId } = parsed.data;

    // Re-derive visibility — reject if user cannot view this channel
    let allowed = false;
    try {
      allowed = await this.rbacService.canViewChannelById(userId, channelId);
    } catch {
      socket.emit('error', { message: 'Internal error checking channel access' });
      return;
    }

    if (!allowed) {
      socket.emit('error', { message: 'Forbidden: cannot view channel' });
      return;
    }

    // displayName is server-resolved at connect time (socket.data.displayName)
    const displayName = (socket.data.displayName as string | undefined) ?? userId;

    // H-1: Track that this socket has an active typing entry in this channel.
    // handleDisconnect reads typingChannels to clear ghost typers on tab-close.
    const typingChannels = socket.data.typingChannels as Set<string> | undefined;
    if (typingChannels) {
      typingChannels.add(channelId);
    }

    this.presenceService.startTyping(channelId, userId, displayName, (expiredChannelId) => {
      // TTL expiry callback — re-emit the updated typers list to clear the expired user.
      // Also remove from per-socket tracker since the entry has now expired.
      if (typingChannels) {
        typingChannels.delete(expiredChannelId);
      }
      void this.emitTypingActive(expiredChannelId);
    });

    void this.emitTypingActive(channelId);
  }

  // -------------------------------------------------------------------------
  // typing:stop — user stopped typing in a channel
  // -------------------------------------------------------------------------

  @SubscribeMessage(PRESENCE_EVENTS.TYPING_STOP)
  handleTypingStop(socket: Socket, payload: unknown): void {
    const userId = socket.data.userId as string;

    const parsed = TypingStopSchema.safeParse(payload);
    if (!parsed.success) {
      socket.emit('error', { message: 'Invalid payload: channelId (UUID) required' });
      return;
    }
    const { channelId } = parsed.data;

    // H-1: Remove from per-socket tracker when the user explicitly stops typing.
    const typingChannels = socket.data.typingChannels as Set<string> | undefined;
    if (typingChannels) {
      typingChannels.delete(channelId);
    }

    this.presenceService.stopTyping(channelId, userId);
    void this.emitTypingActive(channelId);
  }

  // -------------------------------------------------------------------------
  // emitTypingActive — emit typing:active to each socket in the channel room
  //
  // Fan-out target: presence:channel:<channelId>
  // Only sockets that passed canViewChannelById() in join_channel are in this
  // room, so all receivers are guaranteed to have channel visibility.
  // Per-recipient exclusion: each socket receives a typers list that excludes
  // only that socket's own userId (read from socket.data.userId), so the actor
  // IS visible to every other viewer while each viewer still self-excludes.
  // -------------------------------------------------------------------------

  private async emitTypingActive(channelId: string): Promise<void> {
    const sockets = await this.server.in(`presence:channel:${channelId}`).fetchSockets();
    for (const s of sockets) {
      const uid = s.data.userId as string;
      s.emit(PRESENCE_EVENTS.TYPING_ACTIVE, {
        channelId,
        typers: this.presenceService.getTypers(channelId, uid),
      });
    }
  }
}
