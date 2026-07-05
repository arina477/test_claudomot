# C-1 — PR, CI & merge (wave-48)

**Wave:** 48 — DM candidate privacy negative-case integration test (TEST-ONLY).
**Branch:** `wave-48-dm-candidate-privacy-test` (B-6 APPROVED at `72926c5`).
**Repo:** `arina477/test_claudomot`.
**head-ci-cd verdict:** PASS.

## Branch push

`git push -u origin wave-48-dm-candidate-privacy-test` → new branch created on origin. No force-push (clean fast-forward from B-6).

## PR

- **PR #62** — https://github.com/arina477/test_claudomot/pull/62
- Title: `test: DM candidate privacy negative-case integration (wave-48)`
- Base: `main` ← Head: `wave-48-dm-candidate-privacy-test`
- Body: Summary + Test plan + Spec contract (primary task 03ccf636) + Wave artifacts, per C-1 Action 3.

## CI — required checks (run 28710662037)

All 7 checks GREEN on PR HEAD commit:

| Check | Result | Duration |
|---|---|---|
| lint (biome ci) | pass | 25s |
| typecheck (tsc) | pass | 41s |
| test (unit + integration, postgres:16) | pass | 1m21s |
| build | pass | 37s |
| secret-scan (gitleaks) | pass | 10s |
| boot-probe (compiled API /health) | pass | 54s |
| e2e (Playwright smoke + authed) | pass | 57s |

- **CI least-privilege confirmed:** `permissions: contents: read` at workflow top; no job requests broader scope.
- **gitleaks secret-scan ran + passed** — no secret reached the diff (GH_TOKEN kept inline in shell, never committed).
- Branch off `main`, targets `main` — no direct-to-main bypass.
- No migration in diff (test-only); no drizzle/migrations SQL required.

## CRITICAL VERIFICATION — dm-candidates.spec.ts RAN (not skipped)

The wave's entire value is real-DB coverage. The spec uses `describe.skipIf(!process.env.DATABASE_URL_TEST)`. The CI `test` job sets `DATABASE_URL_TEST=postgres://test:test@localhost:5432/studyhall_test` against a `postgres:16` service, and `apps/api` `test:ci` = `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts` — the second command runs the integration pass.

**Test-job log (run 28710662037, job 85143531736) proof — both assertions GREEN with real-DB timings:**

```
✓ test/integration/dm-candidates.spec.ts > DmService.getDmCandidates — real-Postgres privacy-fence negative controls > (a) excludes a co-member whose who_can_dm is "nobody"; includes the control everyone-user 60ms
✓ test/integration/dm-candidates.spec.ts > DmService.getDmCandidates — real-Postgres privacy-fence negative controls > (b) does not expose a user who shares no server with the caller 49ms
```

- `✓` (pass) marker, NOT `↓`/skip. Non-zero ms (60ms, 49ms) = real Postgres round-trips, not 0ms mock/skip.
- Grep for any skip of dm-candidates in the log: **NONE** — the `SKIPPED: DATABASE_URL_TEST is not set` branch did not fire.
- Integration pass summary: `Test Files 17 passed (17)` — dm-candidates.spec.ts among them.
- **Conclusion:** the 2 real-PG negative-case assertions executed live against Postgres 16 and passed. Wave value is real, not void.

Documented flakes (server-roles act(); turbo pnpm -w test startup crash) did NOT fire — no re-run needed.

## Merge

- `gh pr view 62`: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- Merge strategy: **squash** (per `project.yaml: merge_strategy`), `--delete-branch`.
- PR state after merge: **MERGED**.
- Merge commit SHA: `c79343b7ada67ff9e03566e35c4f0617456373a6`.
- Merge commit diff = exactly `apps/api/test/integration/dm-candidates.spec.ts` (+160) + `apps/api/test/integration/pg-harness.ts` (test-only). No production/schema change confirmed on main.
- Local `main` synced to `c79343b` (rebase hit a conflict replaying now-squashed branch commits; resolved by hard-reset to `origin/main`, which is the authoritative squash commit containing all wave-48 changes).

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 62 state MERGED"
  - "gh pr checks 62 — all 7 checks passed (lint typecheck test build secret-scan boot-probe e2e)"
  - "test-job log 85143531736: dm-candidates.spec.ts (a)+(b) both ✓ green (60ms/49ms real-PG), integration pass Test Files 17 passed"
  - "merge commit: c79343b7ada67ff9e03566e35c4f0617456373a6"
pr_number: 62
pr_url: https://github.com/arina477/test_claudomot/pull/62
branch: wave-48-dm-candidate-privacy-test
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
fix_up_cycles: 0
flake_reruns: 0
final_commit_sha: 72926c5
merge_strategy: squash
merge_commit_sha: c79343b7ada67ff9e03566e35c4f0617456373a6
rebase_cycles: 0
note: "TEST-ONLY wave; CI-integration-pass log proves dm-candidates.spec.ts RAN (2 real-PG assertions green, not skipped)."
```

---

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) plus gitleaks secret-scan, boot-probe,
    and e2e ran and passed on PR HEAD. CI permissions are least-privilege (contents: read). Branch
    off main, targets main, no direct-to-main bypass. The load-bearing check — that the new
    dm-candidates.spec.ts RAN and did NOT skip — is proven from the test-job log: both negative-case
    assertions (a) and (b) show ✓ green with 60ms/49ms real-Postgres round-trip timings, the
    integration pass reports 17 test files passed, and no dm-candidates skip line appears. No
    migration in the test-only diff. Squash-merged to main at c79343b; local main synced.
  next_action: PROCEED_TO_C-2
```
