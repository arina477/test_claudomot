/**
 * VoiceTokenController — B-2 LiveKit token-mint (wave-31, Refs d8a85de0)
 *
 * Route: POST /channels/:channelId/voice/token
 *
 * No request body — channelId comes from route params only (IDOR-safe).
 * The caller identity comes from the SuperTokens session (set by AuthGuard).
 * Token mint + RBAC check are delegated to VoiceTokenService.
 */

import { Controller, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { VoiceTokenService } from './voice-token.service';
import type { VoiceTokenResult } from './voice-token.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('channels')
export class VoiceTokenController {
  constructor(private readonly voiceTokenService: VoiceTokenService) {}

  /**
   * POST /channels/:channelId/voice/token
   *
   * Returns { token: string, url: string } — the LiveKit JWT and wss:// URL
   * the client needs to connect to the voice room.
   *
   * 200 — token issued
   * 400 — channel is not a voice channel
   * 401 — unauthenticated (AuthGuard / SuperTokens)
   * 403 — authenticated but not a channel member, OR channel does not exist
   *       (uniform default-deny: a missing channel returns 403, never 404, so
   *        non-members get zero existence signal — matches ChannelMessageGuard)
   * 503 — LIVEKIT_URL / key / secret not configured
   */
  @Post(':channelId/voice/token')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async issueVoiceToken(
    @Req() req: SessionAugmentedRequest,
    @Param('channelId') channelId: string,
  ): Promise<VoiceTokenResult> {
    const userId = req.session.getUserId();
    return this.voiceTokenService.mintToken(userId, channelId);
  }
}
