import { PayloadTooLargeException, ServiceUnavailableException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// vi.mock is hoisted to the top of the file by vitest — the factory must not
// reference local variables. We stub the module here; each test can configure
// the returned mock value via the imported module's mock spy.
vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn().mockResolvedValue('https://signed.example.com/put-url'),
}));

// Stub the S3Client so HeadObjectCommand calls are interceptable without real AWS creds.
// The factory must be static — vi.mock is hoisted; no local var references.
vi.mock('@aws-sdk/client-s3', async (importOriginal) => {
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import in mock factory
  const actual = await importOriginal<any>();
  return {
    ...actual,
    S3Client: vi.fn().mockImplementation(() => ({
      send: vi.fn(),
    })),
  };
});

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

  // ── checkAvatarSize — server-side 2MB enforcement (task 84e09891) ───────────

  describe('checkAvatarSize — storage env UNSET', () => {
    it('throws ServiceUnavailableException with code STORAGE_NOT_CONFIGURED', async () => {
      const service = new FilesService();
      await expect(service.checkAvatarSize('avatars/user-abc/file.png')).rejects.toThrow(
        ServiceUnavailableException,
      );
    });
  });

  describe('checkAvatarSize — storage env SET', () => {
    beforeEach(() => {
      setStorageEnv();
    });

    it('resolves without throwing when ContentLength is within 2MB', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({ ContentLength: 1024 * 1024 }); // 1 MB
      // biome-ignore lint/suspicious/noExplicitAny: mock constructor
      (S3Client as any).mockImplementation(() => ({ send: mockSend }));

      const service = new FilesService();
      await expect(service.checkAvatarSize('avatars/user-abc/file.png')).resolves.toBeUndefined();
    });

    it('throws PayloadTooLargeException when ContentLength exceeds 2MB', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({ ContentLength: 3 * 1024 * 1024 }); // 3 MB
      // biome-ignore lint/suspicious/noExplicitAny: mock constructor
      (S3Client as any).mockImplementation(() => ({ send: mockSend }));

      const service = new FilesService();
      await expect(service.checkAvatarSize('avatars/user-abc/file.png')).rejects.toThrow(
        PayloadTooLargeException,
      );
    });

    it('throws PayloadTooLargeException with code AVATAR_TOO_LARGE when file is too big', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({ ContentLength: 2 * 1024 * 1024 + 1 }); // 1 byte over
      // biome-ignore lint/suspicious/noExplicitAny: mock constructor
      (S3Client as any).mockImplementation(() => ({ send: mockSend }));

      const service = new FilesService();
      try {
        await service.checkAvatarSize('avatars/user-abc/file.png');
        expect.fail('Should have thrown');
      } catch (err) {
        expect(err).toBeInstanceOf(PayloadTooLargeException);
        const exc = err as PayloadTooLargeException;
        expect(exc.getResponse()).toMatchObject({ code: 'AVATAR_TOO_LARGE' });
      }
    });

    it('allows exactly 2MB (boundary condition)', async () => {
      const { S3Client } = await import('@aws-sdk/client-s3');
      const mockSend = vi.fn().mockResolvedValue({ ContentLength: 2 * 1024 * 1024 }); // exactly 2 MB
      // biome-ignore lint/suspicious/noExplicitAny: mock constructor
      (S3Client as any).mockImplementation(() => ({ send: mockSend }));

      const service = new FilesService();
      await expect(service.checkAvatarSize('avatars/user-abc/file.png')).resolves.toBeUndefined();
    });
  });

  // ── resolveAvatarUrl — presigned GET for avatar (wave-38, task 84e09891) ──

  describe('resolveAvatarUrl — storage env UNSET', () => {
    it('returns null when storage env is unset', async () => {
      const service = new FilesService();
      const result = await service.resolveAvatarUrl('avatars/user-abc/file.png');
      expect(result).toBeNull();
    });
  });

  describe('resolveAvatarUrl — storage env SET', () => {
    beforeEach(() => {
      setStorageEnv();
    });

    it('returns a presigned GET URL when storage is configured', async () => {
      const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
      // biome-ignore lint/suspicious/noExplicitAny: mock return
      (getSignedUrl as any).mockResolvedValue('https://signed.example.com/avatar-get-url');

      const service = new FilesService();
      const result = await service.resolveAvatarUrl('avatars/user-abc/file.png');

      expect(result).toBe('https://signed.example.com/avatar-get-url');
      expect(getSignedUrl).toHaveBeenCalledOnce();
    });

    it('returns null when STORAGE_BUCKET_NAME is missing even if S3 creds are set', async () => {
      Reflect.deleteProperty(process.env, 'STORAGE_BUCKET_NAME');
      const service = new FilesService();
      const result = await service.resolveAvatarUrl('avatars/user-abc/file.png');
      expect(result).toBeNull();
    });
  });
});
