# C-1 — PR, CI & merge (wave-22 M5 assignments)

**Head:** head-ci-cd (spawn-pattern; observation + verdict-recording).
**Repo:** arina477/test_claudomot · **Mode:** automatic.

## Branch push
- Branch `wave-22-m5-assignments` already pushed at stage entry (HEAD `bb5a28e`, B-6 APPROVE). No force-push needed.

## PR
- **PR #34** — https://github.com/arina477/test_claudomot/pull/34
- Base `main` ← head `wave-22-m5-assignments`. Title: `feat: M5 assignments — CRUD + per-member status + assignments panel (#wave-22)`.

## Required CI checks (7 jobs) — gated on per-job conclusions per CI-PRINCIPLES rule 3
| Job | First run (bb5a28e) | Fix-up run (e0b24ee) |
|---|---|---|
| lint (`biome ci .`) | **FAILURE** | success |
| typecheck | success | success |
| test (Postgres 16, `pnpm test:ci`) | success | success |
| build | success | success |
| secret-scan (gitleaks, blocking) | success (pass 7s) | success |
| boot-probe (Postgres 16, compiled-API /health) | success | success |
| e2e (Playwright vs live web URL) | success | success |

- First run **28481484715** `run_conclusion: failure` — `gh run watch --exit-status` reported WATCH_EXIT=0 (false-green: it streamed a passing job's tail). The authoritative `gh run view --json jobs` gate caught **lint FAILURE**. **This is exactly the false-green that CI-PRINCIPLES rule 3 prevents.**
- Fix-up run **28481637648** (headSha `e0b24ee`) `run_conclusion: success` — all 7 jobs success.

## Fix-up cycle 1 of 5 — lint formatting drift (Iron Law: classified + routed, NOT fixed directly)
- **Root cause:** `apps/web/src/shell/assignments.test.tsx` (B-3 commit 0d92bd7) committed without running the formatter. `biome ci .` combines lint + format check; the blocking error was "File content differs from formatting output" (multi-line `render(<AssignmentCard … />,\n)` should collapse to single-line). 1 error + 10 pre-existing non-blocking `noNonNullAssertion` warnings (unrelated files, untouched). Local `pnpm test` / typecheck / build did NOT run Biome's format check, so it passed B-block locally and only CI caught it.
- **Classification:** triage tag `lint` (Lint error / style violation), web/react test file.
- **Route:** spawned `react-specialist` to apply `biome format --write` to the single file, verify whitespace-only diff, confirm 215/215 web tests still green, commit + push. Returned commit **e0b24ee**. Diff confirmed whitespace-only (no identifier/assertion/prop/test-name change).

## Assignments + IDOR negative paths — CONFIRMED EXECUTED (not skipped)
From the `test` job log of run 28481637648 (`Tests 388 passed (388)` api, `215 passed (215)` web, both vs Postgres v16):
- `assignments.service.spec.ts`: non-organizer create → 403; non-member list → 403; non-organizer soft-delete → 403; soft-delete sets is_deleted + listAssignments excludes (hides); per-member status isolation (A toggle does NOT affect B); UNIQUE upsert via ON CONFLICT DO UPDATE; headAttachment-before-insert anti-spoof; >10MB → 413.
- **Cross-server-key IDOR (the `/review` catch):** `H1: server-scoped key validation > createAssignment: cross-server key → 400, headAttachment NOT called`; `updateAssignment: cross-server key → 400`; path-traversal key → 400; valid same-server key → passes.
- **Forged-key 5xx fix:** `H2: NoSuchKey from headAttachment → 400 (not 5xx)`; NotFound → 400; unexpected S3 error re-throws as 5xx.
- `assignments.controller.spec.ts`: deleteAssignment propagates 403 from service.

## Merge
- mergeable `MERGEABLE`, mergeStateStatus `CLEAN`.
- `gh pr merge 34 --squash --delete-branch` → state **MERGED**.
- **Squash merge commit: `108f4a346eec216b06327c7e0de57ded34973189`** (`108f4a3`).
- Branch `wave-22-m5-assignments` deleted on origin. Local main synced to `108f4a3`.

## L-2 NOTE (per obs-4 — NOT written to CI-PRINCIPLES during C-block)
- **Observation (candidate, needs 2nd-wave confirmation before promotion):** the combined `biome ci .` lint job fails on format drift in files that pass local `pnpm test` / typecheck / build, because those commands don't run Biome's format check. A B-block file can land green locally yet fail CI lint on whitespace alone. Candidate rule for L-2 if it recurs: "Run `biome ci .` (or the repo's combined lint+format check) at B-5 verify, not just `pnpm test`+typecheck+build, so format drift fails locally before CI." This is the second consecutive wave the obs-4 per-prompt reminder held — no principles edits made in C-block.

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 34 state MERGED"
  - "gh run view 28481637648 --json jobs: all 7 required checks success on headSha e0b24ee"
  - "test job: api Tests 388 passed (388) + web 215 passed (215), assignments + cross-server-IDOR (H1) + forged-key (H2) negative paths executed"
  - "merge commit: 108f4a346eec216b06327c7e0de57ded34973189"
pr_number: 34
pr_url: https://github.com/arina477/test_claudomot/pull/34
branch: wave-22-m5-assignments
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
fix_up_cycles: 1
final_commit_sha: e0b24eef6fea498b640ab705ab801cdfce097f72   # green commit pre-merge
merge_strategy: squash
merge_commit_sha: 108f4a346eec216b06327c7e0de57ded34973189
rebase_cycles: 0
note: "Fix-up cycle 1: react-specialist fixed biome format drift in assignments.test.tsx (e0b24ee), whitespace-only. First run masked lint FAILURE under gh run watch — caught by per-job gate (CI-PRINCIPLES rule 3)."
```
