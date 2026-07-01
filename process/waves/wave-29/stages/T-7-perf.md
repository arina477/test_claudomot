# Wave 29 — T-7 Perf (SKIPPED)

**Skip reason:** Not a heavy wave. The diff is two single-token operator swaps (`??`→`||`) in an already-executing fallback expression + deletion of an unused schema. No new query, no new hot path, no bundle-size delta (shared package shrinks by a dead export). No perf budget at risk.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "Not heavy; 2 operator swaps + a dead-code deletion, no perf-sensitive path or bundle growth."
findings: []
```
