/**
 * ChannelMessageGuard spec — wave-12 T-8 security conditions
 *
 * Verifies:
 *   - 403 for non-member on a private channel (key T-8 condition)
 *   - 200 (pass-through) for a permitted member
 *   - channelId read from route params only (IDOR-safe)
 *   - Missing channelId param → 403
 *   - Missing session → 403
 */

import { type ExecutionContext, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ChannelMessageGuard } from './channel-message.guard';
import type { RbacService } from './rbac.service';

// ---------------------------------------------------------------------------
// Minimal ExecutionContext factory
// ---------------------------------------------------------------------------

function makeContext(
  params: Record<string, string>,
  body: Record<string, unknown>,
  sessionUserId = 'user-1',
  withSession = true,
): ExecutionContext {
  const req: Record<string, unknown> = {
    params,
    body,
  };
  if (withSession) {
    req.session = { getUserId: () => sessionUserId };
  }

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
    canViewChannelById: vi.fn().mockResolvedValue(canViewResult),
  } as unknown as RbacService;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ChannelMessageGuard', () => {
  let guard: ChannelMessageGuard;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows access when canViewChannelById returns true (permitted member)', async () => {
    guard = new ChannelMessageGuard(makeRbacMock(true));
    const ctx = makeContext({ channelId: 'ch-1' }, {});

    const result = await guard.canActivate(ctx);
    expect(result).toBe(true);
  });

  it('throws ForbiddenException (403) for a non-member on a private channel (T-8 condition)', async () => {
    // canViewChannelById returns false → user is not permitted (e.g. private channel)
    guard = new ChannelMessageGuard(makeRbacMock(false));
    const ctx = makeContext({ channelId: 'private-ch' }, {}, 'non-member-user');

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('reads channelId from route params only — body values are ignored (IDOR-safe)', async () => {
    const rbacMock = makeRbacMock(true);
    guard = new ChannelMessageGuard(rbacMock);

    // Route param: real-channel; body: attacker-controlled channel
    const ctx = makeContext({ channelId: 'real-channel' }, { channelId: 'attacker-channel' });

    await guard.canActivate(ctx);

    // Must call canViewChannelById with the ROUTE PARAM value, not the body
    expect(rbacMock.canViewChannelById).toHaveBeenCalledWith('user-1', 'real-channel');
    expect(rbacMock.canViewChannelById).not.toHaveBeenCalledWith(
      expect.anything(),
      'attacker-channel',
    );
  });

  it('throws ForbiddenException when channelId route param is missing', async () => {
    guard = new ChannelMessageGuard(makeRbacMock(true));
    // No channelId in params
    const ctx = makeContext({}, {});

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('throws ForbiddenException when session is missing (unauthenticated)', async () => {
    guard = new ChannelMessageGuard(makeRbacMock(true));
    const ctx = makeContext({ channelId: 'ch-1' }, {}, 'user-1', false);

    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
