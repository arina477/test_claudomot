# Wave 28 — T-9 Journey (block-exit gate)

## Phase 1 — head-tester gate (Action 0)
Fresh head-tester spawn (agentId arina-89ejyn-t9-gate) → **APPROVED**. Verdict at `process/waves/wave-28/blocks/T/gate-verdict.md`. Rationale confirmed: every non-skipped layer proves a security-observable outcome with concrete non-fabricated evidence; T-4 CI-rule-5 nonzero-execution verified (per-case CI durations); T-8 live non-owner-403 is a genuine load-bearing authz probe (not just the 401 unauth boundary); skips honestly justified; 2 LOW findings → V-2, no critical/high.

## Phase 2 — Journey-regen skip evaluation (Action 2)
**Regen crawl SKIPPED** — annotation-only. All three skip conditions hold:
- wave_type does NOT include ui/heavy (single-spec backend).
- D-block did NOT fire (design_gap_flag=false; no design/<feature>.html canonicalized).
- B-3 Frontend SKIPPED; no frontend files touched (backend-only diff).

Per Action 2, the prior canonical journey map remains authoritative for UI; the new backend endpoint is recorded via annotation (the established wave-16→27 annotation-only pattern). The journey map WAS updated:
- Frontmatter `last_updated_wave28` annotation added (rotate endpoint, live T-8 matrix, closes wave-9 gap).
- Wave-9 "permanent invite_code irrevocable" deferral line struck-through + marked CLOSED wave-28.
- New `## Deployment status — wave-28` section with the rotate-endpoint surface row + access-control note.

## Scenario smoke (Action 4/5)
`user-scenarios/` ABSENT — no scenario fixtures to run. Recorded.

## Cross-wave regression check
No UI crawl (skip per Action 2). The rotate flow ADDS a capability (invalidate leaked link) with no removal/regression of existing invite surfaces — old-link invalidation is the intended new behavior (spec AC2), not a regression. Existing invites/join/revoke surfaces structurally unchanged.

## Findings (all → V-2 via findings-aggregate.md)
- F28-T8a LOW: spec AC1 "200" vs live 201 (NestJS @Post default; body correct).
- F28-T8b LOW: 403-vs-404 existence oracle (B-6 accepted-debt, spec-conformant AC4).

## Deliverable
```yaml
phase1_head_tester_verdict: APPROVED
test_pattern: active
skipped: false
journey_regen_skipped: true
journey_regen_skip_reason: "backend-only wave — wave_type not ui/heavy, D-block did not fire, B-3 skipped, no frontend diff. Annotation-only per wave-16→27 pattern."
crawl_routes_visited: 0
regen_diff:
  routes_added: []                     # no new page route (backend endpoint only)
  routes_removed: []
  coverage_gaps: []
scenarios_run: 0                        # user-scenarios/ absent
scenarios_failed: 0
regressions_critical: 0
regressions_significant: 0
journey_map_commit: 3df0e6a
findings:
  - {severity: LOW, journey: invite-rotate, description: "F28-T8a spec 200 vs live 201"}
  - {severity: LOW, journey: invite-rotate, description: "F28-T8b 403-vs-404 existence oracle (accepted-debt)"}
```
