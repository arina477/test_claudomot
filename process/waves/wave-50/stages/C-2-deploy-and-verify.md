# C-2 — Deploy & verify (wave-50)

**Wave:** 50 — M8 study-group slice 2: per-server custom Pomodoro durations on the LIVE shared study timer + F-1 slim-bar fix.
**Merge commit:** `699477655a2918a17b481437dea49ae349e6e317`.
**Deploy platform:** Railway (GraphQL-only), project `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), env production (`bfdcc42f-fe5b-4198-a47a-b08f5940975d`).
**head-ci-cd verdict:** PASS.

## Credential (Action 0)

Project-scoped `RAILWAY_TOKEN` present + usable. Deploy-scoped probe (`project(id:){services}`) returned data with no errors; authenticated via `Project-Access-Token` header (never Bearer, never `me{}`). Services: web `107d4255`, api `7358a103`, supertokens `73ca977a`, Postgres `8d177be8`. No founder pause needed.

## Migration 0023 — applied BEFORE cutover (correct ordering)

Railway deploy is CLI-push (GraphQL trigger), NOT git-trigger — merge to main does not auto-deploy — so migration 0023 was applied explicitly first via the Postgres public proxy, then code deployed (no un-migrated-schema-serving window). 0023 is ADDITIVE (`ADD COLUMN ... DEFAULT ... NOT NULL`) — existing rows backfill 25/5, zero downtime, no data risk.

- **DB reachability:** app DB reachable from local only via public proxy. Fetched Postgres `DATABASE_PUBLIC_URL` (host `yamanote.proxy.rlwy.net:40008`) via GraphQL `variables()` query on the Postgres service.
- **Pre-apply ledger check:** `drizzle.__drizzle_migrations` had **22 rows**, `latest_created_at=1783252929946` = migration 0022's journal `when` (exact match). No phantom row, no gap, no mismatch. Both 0023 columns absent (empty result); `to_regclass('public.server_study_timer')` present (from 0022). Ledger clean → no postgres-pro escalation.
- **Apply:** `pnpm db:migrate` (= `drizzle-kit migrate`, exact command wave-49 C-2 used) against `DATABASE_URL`/`DATABASE_URL_UNPOOLED` = the public proxy URL → `[✓] migrations applied successfully!` (exit 0; idempotent — only 0023 ran).
- **Post-apply proof:** ledger now **23 rows**, `latest=1783268077606` = migration 0023's journal `when` (idx 23, exact match). Both columns present on `server_study_timer`: `work_duration_ms` (integer, default 1500000, NOT NULL) + `break_duration_ms` (integer, default 300000, NOT NULL). 2 existing rows both backfilled to 25min/5min defaults (additive, no data loss).

## Env-var scoping verified in target service scope (pre-cutover)

| Service | Required set present? | Notes |
|---|---|---|
| api | YES | `DATABASE_URL` + `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI` + `SUPERTOKENS_API_KEY`, `LIVEKIT_API_KEY/SECRET/URL`, `SESSION_SECRET`, storage (AWS/S3) + email (RESEND) creds. Study-timer module needs DB + auth/RBAC — all satisfied. No new env var required this wave (0023 adds no config). |
| web | least-privilege | ONLY `VITE_API_ORIGIN` + `VITE_LIVEKIT_URL` (plus Railway platform vars). **No DB creds, no secrets** — correct scoping (missing-env-var-cutover and scoped-secret-leak both prevented). Duration-config affordance needs no new env var. |

## Rollback path (identified + reachable BEFORE cutover)

- api last-good (current serving pre-cutover): deployment `476d8a0d` (commit `3835100...`, SUCCESS)
- web last-good (current serving pre-cutover): deployment `d6f480c0` (commit `3835100...`, SUCCESS)

Both reachable via Railway `serviceInstanceRedeploy(environmentId, serviceId)` or `deploymentRedeploy(id)` if cutover had failed. Confirmed present before triggering the new deploys.

## Deploy trigger + authoritative deployment-state verification (NOT /health alone)

Deploys triggered explicitly on the merge commit via `serviceInstanceDeploy(serviceId, environmentId, commitSha=699477655a..., latestCommit:false)` — both returned `true`. Polled the authoritative `deployments` GraphQL endpoint (deploy monitor: success_condition = both `SUCCESS`; failure_condition = any of `FAILED/CRASHED/REMOVED/SKIPPED`; timeout_budget = 900s, inline-cap 600s per C-2 Action 4; poll_delay 30s). Log: `process/session/monitors/monitor-c2-wave50-deploy.log`. Progressed BUILDING → SUCCESS in ~60s.

| Service | Latest deployment id | Status | Deployed commit | staticUrl |
|---|---|---|---|---|
| api | 29b4c8ae-0b95-4f0b-9706-8156a4ffe3d4 | **SUCCESS** | **699477655a...** (= merge SHA) | api-production-b93e.up.railway.app |
| web | 8927936f-0c35-4da3-ac03-3aeb925013ac | **SUCCESS** | **699477655a...** (= merge SHA) | web-production-bce1a8.up.railway.app |

Both SUCCESS (not SKIPPED/FAILED/CRASHED/REMOVED). **Deployed-commit-hash matches the merge SHA on both services** — the new revision is the serving revision, not a stale one.

## Health probes (serving-revision confirmation)

| Target | Endpoint | Result |
|---|---|---|
| api | https://api-production-b93e.up.railway.app/health | 200 · `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web | https://web-production-bce1a8.up.railway.app/ | 200 |

