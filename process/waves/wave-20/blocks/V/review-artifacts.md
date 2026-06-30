# Wave 20 — V-block review artifacts
**Block:** V (Verify) | **Wave topic:** M4 offline-first spine (Dexie outbox + exactly-once/in-order + forward cursor) — MERGED (PR#32 bff9f12), LIVE | **Gate:** V-3 | **Status:** gate-passed
## Stage deliverables
| Stage | Deliverable | Status |
|---|---|---|
| V-1 | stages/V-1-{karen,jenny,summary}.md | complete |
| V-2 | stages/V-2-triage.md | complete |
| V-3 | blocks/V/gate-verdict.md + stages/V-3-fast-fix.md | complete |
## Context
- 4 claimed: 92d85e0e (forward-cursor+idempotency-lock), 7332a4b8 (Dexie store), 9a4ab31d (outbox/offline-composer), e29f6566 (test harness). LIVE: api d26fe078 + web 2aac8438. NO migration.
- T-block APPROVED; T-4 ratified the exactly-once+in-order WEDGE; T-8 ratified rule-4; 0 critical.
- T findings → V-2: M1 (POST-succeeds-delete-fails window), M3 (catch-up one-page no-loop), L1-L4, 9 biome warnings, 6 re-homed M3 tech-debt (M4 backlog), Playwright chrome-absent.
## Gate verdict log
- V-3 Phase 1: head-verifier (fresh spawn) → APPROVED with non-empty fast-fix queue [cursor-format-drift]. See blocks/V/gate-verdict.md.
- V-3 Phase 2: fast-fix cursor-format-drift (9 LOC, commit f521f15) → re-verify Karen APPROVE + jenny APPROVE → loop converged 1/3 rounds.

```yaml
verify_block_status:    complete
karen_verdict:          APPROVE
jenny_verdict:          APPROVE
triaged_findings:
  blocking_resolved:    [cursor-format-drift]
  non_blocking_task_ids: []   # M1/M3/L1-L4/biome warnings/re-homed M3 debt accepted at V-2 (no new tasks INSERTed this gate)
  noise_suppressed:     0
fast_fix_cycles:        1
ready_for_learn:        true
```

## Block exit handoff
```yaml
verify_block_status: complete
karen_verdict: APPROVE
jenny_verdict: APPROVE (after cursor-format fast-fix)
fast_fix_cycles: 1   # cursor-format-drift fixed (f521f15, 9 LOC, encodeForwardCursor); Karen+jenny re-APPROVE
ready_for_learn: true
verify_principles_candidates: process/waves/wave-20/blocks/V/verify-principles-candidates-for-L2.md  # → L-2/karen (V-3 re-added to principles file → REVERTED by orchestrator, obs-4 6th instance)
m4_wave1_complete: true
```
