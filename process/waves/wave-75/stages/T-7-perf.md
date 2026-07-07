# Wave 75 — T-7 Perf

**SKIPPED.**

## Skip rationale
Per T-7 skip condition: fires only when `wave_type` includes `heavy` OR the diff touches a known perf-sensitive area. Neither holds:
- wave_type = backend + ui + auth(payments) — NOT `heavy`.
- Diff is ~1934 LOC of which the majority is tests + wave docs; production surface is: one billing controller (2 endpoints), one educator-tools controller (1 endpoint), a mock provider doing a single `subscriptions` upsert behind an owner-check, a canonical caps constant swap, and one React panel.
- No new dependency (Stripe fenced). No new render-critical-path code, no hot DB query, no bundle-bloat-prone route. The panel is a thin surface mounted in an existing settings overlay; the endpoints are a single-row upsert (behind UNIQUE(server_id)) + two reads.
- Live latency observed anecdotally during T-3/T-5/T-8 probes was sub-second on all billing endpoints (no formal Lighthouse/hyperfine run needed for a diff this small and non-render-path).

No perf budget at risk. Recording skip per T-7 exit criteria.

```yaml
test_pattern: active
skipped: true
skip_reason: "wave_type not heavy; small diff (~1934 LOC mostly tests+docs); production surface = single-row upsert behind owner-check + 2 reads + thin panel; no new deps, no render-critical-path, no hot query. No perf budget at risk."
bundle_delta: null
vitals: []
api_latency: []
heavy_wave_probes: null
fix_up_cycles: 0
findings: []
```
