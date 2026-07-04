/**
 * DmService unit tests — wave-46 M8 direct messages (tasks a48f1910 + 32f5d29e)
 *
 * Covers:
 *   who_can_dm enforcement:
 *     - everyone target → createConversation succeeds
 *     - nobody target → 403 ForbiddenException, conversation not created
 *     - server-members target with shared server → succeeds
 *     - server-members target with NO shared server → 403 ForbiddenException
 *     - mixed targets (one nobody) → whole-create fails 403
 *
 *   participant cap:
 *     - >10 total participants → 400 BadRequestException
 *     - exactly 10 → succeeds
 *     - 1:1 (is_group=false) with 2 participants → succeeds
 *     - 1:1 (is_group=false) with 3 participants → 400 BadRequestException
 *
 *   IDOR-safe participant gate:
 *     - non-participant calling sendMessage → 404 NotFoundException
 *     - non-participant calling listMessages → 404 NotFoundException
 *     - participant calling sendMessage → succeeds
 *     - participant calling listMessages → succeeds
 *
 *   Idempotency (sendMessage):
 *     - duplicate (conversationId, idempotencyKey) → same message row, no new insert
 *
 *   listConversations:
 *     - caller with no DMs → [] (200)
 *     - caller with conversations → returns list with participant details
 */

import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// db module mock
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    selectDistinctOn: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    transaction: vi.fn(),
  },
}));

import { db } from '../db/index';
import { DmService } from './dm.service';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockSelectDistinctOn = db.selectDistinctOn as unknown as MockFn;
const mockInsert = db.insert as unknown as MockFn;
const mockTransaction = db.transaction as unknown as MockFn;

