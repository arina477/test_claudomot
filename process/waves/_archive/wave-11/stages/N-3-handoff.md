# N-3 — Handoff (wave-11 close → wave-12 open)

head-next gate: **APPROVED**. Mode: `automatic`. No measured pause trigger fired (no STATUS change, no hard-stop verdict, no founder message, no `.loop-paused.yaml`, no `.loop-resume.yaml`) → open next P-0, NOT a pause (exactly one).

## Actions
- **Action 1 — next wave + loop state:** wave-11 → wave-12. `loop_state: ready` (no queue-exhaustion, no founder-pending ritual).
- **Action 2 — pre-create wave-12:** dir tree + checklist seeded with bundle a0c322b4 + siblings + active M3. T-8 rule 1 live-probe note carried into the checklist for P-0.
- **Action 4 — archive:** single `git mv process/waves/wave-11 → process/waves/_archive/wave-11`.
- **Action 5a — DB close:** `UPDATE waves SET status='ok'` on the `status='running'` row → returns wave_number 11.
- **Action 5b — handoff anchor:** `.last-wave-completed.yaml` overwritten with next_wave 12, claimed_task_ids, active M3 in_progress, loop_state ready.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 12"
  - "next wave checklist: process/waves/wave-12/checklist.md"
  - "archive commit: see chore: N-3 archive wave-11"
  - "waves close: wave_number 11 → status='ok'"
prev_wave: 11
next_wave: 12
loop_state: ready
seed_task_id: a0c322b4-72de-4c8d-ac27-bb51dda5f464
bundled_sibling_ids: [723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
claimed_task_ids: [a0c322b4-72de-4c8d-ac27-bb51dda5f464, 723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "M3 stays in_progress — first messaging slice seeded, full scope (reactions/threads/mentions/attachments/presence/member-list) deferred to later M3 waves. wave-12 P-0 MUST live-verify authed message paths via the wave-11 verified fixture (T-8 rule 1)."
```
