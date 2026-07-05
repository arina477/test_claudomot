# T-2 — Unit (wave-50)

**Pattern:** A (CI-verified).

- **CI evidence:** `test` job (`pnpm test:ci`, PG16 service, 1m28s) PASS on merge — includes all unit suites.
  - api: **647/647** (incl. 11 new duration unit tests: configureDurations 403/409-running/409-paused/200-idle+emit/no-row-upsert; row-aware phaseDurationMs/computeCurrentPhase custom-10/2 walk = the karen-2 correctness core; startTimer uses configured work; rowToDto duration fields).
  - web: **417/417** (incl. 20 duration-config tests: render configured durations, range validation, Apply optimistic, locked-while-running, 409-reset-hint desktop+slim, 400 inline error, aria-label/aria-invalid/describedby, F-1 borderLeft-not-inline assertion, slim toggle button + Escape).
- **Coverage audit:** every new surface (configureDurations, the threaded walk, controller route, widget affordance states, F-1) has ≥1 unit test. karen-2 (the restart-corrupts-with-25/5 vector) covered by the custom-duration computeCurrentPhase walk test.
- **Flakes:** none new. turbo pnpm-recursive combined-run startup crash remains the documented local flake (CI per-package authoritative).

```yaml
test_pattern: ci-verified
skipped: false
evidence: ["C-1 test job PASS (PG16) — 647 api + 417 web"]
modules_audited: [study-timer.service, study-timer.controller, StudyTimerWidget/DurationConfigForm]
new_flakes: []
findings: []
```
