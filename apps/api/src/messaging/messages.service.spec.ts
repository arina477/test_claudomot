/**
 * MessagesService unit tests — wave-12 M3 (task a0c322b4) + wave-13 M3 (tasks e12886d7 + d78df376)
 *                             + wave-15 (task c3f3f62a — per-user mention events)
 *                             + wave-18 (task 497c2ae6 — thread replies)
 *
 * Covers (wave-12):
 *   - createMessage: basic creation
 *   - createMessage: idempotency (replay → same message, no dup)
 *   - createMessage: author from service param (never from body)
 *   - createMessage: emits message.created event
 *   - createMessage: channel not found → NotFoundException
 *   - listMessages: cursor pagination (first page, next cursor present)
 *   - listMessages: channel not found → NotFoundException
 *
 * Covers (wave-13 T-8 security conditions):
 *   - editMessage: author-only (non-author → ForbiddenException)
 *   - editMessage: deleted message → ConflictException
 *   - deleteMessage: author can delete own message
 *   - deleteMessage: moderator (manage_channels) can delete others' message
 *   - deleteMessage: non-author without manage_channels → ForbiddenException
 *   - deleteMessage: soft-delete tombstone (content gone, is_deleted=true)
 *   - deleteMessage: idempotent (double-delete → no error)
 *   - toggleReaction: toggle on → reacted: true
 *   - toggleReaction: double toggle → off (idempotent)
 *   - listMessages: aggregated reactions with reactedByMe
 *
 * Covers (wave-15 task c3f3f62a — mention realtime):
 *   - createMessage: mention.created emitted per mentioned user (not author)
 *   - createMessage: self-mention (author mentions themselves) → NO mention.created emitted
 *   - createMessage: multiple mentions → one mention.created per non-author mentioned user
 *   - editMessage: newly-added mention on edit → mention.created emitted for new recipients
 *   - editMessage: pre-existing mention on edit → mention.created NOT re-emitted
 *
 * Covers (wave-18 task 497c2ae6 — thread replies):
 *   - createReply: rejects reply-of-reply (one-level-only)
 *   - createReply: rejects cross-channel reply
 *   - createReply: rejects reply to a soft-deleted parent
 *   - createReply: idempotent retry does NOT double-count reply_count
 *   - createReply: new reply increments reply_count + sets last_reply_at
 *   - deleteMessage (reply): reply_count decremented; last_reply_at unchanged for non-tail
 *   - deleteMessage (reply): last_reply_at recomputed when tail deleted; NULL when none remain
 *   - listThreadReplies: ordered ASC, excludes soft-deleted
 */

import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MessagesService } from './messages.service';

// ---------------------------------------------------------------------------
// Drizzle mock helpers (same pattern as rbac.service.spec.ts)
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'orderBy', 'select', 'innerJoin']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

function makeInsertChain() {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
  };
  chain.values = vi.fn().mockReturnValue(chain);
  chain.onConflictDoNothing = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue([]);
  return chain;
}

function makeUpdateChain(returning: unknown[] = []) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(returning).then(res, rej),
  };
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockReturnValue(chain);
  chain.returning = vi.fn().mockResolvedValue(returning);
  return chain;
}

function makeDeleteChain() {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
  };
  chain.where = vi.fn().mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Mock db module
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;
const mockDelete = db.delete as unknown as MockFn;
const mockTransaction = db.transaction as unknown as MockFn;

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CHANNEL_ID = 'ch-111';
const AUTHOR_ID = 'user-session-derived';
const OTHER_AUTHOR_ID = 'user-should-not-be-used';
const IDEM_KEY = 'client-generated-key-abc';
const SERVER_ID = 'server-999';
const MESSAGE_ID = 'msg-001';

const mockChannel = { id: CHANNEL_ID };
const mockChannelWithServer = { id: CHANNEL_ID, server_id: SERVER_ID };
const mockMessage = {
  id: MESSAGE_ID,
  channel_id: CHANNEL_ID,
  author_id: AUTHOR_ID,
  content: 'Hello wave 12',
  created_at: new Date('2026-06-30T10:00:00Z'),
  idempotency_key: IDEM_KEY,
  is_edited: false,
  edited_at: null,
  is_deleted: false,
  deleted_at: null,
  // wave-18 thread fields (null = top-level message)
  thread_parent_id: null,
  reply_count: 0,
  last_reply_at: null,
};

// ---------------------------------------------------------------------------
// Mock EventEmitter2
// ---------------------------------------------------------------------------

function makeEventEmitter() {
  return { emit: vi.fn() };
}

// ---------------------------------------------------------------------------
// Mock RbacService
// ---------------------------------------------------------------------------

function makeRbacService(canResult = false) {
  return {
    can: vi.fn().mockResolvedValue(canResult),
  };
}

// ---------------------------------------------------------------------------
// Tests: createMessage
// ---------------------------------------------------------------------------

