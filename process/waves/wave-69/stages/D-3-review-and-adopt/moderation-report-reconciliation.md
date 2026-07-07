# D-3 Reconciliation (iteration 1) — moderation-report
Reviewer A (ui-designer): REVISE (VH9/Space8/Brand10/State8/A11y8/Resp8). Reviewer B (accessibility-tester): REJECT (danger-button contrast blocker).
Matrix: REVISE + REJECT → Reject wins → D-2 refine (iteration 2), within cap 3. Dark-on-emerald primary PASSES (§8 fix held, ~6.9:1). Fixes are CSS/JS-level.
Aggregated fixes for aidesigner refine iter-2:
1. BLOCKING (both): DANGER BUTTON contrast — white text on --danger #ef4444 ≈2.3-4:1, FAILS AA. Fix: use a DARKER danger fill for BUTTONS (e.g. #dc2626 ≈4.5:1, or #b91c1c for comfortable AA) with white text, OR near-black text. Apply to all destructive buttons (Delete Message / Timeout / Delete File). (Note: --danger #ef4444 stays valid for FILLS/borders/badges; the BUTTON variant needs an AA-compliant fill — flag for a possible §8 danger-button note at head-designer.)
2. Modal FOCUS-TRAP keyboard cycle (Tab/Shift+Tab bounded to the dialog; not just focus-on-open + Esc).
3. Inbox LOADING state — skeleton rows (per §8 lists), not a spinner.
4. Dialog ERROR state — a network-error branch in the submit flow (toast type=error already exists).
5. Mobile SHEET (<640px): the report dialog becomes a full-width bottom sheet (anchor bottom-0, full width, rounded-t-lg, drop vertical centering).
6. SHOW the report AFFORDANCE entry points: a flag/report control on a public discovery server CARD, a MEMBER row, and a MESSAGE hover-action — so the consistent report control is visible (brief §9).
next_destination: D-2 refine (iteration 2)

---
# D-3 Reconciliation (iteration 2 → cycle 3 refine)
Reviewer A (ui-designer): REVISE (all 6 iter-1 issues RESOLVED; 5 new single-attr fixes). Reviewer B (accessibility-tester): APPROVE.
Matrix: REVISE + APPROVE → aggregate A → D-2 refine. THIS IS CYCLE 3 (cap). If cycle-3 review is not APPROVE/APPROVE → 3-cap escalation (BOARD, automatic mode).
Aggregated A concerns (all single-attribute/token):
- C1 (WCAG AA, blocking): nav badge uses bg var(--danger) #ef4444 + white text = 3.76:1 FAIL. Fix: swap to var(--danger-btn) #b91c1c.
- C2 (WCAG 2.4.7, blocking): close button uses focus-visible:ring-[var(--glow-focus)] but --glow-focus is a box-shadow string, not a color → no visible ring. Fix: give the close button the btn-base class (its :focus-visible box-shadow works) or an explicit box-shadow focus rule.
- C3 (WCAG AA, blocking): --text-muted at 11px used for informational text (Reason labels, rail headers, timestamps) = 2.96:1 on surface-800 FAIL. Fix: use --text-secondary (5.97:1) for informational labels; keep --text-muted for placeholders/decorative only.
- C4 (brief §3, moderate): inbox handleAction() has no error branch (inbox "error" state unsimulated). Fix: add a conditional error branch using the existing toast factory.
- C5 (WCAG 1.4.4, moderate): viewport meta has maximum-scale=1.0 → suppresses mobile zoom. Fix: remove maximum-scale.
next_destination: D-2 refine (cycle 3)

---
# D-3 Phase 2 head-designer gate — Attempt 1: REWORK
verdict: REWORK (rework_attempt_cap_remaining: 2 — Phase-2 cap, independent of exhausted Phase-1 3-cycle cap)
defect (WCAG 4.1.3 AA, survived both dual reviewers — reviewer B hallucinated role=alert present):
  showToast() builds bare <div> toasts with NO role=alert/role=status and NO aria-live anywhere in file.
  Toast is the ONLY feedback for the inbox-action network-error state → SR moderator gets no signal a Timeout/Delete failed.
  Violates DESIGN-SYSTEM §8 Toast primitive A11y contract.
remedy: ARIA-only, ~2 lines in showToast() — role=alert on error toasts, role=status on success/info, aria-live container. No visual/token/layout change.
token-blessed (fires only on eventual APPROVED, Action 8): --danger-btn: #b91c1c as reusable "danger button fill" role → DESIGN-SYSTEM §1 + §8 destructive-button cross-note.
next: D-2 iterate (aidesigner refine, ARIA-only) → re-run Phase 1 dual reviewers → re-spawn Phase 2 head-designer.
