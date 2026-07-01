# Wave 27 — T-9 Journey (Test block-exit gate)

## Phase 1 — head-tester gate verdict
Fresh head-tester (agentId a37fb3f902d1dbc96). Verdict: **APPROVED** (Attempt 1). Verified perf proofs GENUINE at source: T-4 EXPLAIN honest (real EXPLAIN via dedicated-connection BEGIN→SET LOCAL enable_seqscan=off→EXPLAIN→ROLLBACK; asserts Index Scan + index-name + NOT Seq Scan; mutation-sane [drop 0012 → fails]; genuinely EXECUTES in CI — ci.yml provisions postgres:16 + DATABASE_URL_TEST so skipIf=false; PR#40 7/7 green). T-5 real live regression (fixture's own message-row presence-dot-inner rgb(16,185,129) + Online label on bundle index-Dr2UkTXH.js; member panel per-user state; a11y suppressed:0; ×3 zero flake). T-7 adequate (query-plan + subscription-count + CARRY-B ARE the perf proof at ~0 users; a load test would be theater). Skips legit (T-3 no contract, T-8 non-auth secret-scan clean). Verdict file: `blocks/T/gate-verdict.md`.

## Phase 2 — Journey (annotation-only)
Behavior-preserving perf pair — NO route/screen/endpoint change, dots render identically (T-5 confirmed). Appended `last_updated_wave27` annotation to user-journey-map.md (index + subscription lift, behavior-preserving, no journey delta). No crawl-regen needed (per T-9 Action 2 — no user-visible change; B-3 touched frontend but zero observable delta). T-5 confirmed the messaging/presence journey works live post-deploy.

## Findings → V-2
- presence-dots.test comment misnames the memo mechanism (cosmetic, B-6 P3 accepted).
- Playwright MCP chrome-absent (67881a58, recurring — bundled-chromium substitute).
No open critical/high.

```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: true            # behavior-preserving perf; no route/screen/endpoint change
journey_regen_skip_reason: "perf-only pair, dots render identically (T-5 live), no user-visible/route delta; annotation appended"
crawl_routes_visited: 1                 # messaging/presence journey (T-5 live regression)
regen_diff: {routes_added: [], routes_removed: [], coverage_gaps: []}
scenarios_run: 0
regressions_critical: 0
regressions_significant: 0
findings:
  - {severity: LOW, journey: presence-perf, description: "presence-dots.test comment misnames memo mechanism (cosmetic)"}
```

## Block-exit handoff
```yaml
test_block_status:    complete
stages_run:           [T-1, T-2, T-4, T-5, T-6, T-7, T-9]
stages_skipped:       [T-3 (no contract), T-8 (non-auth)]
findings_total:       1
findings_critical:    0
findings_aggregate:   process/waves/wave-27/blocks/T/findings-aggregate.md
ready_for_verify:     true
```

## Exit
Phase 1 APPROVED, perf proofs genuine, behavior-preserving confirmed live, journey annotated, 0 open critical/high. → V block.
