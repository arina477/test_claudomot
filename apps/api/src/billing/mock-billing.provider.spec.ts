/**
 * MockBillingProvider tests — wave-75 M9 (B-2, block 1).
 *
 * Asserts:
 *   • startTierChange issues a single upsert (insert().values().onConflictDoUpdate())
 *     keyed on server_id → exactly one row per server (UNIQUE(server_id)).
 *   • the result re-resolves entitlements from the persisted tier and always
 *     carries checkoutUrl: null (the mock-mode marker — no real payment).
 */

import type { Entitlements } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../db/index', () => ({
  db: {
    insert: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

import { db } from '../db/index';
import type { EntitlementsService } from './entitlements.service';
import { MockBillingProvider } from './mock-billing.provider';

type MockFn = ReturnType<typeof vi.fn>;
const mockInsert = db.insert as unknown as MockFn;

const schoolEntitlements: Entitlements = {
  storageMb: 512_000,
  callCapacity: 100,
  educatorAdminTools: true,
};

describe('MockBillingProvider.startTierChange', () => {
  let provider: MockBillingProvider;
  let resolveForServer: MockFn;
  let onConflictDoUpdate: MockFn;
  let values: MockFn;

  beforeEach(() => {
    vi.clearAllMocks();

    // Build the drizzle upsert chain: insert().values().onConflictDoUpdate()
    onConflictDoUpdate = vi.fn().mockResolvedValue(undefined);
    values = vi.fn().mockReturnValue({ onConflictDoUpdate });
    mockInsert.mockReturnValue({ values });

    resolveForServer = vi
      .fn()
      .mockResolvedValue({ tier: 'school', entitlements: schoolEntitlements });
    const entitlementsService = { resolveForServer } as unknown as EntitlementsService;
    provider = new MockBillingProvider(entitlementsService);
  });

  it('issues exactly one upsert (insert→values→onConflictDoUpdate) per call', async () => {
    await provider.startTierChange('server-1', 'school', 'owner-1');

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledTimes(1);
    expect(values).toHaveBeenCalledWith({ server_id: 'server-1', tier: 'school' });
    expect(onConflictDoUpdate).toHaveBeenCalledTimes(1);
  });

  it('returns status ok + re-resolved entitlements + checkoutUrl null (mock marker)', async () => {
    const result = await provider.startTierChange('server-1', 'school', 'owner-1');

    expect(result.status).toBe('ok');
    expect(result.tier).toBe('school');
    expect(result.entitlements).toEqual(schoolEntitlements);
    expect(result.checkoutUrl).toBeNull();
    // Entitlements re-resolved from the persisted server tier.
    expect(resolveForServer).toHaveBeenCalledWith('server-1');
  });
});
