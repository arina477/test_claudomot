import {
  BadRequestException,
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { MessageList, MessageResponse } from '@studyhall/shared';
import { SendMessageSchema } from '@studyhall/shared';
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
 *
 * Routes (bare-path, no /api/v1 prefix):
 *   POST /channels/:channelId/messages  — send a message
 *   GET  /channels/:channelId/messages  — list messages (cursor pagination)
 *
 * Security:
 *   - @UseGuards(AuthGuard, ChannelMessageGuard) — both routes.
 *   - author_id derived from req.session.getUserId() — NEVER from body.
 *   - channelId from route param — IDOR-safe.
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
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ): Promise<MessageList> {
    return await this.messagesService.listMessages(channelId, cursor, limit);
  }
}
