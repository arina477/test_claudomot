# Wave 27 — C-2 Deploy & verify

**Platform:** Railway (CLI image push — `railway up`). **Merge commit:** 87b6ef7. Both services changed (api: Spec A index+migration; web: Spec B subscription lift).

## Migration 0012 (Spec A additive index) — applied to prod
`drizzle-kit migrate` (pnpm db:migrate) against the prod app-DB PUBLIC proxy (Postgres service DATABASE_PUBLIC_URL — NOT $CLAUDOMAT_DB_URL control-plane) → `CREATE INDEX server_members_user_id_idx ON server_members USING btree (user_id)` applied; **index CONFIRMED present** on `public.server_members` via psql. Applied BEFORE the api revision served (schema ahead of code). Additive/non-breaking — no down-migration needed on any rollback.

## Deploy verification
| Service | New deployment | Status | Baseline (superseded) | Health |
|---|---|---|---|---|
| api | 855f1ea1 (createdAt 15:03:30Z) | SUCCESS | 539c476d | /health 200 {status:ok, studyhall-api} |
| web | 328b1ae9 (createdAt 15:03:41Z) | SUCCESS | 4a703d92 | / 200, fresh bundle index-Dr2UkTXH.js (asset resolves 200 — no stale-revision 404 mismatch) |

Both NEW distinct deployment ids with fresh createdAt (CI rule 1: deployment-state SUCCESS on the new revision, not /health alone; rule 2: served-revision assets resolve). wave-27 code (index + subscription lift) is LIVE.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "migration 0012 applied to prod; server_members_user_id_idx confirmed present (psql prod public proxy)"
  - "api 855f1ea1 SUCCESS (fresh) /health 200; web 328b1ae9 SUCCESS (fresh) / 200 index-Dr2UkTXH.js"
  - "both distinct-new deployments of 87b6ef7; rule 1+2 satisfied"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: 855f1ea1, verified_at: "2026-07-01T15:08Z", freshly_deployed: true, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 328b1ae9, verified_at: "2026-07-01T15:08Z", freshly_deployed: true, health_url: "https://web-production-bce1a8.up.railway.app/"}
migration_applied: {file: 0012_flashy_spacker_dave.sql, prod_index_confirmed: true, class: additive-non-breaking}
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000)."
rollback_targets: {api: 539c476d, web: 4a703d92}
note: "Presence-perf pair live: server_members(user_id) index applied to prod + client single-subscription lift. Both services SUCCESS."
```

## Exit
Migration 0012 applied to prod (index confirmed), both services live on wave-27 code (SUCCESS + fresh), canary skipped. → T block.
