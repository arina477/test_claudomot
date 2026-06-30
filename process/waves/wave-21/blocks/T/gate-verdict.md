# Wave 21 — T-9 Verdict

**Reviewer:** head-tester (fresh T-9 gate spawn — distinct from the T-1..T-8 spawn that hit a session limit)
**Reviewed against:** process/waves/wave-21/blocks/T/review-artifacts.md + findings-aggregate.md + T-1..T-8 deliverables (process/waves/wave-21/stages/T-1..T-8) + user-journey-map.md
**Attempt:** 1  (first gate)

## Verdict
APPROVED

## Rationale

All nine layers ratified PASS / RECORD with 0 Critical and 0 High. This is a frontend-only wave (apps/web; api NOT redeployed, no migration) and the suite is honest, not green-by-theater. The two load-bearing invariants both clear the mutation-sanity bar — a plausible real bug makes a real test fail:

1. **Honest connectivity signal (source-priority, socket-authoritative).** `useConnectionState.test.tsx` exercises the derivation as transition cases (D1/D2), not a single happy path; the AppHome wiring test asserts the indicator renders "Reconnecting…"/"Offline" from the LIVE hook — it would fail if the dot were still hardcoded `"online"` (the wave-20 state). That is a genuine behavioral assertion. Layout (T-6) confirms the indicator carries state in TEXT not color alone (a11y-as-contract) with `role=status`/`aria-live` and no `getByTestId` shortcut.

2. **No-data-loss multi-page reconnect catch-up.** `multiPageCatchup.test.ts` runs against fake-indexeddb (real Dexie, per-test IDBFactory, no real timers — deterministic, the offline-test discipline holds): 3-page in-order recovery (index-ordering assertion), dedup-by-id exactly-once, terminate-on-null, and the MAX_ITERS bound preserving all 100 pages — genuine assertions on observable cache state. Integration (T-4) RATIFIES this as real, consuming the wave-20 `?after=` forward cursor (no mocked SUT).

**Findings disposition verified — all non-blocking, none hides a broken behavior.** I independently scrutinized each:
- **M1** (concurrent catch-up loop on overlapping socket-connect + window-online reconnect): correctness preserved — functional dedup-by-id + idempotent cache bulkPut + both loops converge to the same HEAD cursor; cost is doubled round-trips only. Perf/redundancy, not a correctness defect. → V-2.
- **M2** (fire-and-forget cache write-through): masked on the happy path (reload re-seeds from network; in-memory cursor); no persistent gap. The over-claiming doc comment is the only real issue. → V-2.
- **M3**: subsumed by M1; all three reconnect paths dedup-safe by id. → V-2.
- **L1** (SSR `deriveState()` defaults online): inert — AppHome is client-only; one-line comment worth adding. → V-2.
- **L2** (resume-after-mid-loop-failure proven by code + server-contract reasoning, not an executing test): this is the only finding that *could* mask the no-data-loss invariant, so I scrutinized it hardest. The SHIPPED no-data-loss behavior IS executing-test-proven (MAX_ITERS preserves all 100 pages under an unbounded server — partial-page preservation); the strictly-greater keyset + `nextCursor=last-row` + cursor-advance-outside-setState (verified at B-6) make the resume path sound; resume re-seeds from network on reload. The gap is a recovery SUB-CASE lacking its own executing test — a test-completeness gap, NOT a correctness hole. Correctly non-blocking; the cheapest remaining test to add. → V-2.
- **L3** (socket.io v4 manager-events on the manager not the socket → several `.on` may never fire): not a bug — symmetric add/remove (no leak), and the honest-signal intent is served by `disconnect` + `getSocketState().active`, which DO fire. Cosmetic prune. → V-2.
- **KI-playwright** (chrome-channel absent, recurring since wave-14): live two-client offline round-trip not runnable via the MCP this wave. NON-BLOCKING — the invariants ARE proven deterministically via fake-indexeddb + the CI e2e job (green on merge SHA); only the live-prod observation is deferred, consistent with prior waves.

CI is the authoritative signal for the Pattern-A layers: run 28475903958 — lint + typecheck + test + secret-scan all conclusion=success on merge SHA, web 193 tests EXECUTED (confirmed via test-job log read, not skipped-but-green), api 346 unchanged. No new server surface, so T-8 security is correctly light (route-agnostic default-deny guard + connection-state hook is client-local; gitleaks green). The findings pipeline is clean: 12 carries (3 M / 5 L / 4 KI), 0 Critical, 0 High → V-2 for triage.

## Cascade

| Layer | Re-run downstream | Triggered this wave? |
|---|---|---|
| T-1..T-8 | per dispatcher table | No — all PASS/RECORD, no REWORK |

- **Stages that must re-run:** none.
- **Stages that stay untouched:** all (clean first-gate APPROVE).

## Footer
- verdict_complete: true
- rework_attempt_cap_remaining: 3
