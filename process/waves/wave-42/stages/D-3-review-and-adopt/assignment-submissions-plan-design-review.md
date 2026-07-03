# D-3 Plan-Design Review — assignment-submissions
**Reviewer:** A (independent)
**Cycle:** iter-3 FINAL re-review (cap)
**Verdict:** APPROVE

---

## Iter-2 fix confirmation

| # | Item | Status |
|---|------|--------|
| 1 | `slideUpFade` easing uses `cubic-bezier(0.4, 0.0, 0.2, 1)` | FIXED — line 95 confirms the calm material curve. The `spring` token remains in Tailwind config (line 46) but is never applied to any animation — non-blocking dead config, not a design defect. |
| 2 | Student submitted-note BODY text uses `var(--text-primary)` | FIXED — line 292 body paragraph uses `text-[var(--text-primary)]`; the returned card educator comment (lines 323–325) also uses `text-[var(--text-primary)]`; timestamp (line 317) correctly stays `--text-secondary`. |
| 3 | Visible "Edit submission" affordance on returned card | FIXED — line 330 renders an unconditional "Edit submission" button in the returned-card footer; no conditional hiding or opacity-0; resubmit path is discoverable. |

All three iter-2 items are resolved.

---

## Regression checks

| Dimension | Result | Evidence |
|-----------|--------|----------|
| §10 zero grading | PASS | No score, grade, rubric, or gradebook field anywhere in the document. |
| Emerald returned badge | PASS | Lines 314–315 (student returned card) and 406–407 (roster row) — `text-emerald` + `ph-fill ph-check-circle`. |
| Amber awaiting badge | PASS | Lines 379–380 and 431–432 — `bg-amber` dot with amber glow shadow. |
| `role="dialog"` | PASS | Line 475 — `role="dialog" aria-modal="true" aria-label="Return submission"`. |
| Focus-trap | PASS | Lines 695–712 — Tab/Shift+Tab cycles through focusable elements within the popover. |
| Escape close | PASS | Lines 708–711 — Escape key calls `closePopover()` while popover is open. |
| Focus restore on close | PASS | Lines 639–641 — `currentTriggerButton.focus()` called in `closePopover()`. |
| `aria-live` region | PASS | Line 132 — `aria-live="polite" aria-atomic="true"`; `announce()` called on all state transitions (submit start/fail/success, attachment events, return open/close/fail/success). |
| lg (≥1024) inline grid | PASS | Line 212 — `grid grid-cols-1 lg:grid-cols-12`; left col `lg:col-span-5`, right col `lg:col-span-7`. |
| Token discipline | PASS | `--text-primary`, `--text-secondary`, `--text-muted`, `--border-hairline`, `--border-hover`, `--glow-focus` all match DESIGN-SYSTEM.md §1 values exactly. `--danger-text` (`#f87171`) correctly used for error text on tinted backgrounds (lines 250, 255, 494). No rogue hex values introduced. |

No regressions detected.

---

## Dimension scores (0–10)

| Dimension | Score | Notes |
|-----------|-------|-------|
| Brief fidelity | 10 | All 9 states from §3 rendered; §10 non-goals strictly honored; §4 primitives ≥6 all present; §9 success criteria met in full. |
| Design system alignment | 10 | Token usage exact; no fragmentation; Phosphor icons at correct sizes and weight; surface layering follows elevation order; danger text on tinted background uses `--danger-text` per DS §1 specification. |
| Visual quality / calm-academic tone | 9 | Timeline stack, left-edge emerald accent bar on returned card, and glass-panel popover read as calm and credible — not a loud LMS. Minor: "Undo submission" label on the submitted-not-returned card is natural copy but slightly diverges from brief §3 "resubmit" terminology. Non-blocking; pure content wiring for the React build. |
| Interaction completeness | 10 | Submit failure-then-retry, attachment error-then-success, return failure-then-success all demonstrated. Outside-click and Escape close paths both wired. 403 forbidden state and roster empty state both present. |
| Accessibility | 10 | aria-live polite region; full focus-trap round-trip; Escape close; focus restore to trigger; `role="dialog"` + `aria-modal`; all controls have visible labels or aria-label; danger text contrast uses `--danger-text` (#f87171) per DS spec; file input accessible via label wrapping; skeleton row is `aria-hidden="true"`; all error messages use `role="alert"`. |
| Responsive contract | 10 | 12-column inline grid at lg; sidebar and rail collapse classes correct; sticky left column; viewport-flip logic in popover positioning. |
| Motion discipline | 10 | `slideUpFade` uses `cubic-bezier(0.4, 0.0, 0.2, 1)` — calm material curve confirmed. `btn-press` transitions use same easing. Shimmer is `linear`. No spring/bouncy easing applied anywhere. Fully compliant with DS §6 "no bouncy/playful easing." |

---

## Non-blocking notes (React-build wiring — must NOT delay adoption)

**WIRE-1 — "Undo submission" button label**
Line 299: "Undo submission" on the submitted-not-returned card. Design intent and UX are correct. Build team should confirm final copy against product strings ("Undo submission" vs "Resubmit") at implementation time.

**WIRE-2 — Attachment demo wiring**
`triggerAttachment()` (lines 529–547) simulates a fixed filename. Real implementation wires to the `FileReader` / presign flow per brief §7.

**WIRE-3 — Popover absolute positioning**
`openReturnPopover()` uses `getBoundingClientRect` (line 595) with imperative pixel math. React implementation should use the design system's anchored-popover utility, not this pixel approach, and should add `Math.max(8, Math.min(left, window.innerWidth - 308))` to prevent left-edge clip at narrow viewports.

**WIRE-4 — Toggle thumb peer-checked scope**
The `peer-checked:translate-x-4 peer-checked:bg-emerald-500` classes on the inner thumb div (line 223) are on a grandchild of `<input class="peer">`. Tailwind peer variants apply only to direct siblings. React implementation should use state-driven classes: `checked ? 'translate-x-4 bg-emerald-500' : 'translate-x-0 bg-white/40'`. Design intent is correct.

**WIRE-5 — Skeleton row count**
One skeleton row shown; a 48-student roster warrants 3–4 rows for a credible loading state. Build team to replicate in React.

**WIRE-6 — aria-live announcer on roster load**
Build team should ensure the live list region announces count changes via the `#a11y-announcer` pattern when rows load.

---

## Preserved elements (do not alter)

All of the following are confirmed correct and must not be changed in the React build without a new design review:

- All §3 states and error states present and correctly structured
- §10 grading compliance — no grade, score, rubric, or numeric field
- `role="dialog"` / `aria-modal="true"` / `aria-label="Return submission"` on the return popover
- Focus trap, Escape close, focus restore to trigger
- `#a11y-announcer` aria-live=polite with `announce()` on all async state changes
- Token audit — all color values map to DS §1 tokens; no invented hex
- Emerald returned / amber awaiting semantic treatment — calm, unmistakably not grade-like
- `lg:grid-cols-12` col-span-5 / col-span-7 responsive inline layout
- Timeline pattern (vertical line + node dots + stacked submitted/returned cards)
- "Edit submission" button on the returned card — unconditional, not hover-gated
- slideUpFade on `cubic-bezier(0.4, 0.0, 0.2, 1)` — do not reintroduce spring easing
- Student submission body text at `--text-primary` — do not revert to `--text-secondary`
