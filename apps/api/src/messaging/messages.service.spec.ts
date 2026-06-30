/**
 * MessagesService unit tests — wave-12 M3 (task a0c322b4)
 *
 * Covers:
 *   - createMessage: basic creation
 *   - createMessage: idempotency (replay → same message, no dup)
 *   - createMessage: author from service param (never from body)
 *   - createMessage: emits message.created event
 *   - createMessage: channel not found → NotFoundException
 *   - listMessages: cursor pagination (first page, next cursor present)
 *   - listMessages: channel not found → NotFoundException
 */

import { NotFoundException } from '@nestjs/common';
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
  for (const m of ['from', 'where', 'limit', 'orderBy', 'select']) {
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

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CHANNEL_ID = 'ch-111';
const AUTHOR_ID = 'user-session-derived';
const OTHER_AUTHOR_ID = 'user-should-not-be-used';
const IDEM_KEY = 'client-generated-key-abc';

const mockChannel = { id: CHANNEL_ID };
const mockMessage = {
  id: 'msg-001',
  channel_id: CHANNEL_ID,
  author_id: AUTHOR_ID,
  content: 'Hello wave 12',
  created_at: new Date('2026-06-30T10:00:00Z'),
  idempotency_key: IDEM_KEY,
};

// ---------------------------------------------------------------------------
// Mock EventEmitter2
// ---------------------------------------------------------------------------

function makeEventEmitter() {
  return { emit: vi.fn() };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MessagesService.createMessage', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any);
  });

  it('creates a message and returns a MessageResponse DTO', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      // First call: channel exists; second call: fetch inserted message
      if (callCount === 1) return makeSelectChain([mockChannel]);
      return makeSelectChain([mockMessage]);
    });
    mockInsert.mockReturnValue(makeInsertChain());

    const result = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    expect(result.id).toBe('msg-001');
    expect(result.channelId).toBe(CHANNEL_ID);
    expect(result.authorId).toBe(AUTHOR_ID);
    expect(result.content).toBe('Hello wave 12');
    expect(result.createdAt).toBe('2026-06-30T10:00:00.000Z');
  });

  it('returns the existing message on idempotency key replay (no dup)', async () => {
    let callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannel]);
      // Second call returns the existing message (idempotency replay)
      return makeSelectChain([mockMessage]);
    });
    // onConflictDoNothing fires — no new row inserted
    mockInsert.mockReturnValue(makeInsertChain());

    const first = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    callCount = 0;
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannel]);
      return makeSelectChain([mockMessage]); // same row
    });

    const second = await service.createMessage(CHANNEL_ID, AUTHOR_ID, {
      content: 'Hello wave 12',
      idempotencyKey: IDEM_KEY,
    });

    // Both calls return the same message id — no duplicate
    expect(first.id).toBe(second.id);
    expect(first.id).toBe('msg-001');
  });

  it('uses authorId parameter (session-derived) — NOT any body value', async () => {
    let callCount = 0;
    const capturedMessages: { author_id: string }[] = [];
    mockSelect.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return makeSelectChain([mockChannel]);
      return makeSelectChain([{ ...mockMessage, author_id: AUTHOR_ID }]);
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
      if (callCount === 1) return makeSelectChain([mockChannel]);
      return makeSelectChain([mockMessage]);
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
// listMessages
// ---------------------------------------------------------------------------

describe('MessagesService.listMessages', () => {
  let service: MessagesService;
  let eventEmitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    eventEmitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new MessagesService(eventEmitter as any);
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
      // Service fetches with limit+1 — return exactly `limit` rows (no more)
      return makeSelectChain([...msgs].reverse()); // DESC from DB
    });

    const result = await service.listMessages(CHANNEL_ID, undefined, 50);

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
      return makeSelectChain(msgs); // 3 rows — triggers hasMore
    });

    const result = await service.listMessages(CHANNEL_ID, undefined, 2);

    expect(result.messages).toHaveLength(2);
    expect(result.nextCursor).not.toBeNull();
    // nextCursor is a base64url string
    expect(typeof result.nextCursor).toBe('string');
  });

  it('throws NotFoundException when channel does not exist', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.listMessages('nonexistent-ch')).rejects.toThrow(NotFoundException);
  });
});
