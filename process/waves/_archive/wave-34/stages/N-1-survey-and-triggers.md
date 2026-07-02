# N-1 — Survey & triggers (wave-34)

> Block: N (Next), stage N-1 (survey + triggers). Owner: head-next (spawn-pattern). Mode: automatic.
> Wave-34 — screen-share + audio-only fallback shipped + PROVEN-LIVE (M6 completing slice).

## Survey phase (Actions 1–4)

| Action | Signal | Value |
|---|---|---|
| 1 — active milestone | `status='in_progress'` (at entry) | M6 (8702a335) — Voice/video study rooms |
| 2 — todo queue head | highest-tier `todo` | **M7 (6e2f68d8)** — Privacy controls, notifications & launch polish (only remaining H1; MVP-completing; credential-independent). Full queue: M7, M8, M9, M10, M11, M12, M13. |
| 3 — M6 child summary | open / done / seed_candidates | **open=0, done=6, seed_candidates=0** |
| 4 — unassigned queue depth | `milestone_id IS NULL AND status='todo'` | 12 |

M6 done tasks (6): token-mint service, minimal client join surface, who's-in-room occupancy, voice-endpoint param-hardening, **screen-share publish/subscribe**, **audio-only low-bandwidth fallback**.

## Trigger phase (Actions 6–10)

### Action 6 — M6 closure check → CLOSE

- Condition: `active_milestone` exists AND `open_count=0` AND LLM-judged scope shipped.
- M6 `## Success metric`: "Students drop into a Study Room voice channel, talk + screen-share, and the room degrades to audio-only gracefully on poor bandwidth."
- Metric MET (all 3 components have shipped done tasks, head-verifier V-3 confirmed PROVEN-LIVE): talk (w31 token-mint + join, w32 occupancy, w33 param-hardening) + screen-share (w34) + audio-only fallback (w34).
- **Transition applied:** `UPDATE milestones SET status='done' WHERE id='8702a335…'` → `in_progress → done`.
- Decision-log entry appended (`command-center/product/product-decisions.md`).
- Residual non-metric M6 scope (speaking/voice-presence rings, mic/cam-toggle refinement) — never decomposed into open child tasks; nothing to dispose. Future work under a re-opened/successor milestone, not blocking the close.
- `active_milestone` set to null for subsequent actions.
- **Not premature** (anti-pattern "premature milestone close" checked): every AC shipped + independently V-3-verified LIVE.

### Action 8 — Slot promotion → PROMOTE M7

- `active_milestone == null` after Action 6; `next_todo_id = M7 (6e2f68d8)`.
- **8a. Promote:** `UPDATE milestones SET status='in_progress' WHERE id='6e2f68d8…'` → `todo → in_progress`. Decision-log entry appended.
- Milestone invariant holds: exactly one `in_progress` = M7 (verified `in_progress_count=1`).
- `active_milestone` set to M7. Re-evaluate Action 7 against M7.
- **8b. Stockout cascade:** N/A — `next_todo_id != null` (M7..M13 exist). Roadmap-planning NOT fired.

### Action 7 — Per-wave decomposition for M7 → FIRED

- Survey of M7's existing tasks (divergence from brief's "M7 empty" assumption — found + handled):
  - M7 has **2 existing open tasks**, both credential-blocked founder-ops actions, both PARKED (todo, untouched):
    - `a1299e88` "Verify a Resend domain" — founder DNS action; parent NULL/wave NULL (structurally a seed candidate, but a founder-ask that would stall the loop).
    - `84e09891` "Set Railway Bucket creds" — founder ops action; mis-parented (parent_task_id → `839af17f`, a DONE M2 task) — orphan sibling, not a valid seed.
  - M7's credential-INDEPENDENT launch-polish core (settings-privacy page, notifications polish, Sentry, privacy/terms stubs, empty/error/loading states) had **no buildable seed candidate**.
