# C-2 — Deploy & verify (wave-4 profile customization)

## Credential model
- `APP_RAILWAY_TOKEN` is an account/team-scoped token (GraphQL `project()` returns "Not Authorized"; CLI `whoami` Unauthorized) but is **usable for project-scoped CLI operations** (`railway status/up/variables/logs --service`). Followed the task brief's CLI path (`RAILWAY_TOKEN=$APP_RAILWAY_TOKEN npx @railway/cli`), NOT the GraphQL probe. Did not conclude "no credential" from whoami failing — verified deploy-scoped per dispatcher guidance.
- Project `ae55c191-...` / env `production` (`bfdcc42f-...`).

## Topology + env-scope verification
| Service | ID | Env scope (verified) |
|---|---|---|
| web | 107d4255-... | `RAILWAY_SERVICE_NAME=web`, NO DB creds ✓ |
| api | 7358a103-... | `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI`, `SUPERTOKENS_API_KEY` ✓ |
| Postgres | 8d177be8-... | `DATABASE_PUBLIC_URL` (public proxy `yamanote.proxy.rlwy.net:40008`) |
| supertokens | 73ca977a-... | `SUPERTOKENS_HOST/PORT` |
- web does NOT receive DB creds (correct scoping). api has DB + SuperTokens.

## Migration (applied explicitly, in order, BEFORE new code served)
- Mechanism: `drizzle-kit migrate` (NOT auto-migrate-on-boot) against Postgres public proxy.
- Pre-migration: users = [id, email, display_name, created_at, updated_at]; drizzle journal = 1 (0000 baseline). `0001` genuinely pending.
- Post-migration: users = [..., username, avatar_url, accent_color]; index `users_username_lower_idx` = `CREATE UNIQUE INDEX ... USING btree (lower(username))`; drizzle journal = 2.
- Migration `0001` is additive/expand (nullable cols + new index) — backward-compatible with the then-serving old revision; safe to apply before cutover.

## Rollback reference (captured pre-cutover)
- web previous good deploy: `6ae269e6-fde3-421e-a7b6-72f4d86f5c8b`
- api previous good deploy: `3b48c414-c2bc-4d7b-bccd-dabd195b32d5`
- Rollback path: redeploy these IDs via CLI (`railway redeploy`/`deploymentRedeploy`), reachable. NOT triggered (deploys succeeded).

## Deploy (both services, from merged main f28cda0)
- Deploys triggered via `railway up --detach` (services are CLI/Dockerfile-deployed, `cliCaller: claude_code`, NOT git-auto-deploy).
- api new deploy `ab6b7c92-...`; web new deploy `a478333b-...`.
- Authoritative deployment-state (NOT /healthz): both `status: SUCCESS`, instances `RUNNING`, `deploymentStopped: false`. The new deployment IDs are the **active** revision (no stale-revision race — confirmed serving revision == deployed revision).

## Verification (non-avatar)
| Check | Expected | Result |
|---|---|---|
| api `/health` | 200, clean boot | **200** `{"status":"ok",...}`; logs show FilesModule init + "successfully started", no crash; FilesService WARN-graceful ✓ |
| web `/` | 200 | **200** ✓ |
| web `/settings/profile` | 200 (SPA) | **200** ✓ |
| GET /profile (fresh user) | 200, 4 fields | **200** `{displayName:null,username:null,avatarUrl:null,accentColor:null}` ✓ |
| PATCH /profile {username:"testuser1", accentColor:"#34d399"} | 200 | **200** reflects both ✓ |
| GET /profile (after PATCH) | reflects values | **200** username+accent reflected ✓ |
| PATCH /profile {username:"BAD NAME!!"} | 400 | **400** validation error ✓ |
| POST /profile/avatar/presign {image/png} | 503 STORAGE_NOT_CONFIGURED | **503** `{"code":"STORAGE_NOT_CONFIGURED"}` (graceful, expected) ✓ |
| PATCH /profile {username:"testuser1"} from 2nd user | **409** (taken, not 500) | **500** `{"statusCode":500,"message":"Internal server error"}` ❌ **DEFECT** |

- Session obtained via `/auth/signup` with `st-auth-mode: cookie`. Backend returns no `anti-csrf` header (antiCsrf NONE / cookie-based) — `rid: anti-csrf` header sent per brief; mutations succeeded with cookie jar.
- Avatar real-upload verification PENDING founder Railway Bucket creds (`AWS_*`/`STORAGE_BUCKET_NAME`) — not a defect; 503-graceful is correct.

