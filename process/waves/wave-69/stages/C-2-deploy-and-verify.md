# C-2 — Deploy & verify (wave-69 moderation reports)

Deploy is CLI-push (GraphQL), NOT git-triggered: merge to main does not auto-deploy. Each service deployed explicitly via `serviceInstanceDeploy(environmentId, serviceId, commitSha=<merge SHA>)` to avoid the stale-revision trap. Railway is GraphQL-only (`Project-Access-Token` header; no Railway CLI).

Merge commit deployed: **`5fdd2bbdf85d647332ce4372ae6296698f23978c`**

## Action 0 — Credential
- `$APP_RAILWAY_TOKEN` present; deploy-scoped GraphQL probe on project `ae55c191-...` returned `data.project` with services (api, web, supertokens, Postgres), no `errors`. Credential usable. No pause.

## Action 1 — Targets
- Services enumerated: api `7358a103-0a4f-44e6-9468-3d02d045531e` (api-production-b93e.up.railway.app), web `107d4255-422a-4b72-b138-0647f9192fe4` (web-production-bce1a8.up.railway.app). Environment production `bfdcc42f-fe5b-4198-a47a-b08f5940975d`.

## Migration apply (BEFORE api deploy) — the critical ordering gate
api start command is bare `node dist/src/main.js` (no auto-migrate), so 0025 MUST be applied before the new code serves.

- Prod app-DB public proxy resolved from Postgres service `DATABASE_PUBLIC_URL` → host `yamanote.proxy.rlwy.net:40008` (public proxy, not `postgres.railway.internal`).
- **Pre-apply investigation (per "stop and report if >0025 pending" guard):**
  - `to_regclass('public.reports')` → NULL (table absent).
  - Prod `drizzle.__drizzle_migrations` had 24 rows; local journal has 26 entries (idx 0–25).
  - Reconciled by matching journal `when` timestamps + sha256 hashes: idx 24 (`0024_cold_baron_zemo`, hash `77437740e8cf`) was ALREADY applied (prod row created_at `1783358536880`); prod `servers` table already physically had `is_public`/`description`/`topic` + `servers_is_public_idx`. The apparent "count 24 vs 26" gap was drizzle's 0-based idx plus a serial gap (missing id 21). **Exactly ONE migration was pending: 0025** (`c7d84bbc3332`). No over-apply risk — proceeded.
- Applied via `cd apps/api && DATABASE_URL='<public-proxy>' pnpm db:migrate` (drizzle-kit migrate) → `migrations applied successfully!`, EXIT 0.
- **Post-apply verification:**
  - `to_regclass('public.reports')` → `reports` ✓
  - `to_regclass('public.reports_target_server_status_idx')` → present ✓
  - FK count on `reports` = 5 ✓ (reporter, target_server, target_user, target_message, resolved_by)
  - Prod journal now 25 rows; newest hash `c7d84bbc3332` = sha256(0025), created_at `1783380521830` (matches local idx 25). Exactly one migration added, the correct one.

## Action 2 — Per-target deploy (authoritative Railway deployment-state, not /healthz)
Deployed api FIRST (backend the web depends on), then web. Both passed the merge SHA explicitly; polled the `deployments` GraphQL query to terminal `SUCCESS` with the merge commit in `meta`.

| Service | deploymentId | status | deployed commit | poll time |
|---|---|---|---|---|
| api | `2522c446-205b-4220-9278-faa11b06a31d` | SUCCESS | `5fdd2bbdf85d` (= merge SHA) | ~81s (BUILDING→DEPLOYING→SUCCESS) |
| web | `a034b611-00c3-4ea4-baeb-b018ad82a514` | SUCCESS | `5fdd2bbdf85d` (= merge SHA) | ~81s (BUILDING→DEPLOYING→SUCCESS) |

Deployed commit == merge SHA on both → no stale-revision race.

## Action 3 — Health + live route probes
- api `GET /health` → **200**, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- **`POST /reports` (unauth) → 401** — AuthGuard active + the new `/reports` route registered on the NEW revision (a 404 would indicate stale revision; a 500 would indicate the missing-table trap the migration ordering prevented). Confirms the ReportsModule shipped and is gated, without needing auth.
- web `GET /` → **200**.

## Action 5–7 — Canary
Real-user traffic is pre-launch (below `canary_threshold_dau`, default 1000 DAU). Canary skipped; T-block synthetic probes are the post-deploy signal.

---

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 2522c446-205b-4220-9278-faa11b06a31d status=SUCCESS, commit 5fdd2bbdf85d (= merge SHA), via deployments GraphQL query"
  - "railway web: deployment a034b611-00c3-4ea4-baeb-b018ad82a514 status=SUCCESS, commit 5fdd2bbdf85d (= merge SHA)"
  - "migration 0025_strong_gladiator applied to prod BEFORE api deploy: reports table + reports_target_server_status_idx + 5 FKs verified; prod journal 24→25 rows, newest hash c7d84bbc3332 = sha256(0025)"
  - "https://api-production-b93e.up.railway.app/health → 200 {status:ok,service:studyhall-api,version:0.0.1}"
  - "POST https://api-production-b93e.up.railway.app/reports (unauth) → 401 (route registered + AuthGuard on new revision)"
  - "https://web-production-bce1a8.up.railway.app/ → 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 5fdd2bbdf85d647332ce4372ae6296698f23978c, deployment_id: 2522c446-205b-4220-9278-faa11b06a31d, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-07-07T00:29:00Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: 5fdd2bbdf85d647332ce4372ae6296698f23978c, deployment_id: a034b611-00c3-4ea4-baeb-b018ad82a514, health_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-07-07T00:29:00Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "Real-user traffic pre-launch (< canary_threshold_dau). T-block synthetic probes are the post-deploy signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "Migration ordering honored: 0025 applied to prod before the new api code served (bare node start, no auto-migrate). Both services deployed with explicit merge SHA (no bare-redeploy stale-pin). Deploy verified via authoritative Railway deployment-state SUCCESS + deployed-commit==merge-SHA, not /healthz alone. Rollback path: previous good api/web revisions redeployable via serviceInstanceDeploy with the prior SHA."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Migration 0025 was applied explicitly (drizzle-kit migrate) against the prod app-DB via its public proxy
    BEFORE the new api revision served — the missing-table 500 trap is closed, confirmed by the live POST /reports
    returning 401 (route present + gated) rather than 500. Pre-apply investigation reconciled a 24-vs-26 journal
    discrepancy to a single pending migration (0025) via hash+timestamp matching, so no over-apply occurred; 0024
    was already applied. Both api and web deployed with the explicit merge SHA and verified via the authoritative
    Railway deployment-state endpoint (deployments GraphQL → SUCCESS) with deployed-commit == merge-SHA on both,
    eliminating the false-green and stale-revision failure modes. Env-var scoping honored (api owns the DB creds;
    web received none). Health 200 + web 200 confirmed. Rollback to the prior good revision is reachable via
    serviceInstanceDeploy with the previous SHA. Canary skipped with pre-launch traffic-threshold reasoning.
  next_action: PROCEED_TO_T-block
```
