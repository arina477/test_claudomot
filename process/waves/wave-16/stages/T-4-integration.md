# T-4 — Integration (wave-16) — SKIP

**Skip reason:** no schema/service surface. No migration, no service method, no DB-layer change — the wave is
test-infra only. Per dispatcher skip rule (T-4 skips on no schema/service changes), T-4 does not fire.

> Note: the E2E itself DOES exercise the real create-server path against live prod Postgres (genuine `POST /servers`
> round-trip), but that is T-5's active-execution coverage, not a new T-4 integration-test surface this wave authored.

```yaml
test_pattern: n/a
skipped: true
skip_reason: "no schema/service/DB-layer surface touched (test-infra wave)"
findings: []
head_signoff: { verdict: APPROVED, stage: T-4, rationale: "Honest skip — zero schema/service surface authored. The E2E's live POST /servers round-trip is T-5 coverage, not a new integration-test layer." }
```
