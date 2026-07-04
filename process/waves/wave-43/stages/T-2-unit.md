# Wave 43 — T-2 Unit (ci-verified)
- **C-1 evidence:** CI run 28692639154 test job green — api 551 + web 354 unit pass on merge.
- **Coverage GAP (T2-F1, LOW):** the new scheduling SERVICE methods (create/update/softDelete/get/listForServer + recurrence expansion) have no dedicated UNIT tests — authz/validation/recurrence covered at T-4 (real-PG integration, to author) + T-8 (live security). Recurrence-expansion logic (7-day cursor, window cap) would especially benefit from unit coverage; non-blocking (behavior covered downstream).
```yaml
mask_mode_signoff: PASS
test_pattern: ci-verified
evidence: ["C-1 test job run 28692639154 green (api 551 + web 354)"]
findings:
  - {severity: low, location: "apps/api/src/scheduling/scheduling.service.ts", description: "no dedicated unit tests for new scheduling service methods (esp. recurrence expansion); covered at T-4/T-8"}
ts_bypasses_in_wave_diff: 0
```
