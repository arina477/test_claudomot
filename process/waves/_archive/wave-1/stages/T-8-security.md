# Wave 1 — T-8 Security — SKIPPED
Skip per dispatcher rule "T-8: Non-auth / non-payments / non-session wave." This sliced wave has NO auth surface (/health is anon; SuperTokens auth + sessions + user creation are the deferred task b9118041). The security-scope tightened gate (flagged at P-4) CARRIES FORWARD to the auth wave. gitleaks secret-scan ran green in CI (no secrets committed).
```yaml
skipped: true
skip_reason: "no auth/payments/sessions this wave; security gate carried to auth wave (b9118041)"
findings: []
```
