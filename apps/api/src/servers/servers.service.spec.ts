import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServersService } from './servers.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers
// ---------------------------------------------------------------------------

/**
 * Thennable mock chain for db.select()...
 * Every fluent method (from, where, innerJoin, limit, orderBy) returns
 * the same chain. Awaiting the chain resolves with `resolveWith`.
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

/**
 * Thennable mock chain for tx.insert(table).values(data)[.returning()].
 * Both `await chain` and `await chain.returning()` work.
 */
function makeInsertChain(returningValue: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returningValue).then(res, rej),
    returning: vi.fn().mockResolvedValue(returningValue),
  };
  chain.values = vi.fn().mockReturnValue(chain);
  return chain;
}

/**
 * Thennable mock chain for db.update(table).set(data).where(cond).
 * Supports both `await chain` (resolves undefined) and `.where(...)` chained call.
 */
function makeUpdateChain() {
  const whereChain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle update chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
  };
  const setChain: Record<string, unknown> = {};
  setChain.where = vi.fn().mockReturnValue(whereChain);
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn().mockReturnValue(setChain);
  return chain;
}

// ---------------------------------------------------------------------------
// db module mock — replaced before any import of the module under test
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from '../db/index';

// Typed references to the mocked db methods — avoids per-test casting noise.
// vi.mock replaces the module's exports with the object above; the cast is safe.
type MockFn = ReturnType<typeof vi.fn>;
const mockTransaction = db.transaction as unknown as MockFn;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;

// ---------------------------------------------------------------------------
// RbacService mock factory
// Default: getVisibleChannelIds returns null (owner → all visible)
// ---------------------------------------------------------------------------

import type { RbacService } from '../rbac/rbac.service';

function makeRbacServiceMock(getVisibleChannelIdsReturn: Set<string> | null = null): RbacService {
  return {
    getVisibleChannelIds: vi.fn().mockResolvedValue(getVisibleChannelIdsReturn),
    can: vi.fn().mockResolvedValue(false),
    canViewChannel: vi.fn().mockResolvedValue(true),
    listRoles: vi.fn(),
    createRole: vi.fn(),
    updateRole: vi.fn(),
    deleteRole: vi.fn(),
    assignRole: vi.fn(),
    listChannelOverrides: vi.fn(),
    upsertChannelOverride: vi.fn(),
    deleteChannelOverride: vi.fn(),
  } as unknown as RbacService;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServer = {
  id: 'server-1',
  name: 'Test Server',
  owner_id: 'user-1',
  created_at: new Date('2026-01-01T00:00:00Z'),
};
const mockCategory = { id: 'cat-1', server_id: 'server-1', name: 'General', position: 0 };
const mockMember = {
  id: 'mem-1',
  server_id: 'server-1',
  user_id: 'user-1',
  role_id: null,
  joined_at: new Date(),
};
const mockChannel = {
  id: 'ch-1',
  server_id: 'server-1',
  category_id: 'cat-1',
  name: 'general',
  type: 'text',
  is_private: false,
  position: 0,
  created_at: new Date(),
};

// ---------------------------------------------------------------------------
// ServersService — createServer (txn atomicity + default seeding)
// ---------------------------------------------------------------------------

describe('ServersService.createServer', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  /** Build a spied transaction mock that tracks per-insert values. */
  function buildTxMock(txInsertReturns: unknown[][], capturedValues: unknown[]) {
    let txInsertIdx = 0;
    return {
      insert: vi.fn(() => {
        const idx = txInsertIdx++;
        const chain = makeInsertChain(txInsertReturns[idx] ?? []);
        const origValues = chain.values as MockFn;
        chain.values = vi.fn((data: unknown) => {
          capturedValues.push(data);
          return origValues(data);
        });
        return chain;
      }),
    };
  }

  it('executes all inserts inside db.transaction and returns ServerResponse', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    const result = await service.createServer('user-1', 'Test Server');

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(result.id).toBe('server-1');
    expect(result.ownerId).toBe('user-1');
    expect(result.name).toBe('Test Server');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('inserts 5 rows in order: server → role → member → category → channel', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    expect(txMock.insert).toHaveBeenCalledTimes(5);
  });

  it('seeds default Member role with is_default=true and all four permission flags false', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    // index 1 is the roles insert (after server at index 0)
    expect(capturedValues[1]).toMatchObject({
      name: 'Member',
      position: 0,
      is_default: true,
      manage_server: false,
      manage_roles: false,
      manage_channels: false,
      manage_members: false,
    });
  });

  it('seeds General category with position 0', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    // index 3 is the categories insert (server=0, role=1, member=2, category=3)
    expect(capturedValues[3]).toMatchObject({ name: 'General', position: 0 });
  });

  it('seeds #general channel as text, not private, linked to General category', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    // index 4 is the channels insert (server=0, role=1, member=2, category=3, channel=4)
    expect(capturedValues[4]).toMatchObject({
      name: 'general',
      type: 'text',
      is_private: false,
      category_id: 'cat-1',
      position: 0,
    });
  });
});

