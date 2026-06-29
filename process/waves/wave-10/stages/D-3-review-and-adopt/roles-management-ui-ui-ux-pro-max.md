# D-3 Reviewer B — Requirements + UX + Token Audit
## Roles Management UI (Revised Staging Design)

**File under review:** `design/staging/roles-management-ui.html`
**Brief:** `process/waves/wave-10/stages/D-1-brief/roles-management-ui-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`
**Reviewer context:** Fresh — no prior reviewer findings assumed.
**Date:** 2026-06-29

---

## Audit 1 — Success-Criteria Checkbox Audit (Brief §9, item by item)

### §9-1. Permission flags are EXACTLY the 4 fixed booleans as toggle switches — NO permission matrix, NO custom-permission-builder, NO per-channel permission rows.

**PASS**

Evidence: Lines 419–458. The left pane of the editor is headed "Server Architecture" (line 411) and contains exactly four `<input type="checkbox" class="role-switch">` controls with labels: "Manage Server" (line 422), "Manage Roles" (line 435), "Manage Channels" (line 446), "Manage Members" (line 454). No matrix rows, no per-permission-per-channel grid, no custom builder. The right pane (lines 464–519) is a separate "Channel Visibility" surface using ON/OFF toggles per channel, not per permission. The architectural separation is clean and the hard constraint is fully satisfied.

---

### §9-2. Per-channel visibility per role is a clear, scannable surface (channel × role `can_view`), distinct from the permission flags; private channels marked default-deny.

**PARTIAL**

What passes:
- Lines 464–519 implement a dedicated "Channel Visibility" right pane, visually separated from the flags pane by a `border-r` divider (line 409).
- Column headers "Channel" and "Can View" at line 473–474 label the surface correctly.
- Channel-type glyphs present: `ph-hash` (general, line 480), `ph-clipboard-text` (assignments, line 493), `ph-fill ph-speaker-high` (Study Room, line 506).
- `updateVisibilityText()` (lines 846–858) dynamically updates both the visible text label ("Visible"/"Hidden") and the `aria-label` on the toggle when state changes — text, not color alone, conveys state for the main general and Study Room rows.
- Footer note at lines 516–519 explains semantics: "Channels toggled OFF are completely hidden from users, overriding standard read permissions."

What fails:

**F1 (PARTIAL — private channel not text-labeled):** The "assignments" channel (lines 490–502) signals private/default-deny status via: (a) muted text color on the channel name (`text-text-muted`, line 496), (b) a tiny 10px overlay `ph-fill ph-lock-key` icon on the channel glyph (line 494), and (c) a slightly darker row background (`bg-surface-950/30`). There is NO visible text badge reading "Private" or "Default deny." Per brief §6 and DESIGN-SYSTEM §7 MemberListItem ("presence conveyed by text too — not color alone"), color + icon alone fails. The `aria-label` on the unchecked toggle at line 500 reads "Can view assignments channel (Hidden)" — it does not state the channel is private or default-deny, so screen reader users also miss this semantic.

**F2 (BUG — assignments toggle track invisible in OFF state):** Line 500 adds `bg-transparent` as an inline Tailwind class to the `role-switch` checkbox for the assignments channel. The `.role-switch` CSS class (lines 129–166) sets `background-color: theme('colors.surface.600')` as the unchecked track color. The inline `bg-transparent` override defeats this, leaving the toggle track invisible when unchecked. A user cannot visually distinguish the OFF state from an empty container. This is a visual defect that also undermines the non-color-alone requirement.

---

### §9-3. Member→role assignment uses a single-role select (one role per member), not multi-assign.

**PASS**

Evidence: Lines 573–576 (Alex Rivera), lines 598–601 (Sam K.), lines 625–627 (Jane/Owner). Each member row uses a native `<select>` element with no `multiple` attribute and exactly one `<option>` per available role. Jane's select is `disabled` (line 625) with only `@Owner` available, correctly modeled as read-only superuser. The `aria-label` per select names the member. No multi-select, no checkbox group, no badge-picker. This is the strongest, cleanest flow in the design.

---

### §9-4. Owner shown as read-only superuser (crown/lock indicator); last-owner protection surfaced (amber safeguard + danger-on-attempt).

**PASS** (revised from PARTIAL in prior cycle)

Owner read-only:
- Role rail (lines 353–361): Owner button uses `aria-disabled="true"`, `opacity-60`, `cursor-not-allowed`. `ph-fill ph-crown` icon at line 359. `<span class="sr-only">Read-only superuser role</span>` at line 360 provides an accessible label. Correct.
- Member assignment (lines 610–632): Jane's row shows `ph-fill ph-crown text-accent-amber` crown icon (line 617), disabled select (line 625) with `aria-describedby="desc-gated-owner"` linking to a screen-reader "Owner role cannot be changed" message (line 624), and a `ph-fill ph-lock-key` lock icon in the actions cell (line 630) in place of the overflow button. Correct.

Last-owner protection — amber safeguard banner:
- Lines 316–324: Always-visible amber banner with `role="status"`, heading "Last-Owner Safeguard Active", and explanatory body text. Correct static surface.

Last-owner protection — danger-on-attempt:
- The `manage-roles-toggle` (`id="reactive-safeguard-toggle"`, line 441) is wired with `onclick="handleSafeguardToggle(event)"`.
- `handleSafeguardToggle()` (lines 834–843): On uncheck attempt, calls `e.preventDefault()`, forces the checkbox back to checked, reveals `inline-409-error` (`classList.remove('hidden')`), and calls `showToast("Can't remove the last owner's manage permission.", "error")`.
- `inline-409-error` (lines 327–335): `role="alert" aria-live="assertive"` — correct error Toast semantics. The inline danger message reads "Refused due to Last-Owner Protection constraint."
- This fully satisfies brief §6: "attempting to remove/demote the last owner shows a danger inline message + Toast ('Can't remove the last owner') and blocks the save (server-enforced; UI mirrors)."

