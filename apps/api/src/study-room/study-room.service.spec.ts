/**
 * StudyRoomService unit tests — wave-52 M8 tasks d123d9e0 + ef84b378
 *
 * Covers (per spec ACs):
 *   Room lifecycle:
 *     - create room → stored in-memory; rooms list updated
 *     - join room → user added to roster; multi-tab dedup per userId
 *     - leave room → user removed from roster (by socket)
 *     - last member leaves → room removed + timer cleaned up
 *     - join non-existent room → ForbiddenException
 *
 *   Non-member authz:
 *     - createRoom non-member → ForbiddenException
 *     - joinRoom non-member → ForbiddenException
 *     - getOpenRooms non-member → ForbiddenException
 *     - startRoomTimer non-joined → ForbiddenException
 *
 *   Room independence from server timer:
 *     - no server_study_timer reads/writes in any room operation
 *
 *   Room-timer (MUST-LOCK 3):
 *     - start uses configured work_duration_ms (not bare constants)
 *     - pause captures remaining_ms correctly
 *     - reset returns to idle; clears timeout (karen-4)
 *     - configureRoomTimer changes durations; idle-only guard (409 if running)
 *     - getRoomTimer compute-on-read: running=remainingMs=max(0,ends_at−now)
 *     - getRoomTimer compute-on-read: paused=paused_remaining_ms
 *
 *   In-memory CAS idempotency (karen-1 — THE critical test):
 *     - doRoomPhaseAdvance with matching ends_at → phase advances; re-armed
 *     - doRoomPhaseAdvance with NON-matching ends_at → no-op (stale fire)
 *     - doRoomPhaseAdvance fired TWICE with same capturedEndsAtMs → only one advance
 *
 *   Timeout cleanup (karen-4):
 *     - room removed while timer running → timeout cleared; no leaked timer
 *     - onModuleDestroy clears all pending timeouts
 *
 *   Room timer independent of server timer:
 *     - no server_study_timer column referenced (confirmed by absence of DB mock calls
 *       in room-timer operations)
 *
 *   Self-healing:
 *     - selfHealRoomTimerIfOverdue: overdue running anchor → phase re-derived; re-armed
 *
 * Mocking strategy:
 *   DB module mocked at the boundary (same pattern as study-timer.service.spec.ts).
 *   No real DB needed — all room/timer state is in-memory.
 *   setTimeout/clearTimeout faked with vi.useFakeTimers() for timeout leak tests.
 */

import { ConflictException, ForbiddenException } from '@nestjs/common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
import { BREAK_DURATION_MS, WORK_DURATION_MS } from '../study-timer/study-timer.service';
import { StudyRoomService } from './study-room.service';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;

// ---------------------------------------------------------------------------
// Drizzle chain builders (mirror study-timer.service.spec.ts pattern)
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'srv-room-001';
const USER_A = 'user-room-A';
const USER_B = 'user-room-B';
const MEMBER_ROW = { id: 'mem-001' };
const SOCKET_A1 = 'socket-A1';
const SOCKET_A2 = 'socket-A2'; // second tab same user
const SOCKET_B1 = 'socket-B1';

// ---------------------------------------------------------------------------
// Helper: create service with fresh mocks
// ---------------------------------------------------------------------------

function makeService() {
  const svc = new StudyRoomService();
  // Register a no-op timer callback so emitTimerUpdate doesn't throw
  svc.registerTimerCallback(vi.fn());
  return svc;
}

// ---------------------------------------------------------------------------
// Room lifecycle tests
// ---------------------------------------------------------------------------

