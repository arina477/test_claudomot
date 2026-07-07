# D-3 Plan-Design Review — Educator Admin Console (wave-76)

**Reviewer role:** `/plan-design-review` (designer's eye, per-dimension 0–10)
**Artifact under review:** `design/staging/educator-admin-console.html`
**Brief:** `process/waves/wave-76/stages/D-1-brief/educator-admin-console-brief.md`
**Design system:** `design/DESIGN-SYSTEM.md`

## VERDICT: **APPROVE**

The refined mockup consumes DESIGN-SYSTEM tokens exactly, delivers all four states, renders the four analytics groups as scannable stat cards (no charts, no growth-dashboard chrome), and honors every fence in brief §6 (no charts, no oversized numerals, Geist-only, no cinematic motion). The concerns below are minor/cosmetic and do not block adoption; they should be swept into the B-block build so the shipped `.tsx` doesn't inherit the markup typos.

---

## Per-dimension scores

### Visual hierarchy — 9/10
Scannable four-group structure is clear: a 3-column stat grid (Total Members / Messages 7D / Assignments Total) at equal weight (lines 279–353), then a full-width "Recent Activity" list as the fourth group (355–410). Stat values (`text-2xl` 24px, `tabular-nums`, `--text-primary`) sit above uppercase-tracked labels (`.label-text`, secondary) with a hairline-bordered sub-stat `dl` — the eye lands on the number first, then the breakdown. Panel header carries console title + tier marker + one-line purpose (lines 253–273), matching the ServerPlanPanel reading order (brief §4).
- **Concern (−1):** the fourth group's title "Recent Activity" is `text-lg` semibold (line 357) while the three stat cards label with `text-xs` uppercase — the fourth group reads as heavier chrome than the first three, so the "4 equal groups" cadence is slightly uneven.
- **What makes it a 10:** unify the section-title treatment across all four groups (e.g. a shared `text-lg` header over the stat grid, or drop Recent Activity to the label idiom) so the four zones read as one rhythm.

### Spacing rhythm — 9/10
Gaps sit on the DS 24px unit: panel body `p-6` (24px, line 276), stat grid `gap-6` (24px, line 279), sub-stat `dl` `gap-4` (16px, lines 293/336), inter-section `space-y-8` (32px). Radii are DS-correct: panel/card `rounded-lg` = 0.5rem = `--radius-lg` (DS §4, lines 78/86). Shadow is the exact ServerPlanPanel idiom `--shadow-sm: 0 1px 2px rgba(0,0,0,0.4)` (brief §4, DS §5, lines 47/79/89).
- **Concern (−1, measurable vs brief §4):** brief specifies card padding `p-4 sm:p-6`; the mockup hardcodes `padding: 1.5rem` (`p-6`) in `.stat-card` (line 87) with no responsive step-down. 24px is a DS value, so acceptable — but not the literal responsive spec.
- **What makes it a 10:** apply `p-4 sm:p-6` so narrow viewports get the tighter 16px card padding the brief §4 names.

### Brand coherence — 10/10
Calm / academic / low-noise, dark-only. Palette is strictly one base (zinc surfaces 950→500) + emerald (`#10b981` — active nav, positive delta, tier dot) + amber (`#f59e0b` — Due Soon) + `--danger-text` (`#f87171` — Overdue), all consumed as tokens with **no invented hex** — exactly DS §1 (lines 23–44). **Geist** is loaded (weights 400/500/600, line 11) and set on `body` with system fallback (line 53); no non-Geist face anywhere — brief §6's typeface fence PASSES. Stat numerals are `text-2xl` (24px, lines 289/313/331) — the **top** of the DS type scale (§2, `text-2xl` = headline size), NOT oversized: brief §6's "oversized numerals" fence PASSES. **No charts / graphs / time-series** — counts + a text delta only ("+412 versus last week", line 318), matching the read-only-aggregate constraint (brief §5/§6). This reads as a settings panel, not a growth dashboard.

### Edge-case handling — 9/10
All four brief-required states are present and individually designed:
- **loading** (lines 175–208) — spinner in header + skeleton stat grid + activity skeletons via `.skeleton-block` shimmer (surface-800→700 gradient); DS §8 wants skeletons over spinners for content lists, and the body correctly uses skeletons.
- **loaded** (249–414) — the dashboard with all four groups + a "Sync 2m ago" freshness marker (lines 270–272).
- **empty** (211–230) — dedicated **"No activity yet"** affordance (tray icon + headline + one-line copy), exactly brief §3 — a graceful zeroed state, not an error.
- **forbidden** (233–245) — clean access-denied (lock icon on danger/10 tint + "Access Restricted" + School-tier explanation + `ERR_INSUFFICIENT_ROLE_ENTITLEMENT`).
- **Defect (−1, non-blocking):** forbidden-state icon carries a stray class token — `class="ph ph-lock p ..."` (line 236). The bare `p` is a leftover typo; harmless in render but should be removed before B-block ports the markup.
- **What makes it a 10:** fix the stray `p`; consider dropping the header spinner in the loading state in favor of skeleton-only per DS §8.

### Accessibility — 9/10
Strong for a dark surface. `@media (prefers-reduced-motion: no-preference)` gates BOTH the skeleton shimmer (line 125) and the stat-card hover border (line 93) — reduced-motion users get a static surface (DS §6). Real content copy (empty-state paragraph, activity descriptions, stat labels) uses `--text-secondary` (0.60 opacity ≈ 6+ :1 on surface-800/900) — **not** the `--text-muted` (0.40) the brief §4 loosely suggested for empty copy. Secondary-not-muted for real content is the correct AA call and is explicitly desirable. Danger usage is correct: `--danger-text` `#f87171` on the Overdue value (line 348) sits on plain `surface-900` (~6.3:1, well above AA) and on the danger/10-tint forbidden icon (line 235) — the exact PASS case DS §1/§37 prescribe; never used as white-on-`#ef4444` fill (DS §1 flags that as AA FAIL).
- **Concern A (measurable):** no visible focus-ring styling is defined on the sidebar `<a>`/`<button>` nav (lines 143–159) or activity rows — DS provides `--glow-focus` (emerald ring, line 49) but the mockup relies on the browser default outline. B-block must wire `focus-visible:` rings so brief §5 "keyboard-navigable" holds.
- **Concern B (minor):** `text-[11px]` tier badge (line 217/259) and `text-xs` (12px) timestamps sit at/below the DS §2 12px metadata floor — legible but the smallest allowed; confirm contrast holds at that size.
- **What makes it a 10:** wire visible `--glow-focus` focus-visible rings on all interactive nav; keep informational text at `--text-secondary`+ (already the case).

### Responsive behavior — 8/10
Grid collapses `grid-cols-1 md:grid-cols-3` (line 279); the sidebar rail is `hidden md:flex` (line 137) with a `md:hidden` mobile header fallback (lines 166–169); content is `max-w-5xl` centered with `px-4 sm:px-8` and `py-8 md:py-16` (line 172); activity-row timestamps `hidden sm:block` protect narrow layouts (lines 373/387/401). Coherent and stable at narrow widths.
- **Concern (−2):** DS §9 defines desktop breakpoints at **1024 / 1280 / 1440** (mobile out of scope) with content max ~1100px; the mockup keys off Tailwind's default `md` (768px) and `max-w-5xl` (1024px), so the single-column collapse happens at 768px rather than the DS-named 1024px min — a different responsive contract than the shipped panes use.
- **What makes it a 10:** align the collapse breakpoint to DS §9's 1024px min (`lg:`) and cap content ~1100px to match the shipped surface.

---

## Summary table

| Dimension | Score |
|---|---|
| Visual hierarchy | 9 |
| Spacing rhythm | 9 |
| Brand coherence | 10 |
| Edge-case handling | 9 |
| Accessibility | 9 |
| Responsive behavior | 8 |
| **Average** | **9.0** |

## Fence compliance check (brief §6) — all PASS
| Fence | Status |
|---|---|
| NO charts / graphs / time-series | PASS — counts + stat cards + one text delta only |
| NO oversized numerals | PASS — stat values `text-2xl` (24px), DS scale ceiling |
| Geist-only (no non-Geist fonts) | PASS — Geist loaded + set on body, system fallback only |
| NO cinematic motion | PASS — 150ms color + 2.5s linear skeleton, both reduced-motion-gated |
| NO editing/mutation UI (read-only) | PASS — "Read-only aggregate metrics" stated (line 265); no mutating controls |
| NO pricing / B2B2C / M13 success-metric | PASS — tier shown only as a context marker, no pricing UI |

## Concerns log (non-blocking, hand to B-block)
1. **Stray `p` class token** in forbidden-state icon (`design/staging/educator-admin-console.html:236`, `ph ph-lock p`). Remove before porting to `EducatorAdminConsole.tsx`.
2. **Card padding** fixed at `p-6`; brief §4 specifies `p-4 sm:p-6`. Apply the responsive variant in the build.
3. **Focus rings** not styled in the static mockup — wire `--glow-focus` (`focus-visible:`) on interactive sidebar nav (brief §5 "keyboard-navigable").
4. **Collapse breakpoint** uses Tailwind `md:` (768px); DS §9 names 1024px as the minimum supported width — consider `lg:` alignment.
5. **Section-title parity** — "Recent Activity" (`text-lg`) is heavier than the three stat-card labels; unify for an even 4-group cadence.

None of the above changes the adopt decision. **APPROVE.**
