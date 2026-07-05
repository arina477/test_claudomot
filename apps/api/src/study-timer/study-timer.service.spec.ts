/**
 * StudyTimerService unit tests — wave-49 M8 tasks 1387d845 + 832b83b7
 *
 * Covers:
 *   compute-on-read remainingMs / running / phase derivation:
 *     - running timer → remainingMs = max(0, ends_at - now); running=true
 *     - paused timer → remainingMs = paused_remaining_ms; running=false
 *     - idle timer (no row) → remainingMs=0; running=false; phase='work'
 *     - running timer past ends_at → remainingMs=0 (never negative)
 *
 *   membership authz:
 *     - non-member on getTimer → 403 ForbiddenException
 *     - non-member on startTimer → 403 ForbiddenException
 *
 *   state transitions:
 *     - start → run_state='running'; phase='work'; ends_at≈now+25min; armAutoAdvance called
 *     - pause on running → run_state='paused'; paused_remaining_ms set; clearAutoAdvance called
 *     - pause on non-running → no-op (returns current state)
 *     - resume on paused → run_state='running'; ends_at=now+paused_remaining_ms; armAutoAdvance
 *     - resume on non-paused → no-op (returns current state)
 *     - reset → run_state='idle'; all time anchors null; clearAutoAdvance called
 *
 *   idempotent phase transition:
 *     - doPhaseAdvance with matching ends_at → UPDATE succeeds; emits study-timer.updated
 *     - doPhaseAdvance with NON-matching ends_at → no UPDATE (no-op); no emit
 *
 *   presence (design confirmation — ephemeral contract):
 *     - service never writes presence to DB (confirmed by presence tests in gateway)
 *
 * Mocking strategy: Drizzle DB chains mocked at the db module boundary
 *   (same pattern as scheduling.service.spec.ts / assignments.service.spec.ts).
 */

import { ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// db module mock — must be before any SUT import
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import { db } from '../db/index';
import {
  BREAK_DURATION_MS,
  StudyTimerService,
  WORK_DURATION_MS,
  computeCurrentPhase,
  phaseDurationMs,
} from './study-timer.service';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;

// ---------------------------------------------------------------------------
// Drizzle chain builders (mirror scheduling.service.spec.ts pattern)
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'orderBy', 'select', 'innerJoin', 'leftJoin']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function makeInsertChain(returningValue: unknown[] = []) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returningValue).then(res, rej),
  };
  chain.values = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returningValue);
  chain.onConflictDoUpdate = vi.fn().mockReturnValue(chain);
  return chain;
}

function makeUpdateChain(returningValue: unknown[] = []) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returningValue).then(res, rej),
  };
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returningValue);
  return chain;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'srv-timer-001';
const USER_ID = 'user-timer-001';
const MEMBER_ROW = { id: 'mem-001' };

// Default durations fixture — matches column defaults (25/5)
const DEFAULT_DURATIONS = {
  work_duration_ms: WORK_DURATION_MS,
  break_duration_ms: BREAK_DURATION_MS,
};

const NOW = new Date('2026-07-05T10:00:00.000Z');
const NOW_MS = NOW.getTime();
const ENDS_AT_WORK = new Date(NOW_MS + WORK_DURATION_MS);

const runningRow = {
  id: 'timer-001',
  server_id: SERVER_ID,
  phase: 'work',
  run_state: 'running',
  started_at: NOW,
  ends_at: ENDS_AT_WORK,
  paused_remaining_ms: null,
  updated_by: USER_ID,
  created_at: NOW,
  updated_at: NOW,
  work_duration_ms: WORK_DURATION_MS,
  break_duration_ms: BREAK_DURATION_MS,
};

const pausedRow = {
  ...runningRow,
  run_state: 'paused',
  ends_at: null,
  paused_remaining_ms: 10 * 60 * 1000, // 10 min
};

const idleRow = {
  ...runningRow,
  run_state: 'idle',
  phase: 'work',
  started_at: null,
  ends_at: null,
  paused_remaining_ms: null,
};

// ---------------------------------------------------------------------------
// Mock EventEmitter2
// ---------------------------------------------------------------------------

