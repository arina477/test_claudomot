import { Injectable, Logger } from '@nestjs/common';
import type { PrivacyEventListResponse, PrivacyEventType } from '@studyhall/shared';
import { PrivacyEventTypeSchema } from '@studyhall/shared';
import { desc, eq } from 'drizzle-orm';
import { db } from '../db/index';
import { privacyEvents } from '../db/schema/index';

// ---------------------------------------------------------------------------
// AppendPrivacyEventService — wave-73 B-2 privacy audit log
//
// APPEND-ONLY: exposes only `append` (write) and `listForActor` (read).
// No update/delete methods — this is a ledger.
//
// event_type is validated against the shared PrivacyEventTypeSchema (Zod parse)
// before INSERT — belt-and-suspenders even though callers pass typed literals.
//
// listForActor: SELECT WHERE actor_id = callerId ORDER BY created_at DESC LIMIT 100
// Maps DB snake_case row → camelCase PrivacyEvent DTO.
// ---------------------------------------------------------------------------

export interface AppendOpts {
  targetType: string;
  targetId?: string | null;
  context?: Record<string, unknown> | null;
}

@Injectable()
export class AppendPrivacyEventService {
  private readonly logger = new Logger(AppendPrivacyEventService.name);

  /**
   * Validate eventType and INSERT one privacy_events row.
   * Throws if eventType is not in the shared enum (programming error at callsite).
   */
  async append(actorId: string, eventType: PrivacyEventType, opts: AppendOpts): Promise<void> {
    // Belt-and-suspenders: callers pass typed literals, but parse defensively.
    PrivacyEventTypeSchema.parse(eventType);

    await db.insert(privacyEvents).values({
      actor_id: actorId,
      event_type: eventType,
      target_type: opts.targetType,
      target_id: opts.targetId ?? null,
      context: opts.context ?? null,
    });
  }

  /**
   * Read all privacy events for the calling user (own-scoped only).
   * Returns at most 100 rows, newest first.
   * Maps DB snake_case → camelCase PrivacyEvent DTO.
   */
  async listForActor(actorId: string): Promise<PrivacyEventListResponse> {
    const rows = await db
      .select()
      .from(privacyEvents)
      .where(eq(privacyEvents.actor_id, actorId))
      .orderBy(desc(privacyEvents.created_at))
      .limit(100);

    const events = rows.map((row) => ({
      id: row.id,
      actorId: row.actor_id,
      eventType: row.event_type as PrivacyEventType,
      targetType: row.target_type,
      targetId: row.target_id ?? null,
      context: row.context as Record<string, unknown> | null,
      createdAt: row.created_at.toISOString(),
    }));

    return { events };
  }
}
