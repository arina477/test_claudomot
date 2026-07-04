/**
 * SchedulingService unit tests — wave-44 M8 polish (task 0308cdf1)
 *
 * Covers:
 *   listSessionsForServer — recurrence-expansion cursor:
 *     - weekly session expands to correct occurrence count within a window
 *     - weekly session capped by recurrence_until (stops before window end)
 *     - weekly session capped by 90-day max window (even when recurrence_until absent)
 *     - 'none' session appears exactly once when starts_at within window
 *     - 'none' session excluded when starts_at outside window
 *     - occurrences share the base id with distinct startsAt values
 *     - mixed recurrence: 'weekly' + 'none' sessions sort by startsAt ASC
 *     - empty server → returns { sessions: [] }
 *     - non-member → 403 ForbiddenException
 *     - window defaults to 60 days from `from` when `to` is absent
 *     - window capped to 90 days even when `to` exceeds maxEnd
 *
 *   DTO shape (wave-44 addition):
 *     - ScheduledSession DTO carries createdAt and updatedAt fields
 *
 *   createSession:
 *     - organizer creates a session → DTO returned
 *     - non-organizer → 403 ForbiddenException
 *     - endsAt <= startsAt → 400 BadRequestException
 *
 * Mocking strategy: Drizzle DB chains mocked at the db module boundary
 * (same pattern as assignments.service.spec.ts). Recurrence math is pure and
 * fully unit-testable without a DB.
 */

import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SchedulingService } from './scheduling.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers — matches assignments.service.spec.ts pattern exactly
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

// ---------------------------------------------------------------------------
// db module mock
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

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const SERVER_ID = 'server-001';
const ORGANIZER_ID = 'user-organizer';
const MEMBER_ID = 'user-member';
const SESSION_ID = 'session-001';

const NOW = new Date('2026-07-04T00:00:00Z'); // window anchor for tests

// A weekly session starting exactly at the window start
const WEEKLY_SESSION_START = new Date('2026-07-04T10:00:00Z');
const WEEKLY_SESSION_END = new Date('2026-07-04T11:00:00Z'); // 1-hour duration
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function makeSessionRow(
  overrides: Partial<{
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
  }> = {},
) {
  return {
    id: SESSION_ID,
    server_id: SERVER_ID,
    organizer_id: ORGANIZER_ID,
    title: 'Weekly Study',
    description: null,
    starts_at: WEEKLY_SESSION_START,
    ends_at: WEEKLY_SESSION_END,
    recurrence: 'weekly',
    recurrence_until: null,
    is_deleted: false,
    created_at: NOW,
    updated_at: NOW,
    ...overrides,
  };
}

const mockOrganizerUserRow = {
  id: ORGANIZER_ID,
  display_name: 'Organizer Name',
  username: 'organizeruser',
  avatar_url: null,
};

const mockMemberRow = { id: 'sm-001' };

// ---------------------------------------------------------------------------
// Mock RbacService factory
// ---------------------------------------------------------------------------

function makeRbacService(canResult = true) {
  return {
    can: vi.fn().mockResolvedValue(canResult),
    canViewChannelById: vi.fn().mockResolvedValue(true),
  };
}

// ---------------------------------------------------------------------------
// Helper: build window string params from Date objects
// ---------------------------------------------------------------------------

function isoWindow(from: Date, to: Date) {
  return { from: from.toISOString(), to: to.toISOString() };
}

// ---------------------------------------------------------------------------
// Tests: listSessionsForServer — recurrence expansion
// ---------------------------------------------------------------------------

