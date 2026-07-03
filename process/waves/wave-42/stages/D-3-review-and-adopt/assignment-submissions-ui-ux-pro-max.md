# D-3 Review & Adopt — Assignment Submissions Iter-2 Accessibility & UX Audit

**Reviewer:** Accessibility-Tester (independent, no prior context)  
**Cycle:** 3 of 3  
**Date:** 2026-07-03  
**Rubric:** ui-ux-pro-max (high-bar review)

---

## Executive Verdict

**REVISE** — One material UX affordance gap requires clarification before adoption. All WCAG blockers fixed; all brief §9 success criteria structurally present; all design-system tokens verified. Iteration 2 successfully closed accessibility gaps, but a state-interaction path remains ambiguous.

---

## 1. Requirement Checkbox Audit (Brief §9)

### ✓ PASS — Student submit control + own submission card render
- **Evidence:** Lines 229–277 form (textarea, file input, Submit button)
- **States modeled:** Not submitted → submitting (spinner) → submitted (lines 286–301)
- **Returned state:** Lines 307–327 (emerald badge + educator comment)

### ✓ PASS — Educator Submissions roster (manage_assignments gating)
- **Evidence:** Lines 333–462 roster component
- **Structure:** Header with filter/sort (lines 336–348), list of rows (lines 352–443)
- **Empty state:** Lines 446–451 ("No submissions yet")
- **403 state:** Lines 455–461 (access-restricted error)
- **Note:** Permission gating is implementation responsibility; mockup models educator perspective

### ✓ PASS — Return control opens role=menu popover with a11y
- **Dialog a11y:** Line 470 `role="dialog" aria-modal="true" aria-label="Return submission"` ✓
- **Esc/outside-click close:** Lines 703–721 (keyboard + click handlers) ✓
- **Focus trap:** Lines 690–707 (Tab/Shift+Tab cycle, `first`/`last` focus management) ✓
- **Focus restore:** Line 635 `currentTriggerButton.focus()` ✓
- **Textarea label:** Line 483 `<label class="sr-only" for="return-comment">` ✓

### ✓ PASS — Returned = emerald acknowledgement badge (NOT grade); Awaiting = amber
- **Returned badge (emerald):** Line 314–316 (check-circle icon + "Returned" label)
- **Awaiting badge (amber):** Line 372–376 (dot icon + "Awaiting" label)
- **Roster returned state:** Lines 400–402 (check-circle + "Returned")
- **No score/grade anywhere:** Verified ✓

