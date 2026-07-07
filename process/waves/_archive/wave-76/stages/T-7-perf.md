# Wave 76 — T-7 Perf

**SKIPPED.** Reason: not a heavy wave. The wave surface is (a) read-only aggregate count/group-by queries over already-shipped, indexed tables (servers/roles/memberships/messages/assignments/submissions/scheduled_sessions), executed via 6 parallel `Promise.all` count queries, and (b) a single settings-panel React component consuming one analytics fetch. No large diff, no perf-sensitive path, no perf budget at risk. Live /analytics responses returned promptly during T-3/T-4/T-5 probing with no observable latency concern. Aggregate queries are bounded by server-scoped row counts; if a server grows very large, the count() queries remain index-friendly. Perf revisit deferred to a future heavy wave.

```yaml
test_pattern: active
skipped: true
skip_reason: "read-only aggregates + settings panel; not heavy, no perf budget at risk"
findings: []
```
