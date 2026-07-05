# N-3 — Handoff (wave-51 → wave-52)

Final stage of the wave loop. Increment wave counter, pre-create wave-52 scaffolding, archive wave-51 in one move, close the wave-51 `waves` row, emit handoff state.

## Actions

- **Action 1 — Next wave number + loop state**: current wave = 51 → next = 52. No pause: N-2 emitted `queue_exhausted: false`; no stockout/decomposition deferred to founder; mode `automatic` and no measured pause trigger fired (STATUS RUNNING, no `.loop-paused.yaml`, no `.loop-resume.yaml`, no founder message). `loop_state: ready`.

- **Action 2 — Pre-create wave-52 dir + checklist**: `process/waves/wave-52/{blocks/{P,D,B,C,T,V,L,N},stages}` + `checklist.md` seeded from DISPATCHER § Stage completion ledger. Pre-filled: wave 52, seed `d123d9e0`, siblings `aad849ac` + `ef84b378`, active milestone M8. NOTE: N-3 pre-creates the FS scaffolding only. The `waves` DB row for wave-52 is opened by wave-52's **P-0 Action 0a** (`INSERT (milestone_id)` grant) — N-3 does NOT INSERT the waves row (would strand a second row). Grant contract per SCHEMA.md § waves writers.

- **Action 3 — Write this deliverable** (before Action 4 archive so it archives with the wave). Done.

- **Action 4 — Archive wave-51**: single move `git mv process/waves/wave-51/ process/waves/_archive/wave-51/`. After: `process/waves/` holds only `wave-52/` + `_archive/`.

- **Action 5a — Close the wave-51 DB row** (runs AFTER archive per Action 5 ordering): `UPDATE waves SET status='ok' WHERE id = (SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → matched wave_number 51 (id `8da109d9-f6f7-4151-83dc-4ad581e810d6`); `set_wave_ended_at()` trigger set `ended_at`. RETURNING confirmed wave_number 51 (1 row — not orphan-cleanup path).

- **Action 5b — Loop-handoff anchor**: `process/session/.last-wave-completed.yaml` overwritten (last=51, next=52, seed `d123d9e0` bundle, M8 in_progress, loop_state: ready).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 52"
  - "next wave checklist: process/waves/wave-52/checklist.md"
  - "archive commit: see process(wave-51) N-block commit"
  - "wave-51 waves row closed: id 8da109d9-f6f7-4151-83dc-4ad581e810d6 status='ok', ended_at set (RETURNING wave_number 51)"
prev_wave: 51
next_wave: 52
loop_state: ready
seed_task_id: d123d9e0-bdcd-4815-91c5-ac90b6852997
bundled_sibling_ids:
  - aad849ac-3273-4a11-ad05-8efef1c5da87
  - ef84b378-df1d-4bf1-b669-6624d210170f
claimed_task_ids:
  - d123d9e0-bdcd-4815-91c5-ac90b6852997
  - aad849ac-3273-4a11-ad05-8efef1c5da87
  - ef84b378-df1d-4bf1-b669-6624d210170f
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave:
  []
note: >
  Focus-room directed headline (ceo-reviewer 2x-recommended) seeded for wave-52.
  M8 stays in_progress (open=10 > 0). 7 DM-polish stragglers stay un-seeded/seedable.
  head-next signoff APPROVED on N-1/N-2/N-3. Loop continues to wave-52 P-0 — no pause.
```
