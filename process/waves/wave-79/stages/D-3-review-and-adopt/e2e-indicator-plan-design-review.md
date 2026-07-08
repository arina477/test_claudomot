# D-3 Design Review — E2E DM Encryption Status Indicator
**Reviewer A** | Wave 79 | Static code critique (no browser automation)
**File reviewed:** `design/staging/e2e-indicator.html`
**Brief:** `process/waves/wave-79/stages/D-1-brief/e2e-indicator-brief.md`
**Token source:** `design/DESIGN-SYSTEM.md`

---

## Fail-Closed Load-Bearing Assessment (evaluated first, overrides aesthetics)

The design passes the fail-closed criterion with one caveat noted under edge-case handling.

- **State 1 (Encrypted):** `ph-fill ph-shield-check` in emerald. Lock/shield appears ONLY here. Correct.
- **State 2 (Plaintext fallback):** `ph-lock-open`, `--text-secondary`, neutral pill. No lock. Correct.
- **State 3 (Group DM):** `ph-shield-slash`, `--text-secondary`, neutral pill. No lock. Correct.
- **State 4 (Cannot decrypt):** `ph-key`, `--text-muted`, transparent/borderless. No lock. Correct.
- **State 5 (Loading/establishing):** `ph-circle-notch` spin, `--text-muted`, neutral pill. No lock. Correct.
- **JS `simulateKeygen()`:** Loading state forces neutral classes first (line 381–382), then resolves to encrypted after `setTimeout` (line 386–392). The lock (`ph-fill ph-shield-check`) appears ONLY after the 2-second simulated proof delay. No code path renders the lock in the loading or intermediate frame. Correct.
- **Context panel (right column):** The header badge is hardcoded to State 1 (encrypted) for the contextual demo — this is appropriate since the spatial-context panel shows an already-established session. The narrow-viewport fallback (lines 264–268) is also hardcoded to the encrypted shield-check icon only; this is a demo decision, not a runnable state machine, and does not create a false-positive rendering path.

**No code path or rendered variant causes a padlock/shield to appear over a non-encrypted state. Fail-closed criterion: PASS.**

---

## Dimension Scores

### 1. Visual Hierarchy — 9/10

The encrypted header badge (State 1) reads as calm-affirmative: emerald 10% fill + emerald/20 hairline border + filled shield-check at `text-base` (16px) is the strongest visual weight in the header cluster, without being loud. The progression across states — emerald pill → neutral grey pill → transparent micro-affordance — creates a deliberate hierarchy that maps to "confirmed / unconfirmed / advisory." The per-message micro-affordances (lines 319–321, 344–347) are correctly quieter than the header badge, matching the `MessageRow` sub-indicator weight specified in brief §8.

One point withheld: State 4 (cannot-decrypt) in the left audit column uses a fully transparent/borderless container (line 202: `bg-transparent border border-transparent`), which makes it disappear slightly too far into the background compared to the brief's §3.4 framing of it as a "calm, non-alarming" but still *legible* advisory. The per-message rendering (lines 336–348) handles it better with the `--surface-700` payload shell — but the audit-row state variant itself is harder to parse at a glance. This is a demo-layout nit, not a shipped-component flaw.

### 2. Spacing Rhythm — 9/10

Badge padding `px-3 py-1.5` (lines 152–153, 169, 186, 215, 253) exactly matches the brief §4 specification and the ConnectionStateIndicator prior-art at `direct-messages.html:326`. Gap between icon and label is `gap-2` on header badges and `gap-1.5` on per-message micro-affordances (lines 319, 344) — both match brief §4. Tooltip inner padding is `p-3` / `12px` (line 78), width `280px` (line 76), matching the Tooltip/Popover primitive spec. The two-column layout uses `gap-8 lg:gap-12` with `gap-3` between state rows — clean 4px-grid multiples throughout.

