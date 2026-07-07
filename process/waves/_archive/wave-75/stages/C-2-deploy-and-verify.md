# Wave 75 — C-2 Deploy & verify

Railway GraphQL deploy (no CLI). Credential present (Action 0 probe OK). No migration this wave (reuse subscriptions) → no manual DB-migrate step. Deployed merge commit **3b94e276** to api + web via `serviceInstanceDeploy(environmentId, serviceId, commitSha)`; polled `deployments` to SUCCESS (~1.3 min, inline poll).

- **api** (7358a103): status SUCCESS, commit 3b94e276; `/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- **web** (107d4255): status SUCCESS, commit 3b94e276; `/` → 200.
- **Canary:** SKIPPED — DAU below canary_threshold_dau (1000). T-block synthetic/live probes are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: SUCCESS, commit 3b94e276cca9c1cb239beb738778ed09f0d6aded"
  - "railway web: SUCCESS, commit 3b94e276cca9c1cb239beb738778ed09f0d6aded"
  - "https://api-production-b93e.up.railway.app/health: 200 {status:ok}"
  - "https://web-production-bce1a8.up.railway.app/: 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 3b94e276, verified_at: "2026-07-07T17:32:12Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: 3b94e276, verified_at: "2026-07-07T17:32:12Z", health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (<1000); T-block live probes are the post-deploy signal."
canary_monitor_id: ""
canary_alerts: []
note: "M9 mock-payment freemium upgrade path LIVE on 3b94e276. Prod now serves the new billing endpoints + Your-plan panel; T-5 e2e can exercise them live."
```

## Block-exit handoff
```yaml
cicd_block_status: complete
pr_number: 93
pr_url: https://github.com/arina477/test_claudomot/pull/93
merge_commit: 3b94e276cca9c1cb239beb738778ed09f0d6aded
deploy_targets: [{platform: railway, service: api, state: SUCCESS, commit: 3b94e276}, {platform: railway, service: web, state: SUCCESS, commit: 3b94e276}]
canary_status: skipped
ready_for_test: true
```
