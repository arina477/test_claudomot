# C-2 — Deploy & verify (wave-20 M4 offline spine)

## Action 0 — Railway credential
- Token present + usable. Deploy-scoped probe (`Project-Access-Token` header, never `me{}`) returned `data.project` with no errors. Project `app-arina-89ejyn` (ae55c191), environment `production` (bfdcc42f). Services: web (107d4255), api (7358a103), supertokens, Postgres. (No LiveKit service — M5+ scope, not this wave.)

## NO MIGRATION this wave
- Drizzle ledger UNCHANGED: `git diff --stat origin/main...HEAD -- apps/api/drizzle/` empty (confirmed at C-1). Highest migration remains `0009_narrow_carnage.sql`. Dexie is client-side; the forward `?after=` cursor is a query; server idempotency reused from M3. No `drizzle-kit migrate` step required — and none run.

## Pre-deploy baselines (captured BEFORE deploy — proves new-revision distinctness)
| Service | Baseline deployment id | status | createdAt |
|---|---|---|---|
| api | `8ef2c228-bac8-499b-8b87-661e42e0d2a8` | SUCCESS | 2026-06-30T18:12:46Z |
| web | `8d3e0c36-59ae-44aa-bf28-9b7390568b4d` | SUCCESS | 2026-06-30T18:14:03Z |

Pre-deploy live health baseline: api /health 200, web root 200, forward route `?after=` already 401 (route pre-existed from M3 list endpoint; the `?after=` param extends the same handler — so deployment-state distinctness, not the 401/404 flip alone, is the load-bearing new-revision proof).

## Deploy (source-upload, both services)
- `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN npx -y @railway/cli@latest up --service <api|web> --environment production --ci`
- api `up` → exit 0, "Deploy complete" (CLI self-report — NOT the authoritative verdict).
- web `up` → exit 0, "Deploy complete" (CLI self-report — NOT the authoritative verdict).

## Authoritative verification — Railway deployment-state endpoint (NOT /healthz)
Polled `deployments(first:1, input:{projectId, serviceId, environmentId})` per service; required NEW id (≠ baseline) AND status SUCCESS.

| Service | NEW deployment id | distinct from baseline? | status |
|---|---|---|---|
| api | `d26fe078-270b-45ae-877a-6fb5cc8f822f` | YES | **SUCCESS** |
| web | `2aac8438-9336-42d8-b01d-03b29786c28c` | YES | **SUCCESS** |

## New revision serves traffic (stale-revision-race guard)
- api `/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
- web root → **200**
- Forward catch-up route `GET /channels/<id>/messages?after=0` → **401 (NOT 404)** — auth-gated route serves under the new api revision (CI-PRINCIPLES rule 2). `?after=notanumber` also 401 (auth gate runs before validation). Route confirmed serving.

## Env-var scoping
- No new env var this wave (client-side Dexie; no new secrets). api booted healthy (200 /health) → its DB + SuperTokens env vars present in the api scope (boot would crash otherwise). web serves the SPA statically (`serve`) → no DB creds, correct scope. No cross-service scope change required.

## Rollback path (identified + reachable before declaring done)
- Last-good revisions = the captured baselines: api `8ef2c228` (SUCCESS), web `8d3e0c36` (SUCCESS).
- Reachable via Railway `deploymentRedeploy` / `serviceInstanceRedeploy` against those deployment ids over GraphQL (`Project-Access-Token` header). One-action redeploy to previous good revision per service.

## C-3 Canary disposition — SKIPPED
- `project.yaml: deploy_targets[].canary_threshold_dau = 1000`; real-user DAU = 0 (pre-launch self-use MVP). CI-PRINCIPLES canary config `enabled: false` (canary deferred to M7 launch).
- Below threshold the synthetic post-deploy probes above (deployment-state SUCCESS + /health 200 + route-serves 401) are the post-deploy signal. T-block synthetic probes follow. Recorded skip with traffic-threshold reasoning.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway gh
verdict_evidence:
  - "railway api: NEW deployment d26fe078-270b-45ae-877a-6fb5cc8f822f status SUCCESS (baseline was 8ef2c228; distinct)"
  - "railway web: NEW deployment 2aac8438-9336-42d8-b01d-03b29786c28c status SUCCESS (baseline was 8d3e0c36; distinct)"
  - "api /health 200 ok; web root 200"
  - "GET /channels/<id>/messages?after=0 -> 401 (not 404): new api revision serves the forward catch-up route"
  - "drizzle ledger unchanged; no migration applied"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: d26fe078-270b-45ae-877a-6fb5cc8f822f, baseline_id: 8ef2c228-bac8-499b-8b87-661e42e0d2a8, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-06-30T19:52:00Z"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 2aac8438-9336-42d8-b01d-03b29786c28c, baseline_id: 8d3e0c36-59ae-44aa-bf28-9b7390568b4d, health_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-06-30T19:52:00Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU 0 < threshold 1000 (pre-launch self-use MVP); CI-PRINCIPLES canary enabled:false (M7). Synthetic deploy-state + health + route-serves probes are the post-deploy signal; T-block follows."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
rollback_ready: true
rollback_targets:
  - {service: api, to_deployment_id: 8ef2c228-bac8-499b-8b87-661e42e0d2a8, method: "railway deploymentRedeploy (GraphQL)"}
  - {service: web, to_deployment_id: 8d3e0c36-59ae-44aa-bf28-9b7390568b4d, method: "railway deploymentRedeploy (GraphQL)"}
note: "Both services deployed + verified via authoritative deployment-state SUCCESS with new revision distinct from baseline; new revision confirmed serving; no migration; drizzle ledger unchanged; rollback reachable; canary skipped below DAU threshold."
```

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: Both api and web deployed via railway source-upload and verified through the authoritative Railway deployment-state GraphQL endpoint (NOT /healthz) — each produced a NEW deployment id distinct from its pre-captured baseline (api d26fe078 vs 8ef2c228; web 2aac8438 vs 8d3e0c36) and each reached status SUCCESS; the new revision is confirmed serving (api /health 200, web root 200, forward ?after= route 401-not-404); no migration was applicable and the drizzle ledger is unchanged; required api/web env vars are present in their respective service scopes (healthy boot proves it, no cross-service leak, no new secret this wave); a one-action rollback to the previous good revisions is identified and reachable; canary is correctly skipped at DAU 0 below the 1000 threshold with synthetic probes serving as the post-deploy signal.
  next_action: PROCEED_TO_T_BLOCK
