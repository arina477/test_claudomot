# Wave-67 T-block manifest
Wave type: multi-spec, ui + auth-adjacent (new /discover page + new authz'd write endpoint join-public + schema migration). Merge 43d20b2; BOTH services deployed SUCCESS + migration 0024 live (discover=401 not 500).
| Stage | Layer | Pattern | Evidence | Status |
|---|---|---|---|---|
| T-1 | static | A (CI) | CI lint+typecheck green (PR #82) | pass |
| T-2 | unit | A (CI) | CI test green (re-run; study-timer flake cleared); web 583 + api 752 incl discover filter/search/pagination + join-public is_public gate (private-reject, insert-never-reached) | pass |
| T-3 | contract | A (CI) | api contract tests for GET /servers/discover (DiscoverServer shape) + POST /servers/:id/join-public (JoinResult) — CI-covered in the 752 | pass (CI) |
| T-4 | integration | A (CI) | api integration (servers.service/controller specs, discover query + join-public) — CI-covered; migration 0024 applied+verified in prod | pass (CI) |
| T-5 | e2e | B (active) | LIVE probe: /discover page renders + honest empty-state (prod directory empty — no publish path yet) + rail Discover entry; discover API 200 []; join flow (via published fixture if DB reachable) | pending (head-tester) |
| T-6 | layout | B (active) | /discover vs canonical design/server-discover.html (dark theme, card grid, dark-on-emerald Join) | pending (head-tester) |
| T-7 | perf | — | SKIP: not heavy (small page + paginated endpoint) | skipped |
| T-8 | security | B (active) | LIVE: POST /servers/:id/join-public against a PRIVATE server → 403 (not a backdoor); is_public gate. NAMED by head-product P-4 | pending (head-tester) |
| T-9 | journey+gate | B (gate) | head-tester gate; journey regen (new /discover route → REQUIRED) | pending |
## Status
test_block_status:    gate-passed
stages_run:           [T-1, T-2, T-3, T-4, T-5, T-6, T-8, T-9]
stages_skipped:       [T-7 (not heavy — small page + paginated endpoint)]
findings_total:       2
findings_critical:    0
findings_blocking:    0
findings_aggregate:   process/waves/wave-67/blocks/T/findings-aggregate.md
journey_map_commit:   dfe35a1
ready_for_verify:     true
gate_verdict:         APPROVED
gate_verdict_source:  process/waves/wave-67/blocks/T/gate-verdict.md

# T-5/T-6/T-8 live results (head-tester active-execution)
# T-5 e2e:      PASS — /discover renders live + honest empty-state + rail + Discover entry + search;
#               browse+join proven END-TO-END non-echo (published B-owned fixture A was not in → clicked
#               Join → A added, button→Open); is_public filter proven (1 of 566 surfaced); teardown clean.
# T-6 layout:   PASS — dark theme + card grid + glass header + §8 dark-on-emerald Join (#0a0a0b on #10b981,
#               ~7.4:1 AA); 0 material divergences.
# T-8 security: PASS — LOAD-BEARING is_public join-gate rejects private servers LIVE (403 member-private +
#               403 proof-private) + 401 unauth join + 401 unauth discover + 429 rate-limit; public-only proven.
# Findings → V-2 (both non-blocking): F67-T5-1 (SIGNIFICANT) discover memberCount always 0;
#            F67-T5-2 (LOW/MED) join-public creates member row with role_id=NULL.
