# D-3 Phase-1 Design Review — assignment-submissions.html
Reviewer: plan-design-review (Reviewer A, independent)
Input: `design/staging/assignment-submissions.html` · `D-1-brief` · `DESIGN-SYSTEM.md`

---

## Dimension Scores

### 1. Visual Hierarchy — 7 / 10

The assignment title (h1, 3xl/4xl, semibold) dominates cleanly; the amber due chip provides immediate urgency at a glance; the "Your Work" / "Submissions Roster" column split reads as a coherent dual-audience layout. The timeline stack in the student column adds appropriate depth.

Deductions: The timeline nodes rely on hard pixel offsets (`top-[214px]`, `top-[14px]`) that will misalign if content reflows (font scaling, longer note text). The student "not submitted" form and the "submitted" history card coexist at the same time in the scrollable left column — state boundaries look simultaneous rather than sequential, reducing hierarchy clarity. The two h2 headings in the columns use different sizes (lg=18px vs 15px) inconsistently.

What would make it a 10: Replace hard-offset timeline nodes with a flex/gap-driven layout so reflow is safe. Enforce a single active sub-state at a time in the student column (form OR submitted card, not both in the same scroll). Align h2 sizes to the same DS scale value.

---

### 2. Spacing Rhythm — 6 / 10

Most card-internal spacing is calm and consistent (`p-4`, `gap-6`, `gap-4`). The section divider and column gap read correctly at the macro level.

Deductions: `gap-10` (40px) is used twice for major section gaps and falls between the explicit DS §3 scale values of 32px (8) and 48px (12) — it is off-scale. `p-5` (20px) on the returned state card is likewise off-scale between 16px (4) and 24px (6). Card internal padding is inconsistent: `p-4 pb-3`, `p-5`, `p-3.5`, `p-3` across the four primary cards with no discernible hierarchy reason.

What would make it a 10: Replace `gap-10` with `gap-8` (32px) or `gap-12` (48px); replace `p-5` with `p-4` or `p-6`; standardize card padding to `p-4` (cards in-panel) or `p-5` only as a deliberate featured-card variant documented in the DS.

---

### 3. Brand Coherence (calm/academic, dark-only) — 7 / 10

Dark-only is correctly enforced (`html class="antialiased dark"`, all surface tokens resolve to near-black zinc). Geist is loaded and applied. The emerald/amber semantic roles are used correctly: emerald for completion acknowledgement, amber for awaiting attention. The returned comment display as a blockquote-style italic callout reads academic and restrained. No gaming neons, no loud gradients. The glass-panel backdrop blur on the popover is tasteful.

Deduction (material): The assignment body copy at line 201 reads: "Grade will be mapped to the central rubric automatically upon return." Two prohibited terms — "Grade" and "rubric" — appear in the UI copy, directly contradicting the §10 non-goal. Even as placeholder/demo text, this lands in the rendered mockup and contradicts the scope brief. See §10 check below for full flag.

What would make it a 10: Replace the assignment body paragraph with copy that describes collection/return only (e.g., "Your educator will acknowledge receipt and return your work with optional comments."). Remove every grading/rubric affordance from copy.

---

### 4. Edge-Case Handling — 6 / 10

Present states:
- Student submit form: ✓
- Student submitting (button spinner + disabled): ✓
- Student submitted: ✓ (timeline history card)
- Student returned (emerald badge + educator comment): ✓
- Educator roster loaded: ✓
- Educator roster empty ("No submissions yet"): ✓
- Return popover open: ✓
- Loading skeleton (shimmer row): ✓
- Attachment oversize error (inline, no layout break): ✓

Missing states (brief §3):
- **POST submit failure** — if the network request itself fails (not attachment error), no error message appears. The `submitAssignment()` function's `setTimeout` simulation always resolves successfully; no failure branch is rendered.
- **403 over-permission** — brief §3 explicitly calls out "over-permission 403 → calm inline message; no raw failure." This state is entirely absent from the design. A member without `manage_assignments` seeing the roster (or hitting the return endpoint) should receive a calm inline error, not silence or a raw browser error.