Authoritative deployment-state (SUCCESS @ 699477655a) AND live health probes (200) agree → new revision deployed AND serving. No stale-revision race, no false-green.

## Feature liveness on the new revision

- `PATCH /servers/probe/study-timer/config` → **401** (NEW auth-guarded config route EXISTS — not 404): the per-server custom-duration REST route shipped.
- `GET /servers/probe/study-timer` → **401** (existing guarded route intact).
- Socket.IO handshake `GET /socket.io/?EIO=4&transport=polling` → **200**: the gateway (incl. `/study-timer` namespace) is live.

## Canary

**SKIPPED** — pre-launch, real-user traffic = 0 DAU < 1000 `canary_threshold_dau`. Synthetic probes (above) are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api service 7358a103: latest deployment 29b4c8ae status=SUCCESS, commit=699477655a (=merge SHA), staticUrl api-production-b93e.up.railway.app"
  - "railway web service 107d4255: latest deployment 8927936f status=SUCCESS, commit=699477655a (=merge SHA), staticUrl web-production-bce1a8.up.railway.app"
  - "migration 0023 applied: drizzle ledger 22->23 rows, latest=1783268077606 (=0023 journal when idx 23); server_study_timer gains work_duration_ms + break_duration_ms (integer, defaults 1500000/300000, NOT NULL); 2 existing rows backfilled 25/5"
  - "https://api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
  - "feature liveness: PATCH /servers/probe/study-timer/config 401 (new config route exists), GET /servers/probe/study-timer 401, socket.io handshake 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: "699477655a2918a17b481437dea49ae349e6e317", deployment_id: "29b4c8ae-0b95-4f0b-9706-8156a4ffe3d4", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: "699477655a2918a17b481437dea49ae349e6e317", deployment_id: "8927936f-0c35-4da3-ac03-3aeb925013ac", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "Pre-launch; DAU 0 < 1000 canary_threshold_dau. No real-user traffic to canary; synthetic health + feature-liveness probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "Migration 0023 (additive ADD COLUMN) applied via public proxy BEFORE cutover (ledger 22->23 clean, no phantom row; 2 rows backfilled 25/5, zero data risk). api+web deployed to merge commit 699477655a via serviceInstanceDeploy(latestCommit:false); both SUCCESS in ~60s with deployed-commit == merge SHA and health 200. Env scoping verified (api full DB/SuperTokens/LiveKit set; web only VITE_ vars, no DB creds). Rollback targets api 476d8a0d / web d6f480c0 identified before cutover. New PATCH config route live (401 guard, not 404). Canary skipped (0 DAU)."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy verified against Railway's authoritative deployment-state endpoint, not /health alone.
    Migration 0023 was applied explicitly and in order via the Postgres public proxy BEFORE any new
    code served — the pre-apply ledger was clean (22 rows matching 0022's journal timestamp
    1783252929946, no phantom row, no gap) and the post-apply ledger confirms 23 rows matching 0023's
    journal timestamp 1783268077606 with both work_duration_ms and break_duration_ms physically
    present on server_study_timer (integer, defaults 1500000/300000, NOT NULL) and the 2 existing rows
    backfilled to 25/5 — additive, zero data risk. Both api and web deployed to the merge commit
    699477655a via serviceInstanceDeploy(latestCommit:false); both report latest deployment
    status=SUCCESS with the deployed-commit-hash EQUAL to the merge SHA, and both health probes return
    200 — deployment-state and live serving signal agree, so the new revision is the serving revision
    with no stale-revision race and no false-green. The deploy monitor declared all three conditions
    (success=both SUCCESS, failure=any FAILED/CRASHED/REMOVED/SKIPPED, timeout_budget=900s). Env-var
    scoping was confirmed in the target scope: api holds the full DB/SuperTokens/LiveKit set the
    duration-config module needs, and web holds only its two VITE_ vars with no DB creds
    (least-privilege intact). A reachable rollback path to the prior good revisions (api 476d8a0d /
    web d6f480c0) was identified before cutover. The new per-server duration-config route
    (PATCH .../study-timer/config, 401-guarded not 404) and the Socket.IO gateway (200) are live on
    the new revision. Canary skipped per the 0-DAU pre-launch traffic threshold.
  next_action: PROCEED_TO_T-block
```
