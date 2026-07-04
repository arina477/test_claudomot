/**
 * Integration test: wave-43 scheduled-sessions CRUD + recurrence lifecycle — real-Postgres.
 *
 * Covers acceptance criteria for tasks 535bdb8c, cdf81427, 1216146e:
 *   1. create happy: organizer (manage_assignments) creates a one-off session → row in
 *      scheduled_sessions with correct server_id/organizer_id; DTO has organizer identity.
 *   2. non-organizer create → 403 (plain member; serverId passed as param).
 *   3. validation: create with endsAt <= startsAt → 400; create weekly with
 *      recurrenceUntil < startsAt → 400.
 *   4. update happy: organizer edits title/time → persisted; update range bypass FIXED
 *      (B-6 H1): single-field PATCH {startsAt: after existing endsAt} → 400; PATCH
 *      {endsAt: before existing startsAt} → 400 (effective-value re-check).
 *   5. update/delete authz + IDOR: non-organizer update/delete → 403; server_id derived
 *      from the session row (not client). softDelete → is_deleted=true; subsequent
 *      get/list excludes it.
 *   6. get: member gets a session → 200; non-member → 403; unknown/soft-deleted id → 404.
 *   7. list + recurrence expansion: member lists → 200 sessions ordered startsAt ASC; a
 *      weekly session with recurrence_until expands to multiple occurrences within from/to
 *      (count = expected, all sharing base id, distinct startsAt, capped at
 *      recurrence_until); a 'none' session appears once; 90-day window cap holds.
 *   8. no reminders/RSVP/ICS: DTO carries no reminder/rsvp/attendance/ics field.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  harnessQuery,
  insertFixtureMembership,
  insertFixtureRole,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT imports AFTER harness so the lazy db proxy resolves to the test DB.
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ScheduledSession } from '@studyhall/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RbacService } from '../../src/rbac/rbac.service';
import { SchedulingService } from '../../src/scheduling/scheduling.service';

// Skip-with-reason when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture UUIDs — stable across runs; namespaced to avoid collisions with
// other specs that share the same database.
// ---------------------------------------------------------------------------

const SERVER_ID = 'b2000000-0000-0000-0000-000000000001';
const SERVER_B_ID = 'b2000000-0000-0000-0000-000000000002'; // IDOR guard — different server

const ROLE_ORGANIZER_ID = 'd2000000-0000-0000-0000-000000000001';

const OWNER_ID = 'sched-owner';
const ORGANIZER_ID = 'sched-organizer';
const MEMBER_ID = 'sched-member';
const NON_MEMBER_ID = 'sched-nonmember';

// ---------------------------------------------------------------------------
// Time helpers — produce ISO 8601 strings relative to a fixed reference point
// so tests are deterministic regardless of wall-clock time.
// ---------------------------------------------------------------------------

/** Unix epoch for the test reference base: 2030-06-01T12:00:00.000Z */
const BASE_MS = Date.UTC(2030, 5, 1, 12, 0, 0, 0);

function isoAt(offsetMs: number): string {
  return new Date(BASE_MS + offsetMs).toISOString();
}

const H1 = 60 * 60 * 1000; // one hour in ms
const D1 = 24 * H1; // one day in ms
const W1 = 7 * D1; // one week in ms

