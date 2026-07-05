/**
 * StudyRoomGateway unit tests — wave-52 fix: subscribe_server_rooms handshake
 *                               wave-53 fix: UUID-format guard + generic error mapping
 *
 * Covers the three ACs from the T-5 skeleton-stuck bug fix:
 *
 *   AC-1  subscribe_server_rooms: a client that subscribes WITHOUT joining a room
 *         receives STUDY_ROOM_ROOMS_EVENT immediately with the current open-rooms
 *         list (including empty array when no rooms exist).
 *
 *   AC-2  subscribed-but-not-joined client receives STUDY_ROOM_ROOMS_EVENT
 *         broadcast when ANOTHER member creates a room (live list stays current).
 *
 *   AC-3  re-subscribe is idempotent: second subscribe re-emits the current list,
 *         does NOT double-join study-room:server:<serverId>.
 *
 * Additional coverage:
 *   AC-4  subscribe_server_rooms: non-member → join_error emitted; socket does NOT
 *         join the server channel.
 *   AC-5  subscribe_server_rooms: invalid payload → join_error emitted.
 *
 * Wave-53 UUID guard + error-mapping coverage:
 *   UUID-1  non-UUID serverId to subscribe_server_rooms → generic join_error,
 *           no DB call, error does not contain SQL internals.
 *   UUID-2  non-UUID serverId to create_focus_room → generic join_error, no DB call.
 *   UUID-3  valid UUID serverId, caller not a member → exact ForbiddenException message
 *           forwarded (not genericized).
 *   UUID-4  unexpected error in handler → generic fallback to client, logger called.
 *   UUID-5  valid member flow still succeeds (regression guard).
 *
 * Mocking strategy:
 *   StudyRoomService mocked at the boundary — only the methods called by the
 *   gateway under test are stubbed.  Socket.IO Server + Socket objects are
 *   lightweight hand-rolled fakes with the minimal interface the gateway uses.
 *   No real NestJS bootstrapping; gateway is instantiated directly.
 *   installWsAuthMiddleware is vi.mock'd to a no-op to avoid the SuperTokens
 *   import chain in unit-test context.
 */

import { ForbiddenException } from '@nestjs/common';
import type { Logger } from '@nestjs/common';
import {
  STUDY_ROOM_JOIN_ERROR_EVENT,
  STUDY_ROOM_ROOMS_EVENT,
  STUDY_ROOM_SUBSCRIBE_VERB,
} from '@studyhall/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks — must be declared before SUT imports
// ---------------------------------------------------------------------------

vi.mock('../common/ws-auth', () => ({
  installWsAuthMiddleware: vi.fn(),
}));

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// SUT imports
// ---------------------------------------------------------------------------

import { StudyRoomGateway } from './study-room.gateway';

// ---------------------------------------------------------------------------
// Fake Socket + Server builders
// ---------------------------------------------------------------------------

interface FakeSocket {
  id: string;
  data: Record<string, unknown>;
  rooms: Set<string>;
  emitted: Array<{ event: string; payload: unknown }>;
  emit: ReturnType<typeof vi.fn>;
  join: ReturnType<typeof vi.fn>;
  leave: ReturnType<typeof vi.fn>;
}

