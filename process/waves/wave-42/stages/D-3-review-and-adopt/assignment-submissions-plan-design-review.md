# D-3 Reviewer A — Plan Design Review
## Artifact: `design/staging/assignment-submissions.html` (iteration 2, refined)
## Reviewer: ui-designer — independent; no knowledge of Reviewer B
## Cycle: 3 (iter 2 re-review — cap cycle)

---

## Iter 1 Concern Disposition (what was fixed before this review)

| Prior concern (iter 1) | Status in iter 2 |
|---|---|
| C1 — Missing return-action failure error state (Brief §3) | FIXED — `#return-error` role=alert present in return popover (l.489); failure branch in `submitReturn()` shows error then allows retry (l.654–666) |
| C2 — No focus trap in `role="dialog" aria-modal="true"` | FIXED — `popover.addEventListener('keydown')` traps Tab/Shift+Tab and fires Esc close (l.690–707) |
| C3 — `aria-hidden="true"` on `#attachment-input` severing AT file path | FIXED — file input at l.265 uses `class="sr-only"` only; no `aria-hidden`; label wraps it with `focus-within` ring |
| C4 — "Mark Done" toggle inert (decorative div, no `<input>`) | FIXED — real `<input type="checkbox" class="sr-only peer" aria-label="Mark assignment done">` at l.221 |
| C5 — No aria-live region for roster state changes | FIXED — global `#a11y-announcer` aria-live=polite at l.132; `announce()` called in `submitReturn()` after row flip (l.681) |

All five iter 1 blockers are resolved. The review below evaluates iter 2 from scratch.

---

## Mandatory checklist verification (pre-score)

| Requirement | Location in HTML | Verdict |
|---|---|---|
| §3 — student not-submitted (submit form) | `#submit-form-container` l.229 | PASS |
| §3 — student submitting (spinner + disabled) | `#submit-spinner`, `submitAssignment()` loading path l.550–584 | PASS |
| §3 — student submitted-not-returned | Timeline "Your submission" card l.286 | PASS |
| §3 — student returned (emerald badge + educator comment) | Returned state card l.307 | PASS |
| §3 — educator roster loaded | Roster rows l.355–442 | PASS |
| §3 — educator roster empty ("No submissions yet") | `#empty-state` l.446; structurally present, `hidden` class | PASS |
| §3 — return popover open | `#return-popover` l.470 | PASS |
| §3 — loading skeleton | `.roster-loader` shimmer row l.436 | PASS |
| Error: student submit-failure | `#submit-error` role=alert l.255; `announce()` called l.573 | PASS |
| Error: upload over-size | `#upload-error` role=alert l.250; `announce()` called l.533 | PASS |
| Error: educator return-failure | `#return-error` role=alert l.489; failure branch in `submitReturn()` l.658–665; `announce()` called l.663 | PASS |
| Error: 403 over-permission | `#forbidden-state` l.455; structurally present | PASS |
| §10 — zero grade / score / rubric anywhere | Full scan: no numeric grade field, no score column, no rubric affordance. Educator comment in returned card is plain text acknowledgement. Return popover label is "Acknowledgement comment (optional)" / "Mark Returned". | PASS |
| Returned = calm emerald acknowledgement, unmistakably NOT a grade | Emerald check-circle + "Returned" text only; no value attached | PASS |
| Awaiting = calm amber, unmistakably NOT a grade | Amber dot + "Awaiting" text only; no value attached | PASS |
| Return popover: `role="dialog"` | l.470 | PASS |
| Return popover: `aria-modal="true"` | l.470 | PASS |
| Return popover: accessible name | l.470 `aria-label="Return submission"` | PASS |
| Focus trap while popover open | Tab/Shift+Tab cycle over `focusableElements` within `#return-popover` (l.690–707) | PASS |
| Focus restored to trigger on close | `currentTriggerButton.focus()` in `closePopover()` l.635 | PASS |
| Real interactive Mark-Done control (not decorative div) | `<input type="checkbox" class="sr-only peer" aria-label="Mark assignment done">` l.221 | PASS |
| aria-live region announces async changes | `#a11y-announcer` aria-live=polite aria-atomic=true l.132; `announce()` called on all async paths | PASS |
| File input reachable, no aria-hidden | `<input type="file" id="attachment-input" class="sr-only">` l.265; no aria-hidden; label wraps with focus-within ring | PASS |
| Responsive inline ≥1024 (`lg:`) | `grid grid-cols-1 lg:grid-cols-12` l.212; `lg:col-span-5` / `lg:col-span-7` | PASS |
| No invented hex values | All Tailwind config colors and `:root` vars map to DS §1 tokens exactly; full audit below | PASS |
| Body text not `--text-muted` | Submission note l.291: `text-[var(--text-secondary)]` (0.60) — not muted (0.40) — literal PASS; see brand-coherence score for DS §1 token concern | PASS (literal) |
| Badge text ≥ 12px | All status/badge labels use `text-xs` (12px) | PASS |

