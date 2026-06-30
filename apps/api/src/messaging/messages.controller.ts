import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  MessageList,
  MessageResponse,
  MessagesAfterResponse,
  MyMentionsResponse,
  ReactionToggleResponse,
  ThreadRepliesResponse,
} from '@studyhall/shared';
import { EditMessageSchema, ReactionToggleSchema, SendMessageSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
import { ChannelMessageGuard } from '../rbac/channel-message.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { MessagesService } from './messages.service';

// Minimal interface for the ST-augmented request
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

/**
 * MessagesController — wave-12 M3 REST data plane (task a0c322b4)
 *                    + wave-13 edit/delete/reactions (tasks e12886d7 + d78df376)
 *                    + wave-18 thread replies (task 497c2ae6)
 *
 * Routes (bare-path, no /api/v1 prefix):
 *   POST   /channels/:channelId/messages                          — send a message
 *   GET    /channels/:channelId/messages                          — list messages (cursor pagination)
 *   PATCH  /channels/:channelId/messages/:messageId               — edit a message (author-only)
 *   DELETE /channels/:channelId/messages/:messageId               — delete a message (author || manage_channels)
 *   POST   /channels/:channelId/messages/:messageId/reactions      — toggle a reaction
 *
 * ThreadsController routes (separate controller, /messages prefix):
 *   POST   /messages/:parentId/replies                            — create a reply in a thread
 *   GET    /messages/:parentId/replies                            — list replies (cursor, ASC)
 *
 * Security:
 *   - @UseGuards(AuthGuard, ChannelMessageGuard) — all MessagesController routes.
 *   - @UseGuards(AuthGuard) — ThreadsController routes. ChannelMessageGuard cannot
 *     be applied here because the route has no :channelId path param. Instead,
 *     the service calls rbacService.canViewChannelById() using the channelId derived
 *     from the PARENT message row — never from the query param directly (IDOR-safe).
 *   - author_id derived from req.session.getUserId() — NEVER from body.
 *   - channelId from route param — IDOR-safe.
 *   - Delete authz (author || manage_channels) resolved in service after
 *     looking up channel.server_id — never from request.
 */
@Controller('channels/:channelId/messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Post()
  @UseGuards(AuthGuard, ChannelMessageGuard)
  @HttpCode(HttpStatus.CREATED)
  async sendMessage(
    @Param('channelId') channelId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<MessageResponse> {
    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    // author_id is ALWAYS from session — never from body (no sender spoofing)
    const authorId = req.session.getUserId();

    return await this.messagesService.createMessage(channelId, authorId, parsed.data);
  }

  // ---------------------------------------------------------------------------
  // GET /channels/:channelId/messages
  //
  // Two dispatch modes determined by query params (same path, same guard):
  //
  // 1. Backward list (existing): ?cursor=<cursor>&limit=   — DESC oldest-before
  //    Returns MessageList { messages: [], nextCursor }
  //
  // 2. Forward catch-up (wave-20 M4 task 92d85e0e): ?after=<cursor>&limit=
  //    Returns MessagesAfterResponse { items: [], nextCursor? }
  //    ASC oldest-first — forward keyset for offline reconnect.
  //    Malformed after cursor → 400. Non-member → 403 (ChannelMessageGuard).
  //
  // When BOTH cursor and after are absent → backward list (first page, DESC).
  // When after is present → forward catch-up (takes precedence over cursor).
  //
  // Auth: ChannelMessageGuard on both paths.
  // ---------------------------------------------------------------------------

  @Get()
  @UseGuards(AuthGuard, ChannelMessageGuard)
  @HttpCode(HttpStatus.OK)
  async listMessages(
    @Param('channelId') channelId: string,
    @Req() req: SessionAugmentedRequest,
    @Query('cursor') cursor?: string,
    @Query('after') after?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ): Promise<MessageList | MessagesAfterResponse> {
    const viewerUserId = req.session.getUserId();

    // Forward catch-up path — ?after= takes precedence
    if (after !== undefined) {
      return await this.messagesService.listMessagesAfter(channelId, viewerUserId, after, limit);
    }

    // Backward list path — existing behaviour unchanged
    return await this.messagesService.listMessages(channelId, viewerUserId, cursor, limit);
  }

  // ---------------------------------------------------------------------------
  // PATCH /channels/:channelId/messages/:messageId
  // Edit a message — AUTHOR ONLY.
  // Security: userId from session; service enforces author_id === userId.
  // ---------------------------------------------------------------------------

  @Patch(':messageId')
  @UseGuards(AuthGuard, ChannelMessageGuard)
  @HttpCode(HttpStatus.OK)
  async editMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<MessageResponse> {
    const parsed = EditMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();

    return await this.messagesService.editMessage(
      channelId,
      messageId,
      userId,
      parsed.data.content,
    );
  }

  // ---------------------------------------------------------------------------
  // DELETE /channels/:channelId/messages/:messageId
  // Soft-delete — author OR manage_channels (moderator).
  // Security: userId from session; service resolves serverId from channel
  // before calling rbacService.can().
  // ---------------------------------------------------------------------------

  @Delete(':messageId')
  @UseGuards(AuthGuard, ChannelMessageGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMessage(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<void> {
    const userId = req.session.getUserId();
    await this.messagesService.deleteMessage(channelId, messageId, userId);
  }

  // ---------------------------------------------------------------------------
  // POST /channels/:channelId/messages/:messageId/reactions
  // Toggle a reaction — idempotent (on → off on second call).
  // Security: userId from session; emoji from body.
  // ---------------------------------------------------------------------------

  @Post(':messageId/reactions')
  @UseGuards(AuthGuard, ChannelMessageGuard)
  @HttpCode(HttpStatus.OK)
  async toggleReaction(
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ReactionToggleResponse> {
    const parsed = ReactionToggleSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();

    return await this.messagesService.toggleReaction(
      channelId,
      messageId,
      userId,
      parsed.data.emoji,
    );
  }
}

// ---------------------------------------------------------------------------
// MentionsController — /me/mentions
//
// Route: GET /me/mentions?cursor=&limit=
//
// Returns the authenticated user's mentioned messages, most-recent-first,
// cursor-paginated. Response shape: MyMentionsResponse.
//
// Security:
//   - @UseGuards(AuthGuard) — session required, 401 if unauthed.
//   - viewerUserId is ALWAYS from req.session.getUserId() — NEVER from a
//     query/body param. The service re-enforces this (mentioned_user_id = viewerUserId).
//   - A user CANNOT read another user's mention feed.
// ---------------------------------------------------------------------------

@Controller('me')
export class MentionsController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * GET /me/mentions
   *
   * Query params:
   *   cursor? — opaque pagination cursor (base64url encoded createdAt|id)
   *   limit?  — max items per page (default 50, max 100)
   *
   * Returns: MyMentionsResponse { items: MessageResponse[], nextCursor: string | null }
   * Status: 200 OK
   * Errors: 401 (unauthenticated)
   */
  @Get('mentions')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async getMyMentions(
    @Req() req: SessionAugmentedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ): Promise<MyMentionsResponse> {
    // userId derived from session ONLY — never a request param
    const viewerUserId = req.session.getUserId();
    return await this.messagesService.getMyMentions(viewerUserId, cursor, limit);
  }
}

// ---------------------------------------------------------------------------
// ThreadsController — /messages/:parentId/replies
//
// Routes:
//   POST   /messages/:parentId/replies?channelId=   — create a reply
//   GET    /messages/:parentId/replies?cursor=&limit= — list replies (ASC)
//
// Security:
//   - @UseGuards(AuthGuard) — session required.
//   - channelId is supplied as a query param on POST for cross-channel validation
//     only; it is validated against the parent row, NOT used as the authz source.
//   - Channel membership is enforced in the service via canViewChannelById()
//     using the channelId from the PARENT message row (wave-18 B-6 IDOR fix).
//   - author_id is ALWAYS from req.session.getUserId() — never from body.
//
// Design rationale for channelId as query param on POST:
//   The spec allows either a nested route under /channels/:channelId or a
//   standalone /messages/:parentId/replies route. We chose the standalone form
//   (/messages/:parentId/replies) with channelId as a required query param so
//   the service can enforce the cross-channel invariant. ChannelMessageGuard
//   cannot be applied (it keys off :channelId route param, absent here); the
//   service enforces membership via rbacService.canViewChannelById() on the
//   parent's channel_id — the query param cannot bypass it (B-6 IDOR fix).
// ---------------------------------------------------------------------------

@Controller('messages')
export class ThreadsController {
  constructor(private readonly messagesService: MessagesService) {}

  /**
   * POST /messages/:parentId/replies?channelId=<channelId>
   *
   * Body: { content: string, idempotencyKey?: string }
   * Query: channelId (required — used for cross-channel validation)
   *
   * Returns: MessageResponse (the reply DTO, 201 Created)
   * Errors: 400 (validation), 401 (unauthed), 404 (parent not found),
   *         400 (cross-channel / reply-of-reply), 409 (parent deleted)
   */
  @Post(':parentId/replies')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createReply(
    @Param('parentId') parentId: string,
    @Query('channelId') channelId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<MessageResponse> {
    if (!channelId) {
      throw new BadRequestException('channelId query param is required');
    }

    const parsed = SendMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    // authorId ALWAYS from session — never from body (no sender spoofing)
    const authorId = req.session.getUserId();

    return await this.messagesService.createReply(channelId, parentId, authorId, parsed.data);
  }

  /**
   * GET /messages/:parentId/replies?cursor=&limit=
   *
   * Returns replies for the thread, oldest-first, cursor-paginated.
   * Excludes soft-deleted (tombstoned) replies.
   *
   * Returns: ThreadRepliesResponse { items: MessageResponse[], nextCursor?: string | null }
   * Status: 200 OK
   * Errors: 401 (unauthed), 404 (parent not found)
   */
  @Get(':parentId/replies')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async listThreadReplies(
    @Param('parentId') parentId: string,
    @Req() req: SessionAugmentedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ): Promise<ThreadRepliesResponse> {
    const viewerUserId = req.session.getUserId();
    return await this.messagesService.listThreadReplies(parentId, viewerUserId, cursor, limit);
  }
}
