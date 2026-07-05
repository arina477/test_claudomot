# T-7 — Perf (wave-48) — SKIP

**Skip rule (dispatcher):** T-7 skips unless heavy wave / perf budget at risk.

## Rationale
wave_type = single-spec, not heavy. ~169 LOC of test-only code, no production runtime path, no new query on the hot path (the SUT query is unchanged — pre-existing), no bundle-size impact (test files are not shipped). No perf budget at risk.

```yaml
test_pattern: skip
skipped: true
skip_reason: "test-only wave, not heavy; no production runtime/bundle impact; SUT query unchanged"
findings: []
```

```yaml
head_signoff: {verdict: APPROVED, stage: T-7, failed_checks: [], rationale: "Legitimate skip — test-only, no perf-sensitive surface.", next_action: PROCEED_TO_T-8}
```