---

## Token audit (spot-check for invented values)

| Usage | Value in HTML | DS token | Match |
|---|---|---|---|
| Surface 950 (body bg) | `#0a0a0b` | DS §1 `--surface-950` | PASS |
| Surface 900 (sidebar, popover bg) | `#121214` | DS §1 `--surface-900` | PASS |
| Surface 800 (canvas) | `#1c1c1f` | DS §1 `--surface-800` | PASS |
| Surface 700 (hover fills, borders) | `#27272a` | DS §1 `--surface-700` | PASS |
| Surface 600 (stronger borders) | `#3f3f46` | DS §1 `--surface-600` | PASS |
| Emerald accent | `#10b981` | DS §1 `--accent-emerald` | PASS |
| Amber accent | `#f59e0b` | DS §1 `--accent-amber` | PASS |
| Danger fill | `#ef4444` | DS §1 `--danger` | PASS |
| Danger text | `#f87171` | DS §1 `--danger-text` | PASS |
| --border-hairline | `rgba(255,255,255,0.06)` | DS §1 | PASS |
| --border-hover | `rgba(255,255,255,0.10)` | DS §1 | PASS |
| --text-primary | `rgba(255,255,255,0.92)` | DS §1 | PASS |
| --text-secondary | `rgba(255,255,255,0.60)` | DS §1 | PASS |
| --text-muted | `rgba(255,255,255,0.40)` | DS §1 | PASS |
| --glow-focus | `0 0 0 2px rgba(16,185,129,0.4)` | DS §5 | PASS |
| shadow-sm | `0 1px 2px rgba(0,0,0,0.4)` (Tailwind config) | DS §5 `--shadow-sm` | PASS (value match) |
| shadow-pop | `0 8px 24px rgba(0,0,0,0.5)` (Tailwind config) | DS §5 `--shadow-pop` | PASS (value match) |

No invented hex values found. All color values traceable to DS §1 primitives.

Note on `shadow-[var(--shadow-sm)]` usage: several Tailwind arbitrary-value expressions reference `var(--shadow-sm)` and `var(--shadow-pop)`. These CSS custom properties are not declared in `:root`; only the Tailwind config `boxShadow` keys exist under those names. In the CDN build this resolves to an empty/invalid value, making those shadows non-functional. The design intent (shadow-sm / shadow-pop) is clear and correct; this is an implementation-wiring issue, not a token-discipline issue.

---

## Dimension Scores

### 1. Visual Hierarchy — 7 / 10

The assignment H1 at 3xl/4xl semibold dominates cleanly. The amber due chip establishes priority at first glance. The `lg:grid-cols-12` split (5-col student left / 7-col roster right) gives the educator surface appropriate weight relative to the individual student action. The emerald left-edge accent bar and active node glow on the returned card create a clear visual completion signal without loudness. The amber dot + "Awaiting" / emerald check-circle + "Returned" vocabulary in the roster is immediately scannable.

Deductions: Both the active submit form (Scenario A) and the submitted/returned timeline (Scenarios B/C) remain simultaneously visible in the student column — a staging artifact carried across all iterations, previously downgraded to non-blocking. While a React toggle will handle mutual exclusivity in production, the staging file does not communicate this to the developer receiving it, which creates ambiguity about which visual structure is the canonical "submitted" treatment. The two column h2 headings ("Your Work" at `text-lg` 18px; "Submissions Roster" at `text-[15px]`) sit at different, off-scale values — `text-[15px]` falls between DS `text-sm` (14px) and `text-base` (16px) with no hierarchy rationale.

What would make it a 10: Unify both column h2 headings to a single DS type-scale value (`text-sm` or `text-base`). Add an inline comment or demo-switcher note in the HTML to clarify that the submit form and the timeline are mutually exclusive production states.

---

### 2. Spacing Rhythm — 7.5 / 10

