/**
 * StudyTimerController — wave-49 M8 shared study timer REST endpoints
 * Task 1387d845 (controls + GET)
 * Extended: wave-50 task f4b3659e (PATCH /config)
 *
 * Routes:
 *   POST  /servers/:serverId/study-timer/start   — start (or restart) the timer
 *   POST  /servers/:serverId/study-timer/pause   — freeze remaining; run_state='paused'
 *   POST  /servers/:serverId/study-timer/resume  — restore from pause; re-arms transition
 *   POST  /servers/:serverId/study-timer/reset   — idle state; clears all time anchors
 *   GET   /servers/:serverId/study-timer         — compute-on-read DTO (idle/running/paused)
 *   PATCH /servers/:serverId/study-timer/config  — set per-server work/break durations (idle-only)
 *
 * Security:
 *   @UseGuards(AuthGuard) on every route.
 *   serverId from :serverId route param (IDOR-safe — service re-derives from route, not body).
 *   userId always from session (req.session.getUserId()) — never client-supplied.
 *   Membership gate: service.assertMember() → server_members row required → 403 on failure.
 *
 * No request bodies on control endpoints — all are parameterless POST actions.
 * PATCH /config body validated against StudyTimerConfigSchema (Zod pipe).
 * The service emits fan-out via EventEmitter2 → StudyTimerGateway after each control.
 */

import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { StudyTimer } from '@studyhall/shared';
import { StudyTimerConfigSchema } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { StudyTimerService } from './study-timer.service';

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller()
export class StudyTimerController {
  constructor(private readonly studyTimerService: StudyTimerService) {}

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/study-timer/start
  //
  // Starts (or restarts) the shared study timer for the server.
  // Sets run_state='running', phase='work', started_at=now, ends_at=now+25min.
  // Arms the one-shot auto-advance timeout. Broadcasts study-timer:update.
  // Starting a running/paused timer restarts it fresh from work phase.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/study-timer/start')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async startTimer(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<StudyTimer> {
    const userId = req.session.getUserId();
    return this.studyTimerService.startTimer(serverId, userId);
  }

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/study-timer/pause
  //
  // Freezes the timer: run_state='paused', paused_remaining_ms = ends_at - now.
  // Clears the auto-advance timeout. Broadcasts study-timer:update.
  // No-ops gracefully if timer is not running.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/study-timer/pause')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async pauseTimer(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<StudyTimer> {
    const userId = req.session.getUserId();
    return this.studyTimerService.pauseTimer(serverId, userId);
  }

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/study-timer/resume
  //
  // Restores the timer: run_state='running', ends_at = now + paused_remaining_ms.
  // Re-arms the auto-advance timeout. Broadcasts study-timer:update.
  // No-ops gracefully if timer is not paused.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/study-timer/resume')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async resumeTimer(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<StudyTimer> {
    const userId = req.session.getUserId();
    return this.studyTimerService.resumeTimer(serverId, userId);
  }

  // -------------------------------------------------------------------------
  // POST /servers/:serverId/study-timer/reset
  //
  // Resets to idle: run_state='idle', phase='work', time anchors cleared.
  // Clears the auto-advance timeout. Broadcasts study-timer:update.
  // -------------------------------------------------------------------------

  @Post('servers/:serverId/study-timer/reset')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async resetTimer(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<StudyTimer> {
    const userId = req.session.getUserId();
    return this.studyTimerService.resetTimer(serverId, userId);
  }

  // -------------------------------------------------------------------------
  // GET /servers/:serverId/study-timer
  //
  // Returns the compute-on-read timer DTO for the server.
  // Derives remainingMs + running from run_state + ends_at + now() server-side.
  // Self-heals if run_state='running' and ends_at < now (missed transitions).
  // No timer row → calm idle DTO (200, not 404).
  // -------------------------------------------------------------------------

  @Get('servers/:serverId/study-timer')
  @UseGuards(AuthGuard)
  async getTimer(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
  ): Promise<StudyTimer> {
    const userId = req.session.getUserId();
    return this.studyTimerService.getTimer(serverId, userId);
  }

  // -------------------------------------------------------------------------
  // PATCH /servers/:serverId/study-timer/config
  // wave-50 task f4b3659e
  //
  // Sets per-server work/break durations (in whole minutes).
  // Body: StudyTimerConfigSchema { workMinutes: 1-120, breakMinutes: 1-60 }
  //
  // Returns 200 updated StudyTimer DTO on success.
  // Propagates: 400 (invalid range/non-integer via Zod), 403 (non-member),
  //             409 (timer not idle — service throws ConflictException).
  // -------------------------------------------------------------------------

  @Patch('servers/:serverId/study-timer/config')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  async configureDurations(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<StudyTimer> {
    const parsed = StudyTimerConfigSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }
    const userId = req.session.getUserId();
    return this.studyTimerService.configureDurations(serverId, userId, parsed.data);
  }
}
