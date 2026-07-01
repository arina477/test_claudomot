/**
 * VoiceParticipantsController — B-2 LiveKit room occupancy (wave-32, M6)
 *
 * Route: GET /channels/:channelId/voice/participants
 *
 * No request body — channelId comes from route params only (IDOR-safe).
 * The caller identity comes from the SuperTokens session (set by AuthGuard).
 * RBAC check + LiveKit query are delegated to VoiceParticipantsService.
 */

import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { VoiceParticipantsService } from './voice-participants.service';
import type { VoiceParticipantsResult } from './voice-participants.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('channels')
export class VoiceParticipantsController {
  constructor(private readonly voiceParticipantsService: VoiceParticipantsService) {}

  /**
   * GET /channels/:channelId/voice/participants
   *
   * Returns { count: number, participants: [{ userId, displayName }] } — current
   * participants in the LiveKit room for the given voice channel.
   *
   * 200 — participant list (may be empty if room not yet created / nobody joined)
   * 400 — channel is not a voice channel
   * 401 — unauthenticated (AuthGuard / SuperTokens)
   * 403 — authenticated but not a channel member, OR channel does not exist
   *       (uniform default-deny: a missing channel returns 403, never 404, so
   *        non-members get zero existence signal — matches ChannelMessageGuard)
   * 503 — LIVEKIT_URL / key / secret not configured
   */
  @Get(':channelId/voice/participants')
  @UseGuards(AuthGuard)
  async listVoiceParticipants(
    @Req() req: SessionAugmentedRequest,
    @Param('channelId') channelId: string,
  ): Promise<VoiceParticipantsResult> {
    const userId = req.session.getUserId();
    return this.voiceParticipantsService.listParticipants(userId, channelId);
  }
}
