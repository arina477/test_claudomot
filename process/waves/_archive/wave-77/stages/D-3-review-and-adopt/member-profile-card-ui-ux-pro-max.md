# D-3 Review — Member Profile Card (`/ui-ux-pro-max`)

**Wave:** 77
**Reviewer role:** ui-ux-pro-max — requirement + UX + token + icon audit (read-only)
**Artifact:** `design/staging/member-profile-card.html` (refined mockup, latest)
**Brief:** `process/waves/wave-77/stages/D-1-brief/member-profile-card-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

---

## VERDICT: APPROVE

The refined mockup satisfies every requirement fence and success criterion in brief §5/§6, consumes DESIGN-SYSTEM tokens exactly with no invented hex (no purple, no raw emerald-950 ramp), keeps amber off the Academic Year field, renders academic role as plain text with no trust affordance, and its glyphs all map to widely-available Phosphor names for the `apps/web/src/shell/icons.tsx` inline-SVG set. Zero blocking concerns. Two non-blocking B-3 port notes.

---

## Checkbox results

### (1) Brief §5 success-criteria + §6 out-of-scope fences

- [x] **Dark-only, Geist** — `body` is `#0a0a0b`; Geist loaded (400/500/600); `fontFamily.sans = ['Geist', …]`. PASS.
- [x] **DESIGN-SYSTEM tokens exactly / NO invented hex** — PASS. All banners now use `bg-surface-800` (State 1 line 110, State 2 line 200, State 4 line 309) — the prior purple and raw-emerald-950 banner tints are gone (inline comments at lines 109, 199 confirm the remap). Only DS-sanctioned hues appear.
- [x] **Scannable academic identity — 6 fields legible** — PASS. State 1 renders pronouns + bio + Institution + Program/Field + Academic Role + Academic Year as icon + uppercase-tracked label + body value, `gap-3` stack. Reads at a glance.
- [x] **Only-present fields, no empty rows** — PASS. State 2 (Sarah Lin) renders only Institution + Academic Role; bio, Program, Year rows are omitted entirely — component shrinks, no placeholder rows.
- [x] **All 4 states designed (loaded / loading / hidden / partial)** — PASS. loaded (State 1), partial (State 2), loading shimmer (State 3), hidden (State 4). All present.
- [x] **Hidden state is calm, not an error** — PASS, done well. Eye-slash glyph in `text-muted`, neutral `surface-700/50` chip, "Profile Unavailable" + "hidden due to visibility settings". No danger color, no retry CTA, no alarm. Exactly the brief's calm empty state (§34; DS §8 Empty ≠ Error).
- [x] **NO verification badge / trust affordance** — PASS. Academic role ("Graduate Student", "Undergraduate") is plain `text-sm text-text-primary` body text under an "Academic Role" label (line 163 comment confirms intent). No seal/shield/"verified" affordance. Self-declared fence held (§35/§39).
- [x] **NO edit affordance (read-only)** — PASS. No edit/pencil/button control in any state.
- [x] **NO email / non-safe field** — PASS. Only pronouns, bio, institution, program, role, year rendered.
- [x] **NO B2B2C / pricing / success-metric** — PASS. None present.

### (2) UX flow

- [x] **4 states coherent** — PASS. All share the card chrome: `w-80 rounded-lg bg-surface-900 border-border-hairline shadow-pop`, 60px banner, avatar overlap at `top-5 left-5` with `ring-4 ring-surface-900`, presence dot. Consistent silhouette; presence dots map emerald(online)/amber(idle) consistently.
- [x] **Esc-dismissable (overlay a11y)** — PASS. `keydown` Escape listener hides every `.popover-card` (opacity→0, scale 0.96, pointer-events none, 150ms ease-in) — calm non-bouncy exit, satisfies brief §36 + DS §8 Popover "focus management + Esc".
- [x] **Keyboard / SR affordances** — PASS. Each card: `role="dialog"` + per-state `aria-label` + `tabindex="-1"` + `focus-visible:ring-2 ring-accent-emerald`. `prefers-reduced-motion` guards present (lines 79–89).

### (3) DESIGN-SYSTEM token audit (DS §1, §2)

