# C-2 — Deploy & verify (wave-87)

Deployed PR #107 merge commit `1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e` to the Railway
**api** service (only the API changed this wave). Deploy was explicitly commit-pinned via the
CI-13-safe `serviceInstanceDeployV2(commitSha:)` mutation — a bare redeploy would have
re-shipped the prior pinned commit (`a9556248`), so the mutation targeted the exact merge SHA
and the resulting deployment's `meta.commitHash` was confirmed to equal `1d2ef9df...` (not the
stale `a9556248`).

## Verification

- **Deploy trigger:** `serviceInstanceDeployV2(environmentId=bfdcc42f..., serviceId=7358a103..., commitSha=1d2ef9df...)` → returned new deployment id `d907a6e0-fc6d-46bc-9768-afbb8bdb6882`.
- **Poll (inline, GraphQL deployment-state — authoritative, not /health):** BUILDING → DEPLOYING → **SUCCESS** in ~91s.
- **CI-13 commit check:** newest deployment (`deployments(first:1).edges[0].node`) is `d907a6e0`, `status: SUCCESS`, `meta.commitHash = 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e` ✓ (NOT `a9556248`). Fresh: `createdAt 2026-07-09T20:09:56Z`, replacing prior head `0f38d1fe` (a9556248).
- **Health probe:** `curl -fsS https://api-production-b93e.up.railway.app/health` → HTTP 200, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. Body carries a static app version (0.0.1), not a commit field — no SHA cross-check available in-body; the authoritative deployment-state endpoint already confirms the correct fresh commit is serving.
- **Serving-revision confirmation:** the SUCCESS deployment on `1d2ef9df` is `edges[0]` (newest) for the service and shares the live `staticUrl api-production-b93e.up.railway.app` — the new revision is the one serving traffic, no stale-revision race.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway/api: state SUCCESS, deployment d907a6e0-fc6d-46bc-9768-afbb8bdb6882, commit 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e (CI-13 commit-pin confirmed; not a9556248)"
  - "https://api-production-b93e.up.railway.app/health: 200 OK, body {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "fresh deployment createdAt 2026-07-09T20:09:56Z; replaced prior head 0f38d1fe (a9556248); newest edges[0] for service = the serving revision"
deploy_targets:
  - platform: railway
    service: api
    service_id: 7358a103-0a4f-44e6-9468-3d02d045531e
    state: SUCCESS
    commit: 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e
    deployment_id: d907a6e0-fc6d-46bc-9768-afbb8bdb6882
    verified_at: 2026-07-09T20:12:06Z
    health_url: https://api-production-b93e.up.railway.app/health
    health_status: 200
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold; T-block synthetic probes are the post-deploy signal."
canary_window:
  start: ""
  duration_minutes: 0
canary_monitor_id: ""
canary_alerts: []
note: "Only the api service changed this wave; web not redeployed. Commit-pinned deploy via serviceInstanceDeployV2(commitSha:) per CI-13 lesson; new deployment meta.commitHash == merge commit 1d2ef9df (not the stale a9556248). Credential: RAILWAY project-scoped token present and usable (deploy-scoped GraphQL probe succeeded). Deliverable NOT committed by C-2 per instruction — committed at block close."
```
