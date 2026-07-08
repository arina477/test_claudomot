# D-3 Design Review — E2E DM Encryption Status Indicator
**Reviewer:** Reviewer A (plan-design-review substitution per review-gate.md precedent)
**Artifact:** `/home/claudomat/project/design/staging/e2e-indicator.html`
**Brief:** `process/waves/wave-79/stages/D-1-brief/e2e-indicator-brief.md`
**Token source:** `design/DESIGN-SYSTEM.md`
**Context:** FRESH — no prior round or other reviewer findings consulted.
**Method:** Static HTML + script read only. No browser automation.

---

## Fail-Closed Load-Bearing Assessment

Evaluated first. Overrides all aesthetic scoring. A lock/shield "encrypted" affordance may appear ONLY when a message or conversation is provably end-to-end encrypted.

**Static markup — all six states inspected:**

| State | Glyph | Lock/shield rendered? | Pass/Fail |
|---|---|---|---|
| State 1 — Encrypted (lines 152–166) | `ph-fill ph-shield-check`, emerald filled | YES — correctly, only here | PASS |
| State 2 — Plaintext Fallback (lines 169–184) | `ph ph-lock-open`, outline, secondary | No closed lock. Open icon signals NOT secured | PASS |
| State 3 — Group DM (lines 186–201) | `ph ph-shield-slash`, outline, secondary | Slashed shield = absent/disabled. Not an encryption affordance | PASS |
| Key fetch error alias (lines 203–218) | `ph ph-lock-open`, outline, secondary — renders identical to State 2 | No lock | PASS |
| State 4 — Cannot Decrypt (lines 220–236) | `ph ph-key`, outline, secondary | No lock or shield | PASS |
| State 5 — Loading (lines 238–253) | `ph ph-circle-notch animate-spin`, outline, secondary | No lock or shield | PASS |

**JS state-machine — `simulateKeygen()` (lines 454–481):**

Line 466 forces the loading state: surface-700 pill, `ph ph-circle-notch animate-spin`, label "Establishing..." — no lock, no shield. After a 2000ms `setTimeout` (lines 473–479) the function resolves to the encrypted state: `ph-fill ph-shield-check` emerald, label "End-to-end encrypted." The transition is strictly unidirectional; the lock/shield can only appear after the simulated proof event fires. There is no intermediate frame, no race condition, and no fallback branch that would render the shield during loading.

**Context panel (lines 333–351):** The DM thread header hardcodes State 1 for the spatial-context demo. This is correct for a staging mockup showing the primary case in context. `simulateKeygen()` targets only `#demo-loading-badge` in the left audit column and does not mutate the context panel header.

**FAIL-CLOSED CRITERION: PASS.** No padlock or shield-check renders over any plaintext, group DM, loading, or cannot-decrypt state in any static variant or JS code path. No automatic REVISE/REJECT is triggered.

---

## Dimension Scores

### 1. Visual Hierarchy — 9 / 10

The encrypted badge (State 1, line 159) achieves calm-affirmative hierarchy through three layered signals: emerald 10% tint fill, emerald/20 hairline border, and the filled `ph-shield-check` glyph. This reads as "confirmed" without being loud — consistent with the brief's §1 framing of this as an "anti-security-theater surface." All non-encrypted states use the uniform `--surface-700` fill with `--border-hairline` and the `--text-secondary` stroke, deliberately receding into the chrome. The hierarchy progression (emerald pill → grey pill → quiet grey micro-affordance) cleanly maps to "confirmed / unconfirmed / advisory."

The per-message micro-affordances at lines 402–405 (State 2, plaintext) and 427–430 (State 4, cannot-decrypt) correctly use the identical `mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]` weight as the brief §8 "same slot, same weight" instruction requires. The cannot-decrypt message row usefully adds `opacity-60` on the avatar and name (lines 412, 415) to signal content unavailability at the row level, then the micro-affordance provides the specific label — this layering is effective.

One point withheld: in the left audit column, State 4 (cannot-decrypt) uses an identical pill appearance to States 2, 3, and the key-fetch error alias (same surface-700 fill, same border, same text-secondary token). The only differentiator is the `ph-key` glyph and the label "No key on this device." For the audit matrix's purpose of proving distinct states, a brief §3 note distinguishing States 2/3/error (all "not encrypted") from State 4 ("message exists but cannot be opened here") would aid reviewer comprehension at a glance. This is a demo-layout concern, not a shipped-component flaw.

### 2. Spacing Rhythm — 9 / 10

