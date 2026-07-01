/**
 * Integration test: ReminderScanService — real-Postgres (wave-30 B-2, Refs 4a4c2715).
 *
 * Covers:
 *   (a) Member with NO assignment_status row IS reminded (LEFT-JOIN correctness case).
 *   (b) Member who marked the assignment 'done' is NOT reminded.
 *   (c) Send-once: running scanAndSendReminders() a second time inserts 0 new rows + 0 new emails.
 *   (d) Assignment due in the PAST (due_date < now) is NOT reminded (E2 past-due guard).
 *   (e) Assignment due > 24h out is NOT reminded (out of window).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
// at module-eval time so the lazy db singleton resolves to the test DB.
import './pg-harness';
import {
  harnessQuery,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT imports AFTER harness so the lazy db proxy resolves to the test DB.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { EmailService } from '../../src/email/email.service';
import { ReminderScanService } from '../../src/notifications/reminder-scan.service';

const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const SERVER_ID = '20000000-0000-0000-0000-000000000099';

const OWNER_ID = 'reminder-owner';
const MEMBER_NO_STATUS_ID = 'reminder-member-nostatus'; // (a): no status row → reminded
const MEMBER_DONE_ID = 'reminder-member-done'; // (b): state='done' → not reminded
const MEMBER_TODO_ID = 'reminder-member-todo'; // extra: state='todo' → reminded

// ---------------------------------------------------------------------------
// Fixture helpers for assignments + statuses
// ---------------------------------------------------------------------------

async function insertAssignment(
  id: string,
  serverId: string,
  organizerId: string,
  title: string,
  dueDate: Date,
  isDeleted = false,
): Promise<void> {
  await harnessQuery(
    `INSERT INTO assignments (id, server_id, organizer_id, title, due_date, is_deleted)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT DO NOTHING`,
    [id, serverId, organizerId, title, dueDate.toISOString(), isDeleted],
  );
}

async function insertAssignmentStatus(
  assignmentId: string,
  userId: string,
  state: 'todo' | 'done',
): Promise<void> {
  await harnessQuery(
    `INSERT INTO assignment_status (assignment_id, user_id, state)
     VALUES ($1, $2, $3)
     ON CONFLICT (assignment_id, user_id) DO UPDATE SET state = $3`,
    [assignmentId, userId, state],
  );
}

async function countReminderRows(assignmentId: string): Promise<number> {
  const rows = await harnessQuery<{ count: string }>(
    'SELECT count(*)::text AS count FROM assignment_reminder WHERE assignment_id = $1',
    [assignmentId],
  );
  return Number.parseInt(rows[0]?.count ?? '0', 10);
}

async function reminderExistsForUser(assignmentId: string, userId: string): Promise<boolean> {
  const rows = await harnessQuery<{ id: string }>(
    'SELECT id FROM assignment_reminder WHERE assignment_id = $1 AND user_id = $2',
    [assignmentId, userId],
  );
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Helpers for due dates
// ---------------------------------------------------------------------------

function hoursFromNow(hours: number): Date {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)(
  'ReminderScanService.scanAndSendReminders — real-Postgres (wave-30 B-2, Refs 4a4c2715)',
  () => {
    let emailService: EmailService;
    let sut: ReminderScanService;
    // Track sendAssignmentReminder calls with fully-typed capture array
    let reminderCalls: Array<{
      to: string;
      opts: { assignmentTitle: string; dueDate: Date; serverName: string };
    }>;

    beforeAll(async () => {
      await setupHarness();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();
      reminderCalls = [];

      // Seed: owner + members + server
      await insertFixtureUser(OWNER_ID, 'reminder-owner@test.local');
      await insertFixtureUser(MEMBER_NO_STATUS_ID, 'reminder-nostatus@test.local');
      await insertFixtureUser(MEMBER_DONE_ID, 'reminder-done@test.local');
      await insertFixtureUser(MEMBER_TODO_ID, 'reminder-todo@test.local');

      await insertFixtureServer(SERVER_ID, OWNER_ID, 'Reminder Test Server');

      await insertFixtureMembership(SERVER_ID, OWNER_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_NO_STATUS_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_DONE_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_TODO_ID);

      // Wire EmailService with a manual capture replacement (avoids vi.spyOn generic variance)
      process.env.RESEND_API_KEY_AUTH = undefined;
      emailService = new EmailService();
      emailService.sendAssignmentReminder = async (
        to: string,
        opts: { assignmentTitle: string; dueDate: Date; serverName: string },
      ) => {
        reminderCalls.push({ to, opts });
      };
      sut = new ReminderScanService(emailService);
    });

    // -----------------------------------------------------------------------
    // (a) Member with NO assignment_status row IS reminded (LEFT-JOIN correctness)
    // -----------------------------------------------------------------------
    it('(a) member with no assignment_status row is reminded — LEFT-JOIN correctness', async () => {
      const ASSIGNMENT_ID = '10000000-0000-0000-0000-000000000001';
      await insertAssignment(
        ASSIGNMENT_ID,
        SERVER_ID,
        OWNER_ID,
        'Chapter 5 Essay',
        hoursFromNow(12),
      );
      // MEMBER_NO_STATUS_ID intentionally has no assignment_status row

      await sut.scanAndSendReminders();

      // assignment_reminder row must exist for MEMBER_NO_STATUS_ID
      expect(await reminderExistsForUser(ASSIGNMENT_ID, MEMBER_NO_STATUS_ID)).toBe(true);
      // email capture must include the member's email
      const callEmails = reminderCalls.map((c) => c.to);
      expect(callEmails).toContain('reminder-nostatus@test.local');
    });

    // -----------------------------------------------------------------------
    // (b) Member who marked the assignment 'done' is NOT reminded
    // -----------------------------------------------------------------------
    it('(b) member with state=done is NOT reminded', async () => {
      const ASSIGNMENT_ID = '10000000-0000-0000-0000-000000000002';
      await insertAssignment(ASSIGNMENT_ID, SERVER_ID, OWNER_ID, 'Problem Set 3', hoursFromNow(12));
      await insertAssignmentStatus(ASSIGNMENT_ID, MEMBER_DONE_ID, 'done');

      await sut.scanAndSendReminders();

      // No reminder row for the 'done' member
      expect(await reminderExistsForUser(ASSIGNMENT_ID, MEMBER_DONE_ID)).toBe(false);
      // email capture must NOT include the done member's email
      const callEmails = reminderCalls.map((c) => c.to);
      expect(callEmails).not.toContain('reminder-done@test.local');
    });

    // -----------------------------------------------------------------------
    // (c) Send-once: second scan inserts 0 new rows + sends 0 new emails
    // -----------------------------------------------------------------------
    it('(c) send-once: second scan inserts 0 new reminder rows and sends 0 new emails', async () => {
      const ASSIGNMENT_ID = '10000000-0000-0000-0000-000000000003';
      await insertAssignment(ASSIGNMENT_ID, SERVER_ID, OWNER_ID, 'Final Project', hoursFromNow(12));

      // First scan
      await sut.scanAndSendReminders();
      const rowsAfterFirst = await countReminderRows(ASSIGNMENT_ID);
      const callsAfterFirst = reminderCalls.length;

      expect(rowsAfterFirst).toBeGreaterThan(0);
      expect(callsAfterFirst).toBeGreaterThan(0);

      // Second scan
      await sut.scanAndSendReminders();
      const rowsAfterSecond = await countReminderRows(ASSIGNMENT_ID);
      const callsAfterSecond = reminderCalls.length;

      // No new rows inserted on the second tick
      expect(rowsAfterSecond).toBe(rowsAfterFirst);
      // No new email calls on the second tick
      expect(callsAfterSecond).toBe(callsAfterFirst);
    });

    // -----------------------------------------------------------------------
    // (d) Assignment due in the PAST is NOT reminded (E2 past-due guard)
    // -----------------------------------------------------------------------
    it('(d) past-due assignment (due_date < now) is NOT reminded — E2 guard', async () => {
      const ASSIGNMENT_ID = '10000000-0000-0000-0000-000000000004';
      await insertAssignment(
        ASSIGNMENT_ID,
        SERVER_ID,
        OWNER_ID,
        'Overdue Essay',
        hoursAgo(1), // due 1 hour ago
      );

      await sut.scanAndSendReminders();

      expect(await countReminderRows(ASSIGNMENT_ID)).toBe(0);
      expect(reminderCalls).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // (e) Assignment due > 24h out is NOT reminded (out of window)
    // -----------------------------------------------------------------------
    it('(e) assignment due > 24h out is NOT reminded (outside window)', async () => {
      const ASSIGNMENT_ID = '10000000-0000-0000-0000-000000000005';
      await insertAssignment(
        ASSIGNMENT_ID,
        SERVER_ID,
        OWNER_ID,
        'Far-future Exam',
        hoursFromNow(48), // 48 hours from now — outside the 24h window
      );

      await sut.scanAndSendReminders();

      expect(await countReminderRows(ASSIGNMENT_ID)).toBe(0);
      expect(reminderCalls).toHaveLength(0);
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe('ReminderScanService.scanAndSendReminders — real-Postgres (wave-30 B-2)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