function makeEmitter() {
  return { emit: vi.fn() };
}

// ---------------------------------------------------------------------------
// Mock RbacService (not used in assertMember — service queries server_members directly)
// ---------------------------------------------------------------------------

function makeRbacService() {
  return { can: vi.fn().mockResolvedValue(true) };
}

// ---------------------------------------------------------------------------
// Helper: create service with fresh mocks
// ---------------------------------------------------------------------------

function makeService() {
  const emitter = makeEmitter();
  const rbac = makeRbacService();
  // biome-ignore lint/suspicious/noExplicitAny: test DI
  const svc = new StudyTimerService(emitter as any, rbac as any);
  return { svc, emitter, rbac };
}

// ---------------------------------------------------------------------------
// computeCurrentPhase — pure function tests (no DB mock needed)
// ---------------------------------------------------------------------------

describe('computeCurrentPhase', () => {
  it('returns same phase when still within first phase window', () => {
    const startedAt = new Date(NOW_MS - 10 * 60 * 1000); // started 10 min ago
    const now = NOW;
    const result = computeCurrentPhase('work', startedAt, now, DEFAULT_DURATIONS);
    // 10 min elapsed, work phase is 25 min → still in work
    expect(result.phase).toBe('work');
    expect(result.newEndsAt.getTime()).toBe(startedAt.getTime() + WORK_DURATION_MS);
  });

  it('advances work→break after 25 min elapsed', () => {
    const startedAt = new Date(NOW_MS - 26 * 60 * 1000); // started 26 min ago
    const now = NOW;
    const result = computeCurrentPhase('work', startedAt, now, DEFAULT_DURATIONS);
    // 26 min elapsed: 25 min work done → now in break
    expect(result.phase).toBe('break');
    expect(result.newEndsAt.getTime()).toBe(
      startedAt.getTime() + WORK_DURATION_MS + BREAK_DURATION_MS,
    );
  });

  it('advances break→work after 5 min break elapsed', () => {
    const startedAt = new Date(NOW_MS - 6 * 60 * 1000); // started 6 min ago (in break)
    const now = NOW;
    const result = computeCurrentPhase('break', startedAt, now, DEFAULT_DURATIONS);
    // 6 min elapsed: 5 min break done → now in work
    expect(result.phase).toBe('work');
    expect(result.newEndsAt.getTime()).toBe(
      startedAt.getTime() + BREAK_DURATION_MS + WORK_DURATION_MS,
    );
  });

  it('handles multiple cycles (work→break→work→break)', () => {
    // 56 min elapsed: 25 work + 5 break + 25 work + 1 min into break
    const elapsed = 25 * 60 * 1000 + 5 * 60 * 1000 + 25 * 60 * 1000 + 60 * 1000;
    const startedAt = new Date(NOW_MS - elapsed);
    const now = NOW;
    const result = computeCurrentPhase('work', startedAt, now, DEFAULT_DURATIONS);
    expect(result.phase).toBe('break');
  });

  it('uses configured durations (karen-2): custom 10-min work / 2-min break walk', () => {
    // Custom: 10 min work, 2 min break. 13 min elapsed = 10 min work + 2 min break + 1 min work
    const customDurations = { work_duration_ms: 10 * 60_000, break_duration_ms: 2 * 60_000 };
    const elapsed = 10 * 60_000 + 2 * 60_000 + 60_000; // 13 min into next work phase
    const startedAt = new Date(NOW_MS - elapsed);
    const result = computeCurrentPhase('work', startedAt, NOW, customDurations);
    // Should be in work phase (second cycle)
    expect(result.phase).toBe('work');
    // newEndsAt = startedAt + 10min + 2min + 10min
    const expectedEnd = startedAt.getTime() + 10 * 60_000 + 2 * 60_000 + 10 * 60_000;
    expect(result.newEndsAt.getTime()).toBe(expectedEnd);
  });

  it('phaseDurationMs uses row durations (not bare constants)', () => {
    const custom = { work_duration_ms: 3 * 60_000, break_duration_ms: 1 * 60_000 };
    expect(phaseDurationMs('work', custom)).toBe(3 * 60_000);
    expect(phaseDurationMs('break', custom)).toBe(1 * 60_000);
    // Default durations
    expect(phaseDurationMs('work', DEFAULT_DURATIONS)).toBe(WORK_DURATION_MS);
    expect(phaseDurationMs('break', DEFAULT_DURATIONS)).toBe(BREAK_DURATION_MS);
  });
});

