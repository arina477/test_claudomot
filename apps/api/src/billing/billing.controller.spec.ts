/**
 * BillingController tests — wave-75 M9 mock freemium upgrade path (B-2, block 1).
 *
 * Boundary under test: POST /servers/:serverId/billing/tier and
 * GET /servers/:serverId/billing/plan.
 *
 * Security-critical assertions:
 *   • owner + valid body → 200 + provider.startTierChange invoked with the
 *     opaque userId (never a username).
 *   • non-owner → 403 and provider.startTierChange NEVER called (no write).
 *   • invalid targetTier → 400 (provider never called).
 *   • unknown serverId → 404 (provider never called).
 *   • same-tier change → 200 idempotent (provider invoked; upsert is no-op).
 *
 * The db module is mocked (owner/member lookups); the BillingProvider and
 * EntitlementsService deps are pure permissive stubs (no live queries) per the
 * wave-74 DI-stub lesson.
 */

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Entitlements, ServerPlan, Tier } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// db mock — owner/member lookups return whatever the current chain resolves to.
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

import { db } from '../db/index';
import { BillingController } from './billing.controller';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'orderBy', 'innerJoin', 'leftJoin', 'groupBy']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Fixtures + helpers
// ---------------------------------------------------------------------------

function makeReq(userId = 'owner-1') {
  return { session: { getUserId: () => userId } };
}

const OWNER = 'owner-1';
const SERVER_ID = 'server-1';

const schoolEntitlements: Entitlements = {
  storageMb: 512_000,
  callCapacity: 100,
  educatorAdminTools: true,
};

const freeEntitlements: Entitlements = {
  storageMb: 2_048,
  callCapacity: 10,
  educatorAdminTools: false,
};

/**
 * Build a controller with pure stubs for the provider + entitlements service.
 * `providerResult` is what startTierChange resolves to; `resolveForServer`
 * result is used by the GET /plan path.
 */
function makeController(opts?: {
  providerResult?: {
    status: 'ok';
    tier: Tier;
    entitlements: Entitlements;
    checkoutUrl: string | null;
  };
  resolvePlan?: { tier: Tier; entitlements: Entitlements };
}) {
  const startTierChange = vi.fn().mockResolvedValue(
    opts?.providerResult ?? {
      status: 'ok',
      tier: 'school',
      entitlements: schoolEntitlements,
      checkoutUrl: null,
    },
  );
  const resolveForServer = vi
    .fn()
    .mockResolvedValue(opts?.resolvePlan ?? { tier: 'free', entitlements: freeEntitlements });

  const billingProvider = { startTierChange };
  const entitlementsService = { resolveForServer };

  const controller = new BillingController(
    // biome-ignore lint/suspicious/noExplicitAny: test stub — full type not needed
    billingProvider as any,
    // biome-ignore lint/suspicious/noExplicitAny: test stub — full type not needed
    entitlementsService as any,
  );
  return { controller, startTierChange, resolveForServer };
}

// ---------------------------------------------------------------------------
// POST /servers/:serverId/billing/tier
// ---------------------------------------------------------------------------

