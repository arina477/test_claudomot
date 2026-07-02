# C-1 — PR, CI & merge (wave-36 · M7 test-hardening)

**Head:** head-ci-cd · **Mode:** automatic (`--auto` authorized) · **Merge strategy:** squash
**Branch:** `wave-36-privacy-tests` (HEAD `2118889`) → base `main` · Repo `arina477/test_claudomot`

## Action log

### Action 1 — Push branch
Branch was NOT on remote at stage entry (context said "pushed" but `git ls-remote` returned empty). Pushed via `git push -u origin wave-36-privacy-tests` → `[new branch]`. HEAD `2118889` on origin.

### Actions 2–5 — PR
- **PR #50** created: https://github.com/arina477/test_claudomot/pull/50
- Title: `test(privacy): M7 durable regression tests — real-PG integration + unit + controller authz`
- Body: Summary / Test plan / Spec contract (primary 622a7bf3 + claimed 73e96a9d, b7feab30) / Wave artifacts + AI footer (heredoc).

### Action 6 — Required checks
7 checks on run `28611576359`: `lint`, `typecheck`, `test`, `build`, `secret-scan`, `boot-probe`, `e2e`.

### Action 7 — Watch → all green
`gh run watch 28611576359 --exit-status` → exit 0. `gh pr checks 50` confirms all 7 `pass`:

| Check | Result | Duration |
|---|---|---|
| lint | pass | 21s |
| typecheck | pass | 39s |
| test | pass | 1m14s |
| build | pass | 33s |
| secret-scan (gitleaks) | pass | 11s |
| boot-probe | pass | 57s |
| e2e | pass | 1m6s |

No flake triggered — `server-roles.test.tsx` documented flake did NOT fail; zero reruns needed. Fix-up cycles: 0.

### CRITICAL — Integration-tier execution verification (the point of this wave)

Pulled the `test` job log (job `84845085352`, run `28611576359`). `pnpm test:ci` runs:
```
$ vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts
```
The second command is the **integration config against the CI `postgres:16` service** (`DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test`, ci.yml line 46). Integration run summary: **`Test Files 11 passed (11)`**.

**Both NEW integration specs EXECUTED (real `describe.skipIf(SKIP)` blocks ran, NOT the `it.skip` DB-absent decoy):**

- `test/integration/account-data-export-idor.spec.ts` — **7 tests ran, 0 skipped**. Includes `sanity: users table has 2 real rows after seed (non-trivial real-DB write proof)` and `IDOR structural proof: A cannot obtain B memberships, B cannot obtain A memberships`.
- `test/integration/privacy-visibility-authz.spec.ts` — **5 tests ran, 0 skipped**. Includes `sanity: server_members has 2 real rows after seed (non-trivial real-DB write proof)` and `'nobody': roster length for B drops from 2 (default) to 1 ... (provable before/after delta)`.

Grep for the `SKIPPED: DATABASE_URL_TEST` decoy / skip markers on these two specs → **NONE**. The wave-17/24 false-green class (silent `skipIf` when DATABASE_URL_TEST never reaches vitest) did **NOT** occur. `DATABASE_URL_TEST` reached the vitest process, `SKIP=false`, real DB-backed assertions executed and passed. **The regression tests are durable, not decorative.**

### Action 10 — Mergeable
`gh pr view 50` → `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, `headRefOid: 2118889` (matches). Rebase cycles: 0.

### Action 11 — Merge
`gh pr merge 50 --squash --delete-branch --auto` → exit 0; PR state `MERGED`, mergedAt `2026-07-02T18:10:30Z`. Merge commit **`be1bbab2b84b9d9e2939f6824ec8894ef0ad3c33`**. Remote branch deleted.

### Action 12 — Sync local main
Local `main` had 2 pre-existing local-only commits (`44e931b`, `a96cbfa` — wave-36 P-block plan work, content fully subsumed by the squash `be1bbab`). Verified all wave-36 content (P-2-spec, P-3-plan, both integration specs) present in `origin/main` tree, then `git reset --hard origin/main`. Local main now == `be1bbab`. Brain-vendored working-tree changes (`.gitignore` `.gstack/`, `claudomat-brain/VERSION` 1.18.0→1.18.1, onboarding doc) are sync-managed, NOT wave-36 code — left uncommitted, kept out of the PR (rule 14).

## Exit criteria — all met
- [x] Branch pushed to origin
- [x] PR #50 created & OPEN, then MERGED
- [x] All 7 required checks green on HEAD `2118889`
- [x] Integration tier provably executed (12 real DB-backed tests, 0 skipped for the 2 new specs)
- [x] Fix-up cycles 0 (≤5); rebase cycles 0
- [x] Local main synced to `be1bbab`
- [x] Remote branch deleted

---

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 50 state MERGED, mergedAt 2026-07-02T18:10:30Z"
  - "gh pr checks 50 — all 7 required checks passed (lint/typecheck/test/build/secret-scan/boot-probe/e2e)"
  - "test job 84845085352: integration run 'Test Files 11 passed (11)' via vitest.integration.config.ts against postgres:16"
  - "account-data-export-idor.spec.ts: 7 tests executed, 0 skipped (real describe.skipIf block, includes non-trivial real-DB write proof + IDOR structural proof)"
  - "privacy-visibility-authz.spec.ts: 5 tests executed, 0 skipped (real describe.skipIf block, includes real-DB write proof + provable before/after roster delta)"
  - "no SKIPPED:DATABASE_URL_TEST decoy fired for either new spec — wave-17/24 false-green class did NOT occur"
  - "merge commit: be1bbab2b84b9d9e2939f6824ec8894ef0ad3c33"
pr_number: 50
pr_url: https://github.com/arina477/test_claudomot/pull/50
branch: wave-36-privacy-tests
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
integration_tier_executed: true
integration_tier_evidence: "12 real DB-backed tests ran (7 account-data-export-idor + 5 privacy-visibility-authz), 0 skipped; integration config 'Test Files 11 passed (11)'"
fix_up_cycles: 0
flake_reruns: 0
final_commit_sha: 2118889
merge_strategy: squash
merge_commit_sha: be1bbab2b84b9d9e2939f6824ec8894ef0ad3c33
rebase_cycles: 0
note: "Branch not on remote at entry despite context claim — pushed at Action 1. Local main had 2 pre-existing local-only plan commits subsumed by the squash; reset --hard to origin/main after confirming all wave-36 content present. Brain-vendored working-tree changes (.gitignore/.gstack, VERSION 1.18.1, onboarding doc) are sync-managed, kept out of the PR per rule 14."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) plus secret-scan (gitleaks), boot-probe,
    and e2e ran and passed on HEAD 2118889 — none skipped, cancelled, or no-op. CI permissions are
    least-privilege (contents: read). PR branched off and targets main via squash; no direct-to-main
    bypass. The wave's load-bearing check — that the two new integration specs ACTUALLY EXECUTED
    against real Postgres, not silently skipIf'd — is proven from the test-job log: 12 DB-backed tests
    ran (0 skipped), the real describe.skipIf blocks fired (not the it.skip decoy), and the vitest
    integration config reported Test Files 11 passed. The wave-17/24 false-green class did not occur.
    No new migration in the diff, so no missing SQL-file concern. PR #50 merged clean (be1bbab),
    remote branch deleted, local main synced.
  next_action: PROCEED_TO_C-2
```
