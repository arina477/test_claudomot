# Wave 75 — T-2 Unit

**Pattern A — Verified-via-CI.** T-2 does NOT re-execute (C-1 did). Coverage-adequacy audit only.

## Action 1 — CI evidence confirmed
C-1 `test` job (run 28885482458, HEAD 1786615) green. `pnpm test:ci` ran the unit pass **and** the pg integration config.
- **api unit suite: 45 files, 795 tests, 0 failures** (per B-2 verify + C-1 false-green integrity section).
- **web unit suite: 46 files, 679 tests, 0 failures** (per B-3 verify).
No unit-test-job absence; no local substitute needed.

## Action 2 — Coverage audit (per modified module)
Modules touched (from B-2/B-3 files_implemented) and their unit coverage:

| Module (new/changed) | Unit spec | Cases | Adequacy |
|---|---|---|---|
| `billing.controller.ts` (POST tier + GET plan) | billing.controller.spec.ts | 10 | STRONG. Full authz matrix: owner→200+provider-invoked-with-opaque-userId; non-owner→403 + provider NEVER called (no-write proof at unit layer); invalid targetTier→400; missing targetTier→400; unknown serverId→404; same-tier→200 idempotent; GET owner→200, member→200, non-member→403, unknown→404. Happy + error path per method. ✓ |
| `entitlements.service.ts` (canonical TIER_CAPS) | entitlements.service.spec.ts | +7 changed/added | STRONG. resolveForServer: free-when-no-row, server_pro caps, school caps (educatorAdminTools true), out-of-enum→safe-default free. Canonical cap values asserted exactly (free 2048/10/false, server_pro 51200/50/false, school 512000/100/true). **646-owner non-regression guard present** (`free owner with 646 existing servers stays UNDER the cap`). Restrictive-cap boundary tests retained (cap=0, cap=1). ✓ |
| `entitlement.guard.ts` (RequireEntitlement + guard) | entitlement.guard.spec.ts | 5 | STRONG. 403 on free/server_pro (flag false), allow on school, pass-through when no metadata, ForbiddenException when :serverId absent. Fail-closed semantics covered. ✓ |
| `educator-tools.controller.ts` | educator-tools.controller.spec.ts | 3 | ADEQUATE. Real decorator→guard→service→controller wiring free→403, school→200 unlock (integration-flavored unit; db.select stubbed). ✓ |
| `mock-billing.provider.ts` (upsert) | mock-billing.provider.spec.ts | 2 | ADEQUATE-AT-UNIT-LAYER. Asserts exactly-one upsert (insert→values→onConflictDoUpdate) call shape + status ok / re-resolved entitlements / checkoutUrl null. **GAP: upsert verified against a STUBBED db.insert (MockFn), NOT real Postgres ON CONFLICT(server_id).** This is the carried BUILD-9 gap → T-4 job. See finding T2-F1. |
| `ServerPlanPanel.tsx` | ServerPlanPanel.test.tsx | 4 | STRONG. success-via-real-parent (BUILD-12), non-owner read-only, failed-change-unchanged, mock-label. Role/label queries. ✓ |
| `apps/web/src/auth/api.ts` (getServerPlan/changeServerTier) | covered transitively via ServerPlanPanel.test.tsx + extended shell mocks | — | ADEQUATE (thin credentialed-fetch wrappers). |

## Action 3 — Flake observation
- C-1: 0 flake reruns triggered; B-5 documented benign `act()` warnings on 19 pre-existing server-overview-settings tests (panel async load settles post sync body). NOT failures; head-builder ACCEPTED at B-6 as test-hygiene (panel load path IS guarded). Recorded as latent-flake vector T2-F2 (not blocking).

## Action 4 — Discipline note
- Controller non-owner test asserts `provider.startTierChange is NEVER called` — a no-write proof at the unit layer (mock-call-count as *negative* assertion is legitimate: it proves the guard short-circuits before the mutating dependency). The real side-effect-free-403 proof against a DB belongs at T-8/T-4. Good layering.
- mock-billing.provider.spec asserting the upsert *call shape* (insert→values→onConflictDoUpdate) is correct for a unit test, but per test-writing-principles §26 ("prove a query-level behavior against a real DB, not a mock that returns pre-shaped rows") the ON CONFLICT semantics MUST also be exercised against real Postgres — that is the T-4 deliverable, not a T-2 defect.

## Findings
- **T2-F1 (medium)** — `mock-billing.provider.spec.ts` verifies the subscriptions upsert against a stubbed `db.insert` (MockFn); the real `ON CONFLICT (server_id) DO UPDATE` behavior (insert→one row; second change→same row updated, no duplicate) is NOT exercised against real Postgres. Carried BUILD-9. Addressed by the T-4 pg-harness integration test authored this block.
- **T2-F2 (low)** — benign `act()` warnings on 19 pre-existing server-overview-settings.test.tsx tests after the panel mount (async load settles post sync body). No test fails; head-builder accepted at B-6. Latent-flake vector (wave-72 act() lesson); test-hygiene, not blocking.

```yaml
test_pattern: ci-verified
skipped: false
evidence:
  - "C-1 test job: run 28885482458 (HEAD 1786615) green — api 45 files/795 tests, web 46 files/679 tests"
modules_audited: [billing.controller.ts, entitlements.service.ts, entitlement.guard.ts, educator-tools.controller.ts, mock-billing.provider.ts, ServerPlanPanel.tsx, auth/api.ts]
new_flakes: []
findings:
  - {severity: medium, module: mock-billing.provider.spec.ts, description: "subscriptions upsert verified vs stubbed db.insert, not real Postgres ON CONFLICT (BUILD-9) → T-4 pg-harness test"}
  - {severity: low, module: server-overview-settings.test.tsx, description: "benign act() warnings on 19 pre-existing tests post panel mount; no failures; latent-flake vector"}
```
