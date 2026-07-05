# C-2 — Deploy & verify (wave-49)

**Wave:** 49 — M8 study-group tools slice 1: server-scoped shared study timer.
**Merge commit:** `3835100250b7de1b68232026af7030c57586948f`.
**Deploy platform:** Railway (GraphQL-only), project `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), env production (`bfdcc42f-fe5b-4198-a47a-b08f5940975d`).
**head-ci-cd verdict:** PASS.

## Credential (Action 0)

Project-scoped `RAILWAY_TOKEN` present + usable. Deploy-scoped probe (`project(id:){services}`) returned data with no errors; authenticated via `Project-Access-Token` header (never Bearer, never `me{}`). Self-discovered env id `bfdcc42f-...` matches project.yaml. Services: api `7358a103`, web `107d4255`, supertokens `73ca977a`, Postgres `8d177be8`. No founder pause needed.

## Migration 0022 — applied BEFORE cutover (correct ordering)

Railway deploy is CLI-push, NOT git-trigger — merge to main does not auto-deploy — so migration was applied explicitly first, then code deployed (no un-migrated-schema-serving window).

- **Pre-apply ledger check:** `drizzle.__drizzle_migrations` had **21 rows**, `latest_created_at=1783157153353` = migration 0021's journal `when` (exact match). No phantom row, no gap, no anomaly. `to_regclass('public.server_study_timer')` = null (0022 not yet applied). No corruption → no postgres-pro escalation needed.
- **Apply:** `drizzle-kit migrate` against the Postgres **public proxy** (`DATABASE_PUBLIC_URL`, host `yamanote.proxy.rlwy.net`) — the app DB is unreachable from local except via the proxy. First attempt hit a transient proxy connection blip (exit 1, no partial state); clean retry → `[✓] migrations applied successfully!` (idempotent; only un-applied migrations run).
- **Post-apply proof:** ledger now **22 rows**, `latest=1783252929946` = migration 0022's journal `when` (exact match). `to_regclass` = `server_study_timer`. Columns: id, server_id, phase, run_state, started_at, ends_at, paused_remaining_ms, updated_by, created_at, updated_at (all 10). `server_study_timer_server_id_unique` constraint present. FK cascade on servers, FK on users — per 0022 SQL.

## Env-var scoping verified in target service scope (pre-cutover)

| Service | Required set present? | Notes |
|---|---|---|
| api | YES | `DATABASE_URL` + `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI` + `SUPERTOKENS_API_KEY`, `LIVEKIT_API_KEY/SECRET/URL`, `SESSION_SECRET`, storage + email creds. New study-timer module needs DB + auth/RBAC — all satisfied. No new env var required this wave. |
| web | least-privilege | ONLY `VITE_API_ORIGIN` + `VITE_LIVEKIT_URL`. **No DB creds, no secrets** — correct scoping (missing-env-var-cutover and scoped-secret-leak both prevented). Study-timer widget needs no new env var. |

## Rollback path (identified + reachable BEFORE cutover)

- api last-good: deployment `9502de2a` (commit `4db10675`, SUCCESS)
- web last-good: deployment `bd9dcd2f` (commit `4db10675`, SUCCESS)

Both reachable via Railway `serviceInstanceRedeploy(environmentId, serviceId)` or `deploymentRollback(id)` if cutover had failed. Confirmed present before triggering the new deploys.

## Deploy trigger + authoritative deployment-state verification (NOT /health alone)

Deploys triggered explicitly on the merge commit via `serviceInstanceDeploy(serviceId, environmentId, commitSha=3835100..., latestCommit:false)` — both returned `true`. Polled the authoritative `deployments` GraphQL endpoint (deploy monitor: success_condition = both `SUCCESS`, failure_condition = any of `FAILED/CRASHED/REMOVED/SKIPPED`, timeout_budget = 600s inline cap). Progressed BUILDING → SUCCESS in ~4 min.

| Service | Latest deployment id | Status | Deployed commit | createdAt | staticUrl |
|---|---|---|---|---|---|
| api | 476d8a0d-2a53-4634-a30c-2f35ae89abf7 | **SUCCESS** | **3835100250...** (= merge SHA) | 2026-07-05T14:18:39Z | api-production-b93e.up.railway.app |
| web | d6f480c0-7ce8-4cfe-85d6-5f0c844068f5 | **SUCCESS** | **3835100250...** (= merge SHA) | 2026-07-05T14:18:40Z | web-production-bce1a8.up.railway.app |

Both SUCCESS (not SKIPPED/FAILED/CRASHED/REMOVED). **Deployed-commit-hash matches the merge SHA on both services** — the new revision is the serving revision, not a stale one.

## Health probes (serving-revision confirmation)

| Target | Endpoint | Result |
|---|---|---|
| api | https://api-production-b93e.up.railway.app/health | 200 · `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web | https://web-production-bce1a8.up.railway.app/ | 200 |