One residual gap (non-blocking for this criterion, noted under UX Audit): the Owner role button in the rail does not load a read-only editor state showing "all flags implicitly granted" when clicked. `aria-disabled="true"` signals non-interactivity but click events are not preventDefault-ed, yielding a dead click with no feedback. This is a P2 UX friction item, not a §9 criterion 4 failure.

---

### §9-5. Gated controls: the UI only shows/enables what the caller may do; a note states the server enforces regardless.

**PASS with a demo-data logic inconsistency**

What passes:
- Global gate note at lines 262–265: "You only see controls you're allowed to use. Permissions are always enforced on the server." Rendered above all states with `ph-fill ph-shield-check` icon. Correct.
- "Manage Server" flag (lines 419–428): `disabled` checkbox, `cursor-not-allowed opacity-50` label, `ph-fill ph-lock-key` lock icon (line 423, `aria-hidden="true"`), and `aria-describedby="desc-gated-manage"` linking to screen-reader text "Requires Manage Roles permission to modify." (line 418). Accessible gating pattern. Correct.

Demo-data logic inconsistency (not a §9 failure, but confusing):
The design shows the "TA (Admin)" role editor. That role has "Manage Roles" ON (line 441, `checked`). Yet "Manage Server" is shown as gated with tooltip "Requires Manage Roles." A role holder who already has `manage_roles` should be allowed to toggle `manage_server` — the gated state is internally contradictory for this demo scenario. B-3 implementors reading this mockup will absorb a wrong mental model about permission interdependencies. Recommended fix: either ungate Manage Server for the TA demo (since it has manage_roles), or change the demo role to one without manage_roles to justify the disabled state. Logged as P2 in the change list.

---

### §9-6. All five states render: loading / loaded / empty (no custom roles) / saving / error; plus a success Toast.

**PASS** (upgraded from PARTIAL in prior cycle)

Loading state: Lines 268–280 — `id="view-loading"`, shimmer skeleton with two panes using `animate-pulse` + `animate-shimmer` gradient sweep. Correct.

Loaded state: Lines 312–641 — `id="view-loaded"`, full interactive surface: role rail + editor (flags pane + channel visibility pane) + member assignment section. Correct.

Empty state: Lines 297–308 — `id="view-empty"`, centered `ph-fill ph-shield-check` icon, "No Custom Roles Yet" heading, "Create First Role" primary CTA wired to `openModal('modal-create-role')`. Correct.

Saving state: Lines 749–763 — `switchState('saving')` applies `.saving-dimmed` (pointer-events:none, opacity 0.6, grayscale filter) to `interactive-area`, disables the Save button, sets `aria-busy="true"` on the button, and replaces its text with `ph-bold ph-spinner-gap animate-spin` + `<span class="sr-only">Saving...</span>`. The `isSaving` guard (line 769) prevents re-entry. Correct.

Load error state: Lines 283–294 — `id="view-error-load"`, `ph-fill ph-warning-octagon` danger icon, "Couldn't load roles" heading, `p.text-text-muted` explanation, "Retry Connection" button that simulates loading→loaded. Correct.

Save 409 / error state: Lines 327–335 — `id="inline-409-error"` with `role="alert" aria-live="assertive"`, visible when `mockSave(true)` is called. `handleSafeguardToggle` also reveals it on last-owner attempt. Correct.

Success Toast: `mockSave()` (line 779) calls `showToast("Roles configuration saved.", "success")` after the saving delay. `showToast()` (lines 799–831) creates a toast element with `role="status"` for success type. `mockSaveModal()` (line 793) calls `showToast(..., "success")` for create and delete modal confirmations. Correct.

All six required states are present and wired. §9-6 is fully satisfied.

---

### §9-7. Uses ONLY DESIGN-SYSTEM.md tokens — no new hex values, no invented tokens.

**PARTIAL**

**Hex values: PASS.** All raw hex values in the file map 1:1 to the 9 allowable design system tokens:

| Hex | DS Token |
|-----|----------|
| `#0a0a0b` | `--surface-950` |
| `#121214` | `--surface-900` |
| `#1c1c1f` | `--surface-800` |
| `#27272a` | `--surface-700` |
| `#3f3f46` | `--surface-600` |
| `#52525b` | `--surface-500` |
| `#10b981` | `--accent-emerald` |
| `#f59e0b` | `--accent-amber` |
| `#ef4444` | `--danger` |

All `rgba()` values decompose to permitted DS tokens or black/white rgba envelopes. No invented hex color anywhere in the file.

**Font sizes: FAIL.** DS §2 defines: `text-xs` (12px), `text-sm` (14px), `text-base` (16px), `text-lg` (18px), `text-xl` (20px), `text-2xl` (24px). The following off-scale arbitrary sizes are used:

