# N-1 — Survey & triggers (wave-61)

Mode: `automatic`. head-next online (agent a28086c4d4a768633). All state read live from Postgres via SCHEMA.md recipes (no sidecar / bash-var hand-off).

## Survey phase (Actions 1–4)

**Action 1 — active milestone.**
`SELECT ... WHERE status='in_progress'` → exactly one row: **M8 — Educator tools & deeper academics** (`84e17739-af5e-4396-beb9-b6f3d6836fc4`). No invariant violation (single in_progress).

**Action 2 — todo queue.**
5 rows, ordered by created_at: M9 Monetization (`3e507bc0`), M10 Compliance & data rights (`8d88e691`), M11 Growth: server discovery (`8d88e691`→`8d88e691`), M12 Offline-first moat (`36378340`), M13 Institution partnerships (`b7400254`). `next_todo_id` is not consumed this tick — M8 slot is occupied (see Action 6), and the two highest-value todo milestones (M9, M12) are FOUNDER-RESERVED and NOT loop/BOARD-promotable.

**Action 3 — M8 child-task summary.**
`open_count=1`, `done_count=42`, `seed_candidates=1`.
- The single open row is `999a14d1` — "getDmCandidates cursor/pagination + load-more UX (deferred to a real large-server scaling wave)", status `todo`, `wave_id NULL`, `parent_task_id NULL`.
- It registers as `seed_candidates=1` because it satisfies the raw seed predicate (todo / wave_id NULL / parent NULL). BUT its description is an explicit **do-not-auto-drain fence**: "DEFER until a real large-server scaling wave lands WITH usage data — premature at zero users (StudyHall pre-launch)... Do NOT auto-drain at zero users." → it is NOT a genuine drainable seed. Effective drainable seed_candidates for M8 = **0**.

**Action 4 — unassigned queue depth.**
`unassigned_queue_depth = 13`.

## Trigger phase (Actions 6–10)

**Action 6 — M8 closure check → NO.**
`open_count=1 > 0`. 999a14d1 is a real, deliberately-deferred open task (not stray/orphaned). M8 is NOT closed. `## Scope` items shipped substantively (40+ pieces), but the milestone retains one open deferred slice → milestone stays `in_progress`. No `in_progress → done` transition.

