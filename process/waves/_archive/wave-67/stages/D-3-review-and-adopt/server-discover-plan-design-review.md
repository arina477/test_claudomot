# D-3 Plan-Design Review — /discover page
## Reviewer A · Iteration 3 (FINAL)
**Source:** `design/staging/server-discover.html`
**Brief:** `process/waves/wave-67/stages/D-1-brief/server-discover-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

---

## Iteration 3 — change delta from iteration 2

The sole change declared for this iteration: primary emerald buttons (Join on card grid, Retry Request in error state, Clear Search in empty-search state) now carry `text-surface-950` (`#0a0a0b`) instead of `text-white` (`#ffffff`).

Verification matrix for the iter-3 change and all iter-2 non-blocking items:

| Item | Status | Evidence |
|---|---|---|
| Join button: dark text on emerald | PASS | Line 530: `bg-accent-emerald text-surface-950` |
| Retry button: dark text on emerald | PASS | Line 318: `bg-accent-emerald text-surface-950 text-sm font-semibold` |
| Clear Search button: dark text on emerald | PASS | Line 340: `bg-accent-emerald text-surface-950 text-sm font-semibold` |
| `btn-spinner` reduced-motion (iter-2 non-blocking #1) | PASS | Lines 137–140: `@media (prefers-reduced-motion: reduce) { .btn-spinner { animation: none; opacity: 0.5; } }` |
| Error toast `role=alert` (iter-2 non-blocking #2) | PASS | Lines 421–426: `role` variable = `'alert'` for `type === 'error'`; comment confirms role="alert" is intrinsically assertive |
| Results `aria-live` announcement (iter-2 non-blocking #3) | PASS | Line 203: `<div id="search-announcer" class="sr-only" aria-live="polite"></div>`; `announcerValue` string set for all render branches (lines 486–592); `DOM.announcer.textContent = announcerValue` line 595 |
| `document.write()` replacement (iter-2 non-blocking #4) | PASS | Line 471: `DOM.skeletonGrid.innerHTML = Array(8).fill(tpl).join('')` — `innerHTML` assignment in `DOMContentLoaded`, no `document.write` present |
| h1 text-xl (iter-2 non-blocking #5) | PASS | Line 269: `class="text-xl font-semibold text-text-primary ..."` — confirms the `text-2xl` → `text-xl` correction per DESIGN-SYSTEM §2 |
| Geist typeface | PASS | CDN `geist@1.0.3` line 12; `fontFamily.sans: ['Geist', ...]` line 20 |
| No `hsl()` hues | PASS | `bgStyles` array lines 505–509 uses only palette-derived surface and emerald tint tokens |
| Joined "Open" button contrast | PASS | `bg-surface-700 text-white` = 14.7:1 — no change, no regression |
| Badge contrast | PASS | `bg-danger text-surface-950` = ~5.47:1 — no change, no regression |
| Token discipline (no invented hex) | PASS | All Tailwind config values map to DESIGN-SYSTEM §1 canonical values — no new hex introduced |
| Grid breakpoint parity | PASS | Loading grid line 305 and results grid line 347: identical `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` |

---

## DESIGN-SYSTEM §8 contradiction — resolution analysis

DESIGN-SYSTEM §8 Button carries two requirements that are in direct conflict:

- Variant descriptor: `primary (emerald fill, white text)`
- A11y line (same section): `≥4.5:1 text contrast`

**White-on-emerald contrast computation:** `#ffffff` on `#10b981` = 1.76:1. This is a WCAG AA Level FAIL by a factor of 2.5x. The descriptor and the binding A11y rule cannot simultaneously hold.

**Dark-on-emerald contrast computation:** `#0a0a0b` (surface-950) on `#10b981` = approximately 10.1:1. This exceeds WCAG AA (4.5:1) and WCAG AAA (7:1) thresholds for normal text. PASS at both levels.

**Resolution:** When a design system has an internal contradiction, the accessible reading is the binding one. The "white text" descriptor in §8 is an authoring error — it was written without running the contrast math, and it is overridden by the §8 A11y requirement it violates. Dark-on-emerald (`text-surface-950`) is therefore the AA-correct reading of §8, not a deviation from it. This is not the designer inventing a new pattern; it is the designer following the A11y line over the incorrect descriptor.

**Required system action (canonicalization):** DESIGN-SYSTEM §8 Button's `primary` descriptor must be updated from `emerald fill, white text` to `emerald fill, surface-950 text`. Any existing mockups or components using `text-white` on `bg-accent-emerald` become technical debt to be corrected in a follow-up pass. This D-3 review surfaces that update obligation; it is not resolved here (DESIGN-SYSTEM edits are a separate canonicalization action, not in scope for staging→design adoption).

---

## Dimension scores

### 1. Visual hierarchy — 9/10

No regression from iteration 2. The dark-text change on the primary button does not affect hierarchy — the emerald fill still carries the visual weight that identifies the primary action. The button continues to read as the most prominent interactive element in the card footer, correctly elevated above the secondary member-count stack. The `text-surface-950` on `bg-accent-emerald` produces a higher-contrast label which, if anything, sharpens the button's legibility and draws the eye more crisply.

The h1 is now correctly `text-xl` per DESIGN-SYSTEM §2. Page title scale is appropriate: compass icon + "Discover Communities" reads as a page header without competing with card content for heading-level dominance. Elevation stack is correct: rail (surface-900) < canvas (surface-950) < cards (surface-800) < sticky header (glass-refraction 85%) < toasts.

Non-blocking note carried forward: a visible results-count line below the search bar on loaded state ("12 communities") would add information completeness to the hierarchy. Not a blocker; implementation note for B-block.

**Score: 9/10** — no change from iteration 2.

### 2. Spacing rhythm — 8/10

No change introduced in iteration 3. The button size change (text color only) does not affect spacing. All spacing observations from iteration 2 hold: 4px base unit respected, `p-5` card padding, `gap-6` section gaps, `py-6 px-6 lg:px-12` header cadence, `pb-24` scroll-container bottom clearance are all unchanged.

The fixed `w-[84px] h-[34px]` button dimensions are consistent across all card states (Join / joining spinner / Open), preventing layout shift during state transitions — this is correct implementation discipline.

Non-blocking note carried forward: skeleton `h-[220px]` vs. actual populated card height — verify alignment to eliminate height-reflow on loading→loaded transition.

**Score: 8/10** — no change from iteration 2.

### 3. Brand coherence — calm/academic, dark-only, emerald accent — 9/10

Dark text on emerald (`text-surface-950` on `bg-accent-emerald`) is consistent with the established active-state pattern already in the codebase. The server rail's active Discover icon and the hover/active states for nav squircles both use `text-surface-950` on `bg-accent-emerald` (lines 170–175). The primary button's iteration 3 treatment now matches this existing pattern exactly, creating a coherent "emerald surface = dark label" rule across the interface. This is a coherence improvement, not a deviation.

The emerald nav active glow (`shadow-[0_0_15px_rgba(16,185,129,0.3)]` on line 251) remains an unnamed token — non-blocking concern from iteration 2 is carried forward. B-block should either register `--glow-emerald-nav` in DESIGN-SYSTEM §5 or replace with the focus-ring pattern.

**Score: 9/10** — no regression; small coherence gain from pattern unification, not enough to shift the score given the unnamed token note persists.

### 4. Edge-case / state handling — 9/10

All six brief §3 states verified intact from iteration 2. The iteration 3 change touches the Join button (default state), the Retry button (error state), and the Clear Search button (empty-search state) — all three are correctly updated to dark text:

- Join (line 530): `bg-accent-emerald text-surface-950` — primary state. PASS.
- Retry (line 318): `bg-accent-emerald text-surface-950` — error-state CTA. PASS.
- Clear Search (line 340): `bg-accent-emerald text-surface-950` — empty-search CTA. PASS.
- Joining spinner state (lines 526–528): `bg-surface-700 pointer-events-none text-text-muted disabled aria-busy="true"` — not an emerald button, not affected. PASS.
- Joined "Open" state (lines 522–524): `bg-surface-700 text-white` — not an emerald button, not affected. PASS.

The results aria-live region (iter-2 non-blocking #3) is now fully addressed: `search-announcer` div with `aria-live="polite"` is populated with meaningful strings at every render branch — loading, error, cold empty, search empty, loaded, and the results-count string. The state machine is complete and screen-reader-surfaced.

**Score: 9/10** — no change; non-blocking aria-live gap from iteration 2 is resolved but not sufficient to shift this dimension's cap without the results-count display element (which remains a B-block note).

### 5. Accessibility — WCAG AA text contrast on dark surfaces, focus states, reduced-motion — 9/10

This dimension was 7/10 in iteration 2. All three scoring items are now resolved.

**Contrast audit — full re-run including iteration 3 changes:**

| Element | Foreground | Background | Ratio | Result |
|---|---|---|---|---|
| Server name `text-primary` on card | rgba(255,255,255,0.92) | surface-800 #1c1c1f | ~15.9:1 | PASS |
| Description `text-secondary` on card | rgba(255,255,255,0.60) | surface-800 #1c1c1f | ~7.2:1 | PASS |
| Topic chip `text-secondary` on surface-700 | rgba(255,255,255,0.60) | #27272a | ~6.2:1 | PASS |
| **Join button `text-surface-950` on `accent-emerald`** | **#0a0a0b** | **#10b981** | **~10.1:1** | **PASS — AA and AAA** |
| **Retry button `text-surface-950` on `accent-emerald`** | **#0a0a0b** | **#10b981** | **~10.1:1** | **PASS — AA and AAA** |
| **Clear Search button `text-surface-950` on `accent-emerald`** | **#0a0a0b** | **#10b981** | **~10.1:1** | **PASS — AA and AAA** |
| Joined "Open" button `text-white` on surface-700 | #ffffff | #27272a | ~14.7:1 | PASS |
| Notification badge `text-surface-950` on danger | #0a0a0b | #ef4444 | ~5.47:1 | PASS |
| Placeholder `text-muted` on surface-900 | rgba(255,255,255,0.40) | #121214 | ~2.9:1 | Marginal — known system-level tradeoff per §8, not a regression |
| h1 / h2 `text-primary` on surface-950 | rgba(255,255,255,0.92) | #0a0a0b | ~17.4:1 | PASS |
| Empty-state heading `text-primary` on surface-950 | rgba(255,255,255,0.92) | #0a0a0b | ~17.4:1 | PASS |

**Reduced-motion:** All three animation classes are now wrapped:
- `animate-card-in`: `animation: none; opacity: 1` — PASS.
- `skeleton-shimmer`: `animation: none; background-position: 0 0` — PASS.
- `btn-spinner`: `animation: none; opacity: 0.5` — **PASS (new in iter-3).**

**Screen reader semantics:**
- `search-announcer` aria-live region: populated at every render branch — PASS.
- Toast `role="status"` for success / `role="alert"` for error: **PASS (new in iter-3)**. The `role` variable resolves to `'alert'` for error type, satisfying DESIGN-SYSTEM §8 Toast's `role="alert"` (assertive) requirement.
- Card action buttons: `aria-label="Join <server name>"` / `aria-label="Open <server name>"` — PASS.
- Search input: `aria-label="Search servers"` — PASS.
- Clear button: `aria-label="Clear search"` — PASS.
- Nav rail: `aria-label="Server Rail"` — PASS.
- Active nav item: `aria-current="page"` — PASS.
- Joining state: `disabled aria-busy="true"` — PASS.

The iteration 2 score of 7/10 reflected three accessibility gaps: the primary button contrast failure, the missing `btn-spinner` reduced-motion rule, and the split toast `role` requirement. All three are resolved. The only remaining marginal item is the known `--text-muted` placeholder contrast (2.9:1), which is a pre-existing system-level decision documented in the §8 Input primitive, not introduced by this design.

**Score: 9/10** — up from 7/10. One point held back for the placeholder contrast tradeoff (system-level, non-blocking) and the fact that no `aria-describedby` relationship exists between the search input and the `search-announcer` results region, which is a minor enhancement rather than a gap.

### 6. Responsive — no grid column-count jump between skeleton and results — 10/10

No change in iteration 3. Both grids carry identical `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4` declarations. All breakpoint tiers from brief §5 are satisfied. The button text-color change has zero effect on grid behavior.

**Score: 10/10** — unchanged.

---

## Aggregate

| Dimension | Iter 2 | Iter 3 |
|---|---|---|
| 1. Visual hierarchy | 9/10 | 9/10 |
| 2. Spacing rhythm | 8/10 | 8/10 |
| 3. Brand coherence | 9/10 | 9/10 |
| 4. Edge-case / state handling | 9/10 | 9/10 |
| 5. Accessibility | 7/10 | 9/10 |
| 6. Responsive | 10/10 | 10/10 |
| **Total** | **52/60** | **54/60** |

---

## AA blocker resolution — primary emerald buttons

| Button | Iter 2 contrast | Iter 2 result | Iter 3 contrast | Iter 3 result |
|---|---|---|---|---|
| Join (card) | white #fff on #10b981 = 1.76:1 | FAIL | surface-950 #0a0a0b on #10b981 = ~10.1:1 | PASS |
| Retry Request (error) | white #fff on #10b981 = 1.76:1 | FAIL | surface-950 #0a0a0b on #10b981 = ~10.1:1 | PASS |
| Clear Search (empty-search) | white #fff on #10b981 = 1.76:1 | FAIL | surface-950 #0a0a0b on #10b981 = ~10.1:1 | PASS |

The AA contrast failure is fully resolved across all three emerald button instances. No other element's contrast has changed. No regression introduced.

---

## DESIGN-SYSTEM canonicalization obligation (surfaced by this wave)

The §8 Button primitive's `primary` variant descriptor must be updated from `emerald fill, white text` to `emerald fill, surface-950 text`. This wave's iteration 3 is the first design to correctly implement the AA-required reading. The update should be made to `design/DESIGN-SYSTEM.md` §8 Button before or during B-block implementation, so the implementation spec reflects the correct pattern. Existing mockups using `text-white` on `bg-accent-emerald` are follow-up technical debt.

---

## Remaining non-blocking items (B-block implementation notes)

Iteration 2's resolved items are closed. The following notes carry into B-block:

1. **Results count display** (dim-1, dim-4): Surface a visible "N communities" count line beneath the search bar on loaded state for sighted users. The `search-announcer` region handles screen readers; a visible count closes the gap for sighted users who want to understand the scope of results without counting cards.

2. **Skeleton card height alignment** (dim-2): Verify that the skeleton `h-[220px]` matches the rendered card height at typical content lengths to eliminate height-reflow on loading→loaded state transition.

3. **Emerald nav glow token** (dim-3): `shadow-[0_0_15px_rgba(16,185,129,0.3)]` on the active Discover nav item (line 251) is not a named §5 shadow token. Either register as `--glow-emerald-nav` in DESIGN-SYSTEM §5 or align to the existing `--glow-focus` pattern. Document in DESIGN-SYSTEM if registered.

4. **Load-more spinner label wrapping** (dim-3): The `loadMoreBtn` innerHTML on load (`'<div class="btn-spinner"></div> Loading...'`) places the text as a raw node outside the button's flex container. Wrap with `<span class="flex items-center gap-2">` for correct flex alignment.

5. **Search input/results `aria-describedby` relationship** (dim-5): A minor enhancement — binding the search input to the `search-announcer` region via `aria-describedby` or `aria-controls` would make the relationship explicit in the accessibility tree, though the live region is already functional.

---

## Verdict

**APPROVE**

Dark-on-emerald (`text-surface-950` on `bg-accent-emerald`, contrast ~10.1:1) correctly resolves the WCAG AA blocker on all three primary button instances. This treatment is not a brand deviation: it is the AA-compliant reading of the §8 Button primitive, which contains an internal contradiction between the "white text" descriptor and the binding "≥4.5:1 text contrast" A11y requirement. Dark text wins because the A11y requirement is binding; the descriptor was authored without contrast verification. The pattern is consistent with the existing dark-text-on-emerald rule already in use on active nav squircle icons and hover states throughout the rail.

All iter-2 non-blocking items (btn-spinner reduced-motion, error toast role=alert, aria-live results announcer, document.write replacement, h1 text-xl) are addressed and verified. Token discipline is clean. Geist typeface is correct. No hsl hues. All six brief §3 states are implemented and mutually exclusive. Grid breakpoint parity is maintained.

The design satisfies Brief §1–§11 and DESIGN-SYSTEM §1–§9. Score: 54/60.

Adopt `design/staging/server-discover.html` into `design/server-discover.html`.

DESIGN-SYSTEM §8 Button `primary` descriptor must be updated to `emerald fill, surface-950 text` before B-block implementation begins.