- **Judgment (project-manager consulted, delegation rubric row 3):** picking either existing task as the wave-35 seed stalls the autonomous loop on a founder credential ask — the pipeline-stall / stranded-founder-ask failure mode. M7's actual buildable scope is unshipped and unseeded → decomposition fires to author a fresh credential-independent bundle. Verdict confirmed both existing tasks are blocked; parking them (untouched) is correct; firing decomposition is the right call.
- **Fired** milestone-decomposition (reason `decomposition-needed`, caller_mode `next-bundle`) via `milestone-decomposer` sub-agent inline (automatic mode). Returned `decomposition-complete`.
- Bundle authored (all `wave_id=NULL`, `milestone_id=M7`, `status='todo'` — wave-32 lifecycle defect NOT present):
  - **seed** `56a50862` — Build settings-privacy page: profile visibility + who-can-DM gating (the ## Success-metric-load-bearing piece).
  - sibling `a4169fac` — Add account data view + data download request to settings-privacy.
  - sibling `d40ece71` — Wire Sentry error tracking across api + web (sequenced before final deploy-verify).
  - sibling `13b7ebfd` — Add privacy/terms stub pages + empty/error/loading states across surfaces.
  - est ~2,800 net LOC (within 1,500–5,000 rubric); 1 seed + 3 siblings.
- Decomposer decision-log entry committed (`chore(roadmap): bundle for M7 — 4 tasks`, commit c01d590).

### Action 9 — Daily-checkpoint → NOT FIRED

- Condition requires "no seed candidate found AND decomposition not fired". Decomposition fired this tick (seed now exists). Not fired.

### Action 10 — Route proposals per mode (automatic)

- milestone-decomposition → spawned `milestone-decomposer` inline (per automatic-mode table). Applied.
- roadmap-planning → not fired (queue non-empty).
- daily-checkpoint → not fired.

## Deliverable footer

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone (entry): 8702a335 (M6, in_progress)"
  - "todo queue head: 6e2f68d8 (M7)"
  - "active child tasks: open=0 done=6 seed_candidates=0"
  - "unassigned queue depth: 12"
  - "closure: M6 in_progress→done (metric MET, V-3-verified LIVE)"
  - "promotion: 6e2f68d8 (M7) todo→in_progress"
  - "decomposition fired: true (M7 first launch-polish bundle — seed 56a50862 + 3 siblings)"
  - "rituals fired: [milestone-decomposition]"
prev_wave: 34
active_milestone_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
active_milestone_child_summary:
  open: 6              # 2 parked credential-blocked + 4 new bundle (post-decomposition)
  done: 0
  seed_candidates: 2   # a1299e88 (parked, blocked) + 56a50862 (new buildable) — N-2 picks the buildable one
next_todo_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4   # M8 (next after M7 promoted)
unassigned_queue_depth: 12
state_transitions_applied:
  - {milestone: "M6 (8702a335)", from: in_progress, to: done, recorded_in_decisions_log: true}
  - {milestone: "M7 (6e2f68d8)", from: todo, to: in_progress, recorded_in_decisions_log: true}
slot_promotion:
  promoted_id: 6e2f68d8-dd04-44c5-b2e1-b9c6f28e9007
  prior_active_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
decomposition_fired: true
proposals_fired:
  - {ritual: milestone-decomposition, target_milestone: "6e2f68d8 (M7)", reason: decomposition-needed, decision: applied, by: milestone-decomposer, fired_at: "2026-07-02"}
ritual_outcomes:
  - {ritual: milestone-decomposition, outcome_summary: "decomposition-complete — seed 56a50862 + 3 siblings (a4169fac, d40ece71, 13b7ebfd), ~2800 LOC", decision: applied, by: milestone-decomposer}
loop_state: ready
note: >
  M6 CLOSED (voice complete — Discord-displacement wedge done). M7 PROMOTED + first bundle
  decomposed. Two pre-existing M7 tasks (Resend domain, Railway Bucket) are credential-blocked
  founder-ops actions, PARKED untouched (todo, not seeded — would stall the loop). N-2 re-orders
  to pick the buildable seed 56a50862 over the older blocked a1299e88 per N-2 Action 1 authority.

head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {project-manager: "confirmed both existing M7 tasks credential-blocked; park + decompose is correct"}
  failed_checks: []
  rationale: >
    Every N-1 exit checkbox ticked from live Postgres state (not sidecar). M6 closure is
    metric-verified (all 3 success-metric components shipped + V-3 PROVEN-LIVE; open_count=0) —
    not premature. M7 promotion is the highest-tier todo, invariant holds (exactly one
    in_progress). Decomposition correctly fired for M7's unshipped credential-independent core
    after confirming (project-manager) that the two pre-existing M7 tasks are founder-credential-
    blocked and must be parked, not seeded — avoiding the pipeline-stall/stranded-founder-ask
    failure mode. Fresh bundle carries wave_id=NULL (wave-32 defect absent). No pause trigger
    fired (STATUS RUNNING, no .loop-paused/.loop-resume, no founder message, DB reachable).
  next_action: PROCEED_TO_N-2
```
