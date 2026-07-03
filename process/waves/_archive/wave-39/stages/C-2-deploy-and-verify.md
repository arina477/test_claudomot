# C-2 — Deploy & verify (wave-39)

**Change class:** FRONTEND-only — UserMenu popover wired to the settings button (`apps/web/src/shell/UserMenu.tsx`, new file). No api change, no migration, no env change. Only the **web** service deploys.

**Deploy model:** Railway CLI-push (NOT git-triggered). Merge of PR #53 (`21f02ee`) to main did NOT deploy; `railway up --service web` performed the deploy.

## Actions performed

### Action 0 — Railway credential
Present (project-scoped `RAILWAY_TOKEN`). Project `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), env production. Proceeded to deploy.

### Action 2 — Deploy the web service
`railway up --service web --detach` from repo root on local main (`4ca8d53`, which carries merge `21f02ee` = the UserMenu code).
- Deployment id: `257dacb4-95ef-4e9b-9710-53fb5242bb26`
- Build logs: railway.com/project/ae55c191.../service/107d4255...?id=257dacb4-95ef-4e9b-9710-53fb5242bb26

### Deploy verification — authoritative deployment-state endpoint (NOT /healthz)
Polled Railway GraphQL `deployments(first:1, input:{projectId, serviceId:web})` → `node.status`, `Project-Access-Token` header:
- BUILDING → BUILDING → BUILDING → **SUCCESS** at t=60s.
- Latest (first:1) web deployment `257dacb4` status = `SUCCESS` (NOT SKIPPED/FAILED/CRASHED). No stale-revision race — the polled deployment IS the one just pushed.

### Health / content verification
1. `curl -fsS https://web-production-bce1a8.up.railway.app/` → **HTTP 200** (SPA index, `<title>StudyHall</title>`).
2. **SERVED-BUNDLE CONTENT ASSERTION (wave-34 false-green guard):**
   - Marker chosen: string literal `User menu` (the popover's `aria-label`, `UserMenu.tsx:115`). Verified change-unique: `UserMenu.tsx` first appears in `21f02ee`; `git grep 'User menu' 21f02ee~1 -- apps/web/src` → absent at parent. String literal survives minification.
   - Served bundle extracted from the LIVE index.html: `/assets/index-QN5fEltz.js` (1,693,259 bytes, HTTP 200).
   - `grep 'User menu'` in served bundle → **FOUND**: `menu","aria-label":"User menu",style:{...}`.
   - Corroborating change-unique markers in served bundle: `/settings/privacy` present, `signOut` present. (`LockKeyIcon` is a component identifier minified away — expected; the marker deliberately targets a surviving string literal.)
   - Conclusion: the new UserMenu code is provably in the SERVED bundle. Not a stale bundle.

### Canary (Actions 5–7)
Skipped — self-use-mvp, DAU below 1000 threshold.

## Deliverable footer

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway-web
verdict_evidence:
  - "railway web: deployment 257dacb4-95ef-4e9b-9710-53fb5242bb26 status SUCCESS, from local main 4ca8d53 (carries merge 21f02ee)"
  - "https://web-production-bce1a8.up.railway.app/: 200 OK (SPA index)"
  - "served-bundle assertion: /assets/index-QN5fEltz.js contains marker 'User menu' (aria-label) — new UserMenu shipped; corroborated by /settings/privacy + signOut"
deploy_targets:
  - platform: railway-web
    service_id: 107d4255-422a-4b72-b138-0647f9192fe4
    state: SUCCESS
    commit: 21f02ee            # merged UserMenu commit on main (deploy pushed from local main 4ca8d53)
    deployment_id: 257dacb4-95ef-4e9b-9710-53fb5242bb26
    verified_at: 2026-07-03T11:23:30Z
    health_url: https://web-production-bce1a8.up.railway.app/
    served_bundle: /assets/index-QN5fEltz.js
    served_bundle_marker: "User menu"
    served_bundle_marker_found: true
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (self-use-mvp, <1000); T-block synthetic probes are the post-deploy signal."
canary_window:
  start: null
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "FRONTEND-only web deploy via CLI-push (railway up --service web). Authoritative deployment-state endpoint confirmed SUCCESS on the just-pushed deployment (no stale-revision race). Served-bundle content assertion PASSED against the wave-34 false-green guard: change-unique 'User menu' marker present in the live-served /assets/index-QN5fEltz.js. Zero forced-redeploy attempts (no SKIPPED). api unchanged — not redeployed."
```

## Exit criteria — met

- Usable deploy credential in hand (present at entry).
- Target (railway-web) shows SUCCESS with the merged UserMenu commit serving.
- `/` returns 200; served bundle proven to carry the new code (content assertion, not /healthz).
- Canary skip recorded with traffic-threshold reasoning.
- `ci_stage_verdict: PASS`.

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Web service deployed via CLI-push and verified against the authoritative Railway
    deployment-state endpoint (deployment 257dacb4 = SUCCESS, the just-pushed latest —
    no stale-revision race), not a self-reported /healthz. The wave-34 false-green guard
    was honoured: the served bundle (/assets/index-QN5fEltz.js, extracted from the live
    index.html) provably contains the change-unique 'User menu' marker, so the new
    UserMenu code is the code serving traffic. FRONTEND-only change — no migration, no
    env-var cutover, api untouched. Canary correctly skipped (DAU < 1000). Rollback path
    is the prior web deployment revision, reachable via Railway redeploy if needed.
  next_action: PROCEED_TO_T
```