// ---------------------------------------------------------------------------
// ServersService — findMyServers (member-scoping)
// ---------------------------------------------------------------------------

describe('ServersService.findMyServers', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('returns servers mapped to ServerSummary', async () => {
    mockSelect.mockReturnValue(
      makeSelectChain([{ id: 'server-1', name: 'Test Server', owner_id: 'user-1' }]),
    );

    const result = await service.findMyServers('user-1');

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({ id: 'server-1', name: 'Test Server', ownerId: 'user-1' });
  });

  it('uses innerJoin to filter by membership (not a bare server scan)', async () => {
    const chain = makeSelectChain([]);
    mockSelect.mockReturnValue(chain);

    await service.findMyServers('user-1');

    expect(vi.mocked(chain.innerJoin as MockFn)).toHaveBeenCalledOnce();
  });

  it('returns empty array when user has no memberships', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    const result = await service.findMyServers('user-2');

    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// ServersService — findServerDetail (404 / 403 / success)
// ---------------------------------------------------------------------------

describe('ServersService.findServerDetail', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('throws NotFoundException (404) when server does not exist', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [] : [mockMember]);
    });

    await expect(service.findServerDetail('user-1', 'ghost-server')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException (403) when user is not a member', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [mockServer] : []);
    });

    await expect(service.findServerDetail('user-2', 'server-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns full server detail including nested categories and channels', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockServer]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([mockChannel]);
      }
    });

    const result = await service.findServerDetail('user-1', 'server-1');

    expect(result.server).toEqual({
      id: 'server-1',
      name: 'Test Server',
      ownerId: 'user-1',
      inviteCode: null,
    });
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0]).toMatchObject({ id: 'cat-1', name: 'General', position: 0 });
    expect(result.categories[0]?.channels).toHaveLength(1);
    expect(result.categories[0]?.channels[0]).toMatchObject({
      id: 'ch-1',
      name: 'general',
      type: 'text',
      isPrivate: false,
      position: 0,
    });
  });

  it('assigns channels to their correct category by category_id', async () => {
    const cat2 = { id: 'cat-2', server_id: 'server-1', name: 'Off-topic', position: 1 };
    const ch2 = { ...mockChannel, id: 'ch-2', name: 'random', category_id: 'cat-2' };
    let callCount = 0;

    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockServer]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory, cat2]);
        default:
          return makeSelectChain([mockChannel, ch2]);
      }
    });

    const result = await service.findServerDetail('user-1', 'server-1');

    expect(result.categories[0]?.channels[0]?.id).toBe('ch-1');
    expect(result.categories[1]?.channels[0]?.id).toBe('ch-2');
  });

  it('exposes invite_code as inviteCode in server detail (8b)', async () => {
    const serverWithCode = { ...mockServer, invite_code: 'perm-code-xyz' };
    let callCount = 0;

    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([serverWithCode]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([mockChannel]);
      }
    });

    const result = await service.findServerDetail('user-1', 'server-1');

    expect(result.server.inviteCode).toBe('perm-code-xyz');
  });

  it('returns inviteCode: null when server has no permanent invite_code (8b)', async () => {
    const serverNoCode = { ...mockServer, invite_code: null };
    let callCount = 0;

    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([serverNoCode]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([mockChannel]);
      }
    });

    const result = await service.findServerDetail('user-1', 'server-1');

    expect(result.server.inviteCode).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// ServersService — findServerDetail (server-side channel filtering, P-4 T-8)
