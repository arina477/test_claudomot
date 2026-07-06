# N-1 — Survey & triggers (wave-53)

Owner: head-next (N-block, automatic mode). Read from live Postgres (`founder_bets` / `milestones` / `tasks` / `waves`) — no sidecar/bash-var hand-off.

## Survey phase (Actions 1–4)

- **Action 1 — active milestone:** `84e17739-af5e-4396-beb9-b6f3d6836fc4` "M8 — Educator tools & deeper academics" (`in_progress`). Exactly one `in_progress` row — no invariant violation.
- **Action 2 — todo queue:** M9 Monetization → M10 Compliance & data rights → M11 Growth: server discovery → M12 Offline-first moat → M13 Institution partnerships. `next_todo_id` = M9 `3e507bc0` (highest-tier head). Queue non-empty → no stockout risk.
- **Action 3 — M8 child summary:** `open=8, done=34, seed_candidates=8`.
- **Action 4 — unassigned queue depth:** `13`.

### M8 open seed candidates (all top-level, `parent_task_id IS NULL`, `wave_id IS NULL`, `status='todo'`), by created_at:

| # | id8 | title (abbrev) | class |
|---|---|---|---|
| 1 | f8eb49c1 | Unit-test buildTypingLabel transition table | test |
| 2 | a1dda389 | Harden delete-any-message E2E (2-client fan-out hard assertion) | test hardening |
| 3 | 5bcbd27f | DM off-token surface substitutions | polish |
| 4 | c5051444 | DM: LIMIT/pagination for getDmCandidates (large-server scale) | hardening |
| 5 | 874bd233 | DM: /dm/candidates throttle + 429 backoff | hardening |
| 6 | 344eabde | DM privacy: who_can_dm='server-members' positive-control integration case | security/privacy |
| 7 | ff09c4c9 | DM→server return nav (exit dmHomeActive) | correctness |
| 8 | **c52a7a52** | **App-wide sweep: UUID-format guard to all remaining client uuid-cast sites (info-disclosure)** | **security — NEW this wave** |

## Trigger phase (Actions 6–10)

### Action 6 — Active milestone closure check → NONE (M8 stays in_progress)
`open_count = 8 ≠ 0` blocks mechanical closure. **LLM scope judgment:** M8 `## Scope` (Educator/Facilitator role + light moderation, assignment collect/return, class scheduling, study-group tools [timers/Pomodoro/sessions/whiteboard], direct + group DMs, message search) and `## Success metric` (a class cohort runs coursework end-to-end without Discord fallback; first slice DM+group messages) are **SHIPPED** — the headline slices (educator role, assignment collect/return, scheduling, study-group tools incl. joinable focus room w52, DMs) sit among the 34 done tasks across waves 49–53. The 8 open rows are a **polish + security/scale hardening tail** carrying **no net-new headline scope**. Same disposition as wave-52 N-1. Verdict: keep `in_progress`, drain the tail wave-by-wave (security-first). No `UPDATE milestones`.

### Action 7 — Per-wave decomposition trigger → NOT FIRED
`seed_candidates = 8 ≠ 0`. A seed already exists; N-2 will pick it. No milestone-decomposer spawn.

### Action 8 — Slot promotion + stockout cascade → NONE
`active_milestone != null` → no promotion path. `next_todo_id != null` (M9-M13 present) → no stockout, no roadmap-planning.

### Action 9 — Daily-checkpoint → NOT FIRED
Requires (seed candidate absent) AND (unassigned>0) AND (no stockout). Seed candidates = 8 present → gate fails on first clause. No checkpoint.

### Action 10 — Route proposals per mode → NO PROPOSALS
No ritual fired this tick → nothing to route. (Mode = `automatic`; had decomposition fired it would spawn `milestone-decomposer` inline.)

## Disposition → N-2 seed priority

