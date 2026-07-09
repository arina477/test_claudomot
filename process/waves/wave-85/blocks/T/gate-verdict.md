# Wave 85 — T-9 Block-exit Gate Verdict

**Block:** T (Test) · **Gate:** T-9 · **Head:** head-tester · **Attempt:** 1
**Wave topic:** AssignmentCard optimistic toggle-revert — snapshot prior status + restore on failure (was assume-opposite) + visible error toast + a11y announce (was silent). Frontend-only, deployed live. wave_type=[ui].

## VERDICT: APPROVED

Fresh independent review — read the production fix (`apps/web/src/shell/AssignmentCard.tsx`), the test suite (`apps/web/src/shell/assignments.test.tsx`), and all T-stage deliverables. Not a rubber-stamp: verified the fix code and the test-honesty claim against source, not just the summaries.

---

## Judgment against the four gate questions

### 1. Is the T-5 live proof sufficient? — YES
The tester forced a real failure (fetch-override rejecting the PUT `/status`) on the DEPLOYED bundle (`index-DbePiYZE.js`, web 62bae5fd) and confirmed all three fix behaviors on production:
- **Visible toast:** red-bordered (`border rgb(239,68,68)`), correct copy ("Couldn't update assignment. Please try again."), bottom-anchored ~360×66, persists >1s then auto-dismisses.
- **Prior-status revert:** status restored to the PRIOR value (todo→todo), NOT stuck-flipped, NOT wrong-direction — the snapshot-restore fix behaving live, distinct from the old assume-opposite.
- **SR announce:** `aria-live=polite` sr-only region carries the same message, announce-once.

Happy-path (todo↔done persists, PUT 200, no error toast on success, toggles back clean) also verified live. Console clean — only the 6× intentional guarded-catch logs, one benign transient 401 (token race, delete still 204'd), and a pre-existing PWA icon 404 unrelated to this wave. This is production-behavior proof on the shipped bundle, not just unit assertions. Adequate.

**Live cases not exercised:** the rapid double-toggle race was proven at the unit/integration layer (deterministic pending-promise control), not live — correctly so; forcing a mid-flight double-fire against a live server is non-deterministic and lower-value than the deterministic unit proof. No material live gap.

### 2. Test-honesty — GENUINE, not coverage theater
Head-builder independently reproduced 2/3 failing on the old assume-opposite/console-only code. I verified WHY that holds against source:
- **Binary-status equivalence acknowledged:** on a SINGLE toggle the revert VALUE is identical between assume-opposite and snapshot-restore (todo↔done is symmetric). A value-only single-toggle assertion would be theater. The suite does not rest there.
- **The distinguishing coverage is real:**
  - *Visible toast + announce-once* (`shows a VISIBLE error toast and announces exactly ONCE`, test line 417): asserts `status-toggle-error-toast` in DOM, correct text, `aria-hidden="true"`, and `announce` called exactly once. The old console-only code produced NEITHER a toast NOR an announce — this test cannot pass on old code. This is the primary honesty anchor.
  - *Per-invocation race-safety* (`rapid double-toggle race`, test line 354): toggle-2 captures the mid-flight optimistic `'done'` as its prior; assume-opposite would emit the divergent sequence, snapshot-restore emits `['done','todo','todo','done']`. Proves the snapshot is per-invocation (fresh via the `assignment.myStatus` useCallback dep), not a shared/opposite guess. Fails on old behavior.
  - *F1 timer-stability regression* (test line 453): guards the `dismissStatusError` useCallback stabilization — a fresh inline `onGone` each render tore down + recreated the 3500ms setTimeout on every parent realtime-tick re-render, so the toast never dismissed. Real, costly-if-regressed behavior.

The tests prove the fix's actual value (visible failure surface + a11y announce + race-safe per-invocation restore), not the binary-equivalent revert value alone. Honest.

### 3. Skip honesty — ALL FOUR CORRECT
- **T-8 Security — correctly skipped.** The change touches only the client-side error-handling of an existing assignment status-toggle (`api.setAssignmentStatus` call site + catch block + a local toast/announce). No auth/session/payment/cookie/CSRF/rate-limit surface is added or modified; no new endpoint, no permission logic. Confirmed against source — `handleToggle` calls an existing API method and manipulates only local React state on failure. Per the CLAUDE.md security trigger, this wave does not touch any security-scoped surface. Skip is honest.
- **T-6 Layout — correctly skipped.** The toast is a transient, failure-only element (`aria-hidden`, fixed-position, 3500ms auto-dismiss) matching the existing ReportDialog Toast visual language; the shared-utility extraction is explicitly spun out (task 3b878f96), not done here. No persistent layout surface changes — the card's steady-state render is unchanged. Skip is honest.
- **T-3 Contract — correctly skipped.** No API contract / DTO / schema change; the fix consumes the existing `setAssignmentStatus` signature.
- **T-7 Perf — correctly skipped.** No heavy path, list virtualization, or query change; a single guarded catch + one boolean state + a timer.

### 4. Coverage gaps / theater — NONE material
Static (T-1 CI green), unit + integration (web 788, real-prop-wiring host mirroring AssignmentsPanel per BUILD-12), and live E2E on the deployed bundle together cover: happy-path persist, single-failure restore + toast + announce-once, per-invocation race restore, and timer-stability. The failure path — the entire point of this wave — is proven at three layers including production. No gap warranting REWORK or ESCALATE.

---

## Findings
None blocking. No REWORK items.

## Gate decision
**APPROVED** — proceed to V-block (V-1 Reviews).
