import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from './rbac.service';

// Internal shape for the NestJS-wrapped HTTP request
interface AugmentedRequest {
  params: Record<string, string>;
  body: unknown;
  session?: { getUserId(): string };
}

/**
 * ChannelMessageGuard — verifies the authenticated user can view the target
 * channel for message routes that carry ONLY :channelId (no :id/serverId).
 *
 * Security invariant (wave-12 P-4 carry-forward):
 *   - Reads channelId ONLY from ROUTE PARAMS — never from the request body.
 *     Body data is not trusted for authorization (IDOR prevention).
 *   - Route param key: 'channelId'.
 *   - Delegates to RbacService.canViewChannelById(userId, channelId) which
 *     resolves server_id from channels.server_id (notNull) then applies the
 *     full canViewChannel logic (owner superuser; private default-deny; etc.)
 *
 * Default-DENY: no fail-open path. Missing param → 403. False result → 403.
 * Missing channel → treated as 404 (channel not found) to distinguish from
 * permission errors.
 */
@Injectable()
export class ChannelMessageGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<AugmentedRequest>();

    // Authentication check — session must exist
    if (!req.session) {
      throw new ForbiddenException('Authentication required');
    }
    const userId = req.session.getUserId();

    // Extract channelId from ROUTE PARAMS only — never from body (IDOR-safe)
    const channelId = req.params.channelId;
    if (!channelId) {
      throw new ForbiddenException('Missing route param: channelId required');
    }

    const canView = await this.rbacService.canViewChannelById(userId, channelId);

    if (!canView) {
      // Distinguish missing channel (404) from permission failure (403).
      // We delegate the channel-existence check to canViewChannelById which
      // returns false for both. For the guard we use 403 (default-deny) as
      // the safe behaviour — the service layer provides the explicit 404.
      throw new ForbiddenException('Insufficient permissions to access this channel');
    }

    return true;
  }
}
