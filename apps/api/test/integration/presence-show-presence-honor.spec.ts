/**
 * Integration test: wave-80 show_presence HONOR — TWO-SUBJECT presence assertion.
 *
 * LOAD-BEARING (the whole wave): this proves the presence-visibility honor at the
 * level that matters — a co-member B watching user A stops seeing A online the
 * moment A flips show_presence=false, WITHOUT A reconnecting. A single-client /
 * DB-only assertion would be coverage theater; here we assert the actual socket
 * event delivered to the *co-member* B.
 *
 * Why a room-routing Server double rather than socket.io-client:
 *   The WS-upgrade auth middleware validates SuperTokens sessions, which do not
 *   exist in the pg-only CI harness, and socket.io-client is not a dependency.
 *   So we drive the REAL PresenceGateway + REAL PresenceService (in-memory
 *   ref-count) + REAL PrivacyService (real DB write) against a faithful in-memory
 *   socket.io Server double that implements genuine room routing: .to(room).emit()
 *   delivers ONLY to sockets that joined `room`. Two DISTINCT subject sockets (A
 *   and B) are registered; assertions are on the events B's socket RECEIVES — a
 *   genuine two-subject proof, not a self-emit check.
 *
 *   The cross-module trigger under test is REAL: privacyService.updatePrivacy()
 *   writes show_presence to Postgres and then calls
 *   presenceGateway.onShowPresenceChanged(), which is exactly the production path.
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import so the SUT db singleton
 * resolves to the test DB before any SUT module is imported.
 */

// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PresenceGateway } from '../../src/presence/presence.gateway';
import { PresenceService } from '../../src/presence/presence.service';
import { AppendPrivacyEventService } from '../../src/privacy/append-privacy-event.service';
import { PrivacyService } from '../../src/privacy/privacy.service';

const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

const SERVER_A = '00000000-0000-0000-0080-000000000001';
const USER_A = 'sp-user-a'; // the subject who toggles presence
const USER_B = 'sp-user-b'; // co-member watching A
const USER_C = 'sp-user-c'; // a NEW peer who connects while A is hidden

// ---------------------------------------------------------------------------
// Faithful in-memory socket.io Server double with REAL room routing.
//
// Sockets register via server.__register(socket). .to(room).emit(event, payload)
// delivers to every registered socket whose data.__rooms Set contains `room`,
// invoking that socket's .emit(event, payload). fetchSockets() returns all
// registered sockets. This models the exact fan-out semantics the gateway relies
// on so a co-member in the room genuinely RECEIVES the event.
// ---------------------------------------------------------------------------

interface FakeSocket {
  id: string;
  data: Record<string, unknown> & { __rooms: Set<string> };
  join: (room: string) => Promise<void>;
  leave: (room: string) => Promise<void>;
  emit: ReturnType<typeof vi.fn>;
  // socket.to(room) — used by handleConnection online-emit (excludes self)
  to: (room: string) => { emit: (event: string, payload: unknown) => void };
  disconnect: ReturnType<typeof vi.fn>;
}

function createRoutingServer() {
  const registered: FakeSocket[] = [];

  const deliverToRoom = (room: string, event: string, payload: unknown, exclude?: string) => {
    for (const s of registered) {
      if (exclude && s.id === exclude) continue;
      if (s.data.__rooms.has(room)) {
        s.emit(event, payload);
      }
    }
  };

  const server = {
    use: vi.fn(),
    to: (room: string) => ({
      emit: (event: string, payload: unknown) => deliverToRoom(room, event, payload),
    }),
    fetchSockets: async () => registered,
    __register(socket: FakeSocket) {
      registered.push(socket);
    },
    __deliverToRoom: deliverToRoom,
  };

  return server;
}

function makeSocket(id: string, userId: string): FakeSocket {
  const rooms = new Set<string>();
  const socket: FakeSocket = {
    id,
    data: { userId, __rooms: rooms } as FakeSocket['data'],
    join: async (room: string) => {
      rooms.add(room);
    },
    leave: async (room: string) => {
      rooms.delete(room);
    },
    emit: vi.fn(),
    // socket.to(room) excludes THIS socket — mirrors socket.io semantics
    to: (room: string) => ({
      emit: (event: string, payload: unknown) =>
        (socketServer.__deliverToRoom as typeof deliverToRoomRef)(room, event, payload, id),
    }),
    disconnect: vi.fn(),
  };
  return socket;
}

// Bound lazily in beforeEach; makeSocket closes over these for socket.to().
let socketServer: ReturnType<typeof createRoutingServer>;
let deliverToRoomRef: ReturnType<typeof createRoutingServer>['__deliverToRoom'];

// ---------------------------------------------------------------------------

