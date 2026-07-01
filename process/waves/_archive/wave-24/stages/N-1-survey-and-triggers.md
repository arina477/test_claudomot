# Wave 24 — N-1 Survey & triggers
head-next (agentId ada877a0645781aab) owns the N-block.

## Survey: M5 (a5232e16) in_progress. open=10, done=6, seed_candidates=5. Unassigned queue depth=4. todo queue head M6.
## Triggers:
- Closure: NONE (M5 open=10≠0 + reminders unshipped/cred-blocked → stays in_progress).
- Decomposition: SKIP (seed_candidates=5≠0 → N-2 picks existing).
- Promotion/stockout: none. Daily-checkpoint: does not fire.
- **Recommended seed: c18b8089** (mention token parser parity, client MessageList↔server + edit-diff). Highest USER-VISIBLE correctness debt; a client/server mention-parse divergence is a real student-facing bug; NOW lands on the wave-24 real-PG integration tier (the payoff of shipping the tier). Solo. Beats: 6a546c7b (perf, 0-user), d058283d (invite security — runner-up), 10b9d18e (chrome-absent-blocked), d23a0740 (trivial). Decisive: 3 consecutive under-floor/debt waves → spend readiness on user-visible work.

## Founder-digest carries (sharpened per head-next):
1. **Resend API key = the SOLE blocker to closing M5.** Every other M5 lane is self-serve debt; reminders (the feature students feel) is the one thing needing a founder action (create Resend account + key). Reframed outcome-first.
2. chrome-absent 67881a58 → keeps presence-UI debt (10b9d18e) unverifiable.
3. principles-write structural guard unimplemented (4th consecutive hold).

```yaml
n_stage_verdict: COMPLETE
active_milestone_id: a5232e16-62d5-4a7b-8fdb-3f7ceda9d09d
active_milestone_child_summary: {open: 10, done: 6, seed_candidates: 5}
next_todo_id: 8702a335-90ec-40ff-8c7d-a91bb7790a27
unassigned_queue_depth: 4
state_transitions_applied: []
decomposition_fired: false
proposals_fired: []
loop_state: ready
note: "seed c18b8089 (mention parity — user-visible, lands on new test tier). Resend key sharpened as SOLE M5-close blocker."
```
