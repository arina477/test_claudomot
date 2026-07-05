# D-3 Plan Design Review — Timer Duration Config Affordance (Iteration 1 Re-Review)

**Reviewer role:** ui-designer (D-3 re-review)
**Mockup:** `design/staging/timer-duration-config.html`
**Brief:** `process/waves/wave-50/stages/D-1-brief/timer-duration-config-brief.md`
**Design system ref:** `design/DESIGN-SYSTEM.md`
**Adopted parent:** `design/study-timer.html`
**Review type:** Iteration 1 re-score — verifying resolution of R-1, R-2, R-3 from prior REVISE verdict + full re-score

---

## Verdict

**APPROVE**

All three required revisions from the prior REVISE verdict are fully resolved. No new blocking issues were introduced. The mockup is ready for adoption.

---

## R-1 / R-2 / R-3 Resolution Verification

### R-1 — Slim inline reveal row, not a settings panel (Brief §10, §5)

**Resolved.** Section 06 now renders the slim frame as a `glass-panel` flex-column. The top row holds the countdown, the faders toggle button (`aria-expanded`, `aria-controls`), and the Start button. On toggle, `mobile-config-row` (a sibling div in normal flow) is revealed as a horizontal flex row beneath the countdown: two compact inputs + "Apply" button, all inline. No separate panel wrapper, no "Timer Configuration" heading, no `shadow-pop` elevation, no full-width CTA. The revealed row uses `border-t border-[var(--border-hairline)]` to separate it visually — exactly the "slim inline reveal beneath the countdown" pattern the brief §5 specifies.

### R-2 — F-1 2px phase left-border on slim frame (Brief §11, §5)

**Resolved.** Line 473 applies `style="border-left: 2px solid var(--accent-emerald);"` directly to the device-frame div. The emerald left-border is rendered on the same element that contains the countdown, toggle, and inline reveal row — correctly positioned so the reviewer can assess that the config row sits inside the bordered card without crowding or overlapping the border. The accompanying description text at line 469 calls the interaction out explicitly.

### R-3 — Live hero validation: aria-invalid + aria-describedby + aria-live + icon+text (DESIGN-SYSTEM §8, Brief §9)

**Resolved.** The `checkHeroDirty` JS function now wires the full accessibility chain on validation failure:

- `aria-invalid="true"` set on the offending input
- `aria-describedby` set to the ID of the injected error span (`hero-work-error-id` / `hero-break-error-id`)
- Error span injected into a container declared `aria-live="polite"` (`hero-work-error-container` / `hero-break-error-container`)
- Injected span includes a `ph-fill ph-warning-circle` icon and text ("Max 120m" / "Max 60m")

On clear/correct, `aria-invalid` and `aria-describedby` are removed and the live region is emptied. This mirrors the static Section 04 card pattern and satisfies DESIGN-SYSTEM §8 Form field group ("error text via `aria-describedby`").

---

## Full Re-Score

### 1. Visual Hierarchy — 9 / 10

At `≥1024px`, the hero countdown (40px Geist Mono, `--text-primary`) dominates. The inline config form is separated from it by a `--border-hairline` vertical divider and `pl-6` padding, placing it clearly in secondary territory. The phase pill is undisturbed. The five state cards (Sections 02–05) each read as isolated snapshots with no ambiguity between states.

At `<1024px`, the countdown row remains the visual anchor. The faders button is a 28px ghost icon — lower visual weight than the Start button beside it. The inline reveal row, when open, adds inputs and Apply at a subordinate scale (`h-7`, `text-xs`, `text-[10px]`) that does not compete with the `text-2xl` countdown above it.

Minor residual: the `/` separator between Work and Break in the desktop static state cards uses `mt-3` (line 302, 357), which positions it midpoint between the label and input rather than strictly aligned to the input vertical center. This is cosmetic and was flagged as a nice-to-have (N-3) in the prior review; it does not affect legibility or hierarchy. Not a blocking issue.

### 2. Spacing Rhythm — 9 / 10

Desktop inline form: `gap-3` between fields, `pl-6` inside the hairline-bordered form, `mt-4` on the Apply wrapper — consistent with the DESIGN-SYSTEM §3 4px base unit and the `gap-2`/`gap-3` patterns in `study-timer.html`. State card containers use `p-8` (documentation shell) vs. `p-4 lg:px-5 lg:py-4` in the live widget — an intentional distinction between showcase and product context, correctly maintained.

Slim frame: `gap-3` on the top row, `gap-1.5` between toggle and Start button, `gap-2` inside the reveal row inputs. Compact but not cramped at the simulated 400px max-width. The `pt-3 mt-3 border-t` separator between countdown row and reveal row provides adequate breathing room without introducing a new spacing token.

### 3. Brand Coherence — 10 / 10

Every CSS custom property in the `:root` block matches DESIGN-SYSTEM §1 exactly: surface scale, border tokens, text tokens, all four accents, all radius and shadow/glow tokens. No invented hex appears outside the canonical token declarations. The one non-variable color literal (`color: #fff` in `.btn-primary`) is identical to the parent `study-timer.html` and represents white — not an invented brand hex.

All six button classes (`.btn`, `.btn-sm`, `.btn-md`, `.btn-primary`, `.btn-ghost`, `.btn-secondary`) are exact copies from `study-timer.html` — no drift. `input-base` and `input-error` are new CSS classes but they compose exclusively from existing tokens (`--surface-800`, `--border-hairline`, `--accent-emerald`, `--glow-focus`, `--danger`, `--danger-text`, `--glow-danger`, `--radius-md`) with no invented values. `--glow-danger` is defined in DESIGN-SYSTEM §5 and correctly wired in `.input-error:focus`. No new component class introduces any foreign token.

### 4. State Coverage and Legibility — 9 / 10

