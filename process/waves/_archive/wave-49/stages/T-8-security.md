# T-8 — Security (wave-49 study timer)

**Pattern:** B (active-execution). **auto_promoted: true** — wave_type isn't classic `auth`, but the wave touches the auth boundary (membership-gated authorization via `assertMember`, WS session validation via `ws-auth.ts`, 5 new state-changing endpoints). Applicable subset run per the auto-promotion matrix: authorization/IDOR (CSRF/origin category), rate-limit, secret-grep. Auth-smoke + session-lifecycle probes N/A (wave modified no auth flow / session code).

## Probe results (penetration-tester ac796227ccbeaae03, live prod)

**Is the study timer IDOR-safe (non-members denied) in production? YES. Zero Critical, zero High.**

| Probe | Result |
|---|---|
| Own-server GET (member, positive control) | 200 |
| Foreign/nonexistent UUID GET (authenticated non-member) | **403 "not a member"** |
| Foreign server start/pause/resume/reset (authenticated non-member) | **403 all four** |
| **Crux: B reads A's REAL running-timer server** | **403, no payload leaked** |
| B mutates A's real server (reset) | **403** |
| WS handshake, no session | `connect_error: Unauthorized` |
| WS `join_timer_room` non-member | `study-timer:join_error`, no update/presence leak |
| WS join as member (positive control) | receives `study-timer:update` |
| Anon POST (unauth) | **401** (all 5 endpoints, orchestrator-confirmed) |
| Forged cookie-only POST (no anti-csrf) | **401** — non-idempotent CSRF gate enforcing |

- **Action 5 secret grep — CLEAN** (0 matches across all new study-timer code — orchestrator + pen-tester independently).
- **Rate limit:** app returns 429 under aggressive loops (active protection); probes respected backoff.
- **Cookie attrs:** `sAccessToken`/`sRefreshToken` = HttpOnly; Secure; SameSite=None (None required by cross-subdomain web/api topology — accepted, Low).

## Findings (→ V-2)
- **F-2 (medium, non-blocking, PRE-EXISTING project-wide — NOT wave-introduced):** anti-CSRF token disabled (`antiCsrfToken:null`; `supertokens.config.ts:93` sets `cookieSameSite:'none'` without explicit `antiCsrf`). Live behavior still blocks cookie-only forged state-changing POSTs (401 via SuperTokens' implicit non-idempotent default), so no exploitable CSRF on the timer controls. Hardening/legibility item: make explicit (`antiCsrf: 'VIA_TOKEN'`) + a cookie-only-POST-rejected regression test so the posture can't silently regress. Route to security-engineer if V-2/a future auth wave wants it. No IDOR remediation needed.

## Note (not a finding)
- Pen-test created one net-new server row (`0299349d`, Fixture A, timer idle) — servers have no DELETE endpoint (known project limitation). Both probed timers reset to idle at close.

```yaml
test_pattern: active
skipped: false
auto_promoted: true
applicable_probes: [csrf_origin_authorization, rate_limit, secret_grep]
auth_smoke: null
csrf_results:
  - "authenticated non-member IDOR: 403 on all GET+4 controls (incl. real foreign running-timer server) — no leak, no mutation"
  - "WS non-member join: study-timer:join_error, no state leak; WS handshake rejects sessionless"
  - "forged cookie-only POST: 401 (non-idempotent CSRF gate enforcing)"
session_results: null
rate_limit_results: ["429 active under aggressive loop"]
secret_grep_findings: []
fix_up_cycles: 0
findings:
  - {severity: medium, category: csrf-hardening, description: "anti-csrf implicit not explicit (pre-existing project-wide, non-exploitable on timer); make explicit + regression test", remediation: "antiCsrf: VIA_TOKEN in supertokens.config + cookie-only-POST-rejected test — route security-engineer"}
```
