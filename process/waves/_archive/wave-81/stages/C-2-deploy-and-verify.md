# Wave 81 — C-2 Deploy & verify
**NO migration** (frontend-only scroll fix). Deployed merge commit e659b0a to both services via Railway GraphQL.
- api (7358a103): SUCCESS @ e659b0a; /health 200.
- web (107d4255): SUCCESS @ e659b0a; / 200; **/settings/profile 200 (founder's page served)**.
- Both meta.commitHash == merge SHA. Canary SKIPPED (DAU<1000).
- LIVE scroll-to-bottom verification of /settings/profile is the T-block's job (T-5/T-6 MUST execute it).
```yaml
ci_stage_verdict: PASS
verdict_source: railway
verdict_evidence:
  - "railway api SUCCESS commit e659b0a /health 200"
  - "railway web SUCCESS commit e659b0a / 200 + /settings/profile 200"
migration: none
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: e659b0a, verified_at: "2026-07-09T09:38:00Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: e659b0a, verified_at: "2026-07-09T09:38:00Z"}
canary_status: skipped
```
## Block-exit handoff
```yaml
cicd_block_status: complete
pr_number: 100
merge_commit: e659b0acbad56e4e1cffaa29a9b200c2209bb267
migration_applied: none
deploy_targets: [{platform: railway, service: api, state: SUCCESS}, {platform: railway, service: web, state: SUCCESS}]
canary_status: skipped
ready_for_test: true
```
