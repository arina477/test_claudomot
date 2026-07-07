# C-1 — PR, CI & Merge (wave-71, M14 Block UI-polish)

Owner: head-ci-cd | Mode: automatic | Date: 2026-07-07

## Scope
GET /blocks enrichment (`listBlocks` LEFT JOIN → blocked user's name + avatar) + state-reflecting
member-row Block↔Unblock toggle via shared `useBlocks` store. **No schema change** (read-side JOIN;
`user_blocks` unchanged). Changed: `apps/api` (blocks.service.ts + blocks.integration.spec.ts),
`apps/web` (useBlocks, MemberListPanel, BlockedUsersPanel, BlockConfirmDialog + tests),
`packages/shared` (blocks DTO).

## PR
- **URL:** https://github.com/arina477/test_claudomot/pull/87
- **Title:** feat: block UI polish (M14) — blocked-user names + state-reflecting toggle for wave-71
- **Base:** main | **Head:** wave-71-block-ui-polish (branch head 26b571b)
- **Merge strategy:** squash + delete-branch (`--auto` authorized under automatic mode)

## CI — run 28842513359 (6 required + e2e)
| check | required | result |
|---|---|---|
| lint | yes | pass (21s) |
| typecheck | yes | pass (39s) |
| test | yes | pass (1m47s) — **on rerun** |
| build | yes | pass (36s) |
| secret-scan | yes | pass (7s) — no secret in diff |
| boot-probe | yes | pass (1m3s) |
| e2e | no | pass (1m3s) |

- Migration guard: `git diff --name-only main...HEAD` → **no migration/SQL files** (consistent with no-schema-change scope). ✓
- `test` job ran against **postgres:16 + DATABASE_URL_TEST**; the 3 new `blocks.integration` cases (GET /blocks enrichment: real name / username fallback / `Unknown user`) executed. ✓
- Branch/merge target: feature → main; no direct-to-main push; all 6 required checks ran (not skipped/cancelled). ✓

### Flake protocol invoked (documented)
- **First run:** 5/6 required pass; `test` FAILED — sole failing file
  `apps/web/src/shell/study-timer.test.tsx` (test "400 from configureStudyTimer renders inline error
  message"; `AssertionError: expected false to be true`). 42 test files passed, 1 failed.
- This is the **documented flake** (`study-timer.test.tsx`), unrelated to wave-71 block-UI changes.
  Per protocol: rerun once (`gh run rerun --failed`).
- **Rerun:** `test` pass. Confirmed flake, not a real regression. No code touched (Iron Law honored).

## Merge
- Merged: **YES** (squash), state MERGED @ 2026-07-07T04:58:40Z
- **Merge SHA: `670c46e4ac0fb7fce1942c28b7c9ccf978909507`**
- origin/main HEAD == 670c46e (`git branch -r --contains 670c46e` → origin/main). Branch deleted.

---
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    PR #87 opened feature→main (squash), all 6 required CI checks green after a single
    documented-flake rerun of study-timer.test.tsx (the sole failure, unrelated to wave-71's
    block-UI diff; 42/43 test files passed on first run, all passed on rerun). secret-scan passed
    (no secret in diff); the test job ran on postgres:16 + DATABASE_URL_TEST and executed the 3 new
    GET /blocks enrichment integration cases; no migration files present (matches no-schema-change
    scope). Squash-merged; merge SHA 670c46e confirmed as origin/main HEAD.
  next_action: PROCEED_TO_C-2
ci_stage_verdict: PASS
evidence:
  pr_url: https://github.com/arina477/test_claudomot/pull/87
  ci_run_id: "28842513359"
  merge_sha: 670c46e4ac0fb7fce1942c28b7c9ccf978909507
  required_checks_all_pass: true
  flake_rerun: study-timer.test.tsx (documented) — passed on rerun
  migration_in_diff: false
```
