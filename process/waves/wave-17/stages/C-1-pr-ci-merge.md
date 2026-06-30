# C-1 — PR, CI & merge (wave-17)

> Block C (CI/CD), spawn-pattern. head-ci-cd owns the block. Mode: automatic.
> **TEST-ONLY wave** — adds a real-Postgres integration test proving `createServer`'s
> transaction rolls back on mid-txn failure + a reusable PG harness + a parallel-safe
> integration vitest config. No product code, schema, or dependency change.

## Branch / PR

- Branch: `wave-17-create-server-rollback-test` (pushed, up to date with origin; B-6 APPROVE).
- Repo: `arina477/test_claudomot`.
- PR: **#29** — https://github.com/arina477/test_claudomot/pull/29
- Base: `main` · Head: `wave-17-create-server-rollback-test`
- Title: `test(integration): real-Postgres create-server rollback proof + reusable PG harness (#wave-17)`
- Single-spec: task `25523fb0`.

## CI run

- CI run id: `28443884419` (workflow `CI`, single run on PR HEAD).
- `gh run watch --exit-status` exited **0** (all GitHub checks reported pass).

### Per-check GitHub verdicts (all "pass")

| Check        | GitHub verdict | Notes |
|--------------|----------------|-------|
| lint         | pass (21s)     | biome ci, 0 errors |
| typecheck    | pass (29s)     | |
| build        | pass (33s)     | 358 modules, built in 4.30s |
| secret-scan  | pass (10s)     | gitleaks-action, blocking — no secret in diff |
| boot-probe   | pass (1m0s)    | compiled API `/health` → `{"status":"ok"}` |
| e2e          | pass (44s)     | Playwright smoke + authed create-server |
| **test**     | **pass (1m4s)** | **GREEN check, but integration cases SKIPPED — see finding below** |

## CRITICAL FINDING — false-green on the `test` job (integration suite SKIPPED, not run)

**The `test` job's GitHub check reports `pass`, but the 3 integration cases did NOT execute
against the real Postgres service — they were SKIPPED.** The authoritative real-PG run — the
entire point of this wave — never happened. The check is green by suppression.

### Raw evidence (test job log, run 28443884419)

Unit run (first command in `test:ci`) — fine:

```
 Test Files  18 passed (18)
      Tests  292 passed (292)
```

Integration run (second command, `--config vitest.integration.config.ts`) — SKIPPED:

```
 ↓ test/integration/create-server-rollback.spec.ts > createServer — real-Postgres transaction
     > commits all 5 row-kinds on success                                  (skipped)
 ↓   > rolls back ALL rows when channels insert fails mid-txn               (skipped)
 ↓   > rolls back cleanly on first-insert failure (servers insert fault)   (skipped)
 ↓   > SKIPPED: DATABASE_URL_TEST is not set — set it to a real Postgres URL ...
 Test Files  1 skipped (1)
      Tests  4 skipped (4)
...
 Tasks:    4 successful, 4 total          ← Turbo signature (root `turbo run test:ci`)
Cached:    0 cached, 4 total
```

The spec self-skips via `const SKIP = !process.env.DATABASE_URL_TEST;`
(`describe.skipIf(SKIP)`). `SKIP` evaluated **true** in the integration process →
all 3 real-PG cases skipped → vitest exits 0 → Turbo reports "4 successful" →
the `test` job is green.

### Root cause (classified, NOT fixed — Iron Law)

- The CI `test` job declares `DATABASE_URL_TEST` at the **job `env` level** (ci.yml line 46),
  so it is present in the job shell.
- Root `pnpm test:ci` = `turbo run test:ci`. **Turbo 2.x runs in strict env mode**: a task
  process receives only env vars declared in `turbo.json`'s `globalEnv` or the task's `env[]`
  array. `DATABASE_URL_TEST` is declared in **neither** — `turbo.json`'s `test:ci` task has no
  `env` passthrough and `globalEnv` is unset.
- Turbo therefore **strips `DATABASE_URL_TEST`** when spawning the api package's `test:ci` task.
  Inside that task the integration vitest run sees `process.env.DATABASE_URL_TEST === undefined`
  → `SKIP === true`.
- (The unit run in the same task also runs lazily without a DB, so its 292 pass regardless —
  it does not depend on the env var, which masked the problem.)

**Symptom → tag:** `configuration` (env var declared but not reaching the consuming process),
monorepo build-orchestrator aspect → matched specialist **`devops-engineer`**
(AGENTS.md: "Monorepo tooling (Turborepo/pnpm/Biome), CI").

**Fix locus (B-block, for the specialist — NOT applied here):** declare the env passthrough in
`turbo.json`, e.g. add `"env": ["DATABASE_URL_TEST"]` (and/or `"DATABASE_URL"`) to the `test:ci`
task (or add it to `globalEnv`). This is a B-4 wiring / B-5 verify gap: B-5 marked the
integration suite "CI-authoritative" but never confirmed it actually executed in CI — the
authoritative run was asserted, not observed.

### Disposition

- **DID NOT MERGE.** Merging would land a test that proves nothing — the rollback path stays
  unproven (the original wave-7 carry the wave exists to close).
