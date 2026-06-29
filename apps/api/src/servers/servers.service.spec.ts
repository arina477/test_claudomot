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
    service = new ServersService();
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
    const txMock = buildTxMock([[mockServer], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    const result = await service.createServer('user-1', 'Test Server');

    expect(mockTransaction).toHaveBeenCalledOnce();
    expect(result.id).toBe('server-1');
    expect(result.ownerId).toBe('user-1');
    expect(result.name).toBe('Test Server');
    expect(result.createdAt).toBe('2026-01-01T00:00:00.000Z');
  });

  it('inserts 4 rows in order: server → member → category → channel', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    expect(txMock.insert).toHaveBeenCalledTimes(4);
  });

  it('seeds General category with position 0', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    // index 2 is the categories insert
    expect(capturedValues[2]).toMatchObject({ name: 'General', position: 0 });
  });

  it('seeds #general channel as text, not private, linked to General category', async () => {
    const capturedValues: unknown[] = [];
    const txMock = buildTxMock([[mockServer], [], [mockCategory], []], capturedValues);
    mockTransaction.mockImplementation((fn: (tx: unknown) => unknown) => fn(txMock));

    await service.createServer('user-1', 'Test Server');

    // index 3 is the channels insert
    expect(capturedValues[3]).toMatchObject({
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
    service = new ServersService();
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
    service = new ServersService();
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

    expect(result.server).toEqual({ id: 'server-1', name: 'Test Server', ownerId: 'user-1' });
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
    service = new ServersService();
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
    service = new ServersService();
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
    service = new ServersService();
  });

  /**
   * Build a transaction mock that supports select, insert, and update chains.
   * selectSequence: array of arrays returned in order for each select call.
   * insertReturning: what the insert(...).onConflictDoNothing().returning() returns.
   */
  function buildJoinTxMock(
    selectSequence: unknown[][],
    insertReturning: unknown[],
    captureUpdate?: { called: boolean },
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
      update: vi.fn(() => {
        const chain: Record<string, unknown> = {};
        chain.set = vi.fn(() => {
          chain.where = vi.fn(() => Promise.resolve([]));
          return chain;
        });
        if (captureUpdate) captureUpdate.called = true;
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
});
