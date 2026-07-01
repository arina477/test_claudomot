# C-1 — PR, CI & merge (wave-23)

> Block C (CI/CD), stage C-1. Delegated assignment-organizer authz — M5 bundle 2.
> Owner: head-ci-cd. Mode: automatic (`--auto` merge authorized).

## Wave scope

Delegated assignment-organizer authz. Two specs:
1. **8aa67564** (primary) — dedicated `manage_assignments` RBAC permission split from `manage_channels`. `Permission` union 4→5; `roles.manage_assignments` column via migration 0011 + backfill; role DTOs + `roleToDto`; single `assertOrganizer` call-site swap; role-editor checkbox.
2. **edbdea8f** (claimed sibling) — `GET /servers/:serverId/me/permissions` (session-scoped effective permissions); `AssignmentsPanel` CTA gated on `owner || manage_assignments`.

B-6 exited APPROVE (`/review`: 0 critical / 0 high / 0 medium — both authz boundaries proven airtight). 395 api + 216 web unit green locally; repo typecheck + lint clean.

## Action log

### Action 1 — Push branch
Branch `wave-23-manage-assignments` already pushed (B-block commits + deliverables). Confirmed local HEAD == `origin/wave-23-manage-assignments` at `17185a8`. No re-push required.

### Actions 2–5 — PR created
- **Title:** `feat: dedicated manage_assignments permission + /me effective-permissions` (66 chars, < 70).
- **PR:** #35 — https://github.com/arina477/test_claudomot/pull/35
- Body: Summary + Test plan + Spec contract (primary 8aa67564, claimed 8aa67564+edbdea8f) + Wave artifacts + Claude Code footer. Heredoc-authored.

### Action 6 — Required checks identified
Branch protection on `main` (`strict: true`) requires 6 contexts:
`lint`, `typecheck`, `test`, `build`, `secret-scan`, `boot-probe`.
`required_approving_review_count: 0` → no human approval gate; `mergeStateStatus: BLOCKED` pre-CI was purely pending checks.
`e2e` also runs on the PR but is **NOT** in the required-context set → optional (recorded, not gated on).

### Action 7 — Watched the run
Single workflow run `28485682987` (headSha `17185a8`). `gh run watch --exit-status` → exit 0.

### Action 8 — Failures
None. Zero fix-up cycles.

### Action 9 — Green run recorded (CI-PRINCIPLES rule 3 applied)
`gh run watch --exit-status` exit 0 is NOT trusted alone. Verified per-job conclusions from the authoritative `gh run view 28485682987 --json jobs` endpoint:

| Job          | Required? | Per-job conclusion |
|--------------|-----------|--------------------|
| lint         | yes       | success            |
| typecheck    | yes       | success            |
| test         | yes       | success            |
| build        | yes       | success            |
| secret-scan  | yes       | success            |
| boot-probe   | yes       | success            |
| e2e          | no (opt)  | success            |

Run-level: `status: completed`, `conclusion: success`, `headSha: 17185a8b1dcaff28160660f7fbf7a8d76085ebdf` (matches PR HEAD — no stale-run false-green). All 6 required jobs individually `success`. The real-Postgres integration tier (postgres:16 service, `DATABASE_URL_TEST` set) — which fails locally on ECONNREFUSED — ran green in CI as expected.

### Action 10 — Mergeable state
Post-CI: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, `state: OPEN`.

### Action 11 — Merge
`gh pr merge 35 --squash --delete-branch --auto` (automatic mode authorizes `--auto`). Merged immediately (not queued).
- Merge commit: `489c86aab4fe73a22d1d67de5a91ff901f86a2c5`
- mergedAt: 2026-07-01T00:49:58Z
- Remote branch `wave-23-manage-assignments` deleted (API returns 404).

### Action 12 — Local main synced
`git checkout main && git pull --rebase` → fast-forward `38fb85e..489c86a`. Local HEAD == `489c86a` == merge commit. Migration 0011 (`0011_rainy_wild_child.sql`) + backfill + both authz surfaces confirmed on main.

## Verdict

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 35 state MERGED"
  - "gh run view 28485682987 --json jobs: all 6 required jobs conclusion=success (rule 3 per-job verification, not watch-exit alone)"
  - "run headSha 17185a8 == PR HEAD (no stale-run false-green)"
  - "merge commit: 489c86aab4fe73a22d1d67de5a91ff901f86a2c5"
  - "local main fast-forwarded to 489c86a; remote branch deleted (404)"
pr_number: 35
pr_url: https://github.com/arina477/test_claudomot/pull/35
branch: wave-23-manage-assignments
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks:
  - "e2e: PASS"
fix_up_cycles: 0
final_commit_sha: 17185a8b1dcaff28160660f7fbf7a8d76085ebdf   # green commit pre-merge
merge_strategy: squash
merge_commit_sha: 489c86aab4fe73a22d1d67de5a91ff901f86a2c5
rebase_cycles: 0
note: "e2e job runs on the PR but is not a branch-protection required context; recorded, not gated on."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All six branch-protection-required CI jobs (lint, typecheck, test, build,
    secret-scan, boot-probe) reported per-job conclusion=success on the authoritative
    gh run view --json jobs endpoint — not inferred from gh run watch exit code (rule 3
    false-green guard applied). Run headSha matches PR HEAD (17185a8), so no stale-run
    masking. secret-scan (gitleaks) passed — no secret in the diff. test ran against the
    postgres:16 CI service (integration tier green). No direct-to-main bypass: change
    landed via PR #35 through the full required-check gate. Migration 0011 committed with
    its SQL file. mergeStateStatus CLEAN + 0 required approvals → --auto merged squash
    immediately; local main fast-forwarded to the merge commit; remote branch deleted.
    Zero fix-up cycles.
  next_action: PROCEED_TO_C-2
```
