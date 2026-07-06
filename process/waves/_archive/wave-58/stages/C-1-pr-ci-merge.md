# C-1 — PR, CI & merge (wave-58) — FAIL (hardened test caught a real gap)
PR #73. CI run 28766329732 — e2e job **FAILED** at delete-any-message.spec.ts:170.
- The hardened assertion RAN (not skipped — C-carry satisfied) and correctly GATED: `expect(pageB.getByText(bMessageMarker)).toBeHidden({12s})` FAILED — B's message stayed VISIBLE (28 retries, never hidden) → B did NOT receive/process message:deleted.
- **The probe PASSED** (B received A's message:new → B IS subscribed to channel:<id>). So B is in the room, got message:new, but did NOT get/process message:deleted for its own message. Same-room discrepancy.
- This EXPOSES a real, PRE-EXISTING fan-out gap (wave-45 soft-check logged NOT_DELIVERED + masked it). The hardened test is doing its job.
**Iron Law:** NOT fixed directly. Classify → route to root-cause investigation. Merge BLOCKED until root cause + fix committed.
```yaml
ci_stage_verdict: FAIL
verdict_source: gh
failure: "delete-any-message e2e line 170 — B does not receive message:deleted (probe/message:new works → B subscribed; delete fan-out to B does not tombstone). Pre-existing (wave-45-masked) gap now gated."
route: root-cause investigation (realtime fan-out — moderator-delete path)
