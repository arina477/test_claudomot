import { z } from 'zod';

// ---------------------------------------------------------------------------
// PrivacyEventTypeSchema — enumeration of all auditable privacy-related
// actions that the platform records in the privacy_events table.
//
// account_deleted        — user completed full account erasure
// data_exported          — user downloaded their data archive
// privacy_settings_changed — user updated profile_visibility or who_can_dm
// user_blocked           — user blocked another user
// user_unblocked         — user lifted a block on another user
// ---------------------------------------------------------------------------

export const PrivacyEventTypeSchema = z.enum([
  'account_deleted',
  'data_exported',
  'privacy_settings_changed',
  'user_blocked',
  'user_unblocked',
]);
export type PrivacyEventType = z.infer<typeof PrivacyEventTypeSchema>;

// ---------------------------------------------------------------------------
// PrivacyEventSchema — single privacy audit event as returned over the wire.
//
// DB columns are snake_case (actor_id, event_type, target_type, target_id,
// created_at); the backend maps DB → DTO so this schema uses camelCase
// consistently with every other entity DTO in this package.
//
// targetId is nullable — some events (e.g. data_exported) have no discrete
// target entity other than the actor themselves.
// context is a freeform JSON map for event-specific metadata (nullable when
// the event carries no extra payload).
// createdAt is an ISO-8601 string; the backend serialises the timestamp
// column to a string, consistent with MessageResponseSchema, RoleSchema, etc.
// ---------------------------------------------------------------------------

export const PrivacyEventSchema = z.object({
  id: z.string(),
  actorId: z.string(),
  eventType: PrivacyEventTypeSchema,
  targetType: z.string(),
  targetId: z.string().nullable(),
  context: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
});
export type PrivacyEvent = z.infer<typeof PrivacyEventSchema>;

// ---------------------------------------------------------------------------
// PrivacyEventListResponseSchema — GET /privacy/events response body.
//
// Wraps the events array in an envelope object so the API can extend the
// response (e.g. pagination cursors) without a breaking shape change.
// ---------------------------------------------------------------------------

export const PrivacyEventListResponseSchema = z.object({
  events: z.array(PrivacyEventSchema),
});
export type PrivacyEventListResponse = z.infer<typeof PrivacyEventListResponseSchema>;