// ---------------------------------------------------------------------------

describe('ServersService.findServerDetail — server-side channel filtering', () => {
  /**
   * These tests verify that channels not visible to the caller's role are
   * ABSENT from the response (no hidden-channel enumeration).
   * The RbacService mock controls which channel IDs are visible.
   */

  it('hides non-visible channels from response (no enumeration)', async () => {
    // Two channels: ch-1 (visible), ch-2 (private, not in visibleIds set)
    const privateChannel = {
      ...mockChannel,
      id: 'ch-2',
      name: 'secret',
      is_private: true,
    };
    const visibleSet = new Set(['ch-1']); // ch-2 hidden
    const rbacMock = makeRbacServiceMock(visibleSet);
    const svc = new ServersService(rbacMock);

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockServer]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([mockChannel, privateChannel]);
      }
    });

    const result = await svc.findServerDetail('user-1', 'server-1');

    const channelIds = result.categories.flatMap((c) => c.channels.map((ch) => ch.id));
    expect(channelIds).toContain('ch-1');
    expect(channelIds).not.toContain('ch-2'); // must be absent — no enumeration
  });

  it('private channel default-deny: absent when visibleIds does not include it', async () => {
    const privateChannel = {
      ...mockChannel,
      id: 'ch-private',
      name: 'private-chat',
      is_private: true,
    };
    // Empty visible set — private channel hidden by default-deny
    const emptySet = new Set<string>();
    const svc = new ServersService(makeRbacServiceMock(emptySet));

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockServer]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([privateChannel]);
      }
    });

    const result = await svc.findServerDetail('user-member', 'server-1');
    const channelIds = result.categories.flatMap((c) => c.channels.map((ch) => ch.id));
    expect(channelIds).not.toContain('ch-private');
  });

  it('owner sees all channels (getVisibleChannelIds returns null = all)', async () => {
    const privateChannel = {
      ...mockChannel,
      id: 'ch-private',
      name: 'private-chat',
      is_private: true,
    };
    // null = all visible (owner path)
    const svc = new ServersService(makeRbacServiceMock(null));

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockServer]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([mockChannel, privateChannel]);
      }
    });

    const result = await svc.findServerDetail('owner-1', 'server-1');
    const channelIds = result.categories.flatMap((c) => c.channels.map((ch) => ch.id));
    expect(channelIds).toContain('ch-1');
    expect(channelIds).toContain('ch-private');
  });

  it('getVisibleChannelIds is called with correct serverId and channelIds', async () => {
    const rbacMock = makeRbacServiceMock(null);
    const svc = new ServersService(rbacMock);

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockServer]);
        case 2:
          return makeSelectChain([mockMember]);
        case 3:
          return makeSelectChain([mockCategory]);
        default:
          return makeSelectChain([mockChannel]);
      }
    });

    await svc.findServerDetail('user-1', 'server-1');

    expect(rbacMock.getVisibleChannelIds).toHaveBeenCalledWith('user-1', 'server-1', ['ch-1']);
  });
});

// ---------------------------------------------------------------------------
// Invite fixtures
// ---------------------------------------------------------------------------

const mockInvite = {
  id: 'invite-1',
  server_id: 'server-1',
  code: 'abc123',
  created_by: 'user-1',
  max_uses: null,
  uses: 0,
  expires_at: null,
  revoked: false,
  created_at: new Date('2026-01-01T00:00:00Z'),
};

// ---------------------------------------------------------------------------
// ServersService — createInvite (task c7443638)
// ---------------------------------------------------------------------------

