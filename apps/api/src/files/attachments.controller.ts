import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AttachmentPresignResponse, ValidatedAttachment } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { FilesService } from './files.service';
import { ATTACHMENT_ALLOWED_MIME } from './files.service';

// ---------------------------------------------------------------------------
// AttachmentsController — wave-19 M3 (task 20db0c16)
//
// Routes (scoped to a channel — rule-4 authz enforced at the route level):
//   POST /channels/:channelId/attachments/presign  — presigned PUT URL
//   POST /channels/:channelId/attachments/confirm  — validate (HeadObject) → descriptor
//
// Security invariants:
//   - @UseGuards(AuthGuard) — session required; userId from session only.
//   - Channel-membership authz via rbacService.canViewChannelById() (rule-4).
//     A non-member receives 403. The authz source is the :channelId route param
//     resolved against the DB — never a client-supplied field.
//   - Content-type allowlist enforced at both presign and confirm.
//   - 10MB cap enforced server-side at confirm via HeadObject (HeadObject after PUT
//     is the same server-enforcement pattern used for avatars — see FilesService).
//   - NO DB row created at confirm (row-at-send decision from P-4).
//     confirm returns a ValidatedAttachment descriptor the client passes to send.
// ---------------------------------------------------------------------------

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

interface PresignBody {
  contentType?: unknown;
  filename?: unknown;
}

interface ConfirmBody {
  key?: unknown;
  filename?: unknown;
  contentType?: unknown;
}

const ALLOWED_MIME_SET = new Set(Object.keys(ATTACHMENT_ALLOWED_MIME));

@Controller('channels/:channelId/attachments')
@UseGuards(AuthGuard)
export class AttachmentsController {
  constructor(
    private readonly filesService: FilesService,
    private readonly rbacService: RbacService,
  ) {}

  /**
   * POST /channels/:channelId/attachments/presign
   *
   * Body: { contentType: string; filename: string }
   * Returns: { uploadUrl: string; key: string }
   *
   * The client should PUT binary directly to uploadUrl (not through this API).
   * After the PUT completes, call /confirm to validate and get the descriptor.
   *
   * Errors:
   *   400 — content-type not in allowlist
   *   403 — caller is not a channel member
   *   503 — storage env vars absent (graceful degradation)
   */
  @Post('presign')
  @HttpCode(HttpStatus.OK)
  async presign(
    @Param('channelId') channelId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: PresignBody,
  ): Promise<AttachmentPresignResponse> {
    const userId = req.session.getUserId();

    // Rule-4 authz: channel-derived membership check (not a client param).
    const canView = await this.rbacService.canViewChannelById(userId, channelId);
    if (!canView) {
      throw new ForbiddenException('Not a member of this channel');
    }

    // Content-type allowlist validation (before any storage call).
    const contentType = body?.contentType;
    if (typeof contentType !== 'string' || !ALLOWED_MIME_SET.has(contentType)) {
      throw new BadRequestException(
        `contentType must be one of: ${[...ALLOWED_MIME_SET].join(', ')}`,
      );
    }

    // filename is accepted but not used in the key (only content-type drives ext).
    // We still require it to be a non-empty string for API consistency.
    const filename = body?.filename;
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      throw new BadRequestException('filename must be a non-empty string');
    }

    return this.filesService.presignAttachmentUpload(channelId, userId, contentType);
  }

  /**
   * POST /channels/:channelId/attachments/confirm
   *
   * Body: { key: string; filename: string; contentType: string }
   * Returns: ValidatedAttachment { key, filename, contentType, sizeBytes }
   *
   * Validates the uploaded object:
   *   - Channel membership (rule-4 authz)
   *   - Content-type still in allowlist
   *   - key scoped to attachments/<channelId>/ prefix (prevents cross-channel key swap)
   *   - HeadObject → size ≤ 10MB (server-side; 413 if over)
   *
   * NO DB row is created here (row-at-send decision from P-4).
   * The returned ValidatedAttachment is passed by the client in the send body.
   *
   * Errors:
   *   400 — missing / invalid fields, or key not scoped to this channel
   *   403 — caller is not a channel member
   *   413 — uploaded object exceeds 10MB
   *   503 — storage env vars absent
   */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @Param('channelId') channelId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: ConfirmBody,
  ): Promise<ValidatedAttachment> {
    const userId = req.session.getUserId();

    // Rule-4 authz: channel-derived membership check.
    const canView = await this.rbacService.canViewChannelById(userId, channelId);
    if (!canView) {
      throw new ForbiddenException('Not a member of this channel');
    }

    // Validate key: must be a string scoped to attachments/<channelId>/.
    // This prevents a member of channel A from confirming a key written by
    // a different channel's presign (cross-channel key swap IDOR).
    const key = body?.key;
    if (typeof key !== 'string' || !key.startsWith(`attachments/${channelId}/`)) {
      throw new BadRequestException(
        'key must be a valid attachment key scoped to this channel (attachments/<channelId>/...)',
      );
    }

    // Validate filename.
    const filename = body?.filename;
    if (typeof filename !== 'string' || filename.trim().length === 0) {
      throw new BadRequestException('filename must be a non-empty string');
    }

    // Content-type allowlist.
    const contentType = body?.contentType;
    if (typeof contentType !== 'string' || !ALLOWED_MIME_SET.has(contentType)) {
      throw new BadRequestException(
        `contentType must be one of: ${[...ALLOWED_MIME_SET].join(', ')}`,
      );
    }

    // Server-side 10MB cap via HeadObject. Throws 413 if over; returns sizeBytes.
    const sizeBytes = await this.filesService.checkAttachmentSize(key);

    // Return the validated descriptor — NO DB INSERT (row-at-send).
    return { key, filename: filename.trim(), contentType, sizeBytes };
  }
}
