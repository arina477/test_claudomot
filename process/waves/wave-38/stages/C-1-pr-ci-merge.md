# C-1 — PR, CI & merge (wave-38 avatar storage go-live)

**Block:** C (CI/CD) · **Stage:** C-1 · **Head:** head-ci-cd (spawn-pattern) · **Mode:** automatic

## Branch push

- Branch `wave-38-avatar-storage` already tracked on origin; re-push → `Everything up-to-date`.
- HEAD commit at PR open: `974da56be2f5048caef67706358c595172a880d7` (B-6 review APPROVE deliverable; note prior brief cited `1780b75`, superseded by the committed B-6 deliverable `974da56`).

## PR creation

- **PR #52** — https://github.com/arina477/test_claudomot/pull/52
- Title: `feat: avatar storage go-live (presigned-GET render + Tigris creds wiring)`
- Base: `main` · Head: `wave-38-avatar-storage` · State: OPEN
- Body: Summary / Test plan / Spec contract (primary task 84e09891) / Wave artifacts (P-3 plan, P-2 spec) + AI-attribution footer.

## Required CI checks (single workflow run `28650289759`, event `pull_request`)

| Check | Result | Duration |
|---|---|---|
| lint (`biome ci .`) | **FAIL** | 20s |
| typecheck | PASS | 34s |
| build | PASS | 39s |
| test (`pnpm test:ci` — unit + real-PG integration) | PASS | 1m29s |
| e2e | PASS | 50s |
| boot-probe | PASS | 58s |
| secret-scan (gitleaks) | PASS | 10s |

- Integration `apps/api/test/integration/avatar-render.spec.ts` ran inside the green `test` job (CI-only; skips locally). Anon-GET render assertion passed.
- `secret-scan` (gitleaks) PASS — no secret reached the diff.

## CI FAILURE — lint (Biome `biome ci .`)

`biome ci .` checked 246 files → **Found 3 errors, 12 warnings**, exit 1. All 3 blocking errors are on wave-38-introduced `apps/api/src/files/` code:

1. `apps/api/src/files/files.controller.spec.ts:51:5` — `lint/performance/noDelete` — `delete process.env.PUBLIC_API_URL;` (FIXABLE — Biome suggests `= undefined`).
2. `apps/api/src/files/files.controller.spec.ts:145:7` — `lint/performance/noDelete` — same pattern in the second test block (FIXABLE).
3. `apps/api/src/files/files.controller.ts:16:1` — `suppressions/unused` — a `// biome-ignore lint/style/useImportType …` comment that no longer has any effect (plus a non-blocking `organizeImports` finding on the same file).

**Not a flake.** `process/waves/wave-38/stages/B-5-verify.md` has no `flakes_documented` entries, and all three findings are deterministic Biome rule violations (env-var teardown style + a stale suppression). Step A single-job re-run is therefore NOT warranted — a re-run would return the identical exit 1 and would mask a real defect.

**Root-cause / process gap:** B-5 verify + B-6 review reported green on `typecheck` + `524 unit`, but the local verification lane did not run `biome ci .` (the lint gate CI enforces). Three deterministic lint errors on this wave's own new code slipped to CI. The fix is trivial (Biome-fixable env teardown + removing one stale suppression) but must land as a B-stage fix-up commit under Iron Law — head-ci-cd does not edit production/test code.

## Classification & routing (Iron Law — no direct fix)

- **Symptom:** Lint (Biome) failure on wave-38 code.
- **Domain tag:** code-style / lint defect in the NestJS `files` module (source `files.controller.ts`) + its unit spec (`files.controller.spec.ts`).
- **Route:** back to the originating B-stage via `/investigate` → B-2/B-3 (controller source) + test author (spec). Recommended specialist: node-specialist / backend-developer for the NestJS controller + spec cleanup.
- **On fix-up:** B-stage adds a fix-up commit, pushes; C-1 re-runs Action 7 (`gh run watch`) on the new run, then Action 10 mergeable re-check.
- Fix-up cycle count: **1** (this is the first CI-fail cycle; cap 5).

## Fix-up cycle 1 — resolution (re-watch)

- node-specialist landed the lint fix-up and pushed commit `dffef53e284efa580be5088093bc7cbcc6916e7f` (2x `noDelete` in `files.controller.spec.ts` → `= undefined`; stale `useImportType` suppression removed from `files.controller.ts`).
- New workflow run `28651122778` (event `pull_request`, commit `dffef53`) watched to completion via `gh run watch --exit-status` → exit 0.
- **All 7 required checks now PASS** — lint flipped FAIL→PASS; the other six held green:

