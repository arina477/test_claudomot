# Wave 3 — V-1 Summary
- **Karen: APPROVE** — all source claims true live (auth pages exist + serve; signup→users row; /me 200 unverified; /profile GET/PATCH; PATCH empty→400 [T-8 fix]; the 4 PRs #5-#8 real merges; verify-banner wired). Flag PROCESS-1: eed4c3c direct-pushed to main (bypassed PR).
- **jenny: REJECT→APPROVE (re-verify post PR#9).** Initial REJECT on C1 (web built without VITE_API_ORIGIN → frontend couldn't reach api in-browser) + found the api 502 crash + (implied) cross-origin cookie issue. Fix-forward PR#9 resolved all three: bundle now embeds api origin (×2); cookies SameSite=None+Secure cross-origin (CORS allow-credentials + exact origin + front-token exposed); api /health stable through CSRF-reject (no crash). 7→9 ACs now confirmed live (AC6 profile round-trip + AC8 /me-unverified now LIVE-verified). Deferrals unchanged.
```yaml
karen_verdict: APPROVE
jenny_verdict: APPROVE (after PR#9 re-verify; initial REJECT on C1 resolved in-wave)
critical_resolved_in_wave: [C1-VITE_API_ORIGIN, cross-origin-SameSite, exception-filter-crash]  # PR#9 04244de
findings: [process-1-direct-push-eed4c3c (flag→L), rate-limit-839af17f (tracked), browser-e2e-c51589cd (tracked), resend-domain-a1299e88 (tracked)]
```
