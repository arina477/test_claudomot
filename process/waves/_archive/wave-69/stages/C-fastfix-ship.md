# C-block — wave-69 V-3 fast-fix ship (web-only)

**Stage:** C-1 PR & CI → C-2 Deploy & verify (fast-fix ship path)
**Scope:** WEB-ONLY (apps/web) — 2 frontend fixes from V-2 triage. No api change, no migration, no schema.
**Files changed:** `apps/web/src/shell/MainColumn.tsx`, `apps/web/src/shell/ChannelSidebar.tsx` (2 files, +56 / -46)

---

## Fixes shipped

| Ref | Fix | File | Commit |
|---|---|---|---|
| **F1** | own-content report leak → `currentUserId=userId` (viewer can no longer be surfaced/reported as own content) | MainColumn.tsx | d6fdfb0 |
| **T6-M1** | mobile inbox off-screen → `createPortal` to `document.body` (overlay renders correctly on small viewports) | ChannelSidebar.tsx | 3270efd |

---

## C-1 — PR & CI

- **PR:** #85 — https://github.com/arina477/test_claudomot/pull/85
- **Title:** `fix: wave-69 fast-fix — own-content report leak + mobile inbox`
- **Base:** `main`  **Head:** `wave-69-fastfix-report-ui`  **Merge strategy:** squash
- **CI run:** https://github.com/arina477/test_claudomot/actions/runs/28835045362
- **Required checks (6/6 PASS, first run — no flake rerun needed):**

  | Check | Result | Duration |
  |---|---|---|
  | lint | pass | 25s |
  | typecheck | pass | 43s |
  | test | pass | 1m47s |
  | build | pass | 38s |
  | secret-scan | pass | 8s (no secret in diff) |
  | boot-probe | pass | 59s |

  Non-required: e2e — pass (52s). Documented study-timer flake did NOT surface; no rerun.

- **Merge:** squash + `--auto` + `--delete-branch`. **State: MERGED** at 2026-07-07T01:31:07Z.
- **Merge SHA:** `b1ff0642037f9c018077c68ea5eb3410de9c0db1`
- Local `main` fast-forwarded `bf7e143 → b1ff064`; HEAD == merge SHA (no direct-to-main bypass; CI gated the merge).

---

## C-2 — Deploy & verify (WEB only)

Railway GraphQL only (`Project-Access-Token` header; no CLI; no `me{}`). Project `ae55c191-4631-4224-b7b2-42f329ed48d7`, env production `bfdcc42f-fe5b-4198-a47a-b08f5940975d`, WEB service `107d4255-422a-4b72-b138-0647f9192fe4`. **api service NOT touched** (no api change, no migration to apply).

- **Rollback target (pre-deploy baseline, reachable before cutover):** web deployment `a034b611` @ SHA `5fdd2bbdf85d647332ce4372ae6296698f23978c` (SUCCESS). Redeployable via `serviceInstanceDeploy(webSid, envId, 5fdd2bb…)` if needed.
- **Deploy trigger:** `serviceInstanceDeploy(107d4255…, bfdcc42f…, b1ff064…)` → `true`, no errors.
- **Deploy monitor (three-condition contract):**
  - `success_condition`: latest web deployment `.status == "SUCCESS"` on merge SHA
  - `failure_condition`: `.status IN (FAILED, CRASHED, REMOVED, SKIPPED)`
  - `timeout_budget`: 900s  |  `poll_delay`: 45s
  - Progression: BUILDING (1s) → DEPLOYING (46s) → **SUCCESS (91s)**
- **New deployment:** `bfb0276a-bb9f-4abf-8b65-7e9d840c49e6`

### Authoritative verification (deploy-state endpoint, NOT /healthz)

- Latest WEB deployment `status = SUCCESS` (read from Railway `deployments` GraphQL).
- **Deployed SHA `b1ff0642037f9c018077c68ea5eb3410de9c0db1` == merge SHA** → serving revision matches deployed revision (no stale-revision race).
- **Web root** `https://web-production-bce1a8.up.railway.app/` → **HTTP 200**.

---

## Anti-pattern guard

- No false-green: verdict read from Railway deployment-state, not self-reported /healthz.
- No stale-revision race: serving SHA confirmed == merge SHA.
- No CI bypass: all 6 required checks ran + passed before merge.
- No secret leakage: secret-scan blocking check passed.
- Rollback path identified + reachable before cutover.
- Migration ordering: N/A — web-only, no migration.

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-fastfix-ship
  reviewers: {}
  failed_checks: []
  rationale: >
    Web-only wave-69 V-3 fast-fix (F1 own-content report leak + T6-M1 mobile inbox)
    shipped clean. PR #85 squash-merged to main after all 6 required CI checks passed
    on the first run (secret-scan blocking-passed; no study-timer flake). WEB service
    deployed via Railway GraphQL for the exact merge SHA; deploy monitor observed
    BUILDING→DEPLOYING→SUCCESS within the 900s budget. Authoritative verification
    confirms the SUCCESS deployment's commitHash equals the merge SHA (no stale-revision
    race) and the web root returns HTTP 200. api untouched (no api change / no migration),
    so no api probe required. Rollback target (a034b611 @ 5fdd2bb) identified and
    reachable before cutover.
  next_action: PROCEED_TO_L-block
evidence:
  pr_number: 85
  pr_url: https://github.com/arina477/test_claudomot/pull/85
  ci_run_id: 28835045362
  ci_outcome: 6/6 required PASS (lint, typecheck, test, build, secret-scan, boot-probe); e2e non-required PASS; no flake rerun
  merge_sha: b1ff0642037f9c018077c68ea5eb3410de9c0db1
  web_deployment_id: bfb0276a-bb9f-4abf-8b65-7e9d840c49e6
  web_deploy_status: SUCCESS
  web_deployed_sha: b1ff0642037f9c018077c68ea5eb3410de9c0db1
  web_deployed_sha_matches_merge: true
  web_http_status: 200
  rollback_target_deployment: a034b611-00c3-4ea4-baeb-b018ad82a514
  rollback_target_sha: 5fdd2bbdf85d647332ce4372ae6296698f23978c
  api_touched: false
status: PASS
```