describe('BillingController.changeTier', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('owner + valid targetTier → 200 ServerPlan and provider invoked with opaque userId', async () => {
    // Server exists and is owned by OWNER.
    mockSelect.mockReturnValue(makeSelectChain([{ id: SERVER_ID, owner_id: OWNER }]));

    const { controller, startTierChange } = makeController({
      providerResult: {
        status: 'ok',
        tier: 'school',
        entitlements: schoolEntitlements,
        checkoutUrl: null,
      },
    });

    const result = await controller.changeTier(makeReq(OWNER), SERVER_ID, {
      targetTier: 'school',
    });

    const expected: ServerPlan = {
      serverId: SERVER_ID,
      tier: 'school',
      entitlements: schoolEntitlements,
    };
    expect(result).toEqual(expected);
    // Opaque userId (getUserId()) passed to the provider — never a username.
    expect(startTierChange).toHaveBeenCalledWith(SERVER_ID, 'school', OWNER);
  });

  it('non-owner → 403 and provider.startTierChange is NEVER called (no write)', async () => {
    // Server exists but is owned by someone else.
    mockSelect.mockReturnValue(makeSelectChain([{ id: SERVER_ID, owner_id: 'someone-else' }]));

    const { controller, startTierChange } = makeController();

    await expect(
      controller.changeTier(makeReq('attacker'), SERVER_ID, { targetTier: 'school' }),
    ).rejects.toThrow(ForbiddenException);
    expect(startTierChange).not.toHaveBeenCalled();
  });

  it('invalid targetTier → 400 (provider never called)', async () => {
    const { controller, startTierChange } = makeController();

    await expect(
      controller.changeTier(makeReq(OWNER), SERVER_ID, { targetTier: 'enterprise_unknown' }),
    ).rejects.toThrow(BadRequestException);
    expect(startTierChange).not.toHaveBeenCalled();
  });

  it('missing targetTier → 400 (provider never called)', async () => {
    const { controller, startTierChange } = makeController();

    await expect(controller.changeTier(makeReq(OWNER), SERVER_ID, {})).rejects.toThrow(
      BadRequestException,
    );
    expect(startTierChange).not.toHaveBeenCalled();
  });

  it('unknown serverId → 404 (provider never called)', async () => {
    // Server lookup returns no row.
    mockSelect.mockReturnValue(makeSelectChain([]));

    const { controller, startTierChange } = makeController();

    await expect(
      controller.changeTier(makeReq(OWNER), 'ghost-server', { targetTier: 'school' }),
    ).rejects.toThrow(NotFoundException);
    expect(startTierChange).not.toHaveBeenCalled();
  });

  it('same-tier change → 200 idempotent no-op (provider invoked, returns same tier)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([{ id: SERVER_ID, owner_id: OWNER }]));

    const { controller, startTierChange } = makeController({
      providerResult: {
        status: 'ok',
        tier: 'free',
        entitlements: freeEntitlements,
        checkoutUrl: null,
      },
    });

    const result = await controller.changeTier(makeReq(OWNER), SERVER_ID, { targetTier: 'free' });

    expect(result).toEqual({
      serverId: SERVER_ID,
      tier: 'free',
      entitlements: freeEntitlements,
    });
    expect(startTierChange).toHaveBeenCalledWith(SERVER_ID, 'free', OWNER);
  });
});

// ---------------------------------------------------------------------------
// GET /servers/:serverId/billing/plan
// ---------------------------------------------------------------------------

describe('BillingController.getPlan', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('owner → 200 ServerPlan (no member lookup needed)', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([{ id: SERVER_ID, owner_id: OWNER }]));

    const { controller, resolveForServer } = makeController({
      resolvePlan: { tier: 'school', entitlements: schoolEntitlements },
    });

    const result = await controller.getPlan(makeReq(OWNER), SERVER_ID);

    expect(result).toEqual({
      serverId: SERVER_ID,
      tier: 'school',
      entitlements: schoolEntitlements,
    });
    expect(resolveForServer).toHaveBeenCalledWith(SERVER_ID);
  });

  it('non-owner member → 200 ServerPlan', async () => {
    // First select: server row (not owner). Second select: member row present.
    mockSelect
      .mockReturnValueOnce(makeSelectChain([{ id: SERVER_ID, owner_id: 'someone-else' }]))
      .mockReturnValueOnce(makeSelectChain([{ id: 'member-row-1' }]));

    const { controller } = makeController({
      resolvePlan: { tier: 'free', entitlements: freeEntitlements },
    });

    const result = await controller.getPlan(makeReq('member-user'), SERVER_ID);

    expect(result.serverId).toBe(SERVER_ID);
    expect(result.tier).toBe('free');
  });

  it('non-owner non-member → 403', async () => {
    // Server row (not owner) + empty member lookup.
    mockSelect
      .mockReturnValueOnce(makeSelectChain([{ id: SERVER_ID, owner_id: 'someone-else' }]))
      .mockReturnValueOnce(makeSelectChain([]));

    const { controller } = makeController();

    await expect(controller.getPlan(makeReq('stranger'), SERVER_ID)).rejects.toThrow(
      ForbiddenException,
    );
  });

  it('unknown serverId → 404', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    const { controller } = makeController();

    await expect(controller.getPlan(makeReq(OWNER), 'ghost-server')).rejects.toThrow(
      NotFoundException,
    );
  });
});
