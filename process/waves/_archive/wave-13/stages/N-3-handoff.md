# N-3 — Handoff (wave-13 close → wave-14 open)

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 14"
  - "next wave checklist: process/waves/wave-14/checklist.md"
  - "archive commit: <set at Action 4 commit>"
  - "wave-13 waves row closed: status running → ok (RETURNING wave_number=13)"
prev_wave: 13
next_wave: 14
loop_state: ready
seed_task_id: d1c4693d-b793-4960-8adf-f561aad20677
bundled_sibling_ids:
  - 58633934-e6c4-45a7-9432-62ab2d8adbac
  - 058984c5-b57a-4b8c-b2a5-cefce88357a9
  - 10b9d18e-5071-41dc-85de-ef257b9dfde0
claimed_task_ids:
  - d1c4693d-b793-4960-8adf-f561aad20677
  - 58633934-e6c4-45a7-9432-62ab2d8adbac
  - 058984c5-b57a-4b8c-b2a5-cefce88357a9
  - 10b9d18e-5071-41dc-85de-ef257b9dfde0
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: >
  Mode: automatic. No measured pause trigger fired (no founder message, no hard-stop gate verdict, no .loop-paused.yaml,
  no .loop-resume.yaml; STATUS=RUNNING). loop_state: ready — orchestrator re-enters wave-14 P-0. M3 stays in_progress
  (scope materially unshipped: presence/typing this wave, then mentions/attachments/threads in later waves). No milestone
  state transitions this wave. wave-13 closed via single waves UPDATE; entire wave-13 directory archived in one git mv.
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    M3 NOT closed — verified an unshipped acceptance criterion exists (presence/typing, member-list, mentions, attachments,
    threads all remain in ## Scope; success metric not yet met). Current wave closed via the single UPDATE on the running waves
    row (status='ok', RETURNING wave_number=13 — exactly one running wave closed, no zombie). Entire wave-13 directory archived
    in ONE git mv to _archive/wave-13/. Handoff opens the next wave's P-0 path (wave-14 dir + checklist pre-created) — NOT a pause;
    no measured pause condition fired, so a pause would be a forbidden preemptive pause. Exactly one of {open next P-0, write pause}
    chosen: open next P-0. All cross-wave state (seed + siblings + milestone snapshot) lives in the DB + .last-wave-completed.yaml —
    next P-0 recovers everything; no orphaned wave-scoped state. All N-3 exit checkboxes ticked.
  next_action: PROCEED_TO_P-0_wave-14
```
