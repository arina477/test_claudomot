# D-3 Design Review — E2E DM Encryption Status Indicator
**Reviewer:** Reviewer A (plan-design-review substitution per review-gate.md precedent)
**Artifact:** `design/staging/e2e-indicator.html`
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
| State 1 — Encrypted (lines 152–168) | `ph-fill ph-shield-check`, emerald filled | YES — correctly, only here | PASS |
| State 2 — Plaintext Fallback (lines 170–185) | `ph ph-lock-open`, outline, secondary | Open icon signals NOT secured. No closed lock | PASS |
| State 3 — Group DM (lines 187–202) | `ph ph-shield-slash`, outline, secondary | Slashed shield = disabled. Not an affirmative encryption affordance | PASS |
| Key fetch error alias (lines 204–219) | `ph ph-lock-open`, outline, secondary — renders identical to State 2 | No lock | PASS |
| State 4 — Cannot Decrypt (lines 222–237) | `ph ph-key`, outline, secondary | No lock or shield | PASS |
| State 5 — Loading (lines 239–254) | `ph ph-circle-notch animate-spin`, outline, secondary | No lock or shield | PASS |

**JS state-machine — `simulateKeygen()` (lines 456–484):**

Line 468 forces the loading state: surface-700 pill, `ph ph-circle-notch animate-spin`, text-secondary, label "Establishing..." — no lock, no shield. After a 2000ms `setTimeout` (lines 475–482) the function resolves to the encrypted state: `ph-fill ph-shield-check` emerald, label "End-to-end encrypted." The transition is strictly unidirectional; the shield-check can only appear after the simulated proof event fires. No intermediate frame, no race, no branch that renders the shield during loading.

**Context panel (lines 334–352):** The DM thread header hardcodes State 1 in the spatial-context demo. Correct for staging. `simulateKeygen()` targets only `#demo-loading-badge` in the left audit column and does not mutate the context panel.

**FAIL-CLOSED CRITERION: PASS.** No padlock or shield-check renders over any plaintext, group DM, loading, or cannot-decrypt state in any static variant or any JS code path. No automatic REVISE/REJECT is triggered.

---

## Dimension Scores

### 1. Visual Hierarchy — 9 / 10

The encrypted badge (State 1, line 160) achieves calm-affirmative hierarchy through three layered signals: emerald 10% tint fill, emerald/20 hairline border, and the filled `ph-shield-check` glyph. This reads as "confirmed" without being loud — consistent with brief §1's framing of this as an "anti-security-theater surface." All non-encrypted states use the uniform `--surface-700` fill with `--border-hairline` and `--text-secondary` stroke, deliberately receding into the chrome. The hierarchy progression (emerald pill → grey pill → quiet grey micro-affordance) cleanly maps to "confirmed / unconfirmed / advisory."

The per-message micro-affordances at lines 403–406 (State 2, plaintext) and 428–431 (State 4, cannot-decrypt) correctly use `mt-1.5 flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]` — identical visual weight to the brief §8 "same slot, same weight" instruction. The cannot-decrypt message row additionally applies `opacity-60` on the avatar and name (lines 413, 416) to signal content unavailability at the row level before the micro-affordance names the specific cause. This layering is effective.

One point withheld: in the left audit column, States 2, 3, the key-fetch error alias, and State 4 all share identical pill appearance (same surface-700 fill, border, text-secondary token). The sole differentiators are glyph shape and label text. For the audit matrix's purpose of demonstrating distinct states, the visual sameness between "not encrypted" variants and "cannot decrypt" makes the proof harder to read at a glance. This is a staging-layout concern, not a production component flaw, but a reviewer scanning quickly could miss that State 4 is a different class of event than States 2/3.

### 2. Spacing Rhythm — 9 / 10

Badge padding `px-3 py-1.5` is applied consistently at lines 160, 177, 194, 211, 229, 246 — matches brief §4 and mirrors the ConnectionStateIndicator prior-art from `direct-messages.html:326`. Icon-to-label gap is `gap-2` on header badges and `gap-1.5` on per-message micro-affordances (lines 403, 428) — correct per brief §4. Tooltip inner padding is `padding: 12px` (line 79), width `280px` (line 76), matching DESIGN-SYSTEM.md §8 Tooltip primitive. All values are on the 4px base-unit grid from DESIGN-SYSTEM.md §3.

