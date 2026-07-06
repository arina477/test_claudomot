# C-2 — Deploy & verify (wave-53)

## Action 0 — Railway credential
`RAILWAY_TOKEN` present + usable. Deploy-scoped probe returned `project: app-arina-89ejyn` with services web/api/supertokens/Postgres, no `errors`. Railway GraphQL only (no CLI).

## Action 1-2 — Deploy (commit-pinned via GraphQL)
Baseline: both api + web were on the previous commit `725f7b6` (wave-52) — merge to main did NOT auto-deploy (Railway is API-push, not git-triggered). Triggered `serviceInstanceDeploy(serviceId, environmentId=production, commitSha=9c114d0…)` for both services → `true`.

Deploy progression (polled): BUILDING → DEPLOYING → **SUCCESS** for both, after 90s.

| Service | Service ID | Final status | Deployed commit | Domain |
|---|---|---|---|---|
| api | 7358a103-… | **SUCCESS** | 9c114d0bf12b7d0469b46519f550624b3db92aea | api-production-b93e.up.railway.app |
| web | 107d4255-… | **SUCCESS** | 9c114d0bf12b7d0469b46519f550624b3db92aea | web-production-bce1a8.up.railway.app |

Deployed commit == C-1 merge SHA `9c114d0` on both services (stale-revision guard PASS — no SKIPPED, no wrong-SHA).

## Action 3 — Health probes
- `https://api-production-b93e.up.railway.app/health` → **HTTP 200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (115ms).
- `https://web-production-bce1a8.up.railway.app/` → **HTTP 200** (126ms).
- api root `/` → 404 (expected — no root route; app is up + routing).

## Actions 5-7 — Canary
**SKIPPED** — real-user traffic ~0 (pre-launch), below the 1000-DAU threshold. T-block synthetic probes are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment SUCCESS, commit 9c114d0 (== merge SHA)"
  - "railway web: deployment SUCCESS, commit 9c114d0 (== merge SHA)"
  - "api /health: 200 {status:ok, service:studyhall-api, version:0.0.1}"
  - "web /: 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 9c114d0bf12b7d0469b46519f550624b3db92aea, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-07-05T23:2x"}
  - {platform: railway, service: web, state: SUCCESS, commit: 9c114d0bf12b7d0469b46519f550624b3db92aea, health_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-07-05T23:2x"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU ~0 (pre-launch) < 1000 threshold; T-block synthetic probes are the post-deploy signal."
canary_monitor_id: ""
canary_alerts: []
note: "Backend-only security fix live on both services at merge SHA 9c114d0. No migration (no schema). Deploy triggered explicitly via serviceInstanceDeploy commitSha-pinned (Railway is API-push, not git-triggered)."
```