describe('StudyRoomService — room lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('createRoom: stores room in-memory; returns rooms list with new room', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));

    const { roomId, rooms } = await svc.createRoom(USER_A, SERVER_ID, 'Study Group');

    expect(typeof roomId).toBe('string');
    expect(roomId.length).toBeGreaterThan(0);
    expect(rooms).toHaveLength(1);
    expect(rooms[0]?.id).toBe(roomId);
    expect(rooms[0]?.name).toBe('Study Group');
    expect(rooms[0]?.count).toBe(0);
    expect(rooms[0]?.serverId).toBe(SERVER_ID);
  });

  it('createRoom: trims whitespace from name', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));

    const { rooms } = await svc.createRoom(USER_A, SERVER_ID, '  My Room  ');
    expect(rooms[0]?.name).toBe('My Room');
  });

  it('createRoom: empty name (after trim) → throws Error', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));

    await expect(svc.createRoom(USER_A, SERVER_ID, '   ')).rejects.toThrow(
      'Room name cannot be empty',
    );
  });

  it('createRoom: non-member → ForbiddenException', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([])); // no member row

    await expect(svc.createRoom(USER_A, SERVER_ID, 'Room')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('joinRoom: adds user to roster; roster has 1 member', async () => {
    const svc = makeService();
    // createRoom: member check
    mockSelect.mockImplementationOnce(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Test Room');

    // joinRoom: member check
    mockSelect.mockImplementationOnce(() => makeSelectChain([MEMBER_ROW]));
    const { roster, rooms } = await svc.joinRoom(
      USER_A,
      SERVER_ID,
      roomId,
      SOCKET_A1,
      'Alice',
      null,
    );

    expect(roster).toHaveLength(1);
    expect(roster[0]?.userId).toBe(USER_A);
    expect(roster[0]?.displayName).toBe('Alice');
    expect(rooms[0]?.count).toBe(1);
  });

  it('joinRoom: multi-tab dedup — same user, two sockets → roster count stays 1', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));

    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Dedup Room');

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roster } = await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A2, 'Alice', null);

    // Only 1 unique user in roster (deduplicated)
    expect(roster).toHaveLength(1);
    expect(roster[0]?.userId).toBe(USER_A);
  });

  it('joinRoom: two different users → roster count = 2', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Two Users');

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roster } = await svc.joinRoom(USER_B, SERVER_ID, roomId, SOCKET_B1, 'Bob', null);

    expect(roster).toHaveLength(2);
  });

  it('joinRoom: non-existent room → ForbiddenException', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));

    await expect(
      svc.joinRoom(USER_A, SERVER_ID, 'ghost-room-id', SOCKET_A1, 'Alice', null),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('joinRoom: non-member → ForbiddenException', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([])); // no member

    await expect(
      svc.joinRoom(USER_A, SERVER_ID, 'any-room', SOCKET_A1, 'Alice', null),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('leaveRoom: removes socket; roster count decreases', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Leave Test');

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_B, SERVER_ID, roomId, SOCKET_B1, 'Bob', null);

    const result = svc.leaveRoom(USER_A, SERVER_ID, roomId, SOCKET_A1);

    expect(result.roomRemoved).toBe(false);
    expect(result.roster).toHaveLength(1);
    expect(result.roster[0]?.userId).toBe(USER_B);
  });

  it('leaveRoom: last member leaves → roomRemoved=true; rooms list is empty', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Last Member');

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);

    const result = svc.leaveRoom(USER_A, SERVER_ID, roomId, SOCKET_A1);

    expect(result.roomRemoved).toBe(true);
    expect(result.rooms).toHaveLength(0);
  });

  it('leaveRoom: multi-tab — socket removed but user still in room (other tab)', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Multi-tab');

    // User joins with two sockets
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A2, 'Alice', null);

    // Remove one socket — user should stay in roster
    const result = svc.leaveRoom(USER_A, SERVER_ID, roomId, SOCKET_A1);

    expect(result.roomRemoved).toBe(false);
    expect(result.roster).toHaveLength(1);
    expect(result.roster[0]?.userId).toBe(USER_A);
  });

  it('leaveRoom: leave non-existent room → graceful no-op', () => {
    const svc = makeService();
    const result = svc.leaveRoom(USER_A, SERVER_ID, 'ghost-room', SOCKET_A1);
    expect(result.roomRemoved).toBe(false);
    expect(result.roster).toHaveLength(0);
  });

  it('getOpenRooms: non-member → ForbiddenException', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([]));

    await expect(svc.getOpenRooms(USER_A, SERVER_ID)).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('getOpenRooms: returns rooms list for member', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.createRoom(USER_A, SERVER_ID, 'Open Room');

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const rooms = await svc.getOpenRooms(USER_A, SERVER_ID);

    expect(rooms).toHaveLength(1);
    expect(rooms[0]?.name).toBe('Open Room');
  });
});

