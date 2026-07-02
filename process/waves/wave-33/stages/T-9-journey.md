# T-9 — Journey (gate + targeted annotation)

**Wave:** 33 (M6 hardening — malformed non-UUID route param → 400 before DB, project-wide)
**Phase 1:** head-tester gate = **APPROVED** (see `process/waves/wave-33/blocks/T/gate-verdict.md`).
**Phase 2:** journey-map **annotation-only** (structural re-crawl skipped — see Action 2 below).

## Phase 1 — Gate

Independent verdict: **APPROVED**. Coverage adequate; the malformed-UUID→400 fix is proven genuinely LIVE (voice + non-voice routes) and the auth boundary is verified UNCHANGED; skips (T-6/T-7) and the curl-based T-5 are honest. The load-bearing false-green risk — the integration spec self-skips on missing `DATABASE_URL_TEST` — was independently closed: CI run 28559053549 wires `postgres:16` + `DATABASE_URL_TEST`, and the `test` job log shows every malformed-uuid integration test executing with real-Postgres timings (41-47ms) and passing, non-skipped. Full rationale in the gate-verdict.

## Phase 2 — Journey-regen skip evaluation (Action 2)

**`journey_regen_skipped: true`** — structural regen (Action 3 crawl / Action 4 fresh regen / Action 6 cross-wave crawl) skipped. Skip conditions all hold:

- `wave_type: single-spec` — does NOT include `ui` or `heavy`.
- D-block did NOT fire (`design_gap_flag: false`; no `design/<feature>.html` canonicalized this wave).
- B-3 Frontend touched no frontend files — the wave diff is api-only (`pg-error-utils.ts` + `auth.exception.filter.ts` + integration spec). No new route or screen; the change is an error-code contract change (500→400) on existing routes.

Per Action 2 the previous wave's `user-journey-map.md` remains canonical. **However**, a *targeted annotation* (jenny's carry) was warranted because two existing map notes carried a now-stale claim (F-32-T-8-1's 500 / "missing ParseUUIDPipe" status). Correcting a stale factual claim in place is annotation, not a re-crawl — the rest of the map is preserved verbatim.

## Journey annotation delta (F4 — Voice/video study room)

Two edits to `command-center/artifacts/user-journey-map.md`, both in the F4 section:

1. **Occupancy note (~line 224):** added a wave-33 LIVE note that a non-UUID `channelId` on the authed occupancy path now returns **400** (was 500) via the project-wide `22P02`→`BadRequestException` global filter; preserved the standing N-1 park-or-key tripwire line.
2. **Access-control note (~line 226):** flipped the F-32-T-8-1 status from an open V-2 finding ("malformed → **500**, missing `ParseUUIDPipe`") to **RESOLVED (wave-33, verified LIVE)** — malformed → **400** generic Bad Request, no leak; noted the fix is the root-cause global `22P02`→400 filter applied project-wide (NOT a per-route `ParseUUIDPipe` sweep), proven live on voice AND non-voice routes with the auth boundary (401/403/503) unchanged.

No routes added or removed. No coverage gap or regression introduced by the map edit. The rest of the map (F1-F3, F5-F9, all other F4 prose) is byte-preserved.

## Scenario smoke (Action 5)

`user-scenarios/` does not exist in this project → no scenario smoke to run (noted per exit criteria).

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: true
journey_regen_skip_reason: "backend-only wave (single-spec, design_gap_flag=false, api-only diff, no new route/screen — error-code contract change 500->400 on existing routes); annotation-only correction of stale F-32-T-8-1 status, not a re-crawl"
crawl_routes_visited: 0
regen_diff:
  routes_added: []
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 47642b916c11f986239e8334ec6425326a68aaf6
findings: []
```
