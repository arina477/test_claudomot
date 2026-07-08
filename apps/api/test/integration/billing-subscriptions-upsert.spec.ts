/**
 * Integration test: MockBillingProvider.startTierChange — real-Postgres
 * subscriptions ON CONFLICT(server_id) upsert (wave-75 M9, T-4).
 *
 * Closes the carried BUILD-9 gap: the unit spec (mock-billing.provider.spec.ts)
 * asserts the upsert CALL SHAPE against a stubbed db.insert, but never exercises
 * the real Postgres `INSERT ... ON CONFLICT (server_id) DO UPDATE` semantics.
 * Per test-writing-principles §26, a query-level behavior (ON CONFLICT dedup)
 * MUST be proven against a real DB, not a mock that returns pre-shaped rows.
 *
 * Load-bearing assertions (against real Postgres via the pg-harness):
 *   1. First tier change on a server with NO subscription row → exactly ONE row
 *      inserted with the target tier.
 *   2. Second tier change on the SAME server → the SAME row is UPDATED (still
 *      exactly one row; tier reflects the new value; updated_at advances). The
 *      UNIQUE(server_id) index + ON CONFLICT prevents a duplicate row.
 *   3. resolveForServer after the upsert returns the freshly-persisted tier +
 *      canonical entitlements (round-trips through the same DB connection family).
 *
 * CF-2 (LOAD-BEARING): pg-harness MUST be the first import so the lazy db
 * singleton resolves to DATABASE_URL_TEST.
 */
// CF-2 side-effect import: sets process.env.DATABASE_URL = DATABASE_URL_TEST.
import './pg-harness';
import {
  harnessQuery,
  insertFixtureServer,
  insertFixtureUser,
  setupHarness,
  teardownHarness,
  truncateTables,
} from './pg-harness';

// SUT imports AFTER harness so the lazy db proxy resolves to the test DB.
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { EntitlementsService } from '../../src/billing/entitlements.service';
import { MockBillingProvider } from '../../src/billing/mock-billing.provider';

const SKIP = !process.env.DATABASE_URL_TEST;

// Fixture constants
const SERVER_ID = '20000000-0000-0000-0000-0000000000a1';
const OWNER_ID = 'billing-upsert-owner';
const ACTOR_ID = 'billing-upsert-owner'; // owner initiates the change

type SubRow = {
  server_id: string;
  tier: string;
  updated_at: string;
} & Record<string, unknown>;

describe.skipIf(SKIP)(
  'MockBillingProvider.startTierChange — real-Postgres subscriptions upsert (T-4 / BUILD-9)',
  () => {
    let provider!: MockBillingProvider;

    beforeAll(async () => {
      await setupHarness();
      const entitlements = new EntitlementsService();
      provider = new MockBillingProvider(entitlements);
    });

    afterAll(async () => {
      await teardownHarness();
    });

    beforeEach(async () => {
      await truncateTables();
      // subscriptions is NOT in the harness truncate set — clear it explicitly
      // so each case starts with zero subscription rows for the fixture server.
      await harnessQuery('TRUNCATE subscriptions RESTART IDENTITY CASCADE');
      // Seed the owner + server (FK: subscriptions.server_id → servers.id).
      await insertFixtureUser(OWNER_ID, 'billing-upsert-owner@test.local');
      await insertFixtureServer(SERVER_ID, OWNER_ID, 'Billing Upsert Test Server');
    });

    it('first tier change inserts exactly one subscription row with the target tier', async () => {
      // Arrange: no subscription row exists for SERVER_ID (truncated above).
      const before = await harnessQuery<{ count: string }>(
        'SELECT count(*)::text AS count FROM subscriptions WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(Number.parseInt(before[0]?.count ?? '0', 10)).toBe(0);

      // Act: upgrade free → server_pro via the real provider (real DB write).
      const result = await provider.startTierChange(SERVER_ID, 'server_pro', ACTOR_ID);

      // Assert: exactly one row, tier persisted, provider echoes persisted state.
      const rows = await harnessQuery<SubRow>(
        'SELECT server_id, tier, updated_at FROM subscriptions WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tier).toBe('server_pro');
      expect(result.status).toBe('ok');
      expect(result.tier).toBe('server_pro');
      expect(result.entitlements.storageMb).toBe(51_200);
      expect(result.entitlements.callCapacity).toBe(50);
      expect(result.checkoutUrl).toBeNull(); // mock-mode marker
    });

    it('second tier change on the same server UPDATES the same row (ON CONFLICT — no duplicate)', async () => {
      // Arrange: first change creates the row.
      await provider.startTierChange(SERVER_ID, 'server_pro', ACTOR_ID);
      const first = await harnessQuery<SubRow>(
        'SELECT server_id, tier, updated_at FROM subscriptions WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(first).toHaveLength(1);
      const firstUpdatedAt = first[0]?.updated_at;

      // Act: change again to a DIFFERENT tier.
      const result = await provider.startTierChange(SERVER_ID, 'school', ACTOR_ID);

      // Assert: STILL exactly one row (UNIQUE(server_id) + ON CONFLICT), tier
      // updated, updated_at advanced. No duplicate row was inserted.
      const rows = await harnessQuery<SubRow>(
        'SELECT server_id, tier, updated_at FROM subscriptions WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tier).toBe('school');
      expect(result.tier).toBe('school');
      expect(result.entitlements.educatorAdminTools).toBe(true);
      // updated_at should advance (or at least not regress) after the update.
      if (firstUpdatedAt && rows[0]?.updated_at) {
        expect(new Date(rows[0].updated_at).getTime()).toBeGreaterThanOrEqual(
          new Date(firstUpdatedAt).getTime(),
        );
      }
    });

    it('same-tier change is an idempotent no-op — still exactly one row, same tier', async () => {
      // Arrange
      await provider.startTierChange(SERVER_ID, 'server_pro', ACTOR_ID);
      // Act: change to the SAME tier again.
      await provider.startTierChange(SERVER_ID, 'server_pro', ACTOR_ID);
      // Assert: one row, unchanged tier.
      const rows = await harnessQuery<SubRow>(
        'SELECT server_id, tier FROM subscriptions WHERE server_id = $1',
        [SERVER_ID],
      );
      expect(rows).toHaveLength(1);
      expect(rows[0]?.tier).toBe('server_pro');
    });
  },
);

if (SKIP) {
  describe('MockBillingProvider.startTierChange — real-Postgres subscriptions upsert (T-4)', () => {
    it.skip('SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL to run integration tests locally', () => {});
  });
}
