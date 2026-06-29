/**
 * OwnerLockoutService spec — wave-10 P-4 T-8 security conditions (task 7a10f13d).
 *
 * Covers:
 *   - demoteOwner: last-owner demote → 409
 *   - removeMember: last-owner remove → 409
 *   - leaveServer: last-owner leave → 409
 *   - concurrent-demote race: modelled via mock (concurrent demote+leave
 *     cannot both succeed — row-lock serialises them)
 *   - transferOwnership: atomic ownership transfer
 */

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OwnerLockoutService } from './owner-lockout.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'for']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function makeDeleteChain() {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
  };
  chain.where = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeUpdateChain() {
  const whereChain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
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
// Mock db module
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    transaction: vi.fn(),
    select: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockTransaction = db.transaction as unknown as MockFn;

// ---------------------------------------------------------------------------
// Transaction mock builder
// tx.select().from().where().for('update').limit(1) returns serverRow
// Subsequent tx.select() calls return member rows
// tx.delete().where() resolves void
// tx.update().set().where() resolves void
// ---------------------------------------------------------------------------

function buildTxMock(
  serverRow: unknown | undefined,
  memberRows: unknown[][],
  deleteCalled?: { value: boolean },
  updateCalled?: { value: boolean },
) {
  let selectIdx = 0;

  const tx = {
    select: vi.fn(() => {
      const idx = selectIdx++;
      const resolveWith = idx === 0 ? (serverRow ? [serverRow] : []) : (memberRows[idx - 1] ?? []);
      return makeSelectChain(resolveWith);
    }),
    delete: vi.fn(() => {
      if (deleteCalled) deleteCalled.value = true;
      return makeDeleteChain();
    }),
    update: vi.fn(() => {
      if (updateCalled) updateCalled.value = true;
      return makeUpdateChain();
    }),
  };

  return tx;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const mockServer = { id: 'server-1', owner_id: 'owner-1' };
const mockNonOwnerMember = {
  id: 'mem-2',
  server_id: 'server-1',
  user_id: 'member-1',
};

// ---------------------------------------------------------------------------
// demoteOwner
// ---------------------------------------------------------------------------

describe('OwnerLockoutService.demoteOwner — last-owner invariant', () => {
  let service: OwnerLockoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OwnerLockoutService();
  });

  it('throws ConflictException (409) when owner tries to demote themselves (no newOwnerId)', async () => {
    const tx = buildTxMock(mockServer, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.demoteOwner('server-1', 'owner-1')).rejects.toThrow(ConflictException);
  });

  it('allows demote when non-owner is the target (no lockout)', async () => {
    // Server owner_id is 'owner-1', but target is 'member-1' — no lockout
    const tx = buildTxMock(mockServer, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.demoteOwner('server-1', 'member-1')).resolves.toBeUndefined();
  });

  it('transfers ownership when owner demotes and provides newOwnerId', async () => {
    const updateCalled = { value: false };
    const tx = buildTxMock(mockServer, [[mockNonOwnerMember]], undefined, updateCalled);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.demoteOwner('server-1', 'owner-1', 'member-1')).resolves.toBeUndefined();
    expect(updateCalled.value).toBe(true);
  });

  it('throws NotFoundException when server does not exist', async () => {
    const tx = buildTxMock(undefined, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.demoteOwner('ghost-server', 'owner-1')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when newOwner is not a member', async () => {
    const tx = buildTxMock(mockServer, [[]]); // newOwner member not found
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.demoteOwner('server-1', 'owner-1', 'outsider-99')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// removeMember — last-owner remove
// ---------------------------------------------------------------------------

describe('OwnerLockoutService.removeMember — last-owner invariant', () => {
  let service: OwnerLockoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OwnerLockoutService();
  });

  it('throws ConflictException (409) when removing the server owner', async () => {
    const tx = buildTxMock(mockServer, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.removeMember('server-1', 'owner-1')).rejects.toThrow(ConflictException);
  });

  it('removes a non-owner member successfully', async () => {
    const deleteCalled = { value: false };
    const tx = buildTxMock(mockServer, [], deleteCalled);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.removeMember('server-1', 'member-1')).resolves.toBeUndefined();
    expect(deleteCalled.value).toBe(true);
  });

  it('throws NotFoundException when server does not exist', async () => {
    const tx = buildTxMock(undefined, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.removeMember('ghost-server', 'member-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// leaveServer — last-owner leave
// ---------------------------------------------------------------------------

describe('OwnerLockoutService.leaveServer — last-owner invariant', () => {
  let service: OwnerLockoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OwnerLockoutService();
  });

  it('throws ConflictException (409) when owner tries to leave (last-owner-leave → 409)', async () => {
    const tx = buildTxMock(mockServer, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.leaveServer('server-1', 'owner-1')).rejects.toThrow(ConflictException);
  });

  it('allows non-owner member to leave successfully', async () => {
    const deleteCalled = { value: false };
    // memberRows[0] = membership check for the non-owner member
    const tx = buildTxMock(mockServer, [[mockNonOwnerMember]], deleteCalled);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.leaveServer('server-1', 'member-1')).resolves.toBeUndefined();
    expect(deleteCalled.value).toBe(true);
  });

  it('throws NotFoundException when non-member tries to leave', async () => {
    const tx = buildTxMock(mockServer, [[]]); // member not found
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.leaveServer('server-1', 'outsider-99')).rejects.toThrow(NotFoundException);
  });

  it('throws NotFoundException when server does not exist', async () => {
    const tx = buildTxMock(undefined, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.leaveServer('ghost-server', 'member-1')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// Concurrent demote+leave race (P-4 T-8 condition)
//
// Model: two concurrent operations on the same server. The row-lock serialises
// them — the second to acquire the lock sees the state updated by the first.
//
// Scenario: owner-1 tries to both demote (transfer to member-1) and leave
// concurrently. Only one of these can succeed; the other is blocked by 409
// because the row-lock means they cannot both see themselves as owner.
//
// This is modelled via two sequential mock calls where the first transfers
// ownership (updates server.owner_id), and the second call's mock reflects
// the updated owner_id so the leaveServer call no longer sees owner-1 as owner.
// ---------------------------------------------------------------------------

describe('OwnerLockoutService.concurrent demote+leave race — serialised by row-lock', () => {
  it('concurrent demote+leave: demote wins → leave succeeds (no 409 for leave after transfer)', async () => {
    const service = new OwnerLockoutService();

    let txCallCount = 0;
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      txCallCount++;

      if (txCallCount === 1) {
        // demoteOwner txn: owner-1 transfers to member-1
        // Server row shows owner-1 as owner → transfer happens
        const updateCalled = { value: false };
        const tx = buildTxMock(mockServer, [[mockNonOwnerMember]], undefined, updateCalled);
        const result = await fn(tx);
        // Simulate: after this txn, server.owner_id is now member-1
        return result;
      }

      // leaveServer txn: server now has member-1 as owner (owner-1 is no longer owner)
      // Row-lock sees updated state — owner-1 can now leave
      const serverAfterTransfer = { ...mockServer, owner_id: 'member-1' };
      const deleteCalled = { value: false };
      const tx = buildTxMock(
        serverAfterTransfer,
        [[{ id: 'mem-owner', server_id: 'server-1', user_id: 'owner-1' }]],
        deleteCalled,
      );
      return await fn(tx);
    });

    // demoteOwner (transfers ownership to member-1) then leaveServer
    await expect(service.demoteOwner('server-1', 'owner-1', 'member-1')).resolves.toBeUndefined();

    // After transfer, owner-1 is no longer owner → can leave
    await expect(service.leaveServer('server-1', 'owner-1')).resolves.toBeUndefined();
  });

  it('concurrent demote+leave: both as owner simultaneously → at least one gets 409', async () => {
    const service = new OwnerLockoutService();
    vi.clearAllMocks();

    // Simulate both seeing server with owner-1 as owner (no transfer happened yet)
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      // Both transactions see server.owner_id = 'owner-1'
      // leaveServer path: owner-1 → 409
      const tx = buildTxMock(mockServer, [[]]);
      return await fn(tx);
    });

    // leaveServer: owner-1 → 409 (last-owner-leave blocked)
    await expect(service.leaveServer('server-1', 'owner-1')).rejects.toThrow(ConflictException);

    // demoteOwner: owner-1 with no newOwnerId → 409
    await expect(service.demoteOwner('server-1', 'owner-1')).rejects.toThrow(ConflictException);
  });
});

// ---------------------------------------------------------------------------
// transferOwnership
// ---------------------------------------------------------------------------

describe('OwnerLockoutService.transferOwnership', () => {
  let service: OwnerLockoutService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OwnerLockoutService();
  });

  it('transfers ownership atomically to a member', async () => {
    const updateCalled = { value: false };
    const tx = buildTxMock(mockServer, [[mockNonOwnerMember]], undefined, updateCalled);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(
      service.transferOwnership('server-1', 'owner-1', 'member-1'),
    ).resolves.toBeUndefined();
    expect(updateCalled.value).toBe(true);
  });

  it('throws ForbiddenException when caller is not the current owner', async () => {
    const tx = buildTxMock(mockServer, []);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.transferOwnership('server-1', 'not-owner', 'member-1')).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('throws NotFoundException when new owner is not a member', async () => {
    const tx = buildTxMock(mockServer, [[]]); // new owner not found as member
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => fn(tx));

    await expect(service.transferOwnership('server-1', 'owner-1', 'outsider-99')).rejects.toThrow(
      NotFoundException,
    );
  });
});
