# V-3 Fast-fix — CI landing + web deploy (wave-34)

**Head:** head-ci-cd (C-block spawn-pattern; C-1 → C-2 direct).
**Mode:** automatic (`--auto` merge authorized — BOARD owns approval).
**Change:** wire the audio-only manual toggle into the voice control cluster. WEB-ONLY (`apps/web/src/shell/VoiceStudyRoom.tsx` + `voice-study-room.test.tsx`). No api / DB / migration surface touched.
**Origin:** jenny V-1 REJECT — spec-2 AC1's audio-only fallback was un-invokable (`enterManual` implemented but never wired to a control). This fast-fix wires it to a control-cluster **Audio-only** toggle so AC1's manual path works and AC2/AC3/AC5 become verifiable.
**Refs task:** 61e52c3e.

---

## Environment note (mechanism divergence — resolved)

Task brief + auto-memory said `railway up --service web --detach` (CLI-push). **The `railway` CLI is not installed in this environment** (`railway: command not found`). The brain's authoritative Railway path is **GraphQL-only** (`claudomat-brain/monitors/railway-deploy.md`), authenticated with the `Project-Access-Token` header. The memory note's *semantic* holds — Railway on this project is **not git-triggered**, so merge-to-main does NOT auto-deploy; deploy must be explicitly initiated. The *mechanism* used here is the GraphQL `serviceInstanceDeployV2` redeploy mutation against the `web` service, not the CLI binary. Deploy verification reads the deployment-state endpoint (not `/healthz`), per the anti-false-green contract.

- Railway project: `app-arina-89ejyn` (`ae55c191-4631-4224-b7b2-42f329ed48d7`), env `bfdcc42f-fe5b-4198-a47a-b08f5940975d`.
- web service id: `107d4255-422a-4b72-b138-0647f9192fe4`.

---

## C-1 — PR, CI & merge

| Item | Value |
|---|---|
| Repo | `arina477/test_claudomot` |
| Branch | `wave-34-v3-audio-only-toggle` (branched off `main`, targeted `main` — no direct-to-main bypass) |
| PR | **#48** — https://github.com/arina477/test_claudomot/pull/48 |
| PR title | `fix: wire audio-only manual toggle (wave-34 V-3 fast-fix)` |
| Fast-fix commit | `510e0e8` (2 files, +132/−4; web-only, no migration) |
| Green run | GitHub Actions run `28592137429` |

### Required checks — all green (first pass)

| Check | Result | Duration |
|---|---|---|
| lint | pass | 24s |
| typecheck | pass | 30s |
| test (Postgres v16 service; `pnpm test:ci` — units + integration/offline) | pass | 1m12s |
| build | pass | 34s |
| e2e | pass | 49s |
| boot-probe | pass | 58s |
| secret-scan (gitleaks — blocking) | pass | 8s |

Known flake (`server-roles.test.tsx` cross-isolation) **did not fire** — `test` passed on first attempt. No re-run needed. `fix_up_cycles: 0`.

### Merge

- Mergeable state pre-merge: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- Merge: `gh pr merge 48 --squash --delete-branch --auto` (automatic mode authorizes `--auto`).
- PR state: **MERGED** at 2026-07-02T13:04:39Z.
- Merge commit SHA: **`6ddaddbcdff24df9e70021b3959866418911f212`**.
- Local `main` fast-forwarded to `6ddaddb`; origin branch `wave-34-v3-audio-only-toggle` deleted (confirmed via `git ls-remote` empty).

---

## C-2 — Deploy & verify (WEB only)

api was NOT redeployed — the change is web-only (diff touches only `apps/web/**`); redeploying api would be a needless cutover risk. Deploy scope correctly limited to `web`.

### Stale-revision guard

- **Baseline** web deploy (pre-deploy): `e211f14d-49a0-4a36-bd90-d5c66dd31f1e` (SUCCESS, 12:27:13Z, digest `sha256:d23f0a29...`). Captured before triggering so a false-green (old revision re-served) cannot pass.
- Redeploy triggered via GraphQL `serviceInstanceDeployV2(serviceId, environmentId)` → created **fresh** deploy `9b257db7-8ff9-49d1-bd6e-b3f2e805071f` (reason `redeploy`, 13:05:03Z).

### Verification (authoritative deployment-state endpoint, not /healthz)

| Gate | Result |
|---|---|
| Fresh deploy id ≠ baseline | PASS — `9b257db7` ≠ `e211f14d` |
| Fresh deploy status = SUCCESS | PASS — polled BUILDING → DEPLOYING → SUCCESS in ~81s |
| Fresh deploy is the LATEST (serving) revision | PASS — `deployments(first:1)[0] = 9b257db7` |
| Genuine new build (not cached old revision) | PASS — new image digest `sha256:265659726bae4dea21fedc122365fa5788093c309f395679df45921adc362498` ≠ baseline `sha256:d23f0a29...` |
| web root HTTP | PASS — `HTTP 200` at https://web-production-bce1a8.up.railway.app/ |
| env-var scope (target service) | PASS — no new env vars; web config unchanged (Dockerfile builder `apps/web/Dockerfile`); web holds no DB creds |
| Rollback path reachable | PASS — baseline SUCCESS deploy `e211f14d` remains one-action redeployable |

### Poll evidence (bounded background loop; success + all failure states covered)

