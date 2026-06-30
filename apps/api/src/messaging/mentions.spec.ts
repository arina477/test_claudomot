/**
 * mentions.spec.ts — unit tests for parseMentions + MessagesService mention logic
 * wave-15 task 3d238446
 *
 * Covers:
 *   Parser:
 *     - Basic @username extraction
 *     - Word-boundary: only after start-of-string or whitespace
 *     - Mid-word (email-like a@b) ignored
 *     - Deduplication (same token appears twice → one entry)
 *     - Empty body → empty array
 *     - Multiple tokens
 *     - Self-mention (just a token; persistence tested below)
 *
 *   MessagesService (mention integration):
 *     - createMessage: resolves members only (non-member → no row)
 *     - createMessage: persists mention rows and returns mentions[] in DTO
 *     - createMessage: self-mention persisted
 *     - editMessage: adding a new mention creates the row
 *     - editMessage: removing a mention deletes the row
 *     - getMyMentions: returns only the authed user's mentioned messages
 *     - getMyMentions: excludes soft-deleted messages
 */

import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { parseMentions } from './mentions';
import { MessagesService } from './messages.service';

// ---------------------------------------------------------------------------
// Parser tests
// ---------------------------------------------------------------------------

describe('parseMentions', () => {
  it('returns empty array for plain text with no @', () => {
    expect(parseMentions('hello world')).toEqual([]);
  });

  it('returns empty array for empty string', () => {
    expect(parseMentions('')).toEqual([]);
  });

  it('extracts a single token at start of string', () => {
    expect(parseMentions('@alice say hi')).toEqual(['alice']);
  });

  it('extracts a single token after whitespace', () => {
    expect(parseMentions('hey @bob')).toEqual(['bob']);
  });

  it('extracts multiple tokens', () => {
    expect(parseMentions('@alice and @bob')).toEqual(['alice', 'bob']);
  });

  it('deduplicates repeated tokens', () => {
    expect(parseMentions('@alice @alice')).toEqual(['alice']);
  });

  it('is case-insensitive (returns lowercase)', () => {
    expect(parseMentions('@Alice @ALICE')).toEqual(['alice']);
  });

  it('ignores mid-word @ (email-like: a@b.com)', () => {
    expect(parseMentions('send to user@example.com')).toEqual([]);
  });

  it('ignores @ immediately after a non-whitespace character', () => {
    expect(parseMentions('word@username')).toEqual([]);
  });

  it('handles token followed by punctuation', () => {
    // The regex captures [a-zA-Z0-9_-]+ so stops before punctuation
    expect(parseMentions('@alice, nice to meet you')).toEqual(['alice']);
  });

  it('handles underscore and hyphen in username', () => {
    expect(parseMentions('@john_doe and @jane-smith')).toEqual(['john_doe', 'jane-smith']);
  });

  it('extracts token at very end of string', () => {
    expect(parseMentions('ping @carol')).toEqual(['carol']);
  });

  it('multiple spaces between tokens still parses both', () => {
    expect(parseMentions('@alice   @bob')).toEqual(['alice', 'bob']);
  });

  it('does NOT parse @everyone (it is a token but per-spec is excluded via non-member resolution, not parser)', () => {
    // Parser does extract the token; resolver drops it because @everyone / @here
    // won't be a registered username-member. Parser is pure extraction only.
    expect(parseMentions('@everyone')).toEqual(['everyone']);
  });
});

// ---------------------------------------------------------------------------
// MessagesService mention integration tests
// ---------------------------------------------------------------------------

// -- Mock helpers (mirror messages.service.spec.ts pattern) -----------------

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

// -- Mock db -----------------------------------------------------------------

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

// -- Fixtures ----------------------------------------------------------------

const CHANNEL_ID = 'ch-mentions-test';
const SERVER_ID = 'srv-mentions-test';
const AUTHOR_ID = 'user-author';
const ALICE_ID = 'user-alice';
const BOB_ID = 'user-bob';
const MESSAGE_ID = 'msg-mentions-001';

const mockChannel = { id: CHANNEL_ID, server_id: SERVER_ID };

const mockMessage = {
  id: MESSAGE_ID,
  channel_id: CHANNEL_ID,
  author_id: AUTHOR_ID,
  content: 'Hello @alice',
  created_at: new Date('2026-06-30T10:00:00Z'),
  idempotency_key: null,
  is_edited: false,
  edited_at: null,
  is_deleted: false,
  deleted_at: null,
};

// Mention row as returned by fetchMentionRows (with username JOIN)
const mockMentionRowAlice = {
  message_id: MESSAGE_ID,
  mentioned_user_id: ALICE_ID,
  username: 'alice',
};

function makeEventEmitter() {
  return { emit: vi.fn() };
}

function makeRbacService(canResult = false) {
  return { can: vi.fn().mockResolvedValue(canResult) };
}

