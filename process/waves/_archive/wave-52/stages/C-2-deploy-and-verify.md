# C-2 — Deploy & verify (wave-52)

**Wave:** 52 — M8 study-group tools: joinable focus rooms (body-doubling). NEW `apps/api/src/study-room/` module (in-memory rooms + join-presence + room-scoped timer) over a distinct `/study-room` Socket.IO namespace + FocusRoomPanel UI. **BOTH api + web deployed. NO migration, NO schema change (all ephemeral in-memory — MUST-lock 1).**
**Merge commit:** `25c0736d35d2cc1603bda240c153dce3a2deb553`.
**Deploy platform:** Railway (GraphQL-only, no CLL), project `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), env production (`bfdcc42f-fe5b-4198-a47a-b08f5940975d`).
**head-ci-cd verdict:** PASS.

## Credential (Action 0)

Project-scoped `RAILWAY_TOKEN` present + usable (len 36). Deploy-scoped probe (`project(id:){services}`) returned data with no errors; authenticated via `Project-Access-Token` header (never Bearer, never `me{}`). Services discovered: api `7358a103`, web `107d4255`, supertokens `73ca977a`, Postgres `8d177be8`. No founder pause needed.

## NO migration this wave (in-memory feature)

Migration step SKIPPED per spec — the focus-room feature is fully ephemeral (in-memory rooms/presence/room-timer; MUST-lock 1). Confirmed: PR #66 diff contains zero `.sql` files; Drizzle migrations ledger untouched at 0023 (`0023_lush_iron_fist.sql`, unchanged from prior wave). No un-migrated-schema-serving window because there is no schema change.

## Env-var scoping verified in target service scope (pre-cutover, values redacted — names only)

| Service | Required set present? | Notes |
|---|---|---|
| api | YES | `DATABASE_URL` + `DATABASE_URL_UNPOOLED`, `SUPERTOKENS_CONNECTION_URI` + `SUPERTOKENS_API_KEY`, `LIVEKIT_API_KEY/SECRET/URL`, `SESSION_SECRET`, storage (`AWS_*`, `STORAGE_BUCKET_NAME`) + email (`RESEND_API_KEY_AUTH`). New study-room module is in-memory; needs auth/session (present). **No new env var required.** |
| web | least-privilege | ONLY `VITE_API_ORIGIN` + `VITE_LIVEKIT_URL` (plus Railway-injected `RAILWAY_*`). **No DB creds, no secrets** — correct scoping (missing-env-var-cutover and scoped-secret-leak both prevented). FocusRoomPanel needs no new env var. |

## Rollback path (identified + reachable BEFORE cutover)

Current serving revisions captured before triggering the new deploys — both reachable via `serviceInstanceRedeploy(environmentId, serviceId)` / `deploymentRollback(id)`:

- api last-good: deployment `ee61b0b9`, commit `01399a5499` (SUCCESS, created 2026-07-05T18:50:57Z) — wave-51 HEAD
- web last-good: deployment `2ec99533`, commit `01399a5499` (SUCCESS, created 2026-07-05T18:50:47Z) — wave-51 HEAD

Confirmed present before cutover; no cutover failure occurred so no rollback fired.

## Deploy trigger + authoritative deployment-state verification (NOT /health alone)

Deploys triggered explicitly on the merge commit via `serviceInstanceDeploy(serviceId, environmentId, commitSha=25c0736..., latestCommit:false)` — both returned `true`. Inline-polled the authoritative `deployments` GraphQL endpoint (deploy monitor: success_condition = both `SUCCESS` AND deployed-commit == merge SHA; failure_condition = any of `FAILED/CRASHED/REMOVED/SKIPPED`; timeout_budget = 600s inline cap, 30s poll delay). Progressed BUILDING → SUCCESS in ~61s.

| Service | Latest deployment id | Status | Deployed commit | createdAt | staticUrl |
|---|---|---|---|---|---|
| api | 689855da-ad09-4d17-a14a-edb50aa80ff4 | **SUCCESS** | **25c0736d35d2...** (= merge SHA) | 2026-07-05T21:05:08Z | api-production-b93e.up.railway.app |
| web | 3e7dd358-9546-4234-847f-5dd7b3bc1666 | **SUCCESS** | **25c0736d35d2...** (= merge SHA) | 2026-07-05T21:05:09Z | web-production-bce1a8.up.railway.app |

Both SUCCESS (not SKIPPED/FAILED/CRASHED/REMOVED). **Deployed-commit-hash matches the merge SHA on both services** — the new revision is the serving revision, not a stale one.

## Health probes (serving-revision confirmation)

| Target | Endpoint | Result |
|---|---|---|
| api | https://api-production-b93e.up.railway.app/health | 200 · `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web | https://web-production-bce1a8.up.railway.app/ | 200 |