// ---------------------------------------------------------------------------
// Mock chain builders — mirror assignments.service.spec.ts patterns
// ---------------------------------------------------------------------------

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of [
    'from',
    'where',
    'limit',
    'orderBy',
    'select',
    'innerJoin',
    'leftJoin',
    'as',
  ]) {
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
  chain.onConflictDoNothing = vi.fn().mockReturnValue(chain);
  return chain;
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const CREATOR_ID = 'user-creator';
const TARGET_A_ID = 'user-target-a';
const TARGET_B_ID = 'user-target-b';
const CONV_ID = 'conv-uuid-001';
const MSG_ID = 'msg-uuid-001';
const NOW = new Date('2026-07-04T10:00:00Z');

const mockConvRow = {
  id: CONV_ID,
  is_group: false,
  created_by: CREATOR_ID,
  created_at: NOW,
};

const mockMsgRow = {
  id: MSG_ID,
  conversation_id: CONV_ID,
  author_id: CREATOR_ID,
  content: 'Hello!',
  idempotency_key: 'idem-key-001',
  created_at: NOW,
};

// ---------------------------------------------------------------------------
// Mock EventEmitter2 factory
// ---------------------------------------------------------------------------

function makeEventEmitter() {
  return { emit: vi.fn() };
}

// ---------------------------------------------------------------------------
// Tests: who_can_dm enforcement
// ---------------------------------------------------------------------------

describe('DmService — who_can_dm enforcement', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('allows createConversation when target who_can_dm=everyone', async () => {
    // isParticipant check (not called here) + user select for who_can_dm
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // enforceWhoCanDm: fetch target user
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      // fetchParticipantDetails after insert
      return makeSelectChain([
        { user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
        { user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
      ]);
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txInsert = vi.fn().mockReturnValue(makeInsertChain([mockConvRow]));
      const tx = { insert: txInsert };
      return fn(tx);
    });

    const result = await service.createConversation(CREATOR_ID, {
      participantIds: [TARGET_A_ID],
    });

    expect(result.id).toBe(CONV_ID);
    expect(result.isGroup).toBe(false);
  });

  it('rejects createConversation when target who_can_dm=nobody (403)', async () => {
    mockSelect.mockImplementation(() => {
      return makeSelectChain([{ who_can_dm: 'nobody' }]);
    });

    await expect(
      service.createConversation(CREATOR_ID, { participantIds: [TARGET_A_ID] }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('allows createConversation when target who_can_dm=server-members and they share a server', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // enforceWhoCanDm: fetch target user's who_can_dm
        return makeSelectChain([{ who_can_dm: 'server-members' }]);
      }
      if (selectCallCount === 2) {
        // shared server query → returns a row (they share a server)
        return makeSelectChain([{ server_id: 'server-shared-001' }]);
      }
      // participant detail fetch after transaction
      return makeSelectChain([
        { user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
        { user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
      ]);
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txInsert = vi.fn().mockReturnValue(makeInsertChain([mockConvRow]));
      const tx = { insert: txInsert };
      return fn(tx);
    });

    const result = await service.createConversation(CREATOR_ID, {
      participantIds: [TARGET_A_ID],
    });
    expect(result.id).toBe(CONV_ID);
  });

  it('rejects createConversation when target who_can_dm=server-members and NO shared server (403)', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // who_can_dm
        return makeSelectChain([{ who_can_dm: 'server-members' }]);
      }
      // shared server query → empty (no shared server)
      return makeSelectChain([]);
    });

    await expect(
      service.createConversation(CREATOR_ID, { participantIds: [TARGET_A_ID] }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('rejects whole-create when any one target has nobody policy (403, no partial)', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // First target: everyone
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      // Second target: nobody
      return makeSelectChain([{ who_can_dm: 'nobody' }]);
    });

    await expect(
      service.createConversation(CREATOR_ID, {
        participantIds: [TARGET_A_ID, TARGET_B_ID],
        isGroup: true,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(mockTransaction).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: participant cap
// ---------------------------------------------------------------------------

describe('DmService — participant cap', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('rejects when total participants >10 (400)', async () => {
    // 10 participantIds + 1 creator = 11 total
    const ids = Array.from({ length: 10 }, (_, i) => `user-${i}`);

    await expect(
      service.createConversation(CREATOR_ID, { participantIds: ids, isGroup: true }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('accepts exactly 10 participants total', async () => {
    // 9 participantIds + 1 creator = 10 total
    const participantIds = Array.from({ length: 9 }, (_, i) => `user-${i}`);

    // Mock who_can_dm as everyone for all 9 targets, then participant detail fetch
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount <= 9) {
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      // participant detail fetch
      return makeSelectChain(
        [CREATOR_ID, ...participantIds].map((id) => ({
          user_id: id,
          display_name: id,
          avatar_url: null,
        })),
      );
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txInsert = vi.fn().mockReturnValue(makeInsertChain([{ ...mockConvRow, is_group: true }]));
      const tx = { insert: txInsert };
      return fn(tx);
    });

    const result = await service.createConversation(CREATOR_ID, {
      participantIds,
      isGroup: true,
    });
    expect(result.participants).toHaveLength(10);
  });

  it('succeeds for 1:1 (is_group=false) with exactly 2 total participants (creator + 1 target, who_can_dm=everyone)', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // enforceWhoCanDm: fetch target user's who_can_dm
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      // fetchParticipantDetails after transaction
      return makeSelectChain([
        { user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
        { user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
      ]);
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txInsert = vi.fn().mockReturnValue(makeInsertChain([mockConvRow]));
      const tx = { insert: txInsert };
      return fn(tx);
    });

    const result = await service.createConversation(CREATOR_ID, {
      participantIds: [TARGET_A_ID],
      isGroup: false,
    });

    expect(result.id).toBe(CONV_ID);
    expect(result.isGroup).toBe(false);
    expect(result.participants).toHaveLength(2);
  });

  it('rejects 1:1 (is_group=false) with 3 total participants (400)', async () => {
    await expect(
      service.createConversation(CREATOR_ID, {
        participantIds: [TARGET_A_ID, TARGET_B_ID],
        isGroup: false,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

// ---------------------------------------------------------------------------
// Tests: IDOR-safe participant gate
// ---------------------------------------------------------------------------

describe('DmService — IDOR-safe participant gate', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('sendMessage: non-participant gets 404 NotFoundException', async () => {
    // isParticipant → no rows
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(
      service.sendMessage(CONV_ID, 'user-outsider', {
        content: 'Hello',
        idempotencyKey: 'idem-001',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);

    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('listMessages: non-participant gets 404 NotFoundException', async () => {
    // isParticipant → no rows
    mockSelect.mockReturnValue(makeSelectChain([]));

    await expect(service.listMessages(CONV_ID, 'user-outsider')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('sendMessage: participant succeeds and inserts message', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // isParticipant → found
        return makeSelectChain([{ id: 'part-001' }]);
      }
      // getConversationParticipantIds for fan-out
      return makeSelectChain([{ user_id: CREATOR_ID }, { user_id: TARGET_A_ID }]);
    });

    mockInsert.mockReturnValue(makeInsertChain([mockMsgRow]));

    const result = await service.sendMessage(CONV_ID, CREATOR_ID, {
      content: 'Hello!',
      idempotencyKey: 'idem-key-001',
    });

    expect(result.id).toBe(MSG_ID);
    expect(result.conversationId).toBe(CONV_ID);
    expect(result.authorId).toBe(CREATOR_ID);
    expect(emitter.emit).toHaveBeenCalledWith('dm.message', expect.objectContaining({
      conversationId: CONV_ID,
      senderId: CREATOR_ID,
    }));
  });

  it('listMessages: participant gets messages list', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // isParticipant → found
        return makeSelectChain([{ id: 'part-001' }]);
      }
      // message rows
      return makeSelectChain([mockMsgRow]);
    });

    const result = await service.listMessages(CONV_ID, CREATOR_ID);
    expect(result.messages).toHaveLength(1);
    expect(result.messages[0]!.id).toBe(MSG_ID);
    expect(result.nextCursor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Tests: Idempotency (sendMessage)
// ---------------------------------------------------------------------------

describe('DmService — sendMessage idempotency', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('duplicate (conversationId, idempotencyKey) returns same message without re-inserting', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // isParticipant → found
        return makeSelectChain([{ id: 'part-001' }]);
      }
      // idempotent replay: fetch existing row
      return makeSelectChain([mockMsgRow]);
    });

    // ON CONFLICT DO NOTHING: empty returning (conflict)
    mockInsert.mockReturnValue(makeInsertChain([]));

    const result = await service.sendMessage(CONV_ID, CREATOR_ID, {
      content: 'Hello!',
      idempotencyKey: 'idem-key-001',
    });

    expect(result.id).toBe(MSG_ID);
    // ON CONFLICT path: insert was attempted once, returned nothing
    expect(mockInsert).toHaveBeenCalledTimes(1);
    // Fan-out is NOT emitted for idempotent replay (isNewInsert = false)
    expect(emitter.emit).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Tests: listConversations
// ---------------------------------------------------------------------------

describe('DmService — listConversations', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('returns empty list when caller has no DM conversations', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    const result = await service.listConversations(CREATOR_ID);
    expect(result.conversations).toEqual([]);
  });

  it('returns conversations with participant details and last-message preview', async () => {
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // convRows
        return makeSelectChain([mockConvRow]);
      }
      if (selectCallCount === 2) {
        // participantRows
        return makeSelectChain([
          { conversation_id: CONV_ID, user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
          { conversation_id: CONV_ID, user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
        ]);
      }
      return makeSelectChain([]);
    });

    // distinctOn for last messages
    mockSelectDistinctOn.mockImplementation(() => {
      const chain = makeSelectChain([
        {
          conversation_id: CONV_ID,
          id: MSG_ID,
          content: 'Hello!',
          created_at: NOW,
          author_id: CREATOR_ID,
        },
      ]);
      return chain;
    });

    const result = await service.listConversations(CREATOR_ID);
    expect(result.conversations).toHaveLength(1);
    expect(result.conversations[0]!.id).toBe(CONV_ID);
    expect(result.conversations[0]!.lastMessage).not.toBeNull();
    expect(result.conversations[0]!.lastMessage!.content).toBe('Hello!');
    expect(result.conversations[0]!.participants).toHaveLength(2);
  });
});
