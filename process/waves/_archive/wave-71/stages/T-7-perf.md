# T-7 — Perf (wave-71) [SKIPPED]
Skipped: not heavy. listBlocks LEFT JOIN is a single indexed query (blocker_id index + users PK, at-most-one user row per block — /review confirmed no fan-out); useBlocks is one shared fetch (not N+1). No perf-sensitive surface.
```yaml
test_pattern: active
skipped: true
skip_reason: "not heavy; single indexed JOIN, one shared fetch, no N+1"
```
