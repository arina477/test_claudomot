# Wave 26 — T-7 Perf — SKIPPED
wave_type not `heavy`. Frontend-only; the change is a small presentational dot + a per-author store subscription. No new dep, no new endpoint, no hot query. Bundle delta trivial (PresenceDot ~65 LOC).
**Watch item (from B-6 /review P2, NOT blocking):** the per-row presence subscription is O(rows × events) callback work (member panel uses a single lifted subscription); a future perf lift is tracked. Not a blocker at ~0 users / current channel sizes. → V-2 non-blocking / future perf task.
```yaml
test_pattern: active
skipped: true
skip_reason: "not heavy; presentational dot + per-author subscription; no new dep/endpoint. Per-row subscription = documented future perf-lift watch item (B-6 P2)."
findings: []
```
