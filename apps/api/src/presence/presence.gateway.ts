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

  // ── Per-user presence-broadcast serialization (wave-80 B-6 F2) ─────────────
  // The connect-time online broadcast and onShowPresenceChanged both decide the
  // co-member-visible online/offline state for a user. Without serialization a
  // new tab connecting can read a pre-commit show_presence=true and broadcast
  // presence:online for a user who is concurrently toggling OFF, and the
  // toggle's fetchSockets() snapshot may miss the still-connecting socket —
  // leaving co-members seeing a hidden user online. We chain both critical
  // sections through a per-user promise so they run strictly one-at-a-time, and
  // each finishes with a reconciling re-check against the authoritative DB flag.
  private readonly presenceBroadcastLocks = new Map<string, Promise<void>>();

  /**
   * Run `fn` under a per-user mutex so presence-broadcast decisions for one user
   * never interleave. Serialized against every other call for the SAME userId.
   */
  private withPresenceLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const prev = this.presenceBroadcastLocks.get(userId) ?? Promise.resolve();
    const run = prev.then(fn, fn);
    // Keep the tail promise (void, never rejects) so the next waiter chains cleanly.
    const tail = run.then(
      () => undefined,
      () => undefined,
    );
    this.presenceBroadcastLocks.set(userId, tail);
    // Best-effort GC: drop the entry once this is the last queued op.
    void tail.then(() => {
      if (this.presenceBroadcastLocks.get(userId) === tail) {
        this.presenceBroadcastLocks.delete(userId);
      }
    });
    return run;
  }

  /**
   * Reconciling re-check (wave-80 B-6 F2): re-read the authoritative
   * show_presence flag; if the user is currently hidden but may have been
   * broadcast online to co-members (e.g. by a raced connect), emit a corrective
   * presence:offline so NO co-member is left seeing a hidden user online.
   * Audience is the UNION of the user's live sockets' cached serverIds (H-1b) —
   * exactly the rooms that could have received the online broadcast.
   */
  private async reconcileHiddenUser(userId: string): Promise<void> {
    let authoritative: boolean;
    try {
      authoritative = await this.presenceService.getShowPresence(userId);
    } catch (err) {
      this.logger.warn(
        `reconcileHiddenUser: failed to read show_presence for userId=${userId}`,
        err,
      );
      return;
    }
    // Only reconcile the hidden case — a visible user online is the correct state.
    if (authoritative) return;
    if (!this.presenceService.isOnline(userId)) return;

    const serverIds = await this.liveServerIdsForUser(userId);
    const offlinePayload: PresenceOfflinePayload = { userId };
    for (const serverId of serverIds) {
      this.server.to(`presence:server:${serverId}`).emit(PRESENCE_EVENTS.OFFLINE, offlinePayload);
    }
    this.logger.debug(
      `reconcileHiddenUser: userId=${userId} is hidden — emitted corrective offline to ${serverIds.length} room(s)`,
    );
  }

  /**
   * UNION of the user's live sockets' cached socket.data.serverIds (wave-80 B-6
   * F3). This is the exact audience that received the online broadcasts — it
   * matches the H-1b disconnect invariant (membership changes mid-session must
   * NOT change the audience). Falls back to the empty set if fetchSockets fails.
   */
  private async liveServerIdsForUser(userId: string): Promise<string[]> {
    const union = new Set<string>();
    try {
      const sockets = await this.server.fetchSockets();
      for (const s of sockets) {
        if (s.data.userId !== userId) continue;
        const ids = (s.data.serverIds as string[] | undefined) ?? [];
        for (const id of ids) union.add(id);
      }
    } catch (err) {
      this.logger.warn(`liveServerIdsForUser: fetchSockets failed for userId=${userId}`, err);
    }
    return Array.from(union);
  }

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

    // 1. Resolve and cache displayName + show_presence server-side (never client-provided).
    //    show_presence is cached on socket.data (mirror of displayName/serverIds) so
    //    handleDisconnect can gate the offline emit WITHOUT a disconnect-time DB query.
    //    Defaults: displayName → email-prefix/userId; show_presence → true (visible).
    let showPresence = true;
    try {
      const [userRow] = await db
        .select({
          display_name: users.display_name,
          email: users.email,
          show_presence: users.show_presence,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      // Fall back to email prefix if display_name is not set
      const displayName = userRow?.display_name || userRow?.email?.split('@')[0] || userId;
      socket.data.displayName = displayName;
      showPresence = userRow?.show_presence ?? true;
    } catch {
      socket.data.displayName = userId;
    }
    socket.data.showPresence = showPresence;

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

    // 4. Emit presence:snapshot to the joining socket with co-members' current states.
    //    Honor (wave-80): EXCLUDE co-members whose show_presence=false. The subject-set
    //    is the CO-MEMBERS' flags (a batch lookup keyed on co-member ids) — NOT the
    //    connecting user's flag (a hidden user still SEES visible co-members). So a new
    //    peer connecting while a co-member is hidden does not see that co-member online.
    try {
      const coMemberIds = await this.presenceService.getCoMemberUserIds(userId);
      const showPresenceByUser = await this.presenceService.getShowPresenceBatch(coMemberIds);
      const members: PresenceState[] = coMemberIds.map((uid) => {
        // A co-member with show_presence=false is reported as offline (hidden) in
        // the snapshot regardless of their actual in-memory online state.
        const visible = showPresenceByUser.get(uid) ?? true;
        const online = visible && this.presenceService.isOnline(uid);
        return { userId: uid, status: online ? 'online' : 'offline' };
      });
      const snapshot: PresenceSnapshot = { members };
      socket.emit(PRESENCE_EVENTS.SNAPSHOT, snapshot);
    } catch (err) {
      this.logger.error(`Failed to build snapshot for userId=${userId}`, err);
      // Non-fatal: socket stays connected; client can re-connect to retry
    }

    // 5. If first socket for this user, broadcast presence:online to co-member rooms.
    //    Honor (wave-80): a user with show_presence=false is EXCLUDED from the online
    //    broadcast — co-members never learn they came online.
    //
    //    F2 (wave-80 B-6): the online broadcast + a reconciling re-check run under
    //    the per-user presence lock, serialized against a concurrent toggle's
    //    onShowPresenceChanged. `showPresence` read at connect (step 1) may be a
    //    pre-commit value if a toggle-OFF committed mid-connect; after the online
    //    emit we re-read the authoritative flag and, if the user is now hidden,
    //    emit a corrective offline so co-members are never left seeing them online.
    if (wentOnline && showPresence) {
      await this.withPresenceLock(userId, async () => {
        const onlinePayload: PresenceOnlinePayload = { userId };
        for (const serverId of serverIds) {
          // socket.to() excludes this socket — co-members only
          socket.to(`presence:server:${serverId}`).emit(PRESENCE_EVENTS.ONLINE, onlinePayload);
        }
        this.logger.debug(
          `userId=${userId} came online — notified ${serverIds.length} server room(s)`,
        );
        // Close the connect-vs-toggle window: if a toggle-OFF committed while this
        // connect was in flight, undo the online we just (possibly wrongly) sent.
        await this.reconcileHiddenUser(userId);
      });
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

    // Honor (wave-80): a user with show_presence=false never emitted online, so
    // they must not emit offline either. The flag is read from socket.data
    // (cached at connect) — handleDisconnect runs NO DB query. Default true if
    // somehow unset so existing behaviour is unchanged.
    const showPresence = (socket.data.showPresence as boolean | undefined) ?? true;

    if (wentOffline && showPresence) {
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
  // onShowPresenceChanged — PROACTIVE toggle-time presence emit (wave-80)
  //
  // The real AC-2 mechanism. Presence is in-memory ref-counted and only emits
  // on connect/disconnect; the privacy toggle only writes the DB. So a user who
  // is ALREADY online when they flip show_presence would not update a watching
  // co-member without this proactive emit.
  //
  // Called by PrivacyService AFTER a successful show_presence change:
  //   on → hidden (visible=false): emit presence:offline for the user
  //   hidden → on (visible=true):  emit presence:online for the user
  //
  // No-op when the user is not currently connected (nothing to update — the
  // next connect will honor the new flag passively). Uses the same fresh
  // serverIds resolution as the connect path so the audience matches.
  // -------------------------------------------------------------------------

  async onShowPresenceChanged(userId: string, visible: boolean): Promise<void> {
    // Serialize against the connect-time online broadcast (F2). Running the whole
    // toggle emit under the per-user lock guarantees a raced connect either (a)
    // ran fully before us — so its socket is in fetchSockets() when we hide, and
    // our offline reaches its rooms — or (b) runs after us and its own
    // reconcileHiddenUser() will re-read the now-committed hidden flag and undo
    // its online. Either ordering leaves NO co-member seeing a hidden user online.
    return this.withPresenceLock(userId, async () => {
      // Keep every live socket's cached flag in sync so a subsequent disconnect
      // gates on the CURRENT value (handleDisconnect reads socket.data.showPresence).
      // Reuse the same fetchSockets() pass to build the F3 audience union below.
      const audience = new Set<string>();
      try {
        const sockets = await this.server.fetchSockets();
        for (const s of sockets) {
          if (s.data.userId !== userId) continue;
          s.data.showPresence = visible;
          const ids = (s.data.serverIds as string[] | undefined) ?? [];
          for (const id of ids) audience.add(id);
        }
      } catch (err) {
        this.logger.warn(`Failed to sync cached show_presence for userId=${userId}`, err);
      }

      // Only proactively emit if the user is currently online. An offline user
      // has no "online" state for co-members to update — the flag applies on next
      // connect via the passive gate.
      if (!this.presenceService.isOnline(userId)) return;

      // F3 (wave-80 B-6): fan out to the UNION of the user's LIVE sockets' cached
      // socket.data.serverIds — the audience that actually received the online
      // broadcasts — NOT a fresh DB query. This matches the H-1b disconnect
      // invariant: a server joined mid-session (fresh-DB) would get a phantom
      // offline; a server left mid-session would miss the hide. The cached union
      // avoids both.
      const serverIds = Array.from(audience);

      // online/offline payloads are the same shape ({ userId }); only the event
      // constant and the log verb differ between un-hide and hide.
      const event = visible ? PRESENCE_EVENTS.ONLINE : PRESENCE_EVENTS.OFFLINE;
      const payload: PresenceOnlinePayload | PresenceOfflinePayload = { userId };
      for (const serverId of serverIds) {
        this.server.to(`presence:server:${serverId}`).emit(event, payload);
      }
      this.logger.debug(
        `userId=${userId} ${visible ? 'un-hid' : 'hid'} presence — broadcast ${event} to ${serverIds.length} room(s)`,
      );

      // F2: after a hide settles, reconcile against the authoritative flag so a
      // connect that raced this toggle cannot leave a stale online behind.
      if (!visible) {
        await this.reconcileHiddenUser(userId);
      }
    });
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