The 4px base unit is respected throughout. Section-level gaps (`gap-8`, `gap-12`, `py-8 md:py-12`) and card internals (`p-3`, `p-4`, `p-5`) are coherent with DS §3. `space-y-0.5` between roster rows produces appropriate list density. The `pb-32` bottom padding on the scroll container is generous but not harmful.

Deductions: The timeline's second node uses a hardcoded absolute position `top-[214px]` — a magic number measured from the static mockup. If the submitted card's content varies (longer note text, wrapped attachment chip) the node will visually misalign from its associated returned card. The timeline vertical line (`before:left-[11px] before:top-4`) is also brittle in the same way. The submit-form footer uses `p-2 pt-0` with `mt-2` on interior buttons, producing slight asymmetry at the action row bottom edge.

What would make it a 10: Replace hardcoded node positions with a content-relative approach (e.g., margin offset matching the adjacent card's padding, or a JS-measured approach with a code comment). Normalize the form footer to symmetric `p-2`.

---

### 3. Brand Coherence — 6.5 / 10

The dark-only zinc stack is correctly enforced. Emerald is used for returned state, submit button, active server indicator, focus ring, and timeline active node — all correct semantic mappings. Amber is correctly reserved for awaiting state and the due chip. Phosphor icons are used consistently at correct weight (regular, 16–20px, stroke `--text-secondary`; filled only on active/completion states). The glass-panel backdrop blur on the popover, the emerald server-rail active indicator bar, and the tight heading letter-spacing all match the shipped aesthetic. §10 grading language is clean across all surfaces including the educator comment.

**Primary deduction — DS §6 motion violation (REVISE trigger):**

The `spring` timing function defined in the Tailwind config (`'spring': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)'`) is applied to the `slideUpFade` keyframe animation used on every roster row:

```
animation: slideUpFade 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards
```

DS §6 states explicitly: "No bouncy/playful easing — keep it calm and quick." The spring curve carries an intentional physical overshoot past the settled position before arriving. This is perceptible on roster load and produces a notification-app liveliness that directly contradicts the calm, academic brand. The `smooth` easing (`cubic-bezier(0.4, 0.0, 0.2, 1)`) is already defined in the Tailwind config under `transitionTimingFunction.smooth` and is the correct substitution.

**Secondary deduction — DS §1 token discipline (REVISE trigger):**

The student's submitted note body text (l.291) uses `text-[var(--text-secondary)]` (0.60 opacity):

```html
<p class="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
    I decided to run the latency matrix through an O(n log n) filter...
</p>
```

DS §1 maps `--text-secondary` to "Metadata, channel names, timestamps" and `--text-primary` to "Headings, message body." The student's submitted note is the message body of their work — the substance of their submission — not metadata. Rendering the user's own words at 0.60 opacity creates a WCAG AA contrast concern on the `surface-900` background and misrepresents the semantic weight of the content. The educator comment in the returned card correctly uses `text-[var(--text-primary)]` (l.323); the student submission note should match.

What would make it a 10: (a) Change `slideUpFade` animation timing from the `spring` curve to `cubic-bezier(0.4, 0.0, 0.2, 1)` (the defined `smooth` easing) — one-line fix. (b) Change the submitted note `<p>` at l.291 from `text-[var(--text-secondary)]` to `text-[var(--text-primary)]` — one-line fix. Both changes are surgical; no layout or structural impact.

---

### 4. Edge-Case Handling — 8 / 10

All required error states from Brief §3 are now present and structurally correct. Upload oversize (`#upload-error`, role=alert, inline, no layout break), submit POST failure (`#submit-error`, role=alert, retry path), return-action failure (`#return-error` in the return popover, role=alert, failure-then-retry simulation), 403 forbidden roster (`#forbidden-state`, calm lock icon + "Access restricted"), empty roster (`#empty-state`, "No submissions yet"), loading skeleton shimmer, attachment removal, and viewport-flip on the return popover are all implemented.

The submit-failure simulation correctly shows error on first attempt, then allows retry on second click (using `btn.dataset.hasFailed` flag). The return-failure simulation mirrors this pattern in the popover.

Minor deductions: The submit success path changes the button label to "Resubmit" (l.575) but does not clear the `#submit-error` banner — leaving the error and the new label simultaneously visible creates a brief visual contradiction. Only one skeleton row is shown; a 48-student roster would warrant 3–4 rows for a credible loading state. "Undo submission" button (l.299) has no JS handler (no-op click).

What would make it a 10: Add `submitErr.classList.add('hidden')` before the success path label change. Render 3 skeleton rows instead of 1. Add a stub handler or `disabled` state to "Undo submission."

---

### 5. Accessibility — 7.5 / 10

All five iter 1 blocking a11y concerns are resolved. The structural foundation is now sound: `role="dialog"` + `aria-modal="true"` + `aria-label` on the popover; Tab/Shift+Tab focus trap cycling within `focusableElements`; Esc close with focus restore; real `<input type="checkbox">` for Mark Done; global `aria-live="polite"` announcer with `announce()` called on all async state transitions; file input accessible via label wrapping without aria-hidden; `button:focus-visible` emerald ring defined globally; `aria-haspopup="dialog"` on return trigger buttons; `aria-hidden="true"` on skeleton row; role=alert on all error messages; `lang="en"` on html element; alt text on avatar images.

Remaining deductions:

The toggle thumb's `peer-checked:translate-x-4 peer-checked:bg-emerald-500` classes (l.223) are on an element that is a grandchild of the `<input class="sr-only peer">`, not a direct sibling. In standard Tailwind CSS the `peer-*` variants apply only to direct siblings of `.peer`. The outer container div (direct sibling) correctly activates `peer-checked:bg-emerald-500/20` and `peer-checked:border-emerald-500/50`, but the inner thumb div will not translate or change color on check. Sighted keyboard users and mouse users will see the container change color but the thumb remain stationary — the toggle appears broken visually while the underlying checkbox state is correctly toggled. This is an implementation-wiring issue; the design intent is clear and correct. The React build should apply the thumb transform via a state-driven class or data attribute.

The `return-trigger` buttons are `opacity-0` at rest and become visible only on group-hover or `focus-visible:opacity-100`. The `focus-visible:opacity-100` qualifier correctly reveals them for keyboard users, but a keyboard user tabbing through the roster will encounter buttons that are invisible until focused — a discoverability gap for sighted keyboard users who may not expect hidden interactive controls in the roster. This is a design pattern choice; a low resting opacity (e.g., `opacity-[0.15]`) would make the affordance discoverable without visual noise.

What would make it a 10: (a) Document in an HTML comment that the toggle thumb needs state-driven styling in React, not CSS peer variants. (b) Set `return-trigger` buttons to `opacity-[0.15]` at rest rather than `opacity-0`, so keyboard users can orient before focusing.

---

### 6. Responsive — 7.5 / 10

The Brief §5 responsive contract is met: `grid-cols-1 lg:grid-cols-12` collapses correctly at 1024px, `col-span-5`/`col-span-7` proportions are appropriate, server rail is `hidden md:flex`, sidebar is `hidden lg:flex`, and the mobile hamburger is `lg:hidden`. `sticky top-8` on the student column keeps the submit control in view while scrolling a long roster. `max-sm:hidden` on sort label and return button text hides correctly on narrow viewports. Popover viewport-flip logic (flip up near bottom edge) is implemented.

Deductions: The JS popover left-position calculation (`left = rect.left - (300 - rect.width)`) has no lower boundary clamp. At exactly 1024px viewport width, the right column is narrow enough that a right-aligned Return trigger's `rect.left` can produce a negative `left` value, clipping the 300px popover against the left viewport edge. No `Math.max(8, ...)` guard exists. The hardcoded timeline node at `top-[214px]` (flagged under spacing rhythm) creates an additional responsive fragility: in the single-column layout below 1024px, the left column stacks full-width and the magic-number y-position will likely be wrong against the actual rendered card height on narrower screens.

What would make it a 10: Add `const clampedLeft = Math.max(8, Math.min(left, window.innerWidth - 308))` in `openReturnPopover()`. Replace hardcoded timeline positions with fluid CSS (see Spacing Rhythm suggestion).

---

## REVISE items — design-direction only (must be fixed in staging HTML before adoption)

Both items are single-line fixes that do not affect layout, structure, or interaction logic.

---

**REVISE-1 — Spring easing on roster animations violates DS §6 motion principles**

File: `<style>` block — `slideUpFade` keyframe animation / Tailwind config `spring` key.

Current (l.95–97, l.42–43 of config):
```
animation: slideUpFade 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards
```

Required:
```
animation: slideUpFade 0.35s cubic-bezier(0.4, 0.0, 0.2, 1) forwards
```

The `smooth` easing is already defined in the Tailwind config (`transitionTimingFunction.smooth`). Use it here.

DS reference: DESIGN-SYSTEM.md §6 — "No bouncy/playful easing — keep it calm and quick."
Brief reference: §11(a) — "submission lifecycle read as calm/academic."

---

**REVISE-2 — Student submitted-note body text at `--text-secondary` instead of `--text-primary`**

File: l.291, the `<p>` inside the submitted state card.

Current:
```html
<p class="text-sm text-[var(--text-secondary)] leading-relaxed mb-3">
```

Required:
```html
<p class="text-sm text-[var(--text-primary)] leading-relaxed mb-3">
```

The submitted note is the message body of the student's work. DS §1 maps `--text-primary` to "Headings, message body" and `--text-secondary` to "Metadata, channel names, timestamps." The educator comment in the returned card at l.323 correctly uses `--text-primary`; the submitted note must match.

DS reference: DESIGN-SYSTEM.md §1 text token semantic mappings.
Brief reference: §4.7 typography token discipline.

---

## Non-blocking implementation wiring notes (must NOT delay adoption once REVISE-1 and REVISE-2 are applied)

These belong to the React build, not to the design adoption gate.

**WIRE-1 — Toggle thumb `peer-checked:` on non-sibling element**
The `peer-checked:translate-x-4 peer-checked:bg-emerald-500` classes on the inner thumb div (l.223) are on a grandchild of the `<input class="peer">`. Standard Tailwind peer variants apply only to direct siblings. The React implementation should use a state variable (`checked`) to apply the thumb transform class: `checked ? 'translate-x-4 bg-emerald-500' : 'translate-x-0 bg-white/40'`. Design intent is correct; this is a CSS scope limitation.

**WIRE-2 — `shadow-[var(--shadow-sm)]` and `shadow-[var(--shadow-pop)]` CSS var references**
`--shadow-sm` and `--shadow-pop` are Tailwind config keys, not CSS custom properties in `:root`. The arbitrary Tailwind syntax `shadow-[var(--shadow-sm)]` resolves to empty at runtime in the CDN build. Use the standard Tailwind classes `shadow-sm` and `shadow-pop` directly. Design intent (shadow-sm / shadow-pop per DS §5) is clear.

**WIRE-3 — Hardcoded absolute timeline node positions**
`top-[14px]` and `top-[214px]` are static measurements from this mockup's rendered card heights. The React implementation should position nodes relative to their adjacent cards using margins or a ref-based calculation. The timeline pattern (vertical line, nodes, stacked cards) is correct and must be preserved.

---

## Preserved elements (do not alter in refine pass if REVISE is triggered)

The following are explicitly confirmed correct and should not be touched:

- All §3 states present and correctly structured — form, submitting spinner, submitted card, returned card, roster loaded, roster empty, return popover, loading skeleton, all error states
- §10 grading compliance confirmed — no grade, score, rubric, or numeric field anywhere
- `role="dialog"` / `aria-modal="true"` / `aria-label="Return submission"` on the return popover
- Focus trap (Tab/Shift+Tab cycle within `focusableElements`) and Escape close
- Focus restore to `currentTriggerButton` on close
- `#a11y-announcer` aria-live=polite with `announce()` called on all async state changes
- Real `<input type="checkbox" class="sr-only peer">` for Mark Done
- File input accessible via label wrapping, no aria-hidden
- Token audit: all color values map to DS §1 tokens; no invented hex
- All badge/status text at 12px minimum
- Emerald returned / amber awaiting semantic treatment — calm, not grade-like
- `lg:grid-cols-12` with col-span-5 / col-span-7 responsive inline layout
- role=alert on all error messages with inline display, no layout break
- `#empty-state` and `#forbidden-state` structures
- The timeline pattern (vertical line + node dots + stacked submitted/returned cards)
- Roster row layout, hover states, return trigger with aria-haspopup="dialog"
- Glass panel popover, shimmer skeleton, server rail with emerald indicator bar

---

## Verdict

**REVISE**

All five iter 1 blocking concerns are resolved. The design is structurally sound, all §3 states and error states are present, §10 grading compliance is confirmed, the dialog accessibility pattern is correctly implemented, and no invented tokens appear. Two design-direction items require correction before adoption: (1) the spring/bouncy easing on roster row animations directly violates DS §6 and must be changed to the `smooth` easing already defined in the Tailwind config; (2) the student's submitted note body text uses `--text-secondary` (metadata token) instead of `--text-primary` (message-body token) per DS §1. Both are single-line fixes with no layout impact. Three wiring notes are documented above and must not delay adoption once the two REVISE items are applied.
