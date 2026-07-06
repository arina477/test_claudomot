# C-2 — Deploy & verify (wave-68)

**Wave:** 68 — M11 publish-write-half + memberCount fix
**Head:** head-ci-cd · **Mode:** automatic
**Merge commit deployed:** `1b5a184746978134b8c295f721d0dc63ce464d0f`

## Action 0 — Railway credential (present, default path)
Deploy-scoped GraphQL probe (`Project-Access-Token` header, `project(id:)` query — never `me{}`) returned `data.project != null`, `errors: null`. Credential usable. Project `ae55c191-…`, env `production` (`bfdcc42f-…`).

## Action 1 — Targets enumerated
Both apps changed this wave (apps/api AND apps/web) → **deploy BOTH**. Railway services:
- **api** `7358a103-0a4f-44e6-9468-3d02d045531e` → `api-production-b93e.up.railway.app`
- **web** `107d4255-422a-4b72-b138-0647f9192fe4` → `web-production-bce1a8.up.railway.app`

## Rollback baseline (identified BEFORE cutover — reachable one-action revert)
Pre-deploy, both services served the last good revision at wave-67 merge commit `43d20b2` (SUCCESS):
- api rollback target: deployment `65398968-1a90-463e-a58a-d5570ea7a776` (SUCCESS, commit 43d20b2)
- web rollback target: deployment `a6c1cb71-ea07-409a-a7ef-61836a19aa6f` (SUCCESS, commit 43d20b2)
Rollback path if needed: `serviceInstanceDeploy(commitSha:"43d20b2…")` per service, OR `deploymentRedeploy(id:<target>)`. Confirmed reachable before triggering cutover.

## Migration sequencing
**No migration this wave.** is_public / description / topic columns already exist from wave-67's migration 0024. No new drizzle SQL to apply; nothing to sequence before serving. Confirmed no new migration in the diff (C-1 checklist).

## Action 2 — Deploy trigger + authoritative deploy-state verification
Triggered `serviceInstanceDeploy(serviceId, environmentId, commitSha:"1b5a184…")` for BOTH services — **commitSha passed explicitly** to avoid the wave-67 stale-revision trap (a bare serviceInstanceRedeploy re-pins the OLD commit). Both returned `serviceInstanceDeploy: true`.

Inline-polled the authoritative Railway deployment-state endpoint (GraphQL `deployments(first:1).node.status` — NOT /healthz) every 30s, cap 10 min:
```
[0s]  api=BUILDING (1b5a184)  web=BUILDING (1b5a184)
[60s] api=DEPLOYING (1b5a184) web=SUCCESS (1b5a184)
[91s] api=SUCCESS (1b5a184)  web=SUCCESS (1b5a184)  → BOTH TERMINAL
```
- **api: SUCCESS**, deployed `commitHash = 1b5a184` == merge SHA ✓ (no stale-revision)
- **web: SUCCESS**, deployed `commitHash = 1b5a184` == merge SHA ✓ (no stale-revision)

## Action 3 — Health endpoint probes (serving-revision confirmation)
- web `/` → **HTTP 200**
- web `/health` → **HTTP 200**
- api `/health` → **HTTP 200**, body `{"status":"ok","service":"studyhall-api","version":"0.0.1"}`
- api `GET /servers/discover` → **HTTP 401** (route serves, auth-gated — NOT 500; the new write-half controller mounted cleanly)

New revision (1b5a184) confirmed serving on both services: deploy-state = SUCCESS at the merge commit AND health 200 on both. No stale-revision race.

## Action 4 — Async handoff
Not triggered — both targets reached terminal SUCCESS inline in 91s (< 10 min). No MONITOR task needed.

## Action 5–7 — Canary
`canary_status: skipped` — real-user traffic below `canary_threshold_dau: 1000` (StudyHall pre-validation, zero DAU). T-block synthetic probes are the post-deploy signal.