// ---------------------------------------------------------------------------
// Main integration suite
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)(
  'SchedulingService — scheduled-sessions CRUD + recurrence lifecycle (wave-43 tasks 535bdb8c, cdf81427, 1216146e)',
  () => {
    let rbacService!: RbacService;
    let sut!: SchedulingService;

    beforeAll(async () => {
      await setupHarness();
      rbacService = new RbacService();
      sut = new SchedulingService(rbacService);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      // scheduled_sessions is not covered by truncateTables; clear it first
      // (CASCADE handles any future FKs that reference scheduled_sessions).
      await harnessQuery('TRUNCATE scheduled_sessions RESTART IDENTITY CASCADE');
      await truncateTables();

      // Users (parents before children for FK ordering)
      await insertFixtureUser(OWNER_ID, 'sched-owner@test.local');
      await insertFixtureUser(ORGANIZER_ID, 'sched-organizer@test.local');
      await insertFixtureUser(MEMBER_ID, 'sched-member@test.local');
      await insertFixtureUser(NON_MEMBER_ID, 'sched-nonmember@test.local');

      // Servers
      await insertFixtureServer(SERVER_ID, OWNER_ID, 'Scheduling Test Server');
      await insertFixtureServer(SERVER_B_ID, OWNER_ID, 'IDOR Guard Server B');

      // Role: manage_assignments=true (organizer gate reuses this permission)
      await insertFixtureRole(ROLE_ORGANIZER_ID, SERVER_ID, 'Organizer', {
        manage_assignments: true,
      });

      // Memberships
      await insertFixtureMembership(SERVER_ID, OWNER_ID); // server owner
      await insertFixtureMembership(SERVER_ID, ORGANIZER_ID, ROLE_ORGANIZER_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_ID); // plain member, no role
      // NON_MEMBER_ID intentionally has no server_members row for SERVER_ID
      // MEMBER_ID is also not a member of SERVER_B_ID
    });

    // -----------------------------------------------------------------------
    // Case 1 — create happy path (one-off session, organizer with manage_assignments)
    // -----------------------------------------------------------------------

    it('create happy: organizer creates a one-off session → DB row with correct server_id/organizer_id; DTO has organizer identity', async () => {
      // Arrange
      const input = {
        title: 'Algebra Study Session',
        description: 'Chapter 5 review',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      };

      // Act
      const result = await sut.createSession(SERVER_ID, ORGANIZER_ID, input);

      // Assert — returned DTO shape
      expect(result.serverId).toBe(SERVER_ID);
      expect(result.organizerId).toBe(ORGANIZER_ID);
      expect(result.title).toBe('Algebra Study Session');
      expect(result.description).toBe('Chapter 5 review');
      expect(result.recurrence).toBe('none');
      expect(result.recurrenceUntil).toBeNull();
      expect(typeof result.id).toBe('string');
      expect(result.startsAt).toBe(input.startsAt);
      expect(result.endsAt).toBe(input.endsAt);

      // Assert — organizer identity embedded in DTO
      expect(result.organizer).toBeDefined();
      expect(result.organizer.userId).toBe(ORGANIZER_ID);
      expect(typeof result.organizer.displayName).toBe('string');
      expect(typeof result.organizer.username).toBe('string');

      // Assert — DB row persisted with correct server_id and organizer_id
      const rows = await harnessQuery<{
        server_id: string;
        organizer_id: string;
        title: string;
        is_deleted: boolean;
      }>(
        'SELECT server_id, organizer_id, title, is_deleted FROM scheduled_sessions WHERE id = $1',
        [result.id],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.server_id).toBe(SERVER_ID);
      expect(rows[0]?.organizer_id).toBe(ORGANIZER_ID);
      expect(rows[0]?.title).toBe('Algebra Study Session');
      expect(rows[0]?.is_deleted).toBe(false);
    });

    // -----------------------------------------------------------------------
    // Case 2 — non-organizer create → 403
    // -----------------------------------------------------------------------

    it('non-organizer create → ForbiddenException (403); plain member has no manage_assignments', async () => {
      // Act + Assert: MEMBER_ID has no role (plain member) → assertOrganizer must reject
      await expect(
        sut.createSession(SERVER_ID, MEMBER_ID, {
          title: 'Unauthorised Session',
          startsAt: isoAt(D1),
          endsAt: isoAt(D1 + H1),
          recurrence: 'none' as const,
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Assert — no session row written
      const rows = await harnessQuery<{ id: string }>(
        'SELECT id FROM scheduled_sessions WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(rows).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // Case 3 — validation: endsAt <= startsAt → 400; weekly + recurrenceUntil < startsAt → 400
    // -----------------------------------------------------------------------

    it('create with endsAt equal to startsAt → BadRequestException (400)', async () => {
      const t = isoAt(D1);
      await expect(
        sut.createSession(SERVER_ID, ORGANIZER_ID, {
          title: 'Bad Times',
          startsAt: t,
          endsAt: t, // equal — must reject
          recurrence: 'none' as const,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('create with endsAt before startsAt → BadRequestException (400)', async () => {
      await expect(
        sut.createSession(SERVER_ID, ORGANIZER_ID, {
          title: 'Reversed Times',
          startsAt: isoAt(D1 + H1),
          endsAt: isoAt(D1), // before startsAt
          recurrence: 'none' as const,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('create weekly with recurrenceUntil before startsAt → BadRequestException (400)', async () => {
      await expect(
        sut.createSession(SERVER_ID, ORGANIZER_ID, {
          title: 'Bad Recurrence',
          startsAt: isoAt(D1),
          endsAt: isoAt(D1 + H1),
          recurrence: 'weekly' as const,
          recurrenceUntil: isoAt(D1 - H1), // before startsAt
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // -----------------------------------------------------------------------
    // Case 4 — update happy + B-6 H1 range-bypass fix
    // -----------------------------------------------------------------------

    it('update happy: organizer patches title and time → persisted in DB', async () => {
      // Arrange: create a session first
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Original Title',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Act
      const updated = await sut.updateSession(created.id, ORGANIZER_ID, {
        title: 'Updated Title',
        startsAt: isoAt(2 * D1),
        endsAt: isoAt(2 * D1 + H1),
      });

      // Assert — DTO reflects updated values
      expect(updated.title).toBe('Updated Title');
      expect(updated.startsAt).toBe(isoAt(2 * D1));
      expect(updated.endsAt).toBe(isoAt(2 * D1 + H1));

      // Assert — DB row persisted
      const rows = await harnessQuery<{ title: string; starts_at: Date }>(
        'SELECT title, starts_at FROM scheduled_sessions WHERE id = $1',
        [created.id],
      );
      expect(rows[0]?.title).toBe('Updated Title');
    });

    it('B-6 H1 fix: single-field PATCH startsAt after existing endsAt → BadRequestException (400)', async () => {
      // Arrange: session ends at D1+H1
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Act: patch only startsAt to a time after the existing endsAt → effective range inverted
      await expect(
        sut.updateSession(created.id, ORGANIZER_ID, {
          startsAt: isoAt(D1 + 2 * H1), // after existing endsAt (D1+H1)
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('B-6 H1 fix: single-field PATCH endsAt before existing startsAt → BadRequestException (400)', async () => {
      // Arrange: session starts at D1
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Act: patch only endsAt to a time before the existing startsAt → range inverted
      await expect(
        sut.updateSession(created.id, ORGANIZER_ID, {
          endsAt: isoAt(D1 - H1), // before existing startsAt (D1)
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // -----------------------------------------------------------------------
    // Case 5 — update/delete authz + IDOR + softDelete
    // -----------------------------------------------------------------------

    it('non-organizer update → ForbiddenException (403); server_id derived from session row', async () => {
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Protected Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      await expect(
        sut.updateSession(created.id, MEMBER_ID, { title: 'Hijacked' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('non-organizer delete → ForbiddenException (403); server_id derived from session row', async () => {
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Protected Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      await expect(sut.softDeleteSession(created.id, MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('softDelete sets is_deleted=true; subsequent get returns NotFoundException (404)', async () => {
      // Arrange
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Soon Gone',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Act
      await sut.softDeleteSession(created.id, ORGANIZER_ID);

      // Assert — DB row has is_deleted=true
      const rows = await harnessQuery<{ is_deleted: boolean }>(
        'SELECT is_deleted FROM scheduled_sessions WHERE id = $1',
        [created.id],
      );
      expect(rows[0]?.is_deleted).toBe(true);

      // Assert — getSession excludes soft-deleted rows
      await expect(sut.getSession(created.id, MEMBER_ID)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('softDelete excludes the session from listSessionsForServer', async () => {
      // Arrange: create two sessions; delete one
      const kept = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Kept',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });
      const deleted = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Deleted',
        startsAt: isoAt(2 * D1),
        endsAt: isoAt(2 * D1 + H1),
        recurrence: 'none' as const,
      });

      await sut.softDeleteSession(deleted.id, ORGANIZER_ID);

      // Act: list with window covering both sessions
      const response = await sut.listSessionsForServer(
        SERVER_ID,
        MEMBER_ID,
        isoAt(0),
        isoAt(30 * D1),
      );

      // Assert — only kept session appears
      expect(response.sessions).toHaveLength(1);
      expect(response.sessions[0]?.id).toBe(kept.id);
    });

    // -----------------------------------------------------------------------
    // Case 6 — get: member 200; non-member 403; unknown/soft-deleted → 404
    // -----------------------------------------------------------------------

    it('get: member retrieves a session → 200 with correct DTO', async () => {
      // Arrange
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Visible Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Act: MEMBER_ID is a server member
      const result = await sut.getSession(created.id, MEMBER_ID);

      // Assert
      expect(result.id).toBe(created.id);
      expect(result.title).toBe('Visible Session');
      expect(result.organizer.userId).toBe(ORGANIZER_ID);
    });

    it('get: non-member → ForbiddenException (403); server_id derived from session row', async () => {
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Invisible to Outsider',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // NON_MEMBER_ID has no server_members row for SERVER_ID
      await expect(sut.getSession(created.id, NON_MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('get: unknown id → NotFoundException (404)', async () => {
      await expect(
        sut.getSession('ffffffff-ffff-ffff-ffff-ffffffffffff', MEMBER_ID),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // -----------------------------------------------------------------------
    // Case 7 — list + recurrence expansion
    // -----------------------------------------------------------------------

    it('list: member lists sessions → 200 ordered startsAt ASC', async () => {
      // Arrange: insert two one-off sessions in reverse order
      await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Second Session',
        startsAt: isoAt(2 * D1),
        endsAt: isoAt(2 * D1 + H1),
        recurrence: 'none' as const,
      });
      await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'First Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Act
      const response = await sut.listSessionsForServer(
        SERVER_ID,
        MEMBER_ID,
        isoAt(0),
        isoAt(30 * D1),
      );

      // Assert — two results in ascending order
      expect(response.sessions).toHaveLength(2);
      expect(response.sessions[0]?.title).toBe('First Session');
      expect(response.sessions[1]?.title).toBe('Second Session');

      const t0 = new Date(response.sessions[0]?.startsAt ?? '').getTime();
      const t1 = new Date(response.sessions[1]?.startsAt ?? '').getTime();
      expect(t0).toBeLessThan(t1);
    });

    it('list: weekly session with recurrence_until expands to correct number of occurrences; all share base id, distinct startsAt, capped at recurrence_until', async () => {
      // Arrange: weekly session — starts at D1, runs for 4 weeks (occurrences: D1, D1+W1, D1+2W1, D1+3W1)
      const recurrenceUntil = isoAt(D1 + 3 * W1); // exactly 4 occurrences
      const created = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Weekly Study',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'weekly' as const,
        recurrenceUntil,
      });

      // Act: window covers all 4 weeks + some buffer
      const response = await sut.listSessionsForServer(
        SERVER_ID,
        MEMBER_ID,
        isoAt(0),
        isoAt(D1 + 3 * W1 + D1), // one extra day past recurrenceUntil
      );

      // Assert — exactly 4 occurrences (weekly from D1 to D1+3W1)
      expect(response.sessions).toHaveLength(4);

      // All share the same base id
      for (const occ of response.sessions) {
        expect(occ.id).toBe(created.id);
      }

      // startsAt values are distinct and exactly one week apart
      const starts = response.sessions.map((s) => new Date(s.startsAt).getTime());
      for (let i = 1; i < starts.length; i++) {
        const curr = starts[i] ?? 0;
        const prev = starts[i - 1] ?? 0;
        expect(curr - prev).toBe(W1);
      }

      // Last occurrence start must be <= recurrenceUntil
      const lastStart = starts[starts.length - 1] ?? 0;
      expect(lastStart).toBeLessThanOrEqual(new Date(recurrenceUntil).getTime());
    });

    it('list: recurrence=none session appears exactly once within window', async () => {
      await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'One-Off',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      const response = await sut.listSessionsForServer(
        SERVER_ID,
        MEMBER_ID,
        isoAt(0),
        isoAt(30 * D1),
      );

      expect(response.sessions).toHaveLength(1);
    });

    it('list: 90-day window cap — a larger window does not expand weekly beyond 90 days from start', async () => {
      // Arrange: weekly session starting at D1 with no recurrenceUntil
      // Request a 200-day window — the service must hard-cap at 90 days from windowStart.
      // Expected occurrences = floor((90 * D1) / W1) = floor(90/7) = 12 full weeks
      // (up to but not exceeding 90 days from windowStart)
      await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Forever Weekly',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'weekly' as const,
      });

      const windowStart = isoAt(0);
      const windowEnd = isoAt(200 * D1); // deliberate oversized window (200 days)

      const response = await sut.listSessionsForServer(
        SERVER_ID,
        MEMBER_ID,
        windowStart,
        windowEnd,
      );

      // The cap is 90 days from windowStart; last occurrence start must be within that cap
      const capMs = BASE_MS + 90 * D1;
      for (const session of response.sessions) {
        expect(new Date(session.startsAt).getTime()).toBeLessThanOrEqual(capMs);
      }

      // Must have multiple occurrences (not truncated to 1) — confirms weekly expansion ran
      expect(response.sessions.length).toBeGreaterThan(1);
    });

    it('list: non-member → ForbiddenException (403)', async () => {
      await expect(
        sut.listSessionsForServer(SERVER_ID, NON_MEMBER_ID, isoAt(0), isoAt(30 * D1)),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    // -----------------------------------------------------------------------
    // Case 8 — no reminders/RSVP/ICS: DTO must not carry those fields
    // -----------------------------------------------------------------------

    it('no reminders/RSVP/ICS: createSession DTO carries no reminder/rsvp/attendance/ics field', async () => {
      // Act
      const result: ScheduledSession = await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Clean DTO Session',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      // Assert — none of the forbidden fields are present on the runtime object
      const asRecord = result as unknown as Record<string, unknown>;
      expect(asRecord.reminder).toBeUndefined();
      expect(asRecord.reminders).toBeUndefined();
      expect(asRecord.rsvp).toBeUndefined();
      expect(asRecord.attendance).toBeUndefined();
      expect(asRecord.ics).toBeUndefined();
      expect(asRecord.icsUrl).toBeUndefined();
    });

    it('no reminders/RSVP/ICS: listSessionsForServer occurrences carry no forbidden fields', async () => {
      await sut.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'List Clean DTO',
        startsAt: isoAt(D1),
        endsAt: isoAt(D1 + H1),
        recurrence: 'none' as const,
      });

      const response = await sut.listSessionsForServer(
        SERVER_ID,
        MEMBER_ID,
        isoAt(0),
        isoAt(30 * D1),
      );

      for (const session of response.sessions) {
        const asRecord = session as unknown as Record<string, unknown>;
        expect(asRecord.reminder).toBeUndefined();
        expect(asRecord.reminders).toBeUndefined();
        expect(asRecord.rsvp).toBeUndefined();
        expect(asRecord.attendance).toBeUndefined();
        expect(asRecord.ics).toBeUndefined();
        expect(asRecord.icsUrl).toBeUndefined();
      }
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('SchedulingService — scheduled-sessions CRUD + recurrence lifecycle (wave-43 tasks 535bdb8c, cdf81427, 1216146e)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
