/**
 * VoiceTokenService unit tests — wave-31 B-2 (Refs d8a85de0)
 *
 * Covers:
 *   - member on a voice channel → 200; decoded JWT has correct sub, video grant, bounded exp
 *   - non-member → ForbiddenException (403)
 *   - missing channel → NotFoundException (404)
 *   - non-voice channel (type='text') → BadRequestException (400)
 *   - creds unset → ServiceUnavailableException (503)
 *
 * Token assertions decode the returned JWT (base64url) — no live LiveKit connection.
 * exp assertion: exp > now AND exp <= now + 2h (not a fixed timestamp — karen note).
 *
 * ESM note: livekit-server-sdk is ESM-only. Vitest runs in a Node environment
 * where dynamic import() works from CommonJS-compiled output; the service's
 * lazy getAccessToken() is exercised directly by the happy-path test.
 */

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
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
  it('member on voice channel → returns token + url; decoded JWT has correct identity, video grant, bounded exp', async () => {
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

    // Video grant — room-scoped, roomJoin, canPublish, canSubscribe
    const video = payload.video as Record<string, unknown>;
    expect(video).toBeDefined();
    expect(video.roomJoin).toBe(true);
    expect(video.room).toBe(CHANNEL_ID);
    expect(video.canPublish).toBe(true);
    expect(video.canSubscribe).toBe(true);

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

  it('missing channel → NotFoundException', async () => {
    // db returns empty array — channel not found
    mockSelect.mockReturnValueOnce(makeSelectChain([]));

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(NotFoundException);
  });

  it('non-voice channel (type=text) → BadRequestException', async () => {
    // db returns a text channel
    mockSelect.mockReturnValueOnce(makeSelectChain([TEXT_CHANNEL]));

    await expect(sut.mintToken(USER_ID, 'chan-text-1')).rejects.toThrow(BadRequestException);
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

  it('RBAC check is NOT called when channel is missing (404 short-circuits before RBAC)', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([]));

    await expect(sut.mintToken(USER_ID, CHANNEL_ID)).rejects.toThrow(NotFoundException);
    expect(mockRbac.canViewChannelById).not.toHaveBeenCalled();
  });

  it('RBAC check is NOT called when channel type is text (400 short-circuits before RBAC)', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([TEXT_CHANNEL]));

    await expect(sut.mintToken(USER_ID, 'chan-text-1')).rejects.toThrow(BadRequestException);
    expect(mockRbac.canViewChannelById).not.toHaveBeenCalled();
  });
});
