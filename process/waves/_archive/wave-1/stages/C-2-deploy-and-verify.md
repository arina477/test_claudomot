# Wave 1 — C-2 Deploy & verify — PASS

Deployed main@486d45b to Railway project `app-arina-89ejyn` (ae55c191, env production), studio-provisioned. Credential: APP_RAILWAY_TOKEN (project token, env-injected — the "needed data" the founder confirmed). The 4 chat UUIDs were project IDs, not tokens. CLI via npx @railway/cli 5.23.1 (global install perms-blocked). Deploy done by head-ci-cd (C-block owner); orchestrator polled to terminal + verified.

## Live
- **web** (107d4255): https://web-production-bce1a8.up.railway.app → HTTP 200, serves StudyHall SPA (`<title>StudyHall</title>`, dark shell).
- **api** (7358a103): https://api-production-b93e.up.railway.app/health → HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.1.0"}` (matches spec AC2 exactly).

Both Railway deployments status=SUCCESS.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway deployment list: api SUCCESS, web SUCCESS (project ae55c191/production)"
  - "https://api-production-b93e.up.railway.app/health -> 200 {status:ok}"
  - "https://web-production-bce1a8.up.railway.app/ -> 200 (StudyHall SPA)"
deploy_targets:
  - {platform: railway, project: app-arina-89ejyn, service: api, url: "https://api-production-b93e.up.railway.app", health: "/health", state: SUCCESS, commit: 486d45b}
  - {platform: railway, project: app-arina-89ejyn, service: web, url: "https://web-production-bce1a8.up.railway.app", state: SUCCESS, commit: 486d45b}
canary_status: skipped
canary_skip_reason: "DAU below threshold (self-use-mvp, 0 < 1000); T-block synthetic probes are the post-deploy signal."
note: "Studio-provisioned project; credential APP_RAILWAY_TOKEN. No DB this wave (deferred). Two services: api (NestJS) + web (Vite SPA static)."
```
