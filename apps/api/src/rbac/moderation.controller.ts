import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { MemberTimeoutSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ModerationService } from './moderation.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

// ---------------------------------------------------------------------------
// ModerationController — wave-41 member timeout endpoints
//
// POST   /servers/:serverId/members/:userId/timeout
//   Requires: moderate_members (enforced in ModerationService + rank guard)
//   Body: { durationMinutes: number } (1–10080 minutes, validated via MemberTimeoutSchema)
//   Response: 200 { mutedUntil: string } (ISO 8601)
//
// DELETE /servers/:serverId/members/:userId/timeout
//   Requires: moderate_members (enforced in ModerationService + rank guard)
//   Response: 204 No Content
//
// Security:
//   - @UseGuards(AuthGuard) on all routes — session required.
//   - callerUserId derived from req.session.getUserId() — never from body/params.
//   - targetUserId from route param (validated against server membership in service).
//   - can(moderate_members) + rank guard enforced in ModerationService (defence-in-depth).
// ---------------------------------------------------------------------------

@Controller('servers/:serverId/members/:userId/timeout')
@UseGuards(AuthGuard)
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  /**
   * POST /servers/:serverId/members/:userId/timeout
   *
   * Sets the target member's muted_until timestamp.
   * Body: { durationMinutes: number }
   * Returns: 200 { mutedUntil: string }
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async setMemberTimeout(
    @Param('serverId') serverId: string,
    @Param('userId') targetUserId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<{ mutedUntil: string }> {
    const parsed = MemberTimeoutSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerUserId = req.session.getUserId();

    return await this.moderationService.setMemberTimeout(
      serverId,
      callerUserId,
      targetUserId,
      parsed.data.durationMinutes,
    );
  }

  /**
   * DELETE /servers/:serverId/members/:userId/timeout
   *
   * Clears the target member's timeout (muted_until → null).
   * Returns: 204 No Content
   */
  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearMemberTimeout(
    @Param('serverId') serverId: string,
    @Param('userId') targetUserId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<void> {
    const callerUserId = req.session.getUserId();

    await this.moderationService.clearMemberTimeout(serverId, callerUserId, targetUserId);
  }
}