One point withheld: line 59 in the `body` block contains `antialiased;` as a bare CSS declaration. This is not valid CSS — it is a Tailwind utility class name misplaced in raw CSS. The correct declarations are `-webkit-font-smoothing: antialiased;` and `moz-osx-font-smoothing: grayscale;`. Both are already present on lines 58–59 as separate properties, so the bare `antialiased;` is a redundant invalid token (the browser silently ignores it). It does not affect layout or spacing at runtime, but it represents a handoff fidelity issue — B-3 engineers reading the staging file as a CSS reference may copy the invalid syntax.

**Change to reach 10 (CR-1):** Remove the bare `antialiased;` token from line 59 (or the equivalent duplicated position in the `body` block). The valid `-webkit-font-smoothing: antialiased; moz-osx-font-smoothing: grayscale;` declarations already present are sufficient. (DESIGN-SYSTEM.md §2 — Geist rendering; CSS hygiene in the staging artifact.)

### 3. Brand Coherence — 10 / 10

All `:root` custom property values at lines 22–51 reproduce the exact tokens from DESIGN-SYSTEM.md §1: `--surface-950: #0a0a0b`, `--surface-900: #121214`, `--surface-800: #1c1c1f`, `--surface-700: #27272a`, `--accent-emerald: rgb(16,185,129)` (equivalent to `#10b981`), `--accent-amber: #f59e0b`, `--danger: #ef4444`, all radius and shadow tokens — all match. No invented hex values appear anywhere in badge, pill, label, or icon rendering. Every color reference goes through `var(--...)` or the Tailwind `[var(--...)]` escape.

`--danger` is declared at line 40 but never consumed in any status badge — it appears only as a root variable. This is consistent with brief §4's explicit instruction: "Named here only to forbid it." No red tint appears on any non-encrypted state. No amber appears in the indicator. The `--rgb-accent-emerald` variable at line 37 is a correct technique for compositing opacity variants (`rgba(var(--rgb-accent-emerald),0.1)`) that would otherwise be inexpressible with the raw CSS custom property.

Icon choices: `ph-fill ph-shield-check` (encrypted — filled per DESIGN-SYSTEM.md §7 "filled variants only for active/selected states"), `ph-lock-open` (plaintext fallback), `ph-shield-slash` (group DM), `ph-key` (cannot-decrypt), `ph-circle-notch` (loading). All are real Phosphor glyph names confirmed against brief §4's approved list and brief §9's gate criterion. The filled variant is used only for State 1; all other states use the regular `ph` prefix outline weight. The design is dark-only: `<html lang="en" class="dark">` (line 2); no light-mode conditional paths exist.

### 4. Edge-Case Handling — 8 / 10

**Correctly handled:**
- All six brief §3 states are rendered in the left audit column.
- The key-fetch error alias (lines 204–219) is explicitly documented as aliasing to State 2 visually, with a distinct tooltip ("we were unable to retrieve a secure key") explaining the cause. Satisfies brief §7's fail-closed error default.
- `simulateKeygen()` models the Loading → Encrypted transition without any intermediate lock flash.
- Reduced-motion guard at lines 112–122 suppresses all transitions and the `ph-circle-notch` spinner with `!important` overrides. Correct per brief §6 and DESIGN-SYSTEM.md §6.
- Tooltip hover delay 400ms (line 101) matches brief §6 and DESIGN-SYSTEM.md §8. Instant-on-focus (lines 104–108) matches brief §6.
- `state-fade` CSS class (lines 131–135) applies 200ms transition on background-color, border-color, and color — matching brief §6 and DESIGN-SYSTEM.md §6.

**Two items preventing a higher score:**

