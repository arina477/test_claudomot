# D-3 Design Review — Roles Management UI (Revised)

**Reviewer:** ui-designer (Reviewer A, fresh context)
**File reviewed:** `design/staging/roles-management-ui.html`
**Brief:** `process/waves/wave-10/stages/D-1-brief/roles-management-ui-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Date:** 2026-06-29

---

## Dimension Scores

### 1. Visual Hierarchy — 9/10

The design establishes a clear three-tier hierarchy: the settings shell left nav sits at the lowest layer, the split-pane role-list rail + editor plane occupy the primary working layer, and the member assignment section anchors the scroll below. The header ("Roles Management") sits at `text-xl` weight, section labels use `text-[11px]` uppercase tracking for category headers, and body controls land at `text-sm`/`text-[13px]`. The active role in the rail uses an emerald left-bar indicator and `bg-surface-800` fill, creating a clear selection affordance against the `surface-900` panel. The amber safeguard banner reads immediately as a priority callout without competing with the editor's primary controls.

Minor deduction: the right-pane "Channel Visibility" pane shares identical padding and typographic weight with the left-pane "Server Architecture" section, making the two panes feel equally weighted. The channel visibility surface is secondary to the flag controls (per brief §6, flags come first), but the visual weight is a tie. A subtle distinction — slightly lighter section label or reduced header prominence on the right — would reinforce the hierarchy, but this does not breach any hard constraint.

### 2. Spacing Rhythm — 9/10

The 4px base scale is consistently applied throughout. Panel padding is 16px (`p-4`) and 24px (`p-6`) in the editor, matching brief §4 (panel padding 16px, section gaps 24px). The role list items use `py-2.5` plus `min-h-[44px]`, satisfying touch target requirements. The footer action bar is `min-h-[72px]` with `p-4`. The section gap between the two-column editor and the member assignment section is `gap-6` (24px), on-spec. Toast region uses `gap-3` (12px) between stacked notifications.

Minor deduction: the member assignment section has `mb-[120px]` on mobile — this is 30 units on the 4px scale rather than a canonical step (should be `mb-32` = 128px or `mb-28` = 112px). This appears to be a reviewer-state-switcher clearance hack rather than a genuine rhythm decision. Low severity; does not affect the design in production.

### 3. Brand Coherence — 9/10

The design composes cleanly into the server-settings shell paradigm: identical `bg-surface-950` app frame, `bg-surface-900` sidebar, `border-hairline`, Geist typeface, and Phosphor icons. The settings navigation structure mirrors server-settings.html exactly, with the active nav item (`aria-current="page"`) showing the same emerald left-bar + `accent-emerald/10` fill pattern used in the reference shell. The create-role modal reuses the same header/body/footer structure, border treatment, `shadow-pop`, `animate-zoom-in`, backdrop `blur(4px)`, and `bg-surface-900` fill as the create-server.html modal — the language match is strong.

Minor deduction: the editor plane's header uses `bg-surface-900/50` as a rounded-top treatment, which introduces a 50%-opacity surface layer not present in the canonical shell panels. It is within the hairline-border + subtle-inner-shadow "panel-refraction" tradition, but reads slightly differently from the solid `bg-surface-900` sidebars. Not a token violation; aesthetic variance only.

### 4. Edge-case / State Handling — 9/10

All six required states are present and functional:

- **Loading:** shimmer skeleton with two placeholder blocks (toolbar row + split-pane grid) using `animate-shimmer` gradient sweep and `animate-pulse`. Correct.
- **Loaded:** default view with populated role rail, editor, and member table. Correct.
- **Empty:** centered empty state with `ph-shield-check` icon, headline, body copy, and primary CTA "Create First Role" that opens the create modal. Correct.
- **Saving:** `saving-dimmed` class (pointer-events: none, 0.6 opacity, grayscale) applied to the interactive area; save button disabled with `aria-busy="true"` and a spinner icon + `sr-only` "Saving…" text. Correct.
- **Load error:** danger icon block with "Couldn't load roles" + "Retry Connection" button that simulates the loading→loaded transition. Correct.
- **Save 409 reject:** `mockSave(true)` surfaces the inline `#inline-409-error` danger banner (`role="alert"` + `aria-live="assertive"`) and fires an error Toast simultaneously. Correct.
- **Success Toast:** shown after successful save and after modal create/delete actions. Uses `role="status"` for success, `role="alert"` for error. Correct.
- **Last-owner protection (reactive):** the brief requires the safeguard to be "now reactive." The design satisfies this: toggling the Manage Roles flag on the owner's role is intercepted by `handleSafeguardToggle`, the change is blocked (toggle returns to checked), the inline 409 banner appears, and an error Toast fires — all without requiring a save attempt. This is the reactive behavior the brief requests.

