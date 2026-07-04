import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { ScheduledSession, ScheduledSessionListResponse } from '@studyhall/shared';
import { CreateScheduledSessionSchema, UpdateScheduledSessionSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { SchedulingService } from './scheduling.service';

// ---------------------------------------------------------------------------
// SchedulingController — wave-43 class-scheduling (task 535bdb8c)
//
// Routes:
//   POST   /servers/:serverId/scheduled-sessions                — organizer create
//   GET    /servers/:serverId/scheduled-sessions?from&to        — member list + recurrence expand
//   GET    /scheduled-sessions/:id                              — member get (serverId derived from row)
//   PATCH  /scheduled-sessions/:id                             — organizer update (serverId derived from row)
//   DELETE /scheduled-sessions/:id                             — organizer soft-delete (serverId derived from row)
//
// Security:
//   - @UseGuards(AuthGuard) on every route.
//   - Organizer authz: service.assertOrganizer → can(userId, serverId, 'manage_assignments')
//     Mirrors AssignmentsController — same permission, single call site (G3 pattern).
//   - Member authz: service.assertMember → server_members check.
//   - For /scheduled-sessions/:id routes: serverId derived from the session row
//     inside the service (IDOR-safe — never from client params).
//
// Route ordering: server-prefixed routes declared first to avoid NestJS
//   shadowing /scheduled-sessions/:id (distinct prefixes — no actual conflict,
//   but mirrors the assignments controller declaration order for consistency).
// ---------------------------------------------------------------------------

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/scheduled-sessions
  // Organizer-only create. Returns 201 with the created ScheduledSession DTO.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/scheduled-sessions')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createSession(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ScheduledSession> {
    const parsed = CreateScheduledSessionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.schedulingService.createSession(serverId, userId, parsed.data);
  }

  // -------------------------------------------------------------------------
  // GET /servers/:serverId/scheduled-sessions?from&to
  // Member list — recurrence expansion within window; starts_at ASC.
  // -------------------------------------------------------------------------

  @Get('servers/:serverId/scheduled-sessions')
  @UseGuards(AuthGuard)
  async listSessions(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ): Promise<ScheduledSessionListResponse> {
    const userId = req.session.getUserId();
    return this.schedulingService.listSessionsForServer(serverId, userId, from, to);
  }

  // -------------------------------------------------------------------------
  // GET /scheduled-sessions/:id
  // Member get. serverId derived from session row in service (IDOR-safe).
  // -------------------------------------------------------------------------

  @Get('scheduled-sessions/:id')
  @UseGuards(AuthGuard)
  async getSession(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<ScheduledSession> {
    const userId = req.session.getUserId();
    return this.schedulingService.getSession(id, userId);
  }

  // -------------------------------------------------------------------------
  // PATCH /scheduled-sessions/:id
  // Organizer update. serverId derived from session row in service (IDOR-safe).
  // -------------------------------------------------------------------------

  @Patch('scheduled-sessions/:id')
  @UseGuards(AuthGuard)
  async updateSession(
    @Param('id') id: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<ScheduledSession> {
    const parsed = UpdateScheduledSessionSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const userId = req.session.getUserId();
    return this.schedulingService.updateSession(id, userId, parsed.data);
  }

  // -------------------------------------------------------------------------
  // DELETE /scheduled-sessions/:id
  // Organizer soft-delete. Returns 204 No Content.
  // serverId derived from session row in service (IDOR-safe).
  // -------------------------------------------------------------------------

  @Delete('scheduled-sessions/:id')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteSession(@Param('id') id: string, @Req() req: SessionAugmentedRequest): Promise<void> {
    const userId = req.session.getUserId();
    return this.schedulingService.softDeleteSession(id, userId);
  }
}
