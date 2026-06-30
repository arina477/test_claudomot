/**
 * MessagingGateway — Socket.IO /messaging namespace
 *
 * Security boundary: WS-upgrade auth is handled by the shared helper at
 * `common/ws-auth.ts` (installWsAuthMiddleware). See that file for the full
 * auth flow rationale (SuperTokens session + email-verification claim).
 *
 * Room naming: 'channel:<channelId>' — room membership is gated by
 * canViewChannelById() at join_channel time (server-side re-derivation, not
 * client-trusted).
 *
 * Fan-out: @OnEvent('message.created') emits only to the specific channel room —
 * NEVER broadcast-all. Single-pod in-memory adapter (no Redis).
 */

import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { MentionEvent, MessageResponse } from '@studyhall/shared';
import type { Server, Socket } from 'socket.io';
import { installWsAuthMiddleware } from '../common/ws-auth';
// biome-ignore lint/style/useImportType: value import required — emitDecoratorMetadata needs the runtime symbol for NestJS DI
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// Payload shapes for socket events
// ---------------------------------------------------------------------------

interface JoinChannelPayload {
  channelId: string;
}

interface LeaveChannelPayload {
  channelId: string;
}

// Reaction event payload emitted by MessagesService
interface ReactionEventPayload {
  messageId: string;
  channelId: string;
  userId: string;
  emoji: string;
}

// ---------------------------------------------------------------------------
// Gateway
// ---------------------------------------------------------------------------

