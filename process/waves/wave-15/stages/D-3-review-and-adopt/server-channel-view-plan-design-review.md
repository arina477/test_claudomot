# D-3 Plan Design Review — wave-15 @mention surfaces (iteration 2, reviewer A)
**Reviewer:** plan-design-review (ui-designer agent, reviewer A)
**Artefact:** `design/staging/server-channel-view.html`
**Review pass:** D-3 FINAL RE-REVIEW (iteration 2) — contrast polish only; no structural changes
**Surfaces reviewed:** (1) mention-autocomplete popover · (2) inline mention-pills (self + other) · (3) unread-mention badge on channel sidebar
**Reference docs:** `design/DESIGN-SYSTEM.md` · `command-center/principles/DESIGN-PRINCIPLES.md` (rule 1) · D-1 briefs for all three surfaces
**Scope of this pass:** Two token changes landed since iteration-1 APPROVE — empty-state icon/text `zinc-600`/`zinc-500` → `zinc-400`; loading skeleton bars `study-700/80` → `study-600/70`. All other markup unchanged.

---

## 0. Structural integrity — 9 article rows

Confirmed unchanged from iteration 1. Line numbers match exactly.

| # | Row identity | Present |
|---|---|---|
| 1 | Mia Wong / other-mention pill | YES (L191) |
| 2 | David C. / self-mention pill | YES (L222) |
| 3 | Elias (You) / standard + (edited) tag | YES (L241) |
| 4 | Elias / inline editing state | YES (L261) |
| 5 | Elias / delete confirmation | YES (L284) |
| 6 | Tombstone ("This message was deleted") | YES (L301, `role="article"`) |
| 7 | David C. / react-menu open | YES (L311) |
| 8 | Elias / pending (amber Sending...) | YES (L335) |
| 9 | Elias / failed-to-send (`role="alert"`) | YES (L347) |

**All 9 rows confirmed present. No structural regression.**

---

## 1. Changed-token verification

### C1 — Empty-state icon + text: `zinc-600`/`zinc-500` → `zinc-400`

**Location:** L427–428 (STATE 3: EMPTY RESULTS panel).

**File state confirmed:**
```html
<i class="ph ph-magnifying-glass text-[24px] text-zinc-400 mb-2"></i>
<p class="text-[13px] text-zinc-400 font-medium">No members match</p>
```

Both the decorative icon (`ph-magnifying-glass`) and the status copy ("No members match") are now `text-zinc-400`.

**Contrast calculation (DESIGN-PRINCIPLES rule 1):**

Background: `study-800` = `#1c1c1f`. Relative luminance ≈ 0.011.
`zinc-400` = `#a1a1aa`. Relative luminance ≈ 0.378.
Contrast ratio = (0.378 + 0.05) / (0.011 + 0.05) = **7.02:1**.