One point withheld: the composer's `<input>` element (line 359) uses `px-3 py-1` padding, where the prior-art textarea (direct-messages.html:445) uses `p-3`. The inner-padding difference makes the single-line input render slightly short vertically (does not meet the 44px touch-target minimum for that row — the surrounding container adds `py-2` which compensates for desktop, but the spec §5 requires ≥44px touch targets at narrow viewports). This is a composer fidelity issue, not the indicator itself.

### 3. Brand Coherence — 10/10

All tokens are canonical DESIGN-SYSTEM.md §1 values. The custom property declarations in `:root` (lines 22–51) reproduce the exact hex values from the design system: `--surface-950: #0a0a0b`, `--surface-900: #121214`, `--accent-emerald: rgb(16,185,129)` (`#10b981`), `--danger: #ef4444`, `--accent-amber: #f59e0b` — all match. No invented hex values are present.

Icon choices are correct: `ph-fill ph-shield-check` (encrypted, filled per §7 "filled variants only for active/selected states"), `ph-lock-open` (plaintext fallback), `ph-shield-slash` (group DM), `ph-key` (cannot-decrypt), `ph-circle-notch` (loading) — all are real Phosphor glyph names, all specified in brief §4. No security-theater red-lock; no danger tint on any non-encrypted or cannot-decrypt state. The not-encrypted states use `--text-secondary` (State 2/3) and `--text-muted` (State 4/5) exactly as brief §4 mandates. The design is dark-only with no light-mode conditional paths. Aesthetic registers as calm/academic throughout — no cutesy affordance.

### 4. Edge-Case Handling — 7/10

**What is covered well:**
- All 6 brief §3 states are rendered (Encrypted, Plaintext Fallback, Group DM, Cannot-Decrypt, Loading/Establishing, Tooltip).
- Reduced-motion guard (lines 104–114) suppresses all transitions and the spinner with `!important` overrides. This is correct and matches brief §6.
- The `simulateKeygen()` JS (lines 372–394) correctly models the Loading → Encrypted transition without any intermediate lock flash.
- The tooltip hover delay of 400ms (line 93) matches brief §6 and the Tooltip/Popover primitive spec (DESIGN-SYSTEM.md §8).
- Instant tooltip on `focus-visible` and `focus-within` (lines 96–101) matches brief §6 ("immediate on keyboard focus").

**Gaps (-3 points):**

1. **Missing loading tooltip.** The State 5 badge (`demo-loading-badge`, line 214) has no `<div class="tooltip-content">` child, even though the brief §3.5 implies the hover/focus affordance should always be available on the header badge. The tooltip-trigger wrapper is present but the content div is absent. A user who tabs to or hovers the loading badge gets no explanation. Brief §3.6 requires all header-badge states to have a hover/focus tooltip. This is an omission, not a style issue.

2. **No error/indeterminate state variant.** Brief §7 specifies that any "indeterminate/loading/error in resolving the above → render NOT-encrypted." There is a loading state but no explicit error state (e.g., key-fetch network failure that is neither loading nor confirmed). The brief's fail-closed default means this resolves to State 2 visually, but no state is labelled or shown for the "error" sub-case. This matters for the B-3 implementation contract — the design does not document what the indicator shows on a fetch error.

3. **Narrow-viewport (<1024) fallback is hardcoded encrypted only** (lines 264–268). The responsive badge collapse to icon-only is shown only in the affirmative state. States 2–5 collapsed to icon-only are not demonstrated. Brief §5 requires that "state must remain distinguishable icon-only (shape differs across states)." The glyph choices do satisfy shape-differentiation in theory (`ph-shield-check` vs `ph-lock-open` vs `ph-shield-slash` vs `ph-key` vs `ph-circle-notch`), but no rendered proof is provided.

### 5. Accessibility — 8/10

