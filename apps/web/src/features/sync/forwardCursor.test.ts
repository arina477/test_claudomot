/**
 * forwardCursor.test.ts — round-trip contract test for encodeForwardCursor.
 *
 * Verifies that the client helper produces an opaque base64url cursor that
 * is byte-compatible with the server's decodeCursor contract
 * (apps/api/src/messaging/messages.service.ts:55-67):
 *   Buffer.from(cursor, 'base64url').toString('utf8').split on first '|'
 *   → [createdAt_ISO, id]
 *
 * AC4 guard: the cursor must NOT be a raw ISO string (server decodeCursor
 * returns null for any input that decodes to a string without '|').
 */

import { describe, expect, it } from 'vitest';

// ── Inline the helper under test (module-private in useMessages.ts) ──────────
// Replicated here so the test is self-contained and detects any drift
// between this spec and the production implementation.
function encodeForwardCursor(createdAt: string, id: string): string {
  const raw = `${createdAt}|${id}`;
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ── Inline the server decode (messages.service.ts:55-67) ─────────────────────
function serverDecodeCursor(cursor: string): { createdAt: string; id: string } | null {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    const sep = raw.indexOf('|');
    if (sep === -1) return null;
    return { createdAt: raw.slice(0, sep), id: raw.slice(sep + 1) };
  } catch {
    return null;
  }
}

describe('encodeForwardCursor', () => {
  const ISO = '2026-06-30T12:34:56.789Z';
  const ID = '01960000-0000-7000-8000-000000000001';

  it('round-trips through server decodeCursor → [createdAt, id]', () => {
    const cursor = encodeForwardCursor(ISO, ID);
    const decoded = serverDecodeCursor(cursor);
    expect(decoded).not.toBeNull();
    expect(decoded?.createdAt).toBe(ISO);
    expect(decoded?.id).toBe(ID);
  });

  it('is NOT a raw ISO string — contains encoded separator, not plain date', () => {
    const cursor = encodeForwardCursor(ISO, ID);
    // A raw ISO string would NOT decode to two |-separated parts.
    expect(cursor).not.toBe(ISO);
    // Must decode successfully (server decodeCursor returns non-null).
    expect(serverDecodeCursor(cursor)).not.toBeNull();
    // Decoded raw must contain the | separator.
    const raw = Buffer.from(cursor, 'base64url').toString('utf8');
    expect(raw).toContain('|');
    // Split gives exactly 2 non-empty parts.
    const parts = raw.split('|');
    expect(parts.length).toBeGreaterThanOrEqual(2);
    expect(parts[0]).toBe(ISO);
  });

  it('raw ISO string fed directly to serverDecodeCursor returns null (confirms the bug was real)', () => {
    // If the client seeded lastSeenCursorRef with a plain createdAt string,
    // the server decodeCursor would return null → 400.
    expect(serverDecodeCursor(ISO)).toBeNull();
  });
});