Badge padding `px-3 py-1.5` is applied consistently at lines 159, 176, 193, 210, 245 — this matches brief §4's specification and mirrors the ConnectionStateIndicator prior-art from `direct-messages.html:326`. The icon-to-label gap is `gap-2` on header badges and `gap-1.5` on per-message micro-affordances (lines 402, 427) — correct per brief §4 ("gap-2/gap-1.5 between dot/glyph and label"). Tooltip inner padding is `p-3` / 12px (line 79), width `280px` (line 76), matching the Tooltip/Popover primitive in DESIGN-SYSTEM.md §8. All values are on the 4px base-unit grid from DESIGN-SYSTEM.md §3.

One point withheld for the `antialiased;` declaration on line 58 inside the `body` CSS block. This is not a valid CSS property — it is a Tailwind utility class name mistakenly placed in raw CSS. Valid CSS requires `-webkit-font-smoothing: antialiased; moz-osx-font-smoothing: grayscale;`. The staging file is the reference artifact B-3 will read; a syntactically invalid CSS property in the reference is a handoff fidelity issue. It does not affect the indicator's spacing or layout, but it represents slippage in the deliverable's technical polish.

**Change to reach 10 (CR-1):** Replace line 58 (`antialiased;`) with `-webkit-font-smoothing: antialiased; moz-osx-font-smoothing: grayscale;`. (DESIGN-SYSTEM.md §2 — Geist rendering fidelity; CSS hygiene in the staging artifact.)

### 3. Brand Coherence — 10 / 10

All `:root` custom property values at lines 22–51 reproduce the exact tokens from DESIGN-SYSTEM.md §1: `--surface-950: #0a0a0b`, `--surface-900: #121214`, `--surface-800: #1c1c1f`, `--surface-700: #27272a`, `--accent-emerald: rgb(16,185,129)` (equivalent to `#10b981`), `--accent-amber: #f59e0b`, `--danger: #ef4444`, radius and shadow tokens — all match. No invented hex values appear anywhere in badge, pill, label, or icon rendering; every color reference goes through `var(--...)` or the Tailwind `[var(--...)]` escape.

The `--danger` token is declared at line 40 but never consumed in any status badge — it appears only as a root variable. This is consistent with brief §4's explicit instruction: "Named here only to forbid it." No red tint appears on any non-encrypted state. No amber appears in the indicator at all (correct — amber belongs to warnings/reconnecting, per DESIGN-SYSTEM.md semantic mappings).

Icon choices: `ph-fill ph-shield-check` (encrypted — filled per DESIGN-SYSTEM.md §7 "filled variants only for active/selected states"), `ph-lock-open` (plaintext fallback), `ph-shield-slash` (group DM), `ph-key` (cannot-decrypt), `ph-circle-notch` (loading). All are real Phosphor glyph names. All appear in brief §4's approved list and brief §9's gate criterion. The filled variant is used only for State 1 — correct; all other states use the regular `ph` prefix (line weight, outline).

The design is dark-only: `<html lang="en" class="dark">` on line 2; no light-mode conditional paths exist anywhere in the file. The academic calm is maintained throughout — no bouncy animation, no cutesy affordance, no neon.

### 4. Edge-Case Handling — 8 / 10

**Correctly handled:**
- All six brief §3 states are rendered in the left audit column.
- The key-fetch error alias is explicitly documented (lines 203–218) as aliasing to State 2 visually, with a distinct tooltip explaining the cause. This satisfies brief §7's fail-closed default for errors.
- The `simulateKeygen()` JS correctly models the Loading → Encrypted transition without any intermediate lock flash.
- Reduced-motion guard at lines 111–121 suppresses all transitions and the `ph-circle-notch` spinner with `!important` overrides — correct per brief §6 and DESIGN-SYSTEM.md §6.
- Tooltip hover delay of 400ms (line 100) matches brief §6 and DESIGN-SYSTEM.md §8 Tooltip spec. Instant-on-focus behavior (lines 103–108) matches brief §6.
- The state-fade CSS class (line 131) applies a 200ms transition on background-color, border-color, and color — matching brief §6 and DESIGN-SYSTEM.md §6 ("200ms color fade between states").

**Two items preventing a higher score:**

1. **States 4 and 5 use `--text-secondary` where brief §4 specifies `--text-muted`.** Brief §4 assigns `--text-muted` (rgba(255,255,255,0.40)) to both cannot-decrypt-on-this-device and loading/establishing. The design uses `--text-secondary` (rgba(255,255,255,0.60)) for both (lines 228, 245). The design's choice is the *correct* accessibility decision (see Accessibility dimension below — `--text-muted` on `--surface-700` computes ~2.51:1, failing WCAG AA 4.5:1), but it constitutes an undocumented deviation from the brief. The B-3 implementer reading both documents simultaneously will face a contradiction. The deviation is correct and should be retained, but it requires explicit reconciliation documentation.

