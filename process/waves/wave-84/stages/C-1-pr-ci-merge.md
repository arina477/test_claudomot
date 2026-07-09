# C-1 — PR, CI & merge (wave-84)

**Owner:** head-ci-cd
**Branch:** `wave-84-token-xss-hardening` (HEAD `a0eb37de` after ci.yml env fix-up; was `97d4c6bf`)
**Repo:** `arina477/test_claudomot`
**B-6 entry:** APPROVE

## Timeline

1. **Push** — branch already on origin; `git push` reported `Everything up-to-date`. No force-push (compliant — no squash mechanic between B-6 and C-1).
2. **PR created** — #103 via proper `gh pr create` flow (base `main`, head `wave-84-token-xss-hardening`). NO `git push HEAD:main` (wave-83 lesson honored).
   - URL: https://github.com/arina477/test_claudomot/pull/103
   - Title: `fix(auth): explicit header token transport + cross-origin-safe web CSP (wave-84)` (66 chars)
3. **Required checks identified** (6 required + e2e non-required): lint, typecheck, test, build, secret-scan, boot-probe.
4. **Watched** run `29026976694` to completion via `gh run watch --exit-status`.

## Required-check results (PR HEAD `97d4c6bf`, run 29026976694)

| Check | Required | Result | Duration |
|---|---|---|---|
| lint | yes | **PASS** | 33s |
| typecheck | yes | **PASS** | 42s |
| test | yes | **PASS** | 2m0s |
| secret-scan | yes | **PASS** | 6s |
| build | yes | **FAIL** | 28s |
| boot-probe | yes | **FAIL** | 54s |
| e2e | no (optional) | PASS | 52s |

## Failure analysis — NOT a flake

Both `build` and `boot-probe` fail at the same step: `@studyhall/web#build` (`vite build` in `apps/web`). Neither failing check is in the B-5 `flakes_documented` ledger (documented flakes are test-layer only: `assignments.test.tsx`, `study-timer.test.tsx`, `server-roles.test.tsx`). Flake re-run (Action 8 Step A) does **not** apply — this is a deterministic, real failure. Per Iron Law: NOT fixed directly; classified and routed.

### Root cause

The B-6 CSP hardening (commit `8d3366f3`) added a **fail-on-empty-api-origin** guard to the web app's build-time CSP Vite plugin. Verbatim build error:

```
CSP build error: VITE_API_ORIGIN is empty at production build time. A self-only
Content-Security-Policy would block the api, realtime, and storage — bricking the
deployed SPA. Set VITE_API_ORIGIN (and VITE_STORAGE_ORIGIN / VITE_LIVEKIT_URL)
as build-time env before `vite build`.
  file: apps/web/index.html   [vite-plugin-pwa:build → buildEnd hook]
[ELIFECYCLE] Command failed with exit code 1.
```

The CI workflow `.github/workflows/ci.yml` runs `pnpm build` in **both** the `build` job (line 64) and the `boot-probe` job (line 92) **without setting any `VITE_*` env vars**. `grep -rn 'VITE_' .github/workflows/` returns zero matches. Before this wave the empty-origin case fell back to a self-only CSP and the build succeeded; the new guard now hard-fails by design. The guard is correct (it prevents shipping a bricked SPA); the CI workflow simply predates it and was never updated to supply the origin.

This is the mirror image of the deploy-actions note already in the PR body: the deployed **web build** needs `VITE_API_ORIGIN` + `VITE_STORAGE_ORIGIN` + `VITE_LIVEKIT_URL`. CI's build jobs need the same (real or placeholder https/wss values sufficient to pass the non-empty guard).

### Classification (per triage-routing-table)

- **Symptom:** Build failure, env-related (CI workflow does not provide required build-time env the new guard demands).
- **Tag:** CI / build-env — routes to a CI-workflow fix (add `VITE_API_ORIGIN` [+ `VITE_STORAGE_ORIGIN` / `VITE_LIVEKIT_URL`] env to the `build` and `boot-probe` jobs in `.github/workflows/ci.yml` before `pnpm build`). Per C-1 Action 8 Step B, a build failure classified env-related routes to **B-0 (env/CI wiring)**. The fix is a `.github/workflows/ci.yml` edit (env block on both jobs), not a code change.

### Exact fix locations (for the routed fixer — not applied here)

- `.github/workflows/ci.yml` **build** job, before `- run: pnpm build` (line 64): add an `env:` block supplying `VITE_API_ORIGIN` (and `VITE_STORAGE_ORIGIN`, `VITE_LIVEKIT_URL`).
- `.github/workflows/ci.yml` **boot-probe** job, before `- run: pnpm build` (line 92): same `env:` block.
- Values may be placeholders sufficient to satisfy the non-empty guard (e.g. `https://api.example.invalid`, `https://storage.example.invalid`, `wss://livekit.example.invalid`) since these jobs only compile the SPA / boot the API — they do not exercise the real origins. Alternatively align to the real deploy origins already known to C-2.