Result: WCAG AA pass at any text size (threshold 4.5:1 normal, 3:1 large). Prior value at `zinc-500` (#71717a, luminance ≈ 0.175) computed to 3.66:1 — a fail flagged as residual note N1 in iteration 1. The token lift fully resolves N1. DESIGN-PRINCIPLES rule 1 is now satisfied for this surface.

**Impact on brand coherence:** `zinc-400` is the established secondary-text / metadata token throughout the design (`--text-secondary` equivalent). Using it for empty-state status text is internally consistent. The icon at `zinc-400` reads as supportive but visible — no neon introduced.

**STATUS: FIXED. Prior N1 resolved. DESIGN-PRINCIPLES rule 1 satisfied.**

---

### C2 — Loading skeleton bars: `study-700/80` → `study-600/70`

**Location:** L405–415 (STATE 2: LOADING SKELETON panel, both skeleton rows).

**File state confirmed (both rows):**
```html
<div class="w-6 h-6 rounded-full bg-study-600/70 shrink-0"></div>
<div class="h-[10px] bg-study-600/70 rounded w-1/2"></div>
<div class="h-[8px] bg-study-600/70 rounded w-1/3"></div>
<!-- second row identical token usage -->
```

All six skeleton shape elements (`avatar circle` + `name bar` + `handle bar` × 2 rows) are now `bg-study-600/70`.

**Contrast assessment (rule 1 — decorative non-text elements):**

WCAG 2.1 AA text-contrast (4.5:1) applies to text; skeleton bars are non-text decorative UI affordances. The applicable standard is WCAG 1.4.11 Non-text Contrast (3:1 against adjacent color) for UI components, which applies to active controls — skeleton bars are passive loading placeholders, not interactive components, so the 3:1 threshold is informational guidance rather than a strict requirement.

Background: `study-800` = `#1c1c1f`. `study-600` = `#3f3f46` at 70% opacity.

Composited RGB on `#1c1c1f`:
- R: round(0.70 × 63 + 0.30 × 28) = round(44.1 + 8.4) = 52
- G: round(0.70 × 63 + 0.30 × 28) = 52
- B: round(0.70 × 70 + 0.30 × 31) = round(49.0 + 9.3) = 58
- Composited ≈ `#343438`

Relative luminance of `#343438` ≈ 0.038. Against background luminance 0.011:
Non-text contrast = (0.038 + 0.05) / (0.011 + 0.05) = **1.44:1**.

This is lower than the 3:1 informational guideline. However: skeleton bars exist solely to communicate "content is loading here" — they pulse (animate-pulse) and are temporally transient. Their purpose is shape/rhythm affordance, not legible content. Browsers render `animate-pulse` as opacity cycling (50%→100%→50%), making bars visually present even at modest opacity. The prior `study-700/80` composited to approximately `#252528`, yielding ≈ 1.24:1 — also below 3:1 but already in use and approved in iteration 1. The `study-600/70` value is a step brighter than the prior approved value, increasing visible definition of the skeleton bars relative to the canvas.

Net: this is a perceptual improvement over the prior approved state. The bars are more legible as skeleton placeholders. No accessibility regression; modest improvement.

**Token provenance:** `study-600` = `#3f3f46` (DESIGN-SYSTEM §1, defined as "Stronger borders, scrollbar thumb"). Use as skeleton bar fill at 70% alpha is within the token's established role — structural/chrome element. No invented hex introduced.

**STATUS: CONFIRMED. Perceptual improvement over prior approved state. No regression.**

---

## 2. Carry-forward verification — 4 prior fixes from iteration 1

All four previously confirmed fixes are unchanged. Verified by line-number spot-check.

| Fix | Description | Status |
|---|---|---|
| P1a | Autocomplete empty state rendered as live HTML (L421-430) | INTACT |
| P1b | Loading skeleton with typing-dot header + animate-pulse rows (L398-419) | INTACT |
| P2 | Unread clears-on-view: before-row (L130) + after-row (L135) both present and differentiated | INTACT |
| P3 | `msg-row` + `relative` on David C. self-mention row (L222) — row-actions reachable | INTACT |

---

## 3. Mention surface integrity — 3 surfaces

| Surface | File location | Status |
|---|---|---|
| Other-mention pill: `bg-study-700 text-zinc-100 rounded-md` | L199 | INTACT |
| Self-mention pill: `bg-emerald-500/10 text-emerald-300 ring-1 ring-emerald-500/30` | L231 | INTACT |
| Unread-mention badge: `bg-emerald-500 rounded-full text-study-950` | L132 | INTACT |

Contrast re-check (unchanged from iteration 1, no token changes on these surfaces):

| Surface | Ratio | Result |
|---|---|---|
| Unread badge count (`study-950` on `emerald-500`) | 7.80:1 | PASS |
| Self-mention pill text (`emerald-300` on composited ~#1b2c29) | 9.57:1 | PASS |
| Other-mention pill text (`zinc-100` on `study-700`) | 13.55:1 | PASS |
| Post-view channel name (`zinc-400` on `study-900`) | 7.30:1 | PASS |

---

## 4. Regression scan — no new tokens or elements introduced

Full diff surface: only `text-zinc-600 → text-zinc-400`, `text-zinc-500 → text-zinc-400` (empty-state, L427-428) and `bg-study-700/80 → bg-study-600/70` (skeleton bars, L405-416). No other class changes, no new elements, no removed elements, no script changes. Token discipline clean — every value traces to DESIGN-SYSTEM §1 primitives.

Animation safety: unchanged from iteration 1. `animate-pulse` on skeleton rows and `.typing-dot` on header dots — both covered by the `@media (prefers-reduced-motion)` block at L56-60. No new animation classes.

---

## 5. Residual notes status

| Note | Prior status | Current status |
|---|---|---|
| N1: Empty-state text at zinc-500 (3.66:1) — lift to zinc-400 | Non-blocking, developer handoff | RESOLVED — zinc-400 in file, 7.02:1 |
| N2: Autocomplete inner-list padding sub-grid | Non-blocking, cosmetic | Unchanged, remains developer handoff |
| N3: Narrow-breakpoint sidebar badge-clip risk | Non-blocking, developer handoff | Unchanged, remains developer handoff |

N1 is fully resolved. N2 and N3 are cosmetic/implementation concerns that do not affect design adoption.

---

## 6. Score table (updated)

| Dimension | Iteration 1 score | Iteration 2 score | Delta |
|---|---|---|---|
| Visual hierarchy | 9/10 | 9/10 | — |
| Spacing rhythm | 9/10 | 9/10 | — |
| Brand coherence | 10/10 | 10/10 | — |
| Edge-case handling | 10/10 | 10/10 | — |
| Accessibility | 9/10 | 10/10 | +1 (N1 resolved; rule 1 now satisfied on all text surfaces) |
| Token discipline | 9/10 | 10/10 | +1 (no invented values; skeleton token step-up is perceptual improvement) |
| Responsive | 8/10 | 8/10 | — |

**Aggregate (unweighted mean): 9.43 / 10** (up from 9.14)

---

## 7. Summary

The two token changes are confirmed as contrast polish: the empty-state text lift from `zinc-500` to `zinc-400` resolves the single outstanding non-blocking note (N1) from the prior pass, bringing all text surfaces in the autocomplete popover to WCAG AA compliance per DESIGN-PRINCIPLES rule 1. The skeleton bar shift from `study-700/80` to `study-600/70` is a perceptual improvement — brighter against the canvas than the prior approved value — with no accessibility regression (decorative non-text elements). All 9 article rows are intact. All 3 mention surfaces are undisturbed. All 4 prior fixes hold. No new tokens, elements, or regressions detected.

---

## VERDICT

APPROVE
