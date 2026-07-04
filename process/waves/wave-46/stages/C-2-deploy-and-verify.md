# C-2 — Deploy & verify (wave-46, M8 direct messages slice 1)

**Head:** head-ci-cd (spawn-pattern; C-block owner)
**Merge commit deployed:** 2a738f7bacfef9333a0d63702a036505bc4788dc
**Platform:** Railway (GraphQL only — no CLI). Project `ae55c191-4631-4224-b7b2-42f329ed48d7`, env `production` (`bfdcc42f-…`).

## Action 0 — Credential
- Deploy token present (`APP_RAILWAY_TOKEN`, exported as `RAILWAY_TOKEN`). Deploy-scoped GraphQL probe (`project(id:)` + services) returned data, no `errors` → credential usable. Never used `me{}`. Header `Project-Access-Token`.
- Services confirmed: web `107d4255`, api `7358a103`, supertokens `73ca977a`, Postgres `8d177be8` (unchanged).

## MIGRATION FIRST — 0021 (3 DM tables) — applied BEFORE cutover

**Authoritative approach:** applied the Drizzle migration against the PRODUCTION app DB via the Postgres public TCP proxy (`DATABASE_PUBLIC_URL`, host `yamanote.proxy.rlwy.net`) BEFORE the api began serving the new revision. api does NOT auto-migrate on boot (B-6 verified).

### Pre-apply forensic finding — CORRUPT LEDGER (deploy-blocking, caught before cutover)
On inspection the production `drizzle.__drizzle_migrations` ledger had a **phantom row id=21** (recorded 2026-07-04 02:18:43 UTC, hash `651116…`) **with none of the 3 dm_ tables present** (`to_regclass` all NULL; 0 dm_ objects in any schema). The then-live api (`4522101f`, wave-44) did not even contain 0021. A naive api deploy + `drizzle-kit migrate` would have seen id=21 in the ledger, SKIPPED 0021, and 500'd every DM route — a false-green migration.

