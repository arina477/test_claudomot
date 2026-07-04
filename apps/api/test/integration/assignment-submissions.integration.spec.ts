/**
 * Integration test: wave-42 assignment collect/return lifecycle — real-Postgres.
 *
 * Covers acceptance criteria for tasks db8e082a + 1746f72a + b859984b:
 *   1. submit happy path: text submission → 200; row in assignment_submissions;
 *      mySubmission appears on GET /assignments/:id (via service.getAssignment)
 *   2. idempotent resubmit: same member submits again → updates in place (no duplicate;
 *      UNIQUE(assignment_id,user_id)); updated text reflected
 *   3. resubmit clears return: organizer returns submission → member resubmits
 *      → returned_at + organizer_comment CLEARED
 *   4. submit empty → 400: neither text nor attachment → BadRequestException
 *   5. non-member submit → 403: ForbiddenException (IDOR-safe; serverId derived from row)
 *   6. roster organizer-only: GET /assignments/:id/submissions → submissions + submitter
 *      identity; plain member → 403; empty assignment → 200 empty list
 *   7. return organizer-only + cross-assignment guard: organizer returns → returned_at set;
 *      wrong assignment path → BadRequestException; non-organizer return → 403
 *   8. no grading: AssignmentSubmission DTO carries no grade/score field
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
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import type { AssignmentSubmission, AssignmentSubmissionRosterRow } from '@studyhall/shared';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AssignmentsService } from '../../src/assignments/assignments.service';
import { FilesService } from '../../src/files/files.service';
import { RbacService } from '../../src/rbac/rbac.service';

// Skip-with-reason when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture UUIDs — stable across runs; namespaced to avoid collisions with
// other specs that share the same database.
// ---------------------------------------------------------------------------

const SERVER_ID = 'a1000000-0000-0000-0000-000000000001';
const SERVER_B_ID = 'a1000000-0000-0000-0000-000000000002'; // cross-assignment guard

const ROLE_ORGANIZER_ID = 'c1000000-0000-0000-0000-000000000001';

const OWNER_ID = 'asgn-sub-owner';
const ORGANIZER_ID = 'asgn-sub-organizer';
const MEMBER_ID = 'asgn-sub-member';
const MEMBER_B_ID = 'asgn-sub-member-b';
const NON_MEMBER_ID = 'asgn-sub-nonmember';

// Assignment IDs (uuid)
const ASSIGNMENT_ID = 'e1000000-0000-0000-0000-000000000001';
const ASSIGNMENT_B_ID = 'e1000000-0000-0000-0000-000000000002'; // cross-assignment guard

// ---------------------------------------------------------------------------
// Local fixture helpers — assignments + submissions (raw SQL via harnessQuery)
// ---------------------------------------------------------------------------

async function insertAssignment(
  id: string,
  serverId: string,
  organizerId: string,
  title: string,
): Promise<void> {
  const due = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days out
  await harnessQuery(
    `INSERT INTO assignments (id, server_id, organizer_id, title, due_date, is_deleted)
     VALUES ($1, $2, $3, $4, $5, false)
     ON CONFLICT DO NOTHING`,
    [id, serverId, organizerId, title, due],
  );
}

/**
 * Raw-insert a submission row, bypassing the service.
 * Used to set up returned_at / organizer_comment state for the "resubmit clears
 * return" case without going through the service's S3 attachment path.
 */
async function insertSubmissionRow(
  assignmentId: string,
  userId: string,
  text: string,
  returnedAt: Date | null = null,
  organizerComment: string | null = null,
): Promise<string> {
  const rows = await harnessQuery<{ id: string }>(
    `INSERT INTO assignment_submissions
       (assignment_id, user_id, text, returned_at, organizer_comment)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (assignment_id, user_id) DO UPDATE
       SET text = $3, returned_at = $4, organizer_comment = $5,
           updated_at = now()
     RETURNING id`,
    [assignmentId, userId, text, returnedAt?.toISOString() ?? null, organizerComment],
  );
  const row = rows[0];
  if (!row) throw new Error('insertSubmissionRow: no row returned');
  return row.id;
}