**Action 7 — per-wave decomposition → NO.**
M8 has no *drainable* seed candidate (999a14d1 is do-not-drain). But decomposition does NOT fire, because:
- 999a14d1 is a deliberate deferral, not a "queue needs the next bundle" signal. Decomposing M8 further would author work the milestone scope does not need (M8's substantive scope is shipped).
- Auto-draining 999a14d1 or synthesizing a filler bundle would violate the wave-56 deferral + be premature at zero users.

**Action 8 — slot promotion + stockout cascade → NO promotion, NO roadmap-planning.**
- M8 is still `in_progress` (not closed in Action 6), so `active_milestone != null` → 8a promotion does not apply.
- Even hypothetically: M9 and M12 (the two value milestones) are FOUNDER-RESERVED; the loop/BOARD may NOT promote them. M10/M11/M13 exist as todo but are not the meaningful next direction and are lower-tier.
- `todo` milestones DO exist (M9–M13) → **milestone-stockout roadmap-planning does NOT fire** (that trigger is "no todo milestone exists at all"). Confirmed against `roadmap-lifecycle.md` § Stockout cascade line 206.

**Action 9 — daily-checkpoint → FIRES.**
All three conditions hold:
1. Action 7 found no genuine seed candidate AND decomposition was not fired this tick.
2. `unassigned_queue_depth = 13 > 0`.
3. Stockout cascade (8b) is NOT in flight.

**Genuine-drainability walk of the 13-row unassigned queue** (head-next-required; each row is `milestone_id IS NULL`):

| id | title | drainable autonomously at N-1/N-2? |
|---|---|---|
| 4b397de0 | Assignments controller-spec IDOR assertion | NO — unassigned; not seedable by N-2 (seed requires milestone_id=active) |
| 6f257c82 | Assignments rowToDto JOIN fold | NO — unassigned |
| 3ad35a42 | Assignments optimistic-toggle revert | NO — unassigned |
| 4a92327c | ParseUUIDPipe 400-not-500 | NO — unassigned (genuinely small, but NOT seedable without a P-0 assign) |
| 875b97f4 | HSTS + throttler-exception body | NO — unassigned |
| 72cb6ebb | sweep stale manage_channels refs | NO — unassigned |
| 226c7e42 | integration-tier hardening | NO — unassigned |
| ee6421a7 | mention tokenizer @-split | NO — unassigned |
| fdb444fc | presence dots to DM/mention (parented) | NO — unassigned |
| 4905dc3a | reminder at-least-once retry | NO — unassigned |
| 6832e3ea | stabilize flaky server-roles test | NO — unassigned |
| b84f7be9 | fix userB e2e fixture password | NO — unassigned |
| f8fb8023 | SuperTokens anti-CSRF explicit | NO — unassigned |

**Key finding:** several rows (4a92327c, 875b97f4, 6832e3ea, b84f7be9, f8fb8023) are genuinely small, non-premature, non-founder-gated engineering-hardening items. HOWEVER they are all `milestone_id IS NULL`. Per `roadmap-lifecycle.md`:
- A seed MUST carry `milestone_id = <active>` (§ Bundles line 214). N-2 cannot pick an unassigned task.
- The unassigned queue is resolved by **P-0 Frame walking + assigning** (`UPDATE tasks SET milestone_id`) OR by the **daily-checkpoint surfacing to founder** — NOT by an N-1 autonomous seed path (§ line 110).
- Anti-pattern #9 (line 259) explicitly forbids treating the unassigned queue as an autonomous backlog: "Unassigned is staged for the next P-0 walk; the real backlog is `status='todo'` milestones."
- Auto-assigning these cross-cutting hardening items into M8 (Educator tools) to manufacture a seed would be scope-laundering — they don't belong to M8's theme, and assignment is a founder/P-0 decision, not an N-1 autonomous one.

Therefore: **no autonomously-seedable drainable work remains.** M8 drainable-exhausted; 999a14d1 do-not-drain; M9/M12 founder-reserved; the 13 unassigned rows require a founder/P-0 assignment decision they have not received. This is a **GENUINE STOCKOUT**.

**Action 10 — route.**
Mode `automatic` → daily-checkpoint normally routes to BOARD (`N-1-checkpoint-wave-61`). But the checkpoint's substance is the founder's M9-vs-M12 strategic direction call, which is:
- Explicitly FOUNDER-RESERVED (M9 pricing = rule-17 founder-only; M12 = blocked on founder blessing + a founder-authored success metric).
- Already FOREGROUNDED to the founder as a plain-language decision-request at `process/session/updates/checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md`.

BOARD cannot resolve a founder-reserved strategic direction (splits + founder-reserved calls route to founder even under automatic). The measured, correct disposition is to HALT the loop for the founder: next-claimable is effectively null for autonomous work, and the only meaningful next step is the founder's direction call. This is a MEASURED stockout (daily-checkpoint / board-escalation shape), NOT an anticipatory pause.

## Deliverable

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739 (M8) in_progress"
  - "todo queue head: M9/M10/M11/M12/M13 present (todo milestones exist → no roadmap-planning stockout)"
  - "active child tasks: open=1 done=42 seed_candidates=1(=999a14d1, do-not-auto-drain → 0 genuine)"
  - "unassigned queue depth: 13 (all milestone_id NULL → not N-2-seedable; require P-0/founder assignment)"
  - "closure: none (M8 open_count=1>0)"
  - "promotion: none (M8 slot occupied; M9/M12 founder-reserved, non-promotable)"
  - "decomposition fired: false (999a14d1 do-not-drain; M8 scope shipped)"
  - "rituals fired: [daily-checkpoint → founder-checkpoint stockout]"
prev_wave: 61
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 1
  done: 42
  seed_candidates: 1   # =999a14d1, do-not-auto-drain; 0 genuine drainable
next_todo_id: null      # not consumed — M8 slot occupied + M9/M12 founder-reserved
unassigned_queue_depth: 13
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired:
  - {ritual: daily-checkpoint, decision: founder-checkpoint-stockout, by: orchestrator, fired_at: 2026-07-06}
ritual_outcomes:
  - {ritual: daily-checkpoint, outcome_summary: "GENUINE STOCKOUT — M8 drainable-exhausted (only open=999a14d1 do-not-drain); M9/M12 founder-reserved; 13 unassigned rows not N-2-seedable (require P-0/founder assign). Next-claimable null for autonomous work. Founder M9-vs-M12 direction call is the only meaningful next step — already foregrounded at checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md. Loop pauses for founder.", decision: pause-for-founder, by: orchestrator}
loop_state: paused
note: "STOCKOUT → founder-checkpoint. Measured condition (daily-checkpoint / board-escalation shape), not anticipatory. M8 stays in_progress (not closed — 999a14d1 remains a deliberate deferral)."
```

## head-next N-1 signoff

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: { head-next: APPROVED }
  failed_checks: []
  rationale: >
    All N-1 stage-exit checks tick from live-DB state (no sidecar/bash-var).
    Trigger ladder walked in full: close=NO (M8 open_count=1>0, 999a14d1 is a live
    deferral, not a stray); decompose=NO (M8 substantive scope shipped, done_count=42;
    sole seed 999a14d1 do-not-auto-drain per explicit description fence → 0 genuine
    drainable seeds; firing would author filler); promote=NO (M8 slot occupied;
    M9/M12 founder-reserved, non-promotable by loop/BOARD); roadmap-planning-stockout=NO
    (todo milestones M9–M13 exist). EXACTLY ONE trigger fires — daily-checkpoint —
    with all three Action-9 conditions satisfied (no drainable seed + decomposition
    not fired; unassigned_queue_depth=13>0; stockout-cascade 8b not in flight).
    Pipeline-stall averted: null-claimable routed to checkpoint, loop did not silently
    die. The pause is MEASURED, not anticipatory: it rests on concrete DB counts
    (0 drainable seeds under M8; 13 unassigned rows all milestone_id IS NULL → not
    N-2-seedable per roadmap-lifecycle § Bundles; M9/M12 founder-reserved) plus a
    founder-reserved M9-vs-M12 direction call BOARD cannot resolve under automatic —
    NOT a "natural break". 999a14d1 correctly not drained (do-not-auto-drain fence,
    premature at zero users). The 13 unassigned rows correctly not autonomously seeded:
    milestone_id IS NULL blocks N-2 seed selection, and auto-assigning cross-cutting
    hardening into M8 (Educator tools) to manufacture a seed would be scope-laundering
    (anti-pattern #9); they stage for the next P-0 walk and are surfaced to the founder
    via checkpoint-2026-07-06-m8-tail-vs-m12-offline-first.md. Confirmations: (a)
    exactly-one-trigger YES; (b) genuine-stockout measured-not-anticipatory YES;
    (c) 999a14d1 correctly-not-drained YES; (d) 13 unassigned rows correctly-not-seedable
    YES. Division-of-labor note: N-1 correctly PROPOSES loop_state:paused; the pause
    artifact (.loop-paused.yaml + STATUS:BLOCKED with pause_evidence) is written at N-3,
    and N-2 emits queue-exhausted state — no checklist item compromised.
  next_action: PROCEED_TO_N-2
