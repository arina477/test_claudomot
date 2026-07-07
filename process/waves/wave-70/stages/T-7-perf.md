# T-7 — Perf (wave-70) [SKIPPED]
Skipped: not a heavy wave. The block-queue reads are index-backed (user_blocks_blocker_idx); isBlockedBetween is a single limit-1 query; the DM HIDE seams add bounded block checks. No perf-sensitive surface at risk.
```yaml
test_pattern: active
skipped: true
skip_reason: "not heavy; index-backed block reads; bounded per-seam checks"
```
