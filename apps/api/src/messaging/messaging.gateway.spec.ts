/**
 * MessagingGateway unit tests — wave-12 M3 (task 723b5b6a) + wave-15 (task c3f3f62a)
 *
 * Covers:
 *   1. WS-upgrade rejects unauthenticated socket (Session throws → next(Error))
 *   2. WS-upgrade accepts authenticated socket (attaches userId to socket.data)
 *   3. WS-upgrade rejects when no token present (no cookie, no auth)
 *   4. WS-upgrade rejects when assertClaims throws (unverified email)
 *   5. WS-upgrade accepts auth.accessToken fallback
 *   6. join_channel with valid access → socket.join called
 *   7. join_channel with denied access → socket.join NOT called, error emitted
 *   8. join_channel when canViewChannelById throws → error emitted, join not called
 *   9. leave_channel → socket.leave called
 *  10. message.created → server.to(...).emit only to channel room (not broadcast-all)
 *  11. handleConnection → socket.join('user:<userId>') called (wave-15 per-user room)
 *  12. mention.created → server.to('user:<userId>').emit('mention', payload) to recipient only
 *  13. mention.created → author-excluded: gateway emits to recipient, NOT to author's room
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// vi.hoisted() — define mock functions BEFORE vi.mock() factories run.
// vi.mock() calls are hoisted to the top of the file by vitest; if mock
// factory functions reference variables declared below the vi.mock() call,
// those variables are undefined at factory-execution time. vi.hoisted()
// creates values that are initialised before the hoisted vi.mock() calls.
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
// Import gateway AFTER mocks are declared (imports are also hoisted by
// vitest but after vi.mock() factories have already been registered).
// ---------------------------------------------------------------------------

import type { RbacService } from '../rbac/rbac.service';
import { MessagingGateway } from './messaging.gateway';

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
  };
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
// ---------------------------------------------------------------------------

async function runMiddleware(
  gateway: MessagingGateway,
  socket: ReturnType<typeof makeSocket>,
): Promise<Error | null> {
  // Capture the middleware registered via server.use()
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
// Tests
// ---------------------------------------------------------------------------

describe('MessagingGateway — WS-upgrade auth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects socket when Session.getSessionWithoutRequestResponse throws', async () => {
    mockGetSessionWithoutRequestResponse.mockRejectedValue(new Error('Invalid token'));

    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket('sAccessToken=bad-token');

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe('Unauthorized');
    expect(socket.data.userId).toBeUndefined();
  });

  it('rejects socket when no access token present (no cookie, no auth)', async () => {
    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket(undefined, undefined); // no cookie, no auth.accessToken

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe('Unauthorized');
    expect(mockGetSessionWithoutRequestResponse).not.toHaveBeenCalled();
  });

  it('rejects socket when assertClaims throws (unverified email)', async () => {
    const mockSession = {
      getUserId: vi.fn().mockReturnValue('user-123'),
      assertClaims: vi.fn().mockRejectedValue(new Error('Email not verified')),
    };
    mockGetSessionWithoutRequestResponse.mockResolvedValue(mockSession);

    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket('sAccessToken=valid-token');

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeInstanceOf(Error);
    expect(err?.message).toBe('Unauthorized');
    expect(socket.data.userId).toBeUndefined();
  });

  it('accepts socket with valid cookie token and attaches userId', async () => {
    const mockSession = {
      getUserId: vi.fn().mockReturnValue('user-456'),
      assertClaims: vi.fn().mockResolvedValue(undefined),
    };
    mockGetSessionWithoutRequestResponse.mockResolvedValue(mockSession);

    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket('sAccessToken=valid-token; other=x');

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeNull();
    expect(socket.data.userId).toBe('user-456');
    expect(mockGetSessionWithoutRequestResponse).toHaveBeenCalledWith('valid-token', undefined);
  });

  it('accepts socket with auth.accessToken fallback when no cookie present', async () => {
    const mockSession = {
      getUserId: vi.fn().mockReturnValue('user-789'),
      assertClaims: vi.fn().mockResolvedValue(undefined),
    };
    mockGetSessionWithoutRequestResponse.mockResolvedValue(mockSession);

    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket(undefined, 'fallback-access-token');

    const err = await runMiddleware(gateway, socket);

    expect(err).toBeNull();
    expect(socket.data.userId).toBe('user-789');
    expect(mockGetSessionWithoutRequestResponse).toHaveBeenCalledWith(
      'fallback-access-token',
      undefined,
    );
  });
});

describe('MessagingGateway — join_channel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins the channel room when canViewChannelById returns true', async () => {
    const rbac = makeRbacService(true);
    const gateway = new MessagingGateway(rbac);
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'ch-001',
    });

    expect(rbac.canViewChannelById).toHaveBeenCalledWith('user-abc', 'ch-001');
    expect(socket.join).toHaveBeenCalledWith('channel:ch-001');
    expect(socket.emit).not.toHaveBeenCalled();
  });

  it('does NOT join the channel room when canViewChannelById returns false', async () => {
    const rbac = makeRbacService(false);
    const gateway = new MessagingGateway(rbac);
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'ch-private',
    });

    expect(rbac.canViewChannelById).toHaveBeenCalledWith('user-abc', 'ch-private');
    expect(socket.join).not.toHaveBeenCalled();
    // Should emit an error event back to the socket
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });

  it('emits error when canViewChannelById throws', async () => {
    const rbac = {
      canViewChannelById: vi.fn().mockRejectedValue(new Error('DB error')),
    } as unknown as RbacService;

    const gateway = new MessagingGateway(rbac);
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'ch-001',
    });

    expect(socket.join).not.toHaveBeenCalled();
    expect(socket.emit).toHaveBeenCalledWith(
      'error',
      expect.objectContaining({ message: expect.any(String) }),
    );
  });
});

describe('MessagingGateway — leave_channel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('leaves the channel room', async () => {
    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleLeaveChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'ch-001',
    });

    expect(socket.leave).toHaveBeenCalledWith('channel:ch-001');
  });
});

// ---------------------------------------------------------------------------
// Helper: build a full MessageResponse fixture with wave-13 fields
// ---------------------------------------------------------------------------

function makeMessageFixture(
  overrides: Partial<import('@studyhall/shared').MessageResponse> = {},
): import('@studyhall/shared').MessageResponse {
  return {
    id: 'msg-001',
    channelId: 'ch-999',
    authorId: 'user-abc',
    content: 'Hello',
    createdAt: '2026-06-30T00:00:00.000Z',
    isEdited: false,
    editedAt: null,
    isDeleted: false,
    reactions: [],
    mentions: [],
    ...overrides,
  };
}

describe('MessagingGateway — message.created fan-out', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits message:new to the specific channel room (not broadcast-all)', () => {
    const gateway = new MessagingGateway(makeRbacService());

    // Mock server.to(roomKey).emit(event, payload)
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const message = makeMessageFixture({ channelId: 'ch-999' });

    gateway.handleMessageCreated(message);

    // Must call server.to('channel:ch-999') — NOT server.emit (broadcast-all)
    expect(mockTo).toHaveBeenCalledWith('channel:ch-999');
    expect(mockEmit).toHaveBeenCalledWith('message:new', message);

    // Verify broadcast-all was not used
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    expect((gateway as any).server.emit).not.toHaveBeenCalled();
  });

  it('fans out to the correct room key when channelId differs', () => {
    const gateway = new MessagingGateway(makeRbacService());

    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo };

    const message = makeMessageFixture({
      id: 'msg-002',
      channelId: 'ch-abc-123',
      authorId: 'user-xyz',
      content: 'Test message',
      createdAt: '2026-06-30T00:01:00.000Z',
    });

    gateway.handleMessageCreated(message);

    expect(mockTo).toHaveBeenCalledWith('channel:ch-abc-123');
    expect(mockTo).not.toHaveBeenCalledWith('channel:ch-999');
  });
});

// ---------------------------------------------------------------------------
// wave-13 gateway event tests — message.updated / message.deleted /
// reaction.added / reaction.removed (all room-only, no broadcast-all)
// ---------------------------------------------------------------------------

describe('MessagingGateway — wave-13 event fan-outs (room-only)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('message.updated → emits message:updated to channel room only', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const message = makeMessageFixture({
      channelId: 'ch-edit',
      isEdited: true,
      editedAt: '2026-06-30T10:00:00.000Z',
      content: 'edited',
    });

    gateway.handleMessageUpdated(message);

    expect(mockTo).toHaveBeenCalledWith('channel:ch-edit');
    expect(mockEmit).toHaveBeenCalledWith('message:updated', message);
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    expect((gateway as any).server.emit).not.toHaveBeenCalled();
  });

  it('message.deleted → emits message:deleted to channel room only', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const message = makeMessageFixture({ channelId: 'ch-del', isDeleted: true, content: null });

    gateway.handleMessageDeleted(message);

    expect(mockTo).toHaveBeenCalledWith('channel:ch-del');
    expect(mockEmit).toHaveBeenCalledWith('message:deleted', message);
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    expect((gateway as any).server.emit).not.toHaveBeenCalled();
  });

  it('reaction.added → emits reaction:added to channel room only', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const payload = {
      messageId: 'msg-001',
      channelId: 'ch-react',
      userId: 'user-abc',
      emoji: '👍',
    };

    gateway.handleReactionAdded(payload);

    expect(mockTo).toHaveBeenCalledWith('channel:ch-react');
    expect(mockEmit).toHaveBeenCalledWith('reaction:added', payload);
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    expect((gateway as any).server.emit).not.toHaveBeenCalled();
  });

  it('reaction.removed → emits reaction:removed to channel room only', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const payload = { messageId: 'msg-002', channelId: 'ch-react', userId: 'user-xyz', emoji: '❤️' };

    gateway.handleReactionRemoved(payload);

    expect(mockTo).toHaveBeenCalledWith('channel:ch-react');
    expect(mockEmit).toHaveBeenCalledWith('reaction:removed', payload);
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    expect((gateway as any).server.emit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// wave-15 — per-user room join (task c3f3f62a)
// ---------------------------------------------------------------------------

describe('MessagingGateway — handleConnection per-user room (wave-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('joins the user:<userId> room immediately on connection (before any client action)', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    gateway.handleConnection(socket as unknown as import('socket.io').Socket);

    // socket.join must have been called with 'user:user-abc'
    expect(socket.join).toHaveBeenCalledWith('user:user-abc');
  });

  it('joins the correct user room for a different userId', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const socket = makeSocket();
    socket.data.userId = 'user-xyz-789';

    gateway.handleConnection(socket as unknown as import('socket.io').Socket);

    expect(socket.join).toHaveBeenCalledWith('user:user-xyz-789');
    expect(socket.join).not.toHaveBeenCalledWith('user:user-abc');
  });
});

// ---------------------------------------------------------------------------
// wave-15 — mention.created fan-out to per-user room (task c3f3f62a)
// ---------------------------------------------------------------------------

describe('MessagingGateway — mention.created fan-out (wave-15)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits mention event to user:<mentionedUserId> room only (not a channel room)', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const payload: import('@studyhall/shared').MentionEvent = {
      messageId: 'msg-mention-01',
      channelId: 'ch-general',
      channelName: 'general',
      serverId: 'server-001',
      mentionedUserId: 'user-mentioned',
    };

    gateway.handleMentionCreated(payload);

    // Must route to the per-user room, NOT a channel room
    expect(mockTo).toHaveBeenCalledWith('user:user-mentioned');
    expect(mockTo).not.toHaveBeenCalledWith('channel:ch-general');
    expect(mockEmit).toHaveBeenCalledWith('mention', payload);
    // Must not broadcast-all
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    expect((gateway as any).server.emit).not.toHaveBeenCalled();
  });

  it('carries channelId and channelName in the mention event payload', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo };

    const payload: import('@studyhall/shared').MentionEvent = {
      messageId: 'msg-002',
      channelId: 'ch-announcements',
      channelName: 'announcements',
      serverId: 'server-002',
      mentionedUserId: 'user-bob',
    };

    gateway.handleMentionCreated(payload);

    expect(mockEmit).toHaveBeenCalledWith(
      'mention',
      expect.objectContaining({
        channelId: 'ch-announcements',
        channelName: 'announcements',
        serverId: 'server-002',
      }),
    );
  });

  it('routes to the mentioned user room — not to the author room (author-exclusion is service-side)', () => {
    // The gateway itself does not filter authors — that is done in MessagesService.
    // This test verifies the gateway emits to exactly the mentionedUserId it receives.
    const AUTHOR_ROOM = 'user:author-user';
    const RECIPIENT_ROOM = 'user:recipient-user';

    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    const payload: import('@studyhall/shared').MentionEvent = {
      messageId: 'msg-003',
      channelId: 'ch-help',
      mentionedUserId: 'recipient-user',
    };

    gateway.handleMentionCreated(payload);

    expect(mockTo).toHaveBeenCalledWith(RECIPIENT_ROOM);
    expect(mockTo).not.toHaveBeenCalledWith(AUTHOR_ROOM);
  });
});

// ---------------------------------------------------------------------------
// wave-54 B-2 — info-disclosure regression lock (task c52a7a52)
// ---------------------------------------------------------------------------

import { WS_GENERIC_ERROR } from '../common/ws-errors';

describe('MessagingGateway — join_channel: info-disclosure regression lock (wave-54)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('LOCK-MSG-1: malformed non-UUID channelId causes DB error in canViewChannelById → client sees WS_GENERIC_ERROR, SQL internals absent, join denied', async () => {
    // A malformed channelId passes JoinChannelPayload type but canViewChannelById
    // would throw a 22P02-like error if it reached the DB.  We simulate that here.
    const pg22P02 = Object.assign(new Error('invalid input syntax for type uuid: "bad-channel"'), {
      code: '22P02',
      detail: 'channel_members table',
      table: 'channel_members',
    });
    const rbac = {
      canViewChannelById: vi.fn().mockRejectedValue(pg22P02),
    } as unknown as RbacService;

    const gateway = new MessagingGateway(rbac);
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'not-a-uuid',
    });

    // Must emit exactly one error event
    expect(socket.emit).toHaveBeenCalledTimes(1);
    const call = (socket.emit as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(call?.[0]).toBe('error');
    const msg = (call?.[1] as { message: string }).message;

    // Client sees the canonical generic constant
    expect(msg).toBe(WS_GENERIC_ERROR);

    // Must not contain any SQL-internal tokens
    const sqlLeakTokens = [
      'invalid input syntax',
      'channel_members',
      'uuid',
      '22P02',
      'user-abc', // userId must not leak
    ];
    for (const token of sqlLeakTokens) {
      expect(msg).not.toContain(token);
    }

    // Request denied: join must not have been called
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('LOCK-MSG-2: valid-UUID non-authorized channelId → still gets Forbidden authz string, NOT genericized (authz-denial preservation)', async () => {
    const rbac = makeRbacService(false); // canViewChannelById returns false

    const gateway = new MessagingGateway(rbac);
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'a1b2c3d4-0000-0000-0000-000000000099',
    });

    expect(socket.emit).toHaveBeenCalledTimes(1);
    const call = (socket.emit as ReturnType<typeof vi.fn>).mock.calls[0];
    const msg = (call?.[1] as { message: string }).message;

    // Must be the specific authz-denial string — NOT the generic constant
    expect(msg).toBe('Forbidden: cannot view channel');
    expect(msg).not.toBe(WS_GENERIC_ERROR);

    // Join must not have been called
    expect(socket.join).not.toHaveBeenCalled();
  });

  it('LOCK-MSG-3: legitimate authorized channelId → join succeeds, no error emitted (regression guard)', async () => {
    const rbac = makeRbacService(true);

    const gateway = new MessagingGateway(rbac);
    const socket = makeSocket();
    socket.data.userId = 'user-abc';

    await gateway.handleJoinChannel(socket as unknown as import('socket.io').Socket, {
      channelId: 'a1b2c3d4-0000-0000-0000-000000000001',
    });

    // No error emitted
    expect(socket.emit).not.toHaveBeenCalled();
    // Join was called for the channel room
    expect(socket.join).toHaveBeenCalledWith('channel:a1b2c3d4-0000-0000-0000-000000000001');
  });
});

// ---------------------------------------------------------------------------
// wave-46 M8 — dm.message fan-out (M1 fix — B-6 review)
// ---------------------------------------------------------------------------

describe('MessagingGateway — dm.message fan-out (wave-46 M8)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const dmPayload = {
    conversationId: 'conv-001',
    message: {
      id: 'dm-msg-001',
      conversationId: 'conv-001',
      authorId: 'sender-user',
      content: 'Hello from DM',
      createdAt: '2026-07-04T10:00:00.000Z',
    } as import('@studyhall/shared').DmMessage,
    senderId: 'sender-user',
    participantIds: ['sender-user', 'recipient-user'],
  };

  it('emits dm:message to ALL participant rooms including the sender (M1 fix)', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    gateway.handleDmMessage(dmPayload);

    // Sender's room MUST receive the event (other tabs need it)
    expect(mockTo).toHaveBeenCalledWith('user:sender-user');
    // Recipient's room MUST also receive it
    expect(mockTo).toHaveBeenCalledWith('user:recipient-user');
    // Both calls should emit the dm:message event
    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenCalledWith(
      'dm:message',
      expect.objectContaining({ conversationId: 'conv-001' }),
    );
  });

  it('emits to sender room — not excluded even when senderId matches participantId', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    // Single-participant edge: only the sender in the list
    gateway.handleDmMessage({ ...dmPayload, participantIds: ['sender-user'] });

    expect(mockTo).toHaveBeenCalledWith('user:sender-user');
    expect(mockEmit).toHaveBeenCalledTimes(1);
  });

  it('emits the correct event payload shape to each participant room', () => {
    const gateway = new MessagingGateway(makeRbacService());
    const mockEmit = vi.fn();
    const mockTo = vi.fn().mockReturnValue({ emit: mockEmit });
    // biome-ignore lint/suspicious/noExplicitAny: test server mock
    (gateway as any).server = { to: mockTo, emit: vi.fn() };

    gateway.handleDmMessage(dmPayload);

    const expectedEvent = {
      conversationId: 'conv-001',
      message: dmPayload.message,
    };
    for (const call of mockEmit.mock.calls) {
      expect(call[0]).toBe('dm:message');
      expect(call[1]).toEqual(expectedEvent);
    }
  });
});
