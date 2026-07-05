# D-3 Review — Shared Study Timer (ui-ux-pro-max lens)
**Reviewer:** Reviewer B (ui-ux-pro-max / UX + requirement + token audit)
**Iteration:** 1 (post-refine)
**Mockup:** `design/staging/study-timer.html`
**Brief:** `process/waves/wave-49/stages/D-1-brief/study-timer-brief.md`
**Design system ref:** `design/DESIGN-SYSTEM.md`

---

## VERDICT: APPROVE

All five binary/load-bearing blockers from the prior REVISE verdict are resolved in this iteration. The §9 criteria are substantially met. Three nits are documented below and should be tracked for the B-block implementation pass; none prevent approval of the visual design direction.

---

## Prior-Iteration Fix Verification

Each item flagged as "Required Fix Before APPROVE" in the previous review is verified here first.

| Required Fix | Status | Evidence |
|---|---|---|
| 1. aria-live on phase pill + role=status on ConnectionStateIndicator | RESOLVED | Phase pill (hero, line 281): `role="status" aria-live="polite" aria-atomic="true"`. Break pill (line 411): same. Paused badge (line 464): `role="status" aria-live="polite"`. ConnectionStateIndicator wrapper (line 548): `role="status" aria-live="polite"`. |
| 2. prefers-reduced-motion block | RESOLVED | Comprehensive block at lines 204-216 disables `animation-duration`, `animation-iteration-count`, `transition-duration`, scroll-behavior. Explicitly zeroes `.animate-colon`, `.skeleton-layer`, `.btn:active` transform, all four stagger classes, and `.glass-panel:hover` transform. JS pause handler at lines 596-601 also checks `window.matchMedia('(prefers-reduced-motion: reduce)')` before re-adding the colon animation. |
| 3. Roster distinctness: non-color differentiator + amber rings on Break | RESOLVED | Non-color differentiator: each roster avatar carries a `ph-fill ph-timer` icon badge at bottom-right (lines 316, 325, 333). This badge — not color — communicates "in this study timer." Break-state avatars (lines 430, 438) use `border-[var(--accent-amber)]` rings and `text-[var(--accent-amber)]` timer badges. No grayscale drop. |
| 4. icon-only button aria-label not title | RESOLVED | Skip Break (line 419): `aria-label="Skip Break"`. Break pause (line 422): `aria-label="Pause timer"`. Compact-bar play (line 488): `aria-label="Resume tracking"`. Reset (line 295): `aria-label="Reset timer"`. No `title` attribute used for accessibility anywhere in the document. |
| 5. Restore --border-hairline to 0.06 and --border-hover to 0.10 | RESOLVED | `:root` definition (lines 37-38): `--border-hairline: rgba(255,255,255,0.06)` and `--border-hover: rgba(255,255,255,0.10)`. Match DS §1 exactly. No inset additions on `--shadow-sm` or `--shadow-pop`. |

---

## §9 Success-Criteria Audit

### Criterion 1 — Tokens: only DESIGN-SYSTEM.md tokens, no new hex, dark-only
**MET**

Surface, text, accent, danger, radius, and shadow tokens are all correctly defined and match DS §1 values exactly. Dark-only is maintained throughout (`html.dark` baseline, `--surface-950` root background).

Spot-check:

| Token | DS value | Mockup `:root` | Match |
|---|---|---|---|
| `--border-hairline` | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.06)` | PASS |
| `--border-hover` | `rgba(255,255,255,0.10)` | `rgba(255,255,255,0.10)` | PASS |
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.4)` | `0 1px 2px rgba(0,0,0,0.4)` | PASS |
| `--shadow-pop` | `0 8px 24px rgba(0,0,0,0.5)` | `0 8px 24px rgba(0,0,0,0.5)` | PASS |
| `--glow-focus` | `0 0 0 2px rgba(16,185,129,0.4)` | `0 0 0 2px rgba(16,185,129,0.4)` | PASS |
| `--glow-subtle` | `0 0 15px rgba(255,255,255,0.05)` | `0 0 15px rgba(255,255,255,0.05)` | PASS |
| `--accent-emerald` | `#10b981` | `#10b981` | PASS |
| `--accent-amber` | `#f59e0b` | `#f59e0b` | PASS |

