# Wave 30 — C-2 Deploy & verify

**Merge commit:** 81dc821 (main). **api-only wave** (no web/shared change). Migration-bearing.

## Step 1 — migration 0013 applied to prod (BEFORE cutover) ✓
`assignment_reminder` migration (0013_smooth_tattoo.sql) applied to the prod Railway Postgres. **Verified via the public proxy** (yamanote.proxy.rlwy.net): `SELECT to_regclass('public.assignment_reminder')` → `assignment_reminder` (table present); `drizzle.__drizzle_migrations` journal records 0013 (hash 9d229cc9…). UNIQUE(assignment_id,user_id) + FK present. Migration applied before the api revision cut over → the @Cron scan has its table on the first tick.

## Step 2 — api deploy ✓
api service deployed via `railway up` (Railway CLI-push; the merge did NOT deploy). Deployment transitioned Deploying → **Online** (new revision serving). web NOT touched (still prior revision, root 200).

## Step 3 — verify ✓
- **Health:** `curl https://api-production-b93e.up.railway.app/health` → 200 `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`. The api booted cleanly on the new revision — NotificationsModule + ScheduleModule.forRoot() registered without a boot crash (a misconfigured cron/module would fail boot).
- **RESEND_API_KEY_AUTH:** present on the api service (count=1) — the reminder emails can send.
- **Reminder cron:** internal @Cron (hourly) — no HTTP route to probe; correctness proven in the CI integration tier (5 real-PG cases executed nonzero at C-1). With the table present + key set + new revision serving, the cron fires hourly against assignments due within 24h.
- **web:** untouched (root 200, prior revision) — correct (api-only wave).

## Canary
`skipped` — 0 real-user DAU < 1000 threshold (pre-launch); no synthetic canary.

```yaml
ci_stage_verdict: PASS
verdict_source: railway
migration_applied: "0013_smooth_tattoo.sql → assignment_reminder confirmed in prod via public proxy (to_regclass + drizzle journal)"
deploy_targets:
  - {platform: railway, service: api, state: online, commit: 81dc821, health: "200", health_url: "https://api-production-b93e.up.railway.app/health"}
web_touched: false
canary_status: skipped
canary_skip_reason: "0 DAU < 1000 threshold (pre-launch)"
note: "M5 reminders LIVE: migration applied before cutover, api serving new revision, RESEND_API_KEY_AUTH set, cron fires hourly. (head-ci-cd agent completed the migration + started deploy; orchestrator verified prod state + wrote this deliverable.)"
```

## Exit
Migration applied to prod + api deployed LIVE + verified. The M5 assignment-reminders feature is live in production. → T-block.
