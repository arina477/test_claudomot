/**
 * VoiceParticipantsService unit tests — wave-32 B-2 (M6 occupancy)
 *
 * Gate order (mirrors VoiceTokenService.mintToken — wave-31 security-correct):
 *   1. canViewChannelById (RBAC) → 403 if false — uniform deny (missing + non-member)
 *   2. load channel + type check → 400 if not voice (member-only reachable)
 *   3. creds guard → 503 if unset (matches VoiceTokenService convention)
 *   4. RoomServiceClient.listParticipants → map identity→display → return
 *      TwirpError (absent room) → { count: 0, participants: [] }
 *
 * Covers:
 *   - member on voice channel with participants → 200 mapped list
 *   - non-member → ForbiddenException (403); RBAC checked BEFORE channel load
 *   - missing channel (RBAC returns false) → ForbiddenException (403); db NOT queried
 *   - non-voice channel (type='text') with MEMBER → BadRequestException (400)
 *   - empty room (no participants in list) → { count: 0, participants: [] }
 *   - absent room (TwirpError from RoomServiceClient) → { count: 0, participants: [] }
 *   - null display_name → fallback to email-localpart
 *   - empty-string display_name → fallback to email-localpart (|| not ??)
 *   - null display_name + no email → fallback to userId
 *   - LIVEKIT creds unset → ServiceUnavailableException (503)
 *   - RBAC check is called FIRST (non-member: db.select + RoomServiceClient NOT called)
 *
 * RoomServiceClient is fully mocked — no live LiveKit connection.
 * TwirpError cases use a subclass whose instances have constructor.name === 'TwirpError'.
 */

import {
  BadRequestException,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VoiceParticipantsService } from './voice-participants.service';

// ---------------------------------------------------------------------------
// Mock livekit-server-sdk — RoomServiceClient only; AccessToken not needed here
// ---------------------------------------------------------------------------

const mockListParticipants = vi.fn();
const MockRoomServiceClient = vi.fn().mockImplementation(() => ({
  listParticipants: mockListParticipants,
}));

vi.mock('livekit-server-sdk', () => ({
  RoomServiceClient: MockRoomServiceClient,
}));

// ---------------------------------------------------------------------------
// Mock db module — controls channel-load and user-lookup results
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

/**
 * Build a thenable Drizzle query chain that resolves with `resolveWith`.
 * Each chain is a self-contained object — safe to use with mockReturnValueOnce.
 */
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

/**
 * Configure db.select for the two sequential calls made by listParticipants:
 *   call 1 → channel row
 *   call 2 → user batch rows
 *
 * Uses mockReturnValueOnce twice so each call consumes exactly one queued value.
 * Must be called after vi.clearAllMocks() (which resets the queue).
 */
function setupDbFor(channelRow: unknown, userRows: unknown[]): void {
  mockSelect
    .mockReturnValueOnce(makeSelectChain([channelRow]))
    .mockReturnValueOnce(makeSelectChain(userRows));
}

// ---------------------------------------------------------------------------
// TwirpError mock class — constructor.name === 'TwirpError' via prototype
// ---------------------------------------------------------------------------

