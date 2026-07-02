# Wave 35 — V-1 Summary

Both reviewers ran independently against the LIVE deploy (merge 0c71585). Both APPROVE.

## Karen (source-claim) → APPROVE
Every load-bearing claim TRUE in prod: routes registered+live (401 not 404), served bundle = 0c71585 (markers present, no stale re-serve), all files/exports present, PrivacyModule registered (app.module.ts:47), enforcement filter live (servers.service.ts:253, no email leak), both binding anti-theater ACs satisfied. No fakery.
- LOW: Sentry shipped at instrument.ts (Sentry-convention) not plan's observability/sentry.ts — code fine, plan path-string stale.
- LOW F4: couldn't independently re-probe prod-DB columns (no CLI here) — rests on C-2 record + convergent live-endpoint evidence + T-8 authed smoke.
- LOW F5: SENTRY_DSN/VITE_SENTRY_DSN not documented set in C-2 — no AC risk (no-op when unset).

## jenny (semantic-spec) → APPROVE
All 4 spec blocks' INTENT confirmed live. Two-fixture test: B=nobody vanished from A's roster (2→1) while B saw self — enforcement real, not cosmetic. Honest Visible/Hidden selector; who-can-DM genuinely inactive; export self-scoped (?userId ignored); Sentry PII scrub; stubs render + no dead-end; edge cases (no-row→defaults, invalid-enum→400, unauth→401) all pass. No spec DRIFT.
- F1 SPEC GAP (Low): §113 states AC enumerates a "notifications" surface that doesn't exist (reminders shipped backend-only wave-30). Spec over-enumeration → re-scope onto the future notifications wave.
- F2 Cosmetic (Low): stub pages "Last updated: 2024" (should be 2026).

```yaml
karen_verdict: APPROVE
karen_findings_count: 3
karen_false_positives_documented: 0
jenny_verdict: APPROVE
jenny_findings_count: 2
spec_drift_count: 0
spec_gap_count: 1
jenny_false_positives_documented: 0
findings:
  - {severity: MEDIUM, source: T-block, tag: bug-test, desc: "no dedicated privacy-endpoint tests (authz filter + export scoping verified live only)"}
  - {severity: LOW, source: jenny, tag: bug-spec, desc: "notifications states AC references non-existent surface — re-scope to future notifications wave"}
  - {severity: LOW, source: jenny+T, tag: bug-design, desc: "/privacy /terms 'Last updated: 2024' should be 2026"}
  - {severity: LOW, source: T-tooling, tag: noise-infra, desc: "Playwright MCP chrome-channel absent; chromium fallback used"}
  - {severity: LOW, source: karen, tag: noise, desc: "Sentry path P-3 stale (observability/sentry.ts vs shipped instrument.ts) — code correct"}
```