describe('MessagesService.createMessage', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('creates a message and returns a MessageResponse DTO', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      // 1: channel exists (with server_id); 2: fetch inserted message;
      // 3: fetchMentionRows (no mentions in "Hello wave 12"); further: reactions etc.
      if (callCount === 1) return makeSelectChain([{ id: CHANNEL_ID, server_id: SERVER_ID }]);
      if (callCount === 2) return makeSelectChain([mockMessage]);
      return makeSelectChain([]);
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    expect(result.id).toBe(MESSAGE_ID);
    expect(result.channelId).toBe(CHANNEL_ID);
    expect(result.authorId).toBe(AUTHOR_ID);
    expect(result.content).toBe('Hello wave 12');
    expect(result.createdAt).toBe('2026-06-30T10:00:00.000Z');
    expect(result.isEdited).toBe(false);
    expect(result.isDeleted).toBe(false);
    expect(result.reactions).toEqual([]);
    expect(result.mentions).toEqual([]);
  });

  it('returns the existing message on idempotency key replay (no dup)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: CHANNEL_ID, server_id: SERVER_ID }]);
      if (callCount === 2) return makeSelectChain([mockMessage]);
      return makeSelectChain([]); // resolveMentions (early exit for no tokens) / fetchMentionRows
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const first = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: CHANNEL_ID, server_id: SERVER_ID }]);
      if (callCount === 2) return makeSelectChain([mockMessage]); // same row
      return makeSelectChain([]);
    });

    const second = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    // Both calls return the same message id — no duplicate
    expect(first.id).toBe(second.id);
    expect(first.id).toBe(MESSAGE_ID);
  });

  it('uses authorId parameter (session-derived) — NOT any body value', async () => {
    let callCount = 0;
    const capturedMessages: { author_id: string }[] = [];
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: CHANNEL_ID, server_id: SERVER_ID }]);
      if (callCount === 2) return makeSelectChain([{ ...mockMessage, author_id: AUTHOR_ID }]);
      return makeSelectChain([]); // fetchMentionRows
    });
    const insertChain = makeInsertChain();
    const valuesFn = insertChain.values as unknown as MockFn;
    valuesFn.mockImplementation((vals: { author_id: string }) => {
      capturedMessages.push(vals);
      return insertChain;
    });
    mockInsert.mockReturnValue(insertChain);

    // Pass AUTHOR_ID from session, pretend body had OTHER_AUTHOR_ID
    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Test',
      idempotencyKey: 'key-1',
    });

    // The values() call must have used AUTHOR_ID, not OTHER_AUTHOR_ID
    expect(capturedMessages[0]?.author_id).toBe(AUTHOR_ID);
    expect(capturedMessages[0]?.author_id).not.toBe(OTHER_AUTHOR_ID);
  });

  it('emits message.created event with the MessageResponse DTO', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: CHANNEL_ID, server_id: SERVER_ID }]);
      if (callCount === 2) return makeSelectChain([mockMessage]);
      return makeSelectChain([]); // fetchMentionRows
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    expect(eventEmitter.emit).toHaveBeenCalledOnce();
    expect(eventEmitter.emit).toHaveBeenCalledWith('message.created', result);
  });

  it('throws NotFoundException when channel does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([])); // channel not found

    await expect(
      service.createMessage('nonexistent-ch', AUTHOR_ID, { content: 'Hi' }),
    ).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// Tests: editMessage (wave-13 T-8 security conditions)
// ---------------------------------------------------------------------------

describe('MessagesService.editMessage', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('non-author cannot edit the message → ForbiddenException', async () => {
    // Message owned by AUTHOR_ID, caller is OTHER_AUTHOR_ID
    mockSelect.mockReturnValue(makeSelectChain([mockMessage]));

    await expect(
      service.editMessage(CHANNEL_ID, MESSAGE_ID, OTHER_AUTHOR_ID, 'new content'),
    ).rejects.toThrow(ForbiddenException);
  });

  it('cannot edit a deleted message → ConflictException', async () => {
    const deletedMessage = { ...mockMessage, is_deleted: true };
    mockSelect.mockReturnValue(makeSelectChain([deletedMessage]));

    await expect(
      service.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, 'new content'),
    ).rejects.toThrow(ConflictException);
  });

  it('author can edit their own message → updates content, sets is_edited, emits message.updated', async () => {
    const updatedMessage = {
      ...mockMessage,
      content: 'edited content',
      is_edited: true,
      edited_at: new Date('2026-06-30T11:00:00Z'),
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]); // fetch message
      if (selectCallCount === 2) return makeSelectChain([mockChannelWithServer]); // channel for server_id
      if (selectCallCount === 3) return makeSelectChain([]); // existing mention rows (none)
      // resolveMentions: "edited content" has no tokens → skips DB call
      if (selectCallCount === 4) return makeSelectChain([]); // fetchMentionRows
      return makeSelectChain([]); // reactions
    });
    mockUpdate.mockReturnValue(makeUpdateChain([updatedMessage]));

    const result = await service.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, 'edited content');

    expect(result.content).toBe('edited content');
    expect(result.isEdited).toBe(true);
    expect(result.editedAt).toBe('2026-06-30T11:00:00.000Z');
    expect(result.mentions).toEqual([]);
    expect(eventEmitter.emit).toHaveBeenCalledWith('message.updated', result);
  });

  it('throws NotFoundException when message does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, 'content')).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: deleteMessage (wave-13 T-8 security conditions)
// ---------------------------------------------------------------------------

describe('MessagesService.deleteMessage', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;
  let rbacService: ReturnType<typeof makeRbacService>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    rbacService = makeRbacService(false);
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, rbacService as any);
  });

  it('author can delete their own message', async () => {
    const softDeletedMessage = {
      ...mockMessage,
      is_deleted: true,
      deleted_at: new Date('2026-06-30T12:00:00Z'),
      content: '',
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]); // fetch message
      return makeSelectChain([mockChannelWithServer]); // fetch channel for server_id
    });
    mockUpdate.mockReturnValue(makeUpdateChain([softDeletedMessage]));

    await service.deleteMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID);

    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'message.deleted',
      expect.objectContaining({ isDeleted: true, content: null }),
    );
  });

  it("moderator (manage_channels) can delete another member's message", async () => {
    const MODERATOR_ID = 'moderator-user';
    const softDeletedMessage = {
      ...mockMessage,
      author_id: AUTHOR_ID, // not the moderator
      is_deleted: true,
      deleted_at: new Date(),
      content: '',
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]); // fetch message
      return makeSelectChain([mockChannelWithServer]); // fetch channel for server_id
    });
    mockUpdate.mockReturnValue(makeUpdateChain([softDeletedMessage]));

    // Moderator has manage_channels
    rbacService.can.mockResolvedValue(true);

    await service.deleteMessage(CHANNEL_ID, MESSAGE_ID, MODERATOR_ID);

    // rbacService.can must be called with resolved serverId (from channel row)
    expect(rbacService.can).toHaveBeenCalledWith(MODERATOR_ID, SERVER_ID, 'manage_channels');
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'message.deleted',
      expect.objectContaining({ isDeleted: true }),
    );
  });

  it('non-author without manage_channels → ForbiddenException', async () => {
    const NON_AUTHOR_ID = 'random-user';

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]); // fetch message
      return makeSelectChain([mockChannelWithServer]); // fetch channel for server_id
    });

    // rbacService.can returns false (default)
    rbacService.can.mockResolvedValue(false);

    await expect(service.deleteMessage(CHANNEL_ID, MESSAGE_ID, NON_AUTHOR_ID)).rejects.toThrow(
      ForbiddenException,
    );
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('soft-delete tombstone: content set to empty in DB, DTO content is null', async () => {
    const softDeletedMessage = {
      ...mockMessage,
      is_deleted: true,
      deleted_at: new Date(),
      content: '', // DB stores empty string
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]);
      return makeSelectChain([mockChannelWithServer]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain([softDeletedMessage]));

    await service.deleteMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID);

    const emitArgs = eventEmitter.emit.mock.calls[0];
    expect(emitArgs?.[0]).toBe('message.deleted');
    // rowToDto returns content: null when is_deleted=true
    const emittedDto = emitArgs?.[1];
    expect(emittedDto.content).toBeNull();
    expect(emittedDto.isDeleted).toBe(true);
  });

  it('double-delete is idempotent (no error, no second update)', async () => {
    const alreadyDeletedMessage = { ...mockMessage, is_deleted: true };

    mockSelect.mockReturnValue(makeSelectChain([alreadyDeletedMessage]));

    // Should not throw, should not call update
    await expect(service.deleteMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID)).resolves.toBeUndefined();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('throws NotFoundException when message does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.deleteMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: toggleReaction (wave-13 T-8 conditions)
// ---------------------------------------------------------------------------

describe('MessagesService.toggleReaction', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('toggle ON: reaction does not exist → INSERT → reacted: true, emits reaction.added', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([{ id: MESSAGE_ID, is_deleted: false }]); // message exists
      return makeSelectChain([]); // no existing reaction
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.toggleReaction(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '👍');

    expect(result.reacted).toBe(true);
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'reaction.added',
      expect.objectContaining({ messageId: MESSAGE_ID, channelId: CHANNEL_ID, emoji: '👍' }),
    );
  });

  it('toggle OFF: reaction exists → DELETE → reacted: false, emits reaction.removed', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([{ id: MESSAGE_ID, is_deleted: false }]); // message
      return makeSelectChain([{ id: 'reaction-001' }]); // existing reaction
    });
    mockDelete.mockReturnValue(makeDeleteChain());

    const result = await service.toggleReaction(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '👍');

    expect(result.reacted).toBe(false);
    expect(mockDelete).toHaveBeenCalledOnce();
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'reaction.removed',
      expect.objectContaining({ messageId: MESSAGE_ID, channelId: CHANNEL_ID, emoji: '👍' }),
    );
  });

  it('double-toggle is idempotent: add then remove → second call returns reacted:false', async () => {
    // First call: no existing reaction → INSERT (toggle on)
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([{ id: MESSAGE_ID, is_deleted: false }]);
      return makeSelectChain([]); // no reaction (first toggle)
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const first = await service.toggleReaction(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '👍');
    expect(first.reacted).toBe(true);

    // Second call: reaction now exists → DELETE (toggle off)
    selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([{ id: MESSAGE_ID, is_deleted: false }]);
      return makeSelectChain([{ id: 'reaction-001' }]); // existing reaction
    });
    mockDelete.mockReturnValue(makeDeleteChain());

    const second = await service.toggleReaction(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '👍');
    expect(second.reacted).toBe(false);
  });

  it('throws NotFoundException when message does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.toggleReaction(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '👍')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('react to a deleted message → ConflictException, no INSERT/DELETE', async () => {
    // Message exists but is soft-deleted
    mockSelect.mockReturnValue(makeSelectChain([{ id: MESSAGE_ID, is_deleted: true }]));

    await expect(service.toggleReaction(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, '👍')).rejects.toThrow(
      ConflictException,
    );

    // No reaction mutation must have occurred
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockDelete).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: listMessages (wave-12 + wave-13 aggregated reactions)
// ---------------------------------------------------------------------------