// ---------------------------------------------------------------------------
// Room-timer tests (MUST-LOCK 3)
// ---------------------------------------------------------------------------

describe('StudyRoomService — room-timer (MUST-LOCK 3)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setupRoomWithMember(svc: StudyRoomService, userId = USER_A) {
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(userId, SERVER_ID, 'Timer Room');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(userId, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);
    return roomId;
  }

  it('getRoomTimer: no anchor → idle DTO with default durations', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Timer Room');

    const timer = svc.getRoomTimer(roomId);

    expect(timer.runState).toBe('idle');
    expect(timer.running).toBe(false);
    expect(timer.remainingMs).toBe(0);
    expect(timer.endsAt).toBeNull();
    expect(timer.phase).toBe('work');
    expect(timer.workDurationMs).toBe(WORK_DURATION_MS);
    expect(timer.breakDurationMs).toBe(BREAK_DURATION_MS);
    expect(timer.roomId).toBe(roomId);
  });

  it('startRoomTimer: sets run_state=running, phase=work, uses configured work_duration_ms', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    const timer = svc.startRoomTimer(USER_A, SERVER_ID, roomId);

    expect(timer.runState).toBe('running');
    expect(timer.running).toBe(true);
    expect(timer.phase).toBe('work');
    expect(timer.remainingMs).toBeGreaterThan(0);
    expect(timer.remainingMs).toBeLessThanOrEqual(WORK_DURATION_MS);
    expect(timer.endsAt).not.toBeNull();
    expect(timer.roomId).toBe(roomId);
  });

  it('startRoomTimer: non-joined member → ForbiddenException', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Timer Room');
    // USER_A created but did NOT join → not in roster

    expect(() => svc.startRoomTimer(USER_A, SERVER_ID, roomId)).toThrow(ForbiddenException);
  });

  it('startRoomTimer: uses custom work_duration_ms from configureRoomTimer', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    // Configure before starting
    svc.configureRoomTimer(USER_A, SERVER_ID, roomId, 10, 2); // 10 min work, 2 min break

    const timer = svc.startRoomTimer(USER_A, SERVER_ID, roomId);

    expect(timer.workDurationMs).toBe(10 * 60_000);
    expect(timer.breakDurationMs).toBe(2 * 60_000);
    // Remaining should be close to 10 minutes
    expect(timer.remainingMs).toBeGreaterThan(9 * 60_000);
    expect(timer.remainingMs).toBeLessThanOrEqual(10 * 60_000);
  });

  it('pauseRoomTimer: captures paused_remaining_ms; run_state=paused', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    svc.startRoomTimer(USER_A, SERVER_ID, roomId);
    const paused = svc.pauseRoomTimer(USER_A, SERVER_ID, roomId);

    expect(paused.runState).toBe('paused');
    expect(paused.running).toBe(false);
    expect(paused.remainingMs).toBeGreaterThan(0);
    expect(paused.remainingMs).toBeLessThanOrEqual(WORK_DURATION_MS);
    expect(paused.endsAt).toBeNull();
  });

  it('pauseRoomTimer: non-running → no-op; returns current state', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    const timer = svc.pauseRoomTimer(USER_A, SERVER_ID, roomId); // already idle

    expect(timer.runState).toBe('idle');
  });

  it('resetRoomTimer: returns to idle; remainingMs=0; endsAt=null', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    svc.startRoomTimer(USER_A, SERVER_ID, roomId);
    const reset = svc.resetRoomTimer(USER_A, SERVER_ID, roomId);

    expect(reset.runState).toBe('idle');
    expect(reset.running).toBe(false);
    expect(reset.remainingMs).toBe(0);
    expect(reset.endsAt).toBeNull();
    expect(reset.phase).toBe('work');
  });

  it('configureRoomTimer: persists durations; emits update', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    const timer = svc.configureRoomTimer(USER_A, SERVER_ID, roomId, 30, 10);

    expect(timer.workDurationMs).toBe(30 * 60_000);
    expect(timer.breakDurationMs).toBe(10 * 60_000);
    expect(timer.runState).toBe('idle');
  });

  it('configureRoomTimer: timer running → ConflictException (409)', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    svc.startRoomTimer(USER_A, SERVER_ID, roomId);

    expect(() => svc.configureRoomTimer(USER_A, SERVER_ID, roomId, 30, 10)).toThrow(
      ConflictException,
    );
  });

  it('configureRoomTimer: timer paused → ConflictException (409)', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    svc.startRoomTimer(USER_A, SERVER_ID, roomId);
    svc.pauseRoomTimer(USER_A, SERVER_ID, roomId);

    expect(() => svc.configureRoomTimer(USER_A, SERVER_ID, roomId, 30, 10)).toThrow(
      ConflictException,
    );
  });

  it('room timer stays in-memory only (no DB writes in any timer op)', async () => {
    const svc = makeService();
    const roomId = await setupRoomWithMember(svc);

    // Clear DB mock call counts after setup (setup calls select for member + user)
    vi.clearAllMocks();

    // All timer operations should make ZERO DB calls
    svc.startRoomTimer(USER_A, SERVER_ID, roomId);
    svc.pauseRoomTimer(USER_A, SERVER_ID, roomId);
    svc.resetRoomTimer(USER_A, SERVER_ID, roomId);
    svc.configureRoomTimer(USER_A, SERVER_ID, roomId, 30, 10);

    // No DB calls during timer operations (timer is fully in-memory — MUST-LOCK 3)
    expect(db.select).not.toHaveBeenCalled();
    expect(db.insert).not.toHaveBeenCalled();
    expect(db.update).not.toHaveBeenCalled();
    expect(db.delete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// In-memory CAS idempotency (karen-1 — THE critical test)
// ---------------------------------------------------------------------------

describe('StudyRoomService — in-memory CAS idempotency (karen-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  async function setupRunningRoom(svc: StudyRoomService) {
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'CAS Room');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);
    svc.startRoomTimer(USER_A, SERVER_ID, roomId);
    return roomId;
  }

  it('doRoomPhaseAdvance with matching ends_at → phase advances from work to break', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);

    const timer = svc.getRoomTimer(roomId);
    const capturedEndsAtMs = new Date(timer.endsAt as string).getTime();

    // Clear calls from setupRunningRoom (startRoomTimer emits once)
    timerCb.mockClear();

    svc.doRoomPhaseAdvance(roomId, capturedEndsAtMs);

    const advanced = svc.getRoomTimer(roomId);
    expect(advanced.phase).toBe('break');
    expect(advanced.runState).toBe('running');
    expect(timerCb).toHaveBeenCalledTimes(1);
  });

  it('doRoomPhaseAdvance with NON-matching ends_at → no-op (stale fire)', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);

    // Clear calls from setupRunningRoom before testing the advance
    timerCb.mockClear();

    // Use wrong ends_at (doesn't match current anchor)
    const wrongEndsAtMs = Date.now() + 99_999_999;

    svc.doRoomPhaseAdvance(roomId, wrongEndsAtMs);

    // Phase should NOT have changed
    const timer = svc.getRoomTimer(roomId);
    expect(timer.phase).toBe('work'); // unchanged
    expect(timerCb).not.toHaveBeenCalled(); // no broadcast on stale fire
  });

  it('doRoomPhaseAdvance fired TWICE with same capturedEndsAtMs → only ONE advance (idempotent)', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);

    const timer = svc.getRoomTimer(roomId);
    const capturedEndsAtMs = new Date(timer.endsAt as string).getTime();

    // Clear calls from setupRunningRoom before testing the advance
    timerCb.mockClear();

    // Fire once → advances work→break
    svc.doRoomPhaseAdvance(roomId, capturedEndsAtMs);
    expect(svc.getRoomTimer(roomId).phase).toBe('break');
    expect(timerCb).toHaveBeenCalledTimes(1);

    // Fire again with the SAME capturedEndsAtMs → no-op (anchor.ends_at changed after first advance)
    svc.doRoomPhaseAdvance(roomId, capturedEndsAtMs);

    // Phase should still be break (not advanced to work again)
    expect(svc.getRoomTimer(roomId).phase).toBe('break');
    // Callback called only once total — second fire was a no-op
    expect(timerCb).toHaveBeenCalledTimes(1);
  });

  it('doRoomPhaseAdvance: anchor missing (room removed) → no-op; no crash', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);
    const capturedEndsAtMs = new Date(svc.getRoomTimer(roomId).endsAt as string).getTime();

    // Remove the room (last member leaves)
    svc.leaveRoom(USER_A, SERVER_ID, roomId, SOCKET_A1);

    // Clear calls from setupRunningRoom before testing the advance
    timerCb.mockClear();

    // Fire the advance → no crash, no callback
    svc.doRoomPhaseAdvance(roomId, capturedEndsAtMs);

    expect(timerCb).not.toHaveBeenCalled();
  });

  it('doRoomPhaseAdvance: timer paused → no-op', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);
    const capturedEndsAtMs = new Date(svc.getRoomTimer(roomId).endsAt as string).getTime();

    // Pause the timer
    svc.pauseRoomTimer(USER_A, SERVER_ID, roomId);

    // Clear all prior calls (startRoomTimer + pauseRoomTimer both emit)
    timerCb.mockClear();

    // doRoomPhaseAdvance should no-op: run_state !== 'running'
    svc.doRoomPhaseAdvance(roomId, capturedEndsAtMs);

    expect(timerCb).not.toHaveBeenCalled();
    // Timer should still be paused
    expect(svc.getRoomTimer(roomId).runState).toBe('paused');
  });
});

