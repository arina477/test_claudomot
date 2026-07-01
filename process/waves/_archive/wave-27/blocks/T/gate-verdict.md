# Wave 27 — T-9 Verdict

**Reviewer:** head-tester (fresh spawn, T-block gate)
**Reviewed against:** process/waves/wave-27/blocks/T/review-artifacts.md + findings-aggregate.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale
The perf proofs are genuine, not coverage theater — I verified them at source, not from the deliverable summaries. The Spec A EXPLAIN proof (`apps/api/test/integration/presence-index-scan.spec.ts`) runs a real `EXPLAIN (FORMAT TEXT)` of the exact `getServerIdsForUser` query (`SELECT server_id FROM server_members WHERE user_id = $1`) against real Postgres through a dedicated-connection wrapper (`harnessExplainWithSeqscanOff`: `BEGIN → SET LOCAL enable_seqscan=off → EXPLAIN → ROLLBACK`), then asserts three independent conditions: plan contains `Index Scan`, contains `server_members_user_id_idx`, and does NOT contain `Seq Scan on server_members`. Using `enable_seqscan=off` to force index *eligibility* is the correct deterministic invariant for a migration proof — it removes tiny-table-plan flake while still failing hard if the index is missing or unusable. This test is mutation-sane: dropping migration 0012 makes the plan fall back to Seq Scan and the assertion fails. AC3 pairs it with a 3-user/2-server transition table proving behavior-preserving correctness (co-member excluded from the caller's set, empty result for a no-membership user). **Critically, I closed the false-green risk**: the spec is guarded by `describe.skipIf(SKIP)` where `SKIP = !DATABASE_URL_TEST`, which would silently skip and still report green if CI lacked the env — but `.github/workflows/ci.yml` provisions a `postgres:16` service and sets `DATABASE_URL_TEST` for the `test` job (`pnpm test:ci`), so `SKIP=false` and the proof genuinely EXECUTES. PR#40 shows `test = SUCCESS` (all 7 checks green, merged 87b6ef7). The Spec B (subscription lift) regression is proven by real live evidence at T-5: verbatim live DOM of the fixture's own just-posted message-row author avatar carries `data-testid="presence-dot-inner"` computed `rgb(16,185,129)` emerald + sibling `<span class="sr-only">Online</span>`, on the correct new bundle `index-Dr2UkTXH.js` (deploy 328b1ae9); the member panel simultaneously shows ONLINE-emerald / OFFLINE-grey (proving per-user live state, not a static render), a11y `suppressed: 0`, reproduced 3× with zero flake, evidence PNGs present on disk. For a behavior-preserving perf wave at ~0 users, the T-7 verification set — EXPLAIN Index Scan (Spec A) + subscription-count 1-not-N (Spec B, T-2) + CARRY-B per-author render scoping — IS the honest verification; a load test would be theater and I do not require one. Skips are legitimate: T-3 (no contract surface — index + client refactor, B-1 skipped), T-8 (non-auth, no new surface, CI `secret-scan = SUCCESS`). Cumulative findings: 0. Every applicable stage-exit check ticks. No layer here fails only by deleting its own test.

## Stage-exit checklist result

| Check | Result |
|---|---|
| T-1: no prod-code static bypasses; lint+typecheck green | PASS (PR#40 run 28526765627) |
| T-2: Spec B unit-covered (subscription-count 2→1 + CARRY-B per-author scoping) | PASS (web 254 green) |
| T-3 integration/real-PG: EXPLAIN spec runs against real Postgres w/ per-test truncate rollback, DB NOT mocked | PASS (real `postgres:16` service; `harnessExplainWithSeqscanOff` real connection) |
| T-4 the perf proof is honest (real EXPLAIN, deterministic, mutation-sane, executed-not-skipped) | PASS (verified spec source + CI env + green run) |
| [STABLE] mutation sanity: a plausible real bug (drop index) fails the test | PASS |
| T-5 live regression is REAL (live DOM: presence-dot-inner + Online on new bundle) | PASS (3× zero flake, evidence on disk) |
| T-5: no `getByTestId` where role/label exists — a11y label (`sr-only "Online"`) is the query contract | PASS (label-based verification present) |
| T-6 layout: no visual delta, PresenceDot unchanged | PASS |
| T-7 perf verification adequate for a perf wave (query-plan + subscription-count, no theater load-test) | PASS |
| T-8 security skip legit (non-auth, no new surface, secret-scan clean) | PASS (CI secret-scan SUCCESS) |
| No `browser_close` against a shared MCP mid-run | PASS (T-5 drove own bundled Chromium; MCP untouched) |

## Rework instructions
N/A — APPROVED.

## Phase 2 note (journey regen)
Phase 2 (T-9 journey crawl + `user-journey-map.md` regen) is **annotation-only** for this wave. Per T-9 Action 2 skip evaluation, this is a behavior-preserving perf pair with **no route/screen/endpoint change** — no new UI surface (T-6: PresenceDot unchanged; T-5: dots render identically), Spec A is a DB index, Spec B is an internal subscription-topology refactor with identical rendered output. The canonical journey map remains the prior wave's; regen is not required to reflect a new surface. Scenario smoke (Action 4) still runs unconditionally if `user-scenarios/` exists. The orchestrator records `journey_regen_skipped: true` with skip reason "behavior-preserving perf pair, no UI/route/endpoint delta" per the Action 2 contract.

## Cascade
- **Stages that must re-run:** none (APPROVED, no rework).
- **Stages that stay untouched:** all.

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
