# Wave 75 — T-6 Layout

**Pattern B — Active-execution.** Visual/layout + token audit of the new "Your plan" panel on the live per-server Settings→Overview surface. wave_type includes `ui` → fires.

Note: design_gap_flag=false this wave (no D-block, no `design/<feature>.html` canonicalized — panel reuses shipped PrivacyActivityPanel chrome + palette). So Action 2 (diff vs canonicalized design HTML) has no baseline artifact; the audit is a token-compliance + visual-integrity check against DESIGN-SYSTEM tokens and the sibling panels the wave reused.

## Action 1 — Deployed-state capture
Captured live at 1440px (desktop; the settings overlay is a full-screen surface, lg breakpoint):
- `wave75-t5-your-plan-panel-free.png` — panel in Free state.
- `wave75-t5-your-plan-panel-serverpro-after-upgrade.png` — panel in Server Pro state post-upgrade.

## Action 4 — Token compliance audit (getComputedStyle probes on the live panel)
| Element | Property | Value | Verdict |
|---|---|---|---|
| document body | background | rgb(10,10,11) | dark-theme base ✓ |
| Switch-plan button | backgroundColor | rgb(39,39,42) (zinc-800) | DS surface token ✓ |
| Switch-plan button | borderRadius | 6px | DS radius ✓ |
| Switch-plan button (disabled when tier==current) | color | rgba(255,255,255,0.3) | dimmed disabled state — correct UX (not a contrast bug; button only enables when a DIFFERENT tier is selected) ✓ |
| Mock disclosure `<p>` | color | rgba(255,255,255,0.4) | DS muted-text token (40% white), legible on dark surface ✓ |
| Mock disclosure | fontSize | 12px | DS caption size ✓ |
| Panel container | scrollWidth vs clientWidth | no overflow (scrollWidth ≤ clientWidth) | ✓ |

## Action 5 — Triage
No diffs to triage. Visual integrity intact:
- Dark theme consistent (base rgb(10,10,11), panel surfaces zinc-800).
- Tokens consumed from DESIGN-SYSTEM (no invented hex, off-token spacing, or fabricated shadow observed on the probed selectors).
- Mock-checkout label legible (40% white, 12px) — meets the "mock label legible" requirement.
- No overflow, no contrast breakage. Panel matches the reused PrivacyActivityPanel chrome (as designed at B-3).

## Findings
- none. (Panel reuses canonical sibling-panel DS patterns; token probes all on-system; no overflow/contrast issue at 1440.)

```yaml
test_pattern: active
skipped: false
surfaces_audited: ["Your plan panel — /app server Settings→Overview overlay"]
breakpoints: [1440]     # single desktop bp; overlay is full-screen lg surface (mobile drawer verified navigable but panel identical)
diffs: []               # no canonicalized design HTML baseline (design_gap_flag=false; reused sibling DS)
token_violations: []
fix_up_cycles: 0
findings: []
```
