# N-1 — Survey & triggers (wave-8 close-out)

> Block: N (Next). Stage N-1 of N-1 → N-2 → N-3. Mode: automatic. head-next gating.
> Active milestone: M2 — Servers, channels & membership (`41e61975-c92e-49b1-9ae5-45498dd04925`, in_progress).

## Survey phase (Actions 1–4)

### Action 1 — Active milestone
One row: **M2** (`41e61975-c92e-49b1-9ae5-45498dd04925`), `in_progress`. No invariant violation (exactly one `in_progress`).

### Action 2 — `todo` queue head
11 `todo` milestones (M3, M4, M5, M6, M7, M8, M9, M10, M11, M12, M13). `next_todo_id` not needed this tick — active slot is occupied (M2 in_progress), so no promotion fires.

### Action 3 — Active milestone child summary
```
open_count = 6 | done_count = 8 | seed_candidates = 6
```
- 8 done: server CRUD + create-server API + owner membership, default channels/category seed, list-my-servers + server-detail read APIs, rail/sidebar/create-server wiring, + the 4 wave-8 invites/join tasks (all LIVE).
- 6 open, ALL top-level (`parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`) → all 6 satisfy the seed-candidate predicate.
  - test/E2E follow-ups (created 17:27, V-2 batch): `46f16288` create-server E2E, `4a2ad286` prod verified-fixture, `25523fb0` real-Postgres rollback test.
  - wave-8 L drift follow-ups (created 19:11): `08ff762f` invite_code backfill, `5331b7d5` share-modal-permanent-default, `863c10ef` invite-revoke endpoint+UI.

### Action 4 — Unassigned queue depth
`0`. No daily-checkpoint trigger (Action 9 requires depth > 0).

## Trigger phase (Actions 6–10)

### Action 6 — Closure check
M2 NOT closed. `open_count = 6 ≠ 0`, and LLM judges M2 `## Scope` NOT shipped: RBAC/roles (success-metric "see the right channels per role"), kick/ban, and server-settings page remain unbuilt. M2 stays `in_progress`.

### Action 7 — Per-wave decomposition trigger — DID NOT FIRE (correctly)
Action 7's firing precondition is `seed_candidates = 0`. Measured `seed_candidates = 6 ≠ 0`. Per the milestone-decomposition ritual Step 1 condition 4 and roadmap-lifecycle § Bundles (V-2/D-3 follow-ups always INSERT `parent_task_id = NULL` and "become candidate seeds for future waves"), the 6 open follow-ups ARE legitimate seed candidates. Decomposition is therefore a contractual NO-OP this wave.

A milestone-decomposer was spawned (mandatory in-stage spawn under automatic) to author an RBAC bundle; it returned `validation-failed` — correctly refusing, because authoring an RBAC seed while 6 candidates exist would be an out-of-ritual force-INSERT producing a 7th seed that N-2's oldest-`created_at` ordering would not even pick. No DB writes by the decomposer.

The genuine remaining question is an **N-2 seed-ordering call** over the existing candidates (which slice next), which N-2 grants the LLM authority over. Because the strategically-coherent ordering (deprioritize the oldest test follow-ups in favor of finishing the LIVE invite slice) is a contested scope-priority decision, it was routed to BOARD per automatic-mode routing (4+/7).

### Action 8 — Slot promotion / stockout cascade
Not applicable. `active_milestone != null` (M2 in_progress); no promotion, no stockout. 11 `todo` milestones exist — no roadmap-planning.

### Action 9 — Daily-checkpoint
Not fired. `unassigned_queue_depth = 0`.

### Action 10 — BOARD decision (scope-priority routing)
Decision slug: `N-1-seed-priority-wave-9`. Option A (invite-completion bundle: seed `863c10ef` invite-revoke + siblings `08ff762f` backfill + `5331b7d5` share-modal-default).
**Tally: 5 APPROVE / 1 ABSTAIN / 1 REJECT → passes 4+/7. ADOPTED.**
- strategist APPROVE, risk-officer APPROVE, user-advocate APPROVE, industry-expert APPROVE, founder-proxy APPROVE; realist ABSTAIN (lean APPROVE); counter-thinker REJECT.