describe('SchedulingService.listSessionsForServer — recurrence expansion', () => {
  let service: SchedulingService;
  let rbac: ReturnType<typeof makeRbacService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new SchedulingService(rbac as any);
  });

  it('weekly session with no recurrence_until expands to all occurrences within the window', async () => {
    // Arrange: 3-week window; weekly session starting at window start → expect 3 occurrences
    const windowStart = WEEKLY_SESSION_START;
    const windowEnd = new Date(windowStart.getTime() + 3 * ONE_WEEK_MS - 1); // just under 3 weeks

    const sessionRow = makeSessionRow({ recurrence: 'weekly', recurrence_until: null });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]); // assertMember
      if (selectCallCount === 2) return makeSelectChain([sessionRow]); // sessions DB fetch
      return makeSelectChain([mockOrganizerUserRow]); // organizer batch resolve
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: 3 occurrences (weeks 0, 1, 2)
    expect(result.sessions).toHaveLength(3);
  });

  it('weekly session capped by recurrence_until: stops emitting occurrences after recurrence_until', async () => {
    // Arrange: 5-week window; recurrence_until after 2 occurrences → expect exactly 2
    const windowStart = WEEKLY_SESSION_START;
    const windowEnd = new Date(windowStart.getTime() + 5 * ONE_WEEK_MS);

    // recurrence_until is 10 days after session start → only weeks 0 and 1 fall before it
    const recurrenceUntil = new Date(windowStart.getTime() + 10 * 24 * 60 * 60 * 1000);

    const sessionRow = makeSessionRow({
      recurrence: 'weekly',
      recurrence_until: recurrenceUntil,
    });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: only 2 occurrences — week 0 (day 0) and week 1 (day 7); week 2 (day 14) > recurrenceUntil (day 10)
    expect(result.sessions).toHaveLength(2);
    expect(new Date(result.sessions[0]?.startsAt ?? '').getTime()).toBe(windowStart.getTime());
    expect(new Date(result.sessions[1]?.startsAt ?? '').getTime()).toBe(
      windowStart.getTime() + ONE_WEEK_MS,
    );
  });

  it('weekly session capped by 90-day hard max even when to exceeds maxEnd', async () => {
    // Arrange: request window >90 days; service clamps to 90-day max
    const windowStart = WEEKLY_SESSION_START;
    const requestedEnd = new Date(windowStart.getTime() + 200 * 24 * 60 * 60 * 1000); // 200 days
    const maxWindowMs = 90 * 24 * 60 * 60 * 1000;
    const maxEnd = new Date(windowStart.getTime() + maxWindowMs);

    // Weekly session with no recurrence_until — service clamps window to 90 days
    const sessionRow = makeSessionRow({ recurrence: 'weekly', recurrence_until: null });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, requestedEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: occurrences limited to the 90-day clamped window
    // Max weekly occurrences in exactly 90 days starting at day 0: Math.floor(90/7)+1 = 13
    // (weeks 0,1,2,...,12 — week 13 would be day 91 which is outside maxEnd)
    const expectedCount = Math.floor(maxWindowMs / ONE_WEEK_MS) + 1;
    expect(result.sessions.length).toBe(expectedCount);

    // Last occurrence must not exceed maxEnd
    const lastSession = result.sessions[result.sessions.length - 1];
    expect(lastSession).toBeDefined();
    if (!lastSession) return;
    expect(new Date(lastSession.startsAt).getTime()).toBeLessThanOrEqual(maxEnd.getTime());
  });

  it('none session appears exactly once when starts_at falls within the window', async () => {
    // Arrange: 'none' session within the window
    const sessionStart = new Date(NOW.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days from now
    const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

    const sessionRow = makeSessionRow({
      starts_at: sessionStart,
      ends_at: sessionEnd,
      recurrence: 'none',
      recurrence_until: null,
    });

    const windowStart = NOW;
    const windowEnd = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: exactly one occurrence
    expect(result.sessions).toHaveLength(1);
    expect(new Date(result.sessions[0]?.startsAt ?? '').getTime()).toBe(sessionStart.getTime());
  });

  it('none session excluded when starts_at is outside the window', async () => {
    // Arrange: 'none' session is 30 days in the future; window is only 7 days
    const sessionStart = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000);
    const sessionEnd = new Date(sessionStart.getTime() + 60 * 60 * 1000);

    const sessionRow = makeSessionRow({
      starts_at: sessionStart,
      ends_at: sessionEnd,
      recurrence: 'none',
      recurrence_until: null,
    });

    const windowStart = NOW;
    const windowEnd = new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000);

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: no occurrences
    expect(result.sessions).toHaveLength(0);
  });

  it('all weekly occurrences share the base session id with distinct startsAt values', async () => {
    // Arrange: 2-week window, weekly session → 2 occurrences sharing same id
    const windowStart = WEEKLY_SESSION_START;
    const windowEnd = new Date(windowStart.getTime() + 2 * ONE_WEEK_MS - 1);

    const sessionRow = makeSessionRow({ id: 'shared-id', recurrence: 'weekly' });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: both occurrences carry the same id
    expect(result.sessions).toHaveLength(2);
    expect(result.sessions[0]?.id).toBe('shared-id');
    expect(result.sessions[1]?.id).toBe('shared-id');

    // But they have distinct startsAt values
    expect(result.sessions[0]?.startsAt).not.toBe(result.sessions[1]?.startsAt);
    expect(new Date(result.sessions[1]?.startsAt ?? '').getTime()).toBe(
      new Date(result.sessions[0]?.startsAt ?? '').getTime() + ONE_WEEK_MS,
    );
  });

  it('mixed recurrence: weekly + none sessions sorted by startsAt ASC', async () => {
    // Arrange: 'none' session falls between two weekly occurrences
    const weeklyStart = new Date('2026-07-04T10:00:00Z');
    const noneStart = new Date('2026-07-09T15:00:00Z'); // between week 0 and week 1
    const windowStart = weeklyStart;
    const windowEnd = new Date(weeklyStart.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    const weeklyRow = makeSessionRow({
      id: 'weekly-id',
      starts_at: weeklyStart,
      ends_at: new Date(weeklyStart.getTime() + ONE_WEEK_MS - 1),
      recurrence: 'weekly',
      recurrence_until: null,
    });

    const noneRow = makeSessionRow({
      id: 'none-id',
      starts_at: noneStart,
      ends_at: new Date(noneStart.getTime() + 60 * 60 * 1000),
      recurrence: 'none',
      recurrence_until: null,
    });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      // DB returns both rows (ordered by starts_at ASC already)
      if (selectCallCount === 2) return makeSelectChain([weeklyRow, noneRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: 3 items total (weekly week-0, none, weekly week-1), sorted ASC
    expect(result.sessions.length).toBeGreaterThanOrEqual(3);
    // Verify ASC order
    for (let i = 1; i < result.sessions.length; i++) {
      const prev = new Date(result.sessions[i - 1]?.startsAt ?? '').getTime();
      const curr = new Date(result.sessions[i]?.startsAt ?? '').getTime();
      expect(curr).toBeGreaterThanOrEqual(prev);
    }
    // none-id session sits between the two weekly occurrences
    const ids = result.sessions.map((s) => s.id);
    const noneIdx = ids.indexOf('none-id');
    expect(noneIdx).toBeGreaterThan(0);
    expect(noneIdx).toBeLessThan(ids.lastIndexOf('weekly-id'));
  });

  it('returns { sessions: [] } when server has no scheduled sessions', async () => {
    // Arrange
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      return makeSelectChain([]); // no sessions in DB
    });

    // Act
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID);

    // Assert
    expect(result.sessions).toHaveLength(0);
  });

  it('throws 403 ForbiddenException when non-member calls listSessionsForServer', async () => {
    // Arrange
    mockSelect.mockReturnValue(makeSelectChain([])); // server_members lookup returns nothing

    // Act + Assert
    await expect(
      service.listSessionsForServer(SERVER_ID, 'non-member', NOW.toISOString()),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('defaults window to 60 days from `from` when `to` is absent', async () => {
    // Arrange: 8 weekly sessions would fit in 60 days (weeks 0–7 = days 0–49 < 60)
    const windowStart = WEEKLY_SESSION_START;
    const sessionRow = makeSessionRow({ recurrence: 'weekly', recurrence_until: null });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act: pass `from` only, omit `to`
    const result = await service.listSessionsForServer(
      SERVER_ID,
      MEMBER_ID,
      windowStart.toISOString(),
    );

    // Assert: 60-day window = floor(60/7)+1 = 9 occurrences (weeks 0–8 start within 60 days)
    const defaultWindowMs = 60 * 24 * 60 * 60 * 1000;
    const expectedCount = Math.floor(defaultWindowMs / ONE_WEEK_MS) + 1;
    expect(result.sessions.length).toBe(expectedCount);
  });
});

// ---------------------------------------------------------------------------
// Tests: DTO shape — createdAt + updatedAt (wave-44 addition)
// ---------------------------------------------------------------------------

describe('SchedulingService — DTO carries createdAt and updatedAt (wave-44)', () => {
  let service: SchedulingService;
  let rbac: ReturnType<typeof makeRbacService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new SchedulingService(rbac as any);
  });

  it('listSessionsForServer occurrence carries createdAt and updatedAt from the base row', async () => {
    // Arrange
    const createdAt = new Date('2026-06-01T00:00:00Z');
    const updatedAt = new Date('2026-06-15T12:00:00Z');

    const sessionRow = makeSessionRow({
      recurrence: 'none',
      starts_at: WEEKLY_SESSION_START,
      ends_at: WEEKLY_SESSION_END,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    const windowStart = WEEKLY_SESSION_START;
    const windowEnd = new Date(windowStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: DTO includes createdAt + updatedAt (wave-44 addition)
    expect(result.sessions).toHaveLength(1);
    const session = result.sessions[0];
    expect(session).toBeDefined();
    if (!session) return;
    expect(session.createdAt).toBe(createdAt.toISOString());
    expect(session.updatedAt).toBe(updatedAt.toISOString());
  });

  it('weekly occurrence inherits createdAt and updatedAt from the base session row', async () => {
    // Arrange
    const createdAt = new Date('2026-05-01T00:00:00Z');
    const updatedAt = new Date('2026-05-20T08:00:00Z');

    const windowStart = WEEKLY_SESSION_START;
    const windowEnd = new Date(windowStart.getTime() + 2 * ONE_WEEK_MS - 1);

    const sessionRow = makeSessionRow({
      recurrence: 'weekly',
      recurrence_until: null,
      created_at: createdAt,
      updated_at: updatedAt,
    });

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMemberRow]);
      if (selectCallCount === 2) return makeSelectChain([sessionRow]);
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const { from, to } = isoWindow(windowStart, windowEnd);
    const result = await service.listSessionsForServer(SERVER_ID, MEMBER_ID, from, to);

    // Assert: all occurrences carry the same createdAt/updatedAt
    expect(result.sessions.length).toBeGreaterThanOrEqual(2);
    for (const session of result.sessions) {
      expect(session.createdAt).toBe(createdAt.toISOString());
      expect(session.updatedAt).toBe(updatedAt.toISOString());
    }
  });
});

