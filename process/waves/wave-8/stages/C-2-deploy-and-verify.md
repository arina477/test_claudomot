# C-2 — Deploy & verify (wave-8: M2 invites/join)

## Action 0 — Railway credential
- Project-scoped token (`APP_RAILWAY_TOKEN`) usable against project `ae55c191` (`app-arina-89ejyn`).
- Deploy-scoped GraphQL probe returned `data.project` with no `errors`. Credential present (the default path).
- Services (production env `bfdcc42f-fe5b-4198-a47a-b08f5940975d`):
  - api `7358a103-0a4f-44e6-9468-3d02d045531e` — https://api-production-b93e.up.railway.app
  - web `107d4255-422a-4b72-b138-0647f9192fe4` — https://web-production-bce1a8.up.railway.app
  - supertokens `73ca977a-912b-4cba-af46-39cd4cf3d328`
  - Postgres `8d177be8-d8d9-4db6-901f-e7ab5ddd3404`

## Env-var scoping (least-privilege — verified before cutover)
- **api** has: DATABASE_URL, DATABASE_URL_UNPOOLED, SUPERTOKENS_CONNECTION_URI, SUPERTOKENS_API_KEY, SESSION_SECRET, RESEND_API_KEY_AUTH, API_ORIGIN, WEB_ORIGIN, CROSS_ORIGIN_PROD. All required backend creds present.
- **web** has: VITE_API_ORIGIN + Railway-managed vars only. NO DB creds, NO SuperTokens secrets. Correct scoping.

## Migration 0004 — applied FIRST, before new code served
- Pre-migration state (via public proxy `yamanote.proxy.rlwy.net:40008`): `invites` table absent, `servers.invite_code` absent, 3 drizzle migrations applied (0000/0001/0002).
- Applied via `drizzle-kit migrate` (pnpm db:migrate) with `DATABASE_URL` = public proxy URL. Exit 0, "migrations applied successfully".
- Post-migration verified:
  - `invites` table exists (9 columns).
  - `servers.invite_code` column exists + `servers_invite_code_unique` constraint present.
  - drizzle migrations table now has 4 entries (0004 recorded).

## Backfill
- Pre-deploy prod `servers` count = **0**; servers with NULL invite_code = **0**. No existing wave-7 servers persist in prod → backfill is a no-op (nothing to set).
- New servers set `invite_code` at creation via CSPRNG `base64url(randomBytes(16))` (servers.service.ts L57-61), so future servers get a permanent link automatically. No lazy-set gap.

## Deploy (railway up — services are CLI-uploaded, source.repo null, no GitHub auto-deploy)
- api: `railway up --service api --environment production --ci` from main HEAD `8716b4e`. New deployment `62cb0040-1c10-4603-8a57-e7bd54258252` → **SUCCESS** (authoritative deployment-state endpoint). Prior `520bda37` → REMOVED.
- web: `railway up --service web --environment production --ci`. New deployment `631d9923-4c74-4e33-b690-ea6caea47c32` → **SUCCESS**. Prior `7fcf98e2` → REMOVING.
- New revision confirmed serving (health 200 below + prior REMOVED) — no stale-revision race.

## Rollback path (identified before cutover)
- Reachable via GraphQL `deploymentRollback` / re-`railway up` of prior commit. Prior good api deploy `520bda37` (now REMOVED — re-deploy of prior commit is the rollback action). Reachable but not exercised (no canary trip).

## Live verification (synthetic probes against deployed serving code)
1. api `/health` → **200** `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` (clean boot, new revision).
2. `GET /invites/<invalid>` → **404** `{"message":"Invite not found or invalid",...}` (no leak).
3. `POST /invites/<code>/join` unauthed → **401** `{"message":"unauthorised"}` (verified-join gate enforced).
4. `POST /servers/<id>/invites` unauthed → **401** (createInvite auth gate enforced).
5. `GET /invites/<VALID permanent code>` → **200** minimal `{server:{id,name,memberCount}}` ONLY — NO channels/members/owner/invite internals leaked. Verified by creating a throwaway probe server+invite directly in prod DB, hitting the public preview, then deleting it (preview → 404 post-delete confirms cleanup). Minimum-summary security contract enforced by live code.

## Authed-join fixture note (carry-forward)
- No persistent email-verified prod fixture exists; test-accounts.md is an unfilled template. Driving SuperTokens signup + email-verification (Resend round-trip) to mint a verified session was deemed too costly per the brief's allowance.
- Authed paths NOT live-probed: createInvite → {code,url}; authed verified join → 200 {serverId}; idempotent re-join (no use increment); atomic max_uses consume. These are covered by the 179 tests green at B-6 + in CI (incl. the atomic-conditional-consume fix in commit 92cc0f3, integration suite against Postgres 16).
- **Fixture recommendation:** at next prod-test wave, fill command-center/testing/test-accounts.md with one email-verified prod fixture (Student Member persona) so T-5/T-8 and future C-2 can exercise the authed join live.

## Canary
- StudyHall is pre-validation; real-user DAU = 0, well below `canary_threshold_dau: 1000`. Canary skipped per threshold; synthetic probes above are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api: deployment 62cb0040 status SUCCESS (authoritative deployments query)"
  - "railway web: deployment 631d9923 status SUCCESS"
  - "https://api-production-b93e.up.railway.app/health: 200 OK, status=ok"
  - "migration 0004 applied: invites table + servers.invite_code present in prod"
  - "live probes: invalid preview 404, unauthed join 401, unauthed createInvite 401, valid preview 200-minimal"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, deployment_id: 62cb0040-1c10-4603-8a57-e7bd54258252, verified_at: "2026-06-29T18:46Z", health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, deployment_id: 631d9923-4c74-4e33-b690-ea6caea47c32, verified_at: "2026-06-29T18:47Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU 0 < threshold 1000; synthetic probes are the post-deploy signal."
canary_monitor_id: ""
canary_alerts: []
note: "Migration applied before new code served. Env scoping verified (web has no DB creds). Authed-join left to 179 tests + fixture note per brief."
```

## head-ci-cd C-2 verdict
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Migration 0004 applied explicitly and in order BEFORE the new code began
    serving; invites table + servers.invite_code confirmed present in prod.
    Backfill is a no-op (0 existing servers; new servers self-generate CSPRNG
    invite_code). Both api and web deploys verified SUCCESS via Railway's
    authoritative deployment-state endpoint (not /healthz alone); the new
    revision is confirmed serving (health 200, prior deploy REMOVED). Env-var
    scoping verified least-privilege (web has no DB/SuperTokens creds). Live
    synthetic probes confirm the security boundaries: invalid preview 404,
    unauthed join 401, unauthed createInvite 401, valid preview returns the
    minimum-summary shape only with no channels/members leaked. Authed-join
    paths left to the 179-test suite per the brief's cost allowance, with a
    fixture recommendation carried forward. Canary skipped below DAU threshold.
  next_action: PROCEED_TO_T_BLOCK
```
