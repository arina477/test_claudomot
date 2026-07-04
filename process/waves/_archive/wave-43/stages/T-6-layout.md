# Wave 43 — T-6 Layout (active — direct-playwright vs deployed prod)

Direct playwright-core (chromium-1208) as fixture A → Schedule surface. Breakpoints 1440/1280/1024 (screens/).

## Verdict: LAYOUT PASS (1 major responsive defect) · TOKEN COMPLIANCE PASS (0 violations)
- Faithful match to design/class-scheduling.html — date-grouped AGENDA (not month-grid); session cards + authoring modal + detail drawer render.
- No horizontal overflow at any breakpoint (scrollWidth==clientWidth) — agenda, modal-open, detail-open. 1440 comfortable; 1280 stacked-card layout + ellipsis truncation; 1024 clean when detail closed + modal centered.
- **Tokens all on-token (0 violations):** Weekly chip emerald #10b981 radius-full; delete danger-text #f87171 on danger/10 tint (AA); selected-card ring --glow-focus; New-session emerald bg + surface-950 text + radius-md; card radius-lg + surfaces #1c1c1f/#121214; Geist.

## Findings (→ V-2)
- **T6-F1 (MAJOR responsive, → V-2):** at the 1024 MIN breakpoint, selecting a session opens the 359px detail drawer ALONGSIDE the members panel (which per DESIGN-SYSTEM §9 should collapse to a toggle ≤1024) — rail+sidebar+agenda+detail+members compete for 1024px, crushing the agenda card to 28px (unreadable; Weekly chip clipped). NO overflow (compressed, not broken). Only at 1024+detail-open+members-visible; 1280/1440 (desktop-first primary) clean. B-3/D-block responsive gap — the members panel should collapse when the detail drawer opens at ≤1024. Non-blocking for ship (primary breakpoints clean) — V-2 classifies (likely bug-design).
- **T6-F2 (INFO):** amber #f59e0b today/soon state not exercisable (all fixtures far-future Aug 2026+) — token source verified via adjacent elements; recommend a follow-up spot-check with a today-dated session.
- **T6-F3 (LOW cosmetic):** modal primary CTA reads "Create Session" vs the design's "Save" — copy only, tokens/layout identical.

```yaml
test_pattern: active
skipped: false
surfaces_audited: [class-calendar-agenda, session-card, authoring-modal, session-detail-drawer]
breakpoints: [1440, 1280, 1024]
diffs:
  - {surface: agenda, breakpoint: "1440/1280", verdict: PASS}
  - {surface: detail-drawer, breakpoint: "1024", diff: "members panel not collapsed → agenda card crushed to 28px", verdict: MAJOR-responsive}
token_violations: []
fix_up_cycles: 0
findings:
  - {severity: major, surface: detail-drawer-1024, description: "members panel not collapsing at ≤1024 when detail drawer open → agenda card crushed to 28px (no overflow); 1280/1440 clean"}
  - {severity: info, surface: badges, description: "amber today/soon not exercisable (far-future fixtures); follow-up spot-check"}
  - {severity: low, surface: modal, description: "CTA copy 'Create Session' vs design 'Save'"}
```
