/**
 * Unit tests: UsersController — wave-40 (task 7525b759) boundary guard.
 *
 * Verifies:
 *   1. GET /users/:userId/avatar with a NUL byte / ASCII control char → 400
 *      (BadRequestException thrown before service call).
 *   2. REGRESSION GUARD: GET /users/:userId/avatar with a valid non-UUID-shaped
 *      SuperTokens id (opaque text, not a canonical UUID) → NOT 400. The guard
 *      must impose NO uuid shape; only control bytes are rejected.
 *   3. Happy-path behavior preserved: valid userId → service call executes normally.
 *
 * No DB / NestJS bootstrap required — the guard fires before any I/O.
 */

import {
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UsersController } from './users.controller';

// Minimal mock for UsersService and FilesService — only the methods called by
// redirectToAvatar matter here.
function makeController(opts: { avatarKey?: string | null; presignedUrl?: string | null } = {}) {
  const { avatarKey = null, presignedUrl = null } = opts;
  const usersService = {
    findAvatarKey: vi.fn().mockResolvedValue(avatarKey),
  };
  const filesService = {
    resolveAvatarUrl: vi.fn().mockResolvedValue(presignedUrl),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full service types not needed
  const controller = new UsersController(usersService as any, filesService as any);
  return { controller, usersService, filesService };
}

describe('UsersController.redirectToAvatar — wave-40 (task 7525b759) NUL/control-byte guard', () => {
  let controller: UsersController;
  let usersService: ReturnType<typeof makeController>['usersService'];

  beforeEach(() => {
    ({ controller, usersService } = makeController({ avatarKey: null }));
  });

  // ── Fix #1: NUL byte / control char → 400 ────────────────────────────────

  it('throws BadRequestException (400) when userId contains a NUL byte (\\x00)', async () => {
    await expect(controller.redirectToAvatar('\x00')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) when userId contains %00 (URL-decoded NUL)', async () => {
    // Express decodes %00 to \x00 before NestJS sees it — guard catches the decoded form.
    await expect(controller.redirectToAvatar('\x00abc')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) when userId contains a tab (\\x09)', async () => {
    await expect(controller.redirectToAvatar('user\x09id')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) when userId contains a newline (\\x0a)', async () => {
    await expect(controller.redirectToAvatar('user\x0aid')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) when userId contains a carriage return (\\x0d)', async () => {
    await expect(controller.redirectToAvatar('user\x0did')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException (400) when userId contains DEL (\\x7f)', async () => {
    await expect(controller.redirectToAvatar('user\x7fid')).rejects.toThrow(BadRequestException);
  });

  it('does NOT call usersService.findAvatarKey when control char is detected (guard is pre-service)', async () => {
    try {
      await controller.redirectToAvatar('\x00evil');
    } catch {
      // expected
    }
    expect(usersService.findAvatarKey).not.toHaveBeenCalled();
  });

  // ── Fix #1 REGRESSION GUARD: valid non-UUID ids must NOT be rejected ──────

  it('REGRESSION: does NOT throw 400 for a valid non-UUID SuperTokens id (st-user-abc123)', async () => {
    // SuperTokens user ids are opaque text — not canonical UUIDs. The guard must
    // let these through unchanged. With no avatar set this should reach the
    // NotFoundException path (404), not BadRequestException (400).
    const { controller: c } = makeController({ avatarKey: null });
    await expect(c.redirectToAvatar('st-user-abc123')).rejects.toThrow(NotFoundException);
    await expect(c.redirectToAvatar('st-user-abc123')).rejects.not.toThrow(BadRequestException);
  });

  it('REGRESSION: does NOT throw 400 for an alphanumeric id (abc123)', async () => {
    const { controller: c } = makeController({ avatarKey: null });
    await expect(c.redirectToAvatar('abc123')).rejects.toThrow(NotFoundException);
    await expect(c.redirectToAvatar('abc123')).rejects.not.toThrow(BadRequestException);
  });

  it('REGRESSION: does NOT throw 400 for a real UUID-shaped id', async () => {
    const { controller: c } = makeController({ avatarKey: null });
    await expect(c.redirectToAvatar('a0000000-beef-beef-beef-000000000001')).rejects.toThrow(
      NotFoundException,
    );
    await expect(c.redirectToAvatar('a0000000-beef-beef-beef-000000000001')).rejects.not.toThrow(
      BadRequestException,
    );
  });

  // ── Happy path: valid userId with avatar → 302 ───────────────────────────

  it('returns { url, statusCode: 302 } when user has an avatar and storage is configured', async () => {
    const { controller: c } = makeController({
      avatarKey: 'avatars/user-abc/photo.png',
      presignedUrl: 'https://signed.example.com/get-url',
    });
    const result = await c.redirectToAvatar('user-abc');
    expect(result).toEqual({ url: 'https://signed.example.com/get-url', statusCode: 302 });
  });

  it('throws NotFoundException (404) when user has no avatar (null key)', async () => {
    const { controller: c } = makeController({ avatarKey: null });
    await expect(c.redirectToAvatar('user-abc')).rejects.toThrow(NotFoundException);
  });

  it('throws ServiceUnavailableException (503) when presignedUrl is null (storage not configured)', async () => {
    const { controller: c } = makeController({
      avatarKey: 'avatars/user-abc/photo.png',
      presignedUrl: null,
    });
    await expect(c.redirectToAvatar('user-abc')).rejects.toThrow(ServiceUnavailableException);
  });
});
