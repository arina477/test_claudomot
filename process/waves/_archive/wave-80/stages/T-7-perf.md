# T-7 — Perf (wave-80) — SKIPPED

**Skip decision:** wave_type does NOT include `heavy`. Single-spec presence-toggle wave: 1 boolean column (migration 0033, additive DEFAULT true, no backfill), one already-existing endpoint gains one optional field, one toggle control added to an existing page, and a proactive emit reusing the existing in-memory presence ref-count + room fan-out (no new query loop, no new render path of consequence). Diff does not touch a bundle-bloat-prone route, a hot DB query, or the critical render path in a perf-sensitive way. No new dependency. Per T-7 skip rule (skip unless heavy or perf-sensitive area) → SKIP.

Note: the proactive emit adds one `getShowPresenceBatch` co-member lookup on snapshot (indexed `server_members(user_id)` per wave-27 migration 0012) + a best-effort emit on toggle — negligible, not on any hot path.

```yaml
test_pattern: active
skipped: true
skip_reason: "wave_type has no 'heavy'; additive boolean + reused presence fan-out; no perf-sensitive surface, no new dep, no critical-render-path change."
bundle_delta: {}
vitals: []
api_latency: []
fix_up_cycles: 0
findings: []
```