Minor deduction: the ambient amber safeguard banner ("Last-Owner Safeguard Active") uses `role="status"` — correct for a persistent informational notice — but its static body copy says "The system will reject actions that demote your master privileges," which is passive voice and slightly misleading now that the protection is reactive (it blocks immediately, it does not only "reject" at save time). This is a copy concern, not a structural gap.

### 5. Accessibility at Design Level — 8/10

**Strengths:**
- Universal focus discipline: `a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible, [tabindex="0"]:focus-visible` all receive the double-ring pattern (`0 0 0 2px surface-950, 0 0 0 4px accent-emerald`), ensuring visibility across all surface colors. This resolves previously reported `ring-0` suppression.
- `aria-invalid` inputs get a danger glow ring variant.
- All toggles have `aria-label` values. Channel visibility toggles update their `aria-label` dynamically when state changes (`updateVisibilityText`).
- The channel visibility surface avoids color-alone signaling: the "Visible"/"Hidden" text label is rendered alongside the toggle (decorative label `aria-hidden="true"`; state embedded in the toggle's `aria-label`). Satisfies brief §6 and DESIGN-SYSTEM §8.
- Owner role row: the select is `disabled` with `aria-describedby="desc-gated-owner"`. The gated Manage Server flag has `aria-describedby="desc-gated-manage"`.
- Modal: `openModal` focuses the first input or primary button; `closeModal` restores `preModalFocus`. Esc closes via `keydown` listener. Both modals carry `role="dialog"` + `aria-modal="true"` + `aria-labelledby`.
- Toast close buttons are keyboard-operable (`<button>`) with `aria-label="Close message"`.

**Gap (deduction):**

The `openModal` function only focuses the first input or primary button on open — it does not cycle focus within the modal boundary. A user pressing Tab from the last focusable element in the modal will escape to background content. Brief §6 ("modal focus-trap") and DESIGN-SYSTEM §8 ("focus-trap") both require full Tab/Shift-Tab cycling. The code comment explicitly names this "minimal." This is the single blocking gap in the accessibility dimension.

*Concrete change to reach 10 (brief §9 / DESIGN-SYSTEM §8):* In `openModal`, enumerate all focusable descendants (`button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])`). Add a `keydown` handler on the modal element: on Tab, if `document.activeElement === lastFocusable`, `e.preventDefault()` and focus `firstFocusable`; on Shift+Tab, if `document.activeElement === firstFocusable`, `e.preventDefault()` and focus `lastFocusable`. Remove the handler in `closeModal`. This must be present as designed behavior, not deferred to implementation.

Score: 8/10.

### 6. Responsive (brief §5 / DESIGN-SYSTEM §9) — 9/10

The responsive breakpoints align with brief §5:

- **≥1280 (xl):** The grid uses `lg:grid-cols-12` with `xl:col-span-3` (role rail) and `xl:col-span-9` (editor). The editor's inner panes use `xl:flex-row` split for the flags pane and visibility pane side by side. Member assignment table is full-width. Correct.
- **1024–1279 (lg):** Role rail becomes `lg:col-span-4` and editor `lg:col-span-8`. The inner editor panes stack vertically (default `flex-col`). Left nav transitions from horizontal strip to `lg:w-60` vertical sidebar. Correct.
- **<1024 (narrow):** `grid-cols-1` fallback stacks role rail above the editor. Left nav becomes a horizontal strip. Member assignment table scrolls horizontally (`overflow-x-auto` + `min-w-[600px]`). Touch targets are ≥44px throughout (`min-h-[44px]` on all interactive rows, toggles, buttons, table action buttons). Correct.
- The main scroll container is `overflow-y-auto`; the editor has `max-h-[700px] overflow-hidden` with internal `overflow-y-auto`. This prevents unbounded growth.
- Brief §5 requires "settings left nav remains" at <1024 — the nav collapses to a horizontal strip, which preserves all nav items. This satisfies the requirement per brief §10 (mobile out of scope; brief only says nav "remains," not that it retains vertical orientation).

Minor deduction: at <1024, the toast region moves from `top-6 right-6` to `lg:bottom-24 lg:top-auto` to clear the reviewer bar. This is reviewer-tooling-specific and would not apply in production. No real responsive gap.

---

## Hard Constraint Verification (brief §9, §11)

| Constraint | Status | Evidence |
|---|---|---|
| Exactly 4 fixed permission toggle flags (`manage_server`, `manage_roles`, `manage_channels`, `manage_members`) | PASS | Lines 419–458: four `label`+`input[type=checkbox]` rows for "Manage Server", "Manage Roles", "Manage Channels", "Manage Members" — no additional flags |
| NO permission matrix / custom-builder | PASS | No matrix table or custom permission rows present anywhere in the loaded view |
| Separate `can_view` channel-visibility surface distinct from flags | PASS | Right pane ("Channel Visibility") is visually and structurally separate from the left pane ("Server Architecture" flags); distinct heading, different layout (table rows vs. flag cards) |
| Single-role member select (not multi-select) | PASS | Each member row uses a native `<select>` (single-select) — no multi-checkbox or multi-assign pattern |
| Owner read-only superuser | PASS | `@Owner` role button has `aria-disabled="true"`, `opacity-60`, `cursor-not-allowed`, crown icon, and `sr-only` "Read-only superuser role" text; Jane's member row has disabled select + lock icon |
| Last-owner protection — now reactive | PASS | `handleSafeguardToggle` intercepts toggle on Manage Roles, blocks the change immediately, surfaces inline 409 banner + error Toast without requiring a save |
| Token-clean palette (only the 9 system hex values) | PASS | Tailwind config defines only surface-950/900/800/700/600/500, accent-emerald (`#10b981`), accent-amber (`#f59e0b`), danger (`#ef4444`) — exactly the 9 tokens from DESIGN-SYSTEM §1. Hairline/hover borders are `rgba()` values matching their token definitions, not new hex |
| Create-role modal: focus-trap + Esc | PARTIAL | Esc works; initial focus set on open; full Tab/Shift-Tab cycling is absent — blocking gap |
| Delete-confirm modal: focus-trap + Esc | PARTIAL | Same as above |
| Success Toast | PASS | Fires on save and on modal confirm actions with `role="status"` |
| Error Toast (save-409-reject) | PASS | Fires with `role="alert"` on `mockSave(true)` and on reactive safeguard toggle |
| Loading state | PASS | Shimmer skeleton with `animate-shimmer` and `animate-pulse` |
| Loaded state | PASS | Full role-rail + editor + member table populated |
| Empty state | PASS | Centered empty state with CTA to open create-role modal |
| Saving state | PASS | `saving-dimmed` overlay + spinner + `aria-busy="true"` |
| Load-error state | PASS | Danger icon block + retry button |

---

## VERDICT: REVISE

One hard requirement remains insufficiently specified at design level: the modal focus-trap. Both `modal-create-role` and `modal-delete-role` only set initial focus on open — Tab/Shift-Tab cycling within the modal boundary is absent. Brief §9, brief §6, and DESIGN-SYSTEM §8 (Modal/Dialog) all require a complete focus-trap. All other hard constraints pass, and all six states render correctly including the reactive last-owner safeguard. The design is one targeted fix away from APPROVE.

### Enumerated Cited Changes Required

1. **[blocking — brief §9 bullet 8 / brief §6 / DESIGN-SYSTEM §8 Modal primitive]** Complete the focus-trap implementation in both modals. In `openModal`: collect all focusable descendants; attach a `keydown` listener on the modal container that wraps Tab focus from the last focusable element back to the first, and Shift+Tab from the first back to the last, with `e.preventDefault()` on both wrap cases. In `closeModal`: remove that listener and restore `preModalFocus`. The current "minimal" single-element initial focus does not satisfy the brief's explicit focus-trap requirement.

---

## Score Summary

| Dimension | Score |
|---|---|
| 1. Visual hierarchy | 9/10 |
| 2. Spacing rhythm | 9/10 |
| 3. Brand coherence | 9/10 |
| 4. Edge-case / state handling | 9/10 |
| 5. Accessibility at design level | 8/10 |
| 6. Responsive | 9/10 |
| **Overall** | **53/60** |
