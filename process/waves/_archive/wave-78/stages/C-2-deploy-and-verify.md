# C-2 — Deploy & verify (wave-78)

**Merge commit deployed:** `855e81171fe0f5bfdbd87f9f256cc0db8f708496`
**Platform:** Railway (GraphQL v2 only — `Project-Access-Token` header; never CLI, never Bearer/`me{}`)
**Mode:** automatic
**Migration:** NONE this wave (users.academic_role already nullable text) — no db:migrate run; merge commit deployed directly.

## Action 0 — Credential
- `APP_RAILWAY_TOKEN` present in env. Deploy-scoped probe (`project(id).services`) returned `project != null`, `errors: null` → credential usable. Project `app-arina-89ejyn` (ae55c191). Services enumerated: web, api, supertokens, Postgres.

## Deploy (serviceInstanceDeploy with commitSha)
- Baseline before deploy: both api + web on commit 633f362 (prior wave), status SUCCESS.
- `serviceInstanceDeploy(environmentId=bfdcc42f…, serviceId=<svc>, commitSha=855e811…)` → `true`, no errors, for BOTH services.
- Inline-poll (≤10-min path): both reached SUCCESS at merge SHA in ~101s.
  - `[61s] api=SUCCESS(855e811) web=BUILDING` → `[101s] both SUCCESS(855e811)`.

## Per-target deploy verification
| Service | Deployment ID | Status | Deployed commit | Matches merge SHA |
|---|---|---|---|---|
| api (7358a103) | 911784fb-8277-4961-a3f9-a427151a58ca | SUCCESS | 855e811 | ✅ |
| web (107d4255) | a66b49ab-9046-4ecb-89d3-8bc8f719d243 | SUCCESS | 855e811 | ✅ |

## Health / endpoint probes
| Probe | Result |
|---|---|
| api `https://api-production-b93e.up.railway.app/health` | **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (0.11s) |
| web `https://web-production-bce1a8.up.railway.app/` | **200** (0.12s) |
| api `GET /profile/:userId` unauth | **401** `{"message":"unauthorised"}` — authz not regressed (0.10s) |

## Canary
- **SKIPPED** — DAU below threshold (< 1000; `canary_threshold_dau: 1000`). T-block synthetic probes are the post-deploy signal.

## Async / HOLD
- Neither deploy exceeded the 10-min inline-poll cap (both done ~101s). No MONITOR task spawned. No HOLD.

## Iron-Law routing
- None. No FAILED/CRASHED deploy, no failed probe.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api (7358a103): deployment 911784fb SUCCESS, commit 855e811"
  - "railway web (107d4255): deployment a66b49ab SUCCESS, commit 855e811"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
  - "GET /profile/:userId unauth: 401 (authz intact)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 855e81171fe0f5bfdbd87f9f256cc0db8f708496, verified_at: "2026-07-07T23:21:32Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: 855e81171fe0f5bfdbd87f9f256cc0db8f708496, verified_at: "2026-07-07T23:21:32Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (<1000); T-block synthetic probes are the post-deploy signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "No migration this wave; merge commit 855e811 deployed directly to both services. Both SUCCESS at merge SHA in ~101s."
```
