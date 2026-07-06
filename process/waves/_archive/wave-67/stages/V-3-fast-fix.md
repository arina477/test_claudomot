# V-3 Fast-fix — wave-67 (M11 server discovery)

**Phase 1 (gate):** head-verifier fresh spawn → verdict APPROVED (see blocks/V/gate-verdict.md).
**Phase 2 (fast-fix queue):** SKIPPED — queue emptied by disposition (F67-T5-1 deferred).

## Phase 1 — gate verdict: APPROVED
- Both V-1 reviewers APPROVE with load-bearing evidence (Karen DB-cross-checked memberCount:0 as a WRONG claim; jenny live-probed 401/403/200 + traced the drift). Not acceptance-by-assertion.
- T-8 LIVE-confirmed the is_public gate (403 ×2, no backdoor); T-5 proved browse+join E2E non-echo on a real DB.
- V-2 triage correct: F67-T5-1 = confirmed spec-drift/WRONG-claim; F67-T5-2 = pre-existing joinViaInvite parity, correctly non-blocking.

## Disposition call — F67-T5-1 memberCount:0 → DEFER
Ruled DEFER (not in-wave fast-fix). It is a real confirmed correctness bug but has ZERO current user impact — the prod directory is organically empty until the publish path `2bd37c4c` (the immediate next M11 bundle) ships, so no user renders a discover card and no one sees memberCount until then. Fixing now costs a full api re-deploy cycle for a value zero users can currently see; deferring's forgotten-risk is removed by co-locating the fix in `2bd37c4c` (where the live-DB test — the coverage gap that let it ship green — can be written against the real populated path, and memberCount-correct becomes a hard AC). Not suppression: nothing weakened, finding owned and escalated into the next bundle's acceptance criteria. Full rationale in blocks/V/gate-verdict.md.

**Effect:** F67-T5-1 re-classified from fast-fix queue → non-blocking follow-up. Fast-fix queue EMPTY → Phase 2 skipped → V-block exits clean.

## Orchestrator follow-through (post-gate)
1. Fold memberCount query fix into `2bd37c4c` publish-path bundle spec (preferred) OR author a dedicated follow-up task with `wave_id = NULL` (else it strands, per known N-2-seed failure).
2. The fix MUST ship with a live-DB test exercising the real correlated subquery (not mocked memberCount) — L-2 observation candidate.
3. F67-T5-2 (role_id:NULL) stays on task dc4abee3 — already correctly routed.

```yaml
phase1_head_verifier_verdict: APPROVED
skipped: true                         # Phase 2 skipped — queue emptied by disposition
queue_items_processed: 1              # F67-T5-1 dispositioned
queue_items_fixed: 0
queue_items_moved_to_b_re_entry: []
queue_items_deferred_to_followup: [F67-T5-1]
fast_fix_rounds: 0
loc_per_fix: []
re_verification:
  karen: n/a                          # no fast-fix ran
  jenny: n/a
cap_escalation: false
escalation_destination: none
disposition:
  F67-T5-1: DEFER                     # non-blocking follow-up; fold into 2bd37c4c or standalone (wave_id NULL)
  F67-T5-2: non-blocking-followup     # task dc4abee3 (pre-existing joinViaInvite parity)
```
