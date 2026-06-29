# Wave 3 — T-8 Security (active — full auth probe set, NEW surface)
```yaml
test_pattern: active
applicable_probes: [auth_smoke, csrf, session, rate_limit, secret_grep]
auth_smoke: {positive: "signup→200 OK + cookies + users row", negative: "wrong creds→WRONG_CREDENTIALS (wave-2 verified)"}
csrf_results: "POSITIVE — state-changing PATCH /profile WITHOUT anti-csrf header rejected (SuperTokens CSRF active for cookie sessions); with rid/anti-csrf header → processes. SameSite=Lax cookies."
session_results: "GET /me + /profile with session → 200; without → 401. httpOnly+SameSite=Lax+Secure(prod) (wave-2 verified). Verify-exemption (SessionNoVerifyGuard) ONLY on /me+/profile (code-confirmed); shared AuthGuard + global EmailVerification REQUIRED unchanged."
rate_limit_results: "absent (6 rapid signins, no 429) — tracked 839af17f (launch-blocker)"
secret_grep_findings: []
fix_up_cycles: 1   # RESOLVED: PR#7/#8+eed4c3c — static import + exception-filter fix; live PATCH empty/long→400, valid→200, /health 200
findings:
  - {severity: high, category: input-handling, description: "PATCH /profile with invalid displayName (empty / >50 chars) → 502 'Application failed to respond' (process error), NOT 400. Root cause: profile.controller.ts:39 does dynamic `await import('@nestjs/common')` then throws BadRequestException — the dynamically-imported exception isn't instanceof Nest's HttpException so the exception layer doesn't map it → request crashes. Valid input → 200. A state-changing auth-surface endpoint crashing on bad input = availability/robustness defect. Fix: static import + clean 400. → B re-entry (backend-developer)."
  - {severity: low, category: error-mapping, description: "CSRF-rejected PATCH (no anti-csrf header) surfaces as 502 rather than a clean 403; SupertokensExceptionFilter should map the Forbidden. Frontend sends the header so real users unaffected. → tidy with the fix or V-2."}
```
T-8 verdict: 1 HIGH (PATCH-invalid-input 502 crash) → B re-entry this wave (cap 3); 1 LOW (csrf-reject 502 mapping); rate-limit tracked (839af17f); secrets clean; csrf/session/exemption PASS.
