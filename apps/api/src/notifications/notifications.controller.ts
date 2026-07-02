import {
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { NotificationListResponse, UnreadCountResponse } from '@studyhall/shared';
import { SessionNoVerifyGuard } from '../auth/session-no-verify.guard';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { NotificationsService } from './notifications.service';

// ---------------------------------------------------------------------------
// NotificationsController — wave-37 M7 in-app notifications (B-2)
//
// All routes are session-scoped: userId is derived from session only (never
// from a URL param) — mirrors the privacy.controller.ts pattern exactly.
//
// Routes:
//   GET  /me/notifications?cursor=   → NotificationListResponse (paginated)
//   PATCH /me/notifications/:id/read → UnreadCountResponse (single mark)
//   POST  /me/notifications/read-all → UnreadCountResponse (bulk mark)
// ---------------------------------------------------------------------------

// Minimal interface for the ST-augmented request — mirrors privacy.controller.ts.
interface SessionAugmentedRequest {
  session: {
    getUserId(): string;
  };
}

@Controller('me/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // GET /me/notifications?cursor=<opaque>
  // Returns the authed user's notifications, newest-first, cursor-paginated.
  // cursor is optional; absent cursor returns the first page.
  @Get()
  @UseGuards(SessionNoVerifyGuard)
  async list(
    @Req() req: SessionAugmentedRequest,
    @Query('cursor') cursor?: string,
  ): Promise<NotificationListResponse> {
    const userId = req.session.getUserId();
    return this.notificationsService.listForUser(userId, cursor);
  }

  // PATCH /me/notifications/:id/read
  // Marks a single notification read. 404 if not owned by the session user.
  @Patch(':id/read')
  @UseGuards(SessionNoVerifyGuard)
  async markRead(
    @Req() req: SessionAugmentedRequest,
    @Param('id') id: string,
  ): Promise<UnreadCountResponse> {
    const userId = req.session.getUserId();
    return this.notificationsService.markRead(userId, id);
  }

  // POST /me/notifications/read-all
  // Marks all of the session user's unread notifications as read.
  // Returns {unreadCount: 0} — no body required.
  @Post('read-all')
  @HttpCode(200)
  @UseGuards(SessionNoVerifyGuard)
  async markAllRead(@Req() req: SessionAugmentedRequest): Promise<UnreadCountResponse> {
    const userId = req.session.getUserId();
    return this.notificationsService.markAllRead(userId);
  }
}
