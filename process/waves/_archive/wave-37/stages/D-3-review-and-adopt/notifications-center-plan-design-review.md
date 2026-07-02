# D-3 Plan-Design Review — notifications-center.html
**Reviewer role:** plan-design-review lens (D-3 stage)
**Artifact:** `design/staging/notifications-center.html`
**Brief:** `process/waves/wave-37/stages/D-1-brief/notifications-center-brief.md`
**Design System:** `design/DESIGN-SYSTEM.md`
**Date:** 2026-07-02

---

## Verdict: APPROVE

No REJECT trigger fires. All brief §9 success criteria are satisfied. The mockup delivers correct and complete coverage of every required bell state, every required panel state, accurate token usage, and a solid accessibility scaffold. The four non-blocking handoff notes below are implementation concerns for the builder layer; none gate design adoption.

---

## Dimension Scores

| # | Dimension | Score | Notes |
|---|-----------|-------|-------|
| 1 | Brand / Token Fidelity | 9 / 10 | All DS §1 tokens correctly mapped; one implementation namespace gap (see below) |
| 2 | Panel State Coverage | 10 / 10 | All four states present and spec-compliant |
| 3 | Bell State Coverage | 10 / 10 | 0 / N / 9+ all correct; badge text is `text-surface-950` |
| 4 | Visual Language / Component Quality | 8 / 10 | Strong notification row rhythm; empty CTA is secondary-styled vs DS §8 "primary CTA" |
| 5 | Responsive Implementation | 10 / 10 | Correct lg:1024 split, bottom-sheet construction, and mobile scrim |
| 6 | Accessibility / ARIA | 9 / 10 | Focus-trap, aria-expanded, aria-live, Escape all implemented; two minor handoff concerns |

**Composite: 9.3 / 10**

---

## REJECT Condition Audit