describe.skipIf(SKIP)('wave-80 show_presence honor — two-subject presence assertion', () => {
  let presenceService: PresenceService;
  let gateway: PresenceGateway;
  let privacyService: PrivacyService;

  beforeAll(async () => {
    await setupHarness();
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();

    // Real in-memory presence ref-count service (real DB queries for co-members
    // + show_presence batch).
    presenceService = new PresenceService();

    // Real gateway; RbacService is unused on the presence paths under test, so a
    // minimal stub is sufficient.
    gateway = new PresenceGateway(presenceService, {
      canViewChannelById: vi.fn().mockResolvedValue(true),
      // biome-ignore lint/suspicious/noExplicitAny: minimal RbacService stub
    } as any);

    // Attach the routing Server double as the gateway's WebSocketServer.
    socketServer = createRoutingServer();
    deliverToRoomRef = socketServer.__deliverToRoom;
    // biome-ignore lint/suspicious/noExplicitAny: injecting the Server double
    (gateway as any).server = socketServer as any;

    // Real privacy service wired with the real gateway — this is the production
    // cross-module path (updatePrivacy → onShowPresenceChanged).
    privacyService = new PrivacyService(new AppendPrivacyEventService(), gateway);

    // Topology: A and B share SERVER_A (co-members). A defaults show_presence=true.
    await insertFixtureUser(USER_A, 'sp-user-a@test.local');
    await insertFixtureUser(USER_B, 'sp-user-b@test.local');
    await insertFixtureUser(USER_C, 'sp-user-c@test.local');
    await insertFixtureServer(SERVER_A, USER_A, 'Presence Honor Server');
    await insertFixtureMembership(SERVER_A, USER_A);
    await insertFixtureMembership(SERVER_A, USER_B);
    await insertFixtureMembership(SERVER_A, USER_C);
  });

  // Helper: register a socket on the routing server and drive handleConnection.
  async function connect(socket: FakeSocket): Promise<void> {
    socketServer.__register(socket);
    // biome-ignore lint/suspicious/noExplicitAny: FakeSocket satisfies the Socket surface used
    await gateway.handleConnection(socket as any);
  }

  // -----------------------------------------------------------------------
  // LOAD-BEARING: A online, B watching → A toggles show_presence=false via the
  // privacy path → B RECEIVES presence:offline for A, WITHOUT A reconnecting.
  // Then A toggles back on → B RECEIVES presence:online for A.
  // -----------------------------------------------------------------------
  it('B receives presence:offline when A hides presence (proactive, no reconnect); presence:online when A un-hides', async () => {
    const sockA = makeSocket('sock-a', USER_A);
    const sockB = makeSocket('sock-b', USER_B);

    // B connects first, then A connects (A's online emit reaches B's room).
    await connect(sockB);
    await connect(sockA);

    // Sanity: A is online in the ref-count and B received A's online event on connect.
    expect(presenceService.isOnline(USER_A)).toBe(true);
    const bOnlineOnConnect = sockB.emit.mock.calls.find(
      (c) => c[0] === 'presence:online' && (c[1] as { userId: string }).userId === USER_A,
    );
    expect(bOnlineOnConnect).toBeDefined();

    sockB.emit.mockClear();

    // ── A hides presence via the REAL privacy path (DB write + proactive emit) ──
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: false,
    });

    // B must have RECEIVED presence:offline for A — WITHOUT A reconnecting.
    const bOffline = sockB.emit.mock.calls.find(
      (c) => c[0] === 'presence:offline' && (c[1] as { userId: string }).userId === USER_A,
    );
    expect(bOffline).toBeDefined();

    sockB.emit.mockClear();

    // ── A un-hides presence → B receives presence:online for A ──
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: true,
    });

    const bOnline = sockB.emit.mock.calls.find(
      (c) => c[0] === 'presence:online' && (c[1] as { userId: string }).userId === USER_A,
    );
    expect(bOnline).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // Snapshot honor: a NEW peer C connecting while A is hidden does NOT see A
  // online in its snapshot (co-members' show_presence batch gate).
  // -----------------------------------------------------------------------
  it('a new peer connecting while A is hidden does NOT see A online in the snapshot', async () => {
    const sockA = makeSocket('sock-a', USER_A);
    await connect(sockA);
    expect(presenceService.isOnline(USER_A)).toBe(true);

    // A hides presence (DB write). A stays connected.
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: false,
    });

    // C connects now — build C's snapshot of co-members.
    const sockC = makeSocket('sock-c', USER_C);
    await connect(sockC);

    const snapshotCall = sockC.emit.mock.calls.find((c) => c[0] === 'presence:snapshot');
    expect(snapshotCall).toBeDefined();
    const snapshot = snapshotCall?.[1] as { members: Array<{ userId: string; status: string }> };

    const aEntry = snapshot.members.find((m) => m.userId === USER_A);
    // A is present in the co-member list but reported offline (hidden), NOT online.
    expect(aEntry?.status).not.toBe('online');
  });

  // -----------------------------------------------------------------------
  // F2 (wave-80 B-6): connect-vs-toggle race. A toggles OFF while a NEW tab for
  // A connects and (under the old code) broadcasts A online from a pre-commit
  // read; the toggle's fetchSockets() snapshot could miss the just-connecting
  // socket, leaving co-member B seeing a hidden A online. With the fix, after
  // the race settles B must end up seeing A OFFLINE (a reconciling re-check
  // against the authoritative flag closes the window).
  //
  // We reproduce the WORST ordering deterministically: the DB is committed to
  // hidden (as the toggle write would leave it), then a brand-new A socket
  // connects. In the pre-fix code the connect's online-broadcast would fire and
  // no later step would undo it; with the fix, connect's reconcileHiddenUser()
  // re-reads the committed hidden flag and emits a corrective offline so B is
  // never left seeing A online.
  // -----------------------------------------------------------------------
  it('F2 race: A hidden in DB then a new A tab connects → B ends up seeing A OFFLINE, not online', async () => {
    // B is watching. A is online via an initial tab (visible).
    const sockB = makeSocket('sock-b', USER_B);
    const sockA1 = makeSocket('sock-a1', USER_A);
    await connect(sockB);
    await connect(sockA1);
    expect(presenceService.isOnline(USER_A)).toBe(true);

    // A toggles OFF via the real privacy path (DB write + proactive emit).
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: false,
    });

    sockB.emit.mockClear();

    // The race: a NEW A tab connects AFTER the hidden flag committed. Its own
    // connect-time read now sees hidden and it must NOT broadcast A online; even
    // if it (raced) did, the reconciling re-check emits a corrective offline.
    const sockA2 = makeSocket('sock-a2', USER_A);
    await connect(sockA2);

    // B must NOT be left seeing A online after the race settles.
    const bOnlineAfter = sockB.emit.mock.calls.find(
      (c) => c[0] === 'presence:online' && (c[1] as { userId: string }).userId === USER_A,
    );
    expect(bOnlineAfter).toBeUndefined();

    // And if any online had been (wrongly) emitted mid-race, a corrective offline
    // reconciles it — so the LAST A-presence event B saw is offline, never online.
    const aEvents = sockB.emit.mock.calls.filter(
      (c) =>
        (c[0] === 'presence:online' || c[0] === 'presence:offline') &&
        (c[1] as { userId: string }).userId === USER_A,
    );
    if (aEvents.length > 0) {
      expect(aEvents[aEvents.length - 1]?.[0]).toBe('presence:offline');
    }
  });

  // -----------------------------------------------------------------------
  // Own-visibility-only: a hidden user STILL receives co-members' presence.
  // A hides, then B comes online — A must still receive B's presence:online.
  // -----------------------------------------------------------------------
  it('a hidden user still receives co-members presence (inbound view unaffected)', async () => {
    const sockA = makeSocket('sock-a', USER_A);
    await connect(sockA);

    // A hides its own presence.
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: false,
    });

    sockA.emit.mockClear();

    // B (visible) comes online — A must RECEIVE B's presence:online.
    const sockB = makeSocket('sock-b', USER_B);
    await connect(sockB);

    const aReceivesBOnline = sockA.emit.mock.calls.find(
      (c) => c[0] === 'presence:online' && (c[1] as { userId: string }).userId === USER_B,
    );
    expect(aReceivesBOnline).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // Offline-gate honor: a user connected with show_presence=false does NOT emit
  // presence:offline to co-members on disconnect (cached flag, no DB query).
  // -----------------------------------------------------------------------
  it('a user who connected already-hidden emits no online AND no offline to co-members', async () => {
    // Seed A as hidden BEFORE connecting.
    await privacyService.updatePrivacy(USER_A, {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: false,
    });

    const sockB = makeSocket('sock-b', USER_B);
    await connect(sockB);
    sockB.emit.mockClear();

    // A connects while hidden — no online event should reach B.
    const sockA = makeSocket('sock-a', USER_A);
    await connect(sockA);
    const bOnline = sockB.emit.mock.calls.find(
      (c) => c[0] === 'presence:online' && (c[1] as { userId: string }).userId === USER_A,
    );
    expect(bOnline).toBeUndefined();

    sockB.emit.mockClear();

    // A disconnects — no offline event should reach B (cached showPresence=false).
    // biome-ignore lint/suspicious/noExplicitAny: FakeSocket satisfies the Socket surface used
    await gateway.handleDisconnect(sockA as any);
    const bOffline = sockB.emit.mock.calls.find(
      (c) => c[0] === 'presence:offline' && (c[1] as { userId: string }).userId === USER_A,
    );
    expect(bOffline).toBeUndefined();
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message.
if (SKIP) {
  describe('wave-80 show_presence honor — two-subject presence assertion', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
