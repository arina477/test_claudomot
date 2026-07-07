# T-4 — Integration (wave-69) [Pattern A — CI-verified]
The CI `test` job runs `test:ci` = unit + `vitest --config vitest.integration.config.ts` with a postgres:16 service + DATABASE_URL_TEST — so `apps/api/test/integration/reports.integration.spec.ts` RAN GREEN against a REAL Postgres (NOT mocked). Cases exercised: (1) no-IDOR session reporter_id, (2) moderate_members gate non-mod→403 on GET+resolve, (3) rank-guard route-through (timeout on owner rejected), (4) cross-server tamper target_server_id!==serverId→404, (5) target-existence validation→400/404, (6) dismiss→dismissed+resolved_by, (7) delete_message resolves channel_id from message row, (8) timeout happy-path muted ~24h (duration pinned), (9)+(10) already-resolved→409 + DB cross-check, (11) invalid status→400. Schema migration 0025 (reports table + FKs + index) applied to the CI test DB by the integration harness.
This is the authoritative integration gate; T-8 additionally re-proves the 4 authz paths LIVE on prod.
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["reports.integration.spec.ts ran green vs postgres:16 in CI run 28832468543 (test:ci integration tier)", "4 authz paths + resolve-race + duration + status-validation asserted against real PG"]
findings: []
```
