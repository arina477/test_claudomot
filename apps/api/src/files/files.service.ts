import { randomUUID } from 'node:crypto';
import {
  GetObjectCommand,
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
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

// ---------------------------------------------------------------------------
// ATTACHMENT_ALLOWED_MIME — allowlist for attachment uploads (wave-19 M3)
//
// Images: png / jpeg / webp / gif
// Files:  application/pdf / text/plain
//
// Exported so the AttachmentsController can build the ALLOWED_MIME_SET without
// duplicating the allowlist.
// ---------------------------------------------------------------------------

export const ATTACHMENT_ALLOWED_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'application/pdf': 'pdf',
  'text/plain': 'txt',
};

// Server-side size cap for attachments: 10 MB
const ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

// Presigned-GET TTL for attachment URLs returned in message DTOs.
// 1 hour gives clients enough time to display/download without requiring
// per-request re-signing.
const ATTACHMENT_GET_EXPIRY_SECONDS = 3600; // 1 hour

// Presigned-GET TTL for avatar redirect responses.
// Shorter than attachments: avatars are served through a redirect endpoint
// (GET /users/:userId/avatar → 302 to presigned URL) with Cache-Control:
// public, max-age=300, so browsers cache the presigned target for ~5 min.
// The presign TTL must exceed max-age so the target is still valid when a
// browser re-validates.
const AVATAR_GET_EXPIRY_SECONDS = 300; // 5 minutes

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

  /**
   * Resolve a presigned-GET URL for an avatar key (wave-38, task 84e09891).
   *
   * Tigris bucket is PRIVATE — static public URLs return 403 anonymously.
   * Avatars are served via GET /users/:userId/avatar → 302 redirect to this
   * presigned URL, mirroring the proven resolveAttachmentUrl pattern.
   *
   * Returns null when storage is not configured (graceful — caller emits 503).
   *
   * @param key - S3 object key (avatars/<userId>/<uuid>.<ext>)
   */
  async resolveAvatarUrl(key: string): Promise<string | null> {
    const client = this.getS3Client();
    if (!client) {
      return null;
    }

    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!bucket) {
      return null;
    }

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: AVATAR_GET_EXPIRY_SECONDS });
  }

  // ---------------------------------------------------------------------------
  // Attachment helpers — wave-19 M3 (task 20db0c16)
  // ---------------------------------------------------------------------------

  /**
   * Generate a presigned PUT URL for an attachment upload.
   *
   * Key format: attachments/<channelId>/<uuid>.<ext>
   * Mirrors presignAvatarUpload; throws 503 when storage is unconfigured.
   *
   * @param channelId - the channel the attachment belongs to (route-param derived)
   * @param userId    - uploader's user ID (session-derived — NOT from request body)
   * @param contentType - MIME type from the request (validated against allowlist)
   */
  async presignAttachmentUpload(
    channelId: string,
    // _userId is accepted for API consistency but not used in the key path;
    // the channel-scoped key is sufficient since authz is enforced at the controller.
    _userId: string,
    contentType: string,
  ): Promise<{ uploadUrl: string; key: string }> {
    const client = this.getS3Client();
    if (!client) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const ext = ATTACHMENT_ALLOWED_MIME[contentType];
    if (!ext) {
      // Caller (controller) validates content-type before calling here.
      throw new Error(`Unsupported content-type: ${contentType}`);
    }

    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!bucket) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    // Avoid userId in the key (channel-scoped is sufficient; userId provides no
    // extra security here since the presign is already authz-gated at the controller).
    const key = `attachments/${channelId}/${randomUUID()}.${ext}`;

    // H-2 (wave-19 B-6): presigned-PUT cannot carry a ContentLengthRange condition
    // (that is a presigned-POST-only feature).  An oversized object CAN therefore
    // land in the bucket without being blocked at PUT time.  This is the accepted
    // known-debt for this wave (no GC cron).
    //
    // SEND is the binding size gate: MessagesService.createMessage / createReply
    // call headAttachment() before INSERTing any attachment row, and reject keys
    // whose server-reported ContentLength exceeds ATTACHMENT_MAX_SIZE_BYTES (10 MB).
    // An oversized object that sneaks past the presigned-PUT becomes an
    // abandoned/unreferenced object in storage — it is never persisted to the DB,
    // and therefore never surfaced to any user.
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: PRESIGN_EXPIRY_SECONDS,
    });

    return { uploadUrl, key };
  }

  /**
   * Server-side 10MB attachment size enforcement (wave-19 M3).
   *
   * Issues a HeadObject against the uploaded key; throws 413 if the object
   * exceeds ATTACHMENT_MAX_SIZE_BYTES (10MB). Returns sizeBytes on success.
   *
   * Called by the controller at /confirm BEFORE we pass the descriptor to the
   * client (VALIDATION-ONLY — no DB INSERT at this stage; row-at-send).
   *
   * Throws:
   *   - ServiceUnavailableException (503) if storage env is unconfigured.
   *   - PayloadTooLargeException (413) if the uploaded file exceeds 10MB.
   */
  async checkAttachmentSize(key: string): Promise<number> {
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
    if (contentLength > ATTACHMENT_MAX_SIZE_BYTES) {
      this.logger.warn(
        `Attachment upload rejected — size ${contentLength} bytes exceeds ${ATTACHMENT_MAX_SIZE_BYTES} byte cap (key: ${key})`,
      );
      throw new PayloadTooLargeException({
        code: 'ATTACHMENT_TOO_LARGE',
        message: `Attachment must be ≤ 10 MB. Uploaded file is ${Math.ceil(contentLength / 1024)} KB.`,
      });
    }

    return contentLength;
  }

  /**
   * HeadObject lookup for an attachment key — returns server-derived
   * {contentLength, contentType} WITHOUT fetching the body.
   *
   * Called by MessagesService at SEND time to server-derive the authoritative
   * size and content-type that are persisted in the DB row.  The client-supplied
   * sizeBytes / contentType in the send body are IGNORED; only the values
   * returned here are INSERTed (closes the size-bypass and type-spoof vectors
   * from the B-6 review).
   *
   * Size cap (10 MB) is enforced by the caller (MessagesService) using the
   * returned contentLength — NOT here, so the caller can return the appropriate
   * HTTP status code (413 vs 400).
   *
   * Throws:
   *   - ServiceUnavailableException (503) if storage env is unconfigured.
   *   - Any S3 SDK error propagates (e.g. NoSuchKey → caller gets a 5xx unless
   *     it catches; MessagesService maps it to BadRequestException).
   */
  async headAttachment(key: string): Promise<{ contentLength: number; contentType: string }> {
    const client = this.getS3Client();
    if (!client) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!bucket) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));

    return {
      contentLength: head.ContentLength ?? 0,
      contentType: head.ContentType ?? '',
    };
  }

  /**
   * Resolve a presigned-GET URL for an attachment key.
   *
   * Railway Buckets are PRIVATE — static public URLs do not work. Every render
   * URL must be a presigned GET (GetObjectCommand + getSignedUrl). This is
   * distinct from resolvePublicUrl (which is used for avatar_url, a public URL).
   *
   * Called from MessagesService.rowToDto when building AttachmentRef.url.
   * Returns null when storage is not configured (graceful — callers guard).
   */
  async resolveAttachmentUrl(key: string): Promise<string | null> {
    const client = this.getS3Client();
    if (!client) {
      return null;
    }

    const bucket = process.env.STORAGE_BUCKET_NAME;
    if (!bucket) {
      return null;
    }

    const command = new GetObjectCommand({ Bucket: bucket, Key: key });
    return getSignedUrl(client, command, { expiresIn: ATTACHMENT_GET_EXPIRY_SECONDS });
  }
}
