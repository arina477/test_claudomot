# Wave 22 — N-1 Survey & triggers

head-next (agentId ae7da2bc87e5c9e43) owns the N-block. Advisory verdicts applied below.

## Survey signals (Actions 1-4)
- **Active milestone:** M5 (a5232e16) Academic tooling: assignments — in_progress.
- **todo queue:** M6 Voice/video, M7 Privacy+launch-polish, M8 Educator-tools, M9 Monetization, M10 Compliance, M11 Growth-discovery, M12 Offline-moat, M13 Institution-partnerships (8 todo). Head = M6.
- **M5 child summary:** open=11, done=3, seed_candidates=7.
- **Unassigned queue depth:** 2.

## Trigger evaluation (Actions 6-10)
- **Action 6 closure:** NONE. M5 open=11 ≠ 0 + reminders (mvp-critical scope) unshipped → M5 stays in_progress.
- **Action 7 decomposition:** SKIP. seed_candidates=7 ≠ 0 → milestone-decomposer does NOT fire; N-2 picks from existing seeds. (Authoring reminders by hand would be an out-of-ritual INSERT anti-pattern; reminders also needs a founder Resend credential → deferred, see digest.)
- **Action 8 promotion/stockout:** none. active_milestone != null → no promotion, no stockout cascade.
- **Action 9 daily-checkpoint:** does NOT fire (seed candidates present; decomposition not fired-with-incomplete-scope).
- **Recommended seed (head-next):** `8aa67564` — dedicated manage_assignments permission split. Continues the assignments authz arc (cleaner than wave-22 manage_channels reuse, documented G2 follow-on), zero external credentials, ships fully autonomously — no founder pause.
- **Resend cred-ask:** flagged to founder digest (NOT seeded now) — reminders arc needs the account-issued Resend API key; forcing it now would pause the loop at wave-23 P-block. Surfaced out-of-band.

```yaml
n_stage_verdict: COMPLETE
verdict_evidence:
  - "active milestone: a5232e16 (M5, in_progress)"
  - "todo queue head: 8702a335 (M6)"
  - "active child tasks: open=11 done=3 seed_candidates=7"
  - "unassigned queue depth: 2"
  - "closure: none"
  - "promotion: none"
  - "decomposition fired: false"
  - "rituals fired: []"
prev_wave: 22
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary:
  open: 11
  done: 3
  seed_candidates: 7
next_todo_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
unassigned_queue_depth: 2
state_transitions_applied: []
slot_promotion:
  promoted_id: null
  prior_active_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
decomposition_fired: false
proposals_fired: []
ritual_outcomes: []
loop_state: ready
note: "head-next recommends seed 8aa67564 (manage_assignments split) for wave-23 — autonomous, no cred. Resend API-key cred-ask flagged to founder digest so the reminders arc can be authored once the key lands without pausing the loop."
```

## Exit
All signals captured. No closure, no decomposition, no promotion, no ritual. Seed 8aa67564 recommended → N-2. COMPLETE.
