import { z } from 'zod';

// ---------------------------------------------------------------------------
// NotificationType — discriminator for persistent in-app notifications
// wave-37 M7 (notifications bundle)
//
// mention        — actor sent a message that @-mentioned the recipient.
// assignment_reminder — an assignment the recipient is a member of is due soon.
// ---------------------------------------------------------------------------

export const NOTIFICATION_TYPES = ['mention', 'assignment_reminder'] as const;
export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

// ---------------------------------------------------------------------------
// NotificationSchema — single enriched notification row (GET /me/notifications)
//
// Flat schema (not discriminated union) — the `type` field drives rendering.
// Source refs are nullable because they apply only to the relevant type:
//   mention:              messageId, channelId, serverId populated; assignmentId null.
//   assignment_reminder:  assignmentId populated; messageId/channelId/serverId null.
//
// Enriched display fields are populated by the API join so the web panel can
// render without N+1 fetches (per design/notifications-center.html):
//   mention             → actorDisplayName + channelName + messageExcerpt + relative createdAt
//   assignment_reminder → assignmentTitle + dueDate + relative createdAt
// ---------------------------------------------------------------------------

export const NotificationSchema = z.object({
  id: z.string(),
  type: z.enum(NOTIFICATION_TYPES),
  createdAt: z.string(), // ISO 8601
  readAt: z.string().nullable(),

  // Source refs — nullable per type (see above)
  messageId: z.string().nullable(),
  channelId: z.string().nullable(),
  serverId: z.string().nullable(),
  assignmentId: z.string().nullable(),

  // Enriched display fields — populated per type by the API join
  actorDisplayName: z.string().nullable(),
  channelName: z.string().nullable(),
  messageExcerpt: z.string().nullable(),
  assignmentTitle: z.string().nullable(),
  dueDate: z.string().nullable(),
});
export type Notification = z.infer<typeof NotificationSchema>;

// ---------------------------------------------------------------------------
// NotificationListResponse — GET /me/notifications (paginated)
//
// unreadCount: total unread across all pages (server-side aggregate).
// nextCursor:  opaque cursor for the next page; null when on the last page.
// ---------------------------------------------------------------------------

export const NotificationListResponseSchema = z.object({
  items: z.array(NotificationSchema),
  unreadCount: z.number().int(),
  nextCursor: z.string().nullable(),
});
export type NotificationListResponse = z.infer<typeof NotificationListResponseSchema>;

// ---------------------------------------------------------------------------
// UnreadCountResponse — GET /me/notifications/unread-count
//
// Lightweight poll target for the bell badge (no item payload).
// ---------------------------------------------------------------------------

export const UnreadCountResponseSchema = z.object({
  unreadCount: z.number().int(),
});
export type UnreadCountResponse = z.infer<typeof UnreadCountResponseSchema>;
