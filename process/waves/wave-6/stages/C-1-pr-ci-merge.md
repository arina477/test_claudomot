# C-1 — PR, CI & merge (wave-6 CI boot-probe)

## PR
- **PR #16** — https://github.com/arina477/test_claudomot/pull/16
- Title: `ci: pre-merge compiled-artifact boot probe (#wave-6)`
- Base: `main` ← Head: `wave-6-ci-boot-probe` (HEAD efad0df at push)
- Task: da242f6b (CI compiled-dist boot probe — M1's last engineering loose end)
- Change scope: `.github/workflows/ci.yml` + wave-6 process docs ONLY. No app code, no schema, no migrations.

## CI run 28378572564 — ALL 6 required checks GREEN + e2e (non-required) green

| Check | Required | Result | Duration |
|---|---|---|---|
| lint | yes | pass | 22s |
| typecheck | yes | pass | 23s |
| test (postgres:16, test:ci) | yes | pass | 51s |
| build | yes | pass | 29s |
| secret-scan (gitleaks) | yes | pass | 5s |
| **boot-probe** | yes | **pass** | **54s** |
| e2e | no (observed) | pass | 45s |

### boot-probe — the wave's proof (NOT false-green)
The boot-probe job builds, boots the COMPILED artifact `node apps/api/dist/src/main.js` against a
throwaway postgres:16 + dummy env (SuperTokens/PORT/origins), and polls `/health` for `"status":"ok"`
(30s cap), dumping logs + failing on crash. Log evidence proves it genuinely exercised the artifact:
- attempt 1 (14:15:40.97): `curl: (7) Couldn't connect to server` — artifact not yet listening (real cold boot)
- attempt 2 (14:15:41.99): `boot-probe: /health returned ok on attempt 2` — compiled dist booted, bound :3000, /health 200

The probe waited for a genuine ~1s cold boot then got a real 200 — it cannot pass without the compiled
artifact actually serving. Confirms the probe boots the dist + reaches /health 200 without false-failing.

## Merge
- Mode: `automatic` → `--auto` authorized (BOARD owns approval).
- `mergeStateStatus: CLEAN`, `mergeable: MERGEABLE` after all checks green.
- `gh pr merge 16 --squash --delete-branch --auto` → MERGED 2026-06-29T14:16:27Z by arina477.
- **Merge commit: 75e7d9d3c409cc8cd20ecdce6b839cb442e2c774**
- Branch `wave-6-ci-boot-probe` deleted on origin (404 confirmed).
- Local main rebased/synced to 75e7d9d.

## Iterations
- fix_up_cycles: 0 | rebase_cycles: 0 | flake_reruns: 0 (cap 5 — well under)

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 16 state MERGED, mergeCommit 75e7d9d3c409cc8cd20ecdce6b839cb442e2c774"
  - "gh run 28378572564 conclusion=success; all 6 required checks pass + e2e pass"
  - "boot-probe job 84074663578 pass 54s; log: '/health returned ok on attempt 2' after attempt-1 connection-refused (genuine cold boot)"
pr_number: 16
pr_url: https://github.com/arina477/test_claudomot/pull/16
branch: wave-6-ci-boot-probe
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe]
optional_checks: [e2e (PASS)]
fix_up_cycles: 0
final_commit_sha: efad0df
merge_strategy: squash
merge_commit_sha: 75e7d9d3c409cc8cd20ecdce6b839cb442e2c774
rebase_cycles: 0
note: "CI-only change (ci.yml + process docs). boot-probe is the wave deliverable; validated green on a real cold-boot, not false-green."
```
