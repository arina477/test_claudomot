# N-3 — Handoff (wave-33)

## Actions

**Action 1 — next wave number + loop state.** Current wave = 33. Loop **PAUSES** (N-2 emitted `queue_exhausted: true` AND no ritual is in-flight that will produce work — decomposition was suppressed and escalated to the founder as the park-or-key fork). Do NOT increment the wave counter. `next_wave: paused`.

**Action 2 — pause marker (not next-wave dir).** Because pausing, do NOT create `process/waves/wave-34/`. Write `process/session/.loop-paused.yaml` recording the park-or-key fork + resume conditions. (Written; see file.)

**Action 3 — this deliverable.** Written before Action 4 archive so it archives with the wave.

**Action 4 — archive.** `git mv process/waves/wave-33/ process/waves/_archive/wave-33/` (single move).

**Action 5a — close wave row.** `UPDATE waves SET status='ok' WHERE id=(SELECT id FROM waves WHERE status='running' ORDER BY wave_number DESC LIMIT 1)` → RETURNING `wave_number = 33`. `'ok'` is correct even on a pause emission (wave-33 itself completed cleanly — shipped LIVE + verified). `ended_at` auto-set by trigger.

**Action 5b — loop-handoff anchor.** `.last-wave-completed.yaml` rewritten: last_wave 33, next_wave paused, seed null, M6 in_progress, loop_state paused, park-or-key note.

## Pause classification (rule 13 — measured, not anticipatory)

Trigger **f** — `process/session/.loop-paused.yaml` written by N-3. The pause is a MEASURED condition: the active milestone's queue holds no credential-independent seed AND its only remaining scope is LiveKit-credential-blocked (key count 0 verified) AND the founder has not provided keys. This is a founder-reserved strategic + credential hard-stop — the brain cannot productively author the next wave without founder input. NOT an anticipatory "natural break." `status-check.yaml` → `STATUS: BLOCKED`. Wave-34 NOT opened. The orchestrator (not head-next) presents the AskUserQuestion fork to the founder.

## Verdict

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "next wave: paused"
  - "pause marker: process/session/.loop-paused.yaml (trigger f — N-3 pause)"
  - "archive commit: see git log (chore: N-3 archive wave-33)"
  - "wave-33 waves.status: running -> ok (RETURNING wave_number 33)"
  - "status-check.yaml: STATUS BLOCKED"
prev_wave: 33
next_wave: paused
loop_state: paused
seed_task_id: null
bundled_sibling_ids: []
claimed_task_ids: []
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
active_milestone_status: in_progress
state_transitions_applied_this_wave: []
note: "Park-or-key fork. Wave-33 shipped clean (malformed-UUID->400 hardening, LIVE + verified) and is closed (status=ok) + archived. M6 held in_progress (scope not shipped: screen-share + audio-fallback undecomposed + LiveKit-credential-blocked, key count 0). Loop paused for founder decision — provide keys to resume M6, or park M6 and pivot to a fully-buildable todo milestone (M7 H1 is the natural pivot). No wave-scoped state orphaned: M6 status + fork options recoverable from DB + .loop-paused.yaml + archive."

head_signoff:
  verdict: APPROVED
  stage: N-3
  reviewers: {}
  failed_checks: []
  rationale: >
    Every N-3 exit check ticks. M6 was NOT marked done (its ## Success metric — screen-share +
    audio-fallback — is unshipped), so no premature milestone close. Exactly one running wave
    (33) is closed via the single waves UPDATE (RETURNING wave_number 33 confirms match — no
    zombie running wave). The entire wave directory is archived in one git mv. The handoff
    writes a pause and does NOT open the next P-0 — exactly one of {open P-0, pause}, never
    both, never neither. The pause is written ONLY on a measured condition (trigger f: N-3
    pause, backed by seed_candidates=0 + remaining-scope-credential-blocked + LiveKit key
    count 0), never anticipatory. pause_evidence cites trigger f + the measurement. No
    cross-wave state is orphaned — M6 stays in_progress in Postgres, the three fork options +
    the M7 pivot target live in .loop-paused.yaml, and the next P-0 (whichever wave the founder
    opens) can recover everything from the DB + archive + the resume mailbox.
  next_action: ESCALATE_TO_founder
```