## Stage-exit checklist
- [x] Deploy verification reads authoritative Railway deployment-state endpoint, NOT self-reported /healthz.
- [x] New revision confirmed serving before deploy called done — deploy-state SUCCESS at commit 1b5a184 == merge SHA on both; health 200 both (no stale-revision race).
- [x] Migrations: N/A this wave (no new schema; is_public/description/topic exist from wave-67 0024). Nothing applied because nothing pending — verified, not skipped.
- [x] Per-service env scope correct — api serves (health 200, discover 401 = auth wired = DB/SuperTokens present); web serves static (200) with no DB creds. No env-var-missing crash on either (both reached SUCCESS + serve traffic).
- [x] Deploy monitored via inline poll with explicit success (status==SUCCESS) / failure (status IN FAILED/CRASHED/REMOVED/SKIPPED) / 10-min cap conditions.
- [x] Rollback path to previous good revision (43d20b2) identified + reachable before cutover.
- [x] Secrets: none committed; Railway env vars server-side; no secret in deploy path.
- [x] Block did not preemptively pause — exit is the deploy-state verdict.

```yaml
ci_stage_verdict: PASS
armed_verification_failed: false
verdict_source: railway
verdict_evidence:
  - "api: deployment SUCCESS, commitHash 1b5a184 == merge SHA (deployments GraphQL state endpoint)"
  - "web: deployment SUCCESS, commitHash 1b5a184 == merge SHA"
  - "api /health: 200 {status:ok}; api /servers/discover: 401 (route serves, not 500)"
  - "web /: 200; web /health: 200"
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 1b5a184746978134b8c295f721d0dc63ce464d0f, health_url: "https://api-production-b93e.up.railway.app/health", verified_at: "2026-07-06T21:41Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: 1b5a184746978134b8c295f721d0dc63ce464d0f, health_url: "https://web-production-bce1a8.up.railway.app/health", verified_at: "2026-07-06T21:41Z"}
async_monitor_id: ""
canary_status: skipped
canary_skip_reason: "DAU below threshold (~0 < 1000); T-block synthetic probes are the post-deploy signal."
rollback_target:
  api: "43d20b2 (deployment 65398968-1a90-463e-a58a-d5570ea7a776)"
  web: "43d20b2 (deployment a6c1cb71-ea07-409a-a7ef-61836a19aa6f)"
note: "Both services (api + web) deployed at merge SHA with commitSha passed explicitly (stale-revision guard). No migration this wave. Canary skipped per traffic threshold."
head_signoff:
  verdict: APPROVED
  stage: C-2
  reviewers: {}
  failed_checks: []
  rationale: >
    Both changed services deployed at the merge commit 1b5a184 via serviceInstanceDeploy with
    commitSha passed explicitly — closing the wave-67 stale-revision trap. Verification is
    authoritative: the Railway deployment-state endpoint reports SUCCESS on both with
    commitHash == merge SHA, and health probes confirm the new revision is the one serving
    (web / + /health 200; api /health 200; api /servers/discover 401 = the wave's new write-half
    route mounted and auth-gated, not crashing). No migration this wave (columns exist from
    wave-67 0024), so nothing to sequence. A one-action rollback to the previous good revision
    (43d20b2) was identified and confirmed reachable before cutover. Canary skipped below the
    1000-DAU threshold. No false-green: deploy-state, commit match, and serving-revision all agree.
  next_action: PROCEED_TO_T_BLOCK
```

## Block exit / handoff
```yaml
cicd_block_status: complete
pr_number: 83
pr_url: https://github.com/arina477/test_claudomot/pull/83
merge_commit: 1b5a184746978134b8c295f721d0dc63ce464d0f
deploy_targets:
  - {platform: railway, service: api, state: SUCCESS, commit: 1b5a184, verified_at: "2026-07-06T21:41Z"}
  - {platform: railway, service: web, state: SUCCESS, commit: 1b5a184, verified_at: "2026-07-06T21:41Z"}
canary_status: skipped
ready_for_test: true
```
→ next block: T (Test).