// ---------------------------------------------------------------------------
// Main integration suite
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)(
  'AssignmentsService — assignment-submissions collect/return lifecycle (wave-42 tasks db8e082a + 1746f72a + b859984b)',
  () => {
    let rbacService!: RbacService;
    let filesService!: FilesService;
    let sut!: AssignmentsService;

    beforeAll(async () => {
      await setupHarness();
      rbacService = new RbacService();
      filesService = new FilesService();
      sut = new AssignmentsService(rbacService, filesService);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();

      // Users (parents must precede children for FK ordering)
      await insertFixtureUser(OWNER_ID, 'asgn-sub-owner@test.local');
      await insertFixtureUser(ORGANIZER_ID, 'asgn-sub-organizer@test.local');
      await insertFixtureUser(MEMBER_ID, 'asgn-sub-member@test.local');
      await insertFixtureUser(MEMBER_B_ID, 'asgn-sub-member-b@test.local');
      await insertFixtureUser(NON_MEMBER_ID, 'asgn-sub-nonmember@test.local');

      // Servers
      await insertFixtureServer(SERVER_ID, OWNER_ID, 'Submissions Test Server');
      await insertFixtureServer(SERVER_B_ID, OWNER_ID, 'Cross-Assignment Guard Server');

      // Role: manage_assignments=true (organizer)
      await insertFixtureRole(ROLE_ORGANIZER_ID, SERVER_ID, 'Organizer', {
        manage_assignments: true,
      });

      // Memberships
      await insertFixtureMembership(SERVER_ID, OWNER_ID); // owner (superuser path)
      await insertFixtureMembership(SERVER_ID, ORGANIZER_ID, ROLE_ORGANIZER_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_ID); // plain member, no role
      await insertFixtureMembership(SERVER_ID, MEMBER_B_ID); // plain member, no role
      // NON_MEMBER_ID intentionally has no server_members row

      // Primary assignment
      await insertAssignment(ASSIGNMENT_ID, SERVER_ID, ORGANIZER_ID, 'Essay Due');
    });

    // -----------------------------------------------------------------------
    // Case 1 — submit happy path (text-only)
    // -----------------------------------------------------------------------

    it('submit happy path: member submits text → returns submission DTO; row in DB; mySubmission in getAssignment', async () => {
      // Arrange: MEMBER_ID is a server member; text-only submission (no attachment)
      // Act
      const result = await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, {
        text: 'My first submission',
      });

      // Assert — returned DTO shape
      expect(result.assignmentId).toBe(ASSIGNMENT_ID);
      expect(result.userId).toBe(MEMBER_ID);
      expect(result.text).toBe('My first submission');
      expect(result.submittedAt).toBeTruthy();
      expect(result.returnedAt).toBeNull();
      expect(result.organizerComment).toBeNull();

      // Assert — DB row exists with correct assignment_id + user_id
      const rows = await harnessQuery<{
        assignment_id: string;
        user_id: string;
        text: string;
        returned_at: Date | null;
      }>(
        'SELECT assignment_id, user_id, text, returned_at FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2',
        [ASSIGNMENT_ID, MEMBER_ID],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.assignment_id).toBe(ASSIGNMENT_ID);
      expect(rows[0]?.user_id).toBe(MEMBER_ID);
      expect(rows[0]?.text).toBe('My first submission');
      expect(rows[0]?.returned_at).toBeNull();

      // Assert — mySubmission visible via getAssignment for the same member
      const assignment = await sut.getAssignment(ASSIGNMENT_ID, MEMBER_ID);
      expect(assignment.mySubmission).not.toBeNull();
      expect(assignment.mySubmission?.userId).toBe(MEMBER_ID);
      expect(assignment.mySubmission?.text).toBe('My first submission');
    });

    // -----------------------------------------------------------------------
    // Case 2 — idempotent resubmit
    // -----------------------------------------------------------------------

    it('idempotent resubmit: second submit updates text in place; no duplicate row in DB', async () => {
      // Arrange: first submit
      await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: 'draft' });

      // Act: resubmit with updated text
      const result = await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, {
        text: 'revised draft',
      });

      // Assert — DTO reflects updated text
      expect(result.text).toBe('revised draft');

      // Assert — still exactly ONE row in DB (no duplicate)
      const rows = await harnessQuery<{ text: string }>(
        'SELECT text FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2',
        [ASSIGNMENT_ID, MEMBER_ID],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.text).toBe('revised draft');
    });

    // -----------------------------------------------------------------------
    // Case 3 — resubmit clears return
    // -----------------------------------------------------------------------

    it('resubmit clears return: after organizer return, member resubmit clears returned_at + organizer_comment', async () => {
      // Arrange: insert a submission row that has already been returned
      const pastReturn = new Date(Date.now() - 60_000);
      await insertSubmissionRow(ASSIGNMENT_ID, MEMBER_ID, 'initial', pastReturn, 'Needs work');

      // Verify the returned state is present before resubmit
      const before = await harnessQuery<{ returned_at: Date | null; organizer_comment: string | null }>(
        'SELECT returned_at, organizer_comment FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2',
        [ASSIGNMENT_ID, MEMBER_ID],
      );
      expect(before[0]?.returned_at).not.toBeNull();
      expect(before[0]?.organizer_comment).toBe('Needs work');

      // Act: member resubmits
      const result = await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: 'revised' });

      // Assert — DTO has cleared return state
      expect(result.text).toBe('revised');
      expect(result.returnedAt).toBeNull();
      expect(result.organizerComment).toBeNull();

      // Assert — DB row reflects cleared return
      const after = await harnessQuery<{ returned_at: Date | null; organizer_comment: string | null }>(
        'SELECT returned_at, organizer_comment FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2',
        [ASSIGNMENT_ID, MEMBER_ID],
      );
      expect(after[0]?.returned_at).toBeNull();
      expect(after[0]?.organizer_comment).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Case 4 — submit empty → 400
    // -----------------------------------------------------------------------

    it('submit with neither text nor attachment → BadRequestException (400)', async () => {
      // Arrange: empty payload — mirrors Zod refine in SubmitAssignmentSchema
      await expect(
        sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: null }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('submit with empty string text and no attachment → BadRequestException (400)', async () => {
      await expect(
        sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: '' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    // -----------------------------------------------------------------------
    // Case 5 — non-member submit → 403 (IDOR-safe)
    // -----------------------------------------------------------------------

    it('non-member submit → ForbiddenException (403); serverId derived from assignment row, not client param', async () => {
      // NON_MEMBER_ID has no server_members row — assertMember must reject
      await expect(
        sut.submitAssignment(ASSIGNMENT_ID, NON_MEMBER_ID, { text: 'attacker payload' }),
      ).rejects.toBeInstanceOf(ForbiddenException);

      // Assert — no submission row was inserted (write was prevented)
      const rows = await harnessQuery<{ id: string }>(
        'SELECT id FROM assignment_submissions WHERE assignment_id = $1 AND user_id = $2',
        [ASSIGNMENT_ID, NON_MEMBER_ID],
      );
      expect(rows).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // Case 6 — roster: organizer-only GET /assignments/:id/submissions
    // -----------------------------------------------------------------------

    it('organizer can list submissions: returns rows with submitter identity', async () => {
      // Arrange: two members submit
      await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: 'member answer' });
      await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_B_ID, { text: 'member B answer' });

      // Act
      const roster = await sut.listSubmissions(ASSIGNMENT_ID, ORGANIZER_ID);

      // Assert — two rows returned, each with submitter profile
      expect(roster).toHaveLength(2);
      for (const row of roster) {
        expect(row.submitter).toBeDefined();
        expect(typeof row.submitter.userId).toBe('string');
        // No grade/score field on the roster row (case 8 guard — checked here too)
        expect((row as unknown as Record<string, unknown>)['grade']).toBeUndefined();
        expect((row as unknown as Record<string, unknown>)['score']).toBeUndefined();
      }
    });

    it('plain member cannot list submissions → ForbiddenException (403)', async () => {
      await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: 'answer' });

      await expect(
        sut.listSubmissions(ASSIGNMENT_ID, MEMBER_ID),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('organizer lists submissions for assignment with no submissions → 200 empty list', async () => {
      // No submissions inserted
      const roster = await sut.listSubmissions(ASSIGNMENT_ID, ORGANIZER_ID);
      expect(roster).toHaveLength(0);
    });

    // -----------------------------------------------------------------------
    // Case 7 — return: organizer-only + cross-assignment guard
    // -----------------------------------------------------------------------

    it('organizer return sets returned_at and stores comment', async () => {
      // Arrange: member submits first
      const submission = await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: 'answer' });
      const submissionId = submission.id;

      // Act
      const before = Date.now();
      const result = await sut.returnSubmission(ASSIGNMENT_ID, submissionId, ORGANIZER_ID, {
        comment: 'Good work!',
      });

      // Assert — returned DTO has returned_at set and comment stored
      expect(result.returnedAt).not.toBeNull();
      expect(new Date(result.returnedAt as string).getTime()).toBeGreaterThanOrEqual(before);
      expect(result.organizerComment).toBe('Good work!');

      // Assert — DB row reflects the return
      const rows = await harnessQuery<{ returned_at: Date | null; organizer_comment: string | null }>(
        'SELECT returned_at, organizer_comment FROM assignment_submissions WHERE id = $1',
        [submissionId],
      );
      expect(rows[0]?.returned_at).not.toBeNull();
      expect(rows[0]?.organizer_comment).toBe('Good work!');
    });

    it('cross-assignment guard: returning submissionId from a different assignment → BadRequestException', async () => {
      // Arrange: ASSIGNMENT_B_ID belongs to SERVER_B_ID (different server + owner has no role there)
      // To keep the test simple, insert a separate assignment on SERVER_ID with a different ID
      // and submit to that assignment, then try to return it via ASSIGNMENT_ID path.
      const ALT_ASSIGNMENT_ID = 'e1000000-0000-0000-0000-000000000003';
      await insertAssignment(ALT_ASSIGNMENT_ID, SERVER_ID, ORGANIZER_ID, 'Alt Assignment');

      // MEMBER_ID submits to the alt assignment
      const altSubmission = await sut.submitAssignment(ALT_ASSIGNMENT_ID, MEMBER_ID, {
        text: 'wrong assignment answer',
      });

      // Act: organizer tries to return altSubmission via ASSIGNMENT_ID path (mismatch)
      await expect(
        sut.returnSubmission(ASSIGNMENT_ID, altSubmission.id, ORGANIZER_ID, {}),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('non-organizer return → ForbiddenException (403)', async () => {
      // Arrange: member submits
      const submission = await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, { text: 'answer' });

      // Act: plain member (not organizer) tries to return
      await expect(
        sut.returnSubmission(ASSIGNMENT_ID, submission.id, MEMBER_B_ID, { comment: 'no perms' }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('return a non-existent submissionId → NotFoundException (404)', async () => {
      await expect(
        sut.returnSubmission(
          ASSIGNMENT_ID,
          'ffffffff-ffff-ffff-ffff-ffffffffffff',
          ORGANIZER_ID,
          {},
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    // -----------------------------------------------------------------------
    // Case 8 — no grading: AssignmentSubmission DTO must not carry grade/score
    // -----------------------------------------------------------------------

    it('no grading: submission DTO carries no grade or score field', async () => {
      // Act
      const result: AssignmentSubmission = await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_ID, {
        text: 'no grades please',
      });

      // Assert — the DTO type and runtime object both lack grade/score
      const asRecord = result as unknown as Record<string, unknown>;
      expect(asRecord['grade']).toBeUndefined();
      expect(asRecord['score']).toBeUndefined();
      expect(asRecord['gradeValue']).toBeUndefined();

      // Also verify the roster row (AssignmentSubmissionRosterRow) lacks grade/score
      await sut.submitAssignment(ASSIGNMENT_ID, MEMBER_B_ID, { text: 'also no grades' });
      const roster = await sut.listSubmissions(ASSIGNMENT_ID, ORGANIZER_ID);
      for (const row of roster) {
        const rosterRecord = row as unknown as Record<string, unknown>;
        expect(rosterRecord['grade']).toBeUndefined();
        expect(rosterRecord['score']).toBeUndefined();
      }
    });
  },
);

// When DATABASE_URL_TEST is not set, emit a clear skip message (not a silent pass).
if (SKIP) {
  describe(
    'AssignmentsService — assignment-submissions collect/return lifecycle (wave-42 tasks db8e082a + 1746f72a + b859984b)',
    () => {
      it.skip(
        'SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally',
        () => {},
      );
    },
  );
}
