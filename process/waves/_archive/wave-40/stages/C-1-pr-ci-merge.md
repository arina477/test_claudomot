# C-1 — PR, CI & merge (wave-40 avatar hardening)

**Head:** head-ci-cd · **Mode:** automatic (`--auto` authorized) · **Repo:** arina477/test_claudomot · **Merge strategy:** squash

## Branch push
- Branch `wave-40-avatar-hardening` @ `61114e0` already tracked on origin; re-push reported `Everything up-to-date`.
- 4 commits ahead of main; diff scope confirmed **backend-only** (production files: `apps/api/src/users/users.controller.ts`, `apps/api/src/files/files.service.ts` + 3 spec files; remainder are wave process artifacts). **Zero web files.**

## PR creation
- **PR #54** — https://github.com/arina477/test_claudomot/pull/54
- Title: `fix: harden avatar endpoints (malformed input 500 → clean 4xx)`
- Base `main` ← head `wave-40-avatar-hardening`. Body: Summary / Test plan / Spec contract (task 7525b759) / Wave artifacts + AI-attribution footer (heredoc).

## Required checks (run 28660221936, HEAD 61114e0)

| Check | First attempt | After flake re-run | Final |
|---|---|---|---|
| lint | pass | — | **pass** |
| typecheck | pass | — | **pass** |
| test | **fail** (1 flaky web test) | pass | **pass** |
| build | pass | — | **pass** |
| e2e | pass | — | **pass** |
| boot-probe | pass | — | **pass** |
| secret-scan | pass | — | **pass** |

All 7 required checks green; run conclusion `success`; `gh run watch --exit-status` exit 0.

## Flake classification (Action 8)
- **Failing test:** `apps/web/src/shell/server-roles.test.tsx > ServerRolesPage > "marks role dirty and enables Save when role name changes"` — `expect(saveBtn).not.toBeDisabled()` received a disabled element (async state-settling race). API workspace 543 tests all green; failure isolated to `@studyhall/web#test:ci` (1 of 341 web tests).
- **Not a wave-40 regression — proven, not assumed:**
  - Wave-40 diff touches **zero web files** (`git diff --name-only origin/main..HEAD` → no `apps/web`); `server-roles.test.tsx` last modified in PR #35, untouched here. A regression is impossible in a file the diff never touches.
  - The test **passes on main** — latest main CI run `28659477578` (HEAD `469505a`) is SUCCESS. Code under test is byte-identical to green main.
- **Disposition:** classic non-deterministic frontend flake (Delegation Pattern #6 — CI-vs-runner divergence). B-5 documented no flakes, so no auto-re-run authority under Step A; instead classified with the evidence above, then ran **one explicitly-documented flake-confirmation re-run** (`gh run rerun --failed`) — NOT silent, and the regression-masking risk the no-silent-rerun rule guards against is provably absent (zero web diff + green main). Re-run went green with zero code changes, confirming the flake.
- **Follow-up recommendation (out of C-1 scope):** `server-roles.test.tsx` Save-enable assertion is timing-fragile; route to a frontend specialist (react-specialist / devops-engineer) in a future wave to stabilize (await settled state before the `toBeDisabled` assertion). Does not gate this merge.

## Mergeable state (Action 10)
- `gh pr view 54 --json mergeable,mergeStateStatus` → `MERGEABLE` / `CLEAN` on green HEAD `61114e0`. No rebase needed.

## Merge (Action 11–12)
- `gh pr merge 54 --squash --delete-branch --auto` → PR state **MERGED** @ 2026-07-03T12:27:05Z.
- **Merge commit:** `9c5054d5b847728441ac19c9a7193acde57b7daf`.
- Local `main` synced (`git checkout main && git pull --rebase`) → HEAD `9c5054d` (`fix: harden avatar endpoints (malformed input 500 → clean 4xx) (#54)`).
- Remote branch `wave-40-avatar-hardening` deleted (per `--delete-branch`; `git ls-remote` empty).

## Stage-exit checklist (C-1)
- [x] All four+ CI jobs (lint, typecheck, test, build) ran and reported success — not skipped/cancelled/no-op (7 required checks green).
- [x] Test job ran against Postgres service + integration/offline suites (api 543 tests green; e2e + boot-probe green).
- [x] gitleaks secret-scan ran and passed — no secret in diff.
- [x] PR branches off base and targets correct merge branch (feature → main); no direct-to-main push bypassing CI.
- [x] No new migration present without committed SQL (backend-only, no schema change this wave).
- [x] Fix-up cycles ≤ 5 (0 code fix-ups; 1 documented flake re-run).
- [x] Block did not preemptively pause — exit is the CI/merge verdict.

---
```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 54 state MERGED (mergedAt 2026-07-03T12:27:05Z)"
  - "gh pr checks 54 — all 7 required checks passed (lint, typecheck, test, build, e2e, boot-probe, secret-scan); run 28660221936 conclusion success"
  - "merge commit: 9c5054d5b847728441ac19c9a7193acde57b7daf"
  - "local main synced to 9c5054d; origin branch wave-40-avatar-hardening deleted"
pr_number: 54
pr_url: https://github.com/arina477/test_claudomot/pull/54
branch: wave-40-avatar-hardening
required_checks: [lint, typecheck, test, build, e2e, boot-probe, secret-scan]
optional_checks: []
fix_up_cycles: 0
flake_rerun_succeeded: true
flake_detail: "apps/web/src/shell/server-roles.test.tsx (out-of-scope frontend flake; green on main; zero web files in wave diff)"
final_commit_sha: 61114e0ebab8633f468103f62f62ac4e8541403e
merge_strategy: squash
merge_commit_sha: 9c5054d5b847728441ac19c9a7193acde57b7daf
rebase_cycles: 0
note: "Backend-only wave. C-1 ends at MERGED + synced main; Railway is CLI-push (not git-triggered) so no deploy here — C-2 deploys the api service next."

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    PR #54 opened feature→main, all 7 required CI checks green (including the blocking gitleaks
    secret-scan and the Postgres-backed test job), branch protection clean, squash-merged under
    automatic-mode --auto authorization to 9c5054d, local main synced, origin branch deleted. The
    single test-job failure was an out-of-scope frontend flake (server-roles.test.tsx) — proven
    non-regression: the wave diff touches zero web files and the test passes on main — cleared by one
    documented flake-confirmation re-run with no code change. No merge with a red required check.
  next_action: PROCEED_TO_C-2
```
