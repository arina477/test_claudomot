# T-2 — Unit (wave-21)
**Pattern A — CI-verified.** test job: web 13 files / 193 passed (api 346 unchanged, no api diff). The two new offline-UX test files confirmed EXECUTED (read from the test-job log, not assumed):
- useConnectionState.test.tsx — 9 tests: online/reconnecting(socket active)/offline(socket active=false)/window-offline-absolute/rapid-flap-debounce-last-wins + D1 (window=online + socket=reconnecting -> reconnecting NOT online) + D2 (window=offline + socket=connected -> offline NOT online) + AppHome "not hardcoded online" wiring (asserts live "Reconnecting…"/"Offline" text renders).
- multiPageCatchup.test.ts — 5 tests (see T-4).
Source-priority transition table tested as disagreement cases (D1/D2), not single happy path — mutation-sanity met (a deriveState that defaulted to 'online' on disagreement fails D1/D2). Deterministic: fake timers for debounce, vi.fn socket mocks, no real I/O.

```yaml
test_pattern: ci-verified
evidence:
  - "test job: web 13 files/193 passed incl useConnectionState.test.tsx(9) + multiPageCatchup.test.ts(5); api 346"
  - "EXECUTED confirmed via test-job log read (CI-PRINCIPLES rule 3)"
findings: []
head_signoff: {verdict: APPROVED, stage: T-2, failed_checks: [], rationale: "Both new test files executed (not skipped); source-priority asserted as a disagreement table incl D1/D2; deterministic. Asserts observable hook return value, not mock counts.", next_action: PROCEED}
```
