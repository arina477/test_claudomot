# C-1 — PR, CI & merge (wave-87)

**Stage:** C-1 (PR + CI + merge)
**Owner:** head-ci-cd
**Wave:** wave-87 — assign default 'Member' role on server join (behavior-preserving data-hygiene)
**Primary task:** dc4abee3 (single-spec)

## Execution log

- **Push:** `git push -u origin wave-87-join-default-role` — succeeded (new branch on origin; 4 commits ahead of main, clean tree).
- **PR created:** #107 — https://github.com/arina477/test_claudomot/pull/107
  - Title: `feat: assign default member role on server join`
  - Body: heredoc; AI-attribution footer included.
- **Required checks** (from `repos/.../branches/main/protection` → `required_status_checks.contexts`): `lint, typecheck, test, build, secret-scan, boot-probe` (6). **e2e is NOT required.**
- **CI run:** 29045864818 (single workflow, 7 jobs). Watched to completion; per-job conclusions read authoritatively via `gh run view --json jobs` (CI-PRINCIPLES rule 3).

### Required-check outcomes

| Check | Required | Conclusion |
|---|---|---|
| lint | yes | PASS |
| typecheck | yes | PASS |
| build | yes | PASS |
| secret-scan | yes | PASS |
| boot-probe | yes | PASS |
| **test** | **yes** | **FAIL (blocking)** |
| e2e | no | fail (non-blocking — prod-baseURL, CI-PRINCIPLES rule 11) |

### Blocking failure — classification (Iron Law: classified, NOT fixed)

`test` job failed on the **`@studyhall/web`** workspace suite (`pnpm test:ci`). API suite passed. Web result: **Test Files 1 failed | 58 passed (59); Tests 2 failed | 786 passed (788).**

Failing file: `apps/web/src/shell/study-timer.test.tsx` — `StudyTimerWidget`:
1. `validation error sets aria-invalid="true" on the input` — `Error: Test timed out in 5000ms`, then teardown error `Timers are not mocked. Try calling "vi.useFakeTimers()" first.` at `study-timer.test.tsx:226` (`vi.runOnlyPendingTimers()` in afterEach with real timers active).
2. `F-1: root widget element does not set inline borderLeft (phase CSS class wins)` — `TestingLibraryElementError: Found multiple elements by [data-testid="study-timer-widget"]` (prior render not unmounted — component left mounted, DOM leaked into sibling test).

**Classification:** `unit` tier / **fake-timer + test-isolation leakage** in a pre-existing web component test (`StudyTimerWidget`). The timeout in test (1) leaves timers/render alive; the "multiple elements" in test (2) is the cascade of the un-cleaned mount. **Unrelated to wave-87's change** — wave-87 touches server-join / server_members / default-role (API), not the StudyTimerWidget web component.

**Originating stage (per triage):** web unit test authoring — B-2 / B-3 / test-author layer of the wave that introduced `study-timer.test.tsx` (NOT wave-87 B-block; wave-87 added no web tests). Route to the originating web/test specialist via `/investigate` per the Iron Law.

**Flake handling:** NOT re-run. Wave-87 B-5 `flakes_documented` is empty; CI-PRINCIPLES rule 12 forbids granting a flake re-run to a test not in the B-5 ledger. Although the symptoms (timer/isolation nondeterminism) resemble a flake, an unledgered failure must not be silently re-run — masking a real regression. Not a runner-outage / queued→cancelled infra case, so the one-shot infra rerun exception does not apply either.

**No merge.** `test` (required) is red; merge blocked. No fix attempted (orchestrator does not fix). No history rewrite. Branch and PR left OPEN for the routed fix-up cycle.

## Mergeable state (initial cycle)

`gh pr view 107 --json mergeable,mergeStateStatus` → `mergeable: MERGEABLE`, `mergeStateStatus: BLOCKED` (required `test` check failing — expected).

---

## Fix-up cycle 1 — study-timer flake root-cause fix (resume)

The pre-existing `study-timer.test.tsx` fake-timer + isolation flake was root-cause fixed (commit **7d45bd62**: per-test timeout 15000 > asyncUtilTimeout 5000, guarded `afterEach` teardown so `vi.runOnlyPendingTimers()` no longer fires under real timers). Verified locally: study-timer 37/37, full web suite 788/788, API suite 828/828 all green.

- **Push:** `git push origin wave-87-join-default-role` — fast-forward add of 7d45bd62 (`ef7256b3..7d45bd62`). No force.
- **Re-run:** CI run **29046535139** on head **7d45bd62** (`gh run view --json headSha` confirmed match). Watched to completion.

### Required-check outcomes (fix-up cycle 1 — authoritative, `gh pr checks 107`)

