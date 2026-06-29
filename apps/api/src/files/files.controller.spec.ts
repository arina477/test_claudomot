import {
  BadRequestException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { FilesController } from './files.controller';

// Minimal mock session request — mirrors the SessionAugmentedRequest interface.
function makeReq(userId = 'user-abc') {
  return { session: { getUserId: () => userId } };
}

// Build minimal FilesService and UsersService mocks and wire the controller
// directly, following the same pattern as profile.controller.spec.ts (no NestJS
// Test.createTestingModule — esbuild/vitest does not emit emitDecoratorMetadata).
function makeController() {
  const filesService = {
    presignAvatarUpload: vi.fn().mockResolvedValue({
      uploadUrl: 'https://signed.example.com/put-url',
      key: 'avatars/user-abc/some-uuid.png',
    }),
    // Default: size check passes (no throw).
    checkAvatarSize: vi.fn().mockResolvedValue(undefined),
    resolvePublicUrl: vi
      .fn()
      .mockReturnValue('https://cdn.example.com/avatars/user-abc/some-uuid.png'),
  };
  const usersService = {
    setAvatarUrl: vi.fn().mockResolvedValue(undefined),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full service types not needed
  const controller = new FilesController(filesService as any, usersService as any);
  return { controller, filesService, usersService };
}

describe('FilesController', () => {
  let controller: FilesController;
  let filesService: ReturnType<typeof makeController>['filesService'];
  let usersService: ReturnType<typeof makeController>['usersService'];

  beforeEach(() => {
    ({ controller, filesService, usersService } = makeController());
  });

  // ── POST /profile/avatar/presign ─────────────────────────────────────────────

  describe('presign', () => {
    it('returns uploadUrl and key for a valid content-type', async () => {
      const result = await controller.presign(makeReq(), { contentType: 'image/png' });
      expect(result).toEqual({
        uploadUrl: 'https://signed.example.com/put-url',
        key: 'avatars/user-abc/some-uuid.png',
      });
      expect(filesService.presignAvatarUpload).toHaveBeenCalledWith('user-abc', 'image/png');
    });

    it('throws BadRequestException (400) for disallowed content-type', async () => {
      await expect(controller.presign(makeReq(), { contentType: 'image/gif' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException (400) when contentType is missing', async () => {
      await expect(controller.presign(makeReq(), {})).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when body is null', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing null body guard
      await expect(controller.presign(makeReq(), null as any)).rejects.toThrow(BadRequestException);
    });
  });

  // ── POST /profile/avatar/confirm ─────────────────────────────────────────────

  describe('confirm — key ownership enforcement (B-6 defense-in-depth)', () => {
    it('accepts a key scoped to the calling user and returns avatarUrl', async () => {
      const result = await controller.confirm(makeReq('user-abc'), {
        key: 'avatars/user-abc/some-uuid.png',
      });
      expect(result).toEqual({
        avatarUrl: 'https://cdn.example.com/avatars/user-abc/some-uuid.png',
      });
      expect(usersService.setAvatarUrl).toHaveBeenCalledWith(
        'user-abc',
        'https://cdn.example.com/avatars/user-abc/some-uuid.png',
      );
    });

    it('throws BadRequestException (400) when key belongs to a different userId', async () => {
      // Caller is user-abc but the key is scoped to user-EVIL — must be rejected.
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-EVIL/some-uuid.png' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when key has no avatars/ prefix at all', async () => {
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'uploads/user-abc/file.png' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when key starts with avatars/ but omits userId segment', async () => {
      // e.g. "avatars/some-uuid.png" — misses the user-abc/ segment entirely.
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/some-uuid.png' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when key uses a userId that is a prefix of the caller', async () => {
      // Ensures startsWith(`avatars/${userId}/`) is not fooled by a prefix-only match.
      // caller = "user-abc", attacker key prefix = "avatars/user-ab/"
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-ab/c/evil.png' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when key is missing', async () => {
      await expect(controller.confirm(makeReq(), {})).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException (400) when key is not a string', async () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing non-string key guard
      await expect(controller.confirm(makeReq(), { key: 123 as any })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException (400) when storage is not configured', async () => {
      filesService.resolvePublicUrl.mockReturnValue(null);
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('propagates PayloadTooLargeException (413) when checkAvatarSize rejects oversized upload', async () => {
      // Simulate the service detecting a >2MB object.
      filesService.checkAvatarSize.mockRejectedValue(
        new PayloadTooLargeException({ code: 'AVATAR_TOO_LARGE' }),
      );
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' }),
      ).rejects.toThrow(PayloadTooLargeException);
    });

    it('calls checkAvatarSize before setAvatarUrl (size check runs before DB write)', async () => {
      // Ensures size enforcement is not bypassed even when storage is configured.
      const callOrder: string[] = [];
      filesService.checkAvatarSize.mockImplementation(async () => {
        callOrder.push('checkAvatarSize');
      });
      usersService.setAvatarUrl.mockImplementation(async () => {
        callOrder.push('setAvatarUrl');
      });

      await controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' });

      expect(callOrder).toEqual(['checkAvatarSize', 'setAvatarUrl']);
    });

    it('propagates ServiceUnavailableException (503) from checkAvatarSize when storage unconfigured', async () => {
      filesService.checkAvatarSize.mockRejectedValue(
        new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' }),
      );
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });
  });
});