Continue the **security-first drain** established at wave-52 N-1. Seed decision: **`c52a7a52` — App-wide UUID-format-guard sweep.**

Rationale (renders my head-next call, not the survey's recommendation blindly):
1. **Direct continuation of wave-53.** wave-53 closed the one *verified*-leaking site (`study-room.gateway.ts`) and shipped a reusable UUID-format guard + generic-error-mapping mechanism. `c52a7a52` applies that same mechanism app-wide to the *not-yet-verified* sites of the same info-disclosure class (same class as the wave-23 inherited non-UUID `:serverId → 500`). No new mechanism — pure reuse of what just shipped and is proven live.
2. **Security-highest-value** among the 8 — closes an info-disclosure vulnerability *class* app-wide vs. the DM polish/scale/test stragglers.
3. **Freshness efficiency:** the guard pattern and the audited sites are freshest in the codebase now (guard shipped hours ago, `created_at 2026-07-05 22:37:59` — newest of the 8, authored this wave as the mvp-thinner THIN split from wave-53 P-0). Shipping the sweep while the pattern is live is cheaper than re-deriving it later.
4. **Un-entangled single seed** preferred over a themed bundle: the sweep is a cross-cutting audit-and-remediate with an unknown number of sites; bundling it with unrelated DM work would blur its security scope and risk bundle bloat. The DM-scale pair `c5051444`+`874bd233` (shared `/dm/candidates`) remains a natural *later* 2-task bundle — deferred, not picked now.

Second choice was `344eabde` (DM privacy positive-control) — also security-class, but narrower (one integration case) and not the direct wave-53 continuation. `c52a7a52` wins on continuity + blast-radius.

**Bundle shape:** single-seed (0 siblings). Confirmed: `c52a7a52` has `parent_task_id IS NULL` and 0 children with `status='todo' AND wave_id IS NULL`.

## Pause check
Mode `automatic`; STATUS `RUNNING`; no `.loop-paused.yaml` / `.loop-resume.yaml`; no gate hard-stop, no monitor wait, no founder message, no STATUS change. **No measured trigger (b/d/e/f) fires → loop CONTINUES.** No anticipatory pause.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: 84e17739-af5e-4396-beb9-b6f3d6836fc4 (M8, in_progress)"
  - "todo queue head: 3e507bc0 (M9 — Monetization)"
  - "active child tasks: open=8 done=34 seed_candidates=8"
  - "unassigned queue depth: 13"
  - "closure: none (M8 substantive scope shipped; open=8 are polish/security hardening tail — no net-new headline scope)"
  - "promotion: none (M8 active)"
  - "decomposition fired: false (seed_candidates=8)"
  - "rituals fired: []"
prev_wave: 53
active_milestone_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
active_milestone_child_summary:
  open: 8
  done: 34
  seed_candidates: 8
next_todo_id: 3e507bc0-bce5-4f3b-b22a-d3c887fc0548
unassigned_queue_depth: 13
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: 84e17739-af5e-4396-beb9-b6f3d6836fc4
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "Security-first drain of M8 hardening tail continues. N-2 seed = c52a7a52 (app-wide UUID-guard sweep, single-seed) — direct wave-53 info-disclosure follow-up, reuses the guard just shipped + proven live."
```

## head_signoff

```yaml
head_signoff:
  verdict: APPROVED
  stage: N-1
  reviewers: {}
  failed_checks: []
  rationale: >
    Next-claimable computed from the live tasks table (not a sidecar). Exactly one trigger
    outcome selected — next-task (no decompose/re-plan/checkpoint/pause) — with firing
    conditions cited: seed_candidates=8≠0 blocks decomposition, todo queue non-empty blocks
    stockout, seed candidates present block checkpoint, M8 substantive scope shipped but
    open=8≠0 blocks closure. No measured pause trigger fires under automatic mode. All N-1
    exit checkboxes tick from concrete DB state.
  next_action: PROCEED_TO_N-2
```