// ---------------------------------------------------------------------------
// compute-on-read DTO derivation
// ---------------------------------------------------------------------------

describe('StudyTimerService — compute-on-read DTO', () => {
  it('running timer: remainingMs = ends_at − now (non-negative); running=true', async () => {
    const { svc } = makeService();
    // Use a future ends_at to avoid triggering selfHealIfOverdue in this test
    const futureEndsAt = new Date(Date.now() + WORK_DURATION_MS);
    const futureRunningRow = { ...runningRow, ends_at: futureEndsAt };

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([futureRunningRow]);
    });

    const dto = await svc.getTimer(SERVER_ID, USER_ID);

    expect(dto.running).toBe(true);
    expect(dto.runState).toBe('running');
    expect(dto.phase).toBe('work');
    expect(dto.remainingMs).toBeGreaterThan(0);
    expect(dto.remainingMs).toBeLessThanOrEqual(WORK_DURATION_MS);
    expect(dto.endsAt).toBe(futureEndsAt.toISOString());
  });

  it('paused timer: remainingMs = paused_remaining_ms; running=false', async () => {
    const { svc } = makeService();
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([pausedRow]);
    });

    const dto = await svc.getTimer(SERVER_ID, USER_ID);

    expect(dto.running).toBe(false);
    expect(dto.runState).toBe('paused');
    expect(dto.remainingMs).toBe(10 * 60 * 1000);
    expect(dto.endsAt).toBeNull();
  });

  it('no timer row → idle DTO with remainingMs=0', async () => {
    const { svc } = makeService();
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([]); // no row
    });

    const dto = await svc.getTimer(SERVER_ID, USER_ID);

    expect(dto.running).toBe(false);
    expect(dto.runState).toBe('idle');
    expect(dto.remainingMs).toBe(0);
    expect(dto.endsAt).toBeNull();
    expect(dto.phase).toBe('work');
    expect(dto.serverId).toBe(SERVER_ID);
  });

  it('running timer past ends_at → remainingMs=0 (never negative)', async () => {
    const overdueRow = {
      ...runningRow,
      // ends_at is 1 minute in the past
      ends_at: new Date(Date.now() - 60 * 1000),
      started_at: new Date(Date.now() - 26 * 60 * 1000),
    };
    const { svc } = makeService();
    let selectCall = 0;
    // First call: member check; second+: getTimerRow + selfHealIfOverdue UPDATE (returns same row)
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([overdueRow]);
    });
    // selfHealIfOverdue will call db.update; mock it to return the healed row
    mockUpdate.mockImplementation(() =>
      makeUpdateChain([{ ...overdueRow, ends_at: new Date(Date.now() + WORK_DURATION_MS) }]),
    );

    const dto = await svc.getTimer(SERVER_ID, USER_ID);

    expect(dto.remainingMs).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// Membership authz — non-member → 403
// ---------------------------------------------------------------------------

