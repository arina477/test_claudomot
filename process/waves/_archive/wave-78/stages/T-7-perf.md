# T-7 — Perf (wave-78)

**SKIPPED.**

## Skip reasoning
Per T-7 skip condition: skip unless `wave_type` includes `heavy` OR the diff touches a known perf-sensitive area. This wave is neither:
- `wave_type` = ui + backend + auth(privacy) — no `heavy`.
- Diff is ~90 production LOC across 4 files: a nullable Zod branch (`profile.ts`), a 3-way service write gate (`users.service.ts`), a client-side fetch-state branch + one added card state (`MemberProfileCard.tsx`), and a payload tweak (`ProfilePage.tsx`). No new dependency, no new route, no critical-render-path change, no new hot DB query (no migration; `academic_role` already nullable text), no bundle-bloat surface.
- The card's error state adds a small conditional render branch + one `<button>`; no measurable bundle or render-path impact.

No perf budget at risk. No bundle diff, vitals, or latency probe warranted.

```yaml
test_pattern: active
skipped: true
skip_reason: "Light read-only wave (nullable write + client-side card state); wave_type has no 'heavy'; no perf-sensitive surface, no new dep, no new route, no migration."
bundle_delta: {}
vitals: []
api_latency: []
heavy_wave_probes: null
fix_up_cycles: 0
findings: []
```