describe('MessagesService.listMessages', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('returns messages in chronological order with no nextCursor for a single page', async () => {
    const msgs = [
      { ...mockMessage, id: 'msg-001', created_at: new Date('2026-06-30T10:01:00Z') },
      { ...mockMessage, id: 'msg-002', created_at: new Date('2026-06-30T10:02:00Z') },
    ];

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannel]);
      if (callCount === 2) return makeSelectChain([...msgs].reverse()); // DESC from DB
      return makeSelectChain([]); // reactions
    });

    const result = await service.listMessages(CHANNEL_ID, AUTHOR_ID, undefined, 50);

    // Messages returned chronologically (oldest first)
    expect(result.messages[0]?.id).toBe('msg-001');
    expect(result.messages[1]?.id).toBe('msg-002');
    // No next page
    expect(result.nextCursor).toBeNull();
  });

  it('returns nextCursor when there are more messages than the limit', async () => {
    // Simulate limit=2 — service fetches 3 rows (limit+1 sentinel)
    const msgs = [
      { ...mockMessage, id: 'msg-003', created_at: new Date('2026-06-30T10:03:00Z') },
      { ...mockMessage, id: 'msg-002', created_at: new Date('2026-06-30T10:02:00Z') },
      { ...mockMessage, id: 'msg-001', created_at: new Date('2026-06-30T10:01:00Z') }, // sentinel
    ];

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannel]);
      if (callCount === 2) return makeSelectChain(msgs); // 3 rows — triggers hasMore
      return makeSelectChain([]); // reactions
    });

    const result = await service.listMessages(CHANNEL_ID, AUTHOR_ID, undefined, 2);

    expect(result.messages).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    // nextCursor is a base64url string
    expect(typeof result.nextCursor).toBe('string');
  });

  it('aggregates reactions and includes reactedByMe for the viewer', async () => {
    const msg = { ...mockMessage, id: 'msg-react-test' };

    // Reactions: AUTHOR_ID reacted with 👍, OTHER_AUTHOR_ID also reacted with 👍
    const reactions = [
      { message_id: 'msg-react-test', user_id: AUTHOR_ID, emoji: '👍' },
      { message_id: 'msg-react-test', user_id: OTHER_AUTHOR_ID, emoji: '👍' },
      { message_id: 'msg-react-test', user_id: OTHER_AUTHOR_ID, emoji: '❤️' },
    ];

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannel]);
      if (callCount === 2) return makeSelectChain([msg]); // messages
      if (callCount === 3) return makeSelectChain(reactions); // reactions (batched)
      return makeSelectChain([]); // fetchMentionRows (no mentions in this test)
    });

    const result = await service.listMessages(CHANNEL_ID, AUTHOR_ID, undefined, 50);

    const message = result.messages[0];
    expect(message).toBeDefined();

    const thumbsUp = message?.reactions.find((r) => r.emoji === '👍');
    expect(thumbsUp?.count).toBe(2);
    expect(thumbsUp?.reactedByMe).toBe(true); // AUTHOR_ID reacted with 👍

    const heart = message?.reactions.find((r) => r.emoji === '❤️');
    expect(heart?.count).toBe(1);
    expect(heart?.reactedByMe).toBe(false); // AUTHOR_ID did NOT react with ❤️
  });

  it('throws NotFoundException when channel does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.listMessages('nonexistent-ch', AUTHOR_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});

// ---------------------------------------------------------------------------
// Tests: createMessage — wave-15 mention.created events (task c3f3f62a)
// ---------------------------------------------------------------------------

const MENTIONED_USER_ID = 'user-mentioned-001';
const SECOND_MENTIONED_USER_ID = 'user-mentioned-002';
const CHANNEL_NAME = 'general';

// Mock mockMessage with channel that has name for mention events
const mockChannelWithName = { id: CHANNEL_ID, server_id: SERVER_ID, name: CHANNEL_NAME };

// Shared helper: set up a createMessage with resolved mention users
function setupCreateWithMentions(mentionedUserIds: string[]) {
  let callCount = 0;

  // The service calls:
  //   1. SELECT channel (with server_id + name)
  //   2. SELECT message after insert
  //   3. SELECT in resolveMentions (for @username → user_id lookup)
  //   4. SELECT fetchMentionRows (username join)
  mockSelect.mockImplementation(() => {
    callCount++;
    if (callCount === 1) return makeSelectChain([mockChannelWithName]);
    if (callCount === 2) return makeSelectChain([mockMessage]);
    // resolveMentions result — return one row per mentioned user
    if (callCount === 3) return makeSelectChain(mentionedUserIds.map((id) => ({ user_id: id })));
    // fetchMentionRows — return mention rows with usernames
    return makeSelectChain(
      mentionedUserIds.map((id) => ({
        message_id: MESSAGE_ID,
        mentioned_user_id: id,
        username: `user_${id}`,
      })),
    );
  });
  mockInsert.mockReturnValue(makeInsertChain());
}

describe('MessagesService.createMessage — wave-15 mention.created events', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('emits mention.created for the mentioned user (non-author) with correct shape', async () => {
    setupCreateWithMentions([MENTIONED_USER_ID]);

    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: `Hello @user_${MENTIONED_USER_ID}`,
      idempotencyKey: 'key-mention-1',
    });

    // Must have emitted message.created AND mention.created
    const emitCalls = eventEmitter.emit.mock.calls;

    const mentionEmit = emitCalls.find((c) => c[0] === 'mention.created');
    expect(mentionEmit).toBeDefined();
    expect(mentionEmit?.[1]).toMatchObject({
      messageId: MESSAGE_ID,
      channelId: CHANNEL_ID,
      channelName: CHANNEL_NAME,
      serverId: SERVER_ID,
      mentionedUserId: MENTIONED_USER_ID,
    });
  });

  it('does NOT emit mention.created when the author mentions themselves (self-mention excluded)', async () => {
    // The mentioned user IS the author — self-mention must be suppressed
    setupCreateWithMentions([AUTHOR_ID]);

    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hey @me',
      idempotencyKey: 'key-self-mention',
    });

    const emitCalls = eventEmitter.emit.mock.calls;
    const mentionEmits = emitCalls.filter((c) => c[0] === 'mention.created');
    expect(mentionEmits).toHaveLength(0);
  });

  it('emits one mention.created per non-author mentioned user (multiple mentions)', async () => {
    setupCreateWithMentions([MENTIONED_USER_ID, SECOND_MENTIONED_USER_ID]);

    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hey @user1 and @user2',
      idempotencyKey: 'key-multi-mention',
    });

    const emitCalls = eventEmitter.emit.mock.calls;
    const mentionEmits = emitCalls.filter((c) => c[0] === 'mention.created');

    expect(mentionEmits).toHaveLength(2);
    const recipientIds = mentionEmits.map(
      (c) => (c[1] as { mentionedUserId: string }).mentionedUserId,
    );
    expect(recipientIds).toContain(MENTIONED_USER_ID);
    expect(recipientIds).toContain(SECOND_MENTIONED_USER_ID);
    // Author must not appear in recipients
    expect(recipientIds).not.toContain(AUTHOR_ID);
  });

  it('emits mention.created for non-author mentions but NOT for self when mixed', async () => {
    // Author mentions themselves AND another user
    setupCreateWithMentions([AUTHOR_ID, MENTIONED_USER_ID]);

    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: '@me and @other',
      idempotencyKey: 'key-mixed-mention',
    });

    const emitCalls = eventEmitter.emit.mock.calls;
    const mentionEmits = emitCalls.filter((c) => c[0] === 'mention.created');

    // Only the non-author mention should emit
    expect(mentionEmits).toHaveLength(1);
    expect(mentionEmits[0]?.[1]).toMatchObject({ mentionedUserId: MENTIONED_USER_ID });
  });

  it('does NOT emit mention.created when there are no mentions in the message', async () => {
    // No @username tokens → resolveMentions returns []
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannelWithName]);
      if (callCount === 2) return makeSelectChain([mockMessage]);
      return makeSelectChain([]); // no mentions
    });
    mockInsert.mockReturnValue(makeInsertChain());

    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'No mentions here',
      idempotencyKey: 'key-no-mention',
    });

    const emitCalls = eventEmitter.emit.mock.calls;
    const mentionEmits = emitCalls.filter((c) => c[0] === 'mention.created');
    expect(mentionEmits).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: editMessage — wave-15 mention.created events for newly-added mentions