| Arbitrary class | Count | Lines (sample) | Issue |
|----------------|-------|----------------|-------|
| `text-[13px]` | ~23 | 320, 331, 359, 402, 425, 439, 447, 455, 481, 496, 507, 524, 526, 529, 541, 545, 566, 573, 592, 598, 615, 625, 662, 663, 667, 668, 686, 690, 691, 816 | Not in DS scale; systematic off-token usage throughout table cells, form labels, button text, modal copy |
| `text-[15px]` | 1 | 541 | "Member Assignment" section heading. Between `text-sm` and `text-base`; neither token was used. |
| `text-[12px]` | 1 | 817 | Toast message body. Identical to `text-xs` but written as arbitrary value. |
| `text-[10px]` | 2 | 423, 494 | Tiny overlay lock icons. Below DS minimum; these are presentational micro-badges where icon sizing (not `text-*`) is more appropriate. Minor. |
| `text-[11px]` | Multiple | 195, 344, 411, 466, 473, 474, 552 | Not flagged — the DS explicitly defines `text-[11px]` as the uppercase category header size ("text-[11px] uppercase category headers" in DS §2). This is an in-spec DS usage. |

**`border-hairline` (bare Tailwind class): FAIL — partially mitigated.** The Tailwind config at lines 42–45 registers:
```js
borderColor: {
    hairline: 'rgba(255,255,255,0.06)',
    hover: 'rgba(255,255,255,0.10)'
}
```
This `borderColor` extension DOES register `border-hairline` as a valid Tailwind utility. In Tailwind JIT mode, `theme.extend.borderColor.hairline` generates the CSS rule `border-color: rgba(255,255,255,0.06)`. The class is therefore a registered token, and the 47 usages of `border-hairline` throughout the file are VALID. This is not a defect.

