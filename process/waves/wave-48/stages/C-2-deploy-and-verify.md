# C-2 — Deploy & verify (wave-48)

**Wave:** 48 — DM candidate privacy negative-case integration test (TEST-ONLY).
**Merge commit:** `c79343b7ada67ff9e03566e35c4f0617456373a6`.
**Deploy platform:** Railway (GraphQL-only), project `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`).
**head-ci-cd verdict:** PASS.

## Deploy disposition — no-op (test-only wave; confirm-healthy over redeploy)

This wave's merge diff is exactly two test files (`apps/api/test/integration/dm-candidates.spec.ts`, `apps/api/test/integration/pg-harness.ts`). Neither ships in the production runtime bundle — the deployed API/web artifacts are byte-identical to the pre-wave production build. A forced redeploy would produce the same bundle and therefore be a genuine no-op. Per C-2 (prefer confirm-healthy over redeploy when a test-only diff produces an identical production bundle), I verified the CURRENT production deploy is still healthy and serving, rather than firing an empty redeploy.

Railway deploy is CLI-push (`railway up`), not git-trigger — merge to main does NOT auto-deploy. So no deploy fires implicitly on merge; confirming the existing healthy revision is the correct and complete C-2 action here.

## Credential

Project-scoped `RAILWAY_TOKEN` present + usable. `{ projectToken { projectId environmentId } }` → projectId `ae55c191-4631-4224-b7b2-42f329ed48d7` (matches `project.yaml`), environmentId `bfdcc42f-fe5b-4198-a47a-b08f5940975d`. Authenticated via `Project-Access-Token` header (never Bearer, never `me{}`). No founder pause needed.

## Authoritative deployment-state verification (NOT /healthz alone)

Latest deployment per service, read from the Railway `deployments` GraphQL endpoint:

| Service | Service ID | Latest deployment status | staticUrl | createdAt |
|---|---|---|---|---|
| api | 7358a103-0a4f-44e6-9468-3d02d045531e | **SUCCESS** | api-production-b93e.up.railway.app | 2026-07-04T14:01:13Z |
| web | 107d4255-422a-4b72-b138-0647f9192fe4 | **SUCCESS** | web-production-bce1a8.up.railway.app | 2026-07-04T14:01:14Z |

Both `SUCCESS` (not SKIPPED/FAILED/CRASHED/REMOVED). Deployment timestamps are pre-wave — correct, since no new production code shipped this wave.

## Health endpoint probes (serving-revision confirmation)

| Target | Endpoint | Result |
|---|---|---|
| api | https://api-production-b93e.up.railway.app/health | 200 · `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web | https://web-production-bce1a8.up.railway.app/ | 200 |

The authoritative deployment-state (`SUCCESS`) AND the live health probe (200) agree — the current revision is deployed AND serving traffic. No stale-revision race.

## Canary

**SKIPPED** — pre-launch, real-user traffic = 0 DAU < 1000 `canary_threshold_dau`. Synthetic probes (above health checks) are the post-deploy signal.

## Rollback path

No cutover occurred (no new revision), so no rollback is armed for this wave. The previous good revision (api `9502de2a...`, web `bd9dcd2f...`, both SUCCESS) IS the current live revision — reachable via Railway `serviceInstanceRedeploy` if ever needed. Nothing to roll back from a no-op.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api service 7358a103: latest deployment status=SUCCESS (deployment 9502de2a), staticUrl api-production-b93e.up.railway.app"
  - "railway web service 107d4255: latest deployment status=SUCCESS (deployment bd9dcd2f), staticUrl web-production-bce1a8.up.railway.app"
  - "https://api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\"}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: pre-wave (test-only; no production change), verified_at: "2026-07-04", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: pre-wave (test-only; no production change), verified_at: "2026-07-04", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "Pre-launch; DAU 0 < 1000 canary_threshold_dau. No real-user traffic to canary."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "no-op (test-only wave; no production change; current deploy healthy). Confirmed api+web latest deployment=SUCCESS and health 200 on the pre-wave live revision; no redeploy fired (identical bundle)."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Test-only wave — the merge diff is two test files that never enter the production runtime
    bundle, so the deployed artifacts are identical to the pre-wave build and a redeploy would be
    a no-op. Rather than fire an empty redeploy, I confirmed the current production deploy is
    healthy via the authoritative Railway deployment-state endpoint: api and web both report latest
    deployment status=SUCCESS, and both health probes return 200 (api /health status ok, web / 200).
    The deployment-state and the live health signal agree, so the current revision is both deployed
    and serving — no stale-revision race. Canary skipped (pre-launch, 0 DAU). No cutover means no
    rollback to arm; the live SUCCESS revision is itself the last-good revision.
  next_action: PROCEED_TO_T-block
```
