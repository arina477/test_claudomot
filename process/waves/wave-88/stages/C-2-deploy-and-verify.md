# C-2 — Deploy & Verify (wave-88)

**Stage:** C-2 (deploy + authoritative verification)
**Agent:** head-ci-cd
**Service deployed:** api (`7358a103-0a4f-44e6-9468-3d02d045531e`) — only the API changed this wave.
**Target commit:** `d06460582438a6145f906f1031461ea1accbb7e1` (PR #109, on main).

## What happened

- CI-13-safe deploy: triggered via `serviceInstanceDeployV2(serviceId, environmentId, commitSha: "d0646058…")` — commit-targeted, NOT a bare `serviceInstanceDeploy` (which would redeploy the pinned prior commit).
- New deployment `b1d3d24c-4718-4b54-a5ae-ce4807f4b019` polled through BUILDING → DEPLOYING → SUCCESS (~3.5 min) via the authoritative Railway `deployments` GraphQL state endpoint (not a self-reported /healthz).
- Confirmed the SUCCESS deployment's `meta.commitHash == d06460582438a6145f906f1031461ea1accbb7e1` (CI-13 verification passed — not the stale commit).
- Prior live deployment `d907a6e0` (old wave-87 commit `1d2ef9df`) was superseded to `REMOVED`; the new deployment is the one serving traffic (freshest id + recent createdAt, no stale-revision race).
- Health: `GET https://api-production-b93e.up.railway.app/health` → HTTP 200, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- Canary: SKIPPED — 0 external users << 1000 DAU threshold.
- Rollback path: previous good revision `1d2ef9df` (deployment lineage) redeployable via `serviceInstanceDeployV2(commitSha: "1d2ef9df…")` if needed.

## Evidence

```
deploy_trigger_mutation: serviceInstanceDeployV2 (commit-targeted)
returned_deployment_id: b1d3d24c-4718-4b54-a5ae-ce4807f4b019
poll_sequence: BUILDING → BUILDING → DEPLOYING → SUCCESS
health_endpoint: https://api-production-b93e.up.railway.app/health
health_http_code: 200
health_body: {"status":"ok","service":"studyhall-api","version":"0.0.1"}
prior_deployment: d907a6e0-fc6d-46bc-9768-afbb8bdb6882 (commit 1d2ef9df, now REMOVED)
```

---
```yaml
ci_stage: C-2
ci_stage_verdict: PASS
verdict_source: railway
service: api
service_id: 7358a103-0a4f-44e6-9468-3d02d045531e
environment_id: bfdcc42f-fe5b-4198-a47a-b08f5940975d
target_commit: d06460582438a6145f906f1031461ea1accbb7e1
deployment:
  id: b1d3d24c-4718-4b54-a5ae-ce4807f4b019
  status: SUCCESS
  commit_hash: d06460582438a6145f906f1031461ea1accbb7e1
  commit_hash_confirmed_matches_target: true
  created_at: "2026-07-09T21:41:53.215Z"
  is_fresh: true
  superseded_prior: d907a6e0-fc6d-46bc-9768-afbb8bdb6882
health:
  url: https://api-production-b93e.up.railway.app/health
  http_code: 200
  body: '{"status":"ok","service":"studyhall-api","version":"0.0.1"}'
canary_status: skipped
canary_skip_reason: "0 external users << 1000 DAU threshold"
rollback_target_commit: 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e
rollback_reachable: true
head_signoff:
  verdict: APPROVED
  stage: C-2
  rationale: >
    Deploy verified live via the authoritative Railway deployment-state endpoint at SUCCESS on
    the correct target commit d0646058 (CI-13 confirmed — not the pinned prior commit), /health
    returns 200 with a healthy body, the new deployment (b1d3d24c) is the freshest revision and
    the old 1d2ef9df deployment was superseded to REMOVED (no stale-revision race). Canary
    legitimately skipped at 0 external users. Rollback to 1d2ef9df is reachable.
  next_action: PROCEED_TO_C-3
```
