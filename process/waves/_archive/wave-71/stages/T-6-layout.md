# T-6 — Layout (wave-71) [Pattern B — active]
UI surfaces: enriched blocked-users list (name+avatar) + the member-row Block↔Unblock toggle. Both live-confirmed at T-5 (scenario 2: list renders displayName + @username + avatar initials, skeleton + empty state; scenario 1: the toggle affordance renders Block↔Unblock live). Design canonical block-ui.html (D-3-adopted wave-70) already covers both surfaces (avatar+name list row, block affordance) — no new surface, tokens unchanged. No layout diff finding. (Note: member affordances hover-only/wide-viewport — recorded in T-5 as an a11y future note, not a layout defect.)
```yaml
test_pattern: active
skipped: false
surfaces_audited: [blocked-users-list-enriched, member-row-block-toggle]
breakpoints: [1440]
diffs: [{surface: blocked-list, verdict: PASS-via-T5-live}, {surface: member-toggle, verdict: PASS-via-T5-live}]
token_violations: []
findings: []
```
