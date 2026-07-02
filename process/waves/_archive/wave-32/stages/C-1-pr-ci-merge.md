# C-1 — PR, CI & merge (wave-32 M6 pre-join voice occupancy)

**Block:** C (CI/CD) · **Stage:** C-1 · **Head:** head-ci-cd (spawn-pattern, headless)
**Primary task:** 78f51968 · **Mode:** automatic (`--auto` authorized; BOARD owns approval)

## Prerequisite

- B-6 exited `/review` APPROVE (head-builder APPROVED, no crit/high). Commit `b163965`.

## Action 1 — Branch push

- Branch `wave-32-voice-occupancy` already pushed to origin during B-block.
- Verified in sync at C-1 entry: local HEAD `b1639653` == origin HEAD `b1639653` (0 ahead / 0 behind). No re-push, no force-push required.
- 6 feature commits (B-0 → B-6), all wave-32 scoped. No stray files.
- Note: unrelated working-tree edits (`claudomat-brain/VERSION`, `onboarding/stages/stage-v13-handoff.md`) were NOT staged and NOT on branch commits — excluded from the PR; preserved via stash across the local-main sync.

## Action 2/3/4 — PR created

- **Title:** `feat: pre-join voice occupancy (who's-in-room) for wave-32`
- **Body:** claudomat-default template — Summary (endpoint + indicator, reuses wave-31 uniform-403 gate, bounded poll, server-side LiveKit creds), Test plan, Spec contract (primary task 78f51968), Wave artifacts (P-3 plan, P-2 spec, design/voice-occupancy-indicator.html, build deliverables). AI-attribution footer included.
- **PR #45** — https://github.com/arina477/test_claudomot/pull/45
- Conventions per `command-center/principles/CI-PRINCIPLES.md § pr_conventions`: squash, footer on, no required reviewers/labels.

## Action 6 — Required CI checks

Observed via `gh pr checks 45`. All part of workflow run `28554411114`:

| Check | Role | Outcome | Duration |
|---|---|---|---|
| lint | Biome lint + format | pass | 26s |
| typecheck | tsc project-references | pass | 37s |
| test | Vitest unit + integration (`pnpm test:ci`, Postgres v16 service containers) | pass | 1m9s |
| build | Turborepo build across workspaces | pass | 29s |
| secret-scan | gitleaks-action@v3 | pass | 7s |
| boot-probe | service boot smoke | pass | 52s |
| e2e | Playwright smoke + authed create-server | pass | 1m5s |

Stage-exit checklist evidence:
- All four core CI jobs (lint, typecheck, test, build) ran and reported success — not skipped/cancelled/no-op.
- `test` job ran `pnpm test:ci` against Postgres v16 service containers ("Initialize containers" / "Stop containers" steps present) — integration suite executed, not just units.
- `secret-scan` (gitleaks) ran and passed — no secret reached the diff.
- Branch `wave-32-voice-occupancy` → base `main`; no direct-to-main push (all changes via PR #45).
- No new migration in the diff (B-0 schema-skip; inline DTO, no drizzle migration) — no missing committed SQL.

## Action 7 — Watch runs

- `gh run watch 28554411114 --exit-status` → **exit 0** (all green on first run).

## Action 8 — Flake check

- Not triggered: no required check failed. Documented B-5 flake (`server-roles.test.tsx > marks role dirty…`) did NOT surface. `flake_rerun_succeeded: n/a`.

## Action 9/10 — Green run + mergeable

- All 7 checks `pass` on HEAD commit `b1639653`.
- `gh pr view 45 --json mergeable,mergeStateStatus` → `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`. No rebase needed (0 rebase cycles).

## Action 11 — Merge

- `gh pr merge 45 --squash --delete-branch --auto` → exit 0.
- Squash strategy per `project.yaml: merge_strategy`. `--auto` authorized under automatic mode.
- PR state: **MERGED** at 2026-07-01T23:25:59Z. Merge commit `45b08c3237dfdddc11b665cf060b85782232d4a9`. Branch deleted on origin.

## Action 12 — Sync local main

- `git checkout main && git pull --rebase` → local main HEAD = `45b08c3237dfdddc11b665cf060b85782232d4a9` (the merge commit).
- Unrelated WIP restored cleanly post-sync.

## Notes / hand-off to C-2

- LiveKit creds still unset in Railway. This does NOT affect CI (build is credential-independent; passed). It is a **C-2 deploy-verification / T-block concern** — the occupancy endpoint's runtime `RoomServiceClient` read against LiveKit needs those creds set in the `api` service scope before the new revision serves traffic. Flag for C-2 env-scope verification.

---

```yaml
ci_stage_verdict: PASS                       # PR open + CI green + merged
verdict_source: gh
verdict_evidence:
  - "gh pr view 45 state MERGED (mergedAt 2026-07-01T23:25:59Z)"
  - "gh pr checks 45: all 7 required checks passed (lint, typecheck, test, build, secret-scan, boot-probe, e2e)"
  - "gh run watch 28554411114 --exit-status → exit 0"
  - "merge commit: 45b08c3237dfdddc11b665cf060b85782232d4a9"
pr_number: 45
pr_url: https://github.com/arina477/test_claudomot/pull/45
branch: wave-32-voice-occupancy
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
fix_up_cycles: 0
flake_rerun_succeeded: n/a
final_commit_sha: b1639653c0c46fb4dfb41d3ca9498e8cf6a52606
merge_strategy: squash
merge_commit_sha: 45b08c3237dfdddc11b665cf060b85782232d4a9
rebase_cycles: 0
note: "First-run all-green; no flake surfaced. LiveKit creds unset in Railway — CI-independent, flag for C-2 env-scope check."

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) ran and passed — not skipped,
    cancelled, or no-op. The test job executed pnpm test:ci against Postgres v16 service
    containers, covering integration not just units. gitleaks secret-scan ran and passed;
    no secret reached the diff. The branch targeted main via PR #45 with no direct-to-main
    push, and carries no un-migrated schema change (B-0 schema-skip, inline DTO). PR reached
    MERGEABLE/CLEAN on first run with zero flakes, merged via authorized squash --auto under
    automatic mode, and local main is synced to the merge commit with the branch deleted on
    origin. Every applicable C-1 stage-exit check is ticked.
  next_action: PROCEED_TO_C-2
```
