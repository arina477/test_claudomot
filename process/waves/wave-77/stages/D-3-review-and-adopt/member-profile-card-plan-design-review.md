# D-3 Plan-Design Review — Member Profile Card (wave-77)

**Reviewer role:** `/plan-design-review` (designer's-eye)
**Artifact:** `design/staging/member-profile-card.html` (refined mockup, latest)
**Brief:** `process/waves/wave-77/stages/D-1-brief/member-profile-card-brief.md`
**DS:** `design/DESIGN-SYSTEM.md`

## VERDICT: APPROVE

The refined card holds every hard fence in the brief and the design-system token contract. All four states are designed and correctly toned; the calm/academic dark-only aesthetic is intact; there is no invented hex, no purple, no raw emerald-950 ramp, and amber is correctly absent from the Academic Year field. Motion is calm (`ease-out`, ≤250ms), `prefers-reduced-motion` is guarded, and Esc-dismiss is wired. Remaining observations are minor and non-blocking — none rises to REVISE.

---

## Brief §6 fence verification (mandatory)

| Fence | Held? | Evidence |
|---|---|---|
| NO verification badge / trust affordance; educator/staff = plain text | HELD | Academic Role renders as plain `text-text-primary` text — "Graduate Student" (`:170`), "Undergraduate" (`:240`). Comment at `:163` confirms "No Trust Badges/Verification - strictly text payload". No badge, checkmark, or "verified" affordance anywhere. |
| NO edit affordance in card (read-only) | HELD | No buttons, pencils, inputs, or edit CTAs in any of the 4 state templates. Card is display-only. |
| NO email / non-safe field | HELD | Fields shown: name, pronouns, bio, institution, program, role, year. No email/handle/non-safe field. Matches PublicProfile shape (brief §4/§6). |

All three fences pass — the highest-value check and it is clean.

---

## Per-dimension scores (0–10)

### 1. Visual hierarchy (academic identity scannable?) — 9/10
Strong. Avatar + name (`text-xl` medium, `:128`) + pronouns (`text-xs` secondary, `:129`) anchor the top; bio as unlabeled `text-sm` body (`:133`); then a clean icon + uppercase-label + value stack for the 4 academic fields (`:138–185`). Uppercase tracked labels over `text-sm` values read as scannable field/value pairs at a glance. Amber is correctly NOT used to draw attention to any field — the Year field (`:174–183`) matches the neutral treatment of the other three.
- **To reach 10:** minor — the Institution value can wrap to two lines ("Massachusetts Institute of Technology", `:148`); `leading-snug` handles this fine, but confirm long institution names don't push the card taller than the loaded reference in implementation.

### 2. Spacing rhythm (DS spacing/radius; card idioms) — 9/10
Good adherence. Card `rounded-lg` (DS §4 `--radius-lg` 8–10px), `px-6`/`pb-6` = 24px (DS §3 scale), field-row `gap-3` = 12px (DS §3), `w-80` (320px) is a sensible popover width. Avatar `ring-4 ring-surface-900` overlap idiom is clean and reused consistently across all 4 states. Partial state collapses vertically with no empty rows (`:222–244`) — exactly the brief §3/§5 "only-present-fields" requirement.
- **To reach 10:** the inner icon→text `gap-2.5` (10px, `:141`) sits off the 4px base scale (DS §3: `2(8) / 3(12)`); snap to `gap-2` or `gap-3`. The hidden-state body `min-h-[220px]` (`:318`) is a magic value; ideally derive it from the loaded card's natural height so the popover doesn't jump size between states.

### 3. Brand coherence (calm/academic dark-only; zinc+emerald+amber; Geist) — 10/10
Fully resolved. Tailwind config (`:22–26`) mirrors DS §1 exactly: surfaces `#0a0a0b`/`#121214`/`#1c1c1f`/`#27272a`/`#3f3f46`/`#52525b`, `accent.emerald #10b981`, `accent.amber #f59e0b`, text-alpha ramp `.92/.60/.40`, hairline `rgba(255,255,255,0.06)`.
- **NO purple** — the State-2 banner (`:200`) is `bg-surface-800`; comment confirms "Replaced raw purple-900/20 per feedback".
- **NO raw emerald-950 ramp** — the State-1 banner (`:110`) is `bg-surface-800`; comment confirms "Replaced raw emerald-950 with standard surface".
- **Amber NOT on the Academic Year field** — the Year field (`:174–183`) uses `text-text-muted` icon + `text-text-primary` value, identical to the other three fields. Amber (`#f59e0b`) appears ONLY on the State-2 idle presence dot (`:207`), which is correct per DS §1 `--presence-idle → --accent-amber`; the State-1 online dot (`:118`) is emerald per `--presence-online`.

Geist is loaded (`:11`) and used; surfaces/text/hairline tokens correct; aesthetic appropriately quiet. Restrained palette fully honored.

### 4. Edge-case handling (all 4 states incl. calm "hidden" + partial) — 9/10
Excellent. All four states designed and distinct: loaded (`:103–187`), partial (`:193–246`), loading/shimmer (`:252–296`), hidden (`:302–330`). The **hidden state is genuinely calm** — gentle eye-slash icon on a neutral tint, "Profile Unavailable", "hidden due to visibility settings" — reads as a not-an-error empty state per brief §3/§5, matching DS §8 Empty-state idiom (centered icon + headline + one-line). No danger colors used (comment `:320`). Partial correctly shows only present fields with no empty rows.
- **To reach 10:** the loading state (`:252–257`) announces via `aria-label="Loading Profile"` (adequate) but lacks `aria-busy="true"`; adding it would let assistive tech convey the transient fetch more precisely. Non-blocking polish.

### 5. Accessibility (WCAG AA; keyboard-dismissable; reduced-motion) — 8/10
Resolved on the previously-blocking gaps:
- **`prefers-reduced-motion` guard present** (`:79–89`) — disables `.animate-popover` and `.waterfall-render`, and swaps the shimmer for a static `surface-600` fill. Satisfies DS §6.
- **Esc dismissal present** — `keydown` → Escape handler (`:335–347`) hides all popovers. Satisfies DS §8 Tooltip/Popover ("focus management + Esc") and brief §2/§5 keyboard-dismissable overlay.
- **Motion calm** — `.animate-popover` uses `ease-out` at 200ms (`:50–52`); no overshoot/spring. DS §6 "No bouncy/playful easing" honored.
- Cards carry `role="dialog"` + `aria-label` + `tabindex="-1"` + focus-visible emerald ring (`:103–107`).
- Field labels are `text-xs` (12px, `:147`) — at or above the DS §2 12px floor.
- Avatars carry `alt` = display name (`:115`, `:204`).
- **To reach 10:** (a) the Esc handler hides via inline `opacity`/`transform` but leaves cards in the DOM without moving focus/restoring it — real implementation should unmount + restore focus to the roster trigger (DS §8 Modal/Popover "restore focus on close"); (b) uppercase labels at `text-text-secondary` (`rgba(255,255,255,0.60)`) on `surface-900 #121214` compute ≈6.4:1 — passes WCAG AA, so confirm-not-fix: B-3 must not lighten labels further.

### 6. Responsive — 8/10
The card is a fixed `w-80` (320px) popover — the right call for a floating identity card; DS §9 min breakpoint is 1024 (desktop-only MVP), so a fixed-width popover is appropriate. The staging gallery wraps via `flex-wrap` (`:98`) for display only.
- **To reach 10:** the mockup is a static gallery with no live positioning logic, so no edge-clamp is present to assess. Implementation must (a) portal-to-`document.body` and add a bottom-edge flip/clamp so a member near the roster bottom doesn't render the 320px card off-screen, and (b) preserve the brief §2 / BUILD-14 transformed-ancestor guard.

---

## Score summary

| Dimension | Score |
|---|---|
| Visual hierarchy | 9 |
| Spacing rhythm | 9 |
| Brand coherence | 10 |
| Edge-case handling | 9 |
| Accessibility | 8 |
| Responsive | 8 |
| **Mean** | **8.8** |

## Blocking concerns

None. All five prior-iteration blockers (purple banner, raw emerald-950 banner, bouncy easing, missing `prefers-reduced-motion`, missing Esc) are resolved and re-verified above.

## Non-blocking (fix opportunistically / carry into B-3)

- **Presentation scaffolding on the gallery, not the card:** the four cards sit in `<main class="… waterfall-render">` (`:98`) with a staggered `:nth-child` entrance (`:65–73`). This is state-gallery display chrome, not part of the shipped card. Each `<article>` is self-contained and portable — adopt the per-card markup, but do NOT carry the `waterfall-render` wrapper or its delays into `MemberListPanel`; only the per-card `animate-popover` (`:50–52`) belongs on the mounted card. (brief §2 portal/overlay pattern.)
- Esc handler should unmount + restore focus to the roster trigger, not just fade in place (DS §8).
- Add `aria-busy="true"` on the loading skeleton (`:252`) for a precise transient announcement.
- Inner `gap-2.5` (`:141`) and `min-h-[220px]` (`:318`) are off the 4px spacing scale (DS §3) — snap to scale in implementation.
- Confirm long institution names don't grow the card past the loaded reference height.

**Read-only review. No files other than this verdict were modified.**
