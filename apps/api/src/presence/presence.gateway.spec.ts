/**
 * PresenceGateway unit tests — wave-14 presence layer (T-2 coverage)
 *
 * Gateway unit-testability assessment:
 *   handleConnection() calls `db` directly (displayName lookup) in addition to
 *   PresenceService and RbacService. This makes it integration-shaped and is NOT
 *   unit-tested here — mocking the db inline inside handleConnection would require
 *   a full module-boundary mock of '../db/index' alongside the supertokens mocks,
 *   which the messaging.gateway.spec.ts pattern does not cover (that gateway has no
 *   direct db access). A separate integration test covers handleConnection.
 *
 *   All other event handlers (handleJoinChannel, handleTypingStart, handleTypingStop,
 *   handleDisconnect typing-cleanup path, handleLeaveChannel, emitTypingActive fan-out)
 *   delegate cleanly to PresenceService + RbacService and ARE unit-tested here,
 *   following the messaging.gateway.spec.ts pattern exactly.
 *
 * Covers:
 *   WS-upgrade auth (via installWsAuthMiddleware — same pattern as messaging.gateway.spec):
 *    1. Rejects unauthenticated socket (Session throws → next(Error))
 *    2. Accepts authenticated socket (attaches userId)
 *
 *   handleJoinChannel:
 *    3. Valid access → socket.join called with presence:channel:<channelId>
 *    4. Denied access → socket.join NOT called, error emitted
 *    5. canViewChannelById throws → error emitted, join not called
 *    6. Invalid payload → error emitted immediately, no RBAC call
 *
 *   handleLeaveChannel:
 *    7. Leaves presence:channel:<channelId>, calls stopTyping, removes from typingChannels
 *    8. Invalid payload → error emitted, no leave
 *
 *   handleTypingStart:
 *    9. Valid access → presenceService.startTyping called, emitTypingActive fan-out fires
 *   10. Denied access → error emitted, startTyping NOT called
 *   11. Invalid payload → error emitted, no RBAC call
 *
 *   handleTypingStop:
 *   12. stopTyping called, emitTypingActive fan-out fires
 *   13. Invalid payload → error emitted, no stopTyping
 *
 *   handleDisconnect typing-cleanup:
 *   14. On disconnect with active typingChannels: stopTyping called for each channel,
 *       emitTypingActive fires, then presenceService.disconnect called
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() — define mock functions BEFORE vi.mock() factories run.
// (Same pattern as messaging.gateway.spec.ts)
// ---------------------------------------------------------------------------

const { mockGetSessionWithoutRequestResponse } = vi.hoisted(() => ({
  mockGetSessionWithoutRequestResponse: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock supertokens-node/recipe/session
// ---------------------------------------------------------------------------

vi.mock('supertokens-node/recipe/session', () => ({
  default: {
    getSessionWithoutRequestResponse: mockGetSessionWithoutRequestResponse,
  },
}));

// ---------------------------------------------------------------------------
// Mock supertokens-node/recipe/emailverification
// ---------------------------------------------------------------------------

vi.mock('supertokens-node/recipe/emailverification', () => ({
  default: {
    EmailVerificationClaim: {
      validators: {
        isVerified: vi.fn().mockReturnValue({ id: 'mock-ev-validator' }),
      },
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock db module (needed because PresenceGateway imports db directly for
// handleConnection's displayName lookup — db mock prevents DATABASE_URL errors
// even when handleConnection itself is not unit-tested here)
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

// ---------------------------------------------------------------------------
// Import gateway AFTER mocks are declared
// ---------------------------------------------------------------------------

import { db } from '../db/index';
import type { RbacService } from '../rbac/rbac.service';
import { PresenceGateway } from './presence.gateway';
import { PresenceService } from './presence.service';

// ---------------------------------------------------------------------------
// Socket mock builder
// ---------------------------------------------------------------------------

function makeSocket(cookieHeader?: string, authAccessToken?: string) {
  return {
    id: 'test-socket-id',
    handshake: {
      headers: {
        cookie: cookieHeader,
      },
      auth: authAccessToken !== undefined ? { accessToken: authAccessToken } : {},
    },
    data: {} as Record<string, unknown>,
    join: vi.fn().mockResolvedValue(undefined),
    leave: vi.fn().mockResolvedValue(undefined),
    emit: vi.fn(),
    to: vi.fn(),
    disconnect: vi.fn(),
  };
}

// ---------------------------------------------------------------------------
// PresenceService mock builder
// ---------------------------------------------------------------------------

function makePresenceService(
  overrides: Partial<{
    connect: () => { wentOnline: boolean };
    disconnect: () => { wentOffline: boolean };
    isOnline: () => boolean;
    startTyping: () => void;
    stopTyping: () => void;
    getTypers: () => Array<{ userId: string; displayName: string }>;
    getServerIdsForUser: () => Promise<string[]>;
    getCoMemberUserIds: () => Promise<string[]>;
    getShowPresence: () => Promise<boolean>;
    getShowPresenceBatch: () => Promise<Map<string, boolean>>;
  }> = {},
): PresenceService {
  return {
    connect: vi.fn().mockReturnValue({ wentOnline: false }),
    disconnect: vi.fn().mockReturnValue({ wentOffline: false }),
    isOnline: vi.fn().mockReturnValue(false),
    startTyping: vi.fn(),
    stopTyping: vi.fn(),
    getTypers: vi.fn().mockReturnValue([]),
    getServerIdsForUser: vi.fn().mockResolvedValue([]),
    getCoMemberUserIds: vi.fn().mockResolvedValue([]),
    getShowPresence: vi.fn().mockResolvedValue(true),
    getShowPresenceBatch: vi.fn().mockResolvedValue(new Map<string, boolean>()),
    ...overrides,
  } as unknown as PresenceService;
}

// ---------------------------------------------------------------------------
// RbacService mock builder
// ---------------------------------------------------------------------------

function makeRbacService(canView = true): RbacService {
  return {
    canViewChannelById: vi.fn().mockResolvedValue(canView),
  } as unknown as RbacService;
}

// ---------------------------------------------------------------------------
// Helper: run afterInit middleware and capture next result
// (Same pattern as messaging.gateway.spec.ts)
// ---------------------------------------------------------------------------

async function runMiddleware(
  gateway: PresenceGateway,
  socket: ReturnType<typeof makeSocket>,
): Promise<Error | null> {
  let capturedMiddleware: ((socket: unknown, next: (err?: Error) => void) => void) | null = null;
  const mockServer = {
    use: vi.fn().mockImplementation((mw) => {
      capturedMiddleware = mw;
    }),
    // biome-ignore lint/suspicious/noExplicitAny: test mock
  } as any;

  gateway.afterInit(mockServer);

  if (!capturedMiddleware) throw new Error('afterInit did not register middleware');

  return new Promise((resolve) => {
    (capturedMiddleware as NonNullable<typeof capturedMiddleware>)(socket, (err?: Error) => {
      resolve(err ?? null);
    });
  });
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Must be valid UUIDs — TypingStartSchema / TypingStopSchema use z.string().uuid()
const CHANNEL_ID = 'a1b2c3d4-0000-0000-0000-000000000001';
const USER_ID = 'a1b2c3d4-0000-0000-0000-000000000002';

// ---------------------------------------------------------------------------
// Tests: WS-upgrade auth (installWsAuthMiddleware — shared with MessagingGateway)
// ---------------------------------------------------------------------------

describe('PresenceGateway — WS-upgrade auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects socket when Session.getSessionWithoutRequestResponse throws', async () => {
    mockGetSessionWithoutRequestResponse.mockRejectedValue(new Error('Invalid token'));

    const gateway = new PresenceGateway(makePresenceService(), makeRbacService());
    const socket = makeSocket('sAccessToken=bad-token');

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe('Unauthorized');
    expect(socket.data.userId).toBeUndefined();
  });

  it('accepts socket with valid cookie token and attaches userId to socket.data', async () => {
    const mockSession = {
      getUserId: vi.fn().mockReturnValue(USER_ID),
      assertClaims: vi.fn().mockResolvedValue(undefined),
    };
    mockGetSessionWithoutRequestResponse.mockResolvedValue(mockSession);

    const gateway = new PresenceGateway(makePresenceService(), makeRbacService());
    const socket = makeSocket('sAccessToken=valid-token; other=x');

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeNull();
    expect(socket.data.userId).toBe(USER_ID);
  });
});

// ---------------------------------------------------------------------------
// Tests: handleJoinChannel
// ---------------------------------------------------------------------------

describe('PresenceGateway — handleJoinChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins presence:channel:<channelId> when canViewChannelById returns true', async () => {
    const rbac = makeRbacService(true);
    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(rbac.canViewChannelById).toHaveBeenCalledWith(USER_ID, CHANNEL_ID);
    expect(socket.join).toHaveBeenCalledWith(`presence:channel:${CHANNEL_ID}`);
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does NOT join the channel room and emits error when canViewChannelById returns false', async () => {
    const rbac = makeRbacService(false);
    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('emits error when canViewChannelById throws and does not join', async () => {
    const rbac = {
      canViewChannelById: vi.fn().mockRejectedValue(new Error('DB error')),
    } as unknown as RbacService;

    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('emits error immediately and makes no RBAC call when payload is invalid', async () => {
    const rbac = makeRbacService(true);
    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    // Invalid: channelId is missing
    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'not-a-uuid',
    });

    expect(rbac.canViewChannelById).not.toHaveBeenCalled();
    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: handleLeaveChannel
// ---------------------------------------------------------------------------

describe('PresenceGateway — handleLeaveChannel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('leaves presence:channel:<channelId>, calls stopTyping, removes channelId from typingChannels', async () => {
    const presenceService = makePresenceService();
    const gateway = new PresenceGateway(presenceService, makeRbacService());
    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.data.typingChannels = new Set<string>([CHANNEL_ID]);

    await gateway.handleLeaveChannel(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(socket.leave).toHaveBeenCalledWith(`presence:channel:${CHANNEL_ID}`);
    expect(presenceService.stopTyping).toHaveBeenCalledWith(CHANNEL_ID, USER_ID);
    // The channel must be removed from the per-socket typingChannels set
    expect((socket.data.typingChannels as Set<string>).has(CHANNEL_ID)).toBe(false);
  });

  it('emits error and does not call leave when payload is invalid', async () => {
    const gateway = new PresenceGateway(makePresenceService(), makeRbacService());
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleLeaveChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'not-a-uuid',
    });

    expect(socket.leave).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: handleTypingStart
// ---------------------------------------------------------------------------

describe('PresenceGateway — handleTypingStart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls startTyping and emits typing:active fan-out when access is granted', async () => {
    const actorTyper = { userId: USER_ID, displayName: 'Alice' };
    const presenceService = makePresenceService({
      getTypers: vi.fn().mockReturnValue([actorTyper]),
    });

    const rbac = makeRbacService(true);
    const gateway = new PresenceGateway(presenceService, rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.data.displayName = 'Alice';
    socket.data.typingChannels = new Set<string>();

    // Set up server mock for emitTypingActive (now uses in().fetchSockets())
    const mockSocketEmit = vi.fn();
    const fakeSocket = { data: { userId: USER_ID }, emit: mockSocketEmit };
    const mockFetchSockets = vi.fn().mockResolvedValue([fakeSocket]);
    const mockIn = vi.fn().mockReturnValue({ fetchSockets: mockFetchSockets });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { in: mockIn };

    await gateway.handleTypingStart(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    // presenceService.startTyping must have been called
    expect(presenceService.startTyping).toHaveBeenCalledWith(
      CHANNEL_ID,
      USER_ID,
      'Alice',
      expect.any(Function),
    );

    // emitTypingActive must fan out via in().fetchSockets() to the channel room
    expect(mockIn).toHaveBeenCalledWith(`presence:channel:${CHANNEL_ID}`);
    expect(mockSocketEmit).toHaveBeenCalledWith(
      'typing:active',
      expect.objectContaining({ channelId: CHANNEL_ID }),
    );
  });

  it('emits error and does NOT call startTyping when access is denied', async () => {
    const presenceService = makePresenceService();
    const rbac = makeRbacService(false);
    const gateway = new PresenceGateway(presenceService, rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.data.typingChannels = new Set<string>();

    await gateway.handleTypingStart(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(presenceService.startTyping).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('emits error and makes no RBAC call when payload is invalid', async () => {
    const presenceService = makePresenceService();
    const rbac = makeRbacService(true);
    const gateway = new PresenceGateway(presenceService, rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleTypingStart(socket as unknown as import('socket.io').Socket, {
      channelId: 'not-a-uuid',
    });

    expect(rbac.canViewChannelById).not.toHaveBeenCalled();
    expect(presenceService.startTyping).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: handleTypingStop
// ---------------------------------------------------------------------------

describe('PresenceGateway — handleTypingStop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls stopTyping and emits typing:active fan-out on valid payload', async () => {
    const presenceService = makePresenceService({
      getTypers: vi.fn().mockReturnValue([]),
    });
    const gateway = new PresenceGateway(presenceService, makeRbacService());
    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.data.typingChannels = new Set<string>([CHANNEL_ID]);

    const mockSocketEmit = vi.fn();
    const fakeSocket = { data: { userId: USER_ID }, emit: mockSocketEmit };
    const mockFetchSockets = vi.fn().mockResolvedValue([fakeSocket]);
    const mockIn = vi.fn().mockReturnValue({ fetchSockets: mockFetchSockets });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { in: mockIn };

    // handleTypingStop is synchronous but emitTypingActive is now async (fire-and-forget via void)
    // We flush microtasks so the promise resolves before asserting
    gateway.handleTypingStop(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });
    await Promise.resolve(); // flush the void promise

    expect(presenceService.stopTyping).toHaveBeenCalledWith(CHANNEL_ID, USER_ID);
    expect(mockIn).toHaveBeenCalledWith(`presence:channel:${CHANNEL_ID}`);
    expect(mockSocketEmit).toHaveBeenCalledWith(
      'typing:active',
      expect.objectContaining({ channelId: CHANNEL_ID, typers: [] }),
    );
  });

  it('emits error and does not call stopTyping when payload is invalid', () => {
    const presenceService = makePresenceService();
    const gateway = new PresenceGateway(presenceService, makeRbacService());
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    gateway.handleTypingStop(socket as unknown as import('socket.io').Socket, {
      channelId: 'not-a-uuid',
    });

    expect(presenceService.stopTyping).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: handleDisconnect typing-cleanup path
// ---------------------------------------------------------------------------

describe('PresenceGateway — handleDisconnect typing cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('clears all active typing channels on disconnect: stopTyping + emitTypingActive per channel, then calls presenceService.disconnect', async () => {
    const CH_2 = 'b2c3d4e5-0000-0000-0000-000000000002';
    const presenceService = makePresenceService({
      disconnect: vi.fn().mockReturnValue({ wentOffline: false }),
      getTypers: vi.fn().mockReturnValue([]),
    });
    const gateway = new PresenceGateway(presenceService, makeRbacService());

    const mockFetchSockets = vi.fn().mockResolvedValue([]);
    const mockIn = vi.fn().mockReturnValue({ fetchSockets: mockFetchSockets });
    const mockTo = vi.fn().mockReturnValue({ emit: vi.fn() });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { in: mockIn, to: mockTo };

    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.data.serverIds = [];
    socket.data.typingChannels = new Set<string>([CHANNEL_ID, CH_2]);

    await gateway.handleDisconnect(socket as unknown as import('socket.io').Socket);

    // stopTyping must have been called for each channel the socket was typing in
    expect(presenceService.stopTyping).toHaveBeenCalledWith(CHANNEL_ID, USER_ID);
    expect(presenceService.stopTyping).toHaveBeenCalledWith(CH_2, USER_ID);

    // emitTypingActive (server.in) must have been called for each typing channel
    expect(mockIn).toHaveBeenCalledWith(`presence:channel:${CHANNEL_ID}`);
    expect(mockIn).toHaveBeenCalledWith(`presence:channel:${CH_2}`);

    // presenceService.disconnect must be called for ref-count cleanup
    expect(presenceService.disconnect).toHaveBeenCalledWith(USER_ID, 'test-socket-id');
  });

  it('does not call stopTyping when socket has no active typing channels on disconnect', async () => {
    const presenceService = makePresenceService({
      disconnect: vi.fn().mockReturnValue({ wentOffline: false }),
    });
    const gateway = new PresenceGateway(presenceService, makeRbacService());
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = {
      in: vi.fn().mockReturnValue({ fetchSockets: vi.fn().mockResolvedValue([]) }),
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    };

    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.data.serverIds = [];
    socket.data.typingChannels = new Set<string>(); // empty — no active typing

    await gateway.handleDisconnect(socket as unknown as import('socket.io').Socket);

    expect(presenceService.stopTyping).not.toHaveBeenCalled();
    expect(presenceService.disconnect).toHaveBeenCalledWith(USER_ID, 'test-socket-id');
  });

  it('returns early without calling disconnect when socket has no userId (auth-rejected socket)', async () => {
    const presenceService = makePresenceService();
    const gateway = new PresenceGateway(presenceService, makeRbacService());

    const socket = makeSocket();
    // userId is deliberately NOT set (auth-rejected path)

    await gateway.handleDisconnect(socket as unknown as import('socket.io').Socket);

    expect(presenceService.disconnect).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: emitTypingActive — per-recipient fan-out (F-4 regression)
//
// Uses the REAL PresenceService (no getTypers mock) to verify that after
// startTyping is called for an actor, a RECIPIENT socket receives the actor
// in its typing:active payload, while the actor's OWN socket does NOT.
// ---------------------------------------------------------------------------

const ACTOR_ID = 'c3d4e5f6-0000-0000-0000-000000000003';
const ACTOR_DISPLAY = 'Bob';
const RECIPIENT_ID = 'd4e5f6a7-0000-0000-0000-000000000004';

describe('PresenceGateway — emitTypingActive per-recipient fan-out (F-4 regression)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('recipient socket receives the actor in typers; actor socket does NOT receive itself', async () => {
    // Use the real PresenceService so the typing map is genuinely populated
    const realPresenceService = new PresenceService();
    realPresenceService.startTyping(CHANNEL_ID, ACTOR_ID, ACTOR_DISPLAY, () => {});

    const gateway = new PresenceGateway(realPresenceService, makeRbacService());

    // Two fake sockets in the channel room: actor and recipient
    const actorEmit = vi.fn();
    const recipientEmit = vi.fn();
    const actorFakeSocket = { data: { userId: ACTOR_ID }, emit: actorEmit };
    const recipientFakeSocket = { data: { userId: RECIPIENT_ID }, emit: recipientEmit };

    const mockFetchSockets = vi.fn().mockResolvedValue([actorFakeSocket, recipientFakeSocket]);
    const mockIn = vi.fn().mockReturnValue({ fetchSockets: mockFetchSockets });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { in: mockIn };

    // Invoke emitTypingActive via the private accessor
    // biome-ignore lint/suspicious/noExplicitAny: accessing private method for test
    await (gateway as any).emitTypingActive(CHANNEL_ID);

    // Recipient should see the actor in typers
    expect(recipientEmit).toHaveBeenCalledWith(
      'typing:active',
      expect.objectContaining({
        channelId: CHANNEL_ID,
        typers: expect.arrayContaining([
          expect.objectContaining({ userId: ACTOR_ID, displayName: ACTOR_DISPLAY }),
        ]),
      }),
    );

    // Actor's own socket should NOT see itself in typers (self-exclusion)
    expect(actorEmit).toHaveBeenCalledWith(
      'typing:active',
      expect.objectContaining({
        channelId: CHANNEL_ID,
        typers: expect.not.arrayContaining([expect.objectContaining({ userId: ACTOR_ID })]),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// wave-54 B-2 — info-disclosure regression lock for presence (task c52a7a52)
//
// Presence's handleJoinChannel is already guarded by TypingStartSchema (Zod
// z.string().uuid()) which rejects non-UUID channelIds BEFORE the DB call.
// These tests lock that Zod rejection path: non-UUID → immediate error without
// RBAC call, leak-tokens absent from the error message.
// ---------------------------------------------------------------------------

import { WS_GENERIC_ERROR as WS_GENERIC } from '../common/ws-errors';

describe('PresenceGateway — handleJoinChannel: non-UUID leak-lock (wave-54)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LOCK-PRES-1: non-UUID channelId → rejected by Zod before any RBAC/DB call; error message contains no SQL tokens, join denied', async () => {
    const rbac = makeRbacService(true);
    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'not-a-uuid-at-all',
    });

    // RBAC must NOT have been called (Zod guard fires before reaching the try block)
    expect(rbac.canViewChannelById).not.toHaveBeenCalled();

    // Socket must NOT have joined any room
    expect(socket.join).not.toHaveBeenCalled();

    // Must have emitted an error event
    expect(socket.emit).toHaveBeenCalledTimes(1);
    const call = (socket.emit as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe('error');
    const msg = (call?.[1] as { message: string }).message;

    // Zod-rejection message must not contain SQL internals
    const sqlLeakTokens = ['invalid input syntax', '22P02', 'uuid_cast', USER_ID];
    for (const token of sqlLeakTokens) {
      expect(msg).not.toContain(token);
    }
    // Must also not be empty
    expect(msg).toBeTruthy();
  });

  it('LOCK-PRES-2: valid-UUID non-authorized → Forbidden authz string, NOT generic constant (authz-denial preserved)', async () => {
    const rbac = makeRbacService(false);
    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    // CHANNEL_ID is already a valid UUID (defined at top of file)
    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledTimes(1);
    const call = (socket.emit as ReturnType<typeof vi.fn>).mock.calls[0];
    const msg = (call?.[1] as { message: string }).message;

    // Authz-denial must be specific, not the generic WS_GENERIC_ERROR constant
    expect(msg).toBe('Forbidden: cannot view channel');
    expect(msg).not.toBe(WS_GENERIC);
  });

  it('LOCK-PRES-3: valid-UUID authorized → join succeeds, no error emitted (regression guard)', async () => {
    const rbac = makeRbacService(true);
    const gateway = new PresenceGateway(makePresenceService(), rbac);
    const socket = makeSocket();
    socket.data.userId = USER_ID;

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: CHANNEL_ID,
    });

    expect(socket.emit).not.toHaveBeenCalled();
    expect(socket.join).toHaveBeenCalledWith(`presence:channel:${CHANNEL_ID}`);
  });
});

// ---------------------------------------------------------------------------
// Tests: onShowPresenceChanged — F3 audience = live cached serverIds union
// (wave-80 B-6)
//
// The proactive toggle emit must fan out to the UNION of the user's LIVE
// sockets' cached socket.data.serverIds (the audience that received the online
// broadcasts, per the H-1b disconnect invariant) — NOT a fresh DB query. A
// fresh getServerIdsForUser() would send a phantom offline to a server joined
// mid-session or miss the hide for a server left mid-session.
// ---------------------------------------------------------------------------

describe('PresenceGateway — onShowPresenceChanged F3 audience (cached serverIds union)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('hides using the UNION of live sockets cached serverIds, NOT a fresh getServerIdsForUser DB query', async () => {
    const SRV_1 = 'srv-cached-1';
    const SRV_2 = 'srv-cached-2';
    const SRV_FRESH_ONLY = 'srv-fresh-db-only'; // would appear only via a fresh DB read

    // getServerIdsForUser returns a DIFFERENT set (fresh-DB) to prove it is unused.
    const presenceService = makePresenceService({
      isOnline: vi.fn().mockReturnValue(true),
      getShowPresence: vi.fn().mockResolvedValue(false), // authoritative: hidden
      getServerIdsForUser: vi.fn().mockResolvedValue([SRV_FRESH_ONLY]),
    });
    const gateway = new PresenceGateway(presenceService, makeRbacService());

    // Two live sockets for USER_ID with cached serverIds [SRV_1] and [SRV_2].
    const sockOne = { data: { userId: USER_ID, serverIds: [SRV_1] } };
    const sockTwo = { data: { userId: USER_ID, serverIds: [SRV_2] } };
    // A co-member's socket that must be ignored for audience purposes.
    const sockOther = { data: { userId: 'someone-else', serverIds: ['srv-other'] } };

    const emittedRooms: string[] = [];
    const mockTo = vi.fn().mockImplementation((room: string) => ({
      emit: () => {
        emittedRooms.push(room);
      },
    }));
    const mockFetchSockets = vi.fn().mockResolvedValue([sockOne, sockTwo, sockOther]);
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { fetchSockets: mockFetchSockets, to: mockTo };

    await gateway.onShowPresenceChanged(USER_ID, false);

    // Fan-out target rooms = union of cached serverIds → SRV_1 + SRV_2 only.
    expect(emittedRooms).toContain(`presence:server:${SRV_1}`);
    expect(emittedRooms).toContain(`presence:server:${SRV_2}`);
    // The fresh-DB-only server must NOT be in the audience.
    expect(emittedRooms).not.toContain(`presence:server:${SRV_FRESH_ONLY}`);
    // The other user's server must NOT be in the audience.
    expect(emittedRooms).not.toContain('presence:server:srv-other');
    // getServerIdsForUser must NOT have been used to build the audience.
    expect(presenceService.getServerIdsForUser).not.toHaveBeenCalled();
  });

  it('no-op when the user is not currently online (offline user has no state to update)', async () => {
    const presenceService = makePresenceService({
      isOnline: vi.fn().mockReturnValue(false),
    });
    const gateway = new PresenceGateway(presenceService, makeRbacService());
    const mockTo = vi.fn().mockReturnValue({ emit: vi.fn() });
    const mockFetchSockets = vi.fn().mockResolvedValue([]);
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { fetchSockets: mockFetchSockets, to: mockTo };

    await gateway.onShowPresenceChanged(USER_ID, false);

    expect(mockTo).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: handleConnection — displayName empty-fallback guard (wave-29)
//
// Exercises the || fix on line 125 of presence.gateway.ts:
//   display_name || email.split('@')[0] || userId
// The db mock is already registered above; we re-configure it per test.
// ---------------------------------------------------------------------------

type MockFn = ReturnType<typeof vi.fn>;

describe('PresenceGateway — handleConnection displayName empty-fallback guard (wave-29)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Build a minimal select chain for the db.select() call inside handleConnection.
   * handleConnection uses: db.select(...).from(...).where(...).limit(1)
   */
  function makeDbSelectChain(resolveWith: unknown[]) {
    const chain: Record<string, unknown> = {
      // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
      then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
        Promise.resolve(resolveWith).then(res, rej),
    };
    for (const m of ['from', 'where', 'limit']) {
      chain[m] = vi.fn().mockReturnValue(chain);
    }
    return chain;
  }

  /** Build a minimal gateway with presence + server mocks wired for handleConnection. */
  function buildGatewayForConnection() {
    const presenceService = makePresenceService({
      connect: vi.fn().mockReturnValue({ wentOnline: false }),
      getServerIdsForUser: vi.fn().mockResolvedValue([]),
      getCoMemberUserIds: vi.fn().mockResolvedValue([]),
    });
    const gateway = new PresenceGateway(presenceService, makeRbacService());
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = {
      to: vi.fn().mockReturnValue({ emit: vi.fn() }),
    };
    return gateway;
  }

  it('empty email local-part + null display_name → displayName falls through to userId (NOT empty string)', async () => {
    // email '@example.com' → split('@')[0] === '' → falsy with || → falls through to userId
    (db.select as unknown as MockFn).mockReturnValue(
      makeDbSelectChain([{ display_name: null, email: '@example.com' }]),
    );

    const gateway = buildGatewayForConnection();
    const socket = makeSocket();
    socket.data.userId = USER_ID;
    socket.emit = vi.fn();

    await gateway.handleConnection(socket as unknown as import('socket.io').Socket);

    expect(socket.data.displayName).toBe(USER_ID);
    expect(socket.data.displayName).not.toBe('');
  });
});
