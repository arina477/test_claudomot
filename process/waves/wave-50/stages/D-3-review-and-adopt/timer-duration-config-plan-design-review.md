# D-3 Plan Design Review — Timer Duration Config Affordance

**Reviewer role:** /plan-design-review  
**Mockup:** `design/staging/timer-duration-config.html`  
**Brief:** `process/waves/wave-50/stages/D-1-brief/timer-duration-config-brief.md`  
**Design system ref:** `design/DESIGN-SYSTEM.md`  
**Adopted parent:** `design/study-timer.html`

---

## Verdict

**REVISE**

The mockup is architecturally sound and token-compliant in the majority of its surface area, but three concrete issues block approval: (1) the mobile popover pattern violates the brief's non-goal prohibition on modal/panel UI, (2) the slim-bar responsive section does not demonstrate the F-1 phase-border interaction required by the brief, and (3) one accessibility gap on the validation error state — color-only redundancy without a non-color secondary differentiator — needs a fix before adoption. Details follow.

---

## Dimension Scores

### 1. Visual Hierarchy — 8 / 10

The config affordance occupies the horizontal center of the full-width widget row, separated from the countdown by a `--border-hairline` left-border vertical divider. The countdown retains its 40px Geist Mono dominance at `lg`. The phase pill is untouched. The config cluster — two compact 56px inputs, a muted `/` separator, and a 64px Apply button — reads clearly as secondary chrome rather than a competing focal point.

**What would make it a 10:** The `mt-3` offset on the `/` separator between Work and Break inputs creates a minor misalignment in the static grid states (Sections 02–04). The separator appears visually middle-anchored between the label and the input, not strictly center-aligned with the input itself. Tightening to `mt-4` (matching the label-height offset of `mt-4` used on the Apply wrapper) or aligning the separator with `items-center` on the parent `flex` row rather than a manual margin would clean this up.

### 2. Spacing Rhythm — 9 / 10

The inline config form uses `gap-3` (12px) between fields, which is consistent with the DESIGN-SYSTEM §3 spacing scale base-unit of 4px and the control-row `gap-2` / `gap-3` patterns in `study-timer.html`. The `pl-6` left padding inside the form, combined with the hairline border divider, gives the affordance breathing room without colonizing real estate that belongs to the countdown.

**What would make it a 10:** Section 06 (slim bar) uses `gap-4` between the clock row and the phase progress bar, and `gap-1.5` inside the button cluster — both reasonable. The static state cards (02–05) use `gap-1.5` between label and input and `p-4`/`p-8` container padding, which is consistent. Minor note: the extracted component cards use `p-8` container padding but the state grids in the parent widget use `p-4 lg:px-5 lg:py-4` — this is intentional (documentation shell vs. live widget) and appropriate.

### 3. Brand Coherence — 9 / 10

All tokens are pulled directly from the DESIGN-SYSTEM. No invented hex values are present in the stylesheet. The token declarations match exactly: `--accent-emerald: #10b981`, `--accent-amber: #f59e0b`, `--danger: #ef4444`, `--danger-text: #f87171`, all surface layers, both border values, and the full radius/shadow/glow vocabulary. The button classes (`.btn`, `.btn-sm`, `.btn-md`, `.btn-primary`, `.btn-ghost`, `.btn-secondary`) are identical copies from `study-timer.html` — no drift. `--glow-danger` is defined and used correctly in `.input-error:focus` per DESIGN-SYSTEM §5.

The `.btn-primary` Apply button is emerald-filled, matching the brief §4 requirement. The locked state uses `--text-muted` for labels (reduced opacity, communicating disabled), which matches DESIGN-SYSTEM §1 semantic usage of `--text-muted` for disabled fills.

**What would make it a 10:** The `--glow-subtle` on `.glass-panel:hover` (which is preserved from `study-timer.html`) causes the outer widget card to glow slightly on hover. This is correct behavior — the parent widget already did this — but the config affordance section of the hero widget inherits it. No change required; noted for awareness.

### 4. Edge-Case / State Handling — 7 / 10

All five required states are present and visually distinct:

- **Idle-editable (Section 02):** Inputs enabled, Apply present. Correct.  
- **Locked (Section 03):** Both inputs `disabled`, labels shift to `--text-muted`, Apply is replaced by the italic "Reset timer to change lengths" hint in `--text-muted`. The JS correctly keeps inputs disabled on pause (not just on running). Correct behavior, but the hint text in Section 03 (`Reset timer to change lengths`) differs subtly from the hero widget's `hintText` element which reads `Reset to edit`. Brief §6 specifies "Reset the timer to change lengths." The Section 03 static card is the closer match; the hero hint element should align. Minor inconsistency, not a blocker.
- **Validation-error (Section 04):** `--danger` border + `--danger-text` on the input, Apply disabled, inline error message with warning-circle icon. See Accessibility section below for a concern.
- **Applying (Section 05):** Inputs disabled, Apply replaced with spinner (`ph-spinner animate-spin`), `aria-busy="true"`. Correct.
- **Applied/synced:** Demonstrated in the hero widget JS — after the simulated 1000ms network delay, the clock updates to the new `baselineWork` value and inputs re-enable. This is sufficient for a mockup; no separate static section is required by the brief.

**What would make it a 10:** The locked state's `/` separator (line 386) uses `text-[var(--border-hairline)]` as its color — `rgba(255,255,255,0.06)` — which is effectively invisible against the `--surface-900` background. This is intentional (the separator fades with the locked state), but it could read as a layout artifact rather than a deliberate de-emphasis. Using `text-[var(--text-muted)]` (0.40 opacity) would keep the separator legible while still communicating the locked context, consistent with how disabled inputs in the DESIGN-SYSTEM use `--text-muted` rather than full transparency.

### 5. Accessibility — 6 / 10

**Passing items:**
- Both number inputs in the hero widget have explicit `aria-label` attributes (`"Work minutes"`, `"Break minutes"`) per brief §9.
- The applying state button carries `aria-busy="true"` per DESIGN-SYSTEM §8 Button primitive.
- The validation error input carries `aria-invalid="true"` per DESIGN-SYSTEM §8 Input primitive.
- `prefers-reduced-motion` block is comprehensive and matches the pattern from `study-timer.html`.
- Focus rings use `--glow-focus` (emerald) and `--glow-danger` (danger) per DESIGN-SYSTEM §5 — correctly distinct.
- The phase pill uses `role="status"` per adopted `study-timer.html` pattern.

**Concern — color-only validation (brief §9, DESIGN-SYSTEM §8):**  
The validation error state (Section 04) shows the `--danger` border and `--danger-text` color on the input, plus a floating badge reading "Max 120m" with a `ph-warning-circle` icon. The icon is a non-color differentiator — that part is correct. However, the badge is positioned `absolute top-[102%]` and is part of the static state only. In the hero widget's live JS (`checkHeroDirty`), the error state is applied exclusively by toggling the `.input-error` CSS class, which changes only border color and text color. No inline error message, no `aria-describedby`, and no `aria-live` region is wired in the interactive section. The DESIGN-SYSTEM §8 Form field group entry requires "error text via `aria-describedby`." A screen reader user interacting with the hero widget will receive no programmatic error signal beyond `aria-invalid="true"` — which does not convey the constraint message. This is a concrete gap.

**What would make it a 10:** The static Section 04 card shows the correct pattern (icon + text badge). The hero widget JS needs to: (a) inject or reveal an `aria-describedby`-linked error message element when validation fails, and (b) either use an `aria-live="polite"` region or rely on the `aria-describedby` association so a screen reader announces the constraint. The mockup demonstrates the visual pattern correctly; the live interaction demo should match it.

### 6. Responsive / Slim-Bar — 5 / 10

This is the most significant concern.

**Section 06 (slim width <1024px):** The mockup collapses the config affordance behind a `ph-faders` ghost button. On click, a `hidden`-toggled div reveals a `w-[220px]` popover containing two labeled inputs and an "Apply Settings" full-width button. The popover is positioned `absolute top-[3.25rem] right-4`.

**Issue — brief §10 non-goal, brief §5 responsive contract:**  
Brief §10 explicitly prohibits "heavy settings panel / modal / separate settings route." The mobile popover, while visually small, is a settings panel — a purpose-built dropdown container with its own title ("Timer Configuration"), two form rows, and a primary CTA. This is structurally equivalent to the non-goal the brief fences off. Brief §5 states the preference is "a compact/collapsed entry at slim width" — a single inline toggle, not a panel with a dedicated heading.

