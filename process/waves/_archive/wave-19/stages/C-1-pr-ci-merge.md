# Wave 19 — C-1 PR, CI & merge

## Branch push
- Branch `wave-19-m3-attachments` @ `42af671` already pushed (upstream in sync, clean tree). No re-push needed.

## PR
- **PR #31** — https://github.com/arina477/test_claudomot/pull/31
- Base `main`, head `wave-19-m3-attachments`.
- Title: `feat: M3 file/image attachments — upload/storage + composer + render (#wave-19)`
- Body: summary + test plan + spec contract + wave artifacts (AI-attribution footer per CI-PRINCIPLES default).

## Required CI checks (observed via `gh pr checks 31` — 7 jobs)
Single run `28465263636` on headSha `42af671`.

| Job | Conclusion |
|---|---|
| lint | **FAILURE** |
| typecheck | success |
| test | **FAILURE** |
| build | success |
| secret-scan (gitleaks) | success |
| boot-probe | success |
| e2e | success |

**FALSE-GREEN TRAP CAUGHT (waves 17/18 lesson).** `gh run watch 28465263636 --exit-status` returned **exit 0** (overall-run-level green), but reading the per-job conclusions via `gh run view --json jobs` exposed `lint: failure` and `test: failure`. Trusting the watch exit code / green icon would have merged a red build. The logs were read, not the icons.

## Attachment + C-1 negative-path tests — CONFIRMED EXECUTED (not skipped/no-op)
Pulled from the `test` job log (`gh run view --log --job 84363287134`). All five api send-time security tests RAN and PASSED:
- `MessagesService.createMessage … cross-channel key → 400 BadRequestException (IDOR prevention)` ✓
- `… HeadObject reports >10MB → 413 PayloadTooLargeException (size-bypass closed)` ✓
- `… HeadObject reports disallowed MIME → 400 BadRequestException (type-spoof closed)` ✓
- `MessagesService.createReply … cross-channel key in reply → 400 BadRequestException` ✓
- `… HeadObject reports >10MB in reply path → 413 PayloadTooLargeException` ✓

Web composer negative-paths also PASSED:
- `MessageComposer … rejects a file that is too large (>10MB) — shows error tile, does not enable send` ✓
- `MessageComposer … rejects a file with a disallowed content-type — shows error tile` ✓

**The attachment feature itself is green.** The two CI failures are OUTSIDE attachment scope.

## CI failures — classified per Iron Law (NOT fixed directly)
Neither failure is a documented B-5 flake (`flakes_documented: []`), so the re-run-once path (Action 8 Step A) does NOT apply — both route to triage (Step B).

### Failure 1 — `lint` (tag: `lint`) — DETERMINISTIC, WAVE-INTRODUCED
- File: `apps/web/src/shell/messaging.test.tsx` — "File content differs from formatting output" (Biome format check).
- This wave touched this file (+166 lines — the attachment composer tests). Format drift was introduced by the attachment work / B-6 fix-ups.
- **Reproduces locally**: `pnpm lint` → exit 1, "Found 1 error." So this is NOT a CI-only quirk — B-5's `lint_passed: true` was a false report (local-vs-CI divergence / stale local state). A re-run will NOT clear it; the file must be formatted (`biome format --write` / `pnpm lint` fix) by the B-stage.

### Failure 2 — `test` (tag: `testing` / flaky) — NON-DETERMINISTIC, NOT WAVE-INTRODUCED
- File: `apps/web/src/shell/server-roles.test.tsx > ServerRolesPage > calls api.updateRole on Save and shows success toast`.
- Assertion: `expected "spy" to be called with arguments: ['srv-1','role-1',…]`; `Number of calls: 0`.
- Web workspace result: `1 failed | 150 passed (151)`.
- This file was last changed at wave-10 (`3cf63bf` M2 roles) — **this wave did NOT touch it** (no diff vs main). Server-roles is a prior M-feature, not attachments.
- **Does NOT reproduce locally**: `vitest run src/shell/server-roles.test.tsx` passes 24/24 locally. CI stderr shows `An update to ServerRolesPage inside a test was not wrapped in act(...)` → a fake-timer / async-await race that flakes under CI's slower parallel runner. This is an undocumented flaky test surfacing now; per Action 8 Step B it routes to triage rather than a silent re-run.

## Routing (Iron Law — orchestrator routes; head-ci-cd does NOT fix)
- **Lint** → `/investigate` → B-5 (verify) / B-3 (frontend): re-format `apps/web/src/shell/messaging.test.tsx`; fix the B-5 lint-gate gap that let unformatted code through as `lint_passed: true`.
- **Server-roles test** → `/investigate` → `testing` tag (test author / `react-specialist`): stabilize the `updateRole` async assertion (wrap in `act`/`waitFor`, remove the fake-timer race). Document as a known flake OR fix at root — do NOT mask with a blind re-run.
- Fix-up commits land on `wave-19-m3-attachments`; C-1 re-runs Action 7 (re-watch CI) on the new HEAD. Fix-up cycle cap: 5.

