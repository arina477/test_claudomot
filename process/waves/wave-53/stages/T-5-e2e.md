# T-5 — E2E (wave-53) — SKIPPED (with active coverage elsewhere)

wave_type: backend + auth. No user-visible FEATURE-flow change: the fix changes only the error envelope on a malformed-input / attack path (a legitimate client always sends a valid-UUID serverId, so no normal user flow is altered). Reasoning:
- **Regression of legitimate focus-room flows** (subscribe/create/join/leave/timer — AC-6) is covered by the CI `e2e` job (run 28758318294, pass 1m0s) which actively ran the Playwright E2E against the built app post-fix — green = no regression. `isUuid(validServerId)` is always true (server ids ARE uuids), so no legitimate flow can be rejected.
- **The fix's own realtime behavior** (malformed serverId → generic no-leak error over a real socket) is actively verified at **T-8** against the LIVE deploy (real-socket penetration probe) — honoring T-5 rule 3 (real-socket verification of realtime behavior, not mocked-socket units) for this wave's change.
- The initial subscribe_server_rooms handshake itself is UNCHANGED by this wave (wave-52 covered it with a real-socket E2E; CI e2e re-ran it green).

```yaml
test_pattern: skipped
skip_reason: "backend-only, no user-visible feature-flow change; focus-room regression covered by green CI e2e job; malformed-input realtime behavior actively verified at T-8 (live real-socket probe)"
findings: []
```
