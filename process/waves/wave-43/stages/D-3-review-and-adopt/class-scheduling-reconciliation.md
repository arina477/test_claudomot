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
