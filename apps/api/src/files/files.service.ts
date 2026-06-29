import { randomUUID } from 'node:crypto';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  Injectable,
  Logger,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from '@nestjs/common';

// Allowed MIME types for avatar uploads — allowlist only.
const AVATAR_ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const PRESIGN_EXPIRY_SECONDS = 300; // 5 minutes

// Server-side size cap enforced at confirm time via HeadObject.
// A presigned-PUT cannot carry a content-length-range condition (that is a
// presigned-POST feature only), so we check the uploaded object size after
// the client completes the PUT, before we persist the avatar URL.
const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

function buildPublicUrl(endpoint: string, bucket: string, key: string): string {
  // Tigris / R2 style: https://<endpoint>/<bucket>/<key>
  const base = endpoint.replace(/\/$/, '');
  return `${base}/${bucket}/${key}`;
}

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);

  // S3 client is built lazily — the getter returns null when env vars are absent
  // so the module boots cleanly without storage credentials.
  private _s3Client: S3Client | null = null;
  private _clientInitialized = false;

  private getS3Client(): S3Client | null {
    if (this._clientInitialized) {
      return this._s3Client;
    }
    this._clientInitialized = true;

    const endpoint = process.env.AWS_ENDPOINT_URL;
    const region = process.env.AWS_REGION ?? 'auto';
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      this.logger.warn(
        'Storage env vars not set (AWS_ENDPOINT_URL / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY). Avatar presign will return 503 until configured.',
      );
      return null;
    }

    this._s3Client = new S3Client({
      endpoint,
      region,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: true,
    });

    return this._s3Client;
  }

  /**
   * Generate a presigned PUT URL for an avatar upload.
   *
   * Returns { uploadUrl, key } on success.
   * Throws ServiceUnavailableException with code STORAGE_NOT_CONFIGURED when
   * AWS env vars are absent — graceful, no crash.
   *
   * @param userId - authenticated user's ID (used in the key path)
   * @param contentType - MIME type from the client request (validated against allowlist)
   */
  async presignAvatarUpload(
    userId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const client = this.getS3Client();
    if (!client) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const ext = AVATAR_ALLOWED_MIME[contentType];
    if (!ext) {
      // Caller (controller) validates content-type before calling here.
      throw new Error(`Unsupported content-type: ${contentType}`);
    }

    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!bucket) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const key = `avatars/${userId}/${randomUUID()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      // ContentLengthRange is a presigned-POST-only feature and cannot be
      // applied here. Server-side 2MB enforcement is performed at confirm time
      // via checkAvatarSize() (HeadObject → ContentLength comparison).
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    return { uploadUrl, key };
  }

  /**
   * Server-side 2MB avatar size enforcement (task 84e09891).
   *
   * Called by the controller BEFORE persisting avatar_url. Issues a HeadObject
   * request against the uploaded key; if ContentLength > 2MB, throws
   * PayloadTooLargeException (413) so the URL is never persisted.
   *
   * This is the enforcement mechanism that replaces the client-side-only cap
   * from wave-4 AC7. presigned-PUT cannot carry ContentLengthRange (that is a
   * presigned-POST feature) — the confirm-time HEAD check is the cleanest
   * approach with no frontend contract change.
   *
   * Throws:
   *   - ServiceUnavailableException (503) if storage env is unconfigured.
   *   - PayloadTooLargeException (413) if the uploaded file exceeds 2MB.
   */
  async checkAvatarSize(key: string): Promise<void> {
    const client = this.getS3Client();
    if (!client) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!bucket) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    const contentLength = head.ContentLength ?? 0;
    if (contentLength > AVATAR_MAX_SIZE_BYTES) {
      this.logger.warn(
        `Avatar upload rejected — size ${contentLength} bytes exceeds ${AVATAR_MAX_SIZE_BYTES} byte cap (key: ${key})`,
      );
      throw new PayloadTooLargeException({
        code: 'AVATAR_TOO_LARGE',
        message: `Avatar must be ≤ 2 MB. Uploaded file is ${Math.ceil(contentLength / 1024)} KB.`,
      });
    }
  }

  /**
   * Resolve the public URL for an object key.
   * Used by the confirm step to persist avatar_url on the user record.
   */
  resolvePublicUrl(key: string): string | null {
    const endpoint = process.env.AWS_ENDPOINT_URL;
    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!endpoint || !bucket) {
      return null;
    }
    return buildPublicUrl(endpoint, bucket, key);
  }
}
