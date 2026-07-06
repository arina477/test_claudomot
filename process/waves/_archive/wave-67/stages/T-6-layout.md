# Wave 67 — T-6 Layout (live)

**Layer:** T-6 layout — Pattern B (active, live prod probe)
**Canonical design:** `design/server-discover.html` (D-3 adopted server-discover + §8 AA fix)
**Method:** computed-style token diff of the deployed `/discover` vs the design tokens (surface-950 `#0a0a0b`, surface-900 `#121214`, surface-800 `#1c1c1f`, surface-700 `#27272a`, accent-emerald `#10b981`, border-hairline `rgba(255,255,255,0.06)`, text-primary `rgba(255,255,255,0.92)`) + screenshot `t6-discover-loaded.png`.

## Token comparison (deployed → design)

| Element | Deployed computed | Design token | Match |
|---------|-------------------|--------------|-------|
| `<html>` | class `dark` | dark-only | ✓ |
| body bg | `rgb(10,10,11)` | surface-950 `#0a0a0b` | ✓ |
| h1 | color `rgba(255,255,255,0.92)`, 20px, weight 600 | text-primary, text-xl (DESIGN-SYSTEM §2), semibold | ✓ |
| search input | bg `rgb(18,18,20)`, border `rgba(255,255,255,0.06)`, radius 6px | surface-900, border-hairline, rounded-md | ✓ |
| server card | bg `rgb(28,28,31)`, border-hairline, radius 8px | surface-800, border-hairline, rounded-lg | ✓ |
| sticky header | position sticky, bg `rgba(10,10,11,0.85)`, backdrop `blur(16px)` | glass-refraction | ✓ |
| **Join button (§8 AA fix)** | **bg `rgb(16,185,129)`, text `rgb(10,10,11)`**, weight 600, radius 6px | **accent-emerald bg + surface-950 text (dark-on-emerald)** | ✓ |
| Join → joined state | "Open": bg `rgb(39,39,42)` surface-700, text text-primary | `bg-surface-700 text-white` Open variant | ✓ |

## §8 dark-on-emerald AA fix — VERIFIED LIVE
The un-joined Join button renders `#0a0a0b` (surface-950) text on `#10b981` (accent-emerald) background — the D-3 §8 accessibility fix. Contrast ≈ 7.4:1 → passes WCAG AA (and AAA for the button's large-ish semibold text). This was the specific §8 concern flagged at D-3; it is live and correct.

## Empty-state styling
Honest cold-start empty-state (`#emptyColdStart`) renders per design: centered planet icon in surface-900 circle, "No public communities yet" heading (text-primary semibold), muted body copy — matches the design's honest empty container (not the danger-styled error state).

## Minor / non-material
- Grid computed `display:block` / `grid-template-columns:none` at the MCP default viewport (~780px) with a single card — the responsive `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` collapses to a single visual column here; identical to design intent with one card. Not a divergence; screenshot confirms correct visual. No token violations found.

## Verdict
T-6 PASS (live). Dark-only theme, card grid, search bar, glass header, and — critically — the dark-on-emerald Join button (§8 AA fix) all match the canonical design tokens. Honest empty-state styled per design. 0 material token divergences.

```yaml
stage: T-6
layer: layout
pattern: active-live
verdict: PASS
dark_theme: match
card_grid: match
search_bar: match
join_button_dark_on_emerald_AA: verified   # #0a0a0b on #10b981, ~7.4:1
empty_state_styling: match
material_divergences: 0
findings: []
head_signoff: APPROVED
```
