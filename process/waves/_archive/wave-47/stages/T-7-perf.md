# Wave 47 — T-7 Perf (SKIPPED)

**Block:** T · **Stage:** T-7 · **Mode:** automatic

## Skip decision: SKIP
- wave_type does NOT include `heavy`.
- Diff is a small read-only endpoint (GET /dm/candidates — single JOIN chain server_members⋈users, DISTINCT ON, no new dependency) + a data-source rename on an existing modal component. No render-path bloat, no new bundle dependency, no new hot/uncapped write query.
- Per block dispatcher skip rule (T-7 skips unless heavy wave or perf budget at risk) → skip.

## Honest note carried to findings (info, non-blocking)
getDmCandidates has no LIMIT/pagination — returns ALL co-members across all the caller's servers. At StudyHall self-use-MVP scale (small study servers) this is fine; a future scaling wave (large-server directories) should add a bound + typeahead. Not a wave-47 perf regression.

```yaml
test_pattern: skipped
skipped: true
skip_reason: "wave_type not heavy; small read-only single-endpoint read + data-source rename; no render-path/bundle/hot-query surface."
findings:
  - {severity: info, layer: T-7, location: "getDmCandidates", description: "no LIMIT/pagination on candidate list; fine at MVP scale, flag for future large-server scaling wave (add bound + typeahead)."}
```
