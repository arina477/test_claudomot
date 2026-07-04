# D-3 Plan-Design Review — class-scheduling.html
**Reviewer:** ui-designer (Reviewer A — independent)
**Rubric:** /plan-design-review
**Artifact:** `design/staging/class-scheduling.html`
**Brief:** `process/waves/wave-43/stages/D-1-brief/class-scheduling-brief.md`

---

## Dimension Scores

### 1. Visual Hierarchy — 8 / 10

The amber "Today" group header vs. muted white headers for future dates is an effective hierarchy lever that anchors temporal reading. Session titles at `text-base font-semibold` sit cleanly above `text-xs` time/metadata rows. The amber left-edge indicator bar on the active "soon" card draws the eye correctly without being aggressive.

What would make it a 10: The "Tomorrow" and future date headers (`text-[13px] font-semibold text-text-primary uppercase`) are nearly identical in weight and color to the session title text (`text-base font-semibold text-text-primary`) — the group label needs ≥1 tier of visual separation from the card title to establish a true two-level hierarchy. A small bump to `text-text-secondary` or `text-text-muted` for non-today headers would reinforce the agenda rhythm without adding noise.

### 2. Spacing Rhythm — 7 / 10

Section gaps of `space-y-10` (~40px) between date groups and `space-y-1` (~4px) between cards within a group appropriately compact the intra-group cards while separating groups. Panel padding is consistent at `p-6`. The modal form uses `space-y-6` (~24px) between field groups — correct per the design system's 24px section-gap rhythm.

What would make it a 10: Two micro-issues break the rhythm. (a) The date group header margin is `mb-3` (12px) before the first card — tight relative to the 40px gap above, creating an asymmetric feel; `mb-4` (16px) would balance it. (b) The agenda list's containing `p-4 md:p-6 lg:padding-8` has a typo (`lg:padding-8` is not a Tailwind utility — should be `lg:p-8`); this silently breaks large-viewport padding and collapses rhythm at 1440px.

### 3. Brand Coherence (calm / academic, dark-only) — 9 / 10

The palette is disciplined: zinc surface stack, emerald for the primary CTA and recurrence chip, amber for the "today/soon" temporal indicator. The glass-panel shell with hairline borders, minimal shadows, and Geist typography reads unmistakably as StudyHall's "Deep Zinc Academic" aesthetic. The end-of-list asterisk ornament adds a quiet academic flourish without being precious. The skeleton shimmer and stagger-in animations are calm (no bounce).

What would make it a 10: The body element uses `overflow: hidden` globally, which prevents the page from ever scrolling outside the rigid shell — acceptable for the fixed-frame paradigm, but means a very long agenda (15+ sessions) silently clips. Confirming the inner scroll container (`flex-1 overflow-y-auto`) is the intended single scroll axis would solidify the pattern.

### 4. Edge-Case Handling — 8 / 10

**Present and correct:**
- Loading: shimmer skeleton with two date groups and three skeleton rows.
- Empty: icon, heading "No sessions scheduled yet", descriptive subtext, organizer-only CTA.
- Data loaded: date-grouped agenda with stagger animation.
- Form error: `#form-error` inline banner ("End time must be after start time"), `aria-live="assertive"` announcer.
- Delete confirm: `window.confirm()` dialog with non-reversible warning.
- Submitting: spinner replaces button label, `aria-busy` implied via disabled state, `aria-live` announces "Saving…"/"Saved."

**Gap — Session detail not-found state (brief §3):** The detail panel shows a hard-coded session for "CS492 Architecture Review" but contains no not-found / soft-deleted branch. Brief §3 explicitly requires "Session detail — not-found (soft-deleted/unknown → calm 'Session not found')". The panel has no state variation for this case. This is a mandatory state per the brief.

**Minor gap — Error on save failure (brief §3):** The `submitForm` function only simulates success after the spinner. There is no server-error branch (API 500 / network fail) that puts the modal back into an error state with an inline message. Brief §3 requires "Authoring modal — error (calm inline: invalid range, save failed)" — "save failed" is unrepresented.

### 5. Accessibility (WCAG-AA, dark, focus rings, dialog a11y) — 8 / 10