## Fix-up cycle 1 — ci.yml build-time VITE env (resolved the BLOCKED state)

The routed CI-workflow fix landed as commit **`a0eb37de`** on the branch (adds the `VITE_*` build-time origins to the `build` and `boot-probe` jobs in `.github/workflows/ci.yml`, satisfying the B-6 fail-on-empty-api-origin guard). Push of `a0eb37de` triggered a fresh CI run **29027378262** on the updated PR HEAD.

- Re-watched via `gh run watch 29027378262 --exit-status` → exit 0 (all jobs green).
- Build step `Build all packages` and boot-probe now PASS — the env fix was sufficient; no second cycle needed.
- No flake re-run: the prior failure was deterministic (env), not in the documented-flake ledger.

## Required-check results — RE-RUN (PR HEAD `a0eb37de`, run 29027378262)

| Check | Required | Result | Duration |
|---|---|---|---|
| lint | yes | **PASS** | 22s |
| typecheck | yes | **PASS** | 45s |
| test | yes | **PASS** | 2m5s |
| secret-scan | yes | **PASS** | 7s |
| build | yes | **PASS** | 36s |
| boot-probe | yes | **PASS** | 1m8s |
| e2e | no (optional) | PASS | 1m12s |

All 6 required checks green (+ optional e2e green).

## Merge

`gh pr merge 103 --squash --delete-branch` → PR state **MERGED** (mergedAt 2026-07-09T14:57:54Z), branch deleted on origin. NO `git push HEAD:main` (wave-83 lesson honored). Local main synced via `git checkout main && git pull --rebase` → HEAD at merge commit.

## Verdict

```yaml
ci_stage_verdict: PASS                   # all 6 required green on run 29027378262; PR merged
verdict_source: gh
verdict_evidence:
  - "gh pr checks 103 (HEAD a0eb37de): lint/typecheck/test/secret-scan/build/boot-probe ALL PASS; e2e (optional) PASS"
  - "gh run watch 29027378262 --exit-status → exit 0 (all jobs green)"
  - "fix-up cycle 1: commit a0eb37de added VITE_* build-time env to ci.yml build+boot-probe jobs → satisfies B-6 fail-on-empty-api-origin guard; build 36s / boot-probe 1m8s now PASS"
  - "gh pr view 103: state MERGED, mergedAt 2026-07-09T14:57:54Z, mergeCommit d1f99f9dafd38f5d39bbc8448539e6900189dd50"
pr_number: 103
pr_url: https://github.com/arina477/test_claudomot/pull/103
branch: wave-84-token-xss-hardening
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
required_checks_pass: [lint, typecheck, test, secret-scan, build, boot-probe]
required_checks_fail: []
optional_checks: ["e2e: PASS"]
flake_rerun_applied: false               # prior failure deterministic (env), not a documented flake
fix_up_cycles: 1                          # ci.yml VITE_* env block added on build+boot-probe (commit a0eb37de)
fix_up_detail: "cycle 1 — .github/workflows/ci.yml build+boot-probe jobs given VITE_API_ORIGIN [+VITE_STORAGE_ORIGIN/VITE_LIVEKIT_URL] build-time env; resolved B-6 CSP fail-on-empty-api-origin build failure. Fix authored/routed per Iron Law (not by head-ci-cd); C-1 re-watched the resulting run to green."
final_commit_sha: a0eb37de3c173817fe0a0d2274478c43569dc12f   # green PR HEAD that merged
merge_strategy: squash
merge_commit_sha: d1f99f9dafd38f5d39bbc8448539e6900189dd50
rebase_cycles: 0                          # PR was not BEHIND; direct squash-merge
note: "MERGED. Fix-up cycle 1 (ci.yml VITE_* build env, commit a0eb37de) cleared the earlier build+boot-probe failure; fresh run 29027378262 green on all 6 required checks. Squash-merged, branch deleted, local main rebased to merge commit d1f99f9. No flake re-run, no rebase, no infra cancellation."
```

## Exit criteria status

- [x] Branch pushed to origin (fix-up commit a0eb37de)
- [x] PR created and OPEN → now MERGED (#103)
- [x] All required checks green — **YES** (run 29027378262: all 6 required PASS)
- [x] Fix-up cycle count ≤ 5 (1)
- [x] PR state MERGED — **YES** (d1f99f9)
- [x] Local main synced — rebased to merge commit d1f99f9
- [x] Branch deleted on origin — `--delete-branch`
- [x] Deliverable carries verdict (PASS)