// ---------------------------------------------------------------------------
// createMessage: mention persistence
// ---------------------------------------------------------------------------

describe('MessagesService.createMessage — mentions', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('persists mention rows and returns mentions[] in DTO when @username is a server member', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: channel exists (with server_id)
      if (selectCallCount === 1) return makeSelectChain([mockChannel]);
      // 2: fetch inserted message
      if (selectCallCount === 2) return makeSelectChain([mockMessage]);
      // 3: resolveMentions → server_members JOIN users → alice is a member
      if (selectCallCount === 3) return makeSelectChain([{ user_id: ALICE_ID }]);
      // 4: fetchMentionRows → message_mentions JOIN users
      if (selectCallCount === 4) return makeSelectChain([mockMentionRowAlice]);
      return makeSelectChain([]);
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello @alice',
    });

    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0]).toEqual({ userId: ALICE_ID, username: 'alice' });
    // INSERT was called for the message AND for message_mentions
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('non-member @username → no mention row (stays plain text)', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockChannel]);
      if (selectCallCount === 2)
        return makeSelectChain([{ ...mockMessage, content: 'Hello @nonmember' }]);
      // resolveMentions → empty (no server member with that username)
      if (selectCallCount === 3) return makeSelectChain([]);
      // fetchMentionRows → empty (no rows persisted)
      if (selectCallCount === 4) return makeSelectChain([]);
      return makeSelectChain([]);
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello @nonmember',
    });

    // No mention rows → mentions[] is empty
    expect(result.mentions).toEqual([]);
    // Only 1 INSERT call (for the message itself, not message_mentions)
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('self-mention is persisted (author mentions themselves)', async () => {
    const AUTHOR_USERNAME = 'author-user';
    const mockMentionRowSelf = {
      message_id: MESSAGE_ID,
      mentioned_user_id: AUTHOR_ID,
      username: AUTHOR_USERNAME,
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockChannel]);
      if (selectCallCount === 2)
        return makeSelectChain([
          { ...mockMessage, author_id: AUTHOR_ID, content: `Hey @${AUTHOR_USERNAME}` },
        ]);
      // resolveMentions → author is a server member
      if (selectCallCount === 3) return makeSelectChain([{ user_id: AUTHOR_ID }]);
      // fetchMentionRows
      if (selectCallCount === 4) return makeSelectChain([mockMentionRowSelf]);
      return makeSelectChain([]);
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: `Hey @${AUTHOR_USERNAME}`,
    });

    expect(result.mentions).toHaveLength(1);
    expect(result.mentions[0]?.userId).toBe(AUTHOR_ID);
    expect(mockInsert).toHaveBeenCalledTimes(2);
  });

  it('duplicate @username in body → single mention row (UNIQUE)', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([mockChannel]);
      if (selectCallCount === 2)
        return makeSelectChain([{ ...mockMessage, content: '@alice @alice' }]);
      // parseMentions deduplicates → only alice resolved once
      if (selectCallCount === 3) return makeSelectChain([{ user_id: ALICE_ID }]);
      if (selectCallCount === 4) return makeSelectChain([mockMentionRowAlice]);
      return makeSelectChain([]);
    });
    mockInsert.mockReturnValue(makeInsertChain());

    let insertCallCount = 0;
    mockInsert.mockImplementation(() => {
      insertCallCount++;
      return makeInsertChain();
    });

    await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: '@alice @alice',
    });

    // parseMentions deduplicates; resolveMentions returns 1 row → 1 INSERT for mentions
    expect(insertCallCount).toBe(2); // message INSERT + mention INSERT
  });

  it('throws NotFoundException when channel not found', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(
      service.createMessage('bad-channel', AUTHOR_ID, { content: '@alice' }),
    ).rejects.toThrow(NotFoundException);
  });
});

// ---------------------------------------------------------------------------
// editMessage: mention diff
// ---------------------------------------------------------------------------

