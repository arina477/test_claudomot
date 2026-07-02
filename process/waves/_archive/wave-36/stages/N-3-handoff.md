# N-3 — Handoff (wave-36)

Mode: `automatic`. head-next owns the N-block. No pause condition — STATUS RUNNING, no founder message, no hard-stop verdict, no `.loop-paused.yaml` / `.loop-resume.yaml`. A real buildable bundle exists for wave-37 → `loop_state: ready`, NOT paused. No preemptive/anticipatory pause.

## Actions

- **Action 1 — Next wave + loop state:** current wave `36`; next wave `37`. Not pausing (N-2 emitted `queue_exhausted: false`; buildable bundle present). Wave counter increments to 37.
- **Action 2 — Pre-create next wave:** created `process/waves/wave-37/` (blocks/{P,D,B,C,T,V,L,N} + stages) and `process/waves/wave-37/checklist.md`, pre-filled with seed `0b33df33` + siblings `f3f52d9a`, `edac03e0`, active milestone M7, and the wave-36 decomposition note. No `.loop-paused.yaml` written.
- **Action 3 — This deliverable:** written before archive so it moves with the wave.
- **Action 4 — Archive:** single `git mv process/waves/wave-36/ → process/waves/_archive/wave-36/` + commit.
- **Action 5a — Close wave row:** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number;` → returned `36`. `ended_at` auto-set by trigger.
- **Action 5b — Handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten (last_wave 36, next_wave 37, seed + siblings, active_milestone M7 in_progress, loop_state ready).

## Milestone state machine snapshot

- M7 (`6e2f68d8`) stays `in_progress` — no closure (open_count=5 ≠ 0; unshipped credential-independent scope remains, now decomposed into the wave-37 notifications bundle). No premature close: M7's success metric names deploy-verified-for-one-cohort + the parked founder-ops bits.
- No slot promotion, no stockout cascade (M8–M13 remain `todo`; active slot occupied by M7).
- Task hygiene applied at N-1: `a1299e88` + `84e09891` reclassified `todo → blocked` (true founder-ops state).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 37"
  - "next wave checklist: process/waves/wave-37/checklist.md"
  - "archive commit: see chore: N-3 archive wave-36"
  - "wave-36 waves.status=ok (RETURNING wave_number=36)"
prev_wave: 36
next_wave: 37
loop_state: ready
seed_task_id: 0b33df33-fafb-4572-ba32-6a6450cf63a6
bundled_sibling_ids:
  - f3f52d9a-984a-44a4-9a82-293e90be93b7
  - edac03e0-be3c-4b89-b3c7-e9d367ec275b
claimed_task_ids:
  - 0b33df33-fafb-4572-ba32-6a6450cf63a6
  - f3f52d9a-984a-44a4-9a82-293e90be93b7
  - edac03e0-be3c-4b89-b3c7-e9d367ec275b
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "M7 remains in_progress — buildable in-app-notifications slice (seed + 2 siblings) seeds wave-37; loop continues. No BOARD milestone-disposition call: a genuine credential-independent slice exists, so this was mechanical decomposition (fired at N-1), not a last-H1 disposition. The 2 founder-ops tasks (Resend domain, Railway bucket) stay blocked; they are not M7's headline and do not gate the buildable pipeline."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: "Active milestone NOT prematurely closed — open_count=5, unshipped notifications scope, M7 kept in_progress. Current wave closed via the single waves UPDATE (RETURNING 36). Entire wave-36 directory archived in one git mv. Handoff opens exactly ONE outcome: wave-37 P-0 (a real buildable bundle) — NOT a pause, and no double-handoff. No pause written because no measured condition fired (no b/d/e/f) — anticipatory pause on 'last H1 milestone / MVP polish' would be forbidden. All cross-wave state (seed bundle, milestone snapshot) lives in the DB + .last-wave-completed.yaml; wave-37 P-0 can recover everything. No zombie running wave; no orphaned state."
  next_action: PROCEED_TO_wave-37_P-0
```