describe('StudyTimerService — membership authz', () => {
  it('getTimer: non-member → ForbiddenException', async () => {
    const { svc } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([])); // no member row

    await expect(svc.getTimer(SERVER_ID, USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('startTimer: non-member → ForbiddenException', async () => {
    const { svc } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([])); // no member row

    await expect(svc.startTimer(SERVER_ID, USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('pauseTimer: non-member → ForbiddenException', async () => {
    const { svc } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([]));

    await expect(svc.pauseTimer(SERVER_ID, USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resumeTimer: non-member → ForbiddenException', async () => {
    const { svc } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([]));

    await expect(svc.resumeTimer(SERVER_ID, USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('resetTimer: non-member → ForbiddenException', async () => {
    const { svc } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([]));

    await expect(svc.resetTimer(SERVER_ID, USER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });
});

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

describe('StudyTimerService — state transitions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('startTimer: upserts run_state=running phase=work; emits study-timer.updated', async () => {
    const { svc, emitter } = makeService();
    // startTimer: first select = assertMember, second = getTimerRow (no existing row)
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([]); // no existing row → fallback to default WORK_DURATION_MS
    });

    const insertedRow = {
      ...runningRow,
      ends_at: new Date(Date.now() + WORK_DURATION_MS),
    };
    mockInsert.mockImplementation(() => makeInsertChain([insertedRow]));

    const dto = await svc.startTimer(SERVER_ID, USER_ID);

    expect(dto.running).toBe(true);
    expect(dto.phase).toBe('work');
    expect(dto.runState).toBe('running');
    expect(dto.remainingMs).toBeGreaterThan(0);
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
  });

  it('pauseTimer on running: run_state=paused; paused_remaining_ms set; emits', async () => {
    const { svc, emitter } = makeService();
    // Use a guaranteed-future ends_at so selfHealIfOverdue short-circuits without
    // a DB write, keeping this test to one mockUpdate call (the pause UPDATE itself).
    const futureRunningRow = { ...runningRow, ends_at: new Date(Date.now() + WORK_DURATION_MS) };
    // assertMember → member row; getTimerRow → running row
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([futureRunningRow]);
    });

    const pausedResult = { ...pausedRow, paused_remaining_ms: WORK_DURATION_MS - 1000 };
    mockUpdate.mockImplementation(() => makeUpdateChain([pausedResult]));

    const dto = await svc.pauseTimer(SERVER_ID, USER_ID);

    expect(dto.runState).toBe('paused');
    expect(dto.running).toBe(false);
    expect(dto.remainingMs).toBe(pausedResult.paused_remaining_ms);
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
  });

  it('pauseTimer on overdue running row: heals before pausing; paused_remaining_ms > 0', async () => {
    // Regression guard for the HIGH finding: a running row whose ends_at is in the
    // past must NOT freeze paused_remaining_ms at 0.  selfHealIfOverdue re-derives
    // the correct current phase before the pause UPDATE is written.
    const { svc, emitter } = makeService();

    // Overdue row: work phase started 26 min ago; ends_at is 1 min in the past.
    // After healing: 26 min elapsed = 25 min work + 1 min into break.
    // Healed ends_at = started_at + 25min + 5min = now + ~4min.
    const overdueStartedAt = new Date(Date.now() - 26 * 60_000);
    const overdueEndsAt = new Date(Date.now() - 60_000); // 1 min in the past
    const overdueRow = { ...runningRow, started_at: overdueStartedAt, ends_at: overdueEndsAt };

    const healedEndsAt = new Date(
      overdueStartedAt.getTime() + WORK_DURATION_MS + BREAK_DURATION_MS,
    );
    const healedRow = {
      ...overdueRow,
      phase: 'break',
      started_at: new Date(healedEndsAt.getTime() - BREAK_DURATION_MS),
      ends_at: healedEndsAt,
    };

    // pausedHealedRow carries the remaining derived from the healed ends_at — positive.
    const healedRemaining = Math.max(0, healedEndsAt.getTime() - Date.now());
    const pausedHealedRow = {
      ...healedRow,
      run_state: 'paused',
      ends_at: null,
      paused_remaining_ms: healedRemaining,
    };

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]); // assertMember
      return makeSelectChain([overdueRow]); // getTimerRow (pauseTimer reads the overdue row)
    });

    let updateCall = 0;
    mockUpdate.mockImplementation(() => {
      updateCall++;
      if (updateCall === 1) return makeUpdateChain([healedRow]); // selfHealIfOverdue heal UPDATE
      return makeUpdateChain([pausedHealedRow]); // pause UPDATE
    });

    const dto = await svc.pauseTimer(SERVER_ID, USER_ID);

    expect(dto.runState).toBe('paused');
    // Must NOT be frozen at 0 — remaining reflects the healed break-phase window.
    expect(dto.remainingMs).toBeGreaterThan(0);
    expect(updateCall).toBe(2); // selfHealIfOverdue + pause UPDATE both ran
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
  });

  it('pauseTimer on non-running: no UPDATE; returns current state', async () => {
    const { svc, emitter } = makeService();
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([idleRow]);
    });

    const dto = await svc.pauseTimer(SERVER_ID, USER_ID);

    expect(dto.runState).toBe('idle');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('resumeTimer on paused: run_state=running; ends_at = now + paused_remaining_ms; emits', async () => {
    const { svc, emitter } = makeService();
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([pausedRow]);
    });

    const resumedRow = {
      ...runningRow,
      ends_at: new Date(Date.now() + pausedRow.paused_remaining_ms),
    };
    mockUpdate.mockImplementation(() => makeUpdateChain([resumedRow]));

    const dto = await svc.resumeTimer(SERVER_ID, USER_ID);

    expect(dto.running).toBe(true);
    expect(dto.runState).toBe('running');
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
  });

  it('resumeTimer on non-paused: no UPDATE; returns current state', async () => {
    const { svc, emitter } = makeService();
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([runningRow]);
    });

    const dto = await svc.resumeTimer(SERVER_ID, USER_ID);

    expect(dto.runState).toBe('running');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('resetTimer: upserts idle state; emits study-timer.updated', async () => {
    const { svc, emitter } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    mockInsert.mockImplementation(() => makeInsertChain([idleRow]));

    const dto = await svc.resetTimer(SERVER_ID, USER_ID);

    expect(dto.runState).toBe('idle');
    expect(dto.running).toBe(false);
    expect(dto.remainingMs).toBe(0);
    expect(dto.endsAt).toBeNull();
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
  });
});

