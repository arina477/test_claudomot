# Wave 31 — V-2 Triage
Inputs: T (1 MEDIUM pre-existing + 3 LOW) + V-1 (karen 0 blocking, jenny 1 spec-gap). 0 blocking.
| id | bucket | routing | rationale |
|---|---|---|---|
| F31-404-403 (jenny spec-gap) | fix in-wave (V-3) | spec reconciliation | 404→403 is security-correct (uniform default-deny, enumeration-safe). Spec AC amended at V-3 (DB row d8a85de0). Dead 404 doc/branch (controller JSDoc, useVoiceToken.ts:126-128, fictional controller-spec 404 test) → L-1 cleanup (LOW, harmless-unreachable). |
| F-31-T-1 (malformed-UUID→500) | non-blocking → existing task | bug-security | MEDIUM but PRE-EXISTING/wave-wide (same on messages.controller:74); tracked task 4a92327c (ParseUUIDPipe project-wide). No new task; V-2 references it. NOT a hard-stop. |
| F-31-T-4 (web testId-over-role + weak anti-pattern assertion) | noise | L-2 candidate | test-discipline; grep independently proves the guard. |
```yaml
findings_input_count: 3
findings_blocking: []
findings_non_blocking: []      # F-31-T-1 → existing 4a92327c (not re-filed)
findings_noise: [F-31-T-4]
fast_fix_queue: [F31-404-403]  # spec-doc reconciliation (0 code LOC)
carry_to_L1: ["404→403 spec reconciled (V-3); clean dead 404 JSDoc/branch/fictional-test (LOW)", "correct product-decisions:387 stale creds-provisioned line (from P-4)"]
carry_to_N: ["M6 stays in_progress (first slice; metric not met — future waves)"]
```