describe('ServersService.createInvite', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('throws ForbiddenException (403) when caller is not a member', async () => {
    // First select (member check) returns empty, second (server lookup) not reached
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      // member check → empty; server → also empty (shouldn't reach)
      return makeSelectChain(callCount === 1 ? [] : [mockServer]);
    });

    await expect(service.createInvite('server-1', 'non-member', {})).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException (404) when server does not exist', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      // member check → member found; server check → empty
      return makeSelectChain(
        callCount === 1 ? [{ id: 'mem-1', server_id: 'server-1', user_id: 'user-1' }] : [],
      );
    });

    await expect(service.createInvite('ghost-server', 'user-1', {})).rejects.toThrow(
      NotFoundException,
    );
  });

  it('inserts invite and returns code with base64url shape (~22 chars)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([{ id: 'mem-1', server_id: 'server-1', user_id: 'user-1' }]);
      }
      return makeSelectChain([mockServer]);
    });

    const insertChain = makeInsertChain([]);
    mockInsert.mockReturnValue(insertChain);

    const result = await service.createInvite('server-1', 'user-1', {});

    expect(result.code).toBeDefined();
    // base64url: a-z A-Z 0-9 - _  (16 bytes → 22 chars)
    expect(result.code).toMatch(/^[A-Za-z0-9_-]{22}$/);
  });

  it('retries on unique constraint violation (code 23505)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        return makeSelectChain([{ id: 'mem-1', server_id: 'server-1', user_id: 'user-1' }]);
      }
      return makeSelectChain([mockServer]);
    });

    // First insert throws unique violation; second succeeds
    let insertAttempt = 0;
    mockInsert.mockImplementation(() => {
      const chain: Record<string, unknown> = {};
      chain.values = vi.fn(() => {
        insertAttempt++;
        if (insertAttempt === 1) {
          return Promise.reject(Object.assign(new Error('unique violation'), { code: '23505' }));
        }
        return Promise.resolve([]);
      });
      return chain;
    });

    const result = await service.createInvite('server-1', 'user-1', {});
    expect(result.code).toBeDefined();
    expect(insertAttempt).toBe(2);
  });

  it('generates unique codes across two separate calls', async () => {
    let totalSelectCalls = 0;
    mockSelect.mockImplementation(() => {
      totalSelectCalls++;
      if (totalSelectCalls % 2 === 1) {
        return makeSelectChain([{ id: 'mem-1', server_id: 'server-1', user_id: 'user-1' }]);
      }
      return makeSelectChain([mockServer]);
    });

    const insertChain = makeInsertChain([]);
    mockInsert.mockReturnValue(insertChain);

    const r1 = await service.createInvite('server-1', 'user-1', {});
    const r2 = await service.createInvite('server-1', 'user-1', {});

    // Statistically guaranteed with 128-bit entropy
    expect(r1.code).not.toBe(r2.code);
  });
});

// ---------------------------------------------------------------------------
// ServersService — getInvitePreview (task 77e2041a)
// ---------------------------------------------------------------------------

