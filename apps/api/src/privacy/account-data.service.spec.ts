/**
 * AccountDataService unit tests — wave-35 privacy regression.
 *
 * Covers:
 *   - getAccountData: correct profile shape (all fields including nullable ones)
 *   - getAccountData: memberships array with serverId, serverName, joinedAt ISO string
 *   - getAccountData: activitySummary.serversJoined count + accountCreatedAt ISO string
 *   - getAccountData: throws Error for non-existent user
 *   - exportAccountData: delegates to getAccountData (same aggregation shape)
 *
 * db is mocked via vi.mock — no real Postgres. Integration-tier IDOR and
 * self-scoping coverage is in test/integration/account-data-export-idor.spec.ts.
 */

// ---------------------------------------------------------------------------
// db module mock — must appear before any SUT import (Vitest hoisting)
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/index';
import { AccountDataService } from './account-data.service';
import type { AppendPrivacyEventService } from './append-privacy-event.service';

// Typed reference to the mocked db.select — avoids per-test casting noise.
type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;

// ---------------------------------------------------------------------------
// Chain helper — mirrors servers.service.spec.ts makeSelectChain exactly
// ---------------------------------------------------------------------------

/**
 * Thennable select chain: every fluent method returns `this`.
 * Awaiting the chain (or any point in the chain) resolves with `resolveWith`.
 */
function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'innerJoin', 'limit', 'orderBy']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockUser = {
  id: 'user-acct-1',
  email: 'acct@example.com',
  display_name: 'Acct User',
  username: 'acct1',
  avatar_url: null,
  accent_color: '#ff0000',
  profile_visibility: 'everyone',
  who_can_dm: 'everyone',
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
};

/** membershipRows shape matches the SELECT projection in account-data.service.ts. */
const mockMembership = {
  serverId: 'server-acct-99',
  serverName: 'Acct Server',
  joinedAt: new Date('2026-02-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// AccountDataService — getAccountData
// ---------------------------------------------------------------------------

describe('AccountDataService.getAccountData', () => {
  let sut: AccountDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    // AccountDataService has no constructor dependencies — instantiate directly.
    sut = new AccountDataService({
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService);
  });

  /** Helper: mock two sequential select calls (users lookup, then memberships). */
  function setupSelectSequence(userRow: unknown, membershipRows: unknown[]) {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? makeSelectChain([userRow]) : makeSelectChain(membershipRows);
    });
  }

  it('returns correct profile shape including all non-null and nullable fields', async () => {
    setupSelectSequence(mockUser, [mockMembership]);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.profile).toEqual({
      userId: 'user-acct-1',
      displayName: 'Acct User',
      username: 'acct1',
      avatarUrl: null,
      accentColor: '#ff0000',
      email: 'acct@example.com',
    });
  });

  it('returns profile.displayName = null when users.display_name is NULL', async () => {
    setupSelectSequence({ ...mockUser, display_name: null }, []);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.profile.displayName).toBeNull();
  });

  it('returns profile.username = null when users.username is NULL', async () => {
    setupSelectSequence({ ...mockUser, username: null }, []);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.profile.username).toBeNull();
  });

  it('returns memberships array with serverId, serverName, and ISO joinedAt string', async () => {
    setupSelectSequence(mockUser, [mockMembership]);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.memberships).toHaveLength(1);
    expect(result.memberships[0]).toEqual({
      serverId: 'server-acct-99',
      serverName: 'Acct Server',
      joinedAt: '2026-02-01T00:00:00.000Z',
    });
  });

  it('returns activitySummary.serversJoined equal to the number of memberships', async () => {
    setupSelectSequence(mockUser, [mockMembership]);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.activitySummary.serversJoined).toBe(1);
  });

  it('returns activitySummary.accountCreatedAt as an ISO string from users.created_at', async () => {
    setupSelectSequence(mockUser, [mockMembership]);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.activitySummary.accountCreatedAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('returns empty memberships array and serversJoined=0 when user has no server_members rows', async () => {
    setupSelectSequence(mockUser, []);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.memberships).toHaveLength(0);
    expect(result.activitySummary.serversJoined).toBe(0);
  });

  it('returns correct serversJoined count when user has multiple memberships', async () => {
    const membership2 = {
      serverId: 'server-acct-100',
      serverName: 'Another Server',
      joinedAt: new Date('2026-03-01T00:00:00Z'),
    };
    setupSelectSequence(mockUser, [mockMembership, membership2]);

    const result = await sut.getAccountData('user-acct-1');

    expect(result.memberships).toHaveLength(2);
    expect(result.activitySummary.serversJoined).toBe(2);
  });

  it('throws an Error when user row does not exist (unknown userId)', async () => {
    // First select (users) returns empty; second (memberships) should not be reached
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(sut.getAccountData('ghost-user-xyz')).rejects.toThrow(
      'User not found: ghost-user-xyz',
    );
  });
});

// ---------------------------------------------------------------------------
// AccountDataService — exportAccountData
// ---------------------------------------------------------------------------

describe('AccountDataService.exportAccountData', () => {
  let sut: AccountDataService;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new AccountDataService({
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService);
  });

  it('returns the same aggregation shape as getAccountData (thin delegation wrapper)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return callCount === 1 ? makeSelectChain([mockUser]) : makeSelectChain([mockMembership]);
    });

    const result = await sut.exportAccountData('user-acct-1');

    // exportAccountData simply calls getAccountData — shape must be identical
    expect(result.profile.userId).toBe('user-acct-1');
    expect(result.profile.email).toBe('acct@example.com');
    expect(result.memberships).toHaveLength(1);
    expect(result.memberships[0]?.serverId).toBe('server-acct-99');
    expect(result.activitySummary.serversJoined).toBe(1);
  });

  it('also throws for a non-existent user (delegation carries the throw)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(sut.exportAccountData('ghost-export-user')).rejects.toThrow(
      'User not found: ghost-export-user',
    );
  });
});
