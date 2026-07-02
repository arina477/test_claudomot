# Wave 35 — T-9 Journey (block-exit gate + journey regen)

Stage: T-9 (Journey) · Block: T (Test) · Mode: automatic
Target: LIVE prod deploy `0c71585` — web https://web-production-bce1a8.up.railway.app · api https://api-production-b93e.up.railway.app

## Phase 1 — Head-tester gate verdict: APPROVED
Verdict written to `process/waves/wave-35/blocks/T/gate-verdict.md` (attempt 1, cap_remaining 3).
Rationale (summary): the wave's core promise — ENFORCED profile privacy + IDOR-safe data export — is proven **live** at the highest-fidelity layer (T-8 load-bearing, two verified fixtures, both CRITICAL negative-paths reproduced). T-5 6/6 e2e PASS, T-6 no layout regressions, T-1..T-4 CI-green on merge 0c71585. The MEDIUM "no dedicated privacy tests" gap is judged **honest tracked debt, not a gate-block**: it is explicitly surfaced (opposite of coverage theater), the user-observable security is live-proven, and finding-disposition is V-2's job, not T-9's. Honest N/A (notifications-panel absent → states AC N/A) and LOW pre-existing cosmetic ("Last updated 2024") are documented, not silently skipped. No fabricated evidence.

## Phase 2 — Journey regen (REQUIRED — UI wave: new /settings/privacy + /privacy + /terms, B-3 frontend ran)

### Action 2 skip evaluation
Regen NOT skipped. wave_type = ui+backend+auth; the wave shipped user-visible routes (/settings/privacy product surface, /privacy + /terms stubs) and enforced profile-visibility on the member roster → crawl + regen REQUIRED.

### Crawl (bundled-chromium fallback — Playwright MCP chrome-channel absent, T-5 rule 1; never browser_close)
Independent live crawl on deploy 0c71585 (HTTP + headless bundled chromium-1228):
- **Public / anon (no regression):** `/` 200 hero h1 rendered; `/login` 200 "Welcome back"; `/signup` 200 "Create your account"; landing footer hrefs `/privacy` + `/terms` present.
- **New public stubs:** `/privacy` 200 h1 "Privacy Policy" (1413 chars real content); `/terms` 200 h1 "Terms of Service" (1758 chars).
- **Authed (fixture A):** login → lands `/app` (auth journey intact); `/app` shell renders (bodyLen 5081, nav/rail present — servers/channels journey no regression); `/settings/privacy` → heading "Settings — Privacy", 2 honest visibility radios `[everyone, nobody]` (currently `everyone`), 1 disabled DM block with 0 enabled inputs, Download-my-data button present, account-data shows A's own email.
- **API:** `/health` 200; `/profile/privacy`, `/profile/data`, `/profile/data/export` all 401 unauthed (genuine guard).
- Prod state left CLEAN: read-only crawl, A stays `profileVisibility=everyone` (no mutation).

crawl_routes_visited: 10

### Regen diff vs prior canonical (v0.22 → v0.23)
- **routes_added:** `/settings/privacy` (page 16), `/privacy` (page 2), `/terms` (page 3) — all pre-inventoried rows; status flipped aspirational→LIVE this wave.
- **routes_removed:** none.
- **coverage_gaps:** no dedicated automated tests for the new privacy endpoints (MEDIUM → V-2); notifications-panel surface does not exist → states AC N/A (not a fault).
- Map updated: dense `last_updated_wave35` annotation line + new `## Wave-35` deployment section (surface table + T-8 access-control note + routes/regression/gap summary). Enforced profile-visibility roster-hiding behavior documented.

### Action 4 — user-scenarios smoke
`user-scenarios/` directory does NOT exist → no scenario smoke to run (absence noted).

### Action 6 — cross-wave regression check
No regressions. Landing, login, signup, and the authed `/app` server/channel shell all render intact on deploy 0c71585 (independently re-crawled this stage). The wave's changes are additive (3 route status-flips + a server-side roster filter); no prior journey broke.

### Findings triage (Action 7)
- MEDIUM coverage-gap (no dedicated privacy tests) — already in findings-aggregate → V-2 (candidate follow-up test task). Non-blocking.
- LOW cosmetic (/privacy + /terms "Last updated: 2024") — pre-existing, not wave-35-introduced. No fix this wave.
- No critical/significant regressions.

## Deliverable footer

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 10
regen_diff:
  routes_added: [/settings/privacy, /privacy, /terms]
  routes_removed: []
  coverage_gaps: [no-dedicated-automated-tests-for-new-privacy-endpoints (MEDIUM->V-2), notifications-panel-surface-absent (states-AC-N/A)]
scenarios_run: 0                     # no user-scenarios/ dir
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 9f857bf
findings:
  - {severity: MEDIUM, journey: settings-privacy, description: "new privacy endpoints have no dedicated automated regression tests; behavior proven live at T-8 + code-read B-6 -> V-2 candidate follow-up test task"}
  - {severity: LOW, journey: privacy/terms-stubs, description: "'Last updated: 2024' pre-existing cosmetic, not wave-35-introduced; no fix this wave"}
```
