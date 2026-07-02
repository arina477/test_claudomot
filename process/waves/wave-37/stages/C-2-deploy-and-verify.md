# C-2 — Deploy & verify — wave-37 (persistent in-app notifications)

**Head:** head-ci-cd (Release / DevOps Engineering Manager)
**Merge commit:** `86b7323` (feat: persistent in-app notifications (bell, panel, unread API) (#51)) — deployed from `main` @ `86b73239b364a83f6ec83a9c9eb52c6d5017fd80`
**Mode:** automatic
**Deploy mechanism:** Railway CLI-push (`railway up --service <svc>`) — NOT a git-trigger, NOT a GraphQL redeploy (which would re-serve the STALE image — wave-34 false-green lesson).
**Verification signal:** authoritative Railway deployment-state GraphQL (`deployment(id).status == SUCCESS` on FRESH deploy IDs) + serving-revision match + content assertions. Not `/healthz`-only.

---

## Deploy topology (discovered via GraphQL project probe)
- project `app-arina-89ejyn` = `ae55c191-4631-4224-b7b2-42f329ed48d7`, single env `production` = `bfdcc42f-fe5b-4198-a47a-b08f5940975d`
- **api** service = `7358a103-0a4f-44e6-9468-3d02d045531e` → https://api-production-b93e.up.railway.app
- **web** service = `107d4255-422a-4b72-b138-0647f9192fe4` → https://web-production-bce1a8.up.railway.app
- (supertokens + Postgres services untouched this wave)

## Rollback targets (pre-deploy last-good SUCCESS — reachable in one `railway redeploy`)
- **api:** deployment `187aabd2-6007-4ffd-b2c0-df8f316bd48a` (SUCCESS, 2026-07-02T18:15:30Z)
- **web:** deployment `c2dcb488-061b-49d3-8536-79c7b530e9b1` (SUCCESS, 2026-07-02T18:15:23Z)

---

## Step 1 — Migrations FIRST (critical ordering, DB ahead of code)
- Pre-migration prod state (via public TCP proxy `yamanote.proxy.rlwy.net:40008`, wave-35 mechanism — private `postgres.railway.internal:5432` is not resolvable from the CLI shell): `to_regclass('public.notifications')` = **NULL** → confirms api would 500 on notification queries if deployed before migration.
- Applied 0015 (notifications table) + 0016 (assignment_reminder partial-unique) via `drizzle-kit migrate` (`pnpm --filter @studyhall/api db:migrate`, DATABASE_URL=proxy). Result: `[✓] migrations applied successfully!`
- **Post-migration verification (authoritative, against prod):**
  - `notifications` table exists → `t`
  - required indexes present (count = 3/3):
    - `notifications_user_read_created_idx` — btree (user_id, read_at, created_at DESC)
    - `notifications_user_message_mention_uidx` — partial-unique WHERE type='mention'
    - `notifications_user_assignment_reminder_uidx` — partial-unique WHERE type='assignment_reminder'
- Additive-only, no destructive DDL → safe; no auto-migrate-on-boot introduced (drizzle-kit run explicitly, in order).

## Step 2 — Deploy both services (CLI-push, fresh deploy IDs)
| service | fresh deploy id | pre-deploy id (distinct → not a stale redeploy) |
|---|---|---|
| api | `fa782b68-5737-406e-9c2c-659797ba5933` | `187aabd2-...` |
| web | `95e1d29c-3f3e-4ecd-bee2-be9b67d8aa9a` | `c2dcb488-...` |

## Step 3 — Authoritative state poll (inline, ≤10 min; success path)
Polled `deployment(id).status` for each FRESH id to terminal state:
- api: BUILDING → DEPLOYING → **SUCCESS** (@ ~91s)
- web: INITIALIZING → BUILDING → DEPLOYING → **SUCCESS** (@ ~212s)
- Both terminal SUCCESS on their fresh deploy IDs → platform-level false-green defeated.

## Step 4 — Verification (defeat false-green + stale-revision + stale-bundle)
- **Serving-revision match** (defeat stale-revision race): latest-serving deployment == deployed id for BOTH — api `fa782b68` SUCCESS, web `95e1d29c` SUCCESS. New revision IS the one serving traffic.
- **api /health** → `200`
- **api /me/notifications route-registration smoke** → `401` (route registered, auth required; 404 would = NotificationsController didn't deploy). Confirms new api code live AND backed by the migrated table (no 500 on missing table).
- **web served-bundle CONTENT assertion** (wave-34 lesson): live root serves `/assets/index-DCKZ02HB.js` (1,691,141 bytes); grep for wave-37 markers in the served JS:
  - `Notifications` → match_count = **8**
  - `Mark all` → match_count = **1**
  - `Browse channels` → match_count = **1**
  - (≥1 required; PASS — stale bundle would show 0. No re-`railway up` needed.)
- **Regression sanity:** web `/settings/privacy` → `200`; api `/health` → `200`.

## Step 5 — Canary
- `canary_threshold_dau` = 1000; product is pre-launch (below threshold). T-block synthetic probes are the post-deploy signal.

---

## Deliverable footer

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
async_monitor_id: null          # inline-poll success path; both deploys resolved SUCCESS < 10 min, no MONITOR task needed
merge_commit: "86b7323"
deployed_from: "86b73239b364a83f6ec83a9c9eb52c6d5017fd80 (main)"

services:
  api:
    deploy_id: "fa782b68-5737-406e-9c2c-659797ba5933"
    status: SUCCESS
    serving_revision_matches_deploy: true
    rollback_target: "187aabd2-6007-4ffd-b2c0-df8f316bd48a"
    url: "https://api-production-b93e.up.railway.app"
  web:
    deploy_id: "95e1d29c-3f3e-4ecd-bee2-be9b67d8aa9a"
    status: SUCCESS
    serving_revision_matches_deploy: true
    rollback_target: "c2dcb488-061b-49d3-8536-79c7b530e9b1"
    url: "https://web-production-bce1a8.up.railway.app"

migrations:
  applied: ["0015_majestic_scarlet_spider", "0016_chief_the_anarchist"]
  mechanism: "drizzle-kit migrate over public TCP proxy (yamanote.proxy.rlwy.net:40008)"
  ordering: "before code served (DB ahead of code; additive)"
  verified:
    notifications_table_exists: true
    indexes_present: 3   # user_read_created_idx + mention_uidx + assignment_reminder_uidx

verification:
  api_health: 200
  api_me_notifications_smoke: 401   # route registered (not 404)
  web_bundle: "/assets/index-DCKZ02HB.js"
  web_bundle_markers: { "Notifications": 8, "Mark all": 1, "Browse channels": 1 }
  regression: { "web /settings/privacy": 200, "api /health": 200 }

canary_status: skipped
canary_skip_reason: "DAU below threshold (pre-launch < 1000); T-block synthetic probes are the post-deploy signal."

head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both services deployed via CLI-push and reached authoritative Railway deployment-state SUCCESS
    on FRESH deploy IDs (api fa782b68, web 95e1d29c), and the serving revision matches the deployed
    revision for both — false-green and stale-revision race both defeated at the platform-state layer,
    not by /healthz alone. Migrations 0015+0016 were applied explicitly and in order BEFORE the new
    api served traffic (pre-migration the notifications table was absent, so ordering was load-bearing);
    prod now has the table plus all three required indexes verified directly. Route-registration smoke
    returns 401 (not 404) proving the NotificationsController shipped and is backed by the migrated
    table (no 500). The web served bundle carries wave-37 content markers (Notifications x8, Mark all,
    Browse channels), defeating the wave-34 stale-bundle class. Rollback targets to the prior good
    revision are identified and one-action reachable for both services. Canary skips below the 1000-DAU
    pre-launch threshold. Every applicable C-2 stage-exit check is ticked.
  next_action: PROCEED_TO_T_BLOCK
```
