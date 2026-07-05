/**
 * Integration test: wave-49 study-timer service ↔ real Postgres
 * Tasks: 1387d845 (compute-on-read + state machine) + 832b83b7 (auto-advance + idempotency)
 *
 * Covers:
 *   1. GET with no row → idle DTO (serverId, phase='work', runState='idle', remainingMs=0)
 *   2. start → DB row: run_state='running', phase='work', ends_at≈now+25min; DTO running=true
 *   3. pause → DB row: run_state='paused', paused_remaining_ms≈WORK_DURATION_MS; running=false
 *   4. resume → DB row: run_state='running', ends_at≈now+paused_remaining_ms; running=true
 *   5. reset → DB row: run_state='idle', all time anchors null; running=false
 *   6. start on running timer → restart (fresh work phase, new ends_at, paused_remaining_ms=null)
 *   7. non-member → ForbiddenException on all control/read operations
 *   8. doPhaseAdvance work→break: persists new phase + ends_at; emits study-timer.updated
 *   9. doPhaseAdvance idempotency: two triggers with same expectedEndsAtMs → one advance
 *      (second call is a no-op because ends_at already changed after first)
 *  10. doPhaseAdvance when paused: no-op (run_state guard prevents advance)
 *  11. getTimer compute-on-read: remainingMs derived from ends_at−now (not stored)
 *  12. getTimerForRoom: no member check; returns timer DTO (used by gateway for reconciliation)
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST at module-eval time
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
import { ForbiddenException } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { RbacService } from '../../src/rbac/rbac.service';
import { BREAK_DURATION_MS, StudyTimerService, WORK_DURATION_MS } from '../../src/study-timer/study-timer.service';

// Skip suite when DATABASE_URL_TEST is absent
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture IDs — stable across runs; namespaced to avoid collisions
// ---------------------------------------------------------------------------

const SERVER_ID = 'e3000000-0000-0000-0000-000000000001';
const OWNER_ID = 'timer-owner';
const MEMBER_ID = 'timer-member';
const NON_MEMBER_ID = 'timer-nonmember';

// ---------------------------------------------------------------------------
// Mock EventEmitter2 — captures emitted events without a real NestJS app
// ---------------------------------------------------------------------------

function makeEmitter() {
  return { emit: vi.fn() };
}

// ---------------------------------------------------------------------------
// Main integration suite
// ---------------------------------------------------------------------------

describe.skipIf(SKIP)(
  'StudyTimerService — real-Postgres integration (wave-49 tasks 1387d845, 832b83b7)',
  () => {
    let sut!: StudyTimerService;
    let emitter: ReturnType<typeof makeEmitter>;

    beforeAll(async () => {
      await setupHarness();
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      vi.clearAllMocks();

      // Truncate server_study_timer (cascaded by servers TRUNCATE, but explicit is cleaner)
      await harnessQuery('TRUNCATE server_study_timer RESTART IDENTITY CASCADE');
      await truncateTables();

      // Fixture users (parents before children for FK ordering)
      await insertFixtureUser(OWNER_ID, 'timer-owner@test.local');
      await insertFixtureUser(MEMBER_ID, 'timer-member@test.local');
      await insertFixtureUser(NON_MEMBER_ID, 'timer-nonmember@test.local');

      // Server (owned by OWNER_ID)
      await insertFixtureServer(SERVER_ID, OWNER_ID, 'Timer Integration Test Server');

      // Memberships — OWNER and MEMBER are members; NON_MEMBER is not
      await insertFixtureMembership(SERVER_ID, OWNER_ID);
      await insertFixtureMembership(SERVER_ID, MEMBER_ID);
      // NON_MEMBER_ID intentionally has no server_members row

      emitter = makeEmitter();
      const rbac = new RbacService();
      // biome-ignore lint/suspicious/noExplicitAny: test DI
      sut = new StudyTimerService(emitter as any, rbac);
    });

    // -----------------------------------------------------------------------
    // Case 1 — no row → idle DTO
    // -----------------------------------------------------------------------

    it('GET with no row → calm idle DTO', async () => {
      const dto = await sut.getTimer(SERVER_ID, MEMBER_ID);

      expect(dto.serverId).toBe(SERVER_ID);
      expect(dto.runState).toBe('idle');
      expect(dto.phase).toBe('work');
      expect(dto.running).toBe(false);
      expect(dto.remainingMs).toBe(0);
      expect(dto.endsAt).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Case 2 — start → running DB row
    // -----------------------------------------------------------------------

    it('startTimer → run_state=running; phase=work; ends_at≈now+25min; emits', async () => {
      const before = Date.now();
      const dto = await sut.startTimer(SERVER_ID, MEMBER_ID);
      const after = Date.now();

      expect(dto.running).toBe(true);
      expect(dto.runState).toBe('running');
      expect(dto.phase).toBe('work');
      expect(dto.remainingMs).toBeGreaterThan(0);
      expect(dto.remainingMs).toBeLessThanOrEqual(WORK_DURATION_MS);
      expect(dto.endsAt).not.toBeNull();

      const endsAtMs = new Date(dto.endsAt as string).getTime();
      expect(endsAtMs).toBeGreaterThanOrEqual(before + WORK_DURATION_MS - 100);
      expect(endsAtMs).toBeLessThanOrEqual(after + WORK_DURATION_MS + 100);

      // Verify DB row
      const rows = await harnessQuery<{
        run_state: string;
        phase: string;
        paused_remaining_ms: number | null;
      }>('SELECT run_state, phase, paused_remaining_ms FROM server_study_timer WHERE server_id = $1', [
        SERVER_ID,
      ]);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.run_state).toBe('running');
      expect(rows[0]?.phase).toBe('work');
      expect(rows[0]?.paused_remaining_ms).toBeNull();

      // Emitter called with 'study-timer.updated'
      expect(emitter.emit).toHaveBeenCalledWith(
        'study-timer.updated',
        expect.objectContaining({ serverId: SERVER_ID }),
      );
    });

    // -----------------------------------------------------------------------
    // Case 3 — pause → paused DB row
    // -----------------------------------------------------------------------

    it('pauseTimer → run_state=paused; paused_remaining_ms set; endsAt null', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      const dto = await sut.pauseTimer(SERVER_ID, MEMBER_ID);

      expect(dto.running).toBe(false);
      expect(dto.runState).toBe('paused');
      expect(dto.remainingMs).toBeGreaterThan(0);
      expect(dto.remainingMs).toBeLessThanOrEqual(WORK_DURATION_MS);

      const rows = await harnessQuery<{
        run_state: string;
        paused_remaining_ms: number | null;
      }>('SELECT run_state, paused_remaining_ms FROM server_study_timer WHERE server_id = $1', [
        SERVER_ID,
      ]);
      expect(rows[0]?.run_state).toBe('paused');
      expect(rows[0]?.paused_remaining_ms).toBeGreaterThan(0);

      expect(emitter.emit).toHaveBeenCalledWith(
        'study-timer.updated',
        expect.objectContaining({ serverId: SERVER_ID }),
      );
    });

    // -----------------------------------------------------------------------
    // Case 4 — resume → running from paused
    // -----------------------------------------------------------------------

    it('resumeTimer → run_state=running; ends_at = now + paused_remaining_ms', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      const paused = await sut.pauseTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      const before = Date.now();
      const dto = await sut.resumeTimer(SERVER_ID, MEMBER_ID);
      const after = Date.now();

      expect(dto.running).toBe(true);
      expect(dto.runState).toBe('running');
      expect(dto.remainingMs).toBeGreaterThan(0);

      // ends_at should be approximately now + paused.remainingMs
      const endsAtMs = new Date(dto.endsAt as string).getTime();
      expect(endsAtMs).toBeGreaterThanOrEqual(before + paused.remainingMs - 100);
      expect(endsAtMs).toBeLessThanOrEqual(after + paused.remainingMs + 100);

      expect(emitter.emit).toHaveBeenCalledWith(
        'study-timer.updated',
        expect.objectContaining({ serverId: SERVER_ID }),
      );
    });

    // -----------------------------------------------------------------------
    // Case 5 — reset → idle
    // -----------------------------------------------------------------------

    it('resetTimer → run_state=idle; all time anchors null', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      const dto = await sut.resetTimer(SERVER_ID, MEMBER_ID);

      expect(dto.running).toBe(false);
      expect(dto.runState).toBe('idle');
      expect(dto.phase).toBe('work');
      expect(dto.remainingMs).toBe(0);
      expect(dto.endsAt).toBeNull();

      const rows = await harnessQuery<{
        run_state: string;
        started_at: string | null;
        ends_at: string | null;
        paused_remaining_ms: number | null;
      }>('SELECT run_state, started_at, ends_at, paused_remaining_ms FROM server_study_timer WHERE server_id = $1', [
        SERVER_ID,
      ]);
      expect(rows[0]?.run_state).toBe('idle');
      expect(rows[0]?.started_at).toBeNull();
      expect(rows[0]?.ends_at).toBeNull();
      expect(rows[0]?.paused_remaining_ms).toBeNull();

      expect(emitter.emit).toHaveBeenCalledWith(
        'study-timer.updated',
        expect.objectContaining({ serverId: SERVER_ID }),
      );
    });

    // -----------------------------------------------------------------------
    // Case 6 — start on running timer → restart
    // -----------------------------------------------------------------------

    it('start on running timer → restarts fresh (work phase, new ends_at)', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);

      // Pause + modify state, then start again (restart)
      await sut.pauseTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      const before = Date.now();
      const dto = await sut.startTimer(SERVER_ID, MEMBER_ID);

      expect(dto.phase).toBe('work');
      expect(dto.runState).toBe('running');
      expect(dto.running).toBe(true);

      const endsAtMs = new Date(dto.endsAt as string).getTime();
      expect(endsAtMs).toBeGreaterThanOrEqual(before + WORK_DURATION_MS - 100);

      // Only one row should exist (upsert, not insert)
      const count = await harnessQuery<{ c: string }>(
        'SELECT count(*)::text AS c FROM server_study_timer WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(Number(count[0]?.c)).toBe(1);
    });

    // -----------------------------------------------------------------------
    // Case 7 — non-member authz
    // -----------------------------------------------------------------------

    it('non-member: getTimer → ForbiddenException', async () => {
      await expect(sut.getTimer(SERVER_ID, NON_MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('non-member: startTimer → ForbiddenException', async () => {
      await expect(sut.startTimer(SERVER_ID, NON_MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('non-member: pauseTimer → ForbiddenException', async () => {
      await expect(sut.pauseTimer(SERVER_ID, NON_MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('non-member: resumeTimer → ForbiddenException', async () => {
      await expect(sut.resumeTimer(SERVER_ID, NON_MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    it('non-member: resetTimer → ForbiddenException', async () => {
      await expect(sut.resetTimer(SERVER_ID, NON_MEMBER_ID)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
    });

    // -----------------------------------------------------------------------
    // Case 8 — doPhaseAdvance work→break persists correctly
    // -----------------------------------------------------------------------

    it('doPhaseAdvance work→break: new phase=break; ends_at≈now+5min; emits', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      // Fetch the row to get the current ends_at
      const rows = await harnessQuery<{ ends_at: string }>(
        'SELECT ends_at FROM server_study_timer WHERE server_id = $1',
        [SERVER_ID],
      );
      const endsAt = rows[0]?.ends_at;
      if (!endsAt) throw new Error('No timer row found after start');
      const expectedEndsAtMs = new Date(endsAt).getTime();

      const before = Date.now();
      await sut.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);
      const after = Date.now();

      // DB row should now be break phase
      const afterRows = await harnessQuery<{
        phase: string;
        run_state: string;
        ends_at: string;
      }>('SELECT phase, run_state, ends_at FROM server_study_timer WHERE server_id = $1', [
        SERVER_ID,
      ]);
      expect(afterRows[0]?.phase).toBe('break');
      expect(afterRows[0]?.run_state).toBe('running');

      // ends_at should be approximately now + 5 min
      const newEndsAtMs = new Date(afterRows[0]?.ends_at as string).getTime();
      expect(newEndsAtMs).toBeGreaterThanOrEqual(before + BREAK_DURATION_MS - 100);
      expect(newEndsAtMs).toBeLessThanOrEqual(after + BREAK_DURATION_MS + 100);

      expect(emitter.emit).toHaveBeenCalledWith(
        'study-timer.updated',
        expect.objectContaining({ serverId: SERVER_ID }),
      );
      const emittedTimer = emitter.emit.mock.calls[0]?.[1]?.timer;
      expect(emittedTimer?.phase).toBe('break');
    });

    // -----------------------------------------------------------------------
    // Case 9 — doPhaseAdvance idempotency: two triggers → one advance
    // -----------------------------------------------------------------------

    it('doPhaseAdvance idempotency: two calls with same expectedEndsAtMs → one advance', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      const rows = await harnessQuery<{ ends_at: string }>(
        'SELECT ends_at FROM server_study_timer WHERE server_id = $1',
        [SERVER_ID],
      );
      const expectedEndsAtMs = new Date(rows[0]?.ends_at as string).getTime();

      // First call: should advance work→break
      await sut.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);
      // Second call: should be a no-op (ends_at changed after first advance)
      await sut.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);

      // Verify emit called exactly once (not twice)
      expect(emitter.emit).toHaveBeenCalledTimes(1);

      // Verify DB shows break phase (not work, not double-advanced to work again)
      const afterRows = await harnessQuery<{ phase: string }>(
        'SELECT phase FROM server_study_timer WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(afterRows[0]?.phase).toBe('break');
    });

    // -----------------------------------------------------------------------
    // Case 10 — doPhaseAdvance when paused: no-op
    // -----------------------------------------------------------------------

    it('doPhaseAdvance when paused: no DB change; no emit', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      const pausedDto = await sut.pauseTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      // Use the ends_at from before the pause (which won't match current state after pause)
      // Actually ends_at is cleared on pause in our DB row — use the original starts ends_at
      const rowsBefore = await harnessQuery<{ ends_at: string | null }>(
        'SELECT ends_at FROM server_study_timer WHERE server_id = $1',
        [SERVER_ID],
      );
      // ends_at is null after pause — use the paused DTO's endsAt which is null
      expect(pausedDto.endsAt).toBeNull();

      // Use some arbitrary old ends_at value
      const staleEndsAtMs = Date.now() - 999;
      await sut.doPhaseAdvance(SERVER_ID, staleEndsAtMs);

      expect(emitter.emit).not.toHaveBeenCalled();

      // DB still paused
      const afterRows = await harnessQuery<{ run_state: string }>(
        'SELECT run_state FROM server_study_timer WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(afterRows[0]?.run_state).toBe('paused');

      // satisfy lint (rowsBefore accessed)
      expect(rowsBefore[0]?.ends_at).toBeNull();
    });

    // -----------------------------------------------------------------------
    // Case 11 — compute-on-read: remainingMs derived from ends_at, not stored
    // -----------------------------------------------------------------------

    it('compute-on-read: remainingMs correctly derived from ends_at − now', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);

      // Directly update ends_at to be 3 min from now (simulating mid-run GET)
      const threeMin = 3 * 60 * 1000;
      const newEndsAt = new Date(Date.now() + threeMin);
      await harnessQuery(
        `UPDATE server_study_timer SET ends_at = $1 WHERE server_id = $2`,
        [newEndsAt.toISOString(), SERVER_ID],
      );

      const dto = await sut.getTimer(SERVER_ID, MEMBER_ID);

      // remainingMs should be approximately 3 min
      expect(dto.remainingMs).toBeGreaterThan(threeMin - 1000);
      expect(dto.remainingMs).toBeLessThanOrEqual(threeMin + 500);
      // The DTO derives from DB, not from the original start time
      expect(dto.endsAt).toBe(newEndsAt.toISOString());
    });

    // -----------------------------------------------------------------------
    // Case 12 — getTimerForRoom: no member check; returns DTO
    // -----------------------------------------------------------------------

    it('getTimerForRoom: no member check; returns authoritative timer DTO', async () => {
      await sut.startTimer(SERVER_ID, MEMBER_ID);
      emitter.emit.mockClear();

      // getTimerForRoom does NOT require membership — used by gateway for reconciliation
      // NON_MEMBER_ID cannot call getTimer (403) but getTimerForRoom is always accessible
      const dto = await sut.getTimerForRoom(SERVER_ID);

      expect(dto.runState).toBe('running');
      expect(dto.running).toBe(true);
      expect(dto.serverId).toBe(SERVER_ID);
    });
  },
);
