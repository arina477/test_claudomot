# Wave 81 — T-7 Perf — SKIPPED

**Skip reason:** Not a heavy wave (`wave_type: ui`, not `heavy`); no perf budget at risk. The change adds ONE wrapper `<div class="h-dvh overflow-y-auto">` per full-page route — a single non-transformed, non-composited element. No new JS execution path, no bundle-size delta of concern (wrapper is ~35 lines), no layout-thrash risk (native overflow scroll). Nothing for a perf layer to measure.

```yaml
test_pattern: active
skipped: true
skip_reason: "wave_type ui not heavy; single overflow wrapper, no perf surface"
findings: []
```
