# V-1 — Summary (wave-57)
Karen + jenny parallel vs live/CI (1361c49). Both APPROVE, 0 findings.
- Karen: 5/5 claims true — AppShell onExitDmHome (:59), ServerRail server-select unconditional (:240-243) + Home wired (:125, was no-op), 4 tests green on CI, frontend-only, journey-map F-1 FIXED. Forward-prevention idea: lint for handler-less interactive rail buttons (L-2 candidate).
- jenny: all ACs met — CI sha byte-identical to live 1361c49; real-component tests (SUT not mocked), mutation-verified; no drift; minimal fix (no nav refactor); journey-map F-1 accurate.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE
findings: []
