# C-2 — Deploy & verify (wave-45)

**Block:** C (CI/CD) · **Stage:** C-2 · **Mode:** automatic · **Head:** head-ci-cd (owns block)
**Wave:** 45 — M8 tech-debt HYGIENE. Merge commit `ae22380c7809f1625b26431752ead4afd9b8558b`.

## Action 0 — Railway credential (Railway GraphQL only; no Railway CLI)
- `RAILWAY_TOKEN` present (project-scoped, from `$APP_RAILWAY_TOKEN`).
- Deploy-scoped probe (`project(id)` with `Project-Access-Token` header, never `me{}`) → `project_ok: true`, project `app-arina-89ejyn`, 4 services enumerated (web, api, supertokens, Postgres). Credential usable. No pause.

## Action 1 — Enumerate targets
- One deploy target: Railway. **Only the web service deploys this wave** — only `apps/web` source changed; api/supertokens/Postgres UNCHANGED → not redeployed.
- web service id: `107d4255-422a-4b72-b138-0647f9192fe4` · env production `bfdcc42f-fe5b-4198-a47a-b08f5940975d` · URL https://web-production-bce1a8.up.railway.app

## Baseline / rollback target (captured pre-deploy)
- Previous live web deployment: `a406cb58-e3e5-4ecd-94f8-0f1e3c812739`, status SUCCESS, commit `4522101fe43d...`.
- Reachable rollback: redeploy `a406cb58` (or `deploymentRedeploy` pinned to `4522101f`) via GraphQL if the new deploy had regressed. Rollback path confirmed reachable before cutover; not needed (new deploy SUCCESS + healthy).

## Action 2 — Per-target deploy verification (authoritative deployment-state endpoint, NOT /healthz)
- Triggered `serviceInstanceDeployV2(environmentId, serviceId, commitSha=ae22380c7809...)` → new deployment `47453bab-2420-4db0-98b7-f1378c9806c7`.
- Inline-poll (Railway `deployments(first:1)` GraphQL, 20s cadence, 600s cap): BUILDING×3 → **SUCCESS at ~60s**.
- Latest deployment `47453bab...` `status: SUCCESS` (NOT SKIPPED), `meta.commitHash: ae22380c7809f1625b26431752ead4afd9b8558b` == merge commit. Serving revision == deployed revision — no stale-revision race. No `serviceInstanceRedeploy` fallback needed (Railway rebuilt despite identical emitted-JS).
- Poll log: `process/session/monitors/c2-web-deploy-wave45.log`.

## Action 3 — Health endpoint probes
- `GET https://web-production-bce1a8.up.railway.app/` → **HTTP 200** (0.12s).
- `GET https://web-production-bce1a8.up.railway.app/health` (declared `health_endpoint`) → **HTTP 200** (0.11s).
- Fresh bundle serving the new commit (deployment-state confirms commit identity above; health confirms live serving).

## Action 4 — Async handoff
- Not needed: inline-poll resolved SUCCESS in ~60s (well under 10-min cap). No MONITOR-task spawned; no HOLD.

## Actions 5–7 — Canary
- **SKIPPED** per block-level rule + project.yaml `canary_threshold_dau: 1000`. Pre-launch; real-user DAU < 1000 → synthetic probes (T-block) are the post-deploy signal, cheaper + more reliable than real-user telemetry at this scale.

## Action 8 — Deploy failure
- Not entered. Deploy SUCCESS on first attempt (0 forced-redeploy attempts).

## Stage-exit checklist (head-ci-cd)
- [x] Deploy verification reads Railway authoritative deployment-state endpoint (GraphQL `deployments`), NOT self-reported /healthz.
- [x] [STABLE] New revision confirmed serving before done — latest deployment id/commit == triggered deploy == merge commit; health 200.
- [x] Migrations applied explicitly in order — N/A (no schema/migration this wave; confirmed no drizzle/.sql in diff).
- [x] Env-var scope correct in target service — N/A (no env change; web already provisioned; api untouched, no DB creds moved to web).
- [x] Deploy monitor conditions — inline-poll used success (`status==SUCCESS`) + failure (`status IN FAILED/CRASHED/REMOVED/SKIPPED`) + 600s cap, per railway-deploy template three-condition contract.
- [x] [STABLE] Rollback path identified + reachable before cutover — previous good web deployment a406cb58 / commit 4522101f.
- [x] Secrets via platform env vars only — no secret committed; RAILWAY_TOKEN kept in env, GH_TOKEN inline-only, never committed.
- [x] Canary — SKIP recorded with traffic-threshold reasoning (DAU < 1000).
- [x] No preemptive pause — block exit is the deploy-state + health verdict.

## Footer

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway web deploy 47453bab-2420-4db0-98b7-f1378c9806c7: status SUCCESS, commit ae22380c7809f1625b26431752ead4afd9b8558b (== merge commit)"
  - "https://web-production-bce1a8.up.railway.app/ : HTTP 200"
  - "https://web-production-bce1a8.up.railway.app/health : HTTP 200"
  - "canary skipped — DAU below 1000 threshold"
deploy_targets:
  - platform: railway
    service: web
    state: SUCCESS
    commit: ae22380c7809f1625b26431752ead4afd9b8558b
    deployment_id: 47453bab-2420-4db0-98b7-f1378c9806c7
    verified_at: "2026-07-04T06:46Z"
    health_url: https://web-production-bce1a8.up.railway.app/health
    health_status: 200
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-launch, real-user DAU < 1000); T-block synthetic probes are the post-deploy signal."
canary_monitor_id: ""
canary_alerts: []
rollback_target:
  deployment_id: a406cb58-e3e5-4ecd-94f8-0f1e3c812739
  commit: 4522101fe43dddf77d4f04150c143d27b8be8d24
  reachable: true
note: "Only web service deployed (only apps/web changed); api/supertokens/Postgres UNCHANGED, not redeployed. No schema/migration/deps/env change. Railway rebuilt despite identical emitted-JS — deploy NOT SKIPPED, no redeploy fallback needed."
```

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: "Web-only deploy of merge commit ae22380 to Railway: triggered deployment 47453bab reached authoritative status SUCCESS (not SKIPPED) with meta.commitHash == merge commit — serving revision confirmed == deployed revision, no stale-revision race, no false-green. Health probes / and /health both 200. No migration/env/deps this wave (checklist items N/A by no-op). Rollback target (prior good deployment a406cb58/4522101f) identified reachable before cutover. Canary SKIP recorded per DAU<1000 threshold. api service correctly left untouched."
  next_action: PROCEED_TO_T_BLOCK
