# V-3 Redeploy — false-green web deploy FIXED (audio-only manual toggle)

**Stage:** C-block re-entry for the V-3 fast-fix redeploy (StudyHall wave-34, M6).
**Owner:** head-ci-cd
**Commit deployed:** `6ddaddb` (local main, contains the audio-only manual toggle fast-fix).

## Problem (what we were fixing)

A prior deploy of the V-3 fast-fix reported deployment SUCCESS but **re-served the STALE pre-fast-fix web bundle**. Both karen and jenny (V-3 re-verify) proved the served web bundle had ZERO occurrences of `audio-only-toggle-btn` / `Switch to audio-only`, while a local build of the merged commit `6ddaddb` DOES contain them.

**Root cause:** the web Railway service is **NOT git-connected**. A GraphQL `serviceInstanceDeployV2` redeploy re-serves the *existing source snapshot* — it does NOT build the merged code. The prior digest-diff gate was **invalid**: a snapshot rebuild yields a new digest from the SAME source, so "digest changed" falsely read as "new code shipped." This is a textbook **false-green deploy** (pipeline SUCCESS while the service serves the old revision).

## Fix — build + deploy the merged commit from the local tree

Pre-flight (confirmed before deploy):
- `git rev-parse HEAD` = `6ddaddbcdff24df9e70021b3959866418911f212`, branch = `main`.
- `grep -c 'audio-only-toggle-btn' apps/web/src/shell/VoiceStudyRoom.tsx` = `1` (marker in source).
- `RAILWAY_TOKEN="$APP_RAILWAY_TOKEN"` set (project-scoped token).
- `railway status` resolves project `ae55c191-4631-4224-b7b2-42f329ed48d7`, env `production`, services web + api Online. (`railway whoami` returns Unauthorized — expected: a project token is not a user token; project ops still authorized, confirmed by `status` succeeding.)

**Deploy command used** (CLI-push model this project uses — uploads the local tree and BUILDS it; NOT a snapshot redeploy):
```
export RAILWAY_TOKEN="$APP_RAILWAY_TOKEN"
npx --yes @railway/cli up --service web --detach
```
Output:
```
Indexing...
Uploading...
  Build Logs: https://railway.com/project/ae55c191-4631-4224-b7b2-42f329ed48d7/service/107d4255-422a-4b72-b138-0647f9192fe4?id=1eb62a41-803c-4438-8cf4-d7fcd08c7b66
```
api was NOT redeployed (unchanged). No GraphQL `serviceInstanceDeployV2`/redeploy was used — that is the bug.

## Deploy monitor (authoritative deployment-state, NOT /healthz)

- **success_condition:** latest web deployment `id == 1eb62a41-803c-4438-8cf4-d7fcd08c7b66` AND `status == SUCCESS`
- **failure_condition:** `status IN (FAILED, CRASHED, REMOVED)`
- **timeout_budget:** 900s

Observed state transitions (`railway deployment list --service web --json | jq '.[0]'`):
```
[13:16:04] id=1eb62a41-803c-4438-8cf4-d7fcd08c7b66 status=BUILDING
[13:16:47] id=1eb62a41-803c-4438-8cf4-d7fcd08c7b66 status=DEPLOYING
[13:17:09] id=1eb62a41-803c-4438-8cf4-d7fcd08c7b66 status=SUCCESS   <-- REACHED_SUCCESS
```
A genuine BUILDING→DEPLOYING→SUCCESS cycle (~65s) — proves the uploaded tree was actually built, not snapshot-reserved.

## Verification — SERVED-BUNDLE CONTENT ASSERTION (the load-bearing check)

Method: fetch web root, extract the `/assets/index-*.js` bundle it references, curl that bundle, grep for BOTH markers.

**BEFORE (stale / false-green state, captured for contrast):**
| Field | Value |
|---|---|
| served bundle | `/assets/index-Bv_FSPoS.js` |
| bytes | 1,557,244 |
| `audio-only-toggle-btn` | **0** |
| `Switch to audio-only` | **0** |
| root HTTP | 200 |

