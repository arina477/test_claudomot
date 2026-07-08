# C-1 — PR, CI & merge (wave-80, M13 leg-3b: presence privacy toggle)

**Mode:** automatic. B-6 exited /review APPROVE. head-ci-cd spawned (agentId acd915aeab0b80ce2) — ACKed C-block ownership, gate posture recorded.

## Branch push
- Branch: `wave-80-presence-toggle`, HEAD `adbc826`. `git push -u origin` → already up-to-date on origin.

## PR
- **PR #99** — https://github.com/arina477/test_claudomot/pull/99
- Title: `feat: presence privacy toggle (M13 leg-3b)`
- Base `main` ← head `wave-80-presence-toggle`, squash strategy.
- Body: summary + test plan + spec contract (task 3038a4bc) + wave artifacts + AI-attribution footer.
- Migration `0033_wave80_users_show_presence.sql` confirmed present in diff (head-ci-cd flag #4 satisfied).

## Required CI checks (run 28917150735)
All 6 required + 1 non-required (e2e) PASS. No flake re-run needed (study-timer.test.tsx did not trip).

| Check | Required | Result | Duration |
|---|---|---|---|
| lint | yes | pass | 26s |
| typecheck | yes | pass | 42s |
| test (postgres:16 + pg-harness) | yes | pass | 1m55s |
| build | yes | pass | 38s |
| secret-scan | yes | pass | 8s |
| boot-probe | yes | pass | 1m1s |
| e2e | no | pass | 54s |

The `test` job ran 1m55s against postgres — the two new integration specs (`presence-show-presence-honor.spec.ts` two-subject + `privacy-events.spec.ts`) executed as part of the DB-backed suite. Not coverage theater.

## Mergeable state
- `gh pr view 99 --json mergeable,mergeStateStatus` → `MERGEABLE` / `CLEAN`. No rebase needed.

## Merge
- `gh pr merge 99 --squash --delete-branch` → EXIT=0. Direct merge (no `--auto` needed; branch protection did not block).
- Branch deleted on origin.
- Local main synced (`git checkout main && git pull --rebase`).

## Verdict

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 99 state MERGED (mergeCommit oid 4795638125301c0685864a3a5f58001373720059)"
  - "gh pr checks 99 — all 6 required checks passed (run 28917150735), e2e non-required pass"
  - "merge commit: 4795638125301c0685864a3a5f58001373720059"
pr_number: 99
pr_url: https://github.com/arina477/test_claudomot/pull/99
branch: wave-80-presence-toggle
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks: [e2e (PASS)]
fix_up_cycles: 0
final_commit_sha: adbc826642e07229bb19fe490f7ca33125065783
merge_strategy: squash
merge_commit_sha: 4795638125301c0685864a3a5f58001373720059
rebase_cycles: 0
note: "single-spec wave; no flake re-run; migration 0033 in diff, applied at C-2 before api deploy"
```