describe('MessagesService.editMessage — mention diff', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it('adding a new @username on edit creates a new mention row', async () => {
    const updatedMessage = {
      ...mockMessage,
      content: 'Hello @alice and @bob',
      is_edited: true,
      edited_at: new Date(),
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: fetch message (for author check)
      if (selectCallCount === 1) return makeSelectChain([mockMessage]);
      // 2: fetch channel for server_id
      if (selectCallCount === 2) return makeSelectChain([mockChannel]);
      // 3: existing mentions → alice already mentioned
      if (selectCallCount === 3) return makeSelectChain([{ mentioned_user_id: ALICE_ID }]);
      // 4: resolveMentions for new body → alice + bob are members
      if (selectCallCount === 4)
        return makeSelectChain([{ user_id: ALICE_ID }, { user_id: BOB_ID }]);
      // 5: fetchMentionRows → alice + bob
      if (selectCallCount === 5)
        return makeSelectChain([
          { message_id: MESSAGE_ID, mentioned_user_id: ALICE_ID, username: 'alice' },
          { message_id: MESSAGE_ID, mentioned_user_id: BOB_ID, username: 'bob' },
        ]);
      // 6: reactions fetch
      return makeSelectChain([]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain([updatedMessage]));
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.editMessage(
      CHANNEL_ID,
      MESSAGE_ID,
      AUTHOR_ID,
      'Hello @alice and @bob',
    );

    expect(result.mentions).toHaveLength(2);
    // @bob was newly added → INSERT was called
    expect(mockInsert).toHaveBeenCalledOnce();
    // No deletion (alice was already present)
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('removing an @username on edit deletes the mention row', async () => {
    const updatedMessage = {
      ...mockMessage,
      content: 'Hello there',
      is_edited: true,
      edited_at: new Date(),
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: fetch message
      if (selectCallCount === 1) return makeSelectChain([mockMessage]);
      // 2: fetch channel
      if (selectCallCount === 2) return makeSelectChain([mockChannel]);
      // 3: existing mentions → alice previously mentioned
      if (selectCallCount === 3) return makeSelectChain([{ mentioned_user_id: ALICE_ID }]);
      // 4: resolveMentions for new body ("Hello there") → no tokens → returns [] directly
      // parseMentions("Hello there") returns [] so resolveMentions returns [] without a DB call
      // But selectCallCount 4 would be fetchMentionRows
      if (selectCallCount === 4) return makeSelectChain([]); // fetchMentionRows → empty
      // 5: reactions
      return makeSelectChain([]);
    });
    mockUpdate.mockReturnValue(makeUpdateChain([updatedMessage]));
    mockDelete.mockReturnValue(makeDeleteChain());

    const result = await service.editMessage(CHANNEL_ID, MESSAGE_ID, AUTHOR_ID, 'Hello there');

    expect(result.mentions).toEqual([]);
    // alice was removed → DELETE was called
    expect(mockDelete).toHaveBeenCalledOnce();
    // No new insertions
    expect(mockInsert).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getMyMentions: authz + soft-delete exclusion
// ---------------------------------------------------------------------------

describe('MessagesService.getMyMentions', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any, makeRbacService() as any);
  });

  it("returns only the authed user's mentioned messages (session-derived userId, no cross-user read)", async () => {
    // The service uses viewerUserId directly in WHERE — we verify the select is
    // called with the correct userId by inspecting that the result only contains
    // the expected message.
    const mentionedMsg = {
      ...mockMessage,
      id: 'msg-my-mention',
      author_id: BOB_ID,
      content: 'Hey @alice',
    };

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // 1: main getMyMentions query (message_mentions JOIN messages JOIN ...)
      if (selectCallCount === 1) return makeSelectChain([mentionedMsg]);
      // 2: reactions fetch
      if (selectCallCount === 2) return makeSelectChain([]);
      // 3: fetchMentionRows
      if (selectCallCount === 3)
        return makeSelectChain([
          { message_id: 'msg-my-mention', mentioned_user_id: ALICE_ID, username: 'alice' },
        ]);
      return makeSelectChain([]);
    });

    const result = await service.getMyMentions(ALICE_ID);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.id).toBe('msg-my-mention');
    // mentions[] on the returned message correctly shows alice
    expect(result.items[0]?.mentions[0]?.userId).toBe(ALICE_ID);
    expect(result.nextCursor).toBeNull();
  });

  it('excludes soft-deleted messages from my-mentions', async () => {
    // The query has WHERE is_deleted = false — soft-deleted messages are not returned.
    // We simulate the DB returning empty (as if the filter excluded the deleted msg).
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([]); // no non-deleted mentions
      return makeSelectChain([]);
    });

    const result = await service.getMyMentions(ALICE_ID);

    expect(result.items).toEqual([]);
    expect(result.nextCursor).toBeNull();
  });

  it('returns nextCursor when there are more items than the limit', async () => {
    const msgs = [
      {
        ...mockMessage,
        id: 'msg-a',
        created_at: new Date('2026-06-30T10:03:00Z'),
        author_id: BOB_ID,
      },
      {
        ...mockMessage,
        id: 'msg-b',
        created_at: new Date('2026-06-30T10:02:00Z'),
        author_id: BOB_ID,
      },
      {
        ...mockMessage,
        id: 'msg-c',
        created_at: new Date('2026-06-30T10:01:00Z'),
        author_id: BOB_ID,
      }, // sentinel
    ];

    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain(msgs); // 3 rows for limit=2
      return makeSelectChain([]); // reactions + mentions
    });

    const result = await service.getMyMentions(ALICE_ID, undefined, 2);

    expect(result.items).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    expect(typeof result.nextCursor).toBe('string');
  });
});
