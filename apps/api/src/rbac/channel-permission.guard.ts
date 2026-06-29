import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from './rbac.service';

// Internal shape for the NestJS-wrapped HTTP request
// (avoids importing express types which may not be available)
interface AugmentedRequest {
  params: Record<string, string>;
  body: unknown;
  session?: { getUserId(): string };
}

/**
 * ChannelPermissionGuard — verifies that the authenticated user can view the
 * target channel.
 *
 * Security invariant (P-4 carry-forward):
 *   - Reads serverId and channelId ONLY from ROUTE PARAMS — never from the
 *     request body. Body data is not trusted for authorization decisions;
 *     using body would allow callers to spoof the resource they are accessing.
 *   - Param keys: 'id' (serverId) and 'channelId'.
 *
 * Visibility logic is delegated to RbacService.canViewChannel(), which performs
 * the server-side check: owner → always visible; default role → visible unless
 * private; private channel → default-deny unless override grants can_view=true.
 */
@Injectable()
export class ChannelPermissionGuard implements CanActivate {
  constructor(private readonly rbacService: RbacService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<AugmentedRequest>();

    // Extract userId from session (never from body — IDOR prevention)
    if (!req.session) {
      throw new ForbiddenException('Authentication required');
    }
    const userId = req.session.getUserId();

    // Extract resource IDs from ROUTE PARAMS only — never from body
    const serverId = req.params.id;
    const channelId = req.params.channelId;

    if (!serverId || !channelId) {
      throw new ForbiddenException('Missing route params: id and channelId required');
    }

    const canView = await this.rbacService.canViewChannel(userId, serverId, channelId);
    if (!canView) {
      throw new ForbiddenException('Insufficient permissions to view this channel');
    }

    return true;
  }
}
