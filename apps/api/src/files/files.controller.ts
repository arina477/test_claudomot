import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { AvatarPresignResponse } from '@studyhall/shared';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from '../users/users.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { FilesService } from './files.service';

// Allowed MIME types for the presign content-type param.
const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

interface PresignAvatarBody {
  contentType?: unknown;
}

interface ConfirmAvatarBody {
  key?: unknown;
}

@Controller('profile/avatar')
export class FilesController {
  constructor(
    private readonly filesService: FilesService,
    private readonly usersService: UsersService,
  ) {}

  /**
   * POST /profile/avatar/presign
   *
   * Body: { contentType: 'image/png' | 'image/jpeg' | 'image/webp' }
   *
   * Returns: { uploadUrl: string; key: string }
   * The client should PUT the binary directly to uploadUrl (not through this API).
   * After a successful PUT, call POST /profile/avatar/confirm with { key }.
   *
   * When storage env is unset: 503 { code: 'STORAGE_NOT_CONFIGURED' }
   */
  @Post('presign')
  @HttpCode(200)
  @UseGuards(SessionNoVerifyGuard)
  async presign(
    @Req() req: SessionAugmentedRequest,
    @Body() body: PresignAvatarBody,
  ): Promise<AvatarPresignResponse> {
    const contentType = body?.contentType;
    if (typeof contentType !== 'string' || !ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new BadRequestException(
        'contentType must be one of: image/png, image/jpeg, image/webp',
      );
    }

    const userId = req.session.getUserId();
    return this.filesService.presignAvatarUpload(userId, contentType);
  }

  /**
   * POST /profile/avatar/confirm
   *
   * Body: { key: string } — the key returned by /presign
   *
   * Enforces server-side 2MB cap via HeadObject before persisting the avatar URL.
   * Derives the public URL from the key and persists avatar_url on the user.
   * Returns: { avatarUrl: string }
   *
   * Error codes:
   *   413 AVATAR_TOO_LARGE  — uploaded object exceeds 2MB (server-enforced)
   *   503 STORAGE_NOT_CONFIGURED — storage env vars absent
   */
  @Post('confirm')
  @HttpCode(200)
  @UseGuards(SessionNoVerifyGuard)
  async confirm(
    @Req() req: SessionAugmentedRequest,
    @Body() body: ConfirmAvatarBody,
  ): Promise<{ avatarUrl: string }> {
    const userId = req.session.getUserId();

    const key = body?.key;
    if (typeof key !== 'string' || !key.startsWith(`avatars/${userId}/`)) {
      throw new BadRequestException('key must be a valid avatar key scoped to the requesting user');
    }

    // SERVER-SIDE 2MB ENFORCEMENT (task 84e09891):
    // presigned-PUT cannot carry a ContentLengthRange condition (presigned-POST only).
    // We issue a HeadObject here, before persisting the URL, to reject oversized uploads.
    // Throws 413 PayloadTooLargeException if object > 2MB, 503 if storage is unconfigured.
    await this.filesService.checkAvatarSize(key);

    const publicUrl = this.filesService.resolvePublicUrl(key);
    if (!publicUrl) {
      throw new BadRequestException('Storage not configured — cannot resolve avatar URL');
    }
    await this.usersService.setAvatarUrl(userId, publicUrl);

    return { avatarUrl: publicUrl };
  }
}
