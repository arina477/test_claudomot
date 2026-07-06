# Wave 67 — T-9 Journey (gate + regen)

## Phase 1 — head-tester gate verdict
**APPROVED.** See `process/waves/wave-67/blocks/T/gate-verdict.md`. Both head-product-P-4-NAMED criteria met with live evidence:
1. is_public join-gate rejects private servers LIVE (403 ×2 authed + 401 unauth) AND CI-verified (insert-never-reached).
2. `/discover` renders live with the honest cold-start empty-state + ServerRail present.
CI layers (T-1/T-2/T-3/T-4) green on the deployed merge (web 583 + api 752); T-7 skipped (not heavy).

## Phase 2 — journey regen (REQUIRED: new /discover route + new endpoints)

### Action 2 — skip evaluation
Regen REQUIRED — wave_type = ui, D-block fired (`design/server-discover.html` canonicalized), B-3 frontend touched (`/discover` page). NOT skipped.

### Action 3/4 — crawl + regen
Live-probed the deployed `/discover` surface as fixture A (the T-5/T-6/T-8 probes doubled as the crawl for the touched node). Regenerated `command-center/artifacts/user-journey-map.md`:
- **routes_added:** `/discover` (page-17)
- **flows_added:** F12 — Discover public communities (P1)
- **endpoints_added:** `GET /servers/discover` (AuthGuard, is_public-only, memberCount, ILIKE search, pagination), `POST /servers/:id/join-public` (AuthGuard, is_public-gated)
- **routes_removed:** none
- Orphan/reachability audit updated: page-17 reachable from the server-rail Discover entry; F12 smoke-asserted live. Populated-grid reachability is code+DB-proven (published-fixture probe), not yet organically reachable in prod (publish path deferred, bundle 2bd37c4c) — documented, not a coverage gap.

### Action 5 — scenario smoke
No `user-scenarios/` directory exists → N/A (0 scenarios).

### Action 6 — cross-wave regression check
No prior journey broken. ServerRail intact on `/discover` (570 rail elements coexist with the discover canvas); Discover rail entry present (B-6 regression intact); 0 console errors on the page. No regressions.

### Action 7 — findings triage (→ V-2, both non-blocking)
- F67-T5-1 (SIGNIFICANT): discover `memberCount` always 0 — server-side aggregation defect; cards understate membership. Feature functional. → V-2.
- F67-T5-2 (LOW/MED): join-public creates member row with `role_id=NULL`. Confirm role-less-member RBAC intent. → V-2.
No critical regressions; no hard stop.

### Action 8 — commit
`docs(journey): T-9 regen for wave-67` → main `dfe35a1`, pushed (`43d20b2..dfe35a1`).

## Deliverable footer

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 1        # /discover (the touched node; live-probed)
regen_diff:
  routes_added: ["/discover (page-17)"]
  routes_removed: []
  flows_added: ["F12 — Discover public communities"]
  endpoints_added: ["GET /servers/discover", "POST /servers/:id/join-public"]
  coverage_gaps: ["populated-grid not organically reachable in prod until publish path ships (documented, deferred bundle 2bd37c4c)"]
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: dfe35a1
findings:
  - {severity: significant, journey: F12, description: "GET /servers/discover memberCount always 0 (server-side aggregation defect; cards understate membership)"}
  - {severity: low-medium, journey: F12, description: "POST /servers/:id/join-public creates member row with role_id=NULL"}
```
