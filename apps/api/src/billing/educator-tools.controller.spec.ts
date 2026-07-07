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
