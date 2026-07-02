# C-1 — PR, CI & Merge — wave-33 (malformed-UUID route param → 400 hardening)

**Block:** C (CI/CD) · **Stage:** C-1 · **Head:** head-ci-cd · **Mode:** automatic
**Primary task:** a2dd9f3d · **Source finding:** F-32-T-8-1
**B-6 status carried in:** APPROVED (head-builder + /review no findings), commit 920fee8

---

## Branch push (Action 1)

- Branch `wave-33-uuid-param-validation` already pushed (up-to-date on origin at push time); `git push -u` reported "Everything up-to-date".
- Working tree carried three **pre-existing, out-of-wave** dirty files (`.gitignore`, `claudomat-brain/VERSION`, `claudomat-brain/onboarding/stages/stage-v13-handoff.md`) — NOT part of wave-33, not committed. Diff-vs-main scoped to 3 api source files + 1 integration spec + wave docs. No migration files (schema-neutral change).

## PR (Actions 2–5)

- **PR #46** — https://github.com/arina477/test_claudomot/pull/46
- Title: `fix: malformed UUID route param returns 400 not 500 (wave-33)`
- Body: Summary (22P02 → 400 via SupertokensExceptionFilter extension across 7 controllers, from F-32-T-8-1) + Test plan + Spec contract (task a2dd9f3d) + Wave artifacts + AI-attribution footer.
- Base `main`, head `wave-33-uuid-param-validation`, HEAD commit `920fee8`.

## CI checks (Actions 6–9)

Run **28559053549**. All 7 checks GREEN (`gh run watch --exit-status` → EXIT 0):

| Check | Result |
|---|---|
| lint | PASS |
| typecheck | PASS |
| test | PASS |
| build | PASS |
| secret-scan (gitleaks) | PASS |
| boot-probe | PASS |
| e2e | PASS (4 passed) |

### FALSE-GREEN GUARD — integration suite RAN (not skipped)

The load-bearing verification. `test:ci` = `vitest run --reporter=verbose && vitest run --config vitest.integration.config.ts`. The `test` job sets job-level `DATABASE_URL_TEST` against a `postgres:16` service; the spec's `SKIP = !process.env.DATABASE_URL_TEST` therefore evaluated FALSE and the suite executed.

- **`apps/api/test/integration/malformed-uuid-params.spec.ts` — 10 tests PASSED** (verified by grep of the `test` job log): Part A (6 tests — real Postgres 22P02 error-shape proof on `canViewChannelById` with junk/not-a-uuid/123/abc-def + non-voice route + valid-UUID no-false-positive) and Part B (4 tests — real 22P02 → filter → HTTP 400 mapping, sanitized 400 body, voice-participants path, valid-UUID no-regression).
- Integration config final tally: **`Test Files 9 passed (9)`** — every integration suite ran, **zero skipped**. The real-DB proof of the 22P02 branch executed.
- Unit run: **`Tests 467 passed (467)`** (matches local verify).

Evidence: `gh run view 28559053549 --job 84672724963 --log` — greps for `test/integration/malformed-uuid-params.spec.ts` return 10 `✓` lines.

## Fix-up cycles

- **0** — first CI run green on HEAD `920fee8`. No flakes triggered; the documented B-5 `server-roles.test.tsx` cross-isolation flake did not fire.

## Merge (Actions 10–13)

- Pre-merge mergeable check: `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN`.
- Merge strategy: `squash` (per `project.yaml: merge_strategy`) + `--delete-branch` + `--auto` (authorized under `automatic` mode).
- **State: MERGED** at 2026-07-02T01:31:14Z.
- **Merge commit: `e1a64f6bbc26aeb47e2f3cf2e2bed624a5c9d965`**
- Local main synced (rebase) to `e1a64f6`; remote branch deleted (confirmed empty `ls-remote`).
- Rebase cycles: 0 (main was CLEAN; a working-tree stash/pop was used only to move the three out-of-wave dirty files aside during the mandated `git pull --rebase`, then restored untouched).

## Carry to C-2 / N-block

- **C-2 deploys ONLY the `api` service** (`studyhall-api`) — web is unchanged this wave (diff is api-only). Do NOT redeploy web.
- **N-block park-or-key: MANDATORY** for task a2dd9f3d.
- No migration to sequence at C-2 (schema-neutral).

---

```yaml
ci_stage_verdict: PASS
verdict_source: gh
verdict_evidence:
  - "gh pr view 46 state MERGED (mergedAt 2026-07-02T01:31:14Z)"
  - "gh pr checks 46 — all 7 required checks passed (run 28559053549, watch EXIT 0)"
  - "integration suite RAN: malformed-uuid-params.spec.ts 10 passed; integration config Test Files 9 passed (9), zero skipped"
  - "merge commit: e1a64f6bbc26aeb47e2f3cf2e2bed624a5c9d965"
pr_number: 46
pr_url: "https://github.com/arina477/test_claudomot/pull/46"
branch: wave-33-uuid-param-validation
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
optional_checks: []
fix_up_cycles: 0
final_commit_sha: 920fee8b7cce71cb9a89922d48bc4874099f41aa
merge_strategy: squash
merge_commit_sha: e1a64f6bbc26aeb47e2f3cf2e2bed624a5c9d965
rebase_cycles: 0
note: "Integration suite confirmed RUN (not skipped) — no false-green. api-only diff; C-2 deploys api service only. Schema-neutral, no migration."

head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    All four core CI jobs (lint, typecheck, test, build) plus secret-scan, boot-probe, and
    e2e ran and passed on the green HEAD commit — none skipped or cancelled. The load-bearing
    false-green guard is satisfied: the real-DB integration suite EXECUTED against the
    postgres:16 service (DATABASE_URL_TEST set at job scope drives SKIP=false), with the
    10 malformed-uuid-params tests passing and the integration config reporting 9/9 test
    files passed, zero skipped — the 22P02→400 proof genuinely ran. gitleaks passed
    (no secret in the diff); CI perms are least-privilege (contents: read); PR branched off
    and targeted main via the gate (no direct-to-main). No migration is present (schema-neutral),
    consistent with the bounded filter-extension change. Merge was MERGEABLE/CLEAN, squashed
    with branch deletion under automatic-mode auto-merge authorization; local main synced to
    the merge commit. No fix-up or rebase cycles. Block did not preemptively pause.
  next_action: PROCEED_TO_C-2
```