No raw rgba inline shadow or glow values above 0.4 opacity found. No neon glows. `--glow-subtle` at 0.05 opacity is correctly restrained. The `bg-[var(--danger)]/5`, `/10`, `/20`, `/30` opacity modifiers in the error section use CSS-var arithmetic through Tailwind — token-compliant approach.

One minor non-blocking note: `color: #fff` in `.btn-primary` (line 122) is not a defined token — `--text-primary` is `rgba(255,255,255,0.92)`. Pure white on emerald is the standard for maximum contrast on a filled primary button; this is semantically correct and not a token drift concern. Noted for completeness only.

---

### Criterion 2 — ALL §3 states rendered: idle / running-Work / running-Break / paused / loading / error + roster empty/few/many
**MET**

| State | Section | Present |
|---|---|---|
| Idle | 02 / State: Idle | Yes — `25:00` in `--text-muted`, "Start a focus session" label, emerald Start button |
| running-Work | 01 / Contextual Integration (hero) | Yes — emerald Focus pill, `24:59`, `8 studying`, avatar cluster with `+5` overflow |
| running-Break | 03 / State: Break (Amber) | Yes — amber Break pill with `ph-coffee`, `04:59` running colon, amber avatar rings |
| Paused | 04 / State: Paused | Yes — `12:34` at `opacity-70`, neutral "Paused" badge, Resume + Reset |
| Loading | 06 / State: Loading Sync | Yes — skeleton shimmer on countdown placeholder and control placeholders |
| Error | 07 / Error & Disconnect Recovery | Yes — danger banner + `ph-warning-circle`, cause text, "Retry Connection" CTA, Reconnecting and Offline sub-states |
| Roster empty | 02 (idle) | Yes — dashed outline avatar + "Empty" label |
| Roster few | 03 (break, 2 avatars) | Yes |
| Roster many | 01 hero (3 named avatars + "+5" overflow chip) | Yes |

Complete. No state is missing.

---

### Criterion 3 — Countdown: large tabular-nums hero, no digit jitter; Work=emerald / Break=amber
**MET**

- `.tabular-countdown` applies `font-variant-numeric: tabular-nums` and `letter-spacing: -0.02em` using Geist Mono. Digits will not jitter.
- Hero: `text-[32px] lg:text-[40px] font-semibold` — well above the brief's `text-2xl` minimum. Appropriate hero scale.
- Meso panels: `text-3xl` (idle, break, paused) — consistent across all state panels.
- Compact bar: `text-sm font-semibold` — appropriate for a slim bar context.
- Work=emerald: hero widget uses emerald Phase pill (with emerald 10% tint and emerald dot), emerald avatar ring borders, emerald timer badge icons, emerald "Live sync" label. The phase identity is unambiguous.
- Break=amber: amber Phase pill with coffee icon, amber avatar ring borders, amber timer badge icons, amber background tint. Equally unambiguous.
- Paused: neutral `--surface-700` badge — correctly dissociated from both active phase colors.

---

### Criterion 4 — Responsive per §5 (full at 1280+, slim running-bar under 1024)
**MET — with one implementation note**

- Hero widget: `flex-col lg:flex-row lg:items-center` breakpoint correctly at `lg` (1024px). Left/middle/right layout columns collapse to a stacked column below 1024px. Breakpoint alignment is corrected from the prior iteration's `md` (768px) error.
- Section 05 "Compact Layout" is labeled "Viewport < 1024px" and depicts the slim bar: play icon + `18:02` countdown (Geist Mono, font-semibold) + user count. The slim-bar intent is legible.

Implementation note (non-blocking): Brief §5 specifies the slim bar contains "mm:ss + phase + pause." The phase indicator is absent from the slim bar mockup — the bar shows play/pause and count but not the Work/Break identity. At B-block, a small phase color accent (border-left or dot) should be added to the slim bar so users can determine the phase at a glance without opening the full view. This is a scoping nit for implementation, not a rejection concern for the design direction.

