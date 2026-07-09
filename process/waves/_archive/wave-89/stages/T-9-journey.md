# Wave 89 — T-9 Journey (gate)
## Phase 1 — head-tester: APPROVED
Ruled the T-5 component-test-authoritative disposition ADEQUATE — client-side focus+aria on an existing field is jsdom/Testing-Library-authoritative; no IntersectionObserver/scroll-snap/layout-dependent focus; 8 component tests carry a verified load-bearing revert-check (real tripwire); deployed web renders 200. Full live E2E disproportionate. All skips (T-3/T-4/T-6/T-7/T-8) legitimate against B-scope; findings are pre-existing unrelated flakes (non-blocking). Verdict at blocks/T/gate-verdict.md.
## Phase 2 — journey
- Regen SKIP (ui wave but annotation-only — no new route/screen; existing /settings/profile form gains focus-management).
- Targeted annotation (P-4 jenny carry-forward): journey /settings/profile entry annotated with the wave-89 focus-management addition (enabled Save button + scroll+focus first invalid academic field + aria-invalid; closes wave-81 F5).
- No user-scenarios/ dir. No cross-wave regression (only the failed-academic-save path gains feedback; valid save unchanged).
```yaml
phase1_head_tester_verdict: APPROVED
journey_regen_skipped: true
journey_regen_skip_reason: "ui wave but annotation-only (no new route/screen); existing form gains focus-management"
journey_map_commit: f37dd3bba2584c2731faec35a3a9983aea7b6a51
findings: [{severity: none, journey: "profile settings — academic save", description: "focus-on-error added; annotation-only; no regression"}]
```
