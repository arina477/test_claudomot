/**
 * EducatorAnalyticsService — wave-76 M13 (B-2, block 80505bb1).
 *
 * Aggregate correctness + empty-server zero. The db query layer is stubbed with
 * a thenable drizzle-chain mock (same pattern as educator-tools.controller.spec);
 * each select() call in getServerAnalytics resolves the next queued result in the
 * order the service ISSUES them. getServerAnalytics runs its branches under
 * Promise.all, so each branch executes synchronously up to its first await first.
 * The observed db.select() order is therefore:
 *   1. countMembers
 *   2. roleBreakdown[roles]
 *   3. messageVolume
 *   4. assignmentCount
 *   5. submissionCount
 *   6. sessionCount
 *   7. roleBreakdown[noRole]   ← runs after the roles select resolves (2nd await)
 *
 * The result shape is validated against ServerAnalyticsSchema so any drift
 * between the service output and the shared contract fails the test.
 */

import { ServerAnalyticsSchema } from '@studyhall/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
import { EducatorAnalyticsService } from './educator-analytics.service';

type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;

function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'orderBy', 'innerJoin', 'leftJoin', 'groupBy']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

const SERVER_ID = 'server-analytics';

// Queue db.select() results in the exact order getServerAnalytics issues them.
function queueSelects(results: unknown[][]) {
  const chains = results.map((r) => makeSelectChain(r));
  let i = 0;
  mockSelect.mockImplementation(() => chains[i++] ?? makeSelectChain([]));
}

describe('EducatorAnalyticsService.getServerAnalytics', () => {
  let service: EducatorAnalyticsService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new EducatorAnalyticsService();
  });

  it('aggregates seeded data correctly + matches the shared schema', async () => {
    // Selects in Promise.all first-await order (see header):
    //   1. countMembers        → [{ value: 5 }]
    //   2. roleBreakdown roles → [{ roleId, roleName, memberCount }, ...]
    //   3. messageVolume       → [{ value: 42 }]
    //   4. assignmentCount     → [{ value: 3 }]
    //   5. submissionCount     → [{ value: 7 }]
    //   6. sessionCount        → [{ value: 2 }]
    //   7. roleBreakdown noRole→ [{ value: 1 }]
    queueSelects([
      [{ value: 5 }],
      [
        { roleId: 'r1', roleName: 'Teacher', memberCount: 2 },
        { roleId: 'r2', roleName: 'Student', memberCount: 2 },
      ],
      [{ value: 42 }],
      [{ value: 3 }],
      [{ value: 7 }],
      [{ value: 2 }],
      [{ value: 1 }],
    ]);

    const result = await service.getServerAnalytics(SERVER_ID);

    expect(result.memberCount).toBe(5);
    expect(result.roleBreakdown).toEqual([
      { roleId: 'r1', roleName: 'Teacher', memberCount: 2 },
      { roleId: 'r2', roleName: 'Student', memberCount: 2 },
      { roleId: '', roleName: 'No role', memberCount: 1 },
    ]);
    expect(result.messageVolume).toBe(42);
    expect(result.assignmentCount).toBe(3);
    expect(result.submissionRollup).toEqual({ assignmentCount: 3, submissionCount: 7 });
    expect(result.recentActivity).toEqual([
      { type: 'message_sent', count: 42 },
      { type: 'assignment_submitted', count: 7 },
      { type: 'session_scheduled', count: 2 },
    ]);

    // Contract guard: output must satisfy the shared ServerAnalytics schema.
    expect(() => ServerAnalyticsSchema.parse(result)).not.toThrow();
  });

  it('does NOT emit a "No role" bucket when every member has a role', async () => {
    queueSelects([
      [{ value: 2 }],
      [{ roleId: 'r1', roleName: 'Teacher', memberCount: 2 }],
      [{ value: 10 }],
      [{ value: 1 }],
      [{ value: 4 }],
      [{ value: 0 }],
      [{ value: 0 }], // noRole count = 0 → bucket suppressed (7th select)
    ]);

    const result = await service.getServerAnalytics(SERVER_ID);
    expect(result.roleBreakdown).toEqual([{ roleId: 'r1', roleName: 'Teacher', memberCount: 2 }]);
  });

  it('empty server → zero-valued aggregates (not an error)', async () => {
    // Every count query resolves empty; count-select rows are [] → value defaults 0.
    queueSelects([[], [], [], [], [], [], []]);

    const result = await service.getServerAnalytics(SERVER_ID);

    expect(result).toEqual({
      memberCount: 0,
      roleBreakdown: [],
      messageVolume: 0,
      assignmentCount: 0,
      submissionRollup: { assignmentCount: 0, submissionCount: 0 },
      recentActivity: [
        { type: 'message_sent', count: 0 },
        { type: 'assignment_submitted', count: 0 },
        { type: 'session_scheduled', count: 0 },
      ],
    });
    expect(() => ServerAnalyticsSchema.parse(result)).not.toThrow();
  });
});
