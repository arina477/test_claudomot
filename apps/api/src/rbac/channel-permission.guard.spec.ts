/**
 * ChannelPermissionGuard spec — P-4 T-8 security condition:
 * guard reads ROUTE PARAMS only (no body-spoof).
 *
 * The guard must NOT use req.body for serverId/channelId.
 * It reads ONLY from req.params['id'] and req.params['channelId'].
 * A caller that puts different values in the body must be denied based on
 * the params (not the body).
 */

import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelPermissionGuard } from './channel-permission.guard';
import type { RbacService } from './rbac.service';

// ---------------------------------------------------------------------------
// Minimal ExecutionContext factory
// ---------------------------------------------------------------------------

function makeContext(
  params: Record<string, string>,
  body: Record<string, unknown>,
  sessionUserId = 'user-1',
): ExecutionContext {
  const req = {
    params,
    body,
    session: { getUserId: () => sessionUserId },
  };

  return {
    switchToHttp: () => ({
      getRequest: () => req,
      getResponse: () => ({}),
    }),
  } as unknown as ExecutionContext;
}

// ---------------------------------------------------------------------------
// Mock RbacService
// ---------------------------------------------------------------------------

function makeRbacMock(canViewResult: boolean): RbacService {
  return {
    canViewChannel: vi.fn().mockResolvedValue(canViewResult),
  } as unknown as RbacService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChannelPermissionGuard — route-param-only, no body-spoof', () => {
  let guard: ChannelPermissionGuard;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access when RbacService.canViewChannel returns true', async () => {
    guard = new ChannelPermissionGuard(makeRbacMock(true));
    const ctx = makeContext({ id: 'server-1', channelId: 'ch-1' }, {});

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('throws ForbiddenException when canViewChannel returns false', async () => {
    guard = new ChannelPermissionGuard(makeRbacMock(false));
    const ctx = makeContext({ id: 'server-1', channelId: 'ch-1' }, {});

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('rejects body-spoof: uses route params (not body) for authorization', async () => {
    const rbacMock = makeRbacMock(true);
    guard = new ChannelPermissionGuard(rbacMock);

    // Body contains different (attacker-controlled) server/channel IDs
    const ctx = makeContext(
      { id: 'real-server', channelId: 'real-channel' },
      { id: 'attacker-server', channelId: 'attacker-channel' },
    );

    await guard.canActivate(ctx);

    // canViewChannel must be called with ROUTE PARAMS — not the body values
    expect(rbacMock.canViewChannel).toHaveBeenCalledWith(
      'user-1',
      'real-server', // from params.id, NOT body.id
      'real-channel', // from params.channelId, NOT body.channelId
    );
    expect(rbacMock.canViewChannel).not.toHaveBeenCalledWith(
      expect.anything(),
      'attacker-server',
      expect.anything(),
    );
  });

  it('throws ForbiddenException when route params are missing', async () => {
    guard = new ChannelPermissionGuard(makeRbacMock(true));
    // Missing channelId param
    const ctx = makeContext({ id: 'server-1' }, {});

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when session is missing (unauthenticated)', async () => {
    guard = new ChannelPermissionGuard(makeRbacMock(true));
    const req = {
      params: { id: 'server-1', channelId: 'ch-1' },
      body: {},
      // session intentionally absent
    };
    const ctx = {
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => ({}),
      }),
    } as unknown as ExecutionContext;

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
