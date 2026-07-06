/**
 * T-3 CONTRACT TESTS — messaging.ts Zod schemas (wave-58 addition)
 *
 * Pure parse tests: no DB, no mocks, no network.
 * Asserts the wave-58 idempotencyKey addition to MessageResponseSchema:
 *   - Optional/nullable field accepted on valid payloads (old and new consumers).
 *   - Absent field (old server payload) still parses successfully.
 *   - Present string value round-trips.
 *   - Present null value round-trips.
 */
import { describe, expect, it } from 'vitest';
import { MessageResponseSchema } from './messaging.js';

const BASE_PAYLOAD = {
  id: 'msg-abc',
  channelId: 'ch-1',
  authorId: 'user-1',
  content: 'Hello',
  createdAt: new Date().toISOString(),
  isEdited: false,
  editedAt: null,
  isDeleted: false,
  reactions: [],
  mentions: [],
};

describe('MessageResponseSchema — idempotencyKey (wave-58)', () => {
  it('VALID: parses payload without idempotencyKey (old consumer / backwards compat)', () => {
    const result = MessageResponseSchema.safeParse(BASE_PAYLOAD);
    expect(result.success).toBe(true);
    if (result.success) {
      // Field absent → undefined (optional)
      expect(result.data.idempotencyKey).toBeUndefined();
    }
  });

  it('VALID: parses payload with idempotencyKey as a UUID string', () => {
    const payload = { ...BASE_PAYLOAD, idempotencyKey: 'f47ac10b-58cc-4372-a567-0e02b2c3d479' };
    const result = MessageResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.idempotencyKey).toBe('f47ac10b-58cc-4372-a567-0e02b2c3d479');
    }
  });

  it('VALID: parses payload with idempotencyKey as null (historical/server-originated row)', () => {
    const payload = { ...BASE_PAYLOAD, idempotencyKey: null };
    const result = MessageResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.idempotencyKey).toBeNull();
    }
  });

  it('INVALID: rejects idempotencyKey as a non-string non-null value', () => {
    const payload = { ...BASE_PAYLOAD, idempotencyKey: 12345 };
    const result = MessageResponseSchema.safeParse(payload);
    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((i) => i.path.join('.'));
      expect(paths).toContain('idempotencyKey');
    }
  });
});