@WebSocketGateway({
  namespace: '/messaging',
  cors: {
    origin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  },
})
export class MessagingGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagingGateway.name);

  constructor(private readonly rbacService: RbacService) {}

  // -------------------------------------------------------------------------
  // afterInit — attach Socket.IO io.use() middleware for WS-upgrade auth.
  //
  // This is the canonical NestJS pattern: afterInit receives the raw socket.io
  // Server instance (not the NestJS adapter), so server.use() is the real
  // io.use() middleware that runs per-connection before any event handlers.
  // -------------------------------------------------------------------------

  afterInit(server: Server): void {
    // Delegate to the shared WS-upgrade auth helper (common/ws-auth.ts).
    // Installs io.use() middleware: extracts sAccessToken cookie (+ auth.accessToken
    // fallback), verifies SuperTokens session, asserts email-verified, sets
    // socket.data.userId. Behavior is identical to the original inline implementation.
    installWsAuthMiddleware(server);
  }

  // -------------------------------------------------------------------------
  // handleConnection — called after io.use() passes.
  //
  // By the time handleConnection fires, socket.data.userId is guaranteed to
  // be set (io.use() rejects before this if auth failed).
  // -------------------------------------------------------------------------

  handleConnection(socket: Socket): void {
    const userId = socket.data.userId as string;
    this.logger.debug(`Client connected: ${socket.id} userId=${userId}`);

    // Per-user room — every authenticated socket joins 'user:<userId>' immediately
    // after the auth middleware passes.  This room is used exclusively for
    // targeted server-to-client pushes (e.g. mention events) that must reach
    // the user regardless of which channel they are currently viewing.
    //
    // This is a room, NOT a namespace — honors the spec constraint "no new
    // namespace".  Room membership requires no client action; the server joins
    // the socket automatically on connection.  Clients cannot spoof other users'
    // rooms because userId is derived from the verified SuperTokens session
    // (socket.data.userId set by installWsAuthMiddleware).
    void socket.join(`user:${userId}`);
  }

  // -------------------------------------------------------------------------
  // join_channel — join the room for a channel after server-side access check.
  //
  // Security invariant: canViewChannelById() is re-derived from the DB on every
  // join_channel event — the client is never trusted to self-assert access.
  // -------------------------------------------------------------------------

  @SubscribeMessage('join_channel')
  async handleJoinChannel(socket: Socket, payload: JoinChannelPayload): Promise<void> {
    const { channelId } = payload;
    const userId = socket.data.userId as string;

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

    await socket.join(`channel:${channelId}`);
    this.logger.debug(`${socket.id} joined channel:${channelId}`);
  }

  // -------------------------------------------------------------------------
  // leave_channel — leave the room for a channel. No permission check needed
  // (a user should always be able to stop receiving messages for a channel).
  // -------------------------------------------------------------------------

  @SubscribeMessage('leave_channel')
  async handleLeaveChannel(socket: Socket, payload: LeaveChannelPayload): Promise<void> {
    const { channelId } = payload;
    await socket.leave(`channel:${channelId}`);
    this.logger.debug(`${socket.id} left channel:${channelId}`);
  }

  // -------------------------------------------------------------------------
  // message.created → fan-out to channel room
  //
  // @OnEvent fires from EventEmitter2 (MessagesService emits after DB insert).
  // Fan-out is ONLY to 'channel:<channelId>' room — never broadcast-all.
  // Single-pod in-memory adapter: no Redis pub/sub.
  // -------------------------------------------------------------------------

  @OnEvent('message.created')
  handleMessageCreated(message: MessageResponse): void {
    this.server.to(`channel:${message.channelId}`).emit('message:new', message);
    this.logger.debug(`Fanned out message ${message.id} to channel:${message.channelId}`);
  }

  // -------------------------------------------------------------------------
  // message.updated → fan-out to channel room (wave-13 edit)
  //
  // Emitted by MessagesService.editMessage() after DB update.
  // Room-only fan-out: same pattern as message.created.
  // -------------------------------------------------------------------------

  @OnEvent('message.updated')
  handleMessageUpdated(message: MessageResponse): void {
    this.server.to(`channel:${message.channelId}`).emit('message:updated', message);
    this.logger.debug(`Fanned out message.updated ${message.id} to channel:${message.channelId}`);
  }

  // -------------------------------------------------------------------------
  // message.deleted → fan-out to channel room (wave-13 soft-delete)
  //
  // Emitted by MessagesService.deleteMessage() after soft-delete.
  // Payload has content: null (tombstone), is_deleted: true.
  // Room-only fan-out: same pattern as message.created.
  // -------------------------------------------------------------------------

  @OnEvent('message.deleted')
  handleMessageDeleted(message: MessageResponse): void {
    this.server.to(`channel:${message.channelId}`).emit('message:deleted', message);
    this.logger.debug(`Fanned out message.deleted ${message.id} to channel:${message.channelId}`);
  }

  // -------------------------------------------------------------------------
  // reaction.added → fan-out to channel room (wave-13 reactions)
  //
  // Emitted by MessagesService.toggleReaction() when reaction is added.
  // Room-only fan-out to the message's channel.
  // -------------------------------------------------------------------------

  @OnEvent('reaction.added')
  handleReactionAdded(payload: ReactionEventPayload): void {
    this.server.to(`channel:${payload.channelId}`).emit('reaction:added', payload);
    this.logger.debug(
      `Fanned out reaction.added emoji=${payload.emoji} msg=${payload.messageId} channel=${payload.channelId}`,
    );
  }

  // -------------------------------------------------------------------------
  // reaction.removed → fan-out to channel room (wave-13 reactions)
  //
  // Emitted by MessagesService.toggleReaction() when reaction is removed.
  // Room-only fan-out to the message's channel.
  // -------------------------------------------------------------------------

  @OnEvent('reaction.removed')
  handleReactionRemoved(payload: ReactionEventPayload): void {
    this.server.to(`channel:${payload.channelId}`).emit('reaction:removed', payload);
    this.logger.debug(
      `Fanned out reaction.removed emoji=${payload.emoji} msg=${payload.messageId} channel=${payload.channelId}`,
    );
  }

  // -------------------------------------------------------------------------
  // mention.created → fan-out to each mentioned user's per-user room
  //
  // @OnEvent fires from EventEmitter2 (MessagesService emits after persisting
  // mention rows in createMessage).  One event is emitted per mentioned user
  // (not one broadcast with all recipients) so each user's 'user:<id>' room
  // receives only their own MentionEvent.
  //
  // The author is excluded server-side — MessagesService does NOT emit a
  // mention.created event when the sole mentioned user is the author.
  //
  // This handler is intentionally separate from handleMessageCreated so the
  // cross-channel signal is decoupled from the in-channel fan-out and the
  // client can handle them independently.
  // -------------------------------------------------------------------------

  @OnEvent('mention.created')
  handleMentionCreated(payload: MentionEvent): void {
    this.server.to(`user:${payload.mentionedUserId}`).emit('mention', payload);
    this.logger.debug(
      `Pushed mention event to user:${payload.mentionedUserId} for msg=${payload.messageId} channel=${payload.channelId}`,
    );
  }
}
