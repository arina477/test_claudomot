# C-2 — Deploy & verify (wave-28)

**Wave scope:** invite-code rotate endpoint (owner-gated) — `apps/api` only. Backend-only wave.
**Merge commit:** `8996230` (PR #41 — `feat: rotate permanent server invite_code (owner-gated)`), on `main`.
**Mode:** automatic. head-ci-cd owns C-2.

## Deploy target: api (studyhall-api)

Railway is **CLI-push, NOT git-trigger** on this project (per project convention + memory `railway-deploy-is-cli-push-not-git-trigger`). The merge to `main` did NOT deploy — C-2 actively pushed the api image. **web was NOT deployed** (no web change this wave).

- Project: `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), environment `production`.
- api service id: `7358a103-0a4f-44e6-9468-3d02d045531e`.
- Deploy command: `railway up --service api --environment production --ci` (via `npx @railway/cli@5.23.3`, `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN`).
- CLI streamed build+deploy to completion: `Deploy complete`, exit 0, 16:42:21Z → 16:43:50Z (~1.5 min). Inline-poll path (well under the 10-min cap). No MONITOR-task promotion needed.

## Migration

**None.** No schema change this wave — the rotate endpoint writes the existing `servers.invite_code` column in place. `drizzle-kit migrate` NOT run (correct: no new migration file present).

## Verification (authoritative — not /health alone)

### 1. Authoritative deployment state (the fired-if-you-trust-/health-alone check)
`railway deployment list --service api --json | jq '.[0]'`:
- id `48c515e9-cfb8-41db-9a76-5ab07dd7741b`, **status `SUCCESS`**, `createdAt 2026-07-01T16:42:23Z`, `cliCaller: claude_code`, `reason: deploy`.
- `jq -e '.[0].status == "SUCCESS"'` → exit 0 (PASS). This id matches the id in the `railway up` build-log URL — the deployment I pushed IS the latest and is the one serving.

### 2. Health probe
`curl -fsS https://api-production-b93e.up.railway.app/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.

### 3. New-route liveness proof (stale-revision defeat)
`POST /servers/<uuid>/invite-code/rotate` (unauthenticated):
- **Pre-deploy baseline: `404`** (old live revision lacked the route — proves merge-to-main had not deployed, and that /health-200 alone was serving the STALE pre-merge revision).
- **Post-deploy: `401`** (AuthGuard rejects unauthenticated request → route is REGISTERED and served on the NEW revision).
- The 404→401 flip is the decisive authoritative proof the new build is live and serving traffic, independent of /health. A false-green/stale deploy would still return 404.

### 4. Web-untouched control
Latest web deployment: id `328b1ae9-4e7d-41cc-80cb-a4925160782f`, `createdAt 2026-07-01T15:03:41Z` — this is wave-27's web deploy, unchanged. No new web deploy this wave. Confirmed web service was NOT touched.

## Canary

`canary_status: skipped` — real-user traffic is 0 (pre-launch), below `canary_threshold_dau: 1000`. T-block synthetic probes are the post-deploy signal.

## Rollback path (identified, reachable before/at cutover)

Previous good api revision is the prior SUCCESS deployment; rollback is a one-action `railway redeploy`/prior-deployment redeploy to that id (or a revert-PR + fresh `railway up`). Not needed — deploy verified healthy.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway (api): deployment 48c515e9-cfb8-41db-9a76-5ab07dd7741b status SUCCESS, cliCaller=claude_code, createdAt 2026-07-01T16:42:23Z (jq -e status==SUCCESS → exit 0)"
  - "https://api-production-b93e.up.railway.app/health: 200 OK {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "POST /servers/<uuid>/invite-code/rotate: 404 pre-deploy → 401 post-deploy (route live on new revision; AuthGuard rejecting unauthenticated — stale-revision defeat)"
  - "web service NOT redeployed: latest web deployment 328b1ae9 createdAt 2026-07-01T15:03:41Z unchanged (wave-27 revision)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: "8996230", deployment_id: "48c515e9-cfb8-41db-9a76-5ab07dd7741b", verified_at: "2026-07-01T16:44:00Z", health_url: "https://api-production-b93e.up.railway.app/health", live_url: "https://api-production-b93e.up.railway.app"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 real-user DAU < 1000); pre-launch. T-block synthetic probes are the post-deploy signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "Backend-only wave: api deployed (railway up CLI-push), web NOT touched (no web change). No migration (invite_code column write-in-place). Merge-to-main did NOT deploy (Railway CLI-push project) — C-2 actively pushed. Verified via authoritative deployment-state SUCCESS + /health 200 + rotate-route 404→401 flip. Rollback path = prior SUCCESS deployment redeploy, reachable, not needed."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    api deployed via authoritative CLI-push (railway up) from merged HEAD 8996230 and verified live
    on three independent, mutually-corroborating signals: (1) Railway deployment-state endpoint reports
    the pushed deployment 48c515e9 as SUCCESS with cliCaller=claude_code — NOT a stale revision;
    (2) /health returns 200; (3) the new rotate route flipped 404 (pre-deploy, proving merge-to-main had
    not deployed and /health was serving the stale pre-merge revision) → 401 (post-deploy, AuthGuard
    rejecting unauthenticated), which authoritatively proves the new build is registered and serving —
    defeating the false-green/stale-revision trap. web service was deliberately NOT redeployed and its
    latest deployment (328b1ae9, wave-27) is unchanged. No migration was run (correct: no schema change).
    A rollback path to the prior SUCCESS deployment is reachable. Canary skipped (0 real-user DAU < 1000,
    pre-launch) with T-block synthetic probes as the post-deploy signal.
  next_action: PROCEED_TO_T-block
```
