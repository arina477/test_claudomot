# C-1 — PR → CI → Merge (wave-85)

**Stage owner:** head-ci-cd
**Wave:** 85 — StudyHall — AssignmentCard optimistic-toggle revert fix
**B-6 status on entry:** APPROVE
**Outcome:** MERGED

---

## PR

- **Number:** #105
- **URL:** https://github.com/arina477/test_claudomot/pull/105
- **Title:** `fix(web): AssignmentCard toggle restores prior status + error toast (wave-85)`
- **Base ← Head:** `main` ← `wave-85-assignment-toggle-revert`
- **Feature-branch HEAD at PR-open:** `962f46f8d6b61f9c5bd428fa60316e73d9825001`
- **Primary task:** `3ad35a42`

### Scope (as shipped)
- AssignmentCard optimistic done/todo toggle now restores the **actual captured prior status** on a failed update (previously assumed the opposite status — corrupting state on retry/race).
- On failed update, shows a **visible error toast** + screen-reader announcement instead of failing silently.
- Single-component fix; app-wide shared-error-toast harmonization is a separate queued task.

---

## Required checks (6/6 GREEN)

Run ID `29034899646` (branch protection required set: lint, typecheck, test, build, secret-scan, boot-probe).

| Required check | Result | Duration |
|---|---|---|
| lint | **pass** | 26s |
| typecheck | **pass** | 45s |
| test | **pass** | 1m52s |
| build | **pass** | 42s |
| secret-scan | **pass** | 11s |
| boot-probe | **pass** | 1m10s |

All 6 required checks passed on the initial run and again after the e2e-only rerun.

### Non-required check
| Check | Result | Note |
|---|---|---|
| e2e | **fail** | NOT in required-check set → does not gate merge. Documented pre-existing flake (see below). |

---

## Flake handling

- **Failing spec:** `apps/web/e2e/delete-any-message.spec.ts:83` — `[chromium-authed] › moderator (A) can delete any message; non-moderator (B) cannot delete A's message; B sees fan-out tombstone`.
- **Failure mode:** `expect(pageA.getByText(bMessageMarker)).toBeVisible()` timeout (15s) at line 124 — the two-client cross-client realtime fan-out marker not visible in time. 4 of 5 e2e specs passed both times.
- **Classification:** documented pre-existing two-client realtime flake (per C-1 brief flake list). Frontend-only wave-85 change (AssignmentCard) is unrelated to the messaging/fan-out surface exercised by this spec — not a regression from this wave.
- **Rerun:** ONE `gh run rerun 29034899646 --failed` performed. Re-failed with the identical spec / identical locator-timeout / identical 4-passed-1-failed pattern (only the ephemeral `B-sent-<ts>` marker differed). Confirmed same flake; one allowed rerun exhausted.
- **Decision:** e2e is not a required check; the 6 required checks are green. No Iron-Law fix attempted (correctly — pre-existing flake, unrelated surface). Not escalated.

---

## Merge

- **Method:** `gh pr merge 105 --squash --delete-branch` (per CRITICAL PROCESS RULE — never `git push HEAD:main`).
- **mergeStateStatus at merge:** `UNSTABLE` (non-required e2e red; all required green) → merge allowed.
- **State:** **MERGED** at 2026-07-09T16:55:24Z.
- **Merge commit SHA:** `9d22df4e38dd6a3a7876d91f0c198fa8a11f85fd`
- **Branch `wave-85-assignment-toggle-revert`:** deleted on merge.

---

## Local main sync

- `git checkout main` → `git pull --rebase` from origin.
- Local `main` HEAD: `9d22df4e38dd6a3a7876d91f0c198fa8a11f85fd`
- Head commit: `9d22df4e fix(web): AssignmentCard toggle restores prior status + error toast (wave-85) (#105)`

---

## Handoff to C-2

Merge landed on `main`. Per project deploy model (memory: Railway is CLI-push, not git-trigger), C-2 must run `railway up` per changed service — merge to main does NOT auto-deploy. Wave-85 is web-only (frontend AssignmentCard); C-2 should target the web service.
