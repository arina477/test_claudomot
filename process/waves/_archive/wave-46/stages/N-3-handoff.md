# N-3 — Handoff (wave-46 → wave-47)

head-next gate: **APPROVED** (exactly one handoff action — open wave-47 P-0; no pause; single-move archive; single close-UPDATE; state fully recoverable).

## Action 1 — Next wave + loop state
Current wave `46` → next `47`. **No pause** — mode `automatic`, STATUS `RUNNING` (unchanged), no `.loop-paused.yaml` / `.loop-resume.yaml`, no gate-verdict hard-stop pending at N-3, no founder message. No measured pause trigger (b/d/e/f) fires. `loop_state: ready`.

The shipped-but-unstartable DM state is a scope OBSERVATION, not a measured pause condition — no preemptive pause.

## Action 2 — Next wave scaffold
Created `process/waves/wave-47/` (blocks/{P,D,B,C,T,V,L,N} + stages) and `process/waves/wave-47/checklist.md`. Pre-filled: wave 47, seed `10967558…`, sibling `379978a4…`, active milestone M8, and the **P-0 pending who's-DM-able decision** note (DM-candidate source: DM anyone vs. server co-members only — Tier-3 product/taste; route per mode).

## Action 4 — Archive
Single move: `git mv process/waves/wave-46/ process/waves/_archive/wave-46/`. Commit sha recorded below.

## Action 5 — Final state
- **5a. Wave-row close:** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1) RETURNING wave_number;` → returned `46` (exactly 1 row). Ran AFTER archive per ordering rule.
- **5b. Loop-handoff anchor:** `process/session/.last-wave-completed.yaml` written.

## Pending decision riding the handoff
Wave-47 P-0 MUST resolve the founder **who's-DM-able** product decision (Start-DM picker candidate source) before B. Carried on both the wave-47 checklist header note and this deliverable's `note`.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 47"
  - "next wave checklist: process/waves/wave-47/checklist.md"
  - "archive commit: <see chore: N-3 archive wave-46 commit>"
  - "waves row close: UPDATE returned wave_number=46 (1 row)"
prev_wave: 46
next_wave: 47
loop_state: ready
seed_task_id: 10967558-f27f-4f47-81be-5b5e5d878259
bundled_sibling_ids: [379978a4-0497-449f-8807-4cffe53d1436]
claimed_task_ids: [10967558-f27f-4f47-81be-5b5e5d878259, 379978a4-0497-449f-8807-4cffe53d1436]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Wave-47 P-0 owns the founder who's-DM-able product decision (DM-candidate source: DM anyone vs. server co-members only) — Tier-3 product/taste, route per mode (BOARD under automatic). Not a pause trigger. F-A bundle is feature-completion, not debt."
```
