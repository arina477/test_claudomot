# N-1 — Survey & triggers (wave-66)

Block: N (Next). Stage: N-1. Mode: `automatic`. STATUS: RUNNING (at entry).

## Survey signals (Actions 1–4)

**Action 1 — active milestone:** exactly one `in_progress` row → M12 "Offline-first moat" (`36378340-0ea5-428e-bc94-03750fb103f6`). No invariant violation (≤1 active).

**Action 2 — todo queue:** M9 (Monetization: freemium tiers), M10 (Compliance & data rights), M11 (Growth: server discovery), M13 (Institution partnerships & portable identity) — all `status='todo'`. No promotion possible while M12 holds the active slot (invariant 2: prior active must reach `done`/`cancelled` first).

**Action 3 — M12 child summary:** `open=1  done=10  seed_candidates=0`.
- The 10 done children cover the entire offline READ path: messages, DM list + threads, assignments, class schedule, attachment-media blobs (read-through), cold-offline workspace hydration, empty-state copy polish.
- The single open child is `10e7543f` "Serve assignment attachment media from offline cache when disconnected" — `status='blocked'`, `parent_task_id IS NULL`, `wave_id IS NULL`. Because it is `blocked` (not `todo`), it is NOT a seed candidate. It is blocked on a non-existent *online* assignment-attachment view surface (AssignmentCard renders only a paperclip count + filename chips; there is no byte-render path to degrade offline). Un-buildable as-is.

**Action 4 — unassigned queue depth:** 14 (`status='todo' AND milestone_id IS NULL`).

## Trigger evaluation (Actions 6–10)

**Action 6 — closure check:** M12 `open_count = 1` (the BLOCKED `10e7543f`), so M12 does NOT auto-close on `open_count = 0`. LLM scope judgment: the READ-path scope of the `## Scope` line is shipped (all offline-content-access surfaces reachable cold). BUT the `## Success metric` still literally names *"a clear conflict-resolution UI reconciles on reconnect with zero data loss."* That clause is unbuilt and has no task. Closure invariant 3 (all children terminal AND scope-shipped-per-prose) is NOT satisfied. **Do NOT unilaterally close M12; do NOT reword the founder-directive success metric.** → fall through to Action 7.

**Action 7 — per-wave decomposition trigger:** `active_milestone` exists AND `seed_candidates = 0` AND scope not fully shipped → decomposition would fire. BUT the only unshipped clause — conflict-resolution UI — is **ill-posed**: StudyHall's offline writes today are an append-only message-send outbox, so genuine two-place EDIT conflicts do not arise. There is no offline-EDIT surface for a conflict-resolution UI to reconcile. A `milestone-decomposer` spawn against this clause would return `incomplete-scope` (milestone prose cannot yield a coherent, buildable bundle without first inventing a net-new offline-EDIT surface). Per Action 7 + the DEFERRED conditions: **an incomplete-scope decomposition under autonomous mode ESCALATES.**

**Escalation routing (Action 10 + automatic-mode.md + board-process.md):** this is a strategic **milestone-disposition** fork, not a mechanical scope-completion call. Two options:
- **Option A** — declare the offline-first moat SHIPPED at read-path completeness; defer/rehome the conflict-resolution-UI clause to a future milestone/horizon (pending an offline-edit surface); transition M12 → done; promote the next todo milestone.
- **Option B** — invest in a net-new offline-EDIT surface first so conflict-resolution becomes well-posed (a significant net-new product-direction build).

Determination — **FOUNDER-RESERVED, not BOARD-resolvable:**
1. `automatic-mode.md` § Routing thresholds enumerates BOARD-resolvable escalations (P-0 EXPAND/REDUCE/RECONSIDER, P-1 monolith, D-cap, V-3 cap, daily-checkpoint). A milestone-disposition that **redefines a founder-directive success metric** (Option A rewords/defers the founder-authored clause) or **commits to a net-new horizon build** (Option B) is NOT in that table. Per the same file: "Everything NOT in this table stays as-is" + § Precedence "Hard-stops always prompt regardless of flag."
2. The `## Success metric` carries the explicit founder-directive stamp ("Working target set … on founder directive 'Offline-first moat'; founder can adjust anytime") — adjustment authority is founder-reserved.
3. CLAUDE.md rule 17 makes milestone priorities + product-scope/direction-with-cost-consequences founder-facing polls, not technical defaults. Option B is a net-new product-direction investment with cost consequences; Option A retires a founder-directive success clause.
4. Independent corroboration: ceo-reviewer (wave-66 P-0), head-next (wave-65), and L-1 (wave-66) all flagged this as a FOUNDER-facing disposition. Under a hypothetical BOARD, founder-proxy would be forced to `HARD-STOP: must be human — no founder precedent` (no product-decisions entry resolves the offline-EDIT-surface question), which per `conflict-resolution.md` § Hard-stop escalates regardless of vote math anyway.