### Remediation (routed per Iron Law → postgres-pro, NOT fixed directly)
Root cause: a ledger INSERT committed without its DDL (connection dropped mid-transaction over the public proxy; drizzle-kit's spinner swallowed the error). Zero partial remnants existed.
Remediation SQL (postgres-pro):
1. `DELETE FROM drizzle.__drizzle_migrations WHERE id=21 AND hash='651116944ba72d36c91776091d984e85fc2880e52563b2a47b8cd4fa952c8fe2';` (DELETE 1)
2. Applied 0021 DDL directly in one transaction (3 tables + 2 UNIQUE + 2 indexes + 5 FKs).
3. `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ('67277e80…', 1783157153353);` (created_at = journal folderMillis for idx=21 → future `migrate` treats 0021 as applied).
4. `pnpm --filter @studyhall/api db:migrate` re-run → "migrations applied successfully" (clean no-op, ledger in sync).

### Independent verification (head-ci-cd, authoritative — did not trust self-report)
- `to_regclass('public.dm_conversations'|'dm_messages'|'dm_participants')` → all present.
- Row counts queryable: `0 | 0 | 0`.
- UNIQUE constraints: `dm_messages_conversation_idempotency_key`, `dm_participants_conversation_user` — both present.
- Indexes: `dm_messages_conversation_created_at_idx`, `dm_participants_user_id_idx` — both present.
- FK count on dm_ tables: **5** (as designed).
- Ledger tail: 19, 20, **22** (single correct 0021 row, hash `67277e80…`); phantom id=21 gone; no duplicate.

## Env-var scoping (verified before cutover)
- **api** scope: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_API_KEY`, `SUPERTOKENS_CONNECTION_URI` present ✓
- **web** scope: NO DB / SuperTokens creds ✓ (no missing-env cutover; no scoped-secret leak to web)
- No NEW env vars introduced by the DM feature (reuses existing DB + SuperTokens + Socket.IO gateway).

## Rollback targets identified + reachable BEFORE cutover
- **api:** deployment `2f94fdeb-3b87-44f6-8bcc-8b07f5daaf3c` (commit `4522101f`) — reachable via Railway redeploy-by-id.
- **web:** deployment `47453bab-2420-4db0-98b7-f1378c9806c7` (commit `ae22380c`).

## Deploy BOTH services (pinned to merge SHA)
`serviceInstanceDeploy(serviceId, environmentId, commitSha=2a738f7b…, latestCommit:true)` for api AND web → both returned `true`.

### Authoritative deployment-state poll (NOT /healthz) — inline, 20s interval, 10-min cap
| t | api | web |
|---|---|---|
| 0s | BUILDING | BUILDING |
| 41s | DEPLOYING | DEPLOYING |
| 61s | **SUCCESS** | **SUCCESS** |

Both terminal `SUCCESS` with `meta.commitHash == 2a738f7bacfef9333a0d63702a036505bc4788dc` (merge SHA) — no SKIPPED, no stale-revision race. New deployment IDs: api `89139ef5-…`, web `4bd89414-…` (latest = serving).

## Health probes (secondary confirmation)
- api `https://api-production-b93e.up.railway.app/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (0.13s)
- web `https://web-production-bce1a8.up.railway.app/` → **200** (888 bytes, 0.12s)
- **Freshness / DM-shipped check:** `GET /dm/conversations` → **401** (auth-required, router mounted) — NOT 404 (route missing) and NOT 500 (tables missing). Confirms the new revision serves the DM feature against the now-existing tables.

## Canary — SKIPPED
Pre-launch, DAU < 1000 < `canary_threshold_dau: 1000`. Synthetic T-block probes are the post-deploy signal.

## Stage-exit checklist (C-2)
- [x] Deploy verification reads authoritative Railway deployment-state (SUCCESS + commitHash), NOT self-reported /healthz.
- [x] New revision confirmed serving before done (latest deployment id + commitHash == merge SHA; no stale-revision race).
- [x] Pending migration (0021) applied explicitly + in order, BEFORE the new code served (ledger corruption caught + remediated first).
- [x] Every required env var exists in the correct service scope (api has DB/SuperTokens; web has none).
- [x] Rollback path to previous good revision identified + reachable before cutover (both services).
- [x] Secrets via platform env vars / GraphQL only; DB URL never committed or echoed; no CSPRNG secret needed this wave.
- [x] Canary skip recorded with traffic-threshold reasoning.
- [x] No preemptive pause; deploy verified via inline poll (61s), not deferred as "will land later."

---
```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 89139ef5 status SUCCESS, commit 2a738f7bacfef9333a0d63702a036505bc4788dc"
  - "railway web: deployment 4bd89414 status SUCCESS, commit 2a738f7bacfef9333a0d63702a036505bc4788dc"
  - "api /health: 200 OK; web /: 200 OK; /dm/conversations: 401 (router mounted, tables present)"
  - "migration 0021 applied: 3 dm_ tables + 2 UNIQUE + 2 indexes + 5 FKs verified; ledger row id=22 correct, phantom id=21 removed"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 2a738f7bacfef9333a0d63702a036505bc4788dc, deployment_id: 89139ef5-b574-42e9-a83e-e55851ee1390, verified_at: "2026-07-04T09:27:00Z", health_url: "https://api-production-b93e.up.railway.app/health", rollback_deployment_id: 2f94fdeb-3b87-44f6-8bcc-8b07f5daaf3c}
  - {platform: railway, service: web, state: SUCCESS, commit: 2a738f7bacfef9333a0d63702a036505bc4788dc, deployment_id: 4bd89414-949b-46d5-96ab-d3ebbedcf0ce, verified_at: "2026-07-04T09:27:00Z", health_url: "https://web-production-bce1a8.up.railway.app/", rollback_deployment_id: 47453bab-2420-4db0-98b7-f1378c9806c7}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-launch < 1000); T-block synthetic probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
migration_0021:
  applied: true
  tables: [dm_conversations, dm_participants, dm_messages]
  ledger_row: 22
  remediation: "removed phantom id=21 ledger row (DDL-less), applied DDL, re-recorded — routed to postgres-pro per Iron Law"
note: "Migration-first caught a corrupt ledger (phantom 0021 row w/ no tables) that would have false-greened the deploy; remediated before cutover. Both services SUCCESS @ merge SHA in 61s; DM router live + tables present. Canary skipped (pre-launch)."
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers:
    postgres-pro: "remediated corrupt migration ledger (phantom 0021 row); DDL applied + verified"
  failed_checks: []
  rationale: >
    Migration-first discipline caught a production migration-ledger corruption (a phantom 0021
    journal row with none of its tables) that would have caused drizzle-kit migrate to SKIP 0021
    and 500 every DM route — a false-green migration. Routed to postgres-pro per Iron Law; the
    ledger was corrected and the 3 dm_ tables + 2 UNIQUE + 2 indexes + 5 FKs were applied and
    independently verified BEFORE cutover. Both api and web deployed pinned to merge SHA 2a738f7b
    and reached authoritative Railway deployment-state SUCCESS with commitHash == merge SHA in 61s
    (no stale-revision race, no SKIPPED). Env scoping verified (api has DB/SuperTokens, web has
    none). Rollback targets for both services identified and reachable before cutover. Health 200
    on both; /dm/conversations returns 401 (router mounted, tables present) not 404/500, proving
    the feature shipped fresh against the live schema. Canary skipped (pre-launch, DAU < 1000).
  next_action: PROCEED_TO_T-block
```
