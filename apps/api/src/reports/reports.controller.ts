import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateReportSchema, ResolveReportSchema } from '@studyhall/shared';
import type { Report } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { ReportsService } from './reports.service';

// ---------------------------------------------------------------------------
// SessionAugmentedRequest — mirrors moderation.controller.ts exactly.
// callerUserId is ALWAYS derived from req.session.getUserId() (no IDOR).
// ---------------------------------------------------------------------------

interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

// ---------------------------------------------------------------------------
// ReportsController — wave-69 M14 moderation reports
//
// Routes:
//   POST   /reports
//     Body: CreateReportSchema
//     callerUserId from session.
//     Returns 201 + created Report.
//
//   GET    /servers/:serverId/reports?status=
//     Requires: moderate_members (enforced in ReportsService).
//     Optional ?status= filter ('open' | 'resolved' | 'dismissed').
//     Returns 200 + Report[].
//
//   POST   /servers/:serverId/reports/:reportId/resolve
//     Body: ResolveReportSchema
//     Requires: moderate_members + cross-server tamper guard (in ReportsService).
//     Returns 200 + updated Report.
//
// Security:
//   - @UseGuards(AuthGuard) on controller — session required for ALL routes.
//   - callerUserId from req.session.getUserId() — never from body/params.
//   - serverId + reportId from route params.
//   - Zod body validation mirrors moderation.controller.ts pattern.
// ---------------------------------------------------------------------------

@Controller()
@UseGuards(AuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * POST /reports
   *
   * Submit a new moderation report.
   * Body: CreateReportSchema
   * Returns: 201 + Report
   */
  @Post('reports')
  @HttpCode(HttpStatus.CREATED)
  async createReport(@Req() req: SessionAugmentedRequest, @Body() body: unknown): Promise<Report> {
    const parsed = CreateReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerUserId = req.session.getUserId();
    return await this.reportsService.createReport(callerUserId, parsed.data);
  }

  /**
   * GET /servers/:serverId/reports?status=
   *
   * List reports for a server. Requires moderate_members.
   * Optional ?status= filter.
   * Returns: 200 + Report[]
   */
  @Get('servers/:serverId/reports')
  @HttpCode(HttpStatus.OK)
  async getServerReports(
    @Param('serverId') serverId: string,
    @Req() req: SessionAugmentedRequest,
    @Query('status') status?: string,
  ): Promise<Report[]> {
    const callerUserId = req.session.getUserId();
    return await this.reportsService.getServerReports(callerUserId, serverId, status);
  }

  /**
   * POST /servers/:serverId/reports/:reportId/resolve
   *
   * Resolve or dismiss a report. Requires moderate_members.
   * Body: ResolveReportSchema
   * Returns: 200 + updated Report
   */
  @Post('servers/:serverId/reports/:reportId/resolve')
  @HttpCode(HttpStatus.OK)
  async resolveReport(
    @Param('serverId') serverId: string,
    @Param('reportId') reportId: string,
    @Req() req: SessionAugmentedRequest,
    @Body() body: unknown,
  ): Promise<Report> {
    const parsed = ResolveReportSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.flatten());
    }

    const callerUserId = req.session.getUserId();
    return await this.reportsService.resolveReport(
      callerUserId,
      serverId,
      reportId,
      parsed.data.action,
    );
  }
}