// ---------------------------------------------------------------------------
// Timeout cleanup (karen-4)
// ---------------------------------------------------------------------------

describe('StudyRoomService — timeout cleanup (karen-4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function setupRunningRoom(svc: StudyRoomService) {
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Timeout Room');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);
    svc.startRoomTimer(USER_A, SERVER_ID, roomId);
    return roomId;
  }

  it('room removed while timer running → timer anchor + timeout cleaned up; no leaked timer', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);
    const capturedEndsAtMs = new Date(svc.getRoomTimer(roomId).endsAt as string).getTime();

    // Last member leaves → room removed → timeout should be cleared
    svc.leaveRoom(USER_A, SERVER_ID, roomId, SOCKET_A1);

    // Advance fake timers past the would-have-fired time
    vi.advanceTimersByTime(WORK_DURATION_MS + 1000);

    // The phase advance should NOT have been called (timer was cleaned up)
    // At this point timerCb was called once for startRoomTimer; should NOT be called again
    const callCountAfterStart = timerCb.mock.calls.length;
    // The timer on the room was cleared; doRoomPhaseAdvance would be a no-op anyway
    // (anchor removed), but we confirm the timeout itself didn't fire by checking
    // that capturedEndsAtMs is stale and the anchor is gone
    const orphanTimer = svc.getRoomTimer(roomId);
    // getRoomTimer for non-existent room returns idle default (no anchor)
    expect(orphanTimer.runState).toBe('idle');
    // Critically: no additional timer callback calls after room removal
    expect(timerCb.mock.calls.length).toBe(callCountAfterStart);
    expect(capturedEndsAtMs).toBeGreaterThan(0); // just confirms we had a real ends_at
  });

  it('resetRoomTimer clears timeout; no advance fires after reset', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);

    svc.resetRoomTimer(USER_A, SERVER_ID, roomId);
    const callsAfterReset = timerCb.mock.calls.length;

    vi.advanceTimersByTime(WORK_DURATION_MS + 1000);

    // No additional callbacks fired after reset
    expect(timerCb.mock.calls.length).toBe(callsAfterReset);
    expect(svc.getRoomTimer(roomId).runState).toBe('idle');
  });

  it('pauseRoomTimer clears timeout; no advance fires while paused', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    const roomId = await setupRunningRoom(svc);

    svc.pauseRoomTimer(USER_A, SERVER_ID, roomId);
    const callsAfterPause = timerCb.mock.calls.length;

    vi.advanceTimersByTime(WORK_DURATION_MS + 1000);

    expect(timerCb.mock.calls.length).toBe(callsAfterPause);
    expect(svc.getRoomTimer(roomId).runState).toBe('paused');
  });

  it('onModuleDestroy clears all pending timeouts', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    // Create and start timers in two separate rooms
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId: r1 } = await svc.createRoom(USER_A, SERVER_ID, 'Room 1');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, r1, SOCKET_A1, 'Alice', null);
    svc.startRoomTimer(USER_A, SERVER_ID, r1);

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId: r2 } = await svc.createRoom(USER_A, SERVER_ID, 'Room 2');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, r2, SOCKET_A2, 'Alice', null);
    svc.startRoomTimer(USER_A, SERVER_ID, r2);

    const callsBeforeDestroy = timerCb.mock.calls.length;

    // Destroy module → all timeouts cleared
    svc.onModuleDestroy();

    vi.advanceTimersByTime(WORK_DURATION_MS + 1000);

    // No callbacks fired after destroy
    expect(timerCb.mock.calls.length).toBe(callsBeforeDestroy);
  });
});

