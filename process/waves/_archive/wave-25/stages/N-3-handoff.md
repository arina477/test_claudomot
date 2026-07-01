# Wave 25 — N-3 Handoff

## Action 1 — Next wave + loop state
Current wave = 25 → next wave = **26**. No pause condition (N-2 seeded successfully; no stockout, no strict-mode ritual defer). **loop_state: ready.**

## Action 2 — Next-wave scaffold
`process/waves/wave-26/` created (blocks/{P..N} + stages) + `checklist.md` pre-filled: seed `10b9d18e` (presence dots), active milestone M5 (a5232e16), solo-task bundle, carry-ins (T-5 chrome-absent unblock is why this task seeded now; Resend-key M5 blocker record-only).

## Action 4 — Archive
`git mv process/waves/wave-25/ process/waves/_archive/wave-25/` (single move) + commit.

## Action 5a — Wave-row close
`UPDATE waves SET status='ok'` on the running wave (25) — `ended_at` trigger-set.

## Action 5b — Loop-handoff anchor
`process/session/.last-wave-completed.yaml` overwritten with the wave-26 handoff state.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 26"
  - "next wave checklist: process/waves/wave-26/checklist.md"
  - "archive commit: see chore(wave-25) archive commit"
  - "waves row 25 → status='ok'"
prev_wave: 25
next_wave: 26
loop_state: ready
seed_task_id: 10b9d18e-5071-41dc-85de-ef257b9dfde0
bundled_sibling_ids: []
claimed_task_ids: [10b9d18e-5071-41dc-85de-ef257b9dfde0]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_status: in_progress
state_transitions_applied_this_wave: []      # M5 stayed in_progress (7 done / 9 open); no milestone close/promotion
note: "Wave-25 shipped LIVE (mention parity + editMessage atomicity, dbe55a2 on api+web). M5 headline (reminders) still cred-blocked on founder Resend key. wave-26 seed = presence dots (UI-verifiable now via T-5 bundled-chromium rule)."
```

## Exit
Wave-25 archived, waves row closed, handoff anchor written, wave-26 scaffolded. Loop ready → re-enter P-0 of wave-26.
