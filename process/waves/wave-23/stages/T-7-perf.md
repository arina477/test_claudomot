# Wave 23 — T-7 Perf

**Pattern:** B (active, light). wave_type does NOT include `heavy`. Per the skip rule (skip unless heavy) the full Lighthouse/bundle-analyze suite is not warranted; but the wave added one public read endpoint, so the proportionate light probe (Action 3 latency + bundle-dep check) was run.

## Bundle (Action 1)
`git diff main~1..main -- package.json apps/*/package.json pnpm-lock.yaml` → **zero new dependencies**. Bundle unchanged. The web delta is a boolean CTA gate + one PERM_FLAGS entry (no new imports, no new code paths of size). No per-route or per-package bundle delta.

## Request-path latency (Action 3) — new endpoint GET /servers/:serverId/me/permissions
Probed live prod (unauth path — exercises route + session guard), 10 samples:
- **mean 0.120s, max 0.131s** (round-trip incl. TLS + network from this host).
- The endpoint is a 2-select indexed read (server owner lookup + membership/role lookup) — well within the p95 < 500ms read-endpoint SLO. No latency cliff.

## Core Web Vitals (Action 2)
Not run — no render-path change (the CTA gate is a show/hide on an existing button; the role-editor gains one checkbox row in an existing list). No new route, no LCP/CLS-affecting surface. Live Lighthouse also shares the chrome-absent harness gap (F23-T-5); given zero render-path delta, skipped as non-applicable.

## Heavy-wave probes (Action 4)
N/A — not a heavy wave.

## Findings
None. Bundle unchanged (no dep), new endpoint fast (mean 0.12s, indexed 2-select), no render-path regression.

```yaml
test_pattern: active
skipped: false   # light probe ran (not a full skip)
bundle_delta: {per_route: [], per_package: [], new_deps: 0}
vitals: []       # no render-path change; not applicable
api_latency: [{endpoint: "GET /servers/:serverId/me/permissions", p50: "~0.12s", p95: "~0.13s", note: "unauth-path 10-sample; 2-select indexed read; within read SLO"}]
heavy_wave_probes: null
fix_up_cycles: 0
findings: []
```

## Exit
No perf regression (bundle unchanged, new endpoint within SLO, no render-path change). → T-8 Security.
