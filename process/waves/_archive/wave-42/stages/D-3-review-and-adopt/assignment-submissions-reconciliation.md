# D-3 Reconciliation — assignment-submissions (iteration 0 review)

| Reviewer A (plan-design-review / ui-designer) | Reviewer B (ui-ux-pro-max / accessibility-tester) | Matrix outcome |
|---|---|---|
| REVISE | REVISE | Aggregate both → D-2 refine (iteration 1; cap 3) |

## Aggregated blocking concerns → refine prompt
1. **§10 grading copy** (line 201 assignment body): remove "Grade will be mapped to the central rubric automatically upon return" and any grade/rubric/score wording — replace with plain submission instructions. (Both reviewers.)
2. **Return popover role**: it contains a form (comment textarea + Return button), NOT menu items → change `role="menu"` to `role="dialog" aria-modal="true"` with an accessible name (brief §4/§6; WCAG 4.1.2). (Reviewer A + B.)
3. **Focus restore on close**: on Esc / outside-click / confirm, return focus to the Return trigger button (brief §6 "Esc close+refocus"); toggle `aria-hidden` dynamically. (Both.)
4. **Responsive breakpoint**: the roster/student dual-column must be inline at **≥1024 (lg)** per brief §5, not 1280 (xl) — use `lg:col-span-*` so columns don't stack in 1024–1279.
5. **Missing error states** (brief §3): add student POST-failure inline error + educator 403 over-permission calm inline message.

## Aggregated non-blocking (fold into same refine)
- Fix broken `var(--glow-focus)` reference in `.input-ring`.
- `--text-muted` ~3.87:1 fails AA for normal text — use `--text-secondary` for body/empty-state text, reserve muted for large/decorative only.
- Badge text 11px is below DESIGN-SYSTEM §2 minimum — bump to ≥12px.
- Fix broken Phosphor icon classes (`ph ph- graduation-cap`, any `ph-` with a space).
- Off-scale `gap-10` (40px) → nearest scale token.
- Add explicit form label on the submit textarea + attachment input.

---
# Iteration 1 review → REVISE / REVISE → D-2 refine (iteration 2; cap 3)
Both reviewers: iter-1 resolved 7/10 (grade copy, dialog role, glow-focus var, 1024 breakpoint). Remaining blocking a11y:
1. Return-action FAILURE error state missing (brief §3 "return failed") — submitReturn() has no failure branch.
2. Focus trap: role="dialog" aria-modal="true" must trap Tab/Shift+Tab within the popover while open.
3. File input has aria-hidden="true" — removes it from a11y tree; drop it so the labelled input is reachable.
4. "Mark Done" toggle is a decorative div — needs a real <input>/button with programmatic role+state (WCAG 1.3.1).
5. No aria-live region — async submit/return DOM changes must announce (aria-live="polite" on the roster/status region).

---
# Iteration 2 review → REVISE / REVISE → D-2 refine (iteration 3; counter 2→3, within cap)
All iter-1 a11y blockers RESOLVED (dialog role+focus-trap+restore, real checkbox toggle, file-input reachable, aria-live, return-failure state, WCAG-AA). Remaining = 3 small design-direction fixes:
A1. Spring easing on slideUpFade (cubic-bezier(0.175,0.885,0.32,1.275)) violates DS §6 "no bouncy easing" → use the smooth cubic-bezier(0.4,0,0.2,1).
A2. Student submitted-note body text uses --text-secondary (l.291) — DS §1 body = --text-primary (secondary is metadata) → change to --text-primary.
B. Resubmit-after-return path not discoverable (brief §3 "resubmit still possible") → add a visible "Edit submission" affordance/label on the returned card.
Non-blocking React-build notes (do NOT block adoption): peer-CSS toggle thumb, shadow var, hardcoded timeline node positions.

---
# Iteration 3 review → APPROVE / APPROVE → D-3 Phase 2 (head-designer gate)
Reviewer A (ui-designer/plan-design-review): APPROVE — 3 iter-2 items fixed (calm slideUpFade easing, submitted-note body --text-primary, visible "Edit submission" affordance), no regressions.
Reviewer B (accessibility-tester/ui-ux-pro-max): APPROVE — WCAG-AA across all dimensions; §9 all PASS; §10 zero grading; dialog focus-trap+restore, aria-live, real checkbox, file-input reachable; tokens all traced, no invented values.
Matrix outcome: APPROVE/APPROVE → Phase 2 head-designer spawn.