### ✓ PASS — Attachment uses Phosphor chip; errors surface inline; WCAG-AA contrast
- **Phosphor icons:** `paperclip` (line 263), `file-pdf`/`file` (lines 237, 295) ✓
- **Upload error (role="alert"):** Lines 249–252 inline message ✓
- **Submit error:** Lines 254–257 inline ✓
- **Return error:** Lines 488–491 inline ✓
- **Dark-only:** Verified ✓
- **Contrast:** Primary on surface-800/900 = 12:1; secondary on surface-700 = 5.8:1; danger-text (#f87171) on danger/10 tint = 6.3:1 ✓

### ✓ PASS — In-viewport at 1024/1280/1440
- **Grid layout:** Line 212 `grid grid-cols-1 lg:grid-cols-12` (responsive)
- **Left column:** `lg:col-span-5` (student submit + history)
- **Right column:** `lg:col-span-7` (roster)
- **Scrollable canvas:** Line 190 `.overflow-y-auto` with max-width constraint
- **No overflow:** Verified at standard breakpoints ✓

---

## 2. UX Flow Analysis

### Student Submission Path
1. ✓ Form visible (textarea + file input) — lines 229–277
2. ✓ Attach file → preview shown (lines 234–247), error handled inline (249–252)
3. ✓ Submit → spinner/disabled (lines 550–584 script)
4. ✓ Success → own submission card appears (286–301)
5. ✓ Returned state displayed below (307–327) with educator comment
6. **⚠ CLARIFICATION NEEDED:** After return, how does student resubmit?
   - Form persists above timeline (not replaced/hidden)
   - But form isn't labeled to indicate it's re-editable post-return
   - No affordance on returned card (e.g., "Edit submission" button)
   - **UX path ambiguous** — user may not realize form can be re-edited

### Educator Return Path
1. ✓ Roster shows submissions (lines 354–432)
2. ✓ Row hover/focus reveals Return button (lines 378–380, 429–431, opacity animation)
3. ✓ Click Return → popover opens, positioned (lines 587–628)
4. ✓ Type optional comment (line 485)
5. ✓ First submit attempt fails → error shown (line 659, `announce("Couldn't return submission...")`)
6. ✓ Retry succeeds → row updates to returned badge (line 674), dims (line 680)
7. ✓ Popover closes, focus restores to trigger (line 635)

### Dead-Ends / Missing States
- **Resubmit-after-return affordance:** Brief §3 requires it; mockup doesn't clearly show how
- **403 error state:** Structurally present (lines 455–461) but not triggered in flow
- **Offline/transient:** Out of scope for iter-2

---

## 3. Token Audit

### Colors
| Token | Usage | Verified |
|-------|-------|----------|
| `--text-primary` | Headings, names, primary text | ✓ |
| `--text-secondary` | Metadata, timestamps, secondary labels | ✓ |
| `--text-muted` | Placeholder only (line 231) | ✓ |
| `--surface-950` | App background (line 66) | ✓ |
| `--surface-900` | Sidebars, cards (lines 30, 286, etc.) | ✓ |
| `--surface-800` | Canvas, cards (lines 168, 294) | ✓ |
| `--surface-700` | Hover fills, borders (line 222) | ✓ |
| `--surface-600` | Borders (line 470) | ✓ |
| `--border-hairline` | Default borders (lines 20, 57) | ✓ |
| `--border-hover` | Hover borders (line 212) | ✓ |
| `--accent-emerald` | Buttons, badges, focus rings (lines 36, 314) | ✓ |
| `--accent-amber` | Due/awaiting badge (lines 36, 196) | ✓ |
| `--danger` | Error fills (line 38) | ✓ |
| `--danger-text` | Error text (line 250) | ✓ |

**Verdict:** Zero fragmentation; all tokens mapped to DESIGN-SYSTEM.md ✓

### Typography
- Body: `text-sm` (14px) ✓
- Metadata: `text-xs` (12px) ✓
- Headings: `font-semibold` / `font-medium` ✓
- No invented sizes ✓

### Spacing, Radius, Shadow
- All spacing: 4px multiples (Tailwind scale) ✓
- Radius: `rounded-lg` (cards/popover), `rounded-md` (buttons), `rounded-full` (avatars) ✓
- Shadows: `shadow-sm` (cards), `shadow-pop` (popover) ✓

**Verdict:** All tokens verified ✓

---

## 4. Phosphor Icon Audit

| Icon | Location | Semantic | Class | Status |
|------|----------|----------|-------|--------|
| `ph-graduation-cap` | Line 139 | Server icon | ✓ | ✓ |
| `ph-clipboard-text` | Lines 162, 177 | Assignments nav | ✓ | ✓ |
| `ph-paperclip` | Line 263 | Attach button | ✓ | ✓ |
| `ph-file-pdf` | Line 237 | PDF attachment | ✓ | ✓ |
| `ph-file` | Line 295 | File chip | ✓ | ✓ |
| `ph-clock` (fill) | Line 197 | Due badge | ✓ | ✓ |
| `ph-check-circle` (fill) | Lines 315, 401 | Returned badge | ✓ | ✓ |
| `ph-arrow-u-turn-left` | Lines 379, 474 | Return action | ✓ | ✓ |
| `ph-warning-circle` | Lines 250, 255, 490 | Error state | ✓ | ✓ |
| `ph-x` | Lines 245, 477 | Close button | ✓ | ✓ |
| `ph-quotes` | Line 322 | Comment decoration | ✓ | ✓ |
| `ph-lock-key` | Line 457 | 403 error | ✓ | ✓ |
| `ph-tray-light` | Line 448 | Empty state | ✓ | ✓ |
| `ph-funnel` | Line 343 | Filter button | ✓ | ✓ |
| `ph-sort-descending` | Line 346 | Sort button | ✓ | ✓ |
| `ph-dots-three` | Line 405 | Row actions | ✓ | ✓ |
| `ph-text-align-left` | Line 395 | Text-only indicator | ✓ | ✓ |

**Verdict:** All 17 icons semantic and correct; no broken classes ✓

---

## 5. Accessibility Audit — Iter-1 Blockers Verification

### Blocker 1: Return popover role=dialog aria-modal with accessible name
- **Line 470:** `role="dialog" aria-modal="true" aria-label="Return submission"` ✓
- **Status:** FIXED ✓

### Blocker 2: Focus TRAP while dialog open (Tab/Shift+Tab cycle + focus restore on close)
- **Focus trap (lines 690–707):**
  ```javascript
  if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();  // Shift+Tab wraps to last
  } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();  // Tab wraps to first
  }
  ```
- **Focus restore (line 635):** `currentTriggerButton.focus();` ✓
- **Status:** FIXED ✓

### Blocker 3: File input reachable (NO aria-hidden), with <label>
- **File input (line 265):** `<input type="file" id="attachment-input" class="sr-only" ...>` (sr-only, NOT aria-hidden) ✓
- **Label (lines 262–266):** `<label for="attachment-input">Attach file</label>` wrapping interactive area ✓
- **Status:** FIXED ✓

### Blocker 4: Mark-Done control is real interactive element (button aria-pressed / checkbox)
- **Lines 219–225:** Real `<input type="checkbox">` with `aria-label="Mark assignment done"` ✓
- **Keyboard operable:** Native checkbox behavior ✓
- **CSS states:** `peer-checked:` pseudo-class reflects visual state ✓
- **Status:** FIXED ✓

### Blocker 5: aria-live="polite" region announces async submit/return
- **Announcer (line 132):** `<div id="a11y-announcer" aria-live="polite" aria-atomic="true" class="sr-only"></div>` ✓
- **Announcements triggered on:**
  - File upload validation (line 531)
  - File attached (line 537)
  - Attachment removed (line 547)
  - Submit start (line 556)
  - Submit error (line 573)
  - Submit success (line 581)
  - Dialog open (line 628)
  - Return processing (line 664)
  - Return success (line 681)
  - Dialog close (line 705)
- **Status:** FIXED ✓

### Blocker 6: WCAG-AA contrast; focus-visible rings
- **Focus rings:**
  - Line 88–89: `input-ring:focus-within` applies `--glow-focus` (emerald ring)
  - Line 123: `button:focus-visible { outline: 2px solid #10b981; outline-offset: 2px; }`
  - Line 222 (checkbox): `peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500`
  - Line 262 (file label): `focus-within:ring-2 focus-within:ring-emerald-500`
- **Contrast verification:**
  - Text-primary on surface-800: rgba(255,255,255,0.92) on #1c1c1f ≈ 12:1 ✓ (WCAG AAA)
  - Text-secondary on surface-700: rgba(255,255,255,0.60) on #27272a ≈ 5.8:1 ✓ (WCAG AA)
  - Danger-text: #f87171 on danger/10 tint ≈ 6.3:1 ✓ (WCAG AA, per DESIGN-SYSTEM §1)
  - Emerald focus ring: sufficient differentiation ✓
- **Status:** FIXED ✓

**Iter-1 Blocker Summary:** All 6 blockers resolved ✓

---

## 6. Non-Goals Verification (Brief §10)

- ✓ NO grading / score / rubric (only emerald "Returned" acknowledgement)
- ✓ NO multi-file submissions (single optional attachment)
- ✓ NO free-text return-notification push (deferred to M8)
- ✓ NO mobile-specific design (desktop-first)
- ✓ NO changes to private todo/done toggle (orthogonal, line 219–225 independent)

---

## Material Finding: Resubmit-After-Return Affordance Gap

### Context
Brief §3 (Student states): "**Student — returned** (a calm returned badge + the educator's comment shown; **resubmit still possible, which clears the returned state**)."

Brief §6 (Interaction patterns): "...resubmit edits in place (the same control repopulated)."

### Current Mockup
- Returned state card (lines 307–327): Read-only display (badge + comment)
- Submit form (lines 229–277): Persists above timeline, **not conditionally hidden**
- No explicit affordance linking returned card to form or indicating form re-editability

### UX Ambiguity
A user seeing the returned state may not realize they can re-edit the form above to resubmit. The interaction path is:
1. **Intended:** Form remains visible and re-editable; user re-fills and clicks Submit to resubmit
2. **Actual:** Form is present but unlabeled as re-editable post-return

### Requirement
Brief §3 explicitly requires resubmit to be "still possible" — this implies a discoverable affordance. The mockup models the form's persistence but doesn't make the affordance obvious.

---

## Verdict: REVISE

### Blocking Issue
One material UX clarity gap requires resolution before D-3 adoption:

**Brief §3 mandates resubmit after return; mockup doesn't clearly show the affordance.** 

The returned card is read-only. The form above persists but lacks a label or affordance indicator. Clarify one of:
1. **Add "Edit submission" button to returned card** → links focus/scroll to form above
2. **Add visible label to form when returned state exists** → e.g., "Edit and resubmit below to address feedback"
3. **Add subtle affordance on returned card** → e.g., "Want to resubmit? Edit your submission above"

This is **not** a WCAG blocker (accessibility is sound), but it is a **state-interaction completeness issue** that a high-bar review must flag before adoption.

---

## Strengths (Iter-2 Refinements)

1. ✓ All 6 iter-1 a11y blockers fixed (focus trap, dialog a11y, file input, checkbox, aria-live, contrast)
2. ✓ All 6 brief §9 success criteria met
3. ✓ Zero design-system token violations
4. ✓ All 17+ Phosphor icons semantically correct
5. ✓ Return-failure state now modeled (lines 654–666 retry flow)
6. ✓ Real checkbox for Mark-Done (not just toggle appearance)
7. ✓ Composed, calm aesthetic — academic tone consistent with DESIGN-SYSTEM direction

---

## Implementation Notes (React Build Team)

1. **Resubmit-after-return:** Form should remain editable post-return. When returned state is displayed, add a subtle label or affordance to guide user to re-edit form. Consider:
   - Clearing form on new submission (or preserving for draft recovery)
   - Showing a "Resubmit" variant of the Submit button when returned state exists
   - Adding a progress indicator showing submission → returned → resubmitted flow

2. **Roster permission gating:** Implement via `member.permissions.includes('manage_assignments')` before rendering roster (lines 333–462).

3. **File input:** Ensure actual file validation matches mockup error handling (10MB size limit per brief §6).

4. **Announcement timing:** The aria-live announcer clears after 3s (line 519) — appropriate for screen reader persistence.

5. **Focus management:** Current implementation (line 626 `setTimeout(() => returnTextarea.focus(), 100)`) may be too early for some AT. Consider `requestAnimationFrame` or delaying to `200ms`.

---

## Summary

| Dimension | Status | Evidence |
|-----------|--------|----------|
| WCAG Compliance | ✓ PASS | All 6 iter-1 blockers fixed; AA contrast verified |
| Brief §9 Success Criteria | ✓ PASS | All 6 checkboxes structurally present |
| Design-System Tokens | ✓ PASS | Zero violations; all colors/spacing/radius mapped |
| Phosphor Icons | ✓ PASS | 17+ icons, all semantic, all correct class structure |
| UX Flow | ⚠ NEEDS CLARIFICATION | Resubmit path ambiguous; form persists but not labeled |
| Non-Goals | ✓ PASS | Zero grading, single attachment, desktop-first |

**Verdict:** **REVISE** — Fix resubmit-after-return affordance clarity; all other requirements met.

---

Co-Authored-By: Accessibility-Tester  
Review Cycle: 3 of 3  
Date: 2026-07-03
