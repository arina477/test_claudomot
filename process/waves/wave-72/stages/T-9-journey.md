# Wave 72 — T-9 Journey (gate)

## Phase 1 — head-tester gate
- Fresh head-tester spawn → **APPROVED** (verdict at `blocks/T/gate-verdict.md`). Confirmed: coverage adequate + honest for a security-critical erasure wave; BOTH re-auth doors live-evidenced (signIn WRONG_CREDENTIALS_ERROR + access-token 401 + refresh-token 401 — the refresh vector explicitly probed); P0 genuinely resolved + re-verified (fixed bundle renders, zero require(), T-5/T-6 re-ran green); findings correctly dispositioned to V-2 (not swept); no fabrication (every PASS carries request/response or screenshot).

## Phase 2 — journey regen (UI wave → required)
- Regen performed as a targeted update (the Danger-Zone flow was crawled LIVE in T-5/T-6; the map is large — surgical additions preserve detail).
- `command-center/artifacts/user-journey-map.md` updated:
  - New `POST /profile/delete` endpoint row (right-to-erasure, no-IDOR, owner-block 409, atomic soft-delete scrub).
  - New "Account deletion — Danger Zone" surface row (acknowledgment-gated confirm, 409 owner-block non-destructive, logout+redirect, copy reconciled).
  - New "Re-auth block (both doors)" row.
  - Wave-72 T-9 verified-live note (deploy 69ad79b) + P0-resolved note.
- **routes_added:** none (Danger Zone within existing `/settings/privacy`); NEW endpoint `POST /profile/delete`.
- **regressions:** none — the T-5/T-6 live crawl re-confirmed landing/login/authed-shell render (the P0 white-screen was fixed; prod renders cleanly on 69ad79b). The pre-fix white-screen was a wave-internal regression, caught + resolved within this wave (not a cross-wave regression escaping to prod).
- **scenario smoke:** no `user-scenarios/` directory → none to run.

## Findings (all → V-2, non-blocking)
- MEDIUM session-token-storage (pre-existing app-wide header-mode tokens); LOW rate-limit-boundary; LOW service-worker-stale-bundle-once; COSMETIC heading-copy + fixture-only tall-dialog. See findings-aggregate.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false
journey_regen_skip_reason: ""
crawl_routes_visited: 3   # /settings/privacy Danger Zone flow (via T-5/T-6 live crawl) + landing + login re-confirmed
regen_diff:
  routes_added: []          # Danger Zone within existing /settings/privacy; new endpoint POST /profile/delete
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: <set on commit>
findings:
  - {severity: medium, journey: auth-session, description: "session tokens in JS-readable headers (pre-existing app-wide) → V-2"}
  - {severity: low, journey: account-deletion, description: "service-worker serves stale bundle once to returning users until SW updates → V-2"}
```
