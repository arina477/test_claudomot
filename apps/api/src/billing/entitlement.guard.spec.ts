/**
 * EntitlementGuard tests — wave-75 M9 (B-2, block 2).
 *
 * Asserts:
 *   • 403 when the required flag (educatorAdminTools) is false (free/server_pro).
 *   • allowed (true) when the flag is true (school).
 *   • pass-through when no @RequireEntitlement metadata is present.
 *   • 403 when a gated route lacks the :serverId param (wiring guard).
 *
 * Reflector + EntitlementsService are pure stubs (no live queries).
 */

import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { Entitlements } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EntitlementGuard } from './entitlement.guard';
import type { EntitlementsService } from './entitlements.service';

const freeEntitlements: Entitlements = {
  storageMb: 2_048,
  callCapacity: 10,
  educatorAdminTools: false,
};
const serverProEntitlements: Entitlements = {
  storageMb: 51_200,
  callCapacity: 50,
  educatorAdminTools: false,
};
const schoolEntitlements: Entitlements = {
  storageMb: 512_000,
  callCapacity: 100,
  educatorAdminTools: true,
};

function makeCtx(serverId: string | undefined): ExecutionContext {
  return {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({
      getRequest: () => ({ params: serverId ? { serverId } : {} }),
    }),
  } as unknown as ExecutionContext;
}

function makeGuard(opts: {
  flag: string | undefined;
  entitlements: Entitlements;
}) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(opts.flag),
  } as unknown as Reflector;
  const resolveForServer = vi
    .fn()
    .mockResolvedValue({ tier: 'x', entitlements: opts.entitlements });
  const entitlementsService = { resolveForServer } as unknown as EntitlementsService;
  return {
    guard: new EntitlementGuard(reflector, entitlementsService),
    resolveForServer,
  };
}

describe('EntitlementGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('throws 403 when educatorAdminTools is false (free tier)', async () => {
    const { guard } = makeGuard({ flag: 'educatorAdminTools', entitlements: freeEntitlements });
    await expect(guard.canActivate(makeCtx('server-1'))).rejects.toThrow(ForbiddenException);
  });

  it('throws 403 when educatorAdminTools is false (server_pro tier)', async () => {
    const { guard } = makeGuard({
      flag: 'educatorAdminTools',
      entitlements: serverProEntitlements,
    });
    await expect(guard.canActivate(makeCtx('server-1'))).rejects.toThrow(ForbiddenException);
  });

  it('allows (true) when educatorAdminTools is true (school tier)', async () => {
    const { guard, resolveForServer } = makeGuard({
      flag: 'educatorAdminTools',
      entitlements: schoolEntitlements,
    });
    await expect(guard.canActivate(makeCtx('server-1'))).resolves.toBe(true);
    expect(resolveForServer).toHaveBeenCalledWith('server-1');
  });

  it('is a pass-through when no @RequireEntitlement metadata is present', async () => {
    const { guard, resolveForServer } = makeGuard({
      flag: undefined,
      entitlements: freeEntitlements,
    });
    await expect(guard.canActivate(makeCtx('server-1'))).resolves.toBe(true);
    // No flag → resolveForServer must not even be consulted.
    expect(resolveForServer).not.toHaveBeenCalled();
  });

  it('throws 403 when a gated route has no :serverId param (wiring guard)', async () => {
    const { guard } = makeGuard({ flag: 'educatorAdminTools', entitlements: schoolEntitlements });
    await expect(guard.canActivate(makeCtx(undefined))).rejects.toThrow(ForbiddenException);
  });
});
