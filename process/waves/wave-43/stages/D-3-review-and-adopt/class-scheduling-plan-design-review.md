# D-3 Plan-Design Review — Class Scheduling (Reviewer A, Cycle 2 — Iter-1 Re-review)

**Verdict: APPROVE**

---

## Iter-0 Blocker Resolution Confirmation

All five blockers raised in cycle 1 are confirmed fixed.

### Blocker 1 — Session detail "not-found" state
CSS rules at lines 154-156 show `.not-found-state #detail-content` and `.not-found-state #detail-footer` as `display: none`. The `#detail-empty` panel at lines 459-466 renders "Session not found" with explanatory copy ("This session may have been deleted, or the link is invalid."). `openDetail('not-found')` at line 738 applies the class. The dev toggle at line 242 provides a direct test path. **FIXED.**

### Blocker 2 — Save-FAILED inline error state
`#form-error` at lines 542-548 carries `role="alert"`, `--danger-text` text on `--danger/10` tinted background, and a warning icon. The `submitForm()` simulated-error branch at lines 808-813 unhides the banner, sets the message to "Couldn't save session — try again.", announces to `#modal-announcer`, and does not close the modal. Form values are preserved. **FIXED.**

### Blocker 3 — Focus trap
`trapFocus()` at lines 672-698 intercepts Tab and Shift-Tab, filters to visible focusable elements via `offsetWidth / offsetHeight / getClientRects`, and wraps focus at the boundaries. The global `keydown` listener at lines 705-709 routes Tab events to the active modal identified by `activeModalId`. Both openers (`openModal`, `openDeleteModal`) store `activeTriggerElement = document.activeElement`. Both closers restore focus via `setTimeout(...focus(), 300)` matching the close animation duration. Esc priority order: delete modal first, then authoring modal, then detail panel close. **FIXED.**

### Blocker 4 — Delete confirmation uses `role="dialog" aria-modal`
`#delete-modal` at lines 637-659 carries `role="dialog" aria-modal="true"` and `aria-labelledby="delete-title"`. Confirm button at line 654 uses `bg-danger` fill with white text — correct DS destructive button pattern (fill/border use of `--danger`, not text-on-tint). `openDeleteModal()` at lines 828-838 stores trigger, opens with the modal class system, and focuses the Cancel button first (safe default for destructive). **FIXED.**

### Blocker 5 — Delete text uses `--danger-text` (#f87171)
Row trash buttons (lines 397, 430): `hover:text-danger-text`. Detail footer Delete button (line 516): `hover:text-danger-text hover:border-danger/20`. The confirm button in the delete modal uses `bg-danger text-white` — this is the correct DS pattern; `--danger-text` applies to text on a tinted surface, not to filled destructive buttons. No AA violation in any case. **FIXED.**

### Minor fixes confirmed
| Item | Line(s) | Status |
|---|---|---|
| `prefers-reduced-motion` | 78-85 | Blanket suppression across animation/transition. FIXED |
| `aria-hidden` on `#until-container` | 608, 721-727 | Initial `aria-hidden="true"`; `toggleUntilDate()` toggles correctly. FIXED |
| "Close dialog" aria-label | 535, 641 | Both modal close buttons labelled. FIXED |
| Detail panel heading | 453 | `<h2>"Session Details"` present. FIXED |
| Amber glow shadow | — | No invented shadow; only `--shadow-sm`, `--shadow-pop`, `--shadow-liquid` used. FIXED |

---

## Non-regression Confirmation

| Check | Finding | Result |
|---|---|---|
| Calm date-grouped AGENDA, not month-grid | `<h3>` date group headers over vertical card list. No grid widget. | PASS |
| Organizer gating | `.member-view .organizer-only { display: none !important; }` (line 138) removes New-session CTA, row edit/delete, detail footer, empty-state CTA. | PASS |
| §10 non-goals | No reminders, RSVP, timezone, ICS, drag, month-grid. Recurrence limited to None/Weekly. | PASS |
| Token discipline — no invented hex | All color values are CSS variable references or Tailwind extensions mapped to DS-documented variables. No bare hex outside token definitions. | PASS |
| In-viewport at 1024/1280/1440 | `overflow: hidden` on body (line 57), `h-[100dvh]` on shell (line 247), independent `overflow-y-auto` scroll panes. | PASS |

---

## Residual Note (Non-blocking — React build wiring only)

The `#until-container` div (line 608) carries both `class="... hidden"` and a CSS attribute selector rule at line 177 (`#recurrence-select[value="weekly"] ~ #until-container { display: block; }`). CSS attribute selectors check the HTML attribute, not the live `.value` property, so the CSS rule is vestigial and does not fire in practice. The correct show/hide path is entirely through `toggleUntilDate()` in JS, which is correct. This is a React implementation concern — not a design-direction issue and not a blocker.

---

## Brief Criterion Scorecard (§11)

| Criterion | Assessment | Result |
|---|---|---|
| (a) Calm/academic agenda, not heavy calendar app | Date-grouped vertical list. No calendar chrome, no month grid, no day tabs. | PASS |
| (b) Faithful reuse of assignment-row + `role=dialog` modal + DS tokens | Row layout, chip vocabulary, modal structure, and token usage match the assignment-panel and assignment-submissions prior art. | PASS |
| (c) Recurrence display clear, no RRULE implication | "Weekly" chip on card row and detail badge. Modal select: None / Weekly + optional "until". No RRULE language. | PASS |
| (d) Organizer gating visually obvious | `.organizer-only` on all write affordances; member-view toggle cleanly removes them. | PASS |
| (e) Destructive Delete treatment correct + restrained | `role="dialog"` confirm with `bg-danger` fill button. Row trash actions use `--danger-text` on hover only. | PASS |
| (f) Desktop-first, in-viewport, dark-only, AA | `<html class="dark">` only. DS token colors. In-viewport shell. `--danger-text` (#f87171) delivers 6.30:1 on danger/10 tint. | PASS |

---

**APPROVE** — All five iter-0 blockers are resolved, no regressions on agenda paradigm, organizer gating, §10 non-goals, or token discipline. One residual non-blocking React wiring note logged above. No design-direction concerns remain.
