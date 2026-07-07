# D-3 Plan-Design Review — Educator Admin Console (wave-76)

**Reviewer role:** `/plan-design-review` (designer's eye, per-dimension 0–10)
**Artifact under review:** `design/staging/educator-admin-console.html` (refined mockup, latest)
**Brief:** `process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

## VERDICT: **APPROVE**

The refined mockup consumes DESIGN-SYSTEM tokens exactly, delivers all four required states, renders the four analytics groups as scannable stat cards + a read-only activity ledger (no charts, no growth-dashboard chrome), and honors every fence in brief §6 and the prompt (no charts, calm reduced-motion-gated motion, Geist-only, capped numerals within the type scale). Contrast passes WCAG AA on every text surface I checked. The concerns below are minor/cosmetic and do not block adoption.

---

## Per-dimension scores

### Visual hierarchy — 9/10
Clean, scannable four-group read: panel header (shield + `text-[17px]` title + tier pill + one-line purpose, lines 258–277) → a 3-column equal-weight stat grid (Total Members / Messages 7D / Assignments Total, lines 284–356) → a full-width "Recent Activity" ledger as the fourth group (360–414). Inside each card the eye lands on the value first: label (`.label-text`, uppercase-tracked, secondary) → value (`text-xl` primary, `tabular-nums`) → hairline-split sub-stat `<dl>`. Reading order matches the ServerPlanPanel idiom the brief §4 asks for.
- **Concern (−1):** the fourth group's title "Recent Activity" is `text-lg` semibold (line 362) while the first three groups label with `text-xs` uppercase — the fourth zone reads as slightly heavier chrome, so the "4 equal groups" cadence is a touch uneven. Non-blocking; unify the section-title treatment at adopt for a fully even rhythm.

### Spacing rhythm — 9/10
Gaps sit on the DS §3 4px scale: panel body `p-4 sm:p-6` (line 281), stat grid `gap-6` (24px, line 284), sub-stat `<dl>` `gap-4` (16px, lines 298/341), inter-module `space-y-8` (32px, line 281). Card padding is `p-4 sm:p-6` on every padded surface (stat cards line 287/311/329, panel header 258, empty/forbidden bodies 225/239) — matches brief §4 and the prompt fence exactly, including the responsive step-down. Radii DS-correct: panel/card `rounded-lg` = `--radius-lg` (DS §4, lines 78/86). Shadow is the exact ServerPlanPanel idiom `--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)` (brief §4 / DS §5, lines 47/79/89). Page container `px-4 sm:px-8 py-8 md:py-16` gives a calm academic column.

### Brand coherence — 10/10
Calm / academic / low-noise, dark-only, and token-exact.
- **Palette:** strictly one base (zinc surfaces 950→500) + emerald (`#10b981` — active nav, positive `+412` delta, tier dot) + amber (`#f59e0b` — Due Soon) + `--danger-text` (`#f87171` — Overdue, forbidden icon on danger/10 tint), all consumed as DS tokens with **no invented hex** (DS §1, lines 23–44). No gaming-neon.
- **NO charts:** confirmed absent — counts + stat cards + one text delta ("+412 versus last week", line 323) + a text activity ledger only. No SVG/canvas/sparkline/time-series. Reads as a settings panel, not a growth dashboard (brief §5/§6 fence PASS).
- **Geist:** loaded (weights 400/500/600, line 11) and set on `body` with system fallback (line 53); no non-Geist face anywhere (DS §2 / brief §6 fence PASS).
- **Capped stat numerals:** the four aggregate values (`342`, `15,289`, `942`, and `<dl>` sub-stats at `text-[15px]`) are `text-xl` (20px) at most (lines 294/318/336) — at/under the DS §2 scale ceiling for page/stat titles, `tabular-nums` for aligned digits. Not oversized (fence PASS).
- **Calm motion:** `transition-colors 150ms ease` (DS §6) + a subtle 2.5s linear skeleton shimmer, both wrapped in `@media (prefers-reduced-motion: no-preference)` (lines 92/130). No bounce, no cinematic reveal (fence PASS).

### Edge-case handling — 9/10
All four brief §3 states present and individually designed, not stubbed:
- **loading** (lines 179–213) — header spinner + skeleton stat grid + activity skeletons via `.skeleton-block` shimmer.
- **empty** (215–235) — dedicated **"No activity yet"** affordance (clipboard icon in circle + headline + one-line "Once students join…" copy), exactly brief §3 — a graceful zeroed state, not an error framing.
- **forbidden** (237–250) — clean access-denied (lock on danger/10 tint + "Access Restricted" in `--danger-text` + School-tier explanation + `ERR_INSUFFICIENT_ROLE_ENTITLEMENT` mono footer).
- **loaded** (252–419) — the full dashboard with a "Sync 2m ago" freshness marker (lines 275–277).
- **Concern (−1, non-blocking):** DS §8 prefers skeletons over spinners for content lists; the loading body correctly uses skeletons, but the panel header still carries a `ph-spinner animate-spin` (line 183). Consider dropping the header spinner for skeleton-only consistency.

