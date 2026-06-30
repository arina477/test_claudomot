/**
 * T-3 CONTRACT TESTS — presence.ts Zod schemas
 *
 * Pure parse tests: no DB, no mocks, no network.
 * Each schema gets:
 *   VALID   — correct payload → safeParse.success === true, data round-trips
 *   INVALID — wrong payload  → safeParse.success === false, issue path/code asserted
 */
import { describe, expect, it } from 'vitest';
import {
  PRESENCE_EVENTS,
  PresenceOfflinePayloadSchema,
  PresenceOnlinePayloadSchema,
  PresenceSnapshotSchema,
  PresenceStateSchema,
  PresenceStatusSchema,
  TypingActiveSchema,
  TypingStartSchema,
  TypingStopSchema,
} from './presence.js';

// Stable UUID fixtures
const UUID_A = '00000000-0000-4000-a000-000000000001';
const UUID_B = '00000000-0000-4000-a000-000000000002';
const NOT_A_UUID = 'not-a-uuid';

// ---------------------------------------------------------------------------
// PresenceStatusSchema
// ---------------------------------------------------------------------------
describe('PresenceStatusSchema', () => {
  it('VALID: parses "online"', () => {
    const result = PresenceStatusSchema.safeParse('online');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('online');
  });

  it('VALID: parses "offline"', () => {
    const result = PresenceStatusSchema.safeParse('offline');
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toBe('offline');
  });

  it('INVALID: rejects "away" — not in enum', () => {
    const result = PresenceStatusSchema.safeParse('away');
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.code).toBe('invalid_enum_value');
    }
  });
});

