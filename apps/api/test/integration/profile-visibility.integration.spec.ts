/**
 * Integration test: wave-77 M13 leg-2 (task bf0ad2a8) — cross-server profile-view
 * visibility resolver, real-Postgres. THE SECURITY MATRIX IS THE CROWN JEWEL.
 *
 * PRIVACY-CRITICAL: a leak here exposes user data to a stranger cross-server, so
 * the matrix asserts BOTH directions — permitted views ARE visible AND every
 * forbidden view is HIDDEN. The fail-closed default (unknown visibility → hidden)
 * is proven by writing a garbage profile_visibility value directly to the DB.
 *
 * Matrix (viewer VIEWER, target various), over visibility × block × soft-delete:
 *   1. everyone                    → VISIBLE (any authed viewer)
 *   2. server-members + shared     → VISIBLE
 *   3. server-members + NOT shared → HIDDEN  (the stranger-not-leaked case)
 *   4. nobody                      → HIDDEN
 *   5. blocked (viewer→target)     → HIDDEN
 *   6. blocked (target→viewer)     → HIDDEN  (bidirectional)
 *   7. soft-deleted (deleted_at)   → HIDDEN  (even when otherwise 'everyone')
 *   8. unknown visibility value    → HIDDEN  (FAIL-CLOSED)
 *   9. self → self                 → VISIBLE (own profile always)
 *  10. missing target             → HIDDEN
 *  11. PublicProfile NEVER carries an email field (structural allowlist)
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST
import './pg-harness';
import {
  harnessQuery,
  insertFixtureMembership,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { BlocksService } from '../../src/blocks/blocks.service';
import type { AppendPrivacyEventService } from '../../src/privacy/append-privacy-event.service';
import { ProfileVisibilityService } from '../../src/profile/profile-visibility.service';

// Skip when DATABASE_URL_TEST is absent.
const SKIP = !process.env.DATABASE_URL_TEST;

// ---------------------------------------------------------------------------
// Fixture IDs
// ---------------------------------------------------------------------------
const VIEWER = 'pv-viewer';
const TARGET = 'pv-target';
const SERVER_SHARED = '00000000-0000-0000-0077-000000000001';
const SERVER_TARGET_ONLY = '00000000-0000-0000-0077-000000000002';

async function setVisibility(userId: string, value: string): Promise<void> {
  await harnessQuery('UPDATE users SET profile_visibility = $1 WHERE id = $2', [value, userId]);
}

describe.skipIf(SKIP)('ProfileVisibilityService — cross-server matrix (wave-77 bf0ad2a8)', () => {
  let visibility: ProfileVisibilityService;
  let blocksService: BlocksService;

  beforeAll(async () => {
    await setupHarness();
    const noopAppend = {
      append: vi.fn().mockResolvedValue(undefined),
    } as unknown as AppendPrivacyEventService;
    blocksService = new BlocksService(noopAppend);
    visibility = new ProfileVisibilityService(blocksService);
  });

  afterAll(async () => {
    await teardownHarness();
  });

  beforeEach(async () => {
    await truncateTables();
    await insertFixtureUser(VIEWER, 'pv-viewer@test.local', 'viewer');
    await insertFixtureUser(TARGET, 'pv-target@test.local', 'target');
    // Give the target a full academic profile so we can assert field passthrough.
    await harnessQuery(
      `UPDATE users SET display_name = $1, pronouns = $2, bio = $3, institution = $4,
         program = $5, academic_role = $6, academic_year = $7, accent_color = $8
       WHERE id = $9`,
      [
        'Target Person',
        'they/them',
        'Studying hard',
        'Test University',
        'Physics',
        'student',
        'Junior',
        '#00ffaa',
        TARGET,
      ],
    );
  });

  // 1. everyone → VISIBLE
  it('1. everyone → VISIBLE to any authed viewer', async () => {
    await setVisibility(TARGET, 'everyone');
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(true);
    if (d.visible) {
      expect(d.profile.userId).toBe(TARGET);
      expect(d.profile.displayName).toBe('Target Person');
      expect(d.profile.institution).toBe('Test University');
      expect(d.profile.academicRole).toBe('student');
    }
  });

  // 2. server-members + shared → VISIBLE
  it('2. server-members + shared server → VISIBLE', async () => {
    await setVisibility(TARGET, 'server-members');
    await insertFixtureServer(SERVER_SHARED, VIEWER, 'Shared Server');
    await insertFixtureMembership(SERVER_SHARED, VIEWER);
    await insertFixtureMembership(SERVER_SHARED, TARGET);

    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(true);
  });

  // 3. server-members + NOT shared → HIDDEN (stranger-not-leaked)
  it('3. server-members + NOT shared → HIDDEN (stranger not leaked)', async () => {
    await setVisibility(TARGET, 'server-members');
    // Target is in a server the viewer is NOT in; viewer is in none.
    await insertFixtureServer(SERVER_TARGET_ONLY, TARGET, 'Target-Only Server');
    await insertFixtureMembership(SERVER_TARGET_ONLY, TARGET);

    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 4. nobody → HIDDEN
  it('4. nobody → HIDDEN', async () => {
    await setVisibility(TARGET, 'nobody');
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 5. blocked (viewer→target) → HIDDEN even when 'everyone'
  it('5. blocked (viewer blocks target) → HIDDEN even if everyone', async () => {
    await setVisibility(TARGET, 'everyone');
    await blocksService.createBlock(VIEWER, TARGET);
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 6. blocked (target→viewer) → HIDDEN (bidirectional)
  it('6. blocked (target blocks viewer) → HIDDEN (bidirectional)', async () => {
    await setVisibility(TARGET, 'everyone');
    await blocksService.createBlock(TARGET, VIEWER);
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 7. soft-deleted → HIDDEN even when 'everyone'
  it('7. soft-deleted (deleted_at set) → HIDDEN even if everyone', async () => {
    await setVisibility(TARGET, 'everyone');
    await harnessQuery('UPDATE users SET deleted_at = now() WHERE id = $1', [TARGET]);
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 8. unknown visibility value → HIDDEN (FAIL-CLOSED)
  it('8. unknown/unrecognized visibility value → HIDDEN (fail-closed)', async () => {
    await setVisibility(TARGET, 'friends-of-friends-lol'); // not in PROFILE_VISIBILITY
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 8b. empty-string visibility → HIDDEN (fail-closed edge)
  it('8b. empty-string visibility value → HIDDEN (fail-closed)', async () => {
    await setVisibility(TARGET, '');
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(false);
  });

  // 9. self → self → VISIBLE (own profile always)
  it('9. self viewing self → VISIBLE regardless of visibility (nobody)', async () => {
    await setVisibility(TARGET, 'nobody');
    const d = await visibility.resolve(TARGET, TARGET);
    expect(d.visible).toBe(true);
    if (d.visible) {
      expect(d.profile.userId).toBe(TARGET);
    }
  });

  // 9b. self viewing self while soft-deleted → HIDDEN (a deleted account is not viewable)
  it('9b. self viewing self while soft-deleted → HIDDEN', async () => {
    await setVisibility(TARGET, 'everyone');
    await harnessQuery('UPDATE users SET deleted_at = now() WHERE id = $1', [TARGET]);
    const d = await visibility.resolve(TARGET, TARGET);
    expect(d.visible).toBe(false);
  });

  // 10. missing target → HIDDEN
  it('10. missing target user → HIDDEN', async () => {
    const d = await visibility.resolve(VIEWER, 'no-such-user-id');
    expect(d.visible).toBe(false);
  });

  // 11. PublicProfile NEVER carries an email field
  it('11. visible PublicProfile NEVER contains an email field', async () => {
    await setVisibility(TARGET, 'everyone');
    const d = await visibility.resolve(VIEWER, TARGET);
    expect(d.visible).toBe(true);
    if (d.visible) {
      expect(d.profile).not.toHaveProperty('email');
      expect(Object.values(d.profile)).not.toContain('pv-target@test.local');
    }
  });
});

// When DATABASE_URL_TEST is not set, emit a clear skip message.
if (SKIP) {
  describe('ProfileVisibilityService — cross-server matrix (wave-77 bf0ad2a8)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
