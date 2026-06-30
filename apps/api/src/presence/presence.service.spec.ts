/**
 * PresenceService unit tests — wave-14 presence layer (T-2 coverage)
 *
 * Covers:
 *   Presence ref-count (multi-tab core):
 *    1. connect() on a fresh user → wentOnline=true AND isOnline===true (0→1)
 *    2. connect() second socket → wentOnline=false AND isOnline still true
 *    3. disconnect() one of two sockets → wentOffline=false AND isOnline still true
 *    4. disconnect() last socket → wentOffline=true AND isOnline===false (→0)
 *    5. disconnect() unknown user → wentOffline=false, no throw
 *    6. isOnline() on a never-connected user → false
 *
 *   Typing TTL / throttle (vi.useFakeTimers()):
 *    7. startTyping then getTypers includes the typer
 *    8. getTypers excludes self (excludeUserId)
 *    9. After TYPING_TTL_MS (5000ms) the onExpiry callback fires AND typer removed
 *   10. startTyping twice within TTL: only one entry, timer reset (no double-count)
 *   11. stopTyping removes user immediately AND cancels timer (no double-fire after TTL)
 *   12. stopTyping on unknown/empty channel is a no-op (no throw)
 *
 *   Co-member resolution (mock drizzle db):
 *   13. getCoMemberUserIds returns OTHER users de-duplicated, excluding self
 *   14. getCoMemberUserIds when user belongs to no servers returns [] (early return)
 *   15. getServerIdsForUser returns the distinct server_id list from mocked rows
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PresenceService } from './presence.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers (same pattern as messages.service.spec.ts)
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'orderBy', 'select']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Mock db module (same boundary as messages.service.spec.ts)
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_A = 'user-aaaa-0000-0000-0000-000000000001';
const USER_B = 'user-bbbb-0000-0000-0000-000000000002';
const USER_C = 'user-cccc-0000-0000-0000-000000000003';
const SOCKET_1 = 'socket-0001';
const SOCKET_2 = 'socket-0002';
const CHANNEL_ID = 'ch-1111-0000-0000-0000-000000000001';
const SERVER_A = 'server-aaaa-0000-0000-0000-000000000001';
const SERVER_B = 'server-bbbb-0000-0000-0000-000000000002';

// ---------------------------------------------------------------------------
// Tests: presence ref-count
// ---------------------------------------------------------------------------

describe('PresenceService — presence ref-count', () => {
  let service: PresenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PresenceService();
  });

  it('connect() on a fresh user returns wentOnline=true AND isOnline===true (0→1)', () => {
    const { wentOnline } = service.connect(USER_A, SOCKET_1);

    expect(wentOnline).toBe(true);
    expect(service.isOnline(USER_A)).toBe(true);
  });

  it('connect() second socket for already-online user returns wentOnline=false AND isOnline still true (2 tabs)', () => {
    service.connect(USER_A, SOCKET_1); // first tab

    const { wentOnline } = service.connect(USER_A, SOCKET_2); // second tab

    expect(wentOnline).toBe(false); // no transition event — already online
    expect(service.isOnline(USER_A)).toBe(true);
  });

  it('disconnect() one of two sockets returns wentOffline=false AND isOnline still true (tab 1 of 2 closed)', () => {
    service.connect(USER_A, SOCKET_1);
    service.connect(USER_A, SOCKET_2);

    const { wentOffline } = service.disconnect(USER_A, SOCKET_1);

    expect(wentOffline).toBe(false); // still has SOCKET_2
    expect(service.isOnline(USER_A)).toBe(true);
  });

  it('disconnect() last remaining socket returns wentOffline=true AND isOnline===false (→0 offline)', () => {
    service.connect(USER_A, SOCKET_1);
    service.connect(USER_A, SOCKET_2);
    service.disconnect(USER_A, SOCKET_1); // remove first

    const { wentOffline } = service.disconnect(USER_A, SOCKET_2); // remove last

    expect(wentOffline).toBe(true);
    expect(service.isOnline(USER_A)).toBe(false);
  });

  it('disconnect() on an unknown (never-connected) user returns wentOffline=false and does not throw', () => {
    expect(() => {
      const result = service.disconnect('unknown-user', SOCKET_1);
      expect(result.wentOffline).toBe(false);
    }).not.toThrow();
  });

  it('isOnline() on a never-connected user returns false', () => {
    expect(service.isOnline('never-connected-user')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tests: typing TTL / throttle
// ---------------------------------------------------------------------------

describe('PresenceService — typing TTL / throttle', () => {
  let service: PresenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    service = new PresenceService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('startTyping then getTypers(channel, otherUser) includes {userId, displayName}', () => {
    const onExpiry = vi.fn();
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', onExpiry);

    const typers = service.getTypers(CHANNEL_ID, USER_B); // request from a different user

    expect(typers).toHaveLength(1);
    expect(typers[0]).toEqual({ userId: USER_A, displayName: 'Alice' });
  });

  it('getTypers(channel, selfUser) EXCLUDES self (the excludeUserId parameter)', () => {
    const onExpiry = vi.fn();
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', onExpiry);

    // USER_A requests typers for their own channel — they must be excluded
    const typers = service.getTypers(CHANNEL_ID, USER_A);

    expect(typers).toHaveLength(0);
    expect(typers.find((t) => t.userId === USER_A)).toBeUndefined();
  });

  it('after TYPING_TTL_MS (5000ms) the onExpiry callback fires AND getTypers no longer includes the user', () => {
    const onExpiry = vi.fn();
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', onExpiry);

    // Typer present before TTL
    expect(service.getTypers(CHANNEL_ID, USER_B)).toHaveLength(1);

    // Advance time past the 5s TTL
    vi.advanceTimersByTime(5_000);

    // Callback must have fired
    expect(onExpiry).toHaveBeenCalledOnce();
    expect(onExpiry).toHaveBeenCalledWith(CHANNEL_ID);

    // State must be cleared
    expect(service.getTypers(CHANNEL_ID, USER_B)).toHaveLength(0);
  });

  it('startTyping twice within TTL resets timer — only one entry for user, no double-count', () => {
    const onExpiry = vi.fn();

    // First call at t=0
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', onExpiry);

    // Second call at t=3000ms (before TTL expires)
    vi.advanceTimersByTime(3_000);
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', onExpiry);

    // Verify exactly one entry (no double-count)
    const typers = service.getTypers(CHANNEL_ID, USER_B);
    expect(typers).toHaveLength(1);
    expect(typers.filter((t) => t.userId === USER_A)).toHaveLength(1);

    // Advance another 3000ms — the original timer would have fired (3+3=6>5)
    // but the reset timer should NOT have fired yet (only 3s since reset)
    vi.advanceTimersByTime(3_000);
    expect(onExpiry).not.toHaveBeenCalled(); // timer was reset, not double-set

    // Advance 2000ms more (now 5s since second call) — the reset timer fires
    vi.advanceTimersByTime(2_000);
    expect(onExpiry).toHaveBeenCalledOnce(); // fires exactly once, not twice
  });

  it('stopTyping removes user from getTypers immediately AND cancels the timer (no double-fire after TTL)', () => {
    const onExpiry = vi.fn();
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', onExpiry);

    // Confirm typer is present
    expect(service.getTypers(CHANNEL_ID, USER_B)).toHaveLength(1);

    // Explicit stop before TTL expires
    service.stopTyping(CHANNEL_ID, USER_A);

    // Removed immediately
    expect(service.getTypers(CHANNEL_ID, USER_B)).toHaveLength(0);

    // Advancing past TTL must NOT trigger onExpiry (timer was cancelled)
    vi.advanceTimersByTime(5_000);
    expect(onExpiry).not.toHaveBeenCalled();
  });

  it('stopTyping on an empty/unknown channel is a no-op (no throw)', () => {
    expect(() => {
      service.stopTyping('nonexistent-channel', USER_A);
    }).not.toThrow();

    // Also safe on a channel that had a user who already stopped
    service.startTyping(CHANNEL_ID, USER_A, 'Alice', vi.fn());
    service.stopTyping(CHANNEL_ID, USER_A); // first call clears the entry
    expect(() => {
      service.stopTyping(CHANNEL_ID, USER_A); // second call on now-empty channel
    }).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Tests: co-member resolution (DB queries via drizzle `db`)
// ---------------------------------------------------------------------------

describe('PresenceService — co-member resolution', () => {
  let service: PresenceService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PresenceService();
  });

  it('getCoMemberUserIds returns OTHER users de-duplicated, excluding self even when shared across two servers', async () => {
    // USER_A is in SERVER_A and SERVER_B.
    // SERVER_A has USER_A + USER_B; SERVER_B has USER_A + USER_B + USER_C.
    // USER_B appears in both servers — must be de-duplicated to one entry.

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // getServerIdsForUser: USER_A belongs to SERVER_A and SERVER_B
        return makeSelectChain([{ server_id: SERVER_A }, { server_id: SERVER_B }]);
      }
      // getCoMemberUserIds: all members of SERVER_A and SERVER_B
      return makeSelectChain([
        { user_id: USER_A }, // self — must be excluded
        { user_id: USER_B }, // co-member in SERVER_A
        { user_id: USER_A }, // self again in SERVER_B — excluded
        { user_id: USER_B }, // co-member in SERVER_B — deduplicated
        { user_id: USER_C }, // co-member only in SERVER_B
      ]);
    });

    const result = await service.getCoMemberUserIds(USER_A);

    // Result must contain USER_B and USER_C exactly once, not USER_A
    expect(result).not.toContain(USER_A);
    expect(result.filter((id) => id === USER_B)).toHaveLength(1);
    expect(result.filter((id) => id === USER_C)).toHaveLength(1);
    expect(result).toHaveLength(2);
  });

  it('getCoMemberUserIds returns [] and does not issue a second DB query when user belongs to no servers', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // First call (getServerIdsForUser): no servers
      return makeSelectChain([]);
    });

    const result = await service.getCoMemberUserIds(USER_A);

    // Early return path: empty array
    expect(result).toEqual([]);
    // The second DB query (inArray over serverIds) must not have been issued
    expect(selectCallCount).toBe(1);
  });

  it('getServerIdsForUser returns the distinct server_id list from the mocked rows', async () => {
    mockSelect.mockReturnValue(makeSelectChain([{ server_id: SERVER_A }, { server_id: SERVER_B }]));

    const result = await service.getServerIdsForUser(USER_A);

    expect(result).toEqual([SERVER_A, SERVER_B]);
    expect(result).toHaveLength(2);
  });
});
