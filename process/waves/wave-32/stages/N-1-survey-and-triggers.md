# N-1 — Survey & triggers (wave-32)

## Survey signals (Actions 1–4, live DB)

- **Active milestone (Action 1):** M6 `8702a335-90ec-40ff-8c7d-a91bb7790a27` — "Voice/video study rooms" — `in_progress`. Exactly one `in_progress` (invariant 1 holds).
- **`todo` queue head (Action 2):** M7 `6e2f68d8` (then M8–M13; 7 todo milestones). `next_todo_id = 6e2f68d8`. No stockout.
- **M6 child summary (Action 3):** `open_count=1`, `done_count=3`, `seed_candidates=0`.
  - done: d8a85de0 (token-mint, w31), 1dd1f2ca (client join, w31, sibling), 78f51968 (occupancy indicator, w32).
  - open: a2dd9f3d (todo, parent NULL) — V-2 finding F-32-T-8-1.
  - **`seed_candidates=0`** because a2dd9f3d has `wave_id = d25f8c47` (wave-32), failing the `wave_id IS NULL` seed clause.
- **Unassigned queue depth (Action 4):** 12.

## Trigger evaluation (Actions 6–10)

- **Closure (Action 6): NO.** M6 has an open child (a2dd9f3d) → invariant 3 blocks close. Additionally screen-share + audio-fallback + drop-in-room scope undecomposed/unshipped → success metric not met. Hold `in_progress`. No premature close. No `wave_id`/status write performed.
- **Per-wave decomposition (Action 7): NOT FIRED.** `seed_candidates=0` would normally fire decomposition, BUT a2dd9f3d is a real, milestone-scoped M6 residual whose disposition is undecided. Firing decomposition now would author a *second* M6 bundle while a2dd9f3d's scope overlap is unresolved → duplicate/wrong-scope risk. Decomposition withheld pending the halt resolution.
- **Promotion / stockout (Action 8): NO.** M6 active; 7 `todo` milestones exist.
- **Daily-checkpoint (Action 9): NO.** Not the null-claimable-with-nonempty-unassigned-queue condition; the issue is a mis-stated M6 seed, not an empty queue.

## Standing cred-tripwire evaluation (NOT the blocker)

Tripwire (wave-32 P-0 ceo-reviewer): "3rd consecutive M6 wave shipping live-unverifiable code with LiveKit keys absent → convert founder heads-up into a park-or-key fork." Count: w31 (token-mint)=1, w32 (occupancy)=2. LiveKit keys still unset. Next intended M6 work (a2dd9f3d — ParseUUIDPipe input validation) is **credential-independent, fully verifiable without LiveKit** → next wave would NOT be cred-blocked → 3rd-consecutive-cred-blocked condition NOT met → **tripwire NOT tripped, deferred.** Re-arms when the M6 queue holds ONLY cred-blocked work (screen-share/audio-fallback remain AND keys absent). Standing LiveKit founder ask stays open in the digest. **This is not the halt cause.**

## HALT — head-next gate hard-stop (trigger d)

The N-block cannot emit a valid handoff. The only M6 next-seed candidate, a2dd9f3d, provably cannot be a seed as authored:

- a2dd9f3d = V-2 follow-up (F-32-T-8-1), INSERTed by wave-32 V-2 triage with `milestone_id=M6` AND `wave_id=d25f8c47` per roadmap-lifecycle line 90 (milestone-scoped V-2 → `wave_id = current wave`).
- N-2's seed picker (line 214) requires `wave_id IS NULL` → a2dd9f3d excluded.
- No stage is authorized to clear `wave_id` to NULL (line 156 enumerates no clear-to-NULL writer; N-3 Action 5a closes only the `waves` row, never child-task `wave_id`).
- **Live-table verification:** ZERO milestone-scoped, top-level, `todo` tasks with a non-NULL `wave_id` have ever been picked as seeds. All prior V-2/D-3 follow-up seeds (waves 22–30) had `milestone_id IS NULL` (unassigned-queue path). a2dd9f3d would be the first milestone-scoped instance — an anomaly, not a precedent.

**Root cause:** latent lifecycle contradiction — line 90 (milestone-scoped V-2 INSERTs `wave_id = current wave`) vs line 214 (seed needs `wave_id IS NULL`) with no clear-to-NULL writer (line 156). Never bit before because prior V-2 follow-ups were `milestone_id NULL`.

Not resolvable by any in-ritual N-block write. Routed as a measured hard-stop (trigger d, gate-verdict) → loop paused for founder/BOARD ruling.

```yaml
n_stage_verdict: DEFERRED
verdict_evidence:
  - "active milestone: 8702a335 (M6, in_progress)"
  - "todo queue head: 6e2f68d8 (M7)"
  - "active child tasks: open=1 done=3 seed_candidates=0"
  - "unassigned queue depth: 12"
  - "closure: none (invariant-3 blocks: open child a2dd9f3d + unshipped scope)"
  - "promotion: none"
  - "decomposition fired: false (withheld — a2dd9f3d disposition undecided)"
  - "rituals fired: []"
  - "HALT: head-next gate REJECTED/ESCALATE — M6 seed a2dd9f3d wave_id=d25f8c47, unresolvable in-ritual"
prev_wave: 32
active_milestone_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
active_milestone_child_summary:
  open: 1
  done: 3
  seed_candidates: 0
next_todo_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
unassigned_queue_depth: 12
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: paused
note: "Halted on head-next hard-stop (trigger d). a2dd9f3d cannot seed a future wave as authored; lifecycle ruling needed. Wave-32 NOT closed/archived; wave-33 NOT opened. STATUS: BLOCKED in status-check.yaml; .loop-paused.yaml written."
```

## head-next signoff

```yaml
head_signoff:
  verdict: ESCALATE
  stage: N-1
  reviewers: {}
  failed_checks:
    - "seed-candidate existence unresolvable: a2dd9f3d wave_id=d25f8c47 (wave-32) fails line-214 seed contract; no enumerated stage clears wave_id"
  rationale: "Trigger outcomes correct (no close, no decompose, no promote, no checkpoint; tripwire deferred), but the M6 next-seed cannot be emitted — latent lifecycle defect requiring founder/BOARD ruling on milestone-scoped V-2 follow-up wave_id disposition."
  next_action: ESCALATE_TO_founder
```
