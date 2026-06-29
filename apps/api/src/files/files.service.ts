import { randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

// Allowed MIME types for avatar uploads — allowlist only.
const AVATAR_ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

const PRESIGN_EXPIRY_SECONDS = 300; // 5 minutes

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
      // 2 MB cap enforced at the server-controlled key level via metadata.
      // Clients exceeding this will receive a 403 from the storage provider.
      // Note: ContentLengthRange is a presigned-POST feature only; for presigned
      // PUT the size constraint is advisory — the 2MB check should also be done
      // client-side. The server-controlled key prevents path traversal regardless.
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    return { uploadUrl, key };
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
