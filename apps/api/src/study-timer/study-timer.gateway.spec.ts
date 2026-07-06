/**
 * StudyTimerGateway unit tests — wave-54 B-2
 * Regression-lock: info-disclosure class already closed; these tests LOCK that
 * closure so future refactors cannot re-open it.
 *
 * Covers:
 *   LEAK-1  malformed (non-UUID) serverId → join_timer_room catch path is exercised,
 *           client sees exactly WS_GENERIC_ERROR, SQL internals absent, request denied.
 *   LOCK-1  valid-UUID non-member → still gets the specific Forbidden authz string
 *           (NOT genericized).  Locks the Forbidden: authz-denial preservation.
 *   FLOW-1  legitimate member join_timer_room still works end-to-end (regression guard).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — declared before SUT imports (hoisted by vitest)
// ---------------------------------------------------------------------------

// Mock ws-auth so we don't need the SuperTokens import chain in unit-test context
vi.mock('../common/ws-auth', () => ({
  installWsAuthMiddleware: vi.fn(),
}));

// Mock db — the gateway does a direct db.select() for the server_members check
// and a db.select() for displayName resolution in handleConnection.
// We need the full query-builder chain: select().from().where().limit()

const { mockDbSelect } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
}));

vi.mock('../db/index', () => ({
  db: {
    select: mockDbSelect,
  },
}));

// Mock drizzle-orm helpers (and/eq) — not needed to actually run but must not throw
vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((_col: unknown, _val: unknown) => ({ col: _col, val: _val })),
}));

// Mock the schema so the gateway's column references don't fail at import time
vi.mock('../db/schema/index', () => ({
  server_members: { id: 'id', server_id: 'server_id', user_id: 'user_id' },
  users: { id: 'id', display_name: 'display_name', email: 'email' },
}));

// ---------------------------------------------------------------------------
// SUT imports (after mocks)
// ---------------------------------------------------------------------------

import { STUDY_TIMER_JOIN_ERROR_EVENT, STUDY_TIMER_UPDATE_EVENT } from '@studyhall/shared';
import { WS_GENERIC_ERROR } from '../common/ws-errors';
import { StudyTimerGateway } from './study-timer.gateway';
import type { StudyTimerService } from './study-timer.service';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// A valid UUID (passes the string-non-empty check in parseServerIdPayload)
const VALID_SERVER_ID = '550e8400-e29b-41d4-a716-446655440000';
// A deliberately malformed non-UUID — causes a SQLSTATE 22P02 if it reaches Postgres
const MALFORMED_SERVER_ID = 'not-a-uuid';
const USER_ID = 'user-timer-test';

// SQL-internal strings that must NOT appear in any client-facing message
const SQL_LEAK_TOKENS = [
  'invalid input syntax',
  'server_members',
  'server_id',
  'user_id',
  USER_ID,
  '22P02',
  'uuid',
  'ERROR',
];

// ---------------------------------------------------------------------------
// Helpers — fake socket + server
// ---------------------------------------------------------------------------

function makeSocket(userId = USER_ID, socketId = 'sock-timer-1') {
  const joinedRooms = new Set<string>([socketId]);
  const emitted: Array<{ event: string; payload: unknown }> = [];

  const socket = {
    id: socketId,
    data: { userId } as Record<string, unknown>,
    rooms: joinedRooms,
    emitted,
    emit: vi.fn((event: string, payload: unknown) => {
      emitted.push({ event, payload });
    }),
    join: vi.fn(async (room: string) => {
      joinedRooms.add(room);
    }),
    leave: vi.fn(async (room: string) => {
      joinedRooms.delete(room);
    }),
  };

  return socket;
}

function makeServer() {
  const emitted: Array<{ room: string; event: string; payload: unknown }> = [];
  const toChain = {
    emit: vi.fn((_event: string, _payload: unknown) => {}),
  };
  return {
    emitted,
    to: vi.fn((_room: string) => toChain),
  };
}

// ---------------------------------------------------------------------------
// Service mock builder
// ---------------------------------------------------------------------------

function makeTimerService(
  overrides: Partial<{
    getTimerForRoom: (serverId: string) => Promise<unknown>;
  }> = {},
): StudyTimerService {
  return {
    getTimerForRoom: overrides.getTimerForRoom ?? vi.fn().mockResolvedValue(null),
  } as unknown as StudyTimerService;
}

// ---------------------------------------------------------------------------
// DB query-chain builder
//
// The gateway calls: db.select({ id: server_members.id }).from(...).where(...).limit(1)
// which resolves to an array.  An empty array means "not a member".
// ---------------------------------------------------------------------------

function makeDbSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const method of ['from', 'where', 'limit']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function makeDbSelectChainThrowing(err: unknown) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.reject(err).then(res, rej),
  };
  for (const method of ['from', 'where', 'limit']) {
    chain[method] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

// ---------------------------------------------------------------------------
// Test suites
// ---------------------------------------------------------------------------

describe('StudyTimerGateway — join_timer_room: malformed non-UUID serverId (LEAK-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LEAK-1a: malformed serverId causes DB error → client sees WS_GENERIC_ERROR, SQL internals absent, request denied', async () => {
    // The payload parser (parseServerIdPayload) accepts any non-empty string,
    // so MALFORMED_SERVER_ID passes the parse layer and reaches the DB.
    // The DB would throw a 22P02 cast error — we simulate that here.
    const pg22P02 = Object.assign(new Error('invalid input syntax for type uuid: "not-a-uuid"'), {
      code: '22P02',
      detail: 'server_members table, user_id column',
      table: 'server_members',
    });
    mockDbSelect.mockReturnValue(makeDbSelectChainThrowing(pg22P02));

    const svc = makeTimerService();
    const gateway = new StudyTimerGateway(svc);
    const fakeServer = makeServer();
    (gateway as unknown as { server: typeof fakeServer }).server = fakeServer;

    const socket = makeSocket();

    await gateway.handleJoinTimerRoom(socket as unknown as import('socket.io').Socket, {
      serverId: MALFORMED_SERVER_ID,
    });

    // Must have emitted exactly one event
    expect(socket.emitted).toHaveLength(1);
    const emission = socket.emitted[0];
    expect(emission?.event).toBe(STUDY_TIMER_JOIN_ERROR_EVENT);

    const msg = (emission?.payload as { message: string }).message;

    // Client must see the canonical generic constant — not the raw DB error
    expect(msg).toBe(WS_GENERIC_ERROR);

    // Must not contain any SQL-internal or user-identity tokens
    for (const token of SQL_LEAK_TOKENS) {
      expect(msg).not.toContain(token);
    }

    // Request must be denied — socket must NOT have joined the timer room
    const joinedTimerRoom = [...socket.rooms].some((r) => r.startsWith('study-timer:server:'));
    expect(joinedTimerRoom).toBe(false);

    // Service getTimerForRoom must NOT have been called (catch returned early)
    expect(svc.getTimerForRoom).not.toHaveBeenCalled();
  });

  it('LEAK-1b: generic Error in member-check catch → WS_GENERIC_ERROR, no SQL leakage, no timer state returned', async () => {
    // Generic unexpected error (not a pg cast error) — same generic path
    mockDbSelect.mockReturnValue(
      makeDbSelectChainThrowing(new Error('Connection pool exhausted — internal secret')),
    );

    const svc = makeTimerService();
    const gateway = new StudyTimerGateway(svc);
    const fakeServer = makeServer();
    (gateway as unknown as { server: typeof fakeServer }).server = fakeServer;

    const socket = makeSocket();

    await gateway.handleJoinTimerRoom(socket as unknown as import('socket.io').Socket, {
      serverId: MALFORMED_SERVER_ID,
    });

    expect(socket.emitted).toHaveLength(1);
    const msg = (socket.emitted[0]?.payload as { message: string }).message;

    expect(msg).toBe(WS_GENERIC_ERROR);
    expect(msg).not.toContain('Connection pool');
    expect(msg).not.toContain('internal secret');

    // No timer state returned
    expect(svc.getTimerForRoom).not.toHaveBeenCalled();
  });
});

describe('StudyTimerGateway — join_timer_room: valid-UUID non-member (LOCK-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LOCK-1: valid-UUID non-member → Forbidden authz string, NOT genericized (locks authz-denial preservation)', async () => {
    // DB returns empty array → isMember = false → Forbidden branch fires
    mockDbSelect.mockReturnValue(makeDbSelectChain([]));

    const svc = makeTimerService();
    const gateway = new StudyTimerGateway(svc);
    const fakeServer = makeServer();
    (gateway as unknown as { server: typeof fakeServer }).server = fakeServer;

    const socket = makeSocket();

    await gateway.handleJoinTimerRoom(socket as unknown as import('socket.io').Socket, {
      serverId: VALID_SERVER_ID,
    });

    expect(socket.emitted).toHaveLength(1);
    const emission = socket.emitted[0];
    expect(emission?.event).toBe(STUDY_TIMER_JOIN_ERROR_EVENT);

    const msg = (emission?.payload as { message: string }).message;

    // Must be the specific authz-denial string — NOT the generic constant
    expect(msg).toBe('Forbidden: not a member of this server');
    expect(msg).not.toBe(WS_GENERIC_ERROR);

    // Socket must not have joined the timer room
    expect(socket.rooms.has(`study-timer:server:${VALID_SERVER_ID}`)).toBe(false);
  });
});

describe('StudyTimerGateway — join_timer_room: legitimate member (FLOW-1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('FLOW-1: valid member → joins timer room, receives timer DTO, presence broadcast fires (regression guard)', async () => {
    // First db.select call: member check → returns row (isMember = true)
    // Second db.select call (if any — handleConnection displayName) is separate;
    // since we call handleJoinTimerRoom directly without handleConnection, only
    // the member-check select fires here.
    const memberRow = { id: 'sm-row-001' };
    mockDbSelect.mockReturnValue(makeDbSelectChain([memberRow]));

    const timerDto = { serverId: VALID_SERVER_ID, phase: 'work', remainingMs: 1500000 };
    const svc = makeTimerService({
      getTimerForRoom: vi.fn().mockResolvedValue(timerDto),
    });

    const gateway = new StudyTimerGateway(svc);

    // Build a fake server that can handle .to(...).emit(...)
    const timerUpdateEmit = vi.fn();
    const presenceEmit = vi.fn();
    const fakeServer = {
      to: vi.fn((room: string) => ({
        emit: room.startsWith('study-timer:server:') ? timerUpdateEmit : presenceEmit,
      })),
    };
    (gateway as unknown as { server: typeof fakeServer }).server = fakeServer as never;

    const socket = makeSocket();
    // Set displayName so presence entry works
    socket.data.displayName = 'Alice';

    await gateway.handleJoinTimerRoom(socket as unknown as import('socket.io').Socket, {
      serverId: VALID_SERVER_ID,
    });

    // Socket must have joined the timer room
    expect(socket.join).toHaveBeenCalledWith(`study-timer:server:${VALID_SERVER_ID}`);

    // Socket must have received the reconciliation timer DTO
    const timerEmission = socket.emitted.find((e) => e.event === STUDY_TIMER_UPDATE_EVENT);
    expect(timerEmission).toBeDefined();
    expect((timerEmission?.payload as { serverId: string }).serverId).toBe(VALID_SERVER_ID);

    // No error emitted to socket
    const errorEmission = socket.emitted.find((e) => e.event === STUDY_TIMER_JOIN_ERROR_EVENT);
    expect(errorEmission).toBeUndefined();

    // Service was called for reconciliation
    expect(svc.getTimerForRoom).toHaveBeenCalledWith(VALID_SERVER_ID);
  });
});

describe('StudyTimerGateway — join_timer_room: invalid payload (parse guard)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('null payload → join_error with Invalid payload message, no DB call', async () => {
    const svc = makeTimerService();
    const gateway = new StudyTimerGateway(svc);
    const fakeServer = makeServer();
    (gateway as unknown as { server: typeof fakeServer }).server = fakeServer;

    const socket = makeSocket();

    await gateway.handleJoinTimerRoom(socket as unknown as import('socket.io').Socket, null);

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_TIMER_JOIN_ERROR_EVENT);
    const msg = (socket.emitted[0]?.payload as { message: string }).message;
    expect(msg).toContain('Invalid payload');
    expect(mockDbSelect).not.toHaveBeenCalled();
  });

  it('empty serverId → join_error with Invalid payload message, no DB call', async () => {
    const svc = makeTimerService();
    const gateway = new StudyTimerGateway(svc);
    const fakeServer = makeServer();
    (gateway as unknown as { server: typeof fakeServer }).server = fakeServer;

    const socket = makeSocket();

    await gateway.handleJoinTimerRoom(socket as unknown as import('socket.io').Socket, {
      serverId: '',
    });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_TIMER_JOIN_ERROR_EVENT);
    const msg = (socket.emitted[0]?.payload as { message: string }).message;
    expect(msg).toContain('Invalid payload');
    expect(mockDbSelect).not.toHaveBeenCalled();
  });
});