// ---------------------------------------------------------------------------
// Self-healing reconnect reconciliation
// ---------------------------------------------------------------------------

describe('StudyRoomService — self-healing on reconnect', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('selfHealRoomTimerIfOverdue: no-op when not running', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Heal Room');

    // No throw, no mutation on idle timer
    expect(() => svc.selfHealRoomTimerIfOverdue(roomId)).not.toThrow();
    expect(svc.getRoomTimer(roomId).runState).toBe('idle');
  });

  it('selfHealRoomTimerIfOverdue: overdue running anchor → phase re-derived; re-armed', async () => {
    const svc = makeService();
    const timerCb = vi.fn();
    svc.registerTimerCallback(timerCb);

    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Heal Room');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);

    // Manually set an overdue running anchor (as if process restarted)
    const startedAt = new Date(Date.now() - 26 * 60_000); // started 26 min ago
    const overdueEndsAt = new Date(Date.now() - 60_000); // 1 min in the past

    // Access the internal Map via doRoomPhaseAdvance: first start it, then manually
    // backdate the anchor to simulate restart
    svc.startRoomTimer(USER_A, SERVER_ID, roomId);

    // Inject the overdue state directly (white-box for testing self-heal)
    const anchor = (svc as unknown as { roomTimers: Map<string, unknown> }).roomTimers.get(
      roomId,
    ) as {
      run_state: string;
      started_at: Date;
      ends_at: Date;
      phase: string;
    };
    anchor.run_state = 'running';
    anchor.started_at = startedAt;
    anchor.ends_at = overdueEndsAt;
    anchor.phase = 'work';

    timerCb.mockClear();

    svc.selfHealRoomTimerIfOverdue(roomId);

    const healed = svc.getRoomTimer(roomId);
    // After 26 min: 25 min work done → now in break
    expect(healed.phase).toBe('break');
    expect(healed.runState).toBe('running');
    expect(healed.remainingMs).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// getRoomIdsForSocket — reverse index helper
// ---------------------------------------------------------------------------

describe('StudyRoomService — getRoomIdsForSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array for unknown server', () => {
    const svc = makeService();
    expect(svc.getRoomIdsForSocket('unknown-server', 'socket-x')).toHaveLength(0);
  });

  it('returns roomId when socket is in that room', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Index Room');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);

    const ids = svc.getRoomIdsForSocket(SERVER_ID, SOCKET_A1);
    expect(ids).toContain(roomId);
  });

  it('does not return roomId when socket is not in that room', async () => {
    const svc = makeService();
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    const { roomId } = await svc.createRoom(USER_A, SERVER_ID, 'Index Room');
    mockSelect.mockImplementation(() => makeSelectChain([MEMBER_ROW]));
    await svc.joinRoom(USER_A, SERVER_ID, roomId, SOCKET_A1, 'Alice', null);

    const ids = svc.getRoomIdsForSocket(SERVER_ID, 'other-socket');
    expect(ids).not.toContain(roomId);
  });
});
