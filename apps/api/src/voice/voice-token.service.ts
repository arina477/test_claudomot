/**
 * VoiceTokenService — B-2 LiveKit token-mint (wave-31, Refs d8a85de0)
 *
 * Mints a short-lived LiveKit access token for a voice channel after:
 *   1. Confirming the channel exists (404 if missing).
 *   2. Confirming the channel type is 'voice' (400 otherwise).
 *   3. Confirming the caller has view-permission via RBAC (403 otherwise).
 *   4. Confirming LIVEKIT_URL / API key / API secret are configured (503 otherwise).
 *
 * Token is room-scoped (room = channelId), identity = userId, TTL = 1h.
 *
 * ESM note: livekit-server-sdk v2.x is ESM-only. This file compiles under
 * "module": "CommonJS" (NestJS default tsconfig), so AccessToken is loaded
 * via a lazy dynamic import() cached after the first call.
 *
 * Security invariants:
 *   - LIVEKIT_API_SECRET never leaves this service.
 *   - Token is never minted before the RBAC check passes.
 *   - Token grant is scoped to the specific room (channelId).
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { db } from '../db/index';
import { channels } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

export interface VoiceTokenResult {
  token: string;
  url: string;
}

@Injectable()
export class VoiceTokenService {
  // Cached AccessToken constructor — loaded once via dynamic import() on first mint.
  // Using a lazy cache avoids the cost of re-importing the ESM module on every request.
  private _AccessToken: typeof import('livekit-server-sdk')['AccessToken'] | null = null;

  constructor(private readonly rbacService: RbacService) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /** Lazy-load AccessToken from the ESM-only livekit-server-sdk. */
  private async getAccessToken(): Promise<typeof import('livekit-server-sdk')['AccessToken']> {
    if (!this._AccessToken) {
      const mod = await import('livekit-server-sdk');
      this._AccessToken = mod.AccessToken;
    }
    return this._AccessToken;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Mint a LiveKit access token for `userId` to join the voice channel `channelId`.
   *
   * Gate order (spec d8a85de0):
   *   1. Load channel → 404 if missing.
   *   2. channel.type !== 'voice' → 400.
   *   3. RBAC canViewChannelById → 403 if false.
   *   4. Env-var guard → 503 if LIVEKIT_URL / key / secret unset.
   *   5. Mint token → return { token, url }.
   */
  async mintToken(userId: string, channelId: string): Promise<VoiceTokenResult> {
    // ── Step 1: load channel ──────────────────────────────────────────────────
    const [channel] = await db
      .select({ id: channels.id, type: channels.type })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel) {
      throw new NotFoundException(`Channel ${channelId} not found`);
    }

    // ── Step 2: voice-channel discriminator ───────────────────────────────────
    if (channel.type !== 'voice') {
      throw new BadRequestException('Voice tokens can only be issued for voice channels');
    }

    // ── Step 3: RBAC check ────────────────────────────────────────────────────
    const canView = await this.rbacService.canViewChannelById(userId, channelId);
    if (!canView) {
      throw new ForbiddenException('Insufficient permissions to join this voice channel');
    }

    // ── Step 4: env-var guard ─────────────────────────────────────────────────
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new ServiceUnavailableException('Voice service is not configured');
    }

    // ── Step 5: mint token ────────────────────────────────────────────────────
    const AccessToken = await this.getAccessToken();

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId, // maps LiveKit participant → StudyHall user (JWT `sub` claim)
      ttl: '1h', // bounded TTL — prevents indefinite token reuse
    });

    at.addGrant({
      roomJoin: true,
      room: channelId, // scoped to this channel only — prevents cross-room joins
      canPublish: true,
      canSubscribe: true,
    });

    // toJwt() is ASYNC in livekit-server-sdk v2.x — must await (karen build-note).
    // Omitting await would return a Promise object, causing silent client auth failures.
    const token = await at.toJwt();

    return { token, url: livekitUrl };
  }
}
