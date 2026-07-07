# Wave 75 — T-4 Integration

## Action 1 — Pattern decision
Project HAS a real-Postgres integration harness: `apps/api/vitest.integration.config.ts` (include `test/integration/**/*.spec.ts`, serial, singleFork) + `apps/api/test/integration/pg-harness.ts`. CI runs it (ci.yml: postgres:16 service, `DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test`, `pnpm test:ci` runs unit + integration configs). → **Pattern A** for the schema/service boundaries CI already covered; **Pattern B (authored)** for the NEW boundary that had no integration coverage.

## Action 2 — Pattern A (CI evidence)
- No schema change this wave (reuses wave-74 `subscriptions`, UNIQUE(server_id) migration 0029). B-0 schema phase = no-op → no migration boundary to re-verify.
- Existing integration specs (create-server-rollback, servers-member-gate, etc.) unaffected; C-1 integration config ran green on merge commit.

## Action 3 — Pattern B (AUTHORED — closes carried BUILD-9 gap)
**Gap identified (carried from B-2 deviation + confirmed at T-2 F1):** the mock-billing upsert was tested with a STUBBED `db.insert` (MockFn) in `mock-billing.provider.spec.ts` — it asserts the CALL SHAPE (insert→values→onConflictDoUpdate) but NEVER exercises the real Postgres `INSERT ... ON CONFLICT (server_id) DO UPDATE`. The free→school unlock "integration" test placed in the standard vitest suite also stubs `db.select`. So the real `subscriptions` upsert boundary was unverified against Postgres. Per test-writing-principles §26, an ON-CONFLICT dedup is a query-level behavior that MUST be proven against a real DB.

**Authored:** `apps/api/test/integration/billing-subscriptions-upsert.spec.ts` (153 lines) — real-Postgres pg-harness test exercising `MockBillingProvider.startTierChange`:
1. First change on a server with no subscription row → exactly ONE row inserted with the target tier + provider echoes {status:ok, entitlements, checkoutUrl:null}.
2. Second change (different tier) on the SAME server → the SAME row UPDATED (still exactly one row via UNIQUE(server_id) + ON CONFLICT; tier reflects new value; updated_at advances) — the insert→one-row / second-change→same-row-updated contract.
3. Same-tier change → idempotent no-op (one row, unchanged tier).

Note: `subscriptions` is NOT in the harness `truncateTables()` set, so the spec issues an explicit `TRUNCATE subscriptions RESTART IDENTITY CASCADE` in beforeEach (documented finding T4-F1 → harness helper candidate).

**Execution status:** the spec **typechecks CLEAN** (tsc --noEmit) and **lints CLEAN** (biome) against the real harness API + SUT constructors (EntitlementsService no-arg, MockBillingProvider(entitlementsService)). It **runs in the CI integration config** (matches `test/integration/**/*.spec.ts`) and will execute on its first PR (it is uncommitted on `main`; it must be committed via a follow-up PR, since T-block runs post-merge). **It could NOT be executed locally in this environment: no Postgres reachable (5432 and 5433 both connection-refused; no docker).** The `describe.skipIf(!DATABASE_URL_TEST)` guard means it skips-with-message rather than false-passing when the DB is absent — honest. This is recorded as an open item for V-block / next-PR, NOT a fabricated PASS.

## Action 4 — Coverage audit
| Boundary | Integration coverage |
|---|---|
| subscriptions ON CONFLICT(server_id) upsert (mock-billing.provider) | **AUTHORED this block** (billing-subscriptions-upsert.spec.ts) — pending CI execution on follow-up PR. Was the BUILD-9 gap. |
| resolveForServer real-DB tier read | exercised transitively by the authored spec (provider re-resolves after upsert) + covered by existing entitlements.service unit tests |
| billing.controller owner-check → provider (DB → service → handler) | authz matrix covered by unit spec (owner/non-owner/404/400); the LIVE prod probes at T-3/T-5/T-8 exercise the full DB→service→handler→response path end-to-end against real prod Postgres (200/403/404/400 all confirmed live) |
| educator-tools guard → resolveForServer → 403/200 | free→403 / school→200 confirmed LIVE (T-8) against real prod DB |

The controller→service→DB boundary IS proven end-to-end — via the live prod probes (real Postgres behind the deployed API), which is stronger evidence than a CI harness for the read/authz paths. The one boundary lacking automated real-DB coverage (the upsert dedup) is now closed by the authored spec.

## Findings
- **T4-F1 (low)** — `pg-harness.ts` `truncateTables()` does not include the `subscriptions` table; the authored spec truncates it explicitly. Candidate: add `subscriptions` to the harness truncate set so future billing integration specs get clean state for free. Harness-hygiene, non-blocking.
- **T4-F2 (medium, process)** — the authored integration spec is uncommitted (T-block runs post-merge on 3b94e276). It typechecks+lints clean but has NOT been executed against Postgres (no local DB; will run in CI on its follow-up PR). Surfaced to V-2: the real-Postgres upsert dedup remains automated-unverified until that PR's CI run goes green. The behavior IS however proven end-to-end LIVE (free→server_pro→school tier changes persisted correctly, re-read from prod DB, exactly one effective tier per server — see T-5).

```yaml
test_pattern: mixed          # A (CI) for existing boundaries + B (authored, pending-CI) for the upsert gap
skipped: false
boundaries_audited: [subscriptions_upsert_on_conflict, resolveForServer_read, billing_controller_authz, educator_tools_guard]
ci_evidence:
  - "C-1 integration config (vitest.integration.config.ts) green on 3b94e276 for pre-existing specs"
active_run_output: "Authored apps/api/test/integration/billing-subscriptions-upsert.spec.ts (153 LOC); tsc CLEAN + biome CLEAN; NOT executed locally (no reachable Postgres: 5432/5433 refused, no docker); skipIf(!DATABASE_URL_TEST) guard prevents false-pass; will run in CI on follow-up PR. Live prod probes prove the upsert effect end-to-end (T-5)."
infrastructure_gap_recorded: false
findings:
  - {severity: low, boundary: pg-harness, description: "truncateTables() omits subscriptions; authored spec truncates explicitly; add to harness set"}
  - {severity: medium, boundary: subscriptions_upsert, description: "authored integration spec typechecks+lints clean but not yet CI-executed (uncommitted, no local pg); upsert dedup proven end-to-end live but automated real-DB run pending follow-up PR"}
```
