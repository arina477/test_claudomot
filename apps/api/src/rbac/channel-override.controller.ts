import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ChannelOverride } from '@studyhall/shared';
import { UpsertChannelOverrideSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from './rbac.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

/**
 * ChannelOverrideController — /servers/:id/channels/:channelId/overrides
 *
 * All mutation endpoints require can(manage_channels).
 * GET is accessible to any authenticated member (listing overrides is needed
 * by server managers reviewing permissions).
 */
@Controller('servers/:id/channels/:channelId/overrides')
@UseGuards(AuthGuard)
export class ChannelOverrideController {
  constructor(private readonly rbacService: RbacService) {}

  // GET — list overrides for a channel
  @Get()
  async listOverrides(
    @Param('id') serverId: string,
    @Param('channelId') channelId: string,
  ): Promise<ChannelOverride[]> {
    return await this.rbacService.listChannelOverrides(serverId, channelId);
  }

  // POST — upsert an override (requires manage_channels)
  @Post()
  @HttpCode(HttpStatus.OK)
  async upsertOverride(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Param('channelId') channelId: string,
    @Body() body: unknown,
  ): Promise<ChannelOverride> {
    const parsed = UpsertChannelOverrideSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    const allowed = await this.rbacService.can(userId, serverId, 'manage_channels');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_channels required');
    }

    return await this.rbacService.upsertChannelOverride(serverId, channelId, parsed.data);
  }

  // DELETE /:roleId — delete an override (requires manage_channels)
  @Delete(':roleId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteOverride(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Param('channelId') channelId: string,
    @Param('roleId') roleId: string,
  ): Promise<void> {
    const userId = req.session.getUserId();
    const allowed = await this.rbacService.can(userId, serverId, 'manage_channels');
    if (!allowed) {
      throw new ForbiddenException('Insufficient permissions: manage_channels required');
    }

    await this.rbacService.deleteChannelOverride(serverId, channelId, roleId);
  }
}
