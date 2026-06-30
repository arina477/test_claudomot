# N-2 — Seed (wave-11 → wave-12 bundle)

head-next gate: **APPROVED** (PROCEED_TO_N-3).

## Actions

### Action 1 — pick the seed (with authorized re-ordering)
Bare `ORDER BY created_at LIMIT 1` returns tech-debt 46f16288 (created 06-29) ahead of the messaging seed a0c322b4 (created 06-30), because the 3 carried M2 tech-debt tasks are older top-level todos. N-2 Action 1 authorizes LLM re-ordering ("prefer whichever the milestone scope needs next"). The N-1 decomposition fire existed precisely to seed wave-12 with M3's messaging feature — picking a tech-debt task would strand the just-authored bundle and defeat the decomposition. **Seed = a0c322b4** "Build MessagingModule + send/list message REST data plane". The 3 tech-debt tasks remain parked top-level todos for a future wave.

### Action 2 — siblings
`parent_task_id = a0c322b4`, status=todo, wave_id NULL:
- 723b5b6a — "Wire /messaging Socket.IO gateway: WS-upgrade auth + room-per-channel fan-out"
- d999d29c — "Build message UI: composer + virtualized message list with pending/failed states"

### Action 3 — validation: PASS
All 3 rows: status=todo, wave_id IS NULL, milestone_id=M3; siblings' parent_task_id=a0c322b4. No concurrent-write race.

### Action 5 — claimed_task_ids
`[a0c322b4, 723b5b6a, d999d29c]` — B-0 claims this batch; L-2 closes it.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "seed task id: a0c322b4-72de-4c8d-ac27-bb51dda5f464"
  - "bundled siblings: 2"
  - "validation: pass"
seed_task_id: a0c322b4-72de-4c8d-ac27-bb51dda5f464
seed_task_title: "Build MessagingModule + send/list message REST data plane"
bundled_sibling_ids: [723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
claimed_task_ids: [a0c322b4-72de-4c8d-ac27-bb51dda5f464, 723b5b6a-5565-438f-bde4-7e85ba283781, d999d29c-4f60-497b-95fb-875ae40410b9]
active_milestone_id: 6198650e-f4e0-44dc-9b0a-6550f01f9f82
queue_exhausted: false
validation_failed: false
note: "Authorized re-order: messaging seed a0c322b4 picked over older carried tech-debt tasks (46f16288/25523fb0/d058283d) per N-2 Action 1; tech-debt remains parked for a future wave."
```
