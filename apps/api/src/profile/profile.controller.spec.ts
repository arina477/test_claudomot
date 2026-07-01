import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { UpdateProfileSchema } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileController } from './profile.controller';

// Minimal mock session request — mirrors the SessionAugmentedRequest interface.
function makeReq(userId = 'user-abc') {
  return { session: { getUserId: () => userId } };
}

// Minimal user row with all fields B-2 introduces.
function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-abc',
    email: 'test@example.com',
    display_name: null,
    username: null,
    avatar_url: null,
    accent_color: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  };
}

// Build a minimal UsersService mock and instantiate the controller directly.
// NestJS DI (Test.createTestingModule) requires emitDecoratorMetadata which
// esbuild/vitest does not emit, so we wire the mock via direct construction.
function makeController() {
  const usersService = {
    findById: vi.fn(),
    updateDisplayName: vi.fn().mockResolvedValue(undefined),
    updateProfile: vi.fn().mockResolvedValue(undefined),
    setAvatarUrl: vi.fn().mockResolvedValue(undefined),
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
    it('returns 200 with all profile fields for valid displayName input', async () => {
      const user = makeUser({ display_name: 'Alice' });
      usersService.findById.mockResolvedValue(user);
      const result = await controller.updateProfile(makeReq(), { displayName: 'Alice' });
      expect(result).toMatchObject({
        displayName: 'Alice',
        username: null,
        avatarUrl: null,
        accentColor: null,
      });
      expect(usersService.updateProfile).toHaveBeenCalledWith('user-abc', { displayName: 'Alice' });
    });

    it('returns 200 with updated username when valid', async () => {
      const user = makeUser({ username: 'alice_42' });
      usersService.findById.mockResolvedValue(user);
      const result = await controller.updateProfile(makeReq(), { username: 'alice_42' });
      expect(result).toMatchObject({ username: 'alice_42' });
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

    it('throws BadRequestException (400) when body is not an object', async () => {
      await expect(controller.updateProfile(makeReq(), null)).rejects.toThrow(BadRequestException);
    });

    it('throws ConflictException (409) when username is taken', async () => {
      usersService.updateProfile.mockRejectedValue(new ConflictException('username_taken'));
      await expect(controller.updateProfile(makeReq(), { username: 'takenname' })).rejects.toThrow(
        ConflictException,
      );
    });
  });

  // ── GET /profile ─────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns all profile fields including userId for an existing user', async () => {
      usersService.findById.mockResolvedValue(
        makeUser({ display_name: 'Bob', username: 'bob_99', accent_color: '#ff0000' }),
      );
      const result = await controller.getProfile(makeReq());
      expect(result).toEqual({
        userId: 'user-abc',
        displayName: 'Bob',
        username: 'bob_99',
        avatarUrl: null,
        accentColor: '#ff0000',
      });
    });

    it('returns userId with null display fields when all profile fields are null', async () => {
      usersService.findById.mockResolvedValue(makeUser());
      const result = await controller.getProfile(makeReq());
      expect(result).toEqual({
        userId: 'user-abc',
        displayName: null,
        username: null,
        avatarUrl: null,
        accentColor: null,
      });
    });

    it('throws NotFoundException when user does not exist', async () => {
      usersService.findById.mockResolvedValue(undefined);
      await expect(controller.getProfile(makeReq())).rejects.toThrow(NotFoundException);
    });
  });
});

// ── UpdateProfileSchema unit tests ────────────────────────────────────────────

describe('UpdateProfileSchema', () => {
  it('accepts valid username with lowercase alnum and underscore', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'alice_42' });
    expect(result.success).toBe(true);
  });

  it('rejects username shorter than 3 chars', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'ab' });
    expect(result.success).toBe(false);
  });

  it('rejects username longer than 20 chars', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'a'.repeat(21) });
    expect(result.success).toBe(false);
  });

  it('rejects username with uppercase letters', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'Alice' });
    expect(result.success).toBe(false);
  });

  it('rejects username with hyphens', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'alice-bob' });
    expect(result.success).toBe(false);
  });

  it('rejects username with spaces', () => {
    const result = UpdateProfileSchema.safeParse({ username: 'alice bob' });
    expect(result.success).toBe(false);
  });

  it('accepts all-numeric username of valid length', () => {
    const result = UpdateProfileSchema.safeParse({ username: '123' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object (all fields optional)', () => {
    const result = UpdateProfileSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('accepts only accentColor', () => {
    const result = UpdateProfileSchema.safeParse({ accentColor: '#abc123' });
    expect(result.success).toBe(true);
  });
});
