# C-1 — PR, CI & merge (wave-5, M1 hardening)

## Branch push
- Branch `wave-5-m1-hardening` pushed to origin (HEAD `5eb014e`, the B-6 gate commit — prompt cited `7bd1a42` which was one commit behind; B-6 APPROVED commit is the correct ship point).
- Branch was 0 behind / 13 ahead of origin/main at push; clean tree.

## PR
- PR #12 — https://github.com/arina477/test_claudomot/pull/12
- Title: `feat(hardening): rate-limit + avatar-2MB + version + CI(node-20,e2e) + branch-protection (#wave-5)`
- Cited 6 task ids: 839af17f (rate-limit), e38c306e (/health version), 84e09891 (avatar 2MB), a7667fb7 (CI node-20), c51589cd (CI e2e), branch-protection.

## Branch protection (active on main this wave)
- Required checks (5): lint, typecheck, test, build, secret-scan. `strict: true`. `required_approving_review_count: 0`.
- e2e present but NOT a required check (non-blocking — targets live web).

## CI results (run 28373251725, headSha 5eb014e)
| Check | Required | Result | Duration |
|---|---|---|---|
| lint | yes | pass | 20s |
| typecheck | yes | pass | 27s |
| test (postgres:16, pnpm test:ci) | yes | pass | 56s |
| build | yes | pass | 29s |
| secret-scan (gitleaks) | yes | pass | 5s |
| e2e (chromium vs live web) | no | pass (2 passed) | 1m11s |

- Run-level conclusion: success.
- Non-fatal annotations: Node-20 deprecation warnings on `pnpm/action-setup@v4` + `gitleaks/gitleaks-action@v2` (those actions still target Node-20, forced to Node-24). Cosmetic; a follow-up micro-bump, not a defect.

## Merge
- mergeStateStatus CLEAN, mergeable MERGEABLE before merge.
- Mode `automatic` → bot self-merge sanctioned (0 required approvals + 5 green checks). Branch protection ALLOWED the squash merge.
- `gh pr merge 12 --squash --delete-branch` → state MERGED, mergedAt 2026-06-29T12:51:50Z.
- Merge commit SHA: `00173317ef341201f511f60d232eb45f196e7c54` (`0017331`).

## Stage-exit checklist
- [x] 5 required CI jobs ran + passed (not skipped/cancelled).
- [x] test job ran against Postgres v16, executed test:ci (integration/offline).
- [x] gitleaks secret-scan ran + passed.
- [x] CI least-privilege (`permissions: contents: read`).
- [x] PR off base, targets main, no direct push.
- [x] No new migration without committed SQL (no migration files in branch).

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 12 state MERGED"
  - "gh pr checks 12: lint/typecheck/test/build/secret-scan all pass; e2e pass (non-required)"
  - "merge commit: 00173317ef341201f511f60d232eb45f196e7c54"
pr_number: 12
pr_url: https://github.com/arina477/test_claudomot/pull/12
branch: wave-5-m1-hardening
required_checks: [lint, typecheck, test, build, secret-scan]
optional_checks: [{e2e: PASS}]
fix_up_cycles: 0
final_commit_sha: 5eb014e
merge_strategy: squash
merge_commit_sha: 00173317ef341201f511f60d232eb45f196e7c54
rebase_cycles: 0
note: "Branch protection allowed bot squash-merge (automatic mode, 0 approvals, 5/5 checks green). e2e non-blocking, observed pass."
```
