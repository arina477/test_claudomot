/**
 * PrivacyService unit tests + scrubPii PII-scrubbing contract — wave-35/36.
 *
 * Covers:
 *   - PrivacyService.getPrivacy: returns mapped PrivacySettingsResponse; defensive default
 *   - PrivacyService.updatePrivacy: persists BOTH profile_visibility AND who_can_dm columns;
 *     includes updated_at; returns result of getPrivacy (re-read after write)
 *   - scrubPii (Sentry): imported from the REAL instrument.ts (not a replica);
 *     strips user.{email,username,ip_address} + request.{data,cookies}; returns the event
 *
 * db is mocked via vi.mock — no real Postgres. Integration coverage is in
 * test/integration/privacy-visibility-authz.spec.ts.
 *
 * Side-effect note: importing instrument.ts loads @sentry/nestjs but does NOT
 * call Sentry.init — the NODE_ENV!=='test' guard prevents it. Confirmed clean.
 */

// ---------------------------------------------------------------------------
// db module mock — must appear before any SUT import (Vitest hoisting)
// ---------------------------------------------------------------------------

vi.mock('../db/index', () => ({
  db: {
    select: vi.fn(),
    update: vi.fn(),
  },
}));

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '../db/index';
import { scrubPii } from '../instrument';
import type { AppendPrivacyEventService } from './append-privacy-event.service';
import { PrivacyService } from './privacy.service';

// Typed references to mocked db methods — avoids per-test casting noise.
type MockFn = ReturnType<typeof vi.fn>;
const mockSelect = db.select as unknown as MockFn;
const mockUpdate = db.update as unknown as MockFn;

// ---------------------------------------------------------------------------
// Chain helpers — match servers.service.spec.ts pattern exactly
// ---------------------------------------------------------------------------

/**
 * Thennable select chain. Every fluent method returns `this`, and awaiting
 * the chain resolves with `resolveWith`.
 */
function makeSelectChain(resolveWith: unknown[]) {
  const chain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle query chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(resolveWith).then(res, rej),
  };
  for (const m of ['from', 'where', 'limit', 'innerJoin', 'orderBy']) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  return chain;
}

/**
 * Thennable update chain: db.update(table).set(data).where(cond) → void.
 *
 * Pass `captureSet` to intercept the object passed to .set() — used to assert
 * that updatePrivacy persists BOTH privacy columns in a single UPDATE call.
 */
