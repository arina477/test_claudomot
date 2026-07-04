/**
 * DmService unit tests — wave-46 M8 direct messages (tasks a48f1910 + 32f5d29e)
 *                         wave-47 M8 DM entry-point (task 10967558)
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
 *
 *   getDmCandidates (wave-47):
 *     - co-members returned with displayName + avatarUrl
 *     - caller excluded from own candidate list
 *     - who_can_dm='nobody' co-member excluded
 *     - co-member shared across multiple servers appears once (dedup)
 *     - caller with no servers → 200 []
 *     - caller with servers but no co-members → 200 []
 */

import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
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
    'groupBy',
    'having',
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
      if (selectCallCount === 2) {
        // find-or-create lookup: no existing 1:1 → fall through to insert
        return makeSelectChain([]);
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
      if (selectCallCount === 3) {
        // find-or-create lookup: no existing 1:1 → fall through to insert
        return makeSelectChain([]);
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
      const txInsert = vi
        .fn()
        .mockReturnValue(makeInsertChain([{ ...mockConvRow, is_group: true }]));
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
      if (selectCallCount === 2) {
        // find-or-create lookup: no existing 1:1 → fall through to insert
        return makeSelectChain([]);
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
    expect(emitter.emit).toHaveBeenCalledWith(
      'dm.message',
      expect.objectContaining({
        conversationId: CONV_ID,
        senderId: CREATOR_ID,
      }),
    );
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
    const firstMessage = result.messages[0] as (typeof result.messages)[number];
    expect(firstMessage.id).toBe(MSG_ID);
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
          {
            conversation_id: CONV_ID,
            user_id: CREATOR_ID,
            display_name: 'Alice',
            avatar_url: null,
          },
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
    const conv0 = result.conversations[0] as (typeof result.conversations)[number];
    expect(conv0.id).toBe(CONV_ID);
    expect(conv0.lastMessage).not.toBeNull();
    const lastMsg = conv0.lastMessage as NonNullable<typeof conv0.lastMessage>;
    expect(lastMsg.content).toBe('Hello!');
    expect(conv0.participants).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// Tests: find-or-create for 1:1 conversations (M3 fix — wave-46 B-6 review)
// ---------------------------------------------------------------------------

describe('DmService — createConversation find-or-create (1:1)', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('returns the SAME conversation id on a repeat 1:1 (find-or-create)', async () => {
    // Scenario: caller + TARGET_A already have a 1:1 conv (CONV_ID).
    // The second createConversation call should return the existing conv,
    // NOT insert a new one.
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // enforceWhoCanDm: target's who_can_dm
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      if (selectCallCount === 2) {
        // find-or-create lookup: existingRows — returns a row (existing 1:1 found)
        return makeSelectChain([{ conversation_id: CONV_ID, participant_count: 2 }]);
      }
      if (selectCallCount === 3) {
        // participantRows for the existing conversation
        return makeSelectChain([
          { user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
          { user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
        ]);
      }
      // existingConv row fetch
      return makeSelectChain([mockConvRow]);
    });

    const result = await service.createConversation(CREATOR_ID, {
      participantIds: [TARGET_A_ID],
    });

    // Must return the existing conversation id — no new transaction/insert
    expect(result.id).toBe(CONV_ID);
    expect(result.isGroup).toBe(false);
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it('creates a NEW conversation when no prior 1:1 exists', async () => {
    // find-or-create lookup returns empty → falls through to insert
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) {
        // enforceWhoCanDm
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      if (selectCallCount === 2) {
        // find-or-create lookup: no existing 1:1
        return makeSelectChain([]);
      }
      // participant details after insert
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
    // Transaction MUST be called for a new conversation
    expect(mockTransaction).toHaveBeenCalledTimes(1);
  });

  it('does NOT apply find-or-create for group DMs (is_group=true) — always inserts new', async () => {
    // Group DM with 2 non-caller participants → is_group=true, find-or-create skipped.
    let selectCallCount = 0;
    const TARGET_C = 'user-target-c';
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // enforceWhoCanDm for 2 targets (2 calls)
      if (selectCallCount <= 2) {
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      // participant details after insert
      return makeSelectChain([
        { user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
        { user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
        { user_id: TARGET_C, display_name: 'Carol', avatar_url: null },
      ]);
    });

    const groupConvRow = { ...mockConvRow, id: 'conv-group-001', is_group: true };
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      const txInsert = vi.fn().mockReturnValue(makeInsertChain([groupConvRow]));
      const tx = { insert: txInsert };
      return fn(tx);
    });

    const result = await service.createConversation(CREATOR_ID, {
      participantIds: [TARGET_A_ID, TARGET_C],
      isGroup: true,
    });

    expect(result.isGroup).toBe(true);
    // Transaction must be called — find-or-create does NOT run for groups
    expect(mockTransaction).toHaveBeenCalledTimes(1);
    // find-or-create select never fired: only 2 who_can_dm checks + 1 detail fetch = 3 selects
    expect(selectCallCount).toBe(3);
  });

  it('creates distinct conversations for different targets (no cross-pair dedup)', async () => {
    // First 1:1: CREATOR + TARGET_A → no existing
    // Second 1:1: CREATOR + TARGET_B → also no existing
    // Both should result in separate transactions (not deduplicated together)
    let selectCallCount = 0;
    mockSelect.mockImplementation(() => {
      selectCallCount++;
      // Alternating: who_can_dm → find-or-create lookup → participant details
      // For simplicity: all find-or-create lookups return empty (fresh convs)
      if (selectCallCount % 3 === 1) {
        return makeSelectChain([{ who_can_dm: 'everyone' }]);
      }
      if (selectCallCount % 3 === 2) {
        return makeSelectChain([]); // no existing 1:1
      }
      return makeSelectChain([
        { user_id: CREATOR_ID, display_name: 'Alice', avatar_url: null },
        { user_id: TARGET_A_ID, display_name: 'Bob', avatar_url: null },
      ]);
    });

    let txCallCount = 0;
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      txCallCount++;
      const convRow = { ...mockConvRow, id: `conv-new-00${txCallCount}` };
      const txInsert = vi.fn().mockReturnValue(makeInsertChain([convRow]));
      const tx = { insert: txInsert };
      return fn(tx);
    });

    const r1 = await service.createConversation(CREATOR_ID, { participantIds: [TARGET_A_ID] });
    const r2 = await service.createConversation(CREATOR_ID, { participantIds: [TARGET_B_ID] });

    expect(r1.id).toBe('conv-new-001');
    expect(r2.id).toBe('conv-new-002');
    expect(r1.id).not.toBe(r2.id);
    expect(mockTransaction).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// Tests: getDmCandidates (wave-47 task 10967558)
// ---------------------------------------------------------------------------

describe('DmService — getDmCandidates', () => {
  let service: DmService;
  let emitter: ReturnType<typeof makeEventEmitter>;

  beforeEach(() => {
    vi.clearAllMocks();
    emitter = makeEventEmitter();
    // biome-ignore lint/suspicious/noExplicitAny: test mock
    service = new DmService(emitter as any);
  });

  it('returns co-members with displayName and avatarUrl', async () => {
    // First select: caller's server memberships (getServerIdsForUser step)
    // Second selectDistinctOn: co-member join with users
    mockSelect.mockReturnValueOnce(makeSelectChain([{ server_id: 'server-001' }]));
    mockSelectDistinctOn.mockReturnValueOnce(
      makeSelectChain([
        {
          userId: TARGET_A_ID,
          displayName: 'Alice',
          email: 'alice@example.com',
          avatarUrl: 'https://example.com/alice.png',
          who_can_dm: 'everyone',
        },
        {
          userId: TARGET_B_ID,
          displayName: 'Bob',
          email: 'bob@example.com',
          avatarUrl: null,
          who_can_dm: 'server-members',
        },
      ]),
    );

    const result = await service.getDmCandidates(CREATOR_ID);

    expect(result).toHaveLength(2);
    // sorted by displayName: Alice < Bob
    expect(result[0]).toEqual({
      userId: TARGET_A_ID,
      displayName: 'Alice',
      avatarUrl: 'https://example.com/alice.png',
    });
    expect(result[1]).toEqual({
      userId: TARGET_B_ID,
      displayName: 'Bob',
      avatarUrl: null,
    });
  });

  it('excludes who_can_dm=nobody co-members (filter happens in query — mock verifies contract)', async () => {
    // The nobody filter is enforced in the DB query (ne(users.who_can_dm, 'nobody')).
    // The mock simulates the DB already having filtered them out — only the
    // allowed user is returned, which is what the real query produces.
    mockSelect.mockReturnValueOnce(makeSelectChain([{ server_id: 'server-001' }]));
    mockSelectDistinctOn.mockReturnValueOnce(
      // nobody user is absent — DB filtered it; only TARGET_A_ID present
      makeSelectChain([
        {
          userId: TARGET_A_ID,
          displayName: 'Alice',
          email: 'alice@example.com',
          avatarUrl: null,
          who_can_dm: 'everyone',
        },
      ]),
    );

    const result = await service.getDmCandidates(CREATOR_ID);

    expect(result).toHaveLength(1);
    expect(result[0]?.userId).toBe(TARGET_A_ID);
  });

  it('deduplicates co-members shared across multiple servers (each user appears once)', async () => {
    // DISTINCT ON is in the DB query; mock returns already-deduped rows to
    // simulate what the real query produces.
    mockSelect.mockReturnValueOnce(
      makeSelectChain([{ server_id: 'server-001' }, { server_id: 'server-002' }]),
    );
    mockSelectDistinctOn.mockReturnValueOnce(
      // TARGET_A_ID was a member of both servers but appears once (DISTINCT ON)
      makeSelectChain([
        {
          userId: TARGET_A_ID,
          displayName: 'Alice',
          email: 'alice@example.com',
          avatarUrl: null,
          who_can_dm: 'everyone',
        },
      ]),
    );

    const result = await service.getDmCandidates(CREATOR_ID);

    expect(result).toHaveLength(1);
    expect(result[0]?.userId).toBe(TARGET_A_ID);
  });

  it('returns [] when caller belongs to no servers', async () => {
    // getServerIdsForUser step returns empty → short-circuit, no selectDistinctOn
    mockSelect.mockReturnValueOnce(makeSelectChain([]));

    const result = await service.getDmCandidates(CREATOR_ID);

    expect(result).toEqual([]);
    // selectDistinctOn must NOT be called when there are no servers
    expect(mockSelectDistinctOn).not.toHaveBeenCalled();
  });

  it('returns [] when caller has servers but no other co-members', async () => {
    mockSelect.mockReturnValueOnce(makeSelectChain([{ server_id: 'server-solo' }]));
    // No other members in the server
    mockSelectDistinctOn.mockReturnValueOnce(makeSelectChain([]));

    const result = await service.getDmCandidates(CREATOR_ID);

    expect(result).toEqual([]);
  });

  it('self is excluded from candidates (self-exclusion in query)', async () => {
    // ne(alias.user_id, callerId) is in the WHERE clause — mock returns only
    // the co-member (caller is absent from results, as the real query produces).
    mockSelect.mockReturnValueOnce(makeSelectChain([{ server_id: 'server-001' }]));
    mockSelectDistinctOn.mockReturnValueOnce(
      makeSelectChain([
        {
          userId: TARGET_A_ID,
          displayName: 'Alice',
          email: 'alice@example.com',
          avatarUrl: null,
          who_can_dm: 'everyone',
        },
      ]),
    );

    const result = await service.getDmCandidates(CREATOR_ID);

    // Caller (CREATOR_ID) must not appear in candidates
    const selfInResult = result.some((c) => c.userId === CREATOR_ID);
    expect(selfInResult).toBe(false);
    expect(result).toHaveLength(1);
  });
});
