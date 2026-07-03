import {
  BadRequestException,
  NotFoundException,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
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
    // wave-38: confirm now calls setAvatar (key + url) instead of setAvatarUrl (url only)
    setAvatar: vi.fn().mockResolvedValue(undefined),
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
    // wave-38: confirm handler requires PUBLIC_API_URL to build the stable avatar URL.
    process.env.PUBLIC_API_URL = 'https://api.studyhall.test';
    ({ controller, filesService, usersService } = makeController());
  });

  afterEach(() => {
    Reflect.deleteProperty(process.env, 'PUBLIC_API_URL');
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
    it('accepts a key scoped to the calling user and returns a stable avatarUrl', async () => {
      // wave-38: confirm now returns a stable app URL (<PUBLIC_API_URL>/users/:id/avatar?v=<hash>)
      // instead of a raw S3 URL. The ?v= hash is SHA-256(key).slice(0,8) — deterministic.
      const result = await controller.confirm(makeReq('user-abc'), {
        key: 'avatars/user-abc/some-uuid.png',
      });
      // Stable app URL — must route through the redirect endpoint, not raw S3.
      expect(result.avatarUrl).toMatch(
        /^https:\/\/api\.studyhall\.test\/users\/user-abc\/avatar\?v=[0-9a-f]{8}$/,
      );
      // setAvatar(userId, key, url) is called — both key and url persisted together.
      expect(usersService.setAvatar).toHaveBeenCalledWith(
        'user-abc',
        'avatars/user-abc/some-uuid.png',
        result.avatarUrl,
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

    it('throws ServiceUnavailableException (503) when PUBLIC_API_URL is not set', async () => {
      // wave-38: confirm now requires PUBLIC_API_URL to build the stable avatar URL.
      // When absent it throws 503 STORAGE_NOT_CONFIGURED (same family as missing S3 creds).
      Reflect.deleteProperty(process.env, 'PUBLIC_API_URL');
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' }),
      ).rejects.toThrow(ServiceUnavailableException);
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

    it('calls checkAvatarSize before setAvatar (size check runs before DB write)', async () => {
      // Ensures size enforcement is not bypassed even when storage is configured.
      // wave-38: the DB write is now usersService.setAvatar (key+url), not setAvatarUrl.
      const callOrder: string[] = [];
      filesService.checkAvatarSize.mockImplementation(async () => {
        callOrder.push('checkAvatarSize');
      });
      usersService.setAvatar.mockImplementation(async () => {
        callOrder.push('setAvatar');
      });

      await controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' });

      expect(callOrder).toEqual(['checkAvatarSize', 'setAvatar']);
    });

    it('propagates ServiceUnavailableException (503) from checkAvatarSize when storage unconfigured', async () => {
      filesService.checkAvatarSize.mockRejectedValue(
        new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' }),
      );
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/some-uuid.png' }),
      ).rejects.toThrow(ServiceUnavailableException);
    });

    // ── wave-40 (task 7525b759): never-uploaded key → 404 ────────────────────

    it('propagates NotFoundException (404) from checkAvatarSize when key was never uploaded (NoSuchKey)', async () => {
      // Simulates HeadObject NoSuchKey → checkAvatarSize → NotFoundException.
      // The controller must not suppress it — 404 surfaces to the client.
      filesService.checkAvatarSize.mockRejectedValue(
        new NotFoundException('Avatar object not found'),
      );
      await expect(
        controller.confirm(makeReq('user-abc'), { key: 'avatars/user-abc/never-uploaded.png' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('does NOT persist avatar when checkAvatarSize throws NotFoundException (never-uploaded key)', async () => {
      // Guard: no DB write must occur when the key is not found in storage.
      filesService.checkAvatarSize.mockRejectedValue(
        new NotFoundException('Avatar object not found'),
      );
      try {
        await controller.confirm(makeReq('user-abc'), {
          key: 'avatars/user-abc/never-uploaded.png',
        });
      } catch {
        // expected NotFoundException
      }
      expect(usersService.setAvatar).not.toHaveBeenCalled();
    });
  });
});