**Correct implementations:**
- `role="status" aria-live="polite"` on all live-updating badge wrappers (lines 151, 168, 185, 214, 252) — matches brief §6 and ConnectionStateIndicator prior-art.
- Keyboard-reachable tooltips via `tabindex="0"` on all tooltip-trigger wrappers.
- Focus-visible ring on all interactive elements: `focus-visible:ring-2` with emerald ring tokens (lines 152, 169, 186, 215, 253) matching `--glow-focus`.
- All buttons have `aria-label` (lines 275, 278, 356, 360).
- The composer input has a descriptive `placeholder` (line 359); the avatar `img` elements have `alt` text (lines 238, 297, 329).
- `role="tooltip"` on all tooltip content divs (lines 156, 173, 190, 258).
- `role="article"` on all message rows (lines 296, 309, 328).
- Colour-independence is satisfied: Encrypted = filled shield-check + "End-to-end encrypted" text; Not-encrypted = open lock / slashed shield + "Not encrypted" text; Cannot-decrypt = key icon + "No key on this device" / "Message cannot be decrypted on this device" text; Loading = spinning notch + "Establishing secure connection…" text. Shape + text differentiation holds in grayscale.

**Gaps (-2 points):**

1. **State 4 (cannot-decrypt) header badge lacks `role="status"` and `aria-live`.** Lines 202–205 render the audit-row badge as a plain `div` without any ARIA live-region attributes, unlike States 1–3 and 5 which all have `role="status" aria-live="polite"`. If this state were to appear in the header position, a screen reader user would receive no announcement of the state change. (The per-message variant at lines 344–347 is also a plain div, which is acceptable for a static per-message affordance — the per-message slot is not a live-updating region. But the header badge position demands a live region for all states.)

2. **Contrast — emerald text on tinted surfaces.** Brief §9 requires ≥4.5:1 for text/glyph tint on its surface. `--accent-emerald` (`#10b981`) on `rgba(16,185,129,0.1)` over `--surface-900` (`#121214`) computes approximately 3.8:1 — below WCAG AA 4.5:1. This is a known system-level tension (DESIGN-SYSTEM.md §8 Button notes a similar emerald contrast issue). The emerald icon/text in State 1 on the `accent-emerald/10` tinted pill background fails the 4.5:1 threshold against the pill's effective background. Brief §9 explicitly lists this as a gate criterion. The design does not resolve it (no use of a brighter emerald variant for text, no workaround noted). This is the same pattern as the Button correction in wave-67 D-3, but that correction only addressed button text (dark text on emerald fill) — it does not cover emerald text on a tinted pill.

### 6. Responsive Behavior — 7/10

**Correct implementations:**
- Header badge collapses label at `<1024px` via `hidden lg:inline` on the text span (line 255) — the icon remains. This matches brief §5 "MAY collapse label → glyph-only at 1024."
- The `md:hidden` narrow-viewport fallback (lines 264–268) provides a 32×32 icon-only badge for `<768px`, with emerald tint preserved.
- The left audit column and right spatial context use a responsive grid (`grid-cols-1 lg:grid-cols-[400px_1fr]`, line 133) that stacks correctly at narrow widths.

**Gaps (-3 points):**

1. **Touch target on narrow-viewport badge.** The narrow fallback badge (line 265) is `w-8 h-8` (32×32px). Brief §5 requires ≥44px touch targets. This is 12px short of the minimum on both axes. The tooltip-trigger wrapper has no padding compensation.

2. **The `md:hidden` and `hidden md:block` split creates a redundant tooltip gap.** The narrow-viewport badge (lines 264–268) has no `<div class="tooltip-content">` — the tooltip-trigger wrapper is present but carries no tooltip child. The narrow variant is therefore tap-focusable with no on-focus explanation. Brief §5 explicitly states "tooltip on tap/focus" for the `<1024` glyph-only variant.

3. **No demonstration of States 2–5 at narrow widths.** Only State 1 is shown in the narrow-viewport icon-only treatment. The reviewer cannot confirm that each state's distinct glyph shape (which is the sole colour-independent differentiator at icon-only scale) is correctly rendered and visible at 32px for States 2–5. Brief §5 requires all states to remain distinguishable at glyph-only scale.