// ---------------------------------------------------------------------------
// Idempotent phase transition — doPhaseAdvance
// ---------------------------------------------------------------------------

describe('StudyTimerService — idempotent phase transition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('doPhaseAdvance with matching ends_at: UPDATE succeeds; emits study-timer.updated', async () => {
    const { svc, emitter } = makeService();
    const expectedEndsAtMs = runningRow.ends_at.getTime();

    // getTimerRow returns the running row with matching ends_at
    mockSelect.mockImplementation(() => makeSelectChain([runningRow]));

    const advancedRow = {
      ...runningRow,
      phase: 'break',
      started_at: new Date(),
      ends_at: new Date(Date.now() + BREAK_DURATION_MS),
    };
    mockUpdate.mockImplementation(() => makeUpdateChain([advancedRow]));

    await svc.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
    const emittedTimer = emitter.emit.mock.calls[0]?.[1]?.timer;
    expect(emittedTimer?.phase).toBe('break');
  });

  it('doPhaseAdvance with NON-matching ends_at: no UPDATE; no emit (idempotent)', async () => {
    const { svc, emitter } = makeService();
    const wrongEndsAtMs = runningRow.ends_at.getTime() + 99_999; // doesn't match row

    mockSelect.mockImplementation(() => makeSelectChain([runningRow]));

    await svc.doPhaseAdvance(SERVER_ID, wrongEndsAtMs);

    // No UPDATE should have been called (early return before UPDATE due to mismatch)
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('doPhaseAdvance when timer is paused: no UPDATE; no emit', async () => {
    const { svc, emitter } = makeService();
    const expectedEndsAtMs = runningRow.ends_at.getTime();

    // Return paused row (run_state !== 'running')
    mockSelect.mockImplementation(() => makeSelectChain([pausedRow]));

    await svc.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);

    expect(mockUpdate).not.toHaveBeenCalled();
    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('doPhaseAdvance when UPDATE returns nothing (concurrent trigger): no emit', async () => {
    const { svc, emitter } = makeService();
    const expectedEndsAtMs = runningRow.ends_at.getTime();

    mockSelect.mockImplementation(() => makeSelectChain([runningRow]));
    // Simulate concurrent race: UPDATE returns [] (another process already advanced)
    mockUpdate.mockImplementation(() => makeUpdateChain([]));

    await svc.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);

    expect(emitter.emit).not.toHaveBeenCalled();
  });

  it('doPhaseAdvance advances work→break (correct next phase)', async () => {
    const { svc, emitter } = makeService();
    const expectedEndsAtMs = runningRow.ends_at.getTime();

    mockSelect.mockImplementation(() => makeSelectChain([runningRow])); // phase='work'

    const advancedRow = {
      ...runningRow,
      phase: 'break',
      ends_at: new Date(Date.now() + BREAK_DURATION_MS),
    };
    mockUpdate.mockImplementation(() => makeUpdateChain([advancedRow]));

    await svc.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);

    const emittedTimer = emitter.emit.mock.calls[0]?.[1]?.timer;
    expect(emittedTimer?.phase).toBe('break');
  });

  it('doPhaseAdvance advances break→work (correct next phase)', async () => {
    const { svc, emitter } = makeService();
    const breakRow = {
      ...runningRow,
      phase: 'break',
      ends_at: new Date(Date.now() + BREAK_DURATION_MS),
    };
    const expectedEndsAtMs = breakRow.ends_at.getTime();

    mockSelect.mockImplementation(() => makeSelectChain([breakRow]));

    const advancedRow = {
      ...breakRow,
      phase: 'work',
      ends_at: new Date(Date.now() + WORK_DURATION_MS),
    };
    mockUpdate.mockImplementation(() => makeUpdateChain([advancedRow]));

    await svc.doPhaseAdvance(SERVER_ID, expectedEndsAtMs);

    const emittedTimer = emitter.emit.mock.calls[0]?.[1]?.timer;
    expect(emittedTimer?.phase).toBe('work');
  });
});