Authoritative deployment-state (SUCCESS @ 25c0736) AND live health probes (200) agree → new revision deployed AND serving. Fresh deploy (created 21:05Z, probed 21:06Z ≈ 1 min uptime). No stale-revision race, no false-green.

## Feature liveness on the new revision (the /study-room headline)

- Socket.IO gateway handshake `GET /socket.io/?EIO=4&transport=polling` → **200** with a valid Engine.IO session (`sid`, websocket upgrade offered). The gateway hosting the `/study-room` namespace is live.
- Namespace connect to `/study-room` (`40/study-room,` packet) → POST 200; gateway heartbeats (`2` PING) on the polling channel without rejecting the transport → the `/study-room` namespace is registered and accepting connections. (Full CONNECT ACK requires the SuperTokens auth handshake, as designed — the gateway is auth-guarded, not open.)
- web bundle serves a fresh hashed asset (`/assets/index-CSETvy6K.js`) → the new FocusRoomPanel build is being served.

## Canary

**SKIPPED** — pre-launch, real-user traffic = 0 DAU < 1000 `canary_threshold_dau`. Synthetic probes (above) are the post-deploy signal.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "railway api service 7358a103: latest deployment 689855da status=SUCCESS, commit=25c0736 (=merge SHA), staticUrl api-production-b93e.up.railway.app"
  - "railway web service 107d4255: latest deployment 3e7dd358 status=SUCCESS, commit=25c0736 (=merge SHA), staticUrl web-production-bce1a8.up.railway.app"
  - "NO migration this wave: PR #66 diff has zero .sql; Drizzle ledger untouched at 0023 (in-memory focus-room feature, MUST-lock 1)"
  - "https://api-production-b93e.up.railway.app/health: 200 {\"status\":\"ok\",\"service\":\"studyhall-api\",\"version\":\"0.0.1\"}"
  - "https://web-production-bce1a8.up.railway.app/: 200 (fresh bundle index-CSETvy6K.js)"
  - "feature liveness: socket.io handshake 200 + /study-room namespace connect 200 (auth-guarded gateway live)"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: "25c0736d35d2cc1603bda240c153dce3a2deb553", verified_at: "2026-07-05T21:05:08Z", uptime_seconds: 100, health_url: "https://api-production-b93e.up.railway.app/health"}
  - {platform: railway, service: web, state: SUCCESS, commit: "25c0736d35d2cc1603bda240c153dce3a2deb553", verified_at: "2026-07-05T21:05:09Z", uptime_seconds: 100, health_url: "https://web-production-bce1a8.up.railway.app/"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "Pre-launch; DAU 0 < 1000 canary_threshold_dau. No real-user traffic to canary; synthetic health + deployment-state probes are the post-deploy signal."
canary_window: {}
canary_monitor_id: ""
canary_alerts: []
note: "NO migration this wave (in-memory focus-room; ledger untouched at 0023). api+web deployed to merge commit 25c0736 via serviceInstanceDeploy (latestCommit:false); both SUCCESS in ~61s with deployed-commit == merge SHA and health 200. Env scoping verified (api full DB/auth/livekit set; web no DB creds — least-privilege intact). Rollback targets api ee61b0b9 / web 2ec99533 (both commit 01399a5499) identified + reachable before cutover; no rollback needed. /study-room namespace + Socket.IO gateway live on new revision. Canary skipped (0 DAU). Inline-poll resolved within cap; no MONITOR-task needed."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Deploy verified against Railway's authoritative deployment-state endpoint, not /health alone.
    This wave ships an in-memory feature (joinable focus rooms) with NO migration and NO schema change
    (MUST-lock 1) — confirmed by a zero-.sql diff and an untouched Drizzle ledger at 0023 — so the
    migration step was correctly skipped with no un-migrated-schema-serving window. Both api and web were
    deployed to the merge commit 25c0736 via serviceInstanceDeploy pinned with latestCommit:false; both
    report latest deployment status=SUCCESS with the deployed-commit-hash EQUAL to the merge SHA, and
    both health probes return 200 on a fresh (~1 min uptime) revision — deployment-state and live serving
    signal agree, so the new revision is the serving revision with no stale-revision race and no
    false-green. Env-var scoping was confirmed in the target scope (names only, values never read): api
    holds the full DB/SuperTokens/LiveKit/session set the module needs, and web holds only its two VITE_
    vars with no DB creds (least-privilege intact) — and no new env var was required this wave. A reachable
    rollback path to the prior good revisions (api ee61b0b9 / web 2ec99533, both commit 01399a5499) was
    identified before cutover. Feature liveness on the new revision is confirmed: the Socket.IO gateway
    handshake is 200 and the /study-room namespace accepts connections (auth-guarded, as designed), and
    web serves the fresh FocusRoomPanel bundle. Canary skipped per the 0-DAU pre-launch traffic threshold.
    The inline-poll resolved within the 600s cap, so no MONITOR-task was needed.
  next_action: PROCEED_TO_T-block
```

---

## T-5 fix redeploy

Fix-up C-cycle for a T-5 (layout) live finding on the already-merged+deployed wave-52: the joinable focus-room panel was stuck on its loading skeleton in prod because the client never emitted the `subscribe_server_rooms` handshake, so the backend never sent the open-rooms list. **NOT a new wave** — original wave-52 checklist stages are untouched.

**Fix PR:** [#67](https://github.com/arina477/test_claudomot/pull/67) — `fix: study-room subscribe handshake (focus-room panel skeleton-stuck)`. 2 commits: backend `a70cc02` (`/study-room` gateway now answers `subscribe_server_rooms` with the open-rooms list) + frontend `7534f4c` (`FocusRoomPanel` emits `subscribe_server_rooms` on mount). NO migration, NO schema change (feature remains in-memory).

**CI:** run `28755704661` — all 7 required checks PASS (lint, typecheck, test, build, e2e, boot-probe, secret-scan). api 700 + web 452 green; `biome ci .` clean.

**Merge:** squash-merged to `main`. **Merge SHA `725f7b6b68872521bc83a26562691aaf405adcc9`** (`725f7b6`). Local main synced to it.

**Redeploy (both services pinned to merge SHA via `serviceInstanceDeploy(commitSha=725f7b6...)`, Railway GraphQL, Project-Access-Token header):** both returned `true`; inline-polled authoritative `deployments` endpoint BUILDING → SUCCESS in ~60s. Deploy monitor: success_condition = both `SUCCESS` AND deployed-commit == merge SHA; failure_condition = any `FAILED/CRASHED/REMOVED/SKIPPED`; timeout_budget = 570s inline cap, 20s poll delay. No migration ran.

| Service | Deployment id | Status | Deployed commit | staticUrl | /health |
|---|---|---|---|---|---|
| api | 4b525786-6dce-4671-9f38-396b84cab23e | **SUCCESS** | **725f7b6b6887...** (= merge SHA) | api-production-b93e.up.railway.app | 200 · `{"status":"ok","service":"studyhall-api","version":"0.0.1"}` |
| web | 02574ba2-3f3f-4895-864f-5d477359df17 | **SUCCESS** | **725f7b6b6887...** (= merge SHA) | web-production-bce1a8.up.railway.app | 200 (dark-theme StudyHall shell) |

**Deployed-hash match:** both services report deployed-commit == merge SHA `725f7b6` → the fix revision is the serving revision, no stale-revision race, no false-green.

**Feature liveness (the /study-room headline):** Socket.IO engine handshake `GET /socket.io/?EIO=4&transport=polling` → **200** with a valid Engine.IO session. Namespace connect `40/study-room,` → POST 200; namespace ACK `44/study-room,{"message":"Unauthorized"}` (packet `44` = namespace CONNECT_ERROR from the `ws-auth` guard) → the `/study-room` namespace is registered, reachable, and auth-guarded as designed (an unregistered namespace would drop silently, not return a namespace-scoped error). Handshake path 200; namespace live on the fix revision. (Client connects via `io(\`${BASE}/study-room\`)` on the `/socket.io/` mount — a raw HTTP GET to the literal `/study-room/` path returns 404 by design and is not the handshake surface.)

**The focus-room fix is LIVE:** deployed hash matches the merge SHA that carries both `subscribe_server_rooms` commits on api and web; both /health 200; /study-room namespace handshake 200. Inline-poll resolved within cap; no MONITOR-task, no rollback needed; no BLOCKED trigger fired.