**Correct:**
- `role="dialog" aria-modal="true" aria-labelledby="modal-title"` — proper dialog semantics.
- `aria-live="assertive"` announcer (`#modal-announcer`) for save / error states.
- `glow-focus` class delivers `0 0 0 2px rgba(16,185,129,0.4)` on `:focus-visible` — matches DESIGN-SYSTEM §5 `--glow-focus` token exactly.
- Session cards are `tabindex="0"` with `keydown` handlers for Enter/Space — correct interactive list pattern.
- `aria-label` on icon-only buttons (Close, Edit, Delete).
- `[color-scheme:dark]` on date/time inputs — prevents white-flash from native chrome.

**Concerns:**

A. **No focus trap in the modal.** `openModal()` focuses `#f-title` after 300ms but there is no `focustrap` loop — Tab can escape the modal into the background agenda. Brief §6 and DESIGN-SYSTEM §8 Modal primitive both require a focus trap. This is an AA failure for keyboard users (WCAG 2.1 §2.1.2 No Keyboard Trap, and the escape direction: focus must be contained *within* the dialog while open).

B. **Danger text contrast on tinted background.** The inline error banner uses `text-danger` (`--danger: #ef4444`) on a `bg-danger/10` background tint. DESIGN-SYSTEM §1 documents that `#ef4444` computes 3.93:1 on a danger/10 tint — an AA fail — and prescribes `--danger-text` (`#f87171`) instead. The banner correctly uses `text-danger-text` (`f87171`) in the `p` element, but the icon (`ph-warning-circle`) on the same banner div is given `text-danger` directly (line 595 `class="ph-fill ph-warning-circle text-lg shrink-0 mt-0.5"`). The icon inherits the parent div's `text-danger` rather than `text-danger-text`. Per the design system, this is a token misuse, though the contrast impact for a decorative icon is minimal.

C. **Detail panel missing `role` or `aria-label`.** The `<aside id="detail-panel">` is an inline panel that visually behaves as a secondary region but carries no `aria-label` or `aria-labelledby`. Screen-reader users will encounter an unlabelled aside landmark.

D. **`window.confirm()` for delete.** Native browser confirm dialogs have known screen-reader inconsistencies across browsers and cannot be styled to match the dark theme. Brief §9 / DESIGN-SYSTEM §8 Modal calls for a proper confirmations modal with `role="dialog"`.

### 6. Responsive (in-viewport at 1024/1280/1440; panel collapse <1024) — 7 / 10

**Correct:**
- The server rail is `hidden md:flex` (disappears <768px).
- The channel sidebar is `hidden lg:flex` (collapses <1024px), matching the brief's §5 "panel collapses per the shipped `/servers/:id` responsive behavior."
- The detail panel is `hidden sm:flex` (hidden <640px).
- The modal is full-screen on mobile (`w-full h-full sm:h-auto sm:max-w-lg sm:rounded-xl`).

**Concerns:**

A. **`lg:padding-8` typo (noted in Spacing Rhythm):** Tailwind has no `padding-8` utility — the correct class is `lg:p-8`. At 1440px, the agenda container will silently fall back to the md:p-6 padding, causing the content column to be slightly narrower than specified.

B. **Detail panel `w-0 / margin-left:0 / border-left-width:0`** on the `.closed` state is an unconventional collapse technique that may cause a brief reflow jank on older rendering engines, though it is functional.

C. **At exactly 1024px**, the channel sidebar becomes visible at `lg:flex` but the detail panel (`hidden sm:flex`) is also enabled. With both open simultaneously, the available main content width is `100vw - 72px - 240px - 360px = 352px` at 1024px viewport — extremely tight. This is below the comfortable minimum for the agenda cards to display full session titles without truncation. The brief §5 says "in-viewport at 1024"; the combination is technically in-viewport but the main pane is uncomfortably narrow.

---

## Brief Compliance Checklist

### §3 States — present?

| State | Present | Notes |
|---|---|---|
| Calendar — loaded | Yes | Three date groups with session cards |
| Calendar — empty | Yes | "No sessions scheduled yet" + organizer CTA |
| Calendar — loading | Yes | Shimmer skeleton |
| Authoring modal — create | Yes | `openModal('create')` empty form |
| Authoring modal — edit | Yes | `openModal('edit')` prefilled branch (title text swap confirmed) |
| Authoring modal — submitting | Yes | Spinner state on save button |
| Authoring modal — error (invalid range) | Yes | Inline banner + aria-live |
| Authoring modal — error (save failed) | **MISSING** | No server-error branch; only success path simulated |
| Session detail — organizer | Yes | Footer with Edit/Delete buttons |
| Session detail — member | Yes | `.member-view` class hides `.organizer-only` footer |
| Session detail — not-found | **MISSING** | No not-found / soft-deleted variant in the detail panel |

