# Wave 26 — N-3 Handoff

- **Action 1:** wave 26 → next wave **27**. No pause condition (N-2 seeded; no stockout/strict-mode defer). **loop_state: ready.**
- **Action 2:** `process/waves/wave-27/` created + checklist pre-filled (seed 6a546c7b server presence perf, M5, solo bundle).
- **Action 4:** `git mv process/waves/wave-26 process/waves/_archive/wave-26` + commit.
- **Action 5a:** `UPDATE waves SET status='ok'` on running wave 26.
- **Action 5b:** `.last-wave-completed.yaml` → wave-27 handoff.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 27"
  - "next wave checklist: process/waves/wave-27/checklist.md"
  - "waves row 26 → status='ok'"
prev_wave: 26
next_wave: 27
loop_state: ready
seed_task_id: 6a546c7b-e459-46a6-95f2-d00707353308
bundled_sibling_ids: []
claimed_task_ids: [6a546c7b-e459-46a6-95f2-d00707353308]
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_status: in_progress
state_transitions_applied_this_wave: []      # M5 stayed in_progress (8 done / 9 open)
note: "Wave-26 shipped LIVE (presence dots on message-row author avatars + self-presence fix, PRs #38/#39). T-5 live E2E caught+fixed a critical prod bug (self excluded from presence store). M5 reminders headline still Resend-key-blocked. wave-27 seed = server presence perf (hotter after author dots)."
```

## Exit
Wave-26 archived, waves row closed, handoff written, wave-27 scaffolded. Loop ready → P-0 of wave-27.
