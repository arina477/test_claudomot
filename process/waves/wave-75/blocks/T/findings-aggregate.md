# Wave 75 — T-block findings aggregate

Canonical V-2 input. Each finding: {stage, severity, location, description, evidence}. T-block does NOT decide what blocks — surface with evidence.

Severity legend: critical | high | medium | low | info.

## Findings

- **[T-1] info** — 11 `as unknown as`/`as any` casts in the wave diff, ALL in test files (billing/educator/guard/provider specs + ServerPlanPanel.test); ZERO in production source. Standard Vitest mock-injection idiom. Not blocking.

- **[T-2] medium** — `mock-billing.provider.spec.ts` verifies the subscriptions upsert against a STUBBED `db.insert` (MockFn); the real Postgres `ON CONFLICT (server_id) DO UPDATE` dedup (insert→one row / second change→same row) is not exercised at the unit layer. Carried BUILD-9. → addressed by the T-4 authored pg-harness integration test.

- **[T-2] low** — benign `act()` warnings on 19 pre-existing `server-overview-settings.test.tsx` tests after the new panel mount (async load settles post sync body). No test fails; head-builder accepted at B-6. Latent-flake vector (test-hygiene), not blocking.

- **[T-3] (none)** — contract layer clean; live shape probes (GET plan, POST tier server_pro/school, invalid→400, unknown→404, unauth→401) match the ServerPlan/TierChangeRequest DTOs and canonical caps EXACTLY.

- **[T-4] low** — `pg-harness.ts` `truncateTables()` omits the `subscriptions` table; the authored spec truncates it explicitly. Candidate: add `subscriptions` to the harness truncate set. Harness-hygiene, non-blocking.

- **[T-4] medium (process)** — the authored integration test `apps/api/test/integration/billing-subscriptions-upsert.spec.ts` typechecks CLEAN + lints CLEAN but was NOT executed against Postgres (no local pg reachable: 5432/5433 refused, no docker; skipIf(!DATABASE_URL_TEST) prevents false-pass). It runs in CI's integration config on its follow-up PR (uncommitted; T runs post-merge). The upsert effect IS proven end-to-end LIVE (free→server_pro→school persisted, exactly one effective tier per server — T-5). Real-DB *automated* run pending the follow-up PR's green CI. → V-2 to note.

- **[T-5] (none blocking)** — M9 SUCCESS METRIC MET: free→server_pro upgrade via the real UI mock checkout refreshed the displayed tier+limits (Free/2GB → Server Pro/50GB/voice 50) IMMEDIATELY with no reload, verified LIVE, survived close+reopen (persistence, principle #29); mock-checkout "test mode — no charge" disclosure visible. 0 console errors.

- **[T-6] (none)** — "Your plan" panel token-compliant on live: dark base rgb(10,10,11), zinc-800 button, 6px radius, 40%-white muted disclosure at 12px, no overflow, mock label legible. Reuses canonical sibling-panel DS.

- **[T-7] (skipped)** — perf skip: wave_type not heavy; small non-render-path diff. No budget at risk.

- **[T-8] medium** — GET /servers/:serverId/educator-tools/status has NO owner/member check (composes only AuthGuard + EntitlementGuard, which gates purely on tier). Any authenticated user can read the boolean tier-status of any server whose tier unlocks the flag. NOT a mutation IDOR / no PII (boolean-only stub). But the fenced REAL educator tools MUST add an owner/member gate before exposing server data — the guard's own comment flags "compose with an owner/member check separately when the endpoint requires one." V-2 to weigh; follow-up-slice requirement.

- **[T-8] (crown-jewel PASS, not findings)** — no-IDOR: B POST tier on A's server → 403, tier UNMODIFIED (side-effect-free, principle #28); educator gate fail-closed→unlock (free 403 → school 200); AuthGuard verification-required (unauth + malformed → 401 on all 3 endpoints, 401 before 403); non-regression create-server → 201. secret-grep zero real creds.

## Summary
- findings_total: 6 (info:1, low:2, medium:3)
- findings_critical: 0
- All M9 acceptance criteria met live; crown-jewel security negatives all PASS; two medium items are follow-up/process notes (real-DB automated upsert run pending follow-up PR; educator-tools member-gate for the fenced real tools) — surfaced to V-2, T-block does not decide blocking.