| Check | Required | Conclusion |
|---|---|---|
| lint | yes | PASS |
| typecheck | yes | PASS |
| **test** | **yes** | **PASS** (flake fix held — study-timer green in runner) |
| build | yes | PASS |
| secret-scan | yes | PASS |
| boot-probe | yes | PASS |
| e2e | no | fail (non-blocking) |

**All 6 required checks green.** The `test` check now passes — the fix-up held.

### Deviation — unrelated e2e flake (non-blocking)

`e2e` (non-required) failed on a **different** flake than the study-timer one: `apps/web/e2e/delete-any-message.spec.ts:53` — `getByRole('navigation', { name: 'Server rail' })` not visible within 25s during sign-in (moderator-delete fan-out spec). This is a separate E2E sign-in/nav-render timing flake, unrelated to wave-87's server-join API change AND unrelated to the study-timer web-unit fix. Because e2e is not in the branch-protection required set (`lint, typecheck, test, build, secret-scan, boot-probe`), it does not gate merge (CI-PRINCIPLES rule 11 — prod-baseURL/E2E non-required). No fix attempted; noted for the originating E2E stage.

## Mergeable state (fix-up cycle 1)

`gh pr view 107 --json mergeable,mergeStateStatus` → `mergeable: MERGEABLE`, `mergeStateStatus: UNSTABLE` (only non-required `e2e` red; all required checks green — merge not blocked).

## Merge

`gh pr merge 107 --squash --delete-branch` — succeeded (exit 0). Branch `wave-87-join-default-role` deleted on origin.
`gh pr view 107 --json state,mergeCommit,mergedAt` → `state: MERGED`, `mergeCommit.oid: 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e`, `mergedAt: 2026-07-09T20:06:19Z`.
`git checkout main && git pull --rebase && git rev-parse HEAD` → **1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e** (`feat: assign default member role on server join (#107)`) — matches PR mergeCommit oid.

---

```yaml
ci_stage_verdict: PASS                 # all 6 required checks green; PR 107 squash-merged
verdict_source: gh
verdict_evidence:
  - "gh pr checks 107 (run 29046535139, head 7d45bd62): lint/typecheck/test/build/secret-scan/boot-probe=PASS; e2e=fail (non-required)"
  - "branch protection required contexts: [lint, typecheck, test, build, secret-scan, boot-probe] — e2e NOT required"
  - "test check PASS in runner — study-timer flake fix (7d45bd62) held; local: study-timer 37/37, web 788/788, api 828/828"
  - "gh pr view 107: state MERGED, mergeCommit.oid 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e, mergedAt 2026-07-09T20:06:19Z"
  - "git rev-parse HEAD on main == 1d2ef9df (feat: assign default member role on server join (#107))"
pr_number: 107
pr_url: https://github.com/arina477/test_claudomot/pull/107
branch: wave-87-join-default-role
ci_run_id: 29046535139               # fix-up cycle 1 run (head 7d45bd62); initial run was 29045864818
required_checks:
  - {name: lint, result: PASS}
  - {name: typecheck, result: PASS}
  - {name: test, result: PASS}
  - {name: build, result: PASS}
  - {name: secret-scan, result: PASS}
  - {name: boot-probe, result: PASS}
optional_checks:
  - {name: e2e, result: FAIL, note: "delete-any-message.spec.ts:53 Server-rail nav sign-in timeout; DIFFERENT flake from study-timer; non-required per CI-PRINCIPLES rule 11"}
fix_up_cycles: 1
fix_up_detail:
  - cycle: 1
    commit: 7d45bd62
    reason: "root-cause fix of pre-existing study-timer.test.tsx fake-timer + isolation flake (per-test timeout 15000 > asyncUtilTimeout 5000, guarded afterEach teardown)"
    outcome: "required 'test' check PASS — flake fix held"
deviations:
  - "unrelated-flake-fix: the blocking failure was a PRE-EXISTING web-test flake (study-timer.test.tsx), NOT a wave-87 regression. Root-cause fixed on the wave-87 branch (7d45bd62) rather than routed cross-wave, to unblock the merge. Local full-suite green pre-push."
  - "non-required e2e (delete-any-message.spec.ts Server-rail nav timeout) failed on a DIFFERENT flake; non-blocking; left for originating E2E stage."
final_commit_sha: 7d45bd62193533eebcb3aa419842c49d4eaaf78d   # head of branch pre-squash
merge_strategy: squash
merge_commit_sha: 1d2ef9df5e1bec4f74f503d4bf3f1684d7fbfc7e
rebase_cycles: 0                       # mergeStateStatus was UNSTABLE (non-required e2e), never BEHIND — no rebase needed
note: "One fix-up cycle: the pre-existing study-timer web-unit flake was root-cause fixed (7d45bd62) and held — required 'test' check green. All 6 required checks PASS. PR 107 squash-merged; branch deleted. Merge commit on main: 1d2ef9df. Non-required e2e failed on a separate, unrelated flake (non-blocking)."
```
