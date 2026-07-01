# C-1 — PR, CI & merge (wave-24 — real-PG integration test tier)

**Head:** head-ci-cd · **Repo:** `arina477/test_claudomot` · **Mode:** automatic (--auto merge authorized) · merge_strategy = squash.

Closes wave-23 F23-T-4 (the delegated-authz surface shipped with no dedicated real-DB integration test). TEST-ONLY wave: 3 new real-Postgres integration specs on the existing wave-17 harness — no production code, no schema/contract change, no migration.

## PR
- **PR #36** — https://github.com/arina477/test_claudomot/pull/36
- Title: `test(integration): real-PG specs for presence, member-gate, rbac authz` (60 chars, < 70).
- Base `main` ← head `wave-24-integration-tier`. No direct-to-main push; CI ran on the PR before merge.
- Diff is test-only (verified `git diff main...HEAD --stat`): `pg-harness.ts` (+85) + 3 new specs + wave-24 process docs. Zero production runtime files, zero migration files.

## CI run 28498812550 (head SHA `28bda7745e58e0e77148995815d667d50d4addff`)

### Per-job conclusions — CI-PRINCIPLES rule 3 (from `gh run view --json jobs`, NOT `gh run watch` alone)
| Job | Conclusion |
|---|---|
| lint | success |
| typecheck | success |
| test | success |
| build | success |
| secret-scan (gitleaks) | success |
| boot-probe | success |
| e2e | success |

All 7 jobs `success`; run conclusion `success`. Every required job (lint, typecheck, test, build, secret-scan, boot-probe) actually ran + passed — none skipped/cancelled. CI permissions least-privilege (`contents: read`). gitleaks secret-scan ran + passed (no secret in diff).

### CRITICAL — false-green guard (BOARD risk-officer binding condition; wave-17 lesson)
The `test` job runs `pnpm test:ci` → `turbo run test:ci` → api `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts` against the `postgres:16` service with `DATABASE_URL_TEST` set. The `test:ci` turbo task carries `"env": ["DATABASE_URL_TEST"]` (turbo.json) — the wave-17 fix that stops strict-env from stripping the DB URL and silently SKIPPING the integration tier.

**Verified from the `test` job LOG (job id 84471001038)** — the 3 new integration specs ACTUALLY EXECUTED (nonzero, not skipped), each with real-Postgres round-trips:
- `test/integration/presence-comembers.spec.ts` — **2 tests passed** (`getCoMemberUserIds` co-member resolution: shared-server co-members excl. self/non-shared; empty for no memberships).
- `test/integration/servers-member-gate.spec.ts` — **2 tests passed** (`listServerMembers` returns roster for a member; `ForbiddenException` for a non-member — member gate).
- `test/integration/rbac-assignments-authz.spec.ts` — **6 tests passed** (`getEffectivePermissions` 4 branches: owner short-circuit / member-with-manage_assignments / member-no-role / non-member 403; `can()` 2 branches — explicitly "closes F23-T-4").
- (+ `create-server-rollback.spec.ts` wave-17 — 3 tests passed, confirming the full integration tier ran.)

Integration run reported **"Test Files 4 passed (4)"** = the 4 files above (`test/integration/**/*.spec.ts` glob). The only "skipped" token in the log is the benign `pnpm install ... resolution step is skipped` line — **zero test skips**. This is NOT a false-green: the integration tier executed with 10 new passing real-DB tests (2+2+6).

## Merge
- `gh pr merge 36 --squash --delete-branch --auto` → **MERGED** 2026-07-01T06:44:12Z.
- **Merge (squash) SHA: `149a0817edab3cf9b8dac0b5fd7ebaa08d04cf0a`** — `test(integration): real-PG specs for presence, member-gate, rbac authz (#36)`.
- Branch `wave-24-integration-tier` deleted on merge.
- Local main synced (`git checkout main && git pull --rebase`) → HEAD `149a081`, up to date with origin/main.

## Secret hygiene
GitHub token used inline on every `gh` command; never written to a file or echoed into a committed artifact. gitleaks secret-scan passed on the diff.

```yaml
ci_stage_verdict: PASS
pr_url: "https://github.com/arina477/test_claudomot/pull/36"
pr_number: 36
ci_run_id: "28498812550"
head_sha: "28bda7745e58e0e77148995815d667d50d4addff"
per_job_conclusions:
  lint: success
  typecheck: success
  test: success
  build: success
  secret-scan: success
  boot-probe: success
  e2e: success
integration_specs_executed:
  false_green_guard: PASS
  evidence: "test job log 84471001038: 'Test Files 4 passed (4)' for vitest.integration.config; zero test skips"
  specs:
    - {file: "test/integration/presence-comembers.spec.ts", tests_passed: 2}
    - {file: "test/integration/servers-member-gate.spec.ts", tests_passed: 2}
    - {file: "test/integration/rbac-assignments-authz.spec.ts", tests_passed: 6}
merge_commit: "149a0817edab3cf9b8dac0b5fd7ebaa08d04cf0a"
merge_strategy: squash
branch_deleted: true
local_main_synced: true

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All 7 CI jobs (lint, typecheck, test, build, secret-scan, boot-probe, e2e) ran and reported success —
    verified per-job from `gh run view --json jobs`, never from `gh run watch` alone (rule 3). Least-privilege
    permissions (contents: read) and a blocking gitleaks secret-scan both passed. The wave's binding false-green
    guard is satisfied by direct log evidence: the `test` job executed the integration tier against postgres:16
    with DATABASE_URL_TEST passthrough (the wave-17 fix), and all 3 new real-DB specs RAN with passing tests
    (presence 2, member-gate 2, rbac-authz 6) — "Test Files 4 passed (4)", zero test skips. Squash-merged to main
    (149a0817) via --auto, branch deleted, local main synced.
    next_action: PROCEED_TO_C_2
```