class TwirpError extends Error {
  constructor(message = 'not_found') {
    super(message);
    this.name = 'TwirpError';
  }
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VOICE_CHANNEL = { id: 'chan-voice-1', type: 'voice' };
const TEXT_CHANNEL = { id: 'chan-text-1', type: 'text' };
const USER_ID = 'user-abc123';
const CHANNEL_ID = 'chan-voice-1';

const PARTICIPANT_A = { identity: 'user-abc123' };
const PARTICIPANT_B = { identity: 'user-xyz789' };

const USER_A = { id: 'user-abc123', display_name: 'Alice', email: 'alice@example.com' };
const USER_B = { id: 'user-xyz789', display_name: 'Bob', email: 'bob@example.com' };

// ---------------------------------------------------------------------------
// Setup — default: voice channel, two users, two participants
// ---------------------------------------------------------------------------

let sut: VoiceParticipantsService;

const mockRbac = {
  canViewChannelById: vi.fn().mockResolvedValue(true),
};

beforeEach(() => {
  // resetAllMocks clears call history AND the mockReturnValueOnce queue — prevents
  // unconsumed queued values from leaking between tests. Implementations are also
  // reset, so we re-apply them below.
  vi.resetAllMocks();

  // Restore mock implementations after reset
  mockRbac.canViewChannelById.mockResolvedValue(true);
  MockRoomServiceClient.mockImplementation(() => ({ listParticipants: mockListParticipants }));

  process.env.LIVEKIT_API_KEY = 'devkey';
  process.env.LIVEKIT_API_SECRET = 'devsecretdevsecretdevsecretdevse';
  process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';

  // Default: voice channel + two matched user rows
  setupDbFor(VOICE_CHANNEL, [USER_A, USER_B]);

  // Default: two participants in room
  mockListParticipants.mockResolvedValue([PARTICIPANT_A, PARTICIPANT_B]);

  sut = new VoiceParticipantsService(mockRbac as never);
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

describe('VoiceParticipantsService.listParticipants', () => {
  // ── Happy path ──────────────────────────────────────────────────────────────

  it('member on voice channel with participants → mapped list with count', async () => {
    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result.count).toBe(2);
    expect(result.participants).toHaveLength(2);
    expect(result.participants).toContainEqual({ userId: 'user-abc123', displayName: 'Alice' });
    expect(result.participants).toContainEqual({ userId: 'user-xyz789', displayName: 'Bob' });
  });

  // ── Gate order: RBAC FIRST ──────────────────────────────────────────────────

  it('non-member → ForbiddenException (403)', async () => {
    mockRbac.canViewChannelById.mockResolvedValueOnce(false);

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow(ForbiddenException);
  });

  it('non-member/missing channel → RBAC denies → db.select NOT called (uniform 403, no existence leak)', async () => {
    mockRbac.canViewChannelById.mockResolvedValueOnce(false);

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow(ForbiddenException);
    // db.select must NOT be called — RBAC short-circuits before any channel load
    expect(mockSelect).not.toHaveBeenCalled();
  });

  it('non-member → RoomServiceClient is NOT called (RBAC short-circuits first)', async () => {
    mockRbac.canViewChannelById.mockResolvedValueOnce(false);

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow(ForbiddenException);
    expect(mockListParticipants).not.toHaveBeenCalled();
  });

  it('RBAC check is called with correct userId and channelId', async () => {
    await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(mockRbac.canViewChannelById).toHaveBeenCalledWith(USER_ID, CHANNEL_ID);
  });

  // ── Channel type guard ──────────────────────────────────────────────────────

  it('non-voice channel (type=text) with MEMBER → BadRequestException (400)', async () => {
    // Override the first db call: return a text channel instead of voice channel.
    // The second queued call (user batch) is irrelevant — 400 is thrown before it.
    // We must rebuild the queue since beforeEach already staged [voiceChannel, users].
    // Solution: clear the mock queue and re-stage with text channel first.
    mockSelect.mockReset();
    mockSelect.mockReturnValueOnce(makeSelectChain([TEXT_CHANNEL]));
    // (second call / user batch is never reached — 400 thrown before that)

    await expect(sut.listParticipants(USER_ID, 'chan-text-1')).rejects.toThrow(BadRequestException);
    expect(mockRbac.canViewChannelById).toHaveBeenCalledWith(USER_ID, 'chan-text-1');
  });

  // ── Empty / absent room ─────────────────────────────────────────────────────

  it('empty room (no participants returned by LiveKit) → { count: 0, participants: [] }', async () => {
    mockListParticipants.mockResolvedValueOnce([]);

    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result).toEqual({ count: 0, participants: [] });
  });

  it('absent room — TwirpError from RoomServiceClient → { count: 0, participants: [] }', async () => {
    // TwirpError subclass: constructor.name === 'TwirpError' via prototype chain.
    // isTwirpError() reads err.constructor.name — this evaluates to 'TwirpError'.
    mockListParticipants.mockRejectedValueOnce(new TwirpError('not_found'));

    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result).toEqual({ count: 0, participants: [] });
  });

  it('non-TwirpError from RoomServiceClient re-throws (not swallowed)', async () => {
    const networkErr = new Error('network failure');
    mockListParticipants.mockRejectedValueOnce(networkErr);

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow('network failure');
  });

  // ── Display name fallback chain ─────────────────────────────────────────────

  it('null display_name → falls back to email localpart', async () => {
    const userNoName = { id: 'user-abc123', display_name: null, email: 'alice@example.com' };
    mockSelect.mockReset();
    setupDbFor(VOICE_CHANNEL, [userNoName]);
    mockListParticipants.mockResolvedValueOnce([PARTICIPANT_A]);

    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result.participants[0]).toEqual({ userId: 'user-abc123', displayName: 'alice' });
  });