State conflation: the student form and the submitted-card timeline both render in the same column simultaneously. This presents "not submitted" and "submitted not returned" as concurrent rather than as mutually exclusive states. A static mockup showing all states is acceptable, but the brief's state list implies distinct views; the design should clarify via section labeling or a visible state toggle.

What would make it a 10: Add a POST failure branch (danger inline message below the submit button matching the attachment error pattern). Add a 403 state to the student column (a calm notice "You don't have access to this section"). Label each state block explicitly in the prototype.

---

### 5. Accessibility (WCAG-AA contrast, focus rings, role=menu popover a11y) — 5 / 10

**Contrast:**
- `--text-primary` (rgba 255,255,255,0.92) on surface-800 (#1c1c1f): computed effective ≈ #EAEAEA, contrast >15:1. ✓
- `--text-secondary` (rgba 255,255,255,0.60) on surface-800: computed effective ≈ #A4A4A5, contrast ≈ 7:1. ✓
- `--text-muted` (rgba 255,255,255,0.40) on surface-800: computed effective ≈ #777779, contrast ≈ 3.87:1. **WCAG AA FAIL** for normal-sized text (threshold 4.5:1). This value is used for metadata text (timestamps, sub-labels) throughout the roster and submission cards — not exempted as decorative or inactive.

**Focus rings:**
- `button:focus-visible { outline: 2px solid emerald; }` is set globally. ✓
- The `.input-ring:focus-within` CSS block at line 86 references `var(--glow-focus)` as a CSS custom property, but `--glow-focus` is never declared in `:root` (only in the Tailwind `boxShadow` config). This CSS rule is broken — no glow will appear on the `#return-comment` textarea's wrapper when focused, since that wrapper carries the `input-ring` class. The student form box correctly uses Tailwind inline classes (`focus-within:shadow-[...]`) and is unaffected, but the popover textarea is not.

**role="menu" popover a11y (brief §4, §9):**
- `role="menu"` declared on the return popover: present. ✓
- `aria-hidden="true"` initial state: ✓
- `aria-label="Return Assignment"`: ✓
- Esc closes: ✓
- Outside-click closes: ✓
- Focus moves to textarea on open (100ms timeout): ✓
- **Semantic error:** `role="menu"` requires child elements with `role="menuitem"`, `"menuitemcheckbox"`, or `"menuitemradio"`. The popover contains a form (`<textarea>` + `<button type="submit">`), not menu items. This is a WCAG 4.1.2 / ARIA semantic violation. The DS §8 Tooltip/Popover entry describes the Return-comment popover pattern as a popover (focus management + Esc), not as a `menu`; the brief §4 references the `role="menu"` shipped pattern from MessageList reactions, but that pattern applies to item-lists, not forms. The correct ARIA role here is `role="dialog"` with `aria-modal="true"` and a visible/sr-only title.
- **Focus return on close missing:** `closePopover()` does not restore focus to the triggering "Return" button after the popover dismisses. The DS §8 Modal/Dialog spec states "restore focus on close." The brief §6 states "Esc close+refocus." This is not implemented.
- **Trigger attributes missing:** The "Return" buttons in roster rows have no `aria-haspopup` or `aria-expanded` attributes — screen readers cannot announce that a popover will open.

**Type size:**
- Badge labels ("Returned", "Awaiting") use `text-[11px]` — DS §2 states 12px is the minimum (timestamps/metadata), and 14px is the minimum body text. 11px is below the documented minimum at DS §2.

What would make it a 10: Fix `--text-muted` floor to ~4.5:1 minimum (approximately rgba 255,255,255,0.50 or higher on surface-800, test computed value). Define `--glow-focus` in `:root` or remove the broken CSS var reference and use the Tailwind class directly. Change `role="menu"` to `role="dialog" aria-modal="true"`. Add focus-return-to-trigger in `closePopover()`. Add `aria-haspopup="dialog"` and `aria-expanded` on each Return trigger. Lift badge text to 12px minimum.

---

### 6. Responsive Behavior — 6 / 10

- Sidebar `hidden lg:flex` (1024px breakpoint): ✓ — correctly collapses below 1024.
- Server rail `hidden md:flex` (768px): fine for the rail shell element.
- Max-width `max-w-6xl mx-auto` with `px-4 lg:px-8`: readable at 1440+. ✓
- Popover viewport-flip logic (flip up near bottom edge): ✓

**Breakpoint gap:** The split-column grid uses `xl:col-span-5` and `xl:col-span-7`, where Tailwind `xl` = 1280px. Between 1024–1279px (the exact viewport range the brief calls out as the minimum "assignments panel visible + roster inline"), both columns collapse to a single stacked column. The brief §5 states "Desktop (≥1024): … assignment detail shows submit + (for educators) the roster inline." This is not satisfied at 1024–1279px.

**Sticky left column:** The student column carries `sticky top-8`, but the scroll container two levels up (`overflow-y-auto no-scrollbar`, line 186) is the scrolling ancestor. A sticky element only works within its nearest scrolling ancestor that has `overflow` set. Because the sticky sits inside a `flex-1 overflow-hidden` main element wrapping the `overflow-y-auto` container, the stacking context is correct and sticky should function — but the grid itself stacks at <1280px, making sticky moot below that breakpoint.

What would make it a 10: Change the grid to `lg:grid-cols-12` (1024px) and move the column spans to `lg:col-span-5`/`lg:col-span-7` to satisfy the brief's ≥1024 inline requirement. Verify sticky behavior at 1024 after that change.

---

## Brief-Specific Checks

### §3 State Coverage

| State | Present |
|---|---|
| Student — not submitted (form) | ✓ |
| Student — submitting (spinner) | ✓ |
| Student — submitted, not returned | Partial — coexists visually with form rather than replacing it |
| Student — returned (emerald badge + comment) | ✓ |
| Educator — roster loaded | ✓ |
| Educator — roster empty | ✓ |
| Educator — return popover open | ✓ |
| Loading (skeleton shimmer) | ✓ |
| Error (attachment oversize) | ✓ |
| Error (POST submit failure) | **Missing** |
| Error (over-permission 403) | **Missing** |

### Returned/awaiting as calm acknowledgement, unmistakably NOT a grade

The "Returned" badge (emerald check-circle + text, no number) and the "Awaiting" badge (amber dot + text) both read correctly as acknowledgement states. The educator's comment is rendered in an italic blockquote with no score, rubric line, or percentage. The student returned card contains only: "Returned," the educator's name, a timestamp, and the free-text comment.

This reads as an academic acknowledgement loop, not a grade return. ✓

### §10 Non-goal "NO grading" — grading/score/rubric language

**FLAG: assignment body paragraph, line 201:**

> "Grade will be mapped to the central rubric automatically upon return."

Two explicit prohibited terms appear in rendered copy:
- **"Grade"** — violates §10 "NO grading / score / rubric / gradebook / LMS sync"
- **"rubric"** — same violation

This is placeholder/demo body text for the midterm assignment, but it lands in the mockup as visible UI copy and contradicts the scope contract. The sentence must be replaced with neutral submission-and-return language before approval.

No other grading affordances (score fields, percentage displays, grade columns) found.

### Token discipline

All color values in the Tailwind config and CSS custom properties match DESIGN-SYSTEM.md §1 exactly:
- Surface tokens `#0a0a0b` through `#52525b` ✓
- `#10b981` emerald ✓
- `#f59e0b` amber ✓
- `#ef4444` / `#f87171` danger ✓
- Border and text rgba values match DS definitions ✓
- Alpha variants of existing tokens (`rgba(16,185,129,0.4)`, `rgba(245,158,11,0.5)`) are acceptable — not new hues.

**No invented hex values.** Token discipline: PASS.

### Additional issues not under a scored dimension

- **Broken icon class (line 135):** `class="ph ph- graduation-cap"` has a stray space — the active server icon in the rail will not render. Should be `ph-graduation-cap`.
- **Off-scale spacing:** `gap-10` (40px) is used twice (line 187 outer canvas, line 208 grid); the DS §3 scale does not include 40px. Replace with `gap-8` (32px) or `gap-12` (48px).

---

## Enumerated Concerns

1. **§10 / DESIGN-SYSTEM §1 — Grade/rubric copy in assignment body (line 201):** "Grade will be mapped to the central rubric automatically upon return." Violates §10 non-goal explicitly. Replace with submission-acknowledgement-only copy before approval.

2. **Brief §4 / §9 / DS §8 — role="menu" semantic error:** The return popover is a form (`<textarea>` + submit button), not a list of menu items. `role="menu"` is incorrect; use `role="dialog" aria-modal="true"`. This is a WCAG 4.1.2 violation and contradicts the DS §8 Modal/Dialog a11y spec and the brief's "reuse shipped popover a11y" contract.

3. **Brief §9 / DS §8 — Focus not restored to trigger on popover close:** `closePopover()` does not call `.focus()` on the triggering Return button. Brief §6 explicitly states "Esc close+refocus." DS §8 Tooltip/Popover states "focus management … Esc." Add `document.getElementById(currentTargetRowId)?.querySelector('.return-trigger')?.focus()` in `closePopover()`.

4. **Brief §5 — Responsive grid breakpoint mismatch:** `xl:col-span` activates at 1280px; brief requires the dual-column inline layout at ≥1024px. Between 1024–1279px the columns stack and the roster disappears below the fold. Change to `lg:col-span`.

5. **DS §5 / brief §9 — Broken CSS var `--glow-focus` in `.input-ring`:** `var(--glow-focus)` is referenced in the stylesheet but never declared in `:root`. The textarea focus ring in the return popover will silently fail. Define the value in `:root` or use the Tailwind shadow class directly.

6. **DS §1 — `--text-muted` contrast failure:** `rgba(255,255,255,0.40)` on surface-800 yields approximately 3.87:1 — below WCAG AA 4.5:1 for normal text. Used on roster metadata, timestamps, and sub-labels. Lift to at least `rgba(255,255,255,0.50)` and verify the computed value on each background it appears on.

7. **Brief §3 — Missing error states:** POST submit failure and 403 over-permission states are not rendered. Brief §3 explicitly lists both. Add inline danger messages for each following the attachment-error pattern already in the design.

8. **Brief §3 / §6 — Student state conflation:** The submit form and the submitted/returned history cards appear simultaneously in the left column. While a demonstration convenience, the states "not submitted" and "submitted" are not clearly demarcated. Label prototype sections or show state transitions via a visible toggle/label.

9. **DS §2 — 11px badge text below minimum:** `text-[11px]` on "Returned" and "Awaiting" labels. DS §2 floor is 12px for metadata; these are interactive status labels. Lift to `text-[12px]`.

10. **DS §7 / HTML — Broken icon class (line 135):** `ph ph- graduation-cap` (space in class) renders a blank icon. Fix to `ph ph-graduation-cap`.

---

## Verdict

**REVISE**

Concerns 1 (§10 grading copy), 2 (role="menu" semantic error), 3 (focus-return missing), and 4 (responsive breakpoint mismatch) each constitute a blocking issue against the brief's explicit requirements. Concerns 5 and 6 are accessibility regressions against DESIGN-SYSTEM.md commitments. The visual language, token discipline, and overall calm/academic aesthetic are sound — this is a REVISE, not a REJECT — but the design cannot be canonicalized until the §10 copy violation, the ARIA role error, focus management, and the 1024px grid breakpoint are corrected.