### Agenda vs. month-grid (brief §10 non-goal check)

The view is a date-grouped vertical list ("Today / Tomorrow / Thursday"), not a month grid. No calendar grid cells, no day/week/month tabs, no date-picker chrome. Fully compliant with the "no month-grid" non-goal. Verdict: **PASS**.

### Recurrence display clarity

Weekly sessions show a "Weekly" chip (`ph-arrows-clockwise` + "Weekly" label, `text-accent-emerald`) inline in the card row and as a tag in the detail panel. The "Study Group: Pointers" on Tomorrow has no Weekly chip — correctly a one-off. The modal offers "Does not repeat" and "Weekly" with an optional "Repeat Until" date that appears conditionally. No RRULE language, no per-occurrence overrides, no iCal terms. Verdict: **PASS**.

### §10 Non-goals — any forbidden affordances present?

| Non-goal | Present in mockup? |
|---|---|
| Reminders / notifications | No |
| RSVP / attendance | No |
| Timezone picker | No — times displayed as-is |
| Calendar export / ICS | No |
| Drag-to-reschedule | No |
| Month-grid calendar widget | No |
| Custom recurrence beyond None/Weekly | No (only 2 options in select) |
| Mobile-specific design | No (brief: desktop-first, collapse only) |

All §10 non-goals respected. Verdict: **PASS**.

### Organizer-gating visibility

`.organizer-only { display: none !important; }` applied under `.member-view` parent. Affected elements: "New session" CTA in header, "Schedule first session" in empty state, row-level Edit and Delete buttons, detail panel footer. Dev-toggle demonstrates the member path. Gating is visually complete and enforceable. Verdict: **PASS**.

### Token discipline — invented hex outside DESIGN-SYSTEM.md?

Audit of all custom properties and hardcoded color values in the `<style>` block:

| Value used | Token source | Status |
|---|---|---|
| `#0a0a0b` | DESIGN-SYSTEM §1 `--surface-950` | PASS |
| `#121214` | DESIGN-SYSTEM §1 `--surface-900` | PASS |
| `#1c1c1f` | DESIGN-SYSTEM §1 `--surface-800` | PASS |
| `#27272a` | DESIGN-SYSTEM §1 `--surface-700` | PASS |
| `#3f3f46` | DESIGN-SYSTEM §1 `--surface-600` | PASS |
| `#52525b` | DESIGN-SYSTEM §1 `--surface-500` | PASS |
| `rgba(255,255,255,0.06)` | DESIGN-SYSTEM §1 `--border-hairline` | PASS |
| `rgba(255,255,255,0.10)` | DESIGN-SYSTEM §1 `--border-hover` | PASS |
| `rgba(255,255,255,0.92)` | DESIGN-SYSTEM §1 `--text-primary` | PASS |
| `rgba(255,255,255,0.60)` | DESIGN-SYSTEM §1 `--text-secondary` | PASS |
| `rgba(255,255,255,0.40)` | DESIGN-SYSTEM §1 `--text-muted` | PASS |
| `#10b981` | DESIGN-SYSTEM §1 `--accent-emerald` | PASS |
| `#f59e0b` | DESIGN-SYSTEM §1 `--accent-amber` | PASS |
| `#ef4444` | DESIGN-SYSTEM §1 `--danger` | PASS |
| `#f87171` | DESIGN-SYSTEM §1 `--danger-text` | PASS |
| `rgba(0,0,0,0.4)` (shadow-sm) | DESIGN-SYSTEM §5 shadow-sm formula | PASS |
| `rgba(0,0,0,0.5)` (shadow-pop) | DESIGN-SYSTEM §5 shadow-pop formula | PASS |
| `rgba(255,255,255,0.06)` (shadow-liquid) | DESIGN-SYSTEM §5 inset highlight | PASS |
| `rgba(16,185,129,0.4)` (glow-focus) | DESIGN-SYSTEM §5 `--glow-focus` | PASS |
| `rgba(239,68,68,0.4)` (glow-danger) | DESIGN-SYSTEM §5 `--glow-danger` | PASS |
| `rgba(0,0,0,0.6)` (modal scrim) | DESIGN-SYSTEM §8 Modal scrim spec | PASS |
| `rgba(245,158,11,0.4)` (amber glow on indicator bar) | **NOT in DESIGN-SYSTEM** | **FAIL** |

