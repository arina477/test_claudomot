# D-3 Phase-1 Design Critique — Reviewer A (iter 1 re-review)
## Artifact: `design/staging/assignment-submissions.html` (iteration 1, refined)
## Reviewer: ui-designer — independent; no knowledge of Reviewer B
## Prior verdict: REVISE (iter 0) — 10 concerns enumerated

---

## Iter 0 Concern Disposition (what was fixed)

| Prior concern | Status in iter 1 |
|---|---|
| C1 — §10 grade/rubric copy in assignment body | FIXED — body copy replaced with neutral submission language |
| C2 — `role="menu"` semantic error | FIXED — changed to `role="dialog" aria-modal="true" aria-label="Return submission"` |
| C3 — Focus not restored to trigger on close | FIXED — `currentTriggerButton.focus()` called in `closePopover()` |
| C4 — Responsive breakpoint `xl:` instead of `lg:` | FIXED — grid uses `lg:grid-cols-12`, spans use `lg:col-span-5` / `lg:col-span-7` |
| C5 — Broken CSS var `--glow-focus` in `.input-ring` | FIXED — `--glow-focus` declared in `:root` |
| C6 — `--text-muted` used on metadata/sub-labels | FIXED — `--text-muted` now restricted to placeholders only; metadata uses `--text-secondary` |
| C7 — Missing POST-submit-failure and 403 error states | FIXED — `#submit-error` (role=alert) and `#forbidden-state` both present |
| C8 — Student state conflation (form + timeline simultaneous) | Persists — intentional staging artifact; downgraded to non-blocking |
| C9 — Badge text 11px below DS minimum | FIXED — all status badges now `text-xs` (12px) |
| C10 — Broken icon class `ph ph- graduation-cap` | FIXED — corrected to `ph-graduation-cap` |

Seven of ten iter 0 concerns resolved. Three new issues introduced or now surfaced by the role change to `dialog`.

---

## Dimension Scores

### 1. Visual Hierarchy — 7.5 / 10

The assignment title (h1, 3xl/4xl semibold) dominates cleanly. The amber due chip establishes urgency at first glance. The `lg:grid-cols-12` split (student 5 cols, roster 7 cols) gives the educator surface appropriate visual weight. Within the roster, the amber "Awaiting" dot + text and the emerald check-circle + "Returned" text create legible, scannable state differences across rows. The returned state card on the student side uses an emerald left-edge accent bar and check-circle badge to distinguish it from the submitted card above it without being loud.

Deductions: Both the active submit form (Scenario A) and the submitted+returned timeline (Scenarios B/C) remain simultaneously visible in the student column. A cold reviewer cannot immediately determine which sub-state is "live." This is a known staging artifact carried from iter 0 and no longer blocking, but it does suppress the hierarchy score. The two section h2 headings in the columns ("Your Work" at `text-lg` 18px; "Submissions Roster" at `text-[15px]`) use different scale values without a hierarchy reason — a sub-panel heading reading at 15px is between DS `text-sm` and `text-base` and is off the documented type scale.

What would make it a 10: align both column h2 headings to the same DS text scale value (14px sm or 16px base); add visible "State:" labels or a tab strip above the student column scenarios to make the mockup self-explanatory without verbal annotation.

---

### 2. Spacing Rhythm — 7.5 / 10

The 4px base grid is respected throughout. Section-level gaps (`gap-8`, `py-8 md:py-12`), card padding (`p-4`, `p-5`), and roster row density (`p-3`, `space-y-0.5`) are coherent with the design system §3 scale. The `pb-32` bottom padding on the scroll container is generous but not harmful. The HR separator between the assignment header and the split view is clean.

Deductions: The submit form footer uses `p-2 pt-0` with `mt-2` on both interior buttons, producing a compressed and asymmetric action row — bottom edge has less breathing room than the sides. The assignment H1 at 3xl/4xl is separated from the badge row above it by only `mb-4` (16px), which reads as a body-level gap for a headline of that visual weight; DS §3 calls for 24px section gaps at section entry points.

What would make it a 10: normalize the form footer to symmetric `px-2 pb-2 pt-2`; increase the spacing between the badge group and H1 to `mb-6` (24px).

---

### 3. Brand Coherence — 8.5 / 10

