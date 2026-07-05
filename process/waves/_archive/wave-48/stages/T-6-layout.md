# T-6 — Layout (wave-48) — SKIP

**Skip rule (dispatcher):** T-6 skips on non-UI waves (wave_type != ui).

## Rationale
wave_type = single-spec (backend, test-only). Zero UI/component/CSS change. No dark-theme visual baseline to diff. Nothing to layout-test.

```yaml
test_pattern: skip
skipped: true
skip_reason: "non-UI wave; zero component/CSS change"
findings: []
```

```yaml
head_signoff: {verdict: APPROVED, stage: T-6, failed_checks: [], rationale: "Legitimate skip — no UI change.", next_action: PROCEED_TO_T-7}
```