```
[t=0s]  fresh(9b257db7) status=BUILDING
[t=20s] fresh(9b257db7) status=BUILDING
[t=40s] fresh(9b257db7) status=BUILDING
[t=61s] fresh(9b257db7) status=DEPLOYING
[t=81s] fresh(9b257db7) status=SUCCESS
DEPLOY_SUCCESS id=9b257db7
```

Success condition: `deployments.edges[<fresh>].node.status == "SUCCESS"`. Failure condition: status ∈ {FAILED, CRASHED, REMOVED, SKIPPED}. Timeout budget: 600s (10-min cap on inline poll; typical Railway deploy 2-5 min — resolved in 81s, well within).

### Canary (C-3)

`canary_status: skipped` — project real-user traffic is below the 1000-DAU threshold (`project.yaml: deploy_targets[].canary_threshold_dau: 1000`; StudyHall is pre-validation, zero usage data). Deploy verification phase ran in full; canary sub-actions skipped per block dispatcher. Sentry event flow not asserted (pre-launch, no live user traffic to observe).

---

## Stage-exit checklist

- [x] All required CI jobs ran + passed (lint, typecheck, test, build, e2e, boot-probe, secret-scan) — none skipped/cancelled/no-op.
- [x] test job ran against Postgres v16 service and executed integration/offline suites (`pnpm test:ci`), not just units.
- [x] gitleaks secret-scan ran + passed — no secret in the diff.
- [x] CI permissions least-privilege — not modified by this fast-fix; no job scope broadened.
- [x] PR branched off `main`, targeted `main`; no direct-to-main bypass.
- [x] No new migration present (web-only diff; no `drizzle/migrations` change).
- [x] Deploy verification reads Railway deployment-state endpoint, NOT self-reported /healthz.
- [x] New revision confirmed serving traffic before deploy called done (latest edge = fresh id; new image digest).
- [x] Migrations n/a — no schema change; nothing to apply.
- [x] Target-service env scope intact — no new env vars; web has no DB creds.
- [x] Deploy monitor declared success_condition + failure_condition + timeout_budget (600s).
- [x] Rollback path identified + reachable before/after cutover (baseline `e211f14d`).
- [x] Secrets set via env / not committed; no generated secrets this fast-fix.
- [x] Canary window: skipped per sub-threshold traffic (recorded with reasoning).
- [x] No preemptive pause — block exit is the merge + deploy-state verdict.

---

## Verdict

```yaml
ci_stage_verdict: PASS
verdict_source: gh+railway
verdict_evidence:
  - "gh pr view 48 state MERGED; merge commit 6ddaddbcdff24df9e70021b3959866418911f212"
  - "gh pr checks 48 — all 7 required checks passed (lint/typecheck/test/build/e2e/boot-probe/secret-scan)"
  - "railway GraphQL deployments(first:1)[0] = 9b257db7 status=SUCCESS (fresh id != baseline e211f14d)"
  - "new image digest sha256:265659726bae4dea21fedc122365fa5788093c309f395679df45921adc362498 != baseline sha256:d23f0a29..."
  - "curl https://web-production-bce1a8.up.railway.app/ -> HTTP 200"
pr_number: 48
pr_url: https://github.com/arina477/test_claudomot/pull/48
branch: wave-34-v3-audio-only-toggle
required_checks: [lint, typecheck, test, build, e2e, boot-probe, secret-scan]
optional_checks: []
fix_up_cycles: 0
merge_strategy: squash
merge_commit_sha: 6ddaddbcdff24df9e70021b3959866418911f212
deploy_targets:
  - platform: railway
    service: web
    state: SUCCESS
    deployment_id: 9b257db7-8ff9-49d1-bd6e-b3f2e805071f
    image_digest: sha256:265659726bae4dea21fedc122365fa5788093c309f395679df45921adc362498
    root_http: 200
    verified_at: 2026-07-02T13:07Z
canary_status: skipped
api_redeployed: false
rollback_target: e211f14d-49a0-4a36-bd90-d5c66dd31f1e
note: "railway CLI absent in env; deployed + verified via Railway GraphQL (Project-Access-Token). Web-only change; api untouched."

head_signoff:
  verdict: APPROVED
  stage: V-3-fastfix-ci
  reviewers: {}
  failed_checks: []
  rationale: >
    PR #48 merged to main (squash, 6ddaddb) with all seven required CI checks green
    on first pass — including the Postgres-v16 integration/offline test job and the
    blocking gitleaks secret-scan. Web-only fast-fix deployed to Railway via the
    authoritative GraphQL deployment-state path (CLI absent): a fresh deployment id
    (9b257db7, distinct from baseline e211f14d) with a new image digest reached
    SUCCESS and is the latest revision serving traffic; web root returns 200. No
    stale-revision race, no false-green. api correctly not redeployed (change is
    web-only). Canary skipped per sub-1000-DAU traffic. Rollback to baseline
    e211f14d is one-action reachable. Fast-fix landed live and verified.
  next_action: PROCEED_TO_V_REVERIFICATION
```

---

## Handoff / carry

The fast-fix is **MERGED + CI-green + web-deployed-SUCCESS + serving**. This unblocks the V-block re-verification the fast-fix exists to enable:

1. **V re-verification** — re-run karen + jenny against the now-reachable manual audio-only path (spec-2 AC1 manual, AC2/AC3/AC5) on the live web deploy.
2. **head-verifier gate** — V-block final verdict once re-verification lands.
3. **N-block** — close milestone M6 → open M7 **only once** audio-only is confirmed user-reachable + verified by the V-block.

Rollback target if re-verification surfaces a regression: redeploy `e211f14d` (last known-good web revision).
