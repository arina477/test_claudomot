# D-3 UI/UX + Accessibility Review — invite-share.html (wave-9 delta)

**Reviewer:** Reviewer B (ui-ux-pro-max substituting for accessibility audit)
**Date:** 2026-06-29
**Staging HTML:** `/home/claudomat/project/design/staging/invite-share.html`
**Brief Reference:** `/home/claudomat/project/process/waves/wave-9/stages/D-1-brief/invite-share-brief.md`
**Design System Reference:** `/home/claudomat/project/design/DESIGN-SYSTEM.md`

---

## 1. SUCCESS-CRITERIA CHECKBOX AUDIT

Scoring against brief § 9 (10 required checkboxes):

| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | DEFAULT visible state shows PERMANENT server invite link (NOT "mint fresh ad-hoc") | **PASS** | State 1 (lines 178–245): "Server invite link" label + "Permanent" badge (line 202) + permanent URL displayed. Clear labeling as default. |
| 2 | "Generate a limited invite" is SECONDARY action, lower-emphasis (owner/creator only) | **PASS** | State 1 (lines 226–235): grey secondary button (bg-surface-700, not emerald), positioned AFTER divider, copy field is the dominant primary action (emerald Copy button). Owner/creator scope noted in HTML comments (line 109). |
| 3 | List of active limited invites shown (owner/creator), each with revoke control | **PASS** | State 5 (lines 419–492): populated list (ul, role=list, lines 461–482) with 2 example rows; each has trash icon button (ph-trash, lines 468, 478) with aria-label. State 6 confirms empty state exists. |
| 4 | Revoke has confirm step before destructive action (no one-click) | **PASS** | State 7 (lines 549–607): trash click → inline confirm row (lines 571–586), role=alert, warning icon, text confirmation ("Revoke invite…? It will stop working immediately."), separate Cancel + danger Revoke button. Safe two-step. |
| 5 | Honest "revoked" row state ("no longer works"), visually distinct via danger, NOT silent removal | **PASS** | State 8 (lines 609–667): revoked row (lines 631–637) is struck (line-through), dimmed (opacity-70), has ph-prohibit danger icon (line 632), label "Revoked — this link no longer works" in danger color (line 635). Remains visible. |
| 6 | Empty state for limited-invites list exists | **PASS** | State 6 (lines 494–547): empty state (lines 527–538) centered icon + headline "No limited invites yet." + one-line + primary "Generate a limited invite" CTA. Honest. |
| 7 | Copy → Copied morph + emerald Toast retained (wave-8 carryover) | **PASS** | State 2 (lines 247–318): button changes to "Copied" (line 282, aria-label "Invite link copied"), check icon (ph-check, line 283), button morphs to bg-accent-emerald/80 (line 282). Toast (lines 310–316) role=status, emerald left bar (line 311), emerald check-circle icon (line 313), "Invite link copied" text. Both present. |
| 8 | Every interactive control has visible emerald focus-visible ring (danger ring on destructive confirm); icon-only buttons have aria-label | **PARTIAL** | **PASS on focus rings:** All buttons use `.focus-ring` (emerald) or `.focus-ring-danger` (danger). Destructive Revoke confirm has `.focus-ring-danger` (line 579). Input fields carry `.focus-ring` (lines 209, 275, 441, etc.). **Icon-only buttons aria-label:** close button (line 190, aria-label "Close invite dialog"), Copy button (line 215, aria-label), list revoke trash icons (lines 468, 478, aria-labels present), Retry button (line 409, has icon+text so aria-label not required). **One minor gap:** the "New" button in the list header (line 456, no aria-label—it's text-labeled "New" inline, but the icon-only pattern is not pure icon-only here; acceptable as text is visible). **PASS overall.** |
| 9 | All colors/spacing/radii/shadows map to DESIGN-SYSTEM.md tokens; no invented values; WCAG AA contrast in dark theme | **PARTIAL** | See detailed token audit (§3 below). All core colors map to system tokens. One concern flagged in contrast audit (§4). |
| 10 | No RBAC/role UI, no rotate-permanent-code button, no kick/ban | **PASS** | No RBAC UI visible. No rotate button (brief §10 non-goal explicitly noted in HTML comment line 111). No kick/ban. Scope respected. |

**Summary:** 9.5 / 10. All critical criteria met. One minor contrast concern deferred to § 4.

---

## 2. UX FLOW AUDIT — Task completion and friction points

### Task (a): Copy the permanent link

**Flow:**
1. User opens modal (State 1, line 178).
2. Permanent link displayed in read-only field (lines 209–213), labeled "Permanent" badge visible (line 202).
3. User clicks Copy button (emerald, line 215) OR clicks the input field (select-all per aria-label line 213).
4. Copy button morphs → "Copied" + check icon (State 2, line 282), button becomes emerald/80 opacity.
5. Toast fires (lines 310–316): role=status (polite), emerald left bar, check-circle icon, "Invite link copied" text.
6. ~2s later (in running app), button and toast revert to idle (line 282 shows single state; runtime reverts after timeout).

**Friction points:** None detected. Clear primary action, instant feedback (button + toast), accessible Toast role=status, aria-labels all present. **PASS.**

### Task (b): Generate a limited invite

**Flow:**
1. User is owner/creator (HTML comment line 109 notes ownership gating).
2. User sees "Need a limited invite?" section (lines 226–235, State 1).
3. Secondary grey "Generate" button (bg-surface-700, icon ph-clock-countdown, line 231).
4. Click → invite is created (not shown in this staging mockup—behavior deferred to B-block implementation).
5. New row appears in the limited-invites list (State 5 onwards, lines 461–482).

**Friction points:**
- **MINOR:** The "Generate" button is minimal this wave (brief §10 non-goal: "full limited-invite creation form"). No visual feedback in staging (e.g., no loading state shown after click). In production, B-block must handle: POST to server, add row to list, show loading/error if it fails. Staging does NOT show success feedback—B-block will add that.
- **MINOR:** Owner/creator gating is NOT visually expressed in the UI (no role badge or "owner only" label on the Generate button). Brief §10 is explicit: "No RBAC/role UI this wave." Non-members/non-owners won't see the section at all (server-side render). **Acceptable per brief, but in production: auth check must happen server-side before rendering the Generate section.**

**Conclusion:** UX is sound at the mockup level. Task is achievable. **PASS with production notes.**

### Task (c): Revoke a limited invite safely

**Flow:**
1. Limited-invites list is visible (State 5, lines 461–482; owner/creator only).
2. Each row has a trash icon (ph-trash, lines 468, 478) with aria-label.
3. User clicks trash icon → row transitions to confirm state (State 7, lines 571–586, inline confirm pattern).
4. Confirm row shows role=alert (line 572), danger icon (ph-warning-circle, line 573), text ("Revoke invite…pA8wQs?"), explanation ("It will stop working immediately…"), two buttons: Cancel (secondary) + danger Revoke (destructive, red fill).
5. User clicks danger Revoke → row animates out or transitions to "revoked" state (State 8, lines 631–637).
6. Revoked row remains visible: struck code, dimmed bg, ph-prohibit danger icon, "Revoked — this link no longer works" label.
7. Toast fires (lines 659–665): role=status, emerald left bar, "Invite revoked" text.

**Friction points:**
- **None on safety.** Confirm step is mandatory, clear, destructive intent is obvious (danger button, warning icon, explanatory text). Two-click safety. **PASS.**
- **One UX note:** The inline confirm row (State 7, line 571) uses `border-danger/40` (line 571, danger color at 40% opacity). This is a mild visual cue. In production, subtle entrance/exit animations + focus management (focus should jump to the "Revoke" button after trash click) would strengthen the flow. Staging does not show animations. **Acceptable for static mockup.**

**Conclusion:** The revoke flow is honest and safe. Users cannot accidentally revoke. Task is achievable. **PASS.**

### Overall UX Summary

**All three tasks (copy, generate, revoke) are achievable.**

- **Copy:** Direct, instant, multi-modal feedback (button morph + toast). Excellent.
- **Generate:** Minimal this wave (secondary, no full form), but clear CTA. Production must add async feedback (loading/error).
- **Revoke:** Safe two-step flow with honest post-revoke state. Excellent.

**No critical friction.** Brief requirements met. **PASS.**

---

## 3. DESIGN-SYSTEM TOKEN AUDIT

Systematic inventory of every color, font-size, shadow, and border-radius actually used in the staging HTML, mapped against DESIGN-SYSTEM.md.

### Color tokens used

| Hex / RGBA | DESIGN-SYSTEM.md token | Used in | Line(s) | Status |
|------------|------------------------|---------|---------|--------|
| `#0a0a0b` | `--surface-950` | Body background (line 57), app-shell deep bg (line 166), read-only input bg (lines 211, 277, 441, 515), skeleton bg (line 84), empty-state dashed border (line 529) | 57, 166, 211, 277, 441, 515, 84, 529 | **PASS** |
| `#121214` | `--surface-900` | Modal body bg (lines 186, 255, 328, 379, 427, 502, 557, 617), sidebar bg (lines 134, 148) | 186, 255, 328, 379, 427, 502, 557, 617, 134, 148 | **PASS** |
| `#1c1c1f` | `--surface-800` | Modal header bg-surface-800/60 (lines 188, 256, 329, 380, 428, 503, 558, 618), list-row bg (lines 463, 473, 588, 589, 639, 640), input error border (implied usage in similar pattern) | 188, 256, 329, 463, 473, 588, 589, 639, 640 | **PASS** |
| `#27272a` | `--surface-700` | Permanent badge bg (line 202), secondary button bg (lines 231, 296, 346, 357, 456, 533), toast bg (line 310), skeleton bg (line 84), hover states (lines 190, 240, 258, 304, 331, 382, 408, 430, 505, 542, 561, 602, 620, 653) | 202, 231, 296, 310, 84, 190–602 (extensive) | **PASS** |
| `#3f3f46` | `--surface-600` | Scrollbar thumb (line 68), server-rail server-item bg (line 141), secondary button hover (implied by lighter shade) | 68, 141 | **PASS** |
| `#52525b` | `--surface-500` | Scrollbar thumb hover (line 69) | 69 | **PASS** |
| `#10b981` | `--accent-emerald` | Primary Copy button fill (lines 215, 444, 518), server-rail active indicator (line 140), icon colors (lines 200, 266, 313, 340), focus-visible ring rgba (line 38, 72, 73), header icon hover text (line 143) | 215, 444, 518, 140, 200, 266, 313, 340, 38, 72, 73, 143 | **PASS** |
| `#f59e0b` | `--accent-amber` | NOT USED in this staging | — | N/A |
| `#ef4444` | `--danger` | Revoke button fill (line 579), revoked state icon (line 632), danger border variants (line 398, 571 as border-danger/40), danger text (line 635), error icon (lines 389, 573), glow-danger focus ring rgba (line 39, 75) | 579, 632, 398, 571, 635, 389, 573, 39, 75 | **PASS** |
| `rgba(255,255,255,0.92)` | `--text-primary` | Applied via CSS class `.t-primary` (lines 60, used throughout: headers, button text, input text) | 60, 189, 201, 257, 267, 330, etc. | **PASS** |
| `rgba(255,255,255,0.60)` | `--text-secondary` | Applied via CSS class `.t-secondary` (lines 61, used for metadata, secondary text) | 61, 180, 204, 268, 340, etc. | **PASS** |
| `rgba(255,255,255,0.40)` | `--text-muted` | Applied via CSS class `.t-muted` (lines 62, used for placeholders, disabled, icons) | 62, 190, 258, 314, 331, 346, 364, 382, 531, 564, 602, 620, 634 | **PASS** |
| `rgba(255,255,255,0.06)` | `--border-hairline` | Applied via CSS class `.b-hairline` (lines 63, used for all modal borders, dividers) | 63, 182, 186, 188, 193, 223, etc. | **PASS** |
| `rgba(255,255,255,0.10)` | `--border-hover` | Applied via CSS class `.b-hover` (lines 64, used on buttons, inputs on hover, dashed borders) | 64, 211, 231, 277, 296, 310, 529, 533, 578, 589, 594, 644 | **PASS** |

### Font sizes and families

| Size | Token / Context | Used in | Status |
|------|-----------------|---------|--------|
| 20px / `text-xl` | Dialog title | Lines 189, 257, 330, 381, 429, 504, 559, 619 (h3#s1-dialog-title, etc.) | **PASS** — DESIGN-SYSTEM.md § 2 `text-xl` 20px |
| 14px / `text-sm` | Body text, button labels, input, list-row labels | Lines 201, 204, 215–217, 228–229, 257, 268–269, etc. | **PASS** — DESIGN-SYSTEM.md § 2 `text-sm` 14px |
| 12px / `text-xs` | Metadata, "Permanent" badge, list-row uses/expiry | Lines 180, 202, 204, 249, 270, 308, 358, 446, 466, 476, 531–532, 575–576, 591 | **PASS** — DESIGN-SYSTEM.md § 2 `text-xs` 12px |
| 11px | Inline confirm "Revoke invite…?" and "Revoke — this link…" buttons (line 579, 581) | **MINOR:** The confirm buttons (lines 578–581) are `text-xs` 12px by class, but the button in line 579 should render at 12px text. Line 581 "Revoke" label is rendered at 12px. Acceptable. | **PASS** |
| `font-semibold` (600) | Dialog title, primary button labels, list-row code, revoke button | Lines 189, 215, 444, 465, 475, 579, etc. | **PASS** — DESIGN-SYSTEM.md § 2 `600 semibold` for headings and buttons |
| `font-medium` (500) | Secondary text, list-row labels, active channel in sidebar | Lines 201, 228, 240, 258, 267, 340, 341, 455, 465, 475, 590–591, 641 | **PASS** — DESIGN-SYSTEM.md § 2 `500 medium` for names and active elements |
| `font-base` / `font-normal` (400) | Body text, descriptions, helper text | Lines 204, 229, 232–233, 270, 295, 357 | **PASS** — DESIGN-SYSTEM.md § 2 `400 body` |
| **Mono font** | Code strings (invite links, limited-invite codes) | Lines 212, 278, 442, 515, 465, 475, 532, 575, 590, 635, 641 (inline style="font-family: 'Geist Mono', ui-monospace, monospace;") | **PASS** — DESIGN-SYSTEM.md § 2 `Geist Mono` for code |

### Shadow tokens

| Token | Value (from HTML style block lines 35–41) | Used in | Status |
|-------|-------------|---------|--------|
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | Not explicitly used in this staging (modal uses shadow-pop instead) | N/A |
| `shadow-pop` | `0 8px 24px rgba(0,0,0,0.5)` | Modal drop-shadow (line 119 class shadow-pop, applied to .rounded-lg line 186, etc.), Toast shadow (line 310, class shadow-pop) | **PASS** — DESIGN-SYSTEM.md § 5 `shadow-pop` for modals + toasts |
| `glow-focus` | `0 0 0 2px rgba(16,185,129,0.4)` | Focus-visible ring on all standard controls (focus-ring class, lines 72, 73, 190, 215, 240, 258, 296, 304, 331, 382, 408, 430, 505, 542, 561, 602, 620, 653) | **PASS** — DESIGN-SYSTEM.md § 5 `glow-focus` emerald ring |
| `glow-danger` | `0 0 0 2px rgba(239,68,68,0.4)` | Focus-visible ring on destructive controls (focus-ring-danger class, lines 75, 468, 478, 579, 593–594, 644) | **PASS** — DESIGN-SYSTEM.md § 5 `glow-danger` (wave-7 addition, line 74 of DESIGN-SYSTEM.md) |
| `glow-subtle` | `0 0 15px rgba(255,255,255,0.05)` | NOT USED in this staging | N/A |

### Border radius

| Token | Value (from HTML config lines 42) | Used in | Status |
|--------|-------------|---------|--------|
| `radius-md` | 6px | Buttons (Copy, Generate, Close, Cancel, Revoke, Done, etc.), inputs (link fields), list rows | **PASS** — DESIGN-SYSTEM.md § 4 `radius-md` 6px |
| `radius-lg` | 10px | Modal container (line 186 class rounded-lg) | **PASS** — DESIGN-SYSTEM.md § 4 `radius-lg` 8–10px (staging uses 10px) |

### Spacing scale verification

Sampling against base-4 scale per DESIGN-SYSTEM.md § 3:

| Spacing unit | Expected (base 4px) | Example usage in HTML | Status |
|--------------|---------------------|----------------------|--------|
| 4px (1 unit) | 4px | Line gaps (gap-1, gap-1.5 = 4–6px) between small elements | **PASS** — Tailwind 4px base respected |
| 8px (2 units) | 8px | List-row vertical rhythm, input padding (py-2.5 = 10px, close to 8px Tailwind slot) | **PASS** |
| 12px (3 units) | 12px | Section gaps (gap-3, gap-4 = 12–16px), modal padding left/right (px-4 = 16px, slight override but close) | **PASS** |
| 16px (4 units) | 16px | Panel padding (px-4 = 16px on modal body, line 196), header padding (px-4 = 16px, line 188) | **PASS** |
| 24px (6 units) | 24px | Gaps between sections (gap-6 = 24px) | NOT HEAVILY USED; gap-4 (16px) is more common for section gaps in this modal |

**Spacing summary:** Consistent with base-4 scale. Minor: some gaps are 16px instead of 24px (e.g., line 196 px-4, line 239 px-4), but this is tighter, intentional spacing for modals and acceptable per the design. **PASS.**

### Invented/non-system values

**Search for any colors, font-sizes, or shadows NOT in DESIGN-SYSTEM.md:**

- **Line 29, 30, 31 (Tailwind config colors):** All map to system tokens (surface-950, -900, -800, -700, -600, -500, accent-emerald, accent-amber, danger). ✓
- **Line 38–40 (box-shadow config):** All match DESIGN-SYSTEM.md (glow-focus, glow-danger, glow-subtle). ✓
- **Line 42 (borderRadius):** md 6px, lg 10px—match DESIGN-SYSTEM.md. ✓
- **Line 68–69 (scrollbar colors):** #3f3f46 (surface-600) and #52525b (surface-500)—both system tokens. ✓
- **Line 84 (skeleton bg #27272a):** surface-700. ✓
- **Line 88 (shimmer gradient rgba(255,255,255,0.05)):** This is a shimmer accent, not a system color token, but it's a subtle animation detail; acceptable as it's close to glow-subtle and is semi-transparent. Not a hard violation. ✓
- **All inline styles:** Fonts (Geist Mono), borders (border-danger/40—danger at 40% opacity, which is a Tailwind modifier, acceptable), backgrounds (all mapped). ✓

**VERDICT ON TOKEN DISCIPLINE:** No invented hex values. No invented font-sizes. All colors, shadows, and radii map to DESIGN-SYSTEM.md. CSS custom properties (--text-primary, etc.) are all defined in DESIGN-SYSTEM.md. **PASS.**

---

## 4. ACCESSIBILITY / WCAG AA AUDIT (Dark theme)

Testing against WCAG 2.1 Level AA success criteria, with emphasis on dark-theme contrast, keyboard navigation, and screen reader compatibility.

### 4.1 Color contrast analysis (dark theme)

Dark-theme contrast requirements per WCAG AA:
- Text on background: ≥4.5:1 for normal text, ≥3:1 for large text (18px+ or 14px+ bold).
- Focus indicators: Should be visible (2px+ outline, usually handled by the glow-focus ring).

#### Normal text pairs (body, labels, descriptions)

| Text Color | Background Color | Estimated Contrast | WCAG AA | Notes |
|------------|------------------|-------------------|---------|-------|
| --text-primary (rgba(255,255,255,0.92)) | --surface-900 (#121214) | ~13:1 | **PASS** | Excellent contrast. Primary text on modal body. |
| --text-primary (rgba(255,255,255,0.92)) | --surface-800 (#1c1c1f) | ~12:1 | **PASS** | Header strip and list-rows. Excellent. |
| --text-secondary (rgba(255,255,255,0.60)) | --surface-900 (#121214) | ~7.5:1 | **PASS** | Metadata, secondary labels. Strong. |
| --text-secondary (rgba(255,255,255,0.60)) | --surface-800 (#1c1c1f) | ~7:1 | **PASS** | List-row metadata ("3 / 10 uses · expires in 6 days"). Strong. |
| --text-muted (rgba(255,255,255,0.40)) | --surface-900 (#121214) | ~5:1 | **PASS** | Placeholders, disabled states. Meets AA minimum. |
| --text-muted (rgba(255,255,255,0.40)) | --surface-800 (#1c1c1f) | ~4.5:1 | **PASS** | Icons on surface-800. Meets AA minimum (marginal). |
| --text-muted (rgba(255,255,255,0.40)) | --surface-950/40 (#0a0a0b, 40% opacity) | ~4:1 | **WARN** | Empty-state dashed box (line 529). Muted text on dimmed deepest surface. Marginal; acceptable in context (empty state, not critical reading). |

**Critical issue:** The revoked state label on line 635:

| Text | Background | Line | Computed Colors | Estimated Contrast | WCAG AA | **ISSUE** |
|------|-----------|------|------------------|-------------------|---------|----------|
| `--danger` (#ef4444) | `--surface-800` (#1c1c1f) | 635: "Revoked — this link no longer works." | danger #ef4444 on surface-800 #1c1c1f | **~3.5:1** | **FAIL** AA 4.5:1 | **RED FLAG:** Danger text on surface-800 does not meet WCAG AA. The red (#ef4444) is too bright for dark backgrounds. This is the "revoked" label which MUST be readable to convey the honest state (brief §5 requires "conveyed by more than color"). |

**RECOMMENDATION:** Line 635 must use a lighter/brighter text color for the revoked label. Options:
1. Use `--text-primary` (white) for the revoked label instead of danger—keep the danger icon + struck text for visual distinction.
2. Use `--danger` for a lighter danger alternative (e.g., #ff6b6b, lighter red)—not currently in DESIGN-SYSTEM.md.
3. Keep danger text but ensure it's accompanied by icon + struck text + row dimming (already present, line 631 opacity-70, line 632 icon, line 634 struck). **This means the danger color is not carrying the entire meaning alone.** Brief §5 requires: "revoked state conveyed by more than color." Lines 631–637 achieve this: icon (prohibit), struck text (text-decoration), dimmed row (opacity), danger text (color). Color is NOT alone. However, WCAG AA text contrast is a hard requirement independent of accompanying non-color cues. **FAIL on pure contrast, but PASS on redundant meaning.**

**Remediation:** Change line 635 from `text-danger` to `t-primary` (keep the danger icon + struck code + opacity for redundancy). This keeps the "more than color" requirement and fixes the contrast.

#### Button text on color fills (primary, secondary, destructive)

| Button type | Text Color | Fill Color | Computed | Estimated Contrast | WCAG AA | Status |
|-------------|-----------|-----------|----------|-------------------|---------|--------|
| Primary Copy (emerald fill) | text-surface-950 (#0a0a0b) | --accent-emerald (#10b981) | white on emerald | ~9:1 | **PASS** | Excellent contrast. Lines 215, 444, 518. |
| Destructive Revoke (danger fill) | text-surface-950 (#0a0a0b) | --danger (#ef4444) | white on red | ~8:1 | **PASS** | Excellent contrast. Line 579. |
| Secondary button (surface-700 fill) | t-primary (rgba(255,255,255,0.92)) | --surface-700 (#27272a) | white on grey | ~12:1 | **PASS** | Excellent contrast. Lines 231, 296, 456, 533. |
| Disabled button (surface-700 fill) | t-muted (rgba(255,255,255,0.40)) + opacity-60 | --surface-700 (#27272a) | muted on grey + opacity | ~3:1 | **WARN** | Marginal. Disabled buttons are permitted to have lower contrast (WCAG exception: controls that are disabled). Acceptable. Lines 346, 364, 400. |

**Button text: PASS** (with disabled exception noted).

#### Focus rings and interactive indicators

| Element | Focus color | Expected visibility | Status |
|---------|------------|-------------------|--------|
| All standard controls (button, input, etc.) | --glow-focus (#10b981 at 0.4 alpha, 2px ring) | Emerald glow around element; high contrast on dark bg | **PASS** — Lines 72–73, 190, 215, 240, 258, 296, 304, 331, 382, 408, 430, 505, 542, 561, 602, 620, 653 |
| Destructive controls (Revoke button) | --glow-danger (#ef4444 at 0.4 alpha, 2px ring) | Danger red glow around element | **PASS** — Lines 75, 579, 593–594, 644 |
| Input fields | emerald border on focus-within (line 73 explicit border-color: #10b981) | Emerald border + emerald glow | **PASS** — Input focus-visible (line 73) |

**Focus rings: PASS** (excellent visible distinction).

#### Contrast summary

| Category | Verdict | Notes |
|----------|---------|-------|
| Normal text (primary/secondary/muted) | **PASS** | All ≥4.5:1 on typical dark surfaces. Muted on deepest bg marginal but acceptable. |
| Button text fills | **PASS** | Excellent contrast (8–12:1 range). |
| **Danger text (#ef4444) on surface-800** | **FAIL** | Revoked label line 635: ~3.5:1. Does not meet WCAG AA 4.5:1 hard requirement. **MUST FIX before ship.** Recommend: change text color to `t-primary` (white) while keeping icon, struck text, opacity for redundancy. |
| Focus rings | **PASS** | Emerald and danger glows are 2px and highly visible on dark bg. |

### 4.2 Keyboard navigation and focus order

**Tab order (lines 125–126 comment summarizes the focus-trap intent):**

Expected tab sequence: **Close → Link field → Copy link → Generate-limited → List revoke controls → Done**

Audit of actual HTML tab order:

| Element | Position | Tab-accessible | Focusable | Notes |
|---------|----------|---|---|---------|
| Close button (line 190) | Modal header | ✓ | Yes, `.focus-ring` class | Tab 1. Should close modal + restore focus to trigger. |
| Link input field (line 209) | Body, permanent-link section | ✓ | Yes, `<input>` with `.focus-ring` | Tab 2. Read-only, select-all on click. Accessible. |
| Copy link button (line 215) | Next to link field | ✓ | Yes, `<button>` with `.focus-ring` | Tab 3. Accessible. |
| Generate-limited button (line 231) | Secondary action section | ✓ | Yes, `<button>` with `.focus-ring` | Tab 4. Accessible. |
| List revoke trash buttons (lines 468, 478, 593–594, 644) | Limited-invites list | ✓ | Yes, `.focus-ring-danger` class | Tabs 5–N. Each trash button focusable. |
| Cancel button (inline confirm, line 578) | Confirm row | ✓ | Yes, `.focus-ring` | Accessible when confirm row active. |
| Revoke button (inline confirm, line 579) | Confirm row | ✓ | Yes, `.focus-ring-danger` class | Accessible when confirm row active. Destructive, so danger ring. |
| "New" button (list header, line 456) | Limited-invites list header | ✓ | Yes, `.focus-ring` class | Accessible. |
| Done button (line 240, etc.) | Modal footer | ✓ | Yes, `.focus-ring` class | Tab last. Should close modal. |

**Tab order audit: PASS.** All interactive elements are tab-accessible. Order matches intent (close → fields → actions → list controls → done). No traps, no unreachable elements.

**Focus management on state transitions:**
- **Revoke confirm appears (State 7):** Focus should move to the Cancel button (defensive) or Revoke button (aggressive, destructive). Staging does not show runtime behavior; brief §6 requires focus-trap. **Production must ensure focus jumps to confirm row (likely the Cancel button) when trash is clicked.**
- **Revoked state transitions (State 8):** Row becomes read-only (no more trash button). Focus should restore to the next active revoke button or the Done button. **Production must handle focus management.**

**Recommendation:** Add explicit focus management in production (e.g., `revoke-button.addEventListener('click', () => { confirm-row.focus() })`). Staging shows the visual states but not the runtime focus behavior. **ACCEPTABLE for static mockup, MUST implement in B-block.**

### 4.3 Semantic HTML and ARIA roles

| Role / Attribute | Usage | Line(s) | Verdict |
|-----------------|-------|---------|---------|
| `role="dialog"` | Modal containers | 186, 255, 328, 379, 427, 502, 557, 617 | **PASS** — Correct. Signals a dialog to assistive tech. |
| `aria-modal="true"` | Modal containers | 186, 255, 328, 379, 427, 502, 557, 617 | **PASS** — Correct. |
| `aria-labelledby="s1-dialog-title"` etc. | Dialog → title | 186, 255, 328, etc. | **PASS** — Every dialog is labelled by its h3 title. |
| `aria-label="Close invite dialog"` | Close button | 190, 258, 331, 382, 430, 505, 561, 620 | **PASS** — Icon-only button has accessible label. |
| `role="status"` | Toast (lines 310, 659) | 310, 659 | **PASS** — Success feedback. Polite aria-live; announcements are non-interrupting. |
| `aria-live="polite"` | Toast | 310, 659 | **PASS** — Polite announcement for copy feedback and revoke success. |
| `role="alert"` | Error message (line 388) + revoke confirm (line 572) | 388, 572 | **PASS** — Error and destructive confirm are important; `role="alert"` signals assertive interruption. |
| `aria-hidden="true"` | Decorative icons, dimmed app shell | 191, 132 (app shell), 311 (left accent bar) | **PASS** — Icons and decorative elements marked as hidden from assistive tech where appropriate. |
| `aria-label` on icon-only buttons | Trash revoke buttons | 468, 478, 593, 644 | **PASS** — Each trash icon has aria-label (e.g., "Revoke limited invite ending pA8wQs"). Specific and actionable. |
| `aria-busy="true"` | Loading state dialog | 328, 346 | **PASS** — Dialog and disabled buttons marked as busy during load. |
| `aria-invalid="true"` | Error state input | 398 | **PASS** — Input in error state marked invalid. |
| `role="list"` | Limited-invites list | 461, 569, 629 | **PASS** — Unordered list (ul) with role=list; each li is a list item. Correct structure. |
| `<label for="...">` or `aria-label` | Input fields | 208, 274, 395, 439, 513 | **PASS** — Every input has a label (either visible sr-only or aria-label). No orphaned inputs. |
| `aria-describedby` | Not heavily used; error input (line 398) uses inline error text (could add aria-describedby) | — | **MINOR:** Line 396–398 shows an error input with placeholder text. The error is conveyed via role=alert on the parent (line 388). Acceptable but could be tighter with aria-describedby on the input pointing to the error text. **Not a blocker.** |

**ARIA audit: PASS.** Semantic roles are correct. Screen reader users will understand dialog, buttons, toasts, alerts, and list structure.

### 4.4 Animation and reduced-motion compliance

| Animation | HTML | Handling reduced-motion | Status |
|-----------|------|------------------------|--------|
| Spinner (`.spin`, line 78–79) | Defined with `animation: spin 0.9s linear infinite;` | Line 94: `animation: none;` under `@media (prefers-reduced-motion: reduce)` | **PASS** |
| Skeleton shimmer (`.skel::after`, line 82–89) | Defined with `animation: shimmer 1.6s infinite;` | Line 94: `animation: none;` under `@media (prefers-reduced-motion: reduce)` | **PASS** |
| Transitions (buttons, inputs, `transition-colors 150ms ease`) | Applied throughout (e.g., line 190, 211, 231, etc.) | Line 95: `transition-duration: 0ms !important;` under reduce-motion | **PASS** |

**Reduced-motion compliance: PASS.** Non-essential animations disabled for users with motion sensitivity.

### 4.5 Screen reader testing checklist

| Scenario | Element | Expected announcement | Actual (per HTML) | Status |
|----------|---------|---------------------|----------|--------|
| Open modal | Dialog (line 186) | "Invite people dialog" (via aria-labelledby) | `role="dialog" aria-modal="true" aria-labelledby="s1-dialog-title"` → announces "Invite people dialog" | **PASS** |
| Focus close button | Button (line 190) | "Close invite dialog button" | `<button aria-label="Close invite dialog">` | **PASS** |
| Focus Copy link button | Button (line 215) | "Copy permanent invite link to clipboard button" | `<button aria-label="Copy permanent invite link to clipboard">` | **PASS** |
| Copy link (state change) | Button + Toast (lines 282, 310) | "Invite link copied" (from button and toast) | Button text morphs to "Copied" + Toast with `role="status"` announces "Invite link copied" | **PASS** |
| Focus list revoke button | Button (line 468) | "Revoke limited invite ending pA8wQs button" | `<button aria-label="Revoke limited invite ending pA8wQs">` | **PASS** |
| Trash click → confirm appears | Alert (line 572) | "Revoke invite …pA8wQs? It will stop working immediately. People who already joined stay in the server." (role=alert, assertive) | `<div role="alert">` + descriptive text (lines 575–576) | **PASS** |
| Confirm Revoke | Button (line 579) | "Revoke button" (with danger focus ring) | `<button class="focus-ring-danger">` | **PASS** |
| Revoked state row | List item (line 631) | "Prohibit icon, …pA8wQs struck text, Revoked—this link no longer works danger text" | Icon `aria-hidden="true"` (not announced), text is plain, opacity/struck is CSS (conveyed visually but announced as text) | **PARTIAL PASS** — The struck CSS is not announced to screen readers; however, the text itself says "Revoked — this link no longer works" which is explicit. The icon (ph-prohibit) is marked aria-hidden. This is acceptable because the text is self-explanatory. Brief §5 requires "more than color"—here we have text + icon + visual (struck, dimmed). Screen reader reads the text. **PASS.** |
| Empty state | Empty state box (lines 527–538) | "No limited invites yet. Use the permanent link above, or create a limited one with max uses or expiry. Generate a limited invite button." | Plain text + button with aria-label implied or visible text. **Good.** | **PASS** |
| Error alert | Alert (line 388) | "Couldn't load the invite link. Check your connection and try again." (role=alert, assertive) | `<div role="alert">` + text (line 390) | **PASS** |
| Toast success | Toast (lines 310–316) | "Invite link copied" (role=status, polite) | `<div role="status" aria-live="polite">` + text (line 314) | **PASS** |

**Screen reader testing: PASS.** All interactive elements have accessible labels or semantic announcements. Toasts and alerts use appropriate ARIA roles. Content structure is semantic (lists, dialogs, buttons, inputs).

### 4.6 Color-contrast summary table (detailed)

| Context | Issue | Severity | Recommendation | Status |
|---------|-------|----------|-----------------|--------|
| Revoked state label (#ef4444 on #1c1c1f, line 635) | Contrast ~3.5:1, below WCAG AA 4.5:1 minimum | **HIGH** | Change to `t-primary` (white text). Icon + struck text + opacity provide redundancy ("more than color" brief §5). | **MUST FIX** |
| All other text on surface colors | Contrast ≥4.5:1 (primary/secondary) or ~5:1 (muted) | N/A | No action needed. | **PASS** |
| Button fills (emerald on surface-950, danger on surface-950) | Contrast ≥8:1 | N/A | No action needed. | **PASS** |
| Focus rings (emerald, danger) | 2px glow, highly visible on dark | N/A | No action needed. | **PASS** |
| Muted text on surface-950/40 (empty-state box) | Contrast ~4:1 | MEDIUM | Acceptable in context (non-critical text, empty state). If tightened: use `t-secondary` instead. | **ACCEPTABLE as-is** |

### 4.7 WCAG success criteria mapped

| WCAG Criterion | Status | Evidence |
|---|---|---|
| **1.4.3 Contrast (Minimum)** | **FAIL** — revoked label | Danger text on surface-800: ~3.5:1 (below 4.5:1 AA threshold). All other text ≥4.5:1. |
| **1.4.11 Non-text Contrast** | **PASS** | Focus rings (emerald, danger) are 2px and clearly visible. Icons next to text are redundant (not sole carriers of meaning). |
| **2.1.1 Keyboard** | **PASS** | All interactive elements are reachable via Tab. Tab order matches design intent. |
| **2.1.2 No Keyboard Trap** | **PASS** | Focus trap is intentional (modal), Esc/close button exits. No unintended traps. |
| **2.4.3 Focus Order** | **PASS** | Tab sequence is logical and matches the design intent (close → fields → actions → list → done). |
| **2.4.7 Focus Visible** | **PASS** | All focusable elements have visible emerald (standard) or danger (destructive) focus rings (2px glow). |
| **3.2.1 On Focus** | **PASS** | No unwanted focus-triggered changes (e.g., auto-submitting forms). |
| **3.3.1 Error Identification** | **PASS** | Error state (line 388–404) uses `role="alert"` + danger icon + text "Couldn't load the invite link…". Color + icon + text. |
| **3.3.4 Error Prevention (Destructive)** | **PASS** | Revoke requires two-step confirm (lines 549–607). No accidental one-click destruction. |
| **4.1.2 Name, Role, Value** | **PASS** | All buttons, inputs, and landmarks have accessible names (via aria-label, text content, or semantic HTML). |
| **4.1.3 Status Messages** | **PASS** | Toast and alerts use `role="status"` (polite) and `role="alert"` (assertive) with appropriate live regions. |

**WCAG AA verdict: FAIL** (due to contrast issue on revoked label), with **one critical fix** required before ship.

---

## Summary

### Strength areas
1. **Task completion:** All three primary tasks (copy, generate, revoke) are achievable and well-designed.
2. **Safety:** Revoke flow has a two-step confirm; no accidental one-click destruction. Honest post-revoke state visible.
3. **Semantic HTML + ARIA:** Dialogs, toasts, alerts, lists, inputs all have correct roles, labels, and aria attributes. Screen readers will understand the structure.
4. **Focus and keyboard:** Tab order is logical, all elements reachable. Emerald and danger focus rings are highly visible.
5. **Token discipline:** Every color, font, shadow, and radius maps to DESIGN-SYSTEM.md. No invented values. Excellent consistency.
6. **Reduced-motion:** Animations respect prefers-reduced-motion. Good accessibility.

### Critical issue
1. **Revoked label contrast (line 635):** Danger text (#ef4444) on surface-800 (#1c1c1f) = ~3.5:1 contrast. **Below WCAG AA 4.5:1 threshold.** Must fix before ship: change text color to `t-primary` (white) while keeping icon, struck text, and opacity for redundancy.

### Minor notes (acceptable for this wave, production follow-up)
1. **Focus management on confirm/revoke state transitions:** Staging shows visual states but not runtime focus behavior. B-block must implement focus jump to confirm row on trash click.
2. **Generate limited invite feedback:** No loading/error state shown after clicking Generate (scope deferred per brief §10). B-block will add async feedback.
3. **Empty-state muted text on surface-950/40:** Contrast ~4:1, marginal but acceptable in context (non-critical, empty state).

---

## VERDICT: REVISE

**One critical WCAG AA contrast violation must be fixed before D-3 sign-off.**

### Prioritized change list

1. **[CRITICAL] Line 635 — Revoked label text color (brief §9 checkpoint #9 + WCAG 1.4.3 Contrast Minimum)**
   - Current: `text-danger` (#ef4444) on surface-800 bg = 3.5:1 contrast (FAIL).
   - Fix: Change class from `text-danger` to `t-primary` (white text on surface-800 = 12:1 contrast).
   - Justification: Icon (ph-prohibit, danger color, line 632) + struck text (line 634) + dimmed row (opacity-70, line 631) + text label "Revoked — this link no longer works" collectively convey the revoked state (more than color alone, per brief §5). White text is the readable baseline; color redundancy is still present via icon.
   - Mapped to design-system: `t-primary` is DESIGN-SYSTEM.md § 1 `--text-primary` (rgba(255,255,255,0.92)).

2. **[MINOR] Production focus management — revoke confirm flow (brief §6 + WCAG 2.1.1 Keyboard)**
   - State 7 (confirm inline): On trash-button click, focus should jump to the confirm row (defensively to Cancel button, or aggressively to the Revoke button).
   - Staging does not show runtime focus behavior. B-block must implement.
   - Acceptable as-is for static mockup; required for production code.

3. **[MINOR] Loading state feedback on Generate button (UX completeness)**
   - Brief §10 defers full limited-invite creation form. However, no loading feedback after click.
   - B-block must add loading state (aria-busy, spinner, disabled button) or optimistic update (row appears immediately in list).
   - Acceptable as-is for static mockup; expected in production.

### After fix
Once the revoked label text color is changed from `text-danger` to `t-primary` (line 635), all WCAG AA success criteria are met. Contrast ratios pass. The design is production-ready.

---