1. **Token contradiction for States 4 and 5 versus brief §4.** Brief §4 specifies `--text-muted` (rgba(255,255,255,0.40)) for the cannot-decrypt and loading status labels. The design correctly uses `--text-secondary` (rgba(255,255,255,0.60)) for both (lines 229, 246) — passing WCAG AA at ~5.46:1; `--text-muted` on `--surface-700` computes ~2.51:1, a clear fail. The override is the correct accessibility decision and is even annotated in the brief's own correction note ("D-3 attempt-2 correction S2"). However the brief §4 prose still says `--text-muted` for these states in one place and the correction notation is inline rather than struck through. The B-3 implementer reading both the brief and the staging file has two contradictory signals. The staging file is the de-facto resolution, but the contradiction must be explicitly resolved.

2. **`aria-live` scope too broad.** `role="status"` and `aria-live="polite"` sit on the outer `.tooltip-trigger` wrapper `<div>` (lines 160, 177, 194, 211, 229, 246), which also contains the `.tooltip-content` div. When the tooltip appears on hover, the tooltip text enters the live region and may trigger a polite screen-reader announcement in addition to the intended state-change announcement. Brief §6 specifies the live region for state-change announcements; the tooltip is a separate disclosure mechanism.

**Changes to reach 10 (CR-2, CR-3):**

- CR-2: Add an explicit HTML comment at lines 220–236 and 238–253 (States 4 and 5) stating that `--text-secondary` is used instead of the `--text-muted` reference in brief §4, citing the WCAG AA contrast rationale (2.51:1 vs 5.46:1). Alternatively, update the B-3 handoff spec with this clarification. Measurable: B-3 has a single unambiguous token reference for States 4 and 5 with no contradiction between the brief prose and the staging artifact.

- CR-3: Move `role="status"` and `aria-live="polite"` from the outer `.tooltip-trigger` wrapper to the inner pill container `<div>` (the element whose classes change on state transitions). Associate the tooltip to the badge via `aria-describedby` pointing to a tooltip `id`. Measurable: the element carrying `aria-live="polite"` has no `.tooltip-content` descendant; tooltip text reveal on hover does not trigger a polite announcement.

### 5. Accessibility — 8 / 10

**Correctly implemented:**
- Keyboard-reachable tooltips via `tabindex="0"` on all `.tooltip-trigger` wrappers.
- Focus-visible emerald ring: `focus-visible:ring-2 focus-visible:ring-[var(--accent-emerald)]` across all interactive and focusable elements, matching `--glow-focus` from DESIGN-SYSTEM.md §5.
- All utility icon buttons carry `aria-label` (lines 359–363).
- Avatar `<img>` elements have descriptive `alt` text (lines 320, 381, 413).
- `role="tooltip"` on all tooltip content divs (lines 164, 181, 198, 215, 233, 250, 271, 279, 287, 295, 303, 340, 350).
- `role="article"` on message rows (lines 380, 393, 412).
- `role="status"` with `aria-label` on all narrow-viewport icon-only badges (lines 268, 276, 284, 292, 300).
- Colour-independence: each state distinguishable by glyph shape AND label without colour. Filled shield-check vs open lock vs slashed shield vs key vs spinning circle — all distinct shapes in grayscale.

**WCAG AA contrast audit:**

| Element | Token (effective) | Approx. rendered | Background | Ratio | Result |
|---|---|---|---|---|---|
| State 1 label (`--text-primary`) | rgba(255,255,255,0.92) | ~#ebebeb | ~#162b26 (surface-900 + emerald/10) | >14:1 | PASS |
| State 2/3 label (`--text-secondary`) | rgba(255,255,255,0.60) | ~#999999 | #27272a (surface-700) | ~5.46:1 | PASS |
| State 4/5 label (`--text-secondary`, as implemented) | rgba(255,255,255,0.60) | ~#999999 | #27272a (surface-700) | ~5.46:1 | PASS |
| `--text-muted` (IF brief §4 literal) | rgba(255,255,255,0.40) | ~#666666 | #27272a (surface-700) | ~2.51:1 | FAIL — design's override to `--text-secondary` is correct |
| Per-message label (`--text-secondary`) | rgba(255,255,255,0.60) | ~#999999 | #1c1c1f (surface-800) | ~5.87:1 | PASS |
| Emerald icon (`--accent-emerald`) on tinted pill | #10b981 | #10b981 | ~#162b26 (composited) | ~4.55:1 | MARGINAL — barely above 4.5:1 floor |