// ---------------------------------------------------------------------------
// PresenceStateSchema
// ---------------------------------------------------------------------------
describe('PresenceStateSchema', () => {
  it('VALID: round-trips a correct payload', () => {
    const input = { userId: UUID_A, status: 'online' as const };
    const result = PresenceStateSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('INVALID: userId is not a UUID', () => {
    const result = PresenceStateSchema.safeParse({ userId: NOT_A_UUID, status: 'online' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing required field status', () => {
    const result = PresenceStateSchema.safeParse({ userId: UUID_A });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('status');
      expect(issue?.code).toBe('invalid_type');
    }
  });

  it('INVALID: status is "away" — not in enum', () => {
    const result = PresenceStateSchema.safeParse({ userId: UUID_A, status: 'away' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('status');
      expect(issue?.code).toBe('invalid_enum_value');
    }
  });
});

// ---------------------------------------------------------------------------
// PresenceSnapshotSchema
// ---------------------------------------------------------------------------
describe('PresenceSnapshotSchema', () => {
  it('VALID: round-trips a snapshot with multiple members', () => {
    const input = {
      members: [
        { userId: UUID_A, status: 'online' as const },
        { userId: UUID_B, status: 'offline' as const },
      ],
    };
    const result = PresenceSnapshotSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('VALID: empty members array is accepted', () => {
    const result = PresenceSnapshotSchema.safeParse({ members: [] });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual({ members: [] });
  });

  it('INVALID: member with non-uuid userId', () => {
    const result = PresenceSnapshotSchema.safeParse({
      members: [{ userId: NOT_A_UUID, status: 'online' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // path: ['members', 0, 'userId']
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('members');
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing members field', () => {
    const result = PresenceSnapshotSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('members');
      expect(issue?.code).toBe('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// PresenceOnlinePayloadSchema
// ---------------------------------------------------------------------------
describe('PresenceOnlinePayloadSchema', () => {
  it('VALID: round-trips { userId }', () => {
    const input = { userId: UUID_A };
    const result = PresenceOnlinePayloadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('INVALID: userId is not a UUID', () => {
    const result = PresenceOnlinePayloadSchema.safeParse({ userId: NOT_A_UUID });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing userId entirely', () => {
    const result = PresenceOnlinePayloadSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// PresenceOfflinePayloadSchema
// ---------------------------------------------------------------------------
describe('PresenceOfflinePayloadSchema', () => {
  it('VALID: round-trips { userId }', () => {
    const input = { userId: UUID_B };
    const result = PresenceOfflinePayloadSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('INVALID: userId is not a UUID', () => {
    const result = PresenceOfflinePayloadSchema.safeParse({ userId: NOT_A_UUID });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing userId entirely', () => {
    const result = PresenceOfflinePayloadSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// TypingStartSchema
// ---------------------------------------------------------------------------
describe('TypingStartSchema', () => {
  it('VALID: round-trips { channelId }', () => {
    const input = { channelId: UUID_A };
    const result = TypingStartSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('INVALID: channelId is not a UUID', () => {
    const result = TypingStartSchema.safeParse({ channelId: NOT_A_UUID });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('channelId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing channelId', () => {
    const result = TypingStartSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('channelId');
      expect(issue?.code).toBe('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// TypingStopSchema
// ---------------------------------------------------------------------------
describe('TypingStopSchema', () => {
  it('VALID: round-trips { channelId }', () => {
    const input = { channelId: UUID_B };
    const result = TypingStopSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('INVALID: channelId is not a UUID', () => {
    const result = TypingStopSchema.safeParse({ channelId: NOT_A_UUID });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('channelId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing channelId', () => {
    const result = TypingStopSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('channelId');
      expect(issue?.code).toBe('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// TypingActiveSchema
// ---------------------------------------------------------------------------
describe('TypingActiveSchema', () => {
  it('VALID: round-trips a payload with multiple typers', () => {
    const input = {
      channelId: UUID_A,
      typers: [
        { userId: UUID_A, displayName: 'Alice' },
        { userId: UUID_B, displayName: 'Bob' },
      ],
    };
    const result = TypingActiveSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('VALID: empty typers array is accepted', () => {
    const input = { channelId: UUID_A, typers: [] };
    const result = TypingActiveSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data).toEqual(input);
  });

  it('INVALID: channelId is not a UUID', () => {
    const result = TypingActiveSchema.safeParse({
      channelId: NOT_A_UUID,
      typers: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('channelId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: typer missing displayName', () => {
    const result = TypingActiveSchema.safeParse({
      channelId: UUID_A,
      typers: [{ userId: UUID_A }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      // path: ['typers', 0, 'displayName']
      expect(issue?.path).toContain('typers');
      expect(issue?.path).toContain('displayName');
      expect(issue?.code).toBe('invalid_type');
    }
  });

  it('INVALID: typer with non-uuid userId', () => {
    const result = TypingActiveSchema.safeParse({
      channelId: UUID_A,
      typers: [{ userId: NOT_A_UUID, displayName: 'Alice' }],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      // path: ['typers', 0, 'userId']
      expect(issue?.path).toContain('typers');
      expect(issue?.path).toContain('userId');
      expect(issue?.code).toBe('invalid_string');
    }
  });

  it('INVALID: missing typers field', () => {
    const result = TypingActiveSchema.safeParse({ channelId: UUID_A });
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue?.path).toContain('typers');
      expect(issue?.code).toBe('invalid_type');
    }
  });
});

// ---------------------------------------------------------------------------
// PRESENCE_EVENTS — wire-contract constants
// ---------------------------------------------------------------------------
describe('PRESENCE_EVENTS', () => {
  it('SNAPSHOT is exactly "presence:snapshot"', () => {
    expect(PRESENCE_EVENTS.SNAPSHOT).toBe('presence:snapshot');
  });

  it('ONLINE is exactly "presence:online"', () => {
    expect(PRESENCE_EVENTS.ONLINE).toBe('presence:online');
  });

  it('OFFLINE is exactly "presence:offline"', () => {
    expect(PRESENCE_EVENTS.OFFLINE).toBe('presence:offline');
  });

  it('TYPING_START is exactly "typing:start"', () => {
    expect(PRESENCE_EVENTS.TYPING_START).toBe('typing:start');
  });

  it('TYPING_STOP is exactly "typing:stop"', () => {
    expect(PRESENCE_EVENTS.TYPING_STOP).toBe('typing:stop');
  });

  it('TYPING_ACTIVE is exactly "typing:active"', () => {
    expect(PRESENCE_EVENTS.TYPING_ACTIVE).toBe('typing:active');
  });

  it('has exactly 6 event keys — no additions or renames silently', () => {
    expect(Object.keys(PRESENCE_EVENTS)).toHaveLength(6);
  });

  it('all event values match the declared wire-contract set', () => {
    const expected = new Set([
      'presence:snapshot',
      'presence:online',
      'presence:offline',
      'typing:start',
      'typing:stop',
      'typing:active',
    ]);
    for (const value of Object.values(PRESENCE_EVENTS)) {
      expect(expected.has(value)).toBe(true);
    }
  });
});