Dark-only is correctly enforced (`html class="antialiased dark"`; all surface tokens resolve to the near-black zinc stack). Geist is loaded and applied via Google Fonts. Emerald is correctly dominant for returned states, submit button, focus ring, and the active server indicator. Amber is correctly reserved for "Awaiting" and the due-date chip. Phosphor icons are used consistently at the correct weight (regular line, 16–20px, stroke `--text-secondary`; filled variants on active/completion states only). The glass-panel backdrop blur on the popover, the shimmer skeleton, and the `letter-spacing: -0.01em` on headings all match the shipped aesthetic.

§10 grading language: PASS — assignment body copy no longer contains grade/rubric/score terms. The educator comment shown to the student ("Excellent approach with the latency filter. The log outputs verify your methodology cleanly. Keep this standard up for the final.") is plausible acknowledgement copy; "Keep this standard up" is encouraging feedback rather than a grade value. No numeric field, no grade column.

Deductions: The "Mark Done" toggle in the student column header is rendered as a purely decorative div-based control (a `<div>` pair with inline visual styling) with no real `<input type="checkbox">` behind it. The label's `for` attribute does not reference an id; the `peer` class is not connected to an input. While §10 notes the done-toggle is orthogonal to this wave, its visual presence in the staging surface implies functionality that does not exist, including for AT users. The `prose prose-invert` Tailwind utility on the assignment body description requires the `@tailwindcss/typography` plugin; the CDN `<script src="https://cdn.tailwindcss.com">` does not bundle this plugin by default, meaning the `.prose` class produces no formatting effect in this staging environment.

What would make it a 10: replace the decorative toggle stub with a real `<input type="checkbox" id="mark-done-toggle" class="sr-only peer">` driving the visual div via `peer-checked:` Tailwind variants; either add the typography plugin or replace `prose` with explicit DS typography token classes.

---

### 4. Edge-Case Handling — 6.5 / 10

Present and functional: upload oversize error (`#upload-error`, role=alert, inline, no layout break), submit POST failure (`#submit-error`, role=alert, inline, retry path in the JS sim), 403 forbidden roster state (`#forbidden-state`, calm "Access restricted"), empty roster (`#empty-state`, "No submissions yet"), loading skeleton shimmer (one row), attachment removal, resubmit flow (button label changes to "Resubmit" on second attempt), viewport-flip on the return popover (flip-up logic near the bottom edge).

Missing:

**Return-action failure state — §3 explicit requirement.** Brief §3 states "Error (submit/return failed, or over-permission 403 → calm inline message)." The "return failed" branch is not implemented. `submitReturn()` calls `closePopover()` unconditionally on form submission with no network request or failure path. If the `POST /assignments/:id/submissions/:submissionId/return` call fails (network error, 5xx), the educator sees no feedback and the row silently stays in its prior state. This is a missing §3 required state.

Additional non-blocking gaps: "Undo submission" button has no JS handler (no-op click); only one skeleton row is shown where a 48-student roster would warrant 3–4 rows for a credible loading state.

What would make it a 10: add an inline danger message inside `#return-form` mirroring `#submit-error`; populate it in a failure branch of `submitReturn()`; add a stub handler for "Undo submission"; render 3–4 skeleton rows.

---

### 5. Accessibility — 5.5 / 10

Correctly implemented: `sr-only` labels on `#submission-text` and `#return-comment`; `role="alert"` on `#upload-error` and `#submit-error`; `role="dialog" aria-modal="true" aria-label="Return submission"` on the return popover; `aria-hidden` toggled via JS on open/close; Esc key closes (`keydown` listener); outside-click closes; `currentTriggerButton.focus()` restores focus to trigger on close; `focus-visible` ring on all buttons (`button:focus-visible { outline: 2px solid emerald; }`); `aria-haspopup="dialog"` on the Return row trigger buttons; `alt` text on avatar images.

Failures:

**[A11y-1 — Critical] No focus trap in `role="dialog" aria-modal="true"` (DESIGN-SYSTEM §8 Modal/Dialog; WCAG 2.1 Authoring Practices dialog pattern)**

The popover correctly declares `aria-modal="true"`, which signals to screen readers that content outside the dialog is inert. However, there is no programmatic focus trap. A keyboard user who presses Tab from the Cancel button exits the dialog boundary and navigates the underlying roster rows, contradicting the `aria-modal` contract. The DS §8 Modal/Dialog spec explicitly states "focus-trap" as a required attribute of this primitive. The change from `role="menu"` (iter 0) to `role="dialog"` (iter 1) was correct but introduced this obligation that is not yet met. A minimal implementation: collect all focusable descendants of `#return-popover`; on Tab from the last element, cycle to the first; on Shift+Tab from the first, cycle to the last.

