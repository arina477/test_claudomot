/**
 * NotificationsController unit tests — wave-37 B-6 REWORK (Fix 3 HIGH-1 test gap)
 *
 * Covers:
 *   - HTTP method decorators: PATCH :id/read → markRead, POST read-all → markAllRead,
 *     GET / → list (decorator-level assertion catches a POST/PATCH method drift in CI
 *     before a frontend ever hits the wrong verb)
 *   - Route path decorators: confirm path strings match the spec
 *   - Delegation: each controller method delegates to the correct service method
 *   - Session-scoped userId: userId is derived from session, never from a URL param
 *     or request body (IDOR structural proof)
 *
 * NestJS DI (Test.createTestingModule) requires emitDecoratorMetadata which
 * esbuild/vitest does not emit, so services are wired via direct construction
 * with vi.fn() mocks — mirrors the pattern in privacy.controller.spec.ts.
 *
 * reflect-metadata is loaded by vitest setupFiles (vitest.config.ts), so
 * Reflect.getMetadata is available without an explicit import here.
 */

import { RequestMethod } from '@nestjs/common';
import type { NotificationListResponse, UnreadCountResponse } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationsController } from './notifications.controller';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Minimal session-augmented request — mirrors SessionAugmentedRequest interface. */
function makeReq(userId = 'notif-user-1') {
  return { session: { getUserId: () => userId } };
}

const mockListResponse: NotificationListResponse = {
  items: [],
  unreadCount: 0,
  nextCursor: null,
};

const mockUnreadCount: UnreadCountResponse = { unreadCount: 2 };
const mockUnreadZero: UnreadCountResponse = { unreadCount: 0 };

function makeController() {
  const notificationsService = {
    listForUser: vi.fn().mockResolvedValue(mockListResponse),
    markRead: vi.fn().mockResolvedValue(mockUnreadCount),
    markAllRead: vi.fn().mockResolvedValue(mockUnreadZero),
  };
  // biome-ignore lint/suspicious/noExplicitAny: test mock — full service types not needed
  const controller = new NotificationsController(notificationsService as any);
  return { controller, notificationsService };
}

// ---------------------------------------------------------------------------
// HTTP method + path decorator assertions
//
// These are the primary CI safety net against method drift: if someone changes
// @Patch to @Post (or vice-versa) these assertions fail immediately — before
// any HTTP routing or integration test runs.
// ---------------------------------------------------------------------------

describe('NotificationsController — HTTP method + path decorators', () => {
  // NestJS stores route metadata on the handler function itself (descriptor.value),
  // NOT on the prototype object via a (prototype, propertyKey) pair.  The correct
  // lookup is: Reflect.getMetadata(key, NotificationsController.prototype.handlerName)
  // (i.e., the function value as the target with no property key argument).
  // Note: the RequestMethod enum uses all-uppercase members (PATCH, POST, GET).

  it('markRead is decorated with PATCH (RequestMethod.PATCH = 4)', () => {
    const method = Reflect.getMetadata('method', NotificationsController.prototype.markRead);
    expect(method).toBe(RequestMethod.PATCH);
  });

  it('markRead path is ":id/read"', () => {
    const path = Reflect.getMetadata('path', NotificationsController.prototype.markRead);
    expect(path).toBe(':id/read');
  });

  it('markAllRead is decorated with POST (RequestMethod.POST = 1)', () => {
    const method = Reflect.getMetadata('method', NotificationsController.prototype.markAllRead);
    expect(method).toBe(RequestMethod.POST);
  });

  it('markAllRead path is "read-all"', () => {
    const path = Reflect.getMetadata('path', NotificationsController.prototype.markAllRead);
    expect(path).toBe('read-all');
  });

  it('list is decorated with GET (RequestMethod.GET = 0)', () => {
    const method = Reflect.getMetadata('method', NotificationsController.prototype.list);
    expect(method).toBe(RequestMethod.GET);
  });
});

// ---------------------------------------------------------------------------
// GET /me/notifications — list
// ---------------------------------------------------------------------------

describe('NotificationsController.list — GET /me/notifications', () => {
  let controller: NotificationsController;
  let notificationsService: ReturnType<typeof makeController>['notificationsService'];

  beforeEach(() => {
    ({ controller, notificationsService } = makeController());
  });

  it('delegates to notificationsService.listForUser with session userId and no cursor', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.list(makeReq('user-abc') as any, undefined);

    expect(result).toEqual(mockListResponse);
    expect(notificationsService.listForUser).toHaveBeenCalledWith('user-abc', undefined);
  });

  it('forwards the cursor query param to listForUser', async () => {
    const cursor = 'dGVzdC1jdXJzb3I';

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.list(makeReq() as any, cursor);

    expect(notificationsService.listForUser).toHaveBeenCalledWith('notif-user-1', cursor);
  });

  it('derives userId from session (not from query) — structural IDOR proof', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.list(makeReq('session-user-42') as any, undefined);

    expect(notificationsService.listForUser).toHaveBeenCalledWith('session-user-42', undefined);
    expect(notificationsService.listForUser).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// PATCH /me/notifications/:id/read — markRead
// ---------------------------------------------------------------------------

describe('NotificationsController.markRead — PATCH /me/notifications/:id/read', () => {
  let controller: NotificationsController;
  let notificationsService: ReturnType<typeof makeController>['notificationsService'];

  beforeEach(() => {
    ({ controller, notificationsService } = makeController());
  });

  it('delegates to notificationsService.markRead with session userId and the notification id', async () => {
    const notifId = 'notif-uuid-001';

    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.markRead(makeReq('user-abc') as any, notifId);

    expect(result).toEqual(mockUnreadCount);
    expect(notificationsService.markRead).toHaveBeenCalledWith('user-abc', notifId);
  });

  it('derives userId from session, not from the :id URL param — structural session-scoping proof', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.markRead(makeReq('session-user-99') as any, 'some-notif-id');

    // The userId passed to markRead must come from req.session, never from a
    // URL param — an attacker cannot substitute their own userId via the URL.
    expect(notificationsService.markRead).toHaveBeenCalledWith('session-user-99', 'some-notif-id');
  });

  it('returns UnreadCountResponse from notificationsService.markRead', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.markRead(makeReq() as any, 'notif-abc');

    expect(result).toHaveProperty('unreadCount');
    expect(typeof result.unreadCount).toBe('number');
  });
});

// ---------------------------------------------------------------------------
// POST /me/notifications/read-all — markAllRead
// ---------------------------------------------------------------------------

describe('NotificationsController.markAllRead — POST /me/notifications/read-all', () => {
  let controller: NotificationsController;
  let notificationsService: ReturnType<typeof makeController>['notificationsService'];

  beforeEach(() => {
    ({ controller, notificationsService } = makeController());
  });

  it('delegates to notificationsService.markAllRead with session userId', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.markAllRead(makeReq('user-xyz') as any);

    expect(result).toEqual(mockUnreadZero);
    expect(notificationsService.markAllRead).toHaveBeenCalledWith('user-xyz');
  });

  it('returns {unreadCount: 0} after bulk mark', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    const result = await controller.markAllRead(makeReq() as any);

    expect(result).toEqual({ unreadCount: 0 });
  });

  it('derives userId from session (not body) — structural session-scoping proof', async () => {
    // biome-ignore lint/suspicious/noExplicitAny: test cast
    await controller.markAllRead(makeReq('session-scoped-88') as any);

    expect(notificationsService.markAllRead).toHaveBeenCalledWith('session-scoped-88');
    expect(notificationsService.markAllRead).toHaveBeenCalledTimes(1);
  });
});
