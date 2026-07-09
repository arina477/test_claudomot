# Wave 81 — T-8 Security — SKIPPED (minimal regression confirm)

**Skip reason:** The wave touches NO auth / payments / sessions / cookies / CSRF / rate-limit / user-creation surface — it is a client-side layout wrapper (`h-dvh overflow-y-auto`). No security-relevant code path changed.

**Minimal regression confirm (done):** the app-shell routes that carry the authenticated session UI (/app, /discover) are NOT wrapped in FullPageScroll — live /app root is `flex h-full flex-col overflow-hidden` (unchanged shell), 0 FullPageScroll wrappers → no interference with the authenticated shell. Fixture A's authenticated session loaded /settings/profile and /settings/privacy normally (profile data rendered), so the wrapper does not break the AuthGuard-protected settings routes. No auth regression.

```yaml
test_pattern: active
skipped: true
skip_reason: "no auth/payments/session/csrf/rate-limit/user-creation surface; layout wrapper only"
regression_confirm: "shell /app unwrapped + authed settings routes render for Fixture A — no auth regression"
findings: []
```