---

### Criterion 5 — Reuses Button / Badge / Avatar / Card / Empty-Loading-Error primitives
**MET**

- Button: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`; sizes `.btn-md` / `.btn-sm`; focus-visible ring via `--glow-focus`; disabled via `opacity-0.4 pointer-events-none`; active scale `0.96`. All match DS §8 Button spec.
- Badge/Pill: Phase pill uses `rounded-[var(--radius-full)]`, semantic color fills (emerald or amber tint), `text-xs font-medium uppercase tracking-wide`. Matches DS §8 Badge/Pill.
- Avatar: `w-8` (32px) and `w-6` (24px) sizes, `rounded-full`, `ring-2` background separation, initials fallback ("AJ" on `--surface-700`), `alt` = display name. Matches DS §8 Avatar.
- Card: `glass-panel` = `--surface-800` fill, `--border-hairline` border, `--radius-lg`, `--shadow-sm`, hover `--border-hover` + `--glow-subtle`. Matches DS §8 Card interactive variant.
- Empty: Dashed placeholder avatar + "Empty" label in idle (section 02). Matches DS §8 Empty pattern.
- Loading: Shimmer `skeleton-layer` using `--surface-700/600` gradient, `border-radius: var(--radius-sm)`. Matches DS §8 Loading. Correctly avoids spinners for content areas.
- Error: Danger icon + cause text + retry CTA (section 07). Matches DS §8 Error pattern with correct `role="alert"` on the error container (line 533).
- ConnectionStateIndicator: Reconnecting (amber dot + spinner + text) and Offline (grey dot + "Offline" + "Sync halted") with `role="status" aria-live="polite"`. Matches DS §8 ConnectionStateIndicator spec.

No bespoke re-invention found.

---

### Criterion 6 — "Studying now" roster VISUALLY DISTINCT from online-presence dots (load-bearing, jenny P-4 note C)
**MET**

The prior-iteration partial is resolved. Two layered differentiators are now present:

1. Non-color differentiator (icon badge): Every roster avatar carries a `ph-fill ph-timer` icon badge in a small circle at the bottom-right (lines 315-317, 324-326, 332-334). This is structurally different from the DS's online-presence dot (a plain color dot per DS §8 MemberListItem). A screen reader sees the timer icon; a color-blind user sees the icon shape; anyone can distinguish "timer icon badge" from "plain color presence dot."

2. Phase-aware ring color: Work-state roster avatars use `border-[var(--accent-emerald)]` rings. Break-state roster avatars use `border-[var(--accent-amber)]` rings. The amber ring in Break state creates an explicit non-emerald signal, preventing the emerald-only semantic overlap with `--presence-online` from being the sole marker.

3. Verbal context: "8 studying" / "Live sync" label area reinforces the focus-timer scoping in text, not color.

The combination of icon badge + phase-colored ring + verbal label satisfies the jenny P-4 note C requirement. The color-overlap concern (emerald ring vs. emerald presence dot) is mitigated by the icon badge being the primary differentiator; the ring color is phase-meaningful, not presence-meaningful.

---

### Criterion 7 — All icon references are real Phosphor names
**MET**

| Usage | Icon class | Valid |
|---|---|---|
| App header | `ph ph-books` | Yes |
| Channel header | `ph ph-hash` | Yes |
| Connection chrome | `ph ph-plugs-connected` | Yes |
| Members chrome | `ph ph-users`, `ph ph-user` | Yes |
| Pause controls | `ph-fill ph-pause` | Yes |
| Reset | `ph ph-arrow-counter-clockwise` | Yes |
| Break phase | `ph ph-coffee` | Yes |
| Skip break | `ph-fill ph-fast-forward` | Yes |
| Start / resume | `ph-fill ph-play` | Yes |
| Error | `ph ph-warning-circle` | Yes |
| Loading | `ph ph-spinner` | Yes |
| Roster presence | `ph-fill ph-timer` | Yes |

All 12 distinct icon identifiers are real Phosphor v2 catalog names. Filled variants (`ph-fill`) correctly applied only to active/selected states (play, pause, timer badge). No invented or incorrect names found.

---

### Criterion 8 — A11y: real buttons + focus ring; aria-labelled region; aria-live on phase; prefers-reduced-motion; icon-btn aria-label not title; role=status on connection indicator
**MET**

| Sub-criterion | Status | Evidence |
|---|---|---|
| Controls are real `<button>` elements | PASS | Start, Pause (hero), Reset, Skip Break, Pause (break), Resume, Reset (paused), Compact play, Retry Connection — all `<button>` |
| Focus-visible ring | PASS | `.btn:focus-visible { outline: none; box-shadow: var(--glow-focus); }` globally applied |
| Widget is aria-labelled region | PASS | `role="region" aria-label="Shared Study Timer"` on hero widget (line 269) |
| aria-live on phase change | PASS | Hero phase pill: `role="status" aria-live="polite" aria-atomic="true"` (line 281). Break pill: same (line 411). Paused badge: `role="status" aria-live="polite"` (line 464). |
| prefers-reduced-motion | PASS | Lines 204-216: `animation-duration: 0.01ms`, `animation-iteration-count: 1`, `transition-duration: 0.01ms`, `scroll-behavior: auto` on `*, ::before, ::after`. Explicit nullifications for `.animate-colon`, `.skeleton-layer`, `.btn:active` transform, all stagger classes, `.glass-panel:hover`. JS handler also checks `matchMedia` before re-adding colon animation on resume. |
| Icon-only buttons: aria-label not title | PASS | `aria-label="Skip Break"` (line 419), `aria-label="Pause timer"` (line 422), `aria-label="Reset timer"` (line 295), `aria-label="Pause session"` (line 292), `aria-label="Resume tracking"` (line 488). No `title` attribute used for interactive element naming anywhere. |
| role=status on ConnectionStateIndicator | PASS | Line 548: `role="status" aria-live="polite"` on the ConnectionStateIndicator container. Dot indicators are `aria-hidden="true"`; state conveyed in text ("Reconnecting...", "Offline", "Sync halted"). |

One minor nit: The paused phase badge has `aria-live="polite"` but no `aria-atomic="true"` (unlike the Work and Break pills). This is immaterial for this particular element since it is static text in the mockup, but the implementation should add `aria-atomic="true"` for consistency so partial updates do not result in a screen reader reading only the changed portion of the live region.

---

### Criterion 9 — Calm/academic/quieter-than-Discord: no neon, no big animations
**MET**

The palette is restrained: layered zinc surfaces, single emerald accent, single amber accent. No bright gaming neon. No large animations — the most expressive motion is the stagger slide-up reveal (16px translateY over 600ms) which is a page-load aesthetic choice that does not affect the widget's running behavior.

One nit: Stagger animations use `cubic-bezier(0.16, 1, 0.3, 1)` (expo ease-out). DS §6 states "No bouncy/playful easing." Expo ease-out does not overshoot — there is no bounce — but it is slightly more expressive than a plain `ease-out`. This is marginal, not egregious, and is entirely suppressed by the prefers-reduced-motion block. For the B-block implementation these should use `cubic-bezier(0.2, 0, 0, 1)` or plain `ease-out` to stay clearly within the DS guidance.

---

## UX Flow Assessment

**Start → focus → auto-advance Work → Break → everyone-sees-same-timer:**
- Idle state (section 02): "Start a focus session" label + emerald primary Start button. CTA is unambiguous and prominently positioned. Timer at `25:00` in muted text signals the hardcoded default (brief §10 — no custom durations this wave). Clear.
- Running-Work (section 01 hero): "8 studying" + "Live sync" label communicates shared-timer semantics. The shared-session premise reads immediately.
- Running-Break (section 03): Amber theming with coffee icon signals break. Skip and Pause controls present. Correct.
- Transition between states is conveyed through separate mockup panels (acceptable for a static design; color transition is spec'd at brief §6 — 200ms emerald-amber fade, which the prefers-reduced-motion block handles).

**Idle CTA:** Prominent. No dead end.

**Paused — frozen remaining:** `12:34` at `opacity-70` with "Paused" badge. Dimming communicates frozen state. Resume and Reset are both accessible. No recovery dead end.

**Error recovery:** Section 07 — "Timer sync disconnected" + cause text + "Retry Connection" button. Reconnecting vs. Offline sub-states are distinguishable (amber active vs. grey inactive) with non-color text signals. Clean recovery path.

**Presence roster — empty state:** Dashed placeholder avatar with "Empty" label in idle prevents the roster area from being a confusing void. Correct empty-state handling.

---

## Token Audit — Additional Spot Checks

**No ad-hoc neon rgba shadows found:** Exhaustive search of all `shadow-[...]` and `drop-shadow-[...]` class attributes in the HTML found no values with opacity above 0.4. The only box-shadow definitions are:
- `var(--shadow-sm)` — token
- `var(--shadow-pop)` — token (referenced in `:root`, not applied inline in this document)
- `var(--glow-focus)` — token
- `var(--glow-subtle)` — token

The prior-iteration phase-dot `shadow-[0_0_8px_rgba(16,185,129,0.8)]` (0.8 opacity neon glow) is gone. Not present anywhere in this document.

**No inset shadow additions:** `--shadow-sm` and `--shadow-pop` match DS §5 definitions without the `inset 0 1px 0 rgba(255,255,255,0.04)` additions that were flagged in the prior review.

**Border token usage:** `border-[var(--border-hairline)]` and `border-[var(--border-hover)]` used consistently via CSS custom properties. No raw rgba border values found in class attributes.

---

## Spacing and White Space Audit

- Widget internal padding: `p-4` (16px) matches brief §4 spec. ✓
- Control gap: `gap-2` (8px) in the idle and break control rows. Matches brief §4 "control gap 8px." ✓
- Section headers: `px-4 py-2` (16px/8px) — appropriate compact chrome for a documentation grid.
- Main grid: `py-12 gap-8 pb-32` — `pb-32` (128px) is generous for a showcase page but not a widget defect. Nit only.
- Roster section in hero: `pt-3 lg:pt-0 lg:pl-5` separation on mobile vs. desktop. The border separator (`border-t lg:border-t-0 lg:border-l`) cleanly delineates the roster from controls on both breakpoints. Good.

---

## Remaining Nits (Non-Blocking — Implementation Tracking)

**Nit 1 — CSS syntax error in `.btn` transition declaration**
Line 98: `transition: transition-colors 150ms ease;`
`transition-colors` is a Tailwind utility class name, not a valid CSS property identifier. Valid forms are `transition: color 150ms ease` or `transition: color, background-color, border-color 150ms ease`. This malformed declaration has no visual effect because Tailwind utility classes on the elements themselves override it, but the raw CSS in the `<style>` block contains an invalid value. Fix at implementation: replace with `transition: color 150ms ease, background-color 150ms ease, border-color 150ms ease` or rely solely on Tailwind's `transition-colors` utility class on the element.

**Nit 2 — Slim bar (section 05) missing phase indicator**
Brief §5: the <1024 slim bar should show "mm:ss + phase + pause." The compact bar shows play + `18:02` + user count but no phase signal. At minimum a phase-accent left border (2px emerald or amber) should be added to the slim bar at B-block implementation so the Work/Break state is glanceable without expanding the widget.

**Nit 3 — Interactive icon elements in mock chrome are `<i>` not `<button>`**
Lines 262-263: `ph-plugs-connected` and `ph-users` icons in the mock channel header use `<i>` elements with `cursor-pointer` and `aria-label` rather than `<button>` elements. These are decorative chrome in a documentation mockup (not part of the actual timer widget controls), so this does not affect the timer's a11y score. At B-block these decorative chrome icons should be `<button>` elements per DS §8 Button spec.

---

## Summary

All §9 criteria are met. The five binary/load-bearing blockers from the prior REVISE verdict are fully resolved. Three nits are documented for B-block implementation. The design direction is approved for adoption.
