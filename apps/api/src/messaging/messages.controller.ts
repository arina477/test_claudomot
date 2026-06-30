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
import type { MessageList, MessageResponse, ReactionToggleResponse } from '@studyhall/shared';
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
 *
 * Routes (bare-path, no /api/v1 prefix):
 *   POST   /channels/:channelId/messages                          — send a message
 *   GET    /channels/:channelId/messages                          — list messages (cursor pagination)
 *   PATCH  /channels/:channelId/messages/:messageId               — edit a message (author-only)
 *   DELETE /channels/:channelId/messages/:messageId               — delete a message (author || manage_channels)
 *   POST   /channels/:channelId/messages/:messageId/reactions      — toggle a reaction
 *
 * Security:
 *   - @UseGuards(AuthGuard, ChannelMessageGuard) — all routes.
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

  @Get()
  @UseGuards(AuthGuard, ChannelMessageGuard)
  @HttpCode(HttpStatus.OK)
  async listMessages(
    @Param('channelId') channelId: string,
    @Req() req: SessionAugmentedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ): Promise<MessageList> {
    const viewerUserId = req.session.getUserId();
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
