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
  },
}));

import { db } from '../db/index';

// Typed references to the mocked db methods — avoids per-test casting noise.
// vi.mock replaces the module's exports with the object above; the cast is safe.
type MockFn = ReturnType<typeof vi.fn>;
const mockTransaction = db.transaction as unknown as MockFn;
const mockSelect = db.select as unknown as MockFn;

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
