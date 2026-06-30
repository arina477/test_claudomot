# Wave 12 — V-3 (gate) — APPROVED
head-verifier APPROVED (independent re-probe: 401 boundary, /messaging unauth rejected; two-client 93ms genuine cross-client A→B + non-joined-gets-nothing). 4 security invariants enforced (channel-gate IDOR-safe default-deny, WS-upgrade-auth at connect, room-only no-leak, author no-spoof structurally impossible). V-2 correct (0 blocking; null-key unreachable, H2 evict, e2e-deferred non-blocking, none green-by-suppression). Fast-fix queue empty → Phase 2 skipped.
```yaml
phase1_head_verifier_verdict: APPROVED
fast_fix_rounds: 0
carry_to_L: [CI-PRINCIPLES-bypass-RECURRENCE(wave-9+12), null-key-.returning()-cleanup, H2-socket-evict-on-revoke]
