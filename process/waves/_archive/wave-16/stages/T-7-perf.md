# T-7 — Perf (wave-16) — SKIP

**Skip reason:** not a heavy wave; no perf surface. No bundle change, no new route, no runtime-path change — the
wave adds test-only files. Per dispatcher skip rule (T-7 skips unless heavy/perf-at-risk), T-7 does not fire.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "no perf surface; wave_type not heavy; test-only diff, no bundle/runtime change"
findings: []
head_signoff: { verdict: APPROVED, stage: T-7, rationale: "Honest skip — no production bundle or runtime path touched." }
```
