# C-2 — Deploy & Verify (wave-35 privacy controls + Sentry)

Stage: C-2 (Deploy & verify) · Block: C (CI/CD) · Mode: automatic
Owner: head-ci-cd · Deploy target: Railway project `app-arina-89ejyn` (env `production`)
Merged commit under deploy: `0c71585` (feat(privacy): wave-35 privacy controls + Sentry observability (#49)) — HEAD of main.
Changed services this wave: **api** AND **web** (both deployed via CLI push).

---

## Deploy model (project-specific, hard-won)

Railway services here are NOT git-connected — a merge to main does NOT deploy. Deploy is CLI-push `railway up` per changed service. A dashboard/GraphQL "redeploy" re-serves the STALE image (false green, bit us in wave-34). Both changed services were force-rebuilt from merged main via `railway up`.

- railway CLI not on PATH; global `npm i -g` blocked by permissions → used `npx @railway/cli@latest` (v5.23.3).
- Auth: `RAILWAY_TOKEN=$APP_RAILWAY_TOKEN` (project token, len 36; never written to any file).
- `railway status` confirmed services `api` + `web` both Online; DBs `Postgres` + `supertokens` Online.

---

## Step 1 — Migration FIRST (applied before serving new api code)

Migration `apps/api/drizzle/migrations/0014_sparkling_gorgon.sql` — additive + defaulted:
```
ALTER TABLE "users" ADD COLUMN "profile_visibility" text DEFAULT 'everyone' NOT NULL;
ALTER TABLE "users" ADD COLUMN "who_can_dm"        text DEFAULT 'everyone' NOT NULL;
```
The api `start` (`node dist/src/main.js`) does NOT auto-migrate — migration applied explicitly, in order, BEFORE the new code began serving.

- api service `DATABASE_URL` points at `postgres.railway.internal` (private DNS) — unreachable from a local `railway run`; local attempt returned "password authentication failed" (wrong-endpoint symptom).
- Resolved by using the Postgres service's `DATABASE_PUBLIC_URL` (TCP proxy `yamanote.proxy.rlwy.net:40008`) — same prod `railway` DB, external path. URL held only in-env, never written to a file.
- Applied via `drizzle-kit migrate` (`pnpm exec drizzle-kit migrate`) with `DATABASE_URL` = public proxy URL → `[✓] migrations applied successfully!` (exit 0). Only the un-applied migration (0014) ran.

**Pre-migration snapshot:** `profile_visibility` / `who_can_dm` absent; `users` rowcount = 47.
**Post-migration verification (authoritative, queried live prod DB):**
- `profile_visibility` — text, NOT NULL, DEFAULT `'everyone'` ✓
- `who_can_dm` — text, NOT NULL, DEFAULT `'everyone'` ✓
- Backfill: 47/47 users = `everyone` for BOTH columns ✓ (additive+defaulted, zero data risk)

---

## Step 2 — Deploy both changed services (CLI push, fresh rebuild)

| Service | Command | CLI exit | Result | Image digest (new) |
|---|---|---|---|---|
| api | `railway up --service api --ci` | 0 | Deploy complete | `sha256:88e8b8af…804f10b` |
| web | `railway up --service web --ci` | 0 | Deploy complete | `sha256:ce8a147c…0a94e` |

Both built fresh Docker images (distinct digests) from merged main — NOT a stale re-serve. Both deploys finished under the ~10-min inline-poll threshold; no MONITOR-task promotion needed.

---

## Step 3 — Verify LIVE (defeat false-green) — ALL FOUR CHECKS PASS

### Check 1 — Authoritative deployment state = SUCCESS (not stale)
Read from Railway's deployment-state endpoint (`railway deployment list --service <svc> --json`), NOT `/healthz`.
- **api**: latest `SUCCESS` @ `2026-07-02T16:06:57Z`; prior deployments `REMOVED`. `API_LATEST_STATUS=SUCCESS`.
- **web**: latest `SUCCESS` @ `2026-07-02T16:09:08Z`; prior deployments `REMOVED`. `WEB_LATEST_STATUS=SUCCESS`.
- Both timestamps fall in this deploy window; old revisions stood down → the new revision is the one serving traffic. No stale-revision race.

### Check 2 — api health
`GET https://api-production-b93e.up.railway.app/health` → **200** · body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`.

### Check 3 — api route-registration smoke (PrivacyModule deployed)
- `GET /profile/privacy` → **401** (route exists, auth required) ✓ (404 would mean module didn't deploy)
- `GET /profile/data` → **401** (data-export route exists) ✓
- Control `GET /profile/definitely-not-a-route-xyz` → **404** — confirms the 401s are genuine route-registration, not a catch-all masking 404s.

### Check 4 — web served-bundle CONTENT assertion (wave-34 lesson: digest-diff is NOT enough)
Fetched live web root, extracted the actually-served hashed JS filename, fetched that JS (1,673,944 bytes), grepped for wave-35 change-unique markers.
- Served bundle: `/assets/index-B_iPgjvp.js`
- `Takes effect when direct messages arrive` — matchcount **1** (who-can-DM affordance) ✓
- `studyhall-account-data` — matchcount **1** (export filename) ✓
- `Download my data` — matchcount **1** (export button) ✓
- ≥1 marker present across THREE independent strings → the served bundle is the NEW wave-35 bundle. No stale-bundle re-fire needed.

---

## Step 4 — Canary

`canary_status: skipped` — reason: real-user traffic is below the canary threshold (`canary_threshold_dau: 1000`; StudyHall is pre-launch, self-use MVP). T-block synthetic probes are the post-deploy signal. No production canary window applies at current traffic.

---

## Rollback path (identified + reachable before/after cutover)

- Previous good revisions retained by Railway (now `REMOVED` but redeployable). One-action rollback: `railway redeploy --service <svc>` to the prior deployment, or re-`railway up` the previous commit.
- Migration 0014 is additive + defaulted → forward-compatible; a code rollback does NOT require a schema rollback (old code ignores the new columns). No destructive down-migration needed.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  ci_stage_verdict: PASS
  block_state:
    pr_url: "https://github.com/<repo>/pull/49"
    deploy_commit: "0c71585"
    api_deploy: { status: SUCCESS, created_at: "2026-07-02T16:06:57Z", url: "https://api-production-b93e.up.railway.app" }
    web_deploy: { status: SUCCESS, created_at: "2026-07-02T16:09:08Z", url: "https://web-production-bce1a8.up.railway.app" }
    rollback_ready: true
  migration:
    file: "apps/api/drizzle/migrations/0014_sparkling_gorgon.sql"
    applied_before_serving: true
    columns_verified: ["profile_visibility (text NOT NULL DEFAULT 'everyone')", "who_can_dm (text NOT NULL DEFAULT 'everyone')"]
    backfill: "47/47 users -> 'everyone' (both columns)"
  verification:
    check1_deploy_state: "api=SUCCESS, web=SUCCESS (authoritative deployment-state endpoint; prior deployments REMOVED)"
    check2_api_health: "200 studyhall-api"
    check3_route_smoke: "/profile/privacy=401, /profile/data=401, control-404=404"
    check4_web_bundle_marker:
      served_js: "/assets/index-B_iPgjvp.js"
      markers: { "Takes effect when direct messages arrive": 1, "studyhall-account-data": 1, "Download my data": 1 }
  canary_status: skipped
  canary_skip_reason: "real-user traffic below canary_threshold_dau=1000 (pre-launch self-use MVP); T-block synthetic probes are the post-deploy signal"
  live_urls:
    api: "https://api-production-b93e.up.railway.app"
    web: "https://web-production-bce1a8.up.railway.app"
  rationale: >
    Both changed services (api + web) were rebuilt from merged main 0c71585 via CLI push and
    verified LIVE through the authoritative Railway deployment-state endpoint (both SUCCESS, prior
    revisions REMOVED — no stale-serve). Migration 0014 was applied explicitly and in order BEFORE
    the new api code served, with columns and 47/47 backfill verified against the live prod DB.
    Route-registration smoke confirms PrivacyModule deployed (401 not 404, with a 404 control), and
    a served-bundle content assertion confirms the NEW wave-35 web bundle is being served (three
    change-unique markers present), defeating the wave-34 false-green class. Canary skipped on the
    traffic threshold. Rollback path is identified and reachable; migration is additive+defaulted so
    a code rollback needs no schema rollback.
  next_action: PROCEED_TO_C-3
```
