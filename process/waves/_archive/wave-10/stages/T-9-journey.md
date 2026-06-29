# Wave 10 — T-9 Journey

## Phase 1 — head-tester gate
Verdict: **APPROVED** (see `process/waves/wave-10/blocks/T/gate-verdict.md`). RBAC access-control core sound; 6 conditions' load-bearing assertions verified in spec files (not coverage theater); live 401 boundary re-confirmed at gate (`POST/GET /servers/:id/roles → 401`, health 200). Two honest, disclosed limits: concurrent owner-demote race is unit-modelled (prod has correct `SELECT FOR UPDATE` lock); 403-non-permitted path is CI-tested but not live-probed (4a2ad286 fixture gap → ESCALATION-CRITICAL for L).

## Phase 2 — journey-map regen
Regen REQUIRED (wave touched UI: ServerRolesPage + ChannelSidebar; B-3 frontend fired). Crawl basis: HTTP/code-level + live 401 probe + source inspection of route wiring (full authed browser crawl deferred — no verified prod fixture 4a2ad286, no Playwright chrome channel). Key finding: the roles surface is reachable as a **full-screen overlay** opened from the channel-sidebar "Server settings — Roles" button within the existing `/servers/:id` shell — NOT a dedicated `/servers/:id/settings` route. Journey-map page 13 + F8 + a new wave-10 deployment-status section updated accordingly. Channel list is now role-gated server-side (per-role visibility).

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 3                 # live HTTP probes: /health 200, GET+POST /servers/:id/roles 401 (authed browser crawl deferred — 4a2ad286)
regen_diff:
  routes_added: []                      # no new top-level route — roles is an overlay within /servers/:id shell
  routes_removed: []
  coverage_gaps:
    - "403-non-permitted access-control path not live-probed (no verified prod fixture 4a2ad286; 0 prod servers) — CI-tested only"
    - "authed full-browser click-through of roles overlay deferred (same fixture + no Playwright chrome channel)"
    - "concurrent owner-demote race unit-modelled, not multi-connection-executed"
scenarios_run: 0                        # no user-scenarios/ dir
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 89bb1201ca18d9238edcb4cbdad4bf43ba6d4dc4
findings:
  - {severity: significant, journey: F8, description: "verified-prod-session fixture 4a2ad286 absent 4 consecutive waves — 403-non-permitted + authed crawl repeatedly trusted to CI not live; ESCALATION-CRITICAL for L"}
  - {severity: info, journey: F8, description: "concurrent owner-demote race is unit-modelled, not run against two real Postgres connections (prod code has correct FOR UPDATE lock)"}
  - {severity: info, journey: -, description: "findings-aggregate.md not created standalone this block — findings inline in T-8 + gate-verdict; hygiene note for L"}
```
