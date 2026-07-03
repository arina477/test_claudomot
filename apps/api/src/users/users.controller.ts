import {
  Controller,
  Get,
  Header,
  Inject,
  NotFoundException,
  Param,
  Redirect,
  ServiceUnavailableException,
  forwardRef,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { FilesService } from '../files/files.service';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { UsersService } from './users.service';

/**
 * UsersController — public user-facing endpoints.
 *
 * Wave-38 (task 84e09891): add GET /users/:userId/avatar
 * A public, unauthenticated redirect endpoint that resolves a fresh presigned
 * GET URL for the user's avatar and responds with a 302. This is required
 * because the Tigris bucket is PRIVATE (anonymous GET → 403); presigned-GET is
 * the only way to serve avatar images anonymously.
 *
 * Why unauthenticated: avatars are public content; cross-origin <img> tags send
 * no auth cookies so the endpoint must be reachable without a session.
 * IDOR-safety: server-derived key only (no client-controlled path), 404 for
 * users with no avatar, short presign TTL (300s). Rate limiting is coarse
 * (app-wide ThrottlerGuard, 10 req/60s) — enough for MVP; fine-grained
 * per-IP throttle on this route is a T-8 follow-up.
 */
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    @Inject(forwardRef(() => FilesService))
    private readonly filesService: FilesService,
  ) {}

  /**
   * GET /users/:userId/avatar
   *
   * PUBLIC / UNAUTHENTICATED — no SessionGuard; cross-origin <img> sends no cookies.
   *
   * Response:
   *   302  Location: <presigned GET URL>  Cache-Control: public, max-age=300
   *   404  when user has no avatar (avatar_key IS NULL)
   *   503  when storage env vars are not configured
   *
   * Cache-Control: public, max-age=300 is intentionally < presign TTL (300s) so
   * browsers never follow a stale/expired presigned URL from their cache.
   *
   * NestJS @Redirect + dynamic url: returning { url, statusCode } from a
   * @Redirect()-decorated handler overrides the static decorator values, which
   * is the canonical NestJS pattern for dynamic redirects.
   */
  @Get(':userId/avatar')
  @SkipThrottle()
  @Redirect('', 302)
  @Header('Cache-Control', 'public, max-age=300')
  async redirectToAvatar(
    @Param('userId') userId: string,
  ): Promise<{ url: string; statusCode: number }> {
    const avatarKey = await this.usersService.findAvatarKey(userId);
    if (!avatarKey) {
      throw new NotFoundException('User has no avatar');
    }

    const presignedUrl = await this.filesService.resolveAvatarUrl(avatarKey);
    if (!presignedUrl) {
      throw new ServiceUnavailableException({ code: 'STORAGE_NOT_CONFIGURED' });
    }

    return { url: presignedUrl, statusCode: 302 };
  }
}