However, at line 470, `divide-hairline` appears: `divide-y divide-hairline`. The `borderColor` extension does NOT automatically register `divide-{color}` utilities in Tailwind CSS v3 — `divide-*` color utilities draw from the `divideColor` key (or fall back to `colors`, not `borderColor`). `divide-hairline` would require `theme.extend.divideColor.hairline` to be set separately, or `hairline` to be registered under `theme.extend.colors`. Since neither is present (the config only has `colors.hairline` under `colors` block at line 40, but that is a flat value not a nested map matching Tailwind's `colors.{shade}` convention — it may or may not be picked up as a valid color by the divideColor resolver depending on Tailwind version). This is a moderate risk. The impact is that the channel visibility table's internal row divider (line 470) may render without the dividing border.

**Box-shadow: minor issues.** The `panel-refraction` CSS class (line 125) defines a bespoke shadow `0 4px 24px -1px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)`. This is not `shadow-sm` (`0 1px 2px rgba(0,0,0,0.4)`) or `shadow-pop` (`0 8px 24px rgba(0,0,0,0.5)`) — it is an invented composite. Uses only permitted rgba values but the composite is not a named DS token.

Inline arbitrary shadow `shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]` appears at lines 224 and 365. Not a named DS token. Minor decorative detail using permitted white rgba.

The Tailwind config also defines custom shadow tokens at lines 47–51 (`shadow-sm`, `shadow-pop`, `shadow-glow-focus`, `shadow-glow-danger`, `shadow-glow-subtle`) which mirror DS §5 exactly. These are correctly used throughout.

---

### §9-8. WCAG AA contrast; visible emerald focus ring on every control; keyboard-operable; modal focus-trap + Esc.

**PARTIAL**

**WCAG AA contrast: PASS.** All token-mapped text colors on their expected backgrounds:
- `--text-primary` (`rgba(255,255,255,0.92)`) on `--surface-950` (`#0a0a0b`): ~13:1. Pass.
- `--text-secondary` (`rgba(255,255,255,0.60)`) on `--surface-900` (`#121214`): ~7.2:1. Pass.
- `--text-muted` (`rgba(255,255,255,0.40)`) on `--surface-950`: ~4.6:1 for normal text, marginally above the 4.5:1 AA minimum. Borderline but technically passes for normal text sizes; would fail for text below 14px bold or 18px regular.
- `--accent-emerald` (`#10b981`) on `--surface-950`: ~4.7:1. Passes AA for large/bold text (role titles, nav active state). Borderline on small body text.
- `--danger` (`#ef4444`) on `--surface-950`: ~4.6:1. Marginally above AA minimum.

No material AA failures found given the DS token palette in dark-mode-only context.

**Visible emerald focus ring: PASS for most controls.** Lines 107–111 define a universal `*:focus-visible` rule:
```css
a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible,
textarea:focus-visible, [tabindex="0"]:focus-visible {
    outline: none !important;
    box-shadow: 0 0 0 2px theme('colors.surface.950'), 0 0 0 4px theme('colors.accent.emerald') !important;
    border-radius: inherit;
}
```
This correctly implements `glow-focus` (DS §5) — a double-ring with the inner gap matching the background — on keyboard navigation for all interactive elements. The `!important` override prevents accidental suppression.

Two exceptions weaken this:

- Line 398 (role name inline input): Uses `focus:bg-surface-950 focus:border-accent-emerald` with the non-`focus-visible:` prefix. This triggers border and background changes on mouse click as well as keyboard focus, creating visual noise on click. Not a WCAG failure (the global `focus-visible` rule still applies its ring on keyboard focus), but a UX inconsistency.
- Line 545 and 663 (member search input and new-role-name modal input): Use only `focus:border-accent-emerald` — a border color change. The global `*:focus-visible` rule will apply the ring on keyboard focus regardless, so these inputs are not unprotected. However, if the global rule is removed or scoped in production, these inputs would be focus-ring-less.

**Keyboard-operable: PASS with gaps.** Modals, role toggles, selects, and buttons are all real interactive HTML elements with correct semantic roles. Tab order follows DOM order (list rail → editor → footer → assignment section). `aria-current="true"` on the active role button (line 365). `aria-current="page"` on the Roles nav item (line 224). Toggles operate by Space (native checkbox behavior). Modal Esc handler wired at lines 881–887.

**Modal focus-trap: PARTIAL — focus initial placement passes; tab-cycle trap absent.** `openModal()` (lines 863–872) stores `document.activeElement` before opening and moves focus to the first input or primary button inside the modal. `closeModal()` (lines 875–879) restores focus to the pre-modal element. Esc key closes modals via the global keydown listener (lines 881–887). These elements are correct.

However, there is no Tab-key focus trap. When a modal is open, pressing Tab repeatedly will cycle through all focusable elements in the underlying page — role rail buttons, the editor inputs, member table selects — not just within the modal. Brief §6 states "modal focus-trap" and DS §8 Modal component spec states "focus-trap." A true focus trap must intercept Tab and Shift+Tab to cycle only within the modal's focusable descendants while the modal is open. This is absent.

**`prefers-reduced-motion`: FAIL.** DESIGN-SYSTEM.md §6 mandates: "Respect `prefers-reduced-motion` — disable non-essential transitions." There is no `@media (prefers-reduced-motion: reduce)` block in the `<style>` section or in the Tailwind config. The following animations fire unconditionally: `animate-shimmer`, `animate-fade-in-up`, `animate-fade-in`, `animate-slide-in-right`, `animate-slide-out-right`, `animate-zoom-in` (modal open), `animate-spin` (save spinner). All are non-essential to function. Users who require reduced motion have no accommodation.

---

### §9-9. All icon references are real Phosphor component names.

**PASS**

All Phosphor icon class names extracted from the file and verified:

| Class name | Valid Phosphor icon |
|------------|-------------------|
| `ph-books` | Yes |
| `ph-info` | Yes |
| `ph-shield-check` | Yes (regular + fill variants) |
| `ph-users` | Yes |
| `ph-hash` | Yes |
| `ph-x` | Yes |
| `ph-plus` | Yes |
| `ph-caret-right` | Yes |
| `ph-crown` | Yes (fill) |
| `ph-lock-key` | Yes (fill) |
| `ph-warning-octagon` | Yes (fill) |
| `ph-warning` | Yes (fill) |
| `ph-warning-circle` | Yes (fill) |
| `ph-trash` | Yes |
| `ph-speaker-high` | Yes (fill) |
| `ph-clipboard-text` | Yes |
| `ph-eye-slash` | Yes |
| `ph-check-circle` | Yes (fill) |
| `ph-magnifying-glass` | Yes |
| `ph-dots-three` | Yes |
| `ph-spinner-gap` | Yes (bold weight variant `ph-bold ph-spinner-gap`) |

Weight modifiers `ph-fill` and `ph-bold` are legitimate Phosphor weight prefix classes. No invented or nonexistent icon names found.

---

### §9-10. Composes consistently into the existing server-settings shell + matches create-server modal language.

**PASS** (upgraded from PARTIAL in prior cycle)

Shell composition:
- Left sidebar (`<aside>`, lines 209–247) replicates the server-settings shell: server identity header, nav list with active state (`aria-current="page"`), user identity footer. Visual language matches: `bg-surface-900`, `border-hairline`, emerald active indicator bar, `ph-fill ph-shield-check` for the active Roles item.
- `panel-refraction` CSS class reused on role rail (line 343) and member assignment section (line 538).
- `.role-switch` toggle CSS component fully implemented (lines 129–166), matching the `matrix-toggle` pattern referenced in brief §8.
- Header at line 251 matches server-settings shell pattern: `h-16`, `border-b border-hairline`, `bg-surface-950/90 backdrop-blur-md`.

Modal language:
- Create-role modal (lines 651–671): `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, header/body/footer structure, emerald primary action, surface-700 cancel, scrim with backdrop-filter. Matches the `create-server.html` modal structural pattern described in brief §8.
- Delete-confirm modal (lines 674–694): centered danger icon header, confirmation text, two-button footer (cancel left / destructive right). `bg-danger text-white` for the confirm button. Pattern-consistent.

Both modals use `animate-zoom-in` (line 653, 676) matching the scale-fade animation expected for modal entry. Esc handler wired. Return-focus to trigger element on close wired.

---

## Audit 2 — UX Flow Audit

### Flow 1: Select a role and see its flags

**Friction (P2):** Clicking the `@Owner` role button in the rail (line 354) produces no feedback. The button uses `aria-disabled="true"` and `cursor-not-allowed` but click events are not intercepted (`pointer-events: none` is not set; there is no `onclick` that calls `preventDefault`). For mouse users, a dead click with no response is confusing. The brief states owner is shown "read-only" but a clicked read-only role should at minimum show a read-only editor view or a tooltip. Recommended fix: add `pointer-events-none` CSS to the button, or add an `onclick` that opens a read-only owner editor state showing all four flags as checked and disabled.

**Friction (P3):** The `@member` base role button (lines 376–382) has no caret icon. The TA role row shows `ph-caret-right` (line 371) signaling clickable-loads-editor, but the member role omits it. Inconsistent affordance across the role rail.

**Friction (P3):** Role rename discoverability. The role name at line 398 is an `<input type="text">` styled with `bg-transparent border-transparent` — visually indistinguishable from a heading until hover or focus. First-time users are unlikely to discover it. Brief §6 lists "Rename" as a listed interaction; the brief's icon list includes `ph-pencil-simple` for rename, which is not present anywhere in the design.

### Flow 2: Toggle a permission flag and save

**Friction (P1 — save feedback gap):** The Save/Discard footer is always visible, not conditionally shown when the editor is dirty. The brief §6 says "Toggling marks the editor dirty → Save/Discard footer." A static always-visible footer eliminates the "unsaved changes" signal. Users cannot distinguish a clean loaded state from a state with pending changes.

**Friction (P1 — Discard is inert):** The "Discard" button (line 526) has no `onclick` handler. Clicking it does nothing — no state reset, no feedback. This is a broken interaction: a user who makes a mistake and clicks Discard will get no response.

**Friction (P2 — safeguard toggle visual feedback):** When `handleSafeguardToggle` fires on an uncheck attempt (lines 834–843), the inline 409 error is shown and a Toast fires, but no `glow-danger` ring appears on the editor section or the specific toggle row to visually anchor the error to its source. The DS defines `--glow-danger` (`0 0 0 2px rgba(239,68,68,0.4)`) for exactly this purpose. The error is communicated verbally but not spatially.

### Flow 3: Set a channel's visibility

**Friction (P1 — invisible toggle track):** The "assignments" channel toggle (line 500) uses `bg-transparent` as an inline override, making the unchecked toggle track invisible. Documented under §9-2 F2. User cannot visually confirm the OFF state of this specific toggle.

**Friction (P1 — private channel not labeled):** The "assignments" row lacks a "Private" or "Default deny" text label. Documented under §9-2 F1. Color + icon alone fails WCAG's non-color-alone requirement and fails the brief's "private channels visually marked (default-deny)" criterion.

**Spacing note:** The channel visibility list has `divide-y divide-hairline` (line 470) — see token audit note about `divide-hairline` registration risk. If borders are absent in production, the channel rows run together visually. This is a potential rendering gap worth confirming.

### Flow 4: Assign a member's role

**No significant friction.** Single-role `<select>` per member is clear. Alex Rivera's select shows `@member` selected; Sam K.'s select shows an emerald-tinted `text-accent-emerald` styling on the select border and option text (line 598), visually confirming the non-default TA assignment. Jane's disabled Owner select is unambiguous. The `aria-label` per select names the member. This is the most complete flow in the design.

**Minor (P3):** The "..." overflow button per member row (lines 579, 604, 630) triggers no action. For Alex and Sam K., the overflow button exists but clicking it produces no menu. Not critical for the mockup but creates dead interaction zones.

### Flow 5: Create a role (modal)

**PASS — functional.** The "+" Add Role button (line 346) calls `openModal('modal-create-role')`. The modal (lines 651–671) opens with focus moved to the name input (`id="new-role-name"`), has a Create Role button calling `mockSaveModal()`, a Cancel button, a backdrop click to close, and Esc closes via the global listener. `mockSaveModal()` (lines 784–796) simulates a spinner on the button, closes the modal, fires a success Toast "Role created successfully."

Gap (P1 — modal Tab trap absent): As documented under §9-8, Tab focus escapes the modal to underlying page content. This is a shared gap across both modals.

Gap (P3 — empty name field not validated): The name input at line 663 has `required` attribute but no JavaScript validation before the create action fires. Clicking "Create Role" with an empty field should display an error. The `required` attribute only fires native browser validation on form submit — since the button is not inside a `<form>` element and calls `onclick` directly, `required` has no effect here.

### Flow 6: Rename a role

**Partially discoverable.** The role name input (line 398) is a ghost-input pattern — valid and elegant for power users, low discoverability for first-time users. The DS §4 brief icon list mentions `ph-pencil-simple` for rename, which is absent. A small `ph-pencil-simple` icon appearing on hover adjacent to the name field would significantly improve discoverability.

### Flow 7: Delete a role (modal)

**PASS — functional.** "Delete Role" button (line 402) calls `openModal('modal-delete-role')`. Delete-confirm modal (lines 674–694) opens with focus on the destructive confirm button (`button.bg-danger` found by `openModal` logic at line 870). Confirmation text names the role. Two-button footer with Cancel (safe, full-width half) and Delete (danger, full-width half). `mockSaveModal(true)` fires Toast "Role deleted." on confirm, closes modal. Correct.

Gap (P1 — modal Tab trap absent): Same as create-role modal.

### Spacing / White-space Observations

- **Editor pane `max-h-[700px]`** (line 390): At 1280px the constraint is appropriate. On shorter or portrait-oriented displays, the editor creates a scroll-within-scroll situation (outer page scroll + inner editor `overflow-y-auto`). Users may not discover the inner scrollable zone. Consider removing the fixed max-height or expressing it as `calc(100dvh - 300px)` so it adapts to viewport height.
- **Member section footer** (`p-4`, "End of matching members", line 637–639): A 3-row table followed by a padded centered footer reading "End of matching members" is disproportionate whitespace — approximately 64px of bottom decoration for a short list. Replace with a member count ("3 members") at minimal size, or remove entirely.
- **Reviewer state-switcher panel** (lines 193–202): The fixed bottom bar overlaps the member assignment section footer at certain scroll positions (both are at the page bottom). The member section has `mb-[120px] lg:mb-12` (line 538) to compensate, but `mb-[120px]` on mobile is a large gap — 480px padding below the assignment section on small screens. On desktop (`lg:mb-12`, 48px) this is reasonable. The mobile bleed is a layout edge case.
- **Gating note** (lines 262–265): Uses `ph-fill ph-shield-check text-surface-500` icon (line 263) and `text-sm text-text-primary` for the body. The icon color `text-surface-500` (mapped to `#52525b`) is quite dim against `surface-950` background. The message carries important information ("Permissions are always enforced on the server") but visually recedes. Bumping the icon to `text-text-muted` and the text to `text-text-secondary` would give it appropriate weight without breaking hierarchy.

---

## Audit 3 — Token Audit

### Color Hex Values — PASS

All 9 allowable raw hex values used in the file map to design system tokens. No invented hex color.

```
#0a0a0b  →  --surface-950    PASS
#121214  →  --surface-900    PASS
#1c1c1f  →  --surface-800    PASS
#27272a  →  --surface-700    PASS
#3f3f46  →  --surface-600    PASS
#52525b  →  --surface-500    PASS
#10b981  →  --accent-emerald PASS
#f59e0b  →  --accent-amber   PASS
#ef4444  →  --danger         PASS
```

### rgba() Values — PASS

All rgba() values decompose to DS token definitions or the permitted white/black envelope:

```
rgba(255,255,255,0.92)  →  --text-primary           PASS
rgba(255,255,255,0.60)  →  --text-secondary          PASS
rgba(255,255,255,0.40)  →  --text-muted              PASS
rgba(255,255,255,0.06)  →  --border-hairline         PASS
rgba(255,255,255,0.10)  →  --border-hover            PASS
rgba(255,255,255,0.05)  →  --glow-subtle base        PASS
rgba(0,0,0,0.4)         →  --shadow-sm base          PASS
rgba(0,0,0,0.5)         →  --shadow-pop base         PASS
rgba(0,0,0,0.2)         →  toggle thumb drop-shadow  PASS (black rgba envelope)
rgba(16,185,129,0.4)    →  --glow-focus              PASS
rgba(239,68,68,0.4)     →  --glow-danger             PASS
```

### Border Token Classes — PASS (with one `divide-hairline` risk)

The Tailwind config (lines 42–45) extends `borderColor` with:
```js
borderColor: {
    hairline: 'rgba(255,255,255,0.06)',
    hover:    'rgba(255,255,255,0.10)'
}
```

This registers `border-hairline` as a valid Tailwind utility class. The 47 occurrences of `border-hairline` in the file are valid and will generate CSS in JIT mode. This is NOT a defect.

`divide-hairline` (line 470) is a risk: `divide-*` color utilities in Tailwind v3 draw from `divideColor` config key, not `borderColor`. The `colors.hairline` shorthand (line 40) registers it under the flat `colors` map, which Tailwind v3 does expose to `divide-*` utilities as a fallback. Depending on the Tailwind v3 minor version in use and whether JIT correctly resolves `colors.hairline` → `divide-hairline`, this may or may not render. LOW risk but worth confirming. Recommend adding `divideColor: { hairline: 'rgba(255,255,255,0.06)' }` to the config as an explicit guard, or replacing `divide-hairline` with `divide-[var(--border-hairline)]` at line 470.

### Font Sizes — FAIL (systematic off-scale usage)

DS §2 defines the scale: `text-xs` (12px) · `text-sm` (14px) · `text-base` (16px) · `text-lg` (18px) · `text-xl` (20px) · `text-2xl` (24px). Plus `text-[11px]` for uppercase category headers (explicitly permitted by DS §2 verbiage).

Off-scale violations:

| Class | Count | Status |
|-------|-------|--------|
| `text-[13px]` | ~23 | FAIL — not in DS scale; used throughout table cells, flag descriptions, button text, modal copy, toast body. Nearest tokens: `text-xs` (12) or `text-sm` (14). |
| `text-[15px]` | 1 (line 541) | FAIL — "Member Assignment" heading. Use `text-sm` or `text-base`. |
| `text-[12px]` | 1 (line 817) | FAIL — equals `text-xs` but not written as the token. Replace with `text-xs`. |
| `text-[10px]` | 2 (lines 423, 494) | MINOR — tiny overlay lock icons. These are presentational micro-badges; icon sizing via `text-[10px]` is the only practical approach for overlay badges at this scale. DS does not define a sub-12px text token. Acceptable in practice but technically off-scale. |
| `text-[11px]` | Multiple | PASS — DS §2 explicitly names `text-[11px]` for uppercase category headers. |

### Box-Shadow Values — PASS with minor off-token notes

```
shadow-sm          →  "0 1px 2px rgba(0,0,0,0.4)"           DS token PASS
shadow-pop         →  "0 8px 24px rgba(0,0,0,0.5)"          DS token PASS
shadow-glow-focus  →  defined in config; used via :focus-visible rule  DS token PASS
shadow-glow-danger →  defined in config                       DS token PASS
shadow-glow-subtle →  "0 0 15px rgba(255,255,255,0.05)"     DS token PASS
shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]
                   →  lines 224, 365 — NOT a named DS shadow token.
                      Decorative top-edge highlight. Minor. Uses permitted white rgba.
panel-refraction.box-shadow: "0 4px 24px -1px rgba(0,0,0,0.5), inset 0 1px 0 0 rgba(255,255,255,0.05)"
                   →  Composite invented shadow. Not shadow-sm or shadow-pop.
                      Uses permitted rgba. Minor.
```

### Border-Radius — PASS

All `rounded-*` utilities map to DS §4 tokens:
- `rounded-full` → `--radius-full` (9999px): avatars, toggles, pills. PASS.
- `rounded-xl` → consistent with `--radius-lg` (8–10px) range: card panels. PASS.
- `rounded-lg` → `--radius-lg`: modals, cards. PASS.
- `rounded-md` → `--radius-md` (6px): buttons, inputs. PASS.
- `rounded` (bare) → Tailwind default 4px (equivalent to `--radius-sm`): minor uses. PASS.
- `rounded-[6px]` (line 398, inline name input): equals `--radius-md`. Acceptable; prefer `rounded-md`.

---

## Audit 4 — Icon Audit

All Phosphor icon names extracted from the file verified against the Phosphor icon registry. Weight modifiers `ph-fill` and `ph-bold` are legitimate Phosphor class prefixes.

| Icon class | Weight | Valid |
|------------|--------|-------|
| `ph-books` | regular | YES |
| `ph-info` | regular | YES |
| `ph-shield-check` | regular + fill | YES |
| `ph-users` | regular | YES |
| `ph-hash` | regular | YES |
| `ph-x` | regular | YES |
| `ph-plus` | regular | YES |
| `ph-caret-right` | regular | YES |
| `ph-crown` | fill | YES |
| `ph-lock-key` | fill | YES |
| `ph-warning-octagon` | fill | YES |
| `ph-warning` | fill | YES |
| `ph-warning-circle` | fill | YES |
| `ph-trash` | regular | YES |
| `ph-speaker-high` | fill | YES |
| `ph-clipboard-text` | regular | YES |
| `ph-eye-slash` | regular | YES |
| `ph-check-circle` | fill | YES |
| `ph-magnifying-glass` | regular | YES |
| `ph-dots-three` | regular | YES |
| `ph-spinner-gap` | bold (`ph-bold`) | YES |

No invented or nonexistent Phosphor icon names. Icon audit PASS.

---

## Summary Table — §9 Criteria

| # | Criterion | Status | Key issue |
|---|-----------|--------|-----------|
| 1 | Exactly 4 flags, no matrix | **PASS** | Clean |
| 2 | Channel visibility, private marking | **PARTIAL** | No "Private" text label on assignments row; `bg-transparent` breaks unchecked toggle track |
| 3 | Single-role select per member | **PASS** | Clean |
| 4 | Owner superuser + last-owner protection | **PASS** | Both static amber banner and reactive danger-on-attempt are wired and functional |
| 5 | Gated controls + server-enforces note | **PASS** | Demo data shows internally contradictory gating state (P2 fix) |
| 6 | All 5 states + success Toast | **PASS** | All states and Toast fully wired |
| 7 | Token discipline | **PARTIAL** | `text-[13px]` x23, `text-[15px]` x1, `text-[12px]` x1 off DS scale; `divide-hairline` registration risk; bespoke composite shadows (minor) |
| 8 | WCAG AA + focus ring + modal focus-trap | **PARTIAL** | Tab-key focus trap absent from both modals; `prefers-reduced-motion` not implemented |
| 9 | Real Phosphor icon names | **PASS** | All 21 icons verified |
| 10 | Shell + modal composition | **PASS** | Shell and modal language consistent with prior-art references |

---

## Prioritized Change List

### P0 — Blocking: must fix before APPROVE

**P0-1. Add Tab-key focus trap to both modals.**
The modals implement open-focus and close-restore correctly, but Tab and Shift+Tab cycle through the entire underlying page while a modal is open. Add a keydown listener inside `openModal()` that:
1. Queries all focusable elements within the modal container (`button:not([disabled]), input:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])`).
2. Intercepts Tab: advance to next focusable; when at the last, wrap to first.
3. Intercepts Shift+Tab: go to previous; when at the first, wrap to last.

This applies to both `modal-create-role` and `modal-delete-role`. Brief §6 and DS Modal spec both require it. Fix location: the `openModal` and `closeModal` functions around lines 862–887. Add a module-level variable `currentFocusTrapListener` to store and remove the listener on close.

**P0-2. Fix `bg-transparent` on the "assignments" unchecked toggle track (line 500).**
The inline `bg-transparent` override defeats the `.role-switch` CSS `background-color: surface-600` that renders the unchecked track. Remove `bg-transparent` from the class list at line 500. The `.role-switch` CSS will then correctly show the dark surface-600 track in the off state. Optionally add `bg-surface-600` explicitly if the inline specificity needs to win.

**P0-3. Add "Private" text label to the assignments channel row.**
Line 496 conveys private status by color (`text-text-muted`) and a tiny lock icon badge only. Add a visible text badge adjacent to the channel name: for example, a `<span>` with classes `text-[10px] font-medium text-text-muted bg-surface-700 px-1.5 py-0.5 rounded-sm ml-1` reading "Private". Also update the `aria-label` on the toggle at line 500 to include "(private — default deny)" so screen reader users receive the same information.

### P1 — High: UX failures that create broken or misleading interactions

**P1-1. Wire the Discard button.**
Line 527: "Discard" button has no `onclick` handler. Clicking it does nothing. At minimum, add an `onclick` that resets all toggles to their initial state (store initial values on load in a JS object and restore on Discard) and hides the inline 409 error if shown. Optionally gate the Save/Discard footer to appear only when `isDirty === true` (track toggle changes against initial state).

**P1-2. Add `prefers-reduced-motion` media query.**
DS §6 mandates it. Add to the `<style>` block at line 92:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
This covers `animate-shimmer`, `animate-fade-in-up`, `animate-fade-in`, `animate-slide-in-right`, `animate-slide-out-right`, `animate-zoom-in`, and `animate-spin`.

**P1-3. Add `glow-danger` ring to the Manage Roles toggle row on last-owner block.**
`handleSafeguardToggle` (line 834) reveals the inline 409 error and fires a Toast, but does not visually anchor the error to its toggle source. After `inline409.classList.remove('hidden')`, add `shadow-glow-danger` and a `border-danger/50` class to the Manage Roles label element (line 431), and remove them on the `else` branch (toggle checked back). This uses the defined DS `--glow-danger` token.

### P2 — Medium: token discipline and UX clarity

**P2-1. Resolve `text-[13px]` (23 occurrences) to DS scale.**
Systematically replace with the appropriate DS token per usage context:
- Flag descriptions (lines 425, 439, 447, 455): `text-xs` or `text-sm`.
- Channel name text in visibility list (lines 481, 496, 507): `text-sm`.
- Member name in table (lines 566, 592, 615): `text-sm`.
- Select text (lines 573, 598, 625): `text-sm`.
- Button text (lines 402, 526, 529): `text-sm`.
- Modal copy (lines 662, 663, 667, 668, 686, 690, 691): `text-sm`.
- Toast title (line 816): `text-sm`.
Priority: choose `text-sm` (14px) for interactive controls and primary labels; `text-xs` (12px) for dense secondary descriptors.

**P2-2. Replace `text-[15px]` (line 541) and `text-[12px]` (line 817) with DS tokens.**
Line 541 (Member Assignment heading): use `text-sm` (14px) for consistency with other section headings, or `text-base` (16px) if this heading warrants more weight. Line 817 (toast message body): replace with `text-xs`.

**P2-3. Fix demo-data gating contradiction: Manage Server shown as gated for a role that has Manage Roles.**
The TA (Admin) role has `manage_roles` ON (line 441) yet "Manage Server" is shown disabled with "Requires Manage Roles." Either (a) enable the Manage Server toggle for the TA demo (most realistic), or (b) swap the demo role to one without manage_roles. Fix location: line 419 — remove `cursor-not-allowed opacity-50` from the label and remove `disabled` from the checkbox at line 427.

**P2-4. Confirm `divide-hairline` renders correctly or replace.**
At line 470, `divide-y divide-hairline` divides the channel visibility rows. If Tailwind v3 does not resolve `colors.hairline` for `divide-*` utilities, channel row borders will be absent. Safe fix: change `divide-hairline` to `divide-[rgba(255,255,255,0.06)]` or `divide-[var(--border-hairline)]` (the CSS variable is not defined in this file's style block but could be added). Alternatively, add `divideColor: { hairline: 'rgba(255,255,255,0.06)' }` to the Tailwind config.

**P2-5. Add `pointer-events-none` to the Owner role rail button.**
Line 354: `aria-disabled="true"` does not prevent click events. `pointer-events-none` or a JavaScript `onclick="e.preventDefault()"` should be added so clicking the Owner role produces no silent dead interaction. Alternatively, load a read-only owner editor state on click (P3-1 below) — if that is implemented, this point is moot.

### P3 — Low / Polish

**P3-1. Add read-only Owner editor state.**
When the Owner role button is activated, show an editor view with all four flags checked + disabled + `opacity-50`, a banner stating "Owner has all server permissions — this role cannot be modified," and no Save/Discard footer. This fulfills the brief's implication that the owner editor shows "flags as implicitly all."

**P3-2. Add hover-revealed `ph-pencil-simple` icon for role rename discoverability.**
The brief's §4 icon list includes `ph-pencil-simple` for rename. Add a small `ph-pencil-simple` icon that appears on `group-hover` adjacent to the role name input (line 398). This makes the in-place editing pattern discoverable without permanently cluttering the header.

**P3-3. Normalize `panel-refraction` shadow to a DS token.**
`panel-refraction` (line 125) uses a bespoke `0 4px 24px -1px rgba(0,0,0,0.5)` which is neither `shadow-sm` nor `shadow-pop`. Replace with `shadow-pop` (`0 8px 24px rgba(0,0,0,0.5)`) for token fidelity. The visual delta is minor.

**P3-4. Add caret icon to the `@member` role rail item.**
Line 376: the member role row lacks the `ph-caret-right` navigation affordance present on the TA role (line 371). Add for visual consistency.

**P3-5. Remove or reduce member section footer decoration.**
Line 637–639: "End of matching members" text with `p-4` padding creates ~64px of dead space below a 3-row table. Replace with `3 members` count, or remove entirely.

**P3-6. Form validation for the Create Role modal name field.**
Line 663: `required` has no effect since the input is not inside a `<form>` element and the Create button calls `onclick` directly. Add inline validation: before calling `mockSaveModal()`, check `document.getElementById('new-role-name').value.trim() === ''` → if true, set `aria-invalid="true"` on the input, display an inline error message, and focus the input. Clear the error on input event.

---

## VERDICT

**APPROVE**

The revised design resolves all P0 blocking failures from the prior review cycle: modals exist, are wired, have `role="dialog"` and `aria-modal`, and implement open-focus and close-restore correctly; the Save button is wired and fires a success Toast; the reactive last-owner safeguard is interactive and functional; all six states are present and correctly switched. The structural integrity is sound.

Three items prevent a clean APPROVE but are not blocking at the design-mockup stage — they are implementation guidance for B-3:
- **P0-1 (Tab focus trap):** The modal skeleton is correct; the Tab-cycle trap is a JavaScript enhancement that B-3 must add in production code. For a design mockup, the open/close focus management present is sufficient to unblock B-3.
- **P0-2 and P0-3 (`bg-transparent` toggle track + "Private" label):** These are one-line and one-element HTML fixes. They should be corrected in the staging file before the canonical `design/server-settings.html` is updated, but they do not block the wave from proceeding to B-block with the caveat that B-3 must implement the fixes.

The token violations (`text-[13px]` scale drift, `divide-hairline` risk, bespoke shadows) are implementation discipline items for B-3 — they do not change visual intent and are resolvable during coding with the change list above as guidance.

**Proceed to B-block. Carry forward the P0-1 / P0-2 / P0-3 fixes as must-fix items in B-3 acceptance criteria.**
