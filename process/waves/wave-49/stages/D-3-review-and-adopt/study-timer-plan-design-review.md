# D-3 Design Review — Study Timer Widget
**Reviewer:** Reviewer A (`/plan-design-review` lens)  
**Artifact:** `design/staging/study-timer.html`  
**Brief:** `process/waves/wave-49/stages/D-1-brief/study-timer-brief.md`  
**Design system:** `design/DESIGN-SYSTEM.md`  
**Date:** 2026-07-05

---

## Verdict: REVISE

The design is architecturally sound and covers all required states with correct visual language. The countdown is the clear hero, the dark-only palette is maintained, Phosphor names are valid, and all §3 states are rendered. However, four concrete named gaps prevent APPROVE: two missing a11y requirements that are explicitly enumerated in both brief §6 and §9, two border-token overrides that break the "no invented tokens" contract in brief §9 / DS §1, and a bouncy cubic-bezier that the design system explicitly prohibits in §6. All four are straightforward to fix in a single second pass.

---

## Lens Scores

### 1. Visual Hierarchy — 9 / 10

The mm:ss countdown is the unambiguous hero in every full-size state. In the contextual hero (section 01) it renders at `32px` / `40px` semibold with `tabular-nums` — larger and heavier than anything else in the widget row. The phase pill (xs, muted tint) and roster ("8 studying", xs) are correctly subordinate. Controls sit mid-weight at btn-md height without competing.

**What makes it a 10:** The Paused state (section 04) drops to `text-2xl` instead of `text-3xl` used by the full-width states. That is partly column-width-motivated (`col-span-4`), but the reduced size does weaken the countdown's dominance in the one state where a user most needs to read remaining time at a glance. Keep `text-3xl` even at the narrower column span, and rely on the layout wrapping rather than shrinking the number.

### 2. Spacing Rhythm — 8 / 10

Panel padding is `p-4` (16px) throughout, matching DS §3's "panel padding 16px" exactly. Control gap in the hero and Break states is `gap-2` (8px), matching DS §3's "control gap 8px". The timer-to-pill cluster uses `gap-5` (20px) — one notch above the 16px rung on the 4px grid; acceptable as an intra-cluster separation.

**What makes it a 10:** The Idle state's outer flex container uses `gap-4` (16px) between the Start button group and the empty-roster cluster, rather than the 8px control gap the brief specifies. This one gap is inconsistent. Tighten Idle's control area to `gap-2` for uniformity.

### 3. Brand Coherence — 6 / 10

The aesthetic direction is correct: deep zinc surfaces, Geist/Geist Mono typography, emerald-for-focus, amber-for-break, no gaming neon, calm content density. Dark-only is enforced. All semantic color mappings (Work=emerald, Break=amber, error=danger, roster presence=emerald) align with DS §1.

**Two concrete violations:**

**a. Border token overrides (brief §9 / DS §1).**  
The mockup redefines tokens at the root:
- `--border-hairline: rgba(255,255,255,0.08)` — DS specifies `rgba(255,255,255,0.06)`. The comment even flags this: "slightly bumped for pure visibility." Bumping it is an invented override, not a token.
- `--border-hover: rgba(255,255,255,0.15)` — DS specifies `rgba(255,255,255,0.10)`. Same pattern.

Brief §9 criterion 1 is explicit: "Uses exactly the DESIGN-SYSTEM.md tokens in §4 (no new hex, no invented tokens)." These are fractional-alpha overrides, but they are still overrides. Use `0.06` and `0.10` as defined.

**b. Bouncy easing (DS §6).**  
The `.glass-panel:hover` transition uses `cubic-bezier(0.175, 0.885, 0.32, 1.275)`. The terminal `1.275` coefficient produces an overshoot past the final value — a spring/bounce. DS §6 states explicitly: "No bouncy/playful easing — keep it calm and quick." The staggered reveal animations use `cubic-bezier(0.16, 1, 0.3, 1)`, which also reaches exactly 1.0 at the peak before settling — technically not an overshoot, but it produces a perceptible "pop" that reads as playful in the academic context. Replace the glass-panel hover curve with `ease-out` or `cubic-bezier(0.4, 0, 0.2, 1)` (standard material deceleration — calm, no pop). For the stagger reveals, `cubic-bezier(0.22, 1, 0.36, 1)` is an acceptable calm ease-out.

