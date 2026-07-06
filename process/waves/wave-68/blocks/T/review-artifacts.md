# Wave-68 T-block manifest
Wave type: multi-component ui + auth-adjacent (owner-gated PATCH publish + settings UI + memberCount fix). Merge 1b5a184; BOTH services deployed SUCCESS.
| Stage | Layer | Pattern | Evidence | Status |
|---|---|---|---|---|
| T-1 | static | A (CI) | CI lint+typecheck green (PR #83) | pass |
| T-2 | unit | A (CI) | CI test green; web 603 + api 764 | pass |
| T-3 | contract | A (CI) | UpdateServer DTO + PATCH /servers/:id + ServerDetail extension — CI-covered | pass (CI) |
| T-4 | integration | A (CI) | LIVE-DB integration RAN GREEN in CI (postgres:16): memberCount real-count 0/1/2, PRIVATE-EXCLUSION, updateServer non-owner→403 row-unmodified (AC9 confirmed executed, not skipped) | pass (CI-live-DB) |
| T-5 | e2e | B (active) | LIVE full loop: publish via Overview settings → /discover 0→1 w/ memberCount **2** (real) → Join affordance → unpublish retracts 1→0; B-6 reconcile holds on reopen | **PASS** (head-tester) |
| T-6 | layout | B (active) | Overview settings + populated discover cards match dark-theme DS, no material divergence | **PASS** (head-tester) |
| T-7 | perf | — | SKIP: not heavy | skipped |
| T-8 | security | B (active) | LIVE load-bearing: non-owner PATCH /servers/:id → **403** + row UNMODIFIED (server-side owner-gate); 404 missing; UI control-gate CI-covered | **PASS** (head-tester) |
| T-9 | journey+gate | B (gate) | journey regenerated; per-flow smoke present; LiveKit N/A documented; gate **APPROVED** | **PASS** (head-tester) |
## Status
test_block_status: complete
stages_run: [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped: [T-7]
gate_verdict: APPROVED
next_action: PROCEED_TO_V_BLOCK