describe('ServersService.getInvitePreview', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('returns minimal preview (id, name, memberCount) for a valid ad-hoc invite', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockInvite]); // invites lookup
        case 2:
          return makeSelectChain([mockServer]); // server lookup
        default:
          return makeSelectChain([{ count: 5 }]); // member count
      }
    });

    const result = await service.getInvitePreview('abc123');

    expect(result).toEqual({ server: { id: 'server-1', name: 'Test Server', memberCount: 5 } });
  });

  it('does NOT return channels, categories, or member list', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([mockInvite]);
        case 2:
          return makeSelectChain([mockServer]);
        default:
          return makeSelectChain([{ count: 2 }]);
      }
    });

    const result = await service.getInvitePreview('abc123');

    expect(result).not.toHaveProperty('channels');
    expect(result).not.toHaveProperty('categories');
    expect(result).not.toHaveProperty('members');
    expect(Object.keys(result)).toEqual(['server']);
    expect(Object.keys(result.server)).toEqual(['id', 'name', 'memberCount']);
  });

  it('throws NotFoundException (404) for a revoked invite', async () => {
    mockSelect.mockReturnValue(makeSelectChain([{ ...mockInvite, revoked: true }]));

    await expect(service.getInvitePreview('abc123')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException (404) for an expired invite', async () => {
    const pastDate = new Date(Date.now() - 3600_000); // 1 hour ago
    mockSelect.mockReturnValue(makeSelectChain([{ ...mockInvite, expires_at: pastDate }]));

    await expect(service.getInvitePreview('abc123')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException (404) for a maxed-out invite (uses >= max_uses)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([{ ...mockInvite, max_uses: 5, uses: 5 }]));

    await expect(service.getInvitePreview('abc123')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException (404) for a code that does not exist in either table', async () => {
    // ad-hoc lookup → empty; permanent lookup → empty
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.getInvitePreview('no-such-code')).rejects.toThrow(NotFoundException);
  });

  it('falls through to permanent invite when ad-hoc not found', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      switch (callCount) {
        case 1:
          return makeSelectChain([]); // ad-hoc not found
        case 2:
          return makeSelectChain([{ ...mockServer, invite_code: 'perm-code' }]); // server
        default:
          return makeSelectChain([{ count: 3 }]); // member count
      }
    });

    const result = await service.getInvitePreview('perm-code');

    expect(result.server.memberCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// ServersService — joinViaInvite (task 77e2041a, carry-forward B)
// ---------------------------------------------------------------------------

describe('ServersService.joinViaInvite', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  /**
   * Build a transaction mock that supports select, insert, and update chains.
   * selectSequence: array of arrays returned in order for each select call.
   * insertReturning: what the insert(...).onConflictDoNothing().returning() returns.
   * updateReturning: what the update(...).set(...).where(...).returning() returns
   *   (used by the atomic conditional max_uses consume path). Defaults to [{id:'invite-1'}]
   *   (simulating a successful consume). Pass [] to simulate a concurrent race loss.
   */
  function buildJoinTxMock(
    selectSequence: unknown[][],
    insertReturning: unknown[],
    captureUpdate?: { called: boolean },
    updateReturning: unknown[] = [{ id: 'invite-1' }],
  ) {
    let selectIdx = 0;
    return {
      select: vi.fn(() => {
        const result = selectSequence[selectIdx++] ?? [];
        return makeSelectChain(result);
      }),
      insert: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.values = vi.fn(() => {
          const conflictChain: Record<string, unknown> = {};
          conflictChain.onConflictDoNothing = vi.fn(() => {
            const returningChain: Record<string, unknown> = {
              // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
              then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
                Promise.resolve(insertReturning).then(res, rej),
              returning: vi.fn().mockResolvedValue(insertReturning),
            };
            return returningChain;
          });
          return conflictChain;
        });
        return chain;
      }),
      update: vi.fn((..._args: unknown[]) => {
        if (captureUpdate) captureUpdate.called = true;
        const chain: Record<string, unknown> = {};
        chain.set = vi.fn(() => {
          const whereChain: Record<string, unknown> = {
            // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for direct await
            then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
              Promise.resolve([]).then(res, rej),
            returning: vi.fn().mockResolvedValue(updateReturning),
          };
          chain.where = vi.fn(() => whereChain);
          return chain;
        });
        return chain;
      }),
    };
  }

  it('returns {serverId} when joining successfully via ad-hoc invite', async () => {
    const txMock = buildJoinTxMock(
      [[mockInvite], []], // invite found, (not used further)
      [{ id: 'mem-new', server_id: 'server-1', user_id: 'user-2' }], // new member inserted
    );
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    const result = await service.joinViaInvite('abc123', 'user-2');

    expect(result).toEqual({ serverId: 'server-1' });
  });

  it('increments invite uses when a new membership row is inserted (carry-forward B)', async () => {
    const captureUpdate = { called: false };
    const txMock = buildJoinTxMock(
      [[mockInvite]],
      [{ id: 'mem-new', server_id: 'server-1', user_id: 'user-2' }],
      captureUpdate,
    );
    // Patch update to track call and set called flag eagerly
    const origUpdate = txMock.update;
    txMock.update = vi.fn((...args) => {
      captureUpdate.called = true;
      return origUpdate(...args);
    });
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.joinViaInvite('abc123', 'user-2');

    expect(captureUpdate.called).toBe(true);
  });

  it('does NOT increment uses when existing member re-joins (carry-forward B)', async () => {
    const captureUpdate = { called: false };
    const txMock = buildJoinTxMock(
      [[mockInvite]],
      [], // ON CONFLICT DO NOTHING → empty RETURNING = existing member
    );
    txMock.update = vi.fn(() => {
      captureUpdate.called = true;
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn(() => {
        chain.where = vi.fn(() => Promise.resolve([]));
        return chain;
      });
      return chain;
    });
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    const result = await service.joinViaInvite('abc123', 'user-1');

    expect(result).toEqual({ serverId: 'server-1' });
    expect(captureUpdate.called).toBe(false);
  });

  it('does NOT increment uses for permanent (servers.invite_code) join', async () => {
    const captureUpdate = { called: false };
    // No ad-hoc invite found, falls through to permanent
    const txMock = buildJoinTxMock(
      [[], [{ ...mockServer, invite_code: 'perm-code' }]],
      [{ id: 'mem-new', server_id: 'server-1', user_id: 'user-3' }],
    );
    txMock.update = vi.fn(() => {
      captureUpdate.called = true;
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn(() => {
        chain.where = vi.fn(() => Promise.resolve([]));
        return chain;
      });
      return chain;
    });
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    const result = await service.joinViaInvite('perm-code', 'user-3');

    expect(result).toEqual({ serverId: 'server-1' });
    expect(captureUpdate.called).toBe(false);
  });

  it('throws NotFoundException (404) for invalid code inside transaction', async () => {
    // ad-hoc not found, permanent not found
    const txMock = buildJoinTxMock([[], []], []);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await expect(service.joinViaInvite('bad-code', 'user-1')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when ad-hoc invite is revoked (inside txn)', async () => {
    const txMock = buildJoinTxMock([[{ ...mockInvite, revoked: true }]], []);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await expect(service.joinViaInvite('abc123', 'user-2')).rejects.toThrow(NotFoundException);
  });

  it('rejects second distinct user on max_uses=1 invite when first join incremented uses', async () => {
    // Simulate: invite has max_uses=1, uses=1 (first join already consumed it)
    const maxedInvite = { ...mockInvite, max_uses: 1, uses: 1 };
    const txMock = buildJoinTxMock([[maxedInvite]], []);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await expect(service.joinViaInvite('abc123', 'user-3')).rejects.toThrow(NotFoundException);
  });

  it('atomic: concurrent join on max_uses=1 admits exactly one (conditional UPDATE returns 0 rows → txn rolls back)', async () => {
    // Model the race: two users both read uses=0 and both pass validateInviteActive.
    // Both INSERT the member row (ON CONFLICT DO NOTHING). The loser's conditional
    // UPDATE (WHERE uses < max_uses) returns 0 rows because the winner already
    // incremented uses to max_uses.  The service must throw so the whole transaction
    // (including the member INSERT) rolls back — leaving the server with exactly one member.
    const cappedInvite = { ...mockInvite, max_uses: 1, uses: 0 };

    // updateReturning = [] simulates the conditional UPDATE finding no row to update
    // (concurrent winner already consumed the slot).
    const txMock = buildJoinTxMock(
      [[cappedInvite]], // invite select inside txn
      [{ id: 'mem-new', server_id: 'server-1', user_id: 'user-loser' }], // INSERT returned a row (the losing concurrent joiner did insert)
      undefined,
      [], // conditional UPDATE WHERE uses < max_uses → 0 rows (slot already taken)
    );

    // The transaction mock must propagate the throw so the caller sees it.
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      // Simulate transaction rollback on throw: just let the error propagate.
      return fn(txMock);
    });

    // The loser's join throws (invite exhausted by concurrent winner) and the
    // transaction would have rolled back the member INSERT on a real DB.
    await expect(service.joinViaInvite('abc123', 'user-loser')).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// ServersService — revokeInvite (task 863c10ef)
// ---------------------------------------------------------------------------

describe('ServersService.revokeInvite', () => {
  let service: ServersService;

  const mockServerOwner = {
    id: 'server-1',
    name: 'Test Server',
    owner_id: 'owner-1',
    invite_code: null,
    created_at: new Date('2026-01-01T00:00:00Z'),
  };

  const mockInviteByOwner = {
    id: 'invite-rev-1',
    server_id: 'server-1',
    code: 'rev-code-123',
    created_by: 'owner-1',
    max_uses: null,
    uses: 0,
    expires_at: null,
    revoked: false,
    created_at: new Date('2026-01-01T00:00:00Z'),
  };

  const mockInviteByMember = {
    ...mockInviteByOwner,
    id: 'invite-rev-2',
    code: 'rev-code-456',
    created_by: 'member-1',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('returns void (200) when owner revokes their own invite', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [mockInviteByOwner] : [mockServerOwner]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain());

    await expect(service.revokeInvite('rev-code-123', 'owner-1')).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('returns void (200) when the invite creator (non-owner member) revokes their invite', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [mockInviteByMember] : [mockServerOwner]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain());

    await expect(service.revokeInvite('rev-code-456', 'member-1')).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('throws ForbiddenException (403) for non-owner, non-creator caller', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [mockInviteByOwner] : [mockServerOwner]);
    });

    await expect(service.revokeInvite('rev-code-123', 'stranger-99')).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws NotFoundException (404) for a code not in the invites table (permanent code or nonexistent)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.revokeInvite('no-such-code', 'owner-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('is idempotent — re-revoking an already-revoked invite calls UPDATE and returns void', async () => {
    const alreadyRevoked = { ...mockInviteByOwner, revoked: true };
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      return makeSelectChain(callCount === 1 ? [alreadyRevoked] : [mockServerOwner]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain());

    await expect(service.revokeInvite('rev-code-123', 'owner-1')).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledOnce();
  });

  it('after revoke — getInvitePreview throws NotFoundException (404) for revoked invite', async () => {
    // Simulate: revoked invite exists and is returned by the ad-hoc lookup
    const revokedInvite = { ...mockInviteByOwner, revoked: true };
    mockSelect.mockReturnValue(makeSelectChain([revokedInvite]));

    // validateInviteActive inside getInvitePreview throws on revoked
    await expect(service.getInvitePreview('rev-code-123')).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// ServersService — rotateInviteCode (task d058283d)
// ---------------------------------------------------------------------------

describe('ServersService.rotateInviteCode', () => {
  let service: ServersService;

  const mockServerWithCode = {
    id: 'server-1',
    name: 'Test Server',
    owner_id: 'owner-1',
    invite_code: 'old-code-aaaaaa',
    created_at: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('returns an invite_code with base64url shape (~22 chars)', async () => {
    // The real old-vs-new contract (rotated code ≠ previous persisted code)
    // is covered by the integration test invite-code-rotate.spec.ts.
    // Here we verify only that the returned value has the expected encoding shape.
    mockSelect.mockReturnValue(makeSelectChain([mockServerWithCode]));
    mockUpdate.mockReturnValue(makeUpdateChain());

    const result = await service.rotateInviteCode('server-1', 'owner-1');

    expect(result.invite_code).toBeDefined();
    // base64url shape: 16 bytes = 22 chars, URL-safe alphabet
    expect(result.invite_code).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(result.invite_code.length).toBeGreaterThan(0);
  });

  it('throws NotFoundException (404) when server does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.rotateInviteCode('ghost-server', 'owner-1')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws ForbiddenException (403) when caller is not the owner', async () => {
    mockSelect.mockReturnValue(makeSelectChain([mockServerWithCode]));

    await expect(service.rotateInviteCode('server-1', 'non-owner-99')).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('retries on 23505 (first attempt collides, second succeeds), generates a NEW code on retry', async () => {
    mockSelect.mockReturnValue(makeSelectChain([mockServerWithCode]));

    let updateAttempt = 0;
    // Capture the invite_code passed to .set() on each attempt so we can assert
    // that a fresh code is generated on retry (not the same collided code reused).
    const capturedCodes: string[] = [];

    mockUpdate.mockImplementation(() => {
      updateAttempt++;
      const chain: Record<string, unknown> = {};
      chain.set = vi.fn((data: Record<string, unknown>) => {
        capturedCodes.push(data.invite_code as string);
        const whereChain: Record<string, unknown> = {
          // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
          then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => {
            if (updateAttempt === 1) {
              return Promise.reject(
                Object.assign(new Error('unique violation'), { code: '23505' }),
              ).then(res, rej);
            }
            return Promise.resolve(undefined).then(res, rej);
          },
        };
        return { where: vi.fn().mockReturnValue(whereChain) };
      });
      return chain;
    });

    const result = await service.rotateInviteCode('server-1', 'owner-1');

    expect(result.invite_code).toBeDefined();
    // Retry count: must have called update exactly twice
    expect(updateAttempt).toBe(2);
    // Regeneration: the code passed on attempt 2 must differ from attempt 1
    // (proves generateCode() was called again, not the collided code reused)
    expect(capturedCodes).toHaveLength(2);
    expect(capturedCodes[1]).not.toBe(capturedCodes[0]);
  });
});

// ---------------------------------------------------------------------------
// ServersService — listServerMembers (wave-15 B-4: username field added)
// ---------------------------------------------------------------------------

describe('ServersService.listServerMembers', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  it('throws ForbiddenException (403) when caller is not a member of the server', async () => {
    // First select (membership check) returns empty
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.listServerMembers('non-member', 'server-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('returns members with username included in each record', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) {
        // membership check — caller is a member
        return makeSelectChain([{ id: 'mem-1' }]);
      }
      // member roster query
      return makeSelectChain([
        {
          userId: 'user-1',
          displayName: 'Mia Wong',
          email: 'mia@example.com',
          avatarUrl: null,
          username: 'miaw',
        },
        {
          userId: 'user-2',
          displayName: null,
          email: 'jane@example.com',
          avatarUrl: 'https://example.com/avatar.png',
          username: 'jane99',
        },
      ]);
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      userId: 'user-1',
      displayName: 'Mia Wong',
      avatarUrl: null,
      username: 'miaw',
    });
    expect(result[1]).toEqual({
      userId: 'user-2',
      displayName: 'jane', // falls back to email prefix when display_name is null
      avatarUrl: 'https://example.com/avatar.png',
      username: 'jane99',
    });
  });

  it('returns username: null for members whose users.username IS NULL', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: 'mem-1' }]);
      return makeSelectChain([
        {
          userId: 'user-3',
          displayName: 'Bob',
          email: 'bob@example.com',
          avatarUrl: null,
          username: null,
        },
      ]);
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result[0]).toMatchObject({ userId: 'user-3', username: null });
  });

  it('displayName falls back to email prefix when display_name is null', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: 'mem-1' }]);
      return makeSelectChain([
        {
          userId: 'user-4',
          displayName: null,
          email: 'someone@studyhall.app',
          avatarUrl: null,
          username: 'someone',
        },
      ]);
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result[0]?.displayName).toBe('someone');
    expect(result[0]?.username).toBe('someone');
  });
});

