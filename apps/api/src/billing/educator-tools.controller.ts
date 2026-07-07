import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { EntitlementGuard, RequireEntitlement } from './entitlement.guard';

// ---------------------------------------------------------------------------
// EducatorToolsController — wave-75 M9.
//
// Models ONLY the entitlement enforcement for the educator/admin tooling gate,
// not the actual educator tools (those stay fenced for a later slice).
//
// GET /servers/:serverId/educator-tools/status
//   AuthGuard (verification-REQUIRED) + EntitlementGuard requiring the
//   'educatorAdminTools' flag:
//     • 200 { enabled: true } when the server tier is 'school'.
//     • 403 when the tier is 'free' / 'server_pro' (flag false).
//
// Guard order matters: AuthGuard first (authenticate), then EntitlementGuard
// (resolve the server's tier and gate on the flag).
// ---------------------------------------------------------------------------

@Controller('servers/:serverId/educator-tools')
export class EducatorToolsController {
  @Get('status')
  @UseGuards(AuthGuard, EntitlementGuard)
  @RequireEntitlement('educatorAdminTools')
  getStatus(@Param('serverId') serverId: string): { serverId: string; enabled: true } {
    // Reaching this handler means EntitlementGuard already confirmed the flag is
    // enabled for this server (tier === 'school'); otherwise it threw 403.
    return { serverId, enabled: true };
  }
}