function makeSocket(userId: string, socketId = `sock-${userId}`): FakeSocket {
  const joinedRooms = new Set<string>([socketId]); // Socket.IO always includes own id

  const socket: FakeSocket = {
    id: socketId,
    data: { userId },
    rooms: joinedRooms,
    emitted: [],
    emit: vi.fn((event: string, payload: unknown) => {
      socket.emitted.push({ event, payload });
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

interface FakeServer {
  serverEmitted: Map<string, Array<{ event: string; payload: unknown }>>;
  to: ReturnType<typeof vi.fn>;
}

function makeServer(): FakeServer {
  const serverEmitted = new Map<string, Array<{ event: string; payload: unknown }>>();

  const toChain = {
    emit: vi.fn((_event: string, _payload: unknown) => {
      // noop in unit tests — broadcast target is the server channel
    }),
  };

  const server: FakeServer = {
    serverEmitted,
    to: vi.fn((_room: string) => toChain),
  };

  return server;
}

// ---------------------------------------------------------------------------
// Service mock builder
// ---------------------------------------------------------------------------

function makeServiceMock(
  overrides: Partial<{
    getOpenRooms: (
      userId: string,
      serverId: string,
    ) => Promise<import('@studyhall/shared').FocusRoom[]>;
    resolveUserProfile: (
      userId: string,
    ) => Promise<{ displayName: string; avatarUrl: string | null }>;
  }> = {},
) {
  return {
    getOpenRooms: overrides.getOpenRooms ?? vi.fn().mockResolvedValue([]),
    resolveUserProfile:
      overrides.resolveUserProfile ??
      vi.fn().mockResolvedValue({ displayName: 'Test', avatarUrl: null }),
    registerTimerCallback: vi.fn(),
    joinRoom: vi.fn(),
    createRoom: vi.fn(),
    leaveRoom: vi.fn(),
    leaveAllRoomsForSocket: vi.fn().mockReturnValue([]),
    roomsListFor: vi.fn().mockReturnValue([]),
    selfHealRoomTimerIfOverdue: vi.fn(),
    startRoomTimer: vi.fn(),
    pauseRoomTimer: vi.fn(),
    resetRoomTimer: vi.fn(),
    configureRoomTimer: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

// SERVER_ID must be a valid UUID — the wave-53 parse-layer guard rejects non-UUID serverIds
// before any service call. USER_A/USER_B are SuperTokens opaque session IDs, NOT uuids.
const SERVER_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_A = 'user-gw-A';
const USER_B = 'user-gw-B';

const OPEN_ROOM = {
  id: 'room-001',
  serverId: SERVER_ID,
  name: 'Study Lounge',
  count: 1,
};

describe('StudyRoomGateway — subscribe_server_rooms handshake (wave-52 skeleton fix)', () => {
  let gateway: StudyRoomGateway;
  let fakeServer: FakeServer;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeServer = makeServer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // -------------------------------------------------------------------------
  // AC-1: subscribe without joining → receives current rooms list immediately
  // -------------------------------------------------------------------------

  it('AC-1a: member subscribes, no rooms exist → receives STUDY_ROOM_ROOMS_EVENT with empty array', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockResolvedValue([]),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);
    const payload = { serverId: SERVER_ID };

    await gateway.handleSubscribeServerRooms(socket as never, payload);

    // Socket joined the server channel
    expect(socket.join).toHaveBeenCalledWith(`study-room:server:${SERVER_ID}`);

    // Exactly one event emitted to the subscribing socket
    expect(socket.emitted).toHaveLength(1);
    const [emission] = socket.emitted;
    expect(emission?.event).toBe(STUDY_ROOM_ROOMS_EVENT);
    expect(emission?.payload).toEqual({ serverId: SERVER_ID, rooms: [] });
  });

  it('AC-1b: member subscribes, one room exists → receives STUDY_ROOM_ROOMS_EVENT with that room', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockResolvedValue([OPEN_ROOM]),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    expect(socket.emitted).toHaveLength(1);
    const [emission] = socket.emitted;
    expect(emission?.event).toBe(STUDY_ROOM_ROOMS_EVENT);
    expect(emission?.payload).toEqual({ serverId: SERVER_ID, rooms: [OPEN_ROOM] });
  });

  // -------------------------------------------------------------------------
  // AC-2: subscribed client receives broadcast when another member creates a room
  //
  // The gateway's broadcastRoomsUpdate emits to `study-room:server:<serverId>`.
  // After subscribe_server_rooms, socket is in that channel.  We verify that
  // the socket DID join the server channel (so it would receive real broadcasts),
  // and that broadcastRoomsUpdate targets the correct channel.
  // -------------------------------------------------------------------------

  it('AC-2: subscribed socket joins study-room:server channel → receives all subsequent broadcastRoomsUpdate calls', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockResolvedValue([]),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socketA = makeSocket(USER_A);

    // Subscriber connects and subscribes (no room join)
    await gateway.handleSubscribeServerRooms(socketA as never, { serverId: SERVER_ID });

    // Verify socket is in the server channel
    expect(socketA.rooms.has(`study-room:server:${SERVER_ID}`)).toBe(true);

    // Simulate another member creating a room → gateway calls broadcastRoomsUpdate
    // which emits to study-room:server:<serverId>.  We verify the channel target.
    const broadcastRoomsUpdate = (
      gateway as unknown as {
        broadcastRoomsUpdate: (serverId: string, rooms: unknown[]) => void;
      }
    ).broadcastRoomsUpdate.bind(gateway);

    broadcastRoomsUpdate(SERVER_ID, [OPEN_ROOM]);

    // fakeServer.to should have been called with the server channel
    expect(fakeServer.to).toHaveBeenCalledWith(`study-room:server:${SERVER_ID}`);
  });

  // -------------------------------------------------------------------------
  // AC-3: re-subscribe is idempotent
  // -------------------------------------------------------------------------

  it('AC-3: re-subscribe emits current list again; socket.join called at most once per channel', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi
        .fn()
        .mockResolvedValueOnce([]) // first subscribe: empty
        .mockResolvedValueOnce([OPEN_ROOM]), // second subscribe: one room appeared
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    // First subscribe
    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    // Second subscribe (reconnect or duplicate call)
    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    // socket.join should have been called ONCE (ensureServerRoom guards duplicates)
    expect(socket.join).toHaveBeenCalledTimes(1);
    expect(socket.join).toHaveBeenCalledWith(`study-room:server:${SERVER_ID}`);

    // But two emissions — one per subscribe call
    const roomsEvents = socket.emitted.filter((e) => e.event === STUDY_ROOM_ROOMS_EVENT);
    expect(roomsEvents).toHaveLength(2);
    // Second emission carries the updated list
    expect(roomsEvents[1]?.payload).toEqual({ serverId: SERVER_ID, rooms: [OPEN_ROOM] });
  });

  // -------------------------------------------------------------------------
  // AC-4: non-member → join_error; socket does NOT join server channel
  // -------------------------------------------------------------------------

  it('AC-4: non-member emits subscribe_server_rooms → join_error; socket not added to server channel', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi
        .fn()
        .mockRejectedValue(new ForbiddenException('You are not a member of this server')),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    // join_error emitted to socket
    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);

    // Socket must NOT have joined the server channel
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.rooms.has(`study-room:server:${SERVER_ID}`)).toBe(false);
  });

  // -------------------------------------------------------------------------
  // AC-5: invalid payload → join_error
  // -------------------------------------------------------------------------

  it('AC-5a: null payload → join_error emitted', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, null);

    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    expect(svc.getOpenRooms).not.toHaveBeenCalled();
  });

  it('AC-5b: missing serverId → join_error emitted', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: '' });

    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    expect(svc.getOpenRooms).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // AC-6: STUDY_ROOM_SUBSCRIBE_VERB const matches expected wire value
  // -------------------------------------------------------------------------

  it('AC-6: STUDY_ROOM_SUBSCRIBE_VERB has the expected wire value', () => {
    expect(STUDY_ROOM_SUBSCRIBE_VERB).toBe('subscribe_server_rooms');
  });

  // -------------------------------------------------------------------------
  // AC-7: broadcast target for STUDY_ROOM_ROOMS_EVENT is the server channel
  //        (not just the acting socket) — protects all subscribed clients
  // -------------------------------------------------------------------------

  it('AC-7: broadcastRoomsUpdate targets study-room:server:<serverId> channel (not a single socket)', () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const broadcastRoomsUpdate = (
      gateway as unknown as {
        broadcastRoomsUpdate: (serverId: string, rooms: unknown[]) => void;
      }
    ).broadcastRoomsUpdate.bind(gateway);

    broadcastRoomsUpdate(SERVER_ID, [OPEN_ROOM]);

    expect(fakeServer.to).toHaveBeenCalledWith(`study-room:server:${SERVER_ID}`);
    // Must NOT target a per-socket room
    const call = (fakeServer.to as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).not.toMatch(/^sock-/);
  });

  // -------------------------------------------------------------------------
  // AC-8: two distinct subscribers both receive rooms-list on subscribe;
  //        both are in the server channel for future broadcasts
  // -------------------------------------------------------------------------

  it('AC-8: two subscribers both receive the current list and both join server channel', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockResolvedValue([OPEN_ROOM]),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socketA = makeSocket(USER_A, 'sock-A');
    const socketB = makeSocket(USER_B, 'sock-B');

    await gateway.handleSubscribeServerRooms(socketA as never, { serverId: SERVER_ID });
    await gateway.handleSubscribeServerRooms(socketB as never, { serverId: SERVER_ID });

    // Both received the rooms event
    expect(socketA.emitted[0]?.event).toBe(STUDY_ROOM_ROOMS_EVENT);
    expect(socketB.emitted[0]?.event).toBe(STUDY_ROOM_ROOMS_EVENT);

    // Both are in the server channel
    expect(socketA.rooms.has(`study-room:server:${SERVER_ID}`)).toBe(true);
    expect(socketB.rooms.has(`study-room:server:${SERVER_ID}`)).toBe(true);
  });
});