// ---------------------------------------------------------------------------
// ServersService — listServerMembers displayName empty-fallback guard (wave-29)
// Covers the || operator fix: ?? only short-circuits null/undefined, not ''.
// ---------------------------------------------------------------------------

describe('ServersService.listServerMembers — displayName empty-fallback guard (wave-29)', () => {
  let service: ServersService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new ServersService(makeRbacServiceMock());
  });

  function setupMembersQuery(rosterRow: unknown) {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: 'mem-1' }]);
      return makeSelectChain([rosterRow]);
    });
  }

  it('empty email local-part + null display_name → displayName falls through to userId (NOT empty string)', async () => {
    // email '@example.com' → split('@')[0] === '' → falsy with || → falls through to userId
    setupMembersQuery({
      userId: 'user-ghost',
      displayName: null,
      email: '@example.com',
      avatarUrl: null,
      username: null,
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result[0]?.displayName).toBe('user-ghost');
    expect(result[0]?.displayName).not.toBe('');
  });

  it('stored-empty display_name ("") + normal email → falls through to email local-part (|| guards empty string)', async () => {
    // display_name='' is falsy with || → falls through to email prefix
    setupMembersQuery({
      userId: 'user-5',
      displayName: '',
      email: 'alice@example.com',
      avatarUrl: null,
      username: 'alice',
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result[0]?.displayName).toBe('alice');
  });

  it('normal email + null display_name → displayName is email local-part (happy path unchanged)', async () => {
    setupMembersQuery({
      userId: 'user-6',
      displayName: null,
      email: 'bob@studyhall.app',
      avatarUrl: null,
      username: 'bob',
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result[0]?.displayName).toBe('bob');
  });

  it('non-null display_name → that value is used (unchanged)', async () => {
    setupMembersQuery({
      userId: 'user-7',
      displayName: 'Carol Jones',
      email: 'carol@example.com',
      avatarUrl: null,
      username: 'carolj',
    });

    const result = await service.listServerMembers('user-1', 'server-1');

    expect(result[0]?.displayName).toBe('Carol Jones');
  });
});