One invented value: the amber left-edge indicator bar on the "soon" session card uses `shadow-[0_0_8px_rgba(245,158,11,0.4)]`. This amber glow shadow is not a documented token in DESIGN-SYSTEM.md §5. The design system lists `--glow-focus` (emerald), `--glow-danger` (red), and `--glow-subtle` (white). There is no `--glow-amber` or equivalent. This is a token discipline violation (brief §9 "no invented hex").

---

## Enumerated Concerns

1. **[MUST FIX] Session detail — not-found state absent (brief §3, §9 checkbox 4).** The detail panel has no conditional branch for a soft-deleted or unknown session ID. Required: a calm "Session not found" message in the panel body when the session cannot be resolved.

2. **[MUST FIX] Authoring modal — save-failed error state absent (brief §3).** The submit path only simulates success. Required: a server-error branch that keeps the modal open and shows an inline "Failed to save — please try again" error (using the same `#form-error` pattern with `aria-live`).

3. **[MUST FIX] No focus trap in the authoring modal (brief §6, DESIGN-SYSTEM §8 Modal, WCAG 2.1 §2.1.2).** `openModal()` focuses the first field but Tab can escape to the background DOM. A focus-trap loop (intercept Tab/Shift-Tab, cycle through focusable children of `#authoring-modal`) is required. The brief explicitly cross-references the shipped assignment-form dialog pattern which includes a trap.

4. **[MUST FIX] `window.confirm()` for delete (brief §9 "Delete uses destructive treatment with a confirm", DESIGN-SYSTEM §8 Modal).** Native confirm dialog is unstyled, inaccessible across some AT/browser combinations, and breaks the dark theme. Replace with a small inline confirmation modal using `role="dialog"` and the design system's destructive button treatment.

5. **[SHOULD FIX] Invented amber glow token (brief §9 "Tokens are DESIGN-SYSTEM only", DESIGN-SYSTEM §5).** `shadow-[0_0_8px_rgba(245,158,11,0.4)]` on the indicator bar is not a documented token. Either add `--glow-amber` to DESIGN-SYSTEM.md or replace with `--glow-subtle` / a plain amber background without glow.

6. **[SHOULD FIX] `lg:padding-8` Tailwind typo (brief §9, §5 responsive contract).** Silently breaks agenda padding at 1440px. Correct to `lg:p-8`.

7. **[SHOULD FIX] Detail panel unlabelled aside landmark (WCAG 2.4.1 Bypass Blocks / landmark regions).** Add `aria-label="Session details"` to `<aside id="detail-panel">`.

8. **[SHOULD FIX] `--danger` icon on `danger/10` tint in error banner (DESIGN-SYSTEM §1 `--danger-text` note).** The warning icon in `#form-error` uses `text-danger` (`#ef4444`, 3.93:1 on tint — AA fail). Change to `text-danger-text` (`#f87171`, 6.30:1) to match the design system prescription.

9. **[NICE TO HAVE] Future date group header color distinction.** "Tomorrow" and "Thursday" headers use the same `text-text-primary` color as session titles. Lowering to `text-text-secondary` or `text-text-muted` would sharpen the two-level agenda hierarchy without adding new tokens.

10. **[NICE TO HAVE] 1024px viewport combined-pane width.** At exactly 1024px, having the channel sidebar (240px), main pane, and detail panel (360px) simultaneously open leaves ~352px for the agenda — tight for card titles. Consider increasing the panel collapse breakpoint to `xl:flex` for the detail panel or capping the panel width at `w-[320px]` on `lg`.

---

## Score Summary

| Dimension | Score |
|---|---|
| Visual Hierarchy | 8 / 10 |
| Spacing Rhythm | 7 / 10 |
| Brand Coherence (calm/academic, dark-only) | 9 / 10 |
| Edge-Case Handling | 8 / 10 |
| Accessibility (WCAG-AA, focus rings, dialog a11y) | 8 / 10 |
| Responsive (1024/1280/1440; <1024 collapse) | 7 / 10 |
| **Composite** | **47 / 60** |

---

## Verdict

**REVISE**

Four must-fix items block approval: the missing not-found detail state (brief §3 mandatory state), the missing save-failed error branch (brief §3), the absent modal focus trap (WCAG AA / brief §6), and the use of `window.confirm()` for destructive delete instead of the required `role="dialog"` confirmation (DESIGN-SYSTEM §8). The design language, token discipline (one amber glow exception aside), agenda paradigm, and organizer-gating are all solid — the surface warrants a targeted revision pass, not a rework.