2. **`aria-live` scope is too broad.** The `role="status"` and `aria-live="polite"` attributes sit on the outer `.tooltip-trigger` wrapper div (lines 158, 175, 192, 209, 227, 244) which contains both the pill and the `.tooltip-content` div. The tooltip text lives inside this live region, meaning that tooltip appearance on hover will trigger a polite screen-reader announcement in addition to the intended state-change announcement. Brief §6 specifies the live region for state-change announcements specifically; the tooltip is a separate concern that should not enter the live region.

**Changes to reach 10 (CR-2, CR-3):**

- CR-2: Add a reconciliation note to the B-3 handoff document (or as an HTML comment at lines 220–236 and 238–253) explicitly stating that States 4 and 5 implement `--text-secondary` rather than `--text-muted` per brief §4, with the WCAG AA contrast rationale. Measurable: no ambiguity in the B-3 implementation contract. (Brief §4 / DESIGN-SYSTEM.md §1 contrast discipline.)

- CR-3: Move `role="status"` and `aria-live="polite"` from the outer `.tooltip-trigger` wrapper to the inner pill container `<div>` (the element whose classes change on state transitions). The tooltip element should be outside the live region, associated via `aria-describedby` pointing to the tooltip's `id`. Measurable: the element carrying `aria-live="polite"` contains no `.tooltip-content` child. (Brief §6 / DESIGN-SYSTEM.md §8 ConnectionStateIndicator a11y — "state in text, not color alone.")

### 5. Accessibility — 8 / 10

**Correctly implemented:**
- `role="status" aria-live="polite"` on all live-updating badge wrappers.
- Keyboard-reachable tooltips via `tabindex="0"` on all `.tooltip-trigger` wrappers.
- Focus-visible emerald ring on all interactive and focusable elements: `focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]` matching `--glow-focus` (DESIGN-SYSTEM.md §5).
- All utility icon buttons carry `aria-label` (lines 358–363).
- Avatar `<img>` elements have descriptive `alt` text (lines 319, 380, 412).
- `role="tooltip"` on all tooltip content divs (lines 163, 180, 197, 214, 232, 249).
- `role="article"` on all message rows (lines 379, 392, 411).
- `role="status"` with `aria-label` on all narrow-viewport icon-only badges (lines 266, 274, 282, 290, 298).
- Colour-independence: each state is distinguishable by glyph shape AND label text without colour. Shield-check (filled) vs lock-open (outline) vs shield-slash (outline) vs key (outline) vs circle-notch (spinning) — all distinct shapes in grayscale.

**WCAG AA contrast audit:**

| Element | Effective token | Approx. rendered color | Background | Ratio | Result |
|---|---|---|---|---|---|
| State 1 label (`--text-primary`) | rgba(255,255,255,0.92) | ~#ebebeb | ~#162b26 (surface-900 + emerald/10 tint) | >14:1 | PASS |
| State 2/3 label (`--text-secondary`) | rgba(255,255,255,0.60) | ~#999999 | #27272a (surface-700) | ~5.46:1 | PASS |
| State 4/5 label (`--text-secondary`, as implemented) | rgba(255,255,255,0.60) | ~#999999 | #27272a (surface-700) | ~5.46:1 | PASS |
| `--text-muted` (IF brief §4 were followed literally) | rgba(255,255,255,0.40) | ~#666666 | #27272a (surface-700) | ~2.51:1 | FAIL — brief §4 instruction is non-compliant; design's override is correct |
| Per-message label (`--text-secondary`) on canvas | rgba(255,255,255,0.60) | ~#999999 | #1c1c1f (surface-800) | ~5.87:1 | PASS |
| Emerald icon (`--accent-emerald`) on emerald/10 tint | #10b981 | #10b981 | ~#162b26 (composited) | ~4.55:1 | MARGINAL — just above 4.5:1 floor |

All label text passes WCAG AA. The emerald icon on its tinted background is marginal (~4.55:1 on surface-900; drops to ~4.47:1 on surface-800 if the badge is placed over the canvas background). Brief §9 sets the gate criterion at ≥4.5:1; the margin is thin enough to fail under sub-pixel rendering variation or surface context shift.

**Two items preventing a score of 10:**

