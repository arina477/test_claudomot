# N-1 — Survey & triggers (wave-5)

Survey read from live psql against `$CLAUDOMAT_DB_URL` this turn (NOT the stale C-2 deploy-crash
narrative in `status-check.yaml` — that crash was fixed; STATUS=RUNNING, no live hard-stop).

## Survey signals (Actions 1–4)

- **Active milestone (Action 1):** exactly one `in_progress` — M1 `5a6efc9e-9de7-4594-a75d-d45e30d9a417`
  (Foundation: app shell, auth & profiles). No invariant violation.
- **todo queue (Action 2):** 13 `todo` milestones. Head = M2 `41e61975` (Servers, channels & membership),
  then M3 messaging. `next_todo_id = 41e61975`.
- **M1 child summary (Action 3):** open_count=3, done_count=10, **seed_candidates=1**.
- **M1 open children:**
  - `a1299e88` — Verify a Resend domain for transactional email — todo, parent=cb76d7b9 (sibling),
    wave_id=NULL. FOUNDER DNS action.
  - `84e09891` — Set Railway Bucket creds + verify avatar upload live — in_progress, parent=839af17f,
    wave_id=ae9e80b2 (claimed wave-5). FOUNDER creds action; presign code shipped + deployed (503-graceful
    when storage unset, no regression).
  - `da242f6b` — Add CI job booting compiled API (`node dist/src/main.js`) + curl `/health` — todo,
    parent=NULL, wave_id=NULL. ENGINEERING, no founder dep. **The sole seed candidate.**
- **Unassigned queue depth (Action 4):** 1.
- **Live founder bet:** "Academic tools + offline-first win students from Discord."

## Trigger evaluation (Actions 6–10) — no ritual fires this tick (valid outcome)

- **Action 6 (closure):** BLOCKED. `open_count=3 ≠ 0` → invariant 3 (roadmap-lifecycle § Milestone state
  transitions; anti-pattern #8) forbids `in_progress → done` while any child task is non-terminal. Marking
  M1 done now = premature-milestone-close — refused. M1 stays `in_progress`.
- **Action 7 (decomposition):** NOT fired. Fires only when `seed_candidates = 0`; live = 1 (`da242f6b`).
  Adding a second seed would be bundle-bloat — suppressed.
- **Action 8 (promotion/stockout):** NOT fired. `active_milestone != null` (M1), so 8a/8b don't apply.
  M2 stays `todo`. Pivoting to M2 now would require closing M1 with 3 open children = cancelling/reassigning
  founder-owned work (a roadmap edit outside N-1 authority).
- **Action 9 (daily-checkpoint):** NOT fired. Precondition "Action 7 found no seed candidate" fails (a seed
  candidate exists). Gate fails on first conjunct.
- **Action 10 (routing):** no proposals fired → nothing to route.

## Disposition rationale (the call)

**Option A — keep M1 `in_progress`; seed wave-6 with `da242f6b`.** This is the only path consistent with
both the milestone invariants AND the founder's harden-then-core direction ("do the hardening, THEN M2").
The hardening engineering is complete this wave (rate-limit 429 LIVE, version fix, CI hardening,
branch-protection); `da242f6b` is M1's last engineering loose end — unblocked, shippable now. The two
founder-ops children (`a1299e88` DNS, `84e09891` creds) stay tracked under M1 and the founder is reminded;
they are FOUNDER-blocked with no engineering path to close this wave. NOT pivoting to M2: that needs M1
closed, which needs the founder to complete or explicitly cancel/defer the two ops items — a future
strategic call, not one forced now. No new strategic decision → not routed to founder/BOARD. head-next
APPROVED.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 5a6efc9e-9de7-4594-a75d-d45e30d9a417 (M1, in_progress)"
  - "todo queue head: 41e61975 (M2 — Servers, channels & membership)"
  - "active child tasks: open=3 done=10 seed_candidates=1"
  - "unassigned queue depth: 1"
  - "closure: none (open_count=3 != 0; invariant 3 blocks in_progress->done)"
  - "promotion: none (M1 stays in_progress)"
  - "decomposition fired: false (seed_candidates=1, not 0)"
  - "rituals fired: []"
prev_wave: 5
active_milestone_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
active_milestone_child_summary:
  open: 3
  done: 10
  seed_candidates: 1
next_todo_id: 41e61975-c92e-49b1-9ae5-45498dd04925
unassigned_queue_depth: 1
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 5a6efc9e-9de7-4594-a75d-d45e30d9a417
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: >
  M1 disposition = Option A (keep in_progress; seed wave-6 = da242f6b, the sole engineering seed candidate).
  Two founder-ops children (a1299e88 Resend DNS, 84e09891 Railway Bucket creds) remain tracked under M1 —
  FOUNDER actions, no engineering path to close this wave. M1 cannot reach done until both terminalize;
  a future N-1 (after da242f6b ships) will face the same closure block — at that point the founder completes
  the ops actions or explicitly cancels/defers them (roadmap-planning call) to unblock M1->done + promote M2.
  No strategic call made now; not routed to founder/BOARD. head-next APPROVED N-1.
```

head_signoff (head-next): APPROVED — survey from live psql (stale-state-read avoided); trigger ladder
walked correctly; closure blocked by invariant 3 (premature-close avoided); decomposition suppressed
(seed exists; bundle-bloat avoided); no founder/BOARD route (no strategic call).