The brief's preferred slim approach (§5: "gear/edit affordance" or "stacks minimally") implies the inputs themselves appear in a reveal row beneath the slim countdown bar — flush with the widget, no separate panel chrome, no title, no shadow-pop elevation. The popover's `shadow-[var(--shadow-pop)]` elevation further escalates the visual weight beyond what an inline row reveal would carry.

**F-1 phase border gap:**  
The slim frame (Section 06) shows a `h-1.5` progress bar at the bottom of the simulated device frame. This is rendered as a standalone rounded bar rather than the 2px emerald/amber phase left-border that F-1 specifies ("the 2px emerald/amber phase left-border (F-1)"). The brief reviewer briefing (§11) requires the affordance to stay "out of the way of the countdown/phase-bar at every breakpoint." The section demonstrates the config behind the faders icon correctly, but the F-1 phase border itself — a left-border on the widget card, not a bottom progress bar — is absent from the slim mockup frame. The reviewer cannot assess whether the collapsed config state interferes with the left-border because the border is not shown.

**What would make it a 10:** Replace the mobile popover with an inline reveal row. On faders-button click, a row beneath the countdown bar slides in (or appears instantly under reduced-motion) containing the two compact inputs and Apply inline — no panel wrapper, no title, no `shadow-pop`. Apply the F-1 2px left-border (`border-l-2`) to the widget card in the slim frame so the interaction between the collapsed config and the phase bar can be assessed.

---

## Summary of Required Revisions

| # | Issue | Brief / DS ref | Severity |
|---|-------|----------------|----------|
| R-1 | Mobile popover is a settings panel (separate title, shadow-pop, full-width CTA) — brief explicitly prohibits heavy settings panel | Brief §10 non-goal; Brief §5 | Must fix |
| R-2 | Slim mockup (Section 06) omits the F-1 2px phase left-border; cannot assess crowding | Brief §11 reviewer briefing; Brief §5 | Must fix |
| R-3 | Hero widget validation JS does not wire `aria-describedby` error message; screen reader gets `aria-invalid` only | DESIGN-SYSTEM §8 Form field group; Brief §9 | Must fix |

| # | Issue | Brief / DS ref | Severity |
|---|-------|----------------|----------|
| N-1 | Locked-state `/` separator uses `--border-hairline` (nearly invisible); `--text-muted` is more intentional | DESIGN-SYSTEM §1 | Nice-to-have |
| N-2 | Hero hint text "Reset to edit" vs. locked card "Reset timer to change lengths" vs. brief "Reset the timer to change lengths" — align to brief phrasing | Brief §6 | Nice-to-have |
| N-3 | `/` separator `mt-3` offset creates minor vertical misalignment vs. input center in static state cards | DESIGN-SYSTEM §3 spacing | Nice-to-have |

---

## What Is Explicitly Approved

- All six design tokens (`--surface-800`, `--border-hairline`, `--accent-emerald`, `--accent-amber`, `--danger`, `--danger-text`) are used correctly with no invented hex.
- `.btn`, `.btn-sm`, `.btn-md`, `.btn-primary`, `.btn-ghost`, `.btn-secondary` are exact copies from `study-timer.html` — no drift.
- The inline config form at `≥1024px` is a genuinely restrained secondary affordance that does not crowd the countdown or phase pill.
- All five required states are present and visually distinct at full width.
- `prefers-reduced-motion` is handled comprehensively.
- `aria-label` on both number inputs satisfies the brief §9 keyboard-accessibility requirement.
- `aria-busy` on the applying-state button and `aria-invalid` on the error input are correct.
- No per-user preferences, no presets, no history UI — scope fence is clean.
- No modal, no separate route, no new component class beyond `input-base` and `input-error` (both are extensions of existing DESIGN-SYSTEM input primitive, not invented components).

The full-width implementation is approvable as-is. The three required revisions are scoped entirely to the slim-bar responsive section and the hero widget's live validation JS — they do not require reworking the core affordance design.
