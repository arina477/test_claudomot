import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// EducatorAccessGuard — wave-76 M13 educator admin console (block 682e0912).
//
// Composed authorization for the educator-tools surface. Resolves the caller
// (opaque userId from the verified session) and the :serverId route param,
// then delegates the owner/educator predicate to RbacService.can():
//
//   RbacService.can(userId, serverId, 'manage_assignments')
//
// can() folds the owner short-circuit into its superuser branch and resolves
// role capabilities default-deny — so this guard does NOT hand-roll any
// owner/role/membership resolution (avoids IDOR + duplicated authz logic).
//
// Ordering contract: this guard runs AFTER AuthGuard (authentication) AND
// AFTER EntitlementGuard (the server tier gate). Compose order on the route:
//
//   @UseGuards(AuthGuard, EntitlementGuard, EducatorAccessGuard)
//
// EntitlementGuard gates on the SERVER's plan (is educatorAdminTools unlocked
// for this server at all); EducatorAccessGuard gates on the CALLER's authority
// within that server (owner or a role with manage_assignments). Both must pass.
//
// Throws ForbiddenException (403) when can() returns false — this closes the
// wave-75 T8-F1 leak where a non-owner/non-educator member of a school-tier
// server could reach the educator-tools handler purely on the tier gate.
// ---------------------------------------------------------------------------

interface SessionAugmentedRequest {
  session?: { getUserId(): string };
  params?: Record<string, string>;
}

@Injectable()
export class EducatorAccessGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<SessionAugmentedRequest>();

    const serverId = req.params?.serverId;
    if (!serverId) {
      // A gated route MUST carry a :serverId param; its absence is a wiring bug.
      throw new ForbiddenException('Server context required for educator access');
    }

    // userId ALWAYS comes from the verified session token (no IDOR). AuthGuard
    // runs first and guarantees the session is present; defend anyway.
    const userId = req.session?.getUserId();
    if (!userId) {
      throw new ForbiddenException('Authentication required for educator access');
    }

    const allowed = await this.rbacService.can(userId, serverId, 'manage_assignments');
    if (!allowed) {
      throw new ForbiddenException('Educator access required for this server');
    }

    return true;
  }
}
