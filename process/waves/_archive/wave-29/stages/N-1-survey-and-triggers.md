# N-1 — Survey & triggers (wave-29)

Mode: **automatic**. head-next gate: **APPROVED**.

## Survey phase (Actions 1–5)

### Action 1 — Active milestone
`SELECT id, title, status FROM milestones WHERE status='in_progress'` → exactly one row:
- `a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d` — "M5 — Academic tooling: assignments" — in_progress.

No invariant violation (single in_progress row).

### Action 2 — `todo` queue
8 `todo` milestones exist. Head-of-queue (highest-tier next): **M6 — Voice/video study rooms** (`8702a335-90ec-40ff-8c7d-a91bb7790a27`). No stockout → roadmap-planning does NOT fire.
`next_todo_id = 8702a335` (not promoted this wave — M5 still active).

### Action 3 — M5 open child-task summary
```
open_count=6  done_count=12  seed_candidates=0
```
All 6 open tasks are NON-seed (each carries `wave_id` or `parent_task_id`):
- 4b397de0 / 6f257c82 / 3ad35a42 — assignments polish (wave 7ad7878b)
- 72cb6ebb — stale manage_channels sweep (wave e894f8a9)
- 226c7e42 — integration-tier hardening (wave 60734a7e)
- fdb444fc — extend presence dots (parent 10b9d18e; re-homed M3 debt, not M5-scope-advancing)

Seed d23a0740 (this wave's presence/members code-debt) = **done** (shipped, wave_id=92df2295).

### Action 4 — Unassigned queue depth
`SELECT count(*) FROM tasks WHERE status='todo' AND milestone_id IS NULL` → **5**
(67881a58 Playwright-chromium, 4e994e96 biome-warnings, 4a92327c ParseUUIDPipe, 875b97f4 security-hardening, ee6421a7 mention-tokenizer — all cross-cutting, none M5-scope-advancing).

## Trigger phase (Actions 6–10)

### Action 6 — Closure check
`active_milestone` exists AND `open_count=6 ≠ 0` → **M5 does NOT close**. Stays in_progress. No premature milestone close (unshipped AC = reminders arc).

### Action 7 — Per-wave decomposition trigger — **FIRED**
`seed_candidates=0` AND LLM judges M5 `## Scope` NOT shipped (the due-date reminders arc — cron + NotificationsModule via Resend — remains unbuilt) → decomposition fires with reason `decomposition-needed`.

Routed per Action 10 (automatic): spawned `milestone-decomposer` sub-agent inline, caller-mode `next-bundle`, active milestone M5.

**Result: `incomplete-scope`** (sub-agent independently re-verified the DB; made ZERO writes). Rationale returned by decomposer:
- M5's `## Scope` has 4 arcs; 3 shipped (assignment post, view + mark to-do/done, sort by due date — wave-22). The ONLY unbuilt `## Scope` item is the **due-date reminders arc**, blocked on a **Resend API key** (account-issued third-party credential; brain cannot self-generate per always-on rule 6).
- The 6 open M5 tasks are already-parented follow-ups (not fresh top-level seeds). Authoring filler = bundle-bloat / out-of-ritual INSERT → refused.
- No buildable, coherent, milestone-scope-advancing bundle exists without the founder's credential.

### Action 8 — Slot promotion / stockout
`active_milestone != null` (M5 still active, not closed at Action 6) → no promotion. No stockout (todo milestones exist) → roadmap-planning does NOT fire.

### Action 9 — Daily-checkpoint
Buildable unassigned work exists (depth 5) but is NOT M5-scope-advancing. Decomposition already fired and returned incomplete-scope; the higher decomposition trigger + founder-reserved disposition supersede a checkpoint. Not fired (the pause carries the founder-facing surface).

### Action 10 — Routing (automatic)
Decomposition `incomplete-scope` whose resolution is a **founder-reserved milestone disposition** (park M5 / supply Resend key / pivot to M6) → per milestone-decomposition-ritual § Mode routing under automatic, this is a hard-stop requiring founder action. The park-or-key fork is already surfaced (founder-digest 2026-07-01, Path A / Path B) and pending — this is the 8th/9th consecutive under-floor M5-debt wave.

Escalation is a genuine MEASURED hard-stop (decomposer `incomplete-scope` verdict + founder-pending A/B disposition), NOT a preemptive/anticipatory pause.

---

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16 (M5, in_progress)"
  - "todo queue head: 8702a335 (M6 voice/video)"
  - "active child tasks: open=6 done=12 seed_candidates=0"
  - "unassigned queue depth: 5"
  - "closure: none (open=6≠0, M5 stays in_progress)"
  - "promotion: none (M5 still active)"
  - "decomposition fired: true → returned incomplete-scope (no DB writes)"
  - "rituals fired: [milestone-decomposition → incomplete-scope]"
prev_wave: 29
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 6
  done: 12
  seed_candidates: 0
next_todo_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
unassigned_queue_depth: 5
state_transitions_applied: []
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: a5232e16, reason: decomposition-needed, decision: incomplete-scope, by: milestone-decomposer, fired_at: "2026-07-01T18:20:00Z"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "incomplete-scope — sole unbuilt M5 scope (reminders arc) is Resend-credential-blocked; no buildable bundle; no DB writes", decision: incomplete-scope, by: milestone-decomposer}
loop_state: paused
head_signoff:
  verdict: APPROVED
  stage: N-1
  rationale: "Next-claimable from live DB (not sidecar); exactly one trigger (decomposition) with cited condition; incomplete-scope correctly routes to founder-reserved pause; no premature M5 close (open=6); no stockout (todo milestones exist)."
note: "Founder-reserved milestone disposition (Path A supply Resend key / Path B pivot M6) — hard-stop pause. NOT preemptive."
```
