# Wave 3 — V-2 Triage
3 CRITICAL deploy/runtime defects found by jenny/T-8 + RESOLVED in-wave via fix-forward (PR#9 04244de): C1 VITE_API_ORIGIN, cross-origin SameSite=None, exception-filter ERR_HTTP_HEADERS_SENT crash. (Earlier: PR#6 shared-pkg, PR#7/#8 PATCH-validation.) All verified live. No OPEN blocking findings → V-3 fast-fix queue empty.

| Finding | Source | Bucket | Disposition |
|---|---|---|---|
| C1 web no VITE_API_ORIGIN | jenny | blocking | RESOLVED PR#9 (live: bundle has origin) |
| cross-origin SameSite=Lax cookie drop | fix-discovery | blocking | RESOLVED PR#9 (SameSite=None+Secure) |
| exception-filter crash-loop | T-8/jenny-502 | blocking | RESOLVED PR#9 (headersSent guard; SDK owns Session errors) |
| direct-push eed4c3c bypassed PR | Karen PROCESS-1 | non-blocking | flag → L-2/retro; recommend branch protection on main |
| auth rate-limiting absent | T-8 | non-blocking | tracked 839af17f (launch-blocker) |
| full browser click-through E2E | T-5 | non-blocking | tracked c51589cd (CI chromium job) |
| Resend domain (sandbox) | C-2 | non-blocking | tracked a1299e88 (founder DNS) |
```yaml
findings_blocking: []   # 3 critical resolved in-wave via PR#9
findings_non_blocking: [direct-push-flag, 839af17f, c51589cd, a1299e88]
fast_fix_queue: []
```
