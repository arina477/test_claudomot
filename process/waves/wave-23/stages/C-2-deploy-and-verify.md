# C-2 — Deploy & verify (wave-23 M5 bundle 2 — delegated assignment-organizer authz)

**Head:** head-ci-cd · **Platform:** Railway (project `app-arina-89ejyn` / `ae55c191`, env `production` / `bfdcc42f`) · **Mode:** automatic.

Follows the wave-22 C-2 working pattern precisely (drizzle-kit migrate against the prod public proxy → `@railway/cli up` per service → authoritative deployment-state + distinct-revision + new-route serving proof).

## Merged code under deploy
- main @ `489c86aab4fe73a22d1d67de5a91ff901f86a2c5` (PR #35, squash). Local main synced to this commit.
- Adds migration `0011_rainy_wild_child.sql` (`roles.manage_assignments` boolean NOT NULL default false + backfill `SET manage_assignments=true WHERE manage_channels=true`) and api code (`getEffectivePermissions`, `GET /servers/:id/me/permissions`, `assertOrganizer → manage_assignments`) that READS `roles.manage_assignments`.
- **Ordering constraint:** migration MUST land before api cutover (the new api boots reading the new column). Honored — migration applied and verified before any deploy.

## Action 0 — Railway credential
- `RAILWAY_TOKEN` (from `APP_RAILWAY_TOKEN`) present and usable. Deploy-scoped probe (`projectToken`) returned `projectId=ae55c191-…`, `environmentId=bfdcc42f-…` without `errors` — token reached the project's deploy API and matches project.yaml. No founder pause.

## Service IDs (from wave-22, re-confirmed)
| Service | ID |
|---|---|
| web | `107d4255-422a-4b72-b138-0647f9192fe4` |
| api | `7358a103-0a4f-44e6-9468-3d02d045531e` |
| supertokens | `73ca977a-912b-4cba-af46-39cd4cf3d328` |
| Postgres | `8d177be8-d8d9-4db6-901f-e7ab5ddd3404` |

## Baselines captured BEFORE deploy (distinct-revision guard)
- **API baseline:** `7ffaeaea-1c37-4f3b-a941-c5f1e32a8522` (SUCCESS, 2026-06-30T23:11:20Z — wave-22 revision).
- **WEB baseline:** `66f4c715-29f3-4584-9f70-ae561e53e3d9` (SUCCESS, 2026-06-30T23:12:38Z — wave-22 revision).

## Migration 0011 — applied EXPLICITLY before api cutover
- **Pre-flight (authoritative pending-check):** `roles.manage_assignments` column ABSENT; `drizzle.__drizzle_migrations` last `created_at` = `1782857917836`, which equals the journal `when` for **0010** (`0010_typical_harry_osborn`) — proving prod was applied through 0010 and **0011 was pending**. (Drizzle row-count read 11 pre-migration; that count includes a baseline row, so the count is +1 vs journal idx. The authoritative pending signal is the absent column + last-ledger-timestamp = 0010, not the raw count.)
- **Applied via** `drizzle-kit migrate` (`env -u DATABASE_URL_UNPOOLED DATABASE_URL=<prod DATABASE_PUBLIC_URL> pnpm exec drizzle-kit migrate` from `apps/api`, against the prod Postgres public proxy `yamanote.proxy.rlwy.net`) → "migrations applied successfully!", exit 0.
- **Post-migration verification (direct information_schema query):**
  - `manage_assignments` → `data_type=boolean`, `is_nullable=NO`, `column_default=false`. Exactly the spec shape.
  - Ledger advanced: row-count 11→**12**; last `created_at` = `1782864164741` = journal `when` for **0011**. Correct migration applied, in order.
  - Backfill sanity: prod `roles` currently has **0** rows with `manage_channels=true`, so `backfilled=0` and `extra=0` (no rows matched the UPDATE — clean, no orphan grants, no data anomaly).
- Migration ran BEFORE the new api revision began serving (deploy steps below followed migration).

## Deploy — both services (Railway source-upload CLI, api first)
- `npx -y @railway/cli@latest up --service api --environment production --ci` → turbo build across workspaces, image pushed (`sha256:eeed6e93…`), "Deploy complete", exit 0.
- `npx -y @railway/cli@latest up --service web --environment production --ci` → image pushed (`sha256:cd8f4f68…`), "Deploy complete", exit 0.

## Verification — authoritative deployment-state + distinct-revision + serving proof

### Rule 1 — authoritative deployment-state = SUCCESS AND distinct revision
- **API:** baseline `7ffaeaea` → new **`0ebf493d-656d-4dda-a792-ced64fde4ce2`** `status: SUCCESS` (2026-07-01T00:53:43Z). Distinct revision ✓ (baseline now `REMOVED`).
- **WEB:** baseline `66f4c715` → new **`31fca925-0665-4c46-a1f7-cf1cf69cc9d4`** `status: SUCCESS` (2026-07-01T00:54:55Z). Distinct revision ✓ (baseline now `REMOVING`).
- Both new deployments were terminal SUCCESS at first poll — resolved inside the turn, well under the 10-min inline-poll cap. No MONITOR-task spawned.

### Rule 2 — new-only route serving proof (stale-revision-race guard)
- `GET /servers/00000000-0000-0000-0000-000000000000/me/permissions` → **HTTP 401 `{"message":"unauthorised"}`** (NOT 404). The `/me/permissions` route added this wave exists and ran its auth guard → the new api revision `0ebf493d` is serving traffic. **401-not-404 is the decisive proof.**
- **Control:** `GET /servers/<uuid>/this-route-does-not-exist-xyz` → **HTTP 404**. Confirms the 401 is route-specific (the handler exists + ran its guard), not a blanket auth wall — decisively rules out the old revision (which lacked this route) serving.

### /health (necessary, not sufficient)
- **api /health** → HTTP 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.
- **web root** → HTTP 200.

## Env-var scoping (names only; values never read/logged) — scoped-secret guard PASS
- **api** has: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_API_KEY`, `SUPERTOKENS_CONNECTION_URI`, `SESSION_SECRET`, `API_ORIGIN`, `WEB_ORIGIN`, `CROSS_ORIGIN_PROD`, `RESEND_API_KEY_AUTH`. All required api env present; the new code reads `roles.manage_assignments` from the same `DATABASE_URL` DB, where the column now exists.
- **web** has: `VITE_API_ORIGIN` + Railway-injected vars only. **No `DATABASE_URL`, no SuperTokens secrets, no `SESSION_SECRET`.** Web does NOT receive DB creds — scoped-secret-leak guard passes.

## Rollback path — identified + reachable BEFORE cutover
- api previous-good revision: `7ffaeaea-1c37-4f3b-a941-c5f1e32a8522`; web: `66f4c715-29f3-4584-9f70-ae561e53e3d9`.
- One-action rollback: GraphQL `deploymentRedeploy(id:<prev-id>)` via `Project-Access-Token` header. Migration 0011 is additive (new column with a safe default) and the prior api revision does not read it — the previous revision remains fully compatible with the migrated schema, so a code rollback needs no schema down-migration. Not exercised — deploy verified clean.

## Canary — SKIPPED (below traffic threshold)
- `canary_threshold_dau: 1000` (project.yaml). Real-user DAU = 0 < 1000. No `/canary` monitor armed. T-block synthetic probes are the post-deploy signal.

## Secret hygiene
- Railway token sourced from env, never echoed/committed. Prod `DATABASE_PUBLIC_URL` held only in a `umask 077` temp file for cross-call reuse and deleted at stage end. No secret reached the repo or logs.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 0ebf493d status SUCCESS, distinct from baseline 7ffaeaea (now REMOVED)"
  - "railway web: deployment 31fca925 status SUCCESS, distinct from baseline 66f4c715 (now REMOVING)"
  - "api /health: 200 {status:ok}; web root: 200"
  - "new-only route GET /servers/<uuid>/me/permissions: 401 (not 404) — new revision serves; control nonexistent route: 404"
  - "migration 0011 applied via drizzle-kit migrate BEFORE api cutover; ledger 11->12 (last ts 1782864164741 = 0011); roles.manage_assignments = boolean NOT NULL default false verified; backfill 0 rows matched (0 roles with manage_channels=true), no anomaly"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: 0ebf493d-656d-4dda-a792-ced64fde4ce2, baseline_id: 7ffaeaea-1c37-4f3b-a941-c5f1e32a8522, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-07-01T00:56Z"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 31fca925-0665-4c46-a1f7-cf1cf69cc9d4, baseline_id: 66f4c715-29f3-4584-9f70-ae561e53e3d9, health_url: "https://web-production-bce1a8.up.railway.app/", verified_at: "2026-07-01T00:56Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (0 < 1000, canary_threshold_dau=1000 per project.yaml); T-block synthetic probes are the post-deploy signal."
canary_window: {start: "", duration_minutes: 0}
canary_monitor_id: ""
canary_alerts: []
note: "Migration 0011 (additive: roles.manage_assignments boolean NOT NULL default false) applied explicitly before api cutover; both services SUCCESS with distinct new revisions; /me/permissions route proven serving (401 not 404, control 404); rollback targets captured + reachable (prior api revision schema-compatible with the additive migration)."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Migration 0011 applied explicitly and in order (drizzle-kit migrate, never auto-migrate-on-boot) before the new api revision served, with the column shape (boolean NOT NULL default false) and ledger advance (11->12, last ts = 0011) verified by direct query. Both services verified LIVE via the authoritative Railway deployment-state endpoint = SUCCESS on distinct new revisions (api 0ebf493d != baseline 7ffaeaea; web 31fca925 != baseline 66f4c715), not a self-reported /healthz. The stale-revision-race is decisively excluded by the new-only route serving proof: GET /servers/<uuid>/me/permissions returns 401 (auth guard ran) not 404 (route absent), with a control nonexistent route returning 404. Env scoping confirmed (web has no DB creds); a reachable one-action rollback to the prior schema-compatible revision was identified before cutover. Canary correctly skipped (DAU 0 < 1000).
    next_action: PROCEED_TO_T_BLOCK
```
