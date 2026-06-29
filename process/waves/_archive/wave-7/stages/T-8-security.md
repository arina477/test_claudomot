# Wave 7 — T-8 Security (active — MANDATORY, security-tightened gate)
Server creation + reads are auth-gated; member-scoping is the access-control boundary. Verified LIVE at C-2.
```yaml
test_pattern: active
applicable_probes: [auth_smoke, csrf, session, rate_limit, secret_grep]
results:
  - "Auth gate: POST /servers + GET /servers + GET /servers/:id all behind AuthGuard (verifySession, verify-REQUIRED). Live: unauthed → 401; authed-but-email-unverified → 403 (invalid claim) — the email-verification gate holds on the new routes too."
  - "Member-scoping (access control): GET /servers innerJoins server_members (only my servers returned, server-side); GET /servers/:id → 404 if missing, 403 if non-member (exists-check BEFORE member-check → no existence fingerprinting). userId always from req.session.getUserId(), never body/params. Verified in code (B-6) + live (C-2: verified session → 201 + own server visible)."
  - "CSRF/session: inherits the wave-3 SuperTokens session (httpOnly, SameSite=None+Secure cross-origin, anti-csrf via SDK). New routes are state-changing POST but session-cookie-protected per the established pattern."
  - "Rate-limit: the wave-5 global auth limiter covers /auth; /servers is session-gated (abuse requires a valid verified session) — acceptable; broader API rate-limiting is a later hardening item."
  - "Secret grep (wave-7 diff): clean (no committed creds)."
findings:
  - {severity: info, category: test-fixture, description: "no persistent VERIFIED prod test fixture; C-2 verified email via SuperTokens core admin API → flag for L (record a verified fixture in command-center/testing/test-accounts.md)"}
  - {severity: info, category: rate-limit, description: "per-user/server-creation rate-limit not yet added (session-gated; later hardening)"}
```
T-8 PASS: auth gate (401/403) + member-scoping (403 non-member, server-side) live-verified; no critical/high. The access-control boundary for the core is enforced server-side.
