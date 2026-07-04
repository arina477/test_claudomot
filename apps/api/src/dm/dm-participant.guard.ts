import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { DmService } from './dm.service';

// Minimal interface for the NestJS-wrapped HTTP request
interface AugmentedRequest {
  params: Record<string, string>;
  session?: { getUserId(): string };
}

/**
 * DmParticipantGuard — verifies the authenticated user is a participant of the
 * DM conversation in the :id route param.
 *
 * Security invariants (mirror of ChannelMessageGuard):
 *   - Reads conversationId ONLY from ROUTE PARAMS — never from body (IDOR prevention).
 *   - Route param key: 'id'.
 *   - Returns NotFoundException (404) rather than ForbiddenException (403) for
 *     non-participants so the conversation's existence is never confirmed to
 *     a non-participant (non-leak / IDOR-safe).
 *   - Default-DENY: no fail-open path. Missing param → 404.
 */
@Injectable()
export class DmParticipantGuard implements CanActivate {
  constructor(private readonly dmService: DmService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const req = http.getRequest<AugmentedRequest>();

    // Auth check — session must exist (AuthGuard runs first)
    if (!req.session) {
      throw new NotFoundException('Conversation not found');
    }
    const userId = req.session.getUserId();

    // Extract conversationId from ROUTE PARAMS only — never from body
    const conversationId = req.params.id;
    if (!conversationId) {
      throw new NotFoundException('Conversation not found');
    }

    const participating = await this.dmService.isParticipant(conversationId, userId);
    if (!participating) {
      throw new NotFoundException('Conversation not found');
    }

    return true;
  }
}
