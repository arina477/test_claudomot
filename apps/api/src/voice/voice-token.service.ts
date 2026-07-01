/**
 * VoiceTokenService — B-2 LiveKit token-mint (wave-31, Refs d8a85de0)
 *
 * Mints a short-lived LiveKit access token for a voice channel after:
 *   1. RBAC canViewChannelById → 403 if false (uniform deny: covers missing + non-member).
 *   2. Load channel (now known-viewable) → check type === 'voice' → 400 if not.
 *   3. Confirming LIVEKIT_URL / API key / API secret are configured (503 otherwise).
 *   4. Mint token → return { token, url }.
 *
 * Gate order rationale (B-6 security fix, wave-31):
 *   The RBAC check is FIRST so a non-member (or missing channel) gets a uniform 403
 *   with zero existence/type signal — matches ChannelMessageGuard convention.
 *   A member on a non-voice channel gets 400 (type error only reachable by a member).
 *   Note: a missing channel now returns 403 (not 404) — deliberate default-deny;
 *   the old 404-for-missing spec is superseded by this security-correct behaviour.
 *   Flag for L-1 spec reconciliation.
 *
 * Token is room-scoped (room = channelId), identity = userId, TTL = 1h.
 * Grant is audio-first: canPublishSources = [TrackSource.MICROPHONE] only.
 *
 * ESM note: livekit-server-sdk v2.x is ESM-only. This file compiles under
 * "module": "CommonJS" (NestJS default tsconfig), so the module is loaded
 * via a lazy dynamic import(). The in-flight Promise is memoized so concurrent
 * first-calls share one import; an import throw maps to 503.
 *
 * Security invariants:
 *   - LIVEKIT_API_SECRET never leaves this service.
 *   - Token is never minted before the RBAC check passes.
 *   - Token grant is scoped to the specific room (channelId).
 *   - canPublishSources restricts publish to microphone only (audio-first).
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
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
  // Memoized in-flight Promise for the ESM module load.
  // Storing the Promise (not just the resolved value) ensures concurrent first-calls
  // share one import rather than racing into multiple dynamic import() calls.
  private _sdkPromise: Promise<typeof import('livekit-server-sdk')> | null = null;

  constructor(private readonly rbacService: RbacService) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Lazy-load livekit-server-sdk (ESM-only).
   * The Promise is memoized on first call; an import failure maps to 503.
   */
  private getSdk(): Promise<typeof import('livekit-server-sdk')> {
    if (!this._sdkPromise) {
      this._sdkPromise = import('livekit-server-sdk').catch((err: unknown) => {
        // Reset so a future call can retry after a transient failure.
        this._sdkPromise = null;
        throw new ServiceUnavailableException(
          `Voice unavailable: SDK load failed — ${err instanceof Error ? err.message : String(err)}`,
        );
      });
    }
    return this._sdkPromise;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Mint a LiveKit access token for `userId` to join the voice channel `channelId`.
   *
   * Gate order (B-6 security-correct, wave-31):
   *   1. RBAC canViewChannelById → 403 if false (uniform: covers missing + non-member).
   *   2. Load channel + type check → 400 if not voice (member-only reachable).
   *   3. Env-var guard → 503 if LIVEKIT_URL / key / secret unset.
   *   4. Mint token → return { token, url }.
   */
  async mintToken(userId: string, channelId: string): Promise<VoiceTokenResult> {
    // ── Step 1: RBAC check (FIRST — uniform 403 for missing + non-member) ────
    // This matches the ChannelMessageGuard convention: default-deny with no
    // existence or type signal to non-members.
    const canView = await this.rbacService.canViewChannelById(userId, channelId);
    if (!canView) {
      throw new ForbiddenException('Insufficient permissions to join this voice channel');
    }

    // ── Step 2: load channel + voice-channel discriminator ────────────────────
    // Channel is now known-viewable. Load to confirm it is a voice channel.
    const [channel] = await db
      .select({ id: channels.id, type: channels.type })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel || channel.type !== 'voice') {
      throw new BadRequestException('Voice tokens can only be issued for voice channels');
    }

    // ── Step 3: env-var guard ─────────────────────────────────────────────────
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new ServiceUnavailableException('Voice service is not configured');
    }

    // ── Step 4: mint token ────────────────────────────────────────────────────
    const { AccessToken, TrackSource } = await this.getSdk();

    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId, // maps LiveKit participant → StudyHall user (JWT `sub` claim)
      ttl: '1h', // bounded TTL — prevents indefinite token reuse
    });

    at.addGrant({
      roomJoin: true,
      room: channelId, // scoped to this channel only — prevents cross-room joins
      canPublish: true,
      // Audio-first: restrict publish to microphone only. canPublishSources supersedes
      // canPublish when set — camera and screen-share are excluded from this token.
      canPublishSources: [TrackSource.MICROPHONE],
      canSubscribe: true,
    });

    // toJwt() is ASYNC in livekit-server-sdk v2.x — must await (karen build-note).
    // Omitting await would return a Promise object, causing silent client auth failures.
    const token = await at.toJwt();

    return { token, url: livekitUrl };
  }
}
