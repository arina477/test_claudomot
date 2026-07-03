# Wave 41 — T-5 E2E (Pattern B, live prod) + T-6 layout
ui-comprehensive-tester (bundled-chromium, MCP chrome absent). Prod web+api, fixtures A(owner)+B(co-member).
| Scenario | Layer | Verdict | Evidence |
|---|---|---|---|
| "Moderate Members" role toggle present + togglable + persists | T-5 | PASS | 20x PATCH /roles/:id; disabled on default role/non-owner |
| Moderator UI: kebab→menu→duration(5m/1h/1day)→timeout + muted indicator | T-5 | PASS (2×) | 200 POST timeout; amber indicator appears; Remove→204 DELETE clears |
| Non-moderator: NO kebab controls, but muted indicator visible (public) | T-5 | PASS | 0 kebabs; amber indicator still shown |
| Keyboard: Enter open, Arrow nav, Esc close+refocus, outside-click close | T-5 | PASS | |
| Delete-any UI affordance | T-5 | DEFERRED | needs seeded co-member message; code path exists + T-8 verified backend delete-any + rank guard live |
| Moderation menu/popover/indicator layout @1280 | T-6 | PASS | #27272a menu, in-viewport, amber #f59e0b legible, roster matches design; minor: muted icon hard against 240px panel right edge (legible, not clipped) |

## Findings → V-2 (all non-blocking)
- LOW cosmetic (T-6): muted speaker-x icon hard against member-panel right edge (little right padding; legible, not clipped).
- LOW coverage: delete-any UI not E2E-tested (deferred; backend delete-any + rank guard PROVEN at T-8; UI affordance code present).
```yaml
test_pattern: active
skipped: false
testers_spawned: 2
scenarios: [{id: role-toggle, verdict: PASS}, {id: timeout-flow, verdict: PASS}, {id: non-mod-indicator, verdict: PASS}, {id: keyboard, verdict: PASS}, {id: layout, verdict: PASS}, {id: delete-any-ui, verdict: DEFERRED}]
findings:
  - {severity: low, id: T6-icon-padding, description: "muted icon right-edge padding, cosmetic"}
  - {severity: low, id: delete-any-ui-coverage, description: "delete-any UI not E2E'd (backend proven T-8)"}
```
