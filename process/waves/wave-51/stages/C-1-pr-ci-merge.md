# C-1 — PR, CI & merge (wave-51)

**Wave:** 51 — M8 DM-namespace layout fix: gate ChannelSidebar off the DM surface → canonical 3-panel.
**Branch:** `wave-51-dm-3panel` (B-6 APPROVED; 0 crit/high; web unit suite green; `biome ci .` repo-wide clean).
**Repo:** `arina477/test_claudomot`.
**Merge commit:** `01399a54990397b9c9e8fa6a3786b34112a4c7c7`.
**head-ci-cd verdict:** PASS.

## Scope confirmation — frontend-only, NO migration

`git diff origin/main...HEAD` (code files only): `apps/web/src/shell/AppShell.tsx` (+67/-44 region) and its test `apps/web/src/shell/AppShell.test.tsx`. **No `apps/api`, no `drizzle/`, no `*.sql`, no schema change.** The migration ledger is untouched this wave. All other diff entries are wave-51 process transcripts.

## PR

- **PR #65** — https://github.com/arina477/test_claudomot/pull/65
- Title: `fix(dm): gate ChannelSidebar off DM surface — canonical 3-panel layout`
- Base `main` ← head `wave-51-dm-3panel` (no direct-to-main; CI gate honored).

## Required CI checks — all ran + passed on PR HEAD

| Check | Result | Duration | Notes |
|---|---|---|---|
| lint | **pass** | 27s | biome/eslint |
| typecheck | **pass** | 42s | tsc |
| test | **pass** | 1m37s | ran against Postgres v16 service (integration/offline suites, not units-only) |
| build | **pass** | 39s | |
| secret-scan | **pass** | 6s | gitleaks/gitleaks-action@v3 — no secret in diff (BLOCKING) |
| boot-probe | **pass** | 1m5s | app boots |
| e2e | **pass** | 59s | Playwright smoke + authed create-server (5 passed) |

Run ID `28751132150`. `gh run watch --exit-status` exited **0** (all green). Zero skipped/cancelled/no-op required checks.

- **CI permissions least-privilege:** workflow declares `permissions: contents: read` at top level; no job broadens scope. [STABLE check ✓]

## Mergeable + merge

- `gh pr view 65 --json mergeable,mergeStateStatus` → `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- Fix-up cycles: **0**. Rebase cycles: **0**.
- Merged via `gh pr merge 65 --squash --delete-branch --auto` (automatic mode → `--auto` authorized; BOARD owns approval).
- Post-merge: `state: MERGED`, `mergedAt: 2026-07-05T18:49:11Z`, `mergeCommit.oid: 01399a54990397b9c9e8fa6a3786b34112a4c7c7`.
- Origin branch `wave-51-dm-3panel` deleted (GitHub API returns 404 "Branch not found").
- **Local main synced:** `git reset --hard origin/main` → HEAD `01399a5` (local process-commit rebase conflict aborted; the squashed PR is the authoritative main and already carries the AppShell code — verified `git show --stat 01399a5` includes AppShell.tsx +AppShell.test.tsx).

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 65 state MERGED (mergedAt 2026-07-05T18:49:11Z)"
  - "gh pr checks 65: lint/typecheck/test/build/secret-scan/boot-probe/e2e all pass"
  - "gh run watch 28751132150 --exit-status exit 0"
  - "merge commit: 01399a54990397b9c9e8fa6a3786b34112a4c7c7"
  - "origin branch wave-51-dm-3panel deleted (API 404)"
pr_number: 65
pr_url: https://github.com/arina477/test_claudomot/pull/65
branch: wave-51-dm-3panel
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
fix_up_cycles: 0
final_commit_sha: 88bf5ad
merge_strategy: squash
merge_commit_sha: 01399a54990397b9c9e8fa6a3786b34112a4c7c7
rebase_cycles: 0
note: "Frontend-only wave; no migration/schema/api change. Local main rebase hit a conflict on wave-51 process commits already captured in the squash; aborted and hard-reset local main to origin/main (= merge commit). AppShell code confirmed present in merge commit."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four+ required CI jobs (lint, typecheck, test, build) plus secret-scan, boot-probe and e2e
    actually RAN and reported success on the PR HEAD — none skipped, cancelled, or no-op; gh run watch
    --exit-status exited 0. The test job ran against the Postgres v16 service (integration/offline
    suites, not units-only) and the gitleaks secret-scan step ran and passed BLOCKING, so no secret
    reached the diff. CI permissions are least-privilege (contents: read; no job broadens scope). The
    PR branched off and targeted main through the CI gate — no direct-to-main bypass — and no new
    migration is present (frontend-only wave: only AppShell.tsx + its test changed; drizzle ledger
    untouched). MERGEABLE/CLEAN, zero fix-up cycles, squash-merged with --auto (automatic mode; BOARD
    owns approval), origin branch deleted, and local main synced to the merge commit
    01399a5 with the AppShell change verified present.
  next_action: PROCEED_TO_C-2
```
