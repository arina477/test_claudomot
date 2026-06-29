# N-3 — Handoff (wave-9 close → wave-10 open)

> head-next: APPROVED N-2, PROCEED_TO_N-3. Mode automatic. No measured pause trigger fired → open wave-10 P-0 (not a pause).

## Action 1 — Next wave number + loop state
Next wave = **10**. NOT pausing: no `.loop-paused.yaml`/`.loop-resume.yaml`, STATUS RUNNING (unchanged by another agent), no hard-stop gate-verdict, no monitor wait, no founder message. M2 in_progress with a fresh RBAC bundle. `loop_state: ready`.

## Action 2 — Pre-created wave-10 dir + checklist
`process/waves/wave-10/{blocks/{P,D,B,C,T,V,L,N},stages}` created; `process/waves/wave-10/checklist.md` written with RBAC seed + 3 siblings, claimed_task_ids, M2 active, and 4 binding/carry-forward conditions (T-8 security, verified-fixture 4a2ad286 escalation-critical, naming reconciliation, B-block sequencing).

## Action 4 — Archive
Single git mv `process/waves/wave-9/` → `process/waves/_archive/wave-9/`. Committed + pushed to main (see Action 5 + final commit).

## Action 5 — Final state emission
- **5a. Close wave row:** `UPDATE waves SET status='ok'` on the running row (wave_number 9, id 88aff17b). RETURNING wave_number = 9. Trigger auto-set ended_at.
- **5b. `.last-wave-completed.yaml`:** last_wave 9, next_wave 10, seed + siblings + claimed_task_ids, active_milestone M2 in_progress, loop_state ready.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 10"
  - "next wave checklist: process/waves/wave-10/checklist.md"
  - "archive commit: see main HEAD (chore: N-3 archive wave-9)"
  - "wave-9 row closed: UPDATE waves status='ok' RETURNING wave_number=9"
prev_wave: 9
next_wave: 10
loop_state: ready
seed_task_id: 35f191f4-2b63-4c8b-bf7e-a5c074310ec6
bundled_sibling_ids:
  - 2c927c44-0b29-485d-9640-33401624b973
  - 7a10f13d-413f-46a2-a006-f60c0ab529f2
  - 0b9bcf35-a6f1-40df-9da3-e9135307b900
claimed_task_ids:
  - 35f191f4-2b63-4c8b-bf7e-a5c074310ec6
  - 2c927c44-0b29-485d-9640-33401624b973
  - 7a10f13d-413f-46a2-a006-f60c0ab529f2
  - 0b9bcf35-a6f1-40df-9da3-e9135307b900
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "RBAC bundle authored by milestone-decomposer (commit 73791d8). Verified-prod-fixture 4a2ad286 carried to wave-10 as B-block escalation-critical. No measured pause trigger — opened wave-10 P-0."
```

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: "No premature M2 close (in_progress, RBAC unshipped). Exactly one running wave closed (wave-9, 88aff17b). Single-move archive. Exactly one of {open P-0, pause} = open wave-10 P-0; no measured pause trigger fired. No dropped state — wave-10 P-0 recovers RBAC bundle from DB (wave_id NULL under M2) + archive + carry-forward note."
  next_action: PROCEED_TO_P-0_wave-10
```
