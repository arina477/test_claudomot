# N-3 — Handoff (wave-38 → wave-39)

Close wave-38, archive it in one move, open wave-39's readiness state.

## Actions

- **Action 1 — Next wave + loop state:** current `<N>=38` → next `<N+1>=39`. Loop does **NOT** pause: N-2 emitted a validated, buildable seed (`c208e91e`); no stockout/decomposition/founder-gate is in flight; no measured pause trigger (b/d/e/f) fired; STATUS is RUNNING under `automatic`. `loop_state: ready`.
- **Action 2 — Pre-create wave-39:** `process/waves/wave-39/blocks/{P,D,B,C,T,V,L,N}` + `stages/` created; `checklist.md` seeded from the DISPATCHER stage-completion ledger, pre-filled wave 39 / seed `c208e91e` / active milestone M7.
- **Action 3 — This deliverable** written before the archive move (archived with the wave).
- **Action 4 — Archive:** `git mv process/waves/wave-38/ process/waves/_archive/wave-38/`, committed `chore: N-3 archive wave-38`, pushed to main.
- **Action 5a — Close wave row (AFTER archive):** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → returned `wave_number=38`. `ended_at` auto-set by trigger.
- **Action 5b — Handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten with wave-38 → wave-39 state.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 39"
  - "next wave checklist: process/waves/wave-39/checklist.md"
  - "archive commit: see chore: N-3 archive wave-38"
prev_wave: 38
next_wave: 39
loop_state: ready
seed_task_id: c208e91e-f3d8-4ca9-87be-2adda2808b54
bundled_sibling_ids: []
claimed_task_ids: [c208e91e-f3d8-4ca9-87be-2adda2808b54]
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "wave-38 closed status=ok; M7 held in_progress (open_count=3, blocked Resend row non-terminal). Single-task bundle handed to wave-39 P-0."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M7 not marked done — its ACs are not all shipped (open_count=3), so no premature close.
    Exactly one running wave (38) closed via the single waves UPDATE. Entire wave directory
    archived in one git mv. Handoff opens exactly one path: wave-39 P-0 with a recoverable
    seed — no pause written (no measured trigger), and not both. All cross-wave state lives
    in the DB (M7 in_progress, seed task row) + the archive + .last-wave-completed.yaml; the
    next P-0 can recover everything. No zombie running wave, no dropped state.
  next_action: PROCEED_TO_wave-39-P-0
```