| Check | Result | Duration |
|---|---|---|
| lint (`biome ci .`) | **PASS** | 20s |
| typecheck | PASS | 39s |
| build | PASS | 38s |
| test (unit + real-PG integration incl. CI-only `avatar-render.spec.ts`) | PASS | 1m24s |
| e2e | PASS | 56s |
| boot-probe | PASS | 1m1s |
| secret-scan (gitleaks) | PASS | 7s |

- No further failures; single fix-up cycle (1 of 5) closed the gate. Deterministic fix, no flake re-run performed.

## Merge

- Pre-merge mergeability: `gh pr view 52 --json mergeable,mergeStateStatus,state` → `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`, `state: OPEN` at head `dffef53`.
- Merged via `gh pr merge 52 --squash --delete-branch --auto` (squash per project merge_strategy; `--auto` authorized under automatic mode). Checks already green → merged immediately.
- **MERGED.** `state: MERGED`, `mergedAt: 2026-07-03T09:21:45Z`, squash **merge_commit_sha `8b590e1cf9ec1073fb413a6e03c25e19b8689cb2`**; head branch `wave-38-avatar-storage` deleted.
- Local `main` fast-forwarded `3e2ba97..8b590e1` via `git checkout main && git pull --rebase`; `HEAD == 8b590e1`, synced with `origin/main`.
- Migration `0017_dapper_squadron_sinister.sql` present in `apps/api/drizzle/migrations/` with committed SQL + snapshot + journal — no un-committed migration.
- Deploy NOT triggered: Railway on this project is CLI-push (`railway up` per service at C-2), not git-triggered. C-1 ends at MERGED + synced main.

## Deliverable footer

```yaml
ci_stage_verdict: PASS                  # all 7 required checks green; PR squash-merged
verdict_source: gh
verdict_evidence:
  - "gh run watch 28651122778 --exit-status → exit 0 (commit dffef53)"
  - "gh pr checks 52 → lint/typecheck/build/test/e2e/boot-probe/secret-scan all pass"
  - "gh pr view 52 → mergeable MERGEABLE, mergeStateStatus CLEAN (pre-merge)"
  - "gh pr view 52 → state MERGED, mergeCommit.oid 8b590e1 (post-merge)"
  - "git pull --rebase → main 3e2ba97..8b590e1 fast-forward; HEAD == 8b590e1"
pr_number: 52
pr_url: https://github.com/arina477/test_claudomot/pull/52
branch: wave-38-avatar-storage        # deleted on merge
required_checks: [lint, typecheck, build, test, e2e, boot-probe, secret-scan]
required_checks_status:
  lint: PASS
  typecheck: PASS
  build: PASS
  test: PASS
  e2e: PASS
  boot-probe: PASS
  secret-scan: PASS
optional_checks: []
fix_up_cycles: 1                        # single lint fix-up cycle (cap 5); resolved by dffef53
flake_rerun_performed: false           # deterministic Biome fix, no flake re-run
final_commit_sha: dffef53e284efa580be5088093bc7cbcc6916e7f   # green PR head at merge
merge_strategy: squash
merge_commit_sha: 8b590e1cf9ec1073fb413a6e03c25e19b8689cb2
rebase_cycles: 0
note: "Lint fix-up (node-specialist, dffef53) turned biome green; all 7 required checks pass; squash-merged, branch deleted, main synced to 8b590e1. Deploy is CLI-push (railway up), not git-triggered — C-1 ends at MERGED + synced main; deploy is C-2."

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) plus e2e, boot-probe, and the
    gitleaks secret-scan ran and reported success on run 28651122778 (commit dffef53) —
    none skipped, cancelled, or no-op. The test job executed against real Postgres and
    ran the CI-only avatar-render integration spec, not just units. Lint (biome ci .),
    which had failed on 3 deterministic Biome errors, is now green after node-specialist's
    fix-up commit dffef53 (fix-up cycle 1 of 5). gitleaks passed — no secret in the diff.
    Migration 0017 ships with its committed SQL file. PR branched off main and targeted
    main with no direct-to-main bypass; mergeStateStatus was CLEAN pre-merge. Squash-merge
    landed as 8b590e1, head branch deleted, local main fast-forwarded and synced to origin.
    Deploy is intentionally not triggered — Railway on this project is CLI-push, so C-1
    ends at MERGED + synced main.
  next_action: PROCEED_TO_C-2   # C-2 deploy & verify (railway up per changed service)
```