All label text passes WCAG AA. The emerald icon on its tinted background is marginal (~4.55:1 on surface-900). If the badge is placed on surface-800 in any production context, the composited background lightens and the ratio drops to approximately 4.47:1 — a fail. Brief §9 sets the gate at ≥4.5:1 and the current staging context correctly places the badge on surface-900 (lines 315–316), but this must be confirmed and locked in the B-3 spec.

**Two items preventing a score of 10:**

1. The `aria-live` scope issue (CR-3 above) — tooltip entering the polite live region on hover.
2. The emerald icon contrast is marginal and surface-context-dependent.

**Changes to reach 10:**

- CR-3 (same as Edge-Cases): scope `aria-live` to inner pill container. (Brief §6.)
- CR-4: In the B-3 component spec, document that the State 1 badge must always render on `--surface-900`. If any context (e.g., a fullscreen mobile overlay) places it on `--surface-800` or lighter, increase the tint from `rgba(16,185,129,0.1)` to `rgba(16,185,129,0.15)` to hold the contrast floor above 4.5:1. State the verified ratio in the handoff. Measurable: the B-3 handoff specifies the exact placement surface and a stated contrast ratio ≥4.5:1 for the emerald icon. (Brief §9 gate criterion / DESIGN-SYSTEM.md §1.)

### 6. Responsive Behavior — 7 / 10

**Correctly implemented:**
- Layout: `grid-cols-1 lg:grid-cols-[400px_1fr]` (line 141) stacks correctly at narrow widths.
- Narrow-viewport icon-only section (lines 262–307): all five states at `w-11 h-11` (44×44px) with centered tooltips — correct touch target and tooltip centering per brief §5.
- Label within the full pill uses `hidden lg:inline` (line 337) — text is hidden below 1024px, visible at ≥1024px. Matches brief §5's "label collapses at 1024."

**Two items preventing a higher score:**

1. **Breakpoint mismatch in the DM context panel header.** The full pill wrapper uses `hidden md:block` (line 334) and the icon-only fallback uses `lg:hidden` (line 345). Tailwind `md:` = 768px. This means: below 768px → icon-only 44px button; 768–1023px → full pill rendered (but label hidden via `hidden lg:inline`, so the pill shows glyph-only in a full-pill shell rather than the compact 44px icon button); ≥1024px → full pill with label. Brief §5 specifies the collapse to icon-only at ≤1024, not ≤768. At 900px the user sees a full pill container with only an icon inside it — an unspecified intermediate state. The left audit column's narrow-viewport section correctly targets this at 44px, but the context panel header does not. The two `lg:hidden` / `hidden lg:block` classes on lines 334/345 should both be `lg:` prefix to align.

2. **Narrow-viewport context panel badge has no tooltip content.** The `lg:hidden` icon-only badge in the DM context header (lines 344–352) has a `.tooltip-trigger` wrapper but no `.tooltip-content` child. Brief §5 explicitly requires "tooltip on tap/focus" for the narrow glyph-only variant. A user tapping or focusing the narrow badge in the context panel receives no explanation.

**Changes to reach 10 (CR-5, CR-6):**

- CR-5: In the DM context panel header, change line 334 from `hidden md:block` to `hidden lg:block`. The companion `lg:hidden` on line 345 is already correct. Confirm both sides read `hidden lg:block` / `lg:hidden`. Measurable: at a 900px viewport, the 44px icon-only button renders in the context panel header; no unlabeled full-pill shell appears. (Brief §5 / DESIGN-SYSTEM.md §9 — 1024 is the desktop compact minimum.)

- CR-6: Add a `.tooltip-content` child inside the narrow-viewport icon-only badge wrapper in the context panel (lines 344–352) with state-appropriate plain-language text (for the staging file, the same text as the desktop badge State 1 tooltip). In the production component this content must be state-driven. Measurable: hovering or focusing the narrow badge in the context panel reveals an explanation tooltip. (Brief §5.)

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

No lock or shield-check renders over any non-encrypted message, group DM, loading state, or cannot-decrypt state in static markup or the JS transition. The `simulateKeygen()` code path is strictly unidirectional (loading → encrypted, after the timeout fires). No automatic REVISE/REJECT is triggered by the load-bearing criterion.

