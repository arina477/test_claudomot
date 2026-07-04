# N-3 — Handoff (wave-47 N-block)

## Action 1 — Next wave + loop state
- Current wave = 47. Next wave = **48**.
- Loop state = **ready** (CONTINUE). N-2 did not emit queue_exhausted; a valid seed exists (03ccf636); no ritual deferred to founder; BOARD voted 0/7 PAUSE + 0 HARD-STOP. No pause condition holds.

## Action 2 — Next wave pre-created
- `process/waves/wave-48/blocks/{P,D,B,C,T,V,L,N}` + `stages/` created.
- `process/waves/wave-48/checklist.md` written from DISPATCHER template; pre-filled with seed 03ccf636, single-task bundle, active milestone M8, BOARD-direction + guardrail header comments.

## Action 3 — This deliverable (written pre-archive).

## Action 4 — Archive
- `git mv process/waves/wave-47/ process/waves/_archive/wave-47/` + commit. SHA recorded below post-commit.

## Action 5 — Final state
- **5a:** `UPDATE waves SET status='ok'` on the running row (wave 47). RETURNING recorded below.
- **5b:** `process/session/.last-wave-completed.yaml` overwritten with handoff anchor.

## Milestone state-machine snapshot
- M8 `84e17739` stays **in_progress** (no transition this wave — scope not shipped: study-group tools + message-search unbuilt). done_count=22, open=7 (6 remaining seedable follow-ups after seeding 03ccf636).
- No promotion (active slot occupied). todo queue head remains M9.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 48"
  - "next wave checklist: process/waves/wave-48/checklist.md"
  - "archive commit: see commit chore: N-3 archive wave-47"
  - "waves row 47 closed: status='ok' (RETURNING wave_number=47)"
prev_wave: 47
next_wave: 48
loop_state: ready
seed_task_id: 03ccf636-ceb2-4ebc-aff7-6c55e8283521
bundled_sibling_ids: []
claimed_task_ids: [03ccf636-ceb2-4ebc-aff7-6c55e8283521]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
board_direction:
  slug: N-1-wave-48-direction
  resolution: dm-polish-hardening-bundle
  next_feature_fork: deferred-one-wave-founder-reserved
  guardrail: "if wave-49 would be debt-only again, re-escalate study-groups-vs-search to founder"

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {board: "slug N-1-wave-48-direction"}
  failed_checks: []
  rationale: >
    Single-move handoff: M8's ACs are NOT all shipped, so M8 correctly stays in_progress
    (no premature close). The current wave (47) is closed via the single waves UPDATE on the
    status='running' row. The entire wave-47 directory is archived in one git mv. The handoff
    opens exactly one thing — wave-48's P-0 (loop_state: ready) — and writes NO pause: 0/7
    BOARD PAUSE votes, 0 HARD-STOP, claimable seed exists, no measured condition (b/d/e/f)
    fires. All cross-wave state (seed, milestone snapshot, BOARD direction + guardrail) lives
    in the DB + checklist header + .last-wave-completed, so wave-48 P-0 recovers everything.
    No orphaned wave-scoped state.
  next_action: PROCEED_TO_wave-48-P-0
note: "CONTINUE to wave-48 P-0. wave-48 = DM-hardening seed 03ccf636 under M8. Feature fork deferred + founder-reserved."
```
