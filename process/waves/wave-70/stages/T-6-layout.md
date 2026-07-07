# T-6 — Layout (wave-70) [Pattern B — active, live prod]
Single tester captured 6 desktop (1440) screenshots (app, blocked-list-empty, fp-server, member-list, member-context-menu, block-dialog — in T-6-layout/screens/) then hit an INFRA connection drop mid-run (before its own mobile/token capture). The interrupted checks are CROSS-COVERED by independent live verification:
- **Block dialog desktop (1440):** PASS — modal chrome + danger confirm + ghost cancel + consequence copy, dark surfaces (screenshot 05-block-dialog-1440.png). Matches design/block-ui.html.
- **Block dialog MOBILE bottom-sheet (<640px):** PASS via T-5 live cross-confirmation ("bottom sheet at <640px, anchored bottom, full-width, grab handle") — the exact wave-69 T6-M1 defect class, confirmed NOT present (portaled to body).
- **Danger token:** PASS — T-5 confirmed "red danger confirm + ghost cancel" live; D-3 head-designer independently verified the confirm fill = --danger-btn #b91c1c (6.5:1 AA) in the canonical HTML.
- **Blocked-users list:** PASS — renders (T-5 scenario 3); shows UUID not name (known B-6 enrichment gap → V-2, not a layout FAIL).
- **Block affordance on member row / not on own row:** PASS (T-5 scenario 2 + screenshots 03/04).
## Findings: none new (the T-6 agent's own mobile/token capture was infra-interrupted, but every check is covered by T-5's independent live run + the D-3 gate). Coverage note: T-6's standalone mobile screenshot not saved (infra drop) — mobile bottom-sheet is T-5-live-confirmed.
```yaml
test_pattern: active
skipped: false
surfaces_audited: [block-confirm-dialog, blocked-users-list, block-affordance]
breakpoints: [1440, 375]
diffs:
  - {surface: block-dialog, breakpoint: 1440, verdict: PASS}
  - {surface: block-dialog, breakpoint: 375, verdict: PASS-via-T5-live}
  - {surface: blocked-users-list, breakpoint: 1440, verdict: PASS}
token_violations: []
fix_up_cycles: 0
findings: []
note: "T-6 standalone agent infra-dropped after desktop capture; mobile bottom-sheet + danger token cross-covered by T-5 live + D-3 gate"
```
