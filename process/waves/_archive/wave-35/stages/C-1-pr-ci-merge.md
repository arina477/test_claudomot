# C-1 — PR, CI & merge (wave-35 privacy controls)

**Block:** C (CI/CD) · **Stage:** C-1 · **Head:** head-ci-cd (spawn-pattern)
**Mode:** automatic (`--auto` merge authorized) · **Merge strategy:** squash

## Prerequisites
- B-6 exited APPROVED (head-builder + code-reviewer, no crit/high) — commit `17f0b0a`.
- `project.yaml`: `merge_strategy: squash`, deploy_platform Railway (C-2 concern).

## Action log

### Push (Action 1)
Branch `wave-35-privacy-controls` already pushed; 0 commits ahead of origin. HEAD `17f0b0a` (B-6 gate-passed process commit atop the briefed `c27c4ae`). No force-push needed. Pre-existing uncommitted brain-vendored changes (`.gitignore`, `claudomat-brain/VERSION`, `claudomat-brain/onboarding/stages/stage-v13-handoff.md`) were stashed before the main sync and restored after — never entered the PR (correct: not wave-35 scope).

### PR (Actions 2–5)
- **PR #49** — https://github.com/arina477/test_claudomot/pull/49
- Title: `feat(privacy): wave-35 privacy controls + Sentry observability` (62 chars)
- Base `main` ← head `wave-35-privacy-controls`. Body: Summary / Test plan / Spec contract / Wave artifacts + AI footer (heredoc).

### Required-check identification (Action 6)
Branch protection `required_status_checks.contexts` on `main`: **lint, typecheck, test, build, secret-scan, boot-probe** (6 required). `strict: true`. `required_approving_review_count: 0`. `e2e` present on PR but NOT required → optional.

### Watch (Action 7)
Single workflow run `28603839913` carried all 7 checks. `gh run watch --exit-status` → exit 0. No failures → **no flake re-run needed** (documented `server-roles.test.tsx:199` flake did not fire), **0 fix-up cycles**.

Per-check outcome:
| check | required | outcome | dur |
|---|---|---|---|
| lint | yes | pass | 28s |
| typecheck | yes | pass | 45s |
| test | yes | pass (Postgres container: "Initialize containers" step ran; `pnpm test:ci`) | 1m9s |
| build | yes | pass | 35s |
| secret-scan (gitleaks) | yes | pass — no secret in diff | 8s |
| boot-probe | yes | pass | 59s |
| e2e | no (optional) | pass | 55s |

### Mergeable (Action 10)
`mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, headRefOid `17f0b0a` (matches green run). No rebase needed.

### Merge (Action 11)
`gh pr merge 49 --squash --delete-branch --auto` → exit 0 → PR state **MERGED** at 2026-07-02T16:01:02Z. Merge commit `0c71585cab9b9f9b786d0cee826efc9c386faa09`.

### Sync local main (Action 12)
`git checkout main && git pull --rebase` hit an add/add conflict on `checklist.md`: local main carried 1 unpushed redundant commit (`81ed9f7`, wave-35 P-block plan) already subsumed by the squash merge. Resolved by `git rebase --abort` + `git reset --hard origin/main` — squash merge is authoritative. Local main = `0c71585`. Origin branch deleted (confirmed 404 + empty ls-remote).

## Verdict

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 49 state MERGED (mergedAt 2026-07-02T16:01:02Z)"
  - "gh pr checks 49 — all 6 required checks passed (lint,typecheck,test,build,secret-scan,boot-probe); optional e2e passed"
  - "branch protection required contexts confirmed via repos/.../branches/main/protection"
  - "merge commit: 0c71585cab9b9f9b786d0cee826efc9c386faa09"
  - "origin branch wave-35-privacy-controls deleted (HTTP 404)"
pr_number: 49
pr_url: https://github.com/arina477/test_claudomot/pull/49
branch: wave-35-privacy-controls
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks: [e2e (PASS)]
fix_up_cycles: 0
flake_rerun: none  # documented server-roles.test.tsx:199 flake did not fire
final_commit_sha: 17f0b0a66c659fe108d19d941d316d53b8719f07   # green commit pre-merge
merge_strategy: squash
merge_commit_sha: 0c71585cab9b9f9b786d0cee826efc9c386faa09
rebase_cycles: 0
note: "Pre-existing brain-vendored working-tree changes stashed out of the PR and restored to main post-sync; local main had a redundant unpushed P-block commit resolved via reset --hard to origin/main (squash merge authoritative)."
```

## Exit criteria — all met
- [x] Branch pushed to origin
- [x] PR created and was OPEN on origin
- [x] All 6 required checks green on HEAD `17f0b0a`
- [x] Fix-up cycles ≤ 5 (0)
- [x] PR state MERGED
- [x] Local main synced to merge commit `0c71585`
- [x] Origin branch deleted
- [x] `ci_stage_verdict: PASS`

## Head sign-off

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All 6 branch-protection-required CI jobs (lint, typecheck, test, build, secret-scan,
    boot-probe) actually ran and passed on the PR HEAD — not skipped or cancelled. The test
    job ran against the Postgres service container (Initialize containers step present).
    Gitleaks secret-scan passed (no secret in diff). PR branched off main, targeted main, no
    direct-to-main bypass. Migrations were committed at B-0 (privacy columns on users). No
    documented flake fired, so no silent re-run occurred. Merged via squash + --auto (mode
    authorized) at 0 required approvals; origin branch deleted; local main reset to the
    authoritative squash merge.
  next_action: PROCEED_TO_C-2
```

→ Next: C-2 deploy & verify (Railway — CLI-push per `railway up`, not git-trigger).