// =============================================================================
// Wave-53: UUID-format guard + generic error mapping
// =============================================================================

// SERVER_ID (defined above) is already a valid UUID — reused in these tests.
const VALID_ROOM_ID = '123e4567-e89b-12d3-a456-426614174000';

// SQL-internal strings that must NOT leak to clients
const SQL_LEAK_PATTERNS = [
  'invalid input syntax',
  'server_members',
  'server_id',
  'user_id',
  'uuid',
];

describe('StudyRoomGateway — wave-53 UUID guard + generic error mapping', () => {
  let gateway: StudyRoomGateway;
  let fakeServer: FakeServer;

  beforeEach(() => {
    vi.clearAllMocks();
    fakeServer = makeServer();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // UUID-1: non-UUID serverId to subscribe_server_rooms → parse rejection before DB
  // ---------------------------------------------------------------------------

  it('UUID-1a: non-UUID serverId to subscribe_server_rooms → generic join_error; no DB/service call', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: 'not-a-uuid' });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    // Must not contain any SQL internals
    const msg = (socket.emitted[0]?.payload as { message: string }).message;
    for (const pattern of SQL_LEAK_PATTERNS) {
      expect(msg).not.toContain(pattern);
    }
    // assertMember / getOpenRooms must NOT have been called (parse rejection)
    expect(svc.getOpenRooms).not.toHaveBeenCalled();
  });

  it('UUID-1b: empty serverId to subscribe_server_rooms → generic join_error; no DB call', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: '' });

    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    expect(svc.getOpenRooms).not.toHaveBeenCalled();
  });

  it('UUID-1c: SQL-ish serverId to subscribe_server_rooms → parse rejection; error message clean', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, {
      serverId: "' OR '1'='1",
    });

    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    expect(svc.getOpenRooms).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // UUID-2: non-UUID serverId to create_focus_room → parse rejection before DB
  // ---------------------------------------------------------------------------

  it('UUID-2: non-UUID serverId to create_focus_room → generic join_error; no DB call', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleCreateRoom(socket as never, { serverId: 'bad-id', name: 'Study Room' });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    const msg = (socket.emitted[0]?.payload as { message: string }).message;
    for (const pattern of SQL_LEAK_PATTERNS) {
      expect(msg).not.toContain(pattern);
    }
    expect(svc.createRoom).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // UUID-3: valid UUID serverId, non-member → ForbiddenException message forwarded
  // ---------------------------------------------------------------------------

  it('UUID-3: valid UUID serverId, non-member → exact ForbiddenException message forwarded (not genericized)', async () => {
    const forbiddenMsg = 'You are not a member of this server';
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockRejectedValue(new ForbiddenException(forbiddenMsg)),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    const msg = (socket.emitted[0]?.payload as { message: string }).message;
    expect(msg).toBe(forbiddenMsg);
  });

  // ---------------------------------------------------------------------------
  // UUID-4: unexpected error in handler → generic fallback to client + logger called
  // ---------------------------------------------------------------------------

  it('UUID-4: unexpected internal error → generic fallback to client; logger.error called with detail', async () => {
    const internalError = new Error('internal DB blowup — secret query details here');
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockRejectedValue(internalError),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    // Spy on the logger before the call
    const loggerErrorSpy = vi
      .spyOn((gateway as unknown as { logger: Logger }).logger, 'error')
      .mockImplementation(() => {});

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    const msg = (socket.emitted[0]?.payload as { message: string }).message;
    // Client gets the generic fallback, NOT the raw internal message
    expect(msg).not.toContain('internal DB blowup');
    expect(msg).not.toContain('secret query details');
    // Logger must have been called with the full error detail
    expect(loggerErrorSpy).toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // UUID-5: valid UUID serverId, legitimate member → success (regression guard)
  // ---------------------------------------------------------------------------

  it('UUID-5: valid UUID serverId, legitimate member → STUDY_ROOM_ROOMS_EVENT emitted (regression guard)', async () => {
    const svc = makeServiceMock({
      getOpenRooms: vi.fn().mockResolvedValue([]),
    });
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleSubscribeServerRooms(socket as never, { serverId: SERVER_ID });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_ROOMS_EVENT);
    expect(svc.getOpenRooms).toHaveBeenCalledWith(USER_A, SERVER_ID);
  });

  // ---------------------------------------------------------------------------
  // UUID-6: non-UUID serverId to join_focus_room → parse rejection
  // ---------------------------------------------------------------------------

  it('UUID-6: non-UUID serverId to join_focus_room → generic join_error; joinRoom not called', async () => {
    const svc = makeServiceMock();
    gateway = new StudyRoomGateway(svc as never);
    (gateway as unknown as { server: FakeServer }).server = fakeServer;

    const socket = makeSocket(USER_A);

    await gateway.handleJoinRoom(socket as never, { serverId: 'bad-uuid', roomId: VALID_ROOM_ID });

    expect(socket.emitted).toHaveLength(1);
    expect(socket.emitted[0]?.event).toBe(STUDY_ROOM_JOIN_ERROR_EVENT);
    expect(svc.joinRoom).not.toHaveBeenCalled();
  });
});
