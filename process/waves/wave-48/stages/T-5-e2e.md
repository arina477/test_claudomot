# T-5 — E2E (wave-48) — SKIP

**Skip rule (dispatcher):** T-5 skips when wave has no user-visible behavior change.

## Rationale
TEST-ONLY wave. Zero production/UI change (B-6 + bypass grep confirm branch = 2 test/harness files). No new screen, route, or user-facing behavior. The DM startable/candidate-picker flow was E2E-verified at wave-47 (its shipping wave). This wave only adds backend regression coverage of a fence that is invisible to the E2E user.

Two-client realtime discipline N/A — no realtime path added. No Playwright swarm needed; no `browser_close` risk incurred.

```yaml
test_pattern: skip
skipped: true
skip_reason: "no user-visible behavior change; DM candidate flow E2E-verified wave-47; test-only wave adds backend regression coverage only"
findings: []
```

```yaml
head_signoff: {verdict: APPROVED, stage: T-5, failed_checks: [], rationale: "Legitimate skip — no user-visible behavior change; test-only wave.", next_action: PROCEED_TO_T-6}
```