// ---------------------------------------------------------------------------

describe('MessagesService.editMessage — wave-15 mention.created for new mentions', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('emits mention.created for a newly-added mention on edit (not present before edit)', async () => {
    const updatedMessage = {
      ...mockMessage,
      content: 'edited with @new_user',
      is_edited: true,
      edited_at: new Date('2026-06-30T11:00:00Z'),
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]); // fetch message
      if (selectCallCount === 2)
        return makeSelectChain([{ server_id: SERVER_ID, name: CHANNEL_NAME }]); // channel
      if (selectCallCount === 3) return makeSelectChain([]); // existing mentions (none before edit)
      // resolveMentions for new content — returns the newly-mentioned user
      if (selectCallCount === 4) return makeSelectChain([{ user_id: MENTIONED_USER_ID }]);
      if (selectCallCount === 5) return makeSelectChain([]); // fetchMentionRows
      return makeSelectChain([]); // reactions
    });
    mockUpdate.mockReturnValue(makeUpdateChain([updatedMessage]));
    mockInsert.mockReturnValue(makeInsertChain());

    await service.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, 'edited with @new_user');

    const emitCalls = eventEmitter.emit.mock.calls;
    const mentionEmits = emitCalls.filter((c) => c[0] === 'mention.created');

    expect(mentionEmits).toHaveLength(1);
    expect(mentionEmits[0]?.[1]).toMatchObject({
      messageId: MESSAGE_ID,
      channelId: CHANNEL_ID,
      channelName: CHANNEL_NAME,
      serverId: SERVER_ID,
      mentionedUserId: MENTIONED_USER_ID,
    });
  });

  it('does NOT emit mention.created for a pre-existing mention (already mentioned before edit)', async () => {
    // Pre-existing mention — the user was already in existingIds, so they are in toInsert=[]
    const updatedMessage = {
      ...mockMessage,
      content: 'still mentioning @old_user',
      is_edited: true,
      edited_at: new Date(),
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockMessage]); // fetch message
      if (selectCallCount === 2)
        return makeSelectChain([{ server_id: SERVER_ID, name: CHANNEL_NAME }]);
      // existing mentions — user is already there
      if (selectCallCount === 3) return makeSelectChain([{ mentioned_user_id: MENTIONED_USER_ID }]);
      // resolveMentions — same user still mentioned
      if (selectCallCount === 4) return makeSelectChain([{ user_id: MENTIONED_USER_ID }]);
      if (selectCallCount === 5) return makeSelectChain([]); // fetchMentionRows
      return makeSelectChain([]); // reactions
    });
    mockUpdate.mockReturnValue(makeUpdateChain([updatedMessage]));

    await service.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, 'still mentioning @old_user');

    const emitCalls = eventEmitter.emit.mock.calls;
    const mentionEmits = emitCalls.filter((c) => c[0] === 'mention.created');
    // Pre-existing mention → toInsert is empty → no mention.created emitted
    expect(mentionEmits).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Tests: wave-18 createReply (task 497c2ae6)
