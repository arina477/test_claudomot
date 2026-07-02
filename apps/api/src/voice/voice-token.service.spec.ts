/**
 * VoiceTokenService unit tests — wave-31 B-2/B-6 (Refs d8a85de0)
 *
 * Gate order (B-6 security-correct):
 *   1. canViewChannelById (RBAC) → 403 if false — uniform deny (missing + non-member)
 *   2. load channel + type check → 400 if not voice (member-only reachable)
 *   3. env-var guard → 503 if creds unset
 *   4. mint token → { token, url }
 *
 * Covers:
 *   - member on a voice channel → 200; decoded JWT has correct sub, video grant, bounded exp
 *   - non-member → ForbiddenException (403)
 *   - missing channel → ForbiddenException (403) [not 404 — deliberate default-deny]
 *   - non-voice channel (type='text') with MEMBER → BadRequestException (400)
 *   - creds unset → ServiceUnavailableException (503)
 *
 * Token assertions decode the returned JWT (base64url) — no live LiveKit connection.
 * exp assertion: exp > now AND exp <= now + 2h (not a fixed timestamp — karen note).
 *
 * ESM note: livekit-server-sdk is ESM-only. Vitest runs in a Node environment
 * where dynamic import() works from CommonJS-compiled output; the service's
 * lazy getSdk() is exercised directly by the happy-path test.
 */

import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceTokenService } from './voice-token.service';

// ---------------------------------------------------------------------------
// Mock db module — controls channel-load results
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;

// ---------------------------------------------------------------------------
// Helpers: Drizzle select chain mock
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'select']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Helpers: JWT decode (base64url, no verification — unit test only)
// ---------------------------------------------------------------------------