### Accessibility — 8/10
Strong AA posture on a dark surface.
- **prefers-reduced-motion** gates BOTH the skeleton shimmer (line 130) and the stat-card hover border (line 92) — reduced-motion users get a static surface (DS §6). Good.
- **focus-visible rings:** `.focus-visible-glow:focus-visible` applies the emerald `--glow-focus` ring (lines 106–110, 49) to sidebar nav links, the mobile menu button, and "Back to Server" (lines 148–163, 172) — brief §5 "keyboard-navigable" is wired, not left to the browser default.
- **Secondary-not-muted:** real content (empty copy, activity descriptions, stat labels) uses `--text-secondary` (0.60), **not** `--text-muted` (0.40) — the HTML comment even notes muted is "Relegated per v2 feedback" (line 37). Correct AA call and required by the prompt.
- **Danger usage:** `--danger-text` `#f87171` on the Overdue value/chip (lines 350–353) and forbidden icon on danger/10 tint (line 240) — the exact ~6.3:1 PASS case DS §1 prescribes; never used as white-on-`#ef4444` fill (the AA-FAIL case DS §1 flags).
- **Concern A (measurable):** the sync-freshness chip, tier pill, and activity-row timestamps are `--text-secondary` (0.60) at `text-xs`/`text-[11px]` (lines 264/275/378) — at the DS §2 12px metadata floor. Contrast clears AA (~4.6:1) but sits near the small-text floor; do not reduce further.
- **Concern B (carry to B-3):** the active "Educator Console" nav entry (line 152) should get `aria-current="page"` in the shipped `.tsx` (DS §8 ChannelSidebar `aria-current` idiom); nav `href="#"` are expected mockup placeholders.

### Responsive behavior — 8/10
- Card padding `p-4 sm:p-6` present on every padded surface (prompt fence PASS). Page gutter `px-4 sm:px-8`, `py-8 md:py-16`.
- Stat grid `grid-cols-1 md:grid-cols-3` (line 284) collapses to single column below `md`; sidebar rail `hidden md:flex` (line 142) with a `md:hidden` sticky mobile header fallback (170–174); activity-row timestamps `hidden sm:block` and rows switch `items-start` → `sm:items-center` for narrow layout. `max-w-5xl` content cap keeps the academic column comfortable.
- **Concern (−2):** DS §9 defines desktop breakpoints at **1024 / 1280 / 1440** (mobile out of scope) with content max ~1100px; the mockup keys off Tailwind default `md` (768px) and `max-w-5xl` (1024px), so the single-column collapse fires at 768px rather than the DS-named 1024px minimum — a slightly different responsive contract than the shipped panes use. Non-blocking; align the collapse to `lg:` / 1024px and cap content ~1100px at build.

---

## Summary table

| Dimension | Score |
|---|---|
| Visual hierarchy | 9 |
| Spacing rhythm | 9 |
| Brand coherence | 10 |
| Edge-case handling | 9 |
| Accessibility | 8 |
| Responsive behavior | 8 |
| **Average** | **8.8** |

## Fence-verification check — all PASS
| Fence | Status |
|---|---|
| NO charts / graphs / time-series | PASS — counts + stat cards + one text delta + text ledger only |
| Capped stat numerals (within type scale, ≤ `text-xl`) | PASS — stat values `text-xl` (20px), at DS §2 scale ceiling |
| Geist-only (no non-Geist fonts) | PASS — Geist loaded + set on body, system fallback only |
| Calm motion (no cinematic/bouncy; reduced-motion gated) | PASS — 150ms color + 2.5s linear skeleton, both reduced-motion-gated |
| Dark-only, zinc + emerald + amber, token-exact | PASS — no invented hex |
| 4 states incl. empty "No activity yet" | PASS — loading / loaded / empty / forbidden all designed |
| Read-only (no editing/mutation UI) | PASS — "Read-only aggregate metrics" stated (line 270); no mutating controls |
| NO pricing / B2B2C / M13 success-metric | PASS — tier shown only as a context marker |

## Concerns log (non-blocking, hand to B-block)
1. **Section-title parity** — "Recent Activity" (`text-lg`) is heavier than the three stat-card labels; unify for an even 4-group cadence.
2. **Loading-state header spinner** — DS §8 prefers skeleton-only for content; drop the header `ph-spinner` for consistency.
3. **Collapse breakpoint** uses Tailwind `md:` (768px); DS §9 names 1024px as the minimum supported width — align to `lg:` and cap content ~1100px.
4. **`aria-current="page"`** on the active "Educator Console" nav entry in the shipped `.tsx` (DS §8).
5. **Small-text floor** — `text-xs`/`.60` metadata (sync chip, timestamps, tier pill) is at the DS §2 12px AA floor; do not reduce further.

None of the above changes the adopt decision. **APPROVE.**
