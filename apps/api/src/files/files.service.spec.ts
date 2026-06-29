import { ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted to the top of the file by vitest — the factory must not
// reference local variables. We stub the module here; each test can configure
// the returned mock value via the imported module's mock spy.
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.example.com/put-url'),
}));

// Import FilesService after the mock is set up.
import { FilesService } from './files.service';

// Patch process.env around each test to avoid leaking state.
const ENV_VARS = [
  'AWS_ENDPOINT_URL',
  'AWS_REGION',
  'AWS_ACCESS_KEY_ID',
  'AWS_SECRET_ACCESS_KEY',
  'STORAGE_BUCKET_NAME',
];

function clearStorageEnv() {
  for (const key of ENV_VARS) {
    delete process.env[key];
  }
}

function setStorageEnv() {
  process.env.AWS_ENDPOINT_URL = 'https://fly.storage.tigris.dev';
  process.env.AWS_REGION = 'auto';
  process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret';
  process.env.STORAGE_BUCKET_NAME = 'test-bucket';
}

describe('FilesService', () => {
  beforeEach(() => {
    clearStorageEnv();
  });

  afterEach(() => {
    clearStorageEnv();
    // Use clearAllMocks (resets call counts) rather than restoreAllMocks
    // (which would remove the module-level vi.mock stub for s3-request-presigner).
    vi.clearAllMocks();
  });

  describe('presignAvatarUpload — storage env UNSET', () => {
    it('throws ServiceUnavailableException with code STORAGE_NOT_CONFIGURED', async () => {
      // No storage env vars set — service must NOT crash, must return 503.
      const service = new FilesService();

      await expect(service.presignAvatarUpload('user-123', 'image/png')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('the 503 response contains code STORAGE_NOT_CONFIGURED', async () => {
      const service = new FilesService();

      try {
        await service.presignAvatarUpload('user-123', 'image/jpeg');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(ServiceUnavailableException);
        const exc = err as ServiceUnavailableException;
        expect(exc.getResponse()).toMatchObject({ code: 'STORAGE_NOT_CONFIGURED' });
      }
    });
  });

  describe('resolvePublicUrl', () => {
    it('returns null when storage env is unset', () => {
      const service = new FilesService();
      const result = service.resolvePublicUrl('avatars/user-123/some-uuid.png');
      expect(result).toBeNull();
    });

    it('returns a public URL when env is set', () => {
      setStorageEnv();
      const service = new FilesService();
      const result = service.resolvePublicUrl('avatars/user-123/some-uuid.png');
      expect(result).toBe(
        'https://fly.storage.tigris.dev/test-bucket/avatars/user-123/some-uuid.png',
      );
    });
  });

  describe('presignAvatarUpload — storage env SET', () => {
    it('returns { uploadUrl, key } with a server-controlled key prefix', async () => {
      setStorageEnv();

      // The @aws-sdk/s3-request-presigner module is already mocked at the top of this
      // file — getSignedUrl returns 'https://signed.example.com/put-url' by default.
      const service = new FilesService();
      const result = await service.presignAvatarUpload('user-xyz', 'image/png');

      expect(result.uploadUrl).toBe('https://signed.example.com/put-url');
      expect(result.key).toMatch(/^avatars\/user-xyz\/.+\.png$/);
    });
  });
});
