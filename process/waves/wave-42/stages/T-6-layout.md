# Wave 42 — T-6 Layout (active — direct-playwright vs deployed prod)

Direct playwright-core (chromium-1208, MCP bypassed) as fixture A (organizer) → Assignments panel + live Submissions roster + Return dialog. Breakpoints 1440/1280/1024 captured (screens/).

## Verdict: LAYOUT PASS · TOKEN COMPLIANCE PASS
- **Layout:** no horizontal overflow at any width (scrollWidth==clientWidth); no clipping/overlap; at 1024 title + submission-text truncate gracefully; 3-pane layout intact at the 1024 min (overlay-drawer collapse is <1024 per design §9). Matches design/assignment-submissions.html structure.
- **Tokens:** all on-token, no invented hex — roster surface-950 + hairline + radius-lg; Awaiting amber dot rgb(245,158,11)=#f59e0b + amber glow; Return dialog surface-700 + radius-lg + shadow-pop + emerald #10b981 primary; count badge + Return trigger + buttons on-token.

## Findings (all LOW / cosmetic — → V-2)
- **T6-F1 (LOW):** deployed Return control is a centered scrim modal vs the design HTML's anchored popover — content + tokens + a11y equivalent (role=dialog, focus trap, Esc+restore all verified at T-5), positioning model differs. Acceptable equivalent; V-2 decides accept vs bug-design.
- **T6-F2 (LOW cosmetic):** dialog textarea focus ring alpha ~0.2 vs --glow-focus spec 0.4 — correct hue, slightly softer.
- **T6-F3 (LOW):** Return dialog header "Return to <name>" shows an empty name slot for a fixture submission whose user has no displayName — null-coalesced (display_name ?? ''), renders empty not a crash (confirmed by B-6 code-reviewer); likely fixture-data artifact. Worth a glance in V-2 (fallback to username when displayName empty).

```yaml
test_pattern: active
skipped: false
surfaces_audited: [assignments-panel-with-submissions-roster, return-dialog]
breakpoints: [1440, 1280, 1024]
diffs:
  - {surface: submissions-roster, breakpoint: "1440/1280/1024", diff_pct: "<5 (structural match)", verdict: PASS}
  - {surface: return-dialog, breakpoint: "1440/1280/1024", diff_pct: "positioning differs (modal vs popover)", verdict: PASS-equivalent}
token_violations: []
fix_up_cycles: 0
findings:
  - {severity: low, surface: return-dialog, description: "centered modal vs design anchored popover; tokens+a11y equivalent"}
  - {severity: low, surface: return-dialog, description: "focus ring alpha 0.2 vs 0.4 (hue correct)"}
  - {severity: low, surface: return-dialog, description: "empty student-name slot when displayName null (null-coalesced, no crash); consider username fallback"}
```
