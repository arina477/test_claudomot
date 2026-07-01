# Wave 26 — T-9 Journey (Test block-exit gate)

## Phase 1 — head-tester gate verdict
Fresh head-tester (agentId ac398bb6ef19438fb). Verdict: **APPROVED** (Attempt 1). Read every deliverable independently + the deployed self-presence source + the regression test + md5-hashed the evidence. Called the T-5 catch-and-fix "a model case": live E2E surfaced a user-observable bug (no author-avatar dots on prod) that the T-2 unit suite actively MASKED (mocked the presence store with the author key present — the mock-the-system-under-test failure the live layer exists to catch); root-caused precisely (self-exclusion, not key-mismatch); fixed at the identity boundary (ProfileResponse.userId + seedSelfPresence); re-verified live ×2 with real DOM evidence (emerald `presence-dot-inner` + "Online" on the fixture's own message, different row counts per run = two real posts); the regression test reproduces the exact prod condition. Caveat noted (re-verify PNGs byte-identical — corroborating, DOM is the load-bearing proof; fail-cycle hash distinct from fixed-cycle, confirming a real re-capture). All skips legit. Verdict file: `process/waves/wave-26/blocks/T/gate-verdict.md`.

## Phase 2 — Journey (annotation-only)
wave_type=[ui], B-3 ran → regen required, but the wave adds **no new route/screen** (dots attach to existing message-row + member-panel avatars). Handled as annotation-only (wave-16/17/23/25 pattern):
- **Action 3 crawl:** T-5 crawled the messaging journey live (login → server → channel → post → author-dot render) ×2, both passes. No new journey.
- **Action 4 regen:** appended `last_updated_wave26` to `user-journey-map.md` — author-avatar presence dots live, shared PresenceDot primitive, self-presence fix (PR #39), a11y fix, deploys. No route added/removed.
- **Action 6 regression:** T-5 confirmed the messaging journey works live + member panel + a11y unregressed. The mention rendering (wave-25) + all prior surfaces untouched.

## Findings → V-2
- Per-row presence subscription = future perf lift (B-6 P2, non-blocking).
- Playwright MCP chrome-absent (67881a58, recurring — bundled-chromium substitute per T-5 rule 1).
No open critical/high (the T-5 critical was resolved in fix-up cycle 1, re-verified live).

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: false          # annotation-only
crawl_routes_visited: 1               # messaging journey (T-5 live)
regen_diff: {routes_added: [], routes_removed: [], coverage_gaps: ["per-row presence subscription perf (V-2); Playwright MCP chrome-absent (67881a58)"]}
scenarios_run: 0                      # no user-scenarios/ dir
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: <this-commit>
findings:
  - {severity: MEDIUM, journey: messaging-author-presence, description: "per-row presence subscription O(rows×events) — future perf lift (B-6 P2)"}
  - {severity: LOW, journey: e2e-tooling, description: "Playwright MCP chrome-absent; bundled-chromium substitute (67881a58)"}
```

## Block-exit handoff
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-5, T-6, T-9]
stages_skipped:       [T-3 (no contract), T-4 (no schema/service), T-7 (not heavy), T-8 (non-auth)]
findings_total:       2
findings_critical:    0               # T-5 critical resolved fix-up cycle 1
findings_aggregate:   process/waves/wave-26/blocks/T/findings-aggregate.md
ready_for_verify:     true
```

## Exit
Phase 1 APPROVED, all 5 ACs verified live (after T-5 fix-up cycle 1), journey annotated, 0 open critical/high. → V block.
