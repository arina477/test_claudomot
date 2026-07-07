# Wave 73 — T-4 Integration (Pattern A)
- CI `test` job ran `privacy-events.spec.ts` against postgres:16 on 29a140d — the LOAD-BEARING per-seam proof: a real privacy_events row asserted after EACH of the 5 real actions (delete/export/settings/block/unblock), plus the false-event gates (re-block → 1 row; remove-non-existent → 0; no-op settings → 0), no-IDOR (A's read excludes B), best-effort (append throws → action resolves), no-PII (context has only visibility/whoCanDm). boot-probe green confirms no module-cycle boot failure. Migration 0028 applied to prod.
```yaml
test_pattern: ci-verified
skipped: false
boundaries_audited: [privacy_events-migration, append-privacy-event.service, 5-hook-seams, GET-/profile/privacy-events, boot-probe-module-graph]
ci_evidence: ["test job green on 29a140d with postgres; privacy-events.spec per-seam+gates+no-IDOR+best-effort+no-PII passed; boot-probe green"]
findings: []
