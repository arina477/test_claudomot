# Wave 77 — C-2 Deploy & verify
Railway GraphQL (no CLI). **Migration 0030 applied to prod FIRST** (db:migrate against DATABASE_PUBLIC_URL yamanote.proxy.rlwy.net:40008 — 6 academic columns added to users, nullable, verified) BEFORE the api deploy (api start is bare node, no auto-migrate). Then deployed merge commit **633f362e** to api + web; polled SUCCESS (~1.5 min).
- **Migration:** 0030 applied + verified (pronouns/bio/institution/program/academic_role/academic_year on users, all nullable). Before: 0 cols; after: 6.
- **api** (7358a103): SUCCESS, commit 633f362e; /health 200. **New GET /profile/:userId LIVE (unauth → 401, route+guard active, not 404).**
- **web** (107d4255): SUCCESS, commit 633f362e; / 200.
- **Canary:** SKIPPED — DAU < 1000.
```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "migration 0030 applied to prod (6 academic columns verified on users) BEFORE api deploy"
  - "railway api: SUCCESS commit 633f362e; /health 200; GET /profile/:userId unauth 401 (live)"
  - "railway web: SUCCESS commit 633f362e; / 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 633f362e, verified_at: "2026-07-07T21:48:56Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: 633f362e, verified_at: "2026-07-07T21:48:56Z"}
canary_status: skipped
canary_skip_reason: "DAU below threshold (<1000)"
note: "M13 leg-2 portable academic identity LIVE on 633f362e. Migration 0030 sequenced before api deploy. T-block can exercise the editor + cross-server card + visibility matrix live."
```
## Block-exit handoff
```yaml
cicd_block_status: complete
pr_number: 96
merge_commit: 633f362e0fe8c916d9e9a52e7d225008af81b8a9
migration_applied: [0030_academic_columns]
deploy_targets: [{platform: railway, service: api, state: SUCCESS}, {platform: railway, service: web, state: SUCCESS}]
canary_status: skipped
ready_for_test: true
```
