# P-4 Phase-2 Drift Verification — jenny — wave-85

**Wave:** AssignmentCard optimistic toggle-revert fix (snapshot prior status + restore-on-error + surface failure via existing `onAnnounce`). Spec task `3ad35a42`; Plan `P-3-plan.md`.

**Verdict: APPROVE (with one NAMED gap carried to the gate — not blocking drift).**

The spec + plan MATCH every prior decision and the journey map. No route/screen/endpoint/contract change. The one substantive finding is a **gap, not drift**: whether `onAnnounce` genuinely satisfies the "user-facing error" acceptance criterion. It does for screen-reader users; it does **not** for sighted users. Detail below — head-product should confirm AC intent.

---

## Premise verified live (independent)

`apps/web/src/shell/AssignmentCard.tsx` `handleToggle` (:652–664):
- **:660** reverts via `onStatusChange(assignment.id, newState === 'done' ? 'todo' : 'done')` — the assume-opposite bug is real.
- **:659** is `console.error` only — no user-facing surface today.
- **:650** `const announce = onAnnounce ?? (() => {})` is in scope and used by the sibling `StudentSubmitForm` submit/upload error paths (:222, :264). The spec's premise is accurate.

---

## Per-item MATCHES / DRIFTS

### 1. product-decisions.md — optimistic-update / status / error-handling / a11y-announce priors
**MATCHES.** No prior decision governs optimistic-toggle revert semantics, an assignment-status error convention, or a toast standard that this wave would contradict. Prior a11y-announce usage in the same component (submit/upload → `onAnnounce`) is the local precedent the spec deliberately reuses — **consistent**, not drift. The M5 assignment surface priors (wave-22/23/30) concern posting/reminders/delegation, none touch the client toggle revert path. No DRIFT.

### 2. user-journey-map.md — assignments surface, routes/flows
**MATCHES.** The assignments surface is page-14 (F6/F9). This fix is a client-side error-handling correction inside `AssignmentCard` — **no route/screen/endpoint touched**, `api.setAssignmentStatus` unchanged, no schema/migration. The documented happy-path toggle flow is untouched; only the failure path changes. Confirms the spec's `contracts: {api:[], data:[], types:[]}` and `design_gap_flag: false`. No DRIFT.

### 3. Consistency with the app's error-UX — DOES `onAnnounce` satisfy "user-facing error"? — **NAMED GAP**
Independently traced the parent. `AssignmentsPanel.tsx` renders `onAnnounce` into a **`className="sr-only"`** `aria-live="polite"` region (:230–236, `announce` at :63–71). **It is screen-reader-only — invisible to sighted users.**

Meanwhile the app HAS an established visible-toast convention for action failures:
- **DESIGN-SYSTEM.md:106** defines Toast/Snackbar with an explicit danger-error variant, and its canonical example is literally *"message failed — will retry"* — i.e. the exact optimistic-failure class this wave is fixing.
- Visible error toasts are shipped in ReportDialog, BlockConfirmDialog, BlockedUsersPanel, InviteShareModal, ReportInbox (each a locally re-implemented `Toast`, `role="alert"`, fixed bottom-right, visually rendered).

**So there are two coexisting norms:** (a) within the *assignments surface itself*, `onAnnounce` (sr-only) is the ONLY error channel that exists — the panel has no visible toast — so the spec is locally consistent; (b) *across the app*, visible toasts are the convention for action failures, and the design system prescribes exactly that for this failure class.

**Gap (NOT drift):** AC3 says "a user-facing error message is surfaced." With `onAnnounce` → sr-only region, a **sighted user sees nothing** on toggle failure — the card silently snaps back to the prior status with no visible explanation. That is strictly better than today (silent + console-only) and is a11y-correct, but it does not meet "user-facing" in the sighted sense the design system implies. This is a genuine spec-vs-app-convention gap, not a contradiction of a settled decision.

**Why still APPROVE (gap, not blocking drift):**
- The spec **explicitly and knowingly** scopes the visible-toast harmonization OUT to spun-out task `3b878f96` ("shared VISIBLE toast utility across all optimistic sites is a SEPARATE spun-out task, NOT this wave"), and the P-0 ceo-reviewer SELECTIVE-EXPANSION ruling is recorded as the reason. This is a deliberate scope fence with a filed follow-up, not an oversight.
- Within the assignments surface, `onAnnounce` is the only existing channel; reusing it (no new component) matches AC5 and avoids inventing a one-off toast that would then need un-inventing when `3b878f96` lands.

**Recommendation to head-product (confirm at gate):** ratify that AC3's "user-facing" is satisfied by the sr-only announce for THIS wave, with the visible-toast surfacing explicitly owned by `3b878f96`. If the gate reads AC3 as requiring a *visible* surface, that is a one-line scope expansion decision — flag it now rather than let V-1 re-litigate. My read: the sr-only announce is acceptable as the interim, given the documented spin-out, but the gate should say so on the record so V-1 does not file it as an unmet AC.

### 4. Spec-gap: missed cases?
**Adequately covered — no new blocking gap.**
- **Rapid double-toggle race:** spec edge-case #1 handles it — `const prev` captured per-invocation inside `handleToggle`, so each toggle restores its own snapshot. The `p4-watch-items` STALE-CLOSURE item correctly flags that `prev` must reflect status AT CLICK TIME (deps `[assignment.id, onStatusChange]`); since `assignment` is a prop read at invocation from the current render, capturing `assignment.myStatus` inside the callback is fresh — B-3 must verify no stale closure. Named, not missed.
- **Restore-races-a-concurrent-successful-toggle:** worth a note but NOT a blocking gap for a single-card fix. `onStatusChange(id, prev)` writes the parent's list state; if a second toggle succeeded between the failed toggle's flip and its catch, the restore could overwrite the newer value. In practice the failing `await` resolves fast and the checkbox is a single control (no concurrent second success without a second user interaction on the same card). This is inherent to any optimistic-revert-through-parent model and is exactly the class the app-wide `3b878f96` harmonization should address. Acceptable to defer; recommend a one-line prose note in the task.
- **Offline vs server-error distinction:** out of scope — both are `catch` → restore + announce; no per-cause branching required by any AC. Not a gap.
- **TEST-HONESTY:** `p4-watch-items` correctly mandates the failed-toggle test be constructed so `opposite(newState) !== capturedPrior` (else it passes on old assume-opposite code = coverage theater). Plan step B-3 test (b) commits to this. Named.

---

## Summary

- **Drift:** NONE. Spec + plan are consistent with product-decisions and the journey map; no route/contract/schema change.
- **Gap (named, non-blocking):** `onAnnounce` surfaces the failure to **screen readers only** (sr-only `aria-live` region in `AssignmentsPanel`); sighted users see no visible message. The app's convention (and DESIGN-SYSTEM.md's canonical "message failed" example) is a **visible toast**. The spec knowingly spins the visible-toast harmonization out to `3b878f96`. head-product should ratify on the record that the sr-only announce satisfies AC3 for THIS wave so V-1 doesn't file it as unmet.
- **Recommendation:** APPROVE. Add a one-line task-prose note on the restore-vs-concurrent-success race (defer to `3b878f96`). Enforce the STALE-CLOSURE and TEST-HONESTY watch-items at B-3.