1. The `aria-live` scope issue (detailed in CR-3 above) — tooltip text entering the polite live region on hover may generate extraneous announcements.

2. The emerald icon contrast is marginal. When the context panel places the badge over `--surface-800` rather than `--surface-900` (the badge sits in the `--surface-900` header, which is correct — but the reviewer cannot confirm the component's production context will always be surface-900), the ratio could slip below threshold.

**Changes to reach 10:**

- CR-3 (same as Edge-Cases): Scope `aria-live` to the inner pill container only. (Brief §6.)

- CR-4: Verify in the B-3 component spec that the State 1 badge always renders on `--surface-900` (the DM thread header background). If any context places it on `--surface-800` or lighter, the emerald icon tint must be bumped from `rgba(16,185,129,0.1)` to `rgba(16,185,129,0.15)` to hold the contrast floor above 4.5:1 across all surfaces. Document the verified ratio in the handoff. (Brief §9 gate criterion / DESIGN-SYSTEM.md §1 contrast discipline.)

### 6. Responsive Behavior — 7 / 10

**Correctly implemented:**
- The left audit column and right spatial context use `grid-cols-1 lg:grid-cols-[400px_1fr]` (line 140) — stacks correctly at narrow widths.
- The narrow-viewport icon-only section (lines 261–306) demonstrates all five states at `w-11 h-11` (44×44px) with centered tooltips — correct touch target size and correct tooltip centering per brief §5.
- The label inside the full pill uses `hidden lg:inline` (line 336) — text is hidden below 1024px and shown at ≥1024px. Correctly matches brief §5's "label collapses at 1024."

**Two items preventing a higher score:**

1. **Breakpoint mismatch in the DM context panel header.** The full pill wrapper uses `hidden md:block` (line 333) and the icon-only fallback uses `md:hidden` (line 344). Tailwind `md:` = 768px. This means: below 768px → icon-only 44px button; 768–1023px → full pill shown (but label still hidden via `hidden lg:inline`); ≥1024px → full pill with label. Brief §5 specifies the collapse to icon-only at ≤1024, not ≤768. The practical effect is that between 768–1023px, the user sees a full pill (with icon only, since the label is `hidden lg:inline`) rather than the 44px icon-only touch target — the pill at that size is rendered but without a label, creating an intermediate presentation not specified in the brief. The left audit column's narrow-viewport section correctly sizes at 44px, but the actual DM context header does not match this behavior until <768px. The breakpoints should be `hidden lg:block` / `lg:hidden` to align with brief §5.

2. **Narrow-viewport header fallback (lines 344–351) lacks tooltip content.** The `md:hidden` icon-only badge in the DM context header panel has a tooltip-trigger wrapper but no `.tooltip-content` child. Brief §5 explicitly requires "tooltip on tap/focus" for the narrow glyph-only variant. A user tapping or focusing the icon-only badge in the context panel gets no explanation.

**Changes to reach 10 (CR-5, CR-6):**

- CR-5: In the DM context panel header, change line 333 from `hidden md:block` to `hidden lg:block` and line 344 from `md:hidden` to `lg:hidden`. This aligns the full-pill / icon-only switch point with brief §5's 1024px breakpoint. The `hidden lg:inline` on the label span (line 336) stays unchanged. Measurable: at a 900px viewport, the icon-only 44px button renders (not the unlabeled full pill). (Brief §5 / DESIGN-SYSTEM.md §9 breakpoint table: 1024 = desktop compact minimum.)

- CR-6: Add a `.tooltip-content` child inside the narrow-viewport icon-only badge wrapper in the context panel (lines 344–351) with the same plain-language text as the desktop badge tooltip for State 1: "Messages in this conversation are end-to-end encrypted — only you and Dr. Aris Thorne can read them." In the production component, this tooltip content must be state-driven. Measurable: hovering or focusing the narrow badge reveals an explanation tooltip. (Brief §5 — "tooltip on tap/focus.")

---

## Summary Table

| Dimension | Score | Status |
|---|---|---|
| Visual Hierarchy | 9 / 10 | Above threshold |
| Spacing Rhythm | 9 / 10 | Above threshold |
| Brand Coherence | 10 / 10 | Full marks |
| Edge-Case Handling | 8 / 10 | Above threshold; CRs required |
| Accessibility | 8 / 10 | Above threshold; CRs required |
| Responsive Behavior | 7 / 10 | Below 8 — CRs required |

**Aggregate: 51 / 60**

---

## Fail-Closed Ship-Blocker: PASS

No lock or shield-check renders over any non-encrypted message, group DM, loading state, or cannot-decrypt state in static markup or JS transitions. The `simulateKeygen()` code path is unidirectional. No automatic REVISE/REJECT is triggered by the load-bearing criterion.

---

## Overall Verdict: REVISE

The design is substantively correct. The fail-closed criterion passes cleanly. Brand coherence is exact — every token matches, no invented hex, no red-lock, no cutesy affordance. Visual hierarchy and spacing match the prior-art brief requirements. Six change requests prevent APPROVE. None require a concept redesign; all are targeted precision fixes to breakpoints, ARIA scoping, contrast verification, and handoff documentation.

---

## Enumerated Change Requests

**CR-1 — Fix invalid `antialiased` CSS declaration (Spacing Rhythm, DESIGN-SYSTEM.md §2)**
Line 58 contains `antialiased;` as a bare CSS property inside the `body` block. This is not valid CSS — it is a Tailwind utility class name misplaced in raw CSS. Replace with `-webkit-font-smoothing: antialiased; moz-osx-font-smoothing: grayscale;`. Measurable: the `body` block contains no invalid bare property; font smoothing is correctly declared.

**CR-2 — Document token override for States 4 and 5 (Edge-Case Handling, brief §4 / DESIGN-SYSTEM.md §1 contrast)**
Brief §4 specifies `--text-muted` for States 4 (cannot-decrypt) and 5 (loading). The design correctly uses `--text-secondary` for both (passing WCAG AA at ~5.46:1; `--text-muted` would fail at ~2.51:1). This override must be documented — either as an HTML comment at lines 220 and 238, or in the B-3 handoff spec — stating that `--text-secondary` replaces `--text-muted` for WCAG AA compliance and that the brief §4 prose is superseded. Measurable: the B-3 implementer has a single unambiguous token reference for States 4 and 5 with no contradiction between the brief and the staging file.

**CR-3 — Scope `aria-live` to inner pill container (Edge-Case Handling + Accessibility, brief §6 / DESIGN-SYSTEM.md §8)**
`role="status"` and `aria-live="polite"` are on the outer `.tooltip-trigger` wrapper, which also contains the `.tooltip-content` div. Move both attributes to the inner pill container `<div>` (the element whose `className` changes on state transitions). The `.tooltip-content` div must be outside the live region; associate it to the badge via `aria-describedby` pointing to a tooltip `id`. Measurable: the element carrying `aria-live="polite"` has no `.tooltip-content` descendant; tooltip text reveal on hover does not trigger a polite screen-reader announcement.

**CR-4 — Verify and document emerald icon contrast on all badge placement surfaces (Accessibility, brief §9 gate criterion / DESIGN-SYSTEM.md §1)**
`--accent-emerald` (#10b981) on the `rgba(16,185,129,0.1)` tinted pill background over `--surface-900` computes ~4.55:1 — marginal above the 4.5:1 floor. If the badge renders over `--surface-800` in any context, the composited background lightens and the ratio drops to ~4.47:1 (FAIL). Verify the component always places the State 1 badge on `--surface-900`. If any context places it on `--surface-800` or lighter, increase the tint to `rgba(16,185,129,0.15)`. Document the verified ratio in the B-3 handoff. Measurable: a stated contrast ratio ≥4.5:1 in the handoff artefact for the emerald icon against its confirmed placement background.

**CR-5 — Align context panel header breakpoints with brief §5 (Responsive Behavior, brief §5 / DESIGN-SYSTEM.md §9)**
In the DM context panel header, change:
- Line 333: `hidden md:block` → `hidden lg:block`
- Line 344: `md:hidden` → `lg:hidden`

This moves the full-pill / icon-only switch from 768px to 1024px, matching brief §5's "Desktop compact (1024): badge MAY collapse label → glyph-only." The `hidden lg:inline` on the label span (line 336) is unchanged. Measurable: at a 900px viewport, the 44px icon-only button renders in the context panel header; the full pill (with or without label) does not.

**CR-6 — Add tooltip to narrow-viewport context panel badge (Responsive Behavior, brief §5)**
The `md:hidden` (to become `lg:hidden` per CR-5) icon-only badge in the context panel (lines 344–351) has a `.tooltip-trigger` wrapper but no `.tooltip-content` child. Add a `.tooltip-content` div with state-appropriate plain-language text. For the static staging file, use the same text as the desktop badge tooltip for State 1. Measurable: focusing or hovering the narrow-viewport badge in the context panel reveals an explanation tooltip. (Brief §5 — "tooltip on tap/focus.")

---

*Review complete. Six CRs enumerated. No fail-closed violation found.*
