/**
 * EducatorAccessGuard — wave-76 M13 (B-2, block 682e0912).
 *
 * Proves the composed owner/educator predicate. The guard delegates the entire
 * owner/role resolution to RbacService.can(); these tests stub can() with pure
 * return values (NOT a real RbacService instance through any db/fault pool) so
 * we assert ONLY the guard's own behavior: param + session resolution, the
 * delegation call shape, and the allow/deny mapping.
 */

import { ForbiddenException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { RbacService } from '../rbac/rbac.service';
import { EducatorAccessGuard } from './educator-access.guard';

const SERVER_ID = 'server-abc';
const USER_ID = 'user-123';

function makeCtx(opts: { serverId?: string; userId?: string | null }): ExecutionContext {
  const session = opts.userId === null ? undefined : { getUserId: () => opts.userId ?? USER_ID };
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        params: opts.serverId === undefined ? {} : { serverId: opts.serverId },
        session,
      }),
    }),
  } as unknown as ExecutionContext;
}

function makeGuard(canReturn: boolean) {
  const can = vi.fn().mockResolvedValue(canReturn);
  const rbac = { can } as unknown as RbacService;
  return { guard: new EducatorAccessGuard(rbac), can };
}

describe('EducatorAccessGuard', () => {
  beforeEach(() => vi.clearAllMocks());

  it('owner → can() true → allows', async () => {
    // Owner is folded into can()'s superuser branch; can() returns true.
    const { guard, can } = makeGuard(true);
    await expect(guard.canActivate(makeCtx({ serverId: SERVER_ID }))).resolves.toBe(true);
    expect(can).toHaveBeenCalledWith(USER_ID, SERVER_ID, 'manage_assignments');
  });

  it('educator member (manage_assignments role) → can() true → allows', async () => {
    const { guard, can } = makeGuard(true);
    await expect(guard.canActivate(makeCtx({ serverId: SERVER_ID }))).resolves.toBe(true);
    expect(can).toHaveBeenCalledWith(USER_ID, SERVER_ID, 'manage_assignments');
  });

  it('non-owner / non-educator → can() false → ForbiddenException', async () => {
    const { guard, can } = makeGuard(false);
    await expect(guard.canActivate(makeCtx({ serverId: SERVER_ID }))).rejects.toThrow(
      ForbiddenException,
    );
    expect(can).toHaveBeenCalledWith(USER_ID, SERVER_ID, 'manage_assignments');
  });

  it('missing :serverId param → ForbiddenException (wiring bug, never checks can)', async () => {
    const { guard, can } = makeGuard(true);
    await expect(guard.canActivate(makeCtx({}))).rejects.toThrow(ForbiddenException);
    expect(can).not.toHaveBeenCalled();
  });

  it('missing session → ForbiddenException (defence-in-depth, never checks can)', async () => {
    const { guard, can } = makeGuard(true);
    await expect(guard.canActivate(makeCtx({ serverId: SERVER_ID, userId: null }))).rejects.toThrow(
      ForbiddenException,
    );
    expect(can).not.toHaveBeenCalled();
  });
});
