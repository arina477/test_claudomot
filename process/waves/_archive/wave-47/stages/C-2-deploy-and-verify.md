# Wave 47 — C-2 Deploy & verify

**Block:** C (CI/CD) · **Stage:** C-2 · **Head:** head-ci-cd (spawn-pattern) · **Mode:** automatic
**Deploy platform:** Railway (GraphQL only — no CLI). Merge SHA: `4db10675e0537b1d5e95e4b87bd3bb7d1e1660d4`

## Actions executed

- **Action 0 — Credential confirmed.** `RAILWAY_TOKEN` present (project-scoped, `Project-Access-Token` header). Deploy-scoped GraphQL probe against project `ae55c191-4631-4224-b7b2-42f329ed48d7` returned project `app-arina-89ejyn` + 4 services (web, api, supertokens, Postgres), no `errors`. Credential usable; no founder pause needed.
- **Migration step — SKIPPED.** No schema change / no migration this wave (read-only `GET /dm/candidates` over existing tables). Confirmed against spec + brief. Deployed directly.
- **Rollback path confirmed BEFORE cutover.** Pre-deploy latest SUCCESS deployment per service (redeployable via `deploymentRedeploy`):
  - api → `ec3bac32-109d-4bad-b7f9-4a9d403c9b4d` (commit `c49ae21`)
  - web → `22263eba-6fd4-4e3c-b1cc-1f90a3b0ecfe` (commit `c49ae21`)
- **Action 1/2 — Deploy BOTH targets pinned to merge SHA.** `serviceInstanceDeployV2(environmentId, serviceId, commitSha=4db10675…)`:
  - api → deployment `9502de2a-89f1-45dd-8949-632b804319c6`
  - web → deployment `bd9dcd2f-54a8-4f12-9127-87e947b4a826`
- **Action 4 — Inline-poll (≤10-min cap, 570s short-circuit).** Both services BUILDING → **SUCCESS** at ~61s. Authoritative deployment-state endpoint (`deployments(first:1)`) confirms `status == SUCCESS` AND `meta.commitHash == 4db10675…` on **both** services — no stale-revision race.
- **Action 3 — Health + freshness probes:**
  - api `GET /health` → **HTTP 200**
  - web `GET /` → **HTTP 200**
  - api `GET /dm/candidates` → **HTTP 401** (`{"message":"unauthorised"}`) — route mounted + auth-guarded, NOT 404. Authoritative freshness proof the new read-only endpoint shipped in this deploy.
- **Action 5–7 — Canary: SKIPPED** (pre-launch DAU < 1000, below `canary_threshold_dau`). Deploy verification ran in full.

## head-ci-cd C-2 stage-exit checklist

- [x] Deploy verification reads Railway authoritative deployment-state endpoint (`deployments(first:1)` → `status == SUCCESS`), NOT a self-reported /healthz.
- [x] New revision confirmed serving before deploy called done — `meta.commitHash == merge SHA` on both api + web; `/dm/candidates` 401 proves new code live (no stale-revision race).
- [x] Migrations applied explicitly in order before serving — N/A this wave (no migration; read-only endpoint). Correctly skipped, not auto-migrated.
- [x] Every required env var exists in the target service scope — no new env var this wave (read-only over existing tables); api scope (DB/SuperTokens/LiveKit) unchanged; web received no DB creds.
- [x] Deploy verification declared success/failure conditions + timeout: inline-poll success = both SUCCESS on merge SHA; failure = any of FAILED/CRASHED/REMOVED/SKIPPED; timeout = 570s cap (< 900s budget).
- [x] Rollback path to previous good revision identified + reachable before cutover (api `ec3bac32`, web `22263eba`, both SUCCESS on `c49ae21`, redeployable via `deploymentRedeploy`).
- [x] Secrets via env var only; `RAILWAY_TOKEN` never committed; no generated secrets this wave.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api (7358a103…): deployment 9502de2a… status SUCCESS, meta.commitHash 4db10675…"
  - "railway web (107d4255…): deployment bd9dcd2f… status SUCCESS, meta.commitHash 4db10675…"
  - "https://api-production-b93e.up.railway.app/health: HTTP 200"
  - "https://web-production-bce1a8.up.railway.app/: HTTP 200"
  - "https://api-production-b93e.up.railway.app/dm/candidates: HTTP 401 (route mounted+guarded — freshness proof, NOT 404)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 4db10675e0537b1d5e95e4b87bd3bb7d1e1660d4, deployment_id: 9502de2a-89f1-45dd-8949-632b804319c6, verified_at: 2026-07-04T14:01Z, health_url: "https://api-production-b93e.up.railway.app/health", health: 200, freshness: "/dm/candidates=401"}
  - {platform: railway, service: web, state: SUCCESS, commit: 4db10675e0537b1d5e95e4b87bd3bb7d1e1660d4, deployment_id: bd9dcd2f-54a8-4f12-9127-87e947b4a826, verified_at: 2026-07-04T14:01Z, health_url: "https://web-production-bce1a8.up.railway.app/", health: 200}
rollback_targets:
  - {service: api, deployment_id: ec3bac32-109d-4bad-b7f9-4a9d403c9b4d, commit: c49ae2172904121265743f83d40352d43f784155}
  - {service: web, deployment_id: 22263eba-6fd4-4e3c-b1cc-1f90a3b0ecfe, commit: c49ae2172904121265743f83d40352d43f784155}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-launch < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "NO migration this wave (read-only endpoint). Both api+web deployed on merge SHA and verified via authoritative deployment-state endpoint in ~61s. Rollback reachable pre-cutover. Railway CLI hook-blocked — GraphQL only used throughout."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: "Both api and web deployed pinned to merge SHA 4db10675 and verified SUCCESS via Railway's authoritative deployment-state endpoint with meta.commitHash matching the merge commit — no false-green, no stale-revision race. Health 200 on both; /dm/candidates returns 401 (mounted+guarded), the load-bearing freshness proof that the new read-only endpoint shipped rather than a stale revision answering. No migration this wave (read-only over existing tables), correctly skipped. Rollback path to the prior good revision (c49ae21) confirmed reachable on both services before cutover. Canary skipped per sub-1000-DAU threshold with synthetic-probe reasoning recorded. Every applicable C-2 stage-exit check ticked."
  next_action: PROCEED_TO_T-block
```
