# D-3 Plan-Design Review — Member Profile Card (wave-77)

**Reviewer role:** `/plan-design-review` (designer's-eye)
**Artifact:** `design/staging/member-profile-card.html`
**Brief:** `process/waves/wave-77/stages/D-1-brief/member-profile-card-brief.md`
**DS:** `design/DESIGN-SYSTEM.md`

## VERDICT: REVISE

The card is genuinely close — calm, dark, scannable, all four states designed, and every brief §6 fence is held (verified below). But it ships **two invented-color tokens** (a purple banner not in the palette) and a **bouncy spring easing DS §6 explicitly forbids**, plus a **missing `prefers-reduced-motion` guard** and **no Esc dismissal** on a click-opened popover. These are concrete, measurable DS/brief violations, not taste — so REVISE, not APPROVE. None is architectural; all are surface fixes.

---

## Brief §6 fence verification (mandatory)

| Fence | Held? | Evidence |
|---|---|---|
| NO verification badge / trust affordance; educator/staff = plain text | ✅ HELD | Academic Role renders as plain `text-text-primary` text ("Graduate Student" L286, "Undergraduate" L353). No badge, checkmark, or "verified" affordance anywhere. |
| NO edit affordance in card (read-only) | ✅ HELD | No buttons, pencils, inputs, or edit CTAs in any of the 4 state templates. Card is display-only. |
| NO email / non-safe field | ✅ HELD | Fields shown: name, pronouns, bio, institution, program, role, year. No email/handle/non-safe field. Matches PublicProfile shape (brief §4/§6). |

All three fences pass. This is the highest-value check and it is clean.

---

## Per-dimension scores (0–10)

### 1. Visual hierarchy (academic identity scannable?) — 8/10
Strong. Avatar+name+pronouns anchor the top; bio as unlabeled body; then a clean icon+uppercase-label+value stack for the 4 academic fields (L255–301). The `text-[10px]` uppercase tracked labels over `text-sm` values read as scannable field/value pairs at a glance. Amber year-icon+value (L292–298) draws the eye to recency, which is defensible per DS §1 (`--accent-amber` → academic-year).
- **To reach 10:** the label copy "Academic Year → Year 3 Tracker" (L296–297) reads awkwardly — "Tracker" is UI-chrome noise on a value field; make it "Year 3" or "3rd Year". Also the amber is applied to BOTH icon and value text (L292, L297) — per DS §1 "sparingly", tint only the icon (or only the value), not both, so the accent stays a signal not a highlight.

### 2. Spacing rhythm (DS spacing/radius; card idioms) — 8/10
Good adherence. Card `rounded-lg` (DS §4 `--radius-lg` 8–10px ✓), `px-6`/`pb-6` = 24px (DS §3 scale ✓), field-row `gap-3` = 12px and inner `gap-2.5` (DS §3 ✓), `w-80` (320px) is a sensible popover width. Avatar `ring-4 ring-surface-900` overlap idiom is clean and reused consistently across all 4 states. Partial state collapses vertically with no empty rows (L335–357) — exactly the brief §3/§5 "only-present-fields" requirement.
- **To reach 10:** `gap-2.5` (10px) on icon→text (L258) is off the 4px base scale (DS §3: `2(8) / 3(12)`); snap to `gap-2` or `gap-3`. The hidden-state body uses `min-h-[220px]` (L439) — a magic value; base it on the loaded card's natural height so the popover doesn't jump size between states.

### 3. Brand coherence (calm/academic dark-only; zinc+emerald+amber; Geist; not flashy) — 5/10
This is the weakest dimension and the primary REVISE driver. Two invented colors break the DS §1 restrained palette ("one base hue (zinc), one academic accent (emerald), one alert accent (amber), one danger (red). No gaming-neon"):
- **`bg-purple-900/20`** on the partial-state banner (L317, L505) — **purple is NOT in the palette.** Hard DS §1 violation. There is no purple token; this must become `--surface-700`/`--surface-800` or the emerald-950 tint used elsewhere.
- **`bg-emerald-950/30`** on the loaded banner (L227, L469) — `emerald-950` is not a DS token either (DS §1 defines only `--accent-emerald` `#10b981`); it's a raw Tailwind ramp value. Acceptable *intent* (subtle emerald derivation) but should be expressed as an emerald tint of a defined token, not a raw `emerald-950`.

Otherwise Geist is loaded (L11) and used, surfaces/text/hairline tokens are correct, and the aesthetic is appropriately quiet — no oversized numerals, no social-profile flourish. Fix the two banners and this jumps to 8–9.
- **To reach 10:** remove purple entirely; derive both banners from DS tokens only (`--surface-700/50` or a documented emerald tint). Then add the emerald-tint banner value to DESIGN-SYSTEM.md if it's to be a reusable card-chrome idiom, so it stops being an ad-hoc hex.

### 4. Edge-case handling (all 4 states incl. calm "hidden" + partial) — 9/10
Excellent. All four states are designed and distinct: loaded (L216–305), partial (L307–361), loading/shimmer (L363–415), hidden (L417–452). The **hidden state is genuinely calm** — eye-slash icon, "Profile Unavailable", "hidden due to their visibility settings" — reads as a not-an-error empty state per brief §3/§5, matching DS §8 Empty-state idiom (centered icon + headline + one-line). Partial correctly shows only present fields with no empty rows.
- **To reach 10:** the shimmer/loading state has `pointer-events-none` (L372) but no `aria-busy`/`role="status"` and no visually-hidden "Loading profile" text (DS §8 loading + brief §5 a11y). Add `aria-busy="true"` + an SR-only label so assistive tech announces the fetch.

### 5. Accessibility (WCAG AA; keyboard-dismissable; reduced-motion) — 4/10
Multiple concrete gaps against brief §5 and DS §6/§8:
- **No `prefers-reduced-motion` guard** anywhere (DS §6: "Respect `prefers-reduced-motion` — disable non-essential transitions"). The shimmer (L61), waterfall (L77), and spring popover (L72) all animate unconditionally. **Hard DS §6 violation.**
- **No Esc / keyboard dismissal** on the popover — dismissal is click-outside only (L593–598). DS §8 Tooltip/Popover requires "focus management + Esc (popover)"; brief §2/§5 requires keyboard-dismissable overlay. **Hard violation.** No focus-move into the card on open, no focus-restore on close.
- **`text-[10px]`** field labels (L263 etc.) sit below the DS §2 documented scale floor of `text-xs` 12px for metadata/labels. `--text-secondary` at 10px risks WCAG AA legibility.
- Popover template `<img>` tags drop the `alt` (L472, L508) that the gallery copies carry (L232) — DS §8 Avatar requires `alt` = display name.
- **To reach 10:** wrap all animations in `@media (prefers-reduced-motion: reduce)`; add Esc-to-dismiss + focus-trap/restore per DS §8 Modal/Popover a11y; bump labels to `text-xs` (12px); add `alt` on popover avatars; add `role="dialog"`/`aria-label` on the floating card.

### 6. Responsive — 7/10
The gallery frame is responsive (`xl:flex-row`, `xl:w-[500px]`, breakpoint-aware panes) and the card itself is a fixed `w-80` (320px) popover, which is the right call for a floating identity card. DS §9 min breakpoint is 1024 (desktop-only MVP), so a fixed-width popover is appropriate.
- **To reach 10:** the JS popover positions with a hardcoded `-100` offset and `if (calculateTop < 20) calculateTop = 20` top clamp (L579–580) but has **no bottom-edge clamp** — a member near the roster bottom will render the 320px card partly off-screen. Add a bottom-boundary flip/clamp. Also confirm the portal-to-body / transformed-ancestor guard from brief §2 (BUILD-14) survives into implementation — the staging demo positions inside a local container, not `document.body`.

---

## Score summary

| Dimension | Score |
|---|---|
| Visual hierarchy | 8 |
| Spacing rhythm | 8 |
| Brand coherence | 5 |
| Edge-case handling | 9 |
| Accessibility | 4 |
| Responsive | 7 |
| **Mean** | **6.8** |

## Blocking concerns (must fix before adopt)

1. **DS §1 palette violation — purple.** `bg-purple-900/20` (L317, L505) is not a palette token. Replace with a DS surface/emerald token. *(brand coherence)*
2. **DS §1 palette — raw `emerald-950` banner.** `bg-emerald-950/30` (L227, L469) is a raw ramp value, not a DS token; express as a defined emerald tint. *(brand coherence)*
3. **DS §6 forbidden easing.** `.animate-popover` spring `cubic-bezier(0.175, 0.885, 0.32, 1.275)` (L73) overshoots — DS §6: "No bouncy/playful easing." Use the calm `smooth` curve. *(motion)*
4. **DS §6 missing `prefers-reduced-motion`.** No reduced-motion guard on shimmer/waterfall/popover. *(a11y)*
5. **DS §8 / brief §5 — no Esc + no focus management** on the click-opened popover. *(a11y)*

## Non-blocking (fix opportunistically)

- Label size `text-[10px]` below DS §2 12px floor (bump to `text-xs`).
- Missing `alt` on popover-template avatars (L472, L508).
- "Year 3 Tracker" copy + amber applied to both icon and value (DS §1 "sparingly").
- Loading state lacks `aria-busy`/SR label.
- No bottom-edge clamp on popover positioning.
- `gap-2.5`/`min-h-[220px]` off the 4px spacing scale.

**Read-only review. No files other than this verdict were modified.**
