import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type {
  InvitePreview,
  InviteResponse,
  JoinResult,
  ServerDetail,
  ServerMember,
  ServerResponse,
  ServerSummary,
} from '@studyhall/shared';
import { CreateInviteSchema, CreateServerSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ServersService } from './servers.service';

// Minimal interface for the ST-augmented request — mirrors the pattern in other controllers.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('servers')
export class ServersController {
  constructor(private readonly serversService: ServersService) {}

  @Post()
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createServer(
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ServerResponse> {
    const parsed = CreateServerSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return await this.serversService.createServer(userId, parsed.data.name);
  }

  @Get()
  @UseGuards(AuthGuard)
  async listServers(@Req() req: SessionAugmentedRequest): Promise<ServerSummary[]> {
    const userId = req.session.getUserId();
    return await this.serversService.findMyServers(userId);
  }

  @Get(':id')
  @UseGuards(AuthGuard)
  async getServerDetail(
    @Req() req: SessionAugmentedRequest,
    @Param('id') id: string,
  ): Promise<ServerDetail> {
    const userId = req.session.getUserId();
    return await this.serversService.findServerDetail(userId, id);
  }

  /**
   * GET /servers/:id/members
   * Returns the public member roster [{userId, displayName, avatarUrl}].
   * Requires the caller to be a member of the server (403 otherwise).
   */
  @Get(':id/members')
  @UseGuards(AuthGuard)
  async listServerMembers(
    @Req() req: SessionAugmentedRequest,
    @Param('id') id: string,
  ): Promise<ServerMember[]> {
    const userId = req.session.getUserId();
    return await this.serversService.listServerMembers(userId, id);
  }

  // -------------------------------------------------------------------------
  // Invite endpoints (wave-8 M2)
  // -------------------------------------------------------------------------

  /**
   * POST /servers/:id/invites
   * Create an ad-hoc invite for a server.
   * Requires authentication + email verification.
   */
  @Post(':id/invites')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createInvite(
    @Req() req: SessionAugmentedRequest,
    @Param('id') serverId: string,
    @Body() body: unknown,
  ): Promise<InviteResponse> {
    const parsed = CreateInviteSchema.safeParse(body ?? {});
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return await this.serversService.createInvite(serverId, userId, parsed.data);
  }
}

// ---------------------------------------------------------------------------
// Invite resolution routes — separate controller, path /invites
// ---------------------------------------------------------------------------

@Controller('invites')
export class InvitesController {
  constructor(private readonly serversService: ServersService) {}

  /**
   * GET /invites/:code
   * Public — NO @UseGuards. Returns minimal server preview.
   * Invalid / revoked / expired / maxed → 404.
   */
  @Get(':code')
  async getInvitePreview(@Param('code') code: string): Promise<InvitePreview> {
    return await this.serversService.getInvitePreview(code);
  }

  /**
   * POST /invites/:code/join
   * Requires authentication + email verification (AuthGuard = verify-required).
   * Returns 200 {serverId} (existing member re-join is idempotent 200, no use increment).
   * Unauthenticated → 401, unverified → 403, invalid invite → 404.
   */
  @Post(':code/join')
  @UseGuards(AuthGuard)
  async joinViaInvite(
    @Req() req: SessionAugmentedRequest,
    @Param('code') code: string,
  ): Promise<JoinResult> {
    const userId = req.session.getUserId();
    return await this.serversService.joinViaInvite(code, userId);
  }

  /**
   * POST /invites/:code/revoke
   * Requires authentication (AuthGuard).
   * Caller must be the server owner OR the invite creator — else 403.
   * Idempotent: re-revoking an already-revoked invite returns 200.
   * Permanent codes (servers.invite_code) are not in the invites table → 404.
   * After revoke: GET /invites/:code → 404, POST /:code/join → 404.
   */
  @Post(':code/revoke')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeInvite(
    @Req() req: SessionAugmentedRequest,
    @Param('code') code: string,
  ): Promise<void> {
    const userId = req.session.getUserId();
    await this.serversService.revokeInvite(code, userId);
  }
}
