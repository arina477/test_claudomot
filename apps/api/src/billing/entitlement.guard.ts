import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  SetMetadata,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { Reflector } from '@nestjs/core';
import type { Entitlements } from '@studyhall/shared';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { EntitlementsService } from './entitlements.service';

// ---------------------------------------------------------------------------
// RequireEntitlement — route-level decorator naming a required boolean
// entitlement flag (wave-75 M9). Pair with EntitlementGuard.
//
//   @UseGuards(AuthGuard, EntitlementGuard)
//   @RequireEntitlement('educatorAdminTools')
//   @Get('servers/:serverId/educator-tools/status')
//
// The flag name must be a boolean key of Entitlements (compile-time enforced).
// ---------------------------------------------------------------------------

/** Metadata key under which the required entitlement flag is stored. */
export const REQUIRE_ENTITLEMENT_KEY = 'require_entitlement';

/** Boolean-valued keys of Entitlements (the only flags a guard can gate on). */
type BooleanEntitlementKey = {
  [K in keyof Entitlements]: Entitlements[K] extends boolean ? K : never;
}[keyof Entitlements];

export const RequireEntitlement = (flag: BooleanEntitlementKey) =>
  SetMetadata(REQUIRE_ENTITLEMENT_KEY, flag);

// ---------------------------------------------------------------------------
// EntitlementGuard — resolves the server's entitlements (via the :serverId
// route param) and rejects with 403 when the required flag is false.
//
// Ordering contract: this guard runs AFTER AuthGuard (authentication is a
// precondition). It does NOT perform an owner/member check — it gates purely on
// the server's resolved tier entitlements. Compose with an owner/member check
// separately when the endpoint requires one.
//
// If no @RequireEntitlement metadata is present, the guard is a pass-through
// (fail-open only when no flag is declared — a declared flag always fails-closed).
// ---------------------------------------------------------------------------

@Injectable()
export class EntitlementGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly entitlementsService: EntitlementsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const flag = this.reflector.getAllAndOverride<BooleanEntitlementKey | undefined>(
      REQUIRE_ENTITLEMENT_KEY,
      [context.getHandler(), context.getClass()],
    );

    // No flag declared → nothing to gate.
    if (!flag) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{ params?: Record<string, string> }>();
    const serverId = req.params?.serverId;
    if (!serverId) {
      // A gated route MUST carry a :serverId param; its absence is a wiring bug.
      throw new ForbiddenException('Server context required for this entitlement');
    }

    const { entitlements } = await this.entitlementsService.resolveForServer(serverId);
    if (entitlements[flag] !== true) {
      throw new ForbiddenException(`This feature requires a plan with '${flag}' enabled`);
    }

    return true;
  }
}