- [x] **No invented hex — no purple** — PASS. No purple in config or markup; prior purple banner replaced with `surface-800`.
- [x] **No raw emerald-950 ramp** — PASS. Prior emerald-950 banner replaced with `surface-800`. Only `accent-emerald #10b981` used — presence dot, focus ring, `selection:` — all DS-sanctioned.
- [x] **Surfaces match DS §1 exactly** — PASS. 950 `#0a0a0b` / 900 `#121214` / 800 `#1c1c1f` / 700 `#27272a` / 600 `#3f3f46` / 500 `#52525b` — identical to DS table; `border-hairline`/`border-hover` match.
- [x] **Text tokens match DS §1** — PASS. primary 0.92 / secondary 0.60 / muted 0.40.
- [x] **Amber NOT on Academic Year (amber = warnings/presence only)** — PASS. Academic Year row (lines 174–183) uses `text-secondary` label + `text-primary` value + `text-muted` icon — no amber, and value trimmed to "Year 3" (no "Tracker"/due-date connotation). Amber appears ONLY on the State 2 presence dot = DS `--presence-idle → --accent-amber` (sanctioned).
- [x] **Correct danger trio** — PASS. Config defines DEFAULT `#ef4444` / btn `#b91c1c` / text `#f87171` matching DS §1, and correctly leaves them UNUSED — hidden state is neutral, not danger. No danger misuse.
- [x] **Geist (DS §2)** — PASS. Geist preloaded; sans stack Geist-first.
- [x] **Labels ≥12px** — PASS. Field labels are `text-xs` = 12px (line 146 comment confirms the 10px→12px bump); pronouns `text-xs`. Nothing below 12px on text.
- [x] **No oversized numerals** — PASS. Name `text-xl` (20px, DS page-title scale) `font-medium`; "Year 3" is `text-sm`. No hero numerals, no scale inflation.
- [x] **Body min size / radius / shadow / motion** — PASS. Values `text-sm` (14px floor); `rounded-lg` cards (DS §4); `shadow-pop` `0 8px 24px` (DS §5 popover — correct, this is a floating popover); 200ms ease-out non-bouncy (DS §6); reduced-motion honored.

### (4) Icon audit (DS §7 → Phosphor / inline-SVG set)

All glyphs are inline `<svg>` (currentColor stroke) — **no Phosphor webfont, no icon CDN** (brief §28 held). Each maps cleanly to a widely-available Phosphor name for `apps/web/src/shell/icons.tsx`:

| Glyph | State/field | Phosphor name | On-set? |
|---|---|---|---|
| Graduation cap | Institution | `GraduationCap` | ✅ standard |
| Open book | Program / Field | `BookOpen` (or `Book`) | ✅ standard |
| Users | Academic Role | `Users` | ✅ standard |
| Clock | Academic Year | `Clock` | ✅ standard |
| User (single) | Hidden avatar | `User` | ✅ standard |
| Eye-slash | Hidden state | `EyeSlash` | ✅ standard (brief §4 names eye-slash for hidden) |

- All map to widely-available Phosphor glyphs; if any exact export is absent from icons.tsx it is a trivial on-family add (brief §4 sanctions closest-existing-export). No off-set/exotic glyphs.
- **Scaffolding check:** no demo overlays, no state-switcher UI, no fake roster, no debug chrome, no placeholder text inside any card. Card + 4 states only. PASS.

---

## Concerns (cited to brief §X / DS §Y)

**None blocking.** Two non-blocking B-3 port notes:

- **P1 — CDN dependencies are mockup-only (brief §28; not a blocker).** `cdn.tailwindcss.com` (line 15) and the Google Fonts Geist `<link>` (line 11) are standalone-staging conveniences. B-3 consumes DS tokens + the app's bundled Geist/Tailwind pipeline, not the CDNs. No Phosphor CDN is loaded (icons are inline), so this is the standard D→B port note, not an on-set icon issue.
- **P2 — Gallery layout is presentation, not shipped chrome (brief §2/§13; not a blocker).** `<main class="… max-w-7xl flex-wrap gap-10 waterfall-render">` renders the 4 states side-by-side for review. B-3 ships ONE card portalled to `document.body` (BUILD-14 transformed-ancestor lesson); drop the gallery wrapper + `.waterfall-render` stagger and keep the per-card `fade-in-scale` (200ms) popover animation. Also add an `aria-label`/`title` to the presence dot so status isn't color-only, matching the DS MemberListItem "not color alone" contract (DS §8) — minor parity nicety, not a fence breach on a profile card.

---

## Summary for head-designer

APPROVE. Every brief §5 success criterion and §6 fence holds: all four states designed, hidden state genuinely calm (danger trio correctly absent), self-declared fence held (role is plain text, no trust badge), read-only, no email, no B2B2C/pricing. Token audit is clean — no invented hex (purple and raw emerald-950 banners remapped to `surface-800`), amber kept off Academic Year (present only on the idle presence dot per DS `--presence-idle`), Geist, labels ≥12px, no oversized numerals, correct danger trio unused. Icons map to on-family Phosphor names, inline SVG only. The two carry-forwards (CDN strip, portal + gallery-strip + presence-dot a11y) are routine B-3 port obligations, not adoption blockers.