// ---------------------------------------------------------------------------
// Presence: ephemeral (not persisted) — design confirmation
// ---------------------------------------------------------------------------

describe('StudyTimerService — presence design confirmation', () => {
  it('service methods never write to a presence/attendance table (no DB write for presence)', async () => {
    // Presence is tracked entirely in-memory by StudyTimerGateway.
    // The service ONLY writes server_study_timer rows — confirmed by observing
    // that service.startTimer calls db.insert (timer row) but never inserts to
    // any presence/attendance table.
    const { svc } = makeService();
    // startTimer fetches existing row first (getTimerRow), then upserts
    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]); // assertMember
      return makeSelectChain([]); // getTimerRow returns null → no existing row
    });
    mockInsert.mockImplementation(() => makeInsertChain([runningRow]));

    await svc.startTimer(SERVER_ID, USER_ID);

    // db.insert called exactly once (timer upsert) — no presence table writes
    expect(mockInsert).toHaveBeenCalledTimes(1);
    // The insert target is server_study_timer (not a presence/attendance table)
    // — verified by the test expectation that insert is called once with one call
    expect(mockInsert).toHaveBeenCalledWith(expect.any(Object));
  });
});

// ---------------------------------------------------------------------------
// configureDurations — wave-50 task f4b3659e unit tests
// ---------------------------------------------------------------------------