// ---------------------------------------------------------------------------
// Tests: createSession
// ---------------------------------------------------------------------------

describe('SchedulingService.createSession', () => {
  let service: SchedulingService;
  let rbac: ReturnType<typeof makeRbacService>;

  beforeEach(() => {
    vi.clearAllMocks();
    rbac = makeRbacService(true);
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new SchedulingService(rbac as any);
  });

  it('organizer creates a session and receives DTO with organizer identity', async () => {
    // Arrange
    const insertedRow = makeSessionRow({ recurrence: 'none' });

    mockInsert.mockReturnValue(makeInsertChain([insertedRow]));

    mockSelect.mockImplementation(() => {
      // resolveOrganizerIdentity
      return makeSelectChain([mockOrganizerUserRow]);
    });

    // Act
    const result = await service.createSession(SERVER_ID, ORGANIZER_ID, {
      title: 'Weekly Study',
      startsAt: WEEKLY_SESSION_START.toISOString(),
      endsAt: WEEKLY_SESSION_END.toISOString(),
      recurrence: 'none',
    });

    // Assert
    expect(rbac.can).toHaveBeenCalledWith(ORGANIZER_ID, SERVER_ID, 'manage_assignments');
    expect(result.id).toBe(SESSION_ID);
    expect(result.title).toBe('Weekly Study');
    expect(result.organizer.userId).toBe(ORGANIZER_ID);
    // wave-44 DTO fields present
    expect(result.createdAt).toBe(NOW.toISOString());
    expect(result.updatedAt).toBe(NOW.toISOString());
  });

  it('throws 403 ForbiddenException when non-organizer calls createSession', async () => {
    // Arrange
    rbac.can.mockResolvedValue(false);

    // Act + Assert
    await expect(
      service.createSession(SERVER_ID, MEMBER_ID, {
        title: 'Unauthorized',
        startsAt: WEEKLY_SESSION_START.toISOString(),
        endsAt: WEEKLY_SESSION_END.toISOString(),
        recurrence: 'none',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('throws 400 BadRequestException when endsAt <= startsAt', async () => {
    // Arrange
    const startsAt = new Date('2026-07-05T10:00:00Z');
    const endsAt = new Date('2026-07-05T09:00:00Z'); // before startsAt

    // Act + Assert
    await expect(
      service.createSession(SERVER_ID, ORGANIZER_ID, {
        title: 'Bad Timing',
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        recurrence: 'none',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(mockInsert).not.toHaveBeenCalled();
  });
});