function makeUpdateChain(captureSet?: { value: Record<string, unknown> }) {
  const whereChain: Record<string, unknown> = {
    // biome-ignore lint/suspicious/noThenProperty: intentional thenable mock for drizzle update chain
    then: (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
      Promise.resolve(undefined).then(res, rej),
  };
  const setChain: Record<string, unknown> = {};
  setChain.where = vi.fn().mockReturnValue(whereChain);
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn((data: Record<string, unknown>) => {
    if (captureSet) captureSet.value = data;
    return setChain;
  });
  return chain;
}

// ---------------------------------------------------------------------------
// PrivacyService — getPrivacy
// ---------------------------------------------------------------------------

describe('PrivacyService.getPrivacy', () => {
  let sut: PrivacyService;

  beforeEach(() => {
    vi.clearAllMocks();
    // PrivacyService has no constructor dependencies — instantiate directly.
    sut = new PrivacyService({
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService);
  });

  it('returns mapped PrivacySettingsResponse for a real user row', async () => {
    mockSelect.mockReturnValue(
      makeSelectChain([
        { profile_visibility: 'server-members', who_can_dm: 'nobody', show_presence: false },
      ]),
    );

    const result = await sut.getPrivacy('user-get-1');

    expect(result).toEqual({
      profileVisibility: 'server-members',
      whoCanDm: 'nobody',
      showPresence: false,
    });
  });

  it('maps profile_visibility, who_can_dm, and show_presence columns to camelCase response keys', async () => {
    mockSelect.mockReturnValue(
      makeSelectChain([
        { profile_visibility: 'nobody', who_can_dm: 'server-members', show_presence: true },
      ]),
    );

    const result = await sut.getPrivacy('user-get-2');

    // Confirm camelCase mapping (NOT the raw snake_case column names)
    expect(result).toHaveProperty('profileVisibility', 'nobody');
    expect(result).toHaveProperty('whoCanDm', 'server-members');
    expect(result).toHaveProperty('showPresence', true);
  });

  it('returns everyone/everyone/true defaults defensively when user row is absent', async () => {
    mockSelect.mockReturnValue(makeSelectChain([]));

    const result = await sut.getPrivacy('non-existent-user');

    // Default path (columns are NOT NULL DEFAULT 'everyone'/true) — defensive fallback
    expect(result).toEqual({
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: true,
    });
  });
});

// ---------------------------------------------------------------------------
// PrivacyService — updatePrivacy
// ---------------------------------------------------------------------------

describe('PrivacyService.updatePrivacy', () => {
  let sut: PrivacyService;

  beforeEach(() => {
    vi.clearAllMocks();
    sut = new PrivacyService({
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService);
  });

  it('persists profile_visibility, who_can_dm, AND show_presence columns in a single UPDATE call', async () => {
    const captured: { value: Record<string, unknown> } = { value: {} };
    mockUpdate.mockReturnValue(makeUpdateChain(captured));
    // getPrivacy is called after the UPDATE — return a post-write row
    mockSelect.mockReturnValue(
      makeSelectChain([
        { profile_visibility: 'nobody', who_can_dm: 'server-members', show_presence: false },
      ]),
    );

    await sut.updatePrivacy('user-upd-1', {
      profileVisibility: 'nobody',
      whoCanDm: 'server-members',
      showPresence: false,
    });

    // All three columns must be present in the .set() payload — full replace
    expect(captured.value).toMatchObject({
      profile_visibility: 'nobody',
      who_can_dm: 'server-members',
      show_presence: false,
    });
  });

  it('includes updated_at (a Date) in the UPDATE set payload', async () => {
    const captured: { value: Record<string, unknown> } = { value: {} };
    mockUpdate.mockReturnValue(makeUpdateChain(captured));
    mockSelect.mockReturnValue(
      makeSelectChain([
        { profile_visibility: 'everyone', who_can_dm: 'everyone', show_presence: true },
      ]),
    );

    const before = Date.now();
    await sut.updatePrivacy('user-upd-2', {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: true,
    });
    const after = Date.now();

    const updatedAt = captured.value?.updated_at;
    expect(updatedAt).toBeInstanceOf(Date);
    const ts = (updatedAt as Date).getTime();
    // Timestamp must fall within the test execution window
    expect(ts).toBeGreaterThanOrEqual(before);
    expect(ts).toBeLessThanOrEqual(after);
  });

  it('returns the result of getPrivacy (re-reads persisted state after write)', async () => {
    mockUpdate.mockReturnValue(makeUpdateChain());
    mockSelect.mockReturnValue(
      makeSelectChain([
        { profile_visibility: 'nobody', who_can_dm: 'server-members', show_presence: false },
      ]),
    );

    const result = await sut.updatePrivacy('user-upd-3', {
      profileVisibility: 'nobody',
      whoCanDm: 'server-members',
      showPresence: false,
    });

    // Return value reflects the post-write DB read, not the DTO directly
    expect(result).toEqual({
      profileVisibility: 'nobody',
      whoCanDm: 'server-members',
      showPresence: false,
    });
  });

  it('calls db.update exactly once per updatePrivacy invocation', async () => {
    mockUpdate.mockReturnValue(makeUpdateChain());
    mockSelect.mockReturnValue(
      makeSelectChain([
        { profile_visibility: 'everyone', who_can_dm: 'everyone', show_presence: true },
      ]),
    );

    await sut.updatePrivacy('user-upd-4', {
      profileVisibility: 'everyone',
      whoCanDm: 'everyone',
      showPresence: true,
    });

    expect(mockUpdate).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// scrubPii — PII scrubbing contract (imported from instrument.ts)
//
// scrubPii is exported from apps/api/src/instrument.ts and passed to
// Sentry.init({ beforeSend: scrubPii }). Importing it here exercises the REAL
// SUT — any drift in instrument.ts (e.g. dropping a delete) will immediately
// break these tests. Sentry.init is NOT called because instrument.ts guards it
// behind `if (process.env.NODE_ENV !== 'test')`.
// ---------------------------------------------------------------------------

describe('scrubPii — PII scrubbing contract (imported from instrument.ts)', () => {
  it('removes user.email, user.username, and user.ip_address; keeps non-PII user fields', () => {
    const event = {
      user: {
        id: 'u-sentry-1',
        email: 'alice@example.com',
        username: 'alice',
        ip_address: '203.0.113.4',
        extra_non_pii: 'keep-me',
      },
      message: 'test error',
    };

    const result = scrubPii(event);

    expect(result.user).not.toHaveProperty('email');
    expect(result.user).not.toHaveProperty('username');
    expect(result.user).not.toHaveProperty('ip_address');
    // Non-PII user fields must be preserved
    expect(result.user).toHaveProperty('id', 'u-sentry-1');
    expect(result.user).toHaveProperty('extra_non_pii', 'keep-me');
  });

  it('removes request.data and request.cookies; keeps non-PII request fields', () => {
    const event = {
      request: {
        url: 'https://api.studyhall.app/profile/privacy',
        method: 'PUT',
        data: '{"whoCanDm":"nobody"}',
        cookies: { session: 'tok-secret-123' },
      },
    };

    const result = scrubPii(event);

    expect(result.request).not.toHaveProperty('data');
    expect(result.request).not.toHaveProperty('cookies');
    // Non-PII request fields must survive scrubbing
    expect(result.request).toHaveProperty('url', 'https://api.studyhall.app/profile/privacy');
    expect(result.request).toHaveProperty('method', 'PUT');
  });

  it('returns the same event object reference (mutation in-place, not a copy)', () => {
    const event = {
      user: { email: 'x@y.com', username: 'x', ip_address: '1.2.3.4' },
      request: { data: 'body', cookies: { c: '1' } },
    };

    const result = scrubPii(event);

    // beforeSend mutates and returns the same object — no defensive copy
    expect(result).toBe(event);
  });

  it('is a no-op (no throw) when event has neither user nor request', () => {
    const event = { message: 'no pii here', level: 'info' as const };

    expect(() => scrubPii(event)).not.toThrow();

    const result = scrubPii(event);
    expect(result.message).toBe('no pii here');
  });

  it('handles user-only event (no request field) without throwing', () => {
    const event = { user: { email: 'pii@test.com', username: 'pii_user', ip_address: '10.0.0.1' } };

    const result = scrubPii(event);

    expect(result.user).not.toHaveProperty('email');
    expect(result.user).not.toHaveProperty('username');
    expect(result.user).not.toHaveProperty('ip_address');
    expect(result).not.toHaveProperty('request');
  });

  it('handles request-only event (no user field) without throwing', () => {
    const event = {
      request: { data: '{"password":"s3cret"}', cookies: { auth: 'tok' } },
    };

    const result = scrubPii(event);

    expect(result.request).not.toHaveProperty('data');
    expect(result.request).not.toHaveProperty('cookies');
    expect(result).not.toHaveProperty('user');
  });

  it('handles event with user.email already absent (idempotent delete)', () => {
    // If email is already missing, delete is a no-op — must not throw
    const event = { user: { id: 'no-email-user', username: 'noe' } };

    expect(() => scrubPii(event)).not.toThrow();

    const result = scrubPii(event);
    expect(result.user).not.toHaveProperty('username');
    expect(result.user).toHaveProperty('id', 'no-email-user');
  });
});
