# T-7 — Perf (wave-15 M3 @mentions) — SKIPPED

**Pattern:** B — Active-execution. **SKIPPED per dispatcher skip rule:** T-7 fires only on `wave_type: heavy` or when a perf budget is at risk. wave-15 is `ui + backend + auth`, NOT `heavy`. The diff is additive (one association table, parse/resolve/persist reusing the existing messaging path, a composer popover, pills, a badge store) — no large bundle delta, no new heavy dependency, no perf-sensitive hot path introduced.

```yaml
test_pattern: active
skipped: true
skip_reason: "wave_type is ui+backend+auth, not heavy; additive diff with no perf-sensitive surface. Per T dispatcher skip rule for T-7."
findings: []
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: T-7
  reviewers: {}
  failed_checks: []
  rationale: "T-7 correctly skipped — wave is not heavy and introduces no perf-sensitive surface. Skip recorded per dispatcher rule."
  next_action: PROCEED_TO_T-8
```
