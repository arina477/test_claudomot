# N-3 — Handoff (wave-49 close → wave-50 open)

Final stage of the wave-49 loop. Increment the wave counter, archive the entire
wave in one move, close the wave row in the DB, emit the readiness anchor for
wave-50's P-0. Mode: `automatic` — loop continues; no measured pause trigger fires.

## Action 1 — Next wave + loop state

- Current wave: 49. Next wave: **50**.
- Pause check: N-2 emitted `queue_exhausted: false`; no ritual deferred to founder;
  no `.loop-paused.yaml` / `.loop-resume.yaml`; STATUS RUNNING; no founder message.
  → **No pause.** `loop_state: ready`. Wave counter increments to 50.

## Action 2 — Pre-create wave-50 directory + checklist

- `process/waves/wave-50/blocks/{P,D,B,C,T,V,L,N}` + `stages/` created.
- `process/waves/wave-50/checklist.md` seeded from the DISPATCHER ledger template,
  pre-filled with seed `f4b3659e`, sibling `ffd98a36`, milestone M8.

## Action 3 — This deliverable (written before archive)

Written to `process/waves/wave-49/stages/N-3-handoff.md` prior to the Action 4 move
so it is archived with the wave.

## Action 4 — Archive

`git mv process/waves/wave-49/ process/waves/_archive/wave-49/` — single move.
Archive committed in the N-block closeout commit (also carries the DB close, the
wave-50 pre-create, and `.last-wave-completed.yaml`).

## Action 5 — Final state emission

- **5a. DB wave close:** `UPDATE waves SET status='ok' WHERE id = (SELECT id FROM
  waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → RETURNING
  wave_number 49. `ended_at` auto-set by trigger. Runs after the archive move
  (waves row is FS-independent, resolved via the running anchor).
- **5b. Loop-handoff anchor:** `process/session/.last-wave-completed.yaml` overwritten
  (last_wave 49, next_wave 50, seed + sibling, active milestone M8 in_progress,
  loop_state ready).

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: 50"
  - "next wave checklist: process/waves/wave-50/checklist.md"
  - "archive commit: see N-block closeout commit (process(wave-49): N-block — close+archive)"
  - "wave-49 waves row: status='ok' (RETURNING wave_number 49)"
  - "wave-50 waves row: opened by wave-50 P-0 Action 0a (not N-3)"
prev_wave: 49
next_wave: 50
loop_state: ready
seed_task_id: f4b3659e-842b-450c-9869-750b64685d63
bundled_sibling_ids: [ffd98a36-9d01-4fba-98ce-1c283c2553e3]
claimed_task_ids: [f4b3659e-842b-450c-9869-750b64685d63, ffd98a36-9d01-4fba-98ce-1c283c2553e3]
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: >
  Clean single-move archive handoff. No milestone state transition this wave
  (M8 stays in_progress; open_count=9 > 0). wave-50 seeded with the founder-directed
  study-timer bundle. wave-50 waves-row INSERT is P-0 Action 0a's job, not N-3's.
  Stray T-5 test artifacts (t5-t2-*.png/.log) removed pre-commit; .playwright-mcp/
  already gitignored.
```

## Stage-exit checklist (head-next gate)

- [x] No unshipped M8 acceptance criterion forced a premature `done` — M8 correctly
      stays `in_progress` (9 tasks open), NOT closed.
- [x] Current wave closed via the single `waves` UPDATE (status), found by
      `status='running'` → RETURNING wave_number 49.
- [x] Entire wave-49 directory archived in one `git mv` to `_archive/wave-49/`.
- [x] Handoff opens wave-50's P-0 (checklist seeded) — NOT a pause. Exactly one.
- [x] No pause written (no measured condition fired under automatic mode).
- [x] No orphaned wave-scoped state: seed/sibling/milestone all recoverable from
      DB + `.last-wave-completed.yaml` + archive.

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Clean single-move archive; exactly one running wave closed (wave 49 → 'ok');
    exactly one handoff action taken (open wave-50 P-0) with no competing pause;
    M8 not prematurely closed (9 open tasks). No dropped handoff state — the next
    P-0 recovers seed, sibling, milestone, and loop state from the DB and the
    handoff anchor. No preemptive pause: under automatic mode no measured trigger
    (b/d/e/f) fired, so the loop continues.
  next_action: PROCEED_TO_wave-50-P-0
```
