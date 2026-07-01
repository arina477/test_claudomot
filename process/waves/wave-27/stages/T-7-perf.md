# Wave 27 — T-7-perf

This IS the performance wave — the perf improvement is verified by the specs' own proofs, not a separate load test. Spec A: EXPLAIN asserts the getServerIdsForUser WHERE user_id query now uses server_members_user_id_idx (Index Scan, T-4/CI) instead of a Seq Scan per /presence connect. Spec B: subscription-count test asserts ONE list-level presence subscription for an N-message list (was N; T-2), and the CARRY-B test asserts per-author render-scoping preserved (a dot re-renders only on its author's change). No load-test at ~0 users. No perf regression.

```yaml
test_pattern: ci-verified-or-active
skipped: false
findings: []
```
