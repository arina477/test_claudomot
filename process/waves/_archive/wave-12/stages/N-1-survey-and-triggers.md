# N-1 — Survey & triggers (wave-12)

Survey of canonical DB state and trigger evaluation closing wave-12. Mode: `automatic`.

## Survey phase (Actions 1–4)

**Action 1 — Active milestone:** M3 — Real-time messaging (`6198650e-f4e0-44dc-9b0a-6550f01f9f82`), `status='in_progress'`. Exactly one `in_progress` row (invariant holds).

**Action 2 — `todo` queue:** 10 rows. Head (by created_at) = M4 — Offline-first reliability (`eb2a1688-c6b5-416c-84b4-3ede41d07b4c`). Not consulted for promotion this tick (active slot occupied by M3).

**Action 3 — M3 child-task summary:** `open_count=3`, `done_count=4`, `seed_candidates=3`.
- The 3 `done` wave-12 tasks (a0c322b4 seed, 723b5b6a, d999d29c) + 1 prior wave-11 fixture task = 4 done.
- The 3 `seed_candidates` are carried tech-debt (46f16288 browser-E2E, 25523fb0 PG-rollback, d058283d invite-rotation) — NOT messaging-feature seeds. Parked as future seeds per wave-12 carry-forward note.

**Action 4 — Unassigned queue depth:** 0 (`milestone_id IS NULL AND status='todo'`). No daily-checkpoint trigger.

## Trigger phase (Actions 6–10)

**Action 6 — Closure check:** NOT fired. `open_count != 0` (3 open) AND LLM judges M3 `## Scope` NOT shipped — only the core text data plane (send/receive/realtime) shipped in wave-12; edit/delete, reactions, threads, mentions, attachments, presence/typing, member-list all unshipped. M3 stays `in_progress`.

**Action 7 — Per-wave decomposition:** FIRED. Although the literal `seed_candidates` count is 3, those are carried tech-debt, not messaging-feature seeds; M3's `## Scope` is materially unshipped. LLM judgment: a messaging-feature seed is needed for the next wave. Fired `milestone-decomposition` (reason: `decomposition-needed`) against M3 via `milestone-decomposer` sub-agent (always inline under `automatic`). Returned `decomposition-complete` — one bundle (edit/delete seed + reactions backend + UI sibling).

**Action 8 — Slot promotion / stockout:** Not applicable. `active_milestone != null` (M3 stays active); no closure occurred. No promotion, no stockout cascade.

**Action 9 — Daily-checkpoint:** NOT fired. `unassigned_queue_depth = 0`.

**Action 10 — Routing:** `automatic` mode → decomposition spawned `milestone-decomposer` inline. Decision-log entry appended to `command-center/product/product-decisions.md` (committed at N-3).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82 (M3, in_progress)"
  - "todo queue head: eb2a1688-c6b5-416c-84b4-3ede41d07b4c (M4)"
  - "active child tasks: open=3 done=4 seed_candidates=3 (the 3 candidates are tech-debt, not feature seeds)"
  - "unassigned queue depth: 0"
  - "closure: none (M3 scope unshipped)"
  - "promotion: none (active slot occupied)"
  - "decomposition fired: true (decomposition-complete)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 12
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_child_summary:
  open: 3
  done: 4
  seed_candidates: 3
next_todo_id: eb2a1688-c6b5-416c-84b4-3ede41d07b4c
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 6198650e-f4e0-44dc-9b0a-6550f01f9f82, reason: decomposition-needed, decision: fired-inline, by: milestone-decomposer-subagent, fired_at: "2026-06-30T02:30:00Z"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "1 bundle authored — seed e12886d7 (message edit/delete + realtime fan-out) + siblings d78df376 (reactions toggle endpoint + realtime) + f323a71f (UI: edit/delete tombstones + reactions); ~2200-2800 LOC", decision: complete, by: milestone-decomposer-subagent}
loop_state: ready
note: >
  status-check.yaml carried a STALE pause_evidence block (C-2 deploy infra-readiness hard-stop,
  trigger d). That hard-stop was RESOLVED before N: the C-2 stage tail shows the deploy shipped via
  Railway CLI `up` (source-upload, new image), both api+web reached deployment-state SUCCESS, the
  stale-revision race was broken (route 404->401 proving the new M3 revision serves), and the two-client
  <1s metric verified live (93ms/87ms). C-2 head_signoff=APPROVED, PROCEED_TO_T. STATUS already RUNNING.
  No live pause trigger fired at N — the residue is historical. Wave-12 is genuinely complete through L-2.

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (not a sidecar). Exactly one trigger fired
    (milestone-decomposition) with its condition cited: M3 active + in_progress, its ## Scope materially
    unshipped (only core text data plane done), and the 3 nominal seed_candidates are parked tech-debt
    not messaging-feature seeds — so a feature seed is genuinely needed. No todo-milestone stockout
    (10 todo milestones present); no null-claimable checkpoint condition (unassigned depth 0). M3 correctly
    held in_progress (open_count=3, scope unshipped → no premature close). Decomposition returned a
    well-formed WIP-limited bundle. The stale C-2 pause residue was reconciled against the C-2 APPROVED
    verdict and is not a live trigger.
  next_action: PROCEED_TO_N-2
```
