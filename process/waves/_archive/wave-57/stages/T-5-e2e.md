# T-5 — E2E (wave-57) — Pattern A (component-fidelity + CI e2e) + live smoke
The fix is a pure CLIENT-SIDE React nav-state transition (dmHomeActive cleared on server-select/Home). No backend/realtime element → no live pen-probe needed (unlike the WS-gateway waves). Authoritative behavioral proof:
- **T-2 component tests (4, mutation-verified):** render the REAL AppShell + ServerRail, enter DM home, click a server/Home, assert DmHome exits on the FIRST click (+ re-select-same-server + DM-entry regression). B-6 mutation test: reverting the fix fails 3/4 → genuinely load-bearing, not mocked-shell theater. This is full-fidelity for a client-side state transition (jsdom + real components; the transition has no backend dependency).
- **CI e2e job** (run 28764778640) green → no Playwright e2e regression from the change.
- **Live smoke:** deployed web (1361c49) serves the shell (HTTP 200, bundle served) — the fix ships in the live bundle.
No FAIL/flake. No findings. (A full authenticated live click-flow would re-confirm the same client logic the real-component tests already exercise; not warranted for a nav-state papercut.)
```yaml
test_pattern: active
skipped: false
findings: []
note: "client-side nav-state fix; real-component mutation-verified tests are authoritative; CI e2e green; live web serves 1361c49"
