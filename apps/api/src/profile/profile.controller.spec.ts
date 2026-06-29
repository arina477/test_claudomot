import { BadRequestException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileController } from './profile.controller';

// Minimal mock session request — mirrors the SessionAugmentedRequest interface.
function makeReq(userId = 'user-abc') {
  return { session: { getUserId: () => userId } };
}

// Build a minimal UsersService mock and instantiate the controller directly.
// NestJS DI (Test.createTestingModule) requires emitDecoratorMetadata which
// esbuild/vitest does not emit, so we wire the mock via direct construction.
function makeController() {
  const usersService = {
    findById: vi.fn(),
    updateDisplayName: vi.fn().mockResolvedValue(undefined),
  };
  // ProfileController constructor accepts UsersService — pass mock directly.
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full UsersService type not needed
  const controller = new ProfileController(usersService as any);
  return { controller, usersService };
}

describe('ProfileController', () => {
  let controller: ProfileController;
  let usersService: ReturnType<typeof makeController>['usersService'];

  beforeEach(() => {
    ({ controller, usersService } = makeController());
  });

  // ── PATCH /profile ──────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('returns 200 with displayName for valid input', async () => {
      const result = await controller.updateProfile(makeReq(), { displayName: 'Alice' });
      expect(result).toEqual({ displayName: 'Alice' });
      expect(usersService.updateDisplayName).toHaveBeenCalledWith('user-abc', 'Alice');
    });

    it('throws BadRequestException (400) for empty displayName', async () => {
      await expect(controller.updateProfile(makeReq(), { displayName: '' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException (400) for displayName longer than 50 chars', async () => {
      const longName = 'a'.repeat(51);
      await expect(controller.updateProfile(makeReq(), { displayName: longName })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException (400) when body is missing displayName', async () => {
      await expect(controller.updateProfile(makeReq(), {})).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when body is not an object', async () => {
      await expect(controller.updateProfile(makeReq(), null)).rejects.toThrow(BadRequestException);
    });
  });

  // ── GET /profile ─────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns displayName for an existing user', async () => {
      usersService.findById.mockResolvedValue({ display_name: 'Bob' });
      const result = await controller.getProfile(makeReq());
      expect(result).toEqual({ displayName: 'Bob' });
    });

    it('returns null displayName when display_name is null', async () => {
      usersService.findById.mockResolvedValue({ display_name: null });
      const result = await controller.getProfile(makeReq());
      expect(result).toEqual({ displayName: null });
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersService.findById.mockResolvedValue(undefined);
      await expect(controller.getProfile(makeReq())).rejects.toThrow(NotFoundException);
    });
  });
});
