# T-7 — Perf (wave-14) — SKIPPED

**Block:** T · **Stage:** T-7 · **Layer:** Core Web Vitals / bundle size · **Mode:** automatic

## Skip decision
Per block dispatcher skip rule (T-7 fires only on `heavy` waves or when perf budget at risk). Wave-14 is NOT heavy:
- Presence is IN-MEMORY server state (Map ref-count + typing TTL); no new schema, no migration, no new query-heavy endpoint.
- Diff is small (presence module + member-list panel + shared Zod), reuses existing /messaging WS-upgrade auth + server-members data source.
- No bundle-size budget breach signal from C-1 (build PASS 26s, no size warning).

B-6 carried KI-1 (M-1): perf scan deferred — single-pod in-memory presence with no Redis fan-out is a documented scale-deferral, not a wave-14 regression. Re-confirmed: no new heavy surface introduced this wave.

```yaml
test_pattern: skipped
skipped: true
skip_reason: "Not a heavy wave — in-memory presence, no schema, small diff, no bundle budget breach. Per dispatcher T-7 skip rule. KI-1 scale-deferral (single-pod, no Redis) carried as known item, not a wave-14 regression."
findings: []
head_signoff:
  verdict: APPROVED
  stage: T-7
  rationale: "Correct skip: non-heavy wave, no perf-budget risk. Scale concern (single-pod presence) is a documented H2 deferral carried as KI-1, not introduced or worsened this wave."
  next_action: PROCEED_TO_T-8
```