**[A11y-2 — High] `aria-hidden="true"` on `#attachment-input` breaks the AT file-upload path (Brief §9 WCAG-AA; DESIGN-SYSTEM §8 Button a11y)**

The file input (`id="attachment-input"`) carries both `aria-hidden="true"` and `tabindex="-1"`, removing it from the accessibility tree. The `<label for="attachment-input">` in `sr-only` points to a now-hidden control — the label is present in the AT tree but the control it references is not, so screen readers cannot activate the file picker via the label. The visual button (`triggerAttachment()`) is not semantically associated with the input. Resolution: remove `aria-hidden="true"` from the file input; retain `tabindex="-1"` (the visual button handles activation for sighted keyboard users); the input remains discoverable via its `sr-only` label for AT.

**[A11y-3 — High] "Mark Done" toggle is inert to assistive technology (DESIGN-SYSTEM §8 AssignmentCard; WCAG 1.3.1 Info and Relationships)**

The `<label>` wrapping the decorative toggle has no `for` attribute pointing to an actual interactive element, and there is no `<input>` child within or referenced by the label. Screen readers announce it as a static text string, not an interactive control. WCAG 1.3.1 requires that the role, state, and value of UI components be programmatically determinable. DS §8 AssignmentCard specifies "toggle is a real checkbox/switch with label."

**[A11y-4 — Medium] No `aria-live` region for dynamic roster state changes (DESIGN-SYSTEM §8 Empty/Error/Loading states; Brief §6)**

When `submitReturn()` mutates `.innerHTML` on a roster row (Awaiting to Returned), the DOM change is invisible to screen readers. An `aria-live="polite"` status region should announce the state change after the action completes (e.g., "Elena Rostova marked as returned").

**[A11y-5 — Low] Breadcrumb lacks proper nav semantics (WCAG 2.4.8 Location)**

The breadcrumb row is implemented as `<div>` + `<span>` elements with no `<nav aria-label="Breadcrumb">`, no `<ol>`, and no `aria-current="page"` on the active crumb. For a desktop app with multiple panel levels this is a low-severity gap but it is still a WCAG 2.4.8 matter.

What would make it a 10: implement a Tab/Shift+Tab focus trap loop in the dialog; remove `aria-hidden` from `#attachment-input`; replace the decorative toggle with a real `<input type="checkbox">`; add `<div role="status" aria-live="polite" class="sr-only" id="roster-live"></div>` to the roster panel and populate it after state changes; convert the breadcrumb to `<nav aria-label="Breadcrumb"><ol>` with `aria-current="page"`.

---

### 6. Responsive — 8 / 10

The core contract is met: `grid-cols-1` default collapses to `lg:grid-cols-12` at 1024px (corrected from iter 0), with `lg:col-span-5` student and `lg:col-span-7` roster. Server rail is `hidden md:flex`, sidebar is `hidden lg:flex`, mobile hamburger is `lg:hidden`. The Sort button text (`max-sm:hidden`) and Return label text (`max-sm:hidden`) hide appropriately on narrow viewports. Popover viewport-flip logic (flip up near bottom edge) is implemented.

Deductions: The JS popover positioning (`left = rect.left - (300 - rect.width)`) has no boundary clamping. At 1024px viewport width, with a narrow right column, `rect.left` of a right-aligned Return button can yield a negative `left` value, clipping the 300px popover against the left viewport edge. No `Math.max(8, ...)` lower clamp exists. Similarly, no right-edge clamp (`Math.min(left, window.innerWidth - 308)`) guards against the popover extending past the right edge at unusual zoom levels. The `sticky top-8` on the student column at viewport heights below ~700px may cause the bottom of the sticky column to overlap the roster header when both columns are in the 1024px+ layout; this is testable only in a live browser but worth noting as a risk.

What would make it a 10: add `const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - 308));` in `openReturnPopover()`; browser-test the sticky column behavior at 1024px × 700px.

---

## Brief Verification Checklist

