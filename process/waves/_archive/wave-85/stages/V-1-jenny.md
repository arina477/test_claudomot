# Wave-85 V-1 — jenny semantic-spec verification

**Scope:** Spec-conformance only (deployed behavior vs SPEC CONTRACT INTENT). Not source-claim (karen's lane). Task `3ad35a42-efe5-4e9d-8f90-d22d6fe345e8`.
**Deployed target:** web `https://web-production-bce1a8.up.railway.app` @62bae5fd (bundle `index-DbePiYZE.js`), live-verified at T-5.

## Verdict: APPROVE

All 5 acceptance criteria + both P-4-phase2 corrections + both P-4 watch-items conform to deployed behavior. No spec drift. No gaps.

## Per-AC verification (INTENT vs DEPLOYED)

**AC1 / AC2 — success unchanged + restore CAPTURED prior on failure — CONFORM.**
Spec's central assertion: on a failed toggle, restore the ACTUAL prior status captured BEFORE the optimistic flip (`assignment.myStatus` at click time), NOT the assumed-opposite of `newState`. T-5 live evidence (`forced_failure_revert: PASS`) shows status REVERTED to the PRIOR value (todo→todo), explicitly "NOT stuck-flipped, NOT wrong-direction." That is the snapshot-restore semantic, not the assume-opposite bug. Happy path (`happy_path_toggle: PASS`) — optimistic flip persists (PUT /status 200), no error surfaced — matches AC1 "behavior is unchanged." CONFORM.

**AC3 — VISIBLE user-facing error toast — CONFORM (the P-4 jenny correction is satisfied).**
The P-4 correction I raised: `onAnnounce` renders into a sr-only region (invisible to sighted users), so `onAnnounce` ALONE does not satisfy "user-facing error" — a VISIBLE toast is required. T-5 (`forced_failure_toast: PASS`) confirms on the deployed bundle: a VISIBLE red-bordered toast (border rgb(239,68,68)) with the exact spec message "Couldn't update assignment. Please try again." appears bottom-of-viewport, persists >1s, then auto-dismisses. The message names the failure per spec. The sighted-user error intent is met on the live bundle. CONFORM.

**AC4 — announce EXACTLY ONCE — CONFORM.**
T-5 (`sr_announcement: PASS`) confirms an sr-only aria-live=polite region carries the same message (announce-once). The visible toast is the sighted surface and the sr-only channel the screen-reader surface; T-5 notes no double-read. `console.error` may remain (T-5 console: "6x intentional [AssignmentCard] status toggle failed (guarded catch)" — expected, not the user surface). CONFORM.

**AC5 — no new component beyond reuse / scope — CONFORM with ceo-reviewer SELECTIVE-EXPANSION ruling.**
This wave ships a local visible toast on the single AssignmentCard (the unique assume-opposite offender per the P-0 grep of all 9 optimistic sites). The app-wide consistency initiative — 8-of-9 sites silent on failure + a shared visible-toast utility — is spun out to task `3b878f96-0fea-48f5-ac1e-7ba639e0072b` (status `todo`), whose description explicitly records "Source: wave-85 P-0 ceo-reviewer SELECTIVE-EXPANSION spin-out." Scope is consistent with the SELECTIVE-EXPANSION ruling: single card + its user-facing error IN this wave; app-wide harmonization spun out. CONFORM.

## Cross-cutting checks

- **product-decisions.md:** wave-85 entry (2026-07-09, line 913) documents the seed (restore prior state cleanly + tell the student it failed) as a milestone-less bug-fix wave; premise re-verified as present-and-unfixed since wave-42. The spin-out's SELECTIVE-EXPANSION lineage is recorded on the `3b878f96` task row itself. No prior decision is contradicted — this is a correctness + honest-error-surface fix, aligned with the offline-first bet (failed writes are common offline, so a user-facing error surface matters). No DRIFT.
- **Journey map:** page 14 "Assignments panel" (F6/F9) with per-member status toggle is the affected surface. This wave changes ONLY the failure-path behavior (restore + visible toast); no route, screen, endpoint, or contract change (`api.setAssignmentStatus` unchanged; contracts block empty). Confirmed NO route/screen change — annotation-only if regen'd. No DRIFT.

## Drift vs gap distinction

No drift (deployed behavior matches spec intent on every AC). No gap (every AC has affirmative live evidence at T-5, cross-checked against the spec's central assume-opposite-vs-snapshot-restore assertion and the P-4 visible-toast correction). The two P-4 watch-items (stale-closure at click-time; test-honesty so opposite(newState) != capturedPrior) are source/test-construction concerns owned by karen; from the DEPLOYED-behavior side the restore-to-actual-prior outcome (T-5 todo→todo, not wrong-direction) is the observable that would fail on the old assume-opposite code, so the behavioral intent those watch-items protect is satisfied live.

**APPROVE.**