- Routed back to B-block per the Iron Law via `/investigate` → `devops-engineer`
  (Turbo env passthrough) with a re-verify-in-CI requirement: the C-1 re-run must show the
  3 integration cases **passed** (not skipped) in the `test` job before merge.
- Fix-up cycle count: 1 (this is the first routed defect).

## Re-run after fix (CI run 28444194621, commit b0d8d22)

The defect was routed to `devops-engineer` via /investigate (Iron Law — not fixed by head).
Fix committed as `b0d8d22` on the same branch (pushed → updated PR #29):

```diff
# turbo.json — test:ci task
-      "cache": false
+      "cache": false,
+      "env": ["DATABASE_URL_TEST"]
```

`DATABASE_URL` needs no separate passthrough: pg-harness.ts sets
`process.env.DATABASE_URL = DATABASE_URL_TEST` in module scope (CF-2) before any SUT import.
`test:ci` already has `cache: false`, so a cached green cannot re-mask the env strip.

### Re-run `test` job — integration cases now EXECUTED and PASSED against real Postgres 16

```
 ✓ test/integration/create-server-rollback.spec.ts > createServer — real-Postgres transaction
     > commits all 5 row-kinds on success                                  48ms
 ✓   > rolls back ALL rows when channels insert fails mid-txn              39ms
 ✓   > rolls back cleanly on first-insert failure (servers insert fault)   31ms
 Test Files  1 passed (1)
      Tests  3 passed (3)
```

Plus unit: `Test Files 18 passed / Tests 292 passed`. All 7 checks green on commit b0d8d22.
This is a TRUE green — the authoritative real-PG run executed, not a false-green-by-suppression.

### Merge

- Mergeable state: `MERGEABLE` / `CLEAN`.
- `gh pr merge 29 --squash --delete-branch` → PR **MERGED** (mergedAt 2026-06-30T12:28:42Z).
- Merge commit on main: **`dfb65ca59be5e564c592179abddc6e830d25a090`**.
- Remote branch `wave-17-create-server-rollback-test` deleted.
  (The `gh` post-merge local-checkout step aborted on a dirty working tree — uncommitted C-block
  deliverables — so the server-side merge succeeded and the remote branch was deleted via an
  explicit `git push origin --delete`. Local-main sync + deliverable commit are the orchestrator's.)

## Deliverable footer

```yaml
ci_stage_verdict: PASS                # PR open → CI green (true green, integration cases executed) → merged
verdict_source: gh
verdict_evidence:
  - "gh pr view 29 state MERGED (mergedAt 2026-06-30T12:28:42Z)"
  - "gh run 28444194621: all 7 required checks passed on commit b0d8d22"
  - "test job log: integration suite '3 passed (3)' — create-server rollback cases ran against Postgres 16"
  - "merge commit: dfb65ca59be5e564c592179abddc6e830d25a090"
pr_number: 29
pr_url: https://github.com/arina477/test_claudomot/pull/29
branch: wave-17-create-server-rollback-test
required_checks: [lint, typecheck, build, secret-scan, boot-probe, e2e, test]
optional_checks: []
integration_cases_ran_in_ci: true         # executed against real Postgres 16
integration_cases_passed_in_ci: true      # 3/3 passed
test_ci_totals: "292 unit passed + 3 integration passed"
first_run_false_green:
  run_id: 28443884419
  fail_class: false-green-by-suppression
  detail: "GitHub checks green but integration suite SKIPPED (DATABASE_URL_TEST stripped by Turbo strict env mode)"
  routed_to: devops-engineer
  fix_commit: b0d8d22
fix_up_cycles: 1
final_commit_sha: b0d8d2204b6fbf5d8ad3e613427dde2d60a339f9   # green commit pre-merge
merge_strategy: squash
merge_commit_sha: dfb65ca59be5e564c592179abddc6e830d25a090
rebase_cycles: 0
note: "First CI run was a false-green (integration suite silently skipped). Caught via test-job log inspection — NOT trusted from the green check. Routed to B-block, fixed (Turbo env passthrough), re-verified the 3 cases actually ran + passed against real Postgres, then merged."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {head-ci-cd: head-ci-cd, devops-engineer: turbo-env-passthrough-fix}
  failed_checks: []
  rationale: >
    First CI run reported all checks green, but log inspection of the `test` job revealed the
    3 real-Postgres integration cases were SKIPPED (DATABASE_URL_TEST stripped by Turbo 2.x
    strict env mode — no env passthrough in turbo.json). This is the false-green-by-suppression
    class. Per the Iron Law I did not fix it; classified `configuration` → routed to
    devops-engineer, which added `"env": ["DATABASE_URL_TEST"]` to the test:ci task (commit
    b0d8d22). The re-run proved the 3 cases ACTUALLY EXECUTED and PASSED against the Postgres 16
    service (3/3), alongside 292 unit + lint/typecheck/build/secret-scan/boot-probe/e2e all
    green. Squash-merged to main (dfb65ca); branch deleted. The wave's acceptance criterion —
    rollback proven against a real Postgres in CI — is genuinely met.
  next_action: PROCEED_TO_C-2
```
