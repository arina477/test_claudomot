# Wave-65 T-block manifest
Wave type: single-spec, ui-adjacent (client offline cache; ServerContext read-through + Dexie v5). Merge 1ec98ef; web deployed SUCCESS + HTTP 200.
| Stage | Layer | Pattern | Evidence | Status |
|---|---|---|---|---|
| T-1 | static | A (CI) | CI lint+typecheck green (PR #80 run 28799725915) | pass |
| T-2 | unit | A (CI) | CI test green; web 563/563 incl server-cache (v4→v5 + v1→v5 ROW preservation [rule-11 named], round-trip, replace-prune, atomicity, cross-table prune) + ServerContext (offline hydration, stale-response cancellation, appendServer write-through) | pass |
| T-3 | contract | — | SKIP: no API/SDK/shared-contract change (reuses ServerSummary/ServerDetail unchanged) | skipped |
| T-4 | integration | — | SKIP: no server/schema change; Dexie v5 client, fake-indexeddb-tested | skipped |
| T-5 | e2e | B (active) | LIVE COLD-OFFLINE probe: view server+channel online (populate cache) → go offline → RELOAD (cold open) → assert server rail + channel tree + messages hydrate from cache (not empty workspace) | PASS (live; rail 558 + detail + 155 msgs hydrated cold offline; falsification contrast decisive; IDB v5 w/ 2 new stores) |
| T-6 | layout | — | SKIP: no new UI/layout (data-source change to existing rail/sidebar; design_gap_flag=false) | skipped |
| T-7 | perf | — | SKIP: not heavy (small client cache; write-through non-blocking) | skipped |
| T-8 | security | — | SKIP: no auth/session/rate-limit surface (reuses existing authed GET /servers, /servers/:id; read-only client cache) | skipped |
| T-9 | journey+gate | B (gate) | head-tester gate; NAMED exit criteria: v4→v5 ROW preservation (rule 11) + cold-offline hydration behavior + stale-response-race fix | pending |
## Status
test_block_status:    complete
gate_status:          gate-passed
stages_run:           [T-1, T-2, T-5, T-9]
stages_skipped:       [T-3 (no shared-contract change), T-4 (no server/schema/migration change; Dexie v5 client-only), T-6 (no new layout; data-source change, design_gap_flag=false), T-7 (not heavy; small non-blocking client cache), T-8 (no auth/session surface; read-only client cache reusing authed GETs)]
findings_total:       0
findings_critical:    0
findings_aggregate:   process/waves/wave-65/blocks/T/findings-aggregate.md
t9_verdict:           APPROVED
journey_regen_skipped: true
journey_map_commit:   ""
ready_for_verify:     true
