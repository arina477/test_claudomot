/**
 * MessagingGateway — Socket.IO /messaging namespace
 *
 * Security boundary: this gateway is part of the WS-upgrade auth security
 * boundary. It calls supertokens-node Session recipe directly (not via AuthModule)
 * because:
 *   - AuthModule wraps REST-style verifySession() which requires Request/Response objects.
 *   - WS upgrade auth must run in io.use() middleware (afterInit hook) with no HTTP req/res.
 *   - The Session recipe's getSessionWithoutRequestResponse() is the documented SDK API
 *     for non-HTTP transports (including WebSocket).
 *
 * Auth flow at handshake (upgrade):
 *   1. Extract `sAccessToken` from handshake cookie header (primary — browser sends
 *      httpOnly cookies on WS upgrade from same-site contexts).
 *   2. Fall back to `socket.handshake.auth.accessToken` (client-passed — for cross-origin
 *      where cookie credentials may be blocked or for native clients).
 *   3. Call Session.getSessionWithoutRequestResponse(accessToken, undefined) — no CSRF
 *      risk on WS upgrade (not a browser form-submittable request; token is the primary
 *      auth signal, and the upgrade handshake is a one-time authenticated upgrade, not
 *      a simple-method cross-site form).
 *   4. Validate the email-verification claim via session.assertClaims(). The REST message
 *      routes also enforce this via AuthGuard → verifySession(REQUIRED), but we enforce
 *      it here too as defence-in-depth so an unverified user cannot even hold a socket.
 *   5. Attach socket.data.userId = session.getUserId() for downstream event handlers.
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
import type { MessageResponse } from '@studyhall/shared';
import { parse as parseCookie } from 'cookie';
import type { Server, Socket } from 'socket.io';
import EmailVerification from 'supertokens-node/recipe/emailverification';
import Session from 'supertokens-node/recipe/session';
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
    server.use(async (socket, next) => {
      try {
        // --- 1. Extract access token ---

        // Primary: parse sAccessToken from handshake cookie header.
        // SuperTokens stores the access token as an httpOnly cookie named
        // 'sAccessToken'. Browsers send cookies automatically on WS upgrade
        // from a same-origin or credentialed cross-origin context.
        let accessToken: string | undefined;

        const cookieHeader = socket.handshake.headers.cookie;
        if (cookieHeader) {
          const parsed = parseCookie(cookieHeader);
          accessToken = parsed.sAccessToken;
        }

        // Fallback: client-passed token (for cross-origin contexts where cookies
        // may be blocked, or for native / non-browser clients).
        if (!accessToken) {
          const auth = socket.handshake.auth as Record<string, unknown>;
          if (typeof auth.accessToken === 'string' && auth.accessToken.length > 0) {
            accessToken = auth.accessToken;
          }
        }

        if (!accessToken) {
          next(new Error('Unauthorized'));
          return;
        }

        // --- 2. Verify session ---
        //
        // antiCsrfToken is undefined: no CSRF risk on WS upgrade (the upgrade
        // is a one-time authenticated handshake, not a form-submittable request).
        const session = await Session.getSessionWithoutRequestResponse(accessToken, undefined);

        // --- 3. Validate email-verification claim ---
        //
        // assertClaims throws a SuperTokensError if the claim is not satisfied,
        // which we catch below and convert to next(new Error('Unauthorized')).
        await session.assertClaims([
          EmailVerification.EmailVerificationClaim.validators.isVerified(),
        ]);

        // --- 4. Attach userId to socket.data ---
        socket.data.userId = session.getUserId();

        next();
      } catch {
        // Any SuperTokensError (invalid/expired token, claim failure) or
        // unexpected error → reject the connection.
        next(new Error('Unauthorized'));
      }
    });
  }

  // -------------------------------------------------------------------------
  // handleConnection — called after io.use() passes.
  //
  // By the time handleConnection fires, socket.data.userId is guaranteed to
  // be set (io.use() rejects before this if auth failed).
  // -------------------------------------------------------------------------

  handleConnection(socket: Socket): void {
    this.logger.debug(`Client connected: ${socket.id} userId=${socket.data.userId as string}`);
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
}
