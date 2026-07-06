# N-3 — Handoff (wave-54)

## Action 1 — Next wave number + loop state

- Current wave: 54. Next wave: **55**.
- Loop state: **ready** — N-2 emitted a valid seed (not queue-exhausted); no stockout-pending-founder; no decomposition-pending-founder. Not pausing.

## Action 2 — Pre-create next wave's directory + checklist

Created:
- `process/waves/wave-55/blocks/{P,D,B,C,T,V,L,N}`
- `process/waves/wave-55/stages/`
- `process/waves/wave-55/checklist.md` — wave 55, seed `344eabde`, 0 siblings, active milestone M8 (`84e17739`, in_progress), seed-rationale HTML comment, note that the wave-55 waves DB row is opened by wave-55 P-0 Action 0a (not N-3). No pending ritual outcomes affect wave-55 P-0.

## Action 3 — This deliverable

Written before Action 4 archive so it is archived with the wave.

## Action 4 — Archive

`git mv process/waves/wave-54/ process/waves/_archive/wave-54/` + commit `chore: N-3 archive wave-54`. Archive commit SHA recorded in git log (self-referential; reported in the head-next return message).

## Action 5a — Close the wave DB row

`UPDATE waves SET status='ok'` on the current `running` row (found by `status='running' ORDER BY wave_number DESC LIMIT 1`) → RETURNING `wave_number` = 54 (confirmed). Runs AFTER archive per stage file (waves row is FS-independent).

## Action 5b — Loop-handoff anchor

`process/session/.last-wave-completed.yaml` overwritten with the handoff snapshot below.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 55"
  - "next wave checklist: process/waves/wave-55/checklist.md"
  - "archive commit: recorded in git log (chore: N-3 archive wave-54)"
prev_wave: 54
next_wave: 55
loop_state: ready
seed_task_id: 344eabde-bc21-4978-9473-d5b46b7276b1
bundled_sibling_ids: []
claimed_task_ids: [344eabde-bc21-4978-9473-d5b46b7276b1]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "M8 stays in_progress (headline scope shipped; DM-polish/hardening tail draining, security/privacy-first). Seed 344eabde = genuinely-missing who_can_dm='server-members' control. No measured pause trigger under automatic mode → loop continues to wave-55 P-0."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M8 has an unshipped headline-adjacent gap (the missing server-members DM-privacy
    control) so it is correctly NOT marked done; no premature milestone close. The
    single running wave (54) is closed via one waves UPDATE. The entire wave-54
    directory is archived in one git mv. Handoff opens exactly one next P-0 (wave-55) —
    no pause is written because no measured condition (b/d/e/f) fired under automatic
    mode; anticipatory pause is forbidden. All cross-wave state (seed, claimed ids,
    milestone snapshot) lives in the DB + archive + .last-wave-completed.yaml, so the
    next P-0 can recover everything. No orphaned wave-scoped state; no zombie running
    wave.
  next_action: PROCEED_TO_P-0  # wave-55
```