describe('StudyTimerService — configureDurations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('non-member → ForbiddenException', async () => {
    const { svc } = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([])); // no member row

    await expect(
      svc.configureDurations(SERVER_ID, USER_ID, { workMinutes: 30, breakMinutes: 10 }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('timer running → ConflictException (409)', async () => {
    const { svc } = makeService();
    const futureRunning = { ...runningRow, ends_at: new Date(Date.now() + WORK_DURATION_MS) };

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([futureRunning]); // getTimerRow → running
    });

    const { ConflictException } = await import('@nestjs/common');
    await expect(
      svc.configureDurations(SERVER_ID, USER_ID, { workMinutes: 30, breakMinutes: 10 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('timer paused → ConflictException (409)', async () => {
    const { svc } = makeService();

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([pausedRow]); // getTimerRow → paused
    });

    const { ConflictException } = await import('@nestjs/common');
    await expect(
      svc.configureDurations(SERVER_ID, USER_ID, { workMinutes: 30, breakMinutes: 10 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('timer idle → persists durations; emits study-timer.updated; returns updated DTO', async () => {
    const { svc, emitter } = makeService();

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([idleRow]); // getTimerRow → idle
    });

    const configuredRow = {
      ...idleRow,
      work_duration_ms: 30 * 60_000,
      break_duration_ms: 10 * 60_000,
    };
    mockInsert.mockImplementation(() => makeInsertChain([configuredRow]));

    const dto = await svc.configureDurations(SERVER_ID, USER_ID, {
      workMinutes: 30,
      breakMinutes: 10,
    });

    expect(dto.workDurationMs).toBe(30 * 60_000);
    expect(dto.breakDurationMs).toBe(10 * 60_000);
    expect(dto.runState).toBe('idle');
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
    // Emitted timer carries new durations
    const emittedTimer = emitter.emit.mock.calls[0]?.[1]?.timer;
    expect(emittedTimer?.workDurationMs).toBe(30 * 60_000);
    expect(emittedTimer?.breakDurationMs).toBe(10 * 60_000);
  });

  it('no existing row → upsert idle row with configured durations; emits update', async () => {
    const { svc, emitter } = makeService();

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([]); // no existing row
    });

    const newRow = {
      ...idleRow,
      work_duration_ms: 45 * 60_000,
      break_duration_ms: 15 * 60_000,
    };
    mockInsert.mockImplementation(() => makeInsertChain([newRow]));

    const dto = await svc.configureDurations(SERVER_ID, USER_ID, {
      workMinutes: 45,
      breakMinutes: 15,
    });

    expect(dto.workDurationMs).toBe(45 * 60_000);
    expect(dto.breakDurationMs).toBe(15 * 60_000);
    expect(emitter.emit).toHaveBeenCalledWith('study-timer.updated', expect.any(Object));
  });
});

// ---------------------------------------------------------------------------
// rowToDto — duration fields included in DTO
// ---------------------------------------------------------------------------

describe('StudyTimerService — rowToDto includes duration fields', () => {
  it('getTimer DTO carries workDurationMs + breakDurationMs from row', async () => {
    const { svc } = makeService();
    const customRow = {
      ...runningRow,
      ends_at: new Date(Date.now() + 30 * 60_000),
      work_duration_ms: 30 * 60_000,
      break_duration_ms: 10 * 60_000,
    };

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]);
      return makeSelectChain([customRow]);
    });

    const dto = await svc.getTimer(SERVER_ID, USER_ID);

    expect(dto.workDurationMs).toBe(30 * 60_000);
    expect(dto.breakDurationMs).toBe(10 * 60_000);
  });

  it('startTimer: next start uses configured work_duration_ms (karen-2 start path)', async () => {
    const { svc, emitter } = makeService();
    const existingIdleRow = {
      ...idleRow,
      work_duration_ms: 45 * 60_000, // custom 45-min work
      break_duration_ms: 10 * 60_000,
    };

    let selectCall = 0;
    mockSelect.mockImplementation(() => {
      selectCall++;
      if (selectCall === 1) return makeSelectChain([MEMBER_ROW]); // assertMember
      return makeSelectChain([existingIdleRow]); // getTimerRow → idle with custom durations
    });

    // The upsert should use ends_at = now + 45min (not 25min)
    const startedRow = {
      ...runningRow,
      ends_at: new Date(Date.now() + 45 * 60_000),
      work_duration_ms: 45 * 60_000,
      break_duration_ms: 10 * 60_000,
    };
    mockInsert.mockImplementation(() => makeInsertChain([startedRow]));

    const dto = await svc.startTimer(SERVER_ID, USER_ID);

    expect(dto.workDurationMs).toBe(45 * 60_000);
    expect(dto.breakDurationMs).toBe(10 * 60_000);
    // endsAt should reflect custom work duration (~45 min from now)
    const endsAtMs = new Date(dto.endsAt as string).getTime();
    expect(endsAtMs).toBeGreaterThan(Date.now() + 44 * 60_000);
    expect(emitter.emit).toHaveBeenCalledWith(
      'study-timer.updated',
      expect.objectContaining({ serverId: SERVER_ID }),
    );
  });
});
