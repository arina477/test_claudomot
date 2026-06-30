# T-7 — Perf (wave-21)
**Light — confirmed, no regression.** The catch-up loop is bounded (MAX_ITERS=100; up to 100 pages x 50 server safeLimit = 5000 msg/reconnect, a safe bound; longer outage correctly defers the tail to the next reconnect resuming from lastSeenCursorRef). B-6 M1 noted catch-up while-loop re-entrancy: on an overlapping socket-connect + window-online reconnect, two loops run -> up to 2x round-trips (each page fetched ~twice). **Dedup-safe, correctness preserved** (functional dedup-by-id + idempotent cache bulkPut + convergence to same HEAD cursor). Frontend-only diff; no bundle-size budget config in this wave's scope (no new heavy dep — reuses shipped Dexie/socket/indicator). M1 carried to V-2.

```yaml
test_pattern: active
skipped: false
evidence:
  - "MAX_ITERS=100 bound (5000 msg/reconnect cap; resumes from lastSeenCursorRef)"
  - "M1 double-loop dedup-safe, correctness preserved (B-6)"
findings:
  - {severity: MEDIUM, surface: "useMessages.ts:204-226", description: "M1 — catch-up re-entrancy: 2x round-trips on overlapping reconnect; dedup-safe; correctness preserved. -> V-2"}
head_signoff: {verdict: APPROVED, stage: T-7, failed_checks: [], rationale: "Loop bounded; no perf regression introduced. M1 (re-entrancy doubling round-trips, correctness preserved) carried to V-2 as a perf item.", next_action: PROCEED}
```
