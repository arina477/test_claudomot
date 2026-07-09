# Wave 86 — T-8 Security (LIVE, deployed api 0f38d1fe)
```yaml
test_pattern: active
skipped: false
login_unregressed: PASS      # POST /auth/signin 200; tokens as RESPONSE HEADERS (st-access/refresh-token via ACEH), NO set-cookie — header transport intact under antiCsrf:'NONE'
legit_bearer: PASS           # GET /me, GET /servers 200; POST /servers (Bearer) 201 — auth path unregressed
forged_cookie_only_post: PASS # POST /servers with ONLY Cookie:sAccessToken=<valid>, Origin:evil, NO Authorization/anti-CSRF header -> 401 unauthorised. Airtight on the SAME route: Bearer->201, cookie-only->401, no-auth->401. Cookie-only cross-site request CANNOT authenticate.
foreign_origin_cors: PASS    # OPTIONS from evil.example.com -> ACAO scoped to web origin only (attacker origin not reflected)
anticsrf_posture_live: CORRECT # explicit antiCsrf:'NONE' + header transport = no CSRF vector on the deployed surface; resolves wave-49 F-2
findings: []
```
The load-bearing security assertion (cookie-only forged cross-site POST rejected) holds LIVE on the deployed api. antiCsrf:'NONE' is correct + non-weakening in production; auth fully unregressed. wave-49 F-2 resolved on the deployed surface.

## Operational findings (out of scope for this CSRF wave — filed to backlog)
- PATCH /servers/:id returns 500 on a malformed body (validation-gap 500, should be 400) + no working server-delete endpoint (DELETE/PUT/POST-delete all 404). Surfaced by the pen-test control-server probe. Filed as a backlog task.
- Benign leftover test row: server id 200ddd1c-6148-4b8a-a98e-8fcb4f215861 ("csrf-live-verify-cleanup-me", owner = e2e fixture account 21984eb2, NOT a real user). Needs out-of-band DB cleanup (no delete route). Non-blocking.
