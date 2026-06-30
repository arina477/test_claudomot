# Wave 21 — B-6 Review
```yaml
phase1_head_builder_verdict: APPROVED
phase2_review_invocations: 1
findings_critical: []   # honest-signal can't-show-online-while-disconnected (structural); no data-loss/dup/infinite-loop
findings_high: []
findings_medium_carried_to_v2: 
  - "M1: catch-up while-loop no re-entrancy guard (socket-connect + window-online both call runDrainAndCatchup → 2 overlapping loops; dedup keeps state correct, cost = doubled reconnect round-trips). Same class as wave-20 H1 (drain guard) but MEDIUM (correctness preserved). Fix: in-flight ref guard (copy _drainInFlight pattern)."
  - "M2: per-page putCachedMessages write-through is fire-and-forget (void) → cache-consistency eventually-true not synchronous"
  - "M3: window-online catch-up can run while socket reconnecting (upstream of M1; dedup-safe)"
findings_low_accepted: [L1 SSR default-online, L2 test-5 over-claims mid-loop-disconnect (resume-after-failure unproven by tests only reasoned — add a test), L3 dead reconnect listeners no-leak, L4 MAX_ITERS console.warn-only, L5 cleanup-confirmed]
final_verdict: APPROVE
```
- Phase 1 head-builder APPROVED (source-priority correct, multi-page no-data-loss proven, no rebuild). Phase-2 /review: 0 Critical/High — both load-bearing invariants (honest signal STRUCTURALLY can't show online-while-disconnected; catch-up no-loss/dup/infinite via cursor-outside-setState + dedup + MAX_ITERS + keyset-resume) verified against source + server contract. 3 Medium + 5 Low → V-2 (non-blocking; M1 catch-up re-entrancy + L2 resume-test are the worth-acting ones).
- web 193 + api 347 (unchanged) green; frontend-only.