**AFTER (post-redeploy):**
| Field | Value |
|---|---|
| served bundle | `/assets/index-BkNvqunA.js` (**hash changed** off `Bv_FSPoS`) |
| bytes | 1,558,352 |
| `audio-only-toggle-btn` | **1 — PRESENT** |
| `Switch to audio-only` | **1 — PRESENT** |
| root HTTP | **200** |

RESULT = `CONTENT_ASSERT_PASS`. The served bundle hash changed AND both fast-fix markers are present in the bytes actually shipped to browsers — this is the assertion that would have caught the original false-green. The digest-diff gate could not, because a snapshot rebuild changes the digest without changing the source.

## Checklist verdict (C-2 deploy & verify)

- [x] Deploy verification reads the Railway deployment-state endpoint, NOT a self-reported /healthz.
- [x] New revision confirmed serving traffic before "done" — served-bundle hash flipped `Bv_FSPoS` → `BkNvqunA`, no stale-revision race.
- [x] Deploy monitor declares success_condition, failure_condition, AND timeout_budget (900s).
- [x] Only the changed service (web) redeployed; api untouched.
- [x] No secrets committed/echoed; project token via env only.
- [x] Rollback path reachable: prior good revision = the last known-good web deployment; `railway up` from a reverted tree (or Railway dashboard redeploy of the prior deployment) restores it in one action. (N/A trigger — this deploy is the recovery; no rollback needed.)
- [x] Served-bundle content assertion PASS (marker-in-served-bytes, per jenny's recommendation) — beyond digest.

No migrations in scope (frontend-only fast-fix). No env-var changes.

## L-2 lesson (false-green)

- **Non-git-connected Railway services must be deployed with `railway up` (CLI-push: uploads + builds the local tree), NEVER a GraphQL `serviceInstanceDeployV2` redeploy — the latter re-serves the existing source snapshot and does not build merged code.**
- **A digest-diff gate is INSUFFICIENT for non-git services: a snapshot rebuild yields a new digest from the SAME source, so "digest changed" can be a false-green. Verify with a served-bundle CONTENT assertion** — fetch the live root, extract the referenced `/assets/index-*.js`, and grep the served bytes for a marker unique to the change. Digest/id freshness is necessary but not sufficient; content-in-served-bytes is the load-bearing proof.

## Carry / next

Fast-fix code is now live and served. Handoff:
1. **jenny** re-verifies the live manual audio-only path end-to-end against the served build.
2. **head-verifier** gate on jenny's re-verify.
3. **N-block** close M6.

```yaml
head_signoff:
  verdict: APPROVED
  stage: V-3-redeploy (C-2 deploy & verify re-entry)
  reviewers: {}
  failed_checks: []
  block_state:
    deploy_service: web
    deploy_id: "1eb62a41-803c-4438-8cf4-d7fcd08c7b66"
    deploy_status: SUCCESS
    commit: 6ddaddb
    served_bundle_before: "index-Bv_FSPoS.js"      # markers 0/0 (stale false-green)
    served_bundle_after: "index-BkNvqunA.js"        # markers 1/1 (fast-fix live)
    served_bundle_content_assertion: PASS
    web_root_http: 200
    api_redeployed: false
  ci_stage_verdict: PASS
  rationale: >
    Redeployed web by BUILDING the local tree (main @ 6ddaddb) with `railway up --service web`,
    the CLI-push model this non-git-connected service requires. Authoritative Railway
    deployment-state endpoint reports the new deployment 1eb62a41 SUCCESS after a real
    BUILDING->DEPLOYING->SUCCESS cycle. The load-bearing served-bundle content assertion passes:
    the live bundle hash flipped from the stale index-Bv_FSPoS.js (0/0 markers) to
    index-BkNvqunA.js which contains both `audio-only-toggle-btn` and `Switch to audio-only`
    (1/1), root 200. The fast-fix code is now actually served — the false-green is resolved.
    No GraphQL snapshot redeploy used (that was the bug). api untouched.
  next_action: HANDOFF_TO_jenny_reverify  # -> head-verifier gate -> N-block close M6
```