---

## Overall Verdict: REVISE

The design is substantively correct. The fail-closed criterion passes cleanly. Brand coherence is exact — every token matches DESIGN-SYSTEM.md §1, no invented hex, no red-lock, no cutesy affordance. Visual hierarchy and spacing match the prior-art brief requirements. Six change requests prevent APPROVE. None require a concept redesign; all are targeted precision fixes to CSS hygiene, breakpoint alignment, ARIA scoping, contrast surface documentation, and a missing tooltip.

---

## Enumerated Change Requests

**CR-1 — Remove invalid bare `antialiased` CSS token (Spacing Rhythm, DESIGN-SYSTEM.md §2)**
The `body` block contains `antialiased;` as a bare CSS property. It is a Tailwind utility class name misplaced in raw CSS and is silently ignored by the browser. The valid `-webkit-font-smoothing: antialiased; moz-osx-font-smoothing: grayscale;` declarations are already present. Remove the redundant invalid token. Measurable: the `body` block contains no invalid bare property; the CSS validates cleanly.

**CR-2 — Resolve token contradiction for States 4 and 5 (Edge-Case Handling, brief §4 / DESIGN-SYSTEM.md §1)**
Brief §4 prose specifies `--text-muted` for the cannot-decrypt and loading status labels; the staging file correctly uses `--text-secondary`. Add an HTML comment at the State 4 and State 5 badge elements stating that `--text-secondary` is used instead of `--text-muted` per WCAG AA compliance (2.51:1 vs 5.46:1 on surface-700), and that brief §4's attempt-2 correction S2 governs. Measurable: the B-3 implementer has a single unambiguous token reference for States 4 and 5 with no contradiction between brief prose and staging artifact.

**CR-3 — Scope `aria-live` to inner pill container (Edge-Case Handling + Accessibility, brief §6 / DESIGN-SYSTEM.md §8)**
Move `role="status"` and `aria-live="polite"` from the outer `.tooltip-trigger` wrapper `<div>` to the inner pill container `<div>` (the element whose `className` changes on state transitions). Associate each tooltip to its badge via `aria-describedby` referencing the tooltip div's `id`. Measurable: the element carrying `aria-live="polite"` has no `.tooltip-content` descendant; tooltip reveal on hover does not trigger a polite screen-reader announcement; tooltip text is still announced on focus via `aria-describedby`.

**CR-4 — Document and lock emerald icon contrast surface (Accessibility, brief §9 / DESIGN-SYSTEM.md §1)**
`--accent-emerald` (#10b981) on the composited `rgba(16,185,129,0.1)` + `--surface-900` background computes ~4.55:1 — above the 4.5:1 floor only while the badge sits on surface-900. In the B-3 component spec, state explicitly that the State 1 badge must always render on `--surface-900` (the DM thread header background). If any production context places it on `--surface-800` or lighter, increase the tint to `rgba(16,185,129,0.15)`. Measurable: the B-3 handoff spec states the confirmed placement surface and a verified contrast ratio ≥4.5:1 for the emerald icon.

**CR-5 — Align context panel full-pill/icon-only breakpoint to 1024px (Responsive Behavior, brief §5 / DESIGN-SYSTEM.md §9)**
In the DM context panel header, line 334: change `hidden md:block` to `hidden lg:block`. The companion `lg:hidden` on line 345 is already at the correct breakpoint. This aligns the full-pill/icon-only switch to 1024px as specified in brief §5. Measurable: at a 900px viewport, the 44px icon-only button renders in the context panel header; no unlabeled full-pill shell appears between 768px and 1024px.

**CR-6 — Add tooltip to narrow-viewport context panel badge (Responsive Behavior, brief §5)**
The `lg:hidden` icon-only badge in the DM context panel (lines 344–352) has a `.tooltip-trigger` wrapper but no `.tooltip-content` child. Add a `.tooltip-content` div with the same plain-language text as the desktop badge tooltip for the active state. In production, this content must be state-driven. Measurable: hovering or focusing the narrow-viewport badge in the context panel reveals an explanation tooltip. (Brief §5 — "tooltip on tap/focus.")

---

*Review complete. Six CRs enumerated. No fail-closed violation found.*