  it('empty-string display_name → falls back to email localpart (|| not ??)', async () => {
    // P-4/karen carry: `||` ensures '' falls through; `??` would NOT (null/undefined only).
    const userEmptyName = { id: 'user-abc123', display_name: '', email: 'alice@example.com' };
    mockSelect.mockReset();
    setupDbFor(VOICE_CHANNEL, [userEmptyName]);
    mockListParticipants.mockResolvedValueOnce([PARTICIPANT_A]);

    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result.participants[0]).toEqual({ userId: 'user-abc123', displayName: 'alice' });
  });

  it('null display_name + no email → falls back to userId', async () => {
    const userNoData = { id: 'user-abc123', display_name: null, email: null };
    mockSelect.mockReset();
    setupDbFor(VOICE_CHANNEL, [userNoData]);
    mockListParticipants.mockResolvedValueOnce([PARTICIPANT_A]);

    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result.participants[0]).toEqual({ userId: 'user-abc123', displayName: 'user-abc123' });
  });

  it('user not found in DB → falls back to userId (unknown participant)', async () => {
    // Participant identity present in LiveKit room, but user row is missing from DB.
    mockSelect.mockReset();
    setupDbFor(VOICE_CHANNEL, []); // empty user batch
    mockListParticipants.mockResolvedValueOnce([PARTICIPANT_A]);

    const result = await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(result.participants[0]).toEqual({ userId: 'user-abc123', displayName: 'user-abc123' });
  });

  // ── Creds guard ─────────────────────────────────────────────────────────────

  it('LIVEKIT_API_KEY unset → ServiceUnavailableException (503)', async () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
    delete process.env.LIVEKIT_API_KEY;

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('LIVEKIT_API_SECRET unset → ServiceUnavailableException (503)', async () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
    delete process.env.LIVEKIT_API_SECRET;

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  it('LIVEKIT_URL unset → ServiceUnavailableException (503)', async () => {
    // biome-ignore lint/performance/noDelete: process.env requires delete to truly unset — assigning undefined sets the string "undefined"
    delete process.env.LIVEKIT_URL;

    await expect(sut.listParticipants(USER_ID, CHANNEL_ID)).rejects.toThrow(
      ServiceUnavailableException,
    );
  });

  // ── RoomServiceClient construction ──────────────────────────────────────────

  it('RoomServiceClient is constructed with explicit host/apiKey/secret from env', async () => {
    await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(MockRoomServiceClient).toHaveBeenCalledWith(
      'wss://test.livekit.cloud',
      'devkey',
      'devsecretdevsecretdevsecretdevse',
    );
  });

  it('listParticipants is called with channelId as room name', async () => {
    await sut.listParticipants(USER_ID, CHANNEL_ID);

    expect(mockListParticipants).toHaveBeenCalledWith(CHANNEL_ID);
  });
});