Reconciliation applied (authorized N-1 ordering reconciliation, per the logged wave-5 precedent): re-parented `08ff762f` + `5331b7d5` under seed `863c10ef` so N-2's single-seed pick handles them as one bundle. Remaining top-level seed candidates after re-parent: 4 (3 test follow-ups + the invite-revoke seed). N-2 is directed to pick `863c10ef` (BOARD ordering), not the oldest-`created_at` test follow-up.

Binding conditions carried to wave-9 (from BOARD dissents):
1. RBAC is wave-10's seed, unconditionally (M2 success-metric "per role" clause).
2. P-3 must spec the invite_code backfill as idempotent + collision-safe vs `UNIQUE(invite_code)`, CSPRNG, committed migration (not auto-migrate-on-boot).
3. Invite-revoke must surface an honest revoked-link affordance + server-side authorization (no client-supplied trust).

Decision logged: `command-center/product/product-decisions.md` (committed).

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 41e61975-c92e-49b1-9ae5-45498dd04925 (M2, in_progress)"
  - "todo queue head: n/a (active slot occupied; 11 todo milestones)"
  - "active child tasks: open=6 done=8 seed_candidates=6"
  - "unassigned queue depth: 0"
  - "closure: none (M2 scope not shipped — RBAC/kick-ban/server-settings remain)"
  - "promotion: none"
  - "decomposition fired: false (seed_candidates=6 != 0 → ritual NO-OP; decomposer returned validation-failed, correctly)"
  - "rituals fired: [] ; BOARD convened: N-1-seed-priority-wave-9 (5-1-1 APPROVE Option A)"
prev_wave: 8
active_milestone_id: 41e61975-c92e-49b1-9ae5-45498dd04925
active_milestone_child_summary:
  open: 6
  done: 8
  seed_candidates: 6
next_todo_id: null
unassigned_queue_depth: 0
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 41e61975-c92e-49b1-9ae5-45498dd04925
decomposition_fired: false
proposals_fired: []
board_decisions:
  - slug: N-1-seed-priority-wave-9
    option: "Option A — invite-completion bundle (seed 863c10ef + siblings 08ff762f, 5331b7d5)"
    tally: "5 APPROVE / 1 ABSTAIN / 1 REJECT"
    outcome: ADOPTED
    by: BOARD (automatic)
    binding_conditions:
      - "RBAC is wave-10 seed, unconditionally"
      - "P-3 specs invite_code backfill idempotent + collision-safe vs UNIQUE, committed migration"
      - "invite-revoke: honest revoked-link affordance + server-side authorization"
ritual_outcomes:
  - ritual: milestone-decomposition
    outcome_summary: "validation-failed — seed_candidates=6 (ritual fires only at 0); RBAC NOT authored this wave (out-of-ritual INSERT avoided)"
    decision: no-op
    by: milestone-decomposer sub-agent
reconciliation_applied:
  - "re-parented 08ff762f, 5331b7d5 under seed 863c10ef (N-2 single-seed bundle shape)"
loop_state: ready
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: { board: "5 APPROVE / 1 ABSTAIN / 1 REJECT on N-1-seed-priority-wave-9" }
  failed_checks: []
  rationale: >
    All survey signals captured from live Postgres (not a sidecar). Exactly one trigger
    outcome resolved: decomposition correctly did NOT fire (seed_candidates=6 != 0 — firing
    would be an out-of-ritual force-INSERT; the decomposer's validation-failed return is the
    correct contract-honoring result). M2 closure correctly withheld (scope unshipped). The
    contested seed-ordering call was routed to BOARD and passed 4+/7 with binding conditions
    propagated. No invariant violations, no stale-state read, no preemptive pause. Pipeline
    flows: wave-9 seed exists and is selected.
  next_action: PROCEED_TO_N-2
note: "Brief premise (M2 next FEATURE seed null → decomposition-pending) corrected against live DB: queue holds 6 valid seed candidates, so decomposition is a no-op; wave-9 seeds from the BOARD-adopted invite-completion bundle. RBAC carried to wave-10 as a binding condition."
```