Authoritative deployment-state (SUCCESS @ 3835100) AND live health probes (200) agree → new revision deployed AND serving. No stale-revision race, no false-green.

## Feature liveness on the new revision

- `GET /servers/probe/study-timer` → **401** (auth-guarded route EXISTS — not 404): the server-scoped study-timer REST route shipped.
- Socket.IO handshake `GET /socket.io/?EIO=4&transport=polling` → **200**: the gateway (incl. `/study-timer` namespace) is live.

## Canary

**SKIPPED** — pre-launch, real-user traffic = 0 DAU < 1000 `canary_threshold_dau`. Synthetic probes (above) are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api service 7358a103: latest deployment 476d8a0d status=SUCCESS, commit=3835100 (=merge SHA), staticUrl api-production-b93e.up.railway.app"
  - "railway web service 107d4255: latest deployment d6f480c0 status=SUCCESS, commit=3835100 (=merge SHA), staticUrl web-production-bce1a8.up.railway.app"
  - "migration 0022 applied: drizzle ledger 21->22 rows, latest=1783252929946 (=0022 journal when); to_regclass server_study_timer present w/ 10 cols + unique constraint"
  - "https://api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
  - "feature liveness: /servers/probe/study-timer 401 (route exists), socket.io handshake 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: "3835100250b7de1b68232026af7030c57586948f", verified_at: "2026-07-05T14:18:39Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: "3835100250b7de1b68232026af7030c57586948f", verified_at: "2026-07-05T14:18:40Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "Pre-launch; DAU 0 < 1000 canary_threshold_dau. No real-user traffic to canary; synthetic health probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "Migration 0022 applied via public proxy BEFORE cutover (ledger clean, no phantom row). api+web deployed to merge commit 3835100 via serviceInstanceDeploy; both SUCCESS with deployed-commit == merge SHA and health 200. Env scoping verified (api full DB/auth set; web no DB creds). Rollback targets api 9502de2a / web bd9dcd2f identified before cutover. Canary skipped (0 DAU)."
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
    Migration 0022 was applied explicitly and in order via the Postgres public proxy BEFORE any new
    code served — the pre-apply ledger was clean (21 rows matching 0021's journal timestamp, no
    phantom row) and the post-apply ledger confirms 22 rows matching 0022's journal timestamp with the
    server_study_timer table (10 cols + unique constraint) physically present. Both api and web
    deployed to the merge commit 3835100 via serviceInstanceDeploy; both report latest deployment
    status=SUCCESS with the deployed-commit-hash EQUAL to the merge SHA, and both health probes return
    200 — deployment-state and live serving signal agree, so the new revision is the serving revision
    with no stale-revision race and no false-green. Env-var scoping was confirmed in the target scope:
    api holds the full DB/SuperTokens/LiveKit set the study-timer module needs, and web holds only its
    two VITE_ vars with no DB creds (least-privilege intact). A reachable rollback path to the prior
    good revisions (api 9502de2a / web bd9dcd2f) was identified before cutover. The study-timer REST
    route (401-guarded, not 404) and Socket.IO gateway (200) are live on the new revision. Canary
    skipped per the 0-DAU pre-launch traffic threshold.
  next_action: PROCEED_TO_T-block
```
