# Wave 88 — T-5 E2E (SKIPPED)
No user-visible behavior change. In normal operation the web client sends its OWN registered key as senderKeyRef, so it never triggers the new mismatch-400 (verified: dm-encryption-flow client sends the registered key). The only trigger is a stale client after key rotation — a rare edge, surfaced by the client as a visible FAILED send (useDm.ts optimistic pending→failed, :610 catch), not a silent drop. No new happy-path E2E surface.
Note (findings-aggregate): pre-existing non-required `e2e` sign-in flake (delete-any-message.spec.ts, rule-11) failed on #109 — unrelated, non-blocking.
```yaml
skipped: true
reason: no user-visible behavior change (server-side validation; client sends its own key)
findings:
  - {severity: low, boundary: "e2e/delete-any-message.spec.ts", description: "pre-existing non-required e2e sign-in flake; unrelated to wave-88; non-blocking (already tracked: task 5cc59349)"}
```