**Additional minor brand notes (not blocking):**  
- `drop-shadow-[0_2px_10px_rgba(16,185,129,0.15)]` on the countdown and `shadow-[0_0_6px_rgba(16,185,129,0.4)]` on roster avatar borders are ad-hoc values using raw emerald hex, not design system shadow tokens. The DS §5 defines `--glow-focus` and `--glow-subtle` for this purpose. Swap to those tokens; the 15px white glow in `--glow-subtle` is close enough to the 15px emerald used on the countdown and is the right precedent.
- `shadow-[0_0_8px_rgba(16,185,129,0.8)]` on the roster avatar's emerald indicator ring is at 80% opacity — the DS's `--glow-focus` uses 40% opacity. 80% reads closer to a neon pulse; reduce to 40% or use `--glow-focus` directly.
- The `--shadow-sm` and `--shadow-pop` custom property definitions append `inset 0 1px 0 rgba(255,255,255,0.04)` beyond the DS canonical values. This is a materiality detail, but it means the local token definitions drift from the DS source; the dev implementation won't match unless this is canonicalized.

**What makes it a 10:** Fix both token overrides to DS-specified values, replace the bouncy cubic-bezier, and collapse the ad-hoc hex shadow values to `--glow-focus` / `--glow-subtle`. The visual result will be indistinguishable; the code will be token-faithful.

### 4. Edge-Case Handling — 10 / 10

Every state enumerated in brief §3 is present and correct:

| State | Section | Treatment |
|---|---|---|
| Idle | 02 | Muted `text-muted` countdown, green Start CTA, empty roster |
| Running-Work | 01 (hero) | 40px countdown, emerald pill "Focus", avatar stack + "+5" |
| Running-Break | 03 | `text-3xl` countdown, amber pill "Break" + coffee icon |
| Paused | 04 | `text-2xl` countdown, neutral "Paused" chip, Resume + Reset |
| Loading | 06 | Skeleton shimmer on countdown + controls |
| Error | 07 | Danger-tinted panel + warning-circle icon + retry CTA + ConnectionStateIndicator primitives |
| Roster empty | 02 | Dashed-ring placeholder + "Empty" label |
| Roster few | 03 | 2 avatars |
| Roster many | 01 | 3 avatars + "+5" overflow chip |

The compact bar layout (section 05) demonstrates the `<1024` "slim running-countdown" contract from brief §5. The ConnectionStateIndicator in section 07 includes both "Reconnecting" (amber) and "Offline" (grey + danger text) sub-states, matching the DS §8 primitive contract.

---

## Additional Criterion Checks

### Token fidelity — PARTIAL PASS
Covered above. The border-hairline and border-hover overrides are the primary failures. All surface, text, accent, and semantic tokens match DS §1.

### Tabular-nums on countdown — PASS
`.tabular-countdown` applies `font-variant-numeric: tabular-nums` and `letter-spacing: -0.02em`. Used consistently on every countdown element. No digit jitter will occur.

### Phosphor icon names — PASS
All 12 icon references checked against the Phosphor catalog: `ph-books`, `ph-hash`, `ph-plugs-connected`, `ph-users`, `ph-fill ph-pause`, `ph-arrow-counter-clockwise`, `ph-fill ph-play`, `ph-coffee`, `ph-fill ph-fast-forward`, `ph-warning-circle`, `ph-spinner`, `ph-user`. All are valid Phosphor names. Filled variants (`ph-fill`) are used correctly for active/action states per DS §7.

### KEY criterion — studying roster visually distinct from online-presence dots (brief §9, jenny note C) — BORDERLINE PASS

The studying roster uses stacked overlapping avatars with a full emerald border ring. Standard online presence is a small emerald dot at the avatar's bottom-right corner (DS §8 Avatar: "optional presence dot"). Standard voice presence is an emerald ring around the avatar (DS §8 Avatar: "Voice presence: emerald ring around avatar").

