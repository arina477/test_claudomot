# Wave 32 — T-7 Perf — SKIPPED
wave_type does not include `heavy`. Wave is ~400 LOC (one read-only GET endpoint + one bounded-poll indicator); no perf-sensitive path, no bundle-size concern beyond the small indicator component. Skip per T-block skip matrix.
```yaml
test_pattern: n/a
skipped: true
skip_reason: "not a heavy wave; read-only endpoint + small indicator; no perf budget at risk"
```