**Route: FOUNDER + PAUSE the loop** on a measured structural hard-stop (rule-13 trigger `d`): M12 has no buildable seed and advancing requires a founder scope decision. This is measured, NOT preemptive — the firing condition is a concrete Action-7 incomplete-scope escalation that the mode file routes to founder, not an anticipatory "natural break."

**Action 8 — promotion / stockout:** NOT fired. M12 is not closed (Action 6), so the active slot is occupied; no promotion. `todo` milestones exist (M9/M10/M11/M13), so no stockout cascade.

**Action 9 — daily-checkpoint:** NOT fired as an independent ritual. Although `unassigned_queue_depth > 0` and no seed candidate exists, the pending state is a founder-reserved milestone-disposition (routed above), not a checkpoint bucket; the founder-facing digest authored at N-3 carries the disposition. Firing a separate checkpoint would double-surface the same decision.

## Deliverable

```yaml
n_stage_verdict: DEFERRED              # milestone-disposition deferred to founder (autonomous incomplete-scope escalation)
verdict_evidence:
  - "active milestone: 36378340-0ea5-428e-bc94-03750fb103f6 (M12, in_progress)"
  - "todo queue head: M9/M10/M11/M13 exist (promotion gated on M12 transition)"
  - "active child tasks: open=1 done=10 seed_candidates=0"
  - "unassigned queue depth: 14"
  - "closure: none (open_count=1 BLOCKED child; success-metric conflict-resolution-UI clause unbuilt)"
  - "promotion: none (active slot occupied by M12)"
  - "decomposition fired: false (would return incomplete-scope; ill-posed conflict-resolution clause)"
  - "rituals fired: [] — milestone-disposition escalated to founder"
prev_wave: 66
active_milestone_id: 36378340-0ea5-428e-bc94-03750fb103f6
active_milestone_child_summary:
  open: 1
  done: 10
  seed_candidates: 0
next_todo_id: null    # M9/M10/M11/M13 exist but promotion is gated on M12 transitioning first
unassigned_queue_depth: 14
state_transitions_applied: []          # none — M12 disposition is founder-reserved
slot_promotion:
  promoted_id: null
  prior_active_id: 36378340-0ea5-428e-bc94-03750fb103f6
decomposition_fired: false
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: 36378340-0ea5-428e-bc94-03750fb103f6, reason: decomposition-needed, decision: not-fired-incomplete-scope-escalated, by: head-next, fired_at: 2026-07-06}
  - {ritual: milestone-disposition, target_milestone: 36378340-0ea5-428e-bc94-03750fb103f6, reason: seed-scarcity-ill-posed-remaining-clause, decision: escalated-to-founder, by: head-next, fired_at: 2026-07-06}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "would return incomplete-scope — remaining M12 clause (offline conflict-resolution UI) is ill-posed; no offline-EDIT surface exists (writes are append-only outbox). Under autonomous, incomplete-scope escalates.", decision: escalated, by: head-next}
  - {ritual: milestone-disposition, outcome_summary: "Founder-reserved fork Option A (declare moat shipped at read-path completeness, defer conflict-resolution clause, close M12, promote next) vs Option B (build net-new offline-EDIT surface first). Not in automatic-mode BOARD table; success metric is founder-directive; rule 17 reserves it. Routed to founder; loop pauses.", decision: escalated-to-founder, by: head-next}
loop_state: paused
note: "M12 seed-scarcity disposition is a founder-reserved strategic fork (measured structural hard-stop, rule-13 trigger d). N-2 emits queue-exhausted; N-3 closes wave-66 cleanly and writes the founder pause + disposition digest."
```

## head-next gate

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (seed_candidates=0 confirmed by SQL, not a
    sidecar). Exactly one trigger path resolved: decomposition would fire but returns incomplete-scope
    on the ill-posed conflict-resolution clause, which under automatic mode escalates. The escalation is
    correctly classified as a founder-reserved milestone-disposition (not a BOARD-resolvable
    scope-completion call): the automatic-mode routing table does not list milestone-disposition that
    redefines a founder-directive success metric, rule 17 reserves product-direction-with-cost, and the
    success metric carries the founder-directive adjustment reservation. No unilateral M12 close, no
    success-metric reword. Pause is measured (Action-7 incomplete-scope → founder route), not
    anticipatory. All survey signals captured; no invariant violations.
  next_action: PROCEED_TO_N-2
```
