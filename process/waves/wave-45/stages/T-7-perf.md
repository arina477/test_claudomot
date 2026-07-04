# T-7 — Perf (wave-45) — SKIPPED

**Block:** T (Test) · **Stage:** T-7 · **Mode:** automatic
**Wave:** 45 — M8 tech-debt HYGIENE

## Skip decision
SKIP per dispatcher skip rule "not a heavy wave and no perf-sensitive diff".

Evidence:
- wave_type does NOT include `heavy`.
- Diff touches: playwright.config.ts (test-infra, not shipped bundle), package.json (e2e scripts only), useTyping.ts (6 non-null assertions → element-type casts, compiles to IDENTICAL JS — zero runtime/bundle delta).
- No new dependency (C-1: "no deps"), no new route, no render-path change, no DB query change. The biome change is provably bundle-neutral (same emitted JS).

No perf-sensitive surface → skip. wave_type = infra + minor-ui.

## Footer
```yaml
test_pattern: skipped
skipped: true
skip_reason: "Not heavy; no perf-sensitive diff. Biome cast change compiles to identical JS (zero bundle/runtime delta); playwright.config is test-infra not shipped bundle; no new deps/routes/queries."
wave_type: [infra, ui]
bundle_delta: {per_route: [], per_package: []}
vitals: []
api_latency: []
heavy_wave_probes: null
findings: []
```

head_signoff:
  verdict: APPROVED
  stage: T-7
  reviewers: {}
  failed_checks: []
  rationale: "Clean skip — non-heavy wave; biome change emits identical JS (bundle-neutral), test-infra config is not shipped, no new deps/routes/hot queries."
  next_action: PROCEED_TO_T-8
