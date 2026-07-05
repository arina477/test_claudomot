# T-3 — Contract (wave-50)

**Pattern:** A (CI-verified). Project-internal Zod/shared-type contracts; no external SDK.

- **Contract surface (B-1):** StudyTimerSchema += `workDurationMs`/`breakDurationMs`; new `StudyTimerConfigSchema {workMinutes 1-120, breakMinutes 1-60}` + `StudyTimerConfig`; barrel-exported.
- **CI evidence:** typecheck (tsc project-refs) + test PASS on merge — enforce the shared-type shape on BOTH sides (service rowToDto emits the 2 fields; widget consumes the typed DTO + minutes↔ms conversion). Single-source Zod → no hand-duplicated interface to drift; tsc would fail on mismatch, it passed.
- **Coverage:** new fields covered (widget renders configured durations; service rowToDto test; config body validated via StudyTimerConfigSchema.safeParse → 400). Negative cases: out-of-range minutes rejected (Zod min/max).
- **Boundary-drift check:** config PATCH request (minutes) ↔ server (ms) conversion is the one transform boundary — server does `workMinutes*60000`, widget does `workDurationMs/60000`; both covered by tests.

```yaml
test_pattern: ci-verified
skipped: false
contracts_audited: [StudyTimerSchema(+2), StudyTimerConfigSchema]
ci_evidence: ["C-1 typecheck PASS (shared-type shape both sides)", "C-1 test PASS (emit+consume round-trip)"]
infrastructure_gap_recorded: false
findings: []
```
