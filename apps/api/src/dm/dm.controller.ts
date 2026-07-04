/**
 * DmController — wave-46 M8 direct messages (tasks a48f1910 + 32f5d29e)
 *
 * Routes:
 *   POST /dm/conversations                        — create a new conversation
 *   GET  /dm/conversations                        — list caller's conversations
 *   POST /dm/conversations/:id/messages           — send a message (participant-gated)
 *   GET  /dm/conversations/:id/messages?cursor=   — list messages (participant-gated, cursor)
 *
 * Security:
 *   - All routes @UseGuards(AuthGuard) — session required.
 *   - :id routes additionally use @UseGuards(DmParticipantGuard).
 *   - callerId derived from req.session.getUserId() — NEVER from body or params.
 */

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
import type {
  DmConversation,
  DmConversationListResponse,
  DmMessage,
  DmMessageListResponse,
} from '@studyhall/shared';
import { CreateConversationSchema, SendDmMessageSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
import { DmParticipantGuard } from './dm-participant.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { DmService } from './dm.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('dm/conversations')
export class DmController {
  constructor(private readonly dmService: DmService) {}

  // -------------------------------------------------------------------------
  // POST /dm/conversations
  //
  // Body: CreateConversationSchema (participantIds 1..9; creator auto-added)
  // Enforces who_can_dm for every target; any rejection → 403 whole-create.
  // Returns: 200 DmConversation
  // -------------------------------------------------------------------------

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async createConversation(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<DmConversation> {
    const parsed = CreateConversationSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerId = req.session.getUserId();
    return await this.dmService.createConversation(callerId, parsed.data);
  }

  // -------------------------------------------------------------------------
  // GET /dm/conversations
  //
  // Returns conversations where caller is a participant, ordered by
  // last-message recency. Empty → 200 [].
  // -------------------------------------------------------------------------

  @Get()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async listConversations(
    @Req() req: SessionAugmentedRequest,
  ): Promise<DmConversationListResponse> {
    const callerId = req.session.getUserId();
    return await this.dmService.listConversations(callerId);
  }

  // -------------------------------------------------------------------------
  // POST /dm/conversations/:id/messages
  //
  // Body: SendDmMessageSchema (content, idempotencyKey)
  // Caller MUST be a participant (DmParticipantGuard — 404 non-leak).
  // Idempotent: repeat (conversationId, idempotencyKey) returns same message.
  // Returns: 200 DmMessage
  // -------------------------------------------------------------------------

  @Post(':id/messages')
  @UseGuards(AuthGuard, DmParticipantGuard)
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Param('id') conversationId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<DmMessage> {
    const parsed = SendDmMessageSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerId = req.session.getUserId();
    return await this.dmService.sendMessage(conversationId, callerId, parsed.data);
  }

  // -------------------------------------------------------------------------
  // GET /dm/conversations/:id/messages?cursor=&limit=
  //
  // Caller MUST be a participant (DmParticipantGuard — 404 non-leak).
  // Cursor-paginated ASC (oldest→newest). Returns DmMessageListResponse.
  // -------------------------------------------------------------------------

  @Get(':id/messages')
  @UseGuards(AuthGuard, DmParticipantGuard)
  @HttpCode(HttpStatus.OK)
  async listMessages(
    @Param('id') conversationId: string,
    @Req() req: SessionAugmentedRequest,
    @Query('cursor') cursor?: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit = 50,
  ): Promise<DmMessageListResponse> {
    const callerId = req.session.getUserId();
    return await this.dmService.listMessages(conversationId, callerId, cursor, limit);
  }
}