function decodeJwtPayload(token: string): Record<string, unknown> {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Not a JWT');
  const payload = parts[1];
  if (!payload) throw new Error('Missing JWT payload segment');
  // base64url → base64 → Buffer → JSON
  const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
  const json = Buffer.from(base64, 'base64').toString('utf8');
  return JSON.parse(json) as Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VOICE_CHANNEL = { id: 'chan-voice-1', type: 'voice' };
const TEXT_CHANNEL = { id: 'chan-text-1', type: 'text' };
const USER_ID = 'user-abc123';
const CHANNEL_ID = 'chan-voice-1';

// Placeholder key + secret valid for signing (min 32 bytes for HS256)
const TEST_API_KEY = 'devkey';
const TEST_API_SECRET = 'devsecretdevsecretdevsecretdevse'; // 32 chars

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let sut: VoiceTokenService;

// RbacService mock — controlled per-test via canViewResult
let canViewResult = true;
const mockRbac = {
  canViewChannelById: vi.fn(async () => canViewResult),
};

beforeEach(() => {
  vi.clearAllMocks();
  canViewResult = true;

  // Default env — set for each test that needs them; cleared in afterEach
  process.env.LIVEKIT_API_KEY = TEST_API_KEY;
  process.env.LIVEKIT_API_SECRET = TEST_API_SECRET;
  process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

  // Default channel load → voice channel exists
  mockSelect.mockReturnValue(makeSelectChain([VOICE_CHANNEL]));

  sut = new VoiceTokenService(mockRbac as never);
});

afterEach(() => {
  // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
  delete process.env.LIVEKIT_API_KEY;
  // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
  delete process.env.LIVEKIT_API_SECRET;
  // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
  delete process.env.LIVEKIT_URL;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('VoiceTokenService.mintToken', () => {
  it('member on voice channel → returns token + url; decoded JWT has correct identity, video grant, screen-share scope, bounded exp', async () => {
    const result = await sut.mintToken(USER_ID, CHANNEL_ID);

    // Shape check
    expect(result).toHaveProperty('token');
    expect(result).toHaveProperty('url', 'wss://test.livekit.cloud');
    expect(typeof result.token).toBe('string');
    expect(result.token.split('.')).toHaveLength(3); // valid JWT structure

    // Decode JWT without verification
    const payload = decodeJwtPayload(result.token);

    // Identity → userId (JWT `sub` claim)
    expect(payload.sub).toBe(USER_ID);

    // Video grant — room-scoped, roomJoin, canPublish, canSubscribe, widened publish sources
    const video = payload.video as Record<string, unknown>;
    expect(video).toBeDefined();
    expect(video.roomJoin).toBe(true);
    expect(video.room).toBe(CHANNEL_ID);
    expect(video.canPublish).toBe(true);
    expect(video.canSubscribe).toBe(true);
    // Wave-34: canPublishSources widened to include screen_share + screen_share_audio.
    // canPublishSources supersedes canPublish; without SCREEN_SHARE the server rejects
    // a client screen-share publish even when canPublish=true.
    expect(video.canPublishSources).toEqual(['microphone', 'screen_share', 'screen_share_audio']);

    // Expiry — bounded: exp > now AND exp <= now + 2h (not a fixed timestamp)
    const nowSeconds = Math.floor(Date.now() / 1000);
    const exp = payload.exp as number;
    expect(exp).toBeGreaterThan(nowSeconds);
    expect(exp).toBeLessThanOrEqual(nowSeconds + 2 * 3600); // within 2h upper bound
  });

  it('non-member (canViewChannelById → false) → ForbiddenException', async () => {
    canViewResult = false;
    mockRbac.canViewChannelById.mockResolvedValueOnce(false);

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(ForbiddenException);
  });

  it('missing channel → ForbiddenException (403, not 404 — uniform default-deny, no existence leak)', async () => {
    // Gate order: RBAC runs first (returns false for missing channel since it
    // can't find a membership) → 403. The db is never consulted.
    // This matches the ChannelMessageGuard convention.
    canViewResult = false;
    mockRbac.canViewChannelById.mockResolvedValueOnce(false);

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(ForbiddenException);
    // db.select must NOT have been called — RBAC short-circuits before the load
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('non-voice channel (type=text) tested as MEMBER → BadRequestException', async () => {
    // canViewChannelById returns true (member) — the 400 is only reachable by a member.
    // This is the security-correct test: the type-check gate is after RBAC.
    mockSelect.mockReturnValueOnce(makeSelectChain([TEXT_CHANNEL]));

    await expect(sut.mintToken(USER_ID, 'chan-text-1')).rejects.toThrow(BadRequestException);
    expect(mockRbac.canViewChannelById).toHaveBeenCalledWith(USER_ID, 'chan-text-1');
  });

  it('LIVEKIT_API_KEY unset → ServiceUnavailableException', async () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
    delete process.env.LIVEKIT_API_KEY;

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(ServiceUnavailableException);
  });

  it('LIVEKIT_API_SECRET unset → ServiceUnavailableException', async () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
    delete process.env.LIVEKIT_API_SECRET;

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(ServiceUnavailableException);
  });

  it('LIVEKIT_URL unset → ServiceUnavailableException', async () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
    delete process.env.LIVEKIT_URL;

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(ServiceUnavailableException);
  });

  it('RBAC check is called with correct userId and channelId', async () => {
    await sut.mintToken(USER_ID, CHANNEL_ID);

    expect(mockRbac.canViewChannelById).toHaveBeenCalledWith(USER_ID, CHANNEL_ID);
  });

  it('RBAC check is called FIRST — db.select is NOT called when RBAC denies', async () => {
    // Non-member: RBAC denies → 403 before the channel is loaded.
    canViewResult = false;
    mockRbac.canViewChannelById.mockResolvedValueOnce(false);

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(ForbiddenException);
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('db.select IS called after RBAC passes (member on voice channel)', async () => {
    await sut.mintToken(USER_ID, CHANNEL_ID);

    expect(mockRbac.canViewChannelById).toHaveBeenCalledWith(USER_ID, CHANNEL_ID);
    expect(mockSelect).toHaveBeenCalled();
  });

  it('minted grant for a member includes screen_share and screen_share_audio publish sources (wave-34)', async () => {
    // This tests that the grant widening is present so a client screen-share publish
    // is not server-rejected. canPublishSources supersedes canPublish when set.
    const result = await sut.mintToken(USER_ID, CHANNEL_ID);
    const payload = decodeJwtPayload(result.token);
    const video = payload.video as Record<string, unknown>;

    const sources = video.canPublishSources as string[];
    expect(sources).toContain('screen_share');
    expect(sources).toContain('screen_share_audio');
    expect(sources).toContain('microphone');
    // Camera is NOT in the grant (audio + screen-share only; video={false} on client)
    expect(sources).not.toContain('camera');
  });
});