| Check | Result | Notes |
|---|---|---|
| §3 Student not-submitted (submit form) | PASS | Form present |
| §3 Student submitting (spinner + disabled) | PASS | JS loading state |
| §3 Student submitted-not-returned | PASS | Timeline card |
| §3 Student returned (emerald badge + comment) | PASS | Returned card with quote |
| §3 Educator roster loaded | PASS | 3 rows with states |
| §3 Educator roster empty | PASS | #empty-state |
| §3 Educator return-popover-open | PASS | #return-popover |
| §3 Loading (skeleton) | PASS | Shimmer row |
| §3 Error — upload oversize | PASS | #upload-error, role=alert |
| §3 Error — submit POST failure | PASS | #submit-error, role=alert |
| §3 Error — return action failure | **FAIL** | No failure branch in submitReturn() |
| §3 Error — 403 forbidden roster | PASS | #forbidden-state |
| §10 NO grading — zero grade/score/rubric affordance | PASS | No numeric field, no rubric language |
| §10 NO grading — assignment body copy | PASS | Submission-only copy; no grade/rubric terms |
| §10 NO grading — return popover | PASS | "Acknowledgement comment" / "Mark Returned" |
| Returned = calm emerald, unmistakably NOT a grade | PASS | Check-circle + "Returned" text only |
| Awaiting = calm amber, unmistakably NOT a grade | PASS | Amber dot + "Awaiting" text only |
| Return popover: role=dialog | PASS | Present |
| Return popover: aria-modal | PASS | Present |
| Return popover: aria-label | PASS | "Return submission" |
| Return popover: focus restore on close | PASS | currentTriggerButton.focus() |
| Return popover: focus trap | **FAIL** | Not implemented; Tab exits dialog |
| Responsive — columns inline at ≥1024 | PASS | lg:grid-cols-12 |
| Responsive — single column below 1024 | PASS | grid-cols-1 default |
| Token — no invented hex | PASS | All values derived from DS |
| Token — --text-muted not on body text | PASS | Placeholders only |
| Badge — ≥12px | PASS | text-xs = 12px |

---

## Enumerated Concerns (blocking)

**Concern 1 — Missing return-action failure error state (Brief §3)**
Brief §3 explicitly names "return failed" as a required error state. `submitReturn()` has no failure branch; an educator whose POST fails receives no feedback.
Resolution: add an inline danger element inside `#return-form` mirroring `#submit-error`; populate it on network/server failure in a try/catch or fetch `.catch()` branch.

**Concern 2 — No focus trap in `role="dialog" aria-modal="true"` (DESIGN-SYSTEM §8 Modal/Dialog; WCAG 2.1 dialog authoring practice)**
The iter 0 → iter 1 change from `role="menu"` to `role="dialog" aria-modal="true"` was correct but created a new obligation: focus must be trapped inside the dialog while open. Tab from Cancel escapes to the roster behind the popover, contradicting the `aria-modal` declaration.
Resolution: in `openReturnPopover()`, after showing the popover, collect `focusableEls = popover.querySelectorAll('textarea, button')`. In the `keydown` listener, when `e.key === 'Tab'` and `isPopoverOpen`, intercept and cycle within `focusableEls`.

**Concern 3 — `aria-hidden="true"` on `#attachment-input` severs AT file-upload path (Brief §9 WCAG-AA; DESIGN-SYSTEM §8 Button a11y)**
The `sr-only` label references the input by `for`, but the input is hidden from the AT tree via `aria-hidden`. AT users cannot activate the file picker.
Resolution: remove `aria-hidden="true"` from `#attachment-input`; keep `tabindex="-1"`.

**Concern 4 — "Mark Done" toggle has no underlying `<input>` (DESIGN-SYSTEM §8 AssignmentCard; WCAG 1.3.1)**
The toggle is a decorative div construct inert to keyboard and AT. WCAG 1.3.1 requires the role/state/value of interactive components to be programmatically determinable.
Resolution: replace the div pair with `<input type="checkbox" id="mark-done-toggle" class="sr-only peer">` driving the visual track/thumb via `peer-checked:` variants.

**Concern 5 — No `aria-live` region for roster state changes (DESIGN-SYSTEM §8; Brief §6)**
`submitReturn()` mutates the DOM without any AT announcement. State changes are invisible to screen reader users.
Resolution: add `<div role="status" aria-live="polite" aria-atomic="true" class="sr-only" id="roster-live"></div>` in the roster panel; set `textContent` to "[Name] marked as returned" after each successful state flip.

---

## Verdict

**REVISE**

The §10 grading violation is resolved and the `role="dialog"` semantic is now correct — both are material progress from iter 0. However, switching to `role="dialog" aria-modal="true"` without implementing the required focus trap is a WCAG-level regression that creates a new blocking accessibility issue (Concern 2). Combined with the missing return-action error state (Concern 1, explicit §3 requirement), the severed file-input AT path (Concern 3), and the inert toggle (Concern 4), the design cannot be canonicalized in its current form. All five concerns are mechanically small fixes requiring no structural redesign; a focused iter 2 can resolve them.