All five required states (Brief §3) are present, implemented, and visually distinct:

- **Idle-editable:** Inputs enabled at `--surface-800` fill + hairline border; Apply disabled until dirty + valid. Correctly shown in Section 02 (static) and in the live hero widget (JS gate: `isDirty && isWValid && isBValid`).
- **Locked (running/paused):** Inputs disabled (`opacity: 0.5`, `cursor: not-allowed`, transparent border per `.input-base:disabled`); Apply hidden behind an accessible hint; labels shift to `--text-muted`. The JS keeps inputs locked on pause as well as run, matching the brief §3 "running or paused" spec. Static Section 03 and live hero are consistent.
- **Validation-error:** `--danger` border (`input-error`), `--danger-text` on input text, Apply disabled, icon+text inline error in `aria-live` region. Static Section 04 and live hero now match.
- **Applying:** Inputs disabled, Apply replaced with `ph-spinner animate-spin`, `aria-busy="true"`. Section 05 static + hero JS `applyHeroSettings` path.
- **Applied/synced:** Hero JS resolves after simulated 1000ms: clock updates, baseline persists, inputs re-enable, Apply re-locks as not-dirty. No separate static section required; brief §3 accepts widget re-render as the demonstration.

Residual nice-to-have: the locked-state `/` separator (Section 03, line 384) uses `text-[var(--border-hairline)]` (`rgba(255,255,255,0.06)`) — effectively invisible. `--text-muted` (0.40 opacity) would be more intentional. Not a blocker; noted from prior review (N-1).

### 5. Accessibility — 9 / 10

**Passing items:**
- Both desktop number inputs carry `aria-label` (Brief §9 keyboard-accessibility).
- Both mobile inputs carry `aria-label` (`"Work duration minutes"`, `"Break duration minutes"`).
- Mobile faders toggle carries `aria-expanded`, `aria-controls`, and `aria-label="Toggle timer settings"` — correct disclosure pattern.
- Escape-to-close for the mobile reveal row is wired (`keydown` listener) with focus returned to trigger on close.
- `aria-busy="true"` on applying-state button (DESIGN-SYSTEM §8 Button).
- Validation error: full `aria-invalid` + `aria-describedby` + `aria-live` chain in the live hero widget. Static Section 04 includes `aria-invalid="true"` on the input.
- `prefers-reduced-motion` block is comprehensive — disables all transitions and animations including stagger reveals, matching `study-timer.html` coverage.
- Focus rings: `--glow-focus` (emerald) on standard inputs/buttons, `--glow-danger` on error-state inputs (DESIGN-SYSTEM §5).
- Phase pill uses `role="status"` consistent with adopted widget.

**Minor observation:** The mobile faders toggle (line 485) applies both the `.btn:focus-visible` class-based `--glow-focus` ring (inherited via `.btn`) and a Tailwind `focus:ring-2 focus:ring-[var(--accent-emerald)]` utility. These two rules target different pseudo-classes (`focus-visible` vs. `focus`) and will coexist without conflict, but the Tailwind `focus:` utility is redundant given the class-level rule. No accessibility or token violation; harmless duplication.

**Remaining gap (non-blocking for approval, recommend closing at implementation):** The mobile reveal row's inputs have no validation wiring — no `aria-invalid`, no `aria-live` error region on invalid entry. The brief §9 accessibility checklist applies equally to the slim variant. This is acceptable in a static mockup but should be carried forward as an implementation spec note.

### 6. Responsive / Slim-Bar — 9 / 10

The slim frame (Section 06) satisfies all three prior concerns:

1. The reveal is an inline row — no panel, no title, no shadow escalation.
2. The F-1 `border-left: 2px solid var(--accent-emerald)` is applied to the widget card.
3. The reveal row sits inside the bordered card (below a hairline `border-t` separator), clearly not crowding the left-border or the countdown.

The frame is constrained to `max-w-[400px]` — a realistic narrow-viewport simulation. The collapsed state (toggle visible, row hidden) is the default presentation, keeping the countdown + Start button as the primary affordants at slim width.

The amber break-phase case (F-1 specifies both emerald for Work and amber for Break) is not shown as a separate slim frame. Only the emerald Work phase is depicted. This is acceptable for a mockup — the border color is a single token swap (`--accent-amber`) and the structural layout is identical. Recommend the implementation spec note that both colors must be applied at the component level.

---

## Summary

| Dimension | Score |
|-----------|-------|
| Visual hierarchy | 9 / 10 |
| Spacing rhythm | 9 / 10 |
| Brand coherence | 10 / 10 |
| State coverage + legibility | 9 / 10 |
| Accessibility | 9 / 10 |
| Responsive / slim-bar | 9 / 10 |

**R-1 resolved.** No settings panel at slim width — inline reveal row only.
**R-2 resolved.** F-1 2px emerald left-border present on slim frame.
**R-3 resolved.** Hero live validation wires `aria-invalid` + `aria-describedby` + `aria-live` + icon+text.

No new blocking issues introduced. All tokens correct, all five states legible, brief scope fence intact (no per-user preferences, no presets, no history UI, no modal, no separate route).

---

## Implementation Spec Notes (carry forward to B-block)

1. Mobile reveal row inputs need the same `aria-invalid` / `aria-describedby` / `aria-live` validation wiring as the desktop form — not shown in the mockup (static), required in the component.
2. F-1 left-border color must switch between `--accent-emerald` (Work phase) and `--accent-amber` (Break phase) at the component level — only the emerald case is depicted in the mockup.
3. Hint text alignment: use "Reset the timer to change lengths" (Brief §6) consistently across locked state hint element and static card.
4. Locked-state `/` separator: consider `--text-muted` rather than `--border-hairline` for intentional legibility (N-1 from prior review).
