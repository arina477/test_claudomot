# T-9 — Journey (wave-80, presence toggle) — GATE + journey regen

## Phase 1 — head-tester gate verdict: APPROVED
Fresh head-tester spawned (agentId a1beb52989990b329). Independent verdict = **APPROVED** at `process/waves/wave-80/blocks/T/gate-verdict.md` (verdict_complete: true, rework_attempt_cap_remaining: 3). Rationale: load-bearing AC-2 honor proven genuine two-DISTINCT-user (live B socket recv presence:offline{A} +126ms / online +172ms, A no reconnect, 3 cycles) + CI two-subject integration proof confirmed genuine; no-clobber/own-visibility/no-PII-audit/401 covered live; 2 LOW findings correctly non-blocking; T-7 skip justified; journey-map page-16 update present. No coverage theater, no single-client realtime, no mock-the-SUT.

## Phase 2 — Journey regen (UI wave → required)
Wave touched UI (the SettingsPrivacyPage presence toggle). No NEW routes/screens — a single enabled control added to the existing page-16 `/settings/privacy`. Targeted annotation regen (per prior-wave convention for single-control additions to existing pages).

### Live crawl (the wave-touched surface)
- `/settings/privacy` (authed, Fixture A): renders profile-visibility radios + the NEW "Show my online status" toggle (1 enabled `role=switch`, emerald-on/grey-off) + "Your data" + disabled DM affordance + privacy activity log. Toggle click persists (server showPresence=false), reload hydrates from server.
- Server view (`Fixture Proof Server` ad62cd12): member panel renders Online/Offline groups; live co-member fan-out observed ("ONLINE — 2" when B connected).
- Existing journeys re-confirmed intact on this deploy (login → app shell → server view → settings; api /health 200; unauth /profile/privacy 401).

### regen diff
- routes_added: none (presence toggle within existing /settings/privacy).
- routes_removed: none.
- Updated page-16 SettingsPrivacyPage entry (P-4 correction 6) + `GET/PUT /profile/privacy` row (showPresence + partial no-clobber) in user-journey-map.md.
- Regressions: none — existing privacy controls (visibility radios, data export, DM-Beta affordance, deletion, audit log) unaffected; T-3 no-clobber proves visibility/whoCanDm untouched by the new field.

### Scenario smoke
No `user-scenarios/` directory present → scenario smoke N/A.

## Findings (all → V-2, both LOW, non-blocking)
- F-T3-1 LOW: PUT unknown key stripped+200 not rejected+400 (mass-assignment safe; `.strict()` absent vs comment).
- F-T5-1 LOW: presence:offline/online double-delivered to co-member (idempotent, no user-visible effect).

## Prod left CLEAN
Fixture A restored to `{profileVisibility:everyone, whoCanDm:everyone, showPresence:true}` (API GET confirmed). Fixture B untouched `{everyone,everyone,true}` (GET confirmed). One append-only audit event added by the audit-observability probe (inherent to an append-only ledger — not deletable, not mutable user-facing state). No leftover mutable test state.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 3
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: b03c657eebcf2a33423bed208f57105e412e6a3d
findings:
  - {severity: low, journey: "settings-privacy PUT", description: "F-T3-1 unknown-key stripped not rejected (mass-assignment safe)"}
  - {severity: low, journey: "presence fan-out", description: "F-T5-1 idempotent double-emit to co-member"}
```