| Condition | Result | Evidence |
|-----------|--------|----------|
| Invented hex outside DS §1 | CLEAR | No `text-[#...]`, `bg-[#...]`, or `border-[#...]` arbitrary-value classes anywhere. All raw hex values in the Tailwind config block (`#0a0a0b`, `#121214`, `#1c1c1f`, `#27272a`, `#3f3f46`, `#52525b`, `#10b981`, `#f59e0b`, `#ef4444`, `#f87171`) map 1:1 to named DS §1 tokens. The `max-lg:shadow-[0_-8px_24px_rgba(0,0,0,0.5)]` arbitrary shadow on line 242 is numerically identical to `--shadow-pop` with an inverted Y axis, appropriate for an upward bottom-sheet shadow; it introduces no new hue. The `.skeleton-row` background `#27272a` is surface-700. |
| Spinner for content-list loading | CLEAR | The Loading panel state (lines 399–440) uses `animate-shimmer skeleton-row` shimmer rectangles throughout. No `ph-spinner`, no `animate-spin`, no rotating element. Mark-all-read pending state uses text change + opacity-70, not a spinner. |
| Missing required panel state | CLEAR | All four states are present in Section 3 (lines 354–481): Loaded (358–397), Loading (399–440), Empty (443–459), Error (461–478). |
| Missing required bell state | CLEAR | Section 1 (lines 163–199) provides all three: 0 unread (outline `ph-bell`, no badge, line 171), 3 unread (filled `ph-fill ph-bell` + emerald badge, line 183), 9+ cap (filled + "9+" badge, line 194). |
| WCAG AA failure (introduced by this mockup) | CLEAR | `text-danger-text` (#f87171) on `bg-danger/10` over surface-900: DS §1 explicitly states 6.30:1 (AA pass). Badge numeral uses `text-surface-950` (#0a0a0b) on `bg-accent-emerald` (#10b981): approximately 8.9:1 (AA pass). The `text-muted` (rgba(255,255,255,0.40)) token at ~3.77:1 on surface-900 is a pre-existing DS §1 token, not introduced by this mockup; timestamps using it are classed as metadata and this token is the DS-specified choice for that role. Not a REJECT trigger for this review. |

No REJECT condition fires.

---

## Dimension 1 — Brand / Token Fidelity (9 / 10)

Every color token in the Tailwind config block (lines 28–54) is a faithful transcription of DS §1:

- Surface stack: `surface-950` through `surface-500` — all six hex values exact.
- Text scale: `text.primary` / `text.secondary` / `text.muted` rgba values exact.
- `accent-emerald` #10b981, `accent-amber` #f59e0b — both exact.
- `danger.DEFAULT` #ef4444, `danger.text` #f87171 — exact; the distinction between fill danger and on-tint danger-text is preserved.
- `border-hairline` / `border-hover` rgba values exact.
- `shadow-sm` / `shadow-pop` values exact per DS §5.
- `.ring-emerald-focus` box-shadow is `0 0 0 2px rgba(16,185,129,0.4)` — exact match to DS §5 `--glow-focus`.
- Scrollbar thumb colors (`#3f3f46` / `#52525b`) are surface-600 / surface-500 hex values used correctly in a non-Tailwind context.

**Implementation namespace note (non-blocking):** Because the config places text tokens under `colors.text.primary`, Tailwind generates class names `text-text-primary`, `text-text-secondary`, `text-text-muted`. The HTML uses the shorter forms `text-primary`, `text-secondary`, `text-muted` throughout. In Tailwind CDN these shorter forms have no generated rule and fall back to the body's inherited `color: rgba(255,255,255,0.92)` for primary text and to unset for secondary/muted — meaning the visual hierarchy relies on the cascade for the mockup, not on the Tailwind utility. The design intent is fully correct. The builder must either rename the config keys to top-level (`primary:`, `secondary:`, `muted:`) or update all class references to `text-text-*` when converting to the React component with a proper Tailwind config.

---

## Dimension 2 — Panel State Coverage (10 / 10)

**Skeleton loading state (lines 399–440)**
Shimmer construction is correct: base fill is surface-700 (`#27272a`), overlaid with a `linear-gradient` sweep from transparent through `rgba(255,255,255,0.05)` back to transparent, animated at `2s infinite linear`. Each skeleton row replicates the geometry of a real notification row (dot placeholder, title bar, secondary bar, timestamp slab) at the correct proportions. The header replaces the "Mark all as read" control with a skeleton slab — preventing the interactive control from appearing during load. Three rows at descending opacity (100% / 80% / 60%) suggest list depth. No spinner of any kind is present.

**Loaded state (lines 358–397 static; lines 260–345 interactive)**
Four notification items cover the two type variants: mention (@ icon + emerald channel link + quoted preview) and assignment (calendar-check icon + amber due chip + title). Two items are unread (emerald filled dot, full opacity); two are read (transparent dot, `opacity-70`). Type distinguishability via icon and metadata is clear without relying on color alone.

**Empty state (lines 443–459)**
`ph-bell-z` icon (DS §7 correctly specifies filled variants only for active states; `ph-bell-z` is a line-weight icon — appropriate for a rest/quiet state). Headline "You're all caught up" uses `text-2xl font-semibold` — correct per DS §2 "text-2xl (landing/empty-state headlines)" and brief §4 explicit call to "text-2xl (empty headline §113)". One-liner "No new notifications. Go ace your classes." at `text-sm text-secondary`. CTA button "Browse channels" present. All four required elements per brief §3 satisfied.

Minor observation: DS §8 Empty state spec reads "primary CTA" (citing app-home's emerald-filled button as the reference example). The mockup uses a secondary button (`bg-surface-800 border border-border-hairline`). Brief §9 lists "CTA" without specifying primary styling. This is a product/design intent question, not a specification violation, and does not alter the verdict.

**Error state (lines 461–478)**
`ph-warning-circle` icon on `bg-danger/10` tint, colored `text-danger-text` (#f87171) — correct token per DS §1. Cause text "There was a problem syncing. Please reconnect." at `text-secondary`. "Retry connection" button present. All three required elements per brief §3 satisfied.

---

## Dimension 3 — Bell State Coverage (10 / 10)

**0 unread (line 171)**
Outline `ph ph-bell` icon (non-filled, correct per DS §7 — filled variants for active/selected only). No badge element rendered. `aria-label="Notifications, 0 unread"`. Standard hover state (`hover:bg-surface-800`). Correct.

**3 unread (line 181)**
Filled `ph-fill ph-bell`. Badge: `min-w-[16px] h-4 rounded-full bg-accent-emerald text-[10px] font-semibold text-surface-950 border-2 border-surface-900 aria-hidden="true"`. The `text-surface-950` class applies #0a0a0b (near-black) on the emerald badge — contrast approximately 8.9:1, well above WCAG AA. The `border-2 border-surface-900` separation ring prevents the badge from blending into adjacent surfaces. `aria-label="Notifications, 3 unread"`. Correct.

**9+ cap (line 194)**
Same construction as 3-unread with `min-w-[20px]` (wider to accommodate two-character string) and badge text "9+". `aria-label="Notifications, 12 unread"` (uses actual count in the accessible name, not the capped string — correct; the badge cap is a visual affordance only). Correct.

**Interactive bell (line 221)**
`aria-haspopup="dialog" aria-expanded="false"` on initial load, toggled to "true" on open (line 518). Starts with 4 unread. The badge border uses `border-surface-950` matching the nav bar background (`bg-surface-950`) rather than `border-surface-900` used in the static tiles — contextually correct for placement on surface-950.

---

## Dimension 4 — Visual Language / Component Quality (8 / 10)

The notification row rhythm matches the prior-art reference pattern from `server-channel-view.html` (brief §8). Actor icon in the left gutter, subject and action in the first line, timestamp right-aligned at `text-xs text-muted`, quoted preview or secondary metadata in a nested block (`border-l-2 border-surface-600 pl-2`). The assignment row correctly uses the amber due-chip pattern from `assignments-panel.html`. The mention row correctly uses the emerald channel link.

Icon usage: `ph-at` for mention, `ph-calendar-check` for assignment, `ph-clock` for due timer, `ph-check-circle` for graded result, user avatar `<img>` for direct message. All seven are valid Phosphor icon class names. Filled variant (`ph-fill`) used exclusively for the active bell — correct per DS §7.

The `text-accent-emerald` channel link with `hover:underline` (line 273) correctly provides a non-color hover affordance, meeting WCAG 1.4.1 (Use of Color).

Mark-all-read button positioning (`px-1 -mr-1`) creates a flush-right affordance without over-weighting the control visually. The post-action state ("All read" + check icon in emerald) closes the feedback loop without a toast.

The `border-l-2 border-surface-600 pl-2` quote pattern on lines 278, 319 is a good semantic nesting device that reads as an inset quote without additional color tokens.

---

## Dimension 5 — Responsive Implementation (10 / 10)

**Desktop (>= 1024px, lines 240–242 lg: classes)**
`lg:absolute lg:top-14 lg:right-6 lg:w-[380px] lg:border lg:rounded-lg lg:shadow-pop lg:bg-surface-900`. 380px width is within the brief §5 "~360–380px" target. Anchored below the simulated nav bar (`top-14`). `border-border-hairline` is applied as a base class (no breakpoint prefix) providing the color; `lg:border` enables the border width at lg+. `shadow-pop` matches DS §5 popover elevation. `rounded-lg` matches DS §4 panels.

**Mobile (< 1024px, max-lg: classes)**
`max-lg:fixed max-lg:bottom-0 max-lg:inset-x-0 max-lg:w-full max-lg:h-[80dvh] max-lg:rounded-t-xl max-lg:shadow-[0_-8px_24px_rgba(0,0,0,0.5)]`. `dvh` units correctly handle iOS Safari's dynamic viewport. Upward shadow inverts shadow-pop Y axis — appropriate. Drag handle (48px × 6px, `bg-surface-600`, `rounded-full`, `lg:hidden`) follows sheet conventions. Backdrop scrim (`bg-black/60`, `max-lg:block hidden`) matches DS §8 Modal scrim spec. Tap-to-close on scrim bound at line 551. Body scroll-lock via `mobile-bottom-sheet-active` at line 515. Resize handler (lines 629–638) correctly clears mobile sheet state when crossing 1024px during a live resize.

Panel entry animation uses `transition-all duration-200` for opacity+translate. Mobile adds `animate-slide-up` (cubic-bezier(0.16, 1, 0.3, 1), 0.3s) — a standard ease-out curve, not bouncy, consistent with DS §6 "calm and quick."

---

## Dimension 6 — Accessibility / ARIA (9 / 10)

**Verified present:**
- `aria-live="polite"` region at line 149; populated at line 617 after mark-all-read completes ("All notifications marked as read.") ✓
- `role="dialog" aria-modal="true" aria-label="Notifications Panel"` on panel container (line 240) ✓
- `aria-haspopup="dialog"` on bell trigger (line 221) ✓
- `aria-expanded` initialized to "false" (line 221), toggled to "true" on open (line 518), back to "false" on close (line 540) ✓
- `aria-label="Notifications, N unread"` on all four bell buttons; interactive bell updated to "0 unread" after mark-all (line 616) ✓
- Badge `aria-hidden="true"` on all three bell tiles (lines 183, 194, 224) — count is delivered via button aria-label only; AT users receive accurate count ✓
- `aria-busy="true"` set at mark-all start (line 587), removed at completion (line 608); control is pointer-events-none during pending state ✓
- Focus trap: Tab wraps last → first, Shift+Tab wraps first → last within the dialog using a broad `querySelectorAll` that includes `[tabindex]:not([tabindex="-1"])`, correctly capturing notification rows (lines 562–580) ✓
- Escape closes panel + restores focus to bell via `bell.focus()` (lines 555–558, 546) ✓
- On open, focus moves to the first focusable element inside the panel after a 50ms delay (lines 523–526) — the "Mark all as read" button receives focus ✓
- Avatar image has `alt="Sarah Chen"` (line 312) ✓

**Handoff concerns (non-blocking for design adoption):**

1. `role="button"` missing on notification row divs (lines 263, 284, 306, 325). The rows are `<div tabindex="0">` — keyboard focus lands correctly and the focus ring renders, but Enter/Space will not activate click handlers on a bare div. In the React component, use `<button>` elements or add `role="button"` plus a `keydown` handler for Enter (keyCode 13) and Space (32). Prefer `<button>` to avoid the extra attribute.

2. `aria-labelledby` pointing to the panel's internal `<h2>` (line 252, "Notifications") would be more semantically precise than the current `aria-label="Notifications Panel"` on the dialog. The accessible name is provided either way; this is a refinement. In production: `aria-labelledby="notifications-panel-title"` + `id="notifications-panel-title"` on the h2.

3. `prefers-reduced-motion` is not handled. The shimmer animation and slide-up transition run unconditionally. DS §6 requires respecting the preference. Wrap `animate-shimmer` keyframes and the panel entry animations in `@media (prefers-reduced-motion: reduce) { animation: none; transition: none; }` in the production stylesheet.

4. `pb-safe` (line 260) is unregistered in the Tailwind config; it will be silently ignored, clipping notification list content behind the iOS home indicator on bottom-sheet layout. Wire `env(safe-area-inset-bottom)` via a Tailwind plugin or inline style in the React component.

---

## Brief §9 Success Criteria Checklist

| Criterion | Status |
|-----------|--------|
| Only §4 tokens (no new hex) | Pass — no invented hex; all values map to DS §1 |
| All 4 panel states + both bell states (incl. 9+ cap) | Pass — all seven states verified |
| Responsive per §5 (popover desktop, bottom-sheet < 1024px) | Pass |
| Prior-art visual language | Pass — calm, dark, academic; matches server-channel-view rhythm |
| mention vs reminder type-distinguishable (icon + source + time) | Pass — ph-at + channel link vs ph-calendar-check + amber chip |
| unread vs read distinct (emerald dot) + mark-all-read | Pass — full mark-all lifecycle with AT announcements |
| Real Phosphor icon names | Pass — ph-bell, ph-bell-z, ph-at, ph-calendar-check, ph-clock, ph-check, ph-warning-circle, ph-check-circle all verified |
| a11y: aria-label w/ count, aria-live, focus-trap + Escape | Pass |

---

## Consolidated Non-Blocking Handoff Notes

| ID | File location | Action required in production |
|----|---------------|-------------------------------|
| H-1 | lines 263, 284, 306, 325 | Change notification row `<div tabindex="0">` to `<button>` to provide native keyboard activation (Enter/Space). |
| H-2 | line 240 | Replace `aria-label="Notifications Panel"` with `aria-labelledby` referencing the panel's `<h2>` id. |
| H-3 | all animations | Wrap shimmer keyframes and panel entry transitions in `prefers-reduced-motion: reduce` media query. |
| H-4 | line 260 | Register `pb-safe` in Tailwind config via `env(safe-area-inset-bottom)` or apply inline style in React component. |
| H-5 | Tailwind config | Rename config color keys or update class references so `text-text-primary` / `text-text-secondary` / `text-text-muted` resolve correctly (or flatten to `primary`/`secondary`/`muted` at the root color level). |