The studying roster's full emerald border ring is formally identical to the voice-presence ring treatment. A user who has encountered both contexts could reasonably conflate them. What saves this from a fail: (1) the roster is embedded within a dedicated labeled widget panel, not in the member list; (2) the "8 studying" / "Live sync" label is immediately adjacent to the avatars; (3) the stacked overlapping layout is visually distinct from the linear member-list row.

The contextual containment provides adequate separation for MVP, but a stronger version would use a different presence marker inside the timer roster — for example, a small `timer` or `hourglass` glyph overlaid on the avatar rather than an emerald ring, making "studying-timer presence" visually distinguishable from "in voice" at a glance. Flag this for the D-2 variants discussion; it is not a blocking gap at this stage given the spatial+label context.

### A11y — FAIL on two explicit brief requirements

**Gap 1 — No `aria-live` region for phase changes (brief §6, §9).**  
The brief requires: "phase changes announced politely on phase change (aria-live)." No `aria-live="polite"` region is present in the HTML. When the timer transitions Work→Break or Break→Work, a screen-reader user receives no announcement. Add a visually-hidden `<div role="status" aria-live="polite" aria-atomic="true">` that receives the updated phase label on transition.

**Gap 2 — No `prefers-reduced-motion` override (DS §6, brief §6, §9).**  
The mockup defines four animations: `shimmer` (skeleton), `fade-tick` (colon blink), `slideUp` (stagger reveals), and relies on `animate-spin` (Tailwind) for the spinner. DS §6 states: "Respect `prefers-reduced-motion` — disable non-essential transitions." No `@media (prefers-reduced-motion: reduce)` block exists anywhere in the stylesheet. Add a block that: disables `slideUp` (set `animation: none`), disables `fade-tick` (the colon stays opaque), and disables the `glass-panel:hover` transform. The shimmer skeleton and spinner are functional indicators and can be retained or replaced with a static state.

**Passing a11y items:**  
- All controls are `<button>` elements (not divs). ✓  
- `.btn:focus-visible { box-shadow: var(--glow-focus); }` provides the visible focus ring. ✓  
- `role="region" aria-label="Shared Study Timer"` on the main widget. ✓  
- Avatar `alt` attributes carry display names. ✓  
- Error state has semantic heading for the error message. ✓

---

## Required Changes for APPROVE

Ordered by severity:

1. **Add `@media (prefers-reduced-motion: reduce)` block** (brief §9 / DS §6) — disabling `slideUp`, `fade-tick`, and `glass-panel` transform. Non-essential motion must be suppressible.

2. **Add `aria-live="polite"` phase region** (brief §6 / §9) — a visually hidden `role="status"` element updated on Work/Break transition. Screen-reader mandatory.

3. **Restore DS border tokens** (brief §9 / DS §1) — `--border-hairline: rgba(255,255,255,0.06)`, `--border-hover: rgba(255,255,255,0.10)`. Remove the overriding values from `:root`.

4. **Replace bouncy cubic-bezier on `.glass-panel:hover`** (DS §6) — use `cubic-bezier(0.4, 0, 0.2, 1)` (calm deceleration, no overshoot). Review the stagger animation easing similarly.

## Recommended (Non-blocking)

5. Replace ad-hoc `rgba(16,185,129,*)` shadow values on the avatar ring and countdown with `--glow-focus` (40% emerald) to maintain token fidelity.

6. Normalize the `--shadow-sm` / `--shadow-pop` local definitions to match DS §5 exactly (remove the appended inset clause from the token overrides so the implementation step doesn't diverge).

7. Raise the Paused state countdown back to `text-3xl` for hierarchy consistency.

8. Tighten the Idle state's inner control gap from `gap-4` to `gap-2` to match DS §3's "control gap 8px".

---

## Self-Review Gate

- [x] Brief read in full before scoring
- [x] Design system read in full before scoring  
- [x] All §3 states checked individually
- [x] All §9 success criteria checked individually
- [x] All Phosphor names cross-checked
- [x] Token hex values compared numerically against DS §1
- [x] A11y requirements from brief §6 and §9 checked in HTML
- [x] Reduced-motion checked in stylesheet
- [x] Verdict is proportionate to the gaps found (fixable items → REVISE, not REJECT)