## Fix-up cycle 1 (resolved both reds)
Per Iron Law, fixes were root-caused by specialists, NOT by the orchestrator/head:
- **Lint** (react-specialist): `biome format --write apps/web/src/shell/messaging.test.tsx` → format-only, one file. Local `pnpm lint` exit 0.
- **Test flake** (test-automator): root cause = `fireEvent.click` on a still-`disabled` Save button (`setDirty(true)` not yet committed under the slow CI runner → JSDOM suppresses the click → `updateRole` 0 calls). Fix = `await waitFor(() => expect(...).not.toBeDisabled())` before click on Save + Discard (a sibling test with the same latent race). **Assertions NOT weakened** — `toHaveBeenCalledWith('srv-1','role-1',…)` intact. 24/24 across 8 local runs.
- Fix-up commit `8451e87` pushed. New CI run `28465808091` on `8451e87`: **all 7 jobs success** (per-job conclusions verified, not just watch exit). C-1 negative-path tests re-confirmed executed+passed in the green run (api send+reply, presign/confirm allowlist, web composer rejection).

## Merge — DONE
- `mergeable: MERGEABLE`, `mergeStateStatus: CLEAN` → `gh pr merge 31 --squash --delete-branch`.
- **Merge commit: `dbf6b25`** (`dbf6b2575f4efed0633e316f2b32bf05ad8eb43b`), merged 2026-06-30T18:09:39Z.
- Local main synced (`git pull --rebase`, HEAD = dbf6b25). Origin branch `wave-19-m3-attachments` deleted (404). Migration 0009 present on main.

## CI lessons noted for L-2 (NOT written to CI-PRINCIPLES — L-2's gate per head-learn + Karen)
1. **`gh run watch --exit-status` reports overall-run exit, which can read 0 while individual required jobs failed.** The authoritative per-job verdict is `gh run view <run-id> --json jobs --jq '.jobs[].conclusion'`. C-1 should gate on per-job conclusions, never the watch exit code alone. (Recurrence: waves 17/18 false-green; this is the 3rd instance — strong L-2 promotion candidate.)
2. **B-5 reported `lint_passed: true` while CI lint fails deterministically (reproduces locally).** B-5's local lint check diverged from CI — likely ran against stale/auto-fixed local state or a different scope. B-5 must run the exact CI command (`pnpm lint`, no auto-fix) before claiming green.
3. **An undocumented flaky test (`server-roles … updateRole`, passes 24/24 locally, fails under CI parallel runner with an `act(...)` warning) reached C-1.** Flaky tests not in `flakes_documented` block the merge and cost a triage cycle; B-5 should run the web suite under CI-like conditions (parallel, no watch) to surface timing flakes before C-1.

---
```yaml
ci_stage_verdict: PASS                # PR merged after 1 fix-up cycle cleared both reds
verdict_source: gh
verdict_evidence:
  - "INITIAL run 28465263636 (42af671): lint=failure, test=failure — caught via per-job conclusions, NOT the false-green `gh run watch` exit 0"
  - "FIX-UP run 28465808091 (8451e87): all 7 jobs success (lint, typecheck, test, build, secret-scan, boot-probe, e2e) — per-job conclusions verified"
  - "ATTACHMENT + C-1 negative-path tests CONFIRMED EXECUTED + PASSED in the green run: cross-channel→400, >10MB→413, type-spoof→400 (send + reply), presign/confirm allowlist→400, composer >10MB / disallowed-type rejection"
  - "gitleaks secret-scan passed; permissions contents:read (least-privilege); Postgres 16 service on test job"
  - "gh pr view 31: state MERGED, mergeStateStatus CLEAN; merge commit dbf6b25"
pr_number: 31
pr_url: https://github.com/arina477/test_claudomot/pull/31
branch: wave-19-m3-attachments
required_checks: [lint, typecheck, test, build, secret-scan, boot-probe, e2e]
required_checks_failed: []            # cleared in fix-up cycle 1
optional_checks: []
fix_up_cycles: 1
final_commit_sha: 8451e87e0b06e0db121841585d9ab842c7c8be12   # green commit pre-merge
merge_strategy: squash
merge_commit_sha: dbf6b2575f4efed0633e316f2b32bf05ad8eb43b
rebase_cycles: 0
note: "PASS after 1 fix-up cycle. Initial run red on lint (wave-introduced format drift, deterministic) + test (flaky server-roles updateRole, NOT wave-scope). Both root-caused by specialists per Iron Law (head did NOT fix directly): biome format-write + waitFor(not.toBeDisabled) before click; assertions intact. Attachment feature green throughout; all C-1 security negative-path tests executed+passed. Merged dbf6b25; branch deleted; migration 0009 on main."
```

---
```yaml
head_signoff:
  verdict: APPROVED
  stage: C-1
  reviewers: {}
  failed_checks: []
  rationale: >
    PR #31 merged after one fix-up cycle. The initial run was correctly REJECTED — reading
    per-job conclusions (not the misleading `gh run watch` exit 0) caught lint + test reds
    that the green icon hid. Both were root-caused and fixed by specialists per the Iron Law
    (head-ci-cd did not fix directly): a wave-introduced Biome format drift in
    messaging.test.tsx, and a non-wave-scope flaky server-roles test whose Save-button click
    raced a still-disabled button under the slow CI runner — fixed with a waitFor guard, no
    assertion weakened. The fix-up run 28465808091 is all-7-green; every C-1 security
    negative-path test (cross-channel IDOR→400, >10MB→413, type-spoof→400, send + reply,
    presign/confirm allowlist) and the composer rejection tests EXECUTED and PASSED in that
    green run. gitleaks blocking + passed, CI least-privilege (contents:read), Postgres 16 on
    the test job, branch→main correct, migration 0009 committed. Merge commit dbf6b25;
    branch deleted; main synced.
  next_action: PROCEED_TO_C-2
```
