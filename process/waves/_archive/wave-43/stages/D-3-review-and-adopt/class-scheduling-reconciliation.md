# D-3 Reconciliation — class-scheduling (iteration 0 review)

| Reviewer A (ui-designer/plan-design-review) | Reviewer B (accessibility-tester/ui-ux-pro-max) | Matrix outcome |
|---|---|---|
| REVISE | REVISE | Aggregate both → D-2 refine (iteration 1; cap 3) |

## Aggregated blocking concerns → refine
1. **Detail not-found state** (A1, brief §3): the session detail panel has no soft-deleted/unknown branch — add a calm "Session not found" state.
2. **Save-failed error state** (A2, brief §3): the authoring modal submit path never surfaces a save-failure — add a calm inline error (modal stays).
3. **Modal focus trap** (A3, brief §6, WCAG 2.1.2): Tab/Shift+Tab must cycle within the open authoring dialog (currently escapes to background).
4. **Destructive delete confirm** (A4, DS §8): replace window.confirm() with a role=dialog aria-modal confirmation (destructive treatment).
5. **Delete text contrast** (B-critical, WCAG AA): delete text uses --danger #ef4444 (3.93:1 — FAILS AA); use --danger-text #f87171 (6.30:1) or a danger-tinted background.

## Aggregated non-blocking (fold in)
- amber-glow shadow on the indicator bar is undocumented → use a DESIGN-SYSTEM shadow/token (or --glow-focus family).
- aria-hidden="true" on the hidden recurrence "until" container when Weekly not selected.
- "Close dialogue" → "Close dialog" (US English).
- add explicit heading structure to the detail panel.
- support prefers-reduced-motion.

---
# Iteration 1 review → APPROVE / APPROVE → D-3 Phase 2 (head-designer gate)
Reviewer A (ui-designer): APPROVE — all 5 iter-0 blockers fixed (not-found state, save-failed error, focus trap, delete-confirm role=dialog, --danger-text). No regressions (agenda not month-grid, organizer-gating, §10 non-goals). 1 non-blocking residual (vestigial #until-container CSS selector — React-build wiring).
Reviewer B (accessibility-tester): APPROVE — WCAG-AA confirmed (contrast/keyboard/SR/motion); §9 all PASS; §10 non-goals all respected; tokens DS-only; --danger-text used not #ef4444; focus trap + aria-live + reduced-motion present.
Matrix outcome: APPROVE/APPROVE → Phase 2 head-designer spawn.
