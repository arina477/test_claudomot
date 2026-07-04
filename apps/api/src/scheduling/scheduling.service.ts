import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  CreateScheduledSessionInput,
  ScheduledSession,
  ScheduledSessionListResponse,
  UpdateScheduledSessionInput,
} from '@studyhall/shared';
import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '../db/index';
import { scheduled_sessions, server_members, users } from '../db/schema/index';
// biome-ignore lint/style/useImportType: NestJS DI requires value import for emitDecoratorMetadata
import { RbacService } from '../rbac/rbac.service';

// ---------------------------------------------------------------------------
// SchedulingService — wave-43 class-scheduling (task 535bdb8c)
//
// Organizer authz: rbac can(userId, serverId, 'manage_assignments')
//   - Mirrors AssignmentsService — single call site per G3 pattern.
//   - No scheduling-specific permission; reuses manage_assignments.
//
// Soft-delete: is_deleted=true; list/get exclude is_deleted rows.
//
// IDOR-safe: :id routes derive server_id from the session row — never a
//   client-supplied param.
//
// Recurrence expand: compute-on-read for 'weekly' sessions — no materialized
//   rows. Hard-cap window to ≤ 90 days; default 60-day window when absent.
// ---------------------------------------------------------------------------

// Window caps (ms)
const DEFAULT_WINDOW_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const MAX_WINDOW_MS = 90 * 24 * 60 * 60 * 1000; // 90 days
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class SchedulingService {
  private readonly logger = new Logger(SchedulingService.name);

  constructor(private readonly rbacService: RbacService) {}

  // -------------------------------------------------------------------------
  // assertOrganizer — gate on can(userId, serverId, 'manage_assignments')
  // Single call site per G3 annotation. Throws 403 on failure.
  // Reuses manage_assignments — no scheduling-specific permission invented.
  // -------------------------------------------------------------------------

  private async assertOrganizer(userId: string, serverId: string): Promise<void> {
    const allowed = await this.rbacService.can(userId, serverId, 'manage_assignments');
    if (!allowed) {
      throw new ForbiddenException(
        'Insufficient permissions: organizer (manage_assignments) required',
      );
    }
  }

  // -------------------------------------------------------------------------
  // assertMember — gate on server_members membership (no role needed)
  // Used by list/get routes.
  // -------------------------------------------------------------------------

  private async assertMember(userId: string, serverId: string): Promise<void> {
    const [member] = await db
      .select({ id: server_members.id })
      .from(server_members)
      .where(and(eq(server_members.server_id, serverId), eq(server_members.user_id, userId)))
      .limit(1);

    if (!member) {
      throw new ForbiddenException('You are not a member of this server');
    }
  }

  // -------------------------------------------------------------------------
  // sessionRowToDto — map a DB row + resolved organizer to ScheduledSession DTO
  // Mirrors AssignmentsService rowToDto pattern. organizer identity is
  // pre-resolved by the caller (list path batches; single-row paths fetch once).
  // -------------------------------------------------------------------------

  private sessionRowToDto(
    row: {
      id: string;
      server_id: string;
      organizer_id: string;
      title: string;
      description: string | null;
      starts_at: Date;
      ends_at: Date;
      recurrence: string;
      recurrence_until: Date | null;
      is_deleted: boolean;
      created_at: Date;
      updated_at: Date;
    },
    organizerIdentity: {
      userId: string;
      displayName: string;
      username: string;
      avatarUrl: string | null;
    },
  ): ScheduledSession {
    return {
      id: row.id,
      serverId: row.server_id,
      organizerId: row.organizer_id,
      title: row.title,
      description: row.description ?? null,
      startsAt: row.starts_at.toISOString(),
      endsAt: row.ends_at.toISOString(),
      recurrence: (row.recurrence === 'weekly' ? 'weekly' : 'none') as 'none' | 'weekly',
      recurrenceUntil: row.recurrence_until?.toISOString() ?? null,
      organizer: organizerIdentity,
    };
  }

  // -------------------------------------------------------------------------
  // resolveOrganizerIdentity — single-user lookup for non-list paths
  // -------------------------------------------------------------------------

  private async resolveOrganizerIdentity(organizerId: string): Promise<{
    userId: string;
    displayName: string;
    username: string;
    avatarUrl: string | null;
  }> {
    const [userRow] = await db
      .select({
        id: users.id,
        display_name: users.display_name,
        username: users.username,
        avatar_url: users.avatar_url,
      })
      .from(users)
      .where(eq(users.id, organizerId))
      .limit(1);

    return {
      userId: organizerId,
      displayName: userRow?.display_name ?? '',
      username: userRow?.username ?? '',
      avatarUrl: userRow?.avatar_url ?? null,
    };
  }

  // -------------------------------------------------------------------------
  // createSession — POST /servers/:serverId/scheduled-sessions
  //
  // Organizer authz. Defensive endsAt>startsAt guard (Zod refine already
  // enforces, but service layer duplicates for belt-and-suspenders).
  // Returns DTO with resolved organizer identity.
  // -------------------------------------------------------------------------

  async createSession(
    serverId: string,
    userId: string,
    input: CreateScheduledSessionInput,
  ): Promise<ScheduledSession> {
    await this.assertOrganizer(userId, serverId);

    const startsAt = new Date(input.startsAt);
    const endsAt = new Date(input.endsAt);

    // Defensive guard — mirrors Zod refine; belt-and-suspenders
    if (endsAt <= startsAt) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    if (
      input.recurrence === 'weekly' &&
      input.recurrenceUntil != null &&
      new Date(input.recurrenceUntil) < new Date(input.startsAt)
    ) {
      throw new BadRequestException('recurrenceUntil must be on or after startsAt');
    }

    const [inserted] = await db
      .insert(scheduled_sessions)
      .values({
        server_id: serverId,
        organizer_id: userId,
        title: input.title,
        description: input.description ?? null,
        starts_at: startsAt,
        ends_at: endsAt,
        recurrence: input.recurrence ?? 'none',
        recurrence_until: input.recurrenceUntil != null ? new Date(input.recurrenceUntil) : null,
      })
      .returning();

    if (!inserted) throw new Error('Session insert failed unexpectedly');

    const organizerIdentity = await this.resolveOrganizerIdentity(userId);
    return this.sessionRowToDto(inserted, organizerIdentity);
  }

  // -------------------------------------------------------------------------
  // updateSession — PATCH /scheduled-sessions/:id
  //
  // Fetch row → derive server_id (IDOR-safe); assertOrganizer; partial update.
  // Returns updated DTO with resolved organizer identity.
  // -------------------------------------------------------------------------

  async updateSession(
    id: string,
    userId: string,
    input: UpdateScheduledSessionInput,
  ): Promise<ScheduledSession> {
    const [existing] = await db
      .select()
      .from(scheduled_sessions)
      .where(and(eq(scheduled_sessions.id, id), eq(scheduled_sessions.is_deleted, false)))
      .limit(1);

    if (!existing) throw new NotFoundException('Session not found');

    // Derive server_id from row (IDOR-safe — never trust a client param)
    await this.assertOrganizer(userId, existing.server_id);

    // Build partial patch
    const patch: {
      title?: string;
      description?: string | null;
      starts_at?: Date;
      ends_at?: Date;
      recurrence?: string;
      recurrence_until?: Date | null;
      updated_at: Date;
    } = { updated_at: new Date() };

    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description ?? null;
    if (input.startsAt !== undefined) patch.starts_at = new Date(input.startsAt);
    if (input.endsAt !== undefined) patch.ends_at = new Date(input.endsAt);
    if (input.recurrence !== undefined) patch.recurrence = input.recurrence;
    if (input.recurrenceUntil !== undefined) {
      patch.recurrence_until =
        input.recurrenceUntil != null ? new Date(input.recurrenceUntil) : null;
    }

    // Effective-values cross-field re-check (belt-and-suspenders for partial patches)
    // UpdateScheduledSessionSchema refine only fires when BOTH startsAt+endsAt are
    // present in the patch; a one-sided update can produce ends<=starts in DB.
    const effStarts = patch.starts_at ?? existing.starts_at;
    const effEnds = patch.ends_at ?? existing.ends_at;
    if (effEnds <= effStarts) {
      throw new BadRequestException('endsAt must be after startsAt');
    }
    const effRecurrence = patch.recurrence ?? existing.recurrence;
    const effUntil =
      input.recurrenceUntil !== undefined ? patch.recurrence_until : existing.recurrence_until;
    if (effRecurrence === 'weekly' && effUntil != null && effUntil < effStarts) {
      throw new BadRequestException('recurrenceUntil must be on or after startsAt');
    }

    const [updated] = await db
      .update(scheduled_sessions)
      .set(patch)
      .where(eq(scheduled_sessions.id, id))
      .returning();

    if (!updated) throw new Error('Session update failed unexpectedly');

    const organizerIdentity = await this.resolveOrganizerIdentity(updated.organizer_id);
    return this.sessionRowToDto(updated, organizerIdentity);
  }

  // -------------------------------------------------------------------------
  // softDeleteSession — DELETE /scheduled-sessions/:id
  //
  // Fetch row → derive server_id (IDOR-safe); assertOrganizer; is_deleted=true.
  // Returns void (controller sends 204).
  // -------------------------------------------------------------------------

  async softDeleteSession(id: string, userId: string): Promise<void> {
    const [existing] = await db
      .select()
      .from(scheduled_sessions)
      .where(and(eq(scheduled_sessions.id, id), eq(scheduled_sessions.is_deleted, false)))
      .limit(1);

    if (!existing) throw new NotFoundException('Session not found');

    // Derive server_id from row (IDOR-safe)
    await this.assertOrganizer(userId, existing.server_id);

    await db
      .update(scheduled_sessions)
      .set({ is_deleted: true, updated_at: new Date() })
      .where(eq(scheduled_sessions.id, id));
  }

  // -------------------------------------------------------------------------
  // getSession — GET /scheduled-sessions/:id
  //
  // Fetch row → derive server_id (IDOR-safe); assertMember.
  // 404 if unknown or soft-deleted. Returns DTO with resolved organizer identity.
  // -------------------------------------------------------------------------

  async getSession(id: string, userId: string): Promise<ScheduledSession> {
    const [row] = await db
      .select()
      .from(scheduled_sessions)
      .where(and(eq(scheduled_sessions.id, id), eq(scheduled_sessions.is_deleted, false)))
      .limit(1);

    if (!row) throw new NotFoundException('Session not found');

    // Derive server_id from row (IDOR-safe — never trust a client param)
    await this.assertMember(userId, row.server_id);

    const organizerIdentity = await this.resolveOrganizerIdentity(row.organizer_id);
    return this.sessionRowToDto(row, organizerIdentity);
  }

  // -------------------------------------------------------------------------
  // listSessionsForServer — GET /servers/:serverId/scheduled-sessions?from&to
  //
  // Member authz. Selects all non-deleted sessions for the server; expands
  // weekly recurrence compute-on-read. Hard-cap window ≤ 90 days; defaults
  // to 60-day window from `from` (or now) when from/to absent.
  //
  // Recurrence='weekly': emit one occurrence per week from starts_at up to
  //   min(recurrence_until, windowEnd), each carrying shifted startsAt/endsAt
  //   but same id + base fields. Only occurrences with starts_at in [from,to].
  // Recurrence='none': emit once if starts_at falls within [from, to].
  //
  // Organizer identity resolved in a single batched IN query (no N+1).
  // Returns { sessions: [...occurrences] } sorted by startsAt ASC.
  // -------------------------------------------------------------------------

  async listSessionsForServer(
    serverId: string,
    userId: string,
    from?: string,
    to?: string,
  ): Promise<ScheduledSessionListResponse> {
    await this.assertMember(userId, serverId);

    // Build window with hard-cap
    const windowStart = from ? new Date(from) : new Date();
    let windowEnd = to ? new Date(to) : new Date(windowStart.getTime() + DEFAULT_WINDOW_MS);

    // Clamp to max 90-day span
    const maxEnd = new Date(windowStart.getTime() + MAX_WINDOW_MS);
    if (windowEnd > maxEnd) {
      windowEnd = maxEnd;
    }

    // Fetch all non-deleted sessions for this server ordered by starts_at ASC
    const rows = await db
      .select()
      .from(scheduled_sessions)
      .where(
        and(eq(scheduled_sessions.server_id, serverId), eq(scheduled_sessions.is_deleted, false)),
      )
      .orderBy(asc(scheduled_sessions.starts_at));

    if (rows.length === 0) return { sessions: [] };

    // Batch-resolve all unique organizer identities (single IN query — no N+1)
    const organizerIds = [...new Set(rows.map((r) => r.organizer_id))];
    const organizerRows = await db
      .select({
        id: users.id,
        display_name: users.display_name,
        username: users.username,
        avatar_url: users.avatar_url,
      })
      .from(users)
      .where(inArray(users.id, organizerIds));

    const organizerMap = new Map(
      organizerRows.map((u) => [
        u.id,
        {
          userId: u.id,
          displayName: u.display_name ?? '',
          username: u.username ?? '',
          avatarUrl: u.avatar_url ?? null,
        },
      ]),
    );

    const fallbackIdentity = (organizerId: string) =>
      organizerMap.get(organizerId) ?? {
        userId: organizerId,
        displayName: '',
        username: '',
        avatarUrl: null,
      };

    const occurrences: ScheduledSession[] = [];

    for (const row of rows) {
      if (row.recurrence === 'weekly') {
        // Expand weekly recurrence occurrences within the window
        const sessionDurationMs = row.ends_at.getTime() - row.starts_at.getTime();
        const effectiveUntil = row.recurrence_until
          ? new Date(Math.min(row.recurrence_until.getTime(), windowEnd.getTime()))
          : windowEnd;

        // Find the first occurrence >= windowStart by advancing in weekly steps
        let occurrenceStart = new Date(row.starts_at);
        if (occurrenceStart < windowStart) {
          const weeksToSkip = Math.ceil(
            (windowStart.getTime() - occurrenceStart.getTime()) / ONE_WEEK_MS,
          );
          occurrenceStart = new Date(occurrenceStart.getTime() + weeksToSkip * ONE_WEEK_MS);
        }

        while (occurrenceStart <= effectiveUntil) {
          const occurrenceEnd = new Date(occurrenceStart.getTime() + sessionDurationMs);

          // Emit only occurrences whose start falls within [windowStart, windowEnd]
          if (occurrenceStart >= windowStart && occurrenceStart <= windowEnd) {
            occurrences.push(
              this.sessionRowToDto(
                { ...row, starts_at: occurrenceStart, ends_at: occurrenceEnd },
                fallbackIdentity(row.organizer_id),
              ),
            );
          }

          occurrenceStart = new Date(occurrenceStart.getTime() + ONE_WEEK_MS);
        }
      } else {
        // recurrence='none' — emit once if starts_at falls within [windowStart, windowEnd]
        if (row.starts_at >= windowStart && row.starts_at <= windowEnd) {
          occurrences.push(this.sessionRowToDto(row, fallbackIdentity(row.organizer_id)));
        }
      }
    }

    // Sort all occurrences by startsAt ASC (weekly expansion may interleave with 'none' sessions)
    occurrences.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());

    return { sessions: occurrences };
  }
}