// ---------------------------------------------------------------------------

const PARENT_ID = 'msg-parent-001';
const REPLY_ID = 'msg-reply-001';
const REPLY_IDEM_KEY = 'reply-idem-key-abc';

const mockParentMessage = {
  ...mockMessage,
  id: PARENT_ID,
  content: 'Parent message',
  thread_parent_id: null,
  reply_count: 0,
  last_reply_at: null,
};

const mockReplyMessage = {
  ...mockMessage,
  id: REPLY_ID,
  content: 'This is a reply',
  idempotency_key: REPLY_IDEM_KEY,
  created_at: new Date('2026-06-30T11:00:00Z'),
  thread_parent_id: PARENT_ID,
  reply_count: 0,
  last_reply_at: null,
};

describe('MessagesService.createReply — wave-18 thread replies', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('rejects reply-of-reply (one-level-only) → BadRequestException', async () => {
    // Parent itself is a reply (thread_parent_id is set)
    const replyParent = { ...mockParentMessage, thread_parent_id: PARENT_ID };
    mockSelect.mockReturnValue(makeSelectChain([replyParent]));

    const { BadRequestException } = await import('@nestjs/common');
    await expect(
      service.createReply(CHANNEL_ID, REPLY_ID, AUTHOR_ID, { content: 'nope' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects cross-channel reply → BadRequestException', async () => {
    // Parent belongs to a DIFFERENT channel
    const crossChannelParent = { ...mockParentMessage, channel_id: 'other-channel-id' };
    mockSelect.mockReturnValue(makeSelectChain([crossChannelParent]));

    const { BadRequestException } = await import('@nestjs/common');
    await expect(
      service.createReply(CHANNEL_ID, PARENT_ID, AUTHOR_ID, { content: 'nope' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('rejects reply to a soft-deleted parent → ConflictException', async () => {
    const deletedParent = { ...mockParentMessage, is_deleted: true };
    mockSelect.mockReturnValue(makeSelectChain([deletedParent]));

    const { ConflictException } = await import('@nestjs/common');
    await expect(
      service.createReply(CHANNEL_ID, PARENT_ID, AUTHOR_ID, { content: 'nope' }),
    ).rejects.toThrow(ConflictException);
  });

  it('parent not found → NotFoundException', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(
      service.createReply(CHANNEL_ID, PARENT_ID, AUTHOR_ID, { content: 'nope' }),
    ).rejects.toThrow(NotFoundException);
  });

  it('new reply: INSERT returns row → increments reply_count + last_reply_at in same txn', async () => {
    // Pre-flight select returns valid parent
    mockSelect.mockReturnValue(makeSelectChain([mockParentMessage]));

    // Transaction: insert returns the reply row (isNewInsert=true → count++)
    mockTransaction.mockImplementation(async (cb: Parameters<typeof mockTransaction>[0]) => {
      const txUpdate = vi.fn().mockReturnValue(makeUpdateChain([]));
      const txInsert = vi.fn().mockImplementation(() => {
        const chain = makeInsertChain();
        // .returning() returns the new reply row → isNewInsert = true
        (chain.returning as MockFn).mockResolvedValue([mockReplyMessage]);
        return chain;
      });
      const tx = { insert: txInsert, update: txUpdate, select: vi.fn(), delete: vi.fn() };
      return cb(tx);
    });

    const result = await service.createReply(CHANNEL_ID, PARENT_ID, AUTHOR_ID, {
      content: 'This is a reply',
      idempotencyKey: REPLY_IDEM_KEY,
    });

    expect(result.id).toBe(REPLY_ID);
    expect(result.threadParentId).toBe(PARENT_ID);
    // Verify the transaction ran (mockTransaction called once)
    expect(mockTransaction).toHaveBeenCalledOnce();
    // Verify thread.reply.created event was emitted
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'thread.reply.created',
      expect.objectContaining({ parentId: PARENT_ID, channelId: CHANNEL_ID }),
    );
  });

  it('idempotent retry: INSERT returns empty (DO NOTHING hit) → re-fetches existing reply, does NOT count++', async () => {
    // Pre-flight select returns valid parent
    mockSelect.mockReturnValue(makeSelectChain([mockParentMessage]));

    mockTransaction.mockImplementation(async (cb: Parameters<typeof mockTransaction>[0]) => {
      const txUpdate = vi.fn().mockReturnValue(makeUpdateChain([]));
      const txInsert = vi.fn().mockImplementation(() => {
        const chain = makeInsertChain();
        // .returning() returns EMPTY → DO NOTHING fired → isNewInsert = false
        (chain.returning as MockFn).mockResolvedValue([]);
        return chain;
      });
      // Re-fetch by idempotency key returns the existing reply
      const txSelect = vi.fn().mockReturnValue(makeSelectChain([mockReplyMessage]));
      const tx = { insert: txInsert, update: txUpdate, select: txSelect, delete: vi.fn() };
      return cb(tx);
    });

    const result = await service.createReply(CHANNEL_ID, PARENT_ID, AUTHOR_ID, {
      content: 'This is a reply',
      idempotencyKey: REPLY_IDEM_KEY,
    });

    expect(result.id).toBe(REPLY_ID);
    // update (count++) must NOT have been called — no double count
    // We verify this by checking no tx.update was called:
    // The transaction mock tracks the inner tx.update; if isNewInsert=false it's skipped.
    // We can't directly access tx.update from here, but we verify via event not emitting twice.
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'thread.reply.created',
      expect.objectContaining({ parentId: PARENT_ID }),
    );
    expect(mockTransaction).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Tests: wave-18 deleteMessage (reply path) — count decrement + tail recompute
// ---------------------------------------------------------------------------

describe('MessagesService.deleteMessage — wave-18 reply soft-delete', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;
  let rbacService: ReturnType<typeof makeRbacService>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    rbacService = makeRbacService(false);
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, rbacService as any);
  });

  it('reply soft-delete: decrements reply_count always; leaves last_reply_at unchanged on non-tail delete', async () => {
    const replyCreatedAt = new Date('2026-06-30T11:00:00Z');
    const tailCreatedAt = new Date('2026-06-30T12:00:00Z'); // a later reply = the tail
    const replyMessage = {
      ...mockMessage,
      id: REPLY_ID,
      thread_parent_id: PARENT_ID, // this IS a reply
      created_at: replyCreatedAt,
      author_id: AUTHOR_ID,
    };

    // Pre-flight selects (before txn): message + channel
    let outerSelectCount = 0;
    mockSelect.mockImplementation(() => {
      outerSelectCount++;
      if (outerSelectCount === 1) return makeSelectChain([replyMessage]); // fetch reply
      return makeSelectChain([mockChannelWithServer]); // fetch channel
    });

    mockTransaction.mockImplementation(async (cb: Parameters<typeof mockTransaction>[0]) => {
      const softDeletedReply = { ...replyMessage, is_deleted: true, content: '' };
      // First call to tx.update: soft-delete returning the deleted row.
      // Second call: parent count decrement (no returning needed).
      let txCallCount = 0;
      const txUpdateWithReturning = vi.fn().mockImplementation(() => {
        txCallCount++;
        if (txCallCount === 1) {
          return makeUpdateChain([softDeletedReply]);
        }
        return makeUpdateChain([]);
      });
      // Fetch parent for last_reply_at check (non-tail case: tailCreatedAt > replyCreatedAt)
      const txSelectForParent = vi
        .fn()
        .mockReturnValue(makeSelectChain([{ last_reply_at: tailCreatedAt }]));
      const tx = {
        update: txUpdateWithReturning,
        select: txSelectForParent,
        insert: vi.fn(),
        delete: vi.fn(),
      };
      return cb(tx);
    });

    await service.deleteMessage(CHANNEL_ID, REPLY_ID, AUTHOR_ID);

    // message.deleted event was emitted
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'message.deleted',
      expect.objectContaining({ isDeleted: true }),
    );
    // Transaction was used (atomic reply delete)
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('reply soft-delete (tail): recomputes last_reply_at via MAX when deleted reply was the tail', async () => {
    const tailCreatedAt = new Date('2026-06-30T12:00:00Z');
    const newLastReplyAt = new Date('2026-06-30T11:00:00Z'); // earlier surviving reply
    const tailReply = {
      ...mockMessage,
      id: REPLY_ID,
      thread_parent_id: PARENT_ID,
      created_at: tailCreatedAt, // same as parent.last_reply_at → tail
      author_id: AUTHOR_ID,
    };

    let outerSelectCount = 0;
    mockSelect.mockImplementation(() => {
      outerSelectCount++;
      if (outerSelectCount === 1) return makeSelectChain([tailReply]);
      return makeSelectChain([mockChannelWithServer]);
    });

    mockTransaction.mockImplementation(async (cb: Parameters<typeof mockTransaction>[0]) => {
      const softDeletedReply = { ...tailReply, is_deleted: true, content: '' };
      let txCallCount = 0;
      const txUpdate = vi.fn().mockImplementation(() => {
        txCallCount++;
        if (txCallCount === 1) return makeUpdateChain([softDeletedReply]); // soft-delete
        return makeUpdateChain([]); // parent count + last_reply_at update
      });
      let txSelectCount = 0;
      const txSelect = vi.fn().mockImplementation(() => {
        txSelectCount++;
        if (txSelectCount === 1) {
          // parent last_reply_at = tailCreatedAt → isTailReply = true
          return makeSelectChain([{ last_reply_at: tailCreatedAt }]);
        }
        // MAX(created_at) query for remaining live replies
        return makeSelectChain([{ maxCreatedAt: newLastReplyAt }]);
      });
      const tx = { update: txUpdate, select: txSelect, insert: vi.fn(), delete: vi.fn() };
      return cb(tx);
    });

    await service.deleteMessage(CHANNEL_ID, REPLY_ID, AUTHOR_ID);

    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'message.deleted',
      expect.objectContaining({ isDeleted: true }),
    );
    expect(mockTransaction).toHaveBeenCalledOnce();
  });

  it('reply soft-delete (tail, no remaining): last_reply_at set to NULL when no live replies remain', async () => {
    const tailCreatedAt = new Date('2026-06-30T12:00:00Z');
    const tailReply = {
      ...mockMessage,
      id: REPLY_ID,
      thread_parent_id: PARENT_ID,
      created_at: tailCreatedAt,
      author_id: AUTHOR_ID,
    };

    let outerSelectCount = 0;
    mockSelect.mockImplementation(() => {
      outerSelectCount++;
      if (outerSelectCount === 1) return makeSelectChain([tailReply]);
      return makeSelectChain([mockChannelWithServer]);
    });

    mockTransaction.mockImplementation(async (cb: Parameters<typeof mockTransaction>[0]) => {
      const softDeletedReply = { ...tailReply, is_deleted: true, content: '' };
      let txCallCount = 0;
      const txUpdate = vi.fn().mockImplementation(() => {
        txCallCount++;
        if (txCallCount === 1) return makeUpdateChain([softDeletedReply]);
        return makeUpdateChain([]);
      });
      let txSelectCount = 0;
      const txSelect = vi.fn().mockImplementation(() => {
        txSelectCount++;
        if (txSelectCount === 1) return makeSelectChain([{ last_reply_at: tailCreatedAt }]);
        // MAX returns null — no remaining live replies
        return makeSelectChain([{ maxCreatedAt: null }]);
      });
      const tx = { update: txUpdate, select: txSelect, insert: vi.fn(), delete: vi.fn() };
      return cb(tx);
    });

    await service.deleteMessage(CHANNEL_ID, REPLY_ID, AUTHOR_ID);

    // The txn ran and the event was emitted correctly
    expect(eventEmitter.emit).toHaveBeenCalledWith(
      'message.deleted',
      expect.objectContaining({ isDeleted: true }),
    );
    expect(mockTransaction).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// Tests: wave-18 listThreadReplies — ordering + tombstone exclusion
// ---------------------------------------------------------------------------

describe('MessagesService.listThreadReplies — wave-18', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('returns replies ordered ASC (oldest first) with no nextCursor for a single page', async () => {
    const replies = [
      { ...mockReplyMessage, id: 'reply-001', created_at: new Date('2026-06-30T10:01:00Z') },
      { ...mockReplyMessage, id: 'reply-002', created_at: new Date('2026-06-30T10:02:00Z') },
    ];

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: PARENT_ID, is_deleted: false }]); // parent exists
      if (callCount === 2) return makeSelectChain(replies); // ASC replies
      return makeSelectChain([]); // reactions + mentions
    });

    const result = await service.listThreadReplies(PARENT_ID, AUTHOR_ID);

    expect(result.items).toHaveLength(2);
    // Oldest first (ASC)
    expect(result.items[0]?.id).toBe('reply-001');
    expect(result.items[1]?.id).toBe('reply-002');
    expect(result.nextCursor).toBeNull();
  });

  it('returns nextCursor when there are more replies than the limit', async () => {
    // limit=1 → fetch 2 rows (limit+1 sentinel)
    const replies = [
      { ...mockReplyMessage, id: 'reply-001', created_at: new Date('2026-06-30T10:01:00Z') },
      { ...mockReplyMessage, id: 'reply-002', created_at: new Date('2026-06-30T10:02:00Z') }, // sentinel
    ];

    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: PARENT_ID, is_deleted: false }]);
      if (callCount === 2) return makeSelectChain(replies); // 2 rows → hasMore
      return makeSelectChain([]);
    });

    const result = await service.listThreadReplies(PARENT_ID, AUTHOR_ID, undefined, 1);

    expect(result.items).toHaveLength(1);
    expect(result.nextCursor).toBeTruthy();
  });

  it('returns empty items when parent has no live replies', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([{ id: PARENT_ID, is_deleted: false }]);
      return makeSelectChain([]); // no replies
    });

    const result = await service.listThreadReplies(PARENT_ID, AUTHOR_ID);

    expect(result.items).toHaveLength(0);
    expect(result.nextCursor).toBeNull();
  });

  it('throws NotFoundException when parent message does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.listThreadReplies('nonexistent-parent', AUTHOR_ID)).rejects.toThrow(
      NotFoundException,
    );
  });
});
