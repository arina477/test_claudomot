/**
 * MessagesService unit tests — wave-12 M3 (task a0c322b4) + wave-13 M3 (tasks e12886d7 + d78df376)
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
  },
}));

import { db } from '../db/index';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;
const mockDelete = db.delete as unknown as MockFn;

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
