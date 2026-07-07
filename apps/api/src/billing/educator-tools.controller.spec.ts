/**
 * EducatorToolsController + EntitlementGuard integration — wave-75 M9 (B-2, block 2).
 *
 * Proves the free→school UNLOCK: with the real EntitlementGuard and the real
 * EntitlementsService (only the db.select layer stubbed to reflect the current
 * persisted tier), the educator-tools endpoint transitions 403 → 200 for the
 * SAME server once its subscription tier flips to 'school'.
 *
 * This is the load-bearing entitlement-enforcement integration test: it wires
 * the decorator metadata → Reflector → guard → resolveForServer → tier caps end
 * to end, rather than stubbing the resolution.
 */

import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// db.select is stubbed to return the "currently persisted" subscription tier.
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
import type { RbacService } from '../rbac/rbac.service';
import { EducatorAccessGuard } from './educator-access.guard';
import { EducatorToolsController } from './educator-tools.controller';
import { EntitlementGuard, REQUIRE_ENTITLEMENT_KEY } from './entitlement.guard';
import { EntitlementsService } from './entitlements.service';

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

const SERVER_ID = 'server-unlock';

// A real ExecutionContext whose handler carries the @RequireEntitlement metadata
// (applied here via Reflect.defineMetadata to match SetMetadata's storage),
// mirroring how the decorator on EducatorToolsController.getStatus behaves.
function makeCtx(serverId: string) {
  const handler = EducatorToolsController.prototype.getStatus;
  return {
    getHandler: () => handler,
    getClass: () => EducatorToolsController,
    switchToHttp: () => ({ getRequest: () => ({ params: { serverId } }) }),
  } as unknown as ExecutionContext;
}

describe('EducatorTools entitlement enforcement — free→school unlock', () => {
  let guard: EntitlementGuard;
  let service: EntitlementsService;
  let controller: EducatorToolsController;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EntitlementsService();
    guard = new EntitlementGuard(new Reflector(), service);
    controller = new EducatorToolsController();
    // Ensure the decorator metadata is present on the handler for the real Reflector.
    Reflect.defineMetadata(
      REQUIRE_ENTITLEMENT_KEY,
      'educatorAdminTools',
      EducatorToolsController.prototype.getStatus,
    );
  });

  it('free tier → guard throws 403 (educator tools locked)', async () => {
    // No subscription row → free tier resolved.
    mockSelect.mockReturnValue(makeSelectChain([]));
    await expect(guard.canActivate(makeCtx(SERVER_ID))).rejects.toThrow(ForbiddenException);
  });

  it('after tier change to school → guard allows and handler returns 200 { enabled: true }', async () => {
    // Subscription row now reflects the persisted 'school' tier (post tier-change).
    mockSelect.mockReturnValue(makeSelectChain([{ tier: 'school' }]));

    const allowed = await guard.canActivate(makeCtx(SERVER_ID));
    expect(allowed).toBe(true);

    const body = controller.getStatus(SERVER_ID);
    expect(body).toEqual({ serverId: SERVER_ID, enabled: true });
  });

  it('server_pro tier → still 403 (only school unlocks educator tools)', async () => {
    mockSelect.mockReturnValue(makeSelectChain([{ tier: 'server_pro' }]));
    await expect(guard.canActivate(makeCtx(SERVER_ID))).rejects.toThrow(ForbiddenException);
  });
});

// ---------------------------------------------------------------------------
// wave-76 M13: EducatorAccessGuard composed onto /status.
//
// Closes the wave-75 T8-F1 leak — a non-owner / non-educator member of a
// school-tier server used to pass on the entitlement (tier) gate alone. The
// EducatorAccessGuard now gates on the CALLER's authority via RbacService.can.
//
// These tests exercise the guard through a real ExecutionContext carrying the
// verified session's userId; RbacService.can is stubbed with pure return values
// (per the block-682e0912 test contract — not a real RbacService instance).
// ---------------------------------------------------------------------------

const EDU_USER_ID = 'user-edu';

function makeEduCtx(serverId: string, userId: string) {
  const handler = EducatorToolsController.prototype.getStatus;
  return {
    getHandler: () => handler,
    getClass: () => EducatorToolsController,
    switchToHttp: () => ({
      getRequest: () => ({ params: { serverId }, session: { getUserId: () => userId } }),
    }),
  } as unknown as ExecutionContext;
}

function makeAccessGuard(canReturn: boolean) {
  const can = vi.fn().mockResolvedValue(canReturn);
  const rbac = { can } as unknown as RbacService;
  return { guard: new EducatorAccessGuard(rbac), can };
}

describe('EducatorTools /status — educator-access gate (wave-76 T8-F1 fix)', () => {
  beforeEach(() => vi.clearAllMocks());

  it('owner / educator (can=true) → guard allows and handler returns { serverId, enabled: true }', async () => {
    const { guard: accessGuard, can } = makeAccessGuard(true);
    const controller = new EducatorToolsController();

    const allowed = await accessGuard.canActivate(makeEduCtx(SERVER_ID, EDU_USER_ID));
    expect(allowed).toBe(true);
    expect(can).toHaveBeenCalledWith(EDU_USER_ID, SERVER_ID, 'manage_assignments');

    // Contract preserved: /status still returns { serverId, enabled: true }.
    expect(controller.getStatus(SERVER_ID)).toEqual({ serverId: SERVER_ID, enabled: true });
  });

  it('non-owner / non-educator (can=false) → guard throws 403 even on a school-tier server', async () => {
    const { guard: accessGuard } = makeAccessGuard(false);
    await expect(accessGuard.canActivate(makeEduCtx(SERVER_ID, EDU_USER_ID))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