## DEFECT — duplicate username returns 500 instead of 409
- **Repro:** user A `PATCH /profile {username:"testuser1"}` → 200. user B (fresh signup) `PATCH /profile {username:"testuser1"}` → **500** (expected 409).
- **Root cause:** `apps/api/src/users/users.service.ts` `updateProfile()` wraps `db.update()` in `try/catch` with `isUniqueViolation(err)` checking `err.code === '23505'`. The drizzle + node-postgres rejection wraps the driver error so the PG code `23505` is NOT on the top-level `err.code` (it's nested, e.g. on `err.cause.code` for a DrizzleQueryError wrapper). `isUniqueViolation` returns false, `throw err` rethrows raw → NestJS default exception filter → 500. The 409 mapping path exists but never matches the real error shape.
- **Why prod-only / passed CI:** unit/integration tests mock or assert the catch with a synthetic `{code:'23505'}` object rather than a real drizzle rejection, so the wrapper mismatch escaped CI. (test-author / B-2 gap.)
- **Fix direction (for the builder — NOT applied here per Iron Law):** unwrap the error in `isUniqueViolation` to also inspect `err.cause?.code` (and/or match the PG constraint name `users_username_lower_idx`), and add a contract/integration test that drives a *real* duplicate insert through drizzle, not a synthetic error object.
- **Classification:** runtime exception / backend logic defect → triage tag `debugging`; originating stage B-2 (backend). Routed to head-builder.

```yaml
ci_stage_verdict: FAIL
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway: web a478333b status SUCCESS RUNNING (active), api ab6b7c92 status SUCCESS RUNNING (active) — new revisions serving"
  - "drizzle-kit migrate applied 0001: users +username/avatar_url/accent_color + users_username_lower_idx unique(lower(username)); journal 1->2"
  - "api /health 200 clean boot; web / and /settings/profile 200"
  - "PATCH /profile username/accent 200; invalid 400; presign 503 STORAGE_NOT_CONFIGURED graceful"
  - "DEFECT: duplicate username PATCH returns 500 (expected 409) — unhandled PG 23505 (wrapped err.code) in users.service.updateProfile"
deploy_targets:
  - {platform: railway, service: web, deploy_id: a478333b, state: SUCCESS, commit: f28cda0, serving: true}
  - {platform: railway, service: api, deploy_id: ab6b7c92, state: SUCCESS, commit: f28cda0, serving: true}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "Pre-validation; DAU << 1000 threshold. Synthetic verification is the post-deploy signal."
note: "Deploy + migration + rollback-path all clean. Verification surfaced one real backend defect (dup username -> 500). Routed to head-builder per Iron Law; block exit blocked until fix re-deployed + 409 re-verified."
```

---
head_signoff:
  verdict: REJECTED
  stage: C-2
  reviewers:
    head-builder: routed (dup-username 500 defect, root-caused)
  failed_checks:
    - "duplicate username PATCH returns 500 instead of 409 (unhandled PG 23505, wrapped err.code in users.service.updateProfile)"
  rationale: >
    Deploy itself is clean and authoritatively verified: migration 0001 applied explicitly in
    order before cutover (3 cols + lower(username) unique index confirmed), both web and api
    redeployed to status SUCCESS with the NEW revision serving traffic (no stale-revision race),
    env scoping correct (web has no DB creds), api boots clean with graceful FilesService, and a
    reachable rollback target was captured pre-cutover. Eight of nine verification cases pass —
    including the expected 503 avatar-graceful and 400 invalid-username. But the duplicate-username
    case returns a 500 instead of the spec-required 409: the 23505 unique-violation handler in
    users.service.updateProfile reads err.code at the top level while the drizzle/pg rejection nests
    the code, so the ConflictException mapping never fires. This is a real backend defect (not the
    avatar-pending case) that CI missed because the tests assert against a synthetic error object.
    Per the Iron Law I do not fix it; routed to head-builder with root cause + fix direction.
  next_action: REWORK_B-2

## C-2 update — PASS (after 409 fix-forward PR#11)
Duplicate-username 500→409 defect fixed (PR#11 8537f0c, merged). Live re-verify: user A username→200; user B duplicate→409 {username_taken}; bad→400; /health 200; web+api SUCCESS. Migration applied (users +username/avatar_url/accent_color + lower(username) unique index). Non-avatar surface fully verified.
**Avatar real-upload: PENDING founder Railway Bucket creds** (presign→503 graceful until AWS_*/STORAGE_BUCKET_NAME set). Tracked follow-up (like Resend domain a1299e88). Avatar PATH built + graceful-verified.
```yaml
ci_stage_verdict: PASS
prs: [10, 11]
deploy: {web: SUCCESS, api: SUCCESS}
verified: [username-set-200, username-dup-409, username-bad-400, accent-200, profile-4-fields, avatar-presign-503-graceful, migration-applied]
pending_founder: [avatar-real-upload (Railway Bucket creds AWS_*)]
canary_status: skipped (self-use-mvp)
```
