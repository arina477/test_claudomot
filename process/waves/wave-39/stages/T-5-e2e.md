# Wave 39 — T-5 E2E (Pattern B — active, live prod) + T-6 layout + T-8 logout-session
Tester: 1 ui-comprehensive-tester (bundled-chromium fallback, MCP chrome absent). Each scenario ≥2×, no flakes. Prod web+api, e2e-fixture.

| Scenario | Layer | Verdict | Evidence |
|---|---|---|---|
| Settings button opens role=menu popover (aria-expanded flips) | T-5 | PASS | 3 items Profile/Privacy/Log out |
| **CRUX: UI-only reachability → Profile → upload avatar → renders** | T-5 | **PASS** | presign 200→PUT 200→confirm 200→img naturalWidth=64; persists on fresh login. **Closes wave-38 F1** |
| Privacy → /settings/privacy renders | T-5 | PASS | |
| Esc closes + refocus trigger; outside-click closes | T-5 | PASS | |
| Log out → session cleared + protected-route bounce | T-8 | PASS | POST /auth/signout 200 → /login; GET /profile 200 authed→401 after; /app bounces; httpOnly tokens cleared |
| Menu popover layout (dark tokens, opens upward, in-viewport, no overflow @1280) | T-6 | PASS | bg #27272a, no light flash, not clipped |

## Findings → V-2
- None blocking. Minor (no fix): (1) avatar preview low-contrast disc = test-fixture artifact (tiny PNG); pipeline works. (2) 429 under test-loop rapid auth-refresh = expected rate-limit, not a normal-flow defect.
```yaml
test_pattern: active
skipped: false
testers_spawned: 1
scenarios: [{id: T5-menu, verdict: PASS}, {id: T5-crux-avatar, verdict: PASS}, {id: T5-privacy, verdict: PASS}, {id: T5-keyboard, verdict: PASS}, {id: T8-logout, verdict: PASS}, {id: T6-layout, verdict: PASS}]
flakes_observed: []
fix_up_cycles: 0
findings: []
```
