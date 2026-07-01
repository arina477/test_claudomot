/**
 * VoiceParticipantsService — B-2 LiveKit room occupancy (wave-32, M6)
 *
 * Returns the current participants in a LiveKit voice room after:
 *   1. RBAC canViewChannelById → 403 if false (uniform deny: covers missing + non-member).
 *      SAME gate order as VoiceTokenService.mintToken (wave-31 security fix).
 *   2. Load channel (now known-viewable) → check type === 'voice' → 400 if not.
 *   3. LIVEKIT creds guard → 503 if unset (matches wave-31 convention).
 *   4. RoomServiceClient.listParticipants(channelId) → map identity→display.
 *      Empty/absent room (TwirpError) → { count: 0, participants: [] }.
 *
 * Gate order rationale (inherited from wave-31 B-6 security fix):
 *   The RBAC check is FIRST so a non-member (or missing channel) gets a uniform 403
 *   with zero existence/type signal — matches ChannelMessageGuard convention.
 *   A member on a non-voice channel gets 400 (type error only reachable by a member).
 *
 * Display-name fallback: `display_name || email-localpart || userId`.
 *   Uses `||` NOT `??` so an empty string display_name falls through (P-4/karen carry).
 *
 * identity=userId convention from wave-31:
 *   Each ParticipantInfo.identity equals the StudyHall userId set at token-mint
 *   (voice-token.service.ts:127 — identity = userId). We map it back here.
 *
 * Batched user lookup (avoid N+1):
 *   Gather all identities, run one query WHERE id IN (...) for the full set.
 *
 * RoomServiceClient notes:
 *   - Does NOT read env vars (gotcha #3 in livekit.md) — explicit host/key/secret required.
 *   - ESM-only (like AccessToken) — loaded via the same memoized dynamic import() pattern.
 *   - Throws TwirpError when the room doesn't exist yet (gotcha #11) — caught here → empty.
 *
 * Security invariants:
 *   - LIVEKIT_API_SECRET never leaves this service.
 *   - RBAC check runs BEFORE any channel load or LiveKit API call.
 *   - RoomServiceClient is server-side only (apps/api); never imported in apps/web.
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { db } from '../db/index';
import { channels, users } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// Response DTOs (inline — no shared type per spec contracts)
// ---------------------------------------------------------------------------

export interface VoiceParticipantDto {
  userId: string;
  displayName: string;
}

export interface VoiceParticipantsResult {
  count: number;
  participants: VoiceParticipantDto[];
}

// ---------------------------------------------------------------------------
// TwirpError type guard — catches absent-room errors from RoomServiceClient
// ---------------------------------------------------------------------------

/**
 * TwirpError is the error class thrown by RoomServiceClient (livekit-server-sdk ≥ 2.10.0).
 * We catch it to handle the "room not found" case (nobody has joined yet).
 * We check by class name to avoid importing the type into the error-handling path.
 */
function isTwirpError(err: unknown): boolean {
  if (typeof err !== 'object' || err === null) return false;
  const ctor = (err as { constructor?: { name?: string } }).constructor;
  return ctor?.name === 'TwirpError';
}

@Injectable()
export class VoiceParticipantsService {
  // Memoized in-flight Promise for the ESM module load.
  // Same pattern as VoiceTokenService.getSdk() — concurrent first-calls share one import.
  private _sdkPromise: Promise<typeof import('livekit-server-sdk')> | null = null;

  constructor(private readonly rbacService: RbacService) {}

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Lazy-load livekit-server-sdk (ESM-only).
   * Memoized on first call; import failure maps to 503.
   */
  private getSdk(): Promise<typeof import('livekit-server-sdk')> {
    if (!this._sdkPromise) {
      this._sdkPromise = import('livekit-server-sdk').catch((err: unknown) => {
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
   * List current participants in the LiveKit room for `channelId`.
   *
   * Gate order (mirrors VoiceTokenService.mintToken — wave-31 security-correct):
   *   1. RBAC canViewChannelById → 403 if false (uniform: covers missing + non-member).
   *   2. Load channel + type check → 400 if not voice (member-only reachable).
   *   3. Creds guard → 503 if LIVEKIT_URL / key / secret unset.
   *   4. RoomServiceClient.listParticipants → map identity→display → return.
   *      TwirpError (absent room) → { count: 0, participants: [] }.
   */
  async listParticipants(userId: string, channelId: string): Promise<VoiceParticipantsResult> {
    // ── Step 1: RBAC check (FIRST — uniform 403 for missing + non-member) ────
    const canView = await this.rbacService.canViewChannelById(userId, channelId);
    if (!canView) {
      throw new ForbiddenException('Insufficient permissions to view this voice channel');
    }

    // ── Step 2: load channel + voice-channel discriminator ────────────────────
    // Channel is now known-viewable. Confirm it is a voice channel.
    const [channel] = await db
      .select({ id: channels.id, type: channels.type })
      .from(channels)
      .where(eq(channels.id, channelId))
      .limit(1);

    if (!channel || channel.type !== 'voice') {
      throw new BadRequestException('Participants can only be listed for voice channels');
    }

    // ── Step 3: creds guard ───────────────────────────────────────────────────
    // Read env vars directly — matches wave-31 VoiceTokenService convention.
    // RoomServiceClient requires explicit args; it does NOT read env vars (gotcha #3).
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new ServiceUnavailableException('Voice service is not configured');
    }

    // ── Step 4: list participants via RoomServiceClient ───────────────────────
    const { RoomServiceClient } = await this.getSdk();

    // Explicit host/apiKey/secret — RoomServiceClient has NO env var fallback.
    const roomClient = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    let participantInfos: Awaited<ReturnType<typeof roomClient.listParticipants>>;
    try {
      participantInfos = await roomClient.listParticipants(channelId);
    } catch (err: unknown) {
      // TwirpError: room does not exist yet (nobody has joined) → return empty.
      // Per gotcha #11: TwirpError replaced LivekitError in server SDK v2.10.0+.
      if (isTwirpError(err)) {
        return { count: 0, participants: [] };
      }
      // Any other error re-throws — not our job to swallow unknown failures.
      throw err;
    }

    if (participantInfos.length === 0) {
      return { count: 0, participants: [] };
    }

    // ── Step 5: batch user lookup (avoid N+1) ────────────────────────────────
    // ParticipantInfo.identity === userId (set at mint in voice-token.service.ts:127).
    const identities = participantInfos.map((p) => p.identity);

    const userRows = await db
      .select({ id: users.id, display_name: users.display_name, email: users.email })
      .from(users)
      .where(inArray(users.id, identities));

    // Build identity → user row map for O(1) lookup.
    const userMap = new Map(userRows.map((u) => [u.id, u]));

    // ── Step 6: map identities → display names ───────────────────────────────
    // Fallback chain uses `||` NOT `??`:
    //   display_name || email-localpart || userId
    // An empty-string display_name must fall through (P-4/karen carry).
    const participants: VoiceParticipantDto[] = participantInfos.map((p) => {
      const user = userMap.get(p.identity);
      const displayName =
        user?.display_name || (user?.email ? user.email.split('@')[0] : null) || p.identity; // userId is the identity (fallback)

      return { userId: p.identity, displayName };
    });

    return { count: participants.length, participants };
  }
}