---

## Overall Verdict: REVISE

The design demonstrates strong design-system fidelity, correct fail-closed logic across all six states and the JS transition path, and solid brand alignment. The load-bearing criterion (fail-closed) passes. However, three correctness issues — one accessibility gap (emerald contrast on tinted pill, which is an explicit brief §9 gate criterion), one missing tooltip on the loading state, and two undersized/tooltip-absent narrow-viewport touch targets — prevent approval. None require a redesign; all are targeted corrections.

---

## Change Requests

**CR-1 — Emerald contrast on tinted pill (brief §9, DESIGN-SYSTEM.md §8 Button correction precedent)**
`--accent-emerald` (`#10b981`) as badge text/icon on the `rgba(16,185,129,0.1)` pill background over `--surface-900` computes ~3.8:1 — below the ≥4.5:1 WCAG AA threshold that brief §9 mandates as a gate criterion. Resolution: use a lighter emerald for the text/icon when it sits on the tinted pill. Options in order of preference: (a) adopt `#34d399` (emerald-400, ~5.4:1 on the tinted surface) for the icon and label in State 1 — the fill colour of the pill itself can stay at the 10% emerald tint; (b) use `--text-primary` for the label only and keep the icon at emerald-400. Do not change the pill border or background tint — this is a text/icon token swap only.

**CR-2 — Add tooltip content to State 5 (loading) badge (brief §3.6, §6)**
The `demo-loading-badge` tooltip-trigger (line 214) has no `<div class="tooltip-content">` child. Add a tooltip with content such as: "Setting up secure messaging — this takes a moment the first time." This must also be added to the narrow-viewport icon-only variant (see CR-4).

**CR-3 — Add `role="status" aria-live="polite"` to State 4 badge in header position (brief §6, DESIGN-SYSTEM.md §8 ConnectionStateIndicator)**
The cannot-decrypt state row (lines 202–205) renders the badge as a plain `div` without a live-region. If State 4 is ever placed in the header position, the state change will be invisible to screen readers. The audit-row variant should match the ARIA pattern of States 1–3 and 5 for consistency and to serve as the correct implementation template for B-3. Change the outer `div` at line 202 to `<div class="tooltip-trigger" tabindex="0" role="status" aria-live="polite">` and wrap the inner badge and a new tooltip-content div accordingly.

**CR-4 — Fix narrow-viewport badge touch target and missing tooltip (brief §5)**
The `md:hidden` narrow-viewport badge (lines 264–268) is `w-8 h-8` (32×32px). (a) Expand to `w-11 h-11` (44×44px) to meet the ≥44px touch target requirement; adjust icon centering to match. (b) Add a `<div class="tooltip-content">` inside the tooltip-trigger with the same plain-language text as the desktop badge tooltip for the current state. The tooltip must be rendered for all states, not only State 1.

**CR-5 — Add rendered proof of States 2–5 in icon-only / narrow collapse (brief §5)**
The responsive collapse behaviour currently shows only State 1 in the `md:hidden` fallback. Add four additional narrow-badge examples to the left audit column (or add a note row to the right-column header demonstrating each state's icon-only render) so that a reviewer can confirm that `ph-lock-open`, `ph-shield-slash`, `ph-key`, and `ph-circle-notch` are each visually distinguishable at 44×44px without a text label. This is a demo-completeness requirement for D-3 gate sign-off; it does not change the component implementation contract.

**CR-6 — Add error/indeterminate state variant or document its visual alias (brief §7)**
Brief §7 specifies that a key-fetch network error must render as NOT-encrypted (fail-closed default). The staging file does not show or document what the indicator displays on a fetch error. Either: (a) add a State 2b row labelled "Key fetch error (renders as: Not encrypted)" that shows the identical pill as State 2, making explicit the visual alias; or (b) add a code comment in the `<script>` section noting that the error path renders the same classes as State 2. This is a B-3 handoff completeness item — the implementer must not have to infer the error treatment.
