import { describe, expect, it } from 'vitest';
import { isUuid } from './uuid.util';

describe('isUuid', () => {
  it('returns true for a valid v4 UUID', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
  });

  it('returns true for another valid v4 UUID', () => {
    expect(isUuid('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
  });

  it('returns false for plain string "abc"', () => {
    expect(isUuid('abc')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(isUuid('')).toBe(false);
  });

  it('returns false for numeric string "123"', () => {
    expect(isUuid('123')).toBe(false);
  });

  it('returns false for a SQL-injection-style string', () => {
    expect(isUuid("' OR '1'='1")).toBe(false);
  });

  it('returns false for a string that looks almost like a UUID but is malformed', () => {
    expect(isUuid('550e8400-e29b-41d4-a716-44665544000Z')).toBe(false);
  });

  it('returns false for a UUID with too few segments', () => {
    expect(isUuid('550e8400-e29b-41d4-a716')).toBe(false);
  });
});
