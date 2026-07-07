import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import type { ServerAnalytics } from '@studyhall/shared';
import { AuthGuard } from '../auth/auth.guard';
import { EducatorAccessGuard } from './educator-access.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EducatorAnalyticsService } from './educator-analytics.service';
import { EntitlementGuard, RequireEntitlement } from './entitlement.guard';

// ---------------------------------------------------------------------------
// EducatorToolsController — wave-75 M9.
//
// Models ONLY the entitlement enforcement for the educator/admin tooling gate,
// not the actual educator tools (those stay fenced for a later slice).
//
// GET /servers/:serverId/educator-tools/status
//   AuthGuard (verification-REQUIRED) + EntitlementGuard requiring the
//   'educatorAdminTools' flag + EducatorAccessGuard (owner/educator predicate):
//     • 200 { enabled: true } when the server tier is 'school' AND the caller is
//       the owner or a member with manage_assignments.
//     • 403 when the tier is 'free' / 'server_pro' (entitlement flag false), OR
//       when the caller is neither owner nor educator (wave-76: closes the
//       wave-75 T8-F1 leak — a non-owner/non-educator school-tier caller used to
//       pass on the tier gate alone).
//
// Guard order matters: AuthGuard first (authenticate), then EntitlementGuard
// (resolve the server's tier and gate on the flag), then EducatorAccessGuard
// (gate on the CALLER's authority within the server via RbacService.can).
// ---------------------------------------------------------------------------

@Controller('servers/:serverId/educator-tools')
export class EducatorToolsController {
  constructor(private readonly analyticsService: EducatorAnalyticsService) {}

  @Get('status')
  @UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)
  @RequireEntitlement('educatorAdminTools')
  getStatus(@Param('serverId') serverId: string): { serverId: string; enabled: true } {
    // Reaching this handler means EntitlementGuard confirmed the flag is enabled
    // for this server (tier === 'school') AND EducatorAccessGuard confirmed the
    // caller is the owner or an educator; otherwise one threw 403.
    return { serverId, enabled: true };
  }

  // GET /servers/:serverId/educator-tools/analytics
  //   Same guard stack as /status: AuthGuard (verification-REQUIRED) +
  //   EntitlementGuard('educatorAdminTools') + EducatorAccessGuard. Returns
  //   server-scoped aggregate rollups (ServerAnalytics) — counts only, no PII.
  @Get('analytics')
  @UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)
  @RequireEntitlement('educatorAdminTools')
  getAnalytics(@Param('serverId') serverId: string): Promise<ServerAnalytics> {
    // Reaching this handler means all three guards passed (school tier + owner/
    // educator). The service emits aggregate counts only — no raw content/PII.
    return this.analyticsService.getServerAnalytics(serverId);
  }
}
